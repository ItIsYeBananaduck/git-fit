import { z } from 'zod';

/**
 * Food verification status type
 */
export type FoodVerificationStatus = 'pending' | 'verified' | 'flagged' | 'rejected' | 'user_override';

/**
 * AI validation result interface
 */
export interface AIValidationResult {
  isValid: boolean;
  confidence: number; // 0-1 scale
  outliers: string[]; // List of fields that seem unusual
  suggestions: string[]; // AI suggestions for corrections
  similarFoods: Array<{
    name: string;
    similarity: number;
    nutritionalData: NutritionalData;
  }>;
  validatedAt: string;
  validationVersion: string; // AI model version used
}

/**
 * Nutritional data interface
 */
export interface NutritionalData {
  calories: number; // per 100g
  protein: number; // grams per 100g
  carbohydrates: number; // grams per 100g
  fat: number; // grams per 100g
  fiber?: number; // grams per 100g
  sugar?: number; // grams per 100g
  sodium?: number; // mg per 100g
  calcium?: number; // mg per 100g
  iron?: number; // mg per 100g
  vitaminC?: number; // mg per 100g
  vitaminD?: number; // mcg per 100g
}

/**
 * User verification override interface
 */
export interface UserOverride {
  userId: string;
  reason: string;
  overriddenAt: string;
  originalAIResult: AIValidationResult;
  manualVerification: boolean;
  notes?: string;
}

/**
 * Food source information
 */
export interface FoodSource {
  type: 'user_created' | 'imported' | 'database_match';
  sourceId?: string; // external database ID if imported
  sourceName?: string; // external database name
  sourceUrl?: string;
  importedAt?: string;
  lastSyncedAt?: string;
}

/**
 * Custom food interface
 */
export interface CustomFood {
  _id?: string;
  userId: string;
  name: string;
  brand?: string;
  category: string;
  nutritionalData: NutritionalData;
  servingSize: {
    amount: number;
    unit: string; // 'g', 'ml', 'piece', 'cup', etc.
  };
  barcode?: string;
  verificationStatus: FoodVerificationStatus;
  aiValidation?: AIValidationResult;
  userOverride?: UserOverride;
  source: FoodSource;
  tags: string[];
  isPublic: boolean; // Whether other users can see this food
  usageCount: number; // How many times user has logged this food
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

/**
 * Data interface for creating/updating custom foods
 */
interface CustomFoodData extends CustomFood {
  // Additional internal fields
  flagReasons?: string[];
  moderationNotes?: string;
  reportCount?: number; // Number of times this food has been reported
  lastModerationAt?: string;
  similarityHash?: string; // For duplicate detection
}

/**
 * Validation schemas
 */
const NutritionalDataSchema = z.object({
  calories: z.number().min(0).max(9000, 'Calories per 100g seems unrealistic'),
  protein: z.number().min(0).max(100, 'Protein content cannot exceed 100g per 100g'),
  carbohydrates: z.number().min(0).max(100, 'Carbohydrates content cannot exceed 100g per 100g'),
  fat: z.number().min(0).max(100, 'Fat content cannot exceed 100g per 100g'),
  fiber: z.number().min(0).max(100).optional(),
  sugar: z.number().min(0).max(100).optional(),
  sodium: z.number().min(0).max(50000).optional(), // mg per 100g
  calcium: z.number().min(0).max(10000).optional(), // mg per 100g
  iron: z.number().min(0).max(1000).optional(), // mg per 100g
  vitaminC: z.number().min(0).max(2000).optional(), // mg per 100g
  vitaminD: z.number().min(0).max(1000).optional() // mcg per 100g
});

const AIValidationResultSchema = z.object({
  isValid: z.boolean(),
  confidence: z.number().min(0).max(1),
  outliers: z.array(z.string()),
  suggestions: z.array(z.string()),
  similarFoods: z.array(z.object({
    name: z.string(),
    similarity: z.number().min(0).max(1),
    nutritionalData: NutritionalDataSchema
  })),
  validatedAt: z.string().datetime(),
  validationVersion: z.string()
});

const UserOverrideSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(1),
  overriddenAt: z.string().datetime(),
  originalAIResult: AIValidationResultSchema,
  manualVerification: z.boolean(),
  notes: z.string().optional()
});

const FoodSourceSchema = z.object({
  type: z.enum(['user_created', 'imported', 'database_match']),
  sourceId: z.string().optional(),
  sourceName: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  importedAt: z.string().datetime().optional(),
  lastSyncedAt: z.string().datetime().optional()
});

const CustomFoodDataSchema = z.object({
  _id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Food name is required').max(100, 'Food name too long'),
  brand: z.string().max(50).optional(),
  category: z.string().min(1, 'Category is required'),
  nutritionalData: NutritionalDataSchema,
  servingSize: z.object({
    amount: z.number().min(0.1, 'Serving size must be positive'),
    unit: z.string().min(1, 'Serving unit is required')
  }),
  barcode: z.string().regex(/^\d{8,13}$/, 'Invalid barcode format').optional(),
  verificationStatus: z.enum(['pending', 'verified', 'flagged', 'rejected', 'user_override']),
  aiValidation: AIValidationResultSchema.optional(),
  userOverride: UserOverrideSchema.optional(),
  source: FoodSourceSchema,
  tags: z.array(z.string()),
  isPublic: z.boolean(),
  usageCount: z.number().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastUsedAt: z.string().datetime().optional(),
  flagReasons: z.array(z.string()).optional(),
  moderationNotes: z.string().optional(),
  reportCount: z.number().min(0).optional(),
  lastModerationAt: z.string().datetime().optional(),
  similarityHash: z.string().optional()
});

/**
 * CustomFoodEntity class with AI validation and outlier detection
 */
export class CustomFoodEntity {
  private data: CustomFoodData;

  constructor(data: CustomFoodData) {
    // Validate input data
    const validationResult = CustomFoodDataSchema.safeParse(data);
    if (!validationResult.success) {
      throw new Error(`Invalid custom food data: ${JSON.stringify((validationResult as { error: { issues: unknown[] } }).error.issues)}`);
    }

    this.data = {
      ...data,
      tags: data.tags || [],
      usageCount: data.usageCount || 0,
      reportCount: data.reportCount || 0
    };
  }

  // Getters for basic properties
  get id(): string | undefined { return this.data._id; }
  get userId(): string { return this.data.userId; }
  get name(): string { return this.data.name; }
  get brand(): string | undefined { return this.data.brand; }
  get category(): string { return this.data.category; }
  get nutritionalData(): NutritionalData { return this.data.nutritionalData; }
  get servingSize(): CustomFoodData['servingSize'] { return this.data.servingSize; }
  get barcode(): string | undefined { return this.data.barcode; }
  get verificationStatus(): FoodVerificationStatus { return this.data.verificationStatus; }
  get aiValidation(): AIValidationResult | undefined { return this.data.aiValidation; }
  get userOverride(): UserOverride | undefined { return this.data.userOverride; }
  get source(): FoodSource { return this.data.source; }
  get tags(): string[] { return this.data.tags; }
  get isPublic(): boolean { return this.data.isPublic; }
  get usageCount(): number { return this.data.usageCount; }
  get createdAt(): string { return this.data.createdAt; }
  get updatedAt(): string { return this.data.updatedAt; }
  get lastUsedAt(): string | undefined { return this.data.lastUsedAt; }
  get reportCount(): number { return this.data.reportCount || 0; }

  /**
   * Check if food is verified and safe to use
   */
  isVerified(): boolean {
    return this.data.verificationStatus === 'verified' || 
           this.data.verificationStatus === 'user_override';
  }

  /**
   * Check if food has been flagged by AI or users
   */
  isFlagged(): boolean {
    return this.data.verificationStatus === 'flagged' ||
           ((this.data.reportCount || 0) > 2);
  }

  /**
   * Perform AI validation on nutritional data
   */
  async performAIValidation(aiValidationService: AIValidationService): Promise<AIValidationResult> {
    const result = await aiValidationService.validateFood({
      name: this.data.name,
      category: this.data.category,
      nutritionalData: this.data.nutritionalData,
      servingSize: this.data.servingSize
    });

    this.data.aiValidation = result;
    this.data.updatedAt = new Date().toISOString();

    // Update verification status based on AI result
    if (result.isValid && result.confidence > 0.8) {
      this.data.verificationStatus = 'verified';
    } else if (result.confidence < 0.5 || result.outliers.length > 2) {
      this.data.verificationStatus = 'flagged';
      this.data.flagReasons = result.outliers;
    } else {
      this.data.verificationStatus = 'pending';
    }

    return result;
  }

  /**
   * Apply user override to bypass AI validation
   */
  applyUserOverride(userId: string, reason: string, manualVerification: boolean, notes?: string): void {
    if (!this.data.aiValidation) {
      throw new Error('Cannot apply override without AI validation');
    }

    if (this.data.userId !== userId) {
      throw new Error('Only food creator can apply override');
    }

    this.data.userOverride = {
      userId,
      reason,
      overriddenAt: new Date().toISOString(),
      originalAIResult: this.data.aiValidation,
      manualVerification,
      notes
    };

    this.data.verificationStatus = 'user_override';
    this.data.updatedAt = new Date().toISOString();
  }

  /**
   * Update nutritional data and re-validate
   */
  updateNutritionalData(newData: NutritionalData): void {
    // Validate the new nutritional data
    const validationResult = NutritionalDataSchema.safeParse(newData);
    if (!validationResult.success) {
      throw new Error(`Invalid nutritional data: ${JSON.stringify((validationResult as { error: { issues: unknown[] } }).error.issues)}`);
    }

    this.data.nutritionalData = newData;
    this.data.updatedAt = new Date().toISOString();
    
    // Reset verification status to require re-validation
    this.data.verificationStatus = 'pending';
    this.data.aiValidation = undefined;
    this.data.userOverride = undefined;

    // Update similarity hash for duplicate detection
    this.updateSimilarityHash();
  }

  /**
   * Add tags to the food item
   */
  addTags(newTags: string[]): void {
    const uniqueTags = Array.from(new Set([...this.data.tags, ...newTags]));
    this.data.tags = uniqueTags.slice(0, 10); // Limit to 10 tags
    this.data.updatedAt = new Date().toISOString();
  }

  /**
   * Remove tags from the food item
   */
  removeTags(tagsToRemove: string[]): void {
    this.data.tags = this.data.tags.filter(tag => !tagsToRemove.includes(tag));
    this.data.updatedAt = new Date().toISOString();
  }

  /**
   * Record usage of this food item
   */
  recordUsage(): void {
    this.data.usageCount += 1;
    this.data.lastUsedAt = new Date().toISOString();
    this.data.updatedAt = new Date().toISOString();
  }

  /**
   * Report this food item for review
   */
  reportForReview(reason: string): void {
    this.data.reportCount = (this.data.reportCount || 0) + 1;
    
    if (!this.data.flagReasons) {
      this.data.flagReasons = [];
    }
    this.data.flagReasons.push(reason);

    // Auto-flag if too many reports
    if (this.data.reportCount >= 3) {
      this.data.verificationStatus = 'flagged';
    }

    this.data.updatedAt = new Date().toISOString();
  }

  /**
   * Moderate the food item (admin action)
   */
  moderate(action: 'approve' | 'reject' | 'flag', moderatorNotes?: string): void {
    switch (action) {
      case 'approve':
        this.data.verificationStatus = 'verified';
        break;
      case 'reject':
        this.data.verificationStatus = 'rejected';
        break;
      case 'flag':
        this.data.verificationStatus = 'flagged';
        break;
    }

    this.data.moderationNotes = moderatorNotes;
    this.data.lastModerationAt = new Date().toISOString();
    this.data.updatedAt = new Date().toISOString();
  }

  /**
   * Calculate nutritional completeness score
   */
  getNutritionalCompleteness(): number {
    const optionalFields = ['fiber', 'sugar', 'sodium', 'calcium', 'iron', 'vitaminC', 'vitaminD'];
    const providedOptionalFields = optionalFields.filter(field => 
      this.data.nutritionalData[field as keyof NutritionalData] !== undefined
    );
    
    // Base score for required fields (calories, protein, carbs, fat) = 70%
    // Optional fields contribute remaining 30%
    const baseScore = 70;
    const optionalScore = (providedOptionalFields.length / optionalFields.length) * 30;
    
    return Math.round(baseScore + optionalScore);
  }

  /**
   * Detect potential outliers in nutritional data
   */
  detectOutliers(): string[] {
    const outliers: string[] = [];
    const nutrition = this.data.nutritionalData;

    // Check if macronutrients add up to reasonable total
    const macroCalories = (nutrition.protein * 4) + (nutrition.carbohydrates * 4) + (nutrition.fat * 9);
    const caloriesDifference = Math.abs(nutrition.calories - macroCalories);
    
    if (caloriesDifference > nutrition.calories * 0.2) { // More than 20% difference
      outliers.push('calories_macro_mismatch');
    }

    // Check individual macro ratios
    if (nutrition.protein > 50) outliers.push('protein_too_high');
    if (nutrition.carbohydrates > 90) outliers.push('carbohydrates_too_high');
    if (nutrition.fat > 80) outliers.push('fat_too_high');

    // Check fiber vs carbohydrates
    if (nutrition.fiber && nutrition.fiber > nutrition.carbohydrates) {
      outliers.push('fiber_exceeds_carbs');
    }

    // Check sugar vs carbohydrates
    if (nutrition.sugar && nutrition.sugar > nutrition.carbohydrates) {
      outliers.push('sugar_exceeds_carbs');
    }

    // Check extremely high values
    if (nutrition.calories > 900) outliers.push('calories_extremely_high');
    if (nutrition.sodium && nutrition.sodium > 10000) outliers.push('sodium_extremely_high');

    return outliers;
  }

  /**
   * Update similarity hash for duplicate detection
   */
  private updateSimilarityHash(): void {
    const hashInput = [
      this.data.name.toLowerCase().trim(),
      this.data.brand?.toLowerCase().trim() || '',
      this.data.category.toLowerCase(),
      Math.round(this.data.nutritionalData.calories),
      Math.round(this.data.nutritionalData.protein),
      Math.round(this.data.nutritionalData.carbohydrates),
      Math.round(this.data.nutritionalData.fat)
    ].join('|');

    // Simple hash function (in production, use a proper hash library)
    this.data.similarityHash = this.simpleHash(hashInput);
  }

  /**
   * Simple hash function for similarity detection
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get food summary for display
   */
  getSummary() {
    const completeness = this.getNutritionalCompleteness();
    const outliers = this.detectOutliers();
    
    return {
      id: this.data._id,
      name: this.data.name,
      brand: this.data.brand,
      category: this.data.category,
      calories: this.data.nutritionalData.calories,
      protein: this.data.nutritionalData.protein,
      carbohydrates: this.data.nutritionalData.carbohydrates,
      fat: this.data.nutritionalData.fat,
      servingSize: this.data.servingSize,
      verificationStatus: this.data.verificationStatus,
      isVerified: this.isVerified(),
      isFlagged: this.isFlagged(),
      nutritionalCompleteness: completeness,
      hasOutliers: outliers.length > 0,
      outliers,
      usageCount: this.data.usageCount,
      tags: this.data.tags,
      aiConfidence: this.data.aiValidation?.confidence,
      lastUsedAt: this.data.lastUsedAt
    };
  }

  /**
   * Convert to JSON for storage
   */
  toJSON(): CustomFoodData {
    return { ...this.data };
  }

  /**
   * Convert to API contract format
   */
  toApiFormat(): CustomFood {
    const apiData = { ...this.data };
    // Remove internal moderation fields
    delete apiData.flagReasons;
    delete apiData.moderationNotes;
    delete apiData.reportCount;
    delete apiData.lastModerationAt;
    delete apiData.similarityHash;
    return apiData;
  }

  /**
   * Static factory methods
   */

  /**
   * Create CustomFoodEntity from JSON data
   */
  static fromJSON(data: CustomFoodData): CustomFoodEntity {
    return new CustomFoodEntity(data);
  }

  /**
   * Create new custom food
   */
  static createNew(
    userId: string,
    name: string,
    category: string,
    nutritionalData: NutritionalData,
    servingSize: { amount: number; unit: string },
    options: {
      brand?: string;
      barcode?: string;
      tags?: string[];
      isPublic?: boolean;
    } = {}
  ): CustomFoodEntity {
    const now = new Date().toISOString();
    
    const data: CustomFoodData = {
      userId,
      name: name.trim(),
      brand: options.brand?.trim(),
      category,
      nutritionalData,
      servingSize,
      barcode: options.barcode,
      verificationStatus: 'pending',
      source: {
        type: 'user_created'
      },
      tags: options.tags || [],
      isPublic: options.isPublic || false,
      usageCount: 0,
      createdAt: now,
      updatedAt: now
    };

    const food = new CustomFoodEntity(data);
    food.updateSimilarityHash();
    
    return food;
  }

  /**
   * Validate custom food data without creating instance
   */
  static validate(data: CustomFoodData): { valid: boolean; errors: string[] } {
    try {
      new CustomFoodEntity(data);
      return { valid: true, errors: [] };
    } catch (error) {
      return { 
        valid: false, 
        errors: [error instanceof Error ? error.message : 'Unknown validation error'] 
      };
    }
  }
}

/**
 * AI validation service interface (to be implemented separately)
 */
export interface AIValidationService {
  validateFood(food: {
    name: string;
    category: string;
    nutritionalData: NutritionalData;
    servingSize: { amount: number; unit: string };
  }): Promise<AIValidationResult>;
}

export default CustomFoodEntity;