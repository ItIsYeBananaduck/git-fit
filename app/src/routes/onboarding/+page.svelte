<script lang="ts">
	import MedicalScreeningStep from '$lib/components/MedicalScreeningStep.svelte';
	import { goto } from '$app/navigation';

	// Simulate userId (replace with real auth/user context)
	let userId = 'currentUserId';

	// State for medical screening
	let medicalScreening = {
		injuries: [],
		conditions: [],
		notes: ''
	};

	let submitting = false;
	let error = '';

	import { convex } from '$lib/convex';
	import { api } from 'convex/_generated/api';

	async function saveMedicalScreening(data) {
		submitting = true;
		error = '';
		try {
			// Call Convex mutation to save medical screening
			await convex.mutation(api.users.saveMedicalScreening, {
				userId,
				injuries: data.injuries,
				conditions: data.conditions,
				notes: data.notes
			});
			goto('/'); // Go to home or next onboarding step
		} catch (e) {
			error = 'Failed to save. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="onboarding-container">
	<MedicalScreeningStep
		initial={medicalScreening}
		on:submit={(e) => saveMedicalScreening(e.detail)}
	/>
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
