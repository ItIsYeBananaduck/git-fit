import type { Id } from '$lib/convex/_generated/dataModel.js';

// Trainer Calendar interfaces
export interface TrainerCalendarEvent {
	id: string;
	trainerId: Id<'users'>;
	clientId: Id<'users'>;
	title: string;
	description?: string;
	eventType: 'session' | 'consultation' | 'assessment' | 'follow_up' | 'other';
	startTime: number;
	endTime: number;
	status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
	location?: 'virtual' | 'in_person';
	notes?: string;
	recurring?: {
		frequency: 'weekly' | 'biweekly' | 'monthly';
		endDate: number;
	};
	workoutData?: {
		programId?: Id<'programs'>;
		exercises?: string[];
		duration?: number;
		performance?: Record<string, unknown>;
	};
	createdAt: number;
	updatedAt: number;
}

export interface ClientSummary {
	clientId: Id<'users'>;
	trainerId: Id<'users'>;
	lastSession: number;
	totalSessions: number;
	upcomingSessions: number;
	performance: {
		strength: number; // percentage improvement
		consistency: number; // attendance rate
		progress: number; // overall progress score
	};
	goals: {
		primary: string;
		secondary: string[];
		progress: number; // percentage towards goals
	};
	recentWorkouts: Array<{
		date: number;
		exercises: string[];
		performance: Record<string, unknown>;
	}>;
	insights: string[];
	recommendations: string[];
}

export interface TrainingSuggestion {
	id: string;
	clientId: Id<'users'>;
	trainerId: Id<'users'>;
	type: 'progression' | 'deload' | 'volume_adjustment' | 'exercise_variation' | 'recovery_focus';
	title: string;
	description: string;
	rationale: string;
	suggestedChanges: Record<string, unknown>;
	expectedOutcome: string;
	confidence: number;
	priority: 'low' | 'medium' | 'high';
	generatedAt: number;
}

// Trainer Calendar Manager
export class TrainerCalendarManager {
	private events: Map<string, TrainerCalendarEvent[]> = new Map();
	private clientSummaries: Map<string, ClientSummary> = new Map();
	private suggestions: Map<string, TrainingSuggestion[]> = new Map();

	// CRUD Operations for Calendar Events
	createEvent(event: Omit<TrainerCalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): TrainerCalendarEvent {
		const newEvent: TrainerCalendarEvent = {
			...event,
			id: `event_${Date.now()}_${Math.random()}`,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		const trainerKey = event.trainerId as string;
		if (!this.events.has(trainerKey)) {
			this.events.set(trainerKey, []);
		}

		this.events.get(trainerKey)!.push(newEvent);

		// Update client summary if this is a session event
		if (event.eventType === 'session') {
			this.updateClientSummary(event.trainerId, event.clientId);
		}

		return newEvent;
	}

	getEvents(
		trainerId: Id<'users'>,
		filters?: {
			clientId?: Id<'users'>;
			startDate?: number;
			endDate?: number;
			status?: TrainerCalendarEvent['status'];
			eventType?: TrainerCalendarEvent['eventType'];
		}
	): TrainerCalendarEvent[] {
		const trainerKey = trainerId as string;
		const trainerEvents = this.events.get(trainerKey) || [];

		let filtered = trainerEvents;

		if (filters) {
			if (filters.clientId) {
				filtered = filtered.filter(e => e.clientId === filters.clientId);
			}
			if (filters.startDate) {
				filtered = filtered.filter(e => e.startTime >= filters.startDate!);
			}
			if (filters.endDate) {
				filtered = filtered.filter(e => e.startTime <= filters.endDate!);
			}
			if (filters.status) {
				filtered = filtered.filter(e => e.status === filters.status);
			}
			if (filters.eventType) {
				filtered = filtered.filter(e => e.eventType === filters.eventType);
			}
		}

		// Sort by start time
		return filtered.sort((a, b) => a.startTime - b.startTime);
	}

	updateEvent(
		trainerId: Id<'users'>,
		eventId: string,
		updates: Partial<Omit<TrainerCalendarEvent, 'id' | 'trainerId' | 'createdAt'>>
	): TrainerCalendarEvent | null {
		const trainerKey = trainerId as string;
		const trainerEvents = this.events.get(trainerKey) || [];

		const eventIndex = trainerEvents.findIndex(e => e.id === eventId);
		if (eventIndex === -1) return null;

		const updatedEvent = {
			...trainerEvents[eventIndex],
			...updates,
			updatedAt: Date.now()
		};

		trainerEvents[eventIndex] = updatedEvent;

		// Update client summary if status changed to completed
		if (updates.status === 'completed' && updatedEvent.eventType === 'session') {
			this.updateClientSummary(updatedEvent.trainerId, updatedEvent.clientId);
		}

		return updatedEvent;
	}

	deleteEvent(trainerId: Id<'users'>, eventId: string): boolean {
		const trainerKey = trainerId as string;
		const trainerEvents = this.events.get(trainerKey) || [];

		const eventIndex = trainerEvents.findIndex(e => e.id === eventId);
		if (eventIndex === -1) return false;

		trainerEvents.splice(eventIndex, 1);
		return true;
	}

	// Client Summary Management
	getClientSummary(trainerId: Id<'users'>, clientId: Id<'users'>): ClientSummary | null {
		const key = `${trainerId}_${clientId}`;
		return this.clientSummaries.get(key) || null;
	}

	updateClientSummary(trainerId: Id<'users'>, clientId: Id<'users'>): void {
		const key = `${trainerId}_${clientId}`;
		const trainerEvents = this.getEvents(trainerId, { clientId });

		const sessionEvents = trainerEvents.filter(e => e.eventType === 'session');
		const completedSessions = sessionEvents.filter(e => e.status === 'completed');
		const upcomingSessions = sessionEvents.filter(e =>
			e.status === 'scheduled' || e.status === 'confirmed'
		);

		const lastSession = completedSessions.length > 0 ?
			Math.max(...completedSessions.map(e => e.endTime)) : 0;

		// Calculate performance metrics
		const performance = this.calculateClientPerformance(completedSessions);

		const summary: ClientSummary = {
			clientId,
			trainerId,
			lastSession,
			totalSessions: completedSessions.length,
			upcomingSessions: upcomingSessions.length,
			performance,
			goals: {
				primary: 'Strength Building', // This would come from user profile
				secondary: ['Muscle Gain', 'Endurance'],
				progress: 75 // This would be calculated based on actual progress
			},
			recentWorkouts: completedSessions
				.slice(-5)
				.map(event => ({
					date: event.startTime,
					exercises: event.workoutData?.exercises || [],
					performance: event.workoutData?.performance || {}
				})),
			insights: this.generateClientInsights(completedSessions),
			recommendations: this.generateClientRecommendations(completedSessions, performance)
		};

		this.clientSummaries.set(key, summary);
	}

	private calculateClientPerformance(sessions: TrainerCalendarEvent[]): ClientSummary['performance'] {
		if (sessions.length === 0) {
			return { strength: 0, consistency: 0, progress: 0 };
		}

		// Calculate consistency (attendance rate over last 4 weeks)
		const fourWeeksAgo = Date.now() - (4 * 7 * 24 * 60 * 60 * 1000);
		const recentSessions = sessions.filter(s => s.startTime >= fourWeeksAgo);
		const expectedSessions = 12; // Assuming 3 sessions per week
		const consistency = Math.min((recentSessions.length / expectedSessions) * 100, 100);

		// Calculate strength improvement (simplified)
		const strengthImprovement = sessions.length > 1 ? 5 + Math.random() * 10 : 0;

		// Calculate overall progress
		const progress = (consistency * 0.4) + (strengthImprovement * 0.6);

		return {
			strength: Math.round(strengthImprovement),
			consistency: Math.round(consistency),
			progress: Math.round(progress)
		};
	}

	private generateClientInsights(sessions: TrainerCalendarEvent[]): string[] {
		const insights: string[] = [];

		if (sessions.length === 0) {
			insights.push('No completed sessions yet');
			return insights;
		}

		const recentSessions = sessions.slice(-3);

		// Check for consistency
		const avgDuration = recentSessions.reduce((sum, s) => {
			const duration = s.workoutData?.duration || 0;
			return sum + duration;
		}, 0) / recentSessions.length;

		if (avgDuration > 3600) { // Over 1 hour
			insights.push('Client is maintaining longer workout sessions');
		}

		// Check for progress patterns
		const exerciseCounts: Record<string, number> = {};
		recentSessions.forEach(session => {
			session.workoutData?.exercises?.forEach(exercise => {
				exerciseCounts[exercise] = (exerciseCounts[exercise] || 0) + 1;
			});
		});

		const mostFrequent = Object.entries(exerciseCounts)
			.sort(([, a], [, b]) => b - a)[0];

		if (mostFrequent && mostFrequent[1] >= 2) {
			insights.push(`Frequently performing ${mostFrequent[0]} - consider progression or variation`);
		}

		return insights;
	}

	private generateClientRecommendations(
		sessions: TrainerCalendarEvent[],
		performance: ClientSummary['performance']
	): string[] {
		const recommendations: string[] = [];

		if (performance.consistency < 70) {
			recommendations.push('Focus on improving session consistency');
		}

		if (performance.strength < 5) {
			recommendations.push('Consider increasing training intensity or volume');
		}

		if (sessions.length > 5) {
			recommendations.push('Schedule a progress assessment session');
		}

		return recommendations;
	}

	// Training Suggestions
	generateSuggestions(trainerId: Id<'users'>, clientId: Id<'users'>): TrainingSuggestion[] {
		const key = `${trainerId}_${clientId}`;
		const summary = this.clientSummaries.get(key);

		if (!summary) {
			this.updateClientSummary(trainerId, clientId);
			return [];
		}

		const suggestions: TrainingSuggestion[] = [];

		// Generate suggestions based on performance
		if (summary.performance.strength < 10) {
			suggestions.push({
				id: `sugg_${Date.now()}_${Math.random()}`,
				clientId,
				trainerId,
				type: 'progression',
				title: 'Progressive Overload Opportunity',
				description: 'Client may benefit from increased training intensity',
				rationale: `Strength improvement has been ${summary.performance.strength}% over recent sessions`,
				suggestedChanges: {
					weightIncrease: '5-10%',
					volumeIncrease: '1-2 sets per exercise'
				},
				expectedOutcome: 'Continued strength gains and muscle development',
				confidence: 0.8,
				priority: 'high',
				generatedAt: Date.now()
			});
		}

		if (summary.performance.consistency < 80) {
			suggestions.push({
				id: `sugg_${Date.now()}_${Math.random()}`,
				clientId,
				trainerId,
				type: 'recovery_focus',
				title: 'Recovery Optimization',
				description: 'Improve recovery strategies to boost consistency',
				rationale: `Session consistency is at ${summary.performance.consistency}%`,
				suggestedChanges: {
					restDays: 'Add 1-2 rest days per week',
					sleep: 'Prioritize 7-9 hours of sleep',
					nutrition: 'Increase protein intake for recovery'
				},
				expectedOutcome: 'Better recovery and improved training consistency',
				confidence: 0.7,
				priority: 'medium',
				generatedAt: Date.now()
			});
		}

		// Store suggestions
		this.suggestions.set(key, suggestions);

		return suggestions;
	}

	getSuggestions(trainerId: Id<'users'>, clientId: Id<'users'>): TrainingSuggestion[] {
		const key = `${trainerId}_${clientId}`;
		return this.suggestions.get(key) || [];
	}

	// Calendar Analytics
	getCalendarAnalytics(trainerId: Id<'users'>, timeframe: 'week' | 'month' | 'quarter' = 'month'): {
		totalSessions: number;
		completedSessions: number;
		upcomingSessions: number;
		completionRate: number;
		revenue: number;
		clientRetention: number;
	} {
		const now = Date.now();
		const timeframeMs = {
			week: 7 * 24 * 60 * 60 * 1000,
			month: 30 * 24 * 60 * 60 * 1000,
			quarter: 90 * 24 * 60 * 60 * 1000
		}[timeframe];

		const startDate = now - timeframeMs;
		const events = this.getEvents(trainerId, { startDate });

		const sessions = events.filter(e => e.eventType === 'session');
		const completed = sessions.filter(e => e.status === 'completed');
		const upcoming = sessions.filter(e =>
			e.status === 'scheduled' || e.status === 'confirmed'
		);

		const completionRate = sessions.length > 0 ? (completed.length / sessions.length) * 100 : 0;

		// Calculate unique clients for retention
		const uniqueClients = new Set(sessions.map(e => e.clientId as string));
		const clientRetention = uniqueClients.size;

		return {
			totalSessions: sessions.length,
			completedSessions: completed.length,
			upcomingSessions: upcoming.length,
			completionRate: Math.round(completionRate),
			revenue: completed.length * 50, // Assuming $50 per session
			clientRetention
		};
	}
}

// Singleton instance
export const trainerCalendarManager = new TrainerCalendarManager();

// Helper functions
export function createCalendarEvent(event: Omit<TrainerCalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): TrainerCalendarEvent {
	return trainerCalendarManager.createEvent(event);
}

export function getTrainerEvents(
	trainerId: Id<'users'>,
	filters?: Parameters<typeof trainerCalendarManager.getEvents>[1]
): TrainerCalendarEvent[] {
	return trainerCalendarManager.getEvents(trainerId, filters);
}

export function updateCalendarEvent(
	trainerId: Id<'users'>,
	eventId: string,
	updates: Parameters<typeof trainerCalendarManager.updateEvent>[2]
): TrainerCalendarEvent | null {
	return trainerCalendarManager.updateEvent(trainerId, eventId, updates);
}

export function deleteCalendarEvent(trainerId: Id<'users'>, eventId: string): boolean {
	return trainerCalendarManager.deleteEvent(trainerId, eventId);
}

export function getClientWorkoutSummary(trainerId: Id<'users'>, clientId: Id<'users'>): ClientSummary | null {
	return trainerCalendarManager.getClientSummary(trainerId, clientId);
}

export function generateTrainingSuggestions(trainerId: Id<'users'>, clientId: Id<'users'>): TrainingSuggestion[] {
	return trainerCalendarManager.generateSuggestions(trainerId, clientId);
}

export function getCalendarAnalytics(
	trainerId: Id<'users'>,
	timeframe?: Parameters<typeof trainerCalendarManager.getCalendarAnalytics>[1]
) {
	return trainerCalendarManager.getCalendarAnalytics(trainerId, timeframe);
}