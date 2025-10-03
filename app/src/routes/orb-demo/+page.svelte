<!-- AliceOrb Demo Page
This page demonstrates the refined ferrofluid AliceOrb with all its features
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import AliceOrb from '../../lib/components/AliceOrb.svelte';
	import ColorCustomizer from '../../lib/components/ColorCustomizer.svelte';

	// Demo state
	let strain = 65; // Start with visible strain
	let isResting = false;
	let restTime = 30;
	let musicActive = true; // Start with music active to show sync
	let earbudsConnected = true; // Start with earbuds to show effects
	let orbSize = 180; // Increased default size for better visibility
		let baseColor = '#0a0a0a'; // Dark blob center to match reference

	// Animation demo
	let autoDemo = false;
	let demoInterval: ReturnType<typeof setInterval> | null = null;

	function startAutoDemo() {
		autoDemo = true;
		demoInterval = setInterval(() => {
			// Cycle through different strain levels
			strain = 20 + Math.sin(Date.now() * 0.001) * 40 + 40; // 20-100 range
			
			// Randomly toggle music and earbuds
			if (Math.random() > 0.8) {
				musicActive = !musicActive;
			}
			if (Math.random() > 0.9) {
				earbudsConnected = !earbudsConnected;
			}
			
			// Simulate rest periods
			if (Math.random() > 0.85) {
				isResting = !isResting;
				restTime = 15 + Math.random() * 30;
			}
		}, 500);
	}

	function stopAutoDemo() {
		autoDemo = false;
		if (demoInterval) {
			clearInterval(demoInterval);
		}
	}

	onMount(() => {
		return () => {
			if (demoInterval) {
				clearInterval(demoInterval);
			}
		};
	});

	// Handle orb events
	function handleMorphComplete(event: CustomEvent) {
		console.log('Orb morphed to:', event.detail.mood);
	}

	function handleStrainChange(event: CustomEvent) {
		console.log('Strain changed:', event.detail);
	}

	function handleEyeUpdate(event: CustomEvent) {
		console.log('Eye updated:', event.detail);
	}

	function handleColorChange(event: CustomEvent) {
		baseColor = event.detail.color;
		console.log('Color changed to:', baseColor);
	}
</script>

<svelte:head>
	<title>AliceOrb Demo - GitFit</title>
	<meta name="description" content="Interactive demo of the refined ferrofluid AliceOrb component" />
</svelte:head>

<div class="demo-container">
	<div class="demo-header">
		<h1>Alice AI - Liquid Metal Orb Demo</h1>
		<p>Experience Alice's sophisticated ferrofluid form with realistic liquid metal aesthetics, organic movement, and musical synchronization</p>
	</div>

	<div class="demo-layout">
		<!-- Orb Display -->
		<div class="orb-section">
			<div class="orb-display">
				<AliceOrb
					{strain}
					{isResting}
					restTimeRemaining={restTime}
					{musicActive}
					{earbudsConnected}
					size={orbSize}
					{baseColor}
					on:morphComplete={handleMorphComplete}
					on:strainChange={handleStrainChange}
					on:eyeUpdate={handleEyeUpdate}
				/>
			</div>
			
			<div class="orb-info">
				<h3>Current State</h3>
				<div class="state-grid">
					<div class="state-item">
						<span class="label">Strain:</span>
						<span class="value">{Math.round(strain)}%</span>
					</div>
					<div class="state-item">
						<span class="label">Status:</span>
						<span class="value">{isResting ? 'Resting' : 'Active'}</span>
					</div>
					<div class="state-item">
						<span class="label">Music:</span>
						<span class="value">{musicActive ? 'Playing' : 'Off'}</span>
					</div>
					<div class="state-item">
						<span class="label">Earbuds:</span>
						<span class="value">{earbudsConnected ? 'Connected' : 'Disconnected'}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Controls -->
		<div class="controls-section">
			<div class="control-group">
				<h3>Manual Controls</h3>
				
				<div class="control-item">
					<label for="strain-slider">Strain Level: {Math.round(strain)}%</label>
					<input 
						id="strain-slider"
						type="range" 
						min="0" 
						max="120" 
						bind:value={strain}
						disabled={autoDemo}
					/>
				</div>

				<div class="control-item">
					<label for="orb-size">Orb Size: {orbSize}px</label>
					<input 
						id="orb-size"
						type="range" 
						min="80" 
						max="200" 
						bind:value={orbSize}
					/>
				</div>

				<div class="control-item">
					<label for="rest-time">Rest Time: {Math.round(restTime)}s</label>
					<input 
						id="rest-time"
						type="range" 
						min="5" 
						max="60" 
						bind:value={restTime}
						disabled={!isResting}
					/>
				</div>

				<div class="toggle-group">
					<label class="toggle">
						<input type="checkbox" bind:checked={isResting} disabled={autoDemo} />
						<span>Resting</span>
					</label>
					<label class="toggle">
						<input type="checkbox" bind:checked={musicActive} disabled={autoDemo} />
						<span>Music Active</span>
					</label>
					<label class="toggle">
						<input type="checkbox" bind:checked={earbudsConnected} disabled={autoDemo} />
						<span>Earbuds Connected</span>
					</label>
				</div>

				<div class="demo-controls">
					{#if !autoDemo}
						<button class="demo-btn primary" on:click={startAutoDemo}>
							Start Auto Demo
						</button>
					{:else}
						<button class="demo-btn secondary" on:click={stopAutoDemo}>
							Stop Auto Demo
						</button>
					{/if}
				</div>
			</div>

			<!-- Color Customizer -->
			<div class="color-section">
				<h3>Color Customization</h3>
				<ColorCustomizer
					initialHue={200}
					disabled={false}
					on:colorChange={handleColorChange}
				/>
			</div>
		</div>
	</div>

	<div class="features-section">
		<h3>AliceOrb Features</h3>
		<div class="features-grid">
			<div class="feature">
				<h4>🌊 Liquid Metal Aesthetics</h4>
				<p>Alice now matches her sophisticated logo design with glossy metallic surfaces, dark cores, bright edge highlights, and realistic depth shadows</p>
			</div>
			<div class="feature">
				<h4>🔄 Continuous Organic Movement</h4>
				<p>Always subtly moving like real ferrofluid with organic shape variations. Alice breathes and flows naturally, creating a living presence</p>
			</div>
			<div class="feature">
				<h4>🎵 Musical Synchronization</h4>
				<p>When music is active, Alice syncs her movement to rhythmic beats with larger amplitude distortions and eye size pulsing</p>
			</div>
			<div class="feature">
				<h4>� Multi-Layer Rendering</h4>
				<p>Dark metallic core, main liquid body, and glossy highlight layers create authentic 3D depth like the logo design</p>
			</div>
			<div class="feature">
				<h4>👁️ Bright Eye Display</h4>
				<p>White text with glowing shadows displays capped strain percentage or rest timer, matching the logo's bright contrast</p>
			</div>
			<div class="feature">
				<h4>🎨 Sophisticated Gradients</h4>
				<p>Complex radial gradients create metallic shine with highlights, mid-tones, and deep shadows for realistic liquid metal appearance</p>
			</div>
			<div class="feature">
				<h4>♿ Accessibility</h4>
				<p>Respects reduced motion preferences and high contrast mode for inclusive design</p>
			</div>
		</div>
	</div>
</div>

<style>
	.demo-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		min-height: 100vh;
	}

	.demo-header {
		text-align: center;
		margin-bottom: 40px;
		padding: 20px;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	.demo-header h1 {
		font-size: 3rem;
		margin-bottom: 10px;
		background: linear-gradient(135deg, #00BFFF, #1E90FF);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.demo-header p {
		font-size: 1.2rem;
		color: #666;
		margin: 0;
	}

	.demo-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 40px;
		margin-bottom: 40px;
	}

	.orb-section {
		background: white;
		border-radius: 16px;
		padding: 30px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	.orb-display {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 200px;
		margin-bottom: 30px;
		background: radial-gradient(circle, #fafafa, #f0f0f0);
		border-radius: 12px;
		padding: 20px;
	}

	.orb-info h3 {
		margin-bottom: 20px;
		color: #333;
		border-bottom: 2px solid #00BFFF;
		padding-bottom: 10px;
	}

	.state-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 15px;
	}

	.state-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.state-item .label {
		font-weight: 600;
		color: #555;
	}

	.state-item .value {
		font-weight: 700;
		color: #00BFFF;
	}

	.controls-section {
		display: flex;
		flex-direction: column;
		gap: 30px;
	}

	.control-group {
		background: white;
		border-radius: 16px;
		padding: 30px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	.control-group h3 {
		margin-bottom: 20px;
		color: #333;
		border-bottom: 2px solid #00BFFF;
		padding-bottom: 10px;
	}

	.control-item {
		margin-bottom: 20px;
	}

	.control-item label {
		display: block;
		margin-bottom: 8px;
		font-weight: 600;
		color: #555;
	}

	.control-item input[type="range"] {
		width: 100%;
		height: 6px;
		background: #ddd;
		border-radius: 3px;
		outline: none;
		-webkit-appearance: none;
		appearance: none;
	}

	.control-item input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: #00BFFF;
		border-radius: 50%;
		cursor: pointer;
	}

	.toggle-group {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 20px;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		padding: 8px;
		border-radius: 6px;
		transition: background-color 0.2s;
	}

	.toggle:hover {
		background: #f8f9fa;
	}

	.toggle input[type="checkbox"] {
		width: 18px;
		height: 18px;
		accent-color: #00BFFF;
	}

	.demo-controls {
		text-align: center;
	}

	.demo-btn {
		padding: 12px 24px;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 1rem;
	}

	.demo-btn.primary {
		background: #00BFFF;
		color: white;
	}

	.demo-btn.primary:hover {
		background: #0099CC;
		transform: translateY(-2px);
	}

	.demo-btn.secondary {
		background: #6c757d;
		color: white;
	}

	.demo-btn.secondary:hover {
		background: #5a6268;
		transform: translateY(-2px);
	}

	.color-section {
		background: white;
		border-radius: 16px;
		padding: 30px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	.color-section h3 {
		margin-bottom: 20px;
		color: #333;
		border-bottom: 2px solid #00BFFF;
		padding-bottom: 10px;
	}

	.features-section {
		background: white;
		border-radius: 16px;
		padding: 30px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	.features-section h3 {
		margin-bottom: 30px;
		color: #333;
		border-bottom: 2px solid #00BFFF;
		padding-bottom: 10px;
		font-size: 1.5rem;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
	}

	.feature {
		padding: 20px;
		background: #f8f9fa;
		border-radius: 12px;
		border-left: 4px solid #00BFFF;
	}

	.feature h4 {
		margin-bottom: 10px;
		color: #333;
		font-size: 1.1rem;
	}

	.feature p {
		color: #666;
		line-height: 1.5;
		margin: 0;
	}

	@media (max-width: 1024px) {
		.demo-layout {
			grid-template-columns: 1fr;
		}
		
		.features-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 768px) {
		.demo-container {
			padding: 15px;
		}
		
		.demo-header h1 {
			font-size: 2rem;
		}
		
		.state-grid {
			grid-template-columns: 1fr;
		}
	}
</style>