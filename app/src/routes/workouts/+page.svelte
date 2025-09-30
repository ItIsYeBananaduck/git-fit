<script lang="ts">
	import WorkoutCard from '$lib/components/WorkoutCard.svelte';
	import MusicControls from '$lib/components/MusicControls.svelte';
	import AIWorkoutAdjustments from '$lib/components/AIWorkoutAdjustments.svelte';
	import { RealTimeWearableService, type RealTimeVitals } from '$lib/services/realTimeWearables';
	import { globalAIWarmer } from '$lib/services/aiServiceWarmer';
	import { WorkoutHistoryService } from '$lib/services/workoutHistoryService';
	import { api } from '$lib/convex/_generated/api';
	import { onMount, onDestroy } from 'svelte';
	import {
		mondayWorkoutService,
		needsMondayProcessing,
		logWorkoutForMonday,
		type MondayWorkoutData
	} from '$lib/stores/mondayWorkoutData';
	// Using available icons - let's check what exists
	// import { Activity, Clock, Target, Zap } from 'lucide-svelte';

	// Platform detection (basic)
	let platform: 'ios' | 'android' | 'web' = 'web';
	if (typeof window !== 'undefined') {
		const ua = window.navigator.userAgent.toLowerCase();
		if (/iphone|ipad|ipod/.test(ua)) platform = 'ios';
		else if (/android/.test(ua)) platform = 'android';
	}

	// Music state
	let playing = false;
	let trackName = 'Sample Track';
	let artistName = 'Sample Artist';
	let position = 0;
	let duration = 0;
	let volume = 1;
	let sessionId: string | null = null;

	// Monday data processing variables
	let showMondayNotification = false;
	let lastWeekSummary = '';

	// Workout completion tracking
	let currentWorkout: {
		exerciseId: string;
		reps: number;
		sets: number;
		volume: number;
		startTime: Date;
		currentSet: number;
		heartRate: number;
		spo2: number;
		restTimer: number;
		restActive: boolean;
		completedSets: number[];
		userFeedback?: MondayWorkoutData['userFeedback'];
	} | null = null;

	// Mock user ID (in real app, would come from auth)
	let userId = 'user_123';

	// Real-time wearable service
	let wearableService: RealTimeWearableService | null = null;
	let vitalsUnsubscribe: (() => void) | null = null;

	// Workout history service for AI learning
	let historyService: WorkoutHistoryService | null = null;

	// Rest timer interval
	let restInterval: NodeJS.Timeout | null = null;

	// Track AI adjustments for history
	let workoutAIAdjustments: {
		action: string;
		reason: string;
		modifications: Record<string, number>;
	}[] = [];
	let workoutStartTime: Date | null = null;
	let workoutRestTimes: number[] = [];

	// AI adjustment handlers
	// Complete current set and start rest timer
	function completeSet() {
		if (!currentWorkout) return;

		// Record completed set
		currentWorkout.completedSets.push(currentWorkout.currentSet);

		// Check if workout is complete
		if (currentWorkout.currentSet >= currentWorkout.sets) {
			completeWorkout(
				currentWorkout.exerciseId,
				currentWorkout.reps,
				currentWorkout.sets,
				currentWorkout.volume,
				currentWorkout.userFeedback
			);
			return;
		}

		// Start rest timer
		startRestTimer();
	}

	// Start rest timer between sets
	function startRestTimer() {
		if (!currentWorkout) return;

		const restStartTime = Date.now();
		currentWorkout.restTimer = 60; // 60 second rest
		currentWorkout.restActive = true;

		restInterval = setInterval(() => {
			if (currentWorkout && currentWorkout.restTimer > 0) {
				currentWorkout.restTimer--;
			} else {
				// Track rest time
				const actualRestTime = (Date.now() - restStartTime) / 1000;
				workoutRestTimes.push(actualRestTime);
				finishRest();
			}
		}, 1000);
	}

	// Finish rest and move to next set
	function finishRest() {
		if (!currentWorkout) return;

		if (restInterval) {
			clearInterval(restInterval);
			restInterval = null;
		}

		currentWorkout.restActive = false;
		currentWorkout.currentSet++;
		currentWorkout.restTimer = 0;
	}

	// Skip rest timer
	function skipRest() {
		if (restInterval) {
			clearInterval(restInterval);
			restInterval = null;
		}
		finishRest();
	}

	function handleAIAdjustment(event: any) {
		const { action, modifications, reason } = event.detail;
		console.log('AI Adjustment received:', { action, modifications, reason });

		// Track AI adjustment for workout history
		workoutAIAdjustments.push({ action, modifications: modifications || {}, reason });

		// Apply modifications to current workout
		if (currentWorkout && modifications) {
			if (modifications.sets) {
				currentWorkout.sets = Math.max(1, currentWorkout.sets + modifications.sets);
			}
			if (modifications.reps) {
				currentWorkout.reps = Math.max(1, currentWorkout.reps + modifications.reps);
			}
			if (modifications.weight) {
				currentWorkout.volume = Math.max(5, currentWorkout.volume + modifications.weight);
			}
		}
	}
	function handleApplyAdjustment(event: any) {
		const adjustment = event.detail;
		console.log('Applying AI adjustment:', adjustment);

		// Show confirmation to user
		alert(`AI Adjustment Applied: ${adjustment.action}\n${adjustment.reason}`);
	}

	async function saveMusicState(state: any) {
		if (!sessionId) return;
		// TODO: Implement actual API call when available
		console.log('Saving music state:', state);
	}

	function handleMusicState(event: any) {
		saveMusicState(event.detail);
	}

	// Handle workout completion with Monday data logging
	async function completeWorkout(
		exerciseId: string,
		completedReps: number,
		completedSets: number,
		weight: number,
		feedback?: MondayWorkoutData['userFeedback']
	) {
		if (!currentWorkout || !historyService) return;

		const workoutTime = Math.round((Date.now() - currentWorkout.startTime.getTime()) / 60000); // minutes

		// Collect heart rate data for history
		const heartRateData = {
			avg: currentWorkout.heartRate || 0,
			max: Math.max(currentWorkout.heartRate || 0, 0), // Would track max during workout
			min: Math.min(currentWorkout.heartRate || 999, 999) // Would track min during workout
		};

		// Record workout in history for AI learning
		await historyService.recordWorkout({
			exerciseId,
			exerciseName: exerciseId.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
			sets: completedSets,
			reps: completedReps,
			weight,
			duration: workoutTime,
			heartRate: heartRateData,
			spo2: {
				avg: currentWorkout.spo2 || 98,
				min: currentWorkout.spo2 || 98
			},
			userFeedback: feedback || null,
			aiAdjustments: workoutAIAdjustments,
			completedSets: currentWorkout.completedSets.length,
			restTimes: workoutRestTimes,
			wearableSource: wearableService?.getCurrentVitals()?.source || 'mock'
		});

		// Log for Monday processing
		logWorkoutForMonday(exerciseId, completedReps, completedSets, weight, workoutTime, feedback, {
			// Mock health data - in real app this would come from HealthKit/Health Connect
			heartRate: { avg: 145, max: 165, variance: 12 },
			spo2: { avgSpO2: 97, drift: 1.5 },
			sleepScore: 15 // 0-20 range
		});

		// Reset workout state
		currentWorkout = null;
		workoutAIAdjustments = [];
		workoutRestTimes = [];

		// Stop wearable monitoring
		if (wearableService) {
			wearableService.stopMonitoring();
		}

		// Show completion message
		alert(`Workout completed! Data logged for AI learning and Monday intensity analysis.`);
	}

	// Start a workout session
	function startWorkout(
		exerciseId: string,
		targetReps: number,
		targetSets: number,
		weight: number
	) {
		currentWorkout = {
			exerciseId,
			reps: targetReps,
			sets: targetSets,
			volume: weight,
			startTime: new Date(),
			currentSet: 1,
			heartRate: 0,
			spo2: 98,
			restTimer: 0,
			restActive: false,
			completedSets: []
		};

		// Start real-time wearable monitoring
		if (wearableService) {
			wearableService.startMonitoring();
		}
	}

	// Handle user feedback for intensity scoring
	function handleUserFeedback(feedback: MondayWorkoutData['userFeedback']) {
		if (currentWorkout) {
			currentWorkout.userFeedback = feedback;
		}
	}

	onMount(async () => {
		// Initialize workout history service
		historyService = new WorkoutHistoryService(userId);

		// Initialize real-time wearable service
		wearableService = new RealTimeWearableService(userId);

		// Subscribe to vitals updates
		vitalsUnsubscribe = wearableService.onVitalsUpdate((vitals: RealTimeVitals) => {
			if (currentWorkout) {
				currentWorkout.heartRate = vitals.heartRate;
				currentWorkout.spo2 = vitals.spo2;
			}
		});

		// Warm up AI service for faster responses during workouts
		if (!globalAIWarmer.isCurrentlyWarming()) {
			globalAIWarmer.startWarming();
		}

		// Check if Monday processing is needed
		if ($needsMondayProcessing) {
			showMondayNotification = true;
			lastWeekSummary = 'Last week you averaged 75% intensity. Ready for new challenges!';
		}
	});

	onDestroy(() => {
		// Clean up wearable service
		if (wearableService) {
			wearableService.stopMonitoring();
		}
		if (vitalsUnsubscribe) {
			vitalsUnsubscribe();
		}
		if (restInterval) {
			clearInterval(restInterval);
		}
	});

	function onPlayPause() {
		playing = !playing;
	}
	function onSkip() {
		/* TODO: Integrate with plugin */
	}
	function onVolumeUp() {
		/* TODO: Integrate with plugin */
	}
	function onVolumeDown() {
		/* TODO: Integrate with plugin */
	}
</script>

<svelte:head>
	<title>Workouts - Adaptive fIt</title>
</svelte:head>

<!-- Monday Processing Notification -->
{#if showMondayNotification}
	<div class="alert alert-info mb-4">
		<div class="icon-sm">📊</div>
		<div>
			<h4>Weekly Intensity Analysis Ready</h4>
			<p>{lastWeekSummary}</p>
			<button class="btn btn-sm btn-primary" on:click={() => (showMondayNotification = false)}>
				View Analysis
			</button>
		</div>
	</div>
{/if}

<div class="container py-4">
	<h1 class="text-2xl font-bold mb-6">Workouts</h1>

	<!-- Current Workout Status -->
	{#if currentWorkout}
		<div class="card mb-6">
			<div class="card-body">
				<h3 class="card-title">Active Workout</h3>
				<div class="flex items-center gap-4 mb-4">
					<div class="flex items-center gap-2">
						<div class="icon-sm text-primary">🎯</div>
						<span class="text-sm"
							>Set {currentWorkout.currentSet}/{currentWorkout.sets} × {currentWorkout.reps} reps</span
						>
					</div>
					<div class="flex items-center gap-2">
						<div class="icon-sm text-success">💪</div>
						<span class="text-sm">{currentWorkout.volume} lbs</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="icon-sm text-warning">⏱️</div>
						<span class="text-sm">
							{Math.round((Date.now() - currentWorkout.startTime.getTime()) / 60000)} min
						</span>
					</div>
					{#if currentWorkout.completedSets.length > 0}
						<div class="flex items-center gap-2">
							<div class="icon-sm text-info">✅</div>
							<span class="text-sm">{currentWorkout.completedSets.length} completed</span>
						</div>
					{/if}
				</div>

				<!-- Rest Timer Display -->
				{#if currentWorkout.restActive}
					<div class="bg-blue-50 p-4 rounded-lg mb-4 text-center">
						<h4 class="text-lg font-semibold text-blue-800 mb-2">Rest Timer</h4>
						<div class="text-3xl font-bold text-blue-600 mb-2">
							{Math.floor(currentWorkout.restTimer / 60)}:{(currentWorkout.restTimer % 60)
								.toString()
								.padStart(2, '0')}
						</div>
						<div class="flex gap-2 justify-center">
							<button class="btn btn-sm btn-primary" on:click={skipRest}> Skip Rest </button>
							<button class="btn btn-sm btn-ghost" disabled>
								Next: Set {currentWorkout.currentSet + 1}
							</button>
						</div>
					</div>
				{:else}
					<!-- AI Workout Adjustments Component -->
					<AIWorkoutAdjustments
						{userId}
						currentExercise={currentWorkout.exerciseId}
						currentSet={currentWorkout.currentSet}
						currentWeight={currentWorkout.volume}
						currentReps={currentWorkout.reps}
						heartRate={currentWorkout.heartRate}
						spo2={currentWorkout.spo2}
						on:aiAdjustment={handleAIAdjustment}
						on:applyAdjustment={handleApplyAdjustment}
					/>
				{/if}

				<!-- Action Buttons -->
				<div class="flex gap-2 mb-4">
					{#if !currentWorkout.restActive}
						<button class="btn btn-success" on:click={completeSet}>
							Complete Set {currentWorkout.currentSet}
						</button>
					{/if}

					<!-- User Feedback Buttons -->
					<button class="btn btn-sm btn-success" on:click={() => handleUserFeedback('easy killer')}>
						Easy Killer
					</button>
					<button class="btn btn-sm btn-warning" on:click={() => handleUserFeedback('good pump')}>
						Good Pump
					</button>
					<button class="btn btn-sm btn-error" on:click={() => handleUserFeedback('struggle city')}>
						Struggle City
					</button>
				</div>

				<button
					class="btn btn-error btn-outline"
					on:click={() =>
						completeWorkout(
							currentWorkout!.exerciseId,
							currentWorkout!.reps,
							currentWorkout!.sets,
							currentWorkout!.volume,
							currentWorkout!.userFeedback
						)}
				>
					End Workout Early
				</button>
			</div>
		</div>
	{/if}

	<!-- Workout Cards Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
		<!-- Mock workout cards -->
		<div class="card">
			<div class="card-body">
				<h3 class="card-title">Push Day</h3>
				<p class="text-sm">Bench, Shoulder Press, Triceps</p>
				<p class="text-sm">45 min • Intermediate</p>
				<button class="btn btn-primary mt-4" on:click={() => startWorkout('push-day', 8, 3, 100)}>
					Start Workout
				</button>
			</div>
		</div>

		<div class="card">
			<div class="card-body">
				<h3 class="card-title">Pull Day</h3>
				<p class="text-sm">Deadlifts, Rows, Bicep Curls</p>
				<p class="text-sm">50 min • Advanced</p>
				<button class="btn btn-primary mt-4" on:click={() => startWorkout('pull-day', 5, 5, 135)}>
					Start Workout
				</button>
			</div>
		</div>

		<div class="card">
			<div class="card-body">
				<h3 class="card-title">Leg Day</h3>
				<p class="text-sm">Squats, Lunges, Calf Raises</p>
				<p class="text-sm">60 min • Intermediate</p>
				<button class="btn btn-primary mt-4" on:click={() => startWorkout('leg-day', 10, 4, 185)}>
					Start Workout
				</button>
			</div>
		</div>
	</div>

	<!-- Music Controls -->
	<div class="card">
		<div class="card-body">
			<h3 class="card-title mb-4">Music Controls</h3>
			<MusicControls
				{playing}
				{trackName}
				{artistName}
				{position}
				{duration}
				{volume}
				{onPlayPause}
				{onSkip}
				{onVolumeUp}
				{onVolumeDown}
				on:musicStateChange={handleMusicState}
			/>
		</div>
	</div>
</div>
