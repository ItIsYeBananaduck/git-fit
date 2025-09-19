<script lang="ts">
	import { onMount } from 'svelte';
	import { whoopState, whoopData } from '../stores/whoop.js';
	import { AdaptiveTrainingEngine } from '../services/adaptiveTraining.js';
	import { ProgressionEngine } from '../services/progressionEngine.js';
	import { MultiTrackerAdaptiveEngine } from '../services/multiTrackerAdaptive.js';
	import { WorkoutExecutionService } from '../services/workoutExecution.js';
	import WorkoutExecution from './WorkoutExecution.svelte';
	import type { TrainingParameters } from '../services/adaptiveTraining.js';
	import type { SafetySettings, FitnessTracker, TrackerData } from '../types/fitnessTrackers.js';
	import { DEFAULT_SAFETY_SETTINGS } from '../types/fitnessTrackers.js';

	export let connectedTrackers: FitnessTracker[] = [];
	export let safetySettings: SafetySettings = DEFAULT_SAFETY_SETTINGS;
	export let exercise = {
		name: 'Bench Press',
		baseParams: {
			load: 80, // % of 1RM
			reps: 8,
			sets: 3,
			restBetweenSets: 90,
			restBetweenExercises: 180,
			intensity: 'moderate'
		} as TrainingParameters
	};

	let state = $whoopState;
	let data = $whoopData;
	let adaptiveEngine: AdaptiveTrainingEngine;
	let progressionEngine: ProgressionEngine;
	let multiTrackerEngine: MultiTrackerAdaptiveEngine;
	let workoutExecutionService: WorkoutExecutionService;
	let todaysRecommendation: any = null;
	let progressionDecision: any = null;
	let currentParams: TrainingParameters = { ...exercise.baseParams }; // Current progression level
	let todaysParams: TrainingParameters = { ...exercise.baseParams }; // Today's adjusted rest periods
	let suggestions: string[] = [];
	let isDeloadWeek = false;
	let currentStrain = 0;
	let strainCheck: any = null;
	let isWorkoutActive = false;
	let currentWorkoutState: any = null;

	$: state = $whoopState;
	$: data = $whoopData;

	onMount(() => {
		adaptiveEngine = new AdaptiveTrainingEngine('user-123');
		progressionEngine = new ProgressionEngine('user-123');
		multiTrackerEngine = new MultiTrackerAdaptiveEngine('user-123', safetySettings);
		workoutExecutionService = new WorkoutExecutionService();
		calculateTodaysWorkout();
		checkProgression();
	});

	function calculateTodaysWorkout() {
		if (connectedTrackers.length === 0) {
			// No trackers connected
			todaysParams = { ...currentParams };
			suggestions = ['Connect a fitness tracker for personalized training adjustments'];
			return;
		}

		// Simulate tracker data (in real app, this would come from actual APIs)
		const trackerData = generateMockTrackerData();
		const mockSessions = generateMockProgressionSessions();

		// Use multi-tracker engine for recommendation
		todaysRecommendation = multiTrackerEngine.getDailyTrainingRecommendation(
			trackerData,
			mockSessions,
			isDeloadWeek
		);

		// Check for deload week recommendation
		if (todaysRecommendation.shouldDeload && !isDeloadWeek) {
			isDeloadWeek = true;
			// Create deload parameters: half weight, double reps, 90s rest
			todaysParams = multiTrackerEngine.createDeloadParameters(currentParams);
		} else {
			// Normal day: adjust only rest periods, keep progression load/reps
			todaysParams = {
				...currentParams,
				restBetweenSets: Math.round(
					currentParams.restBetweenSets * todaysRecommendation.restMultiplier
				),
				restBetweenExercises: Math.round(
					currentParams.restBetweenExercises * todaysRecommendation.restMultiplier
				),
				isDeloadWeek: currentParams.isDeloadWeek
			};
		}

		// Simulate current strain during workout
		const targetStrain = todaysRecommendation.targetStrain || 12;
		currentStrain = Math.random() * targetStrain * 0.8; // 80% of target typically
		strainCheck = multiTrackerEngine.checkStrainTarget(currentStrain, targetStrain, isDeloadWeek);

		// Generate basic suggestions
		suggestions = [
			`Training confidence: ${Math.round(todaysRecommendation.confidence * 100)}%`,
			`Data source: ${todaysRecommendation.adaptationSource}`,
			todaysRecommendation.reasoning[0] || 'Standard training protocol'
		];
	}

	function generateMockTrackerData(): Record<string, TrackerData> {
		const data: Record<string, TrackerData> = {};

		connectedTrackers.forEach((tracker) => {
			const mockData: TrackerData = {
				timestamp: new Date()
			};

			// Generate data based on tracker capabilities
			if (tracker.capabilities.hasRecovery) {
				mockData.recovery = Math.random() * 40 + 40; // 40-80%
			}
			if (tracker.capabilities.hasStrain) {
				mockData.strain = Math.random() * 8 + 8; // 8-16
			}
			if (tracker.capabilities.hasHRV) {
				mockData.hrv = Math.random() * 30 + 30; // 30-60ms
			}
			if (tracker.capabilities.hasHeartRate) {
				mockData.heartRate = Math.random() * 40 + 60; // 60-100 BPM
				mockData.restingHeartRate = 55 + Math.random() * 15; // 55-70 BPM
			}
			if (tracker.capabilities.hasSleep) {
				mockData.sleep = {
					duration: 6 + Math.random() * 3, // 6-9 hours
					quality: 60 + Math.random() * 30, // 60-90%
					efficiency: 70 + Math.random() * 25 // 70-95%
				};
			}
			if (tracker.capabilities.hasSteps) {
				mockData.steps = Math.floor(Math.random() * 8000 + 2000); // 2k-10k steps
			}
			if (tracker.capabilities.hasCalories) {
				mockData.calories = Math.floor(Math.random() * 1000 + 1500); // 1500-2500 calories
			}

			data[tracker.id] = mockData;
		});

		return data;
	}

	function checkProgression() {
		// Mock recent sessions for progression analysis
		const mockSessions = generateMockProgressionSessions();

		progressionDecision = progressionEngine.analyzeProgression(
			exercise.name,
			currentParams,
			mockSessions,
			14
		);

		// Apply progression if recommended
		if (progressionDecision.shouldProgress) {
			currentParams = progressionEngine.applyProgression(currentParams, progressionDecision);
			// Recalculate today's parameters with new progression
			if (todaysRecommendation) {
				todaysParams = adaptiveEngine.adjustRestPeriods(currentParams, todaysRecommendation);
			} else {
				todaysParams = { ...currentParams };
			}
		}
	}

	function generateMockProgressionSessions() {
		// Generate realistic progression sessions
		const sessions = [];
		const now = new Date();

		for (let i = 0; i < 8; i++) {
			const date = new Date(now);
			date.setDate(date.getDate() - i * 3); // Every 3 days

			sessions.push({
				id: `session-${i}`,
				userId: 'user-123',
				date: date.toISOString(),
				exerciseId: exercise.name,
				plannedParams: currentParams,
				completedReps: [
					currentParams.reps - Math.floor(Math.random() * 2),
					currentParams.reps - Math.floor(Math.random() * 2),
					currentParams.reps - Math.floor(Math.random() * 3)
				],
				perceivedEffort: 6 - i * 0.2, // Getting easier over time
				recoveryBefore: 60 + i * 2, // Recovery improving
				strainAfter: 12 + Math.random() * 4
			});
		}

		return sessions;
	}

	function getIntensityColor(intensity: string): string {
		switch (intensity) {
			case 'light':
				return 'text-green-600 bg-green-100';
			case 'moderate':
				return 'text-yellow-600 bg-yellow-100';
			case 'high':
				return 'text-red-600 bg-red-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}

	function getChangeIcon(original: number, current: number) {
		if (current > original) return '↗️';
		if (current < original) return '↘️';
		return '→';
	}

	function getChangeColor(original: number, current: number): string {
		if (current > original) return 'text-green-600';
		if (current < original) return 'text-red-600';
		return 'text-gray-600';
	}

	function getInjuryRiskColor(risk: string): string {
		switch (risk) {
			case 'high':
				return 'text-red-600 bg-red-100';
			case 'moderate':
				return 'text-yellow-600 bg-yellow-100';
			default:
				return 'text-green-600 bg-green-100';
		}
	}

	function formatTime(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return remainingSeconds > 0
			? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
			: `${minutes}min`;
	}

	// Reactive updates when WHOOP data changes
	$: if (adaptiveEngine && progressionEngine && multiTrackerEngine) {
		calculateTodaysWorkout();
	}

	// Update multi-tracker engine when safety settings change
	$: if (multiTrackerEngine && safetySettings) {
		multiTrackerEngine.updateSafetySettings(safetySettings);
	}

	function startWorkout() {
		if (workoutExecutionService) {
			currentWorkoutState = workoutExecutionService.startWorkout(exercise.name, todaysParams);
			isWorkoutActive = true;
		}
	}

	function handleSetCompleted(event: any) {
		const { setNumber, repsCompleted, difficulty, timestamp } = event.detail;

		if (workoutExecutionService) {
			workoutExecutionService.completeSet(difficulty, repsCompleted);

			// Update current workout state
			currentWorkoutState = workoutExecutionService.getCurrentState();

			// Check if workout is complete
			if (!currentWorkoutState?.isActive) {
				isWorkoutActive = false;
				// TODO: Save completed workout session
				console.log('Workout completed!');
			}
		}
	}

	function endWorkout() {
		if (workoutExecutionService) {
			const completedSession = workoutExecutionService.endWorkout();
			if (completedSession) {
				console.log('Workout session saved:', completedSession);
				// TODO: Save to database
			}
			isWorkoutActive = false;
			currentWorkoutState = null;
		}
	}
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-semibold text-gray-900">{exercise.name}</h3>
		<div class="flex space-x-2">
			{#if todaysRecommendation}
				<div
					class="px-3 py-1 rounded-full text-sm font-medium {getIntensityColor(
						todaysRecommendation.intensity
					)}"
				>
					{todaysRecommendation.intensity} intensity
				</div>
				<div
					class="px-3 py-1 rounded-full text-sm font-medium {getInjuryRiskColor(
						todaysRecommendation.injuryRisk
					)}"
				>
					<span class="inline mr-1">🛡️</span>
					{todaysRecommendation.injuryRisk} risk
				</div>
			{/if}
		</div>
	</div>

	{#if todaysRecommendation?.shouldStop}
		<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
			<div class="flex items-center mb-2">
				<span class="text-red-600 mr-2">⚠️</span>
				<p class="text-sm font-bold text-red-900">STOP TRAINING RECOMMENDATION</p>
			</div>
			<p class="text-sm text-red-800">{todaysRecommendation.recommendation}</p>
		</div>
	{:else if todaysRecommendation}
		<div class="mb-4 p-3 bg-blue-50 rounded-lg">
			<p class="text-sm font-medium text-blue-900 mb-1">Today's Training Status</p>
			<p class="text-sm text-blue-800">{todaysRecommendation.recommendation}</p>
		</div>
	{/if}

	{#if isDeloadWeek}
		<div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
			<div class="flex items-center mb-2">
				<span class="text-blue-600 mr-2">🔄</span>
				<p class="text-sm font-bold text-blue-900">DELOAD WEEK ACTIVE</p>
			</div>
			<p class="text-sm text-blue-800">
				Weight reduced to 50%, reps doubled, rest fixed at 90s for recovery
			</p>
		</div>
	{:else if progressionDecision?.shouldProgress}
		<div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
			<div class="flex items-center mb-1">
				<span class="text-green-600 mr-2">📈</span>
				<p class="text-sm font-medium text-green-900">Progression Update</p>
			</div>
			<p class="text-sm text-green-800">{progressionDecision.reasoning}</p>
		</div>
	{/if}

	<!-- Strain Monitoring -->
	{#if todaysRecommendation && strainCheck}
		<div
			class="mb-4 p-3 {strainCheck.shouldStop
				? 'bg-red-50 border border-red-200'
				: strainCheck.progress > 0.9
					? 'bg-yellow-50 border border-yellow-200'
					: 'bg-gray-50'} rounded-lg"
		>
			<div class="flex items-center justify-between mb-2">
				<div class="flex items-center">
					<span class="text-gray-600 mr-2">🎯</span>
					<p class="text-sm font-medium text-gray-900">Strain Target</p>
				</div>
				<span class="text-sm font-bold text-gray-900"
					>{currentStrain.toFixed(1)}/{todaysRecommendation.targetStrain}</span
				>
			</div>
			<div class="w-full bg-gray-200 rounded-full h-2 mb-2">
				<div
					class="bg-blue-600 h-2 rounded-full transition-all duration-300"
					style="width: {strainCheck.progress * 100}%"
				></div>
			</div>
			<p
				class="text-xs {strainCheck.shouldStop
					? 'text-red-800'
					: strainCheck.progress > 0.9
						? 'text-yellow-800'
						: 'text-gray-600'}"
			>
				{strainCheck.message}
			</p>
		</div>
	{/if}

	<!-- Adaptive Parameters -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
		<!-- Load -->
		<div class="text-center">
			<div class="flex items-center justify-center mb-2">
				<span class="text-lg mr-2">⚡</span>
				<span class={getChangeColor(exercise.baseParams.load, todaysParams.load)}
					>{getChangeIcon(exercise.baseParams.load, todaysParams.load)}</span
				>
			</div>
			<p class="text-2xl font-bold text-gray-900">{todaysParams.load}%</p>
			<p class="text-sm text-gray-600">Load</p>
			{#if todaysParams.load !== exercise.baseParams.load}
				<p class="text-xs text-gray-500">was {exercise.baseParams.load}%</p>
			{/if}
		</div>

		<!-- Reps -->
		<div class="text-center">
			<div class="flex items-center justify-center mb-2">
				<span class="text-lg mr-2">🔄</span>
				<span class={getChangeColor(exercise.baseParams.reps, todaysParams.reps)}
					>{getChangeIcon(exercise.baseParams.reps, todaysParams.reps)}</span
				>
			</div>
			<p class="text-2xl font-bold text-gray-900">{todaysParams.reps}</p>
			<p class="text-sm text-gray-600">Reps</p>
			{#if todaysParams.reps !== exercise.baseParams.reps}
				<p class="text-xs text-gray-500">was {exercise.baseParams.reps}</p>
			{/if}
		</div>

		<!-- Sets -->
		<div class="text-center">
			<div class="flex items-center justify-center mb-2">
				<div class="w-5 h-5 bg-gray-400 rounded mr-2"></div>
			</div>
			<p class="text-2xl font-bold text-gray-900">{todaysParams.sets}</p>
			<p class="text-sm text-gray-600">Sets</p>
		</div>

		<!-- Rest -->
		<div class="text-center">
			<div class="flex items-center justify-center mb-2">
				<span class="text-lg mr-2">⏱️</span>
				<span
					class={getChangeColor(exercise.baseParams.restBetweenSets, todaysParams.restBetweenSets)}
					>{getChangeIcon(exercise.baseParams.restBetweenSets, todaysParams.restBetweenSets)}</span
				>
			</div>
			<p class="text-2xl font-bold text-gray-900">{formatTime(todaysParams.restBetweenSets)}</p>
			<p class="text-sm text-gray-600">Rest</p>
			{#if todaysParams.restBetweenSets !== exercise.baseParams.restBetweenSets}
				<p class="text-xs text-gray-500">was {formatTime(exercise.baseParams.restBetweenSets)}</p>
			{/if}
		</div>
	</div>

	<!-- Reasoning -->
	{#if todaysRecommendation?.reasoning && todaysRecommendation.reasoning.length > 0}
		<div class="mb-4">
			<p class="text-sm font-medium text-gray-900 mb-2">Why these adjustments:</p>
			<div class="space-y-1">
				{#each todaysRecommendation.reasoning as reason}
					<p class="text-sm text-gray-600">• {reason}</p>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Safety Alerts -->
	{#if todaysRecommendation?.safetyAlerts && todaysRecommendation.safetyAlerts.length > 0}
		<div class="border-t pt-4 mb-4">
			<p class="text-sm font-medium text-red-900 mb-3">⚠️ Safety Alerts:</p>
			<div class="space-y-2">
				{#each todaysRecommendation.safetyAlerts as alert}
					<div class="flex items-start p-2 bg-red-50 rounded">
						<div class="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
						<p class="text-sm text-red-800">{alert}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Training Tips -->
	{#if suggestions.length > 0}
		<div class="border-t pt-4">
			<p class="text-sm font-medium text-gray-900 mb-3">Today's Training Tips:</p>
			<div class="space-y-2">
				{#each suggestions.slice(0, 3) as suggestion}
					<div class="flex items-start">
						<div class="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
						<p class="text-sm text-gray-700">{suggestion}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Workout Controls -->
	<div class="border-t pt-4 mt-6">
		{#if !isWorkoutActive}
			<button
				on:click={startWorkout}
				class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
			>
				Start Workout
			</button>
		{:else}
			<div class="space-y-4">
				<!-- Workout Execution Component -->
				{#if currentWorkoutState}
					<WorkoutExecution
						currentSet={currentWorkoutState.currentSet}
						totalSets={currentWorkoutState.totalSets}
						currentReps={currentWorkoutState.currentReps}
						targetReps={currentWorkoutState.targetReps}
						exerciseName={exercise.name}
						isActive={currentWorkoutState.isActive}
						on:setCompleted={handleSetCompleted}
					/>
				{/if}

				<!-- End Workout Button -->
				<button
					on:click={endWorkout}
					class="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
				>
					End Workout
				</button>
			</div>
		{/if}
	</div>
</div>
