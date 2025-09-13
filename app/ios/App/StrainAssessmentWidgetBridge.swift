//
//  StrainAssessmentWidgetBridge.swift
//  Technically Fit
//
//  Bridge between strain assessment service and widget updates
//

import Foundation

class StrainAssessmentWidgetBridge {
    static let shared = StrainAssessmentWidgetBridge()

    private let widgetDataManager = WidgetDataManager()

    // MARK: - Public Methods

    /// Update widget with strain assessment results
    func updateWidgetWithStrainAssessment(_ assessment: StrainAssessmentResult) {
        // Convert strain assessment to widget data
        let widgetData = convertToWidgetData(assessment)

        // Update widget through data manager
        widgetDataManager.updateWidgetData(
            status: widgetData.status,
            compositeScore: widgetData.compositeScore,
            nextWorkout: widgetData.nextWorkout,
            intensity: widgetData.intensity
        )
    }

    /// Clear widget data (e.g., when user logs out)
    func clearWidgetData() {
        widgetDataManager.clearWidgetData()
    }

    // MARK: - Private Methods

    private func convertToWidgetData(_ assessment: StrainAssessmentResult) -> StrainWidgetData {
        let status = convertStatus(assessment.overallStatus)
        let compositeScore = assessment.compositeScore
        let nextWorkout = extractNextWorkout(assessment.trainingRecommendation)
        let intensity = calculateIntensity(assessment.overallStatus, assessment.trainingRecommendation)

        return StrainWidgetData(
            status: status,
            compositeScore: compositeScore,
            nextWorkout: nextWorkout,
            intensity: intensity,
            lastUpdated: Date()
        )
    }

    private func convertStatus(_ status: StrainAssessmentStatus) -> StrainWidgetData.StrainStatus {
        switch status {
        case .ready:
            return .ready
        case .moderate:
            return .moderate
        case .compromised:
            return .compromised
        case .highRisk:
            return .highRisk
        }
    }

    private func extractNextWorkout(_ recommendation: TrainingRecommendation?) -> String? {
        guard let recommendation = recommendation else { return nil }

        // Extract workout info from recommendation reasoning
        let reasoning = recommendation.reasoning.lowercased()
        if reasoning.contains("push") {
            return "Push Day"
        } else if reasoning.contains("pull") {
            return "Pull Day"
        } else if reasoning.contains("legs") || reasoning.contains("leg") {
            return "Leg Day"
        } else if reasoning.contains("rest") {
            return "Rest Day"
        }

        return nil
    }

    private func calculateIntensity(_ status: StrainAssessmentStatus, _ recommendation: TrainingRecommendation?) -> String {
        switch status {
        case .highRisk:
            return "Rest"
        case .compromised:
            return "Light"
        case .moderate:
            return "Moderate"
        case .ready:
            // Check for load reduction
            if let loadReduction = recommendation?.loadReductionPercent {
                if loadReduction > 20 {
                    return "Light"
                } else if loadReduction > 10 {
                    return "Moderate"
                }
            }
            return "High"
        }
    }
}

// MARK: - Integration with Strain Assessment Service

extension StrainAssessmentWidgetBridge {

    /// Convenience method to update widget from assessment service
    func updateWidgetFromService(
        overallStatus: StrainAssessmentStatus,
        compositeScore: Int,
        trainingRecommendation: TrainingRecommendation?,
        nextWorkout: String? = nil
    ) {
        let assessment = StrainAssessmentResult(
            overallStatus: overallStatus,
            compositeScore: compositeScore,
            zones: StrainZones(hrZone: .green, spo2Zone: .green), // Default zones
            deltas: StrainDeltas(hrDelta: 0, spo2Delta: 0, hrvDelta: 0),
            healthAlerts: [],
            trainingRecommendation: trainingRecommendation ?? TrainingRecommendation(
                status: .normal,
                reasoning: "Assessment completed",
                modifications: [],
                loadReductionPercent: nil,
                alternativeActivities: nil
            ),
            confidence: 85,
            timestamp: Date()
        )

        updateWidgetWithStrainAssessment(assessment)
    }
}

// MARK: - Data Models

// These should match the models in the strain assessment service
struct StrainAssessmentResult {
    let overallStatus: StrainAssessmentStatus
    let compositeScore: Int
    let zones: StrainZones
    let deltas: StrainDeltas
    let healthAlerts: [HealthAlert]
    let trainingRecommendation: TrainingRecommendation
    let confidence: Int
    let timestamp: Date
}

enum StrainAssessmentStatus {
    case ready, moderate, compromised, highRisk
}

struct StrainZones {
    let hrZone: TrafficLight
    let spo2Zone: TrafficLight
}

struct StrainDeltas {
    let hrDelta: Double
    let spo2Delta: Double
    let hrvDelta: Double
}

enum TrafficLight {
    case green, yellow, orange, red
}

struct HealthAlert {
    let message: String
    let severity: AlertSeverity
    let requiresAttention: Bool
    let recommendation: String
}

enum AlertSeverity {
    case low, medium, high
}

struct TrainingRecommendation {
    let status: RecommendationStatus
    let reasoning: String
    let modifications: [String]
    let loadReductionPercent: Int?
    let alternativeActivities: [String]?
}

enum RecommendationStatus {
    case normal, reduceLoad = "reduce_load", rest = "rest"
}