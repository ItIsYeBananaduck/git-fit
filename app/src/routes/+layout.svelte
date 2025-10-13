<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
	import Navigation from '$lib/components/Navigation.svelte';
	import AccessibilityUtils from '$lib/components/AccessibilityUtils.svelte';
	import AliceAvatar from '$lib/components/AliceAvatar.svelte';
	import '../app.css';

	let { children } = $props();

	// Page class for styling
	const pageClass = $derived(
		(() => {
			const path = $page.url?.pathname || '/';
			if (path === '/') return 'page-home';
			if (path.startsWith('/workouts')) return 'page-workout';
			if (path.startsWith('/nutrition')) return 'page-nutrition';
			return 'page-other';
		})()
	);

	// Alice state management
	let aliceSubscriptionTier: 'free' | 'trial' | 'paid' | 'trainer' = $state('trial'); // Demo with trial
	let aliceMode: 'idle' | 'workout' | 'nutrition' | 'analytics' | 'radio' = $state('idle');
	let zenMode = $state(false);
	let playMode = $state(false);
	let heartRate = $state(0);
	let intensity = $state(0);
	let isBackgroundMonitoring = $state(false);
	let aliceCustomPattern = $state('solid');
	let aliceCustomColor = $state('#1a1a2e');
	let aliceIrisColor = $state('#00BFFF'); // Default bright blue iris
	let aliceIrisPattern = $state('solid'); // Default solid iris
	let aliceEyeState: 'normal' | 'wink' | 'droop' | 'excited' = $state('normal');
	let aliceTwoEyes = $state(false);
	let aliceRogueEye = $state(false);
	// Workout card state
	let aliceShowWorkoutCard = $state(false);
	let aliceWorkoutData = $state(null);

	// Listen for demo page updates and workout events
	onMount(() => {
		function handleAliceDemoUpdate(event: Event) {
			const customEvent = event as CustomEvent;
			const {
				subscriptionTier,
				customPattern,
				customColor,
				irisColor,
				irisPattern,
				mode,
				zenMode: demoZenMode,
				playMode: demoPlayMode,
				heartRate: demoHeartRate,
				intensity: demoIntensity,
				isBackgroundMonitoring: demoBackgroundMonitoring,
				eyeState: demoEyeState,
				twoEyes,
				rogueEye,
				showWorkoutCard,
				workoutData
			} = customEvent.detail;
			aliceSubscriptionTier = subscriptionTier;
			aliceCustomPattern = customPattern;
			aliceCustomColor = customColor;
			aliceIrisColor = irisColor;
			aliceIrisPattern = irisPattern;
			aliceMode = mode;
			zenMode = demoZenMode;
			playMode = demoPlayMode;
			heartRate = demoHeartRate;
			intensity = demoIntensity;
			isBackgroundMonitoring = demoBackgroundMonitoring;
			aliceEyeState = demoEyeState || 'normal';
			aliceTwoEyes = twoEyes || false;
			aliceRogueEye = rogueEye || false;
			aliceShowWorkoutCard = showWorkoutCard || false;
			aliceWorkoutData = workoutData || null;
		}

		// Workout event handlers for Alice integration
		function handleWorkoutStarted(event: Event) {
			const customEvent = event as CustomEvent;
			const { showWorkoutCard, workoutData, mode } = customEvent.detail;

			console.log('🎯 Layout received workout-started event:', workoutData?.name);
			aliceShowWorkoutCard = showWorkoutCard;
			aliceWorkoutData = workoutData;
			aliceMode = mode;

			// Set workout-appropriate Alice appearance
			intensity = workoutData?.intensityScore || 0;
			heartRate = 75 + intensity * 0.5; // Simulate heart rate based on intensity
		}

		function handleWorkoutEnded(event: Event) {
			const customEvent = event as CustomEvent;
			const { showWorkoutCard, workoutData, mode } = customEvent.detail;

			console.log('🏁 Layout received workout-ended event');
			aliceShowWorkoutCard = showWorkoutCard;
			aliceWorkoutData = workoutData;
			aliceMode = mode;
			intensity = 0;
			heartRate = 70; // Resting heart rate
		}

		function handleWorkoutUpdated(event: Event) {
			const customEvent = event as CustomEvent;
			const { workoutData } = customEvent.detail;

			console.log('📊 Layout received workout-updated event');
			aliceWorkoutData = workoutData;
			intensity = workoutData?.intensityScore || 0;
		}

		function handleWorkoutCardToggled(event: Event) {
			const customEvent = event as CustomEvent;
			const { showWorkoutCard, workoutData } = customEvent.detail;

			console.log('🔄 Layout received workout-card-toggled event');
			aliceShowWorkoutCard = showWorkoutCard;
			aliceWorkoutData = workoutData;
		}

		// Add all event listeners
		window.addEventListener('alice-demo-update', handleAliceDemoUpdate);
		window.addEventListener('workout-started', handleWorkoutStarted);
		window.addEventListener('workout-ended', handleWorkoutEnded);
		window.addEventListener('workout-updated', handleWorkoutUpdated);
		window.addEventListener('workout-card-toggled', handleWorkoutCardToggled);

		// Cleanup function
		return () => {
			window.removeEventListener('alice-demo-update', handleAliceDemoUpdate);
			window.removeEventListener('workout-started', handleWorkoutStarted);
			window.removeEventListener('workout-ended', handleWorkoutEnded);
			window.removeEventListener('workout-updated', handleWorkoutUpdated);
			window.removeEventListener('workout-card-toggled', handleWorkoutCardToggled);
		};
	});

	// Handle Alice interactions
	function handleAliceTapped(event: CustomEvent) {
		console.log('Alice tapped:', event.detail);
	}

	function handleModeSelected(event: CustomEvent) {
		const { mode } = event.detail;
		aliceMode = mode;
		console.log('🎯 Alice mode selected:', mode);
		console.log('🧭 Navigating to mode:', mode);

		// Navigate based on mode
		switch (mode) {
			case 'workout':
				console.log('🏋️ Navigating to /workouts');
				goto('/workouts');
				break;
			case 'nutrition':
				console.log('🍎 Navigating to /nutrition');
				goto('/nutrition');
				break;
			case 'analytics':
				// Use dashboard as analytics fallback
				console.log('📊 Navigating to /dashboard (analytics fallback)');
				goto('/dashboard');
				break;
			case 'radio':
				// Use home as radio fallback for now
				console.log('🎵 Navigating to / (radio fallback)');
				goto('/');
				break;
			default:
				console.log('❌ Unknown mode:', mode);
				goto('/');
		}

		console.log('✅ Navigation completed for mode:', mode);
	}

	function handlePlayModeActivated(event: CustomEvent) {
		playMode = true;
		console.log('Alice play mode activated');
	}
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

<div class="app-container">
	<!-- Navigation at the very top -->
	<Navigation />

	<!-- Alice section after navigation -->
	<div class="alice-section">
		<!-- Alice AI companion -->
		<AliceAvatar
			color={aliceCustomColor}
			strain={intensity}
			calories={0}
			{heartRate}
			expression={aliceEyeState === 'excited'
				? 'energetic'
				: aliceEyeState === 'droop'
					? 'focused'
					: 'calm'}
			size={200}
		/>
	</div>

	<!-- Scrollable content section -->
	<div class="content-section {pageClass}">
		<main id="main-content" class="container mx-auto px-safe py-6" tabindex="-1">
			{@render children?.()}
		</main>
	</div>
</div>

<!-- Accessibility utilities (invisible but functional) -->
<AccessibilityUtils />

<style>
	.app-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.alice-section {
		position: fixed;
		top: 60px; /* Position after typical navigation height */
		left: 0;
		right: 0;
		height: 200px; /* Exactly 200px to match Alice */
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #1a1a1a 0%, #0d1117 100%);
		border-bottom: 1px solid rgba(0, 191, 255, 0.2);
		z-index: 1000;
	}

	.content-section {
		margin-top: 260px; /* Navigation height (60px) + Alice height (200px) */
		flex: 1;
		overflow-y: auto;
		background: var(--background, #ffffff);
	}

	/* Page-specific backgrounds for content section */
	.content-section.page-home {
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
	}

	.content-section.page-workout {
		background: linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%);
	}

	.content-section.page-nutrition {
		background: linear-gradient(135deg, #dcfce7 0%, #16a34a 100%);
	}
</style>
