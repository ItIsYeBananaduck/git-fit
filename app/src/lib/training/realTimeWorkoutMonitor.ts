// File: realTimeWorkoutMonitor.ts

/**
 * Real-time Workout Monitor
 * Purpose: Provide real-time feedback and monitoring during workouts.
 */

export interface RealTimeWorkoutMonitor {
  /**
   * Start monitoring a workout session.
   * @param sessionId - ID of the workout session.
   * @param userId - ID of the user.
   */
  startMonitoring(sessionId: string, userId: string): Promise<void>;

  /**
   * Track real-time metrics during a workout.
   * @param metrics - Real-time metrics such as heart rate, reps, and sets.
   */
  trackMetrics(metrics: RealTimeMetrics): void;

  /**
   * Provide real-time feedback based on tracked metrics.
   * @param metrics - Real-time metrics such as heart rate, reps, and sets.
   */
  provideFeedback(metrics: RealTimeMetrics): Feedback;

  /**
   * End monitoring a workout session.
   * @param sessionId - ID of the workout session.
   */
  endMonitoring(sessionId: string): Promise<WorkoutSummary>;
}

// Define the types used in the interface
export interface RealTimeMetrics {
  heartRate: number;
  repsCompleted: number;
  setsCompleted: number;
  strain: number;
  timeElapsed: number; // in seconds
}

export interface Feedback {
  message: string;
  alertLevel: 'info' | 'warning' | 'critical';
}

export interface WorkoutSummary {
  totalTime: number; // in seconds
  averageHeartRate: number;
  totalReps: number;
  totalSets: number;
  strainScore: number;
}
