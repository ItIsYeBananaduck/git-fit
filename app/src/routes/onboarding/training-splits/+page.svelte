<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getAuthUser } from '$lib/stores/auth';
	import { api } from '$lib/convex/_generated/api';
	import TrainingSplitCard from '$lib/components/onboarding/TrainingSplitCard.svelte';
	import SplitComparison from '$lib/components/onboarding/SplitComparison.svelte';

	let user: any = null;
	let recommendations: any[] = [];
	let selectedSplit: any = null;
	let isLoading = true;
	let showComparison = false;

	onMount(async () => {
		user = await getAuthUser();
		if (!user) {
			goto('/auth/login');
			return;
		}

		await loadRecommendations();
	});

	async function loadRecommendations() {
		try {
			const result = await api.trainingSplits.getTrainingSplitRecommendations({
				userId: user._id
			});

			recommendations = result.recommendations;
		} catch (error) {
			console.error('Error loading recommendations:', error);
		} finally {
			isLoading = false;
		}
	}

	function selectSplit(split: any) {
		selectedSplit = split;
	}

	function toggleComparison() {
		showComparison = !showComparison;
	}

	function continueToNextStep() {
		// Save selected training split preference
		if (selectedSplit) {
			// TODO: Save user's training split preference
			console.log('Selected split:', selectedSplit);
		}

		goto('/onboarding/complete');
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
	<div class="container mx-auto px-4 py-8">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-4">Your Training Split Recommendations</h1>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				Based on your goals, here are personalized training split recommendations. Each option is
				designed to help you achieve your fitness objectives efficiently.
			</p>
		</div>

		{#if isLoading}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		{:else if recommendations.length === 0}
			<div class="text-center py-12">
				<div class="text-6xl mb-4">🤔</div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">No Recommendations Found</h3>
				<p class="text-gray-600 mb-4">Please complete your goal setup first.</p>
				<button
					on:click={() => goto('/onboarding/goals')}
					class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
					aria-label="Set your goals"
					tabindex="0"
					on:keydown={(e) =>
						(e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), goto('/onboarding/goals'))}
				>
					Set Your Goals
				</button>
			</div>
		{:else}
			<!-- Recommendations Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
				{#each recommendations as recommendation, index}
					<TrainingSplitCard
						{recommendation}
						{index}
						{selectedSplit}
						on:select={() => selectSplit(recommendation)}
					/>
				{/each}
			</div>

			<!-- Comparison Section -->
			{#if recommendations.length > 1}
				<div class="bg-white rounded-lg shadow-lg p-6 mb-8">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-xl font-semibold text-gray-900">Compare Training Splits</h2>
						<button
							on:click={toggleComparison}
							class="text-blue-600 hover:text-blue-700 font-medium"
							aria-label={showComparison ? 'Hide comparison' : 'Show comparison'}
							tabindex="0"
							on:keydown={(e) =>
								(e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggleComparison())}
						>
							{showComparison ? 'Hide' : 'Show'} Comparison
						</button>
					</div>

					{#if showComparison}
						<SplitComparison {recommendations} />
					{/if}
				</div>
			{/if}

			<!-- Selected Split Details -->
			{#if selectedSplit}
				<div class="bg-white rounded-lg shadow-lg p-6 mb-8">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">
						{selectedSplit.name} - Detailed Overview
					</h2>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<!-- Weekly Structure -->
						<div>
							<h3 class="text-lg font-medium text-gray-900 mb-3">Weekly Structure</h3>
							<div class="space-y-2">
								{#each Object.entries(selectedSplit.weeklyStructure) as [type, count]}
									<div class="flex justify-between">
										<span class="capitalize">{type.replace('_', ' ')}:</span>
										<span class="font-medium">{count} days</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Sample Weekly Split -->
						<div>
							<h3 class="text-lg font-medium text-gray-900 mb-3">Sample Week</h3>
							<div class="space-y-1">
								{#each selectedSplit.split as day}
									<div class="flex justify-between text-sm">
										<span>Day {day.day}:</span>
										<span>{day.focus}</span>
									</div>
								{/each}
							</div>
						</div>
					</div>

					<div class="mt-6">
						<p class="text-gray-700">{selectedSplit.description}</p>
					</div>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="flex justify-center space-x-4">
				<button
					on:click={() => goto('/onboarding/goals')}
					class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
					aria-label="Back to goals"
					tabindex="0"
					on:keydown={(e) =>
						(e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), goto('/onboarding/goals'))}
				>
					Back to Goals
				</button>

				{#if selectedSplit}
					<button
						on:click={continueToNextStep}
						class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
						aria-label={`Continue with ${selectedSplit.name}`}
						tabindex="0"
						on:keydown={(e) =>
							(e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), continueToNextStep())}
					>
						Continue with {selectedSplit.name}
					</button>
				{:else}
					<button
						disabled
						class="px-8 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed"
						aria-disabled="true"
					>
						Select a Training Split
					</button>
					<style>
						button:focus {
							box-shadow: 0 0 0 3px #2563eb55;
							outline: none;
						}
					</style>
				{/if}
			</div>
		{/if}
	</div>
</div>
