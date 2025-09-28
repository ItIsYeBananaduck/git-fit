<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fitbitActions } from '$lib/stores/fitbit';
	import type { PageData } from './$types';

	export let data: PageData;

	onMount(() => {
		if (data.success && data.tokens) {
			// Store tokens in the Fitbit store
			fitbitActions.setTokens(data.tokens);

			// Redirect to adaptive training with success message
			goto(data.redirectTo || '/adaptive-training?connected=fitbit');
		} else {
			// Handle error case
			goto('/adaptive-training?error=fitbit_connection_failed');
		}
	});
</script>

<svelte:head>
	<title>Connecting Fitbit - Adaptive fIt</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
		<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
			<div
				class="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"
			></div>
		</div>

		<h1 class="text-xl font-semibold text-gray-900 mb-2">Connecting your Fitbit</h1>
		<p class="text-gray-600 mb-4">Please wait while we securely connect your Fitbit data...</p>

		{#if data.success}
			<div class="text-green-600 text-sm">
				✓ Connection successful! Redirecting to your dashboard...
			</div>
		{:else}
			<div class="text-red-600 text-sm">✗ Connection failed. Redirecting back...</div>
		{/if}
	</div>
</div>
