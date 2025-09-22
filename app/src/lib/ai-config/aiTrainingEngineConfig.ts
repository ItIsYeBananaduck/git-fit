// AI Training Engine Configuration
import type {
    WeeklyData,
    PerformanceAnalysis,
    ProgramAdjustments,
    Exercise,
    RIRPrediction,
    RecoveryData,
    RecoveryStatus
} from '../training/aiTrainingEngine.js';

export interface AITrainingEngineConfig {
    analyzeWeeklyPerformance(userId: string, weekData: WeeklyData): Promise<PerformanceAnalysis>;
    calculateProgramAdjustments(analysis: PerformanceAnalysis): Promise<ProgramAdjustments>;
    predictRIR(userId: string, exercise: Exercise, setNumber: number): Promise<RIRPrediction>;
    assessRecoveryStatus(recoveryData: RecoveryData[]): Promise<RecoveryStatus>;
}