/**
 * Alice Navigation Store - Alice IS the app, ALL navigation flows through her
 * 
 * This store handles ALL app navigation and state with Alice as the central hub.
 * No standalone navigation - Alice manages everything through her personality system.
 */

import { writable } from 'svelte/store';
import type { WorkoutSessionData } from '../models/WorkoutSession.js';
import type { MondayWorkoutData } from './mondayWorkoutData.js';

// Alice-specific simplified interfaces for UI display
export interface AliceWorkoutSet {
	reps: number | null;
	weight: string | null;
	weightNum?: number;
	duration: string | null;
	completed: boolean;
	skipped: boolean;
}

export interface AliceExercise {
	name: string;
	notes?: string;
	sets: AliceWorkoutSet[];
}

// Alice-specific workout data interface (lightweight version for UI)
export interface AliceWorkoutData {
	name: string;
	duration: string;
	calories: string;
	intensityScore?: number;
	stressScore?: number;
	exercises?: AliceExercise[];
	userFeedback?: MondayWorkoutData['userFeedback'];
	userFeedbackMessage?: string;
	completedAt?: string;
}

// Alice-centric navigation and workout state - Alice IS the app
interface AliceNavigationState {
	isActive: boolean;
	showCard: boolean;
	currentWorkout: AliceWorkoutData | null;
	currentSession: WorkoutSessionData | null;
	mode: 'idle' | 'workout' | 'nutrition' | 'analytics' | 'radio';
	
	// Alice's emotional and physical state
	aliceMode: 'idle' | 'workout' | 'nutrition' | 'analytics' | 'radio';
	aliceIntensity: number;
	aliceHeartRate: number;
	aliceEngagement: 'focused' | 'encouraging' | 'challenging' | 'celebratory';
	
	// Navigation state - Alice manages ALL app navigation
	currentNavMode: 'home' | 'workouts' | 'nutrition' | 'progress' | 'programs' | 'settings' | 'meditation' | 'profile' | 'recommendations' | 'marketplace';
	previousNavMode: 'home' | 'workouts' | 'nutrition' | 'progress' | 'programs' | 'settings' | 'meditation' | 'profile' | 'recommendations' | 'marketplace';
	isNavigating: boolean;
	navigationTarget: string | null;
	showNavigation: boolean;
}

// Initial state - Alice starts ready and focused
const initialState: AliceNavigationState = {
	isActive: false,
	showCard: false,
	currentWorkout: null,
	currentSession: null,
	mode: 'idle',
	// Navigation state
	currentNavMode: 'home',
	previousNavMode: 'home',
	isNavigating: false,
	navigationTarget: null,
	showNavigation: false,
	// Alice's initial state
	aliceMode: 'idle',
	aliceIntensity: 0,
	aliceHeartRate: 70, // Resting heart rate
	aliceEngagement: 'focused'
};

// Alice's workout store - she is the single source of truth
export const aliceNavigationStore = writable<AliceNavigationState>(initialState);

// Alice's workout actions - she manages everything
export const workoutActions = {
	/**
	 * Alice starts a workout - everything flows through her
	 */
	startWorkout: (workoutData: AliceWorkoutData) => {
		console.log('[ALICE] Taking control of workout:', workoutData.name);
		
		aliceNavigationStore.update(state => {
			const newState = {
				...state,
				isActive: true,
				showCard: true,
				currentWorkout: workoutData,
				mode: 'workout' as const,
				// Alice becomes highly engaged
				aliceMode: 'workout' as const,
				aliceIntensity: workoutData.intensityScore || 75,
				aliceHeartRate: 80 + (workoutData.intensityScore || 0) * 0.8,
				aliceEngagement: 'encouraging' as const
			};
			
			console.log('[ALICE] Fully engaged for workout:', newState);
			return newState;
		});

		// Alice communicates workout start to the layout
		const event = new CustomEvent('workout-started', {
			detail: {
				showWorkoutCard: true,
				workoutData: workoutData,
				mode: 'workout',
				aliceIntensity: workoutData.intensityScore || 75,
				aliceEngagement: 'encouraging'
			}
		});
		window.dispatchEvent(event);
	},

	/**
	 * Alice starts a new empty workout
	 */
	startNewWorkout: () => {
		const defaultWorkout: AliceWorkoutData = {
			name: 'New Workout',
			duration: '0:00',
			calories: '0',
			intensityScore: 0,
			stressScore: 0,
			exercises: []
		};

		console.log('[ALICE] Starting fresh workout session');
		workoutActions.startWorkout(defaultWorkout);
	},

	/**
	 * Alice ends a workout with celebration
	 */
	endWorkout: () => {
		console.log('[ALICE] Completing workout with celebration');
		
		aliceNavigationStore.update(state => ({
			...state,
			isActive: false,
			showCard: false,
			currentWorkout: null,
			mode: 'idle',
			// Alice celebrates completion
			aliceMode: 'idle',
			aliceIntensity: 0,
			aliceHeartRate: 70,
			aliceEngagement: 'celebratory'
		}));

		// Alice communicates completion
		const event = new CustomEvent('workout-ended', {
			detail: {
				showWorkoutCard: false,
				workoutData: null,
				mode: 'idle',
				aliceEngagement: 'celebratory'
			}
		});
		window.dispatchEvent(event);

		// Alice returns to focused state after celebration
		setTimeout(() => {
			aliceNavigationStore.update(state => ({
				...state,
				aliceEngagement: 'focused'
			}));
		}, 3000);
	},

	/**
	 * Alice updates workout progress
	 */
	updateWorkout: (workoutData: Partial<AliceWorkoutData>) => {
		console.log('[ALICE] Updating workout progress:', workoutData);
		
		aliceNavigationStore.update(state => {
			const updatedWorkout = { ...state.currentWorkout, ...workoutData };
			const newIntensity = updatedWorkout.intensityScore || state.aliceIntensity;
			
			// Alice adapts her engagement based on intensity
			const newEngagement = 
				newIntensity > 90 ? 'challenging' :
				newIntensity > 60 ? 'encouraging' : 'focused';
			
			return {
				...state,
				currentWorkout: updatedWorkout as AliceWorkoutData,
				aliceIntensity: newIntensity,
				aliceHeartRate: 80 + newIntensity * 0.8,
				aliceEngagement: newEngagement
			};
		});

		// Alice communicates updates
		const event = new CustomEvent('workout-updated', {
			detail: { workoutData }
		});
		window.dispatchEvent(event);
	},

	/**
	 * Alice controls her workout card visibility
	 */
	toggleCard: () => {
		console.log('[ALICE] Toggling workout card visibility');
		aliceNavigationStore.update(state => ({
			...state,
			showCard: !state.showCard
		}));
	},

	/**
	 * Alice creates sample workouts for demonstration
	 */
	createPushWorkout: (): AliceWorkoutData => ({
		name: "Push Day",
		duration: "45 min",
		calories: "350",
		intensityScore: 85,
		stressScore: 70,
		exercises: [
			{
				name: "Bench Press",
				sets: [
					{ reps: 8, weight: "135 lbs", weightNum: 135, duration: null, completed: false, skipped: false },
					{ reps: 8, weight: "135 lbs", weightNum: 135, duration: null, completed: false, skipped: false },
					{ reps: 6, weight: "155 lbs", weightNum: 155, duration: null, completed: false, skipped: false }
				]
			},
			{
				name: "Shoulder Press",
				sets: [
					{ reps: 10, weight: "65 lbs", weightNum: 65, duration: null, completed: false, skipped: false },
					{ reps: 8, weight: "75 lbs", weightNum: 75, duration: null, completed: false, skipped: false }
				]
			},
			{
				name: "Push-ups",
				sets: [
					{ reps: 15, weight: null, weightNum: 0, duration: null, completed: false, skipped: false },
					{ reps: 12, weight: null, weightNum: 0, duration: null, completed: false, skipped: false }
				]
			}
		]
	}),

	createPullWorkout: (): AliceWorkoutData => ({
		name: "Pull Day", 
		duration: "50 min",
		calories: "380",
		intensityScore: 90,
		stressScore: 75,
		exercises: [
			{
				name: "Deadlifts",
				sets: [
					{ reps: 5, weight: "225 lbs", weightNum: 225, duration: null, completed: false, skipped: false },
					{ reps: 5, weight: "245 lbs", weightNum: 245, duration: null, completed: false, skipped: false }
				]
			},
			{
				name: "Pull-ups", 
				sets: [
					{ reps: 8, weight: null, weightNum: 0, duration: null, completed: false, skipped: false },
					{ reps: 6, weight: null, weightNum: 0, duration: null, completed: false, skipped: false }
				]
			}
		]
	}),

	createCardioWorkout: (): AliceWorkoutData => ({
		name: "HIIT Cardio",
		duration: "30 min", 
		calories: "400",
		intensityScore: 95,
		stressScore: 60,
		exercises: [
			{
				name: "Sprint Intervals",
				sets: [
					{ reps: null, weight: null, weightNum: 0, duration: "30s", completed: false, skipped: false },
					{ reps: null, weight: null, weightNum: 0, duration: "30s", completed: false, skipped: false }
				]
			}
		]
	})
};

// Export the store as the primary workout store (keeping backward compatibility)
export const workoutStore = aliceNavigationStore;

// Helper functions to create sample workout data
export const sampleWorkouts = {
	createPushWorkout: (): AliceWorkoutData => ({
		name: 'Push Day Workout',
		duration: '45:00',
		calories: '320',
		intensityScore: 75,
		stressScore: 60,
		exercises: [
			{
				name: 'Bench Press',
				notes: 'Focus on controlled movement',
				sets: [
					{ reps: 12, weight: '135 lbs', weightNum: 135, duration: null, completed: false, skipped: false },
					{ reps: 10, weight: '155 lbs', weightNum: 155, duration: null, completed: false, skipped: false },
					{ reps: 8, weight: '175 lbs', weightNum: 175, duration: null, completed: false, skipped: false }
				]
			},
			{
				name: 'Overhead Press',
				notes: 'Keep core tight',
				sets: [
					{ reps: 12, weight: '95 lbs', weightNum: 95, duration: null, completed: false, skipped: false },
					{ reps: 10, weight: '105 lbs', weightNum: 105, duration: null, completed: false, skipped: false },
					{ reps: 8, weight: '115 lbs', weightNum: 115, duration: null, completed: false, skipped: false }
				]
			},
			{
				name: 'Push-ups',
				notes: 'Bodyweight exercise',
				sets: [
					{ reps: 15, weight: null, weightNum: 0, duration: null, completed: false, skipped: false },
					{ reps: 12, weight: null, weightNum: 0, duration: null, completed: false, skipped: false },
					{ reps: 10, weight: null, weightNum: 0, duration: null, completed: false, skipped: false }
				]
			}
		]
	}),

	createPullWorkout: (): AliceWorkoutData => ({
		name: 'Pull Day Workout',
		duration: '50:00',
		calories: '280',
		intensityScore: 70,
		stressScore: 55,
		exercises: [
			{
				name: 'Pull-ups',
				notes: 'Full range of motion',
				sets: [
					{ reps: 8, weight: null, weightNum: 0, duration: null, completed: false, skipped: false },
					{ reps: 6, weight: null, weightNum: 0, duration: null, completed: false, skipped: false },
					{ reps: 4, weight: null, weightNum: 0, duration: null, completed: false, skipped: false }
				]
			},
			{
				name: 'Barbell Rows',
				notes: 'Pull to chest',
				sets: [
					{ reps: 12, weight: '125 lbs', weightNum: 125, duration: null, completed: false, skipped: false },
					{ reps: 10, weight: '135 lbs', weightNum: 135, duration: null, completed: false, skipped: false },
					{ reps: 8, weight: '145 lbs', weightNum: 145, duration: null, completed: false, skipped: false }
				]
			}
		]
	}),

	createCardioWorkout: (): AliceWorkoutData => ({
		name: 'HIIT Cardio',
		duration: '30:00',
		calories: '400',
		intensityScore: 85,
		stressScore: 70,
		exercises: [
			{
				name: 'Sprint Intervals',
				notes: '30 seconds on, 30 seconds rest',
				sets: [
					{ reps: null, weight: null, duration: '30:00', completed: false, skipped: false }
				]
			}
		]
	})
};

// Alice Navigation Actions - Central hub for ALL app navigation
export const aliceNavigationActions = {
	/**
	 * Alice navigates to any section of the app
	 */
	navigateTo: (target: 'home' | 'workouts' | 'nutrition' | 'progress' | 'programs' | 'settings' | 'meditation' | 'profile' | 'recommendations' | 'marketplace', data?: AliceWorkoutData) => {
		console.log(`[ALICE] Navigating to: ${target}`, data);
		
		aliceNavigationStore.update(state => {
			// Alice adapts personality based on destination
			const aliceEngagement: 'focused' | 'encouraging' | 'challenging' | 'celebratory' = 
				target === 'workouts' ? 'encouraging' :
				target === 'nutrition' ? 'focused' :
				target === 'progress' ? 'celebratory' : 'focused';
				
			const aliceIntensity = 
				target === 'workouts' ? 80 :
				target === 'progress' ? 90 : 40;
			
			const newState: AliceNavigationState = {
				...state,
				previousNavMode: state.currentNavMode,
				currentNavMode: target,
				isNavigating: true,
				navigationTarget: `/${target === 'home' ? '' : target}`,
				aliceEngagement,
				aliceIntensity
			};
			
			// Special handling for workout mode
			if (target === 'workouts' && data) {
				newState.mode = 'workout';
				newState.aliceMode = 'workout';
				newState.currentWorkout = data;
				newState.showCard = true;
				newState.isActive = true;
			}
			
			return newState;
		});

		// Dispatch navigation event for components to catch
		const event = new CustomEvent('alice-navigation', {
			detail: {
				target,
				data,
				route: `/${target === 'home' ? '' : target}`,
				aliceMode: target === 'workouts' ? 'workout' : target,
				shouldNavigate: true
			}
		});
		window.dispatchEvent(event);

		// Mark navigation complete after a brief delay
		setTimeout(() => {
			aliceNavigationStore.update(state => ({
				...state,
				isNavigating: false,
				navigationTarget: null
			}));
		}, 100);
	},

	/**
	 * Alice shows navigation options
	 */
	showNavigation: () => {
		console.log('[ALICE] Showing navigation');
		aliceNavigationStore.update(state => ({
			...state,
			showNavigation: true,
			aliceEngagement: 'focused'
		}));
	},

	/**
	 * Alice hides navigation options
	 */
	hideNavigation: () => {
		console.log('[ALICE] Hiding navigation');
		aliceNavigationStore.update(state => ({
			...state,
			showNavigation: false
		}));
	},

	/**
	 * Alice quick actions for common navigation
	 */
	quickActions: {
		startWorkout: (workoutData?: AliceWorkoutData) => {
			console.log('[ALICE] Quick start workout');
			if (workoutData) {
				aliceNavigationActions.navigateTo('workouts', workoutData);
			} else {
				aliceNavigationActions.navigateTo('workouts');
			}
		},
		
		logMeal: () => {
			console.log('[ALICE] Quick log meal');
			aliceNavigationActions.navigateTo('nutrition');
		},
		
		viewProgress: () => {
			console.log('[ALICE] Quick view progress');
			aliceNavigationActions.navigateTo('progress');
		},
		
		findPrograms: () => {
			console.log('[ALICE] Quick find programs');
			aliceNavigationActions.navigateTo('programs');
		},
		
		openSettings: () => {
			console.log('[ALICE] Quick open settings');
			aliceNavigationActions.navigateTo('settings');
		},
		
		viewRecommendations: () => {
			console.log('[ALICE] Quick view recommendations');
			aliceNavigationActions.navigateTo('recommendations');
		},
		
		visitMarketplace: () => {
			console.log('[ALICE] Quick visit marketplace');
			aliceNavigationActions.navigateTo('marketplace');
		},
		
		goHome: () => {
			console.log('[ALICE] Quick go home');
			aliceNavigationActions.navigateTo('home');
		}
	}
};
