<!--
  Simple AliceOrb Component - Testing without anime.js
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	
	// Props
	export let strain: number = 0;
	export let size: number = 120;
	export let isInteractive: boolean = false;
	export let primaryColor: string = '#00bfff';
	export let accentColor: string = '#ffffff';

	// Component state
	let currentShape: 'neutral' | 'intense' | 'rhythmic' = 'neutral';
	
	const dispatch = createEventDispatcher();

	// Simple shape paths without animation
	const shapes = {
		neutral: 'M60,20 Q80,40 60,60 Q40,80 20,60 Q0,40 20,20 Q40,0 60,20 Z',
		intense: 'M60,10 L70,30 Q80,50 60,70 L50,90 Q30,70 10,50 L20,30 Q40,10 60,10 Z',
		rhythmic: 'M60,15 Q90,30 80,60 Q60,90 30,75 Q10,45 25,20 Q45,5 60,15 Z'
	};

	function handleClick() {
		if (isInteractive) {
			dispatch('interact', { type: 'click', strain });
		}
	}

	function getShapeByStrain(strain: number): 'neutral' | 'intense' | 'rhythmic' {
		if (strain > 70) return 'intense';
		if (strain > 30) return 'rhythmic';
		return 'neutral';
	}

	$: currentShape = getShapeByStrain(strain);
</script>

<div 
	class="alice-orb-container"
	style="--alice-size: {size}px; --alice-primary: {primaryColor}; --alice-accent: {accentColor};"
>
	<svg 
		width={size} 
		height={size} 
		viewBox="0 0 100 100"
		class="alice-orb"
		class:interactive={isInteractive}
		on:click={handleClick}
		on:keydown={(e) => e.key === 'Enter' && handleClick()}
		role={isInteractive ? 'button' : 'img'}
		tabindex={isInteractive ? 0 : -1}
		aria-label="Alice AI companion - strain level {strain}%"
	>
		<!-- Ferrofluid blob -->
		<path
			d={shapes[currentShape]}
			fill={primaryColor}
			stroke={accentColor}
			stroke-width="2"
			opacity="0.9"
		/>
		
		<!-- Simple pulsing effect -->
		<circle
			cx="50"
			cy="50"
			r="30"
			fill="none"
			stroke={primaryColor}
			stroke-width="1"
			opacity="0.3"
		>
			<animate
				attributeName="r"
				values="25;35;25"
				dur="3s"
				repeatCount="indefinite"
			/>
			<animate
				attributeName="opacity"
				values="0.1;0.5;0.1"
				dur="3s"
				repeatCount="indefinite"
			/>
		</circle>
	</svg>
</div>

<style>
	.alice-orb-container {
		position: relative;
		display: inline-block;
		user-select: none;
	}

	.alice-orb {
		transition: transform 0.2s ease;
	}

	.alice-orb.interactive {
		cursor: pointer;
	}

	.alice-orb.interactive:hover {
		transform: scale(1.05);
	}

	.alice-orb:focus {
		outline: 2px solid var(--alice-primary);
		outline-offset: 4px;
	}
</style>