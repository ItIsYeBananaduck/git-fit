<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$lib/convex';
	import { aliceNavigationActions } from '$lib/stores/workoutStore';

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

	/** @type {string} */
	export let userId;
	export let title = 'Key Recommendations';
	export let limit = 3;

	/** @type {AdaptiveRecommendation[]} */
	let recommendations = [];
	let loading = true;
	let error = '';

	const client = useConvexClient();

	// Load top recommendations
	async function loadRecommendations() {
		try {
			loading = true;
			error = '';

			// Load recommendations from Convex
			const recs = await client.query(
				api.functions.adaptiveRecommendationsSimple.getAdaptiveRecommendations,
				{
					userId,
					limit
				}
			);
			recommendations = recs || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load recommendations';
			console.error('Error loading recommendations:', err);
		} finally {
			loading = false;
		}
	}

	$: typeIcons = {
		workout: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>',
		nutrition: '🥗',
		recovery: '😴',
		progression: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>',
		plateau_buster: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>'
	};

	$: priorityColors = {
		low: 'bg-gray-100 text-gray-700',
		medium: 'bg-yellow-100 text-yellow-700',
		high: 'bg-orange-100 text-orange-700',
		urgent: 'bg-red-100 text-red-700'
	};

	onMount(() => {
		loadRecommendations();
	});

	function handleViewAll() {
		// Navigate through Alice to full recommendations page
		aliceNavigationActions.quickActions.viewRecommendations();
	}

	function handleApplyRecommendation(/** @type {AdaptiveRecommendation} */ recommendation) {
		console.log('Applying recommendation:', recommendation.title);
		// Handle applying the recommendation
	}

	function handleRecommendationKeydown(
		/** @type {KeyboardEvent} */ event,
		/** @type {AdaptiveRecommendation} */ recommendation
	) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleApplyRecommendation(recommendation);
		}
	}
</script>

<div class="bg-white rounded-lg shadow-sm border p-6">
	<!-- Header -->
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-semibold text-gray-900">{title}</h3>
		<button on:click={handleViewAll} class="text-sm text-blue-600 hover:text-blue-800 font-medium">
			View All →
		</button>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="flex justify-center items-center py-8">
			<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
			<span class="ml-2 text-sm text-gray-600">Loading recommendations...</span>
		</div>
	{/if}

	<!-- Error State -->
	{#if error}
		<div class="text-center py-8">
			<div class="text-red-500 text-sm">{error}</div>
		</div>
	{/if}

	<!-- Recommendations -->
	{#if !loading && !error}
		{#if recommendations.length === 0}
			<div class="text-center py-8">
				<svg class="w-12 h-12 text-primary mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
				</svg>
				<p class="text-sm text-gray-600">No recommendations available</p>
				<p class="text-xs text-gray-500 mt-1">Check back later for personalized suggestions</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each recommendations as recommendation (recommendation.id)}
					<div
						class="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
						role="button"
						tabindex="0"
						aria-label="Apply recommendation: {recommendation.title}"
						on:click={() => handleApplyRecommendation(recommendation)}
						on:keydown={(event) => handleRecommendationKeydown(event, recommendation)}
						in:fade={{ duration: 300, delay: Math.random() * 200 }}
					>
						<!-- Recommendation Header -->
						<div class="flex items-start justify-between mb-2">
							<div class="flex items-center space-x-2">
								<div class="text-lg" aria-hidden="true">{typeIcons[recommendation.type]}</div>
								<div>
									<h4 class="text-sm font-medium text-gray-900">{recommendation.title}</h4>
									<div class="flex items-center space-x-2 mt-1">
										<span
											class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {priorityColors[
												recommendation.priority
											]}"
										>
											{recommendation.priority}
										</span>
										<span class="text-xs text-gray-500">
											{recommendation.confidence}% confidence
										</span>
									</div>
								</div>
							</div>
						</div>

						<!-- Description -->
						<p class="text-sm text-gray-600 mb-2">{recommendation.description}</p>

						<!-- Action Preview -->
						{#if recommendation.actions && recommendation.actions.length > 0}
							<div class="bg-blue-50 rounded-md p-2">
								<p class="text-xs text-blue-800 font-medium">
									<svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
									</svg>
									{recommendation.actions[0].description}
								</p>
							</div>
						{/if}

						<!-- Timestamp -->
						<div class="mt-2 text-xs text-gray-500">
							{new Date(recommendation.createdAt).toLocaleDateString()}
						</div>
					</div>
				{/each}
			</div>

			<!-- Footer -->
			<div class="mt-4 pt-4 border-t border-gray-200">
				<p class="text-xs text-gray-600 text-center">
					Recommendations are personalized based on your progress data
				</p>
			</div>
		{/if}
	{/if}
</div>
