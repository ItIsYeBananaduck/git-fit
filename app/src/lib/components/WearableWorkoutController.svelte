<script>
	import { createEventDispatcher } from 'svelte';
	import WearablePreSet from './WearablePreSet.svelte';
	import WearableInSet from './WearableInSet.svelte';
	import WearableFeedbackButtons from './WearableFeedbackButtons.svelte';
	import WearablePostSet from './WearablePostSet.svelte';
	import StrainMonitor from './StrainMonitor.svelte';
	import { DailyStrainAssessmentService } from '../services/dailyStrainAssessmentService';
	// Example: Replace with real baseline and readiness data from user profile or API
	const baselineHR = 60;
	const baselineSpO2 = 97;
	let readiness = 70; // e.g. recovery score, 0-100
	let hrv = 50; // placeholder
	let yesterdayStrain = 12; // placeholder

	const strainService = new DailyStrainAssessmentService();
	let currentStrain = 0;
	let targetStrain = Math.round(8 + readiness / 10 + hrv / 20 + yesterdayStrain / 2);
	let lastFeedback = 0;

	function updateStrainAfterSet(setData, feedback) {
		// Intensity: simple proxy (can be improved)
		const intensityScore = (setData.reps * (setData.avgHeartRate - baselineHR)) / 10;
		// Fatigue: can use rolling average of HRV or session RPE
		const fatigueTrend = 0; // placeholder
		// Feedback: map 'easy'= -2, 'moderate'=0, 'hard'=+2
		let feedbackModifier = 0;
		if (feedback === 'easy') feedbackModifier = -2;
		else if (feedback === 'hard') feedbackModifier = 2;
		lastFeedback = feedbackModifier;
		currentStrain += strainService.calculateCompositeStrain(
			baselineHR,
			baselineSpO2,
			setData.avgHeartRate,
			liveMetrics.spo2,
			intensityScore,
			fatigueTrend,
			feedbackModifier
		);
	}

	export let workout = {
		exercise: '',
		targetReps: 10,
		targetWeight: 0,
		totalSets: 3
	};

	// Live metrics (would come from wearable sensors)
	export let liveMetrics = {
		heartRate: 0,
		spo2: 0,
		strainLevel: 'moderate'
	};

	const dispatch = createEventDispatcher();

	// Workout state
	let currentScreen = 'pre-set'; // 'pre-set', 'in-set', 'feedback', 'post-set'
	let currentSet = 1;
	let currentRep = 0;
	let elapsedTime = 0;
	let setStartTime = 0;
	let workoutStartTime = Date.now();

	// Set completion data
	let completedSets = [];
	let currentSetData = {
		reps: 0,
		duration: 0,
		avgHeartRate: 0,
		strainLevel: 'moderate'
	};

	function handleStartWorkout(event) {
		const { exercise, targetReps, targetWeight, totalSets } = event.detail;
		workout = { exercise, targetReps, targetWeight, totalSets };
		currentScreen = 'in-set';
		setStartTime = Date.now();
		currentRep = 0;
		elapsedTime = 0;
	}

	function handleCompleteSet(event) {
		const { reps, duration, heartRate, spo2 } = event.detail;

		// Record set data
		currentSetData = {
			reps,
			duration,
			avgHeartRate: heartRate,
			strainLevel: liveMetrics.strainLevel
		};

		completedSets = [...completedSets, currentSetData];

		// Move to feedback screen
		currentScreen = 'feedback';
	}

	function handleFeedback(event) {
		const { difficulty } = event.detail;

		// Update strain with feedback
		updateStrainAfterSet(currentSetData, difficulty);
		// Send feedback to adaptive training engine
		dispatch('setFeedback', {
			setNumber: currentSet,
			difficulty,
			setData: currentSetData,
			liveMetrics
		});
		// Move to post-set summary
		currentScreen = 'post-set';
	}

	function handleSkipFeedback() {
		// Skip feedback and go directly to post-set
		currentScreen = 'post-set';
	}

	function handleNextSet() {
		if (currentSet < workout.totalSets) {
			currentSet++;
			currentScreen = 'pre-set';
			currentRep = 0;
			elapsedTime = 0;
		} else {
			handleEndWorkout();
		}
	}

	function handleRepeatSet() {
		// Reset current set
		currentScreen = 'pre-set';
		currentRep = 0;
		elapsedTime = 0;
	}

	function handleEndWorkout() {
		const totalDuration = Math.floor((Date.now() - workoutStartTime) / 1000);

		dispatch('workoutComplete', {
			completedSets,
			totalDuration,
			averageHeartRate:
				completedSets.reduce((sum, set) => sum + set.avgHeartRate, 0) / completedSets.length,
			finalMetrics: liveMetrics
		});
	}

	function handlePauseWorkout() {
		dispatch('workoutPaused');
	}

	// Simulate rep counting (in real app, this would come from motion sensors)
	function incrementRep() {
		if (currentScreen === 'in-set') {
			currentRep = Math.min(currentRep + 1, workout.targetReps);
		}
	}

	// Handle wearable-specific gestures
	function handleGesture(event) {
		const { type } = event.detail;

		switch (type) {
			case 'tap':
				if (currentScreen === 'in-set') {
					incrementRep();
				}
				break;
			case 'double-tap':
				if (currentScreen === 'in-set') {
					handleCompleteSet({
						detail: {
							reps: currentRep,
							duration: elapsedTime,
							heartRate: liveMetrics.heartRate,
							spo2: liveMetrics.spo2
						}
					});
				}
				break;
		}
	}
</script>

<div class="wearable-workout-container">
	<StrainMonitor {targetStrain} onStrainReached={handleEndWorkout} bind:currentStrain />
	{#if currentScreen === 'pre-set'}
		<WearablePreSet
			exercise={workout.exercise}
			targetReps={workout.targetReps}
			targetWeight={workout.targetWeight}
			{currentSet}
			totalSets={workout.totalSets}
			on:startWorkout={handleStartWorkout}
		/>
	{:else if currentScreen === 'in-set'}
		<WearableInSet
			exercise={workout.exercise}
			{currentRep}
			targetReps={workout.targetReps}
			{elapsedTime}
			heartRate={liveMetrics.heartRate}
			spo2={liveMetrics.spo2}
			strainLevel={liveMetrics.strainLevel}
			on:completeSet={handleCompleteSet}
			on:pauseWorkout={handlePauseWorkout}
		/>
	{:else if currentScreen === 'feedback'}
		<WearableFeedbackButtons
			exercise={workout.exercise}
			setNumber={currentSet}
			on:feedback={handleFeedback}
			on:skip={handleSkipFeedback}
		/>
	{:else if currentScreen === 'post-set'}
		<WearablePostSet
			exercise={workout.exercise}
			setNumber={currentSet}
			totalSets={workout.totalSets}
			completedReps={currentSetData.reps}
			targetReps={workout.targetReps}
			duration={currentSetData.duration}
			avgHeartRate={currentSetData.avgHeartRate}
			strainLevel={currentSetData.strainLevel}
			on:nextSet={handleNextSet}
			on:repeatSet={handleRepeatSet}
			on:endWorkout={handleEndWorkout}
		/>
	{/if}
</div>

<!-- Development helpers (remove in production) -->
{#if currentScreen === 'in-set'}
	<div class="dev-controls">
		<button on:click={incrementRep}>+ Rep</button>
		<button
			on:click={() =>
				handleCompleteSet({
					detail: {
						reps: currentRep,
						duration: elapsedTime,
						heartRate: liveMetrics.heartRate,
						spo2: liveMetrics.spo2
					}
				})}
		>
			Complete Set
		</button>
	</div>
{/if}

<style>
	.wearable-workout-container {
		width: 100%;
		height: 100vh;
		background: #000;
		overflow: hidden;
	}

	.dev-controls {
		position: fixed;
		bottom: 20px;
		left: 20px;
		display: flex;
		gap: 10px;
		z-index: 1000;
	}

	.dev-controls button {
		padding: 8px 12px;
		background: #007aff;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
	}

	.dev-controls button:hover {
		background: #0056cc;
	}

	/* Hide dev controls in production */
	@media (max-width: 200px) {
		.dev-controls {
			display: none;
		}
	}
</style>
