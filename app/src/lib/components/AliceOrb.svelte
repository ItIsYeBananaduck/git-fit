<!--
  AliceOrb Component - Enhanced Ferrofluid Desig		strokeDasharray: '300',
		strokeDashoffset: 0,
		fillOpacity: 1.0,
		strokeOpacity: 0.8th Morphing
  
  Purpose: Advanced ferrofluid-like orb with three distinct morphing shapes
  Features:
  - Three morphing states: neutral, rhythmic, intense
  - anime.js powered smooth transitions
  - Real-time strain-based morphing (>15% change threshold)
  - Electric blue ferrofluid aesthetic with customizable colors
  - Voice coaching integration ready
  - Haptic feedback on interactions
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	// Dynamic import for anime.js
	let anime: any = null;
	import type {
		AliceMorphShape,
		AliceInteractionMode,
		StrainMorphContext,
		AliceAnimationState
	} from '$types/alice.js';
	import {
		ALICE_SHAPES,
		getShapeByStrain,
		ALICE_COLORS,
		ALICE_GRADIENTS
	} from '$lib/constants/aliceShapes.js';
	import { applyAliceColorConfig, getStrainColor } from '$lib/utils/aliceColorUtils.js';
	import { aliceStore, aliceActions } from '$lib/stores/aliceStore.js';

	// Props
	export let strain: number = 0;
	export let previousStrain: number = 0;
	export let size: number = 120;
	export let isInteractive: boolean = false;
	export let primaryColor: string = ALICE_COLORS.primary;
	export let accentColor: string = ALICE_COLORS.accent;

	// Component state
	let svgElement: SVGElement;
	let pathElement: SVGPathElement;
	let eyeElement: SVGTextElement;
	let currentShape: AliceMorphShape = 'neutral';
	let isAnimating: boolean = false;
	let morphProgress: number = 0;
	let lastMorphTime: number = 0;
	let animationId: string = `alice-${Math.random().toString(36).substr(2, 9)}`;

	// Animation state
	let animationState: AliceAnimationState = {
		morphPath: ALICE_SHAPES.neutral.path,
		strokeDasharray: '0',
		strokeDashoffset: 0,
		fillOpacity: 1,
		strokeOpacity: 0.8
	};

	const dispatch = createEventDispatcher<{
		morphStart: { fromShape: AliceMorphShape; toShape: AliceMorphShape };
		morphComplete: { shape: AliceMorphShape };
		strainChange: StrainMorphContext;
		interactionModeChange: { mode: AliceInteractionMode };
	}>();

	// Strain change threshold (15% as specified)
	const STRAIN_CHANGE_THRESHOLD = 15;
	const MORPH_THROTTLE_TIME = 1000; // 1 second throttle

	// Alice store subscription
	let unsubscribeStore: (() => void) | undefined;

	// Eye display text
	$: eyeText = strain > 0 ? `${Math.round(strain)}%` : '';

	// Generate color scheme
	$: colorScheme = applyAliceColorConfig({
		primaryColor,
		accentColor,
		size: 'medium',
		voiceEnabled: true,
		coachingFrequency: 'medium',
		hapticsEnabled: true,
		autoHide: false,
		syncInterval: 2000,
		offlineMode: false
	});

	// Determine target shape based on strain
	function getTargetShape(currentStrain: number): AliceMorphShape {
		return getShapeByStrain(currentStrain).id as AliceMorphShape;
	}

	// Check if strain change warrants morphing
	function shouldMorph(current: number, previous: number): boolean {
		const strainDelta = Math.abs(current - previous);
		const timeSinceLastMorph = Date.now() - lastMorphTime;

		return (
			strainDelta > STRAIN_CHANGE_THRESHOLD &&
			timeSinceLastMorph > MORPH_THROTTLE_TIME &&
			!isAnimating
		);
	}

	// Start morphing animation
	function startMorphing(targetShape: AliceMorphShape) {
		if (currentShape === targetShape || isAnimating) return;

		const fromShape = ALICE_SHAPES[currentShape];
		const toShape = ALICE_SHAPES[targetShape];

		dispatch('morphStart', { fromShape: currentShape, toShape: targetShape });

		// Update Alice store
		aliceActions.startMorphing(targetShape);

		isAnimating = true;
		morphProgress = 0;
		lastMorphTime = Date.now();

		// Create strain context for voice coaching trigger
		const strainContext: StrainMorphContext = {
			currentStrain: strain,
			previousStrain,
			strainDelta: strain - previousStrain,
			timestamp: Date.now()
		};

		dispatch('strainChange', strainContext);

		// anime.js morphing animation - only run in browser with anime loaded
		if (!browser || !anime) {
			// Fallback for SSR or when anime isn't loaded
			currentShape = targetShape;
			isAnimating = false;
			morphProgress = 1;
			aliceActions.completeMorph();
			dispatch('morphComplete', { shape: targetShape });
			return;
		}

		const timeline = anime.timeline({
			easing: 'easeOutCubic',
			duration: toShape.animationDuration,
			complete: () => {
				currentShape = targetShape;
				isAnimating = false;
				morphProgress = 1;

				// Update Alice store
				aliceActions.completeMorph();

				dispatch('morphComplete', { shape: targetShape });
			}
		});

		// Path morphing
		timeline.add({
			targets: pathElement,
			d: toShape.path,
			strokeDasharray: toShape.strokeDasharray || '0',
			strokeDashoffset: toShape.strokeDashoffset || '0',
			update: (anim: any) => {
				morphProgress = anim.progress / 100;
				aliceActions.updateMorphProgress(morphProgress);
			}
		});

		// Color transitions
		timeline.add(
			{
				targets: animationState,
				fillOpacity: [1, 0.9, 1],
				strokeOpacity: [0.8, 1, 0.8],
				duration: toShape.animationDuration * 0.5,
				offset: '-=' + toShape.animationDuration * 0.3
			},
			0
		);

		// Eye responsiveness during morphing
		if (eyeElement) {
			timeline.add(
				{
					targets: eyeElement,
					scale: [1, 1.1, 1],
					opacity: [1, 0.8, 1],
					duration: 300,
					offset: '-=' + toShape.animationDuration * 0.8
				},
				0
			);
		}
	}

	// Handle strain changes
	function handleStrainChange(newStrain: number) {
		const targetShape = getTargetShape(newStrain);

		if (shouldMorph(newStrain, previousStrain)) {
			startMorphing(targetShape);
		}

		previousStrain = newStrain;
	}

	// Handle interaction events
	function handleInteraction(event: MouseEvent | TouchEvent) {
		if (!isInteractive) return;

		// Trigger haptic feedback if available
		if ('vibrate' in navigator) {
			navigator.vibrate(50);
		}

		// Brief interaction animation
		anime({
			targets: svgElement,
			scale: [1, 1.05, 1],
			duration: 200,
			easing: 'easeOutQuart'
		});

		dispatch('interactionModeChange', { mode: 'listening' });

		// Reset to idle after interaction
		setTimeout(() => {
			dispatch('interactionModeChange', { mode: 'idle' });
		}, 1000);
	}

	// Apply CSS variables for colors
	function applyCSSVariables() {
		if (!svgElement) return;

		const root = svgElement.closest('.alice-orb-container') as HTMLElement;
		if (root) {
			Object.entries(colorScheme.cssVariables).forEach(([property, value]) => {
				root.style.setProperty(property, value);
			});
		}
	}

	// Reactively handle strain changes
	$: if (strain !== previousStrain) {
		handleStrainChange(strain);
	}

	// Apply color changes
	$: if (svgElement && (primaryColor || accentColor)) {
		applyCSSVariables();
	}

	onMount(async () => {
		if (browser) {
			try {
				// Dynamically import anime.js
				const animeModule = await import('animejs');
				anime = animeModule;
				console.log('Anime.js loaded successfully');
			} catch (error) {
				console.warn('Failed to load anime.js, using fallback animations:', error);
				// Use CSS-based animations as fallback
				anime = {
					timeline: () => ({ 
						add: () => console.log('Animation timeline add'), 
						pause: () => console.log('Animation pause'), 
						play: () => console.log('Animation play') 
					}),
					set: () => console.log('Animation set'),
					remove: () => console.log('Animation remove')
				};
			}

			// Subscribe to Alice store
			unsubscribeStore = aliceStore.subscribe((state) => {
				if (state.currentShape !== currentShape && !isAnimating) {
					startMorphing(state.currentShape);
				}
			});

			// Apply initial colors
			applyCSSVariables();

			// Set initial shape based on strain
			const initialShape = getTargetShape(strain);
			if (initialShape !== currentShape) {
				currentShape = initialShape;
				animationState.morphPath = ALICE_SHAPES[initialShape].path;
			}
		}
	});

	onDestroy(() => {
		// Clean up store subscription
		if (unsubscribeStore) {
			unsubscribeStore();
		}

		// Stop any running animations (only if anime is loaded)
		if (anime && anime.remove) {
			if (pathElement) anime.remove(pathElement);
			if (svgElement) anime.remove(svgElement);
			if (eyeElement) anime.remove(eyeElement);
		}
	});
</script>

<div
	class="alice-orb-container"
	style="width: {size}px; height: {size}px;"
	class:interactive={isInteractive}
>
	<svg
		bind:this={svgElement}
		class="alice-orb"
		width={size}
		height={size}
		viewBox="0 0 120 120"
		role="button"
		tabindex="0"
		aria-label="Alice AI companion showing {strain}% strain"
		on:click={handleInteraction}
		on:touchstart={handleInteraction}
		on:keydown={(e) => e.key === 'Enter' && handleInteraction(new MouseEvent('click'))}
	>
		<defs>
			<!-- Electric ferrofluid gradient -->
			<radialGradient id="{animationId}-electric" cx="50%" cy="50%" r="60%">
				{#each colorScheme.svgGradientStops as stop}
					<stop offset={stop.offset} stop-color={stop.color} stop-opacity={stop.opacity} />
				{/each}
			</radialGradient>

			<!-- Glow filter -->
			<filter id="{animationId}-glow" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur stdDeviation="3" result="coloredBlur" />
				<feMerge>
					<feMergeNode in="coloredBlur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>

			<!-- Drop shadow -->
			<filter id="{animationId}-shadow" x="-50%" y="-50%" width="200%" height="200%">
				<feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.3)" />
			</filter>
		</defs>

		<!-- Main ferrofluid shape -->
		<path
			bind:this={pathElement}
			d={animationState.morphPath}
			fill="url(#{animationId}-electric)"
			stroke={getStrainColor(strain, primaryColor)}
			stroke-width="2"
			stroke-dasharray={animationState.strokeDasharray}
			stroke-dashoffset={animationState.strokeDashoffset}
			fill-opacity={animationState.fillOpacity}
			stroke-opacity={animationState.strokeOpacity}
			filter="url(#{animationId}-glow) url(#{animationId}-shadow)"
			class="ferrofluid-path"
			class:morphing={isAnimating}
		/>

		<!-- Eye display -->
		{#if eyeText}
			<text
				bind:this={eyeElement}
				x="60"
				y="65"
				text-anchor="middle"
				dominant-baseline="middle"
				font-size="14"
				font-family="system-ui, -apple-system, sans-serif"
				font-weight="600"
				fill={accentColor}
				class="alice-eye-text"
			>
				{eyeText}
			</text>
		{/if}

		<!-- Interaction indicator -->
		{#if isInteractive}
			<circle
				cx="60"
				cy="60"
				r="50"
				fill="none"
				stroke={accentColor}
				stroke-width="1"
				stroke-opacity="0.3"
				stroke-dasharray="4,4"
				class="interaction-ring"
			/>
		{/if}
	</svg>
</div>

<style>
	.alice-orb-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		--alice-primary: #00bfff;
		--alice-accent: #ffffff;
		--alice-glow: #4df7ff;
		--alice-shadow: #0080cc;
		--alice-size: 120px;
	}

	.alice-orb {
		overflow: visible;
		cursor: default;
		transition: transform 0.2s ease-out;
	}

	.interactive .alice-orb {
		cursor: pointer;
	}

	.interactive .alice-orb:hover {
		transform: scale(1.02);
	}

	.ferrofluid-path {
		vector-effect: non-scaling-stroke;
		transition: stroke 0.3s ease;
	}

	.ferrofluid-path.morphing {
		filter: brightness(1.1);
	}

	.alice-eye-text {
		text-shadow: 0 0 6px var(--alice-primary);
		pointer-events: none;
		transition: opacity 0.3s ease;
	}

	.interaction-ring {
		animation: pulse-ring 2s ease-in-out infinite;
	}

	@keyframes pulse-ring {
		0%,
		100% {
			stroke-opacity: 0.3;
			r: 50;
		}
		50% {
			stroke-opacity: 0.1;
			r: 55;
		}
	}

	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		.alice-orb,
		.ferrofluid-path,
		.alice-eye-text,
		.interaction-ring {
			animation: none !important;
			transition: none !important;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.alice-eye-text {
			text-shadow:
				2px 2px 0 #000,
				-2px -2px 0 #000,
				2px -2px 0 #000,
				-2px 2px 0 #000;
		}
	}
</style>
