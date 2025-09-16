import Foundation
import ActivityKit

@available(iOS 16.1, *)
class WorkoutLiveActivityManager {
    static let shared = WorkoutLiveActivityManager()
    private var activity: Activity<WorkoutAttributes>? = nil

    private init() {}

    // Start a new Live Activity
    func start(workoutId: String, userId: String, initialState: WorkoutAttributes.ContentState) async {
        let attributes = WorkoutAttributes(workoutId: workoutId, userId: userId)
        do {
            activity = try await Activity<WorkoutAttributes>.request(
                attributes: attributes,
                contentState: initialState,
                pushType: nil
            )
        } catch {
            print("Failed to start Live Activity: \(error)")
        }
    }

    // Update the Live Activity
    func update(newState: WorkoutAttributes.ContentState) async {
        guard let activity = activity else { return }
        await activity.update(using: newState)
    }

    // End the Live Activity
    func end() async {
        guard let activity = activity else { return }
        await activity.end(dismissalPolicy: .immediate)
        self.activity = nil
    }
}
