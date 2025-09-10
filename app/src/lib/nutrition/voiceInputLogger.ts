// File: voiceInputLogger.ts

/**
 * Voice Input Logger
 * Purpose: Enable hands-free nutrition logging using voice input.
 */

export interface VoiceInputLogger {
  /**
   * Initialize the voice input system.
   */
  initializeVoiceInput(): Promise<void>;

  /**
   * Start listening for voice input.
   */
  startListening(): Promise<void>;

  /**
   * Process the voice input and extract nutrition data.
   * @param input - The voice input as text.
   */
  processVoiceInput(input: string): Promise<NutritionLog>;

  /**
   * Log the extracted nutrition data.
   * @param log - The nutrition log entry.
   */
  logNutritionData(log: NutritionLog): Promise<void>;
}

// Define the types used in the interface
export interface NutritionLog {
  date: string;
  foodName: string;
  servingSize: string;
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fats: number; // in grams
}
