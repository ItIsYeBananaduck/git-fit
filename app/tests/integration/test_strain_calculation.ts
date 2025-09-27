import { describe, it, expect, beforeEach, vi } from 'vitest';
import { strainCalculatorService } from '../../src/lib/services/strainCalculator';
import { healthDataService } from '../../src/lib/services/healthData';
import { intensityScoringService } from '../../src/lib/services/intensityScoring';

// Mock services
vi.mock('../../src/lib/services/healthData');
vi.mock('../../src/lib/services/intensityScoring');

interface HealthMetrics {
  heartRate: number;
  spo2: number;
  hrv: number;
  timestamp: number;
}

interface StrainResult {
  currentStrain: number;
  strainStatus: 'green' | 'yellow' | 'red';
  modifier: number;
  recommendations: string[];
}

describe('Integration: Strain Calculation and Modifiers', () => {
  let mockHealthData: HealthMetrics[];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup baseline health data
    mockHealthData = [
      { heartRate: 70, spo2: 99, hrv: 50, timestamp: Date.now() - 3000 },
      { heartRate: 75, spo2: 98, hrv: 48, timestamp: Date.now() - 2000 },
      { heartRate: 80, spo2: 98, hrv: 45, timestamp: Date.now() - 1000 },
      { heartRate: 85, spo2: 97, hrv: 42, timestamp: Date.now() },
    ];

    vi.mocked(healthDataService.getHealthHistory).mockResolvedValue(mockHealthData);
  });

  it('calculates strain progression from baseline health data', async () => {
    const strainResult = await strainCalculatorService.calculateRealTimeStrain({
      heartRate: 120, // Elevated from baseline
      spo2: 95,       // Slightly reduced
      hrv: 35,        // Reduced variability
      previousReadings: mockHealthData,
    });

    expect(strainResult.currentStrain).toBeGreaterThan(0.5);
    expect(strainResult.strainStatus).toBe('yellow');
    expect(strainResult.modifier).toBeLessThan(1.0);
  });

  it('detects red strain conditions from health deterioration', async () => {
    const highStrainData: HealthMetrics = {
      heartRate: 160,  // Very high
      spo2: 92,        // Low oxygen
      hrv: 20,         // Very low variability
      timestamp: Date.now(),
    };

    const strainResult = await strainCalculatorService.calculateRealTimeStrain({
      ...highStrainData,
      previousReadings: mockHealthData,
    });

    expect(strainResult.strainStatus).toBe('red');
    expect(strainResult.modifier).toBe(0.85); // Maximum penalty
    expect(strainResult.recommendations).toContain('extend rest period');
    expect(strainResult.recommendations).toContain('reduce intensity');
  });

  it('maintains green strain with stable health metrics', async () => {
    const stableData: HealthMetrics = {
      heartRate: 85,   // Moderate increase
      spo2: 98,        // Good oxygen
      hrv: 45,         // Stable variability
      timestamp: Date.now(),
    };

    const strainResult = await strainCalculatorService.calculateRealTimeStrain({
      ...stableData,
      previousReadings: mockHealthData,
    });

    expect(strainResult.strainStatus).toBe('green');
    expect(strainResult.modifier).toBe(1.0);
    expect(strainResult.currentStrain).toBeLessThan(0.4);
  });

  it('applies strain modifiers to intensity scoring correctly', async () => {
    // Test with yellow strain (0.95 modifier)
    vi.mocked(strainCalculatorService.getStrainModifier).mockReturnValue(0.95);

    const baseScores = {
      tempoScore: 80,
      motionSmoothnessScore: 75,
      repConsistencyScore: 85,
      userFeedbackScore: 10,
    };

    const result = await intensityScoringService.calculateIntensityScore({
      ...baseScores,
      strainModifier: 0.95,
      isEstimated: false,
    });

    // Base calculation: (80*0.3 + 75*0.25 + 85*0.2 + 10*0.15) * 0.95
    const expectedScore = (80 * 0.3 + 75 * 0.25 + 85 * 0.2 + 10 * 0.15) * 0.95;
    expect(result.totalScore).toBeCloseTo(expectedScore);
    expect(result.strainPenaltyApplied).toBe(true);
  });

  it('tracks strain trends over workout session', async () => {
    const workoutDuration = 3600000; // 1 hour
    const sessionStart = Date.now() - workoutDuration;
    
    // Simulate strain progression during workout
    const strainReadings = [
      { time: sessionStart, strain: 0.2, status: 'green' as const },
      { time: sessionStart + 900000, strain: 0.4, status: 'green' as const }, // 15 min
      { time: sessionStart + 1800000, strain: 0.6, status: 'yellow' as const }, // 30 min
      { time: sessionStart + 2700000, strain: 0.8, status: 'red' as const },    // 45 min
      { time: sessionStart + 3600000, strain: 0.9, status: 'red' as const },    // 60 min
    ];

    const strainTrend = await strainCalculatorService.analyzeStrainTrend(strainReadings);

    expect(strainTrend.progression).toBe('increasing');
    expect(strainTrend.peakTime).toBe(sessionStart + 3600000);
    expect(strainTrend.averageStrain).toBeCloseTo(0.58);
    expect(strainTrend.timeInRedZone).toBe(1800000); // 30 minutes
  });

  it('provides dynamic rest period recommendations', async () => {
    // High strain scenario
    const highStrainResult: StrainResult = {
      currentStrain: 0.85,
      strainStatus: 'red',
      modifier: 0.85,
      recommendations: [],
    };

    const restRecommendation = await strainCalculatorService.calculateDynamicRest({
      currentStrain: highStrainResult.currentStrain,
      strainStatus: highStrainResult.strainStatus,
      baseRestPeriod: 60, // 1 minute base
      previousRestPeriods: [60, 75, 90], // Progressive increases
    });

    expect(restRecommendation.recommendedRestTime).toBeGreaterThan(90);
    expect(restRecommendation.extensionReason).toBe('high_strain_detected');
    expect(restRecommendation.maxExtension).toBe(300); // 5 minute max
  });

  it('integrates with health data collection for continuous monitoring', async () => {
    const realTimeCollectionOptions = {
      metrics: ['heartRate', 'spo2', 'hrv'],
      frequency: 1000,
      strainCallback: strainCalculatorService.updateRealTimeStrain,
    };

    await healthDataService.startRealTimeCollection(realTimeCollectionOptions);

    // Simulate health data stream
    const mockHealthStream = [
      { heartRate: 90, spo2: 97, hrv: 40 },
      { heartRate: 105, spo2: 96, hrv: 38 },
      { heartRate: 120, spo2: 94, hrv: 35 },
    ];

    for (const dataPoint of mockHealthStream) {
      await healthDataService.simulateHealthDataUpdate(dataPoint);
    }

    expect(strainCalculatorService.updateRealTimeStrain).toHaveBeenCalledTimes(3);
    
    const latestStrainStatus = await strainCalculatorService.getCurrentStrainStatus();
    expect(['green', 'yellow', 'red']).toContain(latestStrainStatus);
  });

  it('handles device-specific strain calculation variations', async () => {
    const deviceTypes = ['apple_watch', 'fitbit', 'garmin', 'whoop', 'manual'];

    for (const deviceType of deviceTypes) {
      const deviceResult = await strainCalculatorService.calculateStrainForDevice({
        deviceType,
        healthData: mockHealthData[3],
        previousReadings: mockHealthData.slice(0, 3),
      });

      expect(deviceResult.strainValue).toBeGreaterThan(0);
      expect(deviceResult.strainValue).toBeLessThan(1);
      expect(deviceResult.confidence).toBeGreaterThan(0);
      expect(deviceResult.deviceSpecificAdjustments).toBeDefined();
    }
  });

  it('validates strain calculation performance requirements', async () => {
    const iterations = 100;
    const startTime = Date.now();

    // Perform multiple strain calculations
    const promises = Array.from({ length: iterations }, () =>
      strainCalculatorService.calculateRealTimeStrain({
        heartRate: 90 + Math.random() * 40,
        spo2: 94 + Math.random() * 5,
        hrv: 30 + Math.random() * 20,
        previousReadings: mockHealthData,
      })
    );

    const results = await Promise.all(promises);
    const endTime = Date.now();

    const averageTime = (endTime - startTime) / iterations;
    
    expect(averageTime).toBeLessThan(50); // <50ms per calculation
    expect(results).toHaveLength(iterations);
    expect(results.every(r => r.currentStrain >= 0 && r.currentStrain <= 1)).toBe(true);
  });

  it('persists strain data without exposing sensitive health information', async () => {
    const strainResult = await strainCalculatorService.calculateRealTimeStrain({
      heartRate: 110,
      spo2: 96,
      hrv: 35,
      previousReadings: mockHealthData,
    });

    const persistedData = await strainCalculatorService.getStrainDataForStorage();

    // Verify only strain values are persisted, not raw health data
    expect(persistedData).toMatchObject({
      strainLevel: expect.any(Number),
      strainStatus: expect.any(String),
      timestamp: expect.any(Number),
    });

    // Verify no raw health metrics are included
    expect(persistedData).not.toHaveProperty('heartRate');
    expect(persistedData).not.toHaveProperty('spo2');
    expect(persistedData).not.toHaveProperty('hrv');
  });

  it('recovers gracefully from strain calculation errors', async () => {
    // Simulate invalid health data
    const invalidData = {
      heartRate: -1, // Invalid
      spo2: 110,     // Invalid (>100)
      hrv: NaN,      // Invalid
      previousReadings: [],
    };

    const result = await strainCalculatorService.calculateRealTimeStrain(invalidData);

    expect(result.strainStatus).toBe('green'); // Safe fallback
    expect(result.modifier).toBe(1.0);         // No penalty for invalid data
    expect(result.isEstimated).toBe(true);
    expect(result.errorHandled).toBe(true);
  });
});