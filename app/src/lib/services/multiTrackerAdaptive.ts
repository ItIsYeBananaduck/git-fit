import type { 
  FitnessTracker, 
  TrackerData, 
  TrackerCapabilities, 
  SafetySettings,
  TrackerType 
} from '$lib/types/fitnessTrackers';
import type { TrainingParameters, WorkoutSession } from './adaptiveTraining';

export interface MultiTrackerRecommendation {
  recommendation: string;
  intensity: 'rest' | 'light' | 'moderate' | 'high';
  restMultiplier: number;
  shouldStop: boolean;
  shouldWarn: boolean;
  injuryRisk: 'low' | 'moderate' | 'high';
  safetyAlerts: string[];
  reasoning: string[];
  shouldDeload: boolean;
  targetStrain?: number;
  strainAlert?: string;
  confidence: number; // 0-1 based on available data quality
  adaptationSource: string; // what data was used for decision
}

export class MultiTrackerAdaptiveEngine {
  private userId: string;
  private connectedTrackers: FitnessTracker[];
  private safetySettings: SafetySettings;

  constructor(userId: string, safetySettings: SafetySettings) {
    this.userId = userId;
    this.connectedTrackers = [];
    this.safetySettings = safetySettings;
  }

  updateSafetySettings(settings: SafetySettings) {
    this.safetySettings = settings;
  }

  addTracker(tracker: FitnessTracker) {
    this.connectedTrackers = this.connectedTrackers.filter(t => t.id !== tracker.id);
    this.connectedTrackers.push(tracker);
  }

  removeTracker(trackerId: string) {
    this.connectedTrackers = this.connectedTrackers.filter(t => t.id !== trackerId);
  }

  /**
   * Generate training recommendation using data from all connected trackers
   */
  getDailyTrainingRecommendation(
    trackerData: Record<string, TrackerData>,
    recentSessions: WorkoutSession[],
    isDeloadWeek: boolean = false
  ): MultiTrackerRecommendation {
    const reasoning: string[] = [];
    const safetyAlerts: string[] = [];
    let intensity: 'rest' | 'light' | 'moderate' | 'high' = 'moderate';
    let restMultiplier = 1.0;
    let shouldStop = false;
    let shouldWarn = false;
    let injuryRisk: 'low' | 'moderate' | 'high' = 'low';
    let shouldDeload = false;
    let targetStrain: number | undefined;
    let strainAlert: string | undefined;
    let confidence = 0;
    let adaptationSource = '';

    // Aggregate data from all trackers
    const aggregatedData = this.aggregateTrackerData(trackerData);
    const dataQuality = this.assessDataQuality(trackerData);
    confidence = dataQuality.overallScore;
    adaptationSource = dataQuality.primarySources.join(', ');

    // Recovery-based adjustments
    if (aggregatedData.recovery !== undefined) {
      const recovery = aggregatedData.recovery;
      
      if (recovery < this.safetySettings.recoveryMinimum) {
        intensity = 'rest';
        restMultiplier = 2.0;
        injuryRisk = recovery < 20 ? 'high' : 'moderate';
        safetyAlerts.push(`🛑 Recovery too low (${recovery}%) - consider rest day`);
        reasoning.push(`Recovery ${recovery}% below minimum threshold ${this.safetySettings.recoveryMinimum}%`);
        
        if (recovery < 20 && this.safetySettings.injuryRiskTolerance === 'conservative') {
          shouldStop = this.safetySettings.enableHardStop && (!this.safetySettings.hardStopOnlyDuringDeload || isDeloadWeek);
          shouldWarn = !shouldStop;
        }
      } else if (recovery < 45) {
        intensity = 'light';
        restMultiplier = 1.5;
        injuryRisk = 'moderate';
        reasoning.push(`Low recovery ${recovery}% - reduced intensity recommended`);
      } else if (recovery < 60) {
        intensity = 'moderate';
        restMultiplier = 1.2;
        reasoning.push(`Moderate recovery ${recovery}% - standard training`);
      } else {
        intensity = 'high';
        restMultiplier = 0.9;
        reasoning.push(`Good recovery ${recovery}% - can train with intensity`);
      }
    }

    // HRV-based adjustments (when available)
    if (aggregatedData.hrv !== undefined) {
      const hrvBaseline = this.calculateHRVBaseline(recentSessions);
      const hrvDeviation = (aggregatedData.hrv - hrvBaseline) / hrvBaseline;
      
      if (hrvDeviation < -0.3) {
        restMultiplier = Math.max(restMultiplier, 1.8);
        injuryRisk = hrvDeviation < -0.5 ? 'high' : 'moderate';
        safetyAlerts.push(`📉 HRV significantly below baseline - extended rest recommended`);
        reasoning.push(`HRV ${aggregatedData.hrv.toFixed(1)}ms vs baseline ${hrvBaseline.toFixed(1)}ms`);
      }
    }

    // Strain-based adjustments and targets
    if (aggregatedData.strain !== undefined) {
      // For trackers with strain (like WHOOP), use direct values
      targetStrain = this.calculateStrainTarget(aggregatedData, recentSessions);
      
      if (aggregatedData.strain > 16) {
        restMultiplier = Math.max(restMultiplier, 1.4);
        reasoning.push(`High recent strain ${aggregatedData.strain.toFixed(1)} - recovery focus`);
      }
      
      if (targetStrain && aggregatedData.strain > targetStrain * this.safetySettings.strainWarningThreshold) {
        strainAlert = `⚡ Approaching strain limit (${aggregatedData.strain.toFixed(1)}/${targetStrain})`;
        shouldWarn = true;
      }
    } else {
      // For trackers without strain, estimate from heart rate and activity
      targetStrain = this.estimateStrainTarget(aggregatedData, recentSessions);
    }

    // Sleep-based adjustments
    if (aggregatedData.sleep) {
      if (aggregatedData.sleep.quality < 60 || aggregatedData.sleep.duration < 6) {
        restMultiplier = Math.max(restMultiplier, 1.3);
        reasoning.push(`Poor sleep quality ${aggregatedData.sleep.quality}% or duration ${aggregatedData.sleep.duration}h`);
      }
    }

    // Deload assessment
    if (this.safetySettings.autoDeloadTrigger) {
      const shouldDeloadAssessment = this.assessDeloadNeed(recentSessions, aggregatedData);
      if (shouldDeloadAssessment.needed) {
        shouldDeload = true;
        safetyAlerts.push('🔄 Deload week recommended based on training patterns');
        reasoning.push(shouldDeloadAssessment.reason);
      }
    }

    const recommendation = this.generateRecommendationText(intensity, aggregatedData, dataQuality);

    return {
      recommendation,
      intensity,
      restMultiplier: Math.max(0.8, Math.min(2.5, restMultiplier)),
      shouldStop,
      shouldWarn,
      injuryRisk,
      safetyAlerts,
      reasoning,
      shouldDeload,
      targetStrain,
      strainAlert,
      confidence,
      adaptationSource
    };
  }

  /**
   * Aggregate data from multiple trackers, prioritizing more capable devices
   */
  private aggregateTrackerData(trackerData: Record<string, TrackerData>): TrackerData {
    const aggregated: Partial<TrackerData> = {
      timestamp: new Date()
    };

    // Priority order for different metrics
    const recoveryPriority: TrackerType[] = ['whoop', 'garmin', 'polar', 'oura'];
    const strainPriority: TrackerType[] = ['whoop'];
    const hrvPriority: TrackerType[] = ['whoop', 'polar', 'garmin', 'oura', 'fitbit', 'apple_watch'];
    const heartRatePriority: TrackerType[] = ['whoop', 'polar', 'garmin', 'apple_watch', 'fitbit'];

    // Get best recovery score
    for (const trackerType of recoveryPriority) {
      const tracker = this.connectedTrackers.find(t => t.type === trackerType);
      if (tracker && trackerData[tracker.id]?.recovery !== undefined) {
        aggregated.recovery = trackerData[tracker.id].recovery;
        break;
      }
    }

    // Get best strain data
    for (const trackerType of strainPriority) {
      const tracker = this.connectedTrackers.find(t => t.type === trackerType);
      if (tracker && trackerData[tracker.id]?.strain !== undefined) {
        aggregated.strain = trackerData[tracker.id].strain;
        break;
      }
    }

    // Get best HRV data
    for (const trackerType of hrvPriority) {
      const tracker = this.connectedTrackers.find(t => t.type === trackerType);
      if (tracker && trackerData[tracker.id]?.hrv !== undefined) {
        aggregated.hrv = trackerData[tracker.id].hrv;
        break;
      }
    }

    // Get best heart rate data
    for (const trackerType of heartRatePriority) {
      const tracker = this.connectedTrackers.find(t => t.type === trackerType);
      if (tracker && trackerData[tracker.id]?.heartRate !== undefined) {
        aggregated.heartRate = trackerData[tracker.id].heartRate;
        break;
      }
    }

    // Average sleep data from all capable trackers
    const sleepData = Object.keys(trackerData)
      .map(id => trackerData[id].sleep)
      .filter(s => s !== undefined) as NonNullable<TrackerData['sleep']>[];
    
    if (sleepData.length > 0) {
      aggregated.sleep = {
        duration: sleepData.reduce((sum, s) => sum + s.duration, 0) / sleepData.length,
        quality: sleepData.reduce((sum, s) => sum + s.quality, 0) / sleepData.length,
        efficiency: sleepData.reduce((sum, s) => sum + s.efficiency, 0) / sleepData.length
      };
    }

    // Sum steps and calories from all trackers
    const steps = Object.values(trackerData)
      .map(d => d.steps)
      .filter(s => s !== undefined) as number[];
    if (steps.length > 0) {
      aggregated.steps = Math.max(...steps); // Use highest step count
    }

    const calories = Object.values(trackerData)
      .map(d => d.calories)
      .filter(c => c !== undefined) as number[];
    if (calories.length > 0) {
      aggregated.calories = calories.reduce((sum, c) => sum + c, 0) / calories.length;
    }

    return aggregated as TrackerData;
  }

  /**
   * Assess quality and completeness of available data
   */
  private assessDataQuality(trackerData: Record<string, TrackerData>): {
    overallScore: number;
    primarySources: string[];
    missingMetrics: string[];
  } {
    let score = 0;
    let maxScore = 0;
    const primarySources: string[] = [];
    const missingMetrics: string[] = [];

    // Score based on available high-value metrics
    const metrics = [
      { name: 'Recovery', weight: 0.3, available: false },
      { name: 'HRV', weight: 0.25, available: false },
      { name: 'Strain', weight: 0.2, available: false },
      { name: 'Heart Rate', weight: 0.15, available: false },
      { name: 'Sleep', weight: 0.1, available: false }
    ];

    for (const trackerId in trackerData) {
      const data = trackerData[trackerId];
      const tracker = this.connectedTrackers.find(t => t.id === trackerId);
      
      if (!tracker) continue;
      primarySources.push(tracker.name);

      if (data.recovery !== undefined) {
        metrics[0].available = true;
        score += metrics[0].weight;
      }
      if (data.hrv !== undefined) {
        metrics[1].available = true;
        score += metrics[1].weight;
      }
      if (data.strain !== undefined) {
        metrics[2].available = true;
        score += metrics[2].weight;
      }
      if (data.heartRate !== undefined) {
        metrics[3].available = true;
        score += metrics[3].weight;
      }
      if (data.sleep !== undefined) {
        metrics[4].available = true;
        score += metrics[4].weight;
      }
    }

    maxScore = metrics.reduce((sum, m) => sum + m.weight, 0);
    
    // Track missing high-value metrics
    metrics.filter(m => !m.available && m.weight > 0.15)
           .forEach(m => missingMetrics.push(m.name));

    return {
      overallScore: maxScore > 0 ? score / maxScore : 0,
      primarySources: [...new Set(primarySources)],
      missingMetrics
    };
  }

  private calculateStrainTarget(data: TrackerData, sessions: WorkoutSession[]): number {
    // WHOOP-style strain target calculation
    let baseTarget = 12;
    
    if (data.recovery !== undefined) {
      if (data.recovery > 70) baseTarget = 16;
      else if (data.recovery > 50) baseTarget = 14;
      else if (data.recovery > 30) baseTarget = 10;
      else baseTarget = 6;
    }

    if (data.strain !== undefined && data.strain > 16) {
      baseTarget *= 0.8; // Reduce target if recent high strain
    }

    return Math.round(baseTarget);
  }

  private estimateStrainTarget(data: TrackerData, sessions: WorkoutSession[]): number {
    // For non-WHOOP trackers, estimate strain target from other metrics
    let baseTarget = 12;

    if (data.heartRate && data.restingHeartRate) {
      const hrReserve = data.heartRate - data.restingHeartRate;
      if (hrReserve > 50) baseTarget = 16;
      else if (hrReserve > 30) baseTarget = 14;
      else baseTarget = 10;
    }

    if (data.recovery !== undefined) {
      baseTarget = baseTarget * (data.recovery / 70); // Adjust based on recovery
    }

    return Math.round(Math.max(6, baseTarget));
  }

  private calculateHRVBaseline(sessions: WorkoutSession[]): number {
    // Calculate 7-day HRV baseline
    const recentHRVs = sessions
      .slice(0, 7)
      .map(s => s.recoveryBefore)
      .filter(hrv => hrv !== undefined) as number[];
    
    return recentHRVs.length > 0 
      ? recentHRVs.reduce((sum, hrv) => sum + hrv, 0) / recentHRVs.length 
      : 50; // Default baseline
  }

  private assessDeloadNeed(sessions: WorkoutSession[], data: TrackerData): {
    needed: boolean;
    reason: string;
  } {
    if (sessions.length < 6) return { needed: false, reason: 'Insufficient training history' };

    const recentPerformance = sessions.slice(0, 6);
    const avgCompletionRate = recentPerformance.reduce((sum, s) => {
      const planned = s.plannedParams.reps * s.plannedParams.sets;
      const completed = s.completedReps?.reduce((a, b) => a + b, 0) || planned;
      return sum + (completed / planned);
    }, 0) / recentPerformance.length;

    const avgEffort = recentPerformance.reduce((sum, s) => sum + (s.perceivedEffort || 5), 0) / recentPerformance.length;
    const avgRecovery = recentPerformance.reduce((sum, s) => sum + (s.recoveryBefore || 50), 0) / recentPerformance.length;

    if (avgCompletionRate < 0.75 && avgEffort > 7) {
      return { needed: true, reason: `Low completion rate ${(avgCompletionRate * 100).toFixed(0)}% with high effort` };
    }

    if (avgRecovery < 40) {
      return { needed: true, reason: `Consistently low recovery trend ${avgRecovery.toFixed(0)}%` };
    }

    return { needed: false, reason: 'Performance metrics within normal range' };
  }

  private generateRecommendationText(
    intensity: string, 
    data: TrackerData, 
    quality: { overallScore: number; missingMetrics: string[] }
  ): string {
    const base = {
      'rest': 'Complete rest and recovery',
      'light': 'Light activity and mobility work',
      'moderate': 'Moderate intensity training',
      'high': 'High intensity training optimal'
    }[intensity] || 'Moderate training';

    let context = '';
    if (data.recovery !== undefined) {
      context = data.recovery < 50 ? 'Focus on recovery today' :
                data.recovery > 70 ? 'Your body is ready to be challenged' :
                'Maintain steady training progress';
    } else {
      context = quality.overallScore < 0.5 ? 'Limited data - train conservatively' :
                'Train based on available metrics';
    }

    let dataNote = '';
    if (quality.missingMetrics.length > 0) {
      dataNote = ` (Missing: ${quality.missingMetrics.join(', ')})`;
    }

    return `${base}. ${context}${dataNote}`;
  }

  /**
   * Create deload parameters adapted for any tracker type
   */
  createDeloadParameters(baseParams: TrainingParameters): TrainingParameters {
    return {
      load: Math.round(baseParams.load * 0.5),
      reps: Math.min(20, baseParams.reps * 2),
      sets: baseParams.sets,
      restBetweenSets: 90,
      restBetweenExercises: 120,
      intensity: 'light',
      isDeloadWeek: true
    };
  }

  /**
   * Check strain target with configurable stop vs warn behavior
   */
  checkStrainTarget(
    currentStrain: number, 
    targetStrain: number, 
    isDeloadWeek: boolean = false
  ): {
    shouldStop: boolean;
    shouldWarn: boolean;
    message: string;
    progress: number;
  } {
    const progress = Math.min(1, currentStrain / targetStrain);
    const threshold = this.safetySettings.strainWarningThreshold;
    
    if (currentStrain >= targetStrain) {
      const shouldStop = this.safetySettings.enableHardStop && 
                        (!this.safetySettings.hardStopOnlyDuringDeload || isDeloadWeek);
      
      return {
        shouldStop,
        shouldWarn: !shouldStop,
        message: shouldStop 
          ? `🛑 STOP: Target strain reached (${currentStrain.toFixed(1)}/${targetStrain})` 
          : `⚠️ WARNING: Target strain reached - consider stopping (${currentStrain.toFixed(1)}/${targetStrain})`,
        progress: 1
      };
    } else if (currentStrain >= targetStrain * threshold) {
      return {
        shouldStop: false,
        shouldWarn: true,
        message: `⚡ Warning: Approaching strain target (${currentStrain.toFixed(1)}/${targetStrain})`,
        progress
      };
    }
    
    return {
      shouldStop: false,
      shouldWarn: false,
      message: `Strain progress: ${currentStrain.toFixed(1)}/${targetStrain} (${Math.round(progress * 100)}%)`,
      progress
    };
  }
}