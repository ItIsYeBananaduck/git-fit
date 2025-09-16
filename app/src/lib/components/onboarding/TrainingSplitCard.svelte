<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let recommendation: any;
	export let index: number;
	export let selectedSplit: any;

	const dispatch = createEventDispatcher();

	$: isSelected = selectedSplit && selectedSplit.name === recommendation.name;

	function selectSplit() {
		dispatch('select');
	}

	function getScoreColor(score: number) {
		if (score >= 90) return 'text-green-600';
		if (score >= 80) return 'text-blue-600';
		if (score >= 70) return 'text-yellow-600';
		return 'text-gray-600';
	}

	function getScoreBgColor(score: number) {
		if (score >= 90) return 'bg-green-100';
		if (score >= 80) return 'bg-blue-100';
		if (score >= 70) return 'bg-yellow-100';
		return 'bg-gray-100';
	}
</script>

<div
	class="bg-white rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl border-2 {isSelected
		? 'border-blue-500 bg-blue-50'
		: 'border-gray-200 hover:border-gray-300'}"
	on:click={selectSplit}
>
	<!-- Header -->
	<div class="flex items-start justify-between mb-4">
		<div class="flex-1">
			<h3 class="text-xl font-semibold text-gray-900 mb-1">
				{recommendation.name}
			</h3>
			<div class="flex items-center space-x-2">
				<span
					class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getScoreBgColor(
						recommendation.score
					)} {getScoreColor(recommendation.score)}"
				>
					{recommendation.score}% Match
				</span>
				{#if index === 0}
					<span
						class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
					>
						Recommended
					</span>
				{/if}
			</div>
		</div>

		{#if isSelected}
			<div class="ml-4">
				<div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
					<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
						></path>
					</svg>
				</div>
			</div>
		{/if}
	</div>

	<!-- Description -->
	<p class="text-gray-600 mb-4">
		{recommendation.description}
	</p>

	<!-- Weekly Structure -->
	<div class="mb-4">
		<h4 class="text-sm font-medium text-gray-900 mb-2">Weekly Structure:</h4>
		<div class="grid grid-cols-3 gap-2">
			{#each Object.entries(recommendation.weeklyStructure) as [type, count]}
				<div class="text-center">
					<div class="text-lg font-semibold text-gray-900">{count}</div>
					<div class="text-xs text-gray-600 capitalize">{type.replace('_', ' ')}</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Sample Days -->
	<div class="mb-4">
		<h4 class="text-sm font-medium text-gray-900 mb-2">Sample Week:</h4>
		<div class="space-y-1">
			{#each recommendation.split.slice(0, 3) as day}
				<div class="flex justify-between text-sm">
					<span class="text-gray-600">Day {day.day}:</span>
					<span class="text-gray-900">{day.focus}</span>
				</div>
			{/each}
			{#if recommendation.split.length > 3}
				<div class="text-sm text-gray-500 italic">
					+{recommendation.split.length - 3} more days...
				</div>
			{/if}
		</div>
	</div>

	<!-- Reasoning -->
	{#if recommendation.reasoning}
		<div class="bg-gray-50 rounded-lg p-3">
			<p class="text-sm text-gray-700">
				<span class="font-medium">Why this works:</span>
				{recommendation.reasoning}
			</p>
		</div>
	{/if}

	<!-- Selection Indicator -->
	<div class="mt-4 text-center">
		<button
			class="w-full py-2 px-4 rounded-lg font-medium transition-colors {isSelected
				? 'bg-blue-600 text-white'
				: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
		>
			{isSelected ? 'Selected' : 'Select This Split'}
		</button>
	</div>
</div>
