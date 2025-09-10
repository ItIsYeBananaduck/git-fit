// File: weeklyProgramAdjuster.ts

/**
 * Weekly Program Adjuster
 * Purpose: Dynamically adjust training programs based on user progress and feedback.
 */

export interface WeeklyProgramAdjuster {
  /**
   * Analyze user progress over the past week.
   * @param userId - ID of the user.
   * @param weeklyData - Data from the past week's training sessions.
   */
  analyzeProgress(userId: string, weeklyData: WeeklyData): Promise<ProgressAnalysis>;

  /**
   * Adjust the training program based on progress analysis.
   * @param userId - ID of the user.
   * @param currentProgram - The user's current training program.
   * @param progressAnalysis - Analysis of the user's progress.
   */
  adjustProgram(userId: string, currentProgram: TrainingProgram, progressAnalysis: ProgressAnalysis): Promise<TrainingProgram>;

  /**
   * Generate a summary of adjustments made to the program.
   * @param adjustments - Adjustments applied to the program.
   */
  generateAdjustmentSummary(adjustments: ProgramAdjustments): string;
}

// Define the types used in the interface
export interface WeeklyData {
  sessions: TrainingSession[];
  recoveryMetrics: RecoveryData[];
}

export interface ProgressAnalysis {
  consistencyScore: number;
  effortTrend: number;
  recoveryTrend: number;
  adaptationScore: number;
}

export interface ProgramAdjustments {
  loadAdjustment: number;
  volumeAdjustment: number;
  intensityAdjustment: number;
}

export interface TrainingProgram {
  name: string;
  phases: TrainingPhase[];
}

export interface TrainingPhase {
  name: string;
  durationWeeks: number;
  focus: string;
}

export interface TrainingSession {
  date: string;
  exercises: Exercise[];
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  load: number;
}

export interface RecoveryData {
  date: string;
  recoveryScore: number;
}
