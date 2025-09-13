<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { CheckCircle, TrendingDown, Minus, TrendingUp } from 'lucide-svelte';

	export let currentSet: number = 1;
	export let totalSets: number = 3;
	export let currentReps: number = 0;
	export let targetReps: number = 8;
	export let exerciseName: string = 'Exercise';
	export let isActive: boolean = false;

	const dispatch = createEventDispatcher();

	function completeSet(difficulty: 'easy' | 'moderate' | 'hard') {
		dispatch('setCompleted', {
			setNumber: currentSet,
			repsCompleted: currentReps,
			difficulty,
			timestamp: new Date().toISOString()
		});
	}

	function getDifficultyIcon(difficulty: string) {
		switch (difficulty) {
			case 'easy':
				return TrendingDown;
			case 'moderate':
				return Minus;
			case 'hard':
				return TrendingUp;
			default:
				return Minus;
		}
	}

	function getDifficultyColor(difficulty: string) {
		switch (difficulty) {
			case 'easy':
				return 'bg-green-500 active:bg-green-600';
			case 'moderate':
				return 'bg-blue-500 active:bg-blue-600';
			case 'hard':
				return 'bg-red-500 active:bg-red-600';
			default:
				return 'bg-gray-500 active:bg-gray-600';
		}
	}

	function getDifficultyText(difficulty: string) {
		switch (difficulty) {
			case 'easy':
				return 'Easy';
			case 'moderate':
				return 'Good';
			case 'hard':
				return 'Hard';
			default:
				return 'Done';
		}
	}
</script>

<div class="bg-gray-900 text-white rounded-lg p-4 max-w-sm mx-auto">
	<!-- Compact Header -->
	<div class="text-center mb-4">
		<div class="text-lg font-semibold truncate">{exerciseName}</div>
		<div class="text-2xl font-bold text-blue-400">
			{currentSet}/{totalSets}
		</div>
		<div class="text-sm text-gray-300">
			{currentReps}/{targetReps} reps
		</div>
	</div>

	<!-- Progress Ring (Wearable Style) -->
	<div class="flex justify-center mb-4">
		<div class="relative w-20 h-20">
			<!-- Background circle -->
			<svg class="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
				<path
					d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					class="text-gray-600"
				/>
				<!-- Progress circle -->
				<path
					d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					class="text-blue-400"
					stroke-dasharray={`${(currentReps / targetReps) * 100}, 100`}
				/>
			</svg>
			<!-- Center text -->
			<div class="absolute inset-0 flex items-center justify-center">
				<span class="text-sm font-medium">{Math.round((currentReps / targetReps) * 100)}%</span>
			</div>
		</div>
	</div>

	<!-- Large Touch Buttons -->
	<div class="space-y-2">
		<p class="text-center text-xs text-gray-400 mb-3">How did that feel?</p>

		<!-- Easy Button -->
		<button
			on:click={() => completeSet('easy')}
			class="w-full h-12 flex items-center justify-center rounded-lg text-white font-medium transition-colors {getDifficultyColor(
				'easy'
			)} touch-manipulation"
			disabled={!isActive}
		>
			<svelte:component this={getDifficultyIcon('easy')} size={18} class="mr-2" />
			{getDifficultyText('easy')}
		</button>

		<!-- Moderate Button -->
		<button
			on:click={() => completeSet('moderate')}
			class="w-full h-12 flex items-center justify-center rounded-lg text-white font-medium transition-colors {getDifficultyColor(
				'moderate'
			)} touch-manipulation"
			disabled={!isActive}
		>
			<svelte:component this={getDifficultyIcon('moderate')} size={18} class="mr-2" />
			{getDifficultyText('moderate')}
		</button>

		<!-- Hard Button -->
		<button
			on:click={() => completeSet('hard')}
			class="w-full h-12 flex items-center justify-center rounded-lg text-white font-medium transition-colors {getDifficultyColor(
				'hard'
			)} touch-manipulation"
			disabled={!isActive}
		>
			<svelte:component this={getDifficultyIcon('hard')} size={18} class="mr-2" />
			{getDifficultyText('hard')}
		</button>
	</div>

	<!-- Status Message -->
	{#if isActive}
		<div class="mt-3 p-2 bg-blue-900 rounded text-center">
			<p class="text-xs text-blue-200">Complete your reps, then tap how it felt</p>
		</div>
	{:else}
		<div class="mt-3 p-2 bg-gray-800 rounded text-center">
			<p class="text-xs text-gray-400">Rest timer active</p>
		</div>
	{/if}
</div>

<style>
	.touch-manipulation {
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
