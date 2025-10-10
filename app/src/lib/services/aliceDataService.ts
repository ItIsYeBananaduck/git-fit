/**
 * Alice Data Service
 * 
 * Handles real-time data subscription and transformation for Alice AI companion
 */

import { api } from '$lib/convex/_generated/api';
import type { 
  AliceAIState, 
  AlicePreferences, 
  StrainMorphContext, 
  WorkoutSession,
  RealTimeMetrics,
  HealthData
} from '$types/alice.js';
import { aliceActions } from '$lib/stores/aliceStore.js';
import { triggerVoiceCoaching } from '$lib/services/aliceVoiceService.js';

// Real-time data service class
export class AliceDataService {
  private subscriptions: Map<string, () => void> = new Map();
  private lastStrain: number = 0;
  private sessionStartTime: number = 0;
  private isActive: boolean = false;

  /**
   * Initialize data subscriptions for Alice
   */
  async initialize(userId: string): Promise<void> {
    try {
      // Subscribe to Alice state updates
      const unsubscribeState = await this.subscribeToAliceState(userId);
      this.subscriptions.set('aliceState', unsubscribeState);

      // Subscribe to workout data
      const unsubscribeWorkout = await this.subscribeToWorkoutData(userId);
      this.subscriptions.set('workoutData', unsubscribeWorkout);

      // Subscribe to health metrics
      const unsubscribeHealth = await this.subscribeToHealthData(userId);
      this.subscriptions.set('healthData', unsubscribeHealth);

      this.isActive = true;
      console.log('Alice data service initialized');

    } catch (error) {
      console.error('Failed to initialize Alice data service:', error);
      throw error;
    }
  }

  /**
   * Subscribe to Alice AI state changes
   */
  private async subscribeToAliceState(userId: string): Promise<() => void> {
    // Create subscription to Alice state
    const subscription = api.alice.getState.subscribe({ userId });
    
    return subscription((state: AliceAIState | null) => {
      if (state) {
        aliceActions.updateAIState(state);
        this.handleStateChange(state);
      }
    });
  }

  /**
   * Subscribe to real-time workout data
   */
  private async subscribeToWorkoutData(userId: string): Promise<() => void> {
    const subscription = api.alice.getWorkoutMetrics.subscribe({ userId });
    
    return subscription((metrics: RealTimeMetrics | null) => {
      if (metrics) {
        this.handleWorkoutMetrics(metrics);
      }
    });
  }

  /**
   * Subscribe to health data changes
   */
  private async subscribeToHealthData(userId: string): Promise<() => void> {
    const subscription = api.alice.getHealthData.subscribe({ userId });
    
    return subscription((healthData: HealthData | null) => {
      if (healthData) {
        this.handleHealthData(healthData);
      }
    });
  }

  /**
   * Handle Alice state changes
   */
  private handleStateChange(state: AliceAIState): void {
    // Check if morphing should be triggered
    if (state.morphingConfig && state.morphingConfig.autoMorph) {
      this.evaluateMorphingTriggers(state);
    }

    // Update session tracking
    if (state.isActive && !this.sessionStartTime) {
      this.sessionStartTime = Date.now();
    } else if (!state.isActive && this.sessionStartTime) {
      this.sessionStartTime = 0;
    }
  }

  /**
   * Handle real-time workout metrics
   */
  private async handleWorkoutMetrics(metrics: RealTimeMetrics): Promise<void> {
    const currentStrain = metrics.strain || 0;
    const strainDelta = currentStrain - this.lastStrain;

    // Check if strain change is significant enough for morphing
    if (Math.abs(strainDelta) > 15) {
      const morphContext: StrainMorphContext = {
        currentStrain,
        previousStrain: this.lastStrain,
        strainDelta,
        timestamp: Date.now()
      };

      // Trigger morphing
      aliceActions.triggerMorphing(morphContext);

      // Trigger voice coaching if appropriate
      await this.handleVoiceCoaching(morphContext);
    }

    // Update stored strain value
    this.lastStrain = currentStrain;

    // Update Alice state with new metrics
    aliceActions.updateMetrics(metrics);
  }

  /**
   * Handle health data updates
   */
  private handleHealthData(healthData: HealthData): void {
    // Process health data for Alice insights
    const processedData = this.processHealthData(healthData);
    
    // Update Alice state if health data impacts AI behavior
    if (processedData.impactsAI) {
      aliceActions.updateHealthInsights(processedData.insights);
    }
  }

  /**
   * Evaluate triggers for morphing animations
   */
  private evaluateMorphingTriggers(state: AliceAIState): void {
    const config = state.morphingConfig;
    if (!config) return;

    // Check strain threshold
    if (config.strainThreshold && this.lastStrain > config.strainThreshold) {
      const morphContext: StrainMorphContext = {
        currentStrain: this.lastStrain,
        previousStrain: this.lastStrain - 10, // Estimated previous
        strainDelta: 10,
        timestamp: Date.now()
      };

      aliceActions.triggerMorphing(morphContext);
    }
  }

  /**
   * Handle voice coaching triggers
   */
  private async handleVoiceCoaching(context: StrainMorphContext): Promise<void> {
    try {
      // Get user preferences for voice coaching
      const preferences = await this.getUserPreferences();
      
      if (preferences.voiceCoachingEnabled) {
        await triggerVoiceCoaching(context, {
          voiceEnabled: preferences.voiceCoachingEnabled,
          hapticsEnabled: preferences.hapticsEnabled
        });
      }
    } catch (error) {
      console.error('Voice coaching trigger error:', error);
    }
  }

  /**
   * Determine current workout phase
   */
  private determineWorkoutPhase(metrics: RealTimeMetrics): 'warmup' | 'active' | 'recovery' | 'cooldown' {
    const strain = metrics.strain || 0;
    const sessionDuration = this.getSessionDuration();

    if (sessionDuration < 5 * 60 * 1000) { // First 5 minutes
      return strain > 50 ? 'active' : 'warmup';
    } else if (strain > 70) {
      return 'active';
    } else if (strain < 30) {
      return sessionDuration > 30 * 60 * 1000 ? 'cooldown' : 'recovery';
    } else {
      return 'active';
    }
  }

  /**
   * Process health data for AI insights
   */
  private processHealthData(healthData: HealthData): {
    impactsAI: boolean;
    insights: string[];
  } {
    const insights: string[] = [];
    let impactsAI = false;

    // Analyze heart rate variability
    if (healthData.heartRateVariability) {
      if (healthData.heartRateVariability < 20) {
        insights.push('Low HRV detected - consider recovery focus');
        impactsAI = true;
      }
    }

    // Analyze sleep data
    if (healthData.sleepQuality) {
      if (healthData.sleepQuality < 70) {
        insights.push('Poor sleep quality may impact performance');
        impactsAI = true;
      }
    }

    // Analyze stress levels
    if (healthData.stressLevel) {
      if (healthData.stressLevel > 80) {
        insights.push('High stress detected - gentler coaching recommended');
        impactsAI = true;
      }
    }

    return { impactsAI, insights };
  }

  /**
   * Get session duration in milliseconds
   */
  private getSessionDuration(): number {
    return this.sessionStartTime ? Date.now() - this.sessionStartTime : 0;
  }

  /**
   * Get user preferences from Convex
   */
  private async getUserPreferences(): Promise<AlicePreferences> {
    try {
      // This would typically come from a user context or auth service
      const userId = 'current-user'; // TODO: Get from auth context
      
      const preferences = await api.alice.getUserPreferences.query({ userId });
      
      return preferences || {
        userId,
        voiceCoachingEnabled: true,
        hapticsEnabled: true,
        morphingEnabled: true,
        colorScheme: 'electric_blue',
        coachingIntensity: 'medium',
        autoMorphThreshold: 15,
        voiceVolume: 0.8,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      // Return defaults
      return {
        userId: 'current-user',
        voiceCoachingEnabled: true,
        hapticsEnabled: true,
        morphingEnabled: true,
        colorScheme: 'electric_blue',
        coachingIntensity: 'medium',
        autoMorphThreshold: 15,
        voiceVolume: 0.8,
        lastUpdated: Date.now()
      };
    }
  }

  /**
   * Update Alice state manually
   */
  async updateAliceState(userId: string, updates: Partial<AliceAIState>): Promise<void> {
    try {
      await api.alice.updateState.mutate({
        userId,
        updates: {
          ...updates,
          lastUpdated: Date.now()
        }
      });
    } catch (error) {
      console.error('Failed to update Alice state:', error);
      throw error;
    }
  }

  /**
   * Start workout session
   */
  async startWorkoutSession(userId: string, workoutType: string): Promise<void> {
    this.sessionStartTime = Date.now();
    
    await this.updateAliceState(userId, {
      currentPage: '/workouts',
      isInteractive: true
    });

    console.log('Workout session started for Alice');
  }

  /**
   * End workout session
   */
  async endWorkoutSession(userId: string): Promise<void> {
    const sessionDuration = this.getSessionDuration();
    
    await this.updateAliceState(userId, {
      currentPage: '/',
      isInteractive: false
    });

    this.sessionStartTime = 0;
    this.lastStrain = 0;

    console.log(`Workout session ended. Duration: ${sessionDuration}ms`);
  }

  /**
   * Get current Alice metrics
   */
  getCurrentMetrics(): {
    sessionDuration: number;
    lastStrain: number;
    isActive: boolean;
    subscriptionCount: number;
  } {
    return {
      sessionDuration: this.getSessionDuration(),
      lastStrain: this.lastStrain,
      isActive: this.isActive,
      subscriptionCount: this.subscriptions.size
    };
  }

  /**
   * Cleanup subscriptions
   */
  destroy(): void {
    // Unsubscribe from all subscriptions
    for (const [key, unsubscribe] of this.subscriptions) {
      try {
        unsubscribe();
        console.log(`Unsubscribed from ${key}`);
      } catch (error) {
        console.error(`Error unsubscribing from ${key}:`, error);
      }
    }
    
    this.subscriptions.clear();
    this.isActive = false;
    this.sessionStartTime = 0;
    this.lastStrain = 0;
    
    console.log('Alice data service destroyed');
  }
}

// Create singleton instance
export const aliceDataService = new AliceDataService();

// Export convenience functions
export async function initializeAliceData(userId: string): Promise<void> {
  return aliceDataService.initialize(userId);
}

export async function startAliceWorkout(userId: string, workoutType: string): Promise<void> {
  return aliceDataService.startWorkoutSession(userId, workoutType);
}

export async function endAliceWorkout(userId: string): Promise<void> {
  return aliceDataService.endWorkoutSession(userId);
}

export function getAliceMetrics() {
  return aliceDataService.getCurrentMetrics();
}