//
//  WidgetDataManager.swift
//  Technically Fit
//
//  Utility class for sharing strain assessment data with widgets
//

import Foundation

class WidgetDataManager {
    static let shared = WidgetDataManager()
    private let appGroupIdentifier = "group.com.example.technicallyfit"
    private let strainDataKey = "strainWidgetData"

    private var sharedDefaults: UserDefaults? {
        return UserDefaults(suiteName: appGroupIdentifier)
    }

    // MARK: - Data Models

    struct StrainData: Codable {
        let status: StrainStatus
        let compositeScore: Int
        let nextWorkout: String?
        let intensity: String
        let lastUpdated: Date

        enum StrainStatus: String, Codable {
            case ready = "ready"
            case moderate = "moderate"
            case compromised = "compromised"
            case highRisk = "high_risk"
        }
    }

    // MARK: - Public Methods

    /// Update widget data with current strain assessment
    func updateWidgetData(
        status: StrainStatus,
        compositeScore: Int,
        nextWorkout: String?,
        intensity: String
    ) {
        let data = StrainData(
            status: status,
            compositeScore: compositeScore,
            nextWorkout: nextWorkout,
            intensity: intensity,
            lastUpdated: Date()
        )

        saveWidgetData(data)
    }

    /// Clear widget data (e.g., when user logs out)
    func clearWidgetData() {
        sharedDefaults?.removeObject(forKey: strainDataKey)
        WidgetCenter.shared.reloadAllTimelines()
    }

    /// Get current widget data (for debugging)
    func getCurrentWidgetData() -> StrainData? {
        guard let data = sharedDefaults?.data(forKey: strainDataKey) else {
            return nil
        }

        do {
            return try JSONDecoder().decode(StrainData.self, from: data)
        } catch {
            print("Error decoding widget data: \(error)")
            return nil
        }
    }

    // MARK: - Private Methods

    private func saveWidgetData(_ data: StrainData) {
        do {
            let encodedData = try JSONEncoder().encode(data)
            sharedDefaults?.set(encodedData, forKey: strainDataKey)

            // Notify widget to reload
            DispatchQueue.main.async {
                WidgetCenter.shared.reloadAllTimelines()
            }

            print("Widget data updated successfully")
        } catch {
            print("Error encoding widget data: \(error)")
        }
    }
}

// MARK: - Convenience Extensions

extension WidgetDataManager.StrainStatus {
    var displayName: String {
        switch self {
        case .ready: return "Ready to Train"
        case .moderate: return "Moderate Caution"
        case .compromised: return "Compromised"
        case .highRisk: return "High Risk"
        }
    }

    var emoji: String {
        switch self {
        case .ready: return "🟢"
        case .moderate: return "🟡"
        case .compromised: return "🟠"
        case .highRisk: return "🔴"
        }
    }
}

// MARK: - Capacitor Bridge

/// Bridge class for Capacitor to call native widget data sharing
@objc class CapacitorWidgetBridge: NSObject {

    @objc static func updateStrainWidget(
        status: String,
        compositeScore: Int,
        nextWorkout: String?,
        intensity: String
    ) -> Bool {
        guard let strainStatus = WidgetDataManager.StrainStatus(rawValue: status) else {
            print("Invalid strain status: \(status)")
            return false
        }

        WidgetDataManager.shared.updateWidgetData(
            status: strainStatus,
            compositeScore: compositeScore,
            nextWorkout: nextWorkout,
            intensity: intensity
        )

        return true
    }

    @objc static func clearWidgetData() {
        WidgetDataManager.shared.clearWidgetData()
    }
}