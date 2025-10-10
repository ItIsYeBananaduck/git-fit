<script>
	import AliceAvatar from '$lib/components/AliceAvatar.svelte';

	let currentStrain = 3;
	let selectedColor = '#4b0082';

	const colors = [
		'#4b0082', // Purple
		'#ff6b6b', // Red
		'#4ecdc4', // Teal
		'#45b7d1', // Blue
		'#96ceb4', // Green
		'#ffeaa7', // Yellow
	];

	function updateStrain(newStrain) {
		currentStrain = newStrain;
		// In a real app, this would update Alice's expression
		console.log('Strain updated to:', newStrain);
	}

	function updateColor(newColor) {
		selectedColor = newColor;
		// In a real app, this would update Alice's color
		console.log('Color updated to:', newColor);
	}
</script>

<div class="alice-demo">
	<h1>🎨 Alice Avatar Demo</h1>

	<div class="demo-container">
		<div class="alice-section">
			<h2>Alice's Avatar</h2>
			<div class="avatar-wrapper">
				<AliceAvatar />
			</div>
			<p class="description">
				Alice is a color-customizable avatar with AI-driven expressions based on your workout strain.
				She floats gently and glows with different intensities based on your activity level.
			</p>
		</div>

		<div class="controls-section">
			<h2>Interactive Controls</h2>

			<div class="control-group">
				<label for="strain-slider">Workout Strain Level: {currentStrain}</label>
				<input
					id="strain-slider"
					type="range"
					min="0"
					max="10"
					step="1"
					bind:value={currentStrain}
					on:input={() => updateStrain(currentStrain)}
				/>
				<div class="strain-labels">
					<span>Resting</span>
					<span>Light</span>
					<span>Moderate</span>
					<span>Intense</span>
					<span>Maximum</span>
				</div>
			</div>

			<div class="control-group">
				<label>Avatar Color:</label>
				<div class="color-picker">
					{#each colors as color}
						<button
							class="color-option"
							style="background-color: {color}"
							class:selected={selectedColor === color}
							on:click={() => updateColor(color)}
						></button>
					{/each}
				</div>
			</div>

			<div class="expression-info">
				<h3>Current Expression:</h3>
				<p>
					{#if currentStrain > 8}
						<span class="expression energetic">⚡ Energetic (High Glow)</span>
					{:else if currentStrain > 5}
						<span class="expression focused">🎯 Focused (Medium Glow)</span>
					{:else}
						<span class="expression calm">😌 Calm (Low Glow)</span>
					{/if}
				</p>
			</div>
		</div>
	</div>

	<div class="features-section">
		<h2>✨ Alice's Features</h2>
		<div class="features-grid">
			<div class="feature">
				<h3>🤖 AI Expressions</h3>
				<p>Llama 3.1 analyzes your strain levels to determine Alice's mood and glow intensity</p>
			</div>
			<div class="feature">
				<h3>📱 Health Integration</h3>
				<p>Connects to HealthKit/Whoop for real-time workout metrics and activity tracking</p>
			</div>
			<div class="feature">
				<h3>🎨 Customization</h3>
				<p>Choose from multiple colors and watch Alice adapt to your preferences</p>
			</div>
			<div class="feature">
				<h3>☁️ Cloud Sync</h3>
				<p>Avatar preferences are saved to Fly.io and sync across all your devices</p>
			</div>
			<div class="feature">
				<h3>📱 Mobile Optimized</h3>
				<p>Works on iPhone 7+ and Android API 19+ with canvas fallbacks for older devices</p>
			</div>
			<div class="feature">
				<h3>🏃 Performance</h3>
				<p>Smooth 30 FPS animations with lightweight CSS for optimal battery life</p>
			</div>
		</div>
	</div>
</div>

<style>
	.alice-demo {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	h1 {
		text-align: center;
		color: #4b0082;
		margin-bottom: 3rem;
		font-size: 2.5rem;
	}

	h2 {
		color: #333;
		margin-bottom: 1.5rem;
		font-size: 1.8rem;
	}

	.demo-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		margin-bottom: 4rem;
		align-items: start;
	}

	.alice-section {
		text-align: center;
	}

	.avatar-wrapper {
		display: flex;
		justify-content: center;
		margin: 2rem 0;
		padding: 2rem;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		border-radius: 20px;
		box-shadow: 0 10px 30px rgba(0,0,0,0.1);
	}

	.description {
		color: #666;
		line-height: 1.6;
		font-size: 1.1rem;
		max-width: 400px;
		margin: 0 auto;
	}

	.controls-section {
		background: #f8f9fa;
		padding: 2rem;
		border-radius: 15px;
		box-shadow: 0 5px 15px rgba(0,0,0,0.08);
	}

	.control-group {
		margin-bottom: 2rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #333;
	}

	input[type="range"] {
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: #ddd;
		outline: none;
		-webkit-appearance: none;
	}

	input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #4b0082;
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0,0,0,0.2);
	}

	.strain-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: #666;
	}

	.color-picker {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.color-option {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 3px solid #fff;
		box-shadow: 0 2px 8px rgba(0,0,0,0.15);
		cursor: pointer;
		transition: transform 0.2s;
	}

	.color-option:hover {
		transform: scale(1.1);
	}

	.color-option.selected {
		border-color: #333;
		box-shadow: 0 0 0 3px #4b0082;
	}

	.expression-info {
		margin-top: 2rem;
		padding: 1rem;
		background: white;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0,0,0,0.05);
	}

	.expression {
		font-weight: bold;
		font-size: 1.1rem;
	}

	.expression.energetic { color: #ff6b6b; }
	.expression.focused { color: #4ecdc4; }
	.expression.calm { color: #96ceb4; }

	.features-section {
		margin-top: 4rem;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-top: 2rem;
	}

	.feature {
		background: white;
		padding: 1.5rem;
		border-radius: 15px;
		box-shadow: 0 5px 15px rgba(0,0,0,0.08);
		transition: transform 0.3s;
	}

	.feature:hover {
		transform: translateY(-5px);
	}

	.feature h3 {
		color: #4b0082;
		margin-bottom: 0.5rem;
		font-size: 1.2rem;
	}

	.feature p {
		color: #666;
		line-height: 1.5;
		margin: 0;
	}

	@media (max-width: 768px) {
		.demo-container {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.features-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
