<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import favicon from '$lib/assets/favicon.svg';
	import Navigation from '$lib/components/Navigation.svelte';
	import AccessibilityUtils from '$lib/components/AccessibilityUtils.svelte';
	import GlobalAlice from '$lib/components/GlobalAlice.svelte';
	import '../app.css';

	let { children } = $props();

	// Page class for styling
	const pageClass = $derived((() => {
		const path = $page.url?.pathname || '/';
		if (path === '/') return 'page-home';
		if (path.startsWith('/workouts')) return 'page-workout';
		if (path.startsWith('/nutrition')) return 'page-nutrition';
		return 'page-other';
	})());
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta
		name="description"
		content="Adaptive fIt - AI-powered fitness platform for personalized training and nutrition"
	/>
	<meta name="theme-color" content="#3B82F6" />
	<title>Adaptive fIt - AI-Powered Fitness</title>
</svelte:head>

<!-- Skip to main content link -->
<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-lg z-50"
>
	Skip to main content
</a>

<div class="min-h-screen bg-background {pageClass}">
	<Navigation />
	<main id="main-content" class="container mx-auto px-safe py-6" tabindex="-1">
		{@render children?.()}
	</main>
</div>

<!-- Accessibility utilities (invisible but functional) -->
<AccessibilityUtils />

<!-- Alice AI companion on all pages -->
<GlobalAlice />
