// AI Integration Service
// Integrates with deployed AI service while respecting existing workout rules

import type { DailyStrainAssessmentService } from './dailyStrainAssessmentService';
import { MesocycleTrackerService } from './mesocycleTracker.js';
import type { MesocycleData } from './mesocycleTracker.js';

// Load workout rules and user preferences (in real app, would be from API/database)
const workoutRules = {
  weightJumps: { allowed: [2.5, 5, 10], defaultProgression: 2.5, skipThreshold: 0.6 },
  exerciseSwaps: { blacklistThreshold: 3 },
  strainLimits: { 
    maxHrPercent: 85, 
    hrExceedDuration: 10, 
    restIncrease: 30, 
    maxRestTime: 90,
    calibrationPrompt: "Wanna calibrate your safe strain? Jump in place for fifteen seconds. We'll read your heart rate and set a real limit. Skip if you want-we'll guess based on age."
  },
  aiPromptTemplate: {
    template: "User prefers: {userPrefs}. Last 4 weeks: {progressionHistory}. Mesocycle complete: {mesocycleComplete}. HR>85% max? {hrExceeded}. SpO2<95? {spo2Low}. Rules: {weightJumps}, max 5 reps, blacklist: {blacklist}. Implement ONE: {nextProgression}. No repeats weekly. Same muscle group."
  }
};

export interface WorkoutContext {
  userId: string;
  currentExercise: string;
  currentWeight: number;
  currentReps: number;
  heartRate: number;
  spo2: number;
  lastWorkouts: WorkoutHistory[];
  userPrefs: UserPreferences;
}

export interface WorkoutHistory {
  date: string;
  exercises: string[];
  avgHeartRate: number;
  feedback: 'easy' | 'moderate' | 'hard';
}

export interface UserPreferences {
  blacklistedExercises: string[];
  preferredExercises: string[];
  successRates: Record<string, number>;
  maxHeartRate: number;
  calibrated: boolean;
  age: number;
  exerciseSwapCounts: Record<string, number>; // Track how many times each exercise was swapped
  [key: string]: unknown; // Allow additional properties for swap tracking
}

export interface AIImplementation {
  type: 'weight_increase' | 'add_set' | 'add_rep' | 'increase_rest' | 'blacklist_exercise' | 'swap_exercise';
  value: number;
  reason: string;
  exercise?: string;
  replacementExercise?: string; // For exercise swaps
  clamped?: boolean; // If suggestion was clamped to safety rules
  applied: boolean; // Whether the change was automatically applied
  appliedValue?: number; // The actual value that was applied (may differ from suggested)
  clampReason?: string; // Why it was clamped
}

export class AIWorkoutIntegrationService {
  private readonly AI_SERVICE_URL = 'https://technically-fit-ai.fly.dev';
  private readonly strainService: DailyStrainAssessmentService;
  private readonly mesocycleService: MesocycleTrackerService;

  constructor(strainService: DailyStrainAssessmentService) {
    this.strainService = strainService;
    this.mesocycleService = new MesocycleTrackerService();
  }

  /**
   * Get AI recommendation and automatically apply it while respecting hard rules and mesocycle progression
   */
  async getAIImplementation(context: WorkoutContext): Promise<AIImplementation> {
    try {
      // Get mesocycle data first
      const mesocycleData = this.mesocycleService.getMesocycleData(context.userId);
      const isMesocycleComplete = this.mesocycleService.isMesocycleComplete(mesocycleData);
      
      // Check strain limits first
      const strainCheck = this.checkStrainLimits(context);
      if (strainCheck) {
        return strainCheck;
      }

      // Build AI prompt from template including mesocycle context
      const prompt = this.buildPromptWithMesocycle(context, mesocycleData);
      
      // Call AI service with timeout
      const aiResponse = await this.callAIService(prompt);
      
      // Apply safety net and implement changes automatically
      const safeImplementation = this.applySafetyNetAndImplement(aiResponse, context, mesocycleData);
      
      return safeImplementation;
    } catch (error) {
      console.error('AI service error, falling back to rule-based implementation:', error);
      const mesocycleData = this.mesocycleService.getMesocycleData(context.userId);
      return this.getMesocycleBasedFallback(context, mesocycleData);
    }
  }

  /**
   * Check if strain limits require immediate action
   */
  private checkStrainLimits(context: WorkoutContext): AIImplementation | null {
    const { heartRate, spo2, userPrefs } = context;
    const maxHR = userPrefs.maxHeartRate || (220 - userPrefs.age) * 0.85;

    // HR exceeds 85% max
    if (heartRate > maxHR) {
      const currentRest = 60; // Default rest time, would get from current workout state
      const newRest = Math.min(currentRest + workoutRules.strainLimits.restIncrease, workoutRules.strainLimits.maxRestTime);
      
      return {
        type: 'increase_rest',
        value: newRest,
        reason: `HR ${heartRate} exceeds ${maxHR} max. Increasing rest to ${newRest}s`,
        clamped: newRest === workoutRules.strainLimits.maxRestTime,
        applied: true, // Automatically applied for safety
        appliedValue: newRest
      };
    }

    // SpO2 below 95%
    if (spo2 < 95) {
      return {
        type: 'increase_rest',
        value: workoutRules.strainLimits.maxRestTime,
        reason: `SpO2 ${spo2}% below safe threshold. Maximum rest applied automatically`,
        clamped: true,
        applied: true, // Automatically applied for safety
        appliedValue: workoutRules.strainLimits.maxRestTime
      };
    }

    return null;
  }

  /**
   * Build AI prompt from template using workout rules and mesocycle context
   */
  private buildPromptWithMesocycle(context: WorkoutContext, mesocycleData: MesocycleData): string {
    const { userPrefs, lastWorkouts, heartRate, spo2, currentExercise } = context;
    const template = workoutRules.aiPromptTemplate.template;

    // Get progression history for current exercise
    const progressionHistory = this.mesocycleService.getProgressionHistory(mesocycleData, currentExercise);
    
    // Check if mesocycle is complete
    const mesocycleComplete = this.mesocycleService.isMesocycleComplete(mesocycleData);
    
    // Determine next progression type
    const nextProgression = this.mesocycleService.getNextProgressionType(mesocycleData);
    const progressionText = this.getProgressionText(nextProgression);

    // Check if HR/SpO2 exceed limits
    const maxHR = userPrefs.maxHeartRate || (220 - userPrefs.age) * 0.85;
    const hrExceeded = heartRate > maxHR;
    const spo2Low = spo2 < 95;

    return template
      .replace('{userPrefs}', userPrefs.preferredExercises.join(', ') || 'none')
      .replace('{progressionHistory}', progressionHistory)
      .replace('{mesocycleComplete}', mesocycleComplete.toString())
      .replace('{hrExceeded}', hrExceeded.toString())
      .replace('{spo2Low}', spo2Low.toString())
      .replace('{weightJumps}', workoutRules.weightJumps.allowed.join(', ') + ' lbs')
      .replace('{blacklist}', userPrefs.blacklistedExercises.join(', ') || 'none')
      .replace('{nextProgression}', progressionText);
  }

  /**
   * Convert progression type to human-readable text
   */
  private getProgressionText(progressionType: string): string {
    switch (progressionType) {
      case 'add_set':
        return 'add set';
      case 'add_rep':
        return 'add rep (max 5 per set)';
      case 'add_volume':
        return 'increase volume by 2.5-10 lbs';
      case 'replace_exercise':
        return 'replace exercise (same muscle group)';
      default:
        return 'add set, add rep, increase volume, or replace exercise';
    }
  }

  /**
   * Call deployed AI service with timeout
   */
  private async callAIService(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const response = await fetch(`${this.AI_SERVICE_URL}/api/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }

      const data = await response.json();
      return data.recommendation || data.response || 'increase rest by 30s';
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Apply safety net to clamp AI suggestions to rules and automatically implement changes with mesocycle awareness
   */
  private applySafetyNetAndImplement(aiResponse: string, context: WorkoutContext, mesocycleData: MesocycleData): AIImplementation {
    const response = aiResponse.toLowerCase();
    const nextProgression = this.mesocycleService.getNextProgressionType(mesocycleData);
    
    // Parse AI response and extract suggestion
    let implementation: AIImplementation;

    // Check for exercise replacement first (if mesocycle complete and exercises need replacement)
    if (response.includes('replace') || nextProgression === 'replace_exercise') {
      const exercisesToReplace = this.mesocycleService.getExercisesToReplace(mesocycleData);
      if (exercisesToReplace.includes(context.currentExercise)) {
        const replacement = this.findReplacementExercise(context.currentExercise);
        implementation = {
          type: 'swap_exercise',
          value: 1,
          reason: `${context.currentExercise} has <50% completion over 4 weeks. Replaced with ${replacement}`,
          exercise: context.currentExercise,
          replacementExercise: replacement,
          applied: true,
          appliedValue: 1
        };
      } else {
        const mesocycleData = this.mesocycleService.getMesocycleData(context.userId);
        implementation = this.getMesocycleBasedFallback(context, mesocycleData);
      }
    } else if ((response.includes('add') && response.includes('set')) || nextProgression === 'add_set') {
      implementation = {
        type: 'add_set',
        value: 1,
        reason: `Mesocycle progression: added 1 set automatically`,
        applied: true,
        appliedValue: 1
      };
    } else if ((response.includes('add') && response.includes('rep')) || nextProgression === 'add_rep') {
      // Extract rep count, max 5 per set
      const match = response.match(/(\d+)\s*rep/);
      const requestedReps = match ? parseInt(match[1]) : 1;
      const clampedReps = Math.min(requestedReps, 5);
      
      implementation = {
        type: 'add_rep',
        value: clampedReps,
        reason: `Mesocycle progression: added ${clampedReps} rep(s) automatically (max 5)`,
        clamped: clampedReps !== requestedReps,
        clampReason: clampedReps !== requestedReps ? 'Max 5 reps per set' : undefined,
        applied: true,
        appliedValue: clampedReps
      };
    } else if (response.includes('increase') && (response.includes('weight') || response.includes('volume')) || nextProgression === 'add_volume') {
      // Extract weight increase amount
      const match = response.match(/(\d+(?:\.\d+)?)\s*(?:lb|pound)/);
      const requestedIncrease = match ? parseFloat(match[1]) : 5;
      
      // Clamp to allowed weight jumps
      const allowedJumps = workoutRules.weightJumps.allowed;
      const clampedIncrease = allowedJumps.reduce((prev: number, curr: number) => 
        Math.abs(curr - requestedIncrease) < Math.abs(prev - requestedIncrease) ? curr : prev
      );

      implementation = {
        type: 'weight_increase',
        value: clampedIncrease,
        reason: `Mesocycle progression: weight increased by ${clampedIncrease}lb automatically`,
        clamped: clampedIncrease !== requestedIncrease,
        clampReason: clampedIncrease !== requestedIncrease ? 'Allowed jumps: 2.5, 5, 10 lbs only' : undefined,
        applied: true,
        appliedValue: clampedIncrease
      };
    } else if (response.includes('rest')) {
      // Extract rest time
      const match = response.match(/(\d+)\s*(?:s|sec|second)/);
      const requestedRest = match ? parseInt(match[1]) : 30;
      const clampedRest = Math.max(
        30, // minimum rest time
        Math.min(requestedRest, workoutRules.strainLimits.maxRestTime)
      );

      implementation = {
        type: 'increase_rest',
        value: clampedRest,
        reason: `Rest automatically adjusted to ${clampedRest}s`,
        clamped: clampedRest !== requestedRest,
        clampReason: clampedRest !== requestedRest ? `Rest clamped to 30-${workoutRules.strainLimits.maxRestTime}s range` : undefined,
        applied: true,
        appliedValue: clampedRest
      };
    } else if (response.includes('blacklist')) {
      implementation = {
        type: 'blacklist_exercise',
        value: 1,
        reason: 'Exercise blacklisting requires user confirmation',
        exercise: context.currentExercise,
        applied: false, // Requires user confirmation
        appliedValue: 0
      };
    } else {
      // Default fallback based on mesocycle progression
      implementation = this.getMesocycleBasedFallback(context, mesocycleData);
    }

    return implementation;
  }

  /**
   * Find replacement exercise within same muscle group
   */
  private findReplacementExercise(currentExercise: string): string {
    const muscleGroups = {
      chest: ['bench_press', 'incline_press', 'dumbbell_press', 'push_ups', 'chest_fly'],
      back: ['deadlift', 'rack_pull', 'bent_over_row', 'pull_ups', 'lat_pulldown'],
      legs: ['squat', 'leg_press', 'lunges', 'leg_extension', 'leg_curl'],
      shoulders: ['overhead_press', 'lateral_raise', 'rear_delt_fly', 'upright_row'],
      arms: ['bicep_curl', 'tricep_extension', 'hammer_curl', 'dips'],
      core: ['plank', 'crunches', 'russian_twist', 'leg_raise']
    };

    // Find which muscle group the current exercise belongs to
    for (const [group, exercises] of Object.entries(muscleGroups)) {
      if (exercises.includes(currentExercise)) {
        // Return a different exercise from same group
        const alternatives = exercises.filter(ex => ex !== currentExercise);
        return alternatives[0] || currentExercise; // Fallback to same exercise if no alternatives
      }
    }

    return currentExercise; // Fallback if exercise not found in any group
  }

  /**
   * Get fallback implementation based on mesocycle progression
   */
  private getMesocycleBasedFallback(context: WorkoutContext, mesocycleData: MesocycleData): AIImplementation {
    const nextProgression = this.mesocycleService.getNextProgressionType(mesocycleData);
    const { currentExercise, userPrefs } = context;
    const successRate = userPrefs.successRates[currentExercise] || 0.5;

    switch (nextProgression) {
      case 'add_set':
        return {
          type: 'add_set',
          value: 1,
          reason: `Mesocycle fallback: added 1 set automatically`,
          applied: true,
          appliedValue: 1
        };
      case 'add_rep':
        return {
          type: 'add_rep',
          value: 1,
          reason: `Mesocycle fallback: added 1 rep automatically`,
          applied: true,
          appliedValue: 1
        };
      case 'add_volume': {
        const weightIncrease = successRate > 0.6 ? 5 : 2.5;
        return {
          type: 'weight_increase',
          value: weightIncrease,
          reason: `Mesocycle fallback: increased weight by ${weightIncrease}lb automatically`,
          applied: true,
          appliedValue: weightIncrease
        };
      }
      case 'replace_exercise': {
        const replacement = this.findReplacementExercise(currentExercise);
        return {
          type: 'swap_exercise',
          value: 1,
          reason: `Mesocycle fallback: replaced ${currentExercise} with ${replacement}`,
          exercise: currentExercise,
          replacementExercise: replacement,
          applied: true,
          appliedValue: 1
        };
      }
      default:
        return {
          type: 'weight_increase',
          value: 2.5,
          reason: `Default fallback: conservative 2.5lb increase`,
          applied: true,
          appliedValue: 2.5
        };
    }
  }

  /**
   * Enhanced exercise swap tracking with automatic blacklist prompting
   */
  async trackExerciseSwap(userId: string, fromExercise: string): Promise<AIImplementation | null> {
    // Get current user preferences
    const userPrefs = this.getUserPreferences(userId);
    
    // Initialize swap count if not exists
    if (!userPrefs.exerciseSwapCounts) {
      userPrefs.exerciseSwapCounts = {};
    }
    
    // Increment swap count for this exercise
    const currentSwapCount = (userPrefs.exerciseSwapCounts[fromExercise] || 0) + 1;
    userPrefs.exerciseSwapCounts[fromExercise] = currentSwapCount;
    
    // Update user preferences
    await this.updateUserPreferences(userId, { 
      exerciseSwapCounts: userPrefs.exerciseSwapCounts 
    });

    // Check if blacklist threshold reached (3+ swaps)
    if (currentSwapCount >= 3) {
      return {
        type: 'blacklist_exercise',
        value: 1,
        reason: `${fromExercise} swapped ${currentSwapCount} times. Blacklist this exercise?`,
        exercise: fromExercise,
        applied: false, // Requires user confirmation
        appliedValue: 0
      };
    }

    return null; // No blacklist prompt needed yet
  }

  /**
   * Get user preferences, create default if not exists
   */
  private getUserPreferences(_userId: string): UserPreferences {
    // In real implementation, would load from database/API
    // For now, return default preferences
    return {
      blacklistedExercises: [],
      preferredExercises: [],
      successRates: {},
      maxHeartRate: 0, // Will calculate from age
      calibrated: false,
      age: 30, // Default age
      exerciseSwapCounts: {} // Initialize empty swap tracking
    };
  }

  /**
   * Update user preferences (would persist to database/file)
   */
  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<void> {
    // In real implementation, this would update the JSON file or database
    console.log(`Updating preferences for user ${userId}:`, updates);
  }

  /**
   * Calibrate user's max heart rate using 15-second jump test
   */
  async calibrateMaxHeartRate(userId: string, jumpTestHR: number): Promise<void> {
    const calibratedMaxHR = jumpTestHR * 0.85; // 85% of jump test result
    
    await this.updateUserPreferences(userId, {
      maxHeartRate: calibratedMaxHR,
      calibrated: true
    });

    console.log(`User ${userId} max HR calibrated to ${calibratedMaxHR} from jump test (${jumpTestHR})`);
  }

  /**
   * Show strain calibration prompt
   */
  getStrainCalibrationPrompt(): string {
    return workoutRules.strainLimits.calibrationPrompt;
  }
}