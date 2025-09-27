<!--
  IntensityIntegration.svelte
  Phase 3.5 - Frontend Components
  
  Main workout page integration component that connects all intensity 
  components with real-time data flow and unified state management.
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable, derived } from 'svelte/store';
	import IntensityDisplay from './IntensityDisplay.svelte';
	import IntensityConfig from './IntensityConfig.svelte';
	import IntensityHistory from './IntensityHistory.svelte';
	import VoiceCoaching from './VoiceCoaching.svelte';
	import StrainMonitor from './StrainMonitor.svelte';

	import { intensityScoring } from '$lib/services/intensityScoring';
	import { strainCalculator } from '$lib/services/strainCalculator';
	import { voiceService } from '$lib/services/voiceService';
	import { api } from '$lib/convex';

	// Workout state management
	interface WorkoutState {
		isActive: boolean;
		startTime: Date | null;
		currentSet: number;
		totalSets: number;
		exerciseType: string;
		phase: 'warmup' | 'exercise' | 'rest' | 'cooldown';
		elapsedTime: number;
	}

	interface IntensityState {
		current: number;
		average: number;
		peak: number;
		target: { min: number; max: number };
		breakdown: {
			tempo: number;
			smoothness: number;
			consistency: number;
			form: number;
		};
		trend: 'increasing' | 'decreasing' | 'stable';
	}

	interface StrainState {
		current: number;
		daily: number;
		weekly: number;
		heartRate: number;
		zone: string;
		recovery: number;
	}

	// Props
	export let userId: string;
	export let workoutId: string | null = null;
	export let exerciseId: string | null = null;

	// Stores for reactive state management
	const workoutState = writable<WorkoutState>({
		isActive: false,
		startTime: null,
		currentSet: 1,
		totalSets: 3,
		exerciseType: 'strength',
		phase: 'exercise',
		elapsedTime: 0
	});

	const intensityState = writable<IntensityState>({
		current: 0,
		average: 0,
		peak: 0,
		target: { min: 60, max: 85 },
		breakdown: { tempo: 0, smoothness: 0, consistency: 0, form: 0 },
		trend: 'stable'
	});

	const strainState = writable<StrainState>({
		current: 0,
		daily: 0,
		weekly: 0,
		heartRate: 60,
		zone: 'recovery',
		recovery: 100
	});

	// UI state
	let activePanel: 'display' | 'config' | 'history' | 'voice' | 'strain' = 'display';
	let showConfigModal = false;
	let showHistoryModal = false;
	let isCompactMode = false;
	let panelLayout: 'single' | 'split' | 'grid' = 'single';

	// Data update intervals
	let updateInterval: number | null = null;
	let workoutTimer: number | null = null;

	// Derived stores
	const isWorkoutActive = derived(workoutState, ($state) => $state.isActive);
	const currentIntensity = derived(intensityState, ($state) => $state.current);
	const workoutProgress = derived(workoutState, ($state) =>
		$state.totalSets > 0 ? ($state.currentSet / $state.totalSets) * 100 : 0
	);

	onMount(() => {
		initializeWorkout();
		setupDataSync();
	});

	onDestroy(() => {
		cleanup();
	});

	function initializeWorkout() {
		// Load user preferences and workout configuration
		loadUserPreferences();

		// Initialize services
		intensityScoring.initialize(userId);
		strainCalculator.initialize(userId);
		voiceService.initialize();
	}

	function setupDataSync() {
		// Start real-time data updates
		updateInterval = setInterval(() => {
			updateIntensityData();
			updateStrainData();
		}, 1000) as any;
	}

	function cleanup() {
		if (updateInterval) {
			clearInterval(updateInterval);
			updateInterval = null;
		}
		if (workoutTimer) {
			clearInterval(workoutTimer);
			workoutTimer = null;
		}

		// Save workout data if active
		if ($workoutState.isActive) {
			saveWorkoutData();
		}
	}

	async function loadUserPreferences() {
		try {
			// Load user's intensity preferences
			const preferences = await api.intensity.getUserPreferences({ userId });
			if (preferences) {
				intensityState.update((state) => ({
					...state,
					target: {
						min: preferences.targetMin || 60,
						max: preferences.targetMax || 85
					}
				}));
			}
		} catch (error) {
			console.error('Error loading user preferences:', error);
		}
	}

	async function updateIntensityData() {
		if (!$workoutState.isActive) return;

		try {
			// Get current intensity score
			const currentScore = await intensityScoring.getCurrentScore();
			const breakdown = await intensityScoring.getScoreBreakdown();

			intensityState.update((state) => {
				const newAverage =
					(state.average * $workoutState.elapsedTime + currentScore) /
					($workoutState.elapsedTime + 1);
				const newPeak = Math.max(state.peak, currentScore);

				// Determine trend
				let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
				if (currentScore > state.current + 2) trend = 'increasing';
				else if (currentScore < state.current - 2) trend = 'decreasing';

				return {
					...state,
					current: currentScore,
					average: newAverage,
					peak: newPeak,
					breakdown,
					trend
				};
			});
		} catch (error) {
			console.error('Error updating intensity data:', error);
		}
	}

	async function updateStrainData() {
		if (!$workoutState.isActive) return;

		try {
			const strainData = await strainCalculator.getCurrentStrain();

			strainState.update((state) => ({
				...state,
				current: strainData.currentStrain,
				daily: strainData.dailyStrain,
				weekly: strainData.weeklyStrain,
				heartRate: strainData.heartRate,
				zone: strainData.zone,
				recovery: strainData.recoveryScore
			}));
		} catch (error) {
			console.error('Error updating strain data:', error);
		}
	}

	function startWorkout() {
		const now = new Date();
		workoutState.update((state) => ({
			...state,
			isActive: true,
			startTime: now,
			elapsedTime: 0
		}));

		// Start workout timer
		workoutTimer = setInterval(() => {
			workoutState.update((state) => ({
				...state,
				elapsedTime: state.startTime
					? Math.floor((Date.now() - state.startTime.getTime()) / 1000)
					: 0
			}));
		}, 1000) as any;

		// Create workout session in backend
		createWorkoutSession();
	}

	function pauseWorkout() {
		workoutState.update((state) => ({
			...state,
			isActive: false
		}));

		if (workoutTimer) {
			clearInterval(workoutTimer);
			workoutTimer = null;
		}
	}

	function stopWorkout() {
		pauseWorkout();

		workoutState.update((state) => ({
			...state,
			startTime: null,
			currentSet: 1,
			elapsedTime: 0
		}));

		// Save final workout data
		saveWorkoutData();
	}

	function nextSet() {
		workoutState.update((state) => ({
			...state,
			currentSet: Math.min(state.currentSet + 1, state.totalSets),
			phase: state.currentSet < state.totalSets ? 'rest' : 'cooldown'
		}));
	}

	function previousSet() {
		workoutState.update((state) => ({
			...state,
			currentSet: Math.max(state.currentSet - 1, 1),
			phase: 'exercise'
		}));
	}

	async function createWorkoutSession() {
		if (!workoutId) return;

		try {
			const session = await api.intensity.createWorkoutSession({
				userId,
				workoutId,
				exerciseId,
				startTime: $workoutState.startTime?.toISOString() || new Date().toISOString(),
				targetIntensity: $intensityState.target
			});

			workoutId = session._id;
		} catch (error) {
			console.error('Error creating workout session:', error);
		}
	}

	async function saveWorkoutData() {
		if (!workoutId || !$workoutState.startTime) return;

		try {
			await api.intensity.saveWorkoutSession({
				sessionId: workoutId,
				endTime: new Date().toISOString(),
				finalStats: {
					averageIntensity: $intensityState.average,
					peakIntensity: $intensityState.peak,
					totalSets: $workoutState.currentSet,
					duration: $workoutState.elapsedTime,
					finalStrain: $strainState.current
				}
			});
		} catch (error) {
			console.error('Error saving workout data:', error);
		}
	}

	// Event handlers
	function handleConfigChange(event: CustomEvent) {
		const { config } = event.detail;

		intensityState.update((state) => ({
			...state,
			target: config.targetRange
		}));

		// Update intensity scoring service
		intensityScoring.setTargetRange(config.targetRange.min, config.targetRange.max);
	}

	function handleVoiceCommand(event: CustomEvent) {
		const { command } = event.detail;

		switch (command) {
			case 'start_workout':
				if (!$workoutState.isActive) startWorkout();
				break;
			case 'pause_workout':
				if ($workoutState.isActive) pauseWorkout();
				break;
			case 'next_set':
				nextSet();
				break;
			case 'previous_set':
				previousSet();
				break;
		}
	}

	function handleStrainAlert(event: CustomEvent) {
		const { level, message } = event.detail;

		// Show visual alert and potentially speak it
		if (level === 'danger') {
			voiceService.speak(`Warning: ${message}`);
		}
	}

	function formatTime(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}

	// Layout management
	function switchPanel(panel: typeof activePanel) {
		activePanel = panel;
	}

	function toggleLayout() {
		const layouts: (typeof panelLayout)[] = ['single', 'split', 'grid'];
		const currentIndex = layouts.indexOf(panelLayout);
		panelLayout = layouts[(currentIndex + 1) % layouts.length];
	}
</script>

<!-- Main Integration Container -->
<div class="min-h-screen bg-gray-900 text-white p-4">
	<!-- Header Controls -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold">Workout Session</h1>
			<div class="flex items-center gap-4 mt-1">
				<div class="text-sm text-gray-400">
					Set {$workoutState.currentSet} of {$workoutState.totalSets}
				</div>
				<div class="text-sm text-gray-400">
					{formatTime($workoutState.elapsedTime)}
				</div>
				<div class="text-sm">
					<span
						class="inline-block w-3 h-3 rounded-full mr-2"
						class:bg-green-400={$workoutState.isActive}
						class:bg-gray-500={!$workoutState.isActive}
					></span>
					{$workoutState.isActive ? 'Active' : 'Paused'}
				</div>
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="flex items-center gap-3">
			<!-- Layout Toggle -->
			<button
				on:click={toggleLayout}
				class="p-2 hover:bg-gray-700 rounded-lg transition-colors"
				title="Change layout"
			>
				{panelLayout === 'single' ? '📱' : panelLayout === 'split' ? '↔️' : '⊞'}
			</button>

			<!-- Workout Controls -->
			<div class="flex gap-2">
				{#if !$workoutState.isActive}
					<button
						on:click={startWorkout}
						class="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors"
					>
						Start Workout
					</button>
				{:else}
					<button
						on:click={pauseWorkout}
						class="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-medium transition-colors"
					>
						Pause
					</button>
				{/if}

				<button
					on:click={stopWorkout}
					class="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors"
				>
					Stop
				</button>
			</div>

			<!-- Settings -->
			<button
				on:click={() => (showConfigModal = true)}
				class="p-2 hover:bg-gray-700 rounded-lg transition-colors"
				title="Settings"
			>
				⚙️
			</button>
		</div>
	</div>

	<!-- Navigation Tabs (for single panel mode) -->
	{#if panelLayout === 'single'}
		<div class="flex mb-6 bg-gray-800 rounded-lg p-1">
			<button
				class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors"
				class:bg-blue-600={activePanel === 'display'}
				class:text-white={activePanel === 'display'}
				class:text-gray-400={activePanel !== 'display'}
				on:click={() => switchPanel('display')}
			>
				📊 Intensity
			</button>
			<button
				class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors"
				class:bg-blue-600={activePanel === 'strain'}
				class:text-white={activePanel === 'strain'}
				class:text-gray-400={activePanel !== 'strain'}
				on:click={() => switchPanel('strain')}
			>
				❤️ Strain
			</button>
			<button
				class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors"
				class:bg-blue-600={activePanel === 'voice'}
				class:text-white={activePanel === 'voice'}
				class:text-gray-400={activePanel !== 'voice'}
				on:click={() => switchPanel('voice')}
			>
				🎤 Voice
			</button>
			<button
				class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors"
				class:bg-blue-600={activePanel === 'history'}
				class:text-white={activePanel === 'history'}
				class:text-gray-400={activePanel !== 'history'}
				on:click={() => switchPanel('history')}
			>
				📈 History
			</button>
		</div>
	{/if}

	<!-- Main Content Area -->
	<div class="space-y-6">
		<!-- Single Panel Layout -->
		{#if panelLayout === 'single'}
			<div class="w-full">
				{#if activePanel === 'display'}
					<IntensityDisplay
						{userId}
						currentIntensity={$intensityState.current}
						targetRange={$intensityState.target}
						breakdown={$intensityState.breakdown}
						trend={$intensityState.trend}
						isActive={$workoutState.isActive}
					/>
				{:else if activePanel === 'strain'}
					<StrainMonitor {userId} restingHR={60} maxHR={190} on:strainAlert={handleStrainAlert} />
				{:else if activePanel === 'voice'}
					<VoiceCoaching
						currentIntensity={$intensityState.current}
						currentSet={$workoutState.currentSet}
						targetIntensity={$intensityState.target}
						workoutPhase={$workoutState.phase}
						on:settingsChanged={handleConfigChange}
						on:voiceCommand={handleVoiceCommand}
					/>
				{:else if activePanel === 'history'}
					<IntensityHistory {userId} isVisible={true} />
				{/if}
			</div>

			<!-- Split Panel Layout -->
		{:else if panelLayout === 'split'}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<IntensityDisplay
					{userId}
					currentIntensity={$intensityState.current}
					targetRange={$intensityState.target}
					breakdown={$intensityState.breakdown}
					trend={$intensityState.trend}
					isActive={$workoutState.isActive}
				/>
				<StrainMonitor {userId} restingHR={60} maxHR={190} on:strainAlert={handleStrainAlert} />
			</div>

			<!-- Grid Layout -->
		{:else if panelLayout === 'grid'}
			<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
				<!-- Primary Displays -->
				<div class="space-y-6">
					<IntensityDisplay
						{userId}
						currentIntensity={$intensityState.current}
						targetRange={$intensityState.target}
						breakdown={$intensityState.breakdown}
						trend={$intensityState.trend}
						isActive={$workoutState.isActive}
					/>

					<!-- Compact Voice Controls -->
					<div class="bg-gray-800 rounded-lg p-4">
						<VoiceCoaching
							currentIntensity={$intensityState.current}
							currentSet={$workoutState.currentSet}
							targetIntensity={$intensityState.target}
							workoutPhase={$workoutState.phase}
							on:settingsChanged={handleConfigChange}
							on:voiceCommand={handleVoiceCommand}
						/>
					</div>
				</div>

				<!-- Secondary Displays -->
				<div class="space-y-6">
					<StrainMonitor
						{userId}
						restingHR={60}
						maxHR={190}
						showDetailedView={false}
						on:strainAlert={handleStrainAlert}
					/>

					<!-- Quick Stats -->
					<div class="grid grid-cols-2 gap-4">
						<div class="bg-gray-800 rounded-lg p-4">
							<div class="text-2xl font-bold text-blue-400">
								{$intensityState.current.toFixed(1)}%
							</div>
							<div class="text-sm text-gray-400">Current Intensity</div>
						</div>
						<div class="bg-gray-800 rounded-lg p-4">
							<div class="text-2xl font-bold text-green-400">{$workoutProgress.toFixed(0)}%</div>
							<div class="text-sm text-gray-400">Workout Progress</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Set Navigation -->
		{#if $workoutState.isActive}
			<div class="flex items-center justify-center gap-4 p-4 bg-gray-800 rounded-lg">
				<button
					on:click={previousSet}
					disabled={$workoutState.currentSet <= 1}
					class="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors"
				>
					← Previous Set
				</button>

				<div class="px-6 py-2 bg-blue-900/20 border border-blue-500/20 rounded-lg">
					<div class="text-center">
						<div class="text-lg font-bold">Set {$workoutState.currentSet}</div>
						<div class="text-sm text-gray-400">of {$workoutState.totalSets}</div>
					</div>
				</div>

				<button
					on:click={nextSet}
					disabled={$workoutState.currentSet >= $workoutState.totalSets}
					class="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors"
				>
					Next Set →
				</button>
			</div>
		{/if}
	</div>

	<!-- Configuration Modal -->
	{#if showConfigModal}
		<IntensityConfig
			isOpen={showConfigModal}
			on:save={handleConfigChange}
			on:cancel={() => (showConfigModal = false)}
		/>
	{/if}

	<!-- History Modal -->
	{#if showHistoryModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
				<div class="flex items-center justify-between p-6 border-b border-gray-700">
					<h2 class="text-xl font-bold">Workout History</h2>
					<button
						on:click={() => (showHistoryModal = false)}
						class="p-2 hover:bg-gray-700 rounded-lg transition-colors"
					>
						❌
					</button>
				</div>
				<div class="p-6">
					<IntensityHistory {userId} isVisible={true} />
				</div>
			</div>
		</div>
	{/if}
</div>
