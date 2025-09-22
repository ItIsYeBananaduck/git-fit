// Updated maxRestTime to reflect the new requirement.
export interface AdaptiveTrainingConfig {
    dynamicDeload: boolean;
    cycleLengthWeeks: number;
    maxRestTime: number; // Maximum rest time in seconds
}

export const adaptiveTrainingConfig: AdaptiveTrainingConfig = {
    dynamicDeload: true,
    cycleLengthWeeks: 4,
    maxRestTime: 90 // Updated to ensure rest time does not exceed 90 seconds
};