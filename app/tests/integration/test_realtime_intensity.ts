import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { get } from 'svelte/store';
import WorkoutSession from '../../src/routes/workouts/[id]/+page.svelte';
import { intensityScoreStore } from '../../src/lib/stores/intensityScore';
import { strainCalculatorService } from '../../src/lib/services/strainCalculator';
import { healthDataService } from '../../src/lib/services/healthData';
import { intensityScoringService } from '../../src/lib/services/intensityScoring';

// Mock health data service
vi.mock('../../src/lib/services/healthData', () => ({
  healthDataService: {
    startRealTimeCollection: vi.fn(),
    stopRealTimeCollection: vi.fn(),
    getCurrentHealthData: vi.fn(),
    isAvailable: vi.fn(() => true),
  }
}));

// Mock strain calculator service  
vi.mock('../../src/lib/services/strainCalculator', () => ({
  strainCalculatorService: {
    calculateRealTimeStrain: vi.fn(),
    getStrainModifier: vi.fn(() => 1.0),
    getCurrentStrainStatus: vi.fn(() => 'green'),
  }
}));

// Mock intensity scoring service
vi.mock('../../src/lib/services/intensityScoring', () => ({
  intensityScoringService: {
    calculateIntensityScore: vi.fn(),
    updateRealTimeScore: vi.fn(),
    getComponentScores: vi.fn(),
  }
}));

describe('Integration: Real-time Intensity Scoring Workflow', () => {
  let mockWorkoutId: string;
  let mockHealthData: any;

  beforeEach(() => {
    mockWorkoutId = 'workout_123';
    mockHealthData = {
      heartRate: 85,
      spo2: 98,
      hrv: 45,
      timestamp: Date.now(),
    };

    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock responses
    vi.mocked(healthDataService.getCurrentHealthData).mockResolvedValue(mockHealthData);
    vi.mocked(strainCalculatorService.calculateRealTimeStrain).mockReturnValue({
      currentStrain: 0.3,
      strainStatus: 'green',
      modifier: 1.0,
    });
    vi.mocked(intensityScoringService.calculateIntensityScore).mockResolvedValue({
      totalScore: 78,
      componentScores: {
        tempo: 75,
        smoothness: 80,
        consistency: 85,
        userFeedback: 10,
      },
      strainModifier: 1.0,
    });
  });

  it('starts real-time health data collection on workout begin', async () => {
    render(WorkoutSession, { params: { id: mockWorkoutId } });

    const startButton = screen.getByRole('button', { name: /start workout/i });
    await fireEvent.click(startButton);

    expect(healthDataService.startRealTimeCollection).toHaveBeenCalledWith({
      metrics: ['heartRate', 'spo2', 'hrv'],
      frequency: 1000, // 1 second intervals
      workoutId: mockWorkoutId,
    });
  });

  it('calculates real-time strain during exercise execution', async () => {
    render(WorkoutSession, { params: { id: mockWorkoutId } });

    // Start workout
    const startButton = screen.getByRole('button', { name: /start workout/i });
    await fireEvent.click(startButton);

    // Simulate health data updates
    vi.mocked(healthDataService.getCurrentHealthData).mockResolvedValue({
      ...mockHealthData,
      heartRate: 120, // Elevated heart rate
    });

    // Wait for real-time update interval
    await waitFor(() => {
      expect(strainCalculatorService.calculateRealTimeStrain).toHaveBeenCalledWith({
        heartRate: 120,
        spo2: 98,
        hrv: 45,
        previousReadings: expect.any(Array),
      });
    }, { timeout: 2000 });
  });

  it('updates intensity score in real-time during sets', async () => {
    render(WorkoutSession, { params: { id: mockWorkoutId } });

    // Start workout and begin first set
    const startButton = screen.getByRole('button', { name: /start workout/i });
    await fireEvent.click(startButton);

    const startSetButton = screen.getByRole('button', { name: /start set/i });
    await fireEvent.click(startSetButton);

    // Simulate completing reps with form feedback
    const repButton = screen.getByRole('button', { name: /complete rep/i });
    await fireEvent.click(repButton);
    await fireEvent.click(repButton);
    await fireEvent.click(repButton);

    // Verify real-time scoring is called
    await waitFor(() => {
      expect(intensityScoringService.updateRealTimeScore).toHaveBeenCalledWith({
        setId: expect.any(String),
        currentRep: 3,
        healthData: expect.objectContaining({
          heartRate: expect.any(Number),
          spo2: expect.any(Number),
        }),
        strainModifier: expect.any(Number),
      });
    }, { timeout: 2000 });
  });

  it('displays intensity score with <1 second latency requirement', async () => {
    render(WorkoutSession, { params: { id: mockWorkoutId } });

    // Start workout
    const startButton = screen.getByRole('button', { name: /start workout/i });
    await fireEvent.click(startButton);

    const startTime = Date.now();

    // Trigger intensity calculation
    const completeSetButton = screen.getByRole('button', { name: /complete set/i });
    await fireEvent.click(completeSetButton);

    // Verify score appears within 1 second
    await waitFor(() => {
      const scoreDisplay = screen.getByTestId('intensity-score-display');
      expect(scoreDisplay).toBeInTheDocument();
      expect(Date.now() - startTime).toBeLessThan(1000); // <1 second requirement
    }, { timeout: 1000 });
  });

  it('handles strain status changes with UI feedback', async () => {
    render(WorkoutSession, { params: { id: mockWorkoutId } });

    // Start workout
    const startButton = screen.getByRole('button', { name: /start workout/i });
    await fireEvent.click(startButton);

    // Simulate high strain condition
    vi.mocked(strainCalculatorService.getCurrentStrainStatus).mockReturnValue('red');
    vi.mocked(strainCalculatorService.getStrainModifier).mockReturnValue(0.85);

    // Trigger strain status update
    await fireEvent.click(screen.getByRole('button', { name: /complete set/i }));

    await waitFor(() => {
      const strainWarning = screen.getByTestId('strain-status-warning');
      expect(strainWarning).toBeInTheDocument();
      expect(strainWarning).toHaveClass('strain-red');
      expect(screen.getByText(/high strain detected/i)).toBeInTheDocument();
    });
  });

  it('integrates voice coaching based on intensity patterns', async () => {
    // Mock voice coaching enabled
    Object.defineProperty(window.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({}),
      },
    });

    render(WorkoutSession, { params: { id: mockWorkoutId } });

    // Enable voice coaching
    const voiceToggle = screen.getByRole('switch', { name: /voice coaching/i });
    await fireEvent.click(voiceToggle);

    // Complete set with low intensity
    vi.mocked(intensityScoringService.calculateIntensityScore).mockResolvedValue({
      totalScore: 45, // Low intensity
      componentScores: { tempo: 40, smoothness: 45, consistency: 50, userFeedback: -5 },
      strainModifier: 1.0,
    });

    const completeSetButton = screen.getByRole('button', { name: /complete set/i });
    await fireEvent.click(completeSetButton);

    await waitFor(() => {
      const coachingMessage = screen.getByTestId('voice-coaching-message');
      expect(coachingMessage).toBeInTheDocument();
      expect(coachingMessage).toHaveTextContent(/focus.*form/i);
    });
  });

  it('persists intensity scores to Convex backend', async () => {
    // Mock Convex API call
    const mockConvexMutation = vi.fn().mockResolvedValue({
      intensityScoreId: 'score_123',
      totalScore: 78,
      isCapped: false,
    });
    
    // Mock Convex client
    vi.stubGlobal('convex', {
      mutation: mockConvexMutation,
    });

    render(WorkoutSession, { params: { id: mockWorkoutId } });

    // Complete a full set
    const startButton = screen.getByRole('button', { name: /start workout/i });
    await fireEvent.click(startButton);

    const completeSetButton = screen.getByRole('button', { name: /complete set/i });
    await fireEvent.click(completeSetButton);

    await waitFor(() => {
      expect(mockConvexMutation).toHaveBeenCalledWith(
        expect.any(Object), // mutation function
        expect.objectContaining({
          workoutSessionId: expect.any(String),
          setId: expect.any(String),
          tempoScore: 75,
          motionSmoothnessScore: 80,
          repConsistencyScore: 85,
          userFeedbackScore: 10,
          strainModifier: 1.0,
          isEstimated: false,
        })
      );
    });
  });

  it('gracefully handles health data unavailability', async () => {
    // Mock health data unavailable
    vi.mocked(healthDataService.isAvailable).mockReturnValue(false);
    vi.mocked(healthDataService.getCurrentHealthData).mockRejectedValue(
      new Error('Health data not available')
    );

    render(WorkoutSession, { params: { id: mockWorkoutId } });

    const startButton = screen.getByRole('button', { name: /start workout/i });
    await fireEvent.click(startButton);

    const completeSetButton = screen.getByRole('button', { name: /complete set/i });
    await fireEvent.click(completeSetButton);

    await waitFor(() => {
      // Should fall back to estimated scoring
      expect(intensityScoringService.calculateIntensityScore).toHaveBeenCalledWith(
        expect.objectContaining({
          isEstimated: true,
          healthData: null,
        })
      );

      const estimatedLabel = screen.getByTestId('estimated-score-indicator');
      expect(estimatedLabel).toBeInTheDocument();
    });
  });

  it('maintains real-time performance under load', async () => {
    render(WorkoutSession, { params: { id: mockWorkoutId } });

    const startButton = screen.getByRole('button', { name: /start workout/i });
    await fireEvent.click(startButton);

    // Simulate rapid rep completions (stress test)
    const repButton = screen.getByRole('button', { name: /complete rep/i });
    
    const startTime = Date.now();
    
    // Complete 20 reps rapidly
    for (let i = 0; i < 20; i++) {
      await fireEvent.click(repButton);
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms between reps
    }

    const totalTime = Date.now() - startTime;

    // Verify all updates were processed within performance requirements
    expect(totalTime).toBeLessThan(2000); // Under 2 seconds for 20 reps
    expect(intensityScoringService.updateRealTimeScore).toHaveBeenCalledTimes(20);
  });

  it('synchronizes intensity data across store state', async () => {
    render(WorkoutSession, { params: { id: mockWorkoutId } });

    const startButton = screen.getByRole('button', { name: /start workout/i });
    await fireEvent.click(startButton);

    const completeSetButton = screen.getByRole('button', { name: /complete set/i });
    await fireEvent.click(completeSetButton);

    await waitFor(() => {
      const storeState = get(intensityScoreStore);
      expect(storeState.currentScore).toEqual({
        total: 78,
        components: {
          tempo: 75,
          smoothness: 80,
          consistency: 85,
          userFeedback: 10,
        },
        strainModifier: 1.0,
        timestamp: expect.any(Number),
      });
    });
  });
});