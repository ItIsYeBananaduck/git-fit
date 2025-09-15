// Nutrition Telemetry Event Type
export interface NutritionTelemetryEvent {
    eventType: 'generate_meal_plan' | 'optimize_meal_plan';
    anonymizedInput: Record<string, unknown>;
    outcome: Record<string, unknown>;
    timestamp: string;
}