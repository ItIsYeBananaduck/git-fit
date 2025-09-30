import { api } from '$lib/convex/_generated/api';

export interface WorkoutHistoryEntry {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  date: Date;
  sets: number;
  reps: number;
  weight: number;
  duration: number; // in minutes
  heartRate: {
    avg: number;
    max: number;
    min: number;
  };
  spo2: {
    avg: number;
    min: number;
  };
  userFeedback: 'easy killer' | 'good pump' | 'struggle city' | null;
  aiAdjustments: {
    action: string;
    reason: string;
    modifications: Record<string, number>;
  }[];
  completedSets: number;
  restTimes: number[]; // Rest time between sets
  wearableSource: 'whoop' | 'apple_watch' | 'mock';
}

export interface AILearningData {
  userId: string;
  exercisePreferences: Record<string, number>; // exercise -> success rate
  optimalRestTimes: Record<string, number>; // exercise -> optimal rest seconds
  heartRateZones: {
    resting: number;
    aerobic: number;
    anaerobic: number;
    maxEffort: number;
  };
  progressionPatterns: {
    preferredWeightJumps: number[];
    setVolumePreference: 'sets' | 'reps' | 'weight';
    difficultyTolerance: number; // 0-1 scale
  };
  recentPerformance: {
    averageSuccessRate: number;
    trendDirection: 'improving' | 'stable' | 'declining';
    lastUpdated: Date;
  };
}

export class WorkoutHistoryService {
  private userId: string;
  private sessionHistory: WorkoutHistoryEntry[] = [];

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Record a completed workout
   */
  async recordWorkout(workoutData: Omit<WorkoutHistoryEntry, 'id' | 'userId' | 'date'>): Promise<void> {
    const entry: WorkoutHistoryEntry = {
      ...workoutData,
      id: this.generateWorkoutId(),
      userId: this.userId,
      date: new Date()
    };

    // Store in session history
    this.sessionHistory.push(entry);

    // Store in database (via Convex)
    try {
      console.log('Recording workout in database:', entry);
      // await api.mutations.workouts.recordWorkout(entry);
      
      // Store in localStorage as backup
      this.storeInLocalStorage(entry);
    } catch (error) {
      console.error('Failed to store workout in database:', error);
      // Fallback to localStorage only
      this.storeInLocalStorage(entry);
    }
  }

  /**
   * Get recent workout history for AI learning
   */
  async getRecentHistory(exerciseId?: string, limit: number = 10): Promise<WorkoutHistoryEntry[]> {
    try {
      // Try to get from database first
      // const dbHistory = await api.queries.workouts.getRecentWorkouts({ 
      //   userId: this.userId, 
      //   exerciseId, 
      //   limit 
      // });
      
      // For now, use localStorage and session history
      const allHistory = [...this.getFromLocalStorage(), ...this.sessionHistory];
      
      let filtered = allHistory.filter(w => w.userId === this.userId);
      if (exerciseId) {
        filtered = filtered.filter(w => w.exerciseId === exerciseId);
      }
      
      // Sort by date descending and limit
      return filtered
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get workout history:', error);
      return this.sessionHistory.slice(-limit);
    }
  }

  /**
   * Generate AI learning data from workout history
   */
  async generateAILearningData(): Promise<AILearningData> {
    const history = await this.getRecentHistory(undefined, 50); // Last 50 workouts
    
    if (history.length === 0) {
      return this.getDefaultLearningData();
    }

    // Calculate exercise preferences (success rates)
    const exercisePreferences: Record<string, number> = {};
    const exerciseCounts: Record<string, number> = {};
    
    history.forEach(workout => {
      const success = workout.userFeedback !== 'struggle city' ? 1 : 0;
      exercisePreferences[workout.exerciseId] = (exercisePreferences[workout.exerciseId] || 0) + success;
      exerciseCounts[workout.exerciseId] = (exerciseCounts[workout.exerciseId] || 0) + 1;
    });

    // Convert to success rates
    Object.keys(exercisePreferences).forEach(exercise => {
      exercisePreferences[exercise] = exercisePreferences[exercise] / exerciseCounts[exercise];
    });

    // Calculate optimal rest times
    const optimalRestTimes: Record<string, number> = {};
    const restTimeData: Record<string, number[]> = {};
    
    history.forEach(workout => {
      if (workout.restTimes.length > 0) {
        const avgRest = workout.restTimes.reduce((a, b) => a + b, 0) / workout.restTimes.length;
        if (!restTimeData[workout.exerciseId]) {
          restTimeData[workout.exerciseId] = [];
        }
        restTimeData[workout.exerciseId].push(avgRest);
      }
    });

    Object.keys(restTimeData).forEach(exercise => {
      const times = restTimeData[exercise];
      optimalRestTimes[exercise] = times.reduce((a, b) => a + b, 0) / times.length;
    });

    // Calculate heart rate zones
    const heartRates = history.map(w => w.heartRate.avg).filter(hr => hr > 0);
    const heartRateZones = this.calculateHeartRateZones(heartRates);

    // Analyze progression patterns
    const progressionPatterns = this.analyzeProgressionPatterns(history);

    // Calculate recent performance trend
    const recentPerformance = this.calculatePerformanceTrend(history.slice(0, 10));

    return {
      userId: this.userId,
      exercisePreferences,
      optimalRestTimes,
      heartRateZones,
      progressionPatterns,
      recentPerformance
    };
  }

  /**
   * Get AI recommendations based on history
   */
  async getHistoryBasedRecommendations(currentExercise: string): Promise<{
    suggestedRestTime: number;
    confidenceLevel: number;
    expectedDifficulty: 'easy' | 'moderate' | 'hard';
    recommendedModifications: string[];
  }> {
    const learningData = await this.generateAILearningData();
    const exerciseHistory = await this.getRecentHistory(currentExercise, 5);

    const suggestions = {
      suggestedRestTime: learningData.optimalRestTimes[currentExercise] || 60,
      confidenceLevel: exerciseHistory.length >= 3 ? 0.8 : 0.4,
      expectedDifficulty: this.predictDifficulty(currentExercise, learningData),
      recommendedModifications: this.generateModificationRecommendations(currentExercise, learningData)
    };

    return suggestions;
  }

  // Private helper methods

  private generateWorkoutId(): string {
    return `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private storeInLocalStorage(entry: WorkoutHistoryEntry): void {
    try {
      const stored = localStorage.getItem(`workout_history_${this.userId}`) || '[]';
      const history = JSON.parse(stored);
      history.push({
        ...entry,
        date: entry.date.toISOString() // Convert Date to string for storage
      });
      
      // Keep only last 100 workouts in localStorage
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
      
      localStorage.setItem(`workout_history_${this.userId}`, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to store workout in localStorage:', error);
    }
  }

  private getFromLocalStorage(): WorkoutHistoryEntry[] {
    try {
      const stored = localStorage.getItem(`workout_history_${this.userId}`) || '[]';
      const history = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      return history.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date)
      }));
    } catch (error) {
      console.error('Failed to load workout history from localStorage:', error);
      return [];
    }
  }

  private getDefaultLearningData(): AILearningData {
    return {
      userId: this.userId,
      exercisePreferences: {},
      optimalRestTimes: {},
      heartRateZones: {
        resting: 70,
        aerobic: 140,
        anaerobic: 160,
        maxEffort: 180
      },
      progressionPatterns: {
        preferredWeightJumps: [2.5, 5],
        setVolumePreference: 'weight',
        difficultyTolerance: 0.7
      },
      recentPerformance: {
        averageSuccessRate: 0.5,
        trendDirection: 'stable',
        lastUpdated: new Date()
      }
    };
  }

  private calculateHeartRateZones(heartRates: number[]) {
    if (heartRates.length === 0) {
      return {
        resting: 70,
        aerobic: 140,
        anaerobic: 160,
        maxEffort: 180
      };
    }

    const sorted = heartRates.sort((a, b) => a - b);
    return {
      resting: sorted[Math.floor(sorted.length * 0.1)],
      aerobic: sorted[Math.floor(sorted.length * 0.5)],
      anaerobic: sorted[Math.floor(sorted.length * 0.8)],
      maxEffort: sorted[Math.floor(sorted.length * 0.95)]
    };
  }

  private analyzeProgressionPatterns(history: WorkoutHistoryEntry[]) {
    // Analyze how user prefers to progress (more sets, reps, or weight)
    const modifications = history.flatMap(w => w.aiAdjustments);
    
    const weightIncreases = modifications.filter(m => m.action.includes('weight')).length;
    const setIncreases = modifications.filter(m => m.action.includes('set')).length;
    const repIncreases = modifications.filter(m => m.action.includes('rep')).length;

    let preferredProgression: 'sets' | 'reps' | 'weight' = 'weight';
    if (setIncreases > weightIncreases && setIncreases > repIncreases) {
      preferredProgression = 'sets';
    } else if (repIncreases > weightIncreases && repIncreases > setIncreases) {
      preferredProgression = 'reps';
    }

    return {
      preferredWeightJumps: [2.5, 5], // Default, could be calculated from history
      setVolumePreference: preferredProgression,
      difficultyTolerance: history.filter(w => w.userFeedback === 'struggle city').length / history.length
    };
  }

  private calculatePerformanceTrend(recentHistory: WorkoutHistoryEntry[]) {
    if (recentHistory.length < 3) {
      return {
        averageSuccessRate: 0.5,
        trendDirection: 'stable' as const,
        lastUpdated: new Date()
      };
    }

    const successRates = recentHistory.map(w => 
      w.userFeedback === 'struggle city' ? 0 : 
      w.userFeedback === 'good pump' ? 0.7 : 1
    );

    const avgSuccessRate = successRates.reduce((a, b) => a + b, 0) / successRates.length;
    
    // Simple trend calculation
    const firstHalf = successRates.slice(0, Math.floor(successRates.length / 2));
    const secondHalf = successRates.slice(Math.floor(successRates.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
    if (secondHalfAvg > firstHalfAvg + 0.1) {
      trendDirection = 'improving';
    } else if (secondHalfAvg < firstHalfAvg - 0.1) {
      trendDirection = 'declining';
    }

    return {
      averageSuccessRate: avgSuccessRate,
      trendDirection,
      lastUpdated: new Date()
    };
  }

  private predictDifficulty(exerciseId: string, learningData: AILearningData): 'easy' | 'moderate' | 'hard' {
    const successRate = learningData.exercisePreferences[exerciseId];
    
    if (successRate === undefined) return 'moderate';
    if (successRate > 0.8) return 'easy';
    if (successRate < 0.4) return 'hard';
    return 'moderate';
  }

  private generateModificationRecommendations(exerciseId: string, learningData: AILearningData): string[] {
    const recommendations = [];
    const successRate = learningData.exercisePreferences[exerciseId] || 0.5;
    
    if (successRate < 0.4) {
      recommendations.push('Consider reducing weight by 10-15%');
      recommendations.push('Increase rest time between sets');
    } else if (successRate > 0.8) {
      recommendations.push('Ready for progressive overload');
      recommendations.push('Consider adding weight or reps');
    }

    if (learningData.recentPerformance.trendDirection === 'declining') {
      recommendations.push('Take extra rest or reduce intensity');
    }

    return recommendations;
  }
}