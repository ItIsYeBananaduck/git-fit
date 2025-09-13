import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

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

/**
 * Widget service for managing home screen widgets
 */
export class WidgetService {
  private static instance: WidgetService;
  private isNative = Capacitor.isNativePlatform();

  private constructor() {}

  public static getInstance(): WidgetService {
    if (!WidgetService.instance) {
      WidgetService.instance = new WidgetService();
    }
    return WidgetService.instance;
  }

  /**
   * Update widget with simplified data
   */
  public async updateWidget(
    status: string,
    compositeScore: number,
    nextWorkout?: string,
    intensity: string = 'High'
  ): Promise<boolean> {
    if (!this.isNative) {
      console.log('Widget update skipped - not on native platform');
      return false;
    }

    try {
      const result = await Widget.updateWidget({
        status,
        compositeScore,
        nextWorkout,
        intensity
      });
      return result.success;
    } catch (error) {
      console.error('Failed to update widget:', error);
      return false;
    }
  }

  /**
   * Update widget with full assessment result
   */
  public async updateWidgetWithAssessment(assessment: StrainAssessmentResult): Promise<boolean> {
    if (!this.isNative) {
      console.log('Widget update skipped - not on native platform');
      return false;
    }

    try {
      const result = await Widget.updateWidgetWithAssessment({
        assessment
      });
      return result.success;
    } catch (error) {
      console.error('Failed to update widget with assessment:', error);
      return false;
    }
  }

  /**
   * Clear widget data
   */
  public async clearWidget(): Promise<boolean> {
    if (!this.isNative) {
      console.log('Widget clear skipped - not on native platform');
      return false;
    }

    try {
      const result = await Widget.clearWidget();
      return result.success;
    } catch (error) {
      console.error('Failed to clear widget:', error);
      return false;
    }
  }

  /**
   * Check if widget functionality is available
   */
  public isAvailable(): boolean {
    return this.isNative;
  }
}

// Export singleton instance
export const widgetService = WidgetService.getInstance();