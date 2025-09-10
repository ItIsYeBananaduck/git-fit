// File: barcodeScanner.ts

/**
 * Barcode Scanner for Nutrition Logging
 * Purpose: Scan food barcodes and log nutrition data.
 */

export interface BarcodeScanner {
  /**
   * Initialize the barcode scanner.
   */
  initializeScanner(): Promise<void>;

  /**
   * Scan a barcode and retrieve food data.
   * @param barcode - The scanned barcode value.
   */
  scanBarcode(barcode: string): Promise<FoodData>;

  /**
   * Validate the scanned barcode.
   * @param barcode - The scanned barcode value.
   */
  validateBarcode(barcode: string): boolean;

  /**
   * Log the scanned food data to the user's nutrition log.
   * @param foodData - The food data retrieved from the barcode.
   */
  logFoodData(foodData: FoodData): Promise<void>;
}

// Define the types used in the interface
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
