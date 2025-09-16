<script>
	import { onMount } from 'svelte';
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

	/** @type {string} */
	export let userId;
	export let title = 'Key Recommendations';
	export let limit = 3;

	/** @type {AdaptiveRecommendation[]} */
	let recommendations = [];
	let loading = true;
	let error = null;

	// Load top recommendations
	async function loadRecommendations() {
		try {
			loading = true;
			error = null;

			// Load top recommendations (mock data for now)
			const topRecs = await getTopRecommendations(userId, limit);
			recommendations = topRecs;
		} catch (/** @type {any} */ err) {
			error = err.message || 'Failed to load recommendations';
			console.error('Error loading recommendations:', err);
		} finally {
			loading = false;
		}
	}

	// Mock function to get top recommendations
	async function getTopRecommendations(userId, limit) {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 300));

		const mockRecommendations = [
			{
				id: 'urgent_1',
				type: 'recovery',
				title: 'Prioritize Recovery',
				description: 'Your recent workouts have been intense. Consider adding rest days.',
				reasoning: 'High-intensity sessions detected. Recovery is crucial.',
				actions: [
					{
						type: 'rest_day',
						description: 'Take 1-2 rest days this week',
						parameters: { rest_days: '1-2' }
					}
				],
				priority: 'urgent',
				confidence: 92,
				createdAt: Date.now() - 6 * 60 * 60 * 1000
			},
			{
				id: 'high_1',
				type: 'workout',
				title: 'Increase Training Frequency',
				description: 'Add more workout days to accelerate progress.',
				reasoning: 'Your consistency is good but frequency could be higher.',
				actions: [
					{
						type: 'adjust_workout',
						description: 'Add 1-2 more workout days per week',
						parameters: { target_frequency: '4-5' }
					}
				],
				priority: 'high',
				confidence: 85,
				createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000
			},
			{
				id: 'high_2',
				type: 'nutrition',
				title: 'Optimize Protein Intake',
				description: 'Distribute protein more evenly throughout the day.',
				reasoning: 'Protein timing could be improved for better muscle synthesis.',
				actions: [
					{
						type: 'modify_nutrition',
						description: 'Aim for 20-40g protein per meal',
						parameters: { protein_per_meal: '20-40g' }
					}
				],
				priority: 'high',
				confidence: 78,
				createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000
			}
		];

		return mockRecommendations.slice(0, limit);
	}

	$: typeIcons = {
		workout: '💪',
		nutrition: '🥗',
		recovery: '😴',
		progression: '📈',
		plateau_buster: '🚀'
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
		// Navigate to full recommendations page
		window.location.href = '/recommendations';
	}

	function handleApplyRecommendation(recommendation) {
		console.log('Applying recommendation:', recommendation.title);
		// Handle applying the recommendation
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
				<div class="text-4xl mb-2">🎯</div>
				<p class="text-sm text-gray-600">No recommendations available</p>
				<p class="text-xs text-gray-500 mt-1">Check back later for personalized suggestions</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each recommendations as recommendation (recommendation.id)}
					<div
						class="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
						on:click={() => handleApplyRecommendation(recommendation)}
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
									💡 {recommendation.actions[0].description}
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
