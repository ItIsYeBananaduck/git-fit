import Foundation
import ActivityKit

// MARK: - Live Activity Attributes for Workout

struct WorkoutAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic state for the Live Activity
        var exerciseName: String
        var repsCompleted: Int
        var repTarget: Int
        var strain: Int // e.g. 0-100
        var isResting: Bool
        var restSecondsRemaining: Int?
        var lastUpdated: Date
    }

    // Fixed attributes for the Live Activity
    var workoutId: String
    var userId: String
}
