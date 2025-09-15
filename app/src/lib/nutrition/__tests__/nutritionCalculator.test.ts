// File: nutritionCalculator.test.ts

import { describe, it, expect } from 'vitest';
import { NutritionCalculator } from '../nutritionCalculator';
import type { NutritionGoals, FoodItem, FoodEntry } from '../nutritionCalculator';

describe('NutritionCalculator', () => {
  const calculator = new NutritionCalculator();

  describe('calculateBaseGoals', () => {
    it('should calculate base nutrition goals for muscle gain', () => {
      const goals = calculator.calculateBaseGoals(
        30, // age
        70, // weight (kg)
        175, // height (cm)
        'male',
        'moderate',
        'gain_muscle'
      );

      expect(goals).toBeDefined();
      expect(goals.calories).toBeGreaterThan(2000);
      expect(goals.protein).toBeGreaterThan(100); // High protein for muscle gain
      expect(goals.carbs).toBeGreaterThan(0);
      expect(goals.fat).toBeGreaterThan(0);
      expect(goals.fiber).toBeGreaterThan(0);
    });

    it('should calculate different goals for weight loss', () => {
      const muscleGain = calculator.calculateBaseGoals(30, 70, 175, 'male', 'moderate', 'gain_muscle');
      const weightLoss = calculator.calculateBaseGoals(30, 70, 175, 'male', 'moderate', 'lose_weight');

      expect(weightLoss.calories).toBeLessThan(muscleGain.calories);
      expect(weightLoss.protein).toBeGreaterThanOrEqual(muscleGain.protein * 0.9); // Maintain high protein
    });

    it('should calculate different goals for females', () => {
      const maleGoals = calculator.calculateBaseGoals(30, 70, 175, 'male', 'moderate', 'maintain');
      const femaleGoals = calculator.calculateBaseGoals(30, 70, 175, 'female', 'moderate', 'maintain');

      expect(femaleGoals.calories).toBeLessThan(maleGoals.calories); // Lower BMR for females
    });
  });

  describe('calculateRecoveryAdjustments', () => {
    const baseGoals: NutritionGoals = {
      calories: 2500,
      protein: 150,
      carbs: 300,
      fat: 80,
      fiber: 35,
      sugar: 60
    };

    const mockRecoveryData = [
      {
        userId: 'user1',
        date: '2024-01-01',
        recoveryScore: 40, // Poor recovery
        hrv: 35, // Updated to match RecoveryData
        restingHR: 65, // Updated to match RecoveryData
        sleepQuality: 3, // Updated to match RecoveryData
        strainYesterday: 10,
        baselineDeviation: -10,
        trend: 'declining' as const
      }
    ];

    it('should recommend nutrition boost for poor recovery', () => {
      const adjustments = calculator.calculateRecoveryAdjustments(
        baseGoals,
        mockRecoveryData,
        []
      );

      expect(adjustments.reason).toBe('recovery_boost');
      expect(adjustments.adjustments.caloriesDelta).toBeGreaterThan(0);
      expect(adjustments.adjustments.carbsDelta).toBeGreaterThan(0);
      expect(adjustments.adjustments.proteinDelta).toBeGreaterThan(0);
      expect(adjustments.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide training day adjustments', () => {
      const trainingSession = [{
        id: 'session1',
        userId: 'user1',
        date: new Date().toISOString(),
        exerciseId: 'bench_press',
        plannedParams: {
          load: 80,
          reps: 8,
          sets: 3,
          restBetweenSets: 120,
          restBetweenExercises: 180,
          intensity: 'moderate' as const
        },
        mealType: 'lunch' as const,
        nutrition: {
          calories: 100,
          protein: 10,
          carbs: 10,
          fat: 5,
          fiber: 2,
          sugar: 3,
          sodium: 100
        },
        strain: 5, // Added missing property
        exercises: ['bench_press'] // Added missing property
      }];

      const goodRecovery = [{
        ...mockRecoveryData[0],
        recoveryScore: 80
      }];

      const adjustments = calculator.calculateRecoveryAdjustments(
        baseGoals,
        goodRecovery,
        trainingSession
      );

      expect(adjustments.reason).toBe('training_day');
      expect(adjustments.adjustments.carbsDelta).toBeGreaterThan(0);
      expect(adjustments.timing).toBe('post_workout');
    });
  });

  describe('calculateNutritionForServing', () => {
    const mockFood: FoodItem = {
      id: 'chicken_breast',
      name: 'Chicken Breast',
      nutritionPer100g: {
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        sugar: 0,
        sodium: 74
      },
      servingSizes: [
        { name: '100g', grams: 100, description: '100 grams' }
      ],
      category: 'meat',
      verified: true
    };

    it('should calculate nutrition for different serving sizes', () => {
      const nutrition150g = calculator.calculateNutritionForServing(mockFood, 150);
      const nutrition100g = calculator.calculateNutritionForServing(mockFood, 100);

      expect(nutrition150g.calories).toBe(Math.round(165 * 1.5));
      expect(nutrition150g.protein).toBeCloseTo(31 * 1.5, 1);
      expect(nutrition100g.calories).toBe(165);
      expect(nutrition100g.protein).toBe(31);
    });
  });

  describe('analyzeGoalProgress', () => {
    const goals: NutritionGoals = {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 67,
      fiber: 28,
      sugar: 50
    };

    it('should identify under-eating', () => {
      const actualLow = {
        calories: 1500, // 75% of goal
        protein: 100,
        carbs: 180,
        fat: 50,
        fiber: 20,
        sugar: 30,
        sodium: 2000
      };

      const analysis = calculator.analyzeGoalProgress(goals, actualLow);
      
      expect(analysis.status).toBe('under');
      expect(analysis.percentages.calories).toBe(75);
      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });

    it('should identify over-eating', () => {
      const actualHigh = {
        calories: 2400, // 120% of goal
        protein: 180,
        carbs: 300,
        fat: 80,
        fiber: 35,
        sugar: 60,
        sodium: 2500
      };

      const analysis = calculator.analyzeGoalProgress(goals, actualHigh);
      
      expect(analysis.status).toBe('over');
      expect(analysis.percentages.calories).toBe(120);
    });

    it('should identify on-track nutrition', () => {
      const actualGood = {
        calories: 1950, // 97.5% of goal
        protein: 145,
        carbs: 240,
        fat: 65,
        fiber: 26,
        sugar: 45,
        sodium: 2000
      };

      const analysis = calculator.analyzeGoalProgress(goals, actualGood);
      
      expect(analysis.status).toBe('on_track');
      expect(analysis.percentages.calories).toBeCloseTo(97.5, 1);
    });
  });

  describe('calculateDailyTotals', () => {
    const mockEntries: FoodEntry[] = [
      {
        id: 'entry1',
        userId: 'user1',
        foodId: 'food1',
        servingSize: 100,
        mealType: 'breakfast',
        date: '2024-01-01',
        nutrition: {
          calories: 200,
          protein: 10,
          carbs: 30,
          fat: 8,
          fiber: 5,
          sugar: 10,
          sodium: 200
        }
      },
      {
        id: 'entry2',
        userId: 'user1',
        foodId: 'food2',
        servingSize: 150,
        mealType: 'lunch',
        date: '2024-01-01',
        nutrition: {
          calories: 300,
          protein: 20,
          carbs: 40,
          fat: 10,
          fiber: 8,
          sugar: 5,
          sodium: 300
        }
      }
    ];

    it('should sum nutrition from all entries', () => {
      const totals = calculator.calculateDailyTotals(mockEntries);

      expect(totals.calories).toBe(500);
      expect(totals.protein).toBe(30);
      expect(totals.carbs).toBe(70);
      expect(totals.fat).toBe(18);
      expect(totals.fiber).toBe(13);
      expect(totals.sugar).toBe(15);
      expect(totals.sodium).toBe(500);
    });

    it('should return zero totals for empty entries', () => {
      const totals = calculator.calculateDailyTotals([]);

      expect(totals.calories).toBe(0);
      expect(totals.protein).toBe(0);
      expect(totals.carbs).toBe(0);
      expect(totals.fat).toBe(0);
      expect(totals.fiber).toBe(0);
      expect(totals.sugar).toBe(0);
      expect(totals.sodium).toBe(0);
    });
  });
});