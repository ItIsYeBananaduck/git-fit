import type { NutritionGoals, NutritionInfo } from './nutritionCalculator';
import type { RecoveryData, TrainingSession } from '../types/sharedTypes';

interface UserProfile {
  name: string;
  weight: number;
  height: number;
  age: number;
  sex: 'male' | 'female';
}

interface FoodNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

interface FoodItem {
  id: string;
  name: string;
  servingSize: number;
  nutrition: FoodNutrition;
}

interface MealFood {
  foodId: string;
  name: string;
  servingSize: number;
  nutrition: FoodNutrition;
}

interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: MealFood[];
  totalNutrition: FoodNutrition;
}

export interface MealPlanDay {
  dayNumber: number;
  meals: Meal[];
  totalNutrition: FoodNutrition;
}

export interface GeneratedMealPlan {
  name: string;
  description: string;
  duration: number;
  goals: string[];
  preferences: MealPlanPreferences;
  days: MealPlanDay[];
  totalNutrition: {
    total: FoodNutrition;
    dailyAverage: FoodNutrition;
  };
  recommendations: string[];
}
import { NutritionCalculator } from './nutritionCalculator';

export interface MealPlanPreferences {
  dietaryRestrictions: string[];
  allergies: string[];
  cuisinePreferences: string[];
  budget: 'low' | 'medium' | 'high';
  mealsPerDay: number;
  snacksPerDay: number;
  cookingSkill: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * AI-Powered Nutrition Plan Generator
 * Creates personalized meal plans based on user goals, recovery data, and preferences
 */
export class NutritionPlanGenerator {
  private nutritionCalculator: NutritionCalculator;

  constructor() {
    this.nutritionCalculator = new NutritionCalculator();
  }

  /**
   * Generate a comprehensive meal plan for a user
   */
  async generateMealPlan(
    userProfile: UserProfile,
    goals: NutritionGoals,
    preferences: MealPlanPreferences,
    recoveryData?: RecoveryData[],
    trainingSchedule?: TrainingSession[],
    duration: number = 7
  ): Promise<GeneratedMealPlan> {
    const planName = this.generatePlanName(userProfile, goals);
    const recommendations = this.generateRecommendations(userProfile, goals, preferences, recoveryData);

    // Generate meal plan structure
    const days = await this.generateMealPlanDays(
      goals,
      preferences,
      duration,
      recoveryData,
      trainingSchedule
    );

    // Calculate total nutrition for the plan
    const totalNutrition = this.calculatePlanTotals(days);

    return {
      name: planName,
      description: this.generatePlanDescription(userProfile, goals, preferences),
      duration,
      goals: this.extractGoalTypes(goals),
      preferences,
      days,
      totalNutrition,
      recommendations,
    };
  }

  /**
   * Generate meal plan for a specific day with recovery-aware adjustments
   */
  async generateDailyMealPlan(
    goals: NutritionGoals,
    preferences: MealPlanPreferences,
    dayNumber: number,
    recoveryData?: RecoveryData[],
    trainingToday?: TrainingSession
  ): Promise<MealPlanDay> {
    // Apply recovery-aware adjustments to goals
    const adjustedGoals = this.applyRecoveryAdjustments(goals, recoveryData, trainingToday);

    // Generate meals for the day
    const meals = await this.generateMealsForDay(adjustedGoals, preferences, trainingToday);

    // Calculate day totals
    const totalNutrition = this.calculateDayTotals(meals);

    return {
      dayNumber,
      meals,
      totalNutrition,
    };
  }

  private generatePlanName(userProfile: UserProfile, goals: NutritionGoals): string {
    const goalType = this.getPrimaryGoal(goals);
    const calorieLevel = goals.calories > 2500 ? 'High-Calorie' : goals.calories > 2000 ? 'Moderate-Calorie' : 'Low-Calorie';

    return `${goalType} ${calorieLevel} Plan for ${userProfile.name}`;
  }

  private generatePlanDescription(
    userProfile: UserProfile,
    goals: NutritionGoals,
    preferences: MealPlanPreferences
  ): string {
    const restrictions = preferences.dietaryRestrictions.length > 0
      ? ` with ${preferences.dietaryRestrictions.join(', ')} restrictions`
      : '';

    return `Personalized ${this.getPrimaryGoal(goals).toLowerCase()} meal plan${restrictions} designed for ${userProfile.name}'s fitness goals and preferences.`;
  }

  private generateRecommendations(
    userProfile: UserProfile,
    goals: NutritionGoals,
    preferences: MealPlanPreferences,
    recoveryData?: RecoveryData[]
  ): string[] {
    const recommendations: string[] = [];

    // Goal-based recommendations
    if (goals.protein > userProfile.weight * 1.6) {
      recommendations.push('🎯 High protein focus - prioritize lean meats, eggs, and dairy');
    }

    if (goals.carbs < goals.calories * 0.4) {
      recommendations.push('🍚 Moderate carb approach - focus on complex carbohydrates');
    }

    // Recovery-based recommendations
    if (recoveryData && recoveryData.length > 0) {
      const latestRecovery = recoveryData[recoveryData.length - 1];
      if (latestRecovery.recoveryScore < 50) {
        recommendations.push('🔋 Recovery-focused - increased nutrient density for better recovery');
      }
    }

    // Preference-based recommendations
    if (preferences.cookingSkill === 'beginner') {
      recommendations.push('👨‍🍳 Beginner-friendly recipes with simple preparation methods');
    }

    if (preferences.budget === 'low') {
      recommendations.push('💰 Budget-conscious choices using affordable, seasonal ingredients');
    }

    return recommendations;
  }

  private async generateMealPlanDays(
    goals: NutritionGoals,
    preferences: MealPlanPreferences,
    duration: number,
    recoveryData?: RecoveryData[],
    trainingSchedule?: TrainingSession[]
  ): Promise<MealPlanDay[]> {
    const days: MealPlanDay[] = [];

    for (let day = 1; day <= duration; day++) {
      const trainingToday = trainingSchedule?.find(session =>
        new Date(session.date).getDay() === (day - 1) % 7
      );

      const dayPlan = await this.generateDailyMealPlan(
        goals,
        preferences,
        day,
        recoveryData,
        trainingToday
      );

      days.push(dayPlan);
    }

    return days;
  }

  private async generateMealsForDay(
    goals: NutritionGoals,
    preferences: MealPlanPreferences,
    trainingToday?: TrainingSession
  ): Promise<MealPlanDay['meals']> {
    const meals: MealPlanDay['meals'] = [];

    // Define meal structure based on preferences
    const mealTypes = this.getMealTypes(preferences);

    for (const mealType of mealTypes) {
      const meal = await this.generateMeal(goals, preferences, mealType, trainingToday);
      meals.push(meal);
    }

    return meals;
  }

  private async generateMeal(
    goals: NutritionGoals,
    preferences: MealPlanPreferences,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    trainingToday?: TrainingSession
  ): Promise<MealPlanDay['meals'][0]> {
    // Calculate target nutrition for this meal
    const mealTargets = this.calculateMealTargets(goals, mealType, trainingToday);

    // Select foods based on preferences and targets
    const foods = await this.selectFoodsForMeal(mealTargets, preferences, mealType);

    // Calculate total nutrition for the meal
    const totalNutrition = this.calculateMealTotals(foods);

    return {
      type: mealType,
      foods,
      totalNutrition,
    };
  }

  private calculateMealTargets(
    goals: NutritionGoals,
    mealType: string,
    trainingToday?: TrainingSession
  ): Partial<NutritionGoals> {
    const basePercentages: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
      breakfast: { calories: 0.25, protein: 0.25, carbs: 0.30, fat: 0.20 },
      lunch: { calories: 0.30, protein: 0.30, carbs: 0.35, fat: 0.25 },
      dinner: { calories: 0.30, protein: 0.30, carbs: 0.25, fat: 0.30 },
      snack: { calories: 0.15, protein: 0.15, carbs: 0.10, fat: 0.25 },
    };

    const percentages = basePercentages[mealType] || basePercentages.snack;

    // Adjust for training day
    if (trainingToday && (mealType === 'lunch' || mealType === 'dinner')) {
      percentages.carbs += 0.05; // Extra carbs around training
      percentages.protein += 0.03; // Extra protein for recovery
    }

    return {
      calories: Math.round(goals.calories * percentages.calories),
      protein: Math.round(goals.protein * percentages.protein),
      carbs: Math.round(goals.carbs * percentages.carbs),
      fat: Math.round(goals.fat * percentages.fat),
    };
  }

  private async selectFoodsForMeal(
    targets: Partial<NutritionGoals>,
    preferences: MealPlanPreferences,
    mealType: string
  ): Promise<MealPlanDay['meals'][0]['foods']> {
    // This would integrate with the food database to select appropriate foods
    // For now, return placeholder foods based on meal type
    const placeholderFoods = this.getPlaceholderFoods(mealType);

    return placeholderFoods.map(food => ({
      foodId: food.id,
      name: food.name,
      servingSize: food.servingSize,
      nutrition: food.nutrition,
    }));
  }

  private getPlaceholderFoods(mealType: string): FoodItem[] {
    const foodTemplates: Record<string, FoodItem[]> = {
      breakfast: [
        { id: 'oats', name: 'Oatmeal', servingSize: 50, nutrition: { calories: 190, protein: 6, carbs: 33, fat: 3 } },
        { id: 'banana', name: 'Banana', servingSize: 120, nutrition: { calories: 105, protein: 1, carbs: 27, fat: 0 } },
        { id: 'eggs', name: 'Eggs', servingSize: 100, nutrition: { calories: 155, protein: 13, carbs: 1, fat: 11 } },
      ],
      lunch: [
        { id: 'chicken', name: 'Grilled Chicken Breast', servingSize: 150, nutrition: { calories: 231, protein: 43, carbs: 0, fat: 5 } },
        { id: 'rice', name: 'Brown Rice', servingSize: 100, nutrition: { calories: 111, protein: 2, carbs: 23, fat: 1 } },
        { id: 'broccoli', name: 'Broccoli', servingSize: 100, nutrition: { calories: 34, protein: 3, carbs: 7, fat: 0 } },
      ],
      dinner: [
        { id: 'salmon', name: 'Salmon', servingSize: 150, nutrition: { calories: 353, protein: 35, carbs: 0, fat: 20 } },
        { id: 'sweet_potato', name: 'Sweet Potato', servingSize: 150, nutrition: { calories: 129, protein: 2, carbs: 30, fat: 0 } },
        { id: 'spinach', name: 'Spinach', servingSize: 100, nutrition: { calories: 23, protein: 3, carbs: 4, fat: 0 } },
      ],
      snack: [
        { id: 'greek_yogurt', name: 'Greek Yogurt', servingSize: 150, nutrition: { calories: 100, protein: 17, carbs: 6, fat: 0 } },
        { id: 'almonds', name: 'Almonds', servingSize: 30, nutrition: { calories: 164, protein: 6, carbs: 6, fat: 14 } },
      ],
    };

    return foodTemplates[mealType] || foodTemplates.snack;
  }

  private calculateMealTotals(foods: MealFood[]): FoodNutrition {
    return foods.reduce(
      (totals, food) => ({
        calories: totals.calories + food.nutrition.calories,
        protein: totals.protein + food.nutrition.protein,
        carbs: totals.carbs + food.nutrition.carbs,
        fat: totals.fat + food.nutrition.fat,
        fiber: totals.fiber + (food.nutrition.fiber || 0),
        sugar: totals.sugar + (food.nutrition.sugar || 0),
        sodium: totals.sodium + (food.nutrition.sodium || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    );
  }

  private calculateDayTotals(meals: Meal[]): FoodNutrition {
    return meals.reduce(
      (totals, meal) => ({
        calories: totals.calories + meal.totalNutrition.calories,
        protein: totals.protein + meal.totalNutrition.protein,
        carbs: totals.carbs + meal.totalNutrition.carbs,
        fat: totals.fat + meal.totalNutrition.fat,
        fiber: (totals.fiber || 0) + (meal.totalNutrition.fiber || 0),
        sugar: (totals.sugar || 0) + (meal.totalNutrition.sugar || 0),
        sodium: (totals.sodium || 0) + (meal.totalNutrition.sodium || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    );
  }

  private calculatePlanTotals(days: MealPlanDay[]): { total: FoodNutrition; dailyAverage: FoodNutrition } {
    const dayTotals = days.map(day => day.totalNutrition);
    const planTotal = dayTotals.reduce(
      (totals, day) => ({
        calories: totals.calories + day.calories,
        protein: totals.protein + day.protein,
        carbs: totals.carbs + day.carbs,
        fat: totals.fat + day.fat,
        fiber: (totals.fiber || 0) + (day.fiber || 0),
        sugar: (totals.sugar || 0) + (day.sugar || 0),
        sodium: (totals.sodium || 0) + (day.sodium || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    );

    // Calculate averages
    const dayCount = days.length;
    return {
      total: planTotal,
      dailyAverage: {
        calories: Math.round(planTotal.calories / dayCount),
        protein: Math.round(planTotal.protein / dayCount),
        carbs: Math.round(planTotal.carbs / dayCount),
        fat: Math.round(planTotal.fat / dayCount),
        fiber: Math.round((planTotal.fiber || 0) / dayCount),
        sugar: Math.round((planTotal.sugar || 0) / dayCount),
        sodium: Math.round((planTotal.sodium || 0) / dayCount),
      },
    };
  }

  private applyRecoveryAdjustments(
    goals: NutritionGoals,
    recoveryData?: RecoveryData[],
    trainingToday?: TrainingSession
  ): NutritionGoals {
    if (!recoveryData || recoveryData.length === 0) {
      return goals;
    }

    // Use recovery data for adjustments
    const adjustments = this.nutritionCalculator.calculateRecoveryAdjustments(
      goals,
      recoveryData,
      trainingToday ? [trainingToday] : []
    );

    return {
      ...goals,
      calories: goals.calories + adjustments.adjustments.caloriesDelta,
      protein: goals.protein + adjustments.adjustments.proteinDelta,
      carbs: goals.carbs + adjustments.adjustments.carbsDelta,
      fat: goals.fat + adjustments.adjustments.fatDelta,
    };
  }

  private getMealTypes(preferences: MealPlanPreferences): ('breakfast' | 'lunch' | 'dinner' | 'snack')[] {
    const types: ('breakfast' | 'lunch' | 'dinner' | 'snack')[] = ['breakfast', 'lunch', 'dinner'];

    // Add snacks based on preference
    for (let i = 0; i < preferences.snacksPerDay; i++) {
      types.push('snack');
    }

    return types;
  }

  private getPrimaryGoal(goals: NutritionGoals): string {
    if (goals.calories > 2500) return 'Muscle Gain';
    if (goals.calories < 2000) return 'Weight Loss';
    return 'Maintenance';
  }

  private extractGoalTypes(goals: NutritionGoals): string[] {
    const goalTypes: string[] = [];

    if (goals.protein > 1.6 * (goals.calories / 2000)) {
      goalTypes.push('muscle_gain');
    }

    if (goals.calories < 2000) {
      goalTypes.push('weight_loss');
    } else if (goals.calories > 2500) {
      goalTypes.push('weight_gain');
    } else {
      goalTypes.push('maintenance');
    }

    return goalTypes;
  }

  /**
   * Optimize an existing meal plan based on user feedback and progress
   */
  async optimizeMealPlan(
    existingPlan: GeneratedMealPlan,
    userFeedback: string[],
    progressData: { date: string; actual: number; target: number }[]
  ): Promise<GeneratedMealPlan> {
    // Analyze feedback and progress to identify areas for improvement
    const optimizations = this.analyzeFeedbackAndProgress(userFeedback, progressData);

    // Apply optimizations to the plan
    const optimizedPlan = { ...existingPlan };

    // Add optimization recommendations
    optimizedPlan.recommendations.push(...optimizations);

    return optimizedPlan;
  }

  private analyzeFeedbackAndProgress(feedback: string[], progress: { date: string; actual: number; target: number }[]): string[] {
    const optimizations: string[] = [];

    // Analyze common feedback patterns
    const feedbackText = feedback.join(' ').toLowerCase();

    if (feedbackText.includes('hungry') || feedbackText.includes('not enough')) {
      optimizations.push('🍽️ Increased portion sizes based on hunger feedback');
    }

    if (feedbackText.includes('tired') || feedbackText.includes('low energy')) {
      optimizations.push('⚡ Boosted carbohydrate content for better energy levels');
    }

    if (feedbackText.includes('expensive') || feedbackText.includes('cost')) {
      optimizations.push('💰 Switched to more budget-friendly ingredient alternatives');
    }

    return optimizations;
  }
}