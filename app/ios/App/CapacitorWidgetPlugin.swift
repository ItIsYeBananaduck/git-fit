//
//  CapacitorWidgetPlugin.swift
//  Technically Fit
//
//  Capacitor plugin implementation for widget data sharing
//

import Foundation
import Capacitor

@objc(CapacitorWidgetPlugin)
public class CapacitorWidgetPlugin: CAPPlugin {

    @objc func updateStrainWidget(_ call: CAPPluginCall) {
        guard let status = call.getString("status") else {
            call.reject("Status parameter is required")
            return
        }

        guard let compositeScore = call.getInt("compositeScore") else {
            call.reject("Composite score parameter is required")
            return
        }

        let nextWorkout = call.getString("nextWorkout")
        let intensity = call.getString("intensity") ?? "Moderate"

        let success = CapacitorWidgetBridge.updateStrainWidget(
            status: status,
            compositeScore: compositeScore,
            nextWorkout: nextWorkout,
            intensity: intensity
        )

        if success {
            call.resolve([
                "success": true,
                "message": "Widget data updated successfully"
            ])
        } else {
            call.reject("Failed to update widget data")
        }
    }

    @objc func clearWidgetData(_ call: CAPPluginCall) {
        CapacitorWidgetBridge.clearWidgetData()
        call.resolve([
            "success": true,
            "message": "Widget data cleared successfully"
        ])
    }
}