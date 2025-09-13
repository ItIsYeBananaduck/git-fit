package com.example.technicallyfit.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import android.app.PendingIntent;
import android.content.Intent;
import com.example.technicallyfit.MainActivity;
import org.json.JSONObject;
import org.json.JSONException;

/**
 * Implementation of App Widget functionality for Strain Assessment
 */
public class StrainWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_UPDATE_WIDGET = "com.example.technicallyfit.UPDATE_WIDGET";
    private static final String PREFS_NAME = "com.example.technicallyfit.widget";
    private static final String WIDGET_DATA_KEY = "strainWidgetData";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // There may be multiple widgets active, so update all of them
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onEnabled(Context context) {
        // Enter relevant functionality for when the first widget is created
    }

    @Override
    public void onDisabled(Context context) {
        // Enter relevant functionality for when the last widget is disabled
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        if (ACTION_UPDATE_WIDGET.equals(intent.getAction())) {
            // Update all widgets when data changes
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(
                new android.content.ComponentName(context, StrainWidgetProvider.class)
            );
            onUpdate(context, appWidgetManager, appWidgetIds);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        // Load widget data
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String widgetDataJson = prefs.getString(WIDGET_DATA_KEY, null);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_strain);

        if (widgetDataJson != null) {
            try {
                JSONObject widgetData = new JSONObject(widgetDataJson);

                String status = widgetData.getString("status");
                int compositeScore = widgetData.getInt("compositeScore");
                String nextWorkout = widgetData.optString("nextWorkout", null);
                String intensity = widgetData.getString("intensity");

                // Update status text and color
                views.setTextViewText(R.id.widget_status_text, getStatusDisplayName(status));
                views.setTextViewText(R.id.widget_status_emoji, getStatusEmoji(status));
                views.setInt(R.id.widget_status_container, "setBackgroundColor", getStatusColor(status));

                // Update score
                views.setTextViewText(R.id.widget_score_text, String.valueOf(compositeScore));

                // Update workout info
                if (nextWorkout != null && !nextWorkout.isEmpty()) {
                    views.setTextViewText(R.id.widget_workout_text, nextWorkout);
                    views.setTextViewText(R.id.widget_intensity_text, intensity);
                    views.setViewVisibility(R.id.widget_workout_container, android.view.View.VISIBLE);
                } else {
                    views.setViewVisibility(R.id.widget_workout_container, android.view.View.GONE);
                }

            } catch (JSONException e) {
                // Show default/error state
                showDefaultState(views);
            }
        } else {
            // Show default state when no data is available
            showDefaultState(views);
        }

        // Set up click intent to open main app
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);

        // Instruct the widget manager to update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static void showDefaultState(RemoteViews views) {
        views.setTextViewText(R.id.widget_status_text, "Not Available");
        views.setTextViewText(R.id.widget_status_emoji, "⚪");
        views.setTextViewText(R.id.widget_score_text, "--");
        views.setViewVisibility(R.id.widget_workout_container, android.view.View.GONE);
        views.setInt(R.id.widget_status_container, "setBackgroundColor", 0xFFCCCCCC);
    }

    private static String getStatusDisplayName(String status) {
        switch (status) {
            case "ready": return "Ready to Train";
            case "moderate": return "Moderate Caution";
            case "compromised": return "Compromised";
            case "high_risk": return "High Risk";
            default: return "Unknown";
        }
    }

    private static String getStatusEmoji(String status) {
        switch (status) {
            case "ready": return "🟢";
            case "moderate": return "🟡";
            case "compromised": return "🟠";
            case "high_risk": return "🔴";
            default: return "⚪";
        }
    }

    private static int getStatusColor(String status) {
        switch (status) {
            case "ready": return 0xFF4CAF50;      // Green
            case "moderate": return 0xFFFFC107;   // Yellow
            case "compromised": return 0xFFFF9800; // Orange
            case "high_risk": return 0xFFF44336;  // Red
            default: return 0xFF9E9E9E;           // Gray
        }
    }

    // Public methods for updating widget data from the app

    public static void updateWidgetData(Context context, String status, int compositeScore,
                                      String nextWorkout, String intensity) {
        try {
            JSONObject widgetData = new JSONObject();
            widgetData.put("status", status);
            widgetData.put("compositeScore", compositeScore);
            widgetData.put("nextWorkout", nextWorkout != null ? nextWorkout : JSONObject.NULL);
            widgetData.put("intensity", intensity);
            widgetData.put("lastUpdated", System.currentTimeMillis());

            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(WIDGET_DATA_KEY, widgetData.toString()).apply();

            // Trigger widget update
            Intent updateIntent = new Intent(context, StrainWidgetProvider.class);
            updateIntent.setAction(ACTION_UPDATE_WIDGET);
            context.sendBroadcast(updateIntent);

        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    public static void clearWidgetData(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().remove(WIDGET_DATA_KEY).apply();

        // Trigger widget update
        Intent updateIntent = new Intent(context, StrainWidgetProvider.class);
        updateIntent.setAction(ACTION_UPDATE_WIDGET);
        context.sendBroadcast(updateIntent);
    }
}