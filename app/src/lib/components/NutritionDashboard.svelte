<script lang="ts">
	import { onMount } from 'svelte';
	import {
		nutritionService,
		type NutritionInsights,
		type HydrationRecommendation,
		type HealthProfile,
		type RecoveryData
	} from '$lib/services/nutritionAI';
	import NutritionRecommendationsCard from './NutritionRecommendationsCard.svelte';

	export let userId: string;
	export let healthProfile: HealthProfile | null = null;
	export let recoveryData: RecoveryData | null = null;

	let insights: NutritionInsights | null = null;
	let hydrationRecs: HydrationRecommendation[] = [];
	let safetyStatus: any = null;
	let loading = {
		insights: false,
		hydration: false,
		safety: false
	};
	let errors = {
		insights: null as string | null,
		hydration: null as string | null,
		safety: null as string | null
	};

	// Current nutrition data (would come from user input or tracking)
	let currentNutrition = {
		calories: 1800,
		protein: 90,
		carbs: 180,
		fat: 70,
		fiber: 25,
		sugar: 45,
		sodium: 2000,
		water_ml: 1500
	};

	// Target goals (would come from user preferences or AI recommendations)
	let nutritionGoals = {
		calories: 2200,
		protein: 120,
		carbs: 250,
		fat: 85,
		fiber: 35,
		sugar: 50,
		sodium: 2300,
		water_ml: 3000
	};

	// Default health profile for testing
	const defaultHealthProfile: HealthProfile = {
		medical_conditions: [],
		allergies: ['peanuts'],
		medications: [],
		safety_flags: {
			diabetesFlag: false,
			heartConditionFlag: false,
			kidneyIssueFlag: false,
			digestiveIssueFlag: false,
			eatingDisorderHistory: false
		},
		metabolic_data: {
			bmr: 1650,
			tdee: 2200
		},
		body_weight_kg: 70
	};

	const defaultRecoveryData: RecoveryData = {
		date: new Date().toISOString().split('T')[0],
		recovery_score: 65,
		sleep_quality: 7,
		sleep_duration: 7.5,
		hrv_rmssd: 45,
		stress_level: 4,
		source: 'manual'
	};

	async function loadInsights() {
		if (!userId) return;

		loading.insights = true;
		errors.insights = null;

		try {
			const result = await nutritionService.getNutritionInsights(userId, 30); // Last 30 days
			if (result.success) {
				insights = result.insights;
			} else {
				errors.insights = result.error || 'Failed to load insights';
			}
		} catch (err) {
			errors.insights = err instanceof Error ? err.message : 'Unknown error occurred';
		} finally {
			loading.insights = false;
		}
	}

	async function loadHydrationRecommendations() {
		if (!userId) return;

		loading.hydration = true;
		errors.hydration = null;

		try {
			const result = await nutritionService.getHydrationRecommendations(
				userId,
				currentNutrition.water_ml,
				recoveryData || defaultRecoveryData,
				healthProfile || defaultHealthProfile
			);

			if (result.success) {
				hydrationRecs = result.recommendations;
			} else {
				errors.hydration = result.error || 'Failed to load hydration recommendations';
			}
		} catch (err) {
			errors.hydration = err instanceof Error ? err.message : 'Unknown error occurred';
		} finally {
			loading.hydration = false;
		}
	}

	async function performSafetyCheck() {
		if (!userId) return;

		loading.safety = true;
		errors.safety = null;

		try {
			const result = await nutritionService.performSafetyCheck(
				userId,
				currentNutrition,
				healthProfile || defaultHealthProfile
			);

			if (result.success) {
				safetyStatus = result.safety_status;
			} else {
				errors.safety = result.error || 'Failed to perform safety check';
			}
		} catch (err) {
			errors.safety = err instanceof Error ? err.message : 'Unknown error occurred';
		} finally {
			loading.safety = false;
		}
	}

	function getProgressPercentage(current: number, target: number): number {
		return Math.min(Math.round((current / target) * 100), 100);
	}

	function getProgressColor(percentage: number): string {
		if (percentage >= 90) return 'bg-green-500';
		if (percentage >= 70) return 'bg-yellow-500';
		if (percentage >= 50) return 'bg-orange-500';
		return 'bg-red-500';
	}

	function formatNumber(num: number, decimals: number = 0): string {
		return num.toFixed(decimals);
	}

	onMount(() => {
		if (userId) {
			loadInsights();
			loadHydrationRecommendations();
			performSafetyCheck();
		}
	});

	$: if (userId) {
		loadInsights();
		loadHydrationRecommendations();
		performSafetyCheck();
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
		<div class="flex items-center space-x-3">
			<div class="flex-shrink-0">
				<div
					class="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center"
				>
					<span class="text-white text-lg font-bold">🍎</span>
				</div>
			</div>
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Enhanced Nutrition AI Dashboard</h1>
				<p class="text-gray-600">
					AI-powered nutrition insights with recovery awareness and safety monitoring
				</p>
			</div>
		</div>
	</div>

	<!-- Safety Status -->
	{#if safetyStatus}
		<div class="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Safety Status</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div
					class="bg-{safetyStatus.overall_safe
						? 'green'
						: 'red'}-50 border border-{safetyStatus.overall_safe
						? 'green'
						: 'red'}-200 rounded-lg p-4"
				>
					<div class="flex items-center">
						<span class="text-2xl mr-2">{safetyStatus.overall_safe ? '✅' : '⚠️'}</span>
						<div>
							<h3 class="font-medium text-{safetyStatus.overall_safe ? 'green' : 'red'}-800">
								{safetyStatus.overall_safe ? 'Safe' : 'Safety Concerns'}
							</h3>
							<p class="text-sm text-{safetyStatus.overall_safe ? 'green' : 'red'}-600">
								Overall nutrition safety status
							</p>
						</div>
					</div>
				</div>

				{#if safetyStatus.alerts && safetyStatus.alerts.length > 0}
					<div class="md:col-span-2">
						<div class="space-y-2">
							{#each safetyStatus.alerts as alert}
								<div class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
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
											<h4 class="text-sm font-medium text-yellow-800">{alert.type}</h4>
											<p class="text-sm text-yellow-700">{alert.message}</p>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Nutrition Progress -->
	<div class="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Today's Nutrition Progress</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			{#each Object.entries(nutritionGoals) as [key, target]}
				{@const current = currentNutrition[key] || 0}
				{@const percentage = getProgressPercentage(current, target)}
				{@const progressColor = getProgressColor(percentage)}

				<div class="bg-gray-50 rounded-lg p-4">
					<div class="flex items-center justify-between mb-2">
						<h3 class="text-sm font-medium text-gray-900 capitalize">
							{key.replace('_', ' ')}
						</h3>
						<span class="text-xs text-gray-500">{percentage}%</span>
					</div>
					<div class="w-full bg-gray-200 rounded-full h-2 mb-2">
						<div
							class="h-2 rounded-full transition-all duration-300 {progressColor}"
							style="width: {percentage}%"
						></div>
					</div>
					<div class="flex justify-between text-xs text-gray-600">
						<span>{formatNumber(current, key.includes('water') ? 0 : 1)}</span>
						<span
							>{formatNumber(target, key.includes('water') ? 0 : 1)}
							{key.includes('water') ? 'ml' : key === 'calories' ? 'kcal' : 'g'}</span
						>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Hydration Recommendations -->
	{#if hydrationRecs.length > 0}
		<div class="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Hydration Recommendations</h2>
			<div class="space-y-4">
				{#each hydrationRecs as rec}
					<div class="border border-blue-200 rounded-lg p-4 bg-blue-50">
						<div class="flex items-start space-x-3">
							<div class="flex-shrink-0 mt-1">
								<span class="text-lg">💧</span>
							</div>
							<div class="flex-1">
								<h3 class="text-sm font-medium text-blue-900">{rec.title}</h3>
								<p class="text-sm text-blue-700 mt-1">{rec.description}</p>
								<div class="mt-2 text-xs text-blue-600">
									<span class="font-medium">Target:</span>
									{rec.target_amount_ml}ml
									{#if rec.timing}
										• <span class="font-medium">Timing:</span> {rec.timing}
									{/if}
									{#if rec.type}
										• <span class="font-medium">Type:</span> {rec.type}
									{/if}
								</div>
								{#if rec.reasoning}
									<div class="mt-2 text-xs text-blue-600">
										<span class="font-medium">Based on:</span>
										{#if rec.reasoning.activity_level}
											Activity level: {rec.reasoning.activity_level}
										{/if}
										{#if rec.reasoning.environmental_factors}
											• Environment: {rec.reasoning.environmental_factors.join(', ')}
										{/if}
										{#if rec.reasoning.recovery_considerations}
											• Recovery: {rec.reasoning.recovery_considerations}
										{/if}
									</div>
								{/if}
							</div>
							<div class="flex-shrink-0">
								<span
									class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {rec.priority ===
									'high'
										? 'bg-red-100 text-red-800'
										: rec.priority === 'medium'
											? 'bg-yellow-100 text-yellow-800'
											: 'bg-green-100 text-green-800'}"
								>
									{rec.priority}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Nutrition Insights -->
	{#if insights}
		<div class="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Nutrition Insights (Last 30 Days)</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<!-- Trends -->
				{#if insights.trends}
					<div class="space-y-4">
						<h3 class="text-sm font-medium text-gray-900">Trends</h3>
						{#each Object.entries(insights.trends) as [nutrient, trend]}
							<div class="bg-gray-50 rounded-lg p-3">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium capitalize">{nutrient}</span>
									<span
										class="text-xs px-2 py-1 rounded-full {trend.direction === 'improving'
											? 'bg-green-100 text-green-800'
											: trend.direction === 'declining'
												? 'bg-red-100 text-red-800'
												: 'bg-gray-100 text-gray-800'}"
									>
										{trend.direction}
									</span>
								</div>
								<p class="text-xs text-gray-600 mt-1">{trend.change}% change</p>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Performance Metrics -->
				{#if insights.performance_metrics}
					<div class="space-y-4">
						<h3 class="text-sm font-medium text-gray-900">Performance Impact</h3>
						<div class="bg-gray-50 rounded-lg p-3">
							<div class="text-sm font-medium">Recovery Score Correlation</div>
							<div class="text-xs text-gray-600 mt-1">
								{formatNumber(insights.performance_metrics.recovery_correlation * 100)}% correlation
								with nutrition
							</div>
						</div>
						<div class="bg-gray-50 rounded-lg p-3">
							<div class="text-sm font-medium">Sleep Quality Impact</div>
							<div class="text-xs text-gray-600 mt-1">
								{formatNumber(insights.performance_metrics.sleep_impact * 100)}% correlation
							</div>
						</div>
					</div>
				{/if}

				<!-- Recommendations Summary -->
				{#if insights.recommendations_summary}
					<div class="space-y-4">
						<h3 class="text-sm font-medium text-gray-900">Recommendations Summary</h3>
						<div class="bg-gray-50 rounded-lg p-3">
							<div class="text-sm font-medium">Adherence Rate</div>
							<div class="text-xs text-gray-600 mt-1">
								{formatNumber(insights.recommendations_summary.adherence_rate * 100)}%
							</div>
						</div>
						<div class="bg-gray-50 rounded-lg p-3">
							<div class="text-sm font-medium">Most Effective Category</div>
							<div class="text-xs text-gray-600 mt-1">
								{insights.recommendations_summary.most_effective_category}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- AI Recommendations Component -->
	<NutritionRecommendationsCard
		{userId}
		{healthProfile}
		{recoveryData}
		currentIntake={{
			calories: currentNutrition.calories,
			protein: currentNutrition.protein,
			carbs: currentNutrition.carbs,
			fat: currentNutrition.fat,
			hydration: currentNutrition.water_ml / 1000
		}}
		goals={{
			calories: nutritionGoals.calories,
			protein: nutritionGoals.protein,
			carbs: nutritionGoals.carbs,
			fat: nutritionGoals.fat,
			hydration: nutritionGoals.water_ml / 1000
		}}
		autoRefresh={true}
	/>
</div>

<style>
	/* Custom styles for the nutrition dashboard */
	.transition-all {
		transition-property: all;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 300ms;
	}
</style>
