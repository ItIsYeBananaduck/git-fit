<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import favicon from '$lib/assets/favicon.svg';
	import Navigation from '$lib/components/Navigation.svelte';
	import AccessibilityUtils from '$lib/components/AccessibilityUtils.svelte';

	let { children } = $props();

	// Initialize authentication on app startup
	onMount(async () => {
		await authStore.initialize();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta
		name="description"
		content="Technically Fit - AI-powered fitness platform for personalized training and nutrition"
	/>
	<meta name="theme-color" content="#3B82F6" />
	<title>Technically Fit - AI-Powered Fitness</title>
</svelte:head>

<!-- Skip to main content link -->
<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-lg z-50"
>
	Skip to main content
</a>

<div class="min-h-screen bg-gray-50">
	<Navigation />
	<main id="main-content" class="container mx-auto px-4 py-8" tabindex="-1">
		{@render children?.()}
	</main>
</div>

<!-- Accessibility utilities (invisible but functional) -->
<AccessibilityUtils />
