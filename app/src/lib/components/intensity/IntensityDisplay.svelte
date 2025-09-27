<!--
  IntensityDisplay.svelte
  Phase 3.5 - Frontend Components
  
  Main intensity display component showing real-time intensity score,
  breakdown, and recommendations during workouts.
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { intensityScoring } from '$lib/services/intensityScoring';
	import { voiceService } from '$lib/services/voiceService';
	import type { IntensityScore, LiveIntensityData } from '$lib/services/intensityScoring';

	// Props
	export let workoutSessionId: string | null = null;
	export let isActive: boolean = false;
	export let showBreakdown: boolean = true;
	export let showRecommendations: boolean = true;
	export let enableVoice: boolean = false;

	// State
	let currentScore: IntensityScore | null = null;
	let liveData: LiveIntensityData | null = null;
	let isLoading = true;
	let error: string | null = null;
	let updateInterval: number | null = null;

	// Reactive properties
	$: overallScore = currentScore?.overall || 0;
	$: scoreColor = getScoreColor(overallScore);
	$: trendIcon =
		liveData?.trend === 'increasing' ? '↗️' : liveData?.trend === 'decreasing' ? '↘️' : '➡️';

	onMount(() => {
		if (isActive && workoutSessionId) {
			startLiveUpdates();
		}
	});

	onDestroy(() => {
		if (updateInterval) {
			clearInterval(updateInterval);
		}
	});

	// Watch for active state changes
	$: if (isActive && workoutSessionId) {
		startLiveUpdates();
	} else {
		stopLiveUpdates();
	}

	function startLiveUpdates() {
		if (updateInterval) clearInterval(updateInterval);

		updateInterval = setInterval(async () => {
			try {
				liveData = intensityScoring.getLiveIntensityData();
				const history = intensityScoring.getScoreHistory();
				currentScore = history[history.length - 1] || null;
				isLoading = false;
				error = null;
			} catch (err) {
				error = err instanceof Error ? err.message : 'Failed to update intensity data';
				isLoading = false;
			}
		}, 1000); // Update every second
	}

	function stopLiveUpdates() {
		if (updateInterval) {
			clearInterval(updateInterval);
			updateInterval = null;
		}
	}

	function getScoreColor(score: number): string {
		if (score >= 85) return 'text-green-500';
		if (score >= 70) return 'text-blue-500';
		if (score >= 55) return 'text-yellow-500';
		if (score >= 40) return 'text-orange-500';
		return 'text-red-500';
	}

	function getScoreLabel(score: number): string {
		if (score >= 85) return 'Excellent';
		if (score >= 70) return 'Good';
		if (score >= 55) return 'Moderate';
		if (score >= 40) return 'Light';
		return 'Very Light';
	}

	async function toggleVoiceCoaching() {
		enableVoice = !enableVoice;
		if (enableVoice) {
			await voiceService.testVoice();
		} else {
			voiceService.stop();
		}
	}

	async function speakCurrentScore() {
		if (currentScore && enableVoice) {
			await voiceService.speakInstruction(
				`Current intensity: ${currentScore.overall}%. ${currentScore.feedback}`
			);
		}
	}
</script>

<div class="intensity-display bg-gray-900 text-white rounded-xl p-6 shadow-lg">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-3">
			<div class="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
			<h2 class="text-xl font-bold">Live Intensity</h2>
			<span class="text-2xl">{trendIcon}</span>
		</div>

		<div class="flex gap-2">
			<!-- Voice coaching toggle -->
			<button
				on:click={toggleVoiceCoaching}
				class="p-2 rounded-lg hover:bg-gray-700 transition-colors"
				class:bg-blue-600={enableVoice}
				class:bg-gray-700={!enableVoice}
				title="Toggle voice coaching"
			>
				{#if enableVoice}🔊{:else}🔇{/if}
			</button>

			<!-- Speak current score -->
			{#if enableVoice && currentScore}
				<button
					on:click={speakCurrentScore}
					class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
					title="Speak current score"
				>
					🎤
				</button>
			{/if}
		</div>
	</div>

	{#if isLoading}
		<div class="text-center py-8">
			<div
				class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"
			></div>
			<p class="text-gray-400">Loading intensity data...</p>
		</div>
	{:else if error}
		<div class="bg-red-900/50 border border-red-500 rounded-lg p-4 text-center">
			<p class="text-red-300">⚠️ {error}</p>
			<button
				on:click={() => isActive && startLiveUpdates()}
				class="mt-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
			>
				Retry
			</button>
		</div>
	{:else if !currentScore}
		<div class="text-center py-8 text-gray-400">
			<p>💪 Start your workout to see live intensity data</p>
		</div>
	{:else}
		<!-- Main Score Display -->
		<div class="text-center mb-8">
			<div class="relative inline-block">
				<!-- Circular progress ring -->
				<svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
					<!-- Background circle -->
					<circle
						cx="50"
						cy="50"
						r="40"
						stroke="rgb(55, 65, 81)"
						stroke-width="8"
						fill="transparent"
					/>
					<!-- Progress circle -->
					<circle
						cx="50"
						cy="50"
						r="40"
						stroke="currentColor"
						stroke-width="8"
						fill="transparent"
						stroke-dasharray="251.2"
						stroke-dashoffset={251.2 - (overallScore / 100) * 251.2}
						class="transition-all duration-1000 ease-out {scoreColor}"
						stroke-linecap="round"
					/>
				</svg>

				<!-- Score text -->
				<div class="absolute inset-0 flex items-center justify-center">
					<div class="text-center">
						<div class="text-3xl font-bold {scoreColor}">{overallScore}</div>
						<div class="text-xs text-gray-400">INTENSITY</div>
					</div>
				</div>
			</div>

			<div class="mt-4">
				<div class="text-lg font-semibold {scoreColor}">
					{getScoreLabel(overallScore)}
				</div>
				<div class="text-sm text-gray-400">
					Target: {liveData?.targetRange.min || 60}% - {liveData?.targetRange.max || 85}%
				</div>
			</div>
		</div>

		<!-- Breakdown Display -->
		{#if showBreakdown && currentScore.breakdown}
			<div class="mb-6">
				<h3 class="text-sm font-medium text-gray-300 mb-3">BREAKDOWN</h3>
				<div class="grid grid-cols-2 gap-3">
					<!-- Tempo -->
					<div class="bg-gray-800 rounded-lg p-3">
						<div class="flex items-center justify-between mb-1">
							<span class="text-xs text-gray-400">Tempo</span>
							<span class="text-sm font-medium">{Math.round(currentScore.breakdown.tempo)}%</span>
						</div>
						<div class="w-full bg-gray-700 rounded-full h-2">
							<div
								class="bg-blue-400 h-2 rounded-full transition-all duration-500"
								style="width: {currentScore.breakdown.tempo}%"
							></div>
						</div>
					</div>

					<!-- Motion Smoothness -->
					<div class="bg-gray-800 rounded-lg p-3">
						<div class="flex items-center justify-between mb-1">
							<span class="text-xs text-gray-400">Smoothness</span>
							<span class="text-sm font-medium"
								>{Math.round(currentScore.breakdown.motionSmoothness)}%</span
							>
						</div>
						<div class="w-full bg-gray-700 rounded-full h-2">
							<div
								class="bg-green-400 h-2 rounded-full transition-all duration-500"
								style="width: {currentScore.breakdown.motionSmoothness}%"
							></div>
						</div>
					</div>

					<!-- Rep Consistency -->
					<div class="bg-gray-800 rounded-lg p-3">
						<div class="flex items-center justify-between mb-1">
							<span class="text-xs text-gray-400">Consistency</span>
							<span class="text-sm font-medium"
								>{Math.round(currentScore.breakdown.repConsistency)}%</span
							>
						</div>
						<div class="w-full bg-gray-700 rounded-full h-2">
							<div
								class="bg-purple-400 h-2 rounded-full transition-all duration-500"
								style="width: {currentScore.breakdown.repConsistency}%"
							></div>
						</div>
					</div>

					<!-- User Feedback -->
					<div class="bg-gray-800 rounded-lg p-3">
						<div class="flex items-center justify-between mb-1">
							<span class="text-xs text-gray-400">Form</span>
							<span class="text-sm font-medium"
								>{Math.round(currentScore.breakdown.userFeedback)}%</span
							>
						</div>
						<div class="w-full bg-gray-700 rounded-full h-2">
							<div
								class="bg-yellow-400 h-2 rounded-full transition-all duration-500"
								style="width: {currentScore.breakdown.userFeedback}%"
							></div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Feedback and Recommendations -->
		{#if currentScore.feedback}
			<div class="mb-4 p-4 bg-gray-800 rounded-lg border-l-4 border-blue-400">
				<p class="text-sm text-gray-300">{currentScore.feedback}</p>
			</div>
		{/if}

		{#if showRecommendations && currentScore.recommendations && currentScore.recommendations.length > 0}
			<div class="space-y-2">
				<h3 class="text-sm font-medium text-gray-300">RECOMMENDATIONS</h3>
				{#each currentScore.recommendations as recommendation}
					<div class="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
						<span class="text-yellow-400 mt-0.5">💡</span>
						<p class="text-sm text-gray-300 flex-1">{recommendation}</p>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Live Stats Footer -->
		{#if liveData}
			<div class="mt-6 pt-4 border-t border-gray-700">
				<div class="grid grid-cols-3 gap-4 text-center">
					<div>
						<div class="text-xs text-gray-400">TREND</div>
						<div class="text-sm font-medium capitalize">
							{liveData.trend}
							{trendIcon}
						</div>
					</div>
					<div>
						<div class="text-xs text-gray-400">IN TARGET</div>
						<div class="text-sm font-medium">
							{Math.round(liveData.timeInTargetZone / 1000 / 60)}m
						</div>
					</div>
					<div>
						<div class="text-xs text-gray-400">AVG</div>
						<div class="text-sm font-medium">
							{Math.round(intensityScoring.getAverageIntensity())}%
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.intensity-display {
		min-height: 400px;
	}

	/* Custom animations */
	@keyframes pulse-glow {
		0%,
		100% {
			box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
		}
		50% {
			box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
		}
	}

	.animate-pulse-glow {
		animation: pulse-glow 2s ease-in-out infinite;
	}
</style>
