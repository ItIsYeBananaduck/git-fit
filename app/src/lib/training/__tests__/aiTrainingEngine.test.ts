// File: aiTrainingEngine.test.ts

import { describe, it, expect } from 'vitest';
import { AITrainingEngineImpl } from '../aiTrainingEngine.js';
import type { WeeklyData, PerformanceAnalysis } from '../aiTrainingEngine.js';

describe('AITrainingEngine', () => {
  const aiEngine = new AITrainingEngineImpl();

  const mockWeeklyData: WeeklyData = {
    sessions: [
      {
        id: 'session1',
        userId: 'user1',
        date: '2024-01-01',
        exerciseId: 'bench_press',
        plannedParams: {
          load: 80,
          reps: 8,
          sets: 3,
          restBetweenSets: 120,
          restBetweenExercises: 180,
          intensity: 'moderate'
        },
        completed: true,
        targetReps: 8,
        actualReps: 8,
        perceivedEffort: 7
      }
    ],
    recoveryMetrics: [
      {
        userId: 'user1',
        date: '2024-01-01',
        recoveryScore: 68,
        hrvScore: 42,
        restingHeartRate: 58,
        sleepPerformance: 75,
        strainYesterday: 12.5,
        baselineDeviation: -5,
        trend: 'stable'
      }
    ]
  };

  it('should analyze weekly performance correctly', async () => {
    const analysis = await aiEngine.analyzeWeeklyPerformance('user1', mockWeeklyData);

    expect(analysis).toBeDefined();
    expect(analysis.consistencyScore).toBeGreaterThanOrEqual(0);
    expect(analysis.consistencyScore).toBeLessThanOrEqual(100);
    expect(typeof analysis.effortTrend).toBe('number');
    expect(typeof analysis.recoveryTrend).toBe('number');
    expect(analysis.adaptationScore).toBeGreaterThanOrEqual(0);
    expect(analysis.adaptationScore).toBeLessThanOrEqual(100);
  });

  it('should calculate program adjustments based on analysis', async () => {
    const analysis: PerformanceAnalysis = {
      consistencyScore: 95,
      effortTrend: 5,
      recoveryTrend: 10,
      adaptationScore: 85
    };

    const adjustments = await aiEngine.calculateProgramAdjustments(analysis);

    expect(adjustments).toBeDefined();
    expect(typeof adjustments.loadAdjustment).toBe('number');
    expect(typeof adjustments.volumeAdjustment).toBe('number');
    expect(typeof adjustments.intensityAdjustment).toBe('number');
  });

  it('should predict RIR for exercises', async () => {
    const exercise = { name: 'Bench Press', muscleGroup: 'chest', equipment: 'barbell' };
    const prediction = await aiEngine.predictRIR('user1', exercise, 2);

    expect(prediction).toBeDefined();
    expect(prediction.predictedRIR).toBeGreaterThanOrEqual(0);
    expect(prediction.confidence).toBeGreaterThanOrEqual(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
  });

  it('should assess recovery status', async () => {
    const recoveryStatus = await aiEngine.assessRecoveryStatus(mockWeeklyData.recoveryMetrics);

    expect(recoveryStatus).toBeDefined();
    expect(recoveryStatus.recoveryScore).toBe(68);
    expect(['low', 'moderate', 'high', 'very_high']).toContain(recoveryStatus.fatigueLevel);
  });

  it('should determine deload timing', async () => {
    const deloadRec = await aiEngine.determineDeloadTiming(
      'user1',
      4,
      { trend: 'stable', averageRecovery: 68 }
    );

    expect(deloadRec).toBeDefined();
    expect(typeof deloadRec.shouldDeload).toBe('boolean');
    expect(typeof deloadRec.reasoning).toBe('string');
  });

  it('should calculate rest adjustments based on strain', async () => {
    const strainMetrics = {
      currentStrain: 5,
      heartRate: 75,
      hrvDeviation: -2,
      perceivedExertion: 6,
      strain: 10, // Added missing property
      duration: 60 // Added missing property
    };

    const restAdjustment = await aiEngine.calculateRestAdjustment(strainMetrics, 120);

    expect(restAdjustment).toBeDefined();
    expect(restAdjustment.adjustedRestTime).toBeGreaterThan(120); // Should increase rest due to high strain
    expect(typeof restAdjustment.reason).toBe('string');
    expect(restAdjustment.multiplier).toBeGreaterThan(1);
  });

  it('should generate safety overrides for danger signals', async () => {
    const dangerSignals = [
      {
        type: 'hrv_drop' as const,
        severity: 'high' as const,
        value: 25,
        threshold: 35
      }
    ];

    const safetyOverride = await aiEngine.generateSafetyOverride(dangerSignals);

    expect(safetyOverride).toBeDefined();
    expect(safetyOverride.shouldStop).toBe(true); // High severity should trigger stop
    expect(safetyOverride.warnings.length).toBeGreaterThan(0);
  });
});