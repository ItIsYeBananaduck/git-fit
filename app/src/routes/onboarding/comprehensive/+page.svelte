<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import DemographicsStep from '$lib/components/onboarding/DemographicsStep.svelte';
	import GoalSelector from '$lib/components/onboarding/GoalSelector.svelte';
	import SecondaryGoals from '$lib/components/onboarding/SecondaryGoals.svelte';
	import EquipmentPreferenceStep from '$lib/components/onboarding/EquipmentPreferenceStep.svelte';
	import RestLogicExplanation from '$lib/components/onboarding/RestLogicExplanation.svelte';
	import CoachSelection from '$lib/components/onboarding/CoachSelection.svelte';
	import { getAuthUser } from '$lib/stores/auth';
	import { api } from '$lib/convex/_generated/api';
	import type { Id } from '$lib/convex/_generated/dataModel.js';

	let currentStep = 0;
	let user: any = null;
	let isLoading = false;

	// Form data
	let demographics = {
		height: '',
		weight: '',
		age: '',
		gender: '',
		activityLevel: '',
		experience: ''
	};

	let primaryGoal = '';
	let goalDetails: any = {};
	let secondaryGoals: string[] = [];
	let equipment = {
		equipment: [],
		preferences: { include: [], avoid: [] }
	};
	let selectedCoach: 'alice' | 'aiden' | null = null;

	const steps = [
		{
			title: 'About You',
			component: DemographicsStep,
			description: 'Tell us about yourself to personalize your experience'
		},
		{
			title: 'Primary Goal',
			component: GoalSelector,
			description: 'Choose your main fitness objective'
		},
		{
			title: 'Secondary Goals',
			component: SecondaryGoals,
			description: 'Select supporting goals for comprehensive progress'
		},
		{
			title: 'Equipment & Preferences',
			component: EquipmentPreferenceStep,
			description: 'Let us know what equipment you have and your preferences'
		},
		{
			title: 'Smart Rest System',
			component: RestLogicExplanation,
			description: 'Learn how our AI optimizes your rest periods'
		},
		{
			title: 'Choose Your Coach',
			component: CoachSelection,
			description: 'Select your AI coach for personalized guidance'
		}
	];

	onMount(async () => {
		user = await getAuthUser();
		if (!user) {
			goto('/auth/login');
			return;
		}

		// Check if user has Pro subscription and hasn't selected a coach yet
		try {
			const coachPref = await api.users.getCoachPreference({ userId: user._id });
			const hasProSubscription = user.role === 'client' && user.subscriptionType === 'pro';

			// Only include coach selection for Pro users who haven't selected a coach
			if (!hasProSubscription || coachPref) {
				steps.pop(); // Remove coach selection step
			}
		} catch (error) {
			console.error('Error checking coach preference:', error);
			steps.pop(); // Remove coach selection step on error
		}
	});

	function handleDemographicsSubmit(event: CustomEvent) {
		demographics = event.detail;
		nextStep();
	}

	function handlePrimaryGoalSelected(event: CustomEvent) {
		primaryGoal = event.detail.goal;
		goalDetails = event.detail.details;
		nextStep();
	}

	function handleSecondaryGoalsSelected(event: CustomEvent) {
		secondaryGoals = event.detail.goals;
		nextStep();
	}

	function handleEquipmentSubmit(event: CustomEvent) {
		equipment = event.detail;
		nextStep();
	}

	function handleRestExplanationAcknowledge() {
		nextStep();
	}

	function handleCoachSelected(event: CustomEvent) {
		selectedCoach = event.detail.coach;
		nextStep();
	}

	function handleCoachConfirmed(event: CustomEvent) {
		selectedCoach = event.detail.coach;
		saveAllData();
	}

	async function saveAllData() {
		if (!user) return;

		isLoading = true;
		try {
			// Save demographics
			await api.users.updateUserProfile({
				userId: user._id,
				updates: {
					height: parseInt(demographics.height),
					weight: parseInt(demographics.weight),
					dateOfBirth: calculateDOB(demographics.age),
					fitnessLevel: demographics.experience,
					goals: [primaryGoal, ...secondaryGoals]
				}
			});

			// Save goals
			await api.goals.createPrimaryGoal({
				userId: user._id,
				goalType: primaryGoal,
				details: goalDetails,
				priority: 1
			});

			for (let i = 0; i < secondaryGoals.length; i++) {
				await api.goals.createSecondaryGoal({
					userId: user._id,
					goalType: secondaryGoals[i],
					priority: i + 2
				});
			}

			// Save equipment preferences
			await api.userConfigs.updateUserConfig({
				userId: user._id,
				configJson: JSON.stringify({
					equipment: equipment.equipment,
					preferences: equipment.preferences,
					activityLevel: demographics.activityLevel
				})
			});

			// Save coach preference if selected
			if (selectedCoach) {
				await api.users.setCoachPreference({
					userId: user._id,
					coachType: selectedCoach
				});
			}

			// Navigate to dashboard
			goto('/dashboard');
		} catch (error) {
			console.error('Error saving onboarding data:', error);
			// Handle error - could show error message
		} finally {
			isLoading = false;
		}
	}

	function calculateDOB(age: string): string {
		const currentYear = new Date().getFullYear();
		const birthYear = currentYear - parseInt(age);
		return `${birthYear}-01-01`; // Approximate DOB
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

	function getProgressPercentage(): number {
		return ((currentStep + 1) / steps.length) * 100;
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
	<div class="container mx-auto px-4 py-8 max-w-6xl">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold text-gray-900 mb-4">Welcome to Adaptive fIt</h1>
			<p class="text-xl text-gray-600 max-w-2xl mx-auto">
				Let's personalize your fitness journey with our AI-powered training system
			</p>
		</div>

		<!-- Progress Bar -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-4">
				{#each steps as step, index}
					<div class="flex items-center flex-1">
						<div
							class="flex items-center justify-center w-12 h-12 rounded-full text-sm font-semibold transition-all {index <=
							currentStep
								? 'bg-blue-600 text-white shadow-lg'
								: 'bg-gray-200 text-gray-600'}"
						>
							{index + 1}
						</div>
						{#if index < steps.length - 1}
							<div
								class="flex-1 h-1 mx-4 rounded transition-all {index < currentStep
									? 'bg-blue-600'
									: 'bg-gray-200'}"
							></div>
						{/if}
					</div>
				{/each}
			</div>

			<div class="text-center">
				<h2 class="text-2xl font-bold text-gray-900 mb-2">{steps[currentStep].title}</h2>
				<p class="text-gray-600">{steps[currentStep].description}</p>
				<div class="mt-4 bg-gray-200 rounded-full h-2">
					<div
						class="bg-blue-600 h-2 rounded-full transition-all duration-500"
						style="width: {getProgressPercentage()}%"
					></div>
				</div>
				<p class="text-sm text-gray-500 mt-2">Step {currentStep + 1} of {steps.length}</p>
			</div>
		</div>

		<!-- Step Content -->
		<div class="bg-white rounded-2xl shadow-xl p-8 mb-8">
			{#if currentStep === 0}
				<DemographicsStep on:submit={handleDemographicsSubmit} />
			{:else if currentStep === 1}
				<GoalSelector on:goalSelected={handlePrimaryGoalSelected} {user} />
			{:else if currentStep === 2}
				<SecondaryGoals on:goalsSelected={handleSecondaryGoalsSelected} {primaryGoal} {user} />
			{:else if currentStep === 3}
				<EquipmentPreferenceStep on:submit={handleEquipmentSubmit} />
			{:else if currentStep === 4}
				<RestLogicExplanation on:acknowledge={handleRestExplanationAcknowledge} />
			{:else if steps[currentStep] && steps[currentStep].title === 'Choose Your Coach'}
				<CoachSelection
					on:select={handleCoachSelected}
					on:confirm={handleCoachConfirmed}
					{selectedCoach}
				/>
			{/if}
		</div>

		<!-- Navigation -->
		{#if currentStep > 0 && currentStep < steps.length - 1}
			<div class="flex justify-between">
				<button
					on:click={prevStep}
					class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
				>
					← Previous
				</button>
				<div></div>
			</div>
		{/if}

		<!-- Loading State -->
		{#if isLoading}
			<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div class="bg-white rounded-lg p-8 text-center">
					<div
						class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
					></div>
					<p class="text-gray-900 font-medium">Setting up your personalized experience...</p>
					<p class="text-gray-600 text-sm mt-2">This will only take a moment</p>
				</div>
			</div>
		{/if}
	</div>
</div>
