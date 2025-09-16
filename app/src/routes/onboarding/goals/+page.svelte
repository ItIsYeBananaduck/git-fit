<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import GoalSelector from '$lib/components/onboarding/GoalSelector.svelte';
	import SecondaryGoals from '$lib/components/onboarding/SecondaryGoals.svelte';
	import GoalSummary from '$lib/components/onboarding/GoalSummary.svelte';
	import { getAuthUser } from '$lib/stores/auth';
	import { api } from '$lib/convex/_generated/api';
	import type { Id } from '$lib/convex/_generated/dataModel';

	let currentStep = 0;
	let user: any = null;
	let primaryGoal: string = '';
	let secondaryGoals: string[] = [];
	let goalDetails: any = {};
	let isLoading = false;

	const steps = [
		{ title: 'Primary Goal', component: GoalSelector },
		{ title: 'Secondary Goals', component: SecondaryGoals },
		{ title: 'Goal Summary', component: GoalSummary }
	];

	onMount(async () => {
		user = await getAuthUser();
		if (!user) {
			goto('/auth/login');
			return;
		}
	});

	function handlePrimaryGoalSelected(event: CustomEvent) {
		primaryGoal = event.detail.goal;
		goalDetails = event.detail.details;
		nextStep();
	}

	function handleSecondaryGoalsSelected(event: CustomEvent) {
		secondaryGoals = event.detail.goals;
		nextStep();
	}

	function handleGoalConfirmed() {
		saveGoals();
	}

	async function saveGoals() {
		if (!user) return;

		isLoading = true;
		try {
			// Save primary goal
			await api.goals.createPrimaryGoal({
				userId: user._id,
				goalType: primaryGoal,
				details: goalDetails,
				priority: 1
			});

			// Save secondary goals
			for (let i = 0; i < secondaryGoals.length; i++) {
				await api.goals.createSecondaryGoal({
					userId: user._id,
					goalType: secondaryGoals[i],
					priority: i + 2
				});
			}

			// Navigate to next onboarding step
			goto('/onboarding/training-splits');
		} catch (error) {
			console.error('Error saving goals:', error);
			// Handle error
		} finally {
			isLoading = false;
		}
	}

	function nextStep() {
		if (currentStep < steps.length - 1) {
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep--;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
	<div class="container mx-auto px-4 py-8">
		<!-- Progress Bar -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-4">
				{#each steps as step, index}
					<div class="flex items-center">
						<div
							class="flex items-center justify-center w-10 h-10 rounded-full {index <= currentStep
								? 'bg-blue-600 text-white'
								: 'bg-gray-300 text-gray-600'}"
						>
							{index + 1}
						</div>
						{#if index < steps.length - 1}
							<div
								class="w-12 h-1 mx-2 {index < currentStep ? 'bg-blue-600' : 'bg-gray-300'}"
							></div>
						{/if}
					</div>
				{/each}
			</div>
			<h1 class="text-2xl font-bold text-gray-900 mb-2">
				{steps[currentStep].title}
			</h1>
			<p class="text-gray-600">
				{#if currentStep === 0}
					Choose your main fitness goal to get personalized recommendations
				{:else if currentStep === 1}
					Select up to 3 secondary goals to support your primary objective
				{:else}
					Review your goals and confirm to continue
				{/if}
			</p>
		</div>

		<!-- Step Content -->
		<div class="bg-white rounded-lg shadow-lg p-8">
			{#if currentStep === 0}
				<GoalSelector on:goalSelected={handlePrimaryGoalSelected} {user} />
			{:else if currentStep === 1}
				<SecondaryGoals on:goalsSelected={handleSecondaryGoalsSelected} {primaryGoal} {user} />
			{:else}
				<GoalSummary
					on:goalConfirmed={handleGoalConfirmed}
					{primaryGoal}
					{secondaryGoals}
					{goalDetails}
					{isLoading}
				/>
			{/if}
		</div>

		<!-- Navigation Buttons -->
		{#if currentStep > 0 && currentStep < steps.length - 1}
			<div class="flex justify-between mt-8">
				<button
					on:click={prevStep}
					class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
				>
					Previous
				</button>
				<div></div>
				<!-- Spacer -->
			</div>
		{/if}
	</div>
</div>
