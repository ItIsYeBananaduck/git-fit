/**
 * WorkoutSession Entity Model
 * Core workout session management with exercise relationships, performance calculations, and data integrity
 * Implements comprehensive tracking and analysis capabilities
 */

import { z } from 'zod';
import type { WorkoutSummary, WorkoutDetailResponse, ExerciseDetail } from '../types/api-contracts.js';

// Extended interfaces for comprehensive workout session management
export interface WorkoutSessionData {
  id: string;
  userId: string;
  workoutTemplateId?: string;
  name: string;
  date: string;
  startedAt?: string;
  completedAt?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'skipped' | 'cancelled';
  exercises: WorkoutExercise[];
  totalDuration?: number; // minutes
  estimatedDuration: number; // minutes
  notes?: string;
  environment?: WorkoutEnvironment;
  performance?: SessionPerformance;
  aiAdjustments?: AIAdjustment[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  order: number;
  category: 'strength' | 'cardio' | 'flexibility' | 'mobility' | 'plyometric';
  muscle_groups: string[];
  equipment?: string[];
  planned: PlannedExercise;
  actual?: ActualExercise;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  skipReason?: string;
  notes?: string;
  aiAdjustments?: ExerciseAdjustment[];
}

export interface PlannedExercise {
  sets: number;
  reps: number[];  // reps per set
  weight?: number[]; // weight per set (kg)
  duration?: number[]; // duration per set (seconds) for time-based exercises
  restTime: number; // seconds between sets
  rpe?: number; // target RPE (1-10)
  intensity?: number; // percentage of 1RM
}

export interface ActualExercise {
  sets: number;
  reps: number[];
  weight?: number[];
  duration?: number[];
  restTime: number[]; // actual rest between sets
  rpe?: number[]; // actual RPE per set
  heartRate?: HeartRateData[];
  setCompletions: SetCompletion[];
  totalTime: number; // total time for exercise (seconds)
}

export interface SetCompletion {
  setNumber: number;
  repsCompleted: number;
  weightUsed?: number;
  duration?: number;
  rpe?: number;
  difficulty: 'easy' | 'moderate' | 'hard' | 'very_hard';
  completedAt: string;
  restAfter?: number; // seconds
  notes?: string;
  heartRateData?: HeartRateData;
  formQuality?: number; // 1-10 scale
}

export interface HeartRateData {
  average: number;
  min: number;
  max: number;
  zones: {
    zone1: number; // percentage time in each zone
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
}

export interface WorkoutEnvironment {
  location: 'home' | 'gym' | 'outdoor' | 'other';
  temperature?: number;
  humidity?: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  crowding?: 'low' | 'medium' | 'high';
  equipment_availability?: string[];
  distractions?: string[];
}

export interface SessionPerformance {
  completionPercentage: number;
  volumeLoad: number; // total weight × reps
  intensityScore: number; // 1-10 average
  effortScore: number; // RPE average
  techniqueScore: number; // form quality average
  consistencyScore: number; // plan adherence
  adaptationScore: number; // AI calculated adaptation metric
  recoveryScore?: number; // pre-workout recovery (WHOOP/HRV)
  strainScore?: number; // post-workout strain
  caloriesBurned?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
}

export interface AIAdjustment {
  id: string;
  type: 'volume' | 'intensity' | 'rest' | 'exercise_swap' | 'tempo' | 'form_cue';
  exerciseId?: string; // if exercise-specific
  originalValue: unknown;
  adjustedValue: unknown;
  reason: string;
  confidence: number; // 0-1
  timestamp: string;
  userResponse?: 'accepted' | 'rejected' | 'modified';
  userFeedback?: string;
}

export interface ExerciseAdjustment {
  type: 'weight_increase' | 'weight_decrease' | 'rep_adjustment' | 'set_adjustment' | 'rest_modification';
  originalValue: number;
  adjustedValue: number;
  reason: string;
  appliedAt: string;
}

/**
 * Validation schemas
 */
export const SetCompletionSchema = z.object({
  setNumber: z.number().min(1, 'Set number must be positive'),
  repsCompleted: z.number().min(0, 'Reps cannot be negative'),
  weightUsed: z.number().min(0, 'Weight cannot be negative').optional(),
  duration: z.number().min(0, 'Duration cannot be negative').optional(),
  rpe: z.number().min(1, 'RPE must be 1-10').max(10, 'RPE must be 1-10').optional(),
  difficulty: z.enum(['easy', 'moderate', 'hard', 'very_hard']),
  completedAt: z.string().datetime('Invalid completion time'),
  restAfter: z.number().min(0, 'Rest time cannot be negative').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  formQuality: z.number().min(1, 'Form quality must be 1-10').max(10, 'Form quality must be 1-10').optional()
});

export const PlannedExerciseSchema = z.object({
  sets: z.number().min(1, 'Must have at least 1 set').max(20, 'Too many sets'),
  reps: z.array(z.number().min(1, 'Reps must be positive').max(100, 'Too many reps')).min(1, 'Must specify reps'),
  weight: z.array(z.number().min(0, 'Weight cannot be negative')).optional(),
  duration: z.array(z.number().min(1, 'Duration must be positive')).optional(),
  restTime: z.number().min(0, 'Rest time cannot be negative').max(600, 'Rest time too long'),
  rpe: z.number().min(1, 'RPE must be 1-10').max(10, 'RPE must be 1-10').optional(),
  intensity: z.number().min(0, 'Intensity cannot be negative').max(200, 'Intensity too high').optional()
});

export const WorkoutExerciseSchema = z.object({
  id: z.string().min(1, 'Exercise ID required'),
  exerciseId: z.string().min(1, 'Exercise reference ID required'),
  name: z.string().min(1, 'Exercise name required').max(100, 'Name too long'),
  order: z.number().min(1, 'Order must be positive'),
  category: z.enum(['strength', 'cardio', 'flexibility', 'mobility', 'plyometric']),
  muscle_groups: z.array(z.string()).min(1, 'Must specify muscle groups'),
  equipment: z.array(z.string()).optional(),
  planned: PlannedExerciseSchema,
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']),
  skipReason: z.string().max(200, 'Skip reason too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional()
});

/**
 * WorkoutSession class with comprehensive business logic
 */
export class WorkoutSession {
  private _data: WorkoutSessionData;

  constructor(data: WorkoutSessionData) {
    this._data = { ...data };
    this.validate();
  }

  // Getters
  get id(): string { return this._data.id; }
  get userId(): string { return this._data.userId; }
  get name(): string { return this._data.name; }
  get date(): string { return this._data.date; }
  get status(): WorkoutSessionData['status'] { return this._data.status; }
  get exercises(): WorkoutExercise[] { return [...this._data.exercises]; }
  get totalDuration(): number | undefined { return this._data.totalDuration; }
  get estimatedDuration(): number { return this._data.estimatedDuration; }
  get notes(): string | undefined { return this._data.notes; }
  get environment(): WorkoutEnvironment | undefined { return this._data.environment; }
  get performance(): SessionPerformance | undefined { return this._data.performance; }
  get aiAdjustments(): AIAdjustment[] { return this._data.aiAdjustments || []; }
  get createdAt(): Date { return new Date(this._data.createdAt); }
  get updatedAt(): Date { return new Date(this._data.updatedAt); }

  /**
   * Validate workout session data
   */
  private validate(): void {
    try {
      // Validate basic data structure
      if (!this._data.id || !this._data.userId || !this._data.name) {
        throw new Error('Missing required workout session fields');
      }

      // Validate exercises
      this._data.exercises.forEach((exercise, index) => {
        try {
          WorkoutExerciseSchema.parse(exercise);
          
          // Validate exercise order uniqueness
          const duplicateOrder = this._data.exercises.find(
            (e, i) => i !== index && e.order === exercise.order
          );
          if (duplicateOrder) {
            throw new Error(`Duplicate exercise order: ${exercise.order}`);
          }

          // Validate planned vs actual consistency
          if (exercise.actual) {
            this.validateExerciseConsistency(exercise);
          }

        } catch (error) {
          throw new Error(`Exercise ${index + 1} validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      // Validate business rules
      this.validateBusinessRules();

    } catch (error) {
      throw new Error(`Workout session validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate exercise planned vs actual consistency
   */
  private validateExerciseConsistency(exercise: WorkoutExercise): void {
    if (!exercise.actual || !exercise.planned) return;

    // Check that actual sets don't exceed planned by too much
    if (exercise.actual.sets > exercise.planned.sets + 2) {
      throw new Error(`Too many actual sets for exercise ${exercise.name}`);
    }

    // Check rep count consistency
    if (exercise.actual.reps.length !== exercise.actual.sets) {
      throw new Error(`Actual reps array length doesn't match sets for ${exercise.name}`);
    }

    // Check weight array consistency
    if (exercise.actual.weight && exercise.actual.weight.length !== exercise.actual.sets) {
      throw new Error(`Actual weight array length doesn't match sets for ${exercise.name}`);
    }

    // Check set completions match actual sets
    if (exercise.actual.setCompletions.length !== exercise.actual.sets) {
      throw new Error(`Set completions don't match actual sets for ${exercise.name}`);
    }
  }

  /**
   * Validate business rules
   */
  private validateBusinessRules(): void {
    // Check workout duration reasonableness
    if (this._data.totalDuration && this._data.totalDuration > 300) { // 5 hours
      throw new Error('Workout duration too long (max 5 hours)');
    }

    // Check exercise count
    if (this._data.exercises.length === 0) {
      throw new Error('Workout must have at least one exercise');
    }

    if (this._data.exercises.length > 20) {
      throw new Error('Too many exercises (max 20)');
    }

    // Check status transitions
    if (this._data.status === 'completed' && !this._data.completedAt) {
      throw new Error('Completed workout must have completion time');
    }

    // Check performance data consistency
    if (this._data.performance && this._data.status !== 'completed') {
      throw new Error('Performance data only valid for completed workouts');
    }
  }

  /**
   * Start the workout session
   */
  startWorkout(): void {
    if (this._data.status !== 'planned') {
      throw new Error('Can only start planned workouts');
    }

    this._data.status = 'in_progress';
    this._data.startedAt = new Date().toISOString();
    this._data.updatedAt = new Date().toISOString();
  }

  /**
   * Complete the workout session
   */
  completeWorkout(): void {
    if (this._data.status !== 'in_progress') {
      throw new Error('Can only complete in-progress workouts');
    }

    this._data.status = 'completed';
    this._data.completedAt = new Date().toISOString();
    this._data.updatedAt = new Date().toISOString();

    // Calculate final performance metrics
    this.calculatePerformanceMetrics();
  }

  /**
   * Skip the workout session
   */
  skipWorkout(reason: string): void {
    if (this._data.status === 'completed') {
      throw new Error('Cannot skip completed workout');
    }

    this._data.status = 'skipped';
    this._data.notes = `Skipped: ${reason}`;
    this._data.updatedAt = new Date().toISOString();
  }

  /**
   * Cancel the workout session
   */
  cancelWorkout(reason: string): void {
    if (this._data.status === 'completed') {
      throw new Error('Cannot cancel completed workout');
    }

    this._data.status = 'cancelled';
    this._data.notes = `Cancelled: ${reason}`;
    this._data.updatedAt = new Date().toISOString();
  }

  /**
   * Add an exercise to the workout
   */
  addExercise(exercise: Omit<WorkoutExercise, 'order'>): void {
    if (this._data.status === 'completed') {
      throw new Error('Cannot modify completed workout');
    }

    const newExercise: WorkoutExercise = {
      ...exercise,
      order: this._data.exercises.length + 1
    };

    try {
      WorkoutExerciseSchema.parse(newExercise);
      this._data.exercises.push(newExercise);
      this.recalculateEstimatedDuration();
      this._data.updatedAt = new Date().toISOString();
    } catch (error) {
      throw new Error(`Failed to add exercise: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove an exercise from the workout
   */
  removeExercise(exerciseId: string): void {
    if (this._data.status === 'completed') {
      throw new Error('Cannot modify completed workout');
    }

    const initialLength = this._data.exercises.length;
    this._data.exercises = this._data.exercises.filter(e => e.id !== exerciseId);

    if (this._data.exercises.length === initialLength) {
      throw new Error('Exercise not found');
    }

    // Reorder remaining exercises
    this._data.exercises.forEach((exercise, index) => {
      exercise.order = index + 1;
    });

    this.recalculateEstimatedDuration();
    this._data.updatedAt = new Date().toISOString();
  }

  /**
   * Update exercise actual performance
   */
  updateExercisePerformance(exerciseId: string, actualData: ActualExercise): void {
    const exercise = this._data.exercises.find(e => e.id === exerciseId);
    if (!exercise) {
      throw new Error('Exercise not found');
    }

    exercise.actual = actualData;
    exercise.status = 'completed';
    this._data.updatedAt = new Date().toISOString();

    // Validate consistency after update
    this.validateExerciseConsistency(exercise);
  }

  /**
   * Complete a set for an exercise
   */
  completeSet(exerciseId: string, setCompletion: SetCompletion): void {
    const exercise = this._data.exercises.find(e => e.id === exerciseId);
    if (!exercise) {
      throw new Error('Exercise not found');
    }

    try {
      SetCompletionSchema.parse(setCompletion);

      // Initialize actual data if needed
      if (!exercise.actual) {
        exercise.actual = {
          sets: 0,
          reps: [],
          weight: exercise.planned.weight ? [] : undefined,
          duration: exercise.planned.duration ? [] : undefined,
          restTime: [],
          setCompletions: [],
          totalTime: 0
        };
      }

      // Add set completion
      exercise.actual.setCompletions.push(setCompletion);
      exercise.actual.sets = exercise.actual.setCompletions.length;
      exercise.actual.reps.push(setCompletion.repsCompleted);
      
      if (setCompletion.weightUsed && exercise.actual.weight) {
        exercise.actual.weight.push(setCompletion.weightUsed);
      }
      
      if (setCompletion.duration && exercise.actual.duration) {
        exercise.actual.duration.push(setCompletion.duration);
      }

      if (setCompletion.restAfter) {
        exercise.actual.restTime.push(setCompletion.restAfter);
      }

      // Update exercise status
      if (exercise.actual.sets >= exercise.planned.sets) {
        exercise.status = 'completed';
      } else {
        exercise.status = 'in_progress';
      }

      this._data.updatedAt = new Date().toISOString();

    } catch (error) {
      throw new Error(`Failed to complete set: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply AI adjustment
   */
  applyAIAdjustment(adjustment: AIAdjustment): void {
    if (!this._data.aiAdjustments) {
      this._data.aiAdjustments = [];
    }

    this._data.aiAdjustments.push(adjustment);
    this._data.updatedAt = new Date().toISOString();
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(): void {
    if (this._data.exercises.length === 0) return;

    const completedExercises = this._data.exercises.filter(e => e.status === 'completed');
    const totalExercises = this._data.exercises.length;

    // Completion percentage
    const completionPercentage = (completedExercises.length / totalExercises) * 100;

    // Volume load calculation
    let totalVolumeLoad = 0;
    let totalRPE = 0;
    let rpeCount = 0;
    let totalFormQuality = 0;
    let formCount = 0;

    completedExercises.forEach(exercise => {
      if (exercise.actual) {
        // Volume load = weight × reps × sets
        exercise.actual.setCompletions.forEach(set => {
          if (set.weightUsed) {
            totalVolumeLoad += set.weightUsed * set.repsCompleted;
          }
          if (set.rpe) {
            totalRPE += set.rpe;
            rpeCount++;
          }
          if (set.formQuality) {
            totalFormQuality += set.formQuality;
            formCount++;
          }
        });
      }
    });

    // Calculate averages
    const effortScore = rpeCount > 0 ? totalRPE / rpeCount : 0;
    const techniqueScore = formCount > 0 ? totalFormQuality / formCount : 0;

    // Plan adherence score
    let adherenceScore = 0;
    completedExercises.forEach(exercise => {
      if (exercise.actual && exercise.planned) {
        const plannedSets = exercise.planned.sets;
        const actualSets = exercise.actual.sets;
        const setAdherence = Math.min(actualSets / plannedSets, 1.0);
        
        let repAdherence = 0;
        exercise.actual.reps.forEach((actualReps, index) => {
          if (index < exercise.planned.reps.length) {
            const plannedReps = exercise.planned.reps[index];
            repAdherence += Math.min(actualReps / plannedReps, 1.0);
          }
        });
        repAdherence = repAdherence / exercise.actual.reps.length;
        
        adherenceScore += (setAdherence + repAdherence) / 2;
      }
    });
    adherenceScore = adherenceScore / completedExercises.length;

    this._data.performance = {
      completionPercentage,
      volumeLoad: totalVolumeLoad,
      intensityScore: effortScore,
      effortScore,
      techniqueScore,
      consistencyScore: adherenceScore * 100,
      adaptationScore: this.calculateAdaptationScore()
    };
  }

  /**
   * Calculate adaptation score based on performance vs plan
   */
  private calculateAdaptationScore(): number {
    // Complex algorithm to calculate how well the user adapted to the workout
    // This would typically involve comparing current performance to historical data
    // For now, return a simple calculation based on completion and effort
    
    if (!this._data.performance) return 0;
    
    const completion = this._data.performance.completionPercentage / 100;
    const effort = this._data.performance.effortScore / 10;
    const consistency = this._data.performance.consistencyScore / 100;
    
    return (completion * 0.4 + effort * 0.3 + consistency * 0.3) * 10;
  }

  /**
   * Calculate performance metrics for API response format
   */
  private calculateAPIPerformanceMetrics(): { totalWeight: number; totalReps: number; averageIntensity: number; } {
    let totalWeight = 0;
    let totalReps = 0;
    let totalIntensity = 0;
    let intensityCount = 0;

    this._data.exercises.forEach(exercise => {
      if (exercise.actual) {
        exercise.actual.setCompletions.forEach(set => {
          totalReps += set.repsCompleted;
          if (set.weightUsed) {
            totalWeight += set.weightUsed;
          }
          if (set.rpe) {
            totalIntensity += set.rpe;
            intensityCount++;
          }
        });
      }
    });

    return {
      totalWeight,
      totalReps,
      averageIntensity: intensityCount > 0 ? totalIntensity / intensityCount : 0
    };
  }

  /**
   * Recalculate estimated duration based on exercises
   */
  private recalculateEstimatedDuration(): void {
    let totalMinutes = 0;
    
    this._data.exercises.forEach(exercise => {
      // Base time per set (assuming 30-60 seconds per set)
      const setTime = exercise.planned.sets * 0.75; // 45 seconds average
      // Rest time between sets
      const restTime = (exercise.planned.sets - 1) * (exercise.planned.restTime / 60);
      totalMinutes += setTime + restTime;
    });

    // Add 5 minutes for transitions and warm-up/cool-down
    this._data.estimatedDuration = Math.ceil(totalMinutes + 5);
  }

  /**
   * Get workout summary for API responses
   */
  toSummary(): WorkoutSummary {
    const completedExercises = this._data.exercises.filter(e => e.status === 'completed').length;
    const skipReasons = this._data.exercises
      .filter(e => e.status === 'skipped' && e.skipReason)
      .map(e => e.skipReason!);

    // Map internal status to API contract status
    const apiStatus: 'completed' | 'planned' | 'skipped' = 
      this._data.status === 'in_progress' || this._data.status === 'cancelled' ? 'planned' : 
      this._data.status as 'completed' | 'planned' | 'skipped';

    return {
      id: this._data.id,
      name: this._data.name,
      date: this._data.date,
      status: apiStatus,
      completionPercentage: this._data.performance?.completionPercentage || 0,
      exerciseCount: this._data.exercises.length,
      completedExercises,
      skipReasons,
      duration: this._data.totalDuration,
      notes: this._data.notes
    };
  }

  /**
   * Get detailed workout data for API responses
   */
  toDetailResponse(): WorkoutDetailResponse {
    const exercises: ExerciseDetail[] = this._data.exercises.map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      sets: {
        planned: exercise.planned.sets,
        completed: exercise.actual?.sets || 0,
        weights: exercise.actual?.weight || [],
        reps: exercise.actual?.reps || [],
        skipped: exercise.status === 'skipped',
        skipReason: exercise.skipReason
      },
      notes: exercise.notes
    }));

    // Map internal status to API contract status
    const apiStatus: 'completed' | 'planned' | 'skipped' = 
      this._data.status === 'in_progress' || this._data.status === 'cancelled' ? 'planned' : 
      this._data.status as 'completed' | 'planned' | 'skipped';

    // Calculate performance metrics for API response
    const performanceMetrics = this.calculateAPIPerformanceMetrics();

    return {
      id: this._data.id,
      name: this._data.name,
      date: this._data.date,
      status: apiStatus,
      exercises,
      totalDuration: this._data.totalDuration,
      notes: this._data.notes,
      performanceMetrics
    };
  }

  /**
   * Export workout session data
   */
  toJSON(): WorkoutSessionData {
    return { ...this._data };
  }

  /**
   * Create WorkoutSession from JSON data
   */
  static fromJSON(data: WorkoutSessionData): WorkoutSession {
    return new WorkoutSession(data);
  }

  /**
   * Validate workout session data without creating instance
   */
  static validate(data: WorkoutSessionData): { valid: boolean; errors: string[] } {
    try {
      new WorkoutSession(data);
      return { valid: true, errors: [] };
    } catch (error) {
      return { 
        valid: false, 
        errors: [error instanceof Error ? error.message : 'Unknown validation error'] 
      };
    }
  }
}

export default WorkoutSession;