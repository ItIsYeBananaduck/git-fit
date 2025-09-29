<script lang="ts">
	import { onMount } from 'svelte';
	import {
		nutritionService,
		type NutritionRecommendation,
		type HealthProfile,
		type RecoveryData,
		type NutritionIntake,
		type NutritionGoals
	} from '$lib/services/nutritionAI';

	export let userId: string;
	export let healthProfile: HealthProfile | null = null;
	export let recoveryData: RecoveryData | null = null;
	export let currentIntake: NutritionIntake | null = null;
	export let goals: NutritionGoals | null = null;
	export let autoRefresh: boolean = false;

	let recommendations: NutritionRecommendation[] = [];
	let adjustedGoals: NutritionGoals | null = null;
	let adjustmentsMade: string[] = [];
	let safetyAlerts: any[] = [];
	let loading = false;
	let error: string | null = null;
	let lastUpdated: Date | null = null;

	// Default values for testing
	const defaultHealthProfile: HealthProfile = {
		medical_conditions: [],
		allergies: [],
		medications: [],
		safety_flags: {
			diabetesFlag: false,
			heartConditionFlag: false,
			kidneyIssueFlag: false,
			digestiveIssueFlag: false,
			eatingDisorderHistory: false
		},
		metabolic_data: {},
		body_weight_kg: 70
	};

	const defaultRecoveryData: RecoveryData = {
		date: new Date().toISOString().split('T')[0],
		recovery_score: 65,
		sleep_quality: 7,
		sleep_duration: 7.5,
		source: 'manual'
	};

	const defaultIntake: NutritionIntake = {
		calories: 1800,
		protein: 90,
		carbs: 180,
		fat: 70,
		hydration: 1.5
	};

	const defaultGoals: NutritionGoals = {
		calories: 2200,
		protein: 120,
		carbs: 250,
		fat: 85,
		hydration: 3.0
	};

	async function loadRecommendations() {
		if (!userId) return;

		loading = true;
		error = null;

		try {
			const result = await nutritionService.getNutritionRecommendations(
				userId,
				healthProfile || defaultHealthProfile,
				recoveryData || defaultRecoveryData,
				currentIntake || defaultIntake,
				goals || defaultGoals
			);

			if (result.success) {
				recommendations = result.recommendations;
				adjustedGoals = result.adjusted_goals;
				adjustmentsMade = result.adjustments_made;
				safetyAlerts = result.safety_alerts;
				lastUpdated = new Date();
			} else {
				error = result.error || 'Failed to load recommendations';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error occurred';
		} finally {
			loading = false;
		}
	}

	async function handleRecommendationAction(
		rec: NutritionRecommendation,
		accepted: boolean,
		implemented: boolean = false
	) {
		try {
			await nutritionService.provideFeedback(
				userId,
				`${rec.recommendation_type}_${Date.now()}`, // Simple ID generation
				{
					accepted,
					implemented,
					feedback: accepted ? 'Accepted recommendation' : 'Declined recommendation'
				}
			);

			// Remove the recommendation from the list after feedback
			recommendations = recommendations.filter((r) => r !== rec);
		} catch (err) {
			console.error('Error providing feedback:', err);
		}
	}

	function formatPriority(priority: string): string {
		return priority.charAt(0).toUpperCase() + priority.slice(1);
	}

	function getPriorityIcon(priority: string): string {
		switch (priority.toLowerCase()) {
			case 'high':
				return '🔴';
			case 'medium':
				return '🟡';
			case 'low':
				return '🟢';
			default:
				return '⚪';
		}
	}

	function formatActionText(rec: NutritionRecommendation): string {
		if (rec.target_value && rec.target_unit) {
			return `${rec.action.replace(/_/g, ' ')}: ${rec.target_value}${rec.target_unit}`;
		}
		return rec.action.replace(/_/g, ' ');
	}

	onMount(() => {
		loadRecommendations();

		if (autoRefresh) {
			const interval = setInterval(loadRecommendations, 5 * 60 * 1000); // Refresh every 5 minutes
			return () => clearInterval(interval);
		}
	});
</script>

<div class="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center space-x-3">
			<div class="flex-shrink-0">
				<div
					class="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center"
				>
					<span class="text-white text-sm font-bold">🥗</span>
				</div>
			</div>
			<div>
				<h3 class="text-lg font-semibold text-gray-900">AI Nutrition Recommendations</h3>
				<p class="text-sm text-gray-500">
					{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
				</p>
			</div>
		</div>
		<button
			on:click={loadRecommendations}
			disabled={loading}
			class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
		>
			{#if loading}
				<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				Loading...
			{:else}
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					></path>
				</svg>
				Refresh
			{/if}
		</button>
	</div>

	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						></path>
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">Error Loading Recommendations</h3>
					<p class="text-sm text-red-700 mt-1">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	{#if safetyAlerts.length > 0}
		<div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
							clip-rule="evenodd"
						></path>
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-yellow-800">Safety Alerts</h3>
					<div class="mt-2 space-y-1">
						{#each safetyAlerts as alert}
							<p class="text-sm text-yellow-700">
								<span class="font-medium">{alert.type}:</span>
								{alert.message}
							</p>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if adjustmentsMade.length > 0}
		<div class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clip-rule="evenodd"
						></path>
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-blue-800">Recovery-Based Adjustments</h3>
					<div class="mt-2 space-y-1">
						{#each adjustmentsMade as adjustment}
							<p class="text-sm text-blue-700">{adjustment}</p>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if recommendations.length === 0 && !loading && !error}
		<div class="text-center py-8">
			<div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
				<span class="text-2xl">✅</span>
			</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
			<p class="text-gray-500">No new nutrition recommendations at this time.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each recommendations as rec}
				<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
					<div class="flex items-start space-x-3">
						<div class="flex-shrink-0 mt-1">
							<span class="text-lg">{getPriorityIcon(rec.priority)}</span>
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center justify-between mb-2">
								<h4 class="text-sm font-medium text-gray-900">{rec.title}</h4>
								<div class="flex items-center space-x-2">
									<span
										class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {rec.priority ===
										'high'
											? 'bg-red-100 text-red-800'
											: rec.priority === 'medium'
												? 'bg-yellow-100 text-yellow-800'
												: 'bg-green-100 text-green-800'}"
									>
										{formatPriority(rec.priority)}
									</span>
									{#if rec.safety_checked}
										<span
											class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
										>
											✓ Safety Checked
										</span>
									{/if}
								</div>
							</div>

							<p class="text-sm text-gray-600 mb-3">{rec.description}</p>

							<div class="flex items-center justify-between text-xs text-gray-500 mb-3">
								<span>Action: {formatActionText(rec)}</span>
								<span>Confidence: {Math.round(rec.confidence * 100)}%</span>
							</div>

							{#if rec.reasoning}
								<div class="text-xs text-gray-500 mb-3">
									<span class="font-medium">Based on:</span>
									{#if rec.reasoning.recovery_score}
										Recovery score: {rec.reasoning.recovery_score}
									{/if}
									{#if rec.reasoning.sleep_quality}
										• Sleep quality: {rec.reasoning.sleep_quality}/10
									{/if}
									{#if rec.reasoning.medical_considerations}
										• Medical considerations: {rec.reasoning.medical_considerations.join(', ')}
									{/if}
								</div>
							{/if}

							<div class="flex items-center space-x-2">
								<button
									on:click={() => handleRecommendationAction(rec, true, true)}
									class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
								>
									Accept & Implement
								</button>
								<button
									on:click={() => handleRecommendationAction(rec, true, false)}
									class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								>
									Accept Later
								</button>
								<button
									on:click={() => handleRecommendationAction(rec, false, false)}
									class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								>
									Dismiss
								</button>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Custom styles for the nutrition recommendations card */
	.animate-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
