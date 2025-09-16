// AI logic to parse and interpret monthly/yearly summary JSON data
// and provide recommendations, nudging, and user feedback

export type ExerciseStats = {
    avgSets: number;
    maxSets: number;
    avgReps: number;
    maxReps: number;
    avgLoad: number;
    maxLoad: number;
    avgRestSec: number;
    totalVolume: number;
    maxSessionVolume: number;
    lastPerformed: string;
};

export type MonthlySummary = {
    month: string;
    exercises: Record<string, ExerciseStats>;
};

export type YearlySummary = {
    [year: string]: {
        exercises: Record<string, {
            monthlyBreakdown: Record<string, ExerciseStats>;
        }>;
    };
};

export function parseMonthlySummary(json: string): MonthlySummary | null {
    try {
        return JSON.parse(json) as MonthlySummary;
    } catch {
        return null;
    }
}

export function parseYearlySummary(json: string): YearlySummary | null {
    try {
        return JSON.parse(json) as YearlySummary;
    } catch {
        return null;
    }
}

// Example: Generate feedback for a given exercise in a monthly summary
export function getExerciseFeedback(stats: ExerciseStats): string {
    if (stats.avgRestSec > 120) {
        return "Consider reducing rest time for improved conditioning.";
    }
    if (stats.avgReps < 6) {
        return "Try increasing reps for more hypertrophy.";
    }
    if (stats.totalVolume < 5000) {
        return "Increase total volume for better progress.";
    }
    return "Great job maintaining consistent training!";
}

// Example: Recommend nudge based on rest and strain
export function shouldNudgeForSet(stats: ExerciseStats, strainStart: number, strainEnd: number): boolean {
    // If strain drops by more than 3% during rest, nudge
    return strainEnd < strainStart * 0.97 && stats.avgRestSec > 0;
}
