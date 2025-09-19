<script lang="ts">
	import { createEventDispatcher } from 'svelte';

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
				return '↓';
			case 'moderate':
				return '→';
			case 'hard':
				return '↑';
			default:
				return '→';
		}
	}

	function getDifficultyColor(difficulty: string) {
		switch (difficulty) {
			case 'easy':
				return 'bg-green-500 hover:bg-green-600';
			case 'moderate':
				return 'bg-blue-500 hover:bg-blue-600';
			case 'hard':
				return 'bg-red-500 hover:bg-red-600';
			default:
				return 'bg-gray-500 hover:bg-gray-600';
		}
	}

	function getDifficultyText(difficulty: string) {
		switch (difficulty) {
			case 'easy':
				return 'Too Easy';
			case 'moderate':
				return 'Just Right';
			case 'hard':
				return 'Too Hard';
			default:
				return 'Complete';
		}
	}
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
	<!-- Current Set Header -->
	<div class="text-center mb-6">
		<h3 class="text-xl font-semibold text-gray-900 mb-2">{exerciseName}</h3>
		<div class="text-3xl font-bold text-gray-900 mb-1">
			Set {currentSet} of {totalSets}
		</div>
		<div class="text-lg text-gray-600">
			{currentReps} / {targetReps} reps completed
		</div>
	</div>

	<!-- Progress Bar -->
	<div class="mb-6">
		<div class="w-full bg-gray-200 rounded-full h-3">
			<div
				class="bg-blue-600 h-3 rounded-full transition-all duration-300"
				style="width: {(currentReps / targetReps) * 100}%"
			></div>
		</div>
	</div>

	<!-- Set Completion Buttons -->
	<div class="space-y-3">
		<p class="text-center text-sm font-medium text-gray-700 mb-4">How did that set feel?</p>

		<!-- Too Easy Button -->
		<button
			on:click={() => completeSet('easy')}
			class="w-full flex items-center justify-center px-4 py-3 rounded-lg text-white font-medium transition-colors {getDifficultyColor(
				'easy'
			)}"
			disabled={!isActive}
		>
			<span class="mr-3">{getDifficultyIcon('easy')}</span>
			{getDifficultyText('easy')}
		</button>

		<!-- Moderate Button -->
		<button
			on:click={() => completeSet('moderate')}
			class="w-full flex items-center justify-center px-4 py-3 rounded-lg text-white font-medium transition-colors {getDifficultyColor(
				'moderate'
			)}"
			disabled={!isActive}
		>
			<span class="mr-3">{getDifficultyIcon('moderate')}</span>
			{getDifficultyText('moderate')}
		</button>

		<!-- Too Hard Button -->
		<button
			on:click={() => completeSet('hard')}
			class="w-full flex items-center justify-center px-4 py-3 rounded-lg text-white font-medium transition-colors {getDifficultyColor(
				'hard'
			)}"
			disabled={!isActive}
		>
			<span class="mr-3">{getDifficultyIcon('hard')}</span>
			{getDifficultyText('hard')}
		</button>
	</div>

	<!-- Instructions -->
	{#if isActive}
		<div class="mt-6 p-3 bg-blue-50 rounded-lg">
			<p class="text-sm text-blue-800 text-center">
				Complete your reps, then tap the button that best describes how the set felt
			</p>
		</div>
	{:else}
		<div class="mt-6 p-3 bg-gray-50 rounded-lg">
			<p class="text-sm text-gray-600 text-center">
				Rest timer will start when you begin the next set
			</p>
		</div>
	{/if}
</div>
