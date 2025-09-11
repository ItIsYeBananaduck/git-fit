/**
 * Nutrition AI Service
 * Handles core nutrition calculations, recovery-aware adjustments, and intelligent recommendations
 */

import type { WHOOPRecovery, WHOOPStrain } from '$lib/api/whoop';

export interface NutritionGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  dailyFiber?: number;
  dailySodium?: number;
  goalType: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'performance';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  allowWeeklyBalancing: boolean;
  maxDailyCalorieAdjustment: number;
  maxDailyMacroAdjustment: number;
}

export interface FoodEntry {
  id: string;
  userId: string;
  foodId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servingGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  timestamp: string;
}

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  // Goal comparison
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  // Percentages
  caloriePercentage: number;
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
  // Balance status
  isBalanced: boolean;
  overages: { calories: number; protein: number; carbs: number; fat: number };
  shortfalls: { calories: number; protein: number; carbs: number; fat: number };
}

export interface RecoveryAwareAdjustment {
  date: string;
  adjustmentType: 'high_recovery_boost' | 'low_recovery_support' | 'high_strain_recovery' | 'poor_sleep_compensation';
  calorieAdjustment: number;
  proteinBoost: number;
  carbAdjustment: number;
  reasoning: string[];
  confidence: number;
  hydrationReminder: boolean;
  supplementSuggestions: string[];
}

export interface WeeklyMacroBalance {
  weekStartDate: string;
  weekEndDate: string;
  originalTargets: NutritionGoals;
  adjustedTargets: Array<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    reasonForAdjustment: string;
  }>;
  totalVariance: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  isBalanced: boolean;
  recommendApply: boolean;
}

export class NutritionAI {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Calculate basic nutrition goals based on user profile and fitness objectives
   */
  calculateBaseNutritionGoals(
    user: {
      weight: number; // kg
      height: number; // cm
      age: number;
      biologicalSex: 'male' | 'female';
      activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
      goalType: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'performance';
    }
  ): NutritionGoals {
    // Calculate BMR using Mifflin-St Jeor equation
    let bmr: number;
    if (user.biologicalSex === 'male') {
      bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
    } else {
      bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
    }

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const tdee = bmr * activityMultipliers[user.activityLevel];

    // Goal-based calorie adjustments
    let dailyCalories: number;
    let proteinMultiplier: number;
    let carbsPercentage: number;
    let fatPercentage: number;

    switch (user.goalType) {
      case 'weight_loss':
        dailyCalories = tdee - 500; // 1lb per week deficit
        proteinMultiplier = 2.2; // higher protein to preserve muscle
        carbsPercentage = 0.35;
        fatPercentage = 0.25;
        break;
      case 'muscle_gain':
        dailyCalories = tdee + 300; // moderate surplus
        proteinMultiplier = 2.4; // high protein for muscle building
        carbsPercentage = 0.45;
        fatPercentage = 0.25;
        break;
      case 'performance':
        dailyCalories = tdee + 200;
        proteinMultiplier = 2.0;
        carbsPercentage = 0.50; // higher carbs for performance
        fatPercentage = 0.20;
        break;
      default: // maintenance
        dailyCalories = tdee;
        proteinMultiplier = 1.8;
        carbsPercentage = 0.40;
        fatPercentage = 0.30;
    }

    const dailyProtein = user.weight * proteinMultiplier;
    const dailyCarbs = (dailyCalories * carbsPercentage) / 4; // 4 cal per gram
    const proteinCalories = dailyProtein * 4;
    const carbsCalories = dailyCarbs * 4;
    const fatCalories = dailyCalories - proteinCalories - carbsCalories;
    const dailyFat = fatCalories / 9; // 9 cal per gram

    return {
      dailyCalories: Math.round(dailyCalories),
      dailyProtein: Math.round(dailyProtein),
      dailyCarbs: Math.round(dailyCarbs),
      dailyFat: Math.round(dailyFat),
      dailyFiber: Math.round(user.weight * 0.4), // 0.4g per kg body weight
      dailySodium: 2300, // mg - standard recommendation
      goalType: user.goalType,
      activityLevel: user.activityLevel,
      allowWeeklyBalancing: true,
      maxDailyCalorieAdjustment: 15, // 15% max adjustment
      maxDailyMacroAdjustment: 20 // 20% max macro adjustment
    };
  }

  /**
   * Calculate daily nutrition summary from food entries
   */
  calculateDailyNutrition(entries: FoodEntry[], goals: NutritionGoals): DailyNutritionSummary {
    const totals = entries.reduce(
      (sum, entry) => ({
        calories: sum.calories + entry.calories,
        protein: sum.protein + entry.protein,
        carbs: sum.carbs + entry.carbs,
        fat: sum.fat + entry.fat,
        fiber: sum.fiber + (entry.fiber || 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    const caloriePercentage = (totals.calories / goals.dailyCalories) * 100;
    const proteinPercentage = (totals.protein / goals.dailyProtein) * 100;
    const carbsPercentage = (totals.carbs / goals.dailyCarbs) * 100;
    const fatPercentage = (totals.fat / goals.dailyFat) * 100;

    // Calculate overages and shortfalls
    const overages = {
      calories: Math.max(0, totals.calories - goals.dailyCalories),
      protein: Math.max(0, totals.protein - goals.dailyProtein),
      carbs: Math.max(0, totals.carbs - goals.dailyCarbs),
      fat: Math.max(0, totals.fat - goals.dailyFat)
    };

    const shortfalls = {
      calories: Math.max(0, goals.dailyCalories - totals.calories),
      protein: Math.max(0, goals.dailyProtein - totals.protein),
      carbs: Math.max(0, goals.dailyCarbs - totals.carbs),
      fat: Math.max(0, goals.dailyFat - totals.fat)
    };

    // Determine if day is balanced (within 10% of targets)
    const isBalanced = 
      caloriePercentage >= 90 && caloriePercentage <= 110 &&
      proteinPercentage >= 90 && 
      carbsPercentage >= 90 && carbsPercentage <= 110 &&
      fatPercentage >= 90 && fatPercentage <= 110;

    return {
      date: entries[0]?.date || new Date().toISOString().split('T')[0],
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      totalFiber: totals.fiber,
      calorieTarget: goals.dailyCalories,
      proteinTarget: goals.dailyProtein,
      carbsTarget: goals.dailyCarbs,
      fatTarget: goals.dailyFat,
      caloriePercentage,
      proteinPercentage,
      carbsPercentage,
      fatPercentage,
      isBalanced,
      overages,
      shortfalls
    };
  }

  /**
   * Generate recovery-aware nutrition adjustments based on fitness tracker data
   */
  generateRecoveryAwareAdjustments(
    recovery: number,
    strain: number,
    sleepScore: number,
    hrv: number,
    baseGoals: NutritionGoals
  ): RecoveryAwareAdjustment {
    const reasoning: string[] = [];
    let adjustmentType: RecoveryAwareAdjustment['adjustmentType'];
    let calorieAdjustment = 0;
    let proteinBoost = 0;
    let carbAdjustment = 0;
    let confidence = 0.8;
    let hydrationReminder = false;
    const supplementSuggestions: string[] = [];

    // High recovery scenario
    if (recovery > 70 && sleepScore > 75) {
      adjustmentType = 'high_recovery_boost';
      calorieAdjustment = Math.round(baseGoals.dailyCalories * 0.05); // 5% boost
      proteinBoost = Math.round(baseGoals.dailyProtein * 0.1); // 10% protein boost
      carbAdjustment = Math.round(baseGoals.dailyCarbs * 0.1); // 10% carb boost
      reasoning.push(`Excellent recovery (${recovery}%) - can handle increased calories`);
      reasoning.push(`Great sleep (${sleepScore}/100) - metabolism optimized`);
      reasoning.push('Boosting nutrients to support training adaptation');
    }
    // Low recovery scenario
    else if (recovery < 40 || sleepScore < 60) {
      adjustmentType = 'low_recovery_support';
      calorieAdjustment = Math.round(baseGoals.dailyCalories * 0.03); // slight increase for recovery
      proteinBoost = Math.round(baseGoals.dailyProtein * 0.15); // more protein for repair
      carbAdjustment = -Math.round(baseGoals.dailyCarbs * 0.05); // slightly lower carbs
      hydrationReminder = true;
      supplementSuggestions.push('Magnesium for sleep quality');
      supplementSuggestions.push('Vitamin D if deficient');
      reasoning.push(`Low recovery (${recovery}%) - prioritizing repair nutrients`);
      reasoning.push('Increasing protein for muscle recovery');
      reasoning.push('Focus on hydration and anti-inflammatory foods');
    }
    // High strain recovery
    else if (strain > 16) {
      adjustmentType = 'high_strain_recovery';
      calorieAdjustment = Math.round(baseGoals.dailyCalories * 0.08); // 8% increase
      proteinBoost = Math.round(baseGoals.dailyProtein * 0.2); // 20% protein boost
      carbAdjustment = Math.round(baseGoals.dailyCarbs * 0.15); // 15% carb boost
      hydrationReminder = true;
      supplementSuggestions.push('Post-workout protein shake');
      supplementSuggestions.push('Tart cherry juice for recovery');
      reasoning.push(`High strain (${strain}) - significant recovery nutrition needed`);
      reasoning.push('Increasing carbs to replenish glycogen');
      reasoning.push('Boosting protein for muscle repair');
    }
    // Poor sleep compensation
    else if (sleepScore < 70) {
      adjustmentType = 'poor_sleep_compensation';
      calorieAdjustment = 0; // maintain calories
      proteinBoost = Math.round(baseGoals.dailyProtein * 0.1);
      carbAdjustment = Math.round(baseGoals.dailyCarbs * 0.05); // slight carb increase for energy
      hydrationReminder = true;
      supplementSuggestions.push('Avoid caffeine after 2 PM');
      supplementSuggestions.push('Melatonin if needed');
      reasoning.push(`Poor sleep (${sleepScore}/100) - supporting energy and recovery`);
      reasoning.push('Maintaining stable blood sugar with consistent carbs');
      reasoning.push('Extra protein to support overnight recovery');
    }
    // Default moderate adjustment
    else {
      adjustmentType = 'high_recovery_boost';
      reasoning.push('Moderate recovery metrics - maintaining baseline nutrition');
    }

    // Adjust confidence based on data quality
    if (recovery === 0 || sleepScore === 0) {
      confidence *= 0.6; // lower confidence without key metrics
      reasoning.push('⚠️ Limited tracker data - recommendations based on available metrics');
    }

    return {
      date: new Date().toISOString().split('T')[0],
      adjustmentType,
      calorieAdjustment,
      proteinBoost,
      carbAdjustment,
      reasoning,
      confidence,
      hydrationReminder,
      supplementSuggestions
    };
  }

  /**
   * Calculate weekly macro balancing to smooth out daily variations
   */
  calculateWeeklyMacroBalance(
    weeklyEntries: Array<{ date: string; entries: FoodEntry[] }>,
    goals: NutritionGoals
  ): WeeklyMacroBalance {
    const weekStartDate = weeklyEntries[0]?.date || '';
    const weekEndDate = weeklyEntries[weeklyEntries.length - 1]?.date || '';

    // Calculate daily summaries
    const dailySummaries = weeklyEntries.map(day => 
      this.calculateDailyNutrition(day.entries, goals)
    );

    // Calculate total weekly variance
    const totalVariance = dailySummaries.reduce(
      (sum, day) => ({
        calories: sum.calories + (day.totalCalories - day.calorieTarget),
        protein: sum.protein + (day.totalProtein - day.proteinTarget),
        carbs: sum.carbs + (day.totalCarbs - day.carbsTarget),
        fat: sum.fat + (day.totalFat - day.fatTarget)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const adjustedTargets: WeeklyMacroBalance['adjustedTargets'] = [];
    let recommendApply = false;

    // If weekly variance is significant, calculate balancing adjustments
    if (goals.allowWeeklyBalancing && 
        (Math.abs(totalVariance.calories) > goals.dailyCalories * 0.5 ||
         Math.abs(totalVariance.protein) > goals.dailyProtein * 0.5)) {
      
      recommendApply = true;
      
      // Distribute variance across remaining days in week
      const remainingDays = 7 - dailySummaries.length;
      if (remainingDays > 0) {
        const dailyCalorieAdjustment = -totalVariance.calories / remainingDays;
        const dailyProteinAdjustment = -totalVariance.protein / remainingDays;
        const dailyCarbsAdjustment = -totalVariance.carbs / remainingDays;
        const dailyFatAdjustment = -totalVariance.fat / remainingDays;

        // Cap adjustments at max allowed percentages
        const maxCalorieAdj = goals.dailyCalories * (goals.maxDailyCalorieAdjustment / 100);
        const maxMacroAdj = goals.maxDailyMacroAdjustment / 100;

        const cappedCalorieAdj = Math.max(-maxCalorieAdj, Math.min(maxCalorieAdj, dailyCalorieAdjustment));
        const cappedProteinAdj = Math.max(-goals.dailyProtein * maxMacroAdj, 
          Math.min(goals.dailyProtein * maxMacroAdj, dailyProteinAdjustment));

        for (let i = 0; i < remainingDays; i++) {
          const futureDate = new Date(weekStartDate);
          futureDate.setDate(futureDate.getDate() + dailySummaries.length + i);
          
          adjustedTargets.push({
            date: futureDate.toISOString().split('T')[0],
            calories: Math.round(goals.dailyCalories + cappedCalorieAdj),
            protein: Math.round(goals.dailyProtein + cappedProteinAdj),
            carbs: Math.round(goals.dailyCarbs + dailyCarbsAdjustment),
            fat: Math.round(goals.dailyFat + dailyFatAdjustment),
            reasonForAdjustment: `Balancing weekly variance: ${totalVariance.calories > 0 ? '+' : ''}${Math.round(totalVariance.calories)} cal`
          });
        }
      }
    }

    const isBalanced = Math.abs(totalVariance.calories) < goals.dailyCalories * 0.2 &&
                      Math.abs(totalVariance.protein) < goals.dailyProtein * 0.2;

    return {
      weekStartDate,
      weekEndDate,
      originalTargets: goals,
      adjustedTargets,
      totalVariance,
      isBalanced,
      recommendApply
    };
  }

  /**
   * Generate intelligent food recommendations based on current intake and goals
   */
  generateFoodRecommendations(
    currentIntake: DailyNutritionSummary,
    goals: NutritionGoals,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ): Array<{
    category: string;
    suggestions: string[];
    reasoning: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    const recommendations = [];
    const shortfalls = currentIntake.shortfalls;

    // Protein recommendations
    if (shortfalls.protein > 10) {
      const proteinFoods = {
        breakfast: ['Greek yogurt with berries', 'Protein smoothie', 'Eggs with vegetables'],
        lunch: ['Grilled chicken breast', 'Salmon salad', 'Lean beef with quinoa'],
        dinner: ['Baked fish with vegetables', 'Turkey breast', 'Tofu stir-fry'],
        snack: ['Protein shake', 'Cottage cheese', 'Hard-boiled eggs']
      };

      recommendations.push({
        category: 'Protein',
        suggestions: proteinFoods[mealType],
        reasoning: `Need ${Math.round(shortfalls.protein)}g more protein today`,
        priority: shortfalls.protein > 20 ? 'high' : 'medium' as 'high' | 'medium'
      });
    }

    // Carbohydrate recommendations
    if (shortfalls.carbs > 15) {
      const carbFoods = {
        breakfast: ['Oatmeal with fruit', 'Whole grain toast', 'Banana with nut butter'],
        lunch: ['Brown rice bowl', 'Sweet potato with protein', 'Quinoa salad'],
        dinner: ['Pasta with lean protein', 'Roasted vegetables with rice', 'Whole grain bread'],
        snack: ['Apple with almond butter', 'Whole grain crackers', 'Dates with nuts']
      };

      recommendations.push({
        category: 'Carbohydrates',
        suggestions: carbFoods[mealType],
        reasoning: `Need ${Math.round(shortfalls.carbs)}g more carbs for energy`,
        priority: 'medium'
      });
    }

    // Healthy fat recommendations
    if (shortfalls.fat > 10) {
      const fatFoods = {
        breakfast: ['Avocado toast', 'Nuts and seeds', 'Chia pudding'],
        lunch: ['Olive oil dressing', 'Avocado salad', 'Nuts as topping'],
        dinner: ['Salmon or fatty fish', 'Olive oil cooking', 'Nuts and seeds'],
        snack: ['Mixed nuts', 'Nut butter', 'Olives']
      };

      recommendations.push({
        category: 'Healthy Fats',
        suggestions: fatFoods[mealType],
        reasoning: `Need ${Math.round(shortfalls.fat)}g more healthy fats`,
        priority: 'low'
      });
    }

    // Fiber recommendations if low
    if (currentIntake.totalFiber < (goals.dailyFiber || 25) * 0.7) {
      recommendations.push({
        category: 'Fiber',
        suggestions: ['Vegetables', 'Fruits with skin', 'Whole grains', 'Legumes'],
        reasoning: 'Increase fiber for digestive health and satiety',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Calculate nutrition timing recommendations around workouts
   */
  calculateWorkoutNutritionTiming(
    workoutTime: string, // ISO string
    workoutDuration: number, // minutes
    workoutIntensity: 'light' | 'moderate' | 'high' | 'max',
    currentGoals: NutritionGoals
  ): {
    preWorkout: {
      timing: string; // "30-60 minutes before"
      carbs: number;
      protein: number;
      hydration: string;
      suggestions: string[];
    };
    duringWorkout: {
      hydration: string;
      carbs?: number;
      suggestions: string[];
    };
    postWorkout: {
      timing: string; // "within 30 minutes"
      carbs: number;
      protein: number;
      hydration: string;
      suggestions: string[];
    };
  } {
    const intensityMultipliers = {
      light: 0.5,
      moderate: 0.75,
      high: 1.0,
      max: 1.25
    };

    const multiplier = intensityMultipliers[workoutIntensity];
    const durationFactor = Math.min(2.0, workoutDuration / 60); // cap at 2x for 2+ hour workouts

    return {
      preWorkout: {
        timing: workoutIntensity === 'light' ? '30 minutes before' : '30-60 minutes before',
        carbs: Math.round(20 * multiplier * durationFactor),
        protein: Math.round(10 * multiplier),
        hydration: '16-20 oz water',
        suggestions: [
          'Banana with a small amount of nut butter',
          'Oatmeal with berries',
          'Toast with honey',
          'Small smoothie with fruit'
        ]
      },
      duringWorkout: {
        hydration: workoutDuration > 60 ? '6-8 oz every 15-20 minutes' : '4-6 oz every 20 minutes',
        carbs: workoutDuration > 60 ? Math.round(30 * multiplier) : undefined,
        suggestions: workoutDuration > 60 ? 
          ['Sports drink', 'Banana', 'Energy gel'] : 
          ['Water is sufficient', 'Electrolyte drink if very hot/humid']
      },
      postWorkout: {
        timing: workoutIntensity === 'max' ? 'within 15 minutes' : 'within 30 minutes',
        carbs: Math.round(40 * multiplier * durationFactor),
        protein: Math.round(25 * multiplier),
        hydration: '24 oz per pound of body weight lost',
        suggestions: [
          'Protein shake with fruit',
          'Chocolate milk',
          'Greek yogurt with granola',
          'Chicken and rice bowl'
        ]
      }
    };
  }
}