<script lang="ts">
	import WorkoutCard from '$lib/components/WorkoutCard.svelte';
	import MusicControls from '$lib/components/MusicControls.svelte';
	import { api } from '$lib/convex/_generated/api';
	import { onMount } from 'svelte';
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
		userFeedback?: MondayWorkoutData['userFeedback'];
	} | null = null;

	async function saveMusicState(state: any) {
		if (!sessionId) return;
		// TODO: Implement actual API call when available
		console.log('Saving music state:', state);
	}

	function handleMusicState(event: any) {
		saveMusicState(event.detail);
	}

	// Handle workout completion with Monday data logging
	function completeWorkout(
		exerciseId: string,
		completedReps: number,
		completedSets: number,
		weight: number,
		feedback?: MondayWorkoutData['userFeedback']
	) {
		if (!currentWorkout) return;

		const workoutTime = Math.round((Date.now() - currentWorkout.startTime.getTime()) / 60000); // minutes

		// Log for Monday processing
		logWorkoutForMonday(exerciseId, completedReps, completedSets, weight, workoutTime, feedback, {
			// Mock health data - in real app this would come from HealthKit/Health Connect
			heartRate: { avg: 145, max: 165, variance: 12 },
			spo2: { avgSpO2: 97, drift: 1.5 },
			sleepScore: 15 // 0-20 range
		});

		// Reset current workout
		currentWorkout = null;

		// Show completion message
		alert(`Workout completed! Data logged for Monday intensity analysis.`);
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
			startTime: new Date()
		};
	}

	// Handle user feedback for intensity scoring
	function handleUserFeedback(feedback: MondayWorkoutData['userFeedback']) {
		if (currentWorkout) {
			currentWorkout.userFeedback = feedback;
		}
	}

	onMount(async () => {
		// Check if Monday processing is needed
		if ($needsMondayProcessing) {
			showMondayNotification = true;
			lastWeekSummary = 'Last week you averaged 75% intensity. Ready for new challenges!';
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
						<span class="text-sm">{currentWorkout.sets} sets × {currentWorkout.reps} reps</span>
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
				</div>

				<!-- User Feedback Buttons -->
				<div class="flex gap-2 mb-4">
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
					class="btn btn-primary"
					on:click={() =>
						completeWorkout(
							currentWorkout!.exerciseId,
							currentWorkout!.reps,
							currentWorkout!.sets,
							currentWorkout!.volume,
							currentWorkout!.userFeedback
						)}
				>
					Complete Workout
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
