/**
 * Enhanced AI Coaching Integration
 * Handles communication with the enhanced AI backend for personalized workout recommendations
 */

import { ConvexError } from "convex/values";

export interface WorkoutContext {
  time_of_day: 'morning' | 'afternoon' | 'evening';
  day_of_week: number; // 1-7, where 1 is Monday
  user_energy?: number; // 1-10 scale
  user_motivation?: number; // 1-10 scale
  available_time?: number; // minutes
  equipment_availability?: string[];
  gym_crowding?: 'low' | 'medium' | 'high';
  previous_performance?: {
    last_workout_quality: number;
    recent_progression: 'increasing' | 'stable' | 'decreasing';
    recovery_status: 'fresh' | 'normal' | 'tired';
  };
  wearable_data?: {
    heart_rate_variability?: number;
    sleep_quality?: number;
    stress_level?: number;
  };
}

export interface ExerciseData {
  exercise_name: string;
  planned_sets: number;
  planned_reps: number;
  planned_weight: number;
  current_set: number;
  planned_value?: any;
}

export interface AIRecommendation {
  id: string;
  type: 'increase_weight' | 'decrease_weight' | 'adjust_reps' | 'modify_rest' | 'change_exercise' | 'add_warmup' | 'suggest_form_focus';
  original_value: number;
  suggested_value: number;
  confidence: number;
  reasoning: string;
  factors: string[];
  expected_outcome: string;
  risk_assessment: 'low' | 'medium' | 'high';
  alternative_options?: Array<{
    type: string;
    value: number;
    reasoning: string;
  }>;
}

export interface FeedbackData {
  user_id: string;
  tweak_id: string;
  feedback: {
    accepted: boolean;
    modified: boolean;
    skipped: boolean;
    difficulty_rating?: number; // 1-10
    effectiveness_rating?: number; // 1-10
    custom_adjustment?: any;
    completion_time?: number;
    perceived_exertion?: number; // 1-10 RPE scale
    form_quality?: number; // 1-10
    notes?: string;
  };
}

export interface UserInsights {
  preference_summary: {
    preferred_intensity: number;
    volume_tolerance: number;
    progression_rate: number;
    workout_style: string;
  };
  performance_trends: {
    acceptance_rate: number;
    improvement_rate: number;
    consistency_score: number;
    weak_areas: string[];
    strong_areas: string[];
  };
  ai_effectiveness: {
    recommendation_accuracy: number;
    user_satisfaction: number;
    personalization_level: number;
  };
  next_focus_areas: string[];
}

class AICoachingService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to localhost for development
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  }

  /**
   * Get personalized AI recommendation for a specific exercise/context
   */
  async getRecommendation(
    userId: string, 
    exerciseData: ExerciseData, 
    context: WorkoutContext,
    eventType: string = 'exercise_start'
  ): Promise<AIRecommendation> {
    try {
      const response = await fetch(`${this.baseUrl}/recommendation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          exercise_data: exerciseData,
          context: context,
          event_type: eventType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get recommendation');
      }

      return data.recommendation;
    } catch (error) {
      console.error('Error getting AI recommendation:', error);
      throw new ConvexError(`AI recommendation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send user feedback about a recommendation
   */
  async provideFeedback(feedbackData: FeedbackData): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to process feedback');
      }

    } catch (error) {
      console.error('Error providing feedback:', error);
      throw new ConvexError(`Feedback submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get comprehensive insights about user preferences and AI performance
   */
  async getUserInsights(userId: string): Promise<UserInsights> {
    try {
      const response = await fetch(`${this.baseUrl}/user/${userId}/insights`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get insights');
      }

      return data.insights;
    } catch (error) {
      console.error('Error getting user insights:', error);
      throw new ConvexError(`Insights retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user preference profile
   */
  async getUserProfile(userId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/user/${userId}/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get profile');
      }

      return data.profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new ConvexError(`Profile retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Legacy event handler for backward compatibility
   */
  async handleEvent(
    userId: string,
    eventType: string,
    userData: any,
    context: any
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          event: eventType,
          user_data: userData,
          context: context
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error handling event:', error);
      throw new ConvexError(`Event handling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const aiCoaching = new AICoachingService();

// Helper functions for common use cases
export const getWorkoutContext = (): WorkoutContext => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Convert Sunday from 0 to 7

  let time_of_day: 'morning' | 'afternoon' | 'evening';
  if (hour < 12) {
    time_of_day = 'morning';
  } else if (hour < 17) {
    time_of_day = 'afternoon';
  } else {
    time_of_day = 'evening';
  }

  return {
    time_of_day,
    day_of_week: dayOfWeek,
    user_energy: undefined, // Will be filled by user input or wearable data
    user_motivation: undefined,
    available_time: undefined,
    equipment_availability: [],
    gym_crowding: 'medium'
  };
};

export const createExerciseData = (
  exerciseName: string,
  plannedSets: number,
  plannedReps: number,
  plannedWeight: number,
  currentSet: number = 1
): ExerciseData => ({
  exercise_name: exerciseName,
  planned_sets: plannedSets,
  planned_reps: plannedReps,
  planned_weight: plannedWeight,
  current_set: currentSet
});

export const createFeedback = (
  userId: string,
  tweakId: string,
  accepted: boolean,
  options?: {
    modified?: boolean;
    skipped?: boolean;
    difficultyRating?: number;
    effectivenessRating?: number;
    customAdjustment?: any;
    completionTime?: number;
    perceivedExertion?: number;
    formQuality?: number;
    notes?: string;
  }
): FeedbackData => ({
  user_id: userId,
  tweak_id: tweakId,
  feedback: {
    accepted,
    modified: options?.modified || false,
    skipped: options?.skipped || false,
    difficulty_rating: options?.difficultyRating,
    effectiveness_rating: options?.effectivenessRating,
    custom_adjustment: options?.customAdjustment,
    completion_time: options?.completionTime,
    perceived_exertion: options?.perceivedExertion,
    form_quality: options?.formQuality,
    notes: options?.notes
  }
});