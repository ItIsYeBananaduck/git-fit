/**
 * MacroProfile Entity Model
 * Core macro nutrition management with AI adjustment tracking and goal calculations
 * Implements comprehensive nutritional guidance and adaptive recommendations
 */

import { z } from 'zod';
import type { MacroProfile, MacroProfileResponse } from '../types/api-contracts.js';

// Extended interfaces for comprehensive macro nutrition management
export interface MacroProfileData {
  id: string;
  userId: string;
  // Base nutritional targets
  targets: NutritionalTargets;
  // Current intake tracking
  currentIntake: DailyIntake;
  // Goal and preferences
  fitnessGoal: 'Fat Loss' | 'Muscle Gain' | 'Hypertrophy' | 'Powerlifting' | 'Bodybuilding';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  // AI adjustments and learning
  aiAdjustments: MacroAIAdjustment[];
  isAIAdjusted: boolean;
  // Calculation metadata
  calculationMethod: 'mifflin_st_jeor' | 'harris_benedict' | 'katch_mcardle' | 'custom';
  bodyComposition?: BodyComposition;
  metabolicData: MetabolicData;
  // Progress tracking
  progressHistory: NutritionProgress[];
  lastRecommendation?: WeeklyRecommendation;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastCalculated: string;
}

export interface NutritionalTargets {
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  sugarGrams: number; // max limit
  sodiumMg: number; // max limit
  // Macronutrient percentages
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  // Additional micronutrients
  micronutrients?: {
    vitamins: { [key: string]: number };
    minerals: { [key: string]: number };
  };
}

export interface DailyIntake {
  date: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  sugarGrams: number;
  sodiumMg: number;
  // Progress toward goals
  calorieProgress: number; // percentage
  proteinProgress: number;
  carbsProgress: number;
  fatProgress: number;
  // Meal distribution
  mealBreakdown: MealNutrition[];
  // Data sources
  dataSource: 'manual' | 'food_log' | 'imported' | 'estimated';
  lastUpdated: string;
}

export interface MealNutrition {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'post_workout' | 'other';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timing?: string; // ISO time string
}

export interface BodyComposition {
  weight: number; // kg
  height: number; // cm
  bodyFatPercent?: number;
  leanMass?: number; // kg
  waterPercent?: number;
  boneMass?: number; // kg
  measurementDate: string;
  measurementMethod: 'dexa' | 'bod_pod' | 'bioelectrical' | 'calipers' | 'visual_estimate';
  confidence: 'high' | 'medium' | 'low';
}

export interface MetabolicData {
  bmr: number; // Basal Metabolic Rate
  tdee: number; // Total Daily Energy Expenditure
  thermic_effect_food: number; // TEF
  activity_thermogenesis: number; // NEAT + Exercise
  // Factors affecting metabolism
  age: number;
  sex: 'male' | 'female';
  // Metabolic flexibility indicators
  respiratory_quotient?: number;
  metabolic_efficiency?: number; // 0-1 scale
  adaptive_thermogenesis?: number; // metabolic adaptation
}

export interface MacroAIAdjustment {
  id: string;
  timestamp: string;
  adjustmentType: 'weekly_review' | 'biometric_feedback' | 'progress_plateau' | 'recovery_based' | 'manual_override';
  triggers: AdjustmentTrigger[];
  changes: NutritionAdjustment;
  reasoning: string;
  confidence: number; // 0-1
  userResponse?: 'accepted' | 'rejected' | 'modified';
  userFeedback?: string;
  effectiveness?: AdjustmentEffectiveness;
}

export interface AdjustmentTrigger {
  type: 'weight_trend' | 'energy_level' | 'hunger_level' | 'sleep_quality' | 'stress_level' | 'performance_decline' | 'recovery_data';
  value: number | string;
  threshold: number | string;
  severity: 'low' | 'medium' | 'high';
}

export interface NutritionAdjustment {
  calorieChange: number; // absolute change
  proteinChange: number;
  carbsChange: number;
  fatChange: number;
  // Percentage changes for context
  caloriePercentChange: number;
  proteinPercentChange: number;
  carbsPercentChange: number;
  fatPercentChange: number;
}

export interface AdjustmentEffectiveness {
  weeksSinceAdjustment: number;
  weightChange: number; // kg
  energyLevelImprovement: number; // -5 to +5 scale
  adherenceRate: number; // 0-1
  sideEffects: string[];
  overallRating: number; // 1-10 scale
}

export interface NutritionProgress {
  date: string;
  weight: number;
  bodyFatPercent?: number;
  averageCalories: number;
  adherenceRate: number; // percentage
  energyLevel: number; // 1-10 scale
  hungerLevel: number; // 1-10 scale
  sleepQuality: number; // 1-10 scale
  stressLevel: number; // 1-10 scale
  performanceIndicators?: {
    workout_quality: number;
    recovery_time: number;
    strength_trend: 'increasing' | 'stable' | 'decreasing';
  };
}

export interface WeeklyRecommendation {
  week: string; // ISO week format
  recommendations: RecommendationType[];
  surveyRequired: boolean;
  nextSurveyDate: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: string;
}

export interface RecommendationType {
  type: 'increase_calories' | 'decrease_calories' | 'adjust_macros' | 'maintain' | 'refeed_day' | 'diet_break';
  message: string;
  suggestedChanges: NutritionalTargets;
  reasoning: string;
  timeframe: 'immediate' | '1_week' | '2_weeks' | '1_month';
  reversible: boolean;
}

/**
 * Validation schemas
 */
export const NutritionalTargetsSchema = z.object({
  dailyCalories: z.number().min(800, 'Calories too low (minimum 800)').max(6000, 'Calories too high'),
  proteinGrams: z.number().min(50, 'Protein too low').max(400, 'Protein too high'),
  carbsGrams: z.number().min(50, 'Carbs too low').max(800, 'Carbs too high'),
  fatGrams: z.number().min(20, 'Fat too low').max(200, 'Fat too high'),
  fiberGrams: z.number().min(15, 'Fiber too low').max(80, 'Fiber too high'),
  sugarGrams: z.number().min(0, 'Sugar cannot be negative').max(200, 'Sugar limit too high'),
  sodiumMg: z.number().min(500, 'Sodium too low').max(3000, 'Sodium too high'),
  proteinPercent: z.number().min(10, 'Protein % too low').max(50, 'Protein % too high'),
  carbsPercent: z.number().min(10, 'Carbs % too low').max(70, 'Carbs % too high'),
  fatPercent: z.number().min(15, 'Fat % too low').max(60, 'Fat % too high')
});

export const MetabolicDataSchema = z.object({
  bmr: z.number().min(800, 'BMR too low').max(4000, 'BMR too high'),
  tdee: z.number().min(1000, 'TDEE too low').max(6000, 'TDEE too high'),
  thermic_effect_food: z.number().min(0, 'TEF cannot be negative').max(1000, 'TEF too high'),
  activity_thermogenesis: z.number().min(0, 'Activity thermogenesis cannot be negative'),
  age: z.number().min(13, 'Age too young').max(120, 'Age too old'),
  sex: z.enum(['male', 'female'])
});

/**
 * MacroProfileEntity class with comprehensive nutritional calculations and AI adjustments
 */
export class MacroProfileEntity {
  private _data: MacroProfileData;

  constructor(data: MacroProfileData) {
    this._data = { ...data };
    this.validate();
  }

  // Getters
  get id(): string { return this._data.id; }
  get userId(): string { return this._data.userId; }
  get targets(): NutritionalTargets { return { ...this._data.targets }; }
  get currentIntake(): DailyIntake { return { ...this._data.currentIntake }; }
  get fitnessGoal(): MacroProfileData['fitnessGoal'] { return this._data.fitnessGoal; }
  get activityLevel(): MacroProfileData['activityLevel'] { return this._data.activityLevel; }
  get aiAdjustments(): MacroAIAdjustment[] { return [...this._data.aiAdjustments]; }
  get isAIAdjusted(): boolean { return this._data.isAIAdjusted; }
  get calculationMethod(): MacroProfileData['calculationMethod'] { return this._data.calculationMethod; }
  get bodyComposition(): BodyComposition | undefined { return this._data.bodyComposition; }
  get metabolicData(): MetabolicData { return { ...this._data.metabolicData }; }
  get progressHistory(): NutritionProgress[] { return [...this._data.progressHistory]; }
  get lastRecommendation(): WeeklyRecommendation | undefined { return this._data.lastRecommendation; }
  get createdAt(): Date { return new Date(this._data.createdAt); }
  get updatedAt(): Date { return new Date(this._data.updatedAt); }
  get lastCalculated(): Date { return new Date(this._data.lastCalculated); }

  /**
   * Validate macro profile data
   */
  private validate(): void {
    try {
      // Validate basic data structure
      if (!this._data.id || !this._data.userId) {
        throw new Error('Missing required macro profile fields');
      }

      // Validate nutritional targets
      NutritionalTargetsSchema.parse(this._data.targets);

      // Validate metabolic data
      MetabolicDataSchema.parse(this._data.metabolicData);

      // Validate business rules
      this.validateBusinessRules();
      this.validateMacroBalance();

    } catch (error) {
      throw new Error(`Macro profile validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate business rules
   */
  private validateBusinessRules(): void {
    // Check macro percentages sum to ~100%
    const totalPercent = this._data.targets.proteinPercent + 
                        this._data.targets.carbsPercent + 
                        this._data.targets.fatPercent;
    
    if (Math.abs(totalPercent - 100) > 2) {
      throw new Error('Macro percentages must sum to approximately 100%');
    }

    // Check TDEE is reasonable relative to BMR
    if (this._data.metabolicData.tdee < this._data.metabolicData.bmr) {
      throw new Error('TDEE cannot be less than BMR');
    }

    // Check calorie targets are reasonable for health
    const minimumCalories = this._data.metabolicData.bmr * 0.8; // Not below 80% of BMR
    if (this._data.targets.dailyCalories < minimumCalories) {
      throw new Error(`Calorie target too low for health (minimum: ${Math.round(minimumCalories)})`);
    }
  }

  /**
   * Validate macro balance and nutritional adequacy
   */
  private validateMacroBalance(): void {
    const { proteinGrams, carbsGrams, fatGrams, dailyCalories } = this._data.targets;

    // Calculate calories from macros
    const calculatedCalories = (proteinGrams * 4) + (carbsGrams * 4) + (fatGrams * 9);
    const calorieDifference = Math.abs(calculatedCalories - dailyCalories);

    if (calorieDifference > 50) {
      throw new Error(`Macro calories (${calculatedCalories}) don't match target calories (${dailyCalories})`);
    }

    // Validate protein adequacy
    const weight = this._data.bodyComposition?.weight || 70; // default if not available
    const proteinPerKg = proteinGrams / weight;
    
    if (proteinPerKg < 0.8) {
      throw new Error('Protein intake below minimum recommended (0.8g/kg)');
    }

    // Validate fat adequacy
    const fatPerKg = fatGrams / weight;
    if (fatPerKg < 0.5) {
      throw new Error('Fat intake below minimum recommended (0.5g/kg)');
    }
  }

  /**
   * Calculate nutritional targets based on user profile
   */
  calculateTargets(
    userProfile: {
      age: number;
      weight: number;
      height: number;
      sex: 'male' | 'female';
    }
  ): void {
    // Calculate BMR using Mifflin-St Jeor equation
    let bmr: number;
    if (userProfile.sex === 'male') {
      bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age + 5;
    } else {
      bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age - 161;
    }

    // Apply activity factor
    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const tdee = bmr * activityFactors[this._data.activityLevel];

    // Adjust for fitness goal
    const goalAdjustments = {
      'Fat Loss': -0.2, // 20% deficit
      'Muscle Gain': 0.15, // 15% surplus
      'Hypertrophy': 0.1, // 10% surplus
      'Powerlifting': 0.05, // 5% surplus
      'Bodybuilding': 0.0 // maintenance during cut/bulk phases
    };

    const dailyCalories = Math.round(tdee * (1 + goalAdjustments[this._data.fitnessGoal]));

    // Calculate macros based on goal

    // Protein calculation (1.6-2.2g/kg based on goal)
    const proteinMultipliers = {
      'Fat Loss': 2.2, // Higher protein during cut
      'Muscle Gain': 2.0,
      'Hypertrophy': 2.0,
      'Powerlifting': 1.8,
      'Bodybuilding': 2.1
    };

    const proteinGrams = userProfile.weight * proteinMultipliers[this._data.fitnessGoal];

    // Fat calculation (0.6-1.0g/kg)
    const fatMultipliers = {
      'Fat Loss': 0.8,
      'Muscle Gain': 1.0,
      'Hypertrophy': 0.9,
      'Powerlifting': 1.0,
      'Bodybuilding': 0.7
    };

    const fatGrams = userProfile.weight * fatMultipliers[this._data.fitnessGoal];

    // Carbs fill remainder
    const carbsGrams = (dailyCalories - (proteinGrams * 4) - (fatGrams * 9)) / 4;

    // Calculate percentages
    const proteinPercent = (proteinGrams * 4 / dailyCalories) * 100;
    const carbsPercent = (carbsGrams * 4 / dailyCalories) * 100;
    const fatPercent = (fatGrams * 9 / dailyCalories) * 100;

    // Calculate fiber and other nutrients
    const fiberGrams = Math.round(dailyCalories / 1000 * 14); // 14g per 1000 calories
    const sugarGrams = Math.round(dailyCalories * 0.1 / 4); // 10% of calories max
    const sodiumMg = 2300; // Standard recommendation

    // Update targets
    this._data.targets = {
      dailyCalories,
      proteinGrams: Math.round(proteinGrams),
      carbsGrams: Math.round(carbsGrams),
      fatGrams: Math.round(fatGrams),
      fiberGrams,
      sugarGrams,
      sodiumMg,
      proteinPercent: Math.round(proteinPercent * 10) / 10,
      carbsPercent: Math.round(carbsPercent * 10) / 10,
      fatPercent: Math.round(fatPercent * 10) / 10
    };

    // Update metabolic data
    this._data.metabolicData = {
      ...this._data.metabolicData,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      thermic_effect_food: Math.round(dailyCalories * 0.1), // 10% TEF
      activity_thermogenesis: Math.round(tdee - bmr - (dailyCalories * 0.1)),
      age: userProfile.age,
      sex: userProfile.sex
    };

    this._data.lastCalculated = new Date().toISOString();
    this._data.updatedAt = new Date().toISOString();
    this.validate();
  }

  /**
   * Apply AI adjustment to macro targets
   */
  applyAIAdjustment(adjustment: MacroAIAdjustment): void {
    // Apply changes to targets
    this._data.targets.dailyCalories += adjustment.changes.calorieChange;
    this._data.targets.proteinGrams += adjustment.changes.proteinChange;
    this._data.targets.carbsGrams += adjustment.changes.carbsChange;
    this._data.targets.fatGrams += adjustment.changes.fatChange;

    // Recalculate percentages
    const totalCalories = this._data.targets.dailyCalories;
    this._data.targets.proteinPercent = (this._data.targets.proteinGrams * 4 / totalCalories) * 100;
    this._data.targets.carbsPercent = (this._data.targets.carbsGrams * 4 / totalCalories) * 100;
    this._data.targets.fatPercent = (this._data.targets.fatGrams * 9 / totalCalories) * 100;

    // Add to adjustment history
    this._data.aiAdjustments.push(adjustment);
    this._data.isAIAdjusted = true;
    this._data.updatedAt = new Date().toISOString();

    this.validate();
  }

  /**
   * Update daily intake tracking
   */
  updateDailyIntake(intake: Partial<DailyIntake>): void {
    this._data.currentIntake = {
      ...this._data.currentIntake,
      ...intake,
      lastUpdated: new Date().toISOString()
    };

    // Recalculate progress percentages
    this.calculateProgress();
    this._data.updatedAt = new Date().toISOString();
  }

  /**
   * Calculate progress toward macro goals
   */
  private calculateProgress(): void {
    const { targets, currentIntake } = this._data;

    this._data.currentIntake.calorieProgress = (currentIntake.calories / targets.dailyCalories) * 100;
    this._data.currentIntake.proteinProgress = (currentIntake.proteinGrams / targets.proteinGrams) * 100;
    this._data.currentIntake.carbsProgress = (currentIntake.carbsGrams / targets.carbsGrams) * 100;
    this._data.currentIntake.fatProgress = (currentIntake.fatGrams / targets.fatGrams) * 100;
  }

  /**
   * Add nutrition progress entry
   */
  addProgressEntry(progress: NutritionProgress): void {
    this._data.progressHistory.push(progress);
    
    // Keep only last 90 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    this._data.progressHistory = this._data.progressHistory.filter(
      entry => new Date(entry.date) >= cutoffDate
    );

    this._data.updatedAt = new Date().toISOString();
  }

  /**
   * Generate weekly recommendation
   */
  generateWeeklyRecommendation(): WeeklyRecommendation {
    const recentProgress = this._data.progressHistory.slice(-7); // Last 7 days
    
    if (recentProgress.length < 3) {
      return {
        week: new Date().toISOString().slice(0, 7),
        recommendations: [{
          type: 'maintain',
          message: 'Continue current approach and track progress',
          suggestedChanges: this._data.targets,
          reasoning: 'Insufficient data for adjustments',
          timeframe: '1_week',
          reversible: true
        }],
        surveyRequired: false,
        nextSurveyDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'low',
        estimatedImpact: 'Continue building data for future recommendations'
      };
    }

    // Analyze trends
    const avgEnergy = recentProgress.reduce((sum, p) => sum + p.energyLevel, 0) / recentProgress.length;
    const avgAdherence = recentProgress.reduce((sum, p) => sum + p.adherenceRate, 0) / recentProgress.length;

    const recommendations: RecommendationType[] = [];

    // Weight trend analysis
    const weightTrend = recentProgress[recentProgress.length - 1].weight - recentProgress[0].weight;
    const goalWeight = this._data.fitnessGoal === 'Fat Loss' ? -0.5 : 
                      this._data.fitnessGoal === 'Muscle Gain' ? 0.25 : 0;

    if (Math.abs(weightTrend - goalWeight) > 0.3) {
      if (weightTrend > goalWeight + 0.3 && this._data.fitnessGoal === 'Fat Loss') {
        recommendations.push({
          type: 'decrease_calories',
          message: 'Consider reducing calories by 100-150 to accelerate fat loss',
          suggestedChanges: {
            ...this._data.targets,
            dailyCalories: this._data.targets.dailyCalories - 125
          },
          reasoning: 'Weight loss slower than target',
          timeframe: '1_week',
          reversible: true
        });
      }
    }

    // Energy level considerations
    if (avgEnergy < 6 && avgAdherence > 80) {
      recommendations.push({
        type: 'refeed_day',
        message: 'Consider adding a refeed day to boost energy and metabolism',
        suggestedChanges: {
          ...this._data.targets,
          dailyCalories: this._data.targets.dailyCalories + 300,
          carbsGrams: this._data.targets.carbsGrams + 75
        },
        reasoning: 'Low energy levels despite good adherence',
        timeframe: '1_week',
        reversible: true
      });
    }

    this._data.lastRecommendation = {
      week: new Date().toISOString().slice(0, 7),
      recommendations,
      surveyRequired: recommendations.length === 0,
      nextSurveyDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: recommendations.length > 0 ? 'medium' : 'low',
      estimatedImpact: recommendations.length > 0 ? 'Moderate improvements expected' : 'Continue current approach'
    };

    return this._data.lastRecommendation;
  }

  /**
   * Get macro adherence score
   */
  getAdherenceScore(): number {
    const { currentIntake } = this._data;
    
    // Calculate adherence for each macro (allowing 5% tolerance)
    const calorieAdherence = Math.max(0, 100 - Math.abs(currentIntake.calorieProgress - 100));
    const proteinAdherence = Math.max(0, 100 - Math.abs(currentIntake.proteinProgress - 100));
    const carbsAdherence = Math.max(0, 100 - Math.abs(currentIntake.carbsProgress - 100));
    const fatAdherence = Math.max(0, 100 - Math.abs(currentIntake.fatProgress - 100));

    // Weighted average (protein gets higher weight)
    return (calorieAdherence * 0.3 + proteinAdherence * 0.4 + carbsAdherence * 0.15 + fatAdherence * 0.15);
  }

  /**
   * Get API contract format for MacroProfile
   */
  toApiProfile(): MacroProfile {
    return {
      id: this._data.id,
      userId: this._data.userId,
      dailyCalories: this._data.targets.dailyCalories,
      proteinGrams: this._data.targets.proteinGrams,
      carbsGrams: this._data.targets.carbsGrams,
      fatGrams: this._data.targets.fatGrams,
      fitnessGoal: this._data.fitnessGoal,
      activityLevel: this._data.activityLevel,
      lastUpdated: this._data.updatedAt,
      isAIAdjusted: this._data.isAIAdjusted
    };
  }

  /**
   * Get API contract format for MacroProfileResponse
   */
  toApiResponse(): MacroProfileResponse {
    return {
      profile: this.toApiProfile(),
      progress: {
        currentCalories: this._data.currentIntake.calories,
        currentProtein: this._data.currentIntake.proteinGrams,
        currentCarbs: this._data.currentIntake.carbsGrams,
        currentFat: this._data.currentIntake.fatGrams,
        percentageToGoal: this.getAdherenceScore()
      }
    };
  }

  /**
   * Export macro profile data
   */
  toJSON(): MacroProfileData {
    return { ...this._data };
  }

  /**
   * Create MacroProfileEntity from JSON data
   */
  static fromJSON(data: MacroProfileData): MacroProfileEntity {
    return new MacroProfileEntity(data);
  }

  /**
   * Create MacroProfileEntity from API contract
   */
  static fromApiProfile(apiProfile: MacroProfile): MacroProfileEntity {
    const data: MacroProfileData = {
      id: apiProfile.id,
      userId: apiProfile.userId,
      targets: {
        dailyCalories: apiProfile.dailyCalories,
        proteinGrams: apiProfile.proteinGrams,
        carbsGrams: apiProfile.carbsGrams,
        fatGrams: apiProfile.fatGrams,
        fiberGrams: Math.round(apiProfile.dailyCalories / 1000 * 14),
        sugarGrams: Math.round(apiProfile.dailyCalories * 0.1 / 4),
        sodiumMg: 2300,
        proteinPercent: (apiProfile.proteinGrams * 4 / apiProfile.dailyCalories) * 100,
        carbsPercent: (apiProfile.carbsGrams * 4 / apiProfile.dailyCalories) * 100,
        fatPercent: (apiProfile.fatGrams * 9 / apiProfile.dailyCalories) * 100
      },
      currentIntake: {
        date: new Date().toISOString().split('T')[0],
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fiberGrams: 0,
        sugarGrams: 0,
        sodiumMg: 0,
        calorieProgress: 0,
        proteinProgress: 0,
        carbsProgress: 0,
        fatProgress: 0,
        mealBreakdown: [],
        dataSource: 'manual',
        lastUpdated: new Date().toISOString()
      },
      fitnessGoal: apiProfile.fitnessGoal,
      activityLevel: apiProfile.activityLevel,
      aiAdjustments: [],
      isAIAdjusted: apiProfile.isAIAdjusted,
      calculationMethod: 'mifflin_st_jeor',
      metabolicData: {
        bmr: 1500, // Default, should be calculated
        tdee: 2000, // Default, should be calculated
        thermic_effect_food: 200,
        activity_thermogenesis: 300,
        age: 30, // Default
        sex: 'male' // Default
      },
      progressHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: apiProfile.lastUpdated,
      lastCalculated: new Date().toISOString()
    };

    return new MacroProfileEntity(data);
  }

  /**
   * Validate macro profile data without creating instance
   */
  static validate(data: MacroProfileData): { valid: boolean; errors: string[] } {
    try {
      new MacroProfileEntity(data);
      return { valid: true, errors: [] };
    } catch (error) {
      return { 
        valid: false, 
        errors: [error instanceof Error ? error.message : 'Unknown validation error'] 
      };
    }
  }
}

export default MacroProfileEntity;