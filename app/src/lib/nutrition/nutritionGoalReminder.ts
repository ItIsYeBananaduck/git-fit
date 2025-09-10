// File: nutritionGoalReminder.ts

/**
 * Nutrition Goal Reminder System
 * Purpose: Send reminders and suggestions when nutrition goals are missed.
 */

export interface NutritionGoalReminder {
  /**
   * Set daily nutrition goals for the user.
   * @param goals - The user's nutrition goals.
   */
  setDailyGoals(goals: NutritionGoals): Promise<void>;

  /**
   * Check if the user has met their daily nutrition goals.
   * @param log - The user's daily nutrition log.
   */
  checkGoals(log: NutritionLog): GoalStatus;

  /**
   * Send reminders to the user if goals are not met.
   * @param status - The status of the user's goals.
   */
  sendReminder(status: GoalStatus): Promise<void>;
}

// Define the types used in the interface
export interface NutritionGoals {
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fats: number; // in grams
}

export interface NutritionLog {
  date: string;
  totalCalories: number;
  totalProtein: number; // in grams
  totalCarbs: number; // in grams
  totalFats: number; // in grams
}

export interface GoalStatus {
  met: boolean;
  unmetGoals: string[]; // List of unmet goals (e.g., ['calories', 'protein'])
}
