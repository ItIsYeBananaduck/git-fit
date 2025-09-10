// File: nutritionPlanManager.ts

/**
 * Nutrition Plan Manager
 * Purpose: Import and export nutrition plans in CSV and Excel formats.
 */

export interface NutritionPlanManager {
  /**
   * Import a nutrition plan from a file.
   * @param file - The file containing the nutrition plan.
   */
  importPlan(file: File): Promise<NutritionPlan>;

  /**
   * Export the user's nutrition plan to a file.
   * @param plan - The nutrition plan to export.
   * @param format - The file format (CSV or Excel).
   */
  exportPlan(plan: NutritionPlan, format: 'csv' | 'excel'): Promise<File>;

  /**
   * Validate the imported nutrition plan.
   * @param plan - The nutrition plan to validate.
   */
  validatePlan(plan: NutritionPlan): ValidationResult;
}

// Define the types used in the interface
export interface NutritionPlan {
  name: string;
  meals: Meal[];
  dailyMacros: Macronutrients;
}

export interface Meal {
  name: string;
  foods: FoodData[];
}

export interface FoodData {
  name: string;
  calories: number;
  macronutrients: Macronutrients;
  servingSize: string;
}

export interface Macronutrients {
  protein: number; // in grams
  carbs: number; // in grams
  fats: number; // in grams
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[]; // List of validation errors
}
