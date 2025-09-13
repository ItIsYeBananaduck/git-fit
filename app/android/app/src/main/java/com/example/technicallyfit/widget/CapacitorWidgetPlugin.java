package com.example.technicallyfit.widget;

import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor plugin for widget functionality on Android
 */
@CapacitorPlugin(name = "Widget")
public class CapacitorWidgetPlugin extends Plugin {

    private StrainAssessmentWidgetBridge widgetBridge;

    @Override
    public void load() {
        super.load();
        Context context = getContext();
        widgetBridge = StrainAssessmentWidgetBridge.getInstance(context);
    }

    @PluginMethod
    public void updateWidget(PluginCall call) {
        try {
            String status = call.getString("status");
            Integer compositeScore = call.getInt("compositeScore");
            String nextWorkout = call.getString("nextWorkout");
            String intensity = call.getString("intensity");

            if (status == null || compositeScore == null || intensity == null) {
                call.reject("Missing required parameters: status, compositeScore, intensity");
                return;
            }

            // Use the bridge to update the widget
            widgetBridge.updateWidgetFromService(
                convertStatusString(status),
                compositeScore,
                null, // TrainingRecommendation - could be passed from JS if needed
                nextWorkout
            );

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Failed to update widget: " + e.getMessage());
        }
    }

    @PluginMethod
    public void clearWidget(PluginCall call) {
        try {
            widgetBridge.clearWidgetData();

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Failed to clear widget: " + e.getMessage());
        }
    }

    @PluginMethod
    public void updateWidgetWithAssessment(PluginCall call) {
        try {
            JSObject assessmentData = call.getObject("assessment");

            if (assessmentData == null) {
                call.reject("Assessment data is required");
                return;
            }

            // Create StrainAssessmentResult from JS object
            StrainAssessmentWidgetBridge.StrainAssessmentResult assessment =
                createAssessmentFromJSObject(assessmentData);

            // Update widget through bridge
            widgetBridge.updateWidgetWithStrainAssessment(assessment);

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Failed to update widget with assessment: " + e.getMessage());
        }
    }

    private StrainAssessmentWidgetBridge.StrainAssessmentStatus convertStatusString(String status) {
        switch (status.toLowerCase()) {
            case "ready": return StrainAssessmentWidgetBridge.StrainAssessmentStatus.READY;
            case "moderate": return StrainAssessmentWidgetBridge.StrainAssessmentStatus.MODERATE;
            case "compromised": return StrainAssessmentWidgetBridge.StrainAssessmentStatus.COMPROMISED;
            case "high_risk": return StrainAssessmentWidgetBridge.StrainAssessmentStatus.HIGH_RISK;
            default: return StrainAssessmentWidgetBridge.StrainAssessmentStatus.READY;
        }
    }

    private StrainAssessmentWidgetBridge.StrainAssessmentResult createAssessmentFromJSObject(JSObject data) {
        String statusStr = data.getString("overallStatus", "ready");
        StrainAssessmentWidgetBridge.StrainAssessmentStatus status = convertStatusString(statusStr);

        int compositeScore = data.getInteger("compositeScore", 0);

        // Create default zones (could be expanded to parse from JS)
        StrainAssessmentWidgetBridge.StrainZones zones = new StrainAssessmentWidgetBridge.StrainZones(
            StrainAssessmentWidgetBridge.TrafficLight.GREEN,
            StrainAssessmentWidgetBridge.TrafficLight.GREEN
        );

        // Create default deltas
        StrainAssessmentWidgetBridge.StrainDeltas deltas = new StrainAssessmentWidgetBridge.StrainDeltas(0.0, 0.0, 0.0);

        // Empty health alerts
        StrainAssessmentWidgetBridge.HealthAlert[] alerts = new StrainAssessmentWidgetBridge.HealthAlert[0];

        // Create training recommendation
        JSObject trainingRec = data.getJSObject("trainingRecommendation");
        StrainAssessmentWidgetBridge.TrainingRecommendation recommendation;

        if (trainingRec != null) {
            StrainAssessmentWidgetBridge.RecommendationStatus recStatus =
                convertRecommendationStatus(trainingRec.getString("status", "normal"));

            String reasoning = trainingRec.getString("reasoning", "Assessment completed");
            String[] modifications = new String[0]; // Could parse from JS array
            Integer loadReduction = trainingRec.getInteger("loadReductionPercent");
            String[] alternatives = new String[0]; // Could parse from JS array

            recommendation = new StrainAssessmentWidgetBridge.TrainingRecommendation(
                recStatus, reasoning, modifications, loadReduction, alternatives
            );
        } else {
            recommendation = new StrainAssessmentWidgetBridge.TrainingRecommendation(
                StrainAssessmentWidgetBridge.RecommendationStatus.NORMAL,
                "Assessment completed",
                new String[0],
                null,
                null
            );
        }

        int confidence = data.getInteger("confidence", 85);
        long timestamp = data.getLong("timestamp", System.currentTimeMillis());

        return new StrainAssessmentWidgetBridge.StrainAssessmentResult(
            status, compositeScore, zones, deltas, alerts, recommendation, confidence, timestamp
        );
    }

    private StrainAssessmentWidgetBridge.RecommendationStatus convertRecommendationStatus(String status) {
        switch (status.toLowerCase()) {
            case "normal": return StrainAssessmentWidgetBridge.RecommendationStatus.NORMAL;
            case "reduce_load": return StrainAssessmentWidgetBridge.RecommendationStatus.REDUCE_LOAD;
            case "rest": return StrainAssessmentWidgetBridge.RecommendationStatus.REST;
            default: return StrainAssessmentWidgetBridge.RecommendationStatus.NORMAL;
        }
    }
}