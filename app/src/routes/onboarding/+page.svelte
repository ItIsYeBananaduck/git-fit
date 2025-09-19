<script lang="ts">
	import MedicalScreeningStep from '$lib/components/MedicalScreeningStep.svelte';
	import GoalIdentificationStep from '$lib/components/GoalIdentificationStep.svelte';
	import { goto } from '$app/navigation';

	// Simulate userId (replace with real auth/user context)
	let userId = 'currentUserId';

	// State for onboarding steps
	let step = 1;
	let medicalScreening = {
		injuries: [],
		conditions: [],
		notes: ''
	};
	let goalData = {
		primaryGoal: '',
		secondaryGoals: [],
		customGoal: ''
	};
	let submitting = false;
	let error = '';

	import { convex } from '$lib/convex';
	import { api } from '$lib/convex/_generated/api';

	async function saveMedicalScreening(data) {
		submitting = true;
		error = '';
		try {
			await convex.mutation(api.users.saveMedicalScreening, {
				userId,
				injuries: data.injuries,
				conditions: data.conditions,
				notes: data.notes
			});
			step = 2;
		} catch (e) {
			error = 'Failed to save. Please try again.';
		} finally {
			submitting = false;
		}
	}

	async function saveGoals(data) {
		submitting = true;
		error = '';
		try {
			await convex.mutation(api.goals.setUserGoals, {
				userId,
				primaryGoal: data.primaryGoal,
				secondaryGoals: data.secondaryGoals,
				details: {}
			});
			goto('/'); // Go to home or next onboarding step
		} catch (e) {
			error = 'Failed to save goals. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="onboarding-container">
	{#if step === 1}
		<MedicalScreeningStep
			initial={medicalScreening}
			on:submit={(e) => saveMedicalScreening(e.detail)}
		/>
	{:else if step === 2}
		<GoalIdentificationStep initial={goalData} on:submit={(e) => saveGoals(e.detail)} />
	{/if}
	{#if submitting}
		<div class="status">Saving...</div>
	{/if}
	{#if error}
		<div class="error">{error}</div>
	{/if}
</div>

<style>
	.onboarding-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background: #f6f8fa;
	}
	.status {
		margin-top: 1rem;
		color: #007aff;
	}
	.error {
		margin-top: 1rem;
		color: #d32f2f;
	}
</style>
