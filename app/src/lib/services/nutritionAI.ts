/**
 * Enhanced Nutrition AI Service for SvelteKit Frontend
 * Provides interface to nutrition AI recommendations, safety monitoring, and analytics
 */

export interface HealthProfile {
  medical_conditions: string[];
  allergies: string[];
  medications: Array<{
    name: string;
    dosage?: string;
    nutritionInteractions?: string[];
    timingRestrictions?: string;
  }>;
  safety_flags: {
    diabetesFlag: boolean;
    heartConditionFlag: boolean;
    kidneyIssueFlag: boolean;
    digestiveIssueFlag: boolean;
    eatingDisorderHistory: boolean;
  };
  metabolic_data: {
    basalMetabolicRate?: number;
    totalDailyEnergyExpenditure?: number;
    metabolicFlexibility?: number;
    insulinSensitivity?: number;
  };
  body_weight_kg?: number;
}

export interface RecoveryData {
  date?: string;
  hrv_score?: number;
  resting_heart_rate?: number;
  sleep_quality?: number;
  sleep_duration?: number;
  stress_level?: number;
  hydration_status?: number;
  recovery_score: number;
  source?: string;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  hydration?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface NutritionIntake {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  hydration?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface NutritionRecommendation {
  recommendation_type: string;
  title: string;
  description: string;
  action: string;
  target_value?: number;
  target_unit?: string;
  priority: string;
  reasoning: {
    recovery_score?: number;
    hrv_trend?: string;
    deficit_days?: number;
    workout_intensity?: string;
    medical_considerations?: string[];
  };
  confidence: number;
  safety_checked: boolean;
  expires_at?: number;
  fallback?: boolean;
}

export interface HydrationRecommendation {
  time: string;
  amount: number;
  reason: string;
  priority: string;
  completed: boolean;
}

export interface SafetyAlert {
  type: string;
  severity: string;
  message: string;
  action_required: boolean;
}

export interface NutritionInsights {
  user_id: string;
  period_days: number;
  insights: {
    recommendation_acceptance_rate: number;
    most_accepted_type: string;
    improvement_areas: string[];
    safety_alerts_count: number;
    recovery_nutrition_effectiveness: number;
  };
  trends: {
    protein_adherence: number[];
    hydration_adherence: number[];
    recovery_scores: number[];
  };
  recommendations_summary: {
    total_generated: number;
    total_accepted: number;
    modification_rate: number;
    active_recommendations: number;
  };
  fallback?: boolean;
}

export class EnhancedNutritionService {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://technically-fit-ai.fly.dev') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get personalized nutrition recommendations based on health profile and recovery data
   */
  async getNutritionRecommendations(
    userId: string,
    healthData: HealthProfile,
    recoveryData: RecoveryData,
    currentIntake: NutritionIntake,
    goals: NutritionGoals
  ): Promise<{
    success: boolean;
    recommendations: NutritionRecommendation[];
    adjusted_goals: NutritionGoals;
    adjustments_made: string[];
    safety_alerts: SafetyAlert[];
    recovery_score: number;
    ai_model_version: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/nutrition/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          health_data: healthData,
          recovery_data: recoveryData,
          current_intake: currentIntake,
          goals: goals,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching nutrition recommendations:', error);
      return {
        success: false,
        recommendations: [],
        adjusted_goals: goals,
        adjustments_made: [],
        safety_alerts: [],
        recovery_score: recoveryData.recovery_score,
        ai_model_version: 'fallback',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process user feedback on nutrition recommendations
   */
  async provideFeedback(
    userId: string,
    recommendationId: string,
    feedback: {
      accepted: boolean;
      implemented: boolean;
      feedback?: string;
      modified_value?: number;
    }
  ): Promise<{
    success: boolean;
    feedback_recorded: boolean;
    learning_updated: boolean;
    message: string;
    fallback?: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/nutrition/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          recommendation_id: recommendationId,
          feedback: feedback,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error providing nutrition feedback:', error);
      return {
        success: false,
        feedback_recorded: false,
        learning_updated: false,
        message: 'Failed to record feedback',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get nutrition insights and analytics for the user
   */
  async getNutritionInsights(
    userId: string,
    days: number = 7
  ): Promise<NutritionInsights & { error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/nutrition/insights/${userId}?days=${days}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching nutrition insights:', error);
      return {
        user_id: userId,
        period_days: days,
        insights: {
          recommendation_acceptance_rate: 0,
          most_accepted_type: 'hydration',
          improvement_areas: ['data_collection'],
          safety_alerts_count: 0,
          recovery_nutrition_effectiveness: 0,
        },
        trends: {
          protein_adherence: [],
          hydration_adherence: [],
          recovery_scores: [],
        },
        recommendations_summary: {
          total_generated: 0,
          total_accepted: 0,
          modification_rate: 0,
          active_recommendations: 0,
        },
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get personalized hydration recommendations
   */
  async getHydrationRecommendations(
    userId: string,
    recoveryData: RecoveryData,
    currentIntake: number,
    targetIntake: number
  ): Promise<{
    success: boolean;
    hydration_recommendations: HydrationRecommendation[];
    total_remaining: number;
    recovery_boost_needed: boolean;
    recovery_score: number;
    fallback?: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/nutrition/hydration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          recovery_data: recoveryData,
          current_intake: currentIntake,
          target_intake: targetIntake,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching hydration recommendations:', error);
      const remaining = Math.max(0, targetIntake - currentIntake);
      return {
        success: false,
        hydration_recommendations: [
          {
            time: 'now',
            amount: Math.min(0.5, remaining),
            reason: 'general_hydration',
            priority: 'medium',
            completed: false,
          },
        ],
        total_remaining: remaining,
        recovery_boost_needed: false,
        recovery_score: recoveryData.recovery_score,
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Perform a quick nutrition safety check
   */
  async performSafetyCheck(
    userId: string,
    bodyWeightKg: number = 70,
    medicalConditions: string[] = []
  ): Promise<{
    success: boolean;
    user_id: string;
    safety_alerts: SafetyAlert[];
    overall_safety: string;
    checked_intake: NutritionIntake;
    body_weight_kg: number;
    medical_conditions: string[];
    fallback_mode?: boolean;
    error?: string;
  }> {
    try {
      const conditionsStr = medicalConditions.join(',');
      const response = await fetch(
        `${this.baseUrl}/nutrition/safety-check/${userId}?body_weight_kg=${bodyWeightKg}&medical_conditions=${encodeURIComponent(conditionsStr)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error performing safety check:', error);
      return {
        success: false,
        user_id: userId,
        safety_alerts: [],
        overall_safety: 'unknown',
        checked_intake: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
        body_weight_kg: bodyWeightKg,
        medical_conditions: medicalConditions,
        fallback_mode: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Helper function to create health profile from user data
   */
  createHealthProfile(userData: {
    medicalConditions?: string[];
    allergies?: string[];
    medications?: Array<any>;
    bodyWeight?: number;
    hasConditions?: {
      diabetes?: boolean;
      heartCondition?: boolean;
      kidneyIssues?: boolean;
      digestiveIssues?: boolean;
      eatingDisorderHistory?: boolean;
    };
  }): HealthProfile {
    return {
      medical_conditions: userData.medicalConditions || [],
      allergies: userData.allergies || [],
      medications: userData.medications || [],
      safety_flags: {
        diabetesFlag: userData.hasConditions?.diabetes || false,
        heartConditionFlag: userData.hasConditions?.heartCondition || false,
        kidneyIssueFlag: userData.hasConditions?.kidneyIssues || false,
        digestiveIssueFlag: userData.hasConditions?.digestiveIssues || false,
        eatingDisorderHistory: userData.hasConditions?.eatingDisorderHistory || false,
      },
      metabolic_data: {},
      body_weight_kg: userData.bodyWeight,
    };
  }

  /**
   * Helper function to create recovery data from wearable/user input
   */
  createRecoveryData(data: {
    date?: string;
    hrv?: number;
    restingHR?: number;
    sleepQuality?: number;
    sleepHours?: number;
    stressLevel?: number;
    hydrationLevel?: number;
    overallRecovery?: number;
    source?: string;
  }): RecoveryData {
    return {
      date: data.date || new Date().toISOString().split('T')[0],
      hrv_score: data.hrv,
      resting_heart_rate: data.restingHR,
      sleep_quality: data.sleepQuality,
      sleep_duration: data.sleepHours,
      stress_level: data.stressLevel,
      hydration_status: data.hydrationLevel,
      recovery_score: data.overallRecovery || 50,
      source: data.source || 'manual',
    };
  }

  /**
   * Helper function to format recommendations for display
   */
  formatRecommendationForDisplay(rec: NutritionRecommendation): {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionText: string;
    confidence: string;
    safetyChecked: boolean;
    expiresIn?: string;
  } {
    const priorityMap = {
      high: 'high' as const,
      medium: 'medium' as const,
      low: 'low' as const,
    };

    let expiresIn: string | undefined;
    if (rec.expires_at) {
      const hoursUntilExpiry = Math.ceil((rec.expires_at * 1000 - Date.now()) / (1000 * 60 * 60));
      expiresIn = hoursUntilExpiry > 0 ? `${hoursUntilExpiry}h` : 'Expired';
    }

    return {
      title: rec.title,
      description: rec.description,
      priority: priorityMap[rec.priority as keyof typeof priorityMap] || 'medium',
      actionText: this.formatActionText(rec),
      confidence: `${Math.round(rec.confidence * 100)}%`,
      safetyChecked: rec.safety_checked,
      expiresIn,
    };
  }

  private formatActionText(rec: NutritionRecommendation): string {
    if (rec.target_value && rec.target_unit) {
      return `${rec.action.replace(/_/g, ' ')}: ${rec.target_value}${rec.target_unit}`;
    }
    return rec.action.replace(/_/g, ' ');
  }

  /**
   * Helper function to determine if user needs immediate attention
   */
  requiresImmediateAttention(safetyAlerts: SafetyAlert[]): boolean {
    return safetyAlerts.some(alert => 
      alert.severity === 'critical' && alert.action_required
    );
  }

  /**
   * Helper function to get priority color for UI
   */
  getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }

  /**
   * Helper function to get severity color for alerts
   */
  getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  }
}

// Create a singleton instance
export const nutritionService = new EnhancedNutritionService();