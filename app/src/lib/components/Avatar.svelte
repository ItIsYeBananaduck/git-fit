<script>
	import { onMount } from 'svelte';
	import { animate as animeAnimate } from 'animejs';

	// Props for customizable avatar
	export let bodyColor = '#8b5cf6'; // Default body color
	export let glowColor = null; // Auto-derived from bodyColor if not provided
	export let eyeColor = '#ffffff'; // Default white eyes
	export let size = 200; // Avatar size
	export let enableAnimations = true; // Enable/disable animations

	// Internal state
	let glowIntensity = 50;
	let floatingOffset = 0;
	let swayOffset = 0;
	let headBob = 0;
	let armSwing = 0;

	// Set default glow color if not provided
	$: if (!glowColor) {
		glowColor = bodyColor + 'aa'; // Add alpha for glow
	}

	// Enhanced floating animation with multiple movements
	function startFloating() {
		if (!enableAnimations) return;

		function animate() {
			const time = Date.now() * 0.001; // Convert to seconds

			// Main floating motion (up/down)
			floatingOffset = Math.sin(time * 0.5) * 8;

			// Gentle swaying motion (left/right)
			swayOffset = Math.sin(time * 0.3) * 3;

			// Head bobbing (subtle)
			headBob = Math.sin(time * 0.7) * 2;

			// Arm swinging (very subtle)
			armSwing = Math.sin(time * 0.4) * 1;

			requestAnimationFrame(animate);
		}
		animate();
	}

	// Update color with animation
	export function updateColor(newColor) {
		bodyColor = newColor;
		glowColor = newColor + 'aa'; // Update glow color too

		// Animate color transition
		animeAnimate({
			targets: { intensity: glowIntensity },
			intensity: [glowIntensity, glowIntensity + 20, glowIntensity],
			duration: 1000,
			easing: 'easeOutQuad'
		});
	}

	onMount(() => {
		console.log('Avatar: Component mounted');
		// Start floating animation
		startFloating();
	});
</script>

<div
	class="avatar-container"
	style="
		--body-color: {bodyColor};
		--glow-color: {glowColor};
		--eye-color: {eyeColor};
		--glow-intensity: {glowIntensity}px;
		--avatar-size: {size}px;
		--floating-offset: {enableAnimations ? floatingOffset : 0}px;
		--sway-offset: {enableAnimations ? swayOffset : 0}px;
		--head-bob: {enableAnimations ? headBob : 0}px;
		--arm-swing: {enableAnimations ? armSwing : 0}px;
	"
>
	<div class="avatar-body">
		<div class="avatar-head">
			<div class="avatar-eye left"></div>
			<div class="avatar-eye right"></div>
		</div>
		<div class="avatar-limb arm-left"></div>
		<div class="avatar-limb arm-right"></div>
		<div class="avatar-limb leg-left"></div>
		<div class="avatar-limb leg-right"></div>
		<div class="accessories">
			<slot name="accessories">
				{#if $$slots.accessories}
					<slot name="accessories" />
				{/if}
			</slot>
		</div>
	</div>
</div>

<style>
	.avatar-container {
		width: var(--avatar-size);
		height: calc(var(--avatar-size) * 1.2);
		display: flex;
		align-items: center;
		justify-content: center;
		transform: translateY(var(--floating-offset)) translateX(var(--sway-offset));
		transition: transform 0.1s ease-out;
		position: relative;
	}

	.avatar-body {
		width: calc(var(--avatar-size) * 0.6);
		height: calc(var(--avatar-size) * 0.8);
		background: var(--body-color);
		border-radius: calc(var(--avatar-size) * 0.3);
		box-shadow:
			0 0 var(--glow-intensity) var(--glow-color),
			inset 0 0 calc(var(--glow-intensity) * 0.5) rgba(0, 0, 0, 0.2);
		position: relative;
		filter: blur(0.5px);
		transition: box-shadow 0.5s ease;
	}

	.avatar-head {
		position: absolute;
		top: calc(var(--avatar-size) * -0.15 + var(--head-bob));
		left: 50%;
		transform: translateX(-50%);
		width: calc(var(--avatar-size) * 0.35);
		height: calc(var(--avatar-size) * 0.35);
		background: var(--body-color);
		border-radius: 50%;
		box-shadow:
			0 0 calc(var(--glow-intensity) * 0.8) var(--glow-color),
			inset 0 0 calc(var(--glow-intensity) * 0.3) rgba(0, 0, 0, 0.3);
		transition: top 0.1s ease-out;
	}

	.avatar-eye {
		position: absolute;
		top: 35%;
		width: calc(var(--avatar-size) * 0.05);
		height: calc(var(--avatar-size) * 0.05);
		background: var(--eye-color);
		border-radius: 50%;
		box-shadow: 0 0 calc(var(--glow-intensity) * 0.6) var(--eye-color);
	}

	.avatar-eye.left {
		left: 25%;
	}

	.avatar-eye.right {
		right: 25%;
	}

	.avatar-limb {
		position: absolute;
		background: var(--body-color);
		border-radius: calc(var(--avatar-size) * 0.15);
		box-shadow:
			0 0 calc(var(--glow-intensity) * 0.4) var(--glow-color),
			inset 0 0 calc(var(--glow-intensity) * 0.2) rgba(0, 0, 0, 0.2);
	}

	.arm-left,
	.arm-right {
		width: calc(var(--avatar-size) * 0.15);
		height: calc(var(--avatar-size) * 0.25);
		top: calc(var(--avatar-size) * 0.15);
	}

	.arm-left {
		left: calc(var(--avatar-size) * -0.1);
		transform: rotate(calc(-15deg + var(--arm-swing) * 2deg));
		transition: transform 0.1s ease-out;
	}

	.arm-right {
		right: calc(var(--avatar-size) * -0.1);
		transform: rotate(calc(15deg - var(--arm-swing) * 2deg));
		transition: transform 0.1s ease-out;
	}

	.leg-left,
	.leg-right {
		width: calc(var(--avatar-size) * 0.18);
		height: calc(var(--avatar-size) * 0.3);
		bottom: calc(var(--avatar-size) * -0.15);
	}

	.leg-left {
		left: calc(var(--avatar-size) * 0.15);
		transform: rotate(-5deg);
	}

	.leg-right {
		right: calc(var(--avatar-size) * 0.15);
		transform: rotate(5deg);
	}

	.accessories {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.avatar-container {
			--avatar-size: calc(var(--avatar-size) * 0.8);
		}
	}

	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		.avatar-container {
			transform: none !important;
		}

		.avatar-head,
		.avatar-limb {
			transition: none !important;
		}
	}
</style>