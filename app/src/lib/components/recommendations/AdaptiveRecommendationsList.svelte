<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import AdaptiveRecommendationCard from './AdaptiveRecommendationCard.svelte';
	import { api } from '$lib/convex';

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

	/** @type {AdaptiveRecommendation[]} */
	let recommendations = [];
	let loading = true;
	let error = null;
	let filter = 'all'; // all, urgent, high, medium, low
	let typeFilter = 'all'; // all, workout, nutrition, recovery, progression, plateau_buster
	let sortBy = 'priority'; // priority, confidence, newest, oldest

	// Load recommendations
	async function loadRecommendations() {
		try {
			loading = true;
			error = null;

			// Load adaptive recommendations
			// Note: This uses mock data for now - replace with actual API when available
			const adaptiveRecs = await generateMockRecommendations(userId);

			recommendations = adaptiveRecs;
		} catch (/** @type {any} */ err) {
			error = err.message || 'Failed to load recommendations';
			console.error('Error loading recommendations:', err);
		} finally {
			loading = false;
		}
	}

	// Mock recommendations generator (replace with actual API call)
	async function generateMockRecommendations(userId) {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 500));

		const mockRecommendations = [
			{
				id: 'rec_1',
				type: 'workout',
				title: 'Increase Training Frequency',
				description: 'Based on your progress, you could benefit from more frequent workouts.',
				reasoning:
					'Your workout consistency has been good, but increasing frequency could accelerate your progress toward your muscle gain goals.',
				actions: [
					{
						type: 'adjust_workout',
						description: 'Add 1-2 more workout days per week',
						parameters: { current_frequency: 3, target_frequency: '4-5', focus: 'compound_lifts' }
					}
				],
				priority: 'high',
				confidence: 85,
				createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000
			},
			{
				id: 'rec_2',
				type: 'nutrition',
				title: 'Optimize Protein Timing',
				description: 'Distribute your protein intake more evenly throughout the day.',
				reasoning:
					'Your total protein intake is good, but spreading it across meals could improve muscle protein synthesis.',
				actions: [
					{
						type: 'modify_nutrition',
						description: 'Aim for 20-40g protein per meal',
						parameters: { meals_per_day: 4, protein_per_meal: '20-40g' }
					}
				],
				priority: 'medium',
				confidence: 78,
				createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000
			},
			{
				id: 'rec_3',
				type: 'recovery',
				title: 'Prioritize Sleep Quality',
				description: 'Your recent workouts have been intense. Focus on better sleep.',
				reasoning:
					'Sleep quality affects recovery and performance. Your recent high-intensity sessions suggest you need more recovery time.',
				actions: [
					{
						type: 'rest_day',
						description: 'Aim for 7-9 hours of quality sleep',
						parameters: { target_hours: '7-9', focus: 'sleep_hygiene' }
					}
				],
				priority: 'urgent',
				confidence: 92,
				createdAt: Date.now() - 6 * 60 * 60 * 1000
			},
			{
				id: 'rec_4',
				type: 'progression',
				title: 'Progressive Overload Strategy',
				description: 'Implement systematic progression in your compound lifts.',
				reasoning:
					'Your bench press has stalled. A structured progression plan could help break through this plateau.',
				actions: [
					{
						type: 'increase_intensity',
						description: 'Increase bench press weight by 5-10lbs weekly',
						parameters: {
							exercise: 'bench_press',
							progression: '5-10lbs_weekly',
							period: '4_weeks'
						}
					}
				],
				priority: 'high',
				confidence: 88,
				createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000
			},
			{
				id: 'rec_5',
				type: 'plateau_buster',
				title: 'Break Through Strength Plateau',
				description: 'Try a deload week followed by a new progression cycle.',
				reasoning:
					'Your squat progress has been stagnant for 3 weeks. A strategic deload could help you break through.',
				actions: [
					{
						type: 'change_exercise',
						description: 'Take a deload week, then try squat variations',
						parameters: { deload_percentage: 60, duration: '1_week', variation: 'pause_squats' }
					}
				],
				priority: 'medium',
				confidence: 82,
				createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000
			}
		];

		return mockRecommendations;
	}

	// Filter and sort recommendations
	$: filteredRecommendations = recommendations
		.filter((/** @type {AdaptiveRecommendation} */ rec) => {
			// Priority filter
			if (filter !== 'all' && rec.priority !== filter) return false;

			// Type filter
			if (typeFilter !== 'all' && rec.type !== typeFilter) return false;

			return true;
		})
		.sort((/** @type {AdaptiveRecommendation} */ a, /** @type {AdaptiveRecommendation} */ b) => {
			switch (sortBy) {
				case 'priority':
					const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
					return priorityOrder[b.priority] - priorityOrder[a.priority];
				case 'confidence':
					return b.confidence - a.confidence;
				case 'newest':
					return b.createdAt - a.createdAt;
				case 'oldest':
					return a.createdAt - b.createdAt;
				default:
					return 0;
			}
		});

	// Get unique types for filter
	$: availableTypes = [
		'all',
		...new Set(recommendations.map((/** @type {AdaptiveRecommendation} */ r) => r.type))
	];

	// Statistics
	$: stats = {
		total: recommendations.length,
		urgent: recommendations.filter(
			(/** @type {AdaptiveRecommendation} */ r) => r.priority === 'urgent'
		).length,
		high: recommendations.filter((/** @type {AdaptiveRecommendation} */ r) => r.priority === 'high')
			.length,
		medium: recommendations.filter(
			(/** @type {AdaptiveRecommendation} */ r) => r.priority === 'medium'
		).length,
		low: recommendations.filter((/** @type {AdaptiveRecommendation} */ r) => r.priority === 'low')
			.length
	};

	onMount(() => {
		loadRecommendations();
	});

	function handleRecommendationAction(event) {
		const { recommendation, action } = event.detail;
		console.log('Recommendation action:', recommendation.title, action);
		// Handle the action (e.g., apply to workout plan, update nutrition goals, etc.)
	}

	function handleRecommendationDismiss(event) {
		const { recommendation } = event.detail;
		console.log('Recommendation dismissed:', recommendation.title);
		// Mark as dismissed in backend
	}

	function handleRecommendationApply(event) {
		const { recommendation } = event.detail;
		console.log('Recommendation applied:', recommendation.title);
		// Apply the recommendation to user's plan
	}
</script>

<div class="adaptive-recommendations-container">
	<!-- Header -->
	<div class="mb-6">
		<h2 class="text-2xl font-bold text-gray-900 mb-2">Adaptive Recommendations</h2>
		<p class="text-gray-600">Personalized suggestions based on your progress and performance</p>
	</div>

	<!-- Statistics -->
	<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
		<div class="bg-white p-4 rounded-lg shadow-sm border">
			<div class="text-2xl font-bold text-gray-900">{stats.total}</div>
			<div class="text-sm text-gray-600">Total</div>
		</div>
		<div class="bg-white p-4 rounded-lg shadow-sm border">
			<div class="text-2xl font-bold text-red-600">{stats.urgent}</div>
			<div class="text-sm text-gray-600">Urgent</div>
		</div>
		<div class="bg-white p-4 rounded-lg shadow-sm border">
			<div class="text-2xl font-bold text-orange-600">{stats.high}</div>
			<div class="text-sm text-gray-600">High</div>
		</div>
		<div class="bg-white p-4 rounded-lg shadow-sm border">
			<div class="text-2xl font-bold text-yellow-600">{stats.medium}</div>
			<div class="text-sm text-gray-600">Medium</div>
		</div>
		<div class="bg-white p-4 rounded-lg shadow-sm border">
			<div class="text-2xl font-bold text-gray-600">{stats.low}</div>
			<div class="text-sm text-gray-600">Low</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white p-4 rounded-lg shadow-sm border mb-6">
		<div class="flex flex-wrap gap-4">
			<!-- Priority Filter -->
			<div>
				<label for="priority-filter" class="block text-sm font-medium text-gray-700 mb-1"
					>Priority</label
				>
				<select
					id="priority-filter"
					bind:value={filter}
					class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">All Priorities</option>
					<option value="urgent">Urgent</option>
					<option value="high">High</option>
					<option value="medium">Medium</option>
					<option value="low">Low</option>
				</select>
			</div>

			<!-- Type Filter -->
			<div>
				<label for="type-filter" class="block text-sm font-medium text-gray-700 mb-1">Type</label>
				<select
					id="type-filter"
					bind:value={typeFilter}
					class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{#each availableTypes as type}
						<option value={type}>
							{type === 'all'
								? 'All Types'
								: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
						</option>
					{/each}
				</select>
			</div>

			<!-- Sort By -->
			<div>
				<label for="sort-filter" class="block text-sm font-medium text-gray-700 mb-1">Sort By</label
				>
				<select
					id="sort-filter"
					bind:value={sortBy}
					class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="priority">Priority</option>
					<option value="confidence">Confidence</option>
					<option value="newest">Newest</option>
					<option value="oldest">Oldest</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-2 text-gray-600">Analyzing your data...</span>
		</div>
	{/if}

	<!-- Error State -->
	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">Error loading recommendations</h3>
					<div class="mt-2 text-sm text-red-700">{error}</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Recommendations Grid -->
	{#if !loading && !error}
		{#if filteredRecommendations.length === 0}
			<div class="text-center py-12">
				<div class="text-6xl mb-4">🎯</div>
				<h3 class="text-lg font-medium text-gray-900 mb-2">No recommendations found</h3>
				<p class="text-gray-600">
					Try adjusting your filters or check back later for new personalized suggestions.
				</p>
			</div>
		{:else}
			<div class="space-y-6">
				{#each filteredRecommendations as recommendation (recommendation.id)}
					<div in:fade={{ duration: 300, delay: Math.random() * 200 }}>
						<AdaptiveRecommendationCard
							{recommendation}
							on:action={handleRecommendationAction}
							on:dismiss={handleRecommendationDismiss}
							on:apply={handleRecommendationApply}
						/>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Recommendation Tips -->
	{#if !loading && filteredRecommendations.length > 0}
		<div class="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-6 w-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-blue-800">How Recommendations Work</h3>
					<div class="mt-2 text-sm text-blue-700">
						<ul class="list-disc list-inside space-y-1">
							<li>
								Recommendations are generated based on your workout data, nutrition logs, and
								progress patterns
							</li>
							<li>Higher priority recommendations address immediate needs or opportunities</li>
							<li>
								Confidence scores indicate how certain we are about the recommendation's
								effectiveness
							</li>
							<li>Apply recommendations to automatically adjust your training plan</li>
							<li>Dismiss recommendations you don't want to see again</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
