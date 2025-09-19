<script lang="ts">
	import { api } from '../../../convex/_generated/api.js';
	import { onMount } from 'svelte';
	let onboardingUrl = '';
	let onboardingStatus = '';
	let error = '';

	// Replace with actual IDs from auth/user context
	let trainerId = '';
	let refreshUrl = window.location.href;
	let returnUrl = window.location.href;

	async function startStripeOnboarding() {
		error = '';
		onboardingStatus = 'Requesting Stripe onboarding link...';
		try {
			const result = await api.trainers.createStripeConnectOnboarding({
				trainerId,
				refreshUrl,
				returnUrl
			});
			onboardingUrl = result.onboardingUrl;
			onboardingStatus = 'Onboarding link ready!';
			window.open(onboardingUrl, '_blank');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to start onboarding.';
			onboardingStatus = '';
		}
	}
</script>

<div class="space-y-4">
	<button class="bg-primary text-white px-4 py-2 rounded" on:click={startStripeOnboarding}>
		Start Stripe Connect Onboarding
	</button>
	{#if onboardingStatus}
		<div class="text-blue-700">{onboardingStatus}</div>
	{/if}
	{#if error}
		<div class="text-red-600">{error}</div>
	{/if}
</div>
