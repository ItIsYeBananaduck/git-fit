// Widget service for iOS and Android home screen widgets
// Provides interface to update strain assessment data on widgets

import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

export interface StrainWidgetData {
  status: 'ready' | 'moderate' | 'compromised' | 'high_risk';
  compositeScore: number;
  nextWorkout?: string;
  intensity: string;
}

export interface WidgetUpdateResult {
  success: boolean;
  message: string;
}

export interface WidgetPlugin {
  /**
   * Update the widget with strain assessment data
   */
  updateWidget(options: {
    status: string;
    compositeScore: number;
    nextWorkout?: string;
    intensity: string;
  }): Promise<{ success: boolean }>;

  /**
   * Clear all widget data
   */
  clearWidget(): Promise<{ success: boolean }>;

  /**
   * Update widget with full assessment result
   */
  updateWidgetWithAssessment(options: {
    assessment: StrainAssessmentResult;
  }): Promise<{ success: boolean }>;
}

export interface StrainAssessmentResult {
  overallStatus: string;
  compositeScore: number;
  zones?: StrainZones;
  deltas?: StrainDeltas;
  healthAlerts?: HealthAlert[];
  trainingRecommendation?: TrainingRecommendation;
  confidence: number;
  timestamp: number;
}

export interface StrainZones {
  hrZone: TrafficLight;
  spo2Zone: TrafficLight;
}

export interface StrainDeltas {
  hrDelta: number;
  spo2Delta: number;
  hrvDelta: number;
}

export interface HealthAlert {
  message: string;
  severity: AlertSeverity;
  requiresAttention: boolean;
  recommendation: string;
}

export interface TrainingRecommendation {
  status: RecommendationStatus;
  reasoning: string;
  modifications: string[];
  loadReductionPercent?: number;
  alternativeActivities?: string[];
}

export enum TrafficLight {
  GREEN = 'green',
  YELLOW = 'yellow',
  ORANGE = 'orange',
  RED = 'red'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum RecommendationStatus {
  NORMAL = 'normal',
  REDUCE_LOAD = 'reduce_load',
  REST = 'rest'
}

const Widget = registerPlugin<WidgetPlugin>('Widget');

class WidgetService {
  private isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Update the strain assessment widget with new data
   */
  async updateStrainWidget(data: StrainWidgetData): Promise<WidgetUpdateResult> {
    if (!this.isNativePlatform()) {
      console.log('Widget update (web mode):', data);
      return {
        success: false,
        message: 'Widget functionality only available on iOS/Android native apps'
      };
    }

    try {
      // Call native widget update through Capacitor bridge
      const result = await Widget.updateWidget({
        status: data.status,
        compositeScore: data.compositeScore,
        nextWorkout: data.nextWorkout,
        intensity: data.intensity
      });

      return {
        success: result.success,
        message: result.success ? 'Widget updated successfully' : 'Widget update failed'
      };
    } catch (error) {
      console.error('Failed to update widget:', error);
      return {
        success: false,
        message: `Widget update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Clear all widget data
   */
  async clearWidgetData(): Promise<WidgetUpdateResult> {
    if (!this.isNativePlatform()) {
      console.log('Widget clear (web mode)');
      return {
        success: false,
        message: 'Widget functionality only available on iOS/Android native apps'
      };
    }

    try {
      const result = await Widget.clearWidget();
      return {
        success: result.success,
        message: result.success ? 'Widget data cleared successfully' : 'Widget clear failed'
      };
    } catch (error) {
      console.error('Failed to clear widget data:', error);
      return {
        success: false,
        message: `Widget clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update widget with strain assessment data
   * Convenience method that formats strain assessment data for widgets
   */
  async updateWithStrainAssessment(
    overallStatus: 'ready' | 'moderate' | 'compromised' | 'high_risk',
    compositeScore: number,
    trainingRecommendation?: {
      reasoning: string;
      modifications: string[];
      status: string;
      loadReductionPercent?: number;
      alternativeActivities?: string[];
    },
    nextWorkout?: string
  ): Promise<WidgetUpdateResult> {
    const widgetData: StrainWidgetData = {
      status: overallStatus,
      compositeScore,
      nextWorkout: nextWorkout || this.extractWorkoutFromRecommendation(trainingRecommendation),
      intensity: this.calculateIntensity(overallStatus, trainingRecommendation)
    };

    return this.updateStrainWidget(widgetData);
  }

  /**
   * Update widget with full assessment result
   */
  async updateWidgetWithAssessment(assessment: StrainAssessmentResult): Promise<WidgetUpdateResult> {
    if (!this.isNativePlatform()) {
      console.log('Widget update (web mode):', assessment);
      return {
        success: false,
        message: 'Widget functionality only available on iOS/Android native apps'
      };
    }

    try {
      const result = await Widget.updateWidgetWithAssessment({
        assessment
      });

      return {
        success: result.success,
        message: result.success ? 'Widget updated with assessment successfully' : 'Widget update failed'
      };
    } catch (error) {
      console.error('Failed to update widget with assessment:', error);
      return {
        success: false,
        message: `Widget update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private extractWorkoutFromRecommendation(
    recommendation?: { reasoning: string; modifications: string[]; status: string }
  ): string | undefined {
    if (!recommendation) return undefined;

    // Extract workout info from recommendation reasoning
    const reasoning = recommendation.reasoning.toLowerCase();
    if (reasoning.includes('push')) return 'Push Day';
    if (reasoning.includes('pull')) return 'Pull Day';
    if (reasoning.includes('legs')) return 'Leg Day';
    if (reasoning.includes('rest')) return 'Rest Day';

    return undefined;
  }

  private calculateIntensity(
    status: string,
    recommendation?: { status: string; loadReductionPercent?: number }
  ): string {
    if (status === 'high_risk') return 'Rest';
    if (status === 'compromised') return 'Light';
    if (status === 'moderate') return 'Moderate';

    // Check for load reduction
    if (recommendation?.loadReductionPercent && recommendation.loadReductionPercent > 20) {
      return 'Light';
    } else if (recommendation?.loadReductionPercent && recommendation.loadReductionPercent > 10) {
      return 'Moderate';
    }

    return 'High';
  }
}

// Export singleton instance
export const widgetService = new WidgetService();
export default widgetService;