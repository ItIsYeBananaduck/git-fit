import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/convex/_generated/api_workaround';

// Types for workout history
export interface WorkoutSession {
	id: string;
	userId: string;
	startTime: Date;
	endTime?: Date;
	exercises: WorkoutExercise[];
	totalDuration?: number; // in minutes
	totalVolume?: number; // total weight lifted
	averageHeartRate?: number;
	maxHeartRate?: number;
	caloriesBurned?: number;
	notes?: string;
}

export interface WorkoutExercise {
	id: string;
	exerciseId: string;
	exerciseName: string;
	sets: WorkoutSet[];
	notes?: string;
}

export interface WorkoutSet {
	id: string;
	reps: number;
	weight: number; // in lbs
	duration?: number; // in seconds (for time-based exercises)
	restTime?: number; // in seconds
	heartRate?: number;
	rpe?: number; // Rate of Perceived Exertion (1-10)
	notes?: string;
}

export interface WorkoutHistoryFilters {
	startDate?: Date;
	endDate?: Date;
	exerciseId?: string;
	limit?: number;
	offset?: number;
}

export interface WorkoutStats {
	totalWorkouts: number;
	totalDuration: number; // in minutes
	totalVolume: number; // in lbs
	averageHeartRate: number;
	personalRecords: PersonalRecord[];
	recentWorkouts: WorkoutSession[];
}

export interface PersonalRecord {
	exerciseId: string;
	exerciseName: string;
	maxWeight: number;
	maxReps: number;
	dateAchieved: Date;
	workoutId: string;
}

export class WorkoutHistoryService {
	private convexClient: ConvexHttpClient;

	constructor(convexClient?: ConvexHttpClient) {
		this.convexClient = convexClient || new ConvexHttpClient(process.env.VITE_CONVEX_URL || '');
	}

	// Get workout history for a user
	async getWorkoutHistory(userId: string, filters: WorkoutHistoryFilters = {}): Promise<WorkoutSession[]> {
		try {
			const query = api.workouts.getWorkoutHistory;
			const result = await this.convexClient.query(query, {
				userId,
				startDate: filters.startDate?.toISOString(),
				endDate: filters.endDate?.toISOString(),
				exerciseId: filters.exerciseId,
				limit: filters.limit || 50,
				offset: filters.offset || 0
			});

			// Transform the data to match our interface
			return result.map(workout => ({
				...workout,
				startTime: new Date(workout.startTime),
				endTime: workout.endTime ? new Date(workout.endTime) : undefined,
				exercises: workout.exercises.map(exercise => ({
					...exercise,
					sets: exercise.sets.map(set => ({
						...set,
						// Ensure numeric values
						reps: Number(set.reps),
						weight: Number(set.weight),
						duration: set.duration ? Number(set.duration) : undefined,
						restTime: set.restTime ? Number(set.restTime) : undefined,
						heartRate: set.heartRate ? Number(set.heartRate) : undefined,
						rpe: set.rpe ? Number(set.rpe) : undefined
					}))
				}))
			}));
		} catch (error) {
			console.error('Failed to fetch workout history:', error);
			// Return mock data for development
			return this.getMockWorkoutHistory(userId, filters);
		}
	}

	// Get workout statistics
	async getWorkoutStats(userId: string): Promise<WorkoutStats> {
		try {
			const query = api.workouts.getWorkoutStats;
			const result = await this.convexClient.query(query, { userId });

			return {
				...result,
				recentWorkouts: result.recentWorkouts.map(workout => ({
					...workout,
					startTime: new Date(workout.startTime),
					endTime: workout.endTime ? new Date(workout.endTime) : undefined
				}))
			};
		} catch (error) {
			console.error('Failed to fetch workout stats:', error);
			return this.getMockWorkoutStats(userId);
		}
	}

	// Save a completed workout session
	async saveWorkoutSession(session: Omit<WorkoutSession, 'id'>): Promise<string> {
		try {
			const mutation = api.workouts.saveWorkoutSession;
			const result = await this.convexClient.mutation(mutation, {
				userId: session.userId,
				startTime: session.startTime.toISOString(),
				endTime: session.endTime?.toISOString(),
				exercises: session.exercises,
				totalDuration: session.totalDuration,
				totalVolume: session.totalVolume,
				averageHeartRate: session.averageHeartRate,
				maxHeartRate: session.maxHeartRate,
				caloriesBurned: session.caloriesBurned,
				notes: session.notes
			});

			return result;
		} catch (error) {
			console.error('Failed to save workout session:', error);
			// Return a mock ID for development
			return `mock-session-${Date.now()}`;
		}
	}

	// Update an existing workout session
	async updateWorkoutSession(sessionId: string, updates: Partial<WorkoutSession>): Promise<void> {
		try {
			const mutation = api.workouts.updateWorkoutSession;
			await this.convexClient.mutation(mutation, {
				sessionId,
				updates: {
					...updates,
					endTime: updates.endTime?.toISOString(),
					exercises: updates.exercises
				}
			});
		} catch (error) {
			console.error('Failed to update workout session:', error);
			// Silently fail for development
		}
	}

	// Delete a workout session
	async deleteWorkoutSession(sessionId: string): Promise<void> {
		try {
			const mutation = api.workouts.deleteWorkoutSession;
			await this.convexClient.mutation(mutation, { sessionId });
		} catch (error) {
			console.error('Failed to delete workout session:', error);
			// Silently fail for development
		}
	}

	// Get personal records for exercises
	async getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
		try {
			const query = api.workouts.getPersonalRecords;
			const result = await this.convexClient.query(query, { userId });

			return result.map(record => ({
				...record,
				dateAchieved: new Date(record.dateAchieved)
			}));
		} catch (error) {
			console.error('Failed to fetch personal records:', error);
			return this.getMockPersonalRecords(userId);
		}
	}

	// Mock data for development
	private getMockWorkoutHistory(userId: string, filters: WorkoutHistoryFilters): WorkoutSession[] {
		const mockWorkouts: WorkoutSession[] = [
			{
				id: 'mock-1',
				userId,
				startTime: new Date(Date.now() - 86400000), // 1 day ago
				endTime: new Date(Date.now() - 86400000 + 3600000), // 1 hour later
				exercises: [
					{
						id: 'ex-1',
						exerciseId: 'squat',
						exerciseName: 'Barbell Squat',
						sets: [
							{ id: 'set-1', reps: 8, weight: 185, restTime: 180, heartRate: 145 },
							{ id: 'set-2', reps: 8, weight: 185, restTime: 180, heartRate: 150 },
							{ id: 'set-3', reps: 6, weight: 205, restTime: 240, heartRate: 155 }
						]
					}
				],
				totalDuration: 75,
				totalVolume: 2340,
				averageHeartRate: 150,
				maxHeartRate: 160,
				caloriesBurned: 320
			},
			{
				id: 'mock-2',
				userId,
				startTime: new Date(Date.now() - 172800000), // 2 days ago
				endTime: new Date(Date.now() - 172800000 + 4500000), // 1.25 hours later
				exercises: [
					{
						id: 'ex-2',
						exerciseId: 'bench-press',
						exerciseName: 'Bench Press',
						sets: [
							{ id: 'set-4', reps: 10, weight: 135, restTime: 120, heartRate: 130 },
							{ id: 'set-5', reps: 8, weight: 155, restTime: 150, heartRate: 140 },
							{ id: 'set-6', reps: 6, weight: 175, restTime: 180, heartRate: 150 }
						]
					}
				],
				totalDuration: 90,
				totalVolume: 2470,
				averageHeartRate: 140,
				maxHeartRate: 155,
				caloriesBurned: 280
			}
		];

		// Apply filters
		let filtered = mockWorkouts;
		if (filters.startDate) {
			filtered = filtered.filter(w => w.startTime >= filters.startDate!);
		}
		if (filters.endDate) {
			filtered = filtered.filter(w => w.startTime <= filters.endDate!);
		}
		if (filters.exerciseId) {
			filtered = filtered.filter(w =>
				w.exercises.some(e => e.exerciseId === filters.exerciseId)
			);
		}

		return filtered.slice(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50));
	}

	private getMockWorkoutStats(userId: string): WorkoutStats {
		return {
			totalWorkouts: 24,
			totalDuration: 1800, // 30 hours
			totalVolume: 45680, // lbs
			averageHeartRate: 145,
			personalRecords: this.getMockPersonalRecords(userId),
			recentWorkouts: this.getMockWorkoutHistory(userId, { limit: 5 })
		};
	}

	private getMockPersonalRecords(userId: string): PersonalRecord[] {
		return [
			{
				exerciseId: 'squat',
				exerciseName: 'Barbell Squat',
				maxWeight: 225,
				maxReps: 8,
				dateAchieved: new Date(Date.now() - 86400000),
				workoutId: 'mock-1'
			},
			{
				exerciseId: 'bench-press',
				exerciseName: 'Bench Press',
				maxWeight: 185,
				maxReps: 6,
				dateAchieved: new Date(Date.now() - 172800000),
				workoutId: 'mock-2'
			}
		];
	}
}

// Global instance for app-wide workout history management
export const globalWorkoutHistoryService = new WorkoutHistoryService();