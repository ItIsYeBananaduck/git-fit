<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import favicon from '$lib/assets/favicon.svg';
	import Navigation from '$lib/components/Navigation.svelte';

	let { children } = $props();

	// Initialize authentication on app startup
	onMount(async () => {
		await authStore.initialize();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<Navigation />
	<main class="container mx-auto px-4 py-8">
		{@render children?.()}
	</main>
</div>
