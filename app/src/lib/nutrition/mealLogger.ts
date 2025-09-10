// File: mealLogger.ts

/**
 * Meal Logger with Camera
 * Purpose: Log meals by taking photos using the device camera.
 */

export interface MealLogger {
  /**
   * Initialize the camera for meal logging.
   */
  initializeCamera(): Promise<void>;

  /**
   * Capture a photo of the meal.
   */
  captureMealPhoto(): Promise<MealPhoto>;

  /**
   * Analyze the meal photo to extract food data.
   * @param photo - The captured meal photo.
   */
  analyzeMealPhoto(photo: MealPhoto): Promise<FoodData[]>;

  /**
   * Log the analyzed food data to the user's nutrition log.
   * @param foodData - The food data extracted from the photo.
   */
  logMealData(foodData: FoodData[]): Promise<void>;
}

// Define the types used in the interface
export interface MealPhoto {
  photoId: string;
  photoUrl: string;
  timestamp: string;
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
