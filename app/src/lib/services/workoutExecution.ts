import type { WorkoutSession, SetCompletion, TrainingParameters } from './adaptiveTraining.js';
import { restManager } from './restManager.js';
import type { Id } from '$lib/convex/_generated/dataModel.js';

export interface WorkoutState {
  sessionId: string;
  exerciseId: string;
  currentSet: number;
  totalSets: number;
  currentReps: number;
  targetReps: number;
  isActive: boolean;
  startTime: Date;
  lastSetEndTime?: Date;
  completedSets: SetCompletion[];
}

export class WorkoutExecutionService {
  private workoutState: WorkoutState | null = null;
  private restEnabled: boolean = true;

  /**
   * Configure rest management
   */
  setRestEnabled(enabled: boolean): void {
    this.restEnabled = enabled;
  }

  /**
   * Start a new workout session
   */
  startWorkout(exerciseId: string, params: TrainingParameters): WorkoutState {
    const sessionId = `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.workoutState = {
      sessionId,
      exerciseId,
      currentSet: 1,
      totalSets: params.sets,
      currentReps: 0,
      targetReps: params.reps,
      isActive: true,
      startTime: new Date(),
      completedSets: []
    };

    return this.workoutState;
  }

  /**
   * Complete a set with difficulty feedback
   */
  async completeSet(difficulty: 'easy' | 'moderate' | 'hard', repsCompleted?: number): Promise<SetCompletion | null> {
    if (!this.workoutState || !this.workoutState.isActive) {
      return null;
    }

    const actualReps = repsCompleted ?? this.workoutState.currentReps;
    const restDuration = this.workoutState.lastSetEndTime
      ? Date.now() - this.workoutState.lastSetEndTime.getTime()
      : 0;

    const setCompletion: SetCompletion = {
      setNumber: this.workoutState.currentSet,
      repsCompleted: actualReps,
      difficulty,
      timestamp: new Date().toISOString(),
      restDuration: Math.round(restDuration / 1000) // Convert to seconds
    };

    // Add to completed sets
    this.workoutState.completedSets.push(setCompletion);

    // Update workout state
    this.workoutState.lastSetEndTime = new Date();

    // Check if workout is complete
    if (this.workoutState.currentSet >= this.workoutState.totalSets) {
      this.workoutState.isActive = false;
    } else {
      // Move to next set
      this.workoutState.currentSet++;
      this.workoutState.currentReps = 0; // Reset rep counter for next set

      // Start rest session if enabled and not the last set
      if (this.restEnabled && this.workoutState.currentSet <= this.workoutState.totalSets) {
        try {
          await this.startRestForNextSet();
        } catch (error) {
          console.warn('Failed to start rest session:', error);
        }
      }
    }

    return setCompletion;
  }

  /**
   * Update current rep count during a set
   */
  updateRepCount(reps: number): void {
    if (this.workoutState) {
      this.workoutState.currentReps = Math.max(0, reps);
    }
  }

  /**
   * Get current workout state
   */
  getCurrentState(): WorkoutState | null {
    return this.workoutState;
  }

  /**
   * End workout session and return complete session data
   */
  endWorkout(): WorkoutSession | null {
    if (!this.workoutState) {
      return null;
    }

    const session: WorkoutSession = {
      id: this.workoutState.sessionId,
      userId: 'current-user', // TODO: Get from auth context
      date: this.workoutState.startTime.toISOString(),
      exerciseId: this.workoutState.exerciseId,
      plannedParams: {
        load: 80, // TODO: Get from actual params
        reps: this.workoutState.targetReps,
        sets: this.workoutState.totalSets,
        restBetweenSets: 90,
        restBetweenExercises: 180,
        intensity: 'moderate'
      },
      setCompletions: this.workoutState.completedSets,
      completedReps: this.workoutState.completedSets.map(s => s.repsCompleted)
    };

    // Calculate perceived effort based on difficulty feedback
    const avgDifficulty = this.calculateAverageDifficulty(this.workoutState.completedSets);
    session.perceivedEffort = this.difficultyToRPE(avgDifficulty);

    // Reset state
    this.workoutState = null;

    return session;
  }

  /**
   * Calculate average difficulty from completed sets
   */
  private calculateAverageDifficulty(completions: SetCompletion[]): number {
    if (completions.length === 0) return 0;

    const difficultyScores = completions.map(c => {
      switch (c.difficulty) {
        case 'easy': return 1;
        case 'moderate': return 2;
        case 'hard': return 3;
        default: return 2;
      }
    });

    return difficultyScores.reduce((sum, score) => sum + score, 0) / difficultyScores.length;
  }

  /**
   * Convert difficulty average to RPE scale (1-10)
   */
  private difficultyToRPE(avgDifficulty: number): number {
    // Map difficulty (1-3) to RPE (1-10)
    // Easy (1) = RPE 4-6, Moderate (2) = RPE 6-8, Hard (3) = RPE 8-10
    if (avgDifficulty <= 1.5) {
      return 5; // Easy = moderate effort
    } else if (avgDifficulty <= 2.5) {
      return 7; // Moderate = somewhat hard
    } else {
      return 9; // Hard = very hard
    }
  }

  /**
   * Start rest session for the next set
   */
  private async startRestForNextSet(): Promise<void> {
    if (!this.workoutState) return;

    const nextSetNumber = this.workoutState.currentSet;
    const perceivedEffort = this.calculateAverageDifficulty(this.workoutState.completedSets);

    await restManager.startRest(
      this.workoutState.exerciseId,
      nextSetNumber,
      {
        userId: 'current-user' as Id<'users'>, // TODO: Get from auth context
        workoutId: 'current-workout' as Id<'workouts'>, // TODO: Get from workout context
        totalSets: this.workoutState.totalSets,
        perceivedEffort: this.difficultyToRPE(perceivedEffort),
        exerciseIntensity: 'moderate', // TODO: Determine from exercise data
        userFitnessLevel: 'intermediate' // TODO: Get from user profile
      }
    );
  }

  /**
   * Get current rest status
   */
  getRestStatus() {
    return restManager.getRestStatus();
  }

  /**
   * Complete current rest session
   */
  async completeRest(): Promise<void> {
    await restManager.completeRest();
  }

  /**
   * Cancel current rest session
   */
  async cancelRest(): Promise<void> {
    await restManager.cancelRest();
  }
}