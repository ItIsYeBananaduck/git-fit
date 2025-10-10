/**
 * Alice Global State Store
 * Manages Alice AI companion state across all pages
 */

import { writable, derived } from 'svelte/store';
import { page } from '$app/stores';
import type { 
	AliceAIState, 
	AliceMorphShape, 
	AliceInteractionMode, 
	AliceVisibilityState,
	AliceConfig,
	AliceEvents,
	StrainMorphContext,
	EnhancedStrainMorphContext,
	RealTimeMetrics
} from '$types/alice.js';

// Default Alice configuration
const defaultAliceConfig: AliceConfig = {
	primaryColor: '#00bfff',
	accentColor: '#ffffff',
	size: 'medium',
	voiceEnabled: true,
	coachingFrequency: 'medium',
	hapticsEnabled: true,
	autoHide: false,
	syncInterval: 2000,
	offlineMode: false
};

// Default Alice AI state
const defaultAliceState: AliceAIState = {
	// Visual state
	currentShape: 'neutral',
	morphProgress: 0,
	isAnimating: false,
	
	// Interaction state
	interactionMode: 'idle',
	visibilityState: 'visible',
	isInteractive: false,
	
	// Voice coaching state
	isVoiceEnabled: true,
	isSpeaking: false,
	currentMessage: undefined,
	
	// Data sync state
	lastSyncTimestamp: Date.now(),
	isOnline: true,
	
	// Page context
	currentPage: '/',
	shouldShowOnPage: true
};

// Alice AI state store
export const aliceStore = writable<AliceAIState>(defaultAliceState);

// Alice configuration store
export const aliceConfig = writable<AliceConfig>(defaultAliceConfig);

// Interactive pages where Alice becomes interactive
const INTERACTIVE_PAGES = [
	'/', // Dashboard - navigation
	'/workouts', // Workouts - workout tracking
	'/nutrition', // Nutrition - meal logging
	'/orb-demo', // Demo page
	'/preferences' // Settings
];

// Derived store for interaction state based on current page
export const aliceInteractionMode = derived(
	[page],
	([$page]) => {
		const currentPath = $page.url?.pathname || '/';
		const isInteractive = INTERACTIVE_PAGES.includes(currentPath);
		
		return {
			isInteractive,
			currentPath,
			shouldShowSwipeHints: currentPath === '/',
			shouldTrackWorkout: currentPath === '/workouts',
			shouldTrackNutrition: currentPath === '/nutrition'
		};
	}
);

// Strain-based morphing logic
export const aliceMorphLogic = derived(
	aliceStore,
	($alice) => {
		// Determine morph shape based on strain context
		const determineShape = (strain: number): AliceMorphShape => {
			if (strain < 30) return 'neutral';
			if (strain < 70) return 'rhythmic';
			return 'intense';
		};

		return {
			targetShape: determineShape(0), // Will be updated with real strain data
			shouldMorph: !$alice.isAnimating,
			morphProgress: $alice.morphProgress
		};
	}
);

// Alice actions with updated types
export const aliceActions = {
	// Visual state management
	setShape: (shape: AliceMorphShape) => {
		aliceStore.update(state => ({ ...state, currentShape: shape }));
	},
	
	startMorphing: (targetShape: AliceMorphShape) => {
		aliceStore.update(state => ({
			...state,
			currentShape: targetShape,
			isAnimating: true,
			morphProgress: 0
		}));
	},
	
	updateMorphProgress: (progress: number) => {
		aliceStore.update(state => ({ ...state, morphProgress: progress }));
	},
	
	completeMorph: () => {
		aliceStore.update(state => ({
			...state,
			isAnimating: false,
			morphProgress: 1
		}));
	},
	
	// Interaction mode management
	setInteractionMode: (mode: AliceInteractionMode) => {
		aliceStore.update(state => ({ ...state, interactionMode: mode }));
	},
	
	setVisibilityState: (visibility: AliceVisibilityState) => {
		aliceStore.update(state => ({ ...state, visibilityState: visibility }));
	},
	
	setInteractive: (isInteractive: boolean) => {
		aliceStore.update(state => ({ ...state, isInteractive }));
	},
	
	// Voice coaching management
	enableVoice: (enabled: boolean) => {
		aliceStore.update(state => ({ ...state, isVoiceEnabled: enabled }));
	},
	
	startSpeaking: (message: string) => {
		aliceStore.update(state => ({
			...state,
			isSpeaking: true,
			currentMessage: message,
			interactionMode: 'speaking'
		}));
	},
	
	stopSpeaking: () => {
		aliceStore.update(state => ({
			...state,
			isSpeaking: false,
			currentMessage: undefined,
			interactionMode: 'idle'
		}));
	},
	
	// Data sync management
	updateSyncTimestamp: () => {
		aliceStore.update(state => ({
			...state,
			lastSyncTimestamp: Date.now()
		}));
	},
	
	setOnlineStatus: (isOnline: boolean) => {
		aliceStore.update(state => ({ ...state, isOnline }));
	},
	
	// Page context management
	updatePage: (currentPage: string) => {
		const shouldShow = INTERACTIVE_PAGES.includes(currentPage) || currentPage === '/';
		aliceStore.update(state => ({
			...state,
			currentPage,
			shouldShowOnPage: shouldShow,
			isInteractive: INTERACTIVE_PAGES.includes(currentPage)
		}));
	},
	
	// Utility actions
	show: () => {
		aliceActions.setVisibilityState('visible');
	},
	
	hide: () => {
		aliceActions.setVisibilityState('hidden');
	},
	
	minimize: () => {
		aliceActions.setVisibilityState('minimized');
	},
	
	reset: () => {
		aliceStore.set(defaultAliceState);
	},

	// Advanced Alice AI actions
	updateAIState: (state: Partial<AliceAIState>) => {
		aliceStore.update(current => ({
			...current,
			...state,
			lastSyncTimestamp: Date.now()
		}));
	},

	triggerMorphing: (context: StrainMorphContext) => {
		const determineShapeFromStrain = (strain: number): AliceMorphShape => {
			if (strain < 30) return 'neutral';
			if (strain < 70) return 'rhythmic';
			return 'intense';
		};

		const targetShape = determineShapeFromStrain(context.currentStrain);
		aliceStore.update(current => ({
			...current,
			isAnimating: true,
			currentShape: targetShape,
			morphProgress: 0
		}));
		
		// Start morphing animation
		aliceActions.startMorphing(targetShape);
	},

	updateMetrics: (metrics: RealTimeMetrics) => {
		aliceStore.update(current => ({
			...current,
			lastSyncTimestamp: Date.now()
		}));
	},

	updateHealthInsights: (insights: string[]) => {
		aliceStore.update(current => ({
			...current,
			currentMessage: insights.length > 0 ? insights[0] : undefined,
			lastSyncTimestamp: Date.now()
		}));
	}
};

// Alice event handlers for global use
export const aliceEventHandlers: AliceEvents = {
	onShapeChange: (newShape: AliceMorphShape) => {
		console.log('Alice shape changed to:', newShape);
		aliceActions.setShape(newShape);
	},
	
	onInteractionModeChange: (newMode: AliceInteractionMode) => {
		console.log('Alice interaction mode changed to:', newMode);
		aliceActions.setInteractionMode(newMode);
	},
	
	onVoiceCoachingTrigger: (context: StrainMorphContext) => {
		console.log('Alice voice coaching triggered:', context);
		// Handle voice coaching based on strain context
		if (context.strainDelta > 15) {
			// Significant strain change - trigger voice coaching
			const message = context.currentStrain > context.previousStrain 
				? "Great intensity! Keep pushing!" 
				: "Nice recovery, maintain that rhythm.";
			aliceActions.startSpeaking(message);
		}
	},
	
	onVisibilityChange: (newState: AliceVisibilityState) => {
		console.log('Alice visibility changed to:', newState);
		aliceActions.setVisibilityState(newState);
	}
};

// Configuration actions
export const aliceConfigActions = {
	updateColor: (primaryColor: string, accentColor?: string) => {
		aliceConfig.update(config => ({
			...config,
			primaryColor,
			accentColor: accentColor || config.accentColor
		}));
	},
	
	updateVoiceSettings: (voiceEnabled: boolean, coachingFrequency: AliceConfig['coachingFrequency']) => {
		aliceConfig.update(config => ({
			...config,
			voiceEnabled,
			coachingFrequency
		}));
	},
	
	updateSyncSettings: (syncInterval: number, offlineMode: boolean) => {
		aliceConfig.update(config => ({
			...config,
			syncInterval,
			offlineMode
		}));
	}
};