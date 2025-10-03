<!--
	GlobalAlice Component
	
	Enhanced Alice AI companion that appears on all pages with voice coaching,
	real-time data sync, and adaptive morphing capabilities.
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import { Haptics, ImpactStyle } from '@capacitor/haptics';
	import AliceOrb from './AliceOrb.svelte';
	import { aliceStore, aliceActions, aliceInteractionMode } from '$lib/stores/aliceStore.js';
	import { aliceDataService, initializeAliceData } from '$lib/services/aliceDataService.js';
	import { aliceVoiceService } from '$lib/services/aliceVoiceService.js';
	import type { AliceAIState, StrainMorphContext } from '$types/alice.js';

	// Enhanced page configuration
	const INTERACTIVE_PAGES = ['/', '/workouts', '/nutrition'];
	const SWIPE_PAGES = ['/'];
	const WORKOUT_PAGES = ['/workouts'];
	const NUTRITION_PAGES = ['/nutrition'];
	const VOICE_COACHING_PAGES = ['/workouts'];

	// Gesture state
	let startX = 0;
	let startY = 0;
	let deltaX = 0;
	let deltaY = 0;
	let isDragging = false;
	let swipeThreshold = 100;

	// Alice enhanced state
	let isInitialized = false;
	let lastStrainValue = 0;
	let voiceCoachingEnabled = true;
	let dataServiceActive = false;

	// Store subscriptions
	$: aliceState = $aliceStore;
	$: interactionMode = $aliceInteractionMode;
	$: currentPath = $page.url?.pathname || '/';
	$: isInteractive = interactionMode.isInteractive;
	$: canSwipe = SWIPE_PAGES.includes(currentPath);
	$: shouldEnableVoiceCoaching = VOICE_COACHING_PAGES.includes(currentPath) && voiceCoachingEnabled;

	// Initialize Alice data service
	onMount(async () => {
		try {
			// TODO: Get actual userId from auth context
			const userId = 'current-user';

			// Initialize Alice data subscriptions
			await initializeAliceData(userId);
			dataServiceActive = true;

			// Enable voice coaching service
			aliceVoiceService.setEnabled(shouldEnableVoiceCoaching);

			isInitialized = true;
			console.log('Alice Global component initialized');
		} catch (error) {
			console.error('Failed to initialize Alice:', error);
		}
	});

	// Cleanup on destroy
	onDestroy(() => {
		if (dataServiceActive) {
			aliceDataService.destroy();
		}
		aliceVoiceService.reset();
	});

	// Watch for strain changes and trigger voice coaching
	$: if (isInitialized && aliceState.lastSyncTimestamp) {
		const currentStrain = getCurrentStrain();
		const strainDelta = currentStrain - lastStrainValue;

		if (Math.abs(strainDelta) > 15 && shouldEnableVoiceCoaching) {
			const morphContext: StrainMorphContext = {
				currentStrain,
				previousStrain: lastStrainValue,
				strainDelta,
				timestamp: Date.now()
			};

			// Trigger voice coaching
			aliceVoiceService.triggerVoiceCoaching(morphContext, {
				voiceEnabled: voiceCoachingEnabled,
				hapticsEnabled: true
			});
		}

		lastStrainValue = currentStrain;
	}

	// Enhanced haptic feedback helper
	async function triggerHaptic(style: ImpactStyle = ImpactStyle.Medium) {
		try {
			await Haptics.impact({ style });
		} catch (error) {
			console.log('Haptics not available:', error);
		}
	}

	// Get current strain from Alice state or workout data
	function getCurrentStrain(): number {
		// This would be connected to real workout data
		// For now, return a simulated value based on page context
		if (WORKOUT_PAGES.includes(currentPath)) {
			return Math.random() * 100; // Simulated workout strain
		}
		return 0;
	}

	// Enhanced touch/mouse event handlers
	function handleStart(event: TouchEvent | MouseEvent) {
		if (!isInteractive) return;

		isDragging = true;
		const point = 'touches' in event ? event.touches[0] : event;
		startX = point.clientX;
		startY = point.clientY;
		deltaX = 0;
		deltaY = 0;

		// Update Alice interaction state
		aliceActions.setInteractionMode('listening');
		triggerHaptic(ImpactStyle.Light);
	}

	function handleMove(event: TouchEvent | MouseEvent) {
		if (!isDragging || !isInteractive) return;

		const point = 'touches' in event ? event.touches[0] : event;
		deltaX = point.clientX - startX;
		deltaY = point.clientY - startY;

		// Update Alice visual feedback
		const moveIntensity = Math.abs(deltaX) / 100;
		aliceActions.updateMorphProgress(Math.min(moveIntensity, 1));

		// Prevent default scrolling during swipe
		if (Math.abs(deltaX) > 10) {
			event.preventDefault();
		}
	}

	function handleEnd(event: TouchEvent | MouseEvent) {
		if (!isDragging || !isInteractive) return;

		isDragging = false;
		aliceActions.setInteractionMode('idle');
		aliceActions.completeMorph();

		// Handle swipe navigation on supported pages
		if (canSwipe && Math.abs(deltaX) > swipeThreshold) {
			if (deltaX > 0) {
				// Swipe right - go to workouts
				triggerHaptic(ImpactStyle.Heavy);
				goto('/workouts');

				// Start workout session
				if (dataServiceActive) {
					aliceDataService.startWorkoutSession('current-user', 'swipe-navigation');
				}
			} else {
				// Swipe left - go to nutrition
				triggerHaptic(ImpactStyle.Heavy);
				goto('/nutrition');
			}
		} else {
			// Not enough swipe distance, snap back
			triggerHaptic(ImpactStyle.Light);
		}

		deltaX = 0;
		deltaY = 0;
	}

	// Handle Alice tap interactions
	function handleAliceTap() {
		if (!isInteractive) return;

		triggerHaptic(ImpactStyle.Medium);

		// Cycle through shapes manually
		const shapes = ['neutral', 'rhythmic', 'intense'] as const;
		const currentIndex = shapes.indexOf(aliceState.currentShape);
		const nextShape = shapes[(currentIndex + 1) % shapes.length];

		aliceActions.startMorphing(nextShape);

		// Trigger a sample voice coaching message
		if (shouldEnableVoiceCoaching) {
			aliceActions.startSpeaking("Let's keep the energy flowing!");
			setTimeout(() => aliceActions.stopSpeaking(), 2000);
		}
	}

	// Update Alice state when page changes
	$: if (currentPath) {
		aliceActions.updatePage(currentPath);

		// Enable/disable voice coaching based on page
		aliceVoiceService.setEnabled(shouldEnableVoiceCoaching);

		// End workout session when leaving workout pages
		if (dataServiceActive && !WORKOUT_PAGES.includes(currentPath) && lastStrainValue > 0) {
			aliceDataService.endWorkoutSession('current-user');
			lastStrainValue = 0;
		}
	}

	// Alice size based on page context
	$: aliceSize = (() => {
		if (currentPath === '/') return 180; // Larger on home page
		if (WORKOUT_PAGES.includes(currentPath)) return 140; // Medium during workouts
		if (NUTRITION_PAGES.includes(currentPath)) return 140; // Medium for nutrition
		return 100; // Smaller companion size on other pages
	})();

	// Alice visibility based on speaking state
	$: isAliceSpeaking = aliceState.isSpeaking;
	$: aliceOpacity = isAliceSpeaking ? 1 : 0.8;
</script>

<!-- Enhanced Alice Global Companion -->
<div
	class="alice-global-container"
	class:interactive={isInteractive}
	class:dragging={isDragging}
	class:speaking={isAliceSpeaking}
	class:initialized={isInitialized}
>
	{#if aliceState.shouldShowOnPage}
		<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
		<div
			class="alice-wrapper"
			class:can-swipe={canSwipe}
			style="transform: translateX({isDragging ? deltaX * 0.3 : 0}px); opacity: {aliceOpacity}"
			on:mousedown={handleStart}
			on:mousemove={handleMove}
			on:mouseup={handleEnd}
			on:touchstart={handleStart}
			on:touchmove={handleMove}
			on:touchend={handleEnd}
			on:click={handleAliceTap}
			on:keydown={(e) => e.key === 'Enter' && handleAliceTap()}
			role={isInteractive ? 'button' : 'img'}
			tabindex={isInteractive ? 0 : -1}
			aria-label={isInteractive
				? 'Alice AI - Tap to interact, swipe to navigate'
				: 'Alice AI companion'}
		>
			<AliceOrb 
				size={aliceSize}
				on:morphComplete={(e) => {
					console.log('Alice morph complete:', e.detail);
					triggerHaptic(ImpactStyle.Light);
				}}
			/>			<!-- Voice coaching indicator -->
			{#if isAliceSpeaking && aliceState.currentMessage}
				<div class="voice-indicator" transition:fade={{ duration: 300 }}>
					<div class="message-bubble">
						{aliceState.currentMessage}
					</div>
					<div class="speaking-animation">
						<div class="pulse"></div>
						<div class="pulse"></div>
						<div class="pulse"></div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Enhanced swipe indicators (only on home page) -->
		{#if canSwipe && isInteractive}
			<div class="swipe-indicators">
				<div class="swipe-hint left" class:active={deltaX > 20}>
					<span>🏋️ Start Workout</span>
					<div class="arrow">→</div>
				</div>
				<div class="swipe-hint right" class:active={deltaX < -20}>
					<div class="arrow">←</div>
					<span>🍎 Track Nutrition</span>
				</div>
			</div>
		{/if}

		<!-- Connection status indicator -->
		{#if !aliceState.isOnline}
			<div class="offline-indicator">
				<span>⚡ Offline Mode</span>
			</div>
		{/if}

		<!-- Data service status (development only) -->
		{#if !dataServiceActive && isInitialized}
			<div class="debug-indicator">
				<span>🔌 Data service inactive</span>
			</div>
		{/if}
	{/if}
</div>

<style>
	.alice-global-container {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 1000;
		pointer-events: none;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		opacity: 0.8;
	}

	.alice-global-container.interactive {
		pointer-events: auto;
		opacity: 1;
	}

	.alice-global-container.speaking {
		transform: translate(-50%, -50%) scale(1.05);
		opacity: 1;
	}

	.alice-global-container.initialized {
		animation: aliceEntrance 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	@keyframes aliceEntrance {
		0% {
			transform: translate(-50%, -50%) scale(0.8);
			opacity: 0;
		}
		100% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 0.8;
		}
	}

	.alice-wrapper {
		position: relative;
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: default;
	}

	.alice-wrapper.can-swipe {
		cursor: grab;
		touch-action: pan-x;
	}

	.alice-wrapper.can-swipe:active {
		cursor: grabbing;
	}

	.alice-global-container.dragging .alice-wrapper {
		transition: none;
	}

	/* Voice coaching indicator */
	.voice-indicator {
		position: absolute;
		top: -60px;
		left: 50%;
		transform: translateX(-50%);
		pointer-events: none;
		z-index: 10;
	}

	.message-bubble {
		background: rgba(0, 191, 255, 0.9);
		color: white;
		padding: 8px 12px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 500;
		white-space: nowrap;
		max-width: 200px;
		text-align: center;
		margin-bottom: 8px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.speaking-animation {
		display: flex;
		justify-content: center;
		gap: 4px;
	}

	.pulse {
		width: 6px;
		height: 6px;
		background: #00bfff;
		border-radius: 50%;
		animation: pulse 1.5s ease-in-out infinite;
	}

	.pulse:nth-child(2) {
		animation-delay: 0.3s;
	}

	.pulse:nth-child(3) {
		animation-delay: 0.6s;
	}

	@keyframes pulse {
		0%,
		20%,
		50%,
		80%,
		100% {
			transform: scale(1);
			opacity: 0.5;
		}
		40% {
			transform: scale(1.2);
			opacity: 1;
		}
	}

	/* Enhanced swipe indicators */
	.swipe-indicators {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 320px;
		height: 60px;
		pointer-events: none;
		z-index: -1;
	}

	.swipe-hint {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		gap: 8px;
		color: rgba(255, 255, 255, 0.6);
		font-size: 14px;
		font-weight: 500;
		transition: all 0.2s ease;
		opacity: 0.7;
		background: rgba(0, 0, 0, 0.3);
		padding: 6px 10px;
		border-radius: 8px;
		backdrop-filter: blur(5px);
	}

	.swipe-hint.left {
		left: -130px;
	}

	.swipe-hint.right {
		right: -130px;
	}

	.swipe-hint.active {
		opacity: 1;
		color: rgba(255, 255, 255, 0.9);
		transform: translateY(-50%) scale(1.1);
		background: rgba(0, 191, 255, 0.3);
	}

	.arrow {
		font-size: 18px;
		transition: transform 0.2s ease;
	}

	.swipe-hint.active .arrow {
		transform: scale(1.2);
	}

	/* Status indicators */
	.offline-indicator,
	.debug-indicator {
		position: absolute;
		top: -100px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(255, 165, 0, 0.9);
		color: white;
		padding: 4px 8px;
		border-radius: 6px;
		font-size: 10px;
		font-weight: 500;
		pointer-events: none;
		backdrop-filter: blur(5px);
	}

	.debug-indicator {
		background: rgba(255, 0, 0, 0.7);
		top: -80px;
	}

	/* Page-specific positioning */
	:global(.page-home) .alice-global-container {
		top: 40%;
	}

	:global(.page-workout) .alice-global-container {
		top: 80px;
		left: 80px;
		transform: none;
	}

	:global(.page-nutrition) .alice-global-container {
		top: 80px;
		right: 80px;
		left: auto;
		transform: none;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.swipe-indicators {
			width: 280px;
		}

		.swipe-hint {
			font-size: 12px;
			padding: 4px 8px;
		}

		.swipe-hint.left {
			left: -110px;
		}

		.swipe-hint.right {
			right: -110px;
		}

		.message-bubble {
			font-size: 11px;
			padding: 6px 10px;
			max-width: 160px;
		}

		:global(.page-workout) .alice-global-container,
		:global(.page-nutrition) .alice-global-container {
			top: 60px;
		}

		:global(.page-workout) .alice-global-container {
			left: 60px;
		}

		:global(.page-nutrition) .alice-global-container {
			right: 60px;
		}
	}

	/* Enhanced accessibility */
	.alice-wrapper:focus {
		outline: 2px solid #00bfff;
		outline-offset: 4px;
		border-radius: 50%;
	}

	.alice-wrapper:focus-visible {
		outline: 2px solid #00bfff;
		outline-offset: 4px;
	}

	/* Animation for data sync states */
	.alice-global-container:not(.initialized) {
		opacity: 0.3;
		transform: translate(-50%, -50%) scale(0.9);
	}

	/* Smooth transitions for all states */
	.alice-wrapper {
		transition:
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.2s ease,
			filter 0.2s ease;
	}

	.alice-global-container.speaking .alice-wrapper {
		filter: drop-shadow(0 0 10px rgba(0, 191, 255, 0.5));
	}
</style>
