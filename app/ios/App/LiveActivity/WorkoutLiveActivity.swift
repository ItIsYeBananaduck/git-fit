import ActivityKit
import SwiftUI

// MARK: - Live Activity for Workout Session

@main
struct WorkoutLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutAttributes.self) { context in
            // Lock screen/banner UI
            VStack(alignment: .leading) {
                Text(context.attributes.workoutId)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(context.state.exerciseName)
                    .font(.headline)
                if context.state.isResting {
                    Text("Rest: \(context.state.restSecondsRemaining ?? 0)s")
                        .font(.title2)
                        .foregroundColor(.blue)
                } else {
                    Text("Reps: \(context.state.repsCompleted) / \(context.state.repTarget)")
                        .font(.title2)
                }
                Text("Strain: \(context.state.strain)")
                    .font(.subheadline)
                    .foregroundColor(.orange)
            }
            .padding()
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.state.exerciseName)
                        .font(.caption)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if context.state.isResting {
                        Text("Rest: \(context.state.restSecondsRemaining ?? 0)s")
                            .font(.caption2)
                            .foregroundColor(.blue)
                    } else {
                        Text("Reps: \(context.state.repsCompleted)/\(context.state.repTarget)")
                            .font(.caption2)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Strain: \(context.state.strain)")
                        .font(.caption2)
                        .foregroundColor(.orange)
                }
            } compactLeading: {
                Text(context.state.isResting ? "Rest" : "Set")
                    .font(.caption2)
            } compactTrailing: {
                Text("\(context.state.strain)")
                    .font(.caption2)
            } minimal: {
                Circle()
                    .fill(context.state.isResting ? Color.blue : Color.green)
                    .frame(width: 12, height: 12)
            }
        }
    }
}
