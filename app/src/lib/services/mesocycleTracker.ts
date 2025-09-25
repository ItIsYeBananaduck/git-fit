// Mesocycle Tracking Service
// Manages 4-week progressive overload cycles: set → reps → volume, no repeats

export interface MesocycleWeek {
  week: number;
  progressionType: 'add_set' | 'add_rep' | 'add_volume' | 'replace_exercise';
  exerciseCompletionRates: Record<string, number>; // exercise_name: completion_rate
  successRates: Record<string, number>; // exercise_name: success_rate
  implemented: boolean;
  date: string;
}

export interface MesocycleData {
  currentWeek: number;
  startDate: string;
  weeks: MesocycleWeek[];
  completedCycles: number;
  nextProgression: 'add_set' | 'add_rep' | 'add_volume';
}

export class MesocycleTrackerService {
  private readonly STORAGE_KEY = 'mesocycle_data';
  
  /**
   * Initialize or get current mesocycle data
   */
  getMesocycleData(userId: string): MesocycleData {
    const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
    
    if (stored) {
      const data = JSON.parse(stored);
      // Check if current mesocycle is complete
      if (data.currentWeek > 4) {
        return this.startNewMesocycle(data);
      }
      return data;
    }
    
    // Start first mesocycle
    return this.createNewMesocycle();
  }

  /**
   * Create a new 4-week mesocycle
   */
  private createNewMesocycle(): MesocycleData {
    return {
      currentWeek: 1,
      startDate: new Date().toISOString(),
      weeks: [],
      completedCycles: 0,
      nextProgression: 'add_set' // Always start with adding sets
    };
  }

  /**
   * Start new mesocycle after completing 4 weeks
   */
  private startNewMesocycle(previousData: MesocycleData): MesocycleData {
    // Determine next progression type (cycle through: set → rep → volume)
    let nextProgression: 'add_set' | 'add_rep' | 'add_volume';
    
    switch (previousData.nextProgression) {
      case 'add_set':
        nextProgression = 'add_rep';
        break;
      case 'add_rep':
        nextProgression = 'add_volume';
        break;
      case 'add_volume':
        nextProgression = 'add_set'; // Cycle back to sets
        break;
      default:
        nextProgression = 'add_set';
    }

    return {
      currentWeek: 1,
      startDate: new Date().toISOString(),
      weeks: [],
      completedCycles: previousData.completedCycles + 1,
      nextProgression
    };
  }

  /**
   * Complete current week and advance to next
   */
  completeWeek(
    userId: string, 
    exerciseCompletionRates: Record<string, number>,
    successRates: Record<string, number>,
    progressionImplemented: boolean = true
  ): MesocycleData {
    const mesocycle = this.getMesocycleData(userId);
    
    const weekData: MesocycleWeek = {
      week: mesocycle.currentWeek,
      progressionType: mesocycle.nextProgression,
      exerciseCompletionRates,
      successRates,
      implemented: progressionImplemented,
      date: new Date().toISOString()
    };

    mesocycle.weeks.push(weekData);
    mesocycle.currentWeek++;

    this.saveMesocycleData(userId, mesocycle);
    return mesocycle;
  }

  /**
   * Check if mesocycle is complete (4 weeks done)
   */
  isMesocycleComplete(mesocycleData: MesocycleData): boolean {
    return mesocycleData.weeks.length >= 4;
  }

  /**
   * Get exercises that need replacement (< 50% completion over 4 weeks)
   */
  getExercisesToReplace(mesocycleData: MesocycleData): string[] {
    if (!this.isMesocycleComplete(mesocycleData)) {
      return [];
    }

    const exerciseStats: Record<string, { totalCompletion: number, count: number }> = {};

    // Aggregate completion rates over 4 weeks
    mesocycleData.weeks.forEach(week => {
      Object.entries(week.exerciseCompletionRates).forEach(([exercise, completion]) => {
        if (!exerciseStats[exercise]) {
          exerciseStats[exercise] = { totalCompletion: 0, count: 0 };
        }
        exerciseStats[exercise].totalCompletion += completion;
        exerciseStats[exercise].count++;
      });
    });

    // Find exercises with average completion < 50%
    const exercisesToReplace: string[] = [];
    Object.entries(exerciseStats).forEach(([exercise, stats]) => {
      const avgCompletion = stats.totalCompletion / stats.count;
      if (avgCompletion < 0.5) {
        exercisesToReplace.push(exercise);
      }
    });

    return exercisesToReplace;
  }

  /**
   * Get next progression type for current mesocycle
   */
  getNextProgressionType(mesocycleData: MesocycleData): 'add_set' | 'add_rep' | 'add_volume' | 'replace_exercise' {
    // If mesocycle complete, check for exercise replacements first
    if (this.isMesocycleComplete(mesocycleData)) {
      const exercisesToReplace = this.getExercisesToReplace(mesocycleData);
      if (exercisesToReplace.length > 0) {
        return 'replace_exercise';
      }
    }

    return mesocycleData.nextProgression;
  }

  /**
   * Get progression history for prompt context
   */
  getProgressionHistory(mesocycleData: MesocycleData, exercise: string): string {
    if (mesocycleData.weeks.length === 0) {
      return 'none';
    }

    const history = mesocycleData.weeks.map(week => {
      const completion = week.exerciseCompletionRates[exercise] || 0;
      const success = week.successRates[exercise] || 0;
      return `Week ${week.week}: ${week.progressionType} (${Math.round(completion * 100)}% completion, ${Math.round(success * 100)}% success)`;
    });

    return history.join(', ');
  }

  /**
   * Save mesocycle data to storage
   */
  private saveMesocycleData(userId: string, data: MesocycleData): void {
    localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(data));
  }

  /**
   * Check if user has skipped a progression type (for validation)
   */
  hasSkippedProgression(mesocycleData: MesocycleData, targetType: 'add_set' | 'add_rep' | 'add_volume'): boolean {
    if (mesocycleData.weeks.length === 0) return false;

    // Check if the target type was supposed to be used but wasn't
    const expectedProgression = this.getExpectedProgressionForWeek(mesocycleData.completedCycles, mesocycleData.weeks.length);
    return expectedProgression === targetType && mesocycleData.weeks[mesocycleData.weeks.length - 1].progressionType !== targetType;
  }

  /**
   * Get expected progression type for a given week in a mesocycle
   */
  private getExpectedProgressionForWeek(completedCycles: number, weekInCycle: number): 'add_set' | 'add_rep' | 'add_volume' {
    // Cycle through progressions across mesocycles
    const cycleIndex = completedCycles % 3;
    const progressions: Array<'add_set' | 'add_rep' | 'add_volume'> = ['add_set', 'add_rep', 'add_volume'];
    return progressions[cycleIndex];
  }

  /**
   * Reset mesocycle data (for testing or admin purposes)
   */
  resetMesocycle(userId: string): void {
    localStorage.removeItem(`${this.STORAGE_KEY}_${userId}`);
  }
}