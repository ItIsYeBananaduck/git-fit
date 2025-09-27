import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiCoachingService } from '../../src/lib/services/aiCoaching';
import { voiceService } from '../../src/lib/services/voiceService';
import { strainCalculatorService } from '../../src/lib/services/strainCalculator';
import { intensityScoringService } from '../../src/lib/services/intensityScoring';

// Mock all external services
vi.mock('../../src/lib/services/voiceService');
vi.mock('../../src/lib/services/strainCalculator');
vi.mock('../../src/lib/services/intensityScoring');

interface CoachingContext {
  userId: string;
  coachPersonality: 'alice' | 'aiden';
  currentStrainStatus: 'green' | 'yellow' | 'red';
  calibrationPhase: 'week1' | 'active' | 'complete';
  voiceEnabled: boolean;
  hasEarbuds: boolean;
  voiceIntensity: number;
  isZenMode: boolean;
}

interface IntensityScore {
  totalScore: number;
  componentScores: {
    tempo: number;
    smoothness: number;
    consistency: number;
    userFeedback: number;
  };
  strainModifier: number;
}

describe('Integration: AI Coaching with Voice Settings', () => {
  let mockCoachingContext: CoachingContext;
  let mockIntensityScore: IntensityScore;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCoachingContext = {
      userId: 'user_123',
      coachPersonality: 'alice',
      currentStrainStatus: 'green',
      calibrationPhase: 'active',
      voiceEnabled: true,
      hasEarbuds: true,
      voiceIntensity: 75,
      isZenMode: false,
    };

    mockIntensityScore = {
      totalScore: 78,
      componentScores: {
        tempo: 75,
        smoothness: 80,
        consistency: 85,
        userFeedback: 10,
      },
      strainModifier: 1.0,
    };

    // Setup default mock responses
    vi.mocked(voiceService.isEarbudsConnected).mockResolvedValue(true);
    vi.mocked(voiceService.generateVoiceMessage).mockResolvedValue({
      audioUrl: 'https://example.com/coaching.mp3',
      duration: 3.5,
      transcript: 'Great form! Keep it up!',
    });
    vi.mocked(strainCalculatorService.getCurrentStrainStatus).mockReturnValue('green');
  });

  it('provides personalized coaching based on intensity scores', async () => {
    // Low intensity score scenario
    const lowIntensityScore: IntensityScore = {
      totalScore: 45,
      componentScores: {
        tempo: 40,
        smoothness: 45,
        consistency: 50,
        userFeedback: -5,
      },
      strainModifier: 1.0,
    };

    const coachingResponse = await aiCoachingService.provideCoaching({
      context: mockCoachingContext,
      intensityScore: lowIntensityScore,
      exerciseType: 'squat',
    });

    expect(coachingResponse.message).toContain('focus');
    expect(coachingResponse.specificFeedback).toContain('tempo');
    expect(coachingResponse.improvementAreas).toContain('consistency');
    expect(coachingResponse.urgency).toBe('medium');
  });

  it('adjusts coaching style based on coach personality', async () => {
    // Test Alice personality (encouraging)
    const aliceResponse = await aiCoachingService.provideCoaching({
      context: { ...mockCoachingContext, coachPersonality: 'alice' },
      intensityScore: mockIntensityScore,
      exerciseType: 'deadlift',
    });

    expect(aliceResponse.tone).toBe('encouraging');
    expect(aliceResponse.message).toMatch(/great|excellent|awesome/i);

    // Test Aiden personality (analytical)
    const aidenResponse = await aiCoachingService.provideCoaching({
      context: { ...mockCoachingContext, coachPersonality: 'aiden' },
      intensityScore: mockIntensityScore,
      exerciseType: 'deadlift',
    });

    expect(aidenResponse.tone).toBe('analytical');
    expect(aidenResponse.message).toMatch(/analyze|optimize|data/i);
  });

  it('enforces voice coaching only with earbuds connected', async () => {
    // Test without earbuds
    vi.mocked(voiceService.isEarbudsConnected).mockResolvedValue(false);

    const coachingResponse = await aiCoachingService.provideCoaching({
      context: { ...mockCoachingContext, hasEarbuds: false },
      intensityScore: mockIntensityScore,
      exerciseType: 'bench_press',
    });

    expect(coachingResponse.voiceMessageGenerated).toBe(false);
    expect(coachingResponse.textOnly).toBe(true);
    expect(coachingResponse.earbud_requirement_notice).toBeDefined();
    expect(voiceService.generateVoiceMessage).not.toHaveBeenCalled();
  });

  it('respects zen mode settings during high strain', async () => {
    const zenModeContext = {
      ...mockCoachingContext,
      isZenMode: true,
      currentStrainStatus: 'red' as const,
    };

    const coachingResponse = await aiCoachingService.provideCoaching({
      context: zenModeContext,
      intensityScore: mockIntensityScore,
      exerciseType: 'squat',
    });

    expect(coachingResponse.zenModeRespected).toBe(true);
    expect(coachingResponse.silenceReason).toBe('zen_mode_active');
    expect(coachingResponse.voiceMessageGenerated).toBe(false);
    expect(coachingResponse.visualCuesOnly).toBe(true);
  });

  it('automatically activates zen mode during red strain conditions', async () => {
    const highStrainContext = {
      ...mockCoachingContext,
      currentStrainStatus: 'red' as const,
      isZenMode: false, // Not manually enabled
    };

    vi.mocked(strainCalculatorService.getCurrentStrainStatus).mockReturnValue('red');

    const coachingResponse = await aiCoachingService.provideCoaching({
      context: highStrainContext,
      intensityScore: mockIntensityScore,
      exerciseType: 'deadlift',
    });

    expect(coachingResponse.zenModeActivated).toBe(true);
    expect(coachingResponse.autoActivationReason).toBe('high_strain_protection');
    expect(coachingResponse.voiceIntensityReduced).toBe(true);
  });

  it('adjusts voice intensity based on strain levels', async () => {
    // Yellow strain should reduce voice intensity
    const yellowStrainContext = {
      ...mockCoachingContext,
      currentStrainStatus: 'yellow' as const,
      voiceIntensity: 75,
    };

    const coachingResponse = await aiCoachingService.provideCoaching({
      context: yellowStrainContext,
      intensityScore: mockIntensityScore,
      exerciseType: 'overhead_press',
    });

    expect(coachingResponse.voiceIntensityAdjusted).toBe(true);
    expect(coachingResponse.adjustedVoiceIntensity).toBeLessThan(75);
    expect(voiceService.generateVoiceMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        intensity: expect.any(Number),
      })
    );
  });

  it('provides calibration-specific coaching during week 1', async () => {
    const week1Context = {
      ...mockCoachingContext,
      calibrationPhase: 'week1' as const,
    };

    const coachingResponse = await aiCoachingService.provideCoaching({
      context: week1Context,
      intensityScore: mockIntensityScore,
      exerciseType: 'squat',
    });

    expect(coachingResponse.calibrationSpecific).toBe(true);
    expect(coachingResponse.message).toContain('learning');
    expect(coachingResponse.encourageConsistency).toBe(true);
    expect(coachingResponse.avoidIntensityPush).toBe(true);
  });

  it('switches coach personality based on performance patterns', async () => {
    // Simulate multiple poor performance sessions
    const strugglingPattern = [
      { totalScore: 35, timestamp: Date.now() - 86400000 }, // 1 day ago
      { totalScore: 40, timestamp: Date.now() - 43200000 }, // 12 hours ago
      { totalScore: 38, timestamp: Date.now() - 3600000 },  // 1 hour ago
    ];

    const coachingResponse = await aiCoachingService.analyzePerfomanceAndAdjustCoaching({
      context: mockCoachingContext,
      recentScores: strugglingPattern,
      currentScore: { totalScore: 42 },
    });

    expect(coachingResponse.personalityChangeRecommended).toBe(true);
    expect(coachingResponse.recommendedPersonality).toBeDefined();
    expect(coachingResponse.changeReason).toContain('motivation');
  });

  it('integrates real-time coaching with workout flow', async () => {
    // Simulate workout progression
    const workoutStages = [
      { stage: 'warmup', expectedCoaching: 'preparation' },
      { stage: 'working_sets', expectedCoaching: 'performance' },
      { stage: 'cooldown', expectedCoaching: 'recovery' },
    ];

    for (const { stage, expectedCoaching } of workoutStages) {
      const response = await aiCoachingService.provideWorkoutStageCoaching({
        context: mockCoachingContext,
        workoutStage: stage,
        intensityScore: mockIntensityScore,
      });

      expect(response.coachingType).toBe(expectedCoaching);
      expect(response.stageAppropriateTiming).toBe(true);
    }
  });

  it('handles voice generation failures gracefully', async () => {
    // Mock voice service failure
    vi.mocked(voiceService.generateVoiceMessage).mockRejectedValue(
      new Error('Voice generation service unavailable')
    );

    const coachingResponse = await aiCoachingService.provideCoaching({
      context: mockCoachingContext,
      intensityScore: mockIntensityScore,
      exerciseType: 'bench_press',
    });

    expect(coachingResponse.voiceGenerationFailed).toBe(true);
    expect(coachingResponse.fallbackToText).toBe(true);
    expect(coachingResponse.textMessage).toBeDefined();
    expect(coachingResponse.errorHandledGracefully).toBe(true);
  });

  it('provides contextual rest period coaching', async () => {
    const restPeriodContext = {
      ...mockCoachingContext,
      currentStrainStatus: 'yellow' as const,
    };

    const restCoaching = await aiCoachingService.provideRestPeriodCoaching({
      context: restPeriodContext,
      recommendedRestTime: 120, // 2 minutes
      previousRestTime: 60,     // 1 minute actual
      intensityScore: mockIntensityScore,
    });

    expect(restCoaching.restExtensionRecommended).toBe(true);
    expect(restCoaching.extensionReason).toBe('elevated_strain');
    expect(restCoaching.suggestedRestTime).toBeGreaterThan(60);
    expect(restCoaching.coachingMessage).toContain('rest');
  });

  it('tracks coaching effectiveness and adjusts approach', async () => {
    // Simulate coaching history
    const coachingHistory = [
      { message: 'Focus on form', userResponse: 'positive', effectivenessScore: 8 },
      { message: 'Slow down the tempo', userResponse: 'neutral', effectivenessScore: 6 },
      { message: 'Great technique!', userResponse: 'positive', effectivenessScore: 9 },
    ];

    const adaptedCoaching = await aiCoachingService.adaptCoachingStyle({
      context: mockCoachingContext,
      coachingHistory,
      currentIntensityScore: mockIntensityScore,
    });

    expect(adaptedCoaching.styleAdjusted).toBe(true);
    expect(adaptedCoaching.effectivenessImprovement).toBeGreaterThan(0);
    expect(adaptedCoaching.personalizedApproach).toBeDefined();
  });

  it('validates coaching response timing requirements', async () => {
    const startTime = Date.now();

    const coachingResponse = await aiCoachingService.provideCoaching({
      context: mockCoachingContext,
      intensityScore: mockIntensityScore,
      exerciseType: 'squat',
    });

    const responseTime = Date.now() - startTime;

    expect(responseTime).toBeLessThan(500); // <500ms for real-time coaching
    expect(coachingResponse.responseTime).toBeLessThan(500);
    expect(coachingResponse.realTimeCompliant).toBe(true);
  });

  it('maintains coaching context across multiple sets', async () => {
    const setProgression = [
      { setNumber: 1, intensity: 75, feedback: 'good' },
      { setNumber: 2, intensity: 68, feedback: 'focus_needed' },
      { setNumber: 3, intensity: 82, feedback: 'excellent' },
    ];

    let coachingContext = mockCoachingContext;

    for (const set of setProgression) {
      const response = await aiCoachingService.provideSetBasedCoaching({
        context: coachingContext,
        setData: set,
        intensityScore: { ...mockIntensityScore, totalScore: set.intensity },
      });

      expect(response.contextualAwareness).toBe(true);
      expect(response.setProgressionNoted).toBe(true);
      
      // Update context for next iteration
      coachingContext = { ...coachingContext, ...response.updatedContext };
    }
  });
});