<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import WearablePreSet from './WearablePreSet.svelte';
	import WearableInSet from './WearableInSet.svelte';
	import WearableFeedbackButtons from './WearableFeedbackButtons.svelte';
	import WearablePostSet from './WearablePostSet.svelte';
	import StrainMonitor from './StrainMonitor.svelte';
	import { DailyStrainAssessmentService } from '../services/dailyStrainAssessmentService.js';
	import { AIWorkoutIntegrationService } from '../services/aiWorkoutIntegration.js';
	import { restManager } from '../services/restManager.js';
	import type { RestSession } from '../services/restManager.js';

	// Example: Replace with real baseline and readiness data from user profile or API
	const baselineHR = 60;
	const baselineSpO2 = 97;
	let readiness = 70; // e.g. recovery score, 0-100
	let hrv = 50; // placeholder
	let yesterdayStrain = 12; // placeholder

	const strainService = new DailyStrainAssessmentService();
	const aiService = new AIWorkoutIntegrationService(strainService);
	let currentStrain = 0;
	let targetStrain = Math.round(8 + readiness / 10 + hrv / 20 + yesterdayStrain / 2);
	let lastFeedback = 0;

	// AI integration state
	let currentUserId = 'demo_user'; // Would come from auth
	let aiImplementation: any = null;
	let showCalibrationPrompt = false;

	// Rest management state
	let currentRestSession: RestSession | null = null;
	let restStatus = { isActive: false, progress: 0, timeRemaining: 0 };
	let aiAdjustedRestTime: number | null = null; // Tracks AI-recommended rest time

	function updateStrainAfterSet(setData: any, feedback: any) {
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
	let completedSets: any[] = [];
	let currentSetData = {
		reps: 0,
		duration: 0,
		avgHeartRate: 0,
		strainLevel: 'moderate'
	};

	function handleStartWorkout(event: any) {
		const { exercise, targetReps, targetWeight, totalSets } = event.detail;
		workout = { exercise, targetReps, targetWeight, totalSets };
		currentScreen = 'in-set';
		setStartTime = Date.now();
		currentRep = 0;
		elapsedTime = 0;
	}

	function handleCompleteSet(event: any) {
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

	async function handleFeedback(event: any) {
		const { difficulty } = event.detail;

		// Update strain with feedback
		updateStrainAfterSet(currentSetData, difficulty);

		// Get AI implementation after set completion (automatically applies changes)
		await getAIImplementationAfterSet(difficulty);

		// Send feedback to adaptive training engine
		dispatch('setFeedback', {
			setNumber: currentSet,
			difficulty,
			setData: currentSetData,
			liveMetrics,
			aiImplementation
		});
		// Move to post-set summary
		currentScreen = 'post-set';
	}

	/**
	 * Get AI implementation after set completion - automatically applies changes
	 */
	async function getAIImplementationAfterSet(difficulty: any) {
		try {
			const context = {
				userId: currentUserId,
				currentExercise: workout.exercise,
				currentWeight: workout.targetWeight,
				currentReps: currentSetData.reps,
				heartRate: liveMetrics.heartRate,
				spo2: liveMetrics.spo2,
				lastWorkouts: [
					{
						date: new Date().toISOString().split('T')[0],
						exercises: [workout.exercise],
						avgHeartRate: currentSetData.avgHeartRate,
						feedback: difficulty
					}
				],
				userPrefs: {
					blacklistedExercises: [],
					preferredExercises: ['rack_pull'], // Example from user request
					successRates: {
						[workout.exercise]: difficulty === 'easy' ? 0.8 : difficulty === 'hard' ? 0.3 : 0.6
					},
					exerciseSwapCounts: {},
					maxHeartRate: 180, // Would be calibrated
					calibrated: false,
					age: 30
				}
			};

			aiImplementation = await aiService.getAIImplementation(context);
			console.log('AI Implementation:', aiImplementation);

			// Automatically apply the implementation if it was applied
			if (aiImplementation.applied) {
				applyAIImplementation(aiImplementation);
			}
		} catch (error) {
			console.error('Failed to get AI implementation:', error);
			aiImplementation = null;
		}
	}

	function handleSkipFeedback() {
		// Skip feedback and go directly to post-set
		currentScreen = 'post-set';
	}

	async function handleNextSet() {
		if (currentSet < workout.totalSets) {
			currentSet++;
			currentScreen = 'pre-set';
			currentRep = 0;
			elapsedTime = 0;

			// Start rest with AI integration for next set
			await startRestPeriod();
		} else {
			handleEndWorkout();
		}
	}

	/**
	 * Apply AI implementation to workout parameters (already applied automatically during feedback)
	 */
	function applyAIImplementation(implementation: any) {
		switch (implementation.type) {
			case 'weight_increase':
				// Weight already applied during implementation
				console.log(
					`Weight automatically increased by ${implementation.appliedValue}lb: ${implementation.reason}`
				);
				break;
			case 'add_set':
				workout.totalSets += implementation.appliedValue || 1;
				console.log(`Set added automatically: ${implementation.reason}`);
				break;
			case 'add_rep':
				workout.targetReps += implementation.appliedValue || 1;
				console.log(`Reps increased automatically: ${implementation.reason}`);
				break;
			case 'increase_rest':
				// AI determined rest needs to be increased for strain protection
				aiAdjustedRestTime = implementation.appliedValue;
				console.log(
					`🤖 AI Rest Adjustment: ${implementation.appliedValue}s - ${implementation.reason}`
				);

				// If we're currently in rest, update the active session
				if (currentRestSession) {
					updateActiveRestSession(implementation.appliedValue, implementation.reason);
				}
				break;
			case 'blacklist_exercise':
				if (implementation.applied) {
					console.log(`Exercise automatically blacklisted: ${implementation.reason}`);
					aiService.updateUserPreferences(currentUserId, {
						blacklistedExercises: [implementation.exercise]
					});
				} else {
					console.log(`Exercise blacklist suggested: ${implementation.reason}`);
					showBlacklistPrompt(implementation.exercise);
				}
				break;
		}

		// Apply weight changes immediately if they were implemented
		if (implementation.type === 'weight_increase' && implementation.applied) {
			workout.targetWeight =
				Math.max(0, workout.targetWeight - implementation.value) + implementation.appliedValue;
		}

		aiImplementation = null; // Clear implementation after applying
	}

	/**
	 * Update active rest session with AI-recommended rest time
	 */
	function updateActiveRestSession(newRestTime: any, reason: any) {
		if (currentRestSession) {
			// Extend the current rest session with AI recommendation
			const currentStatus = restManager.getRestStatus();
			const extension = Math.max(0, newRestTime - currentStatus.timeRemaining);

			if (extension > 0) {
				// Calculate new target duration
				const elapsed = Date.now() - currentRestSession.startTime;
				const newTargetDuration = Math.round(elapsed / 1000) + newRestTime;

				// Update the session (this is a simplified approach)
				currentRestSession.targetRestDuration = newTargetDuration;

				console.log(`🤖 Rest extended by ${extension}s due to AI recommendation: ${reason}`);
			}
		}
	}

	/**
	 * Start rest period with AI integration
	 */
	async function startRestPeriod() {
		try {
			const restTime = aiAdjustedRestTime || 90; // Use AI-recommended time or default

			// Configure rest manager with current HR/strain monitors
			restManager.setHRMonitor(async () => liveMetrics.heartRate);
			restManager.setStrainMonitor(async () => currentStrain);

			// Set up event handlers for rest progress
			restManager.setEventHandlers({
				onRestStart: (session) => {
					currentRestSession = session;
					console.log(`Rest started: ${session.targetRestDuration}s`);
				},
				onRestProgress: (session, progress) => {
					const status = restManager.getRestStatus();
					restStatus = status;

					// Check if AI recommends further adjustment during rest
					if (progress < 1 && liveMetrics.heartRate > 0) {
						checkForDynamicRestAdjustment();
					}
				},
				onRestComplete: (session) => {
					currentRestSession = null;
					restStatus = { isActive: false, progress: 0, timeRemaining: 0 };
					aiAdjustedRestTime = null; // Reset AI adjustment
					console.log('Rest completed');

					// Move to next set
					handleNextSet();
				}
			});

			// Start the rest session
			const session = await restManager.startRest(workout.exercise, currentSet, {
				perceivedEffort: getPerceivedEffortFromFeedback(),
				exerciseIntensity: getExerciseIntensity(),
				userFitnessLevel: 'intermediate' // Could be from user profile
			});

			currentRestSession = session;
		} catch (error) {
			console.error('Failed to start rest period:', error);
			// Fallback to simple timer
			setTimeout(
				() => {
					handleNextSet();
				},
				(aiAdjustedRestTime || 90) * 1000
			);
		}
	}

	/**
	 * Check for dynamic rest adjustment during active rest period
	 */
	async function checkForDynamicRestAdjustment() {
		if (!currentRestSession || !liveMetrics.heartRate) return;

		const context = {
			userId: currentUserId,
			currentExercise: workout.exercise,
			currentWeight: workout.targetWeight,
			currentReps: workout.targetReps,
			heartRate: liveMetrics.heartRate,
			spo2: liveMetrics.spo2,
			lastWorkouts: [], // Would be populated from workout history
			userPrefs: {
				blacklistedExercises: [],
				preferredExercises: [],
				successRates: {},
				maxHeartRate: 161, // 85% of 190 (220-30 for 30yr old)
				calibrated: true,
				age: 30,
				exerciseSwapCounts: {}
			}
		};

		// Get AI recommendation for current strain levels
		try {
			const implementation = await aiService.getAIImplementation(context);

			// Only process rest adjustments during active rest
			if (implementation.type === 'increase_rest' && implementation.applied) {
				updateActiveRestSession(implementation.appliedValue, implementation.reason);

				// Update UI to show AI adjustment
				aiImplementation = implementation;
			}
		} catch (error) {
			console.warn('Failed to get dynamic rest adjustment:', error);
		}
	}

	/**
	 * Get perceived effort based on last feedback
	 */
	function getPerceivedEffortFromFeedback() {
		// Convert feedback to RPE scale (1-10)
		switch (lastFeedback) {
			case -2:
				return 4; // 'easy'
			case 0:
				return 7; // 'moderate'
			case 2:
				return 9; // 'hard'
			default:
				return 7; // default moderate
		}
	}

	/**
	 * Get exercise intensity based on weight/reps
	 */
	function getExerciseIntensity() {
		// Simple heuristic based on workout parameters
		if (workout.targetReps <= 5) return 'high'; // Heavy/strength
		if (workout.targetReps <= 8) return 'moderate'; // Hypertrophy
		return 'low'; // Endurance
	}

	/**
	 * Show exercise blacklist confirmation
	 */
	function showBlacklistPrompt(exercise: any) {
		const confirmed = confirm(`Blacklist ${exercise}? You've been struggling with this exercise.`);
		if (confirmed) {
			// Would update user preferences
			console.log(`${exercise} blacklisted by user`);
			aiService.updateUserPreferences(currentUserId, {
				blacklistedExercises: [exercise]
			});
		}
	}

	/**
	 * Show strain calibration prompt
	 */
	function showStrainCalibration() {
		showCalibrationPrompt = true;
	}

	/**
	 * Handle 15-second jump test calibration
	 */
	async function handleJumpTestCalibration(maxHR: any) {
		await aiService.calibrateMaxHeartRate(currentUserId, maxHR);
		showCalibrationPrompt = false;
		console.log(`Heart rate calibrated to ${maxHR * 0.85} BPM`);
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
	function handleGesture(event: any) {
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
	<StrainMonitor {targetStrain} onStrainReached={handleEndWorkout} />

	<!-- Strain Calibration Prompt -->
	{#if showCalibrationPrompt}
		<div class="calibration-overlay">
			<div class="calibration-modal">
				<h3>Calibrate Your Safe Strain</h3>
				<p>{aiService.getStrainCalibrationPrompt()}</p>
				<div class="calibration-buttons">
					<button on:click={() => handleJumpTestCalibration(180)} class="calibrate-btn">
						Start Jump Test
					</button>
					<button on:click={() => (showCalibrationPrompt = false)} class="skip-btn">
						Skip (Use Age-Based)
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- AI Implementation Display -->
	{#if aiImplementation && currentScreen === 'post-set'}
		<div class="ai-suggestion">
			<div class="suggestion-header">
				<span class="ai-icon">🤖</span>
				<span class="suggestion-title">AI Implementation Applied</span>
			</div>
			<p class="suggestion-text">{aiImplementation.reason}</p>
			{#if aiImplementation.clamped}
				<p class="clamped-notice">⚠️ Implementation adjusted for safety</p>
			{/if}
		</div>
	{/if}

	{#if currentScreen === 'pre-set'}
		<WearablePreSet
			exercise={workout.exercise}
			targetReps={workout.targetReps}
			targetWeight={workout.targetWeight}
			{currentSet}
			totalSets={workout.totalSets}
			on:startWorkout={handleStartWorkout}
		/>
		<!-- Show calibration prompt if not calibrated -->
		{#if !showCalibrationPrompt}
			<div class="calibration-prompt">
				<button on:click={showStrainCalibration} class="calibrate-small-btn">
					Calibrate Safe Strain
				</button>
			</div>
		{/if}
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
	{:else if restStatus.isActive}
		<!-- Professional Dynamic Rest Display -->
		<div class="card">
			<div class="card-header">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-foreground">Rest Period</h2>
					<div class="text-muted text-sm">
						Set {currentSet} of {workout.totalSets}
					</div>
				</div>
			</div>

			<div class="card-content flex flex-col items-center justify-center space-y-8">
				<!-- Timer Display -->
				<div class="text-center">
					<div class="text-6xl font-mono text-primary">
						{Math.floor(restStatus.timeRemaining / 60)
							.toString()
							.padStart(2, '0')}:{(restStatus.timeRemaining % 60).toString().padStart(2, '0')}
					</div>
					<div class="text-muted text-sm mt-2">Time Remaining</div>
				</div>

				<!-- Progress Bar -->
				<div class="w-full max-w-sm">
					<div class="progress-bar">
						<div class="progress-fill" style="width: {restStatus.progress * 100}%"></div>
					</div>
					<div class="text-muted text-center text-sm mt-2">
						{Math.round(restStatus.progress * 100)}% Complete
					</div>
				</div>

				<!-- AI Adjustment Notification -->
				{#if aiAdjustedRestTime}
					<div class="card p-4 max-w-sm border-accent">
						<div class="text-sm font-medium text-foreground">AI Rest Adjustment</div>
						<div class="text-muted text-sm mt-1">
							Extended to {aiAdjustedRestTime}s
							{#if aiImplementation?.reason}
								<div class="mt-1">{aiImplementation.reason}</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Heart Rate Recovery -->
				{#if liveMetrics.heartRate > 0}
					<div class="card-professional p-4 max-w-sm w-full">
						<div class="flex items-center justify-between">
							<div class="text-caption">Heart Rate</div>
							<div class="flex items-center space-x-2">
								<span class="text-subheading text-mono text-error-500">
									{liveMetrics.heartRate}
								</span>
								<span class="text-caption">bpm</span>
							</div>
						</div>
						<div class="mt-2">
							{#if liveMetrics.heartRate > 120}
								<div class="status-warning rounded px-2 py-1 text-xs">Still elevated</div>
							{:else}
								<div class="status-success rounded px-2 py-1 text-xs">Well recovered</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Next Set Info -->
			<div class="wearable-footer">
				<div class="card-professional p-4">
					<div class="flex items-center justify-between">
						<div>
							<div class="text-body font-medium">Next Set</div>
							<div class="text-caption">
								{workout.targetWeight}lb × {workout.targetReps} reps
							</div>
						</div>
						<div class="text-caption">
							{workout.exercise}
						</div>
					</div>
				</div>
			</div>
		</div>
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
		position: relative;
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

	/* AI Recommendation Styles */
	.ai-suggestion {
		position: absolute;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 122, 255, 0.9);
		color: white;
		padding: 12px 16px;
		border-radius: 12px;
		z-index: 100;
		max-width: 80%;
		text-align: center;
		backdrop-filter: blur(10px);
		font-size: 12px;
	}

	.suggestion-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-bottom: 8px;
		font-weight: 600;
	}

	.ai-icon {
		font-size: 16px;
	}

	.suggestion-text {
		margin: 0;
		font-size: 11px;
		line-height: 1.3;
	}

	.clamped-notice {
		margin: 4px 0 0 0;
		font-size: 10px;
		color: #ffd700;
		font-weight: 500;
	}

	/* Calibration Styles */
	.calibration-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		backdrop-filter: blur(5px);
	}

	.calibration-modal {
		background: #1a1a1a;
		color: white;
		padding: 24px;
		border-radius: 16px;
		text-align: center;
		max-width: 80%;
		border: 1px solid #333;
	}

	.calibration-modal h3 {
		margin: 0 0 16px 0;
		color: #007aff;
		font-size: 16px;
	}

	.calibration-modal p {
		margin: 0 0 20px 0;
		font-size: 12px;
		line-height: 1.4;
		color: #ccc;
	}

	.calibration-buttons {
		display: flex;
		gap: 12px;
		justify-content: center;
	}

	.calibrate-btn {
		background: #007aff;
		color: white;
		border: none;
		padding: 12px 16px;
		border-radius: 8px;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
	}

	.calibrate-btn:hover {
		background: #0056cc;
	}

	.skip-btn {
		background: #333;
		color: white;
		border: none;
		padding: 12px 16px;
		border-radius: 8px;
		font-size: 12px;
		cursor: pointer;
	}

	.skip-btn:hover {
		background: #444;
	}

	.calibration-prompt {
		position: absolute;
		bottom: 80px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 50;
	}

	.calibrate-small-btn {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 8px 12px;
		border-radius: 20px;
		font-size: 10px;
		cursor: pointer;
		backdrop-filter: blur(5px);
	}

	.calibrate-small-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	/* Hide dev controls in production */
	@media (max-width: 200px) {
		.dev-controls {
			display: none;
		}
	}
</style>
