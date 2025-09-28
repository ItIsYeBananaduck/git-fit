<!-- File: +page.svelte for nutrition route -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { isAuthenticated, user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import NutritionTracker from '$lib/components/NutritionTracker.svelte';

	// Redirect to login if not authenticated
	onMount(() => {
		if (!$isAuthenticated) {
			goto('/auth/login');
		}
	});
</script>

<svelte:head>
	<title>Nutrition Tracking - Adaptive fIt</title>
</svelte:head>

{#if $isAuthenticated}
	<div class="min-h-screen bg-gray-50">
		<div class="container mx-auto py-8">
			<NutritionTracker />
		</div>
	</div>
{:else}
	<div class="flex items-center justify-center min-h-screen">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
	</div>
{/if}
