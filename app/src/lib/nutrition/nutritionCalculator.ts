// File: nutritionCalculator.ts

/**
 * Nutrition Calculator and AI Engine
 * Purpose: Core calculations for nutrition tracking and recovery-aware adjustments
 */

import type { RecoveryData, TrainingSession } from '../types/sharedTypes';
import type { UserProfile } from '../training/onboardingEngine';

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

    // Check for poor recovery indicators: Low HRV + High RHR + Poor Sleep
    const isPoorRecovery = this.isPoorRecovery(latestRecovery);
    
    if (isPoorRecovery) {
      reason = 'recovery_boost';
      // Poor recovery - boost nutrition and suggest light day
      adjustments.caloriesDelta += baseGoals.calories * 0.05; // 5% more calories
      adjustments.carbsDelta += baseGoals.carbs * 0.15; // 15% more carbs
      adjustments.proteinDelta += baseGoals.protein * 0.1; // 10% more protein
      recommendations.push('🔋 Poor recovery detected (low HRV, high RHR, poor sleep)');
      recommendations.push('🍚 Increase carbs slightly for energy restoration');
      recommendations.push('💧 Boost hydration - aim for extra 500ml water due to poor recovery');
      recommendations.push('🛋️ Consider scheduling a light training day or rest');
    } else if (latestRecovery.recoveryScore <= 40) {
      reason = 'recovery_boost';
      // General poor recovery - boost nutrition
      adjustments.caloriesDelta += baseGoals.calories * 0.05; // 5% more calories
      adjustments.carbsDelta += baseGoals.carbs * 0.15; // 15% more carbs
      adjustments.proteinDelta += baseGoals.protein * 0.1; // 10% more protein
      recommendations.push('🔋 Low recovery - increase caloric intake');
      recommendations.push('🍚 Focus on complex carbs for energy restoration');
      recommendations.push('💧 Increase hydration - aim for extra 300ml water');
    } else if (latestRecovery.recoveryScore > 80 && avgRecovery > 75) {
      // Great recovery - can maintain or slightly reduce if weight loss goal
      adjustments.caloriesDelta = -baseGoals.calories * 0.02; // 2% reduction
      recommendations.push('✅ Great recovery - maintain current nutrition plan');
      recommendations.push('💧 Maintain regular hydration schedule');
    }

    // Check if today is a training day (only override if not already recovery boost)
    const today = new Date().toISOString().split('T')[0];
    const isTrainingDay = recentTraining.some(session => 
      session.date.split('T')[0] === today
    );

    if (isTrainingDay && reason !== 'recovery_boost') {
      reason = 'training_day';
      // Training day adjustments
      adjustments.carbsDelta = baseGoals.carbs * 0.1; // 10% more carbs
      adjustments.proteinDelta = baseGoals.protein * 0.05; // 5% more protein
      recommendations.push('🍌 Consume extra carbs before and after training');
      recommendations.push('🥩 Include protein within 2 hours post-workout');
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
      timing: (isTrainingDay || reason === 'training_day') ? 'post_workout' : 'throughout_day'
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

  private isPoorRecovery(recovery: RecoveryData): boolean {
    // Check for poor recovery indicators: Low HRV + High RHR + Poor Sleep
    const lowHRV = recovery.hrvScore < 40; // Below 40 is considered low HRV
    const highRHR = recovery.restingHeartRate > 70; // Above 70 bpm is considered high resting HR
    const poorSleep = recovery.sleepPerformance < 60; // Below 60% is poor sleep performance

    return lowHRV && highRHR && poorSleep;
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

  /**
   * Calculate hydration recommendations based on recovery metrics
   */
  static calculateHydrationRecommendations(
    latestRecovery: RecoveryData,
    avgRecovery: number,
    baseGoals: NutritionGoals,
    userProfile: UserProfile
  ): string[] {
    const recommendations: string[] = [];
    
    // Check for poor recovery indicators: Low HRV + High RHR + Poor Sleep
    const isPoorRecovery = latestRecovery.hrvScore < 40 && 
                          latestRecovery.restingHeartRate > 70 && 
                          latestRecovery.sleepPerformance < 60;

    // Base hydration calculation (35ml per kg body weight)
    const baseHydration = userProfile.weight * 35;

    if (isPoorRecovery) {
      // Poor recovery - significantly increase hydration
      const extraHydration = 500; // 500ml extra
      recommendations.push(`💧 Poor recovery detected - increase hydration by ${extraHydration}ml`);
      recommendations.push(`🎯 Target: ${(baseHydration + extraHydration)}ml total water intake today`);
      recommendations.push('💧 Consider electrolyte supplementation for better recovery');
    } else if (latestRecovery.recoveryScore <= 40) {
      // Low recovery - moderate hydration increase
      const extraHydration = 300; // 300ml extra
      recommendations.push(`💧 Low recovery - increase hydration by ${extraHydration}ml`);
      recommendations.push(`🎯 Target: ${(baseHydration + extraHydration)}ml total water intake today`);
    } else if (latestRecovery.recoveryScore > 80 && avgRecovery > 75) {
      // Great recovery - maintain base hydration
      recommendations.push(`💧 Great recovery - maintain base hydration`);
      recommendations.push(`🎯 Target: ${baseHydration}ml water intake today`);
    } else {
      // Normal recovery - slight increase for training
      const extraHydration = 100; // 100ml extra
      recommendations.push(`💧 Normal recovery - slight hydration increase`);
      recommendations.push(`🎯 Target: ${(baseHydration + extraHydration)}ml water intake today`);
    }

    // Add activity-based recommendations
    if (latestRecovery.sleepPerformance < 60) {
      recommendations.push('😴 Poor sleep detected - prioritize morning hydration');
    }

    if (latestRecovery.hrvScore < 50) {
      recommendations.push('❤️ Low HRV - focus on consistent hydration throughout the day');
    }

    return recommendations;
  }

  /**
   * Calculate protein make-up recommendations for missed targets
   */
  static calculateProteinMakeupRecommendations(
    weeklyProteinData: { date: string; actual: number; target: number }[],
    remainingDays: number,
    baseGoals: NutritionGoals
  ): {
    adjustments: { [date: string]: number };
    recommendations: string[];
    totalDeficit: number;
  } {
    const recommendations: string[] = [];
    const adjustments: { [date: string]: number } = {};
    
    if (weeklyProteinData.length === 0 || remainingDays === 0) {
      return { adjustments, recommendations, totalDeficit: 0 };
    }

    // Calculate total protein deficit so far
    const totalActual = weeklyProteinData.reduce((sum, day) => sum + day.actual, 0);
    const totalTarget = weeklyProteinData.reduce((sum, day) => sum + day.target, 0);
    const totalDeficit = Math.max(0, totalTarget - totalActual);

    if (totalDeficit === 0) {
      recommendations.push('✅ Protein targets are on track this week');
      return { adjustments, recommendations, totalDeficit: 0 };
    }

    // Calculate make-up protein per remaining day
    const makeupPerDay = Math.ceil(totalDeficit / remainingDays);
    const maxReasonableIncrease = baseGoals.protein * 0.3; // Max 30% increase per day
    
    if (makeupPerDay > maxReasonableIncrease) {
      // Distribute deficit more conservatively
      const conservativeMakeup = Math.ceil(maxReasonableIncrease);
      const totalMakeupPossible = conservativeMakeup * remainingDays;
      
      recommendations.push(`⚠️ Large protein deficit detected (${totalDeficit}g shortfall)`);
      recommendations.push(`🎯 Distributing ${totalMakeupPossible}g across ${remainingDays} remaining days`);
      recommendations.push(`💪 Target: ${baseGoals.protein + conservativeMakeup}g protein per day`);
      recommendations.push('🥩 Focus on high-protein foods: lean meats, eggs, dairy, legumes');
      
      // Create adjustments for remaining days
      for (let i = 0; i < remainingDays; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i);
        const dateStr = futureDate.toISOString().split('T')[0];
        adjustments[dateStr] = conservativeMakeup;
      }
    } else {
      // Normal make-up distribution
      recommendations.push(`📊 Protein deficit: ${totalDeficit}g to make up over ${remainingDays} days`);
      recommendations.push(`🎯 Add ${makeupPerDay}g protein per remaining day`);
      recommendations.push('🥩 Include protein-rich snacks between meals');
      
      // Create adjustments for remaining days
      for (let i = 0; i < remainingDays; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i);
        const dateStr = futureDate.toISOString().split('T')[0];
        adjustments[dateStr] = makeupPerDay;
      }
    }

    // Add timing recommendations
    if (remainingDays <= 2) {
      recommendations.push('⏰ Limited time - prioritize protein with every meal and snack');
    } else {
      recommendations.push('📅 Spread protein intake evenly across meals throughout the day');
    }

    return { adjustments, recommendations, totalDeficit };
  }

  /**
   * Apply safety rails based on health conditions and medical flags
   */
  static applyHealthSafetyRails(
    baseGoals: NutritionGoals,
    medicalConditions: string[],
    medications: string[],
    age: number,
    recoveryData?: RecoveryData
  ): {
    adjustedGoals: NutritionGoals;
    safetyRecommendations: string[];
    restrictions: string[];
    monitoring: string[];
  } {
    const adjustedGoals = { ...baseGoals };
    const safetyRecommendations: string[] = [];
    const restrictions: string[] = [];
    const monitoring: string[] = [];

    // Diabetes management
    if (medicalConditions.includes('diabetes') || medicalConditions.includes('type_2_diabetes')) {
      // Conservative carb management
      adjustedGoals.carbs = Math.min(adjustedGoals.carbs, 150); // Max 150g carbs for diabetics
      adjustedGoals.sugar = Math.min(adjustedGoals.sugar, 25); // Max 25g sugar
      
      safetyRecommendations.push('🍬 Diabetes detected - conservative carb management applied');
      safetyRecommendations.push('📊 Max 150g carbs per day to maintain stable blood sugar');
      safetyRecommendations.push('🩸 Monitor blood glucose regularly, especially around workouts');
      restrictions.push('Avoid high glycemic index foods');
      restrictions.push('Limit sugary beverages and desserts');
      monitoring.push('Track blood glucose before and after meals');
      monitoring.push('Monitor for hypo/hyperglycemia symptoms');
    }

    // Heart conditions
    if (medicalConditions.includes('heart_disease') || medicalConditions.includes('hypertension')) {
      // Reduce sodium, moderate fat intake
      adjustedGoals.fat = Math.min(adjustedGoals.fat, adjustedGoals.calories * 0.25 / 9); // Max 25% calories from fat
      // Note: sodium would be managed through food choices, not direct goal adjustment
      
      safetyRecommendations.push('❤️ Heart condition detected - cardiovascular-friendly adjustments');
      safetyRecommendations.push('🧂 Choose low-sodium food options (<2300mg daily)');
      safetyRecommendations.push('🥑 Focus on heart-healthy fats: olive oil, avocados, nuts');
      restrictions.push('Limit processed and high-sodium foods');
      restrictions.push('Avoid excessive saturated fats');
      monitoring.push('Monitor blood pressure regularly');
      monitoring.push('Track cardiovascular symptoms during exercise');
    }

    // Kidney conditions
    if (medicalConditions.includes('kidney_disease') || medicalConditions.includes('ckd')) {
      // Reduce protein if advanced kidney disease
      if (medicalConditions.includes('stage_3_kidney') || medicalConditions.includes('stage_4_kidney')) {
        adjustedGoals.protein = Math.min(adjustedGoals.protein, 0.8 * (adjustedGoals.calories / 2000)); // 0.8g per kg ideal body weight
      }
      
      safetyRecommendations.push('🫘 Kidney condition detected - protein intake adjusted');
      safetyRecommendations.push('💧 Maintain adequate hydration for kidney function');
      restrictions.push('Limit high-potassium foods if advised by doctor');
      restrictions.push('Monitor phosphorus intake from processed foods');
      monitoring.push('Regular kidney function blood tests');
      monitoring.push('Monitor for signs of fluid retention');
    }

    // Age-related adjustments
    if (age > 65) {
      // Older adults may need more protein for muscle maintenance
      adjustedGoals.protein = Math.max(adjustedGoals.protein, 1.2); // Minimum 1.2g per kg
      adjustedGoals.fiber = Math.max(adjustedGoals.fiber, 25); // Minimum 25g fiber for digestive health
      
      safetyRecommendations.push('👴 Age-related adjustments applied for optimal health');
      safetyRecommendations.push('💪 Increased protein for muscle maintenance');
      safetyRecommendations.push('🥦 Higher fiber intake for digestive health');
      monitoring.push('Monitor for age-related nutrient deficiencies');
    }

    // Medication interactions
    if (medications.includes('blood_pressure_medication')) {
      safetyRecommendations.push('💊 Blood pressure medication detected');
      safetyRecommendations.push('🥑 Include potassium-rich foods: bananas, spinach, sweet potatoes');
      safetyRecommendations.push('🧂 Continue low-sodium diet as prescribed');
      monitoring.push('Monitor potassium levels if advised by doctor');
    }

    if (medications.includes('diabetes_medication')) {
      safetyRecommendations.push('💊 Diabetes medication detected');
      safetyRecommendations.push('⚖️ Consistent meal timing to match medication schedule');
      safetyRecommendations.push('🍽️ Include complex carbs with each meal');
      monitoring.push('Monitor for medication side effects');
    }

    // Recovery considerations with health conditions
    if (recoveryData && medicalConditions.length > 0) {
      if (recoveryData.recoveryScore < 50) {
        safetyRecommendations.push('⚠️ Low recovery with health conditions - extra caution advised');
        safetyRecommendations.push('🏥 Consult healthcare provider before intense training');
        monitoring.push('Increased monitoring of vital signs during low recovery');
      }
    }

    // General safety recommendations
    if (medicalConditions.length > 0) {
      safetyRecommendations.push('🏥 Always consult with healthcare provider before major dietary changes');
      safetyRecommendations.push('📞 Keep emergency contact information readily available');
      monitoring.push('Regular check-ups with healthcare provider');
    }

    return {
      adjustedGoals,
      safetyRecommendations,
      restrictions,
      monitoring
    };
  }
}