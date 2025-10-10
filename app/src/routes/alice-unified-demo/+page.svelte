<!--
  Alice Unified Demo - Complete Feature Showcase
  Demonstrates all Alice features according to Build Adaptive Fit specification
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import AliceUnified from '../../lib/components/AliceUnified.svelte';

	// Demo state
	let subscriptionTier: 'free' | 'trial' | 'paid' | 'trainer' = $state('paid');
	let customPattern: string = $state('solid');
	let customColor: string = $state('#444444'); // Start with a different color so gradient shows initially
	let mode: 'idle' | 'workout' | 'nutrition' | 'analytics' | 'radio' = $state('idle');
	let zenMode = $state(false);
	let playMode = $state(false);
	let heartRate = $state(75);
	let intensity = $state(0);
	let isBackgroundMonitoring = $state(false);
	let eyeState: 'normal' | 'wink' | 'droop' | 'excited' = $state('normal');

	// Debug logging
	$effect(() => {
		console.log('Demo state changed:', { customPattern, customColor });
	});

	// Demo controls
	let autoDemo = $state(false);
	let demoInterval: ReturnType<typeof setInterval> | null = null;

	// Control global Alice through parent data
	$effect(() => {
		if (typeof window !== 'undefined') {
			// Store demo state globally so layout can access it
			(window as any).aliceDemoState = {
				subscriptionTier,
				customPattern,
				customColor,
				mode,
				zenMode,
				playMode,
				heartRate,
				intensity,
				isBackgroundMonitoring,
				eyeState
			};
			
			// Trigger a custom event to notify layout
			window.dispatchEvent(new CustomEvent('alice-demo-update', {
				detail: {
					subscriptionTier,
					customPattern,
					customColor,
					mode,
					zenMode,
					playMode,
					heartRate,
					intensity,
					isBackgroundMonitoring,
					eyeState
				}
			}));
		}
	});

	const patterns = ['solid', 'stripes', 'spots', 'leopard', 'chrome', 'glitch'];
	const colors = ['#1a1a2e', '#00bfff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
	const modes: Array<typeof mode> = ['idle', 'workout', 'nutrition', 'analytics', 'radio'];

	// Handle Alice events
	function handleAliceTapped(event: CustomEvent) {
		console.log('Alice tapped:', event.detail);
	}

	function handleModeSelected(event: CustomEvent) {
		console.log('Mode selected:', event.detail);
		mode = event.detail.mode;
	}

	function handlePlayModeActivated() {
		console.log('Play mode activated');
		playMode = true;
		setTimeout(() => playMode = false, 3000); // Auto exit play mode for demo
	}

	// Demo automation
	function startAutoDemo() {
		autoDemo = true;
		demoInterval = setInterval(() => {
			// Cycle through different subscription tiers
			const tiers: Array<typeof subscriptionTier> = ['free', 'trial', 'paid', 'trainer'];
			subscriptionTier = tiers[Math.floor(Math.random() * tiers.length)];

			// Random pattern and color for paid users
			if (subscriptionTier === 'paid' || subscriptionTier === 'trainer') {
				customPattern = patterns[Math.floor(Math.random() * patterns.length)];
				customColor = colors[Math.floor(Math.random() * colors.length)];
			}

			// Simulate heart rate and intensity changes
			heartRate = 60 + Math.floor(Math.random() * 80);
			intensity = Math.floor(Math.random() * 100);

			// Random mode changes
			if (Math.random() > 0.7) {
				mode = modes[Math.floor(Math.random() * modes.length)];
			}

			// Toggle zen mode occasionally
			if (Math.random() > 0.9) {
				zenMode = !zenMode;
			}

			// Toggle background monitoring
			if (Math.random() > 0.8) {
				isBackgroundMonitoring = !isBackgroundMonitoring;
			}
		}, 2000);
	}

	function stopAutoDemo() {
		autoDemo = false;
		if (demoInterval) {
			clearInterval(demoInterval);
		}
	}

	// Trigger zen reactions for demo
	function triggerPR() {
		if (window.aliceZenTrigger) {
			window.aliceZenTrigger('pr');
		}
	}

	function triggerQuit() {
		if (window.aliceZenTrigger) {
			window.aliceZenTrigger('quit');
		}
	}

	// Test eye states directly
	function testEyeState(state: 'droop' | 'excited' | 'wink' | 'blink') {
		if (state === 'blink') {
			// Trigger a manual blink by setting normal then back (blink is handled by animation)
			eyeState = 'normal';
		} else {
			eyeState = state;
			// Auto-return to normal after 2 seconds for demo
			setTimeout(() => {
				eyeState = 'normal';
			}, 2000);
		}
	}

	onMount(() => {
		return () => {
			if (demoInterval) {
				clearInterval(demoInterval);
			}
		};
	});
</script>

<svelte:head>
	<title>Alice Unified Demo - Build Adaptive Fit</title>
</svelte:head>

<div class="alice-demo">
	<header class="demo-header">
		<h1>🖤 Alice Unified Demo</h1>
		<p>Complete Build Adaptive Fit specification implementation</p>
		<p class="spec-note">
			Matte black body • Electric blue eye • Breathing animation • 3D effects • Tap to bloom • Subscription tiers • Fixed position (scrolls independently)
		</p>
	</header>

	<!-- Alice Container -->
	<div class="alice-container">
		<p style="color: #00bfff; text-align: center; font-style: italic;">
			Alice is controlled globally from this demo page.<br>
			Look for her fixed in the center of your screen!
		</p>
	</div>

	<!-- Demo Controls -->
	<div class="controls-panel">
		<h2>🎮 Demo Controls</h2>
		
		<div class="control-group">
			<h3>Subscription Tier</h3>
			<div class="radio-group">
				{#each ['free', 'trial', 'paid', 'trainer'] as tier}
					<label class="radio-option">
						<input type="radio" bind:group={subscriptionTier} value={tier} />
						<span class="tier-{tier}">{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
					</label>
				{/each}
			</div>
		</div>

		{#if subscriptionTier === 'paid' || subscriptionTier === 'trainer'}
			<div class="control-group">
				<h3>Customization (Paid Features)</h3>
				<div class="customization-controls">
					<div class="pattern-selector">
						<label>Pattern:</label>
						<select bind:value={customPattern}>
							{#each patterns as pattern}
								<option value={pattern}>{pattern.charAt(0).toUpperCase() + pattern.slice(1)}</option>
							{/each}
						</select>
					</div>
					<div class="color-selector">
						<label>Color:</label>
						<input type="color" bind:value={customColor} />
					</div>
				</div>
			</div>
		{/if}

		<div class="control-group">
			<h3>Alice State</h3>
			<div class="state-controls">
				<label class="checkbox-option">
					<input type="checkbox" bind:checked={zenMode} />
					<span>Zen Mode</span>
				</label>
				<label class="checkbox-option">
					<input type="checkbox" bind:checked={playMode} />
					<span>Play Mode</span>
				</label>
				<label class="checkbox-option">
					<input type="checkbox" bind:checked={isBackgroundMonitoring} />
					<span>Background Monitoring</span>
				</label>
			</div>
		</div>

		<div class="control-group">
			<h3>Metrics</h3>
			<div class="metrics-controls">
				<div class="slider-control">
					<label>Heart Rate: {heartRate} bpm</label>
					<input type="range" min="40" max="200" bind:value={heartRate} />
				</div>
				<div class="slider-control">
					<label>Intensity: {intensity}%</label>
					<input type="range" min="0" max="120" bind:value={intensity} />
				</div>
			</div>
		</div>

		{#if zenMode}
			<div class="control-group">
				<h3>Zen Mode Triggers</h3>
				<div class="zen-controls">
					<button class="zen-btn pr-btn" onclick={triggerPR}>
						🏆 Trigger PR (Blink)
					</button>
					<button class="zen-btn quit-btn" onclick={triggerQuit}>
						😔 Trigger Quit (Droop)
					</button>
				</div>
			</div>
		{/if}

		<div class="control-group">
			<h3>Eye Animation Tests</h3>
			<div class="eye-test-controls">
				<button class="eye-btn" onclick={() => testEyeState('droop')}>
					😴 Test Droop
				</button>
				<button class="eye-btn" onclick={() => testEyeState('excited')}>
					🤩 Test Excited
				</button>
				<button class="eye-btn" onclick={() => testEyeState('wink')}>
					😉 Test Wink
				</button>
				<button class="eye-btn" onclick={() => testEyeState('blink')}>
					😑 Test Blink
				</button>
			</div>
		</div>

		<div class="control-group">
			<h3>Auto Demo</h3>
			<div class="demo-controls">
				{#if !autoDemo}
					<button class="demo-btn start-btn" onclick={startAutoDemo}>
						▶️ Start Auto Demo
					</button>
				{:else}
					<button class="demo-btn stop-btn" onclick={stopAutoDemo}>
						⏹️ Stop Auto Demo
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Feature Information -->
	<div class="features-info">
		<h2>🚀 Alice Features</h2>
		<div class="features-grid">
			<div class="feature-card">
				<h3>🎨 Visual Design</h3>
				<ul>
					<li>Matte black body with electric-blue eye</li>
					<li>Breathing animation with 3D effects</li>
					<li>Subscription-based appearance (gray free, black paid)</li>
					<li>10 customizable patterns for paid users</li>
				</ul>
			</div>
			<div class="feature-card">
				<h3>🌸 Bloom Interface</h3>
				<ul>
					<li>Tap Alice to reveal 4 mode icons</li>
					<li>Dumbbell (workouts), Apple (nutrition)</li>
					<li>Waveform (analytics), Music (radio)</li>
					<li>Play mode for private tracking</li>
				</ul>
			</div>
			<div class="feature-card">
				<h3>🧘 Specialized Modes</h3>
				<ul>
					<li>Zen mode: Muted with eye reactions</li>
					<li>Radio mode: Silent dancing animation</li>
					<li>Background monitoring: Heart rate tracking</li>
					<li>Trainer mode: Enhanced with colored rings</li>
				</ul>
			</div>
			<div class="feature-card">
				<h3>💎 Subscription Tiers</h3>
				<ul>
					<li>Free: Gray Alice, basic features</li>
					<li>Trial: Full access for 1 week</li>
					<li>Paid: Black Alice, full customization</li>
					<li>Trainer: Enhanced privileges and appearance</li>
				</ul>
			</div>
		</div>
	</div>
</div>

<style>
	.alice-demo {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		background: linear-gradient(135deg, #1a1a1a 0%, #0d1117 100%);
		min-height: 200vh; /* Make it scrollable */
		color: white;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.demo-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.demo-header h1 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
		background: linear-gradient(135deg, #00bfff, #ffffff);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.demo-header p {
		font-size: 1.2rem;
		opacity: 0.8;
		margin-bottom: 0.5rem;
	}

	.spec-note {
		font-size: 0.9rem !important;
		opacity: 0.6 !important;
		font-style: italic;
	}

	.alice-container {
		height: 300px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: radial-gradient(circle, rgba(0, 191, 255, 0.1), transparent);
		border-radius: 20px;
		margin-bottom: 3rem;
		border: 1px solid rgba(0, 191, 255, 0.2);
		position: relative;
		z-index: 1; /* Behind Alice */
	}

	.controls-panel {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 15px;
		padding: 2rem;
		margin-bottom: 3rem;
		border: 1px solid rgba(0, 191, 255, 0.1);
	}

	.controls-panel h2 {
		margin-bottom: 2rem;
		color: #00bfff;
	}

	.control-group {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.control-group:last-child {
		border-bottom: none;
	}

	.control-group h3 {
		margin-bottom: 1rem;
		color: #ffffff;
		font-size: 1.1rem;
	}

	.radio-group {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.radio-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		transition: all 0.2s ease;
	}

	.radio-option:hover {
		border-color: #00bfff;
		background: rgba(0, 191, 255, 0.1);
	}

	.tier-free { color: #888; }
	.tier-trial { color: #ffa500; }
	.tier-paid { color: #00bfff; }
	.tier-trainer { color: #50fa7b; }

	.customization-controls {
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	.pattern-selector, .color-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.pattern-selector select, .color-selector input {
		padding: 0.5rem;
		border-radius: 5px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: rgba(0, 0, 0, 0.5);
		color: white;
	}

	.state-controls {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.checkbox-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.metrics-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.slider-control {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.slider-control input[type="range"] {
		width: 100%;
		max-width: 300px;
	}

	.zen-controls {
		display: flex;
		gap: 1rem;
	}

	.zen-btn {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		border: none;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.pr-btn {
		background: #50fa7b;
		color: #000;
	}

	.pr-btn:hover {
		background: #2ed573;
		transform: translateY(-2px);
	}

	.quit-btn {
		background: #ff6b6b;
		color: white;
	}

	.quit-btn:hover {
		background: #ff5252;
		transform: translateY(-2px);
	}

	.demo-controls {
		display: flex;
		justify-content: center;
	}

	.demo-btn {
		padding: 1rem 2rem;
		border-radius: 10px;
		border: none;
		cursor: pointer;
		font-weight: 600;
		font-size: 1.1rem;
		transition: all 0.2s ease;
	}

	.start-btn {
		background: #00bfff;
		color: white;
	}

	.start-btn:hover {
		background: #0099cc;
		transform: translateY(-2px);
	}

	.stop-btn {
		background: #ff6b6b;
		color: white;
	}

	.stop-btn:hover {
		background: #ff5252;
		transform: translateY(-2px);
	}

	.eye-test-controls {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.eye-btn {
		padding: 0.8rem 1.5rem;
		border-radius: 8px;
		border: 2px solid #00bfff;
		background: rgba(0, 191, 255, 0.1);
		color: #00bfff;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.eye-btn:hover {
		background: #00bfff;
		color: white;
		transform: translateY(-2px);
	}

	.features-info {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 15px;
		padding: 2rem;
		border: 1px solid rgba(0, 191, 255, 0.1);
	}

	.features-info h2 {
		margin-bottom: 2rem;
		color: #00bfff;
		text-align: center;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.feature-card {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 10px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.feature-card h3 {
		margin-bottom: 1rem;
		color: #ffffff;
	}

	.feature-card ul {
		list-style: none;
		padding: 0;
	}

	.feature-card li {
		padding: 0.3rem 0;
		opacity: 0.8;
		border-left: 2px solid #00bfff;
		padding-left: 1rem;
		margin-bottom: 0.5rem;
	}

	@media (max-width: 768px) {
		.alice-demo {
			padding: 1rem;
		}

		.customization-controls {
			flex-direction: column;
			align-items: flex-start;
		}

		.state-controls {
			flex-direction: column;
		}

		.zen-controls {
			flex-direction: column;
		}

		.features-grid {
			grid-template-columns: 1fr;
		}
	}
</style>