import Foundation
import ActivityKit

@available(iOS 16.1, *)
class WorkoutSessionManager: ObservableObject {
    @Published var currentExercise: String = ""
    @Published var repsCompleted: Int = 0
    @Published var repTarget: Int = 0
    @Published var strain: Int = 0
    @Published var isResting: Bool = false
    @Published var restSecondsRemaining: Int? = nil
    @Published var workoutId: String = UUID().uuidString
    @Published var userId: String = "user-123"

    func startWorkout(exercise: String, repTarget: Int) async {
        self.currentExercise = exercise
        self.repTarget = repTarget
        self.repsCompleted = 0
        self.strain = 0
        self.isResting = false
        self.restSecondsRemaining = nil
        self.workoutId = UUID().uuidString
        let initialState = WorkoutAttributes.ContentState(
            exerciseName: exercise,
            repsCompleted: 0,
            repTarget: repTarget,
            strain: 0,
            isResting: false,
            restSecondsRemaining: nil,
            lastUpdated: Date()
        )
        await WorkoutLiveActivityManager.shared.start(
            workoutId: workoutId,
            userId: userId,
            initialState: initialState
        )
    }

    func updateWorkout(reps: Int, strain: Int, isResting: Bool, restSeconds: Int?) async {
        self.repsCompleted = reps
        self.strain = strain
        self.isResting = isResting
        self.restSecondsRemaining = restSeconds
        let newState = WorkoutAttributes.ContentState(
            exerciseName: currentExercise,
            repsCompleted: reps,
            repTarget: repTarget,
            strain: strain,
            isResting: isResting,
            restSecondsRemaining: restSeconds,
            lastUpdated: Date()
        )
        await WorkoutLiveActivityManager.shared.update(newState: newState)
    }

    func endWorkout() async {
        await WorkoutLiveActivityManager.shared.end()
    }
}
