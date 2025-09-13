package com.example.technicallyfit;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.example.technicallyfit.widget.StrainWidgetProvider;

@CapacitorPlugin(name = "CapacitorWidget")
public class CapacitorWidgetPlugin extends Plugin {

    @PluginMethod
    public void updateStrainWidget(PluginCall call) {
        String status = call.getString("status");
        Integer compositeScore = call.getInt("compositeScore");
        String nextWorkout = call.getString("nextWorkout");
        String intensity = call.getString("intensity");

        if (status == null || compositeScore == null || intensity == null) {
            call.reject("Missing required parameters");
            return;
        }

        try {
            // Update widget data
            StrainWidgetProvider.updateWidgetData(
                getContext(),
                status,
                compositeScore,
                nextWorkout,
                intensity
            );

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Widget data updated successfully");
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Failed to update widget: " + e.getMessage());
        }
    }

    @PluginMethod
    public void clearWidgetData(PluginCall call) {
        try {
            StrainWidgetProvider.clearWidgetData(getContext());

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Widget data cleared successfully");
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Failed to clear widget data: " + e.getMessage());
        }
    }
}