// File: nutritionCalculator.ts

/**
 * Nutrition Calculator and AI Engine
 * Purpose: Core calculations for nutrition tracking and recovery-aware adjustments
 */

import type { RecoveryData, TrainingSession } from '../types/sharedTypes';

export interface NutritionGoals {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sugar: number; // grams
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number; // mg
  vitamins?: { [key: string]: number };
  minerals?: { [key: string]: number };
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  nutritionPer100g: NutritionInfo;
  servingSizes: ServingSize[];
  category: string;
  verified: boolean;
}

export interface ServingSize {
  name: string;
  grams: number;
  description: string;
}

export interface FoodEntry {
  id: string;
  userId: string;
  foodId: string;
  servingSize: number; // grams
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
  nutrition: NutritionInfo;
}

export interface NutritionAdjustment {
  reason: 'recovery_boost' | 'training_day' | 'rest_day' | 'high_strain';
  adjustments: {
    caloriesDelta: number;
    proteinDelta: number;
    carbsDelta: number;
    fatDelta: number;
  };
  recommendations: string[];
  timing?: 'pre_workout' | 'post_workout' | 'throughout_day';
}

/**
 * Core Nutrition Calculator with AI-driven adjustments
 */
export class NutritionCalculator {
  
  /**
   * Calculate base nutritional needs based on user profile
   */
  calculateBaseGoals(
    age: number,
    weight: number, // kg
    height: number, // cm
    sex: 'male' | 'female',
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
    goal: 'lose_weight' | 'maintain' | 'gain_weight' | 'gain_muscle'
  ): NutritionGoals {
    // Calculate BMR using Mifflin-St Jeor equation
    let bmr: number;
    if (sex === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Apply activity factor
    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    let tdee = bmr * activityFactors[activityLevel];

    // Adjust for goal
    const goalAdjustments = {
      lose_weight: -0.2, // 20% deficit
      maintain: 0,
      gain_weight: 0.1, // 10% surplus
      gain_muscle: 0.15 // 15% surplus
    };

    const calories = Math.round(tdee * (1 + goalAdjustments[goal]));

    // Calculate macros
    let proteinGrams: number;
    let fatGrams: number;
    let carbGrams: number;

    if (goal === 'gain_muscle' || goal === 'lose_weight') {
      // Higher protein for muscle gain/retention
      proteinGrams = weight * 2.2; // 2.2g per kg bodyweight
      fatGrams = weight * 1.0; // 1g per kg bodyweight
      carbGrams = (calories - (proteinGrams * 4) - (fatGrams * 9)) / 4;
    } else {
      // Moderate protein for maintenance/weight gain
      proteinGrams = weight * 1.6; // 1.6g per kg bodyweight
      fatGrams = calories * 0.25 / 9; // 25% of calories from fat
      carbGrams = (calories - (proteinGrams * 4) - (fatGrams * 9)) / 4;
    }

    return {
      calories,
      protein: Math.round(proteinGrams),
      carbs: Math.round(carbGrams),
      fat: Math.round(fatGrams),
      fiber: Math.round(calories / 1000 * 14), // 14g per 1000 calories
      sugar: Math.round(calories * 0.1 / 4) // 10% of calories max
    };
  }

  /**
   * Calculate recovery-aware nutrition adjustments
   */
  calculateRecoveryAdjustments(
    baseGoals: NutritionGoals,
    recoveryData: RecoveryData[],
    recentTraining: TrainingSession[]
  ): NutritionAdjustment {
    if (recoveryData.length === 0) {
      return this.getDefaultAdjustment();
    }

    const latestRecovery = recoveryData[recoveryData.length - 1];
    const avgRecovery = this.calculateAverageRecovery(recoveryData.slice(-7)); // Last 7 days
    
    let adjustments = {
      caloriesDelta: 0,
      proteinDelta: 0,
      carbsDelta: 0,
      fatDelta: 0
    };
    
    let recommendations: string[] = [];
    let reason: NutritionAdjustment['reason'] = 'rest_day';

    // Check if today is a training day
    const today = new Date().toISOString().split('T')[0];
    const isTrainingDay = recentTraining.some(session => 
      session.date.split('T')[0] === today
    );

    if (isTrainingDay) {
      reason = 'training_day';
      // Training day adjustments
      adjustments.carbsDelta = baseGoals.carbs * 0.1; // 10% more carbs
      adjustments.proteinDelta = baseGoals.protein * 0.05; // 5% more protein
      recommendations.push('🍌 Consume extra carbs before and after training');
      recommendations.push('🥩 Include protein within 2 hours post-workout');
    }

    // Recovery-based adjustments
    if (latestRecovery.recoveryScore < 40) {
      reason = 'recovery_boost';
      // Poor recovery - boost nutrition
      adjustments.caloriesDelta += baseGoals.calories * 0.05; // 5% more calories
      adjustments.carbsDelta += baseGoals.carbs * 0.15; // 15% more carbs
      adjustments.proteinDelta += baseGoals.protein * 0.1; // 10% more protein
      recommendations.push('🔋 Low recovery - increase caloric intake');
      recommendations.push('🍚 Focus on complex carbs for energy restoration');
      recommendations.push('💧 Increase hydration - aim for extra 500ml water');
    } else if (latestRecovery.recoveryScore > 80 && avgRecovery > 75) {
      // Great recovery - can maintain or slightly reduce if weight loss goal
      adjustments.caloriesDelta = -baseGoals.calories * 0.02; // 2% reduction
      recommendations.push('✅ Great recovery - maintain current nutrition plan');
    }

    // High strain adjustments
    if (latestRecovery.strainYesterday > 15) {
      reason = 'high_strain';
      adjustments.carbsDelta += baseGoals.carbs * 0.2; // 20% more carbs
      adjustments.proteinDelta += baseGoals.protein * 0.15; // 15% more protein
      recommendations.push('⚡ High strain yesterday - prioritize recovery nutrition');
      recommendations.push('🥛 Consider a post-workout recovery shake');
    }

    return {
      reason,
      adjustments,
      recommendations,
      timing: isTrainingDay ? 'post_workout' : 'throughout_day'
    };
  }

  /**
   * Calculate nutrition totals from food entries
   */
  calculateDailyTotals(entries: FoodEntry[]): NutritionInfo {
    return entries.reduce((totals, entry) => ({
      calories: totals.calories + entry.nutrition.calories,
      protein: totals.protein + entry.nutrition.protein,
      carbs: totals.carbs + entry.nutrition.carbs,
      fat: totals.fat + entry.nutrition.fat,
      fiber: totals.fiber + entry.nutrition.fiber,
      sugar: totals.sugar + entry.nutrition.sugar,
      sodium: totals.sodium + entry.nutrition.sodium
    }), {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    });
  }

  /**
   * Calculate nutrition for a specific food item and serving size
   */
  calculateNutritionForServing(food: FoodItem, servingGrams: number): NutritionInfo {
    const multiplier = servingGrams / 100; // nutrition is per 100g
    const nutrition = food.nutritionPer100g;

    return {
      calories: Math.round(nutrition.calories * multiplier),
      protein: Math.round(nutrition.protein * multiplier * 10) / 10,
      carbs: Math.round(nutrition.carbs * multiplier * 10) / 10,
      fat: Math.round(nutrition.fat * multiplier * 10) / 10,
      fiber: Math.round(nutrition.fiber * multiplier * 10) / 10,
      sugar: Math.round(nutrition.sugar * multiplier * 10) / 10,
      sodium: Math.round(nutrition.sodium * multiplier)
    };
  }

  /**
   * Analyze progress toward nutrition goals
   */
  analyzeGoalProgress(
    goals: NutritionGoals,
    actual: NutritionInfo
  ): {
    percentages: { [key: string]: number };
    status: 'under' | 'on_track' | 'over';
    suggestions: string[];
  } {
    const percentages = {
      calories: (actual.calories / goals.calories) * 100,
      protein: (actual.protein / goals.protein) * 100,
      carbs: (actual.carbs / goals.carbs) * 100,
      fat: (actual.fat / goals.fat) * 100,
      fiber: (actual.fiber / goals.fiber) * 100
    };

    let status: 'under' | 'on_track' | 'over' = 'on_track';
    const suggestions: string[] = [];

    // Determine overall status
    if (percentages.calories < 85) {
      status = 'under';
      suggestions.push('🍽️ Consider adding nutrient-dense snacks to reach calorie goals');
    } else if (percentages.calories > 115) {
      status = 'over';
      suggestions.push('⚖️ Consider smaller portions or lighter options for remaining meals');
    }

    // Specific macro suggestions
    if (percentages.protein < 80) {
      suggestions.push('🥩 Add protein sources like lean meat, eggs, or protein powder');
    }
    if (percentages.carbs < 70) {
      suggestions.push('🍌 Include healthy carbs like fruits, oats, or whole grains');
    }
    if (percentages.fiber < 60) {
      suggestions.push('🥬 Add fiber with vegetables, fruits, or whole grains');
    }

    return { percentages, status, suggestions };
  }

  // Private helper methods
  private calculateAverageRecovery(recoveryData: RecoveryData[]): number {
    if (recoveryData.length === 0) return 50;
    return recoveryData.reduce((sum, data) => sum + data.recoveryScore, 0) / recoveryData.length;
  }

  private getDefaultAdjustment(): NutritionAdjustment {
    return {
      reason: 'rest_day',
      adjustments: {
        caloriesDelta: 0,
        proteinDelta: 0,
        carbsDelta: 0,
        fatDelta: 0
      },
      recommendations: ['📊 Track your meals to get personalized recommendations'],
      timing: 'throughout_day'
    };
  }
}