// File: offlineNutritionLogger.ts

/**
 * Offline Nutrition Logger
 * Purpose: Allow users to log nutrition data offline using a cached food database.
 */

export interface OfflineNutritionLogger {
  /**
   * Cache the food database for offline use.
   * @param foodDatabase - The food database to cache.
   */
  cacheFoodDatabase(foodDatabase: FoodDatabase): Promise<void>;

  /**
   * Log nutrition data while offline.
   * @param log - The nutrition log entry.
   */
  logOfflineData(log: NutritionLog): Promise<void>;

  /**
   * Sync offline logs with the server when online.
   */
  syncOfflineLogs(): Promise<void>;
}

// Define the types used in the interface
export interface FoodDatabase {
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

export interface NutritionLog {
  date: string;
  foodName: string;
  servingSize: string;
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fats: number; // in grams
}
