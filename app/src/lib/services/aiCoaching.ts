import { writable, derived } from 'svelte/store';
import type { Id } from '$lib/convex/_generated/dataModel.js';

// Coach personality definitions
export interface CoachPersonality {
	id: 'alice' | 'aiden';
	name: string;
	tagline: string;
	description: string;
	tones: string[];
	avatar: string;
	color: string;
	traits: {
		encouragement: number; // 1-10 scale
		structure: number; // 1-10 scale
		motivation: number; // 1-10 scale
		accountability: number; // 1-10 scale
	};
	preferences: {
		communicationStyle: 'encouraging' | 'direct' | 'balanced';
		feedbackFrequency: 'high' | 'medium' | 'low';
		adaptationSpeed: 'fast' | 'moderate' | 'gradual';
	};
}

// Coach state interface
export interface CoachState {
	selectedCoach: 'alice' | 'aiden' | null;
	isActive: boolean;
	sessionStartTime: number | null;
	currentWorkout: Id<'workouts'> | null;
	userPreferences: {
		coachType: 'alice' | 'aiden' | null;
		communicationStyle: 'encouraging' | 'direct' | 'balanced';
		feedbackFrequency: 'high' | 'medium' | 'low';
		adaptationSpeed: 'fast' | 'moderate' | 'gradual';
		motivationalTriggers: string[];
		challengeLevel: 'beginner' | 'intermediate' | 'advanced';
	};
	performanceMetrics: {
		avgHeartRate: number;
		workoutConsistency: number;
		goalProgress: number;
		motivationLevel: number;
	};
}

// Workout context for AI coaching
export interface WorkoutContext {
	workoutId: Id<'workouts'>;
	exercise: string;
	setNumber: number;
	repCount: number;
	weight: number;
	heartRate: number;
	timeElapsed: number;
	previousPerformance?: {
		bestWeight: number;
		bestReps: number;
		avgHeartRate: number;
	};
}

// AI Response types
export interface CoachResponse {
	message: string;
	tone: 'encouraging' | 'motivational' | 'corrective' | 'celebratory' | 'instructional';
	priority: 'high' | 'medium' | 'low';
	timing: 'immediate' | 'set_complete' | 'workout_complete';
	actions?: string[];
}

// Coach personalities configuration
const COACH_PERSONALITIES: Record<'alice' | 'aiden', CoachPersonality> = {
	alice: {
		id: 'alice',
		name: 'Alice',
		tagline: 'Your Encouraging Guide',
		description: 'Alice brings warmth and motivation to every workout. She celebrates your progress, adapts to your energy levels, and helps you build confidence through consistent encouragement.',
		tones: ['Encouraging', 'Firmer'],
		avatar: '👩‍💼',
		color: 'from-pink-400 to-rose-500',
		traits: {
			encouragement: 9,
			structure: 6,
			motivation: 8,
			accountability: 7
		},
		preferences: {
			communicationStyle: 'encouraging',
			feedbackFrequency: 'high',
			adaptationSpeed: 'moderate'
		}
	},
	aiden: {
		id: 'aiden',
		name: 'Aiden',
		tagline: 'Your Steady Coach',
		description: 'Aiden provides structured, no-nonsense coaching with clear expectations. He focuses on consistency, technique fundamentals, and pushing you to reach your potential.',
		tones: ['Steady', 'Pushy'],
		avatar: '👨‍💼',
		color: 'from-blue-400 to-indigo-500',
		traits: {
			encouragement: 6,
			structure: 9,
			motivation: 7,
			accountability: 9
		},
		preferences: {
			communicationStyle: 'direct',
			feedbackFrequency: 'medium',
			adaptationSpeed: 'gradual'
		}
	}
};

// AI Coaching Service Class
export class AICoachingService {
	private coachState: CoachState;
	private personality: CoachPersonality | null = null;

	constructor() {
		this.coachState = {
			selectedCoach: null,
			isActive: false,
			sessionStartTime: null,
			currentWorkout: null,
			userPreferences: {
				coachType: null,
				communicationStyle: 'balanced',
				feedbackFrequency: 'medium',
				adaptationSpeed: 'moderate',
				motivationalTriggers: [],
				challengeLevel: 'intermediate'
			},
			performanceMetrics: {
				avgHeartRate: 0,
				workoutConsistency: 0,
				goalProgress: 0,
				motivationLevel: 5
			}
		};
	}

	// Initialize coach with user preferences
	async initializeCoach(userId: Id<'users'>, coachType: 'alice' | 'aiden'): Promise<void> {
		this.coachState.selectedCoach = coachType;
		this.personality = COACH_PERSONALITIES[coachType];

		// Load user preferences from database
		try {
			const userPrefs = await this.loadUserPreferences(userId);
			this.coachState.userPreferences = { ...this.coachState.userPreferences, ...userPrefs };
		} catch (error) {
			console.warn('Failed to load user preferences, using defaults:', error);
		}

		this.coachState.isActive = true;
	}

	// Start workout session
	startWorkoutSession(workoutId: Id<'workouts'>): void {
		this.coachState.sessionStartTime = Date.now();
		this.coachState.currentWorkout = workoutId;
		this.coachState.isActive = true;
	}

	// End workout session
	endWorkoutSession(): void {
		this.coachState.sessionStartTime = null;
		this.coachState.currentWorkout = null;
		this.coachState.isActive = false;
	}

	// Generate AI response based on workout context
	generateResponse(context: WorkoutContext): CoachResponse {
		if (!this.personality || !this.coachState.isActive) {
			return {
				message: "Let's get started with your workout!",
				tone: 'instructional',
				priority: 'medium',
				timing: 'immediate'
			};
		}

		const responses = this.getPersonalityResponses(context);
		const selectedResponse = this.selectResponseBasedOnContext(responses, context);

		return selectedResponse;
	}

	// Get workout summary and feedback
	generateWorkoutSummary(workoutData: { duration: number; exercises: number; totalSets: number }): CoachResponse {
		if (!this.personality) {
			return {
				message: "Great workout! Keep it up!",
				tone: 'celebratory',
				priority: 'high',
				timing: 'workout_complete'
			};
		}

		const summary = this.createPersonalizedSummary(workoutData);
		return summary;
	}

	// Update performance metrics
	updatePerformanceMetrics(metrics: Partial<CoachState['performanceMetrics']>): void {
		this.coachState.performanceMetrics = {
			...this.coachState.performanceMetrics,
			...metrics
		};
	}

	// Get current coach state
	getCoachState(): CoachState {
		return { ...this.coachState };
	}

	// Get personality information
	getPersonality(): CoachPersonality | null {
		return this.personality;
	}

	// Private methods
	private async loadUserPreferences(userId: Id<'users'>): Promise<Partial<CoachState['userPreferences']>> {
		// TODO: Implement user preference loading from database using userId
		console.log('Loading preferences for user:', userId);
		return {
			coachType: this.coachState.selectedCoach,
			communicationStyle: this.personality?.preferences.communicationStyle || 'balanced',
			feedbackFrequency: this.personality?.preferences.feedbackFrequency || 'medium',
			adaptationSpeed: this.personality?.preferences.adaptationSpeed || 'moderate'
		};
	}

	private getPersonalityResponses(context: WorkoutContext): CoachResponse[] {
		if (!this.personality) return [];

		// TODO: Use context for more personalized responses
		console.log('Generating responses for context:', context.exercise);

		const baseResponses: CoachResponse[] = [];

		// Alice's encouraging responses
		if (this.personality.id === 'alice') {
			baseResponses.push(
				{
					message: `You're doing amazing! That was a solid set. You've got this! 💪`,
					tone: 'encouraging',
					priority: 'high',
					timing: 'set_complete'
				},
				{
					message: `I can see your progress building. Keep that energy going - you're stronger than you think!`,
					tone: 'motivational',
					priority: 'medium',
					timing: 'immediate'
				},
				{
					message: `Remember why you started. Every rep brings you closer to your goals. You've got the heart of a champion!`,
					tone: 'encouraging',
					priority: 'medium',
					timing: 'set_complete'
				}
			);
		}

		// Aiden's structured responses
		if (this.personality.id === 'aiden') {
			baseResponses.push(
				{
					message: `Good form on that set. Let's maintain that consistency. Next set: focus on controlled movement.`,
					tone: 'instructional',
					priority: 'high',
					timing: 'set_complete'
				},
				{
					message: `Structure builds strength. Stay focused on the fundamentals - that's how champions are made.`,
					tone: 'motivational',
					priority: 'medium',
					timing: 'immediate'
				},
				{
					message: `Accountability matters. You've committed to this set - now execute with precision.`,
					tone: 'corrective',
					priority: 'medium',
					timing: 'set_complete'
				}
			);
		}

		return baseResponses;
	}

	private selectResponseBasedOnContext(responses: CoachResponse[], context: WorkoutContext): CoachResponse {
		// TODO: Implement context-aware response selection
		console.log('Selecting response for context:', context.exercise, context.setNumber);
		const randomIndex = Math.floor(Math.random() * responses.length);
		return responses[randomIndex];
	}

	private createPersonalizedSummary(workoutData: { duration: number; exercises: number; totalSets: number }): CoachResponse {
		// TODO: Use workoutData for more detailed summaries
		console.log('Creating summary for workout:', workoutData.duration, 'minutes');
		if (!this.personality) {
			return {
				message: "Great workout! Keep it up!",
				tone: 'celebratory',
				priority: 'high',
				timing: 'workout_complete'
			};
		}

		let message = '';

		if (this.personality.id === 'alice') {
			message = `Wow! You crushed that workout! I'm so proud of your dedication and the progress you're making. Every session builds your strength and confidence. Keep shining! ✨`;
		} else {
			message = `Solid performance today. You maintained good form and pushed through the challenging sets. Consistency like this builds champions. Ready for the next session?`;
		}

		return {
			message,
			tone: 'celebratory',
			priority: 'high',
			timing: 'workout_complete',
			actions: ['Log workout', 'View progress', 'Schedule next session']
		};
	}
}

// Svelte stores for reactive state management
export const coachState = writable<CoachState>({
	selectedCoach: null,
	isActive: false,
	sessionStartTime: null,
	currentWorkout: null,
	userPreferences: {
		coachType: null,
		communicationStyle: 'balanced',
		feedbackFrequency: 'medium',
		adaptationSpeed: 'moderate',
		motivationalTriggers: [],
		challengeLevel: 'intermediate'
	},
	performanceMetrics: {
		avgHeartRate: 0,
		workoutConsistency: 0,
		goalProgress: 0,
		motivationLevel: 5
	}
});

export const selectedCoach = derived(coachState, $state => $state.selectedCoach);
export const isCoachActive = derived(coachState, $state => $state.isActive);
export const coachPersonality = derived(coachState, $state => {
	if (!$state.selectedCoach) return null;
	return COACH_PERSONALITIES[$state.selectedCoach];
});

// Singleton instance
export const aiCoachingService = new AICoachingService();

// Helper functions
export function getCoachPersonalities(): Record<'alice' | 'aiden', CoachPersonality> {
	return COACH_PERSONALITIES;
}

export function getCoachById(id: 'alice' | 'aiden'): CoachPersonality {
	return COACH_PERSONALITIES[id];
}

export function updateCoachState(updates: Partial<CoachState>): void {
	coachState.update(state => ({ ...state, ...updates }));
}

export function resetCoachState(): void {
	coachState.set({
		selectedCoach: null,
		isActive: false,
		sessionStartTime: null,
		currentWorkout: null,
		userPreferences: {
			coachType: null,
			communicationStyle: 'balanced',
			feedbackFrequency: 'medium',
			adaptationSpeed: 'moderate',
			motivationalTriggers: [],
			challengeLevel: 'intermediate'
		},
		performanceMetrics: {
			avgHeartRate: 0,
			workoutConsistency: 0,
			goalProgress: 0,
			motivationLevel: 5
		}
	});
}