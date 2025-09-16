<script>
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';

	/**
	 * @typedef {Object} RecommendationAction
	 * @property {'adjust_workout'|'modify_nutrition'|'rest_day'|'increase_intensity'|'change_exercise'|'add_supplement'} type
	 * @property {string} description
	 * @property {Object} parameters
	 */

	/**
	 * @typedef {Object} AdaptiveRecommendation
	 * @property {string} id
	 * @property {'workout'|'nutrition'|'recovery'|'progression'|'plateau_buster'} type
	 * @property {string} title
	 * @property {string} description
	 * @property {string} reasoning
	 * @property {RecommendationAction[]} actions
	 * @property {'low'|'medium'|'high'|'urgent'} priority
	 * @property {number} confidence
	 * @property {number|undefined} expiresAt
	 * @property {number} createdAt
	 */

	/** @type {AdaptiveRecommendation} */
	export let recommendation;
	export let showActions = true;

	const dispatch = createEventDispatcher();

	function handleActionClick(action) {
		dispatch('action', { recommendation, action });
	}

	function handleDismiss() {
		dispatch('dismiss', { recommendation });
	}

	function handleApply() {
		dispatch('apply', { recommendation });
	}

	$: typeColors = {
		workout: 'bg-blue-100 border-blue-300 text-blue-800',
		nutrition: 'bg-green-100 border-green-300 text-green-800',
		recovery: 'bg-purple-100 border-purple-300 text-purple-800',
		progression: 'bg-orange-100 border-orange-300 text-orange-800',
		plateau_buster: 'bg-red-100 border-red-300 text-red-800'
	};

	$: priorityColors = {
		low: 'bg-gray-100 text-gray-700',
		medium: 'bg-yellow-100 text-yellow-700',
		high: 'bg-orange-100 text-orange-700',
		urgent: 'bg-red-100 text-red-700'
	};

	$: typeIcons = {
		workout: '💪',
		nutrition: '🥗',
		recovery: '😴',
		progression: '📈',
		plateau_buster: '🚀'
	};

	$: confidenceColor =
		recommendation.confidence >= 80
			? 'text-green-600'
			: recommendation.confidence >= 60
				? 'text-yellow-600'
				: 'text-red-600';
</script>

<div
	class="adaptive-recommendation-card bg-white rounded-lg shadow-md border-2 p-6 transition-all duration-200 hover:shadow-lg {typeColors[
		recommendation.type
	]}"
>
	<!-- Header -->
	<div class="flex items-start justify-between mb-4">
		<div class="flex items-center space-x-3">
			<div class="text-2xl" aria-hidden="true">{typeIcons[recommendation.type]}</div>
			<div>
				<h3 class="text-lg font-semibold text-gray-900 mb-1">{recommendation.title}</h3>
				<div class="flex items-center space-x-2">
					<span
						class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize {priorityColors[
							recommendation.priority
						]}"
					>
						{recommendation.priority}
					</span>
					<span class="text-xs {confidenceColor}">
						{recommendation.confidence}% confidence
					</span>
				</div>
			</div>
		</div>

		<!-- Action buttons -->
		<div class="flex space-x-2">
			<button
				on:click={handleApply}
				class="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
				aria-label="Apply this recommendation"
			>
				Apply
			</button>
			<button
				on:click={handleDismiss}
				class="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
				aria-label="Dismiss this recommendation"
			>
				Dismiss
			</button>
		</div>
	</div>

	<!-- Description -->
	<p class="text-gray-700 mb-3">{recommendation.description}</p>

	<!-- Reasoning -->
	<div class="bg-gray-50 rounded-lg p-3 mb-4">
		<p class="text-sm text-gray-600">
			<span class="font-medium">Why this recommendation:</span>
			{recommendation.reasoning}
		</p>
	</div>

	<!-- Actions -->
	{#if showActions && recommendation.actions && recommendation.actions.length > 0}
		<div class="space-y-2">
			<h4 class="text-sm font-medium text-gray-900">Suggested Actions:</h4>
			{#each recommendation.actions as action}
				<div class="flex items-center justify-between bg-white bg-opacity-50 rounded-lg p-3">
					<div class="flex-1">
						<p class="text-sm text-gray-700">{action.description}</p>
						{#if action.parameters && Object.keys(action.parameters).length > 0}
							<div class="mt-1 text-xs text-gray-500">
								{#each Object.entries(action.parameters) as [key, value]}
									<span class="mr-3">
										<span class="font-medium">{key.replace('_', ' ')}:</span>
										{value}
									</span>
								{/each}
							</div>
						{/if}
					</div>
					<button
						on:click={() => handleActionClick(action)}
						class="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
						aria-label="Take action: {action.description}"
					>
						Do This
					</button>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Timestamp -->
	<div class="mt-4 pt-3 border-t border-gray-200">
		<p class="text-xs text-gray-500">
			Recommended {new Date(recommendation.createdAt).toLocaleDateString()}
			{#if recommendation.expiresAt}
				• Expires {new Date(recommendation.expiresAt).toLocaleDateString()}
			{/if}
		</p>
	</div>
</div>
