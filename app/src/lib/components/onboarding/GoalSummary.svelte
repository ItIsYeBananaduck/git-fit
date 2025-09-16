<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let primaryGoal: string;
	export let secondaryGoals: string[];
	export let goalDetails: any;
	export let isLoading: boolean;

	const dispatch = createEventDispatcher();

	const goalTitles = {
		weight_loss: 'Weight Loss',
		muscle_gain: 'Muscle Gain',
		strength_training: 'Strength Training',
		endurance: 'Endurance',
		general_fitness: 'General Fitness',
		sports_performance: 'Sports Performance'
	};

	const secondaryGoalTitles = {
		improve_energy: 'Improve Energy Levels',
		build_muscle: 'Build Muscle',
		increase_flexibility: 'Increase Flexibility',
		improve_sleep: 'Improve Sleep Quality',
		reduce_stress: 'Reduce Stress',
		increase_strength: 'Increase Strength',
		lose_fat: 'Lose Body Fat',
		improve_endurance: 'Improve Endurance',
		enhance_recovery: 'Enhance Recovery',
		improve_form: 'Improve Exercise Form',
		track_progress: 'Track Progress',
		enhance_power: 'Enhance Power',
		improve_technique: 'Improve Technique',
		improve_speed: 'Improve Speed',
		improve_heart_health: 'Improve Heart Health',
		enhance_flexibility: 'Enhance Flexibility',
		improve_balance: 'Improve Balance',
		enhance_speed: 'Enhance Speed',
		improve_agility: 'Improve Agility',
		build_power: 'Build Power'
	};

	function confirmGoals() {
		dispatch('goalConfirmed');
	}

	function formatGoalDetails() {
		const details = [];

		if (goalDetails.targetWeight) {
			details.push(`Target Weight: ${goalDetails.targetWeight} lbs`);
		}
		if (goalDetails.timeline) {
			details.push(`Timeline: ${goalDetails.timeline} weeks`);
		}
		if (goalDetails.experience) {
			details.push(`Experience: ${goalDetails.experience}`);
		}
		if (goalDetails.focusAreas?.length > 0) {
			details.push(`Focus Areas: ${goalDetails.focusAreas.join(', ')}`);
		}
		if (goalDetails.targetDistance) {
			details.push(`Target Distance: ${goalDetails.targetDistance}`);
		}
		if (goalDetails.targetTime) {
			details.push(`Target Time: ${goalDetails.targetTime}`);
		}
		if (goalDetails.sport) {
			details.push(`Sport: ${goalDetails.sport}`);
		}
		if (goalDetails.position) {
			details.push(`Position: ${goalDetails.position}`);
		}

		return details;
	}
</script>

<div class="space-y-6">
	<div class="text-center">
		<h3 class="text-lg font-semibold text-gray-900 mb-2">Goal Summary</h3>
		<p class="text-gray-600">Review your goals and confirm to continue</p>
	</div>

	<!-- Primary Goal -->
	<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
		<div class="flex items-center mb-4">
			<div class="text-2xl mr-3">🎯</div>
			<div>
				<h4 class="text-lg font-semibold text-blue-900">Primary Goal</h4>
				<p class="text-blue-700">{goalTitles[primaryGoal] || primaryGoal}</p>
			</div>
		</div>

		{#if formatGoalDetails().length > 0}
			<div class="ml-9">
				<h5 class="font-medium text-blue-900 mb-2">Details:</h5>
				<ul class="text-sm text-blue-800 space-y-1">
					{#each formatGoalDetails() as detail}
						<li>• {detail}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>

	<!-- Secondary Goals -->
	{#if secondaryGoals.length > 0}
		<div class="bg-green-50 border border-green-200 rounded-lg p-6">
			<div class="flex items-center mb-4">
				<div class="text-2xl mr-3">📋</div>
				<div>
					<h4 class="text-lg font-semibold text-green-900">Secondary Goals</h4>
					<p class="text-green-700">
						{secondaryGoals.length} goal{secondaryGoals.length !== 1 ? 's' : ''} selected
					</p>
				</div>
			</div>

			<div class="ml-9">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
					{#each secondaryGoals as goalId}
						<div class="flex items-center text-sm text-green-800">
							<span class="mr-2">•</span>
							{secondaryGoalTitles[goalId] || goalId}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- AI Recommendations Preview -->
	<div class="bg-purple-50 border border-purple-200 rounded-lg p-6">
		<div class="flex items-center mb-4">
			<div class="text-2xl mr-3">🤖</div>
			<div>
				<h4 class="text-lg font-semibold text-purple-900">What You'll Get</h4>
				<p class="text-purple-700">Based on your goals, you'll receive:</p>
			</div>
		</div>

		<div class="ml-9">
			<ul class="text-sm text-purple-800 space-y-2">
				<li>• Personalized training programs tailored to your goals</li>
				<li>• AI-powered nutrition recommendations</li>
				<li>• Progress tracking and adaptive adjustments</li>
				<li>• Wearable device integration for optimal results</li>
				<li>• Expert guidance and support throughout your journey</li>
			</ul>
		</div>
	</div>

	<!-- Confirmation -->
	<div class="flex justify-end space-x-4">
		<button
			on:click={confirmGoals}
			disabled={isLoading}
			class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
		>
			{#if isLoading}
				<svg
					class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				Saving Goals...
			{:else}
				Confirm Goals & Continue
			{/if}
		</button>
	</div>
</div>
