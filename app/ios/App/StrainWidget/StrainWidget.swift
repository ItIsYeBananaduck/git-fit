//
//  StrainWidget.swift
//  StrainWidget
//
//  Created by GitHub Copilot on 2025-01-13.
//

import WidgetKit
import SwiftUI
import Intents

// MARK: - Data Models

struct StrainWidgetData: Codable {
    let status: StrainStatus
    let compositeScore: Int
    let nextWorkout: String?
    let intensity: String
    let lastUpdated: Date
    let baselineHR: Int
    let baselineSpO2: Int

    enum StrainStatus: String, Codable {
        case ready = "ready"
        case moderate = "moderate"
        case compromised = "compromised"
        case highRisk = "high_risk"
    }

    var statusColor: Color {
        switch status {
        case .ready: return .green
        case .moderate: return .yellow
        case .compromised: return .orange
        case .highRisk: return .red
        }
    }

    var statusEmoji: String {
        switch status {
        case .ready: return "🟢"
        case .moderate: return "🟡"
        case .compromised: return "🟠"
        case .highRisk: return "🔴"
        }
    }
}

// MARK: - Widget Provider

struct Provider: IntentTimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(
            date: Date(),
            data: StrainWidgetData(
                status: .ready,
                compositeScore: 75,
                nextWorkout: "Push Day",
                intensity: "High",
                lastUpdated: Date()
            ),
            configuration: ConfigurationIntent()
        )
    }

    func getSnapshot(for configuration: ConfigurationIntent, in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(
            date: Date(),
            data: loadStrainData() ?? placeholder(in: context).data,
            configuration: configuration
        )
        completion(entry)
    }

    func getTimeline(for configuration: ConfigurationIntent, in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let currentData = loadStrainData() ?? StrainWidgetData(
            status: .ready,
            compositeScore: 75,
            nextWorkout: "Push Day",
            intensity: "High",
            lastUpdated: Date()
        )

        let entry = SimpleEntry(
            date: Date(),
            data: currentData,
            configuration: configuration
        )

        // Update every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadStrainData() -> StrainWidgetData? {
        // Load data from shared UserDefaults or app group
        let sharedDefaults = UserDefaults(suiteName: "group.com.example.technicallyfit")
        guard let data = sharedDefaults?.data(forKey: "strainWidgetData") else {
            return nil
        }

        do {
            return try JSONDecoder().decode(StrainWidgetData.self, from: data)
        } catch {
            print("Error decoding strain data: \(error)")
            return nil
        }
    }
}

// MARK: - Widget Entry

struct SimpleEntry: TimelineEntry {
    let date: Date
    let data: StrainWidgetData
    let configuration: ConfigurationIntent
}

// MARK: - Widget Views

struct StrainWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallStrainWidgetView(data: entry.data)
        case .systemMedium:
            MediumStrainWidgetView(data: entry.data)
        case .systemLarge:
            LargeStrainWidgetView(data: entry.data)
        default:
            SmallStrainWidgetView(data: entry.data)
        }
    }
}

// MARK: - Small Widget View

struct SmallStrainWidgetView: View {
    let data: StrainWidgetData

    var body: some View {
        VStack(spacing: 4) {
            HStack {
                Text(data.statusEmoji)
                    .font(.title2)
                Spacer()
            }

            Text(data.status.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(1)

            if let workout = data.nextWorkout {
                Text(workout)
                    .font(.caption2)
                    .foregroundColor(.primary)
                    .lineLimit(1)
            }

            HStack(spacing: 8) {
                VStack {
                    Text("HR")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text("\(data.baselineHR)")
                        .font(.caption2)
                }
                VStack {
                    Text("SpO₂")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text("\(data.baselineSpO2)%")
                        .font(.caption2)
                }
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }
}

// MARK: - Medium Widget View

struct MediumStrainWidgetView: View {
    let data: StrainWidgetData

    var body: some View {
        HStack(spacing: 12) {
            // Status Section
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(data.statusEmoji)
                        .font(.title3)
                    Text(data.status.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }

                Text("Strain: \(data.compositeScore)/100")
                    .font(.caption)
                    .foregroundColor(.secondary)

                HStack(spacing: 8) {
                    VStack {
                        Text("HR")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text("\(data.baselineHR)")
                            .font(.caption2)
                    }
                    VStack {
                        Text("SpO₂")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text("\(data.baselineSpO2)%")
                            .font(.caption2)
                    }
                }
            }

            Spacer()

            // Workout Section
            VStack(alignment: .trailing, spacing: 4) {
                if let workout = data.nextWorkout {
                    Text("Next Workout")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(workout)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .multilineTextAlignment(.trailing)

                    Text("Intensity: \(data.intensity)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                } else {
                    Text("No workout scheduled")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.trailing)
                }
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }
}

// MARK: - Large Widget View

struct LargeStrainWidgetView: View {
    let data: StrainWidgetData

    var body: some View {
        VStack(spacing: 16) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(data.statusEmoji)
                            .font(.title2)
                        Text(data.status.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                            .font(.title3)
                            .fontWeight(.semibold)
                    }

                    Text("Last updated: \(formattedTime(data.lastUpdated))")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    HStack(spacing: 12) {
                        VStack {
                            Text("HR")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            Text("\(data.baselineHR)")
                                .font(.caption2)
                        }
                        VStack {
                            Text("SpO₂")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            Text("\(data.baselineSpO2)%")
                                .font(.caption2)
                        }
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(data.compositeScore)")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(data.statusColor)

                    Text("/100")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Divider()

            // Workout Section
            VStack(alignment: .leading, spacing: 8) {
                Text("Next Workout")
                    .font(.subheadline)
                    .fontWeight(.semibold)

                if let workout = data.nextWorkout {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(workout)
                                .font(.title3)
                                .fontWeight(.semibold)

                            Text("Intensity: \(data.intensity)")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }

                        Spacer()

                        Image(systemName: "chevron.right")
                            .foregroundColor(.secondary)
                    }
                } else {
                    Text("No workout scheduled")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }

            Divider()

            // Quick Actions
            HStack(spacing: 20) {
                VStack(spacing: 4) {
                    Image(systemName: "heart.fill")
                        .foregroundColor(.red)
                        .font(.title3)
                    Text("HR")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                VStack(spacing: 4) {
                    Image(systemName: "lungs.fill")
                        .foregroundColor(.blue)
                        .font(.title3)
                    Text("SpO₂")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                VStack(spacing: 4) {
                    Image(systemName: "chart.bar.fill")
                        .foregroundColor(.green)
                        .font(.title3)
                    Text("Strain")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }

    private func formattedTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Main Widget

@main
struct StrainWidget: Widget {
    let kind: String = "StrainWidget"

    var body: some WidgetConfiguration {
        IntentConfiguration(kind: kind, intent: ConfigurationIntent.self, provider: Provider()) { entry in
            StrainWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Strain Assessment")
        .description("Quick view of your training readiness and next workout.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Preview

struct StrainWidget_Previews: PreviewProvider {
    static var previews: some View {
        let sampleData = StrainWidgetData(
            status: .ready,
            compositeScore: 78,
            nextWorkout: "Push Day (Chest & Triceps)",
            intensity: "High",
            lastUpdated: Date()
        )

        Group {
            StrainWidgetEntryView(entry: SimpleEntry(date: Date(), data: sampleData, configuration: ConfigurationIntent()))
                .previewContext(WidgetPreviewContext(family: .systemSmall))

            StrainWidgetEntryView(entry: SimpleEntry(date: Date(), data: sampleData, configuration: ConfigurationIntent()))
                .previewContext(WidgetPreviewContext(family: .systemMedium))

            StrainWidgetEntryView(entry: SimpleEntry(date: Date(), data: sampleData, configuration: ConfigurationIntent()))
                .previewContext(WidgetPreviewContext(family: .systemLarge))
        }
    }
}