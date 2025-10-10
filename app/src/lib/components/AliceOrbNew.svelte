<!--
  Enhanced AliceOrb Component - Clean Ferrofluid Design
  Based on working alice-demo implementation with improvements
-->

<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';

	// Props
	export let size: number = 120;
	export let strain: number = 0;
	export let isInteractive: boolean = false;
	export let eyeState: 'normal' | 'wink' | 'droop' | 'excited' = 'normal';

	const dispatch = createEventDispatcher();

	// Animation state
	let time = 0;
	let animationFrame: number;

	// Clean ferrofluid shapes
	const shapes = {
		neutral: 'M50,15 Q75,20 70,45 Q65,70 45,65 Q20,60 15,35 Q20,10 50,15 Z',
		intense: 'M50,10 L65,20 Q80,30 75,50 L60,70 Q50,80 35,70 L20,50 Q10,30 25,20 Q35,5 50,10 Z',
		rhythmic: 'M50,12 Q80,18 75,45 Q70,75 45,70 Q15,65 12,40 Q18,12 50,12 Z'
	};

	// Get current morph state based on strain
	function getCurrentMorphState() {
		if (strain < 30) return 'neutral';
		if (strain < 70) return 'intense';
		return 'rhythmic';
	}

	// Get current shape path
	function getCurrentShape() {
		return shapes[getCurrentMorphState()];
	}

	// Eye movement - clean and natural
	function getEyeX() {
		// Horizontal follows strain with subtle floating
		const baseX = 42 + (strain / 100) * 16; // Range: 42-58 (centered)
		const floatX = Math.sin(time * 0.01) * 1.5; // Gentle drift
		return baseX + floatX;
	}

	function getEyeY() {
		// Vertical position with gentle movement
		const floatY = Math.cos(time * 0.012) * 1; // Subtle vertical drift
		if (eyeState === 'wink') return 47 + floatY;
		if (eyeState === 'droop') return 52 + floatY;
		if (eyeState === 'excited') return 45 + floatY;
		return 47 + floatY;
	}

	function getEyeR() {
		// Properly sized eye with subtle breathing
		const breathe = Math.sin(time * 0.02) * 0.3; // Gentle breathing
		if (eyeState === 'wink') return 1.5 + breathe;
		if (eyeState === 'droop') return 5.5 + breathe;
		if (eyeState === 'excited') return 7 + breathe;
		return 6 + breathe; // Good balanced size
	}

	// Animation loop for fluid movement
	onMount(() => {
		function animate() {
			time += 1;
			animationFrame = requestAnimationFrame(animate);
		}
		animate();

		return () => {
			if (animationFrame) cancelAnimationFrame(animationFrame);
		};
	});

	// Handle click interactions
	function handleClick() {
		if (isInteractive) {
			dispatch('click');
		}
	}
</script>

<div 
	class="alice-orb-container" 
	class:interactive={isInteractive}
	on:click={handleClick}
	on:keydown={(e) => e.key === 'Enter' && handleClick()}
	role={isInteractive ? 'button' : 'img'}
	tabindex={isInteractive ? 0 : undefined}
	aria-label="Alice AI Companion"
>
	<svg width={size} height={size} viewBox="0 0 100 100" class="alice-orb">
		<defs>
			<!-- Black ferrofluid gradient -->
			<radialGradient id="blackFerrofluid" cx="50%" cy="35%" r="55%">
				<stop offset="0%" style="stop-color:#222;stop-opacity:1" />
				<stop offset="50%" style="stop-color:#111;stop-opacity:1" />
				<stop offset="80%" style="stop-color:#000;stop-opacity:1" />
				<stop offset="100%" style="stop-color:#000;stop-opacity:1" />
			</radialGradient>
			
			<!-- Blue glow filter -->
			<filter id="blueGlow">
				<feGaussianBlur stdDeviation="2" result="coloredBlur"/>
				<feMerge>
					<feMergeNode in="coloredBlur"/>
					<feMergeNode in="SourceGraphic"/>
				</feMerge>
			</filter>
		</defs>
		
		<!-- Black ferrofluid blob -->
		<path
			d={getCurrentShape()}
			fill="url(#blackFerrofluid)"
			stroke="#00bfff"
			stroke-width="1.5"
			opacity="1"
			style="transition: d 0.6s ease-out;"
			filter="url(#blueGlow)"
		/>
		
		<!-- Moving white eye -->
		<circle
			cx={getEyeX()}
			cy={getEyeY()}
			r={getEyeR()}
			fill="#fff"
			opacity="0.95"
			style="transition: all 0.5s cubic-bezier(.4,2,.3,1);"
		/>
		
		<!-- Electric blue aura -->
		<circle
			cx="50"
			cy="50"
			r="35"
			fill="none"
			stroke="#00bfff"
			stroke-width="1"
			opacity="0.3"
			class="pulse"
		/>
	</svg>
</div>

<style>
	.alice-orb-container {
		display: inline-block;
		cursor: default;
		transition: all 0.3s ease;
	}

	.alice-orb-container.interactive {
		cursor: pointer;
	}

	.alice-orb-container.interactive:hover {
		transform: scale(1.05);
	}

	.alice-orb-container:focus {
		outline: 2px solid #00bfff;
		outline-offset: 4px;
		border-radius: 50%;
	}

	.alice-orb {
		filter: drop-shadow(0 0 20px rgba(0, 191, 255, 0.3));
		animation: float 4s ease-in-out infinite;
	}

	.pulse {
		animation: pulse 3s ease-in-out infinite;
	}

	@keyframes float {
		0%, 100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-1px);
		}
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 0.2;
		}
		50% {
			opacity: 0.4;
		}
	}
</style>