package com.example.technicallyfit.widget;

import android.content.Context;
import com.example.technicallyfit.widget.StrainWidgetProvider;

/**
 * Bridge between strain assessment service and widget updates for Android
 */
public class StrainAssessmentWidgetBridge {

    private static StrainAssessmentWidgetBridge instance;
    private final Context context;

    private StrainAssessmentWidgetBridge(Context context) {
        this.context = context.getApplicationContext();
    }

    public static synchronized StrainAssessmentWidgetBridge getInstance(Context context) {
        if (instance == null) {
            instance = new StrainAssessmentWidgetBridge(context);
        }
        return instance;
    }

    /**
     * Update widget with strain assessment results
     */
    public void updateWidgetWithStrainAssessment(StrainAssessmentResult assessment) {
        StrainWidgetData widgetData = convertToWidgetData(assessment);

        StrainWidgetProvider.updateWidgetData(
            context,
            widgetData.getStatus(),
            widgetData.getCompositeScore(),
            widgetData.getNextWorkout(),
            widgetData.getIntensity()
        );
    }

    /**
     * Clear widget data
     */
    public void clearWidgetData() {
        StrainWidgetProvider.clearWidgetData(context);
    }

    /**
     * Convenience method to update widget from assessment service
     */
    public void updateWidgetFromService(
            StrainAssessmentStatus overallStatus,
            int compositeScore,
            TrainingRecommendation trainingRecommendation,
            String nextWorkout) {

        StrainAssessmentResult assessment = new StrainAssessmentResult(
            overallStatus,
            compositeScore,
            new StrainZones(TrafficLight.GREEN, TrafficLight.GREEN), // Default zones
            new StrainDeltas(0.0, 0.0, 0.0), // Default deltas
            new HealthAlert[0], // Empty alerts
            trainingRecommendation != null ? trainingRecommendation :
                new TrainingRecommendation(
                    RecommendationStatus.NORMAL,
                    "Assessment completed",
                    new String[0],
                    null,
                    null
                ),
            85, // Default confidence
            System.currentTimeMillis()
        );

        updateWidgetWithStrainAssessment(assessment);
    }

    private StrainWidgetData convertToWidgetData(StrainAssessmentResult assessment) {
        String status = convertStatus(assessment.getOverallStatus());
        int compositeScore = assessment.getCompositeScore();
        String nextWorkout = extractNextWorkout(assessment.getTrainingRecommendation());
        String intensity = calculateIntensity(assessment.getOverallStatus(), assessment.getTrainingRecommendation());

        return new StrainWidgetData(status, compositeScore, nextWorkout, intensity);
    }

    private String convertStatus(StrainAssessmentStatus status) {
        switch (status) {
            case READY: return "ready";
            case MODERATE: return "moderate";
            case COMPROMISED: return "compromised";
            case HIGH_RISK: return "high_risk";
            default: return "ready";
        }
    }

    private String extractNextWorkout(TrainingRecommendation recommendation) {
        if (recommendation == null) return null;

        String reasoning = recommendation.getReasoning().toLowerCase();
        if (reasoning.contains("push")) {
            return "Push Day";
        } else if (reasoning.contains("pull")) {
            return "Pull Day";
        } else if (reasoning.contains("legs") || reasoning.contains("leg")) {
            return "Leg Day";
        } else if (reasoning.contains("rest")) {
            return "Rest Day";
        }

        return null;
    }

    private String calculateIntensity(StrainAssessmentStatus status, TrainingRecommendation recommendation) {
        switch (status) {
            case HIGH_RISK:
                return "Rest";
            case COMPROMISED:
                return "Light";
            case MODERATE:
                return "Moderate";
            case READY:
                // Check for load reduction
                if (recommendation != null && recommendation.getLoadReductionPercent() != null) {
                    int loadReduction = recommendation.getLoadReductionPercent();
                    if (loadReduction > 20) {
                        return "Light";
                    } else if (loadReduction > 10) {
                        return "Moderate";
                    }
                }
                return "High";
            default:
                return "High";
        }
    }

    // Data model classes

    public static class StrainWidgetData {
        private final String status;
        private final int compositeScore;
        private final String nextWorkout;
        private final String intensity;

        public StrainWidgetData(String status, int compositeScore, String nextWorkout, String intensity) {
            this.status = status;
            this.compositeScore = compositeScore;
            this.nextWorkout = nextWorkout;
            this.intensity = intensity;
        }

        public String getStatus() { return status; }
        public int getCompositeScore() { return compositeScore; }
        public String getNextWorkout() { return nextWorkout; }
        public String getIntensity() { return intensity; }
    }

    public static class StrainAssessmentResult {
        private final StrainAssessmentStatus overallStatus;
        private final int compositeScore;
        private final StrainZones zones;
        private final StrainDeltas deltas;
        private final HealthAlert[] healthAlerts;
        private final TrainingRecommendation trainingRecommendation;
        private final int confidence;
        private final long timestamp;

        public StrainAssessmentResult(StrainAssessmentStatus overallStatus, int compositeScore,
                                    StrainZones zones, StrainDeltas deltas, HealthAlert[] healthAlerts,
                                    TrainingRecommendation trainingRecommendation, int confidence, long timestamp) {
            this.overallStatus = overallStatus;
            this.compositeScore = compositeScore;
            this.zones = zones;
            this.deltas = deltas;
            this.healthAlerts = healthAlerts;
            this.trainingRecommendation = trainingRecommendation;
            this.confidence = confidence;
            this.timestamp = timestamp;
        }

        public StrainAssessmentStatus getOverallStatus() { return overallStatus; }
        public int getCompositeScore() { return compositeScore; }
        public StrainZones getZones() { return zones; }
        public StrainDeltas getDeltas() { return deltas; }
        public HealthAlert[] getHealthAlerts() { return healthAlerts; }
        public TrainingRecommendation getTrainingRecommendation() { return trainingRecommendation; }
        public int getConfidence() { return confidence; }
        public long getTimestamp() { return timestamp; }
    }

    public enum StrainAssessmentStatus {
        READY, MODERATE, COMPROMISED, HIGH_RISK
    }

    public static class StrainZones {
        private final TrafficLight hrZone;
        private final TrafficLight spo2Zone;

        public StrainZones(TrafficLight hrZone, TrafficLight spo2Zone) {
            this.hrZone = hrZone;
            this.spo2Zone = spo2Zone;
        }

        public TrafficLight getHrZone() { return hrZone; }
        public TrafficLight getSpo2Zone() { return spo2Zone; }
    }

    public static class StrainDeltas {
        private final double hrDelta;
        private final double spo2Delta;
        private final double hrvDelta;

        public StrainDeltas(double hrDelta, double spo2Delta, double hrvDelta) {
            this.hrDelta = hrDelta;
            this.spo2Delta = spo2Delta;
            this.hrvDelta = hrvDelta;
        }

        public double getHrDelta() { return hrDelta; }
        public double getSpo2Delta() { return spo2Delta; }
        public double getHrvDelta() { return hrvDelta; }
    }

    public enum TrafficLight {
        GREEN, YELLOW, ORANGE, RED
    }

    public static class HealthAlert {
        private final String message;
        private final AlertSeverity severity;
        private final boolean requiresAttention;
        private final String recommendation;

        public HealthAlert(String message, AlertSeverity severity, boolean requiresAttention, String recommendation) {
            this.message = message;
            this.severity = severity;
            this.requiresAttention = requiresAttention;
            this.recommendation = recommendation;
        }

        public String getMessage() { return message; }
        public AlertSeverity getSeverity() { return severity; }
        public boolean isRequiresAttention() { return requiresAttention; }
        public String getRecommendation() { return recommendation; }
    }

    public enum AlertSeverity {
        LOW, MEDIUM, HIGH
    }

    public static class TrainingRecommendation {
        private final RecommendationStatus status;
        private final String reasoning;
        private final String[] modifications;
        private final Integer loadReductionPercent;
        private final String[] alternativeActivities;

        public TrainingRecommendation(RecommendationStatus status, String reasoning,
                                    String[] modifications, Integer loadReductionPercent,
                                    String[] alternativeActivities) {
            this.status = status;
            this.reasoning = reasoning;
            this.modifications = modifications;
            this.loadReductionPercent = loadReductionPercent;
            this.alternativeActivities = alternativeActivities;
        }

        public RecommendationStatus getStatus() { return status; }
        public String getReasoning() { return reasoning; }
        public String[] getModifications() { return modifications; }
        public Integer getLoadReductionPercent() { return loadReductionPercent; }
        public String[] getAlternativeActivities() { return alternativeActivities; }
    }

    public enum RecommendationStatus {
        NORMAL, REDUCE_LOAD, REST
    }
}