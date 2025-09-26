import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { convex } from '$lib/convex';
import { api } from '$lib/convex/_generated/api.js';
import type { Id } from '$lib/convex/_generated/dataModel.js';
import { healthDataService } from '../services/healthDataService.js';
import { preprocessHealthDataForMonday } from '../services/healthDataPreprocessor.js';

// Types for Monday data storage and intensity scoring
export interface MondayWorkoutData {
  reps: number;
  sets: number;
  volume: number; // weight in lbs (2.5-10 range)
  workoutTime: number; // minutes
  estimatedCalories: number;
  heartRateData?: {
    avgHR: number;
    maxHR: number;
    variance: number;
  };
  spo2Data?: {
    avgSpO2: number;
    drift: number;
  };
  sleepScore?: number; // 0-20 range
  userFeedback?: 'keep_going' | 'neutral' | 'finally_challenge' | 'easy_killer' | 'flag_review';
  date: string;
  exerciseId: string;
  userId: string;
}

export interface IntensityScore {
  totalScore: number; // 0-100%
  breakdown: {
    baseScore: number;
    hrVarianceScore: number;
    spo2DriftScore: number;
    sleepScore: number;
    feedbackScore: number;
  };
  actions: {
    adjustVolume: boolean;
    adjustment: number; // percentage change (-10 to +10)
    flagForReview: boolean;
  };
}

export interface MondayProcessingTrigger {
  _id: Id<"mondayProcessingTriggers">;
  userId: Id<"users">;
  weekOfYear: string;
  triggered: boolean;
  processed: boolean;
  processedAt?: string;
  createdAt: string;
}

// Store for current week's workout data (localStorage fallback)
export const currentWeekData = writable<MondayWorkoutData[]>([]);

// Store for intensity scores and actions
export const intensityActions = writable<Map<string, IntensityScore>>(new Map());

// Store for tracking if today is Monday and if data should be processed
export const mondayDataProcessor = writable({
  isMonday: false,
  shouldProcess: false,
  lastProcessed: null as string | null,
  backendConnected: true,
});

// Store for pending triggers from server
export const pendingMondayTriggers = writable<MondayProcessingTrigger[]>([]);

class MondayWorkoutService {
  private readonly STORAGE_KEY = 'fitapp_monday_data';
  private readonly PROCESSED_KEY = 'fitapp_last_processed';
  private currentUserId: string | null = null;

  constructor() {
    if (browser) {
      this.initializeStore();
      this.checkMondayStatus();
      this.checkPendingTriggers();
    }
  }

  /**
   * Set current user ID for backend operations
   */
  setUserId(userId: string): void {
    this.currentUserId = userId;
    if (browser) {
      this.checkPendingTriggers();
    }
  }

  /**
   * Initialize the store with any existing data
   */
  private async initializeStore() {
    // Try to connect to backend first
    let backendConnected = false;
    try {
      // Test connection to Convex
      if (this.currentUserId) {
        await convex.query(api.functions.mondayWorkoutData.getMondayWorkoutData, {
          userId: this.currentUserId as Id<"users">,
          limit: 1,
        });
      }
      backendConnected = true;
    } catch (error) {
      console.warn('Backend not available, using localStorage fallback:', error);
      backendConnected = false;
    }

    // If backend is available and we have localStorage data, migrate it
    if (backendConnected && this.currentUserId) {
      await this.migrateLocalStorageData();
    }

    // Load data from localStorage as fallback
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored && !backendConnected) {
      try {
        const data = JSON.parse(stored);
        currentWeekData.set(data);
      } catch (e) {
        console.error('Failed to parse stored Monday data:', e);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }

    // Check if we need to process Monday data
    const lastProcessed = localStorage.getItem(this.PROCESSED_KEY);
    const now = new Date();
    const isMonday = now.getDay() === 1; // Monday is day 1
    const shouldProcess = isMonday && (!lastProcessed || this.isNewWeek(lastProcessed));

    mondayDataProcessor.set({
      isMonday,
      shouldProcess,
      lastProcessed,
      backendConnected,
    });
  }

  /**
   * Migrate localStorage data to Convex backend
   */
  private async migrateLocalStorageData(): Promise<void> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored || !this.currentUserId) return;

    try {
      const data: MondayWorkoutData[] = JSON.parse(stored);
      if (data.length === 0) return;

      console.log(`Migrating ${data.length} Monday workout entries to backend`);

      // Process and migrate the data
      const weekOfYear = this.getWeekOfYear();
      const processedData = data.map(workout => {
        const intensity = this.calculateIntensity(workout);
        return { workout, intensity };
      });

      // Generate hashes and prepare for batch migration
      const workoutsForMigration = await Promise.all(
        processedData.map(async ({ workout, intensity }) => {
          const hashInput = `${workout.reps}${workout.sets}${workout.volume}${workout.workoutTime}${workout.estimatedCalories}${intensity.totalScore}`;
          const hash = await this.generateHash(hashInput);
          
          return {
            userId: this.currentUserId as Id<"users">,
            weekOfYear,
            workoutHash: hash,
            intensityScore: intensity.totalScore,
            intensityBreakdown: intensity.breakdown,
            actions: intensity.actions,
            exerciseId: workout.exerciseId,
            workoutMetrics: {
              reps: workout.reps,
              sets: workout.sets,
              volume: workout.volume,
              workoutTime: workout.workoutTime,
              estimatedCalories: workout.estimatedCalories,
            },
            healthData: {
              heartRate: workout.heartRateData ? {
                avgHR: workout.heartRateData.avgHR,
                maxHR: workout.heartRateData.maxHR,
                variance: workout.heartRateData.variance,
              } : undefined,
              spo2: workout.spo2Data ? {
                avgSpO2: workout.spo2Data.avgSpO2,
                drift: workout.spo2Data.drift,
              } : undefined,
              sleepScore: workout.sleepScore,
            },
            userFeedback: workout.userFeedback,
          };
        })
      );

      // Migrate to backend
      const result = await convex.mutation(api.functions.mondayWorkoutData.storeMondayWorkoutDataBatch, {
        workouts: workoutsForMigration,
      });

      console.log(`Successfully migrated ${result.stored}/${result.total} Monday workout entries`);

      // Clear localStorage after successful migration
      localStorage.removeItem(this.STORAGE_KEY);
      currentWeekData.set([]);

    } catch (error) {
      console.error('Failed to migrate localStorage data:', error);
    }
  }

  /**
   * Check for pending processing triggers from server
   */
  private async checkPendingTriggers(): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const triggers = await convex.query(api.functions.mondayWorkoutData.getPendingTriggers, {
        userId: this.currentUserId as Id<"users">,
        limit: 5,
      });

      if (triggers.length > 0) {
        pendingMondayTriggers.set(triggers);
        
        // Auto-process if we're on Monday and have pending triggers
        const now = new Date();
        const isMonday = now.getDay() === 1;
        
        if (isMonday) {
          await this.processPendingTriggers(triggers);
        }
      }
    } catch (error) {
      console.error('Failed to check pending triggers:', error);
    }
  }

  /**
   * Process pending triggers from server
   */
  private async processPendingTriggers(triggers: MondayProcessingTrigger[]): Promise<void> {
    for (const trigger of triggers) {
      try {
        // Mark trigger as processed
        await convex.mutation(api.functions.mondayWorkoutData.markTriggerProcessed, {
          triggerId: trigger._id,
        });

        console.log(`Processed Monday trigger for week ${trigger.weekOfYear}`);
      } catch (error) {
        console.error(`Failed to process trigger ${trigger._id}:`, error);
      }
    }

    // Clear pending triggers
    pendingMondayTriggers.set([]);
  }

  /**
   * Check if it's a new week since last processing
   */
  private isNewWeek(lastProcessed: string): boolean {
    const lastDate = new Date(lastProcessed);
    const now = new Date();
    
    // Calculate the Monday of this week
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - now.getDay() + 1);
    
    // Calculate the Monday of last processed week
    const lastMonday = new Date(lastDate);
    lastMonday.setDate(lastDate.getDate() - lastDate.getDay() + 1);
    
    return currentMonday.getTime() !== lastMonday.getTime();
  }

  /**
   * Get week of year string in YYYY-WW format
   */
  private getWeekOfYear(date = new Date()): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const weekOfYear = Math.ceil(dayOfYear / 7);
    return `${year}-${weekOfYear.toString().padStart(2, '0')}`;
  }

  /**
   * Store workout data for Monday processing
   */
  addWorkoutData(data: Omit<MondayWorkoutData, 'date' | 'userId'>): void {
    const userId = this.currentUserId || 'anonymous-user';
    const workoutData: MondayWorkoutData = {
      ...data,
      date: new Date().toISOString(),
      userId,
    };

    // Add to current week data (localStorage fallback)
    currentWeekData.update(weekData => {
      const newData = [...weekData, workoutData];
      if (browser) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newData));
      }
      return newData;
    });
  }

  /**
   * Calculate intensity score based on implementation rules
   */
  calculateIntensity(data: MondayWorkoutData): IntensityScore {
    let totalScore = 50; // Default base score
    
    const breakdown = {
      baseScore: 50,
      hrVarianceScore: 0,
      spo2DriftScore: 0,
      sleepScore: 0,
      feedbackScore: 0,
    };

    // Heart rate variance scoring (0-20 points)
    if (data.heartRateData?.variance) {
      const hrScore = Math.min(data.heartRateData.variance, 20);
      breakdown.hrVarianceScore = hrScore;
      totalScore += hrScore;
    }

    // SpO2 drift scoring (0-10 points)
    if (data.spo2Data?.drift) {
      const spo2Score = Math.min(data.spo2Data.drift * 2, 10);
      breakdown.spo2DriftScore = spo2Score;
      totalScore += spo2Score;
    }

    // Sleep score (0-20 range, already normalized)
    if (data.sleepScore !== undefined) {
      breakdown.sleepScore = data.sleepScore;
      totalScore += data.sleepScore;
    }

    // User feedback scoring
    if (data.userFeedback) {
      let feedbackScore = 0;
      switch (data.userFeedback) {
        case 'keep_going':
          feedbackScore = 20;
          break;
        case 'finally_challenge':
          feedbackScore = 10;
          break;
        case 'neutral':
          feedbackScore = 0;
          break;
        case 'easy_killer':
          feedbackScore = -15;
          break;
        case 'flag_review':
          feedbackScore = -5;
          break;
      }
      breakdown.feedbackScore = feedbackScore;
      totalScore += feedbackScore;
    }

    // Clamp total score to 0-100 range
    totalScore = Math.max(0, Math.min(100, totalScore));

    // Determine actions based on intensity score and rules
    const actions = this.determineActions(totalScore, data);

    return {
      totalScore,
      breakdown,
      actions,
    };
  }

  /**
   * Determine volume adjustments and flags based on intensity and rules
   */
  private determineActions(intensityScore: number, data: MondayWorkoutData): IntensityScore['actions'] {
    let adjustVolume = false;
    let adjustment = 0;
    let flagForReview = false;

    // Rule: If intensity >100%, auto-reduce volume by 5-10%
    if (intensityScore > 100) {
      adjustVolume = true;
      adjustment = -Math.min(10, Math.max(5, intensityScore - 100));
    }

    // Rule: If "easy killer" + strain >95%, auto-reduce by 5-10%
    if (data.userFeedback === 'easy_killer') {
      const strain = this.calculateStrain(data);
      if (strain > 95) {
        adjustVolume = true;
        adjustment = -Math.min(10, Math.max(5, (strain - 95) * 2));
      }
    }

    // Rule: Flag for review with health data mismatch
    if (data.userFeedback === 'flag_review') {
      const healthDataMismatch = this.checkHealthDataMismatch(data);
      if (healthDataMismatch) {
        flagForReview = true;
      } else {
        // Health data matches feedback, act immediately
        adjustVolume = true;
        adjustment = -Math.min(10, Math.max(5, 7.5)); // 5-10% reduction
      }
    }

    // Rule: Mental stress detection - ignore if HR spikes + SpO2 jitter + no reps
    if (this.detectMentalStress(data)) {
      // Drop from progression - reset adjustments
      adjustVolume = false;
      adjustment = 0;
    }

    return {
      adjustVolume,
      adjustment,
      flagForReview,
    };
  }

  /**
   * Calculate strain score from health data
   */
  private calculateStrain(data: MondayWorkoutData): number {
    let strain = 50; // Base strain

    if (data.heartRateData?.variance) {
      strain += data.heartRateData.variance * 2; // HR variance contributes more
    }

    if (data.spo2Data?.drift && data.spo2Data.drift > 3) {
      strain += (data.spo2Data.drift - 3) * 5; // SpO2 drift penalty
    }

    if (data.sleepScore !== undefined && data.sleepScore < 10) {
      strain += (10 - data.sleepScore) * 2; // Poor sleep increases strain
    }

    return Math.min(100, strain);
  }

  /**
   * Check for health data mismatch with user feedback
   */
  private checkHealthDataMismatch(data: MondayWorkoutData): boolean {
    if (data.userFeedback === 'easy_killer') {
      // Easy feedback but high HR variance or SpO2 issues = mismatch
      const highHR = data.heartRateData?.variance && data.heartRateData.variance > 10;
      const poorSpO2 = data.spo2Data?.drift && data.spo2Data.drift > 2;
      return !(highHR || poorSpO2); // No mismatch if health data shows stress
    }
    return false;
  }

  /**
   * Detect mental stress pattern
   */
  private detectMentalStress(data: MondayWorkoutData): boolean {
    const hrSpike = data.heartRateData?.variance && data.heartRateData.variance > 15;
    const spo2Jitter = data.spo2Data?.drift && data.spo2Data.drift > 3;
    const noReps = data.reps === 0;

    return !!(hrSpike && spo2Jitter && noReps);
  }

  /**
   * Process Monday data: hash and send to backend, wipe cache
   */
  async processMondayData(): Promise<void> {
    const weekData = get(currentWeekData);
    const backendConnected = get(mondayDataProcessor).backendConnected;
    
    if (weekData.length === 0) return;
    if (!this.currentUserId) {
      console.error('Cannot process Monday data: no user ID set');
      return;
    }

    try {
      const weekOfYear = this.getWeekOfYear();
      
      // Calculate intensity scores for all workouts
      const processedData = weekData.map(workout => {
        const intensity = this.calculateIntensity(workout);
        return {
          workout,
          intensity,
        };
      });

      // Generate hash for each workout and prepare for batch storage
      const workoutsForBatch = await Promise.all(
        processedData.map(async ({ workout, intensity }) => {
          const hashInput = `${workout.reps}${workout.sets}${workout.volume}${workout.workoutTime}${workout.estimatedCalories}${intensity.totalScore}`;
          const hash = await this.generateHash(hashInput);
          
          return {
            userId: this.currentUserId as Id<"users">,
            weekOfYear,
            workoutHash: hash,
            intensityScore: intensity.totalScore,
            intensityBreakdown: intensity.breakdown,
            actions: intensity.actions,
            exerciseId: workout.exerciseId,
            workoutMetrics: {
              reps: workout.reps,
              sets: workout.sets,
              volume: workout.volume,
              workoutTime: workout.workoutTime,
              estimatedCalories: workout.estimatedCalories,
            },
            healthData: {
              heartRate: workout.heartRateData ? {
                avgHR: workout.heartRateData.avgHR,
                maxHR: workout.heartRateData.maxHR,
                variance: workout.heartRateData.variance,
              } : undefined,
              spo2: workout.spo2Data ? {
                avgSpO2: workout.spo2Data.avgSpO2,
                drift: workout.spo2Data.drift,
              } : undefined,
              sleepScore: workout.sleepScore,
            },
            userFeedback: workout.userFeedback,
          };
        })
      );

      if (backendConnected) {
        // Send batch to Convex backend
        const result = await convex.mutation(api.functions.mondayWorkoutData.storeMondayWorkoutDataBatch, {
          workouts: workoutsForBatch,
        });

        console.log(`Stored ${result.stored}/${result.total} Monday workout data entries in backend`);
      } else {
        console.log('Backend unavailable, keeping data in localStorage until connection restored');
        // Don't clear localStorage if backend is unavailable
        return;
      }

      // Generate display updates
      this.generateDisplayUpdates(processedData);

      // Mark as processed and wipe cache
      const now = new Date().toISOString();
      localStorage.setItem(this.PROCESSED_KEY, now);
      localStorage.removeItem(this.STORAGE_KEY);
      
      currentWeekData.set([]);
      mondayDataProcessor.update(state => ({
        ...state,
        shouldProcess: false,
        lastProcessed: now,
      }));

    } catch (error) {
      console.error('Failed to process Monday data:', error);
      // Don't clear data if processing failed
      throw error;
    }
  }

  /**
   * Generate secure hash using Web Crypto API
   */
  private async generateHash(input: string): Promise<string> {
    if (!browser) return 'mock-hash';
    
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate display updates for user
   */
  private generateDisplayUpdates(processedData: { workout: MondayWorkoutData; intensity: IntensityScore }[]): void {
    processedData.forEach(({ workout, intensity }) => {
      const sleepHours = workout.sleepScore ? (workout.sleepScore / 20 * 12).toFixed(1) : 'N/A';
      const volumeChange = intensity.actions.adjustVolume ? 
        (intensity.actions.adjustment > 0 ? `+${Math.abs(intensity.actions.adjustment * workout.volume / 100).toFixed(1)} lbs` : 
         `-${Math.abs(intensity.actions.adjustment * workout.volume / 100).toFixed(1)} lbs`) : 
        `+${this.getDefaultProgression()} lbs`;
      
      const message = `Last week you hit ${intensity.totalScore}% on ${workout.exerciseId}, slept ${sleepHours} hours. ${volumeChange}.`;
      console.log('Display update:', message);
      
      // TODO: Show in UI
    });
  }

  /**
   * Get default progression based on rules
   */
  private getDefaultProgression(): number {
    // From workout-rules.json
    return 2.5;
  }

  /**
   * Check Monday status and set up processing
   */
  private checkMondayStatus(): void {
    const now = new Date();
    const isMonday = now.getDay() === 1;
    
    mondayDataProcessor.update(state => ({
      ...state,
      isMonday,
    }));

    // If it's Monday and we should process, trigger processing
    const currentState = get(mondayDataProcessor);
    if (currentState.shouldProcess) {
      this.processMondayData();
    }
  }

  /**
   * Get historical Monday data from Convex
   */
  async getHistoricalData(userId: string, weeksBack = 12) {
    try {
      return await convex.query(api.functions.mondayWorkoutData.getMondayWorkoutData, {
        userId: userId as Id<"users">,
        limit: weeksBack,
      });
    } catch (error) {
      console.error('Failed to fetch historical Monday data:', error);
      return [];
    }
  }

  /**
   * Get exercise-specific Monday data from Convex
   */
  async getExerciseData(userId: string, exerciseId: string, weeksBack = 12) {
    try {
      return await convex.query(api.functions.mondayWorkoutData.getMondayWorkoutDataByExercise, {
        userId: userId as Id<"users">,
        exerciseId,
        weeksBack,
      });
    } catch (error) {
      console.error('Failed to fetch exercise Monday data:', error);
      return [];
    }
  }

  /**
   * Get volume adjustments from Convex
   */
  async getVolumeAdjustments(userId: string, exerciseId?: string) {
    try {
      return await convex.query(api.functions.mondayWorkoutData.getVolumeAdjustments, {
        userId: userId as Id<"users">,
        exerciseId,
      });
    } catch (error) {
      console.error('Failed to fetch volume adjustments:', error);
      return [];
    }
  }

  /**
   * Get intensity trends for analytics
   */
  async getIntensityTrends(userId: string, exerciseId?: string, weeksBack = 12) {
    try {
      return await convex.query(api.functions.mondayWorkoutData.getIntensityTrends, {
        userId: userId as Id<"users">,
        exerciseId,
        weeksBack,
      });
    } catch (error) {
      console.error('Failed to fetch intensity trends:', error);
      return [];
    }
  }

  /**
   * Test backend connectivity
   */
  async testBackendConnection(): Promise<boolean> {
    try {
      if (!this.currentUserId) return false;
      
      await convex.query(api.functions.mondayWorkoutData.getMondayWorkoutData, {
        userId: this.currentUserId as Id<"users">,
        limit: 1,
      });
      
      // Update connection status
      mondayDataProcessor.update(state => ({
        ...state,
        backendConnected: true,
      }));
      
      return true;
    } catch (error) {
      console.warn('Backend connection test failed:', error);
      
      mondayDataProcessor.update(state => ({
        ...state,
        backendConnected: false,
      }));
      
      return false;
    }
  }

  /**
   * Force migration of localStorage data to backend
   */
  async forceMigration(): Promise<{ success: boolean; migrated: number; error?: string }> {
    try {
      await this.migrateLocalStorageData();
      return { success: true, migrated: 0 }; // Will be updated in migrateLocalStorageData
    } catch (error) {
      return { 
        success: false, 
        migrated: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Create singleton instance
export const mondayWorkoutService = new MondayWorkoutService();

// Derived store for checking if Monday processing is needed
export const needsMondayProcessing = derived(
  mondayDataProcessor,
  $processor => $processor.isMonday && $processor.shouldProcess
);

// Helper function to add workout data from components
export async function logWorkoutForMonday(
  exerciseId: string,
  reps: number,
  sets: number,
  volume: number,
  workoutTime: number,
  userFeedback?: MondayWorkoutData['userFeedback'],
  healthData?: {
    heartRate?: { avg: number; max: number; variance: number };
    spo2?: { avg: number; drift: number };
    sleepScore?: number;
  }
): Promise<void> {
  let finalHealthData = healthData;

  // If no health data provided, try to collect it automatically
  if (!healthData) {
    try {
      // Collect health data for the workout period
      const collectedMetrics = await healthDataService.collectLastWorkoutMetrics(workoutTime);
      
      if (collectedMetrics) {
        // Process the health data for quality assessment and normalization
        const processedMetrics = preprocessHealthDataForMonday(collectedMetrics);
        
        // Check data quality before using
        if (processedMetrics.quality.overallQuality === 'invalid') {
          console.warn('Collected health data has poor quality, using fallback approach');
        } else {
          // Use processed data with quality indicators
          finalHealthData = {
            heartRate: processedMetrics.heartRate ? {
              avg: processedMetrics.heartRate.avgHR,
              max: processedMetrics.heartRate.maxHR,
              variance: processedMetrics.heartRate.variance,
            } : undefined,
            spo2: processedMetrics.spo2 ? {
              avg: processedMetrics.spo2.avgSpO2,
              drift: processedMetrics.spo2.drift,
            } : undefined,
            sleepScore: processedMetrics.sleepScore,
          };
          
          // Log health data insights for debugging/user feedback
          const { healthDataPreprocessor } = await import('../services/healthDataPreprocessor.js');
          const insights = healthDataPreprocessor.generateHealthInsights(processedMetrics);
          if (insights.length > 0) {
            console.info('Health insights for this workout:', insights);
          }
        }
      } else {
        // Try to get basic health metrics as fallback
        try {
          const basicMetrics = await healthDataService.collectHealthMetrics(new Date(), new Date());
          if (basicMetrics?.sleepScore !== undefined) {
            finalHealthData = { sleepScore: basicMetrics.sleepScore };
          }
        } catch (fallbackError) {
          console.warn('Failed to collect fallback health data:', fallbackError);
        }
      }
    } catch (error) {
      console.warn('Failed to automatically collect health data:', error);
    }
  }

  const estimatedCalories = calculateEstimatedCalories(workoutTime, reps, sets, volume);
  
  mondayWorkoutService.addWorkoutData({
    exerciseId,
    reps,
    sets,
    volume,
    workoutTime,
    estimatedCalories,
    heartRateData: finalHealthData?.heartRate ? {
      avgHR: finalHealthData.heartRate.avg,
      maxHR: finalHealthData.heartRate.max,
      variance: finalHealthData.heartRate.variance,
    } : undefined,
    spo2Data: finalHealthData?.spo2 ? {
      avgSpO2: finalHealthData.spo2.avg,
      drift: finalHealthData.spo2.drift,
    } : undefined,
    sleepScore: finalHealthData?.sleepScore,
    userFeedback,
  });
}

/**
 * Calculate estimated calories using VO2 max + METs approximation
 */
function calculateEstimatedCalories(
  workoutTime: number,
  reps: number,
  sets: number,
  volume: number
): number {
  // Simple MET-based calculation for resistance training
  // Resistance training = ~3-6 METs depending on intensity
  const baseMETs = 4; // Moderate resistance training
  const intensityMultiplier = Math.min(2, volume / 100); // Higher weight = higher intensity
  const totalMETs = baseMETs * intensityMultiplier;
  
  // Approximate weight for calorie calculation (150 lbs average)
  const bodyWeight = 70; // kg
  const caloriesPerMinute = (totalMETs * bodyWeight * 3.5) / 200;
  
  return Math.round(caloriesPerMinute * workoutTime);
}