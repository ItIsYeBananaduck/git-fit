<!-- Wearable Workout UI Demo
This demonstrates the complete wearable workout experience
-->

<script lang="ts">
	import WearableWorkoutController from '../lib/components/WearableWorkoutController.svelte';

	// Sample workout data
	let workout = {
		exercise: 'Bench Press',
		targetReps: 10,
		targetWeight: 185,
		totalSets: 3
	};

	// Simulated live metrics (in real app, these would come from wearable sensors)
	let liveMetrics = {
		heartRate: 145,
		spo2: 98,
		strainLevel: 'moderate'
	};

	// Simulate changing metrics for demo
	let metricInterval;
	import { onMount } from 'svelte';

	onMount(() => {
		metricInterval = setInterval(() => {
			// Simulate heart rate variation
			liveMetrics.heartRate = 135 + Math.floor(Math.random() * 30);

			// Simulate SpO2 variation
			liveMetrics.spo2 = 96 + Math.floor(Math.random() * 4);

			// Simulate strain level changes
			const strainLevels = ['low', 'moderate', 'high'];
			liveMetrics.strainLevel = strainLevels[Math.floor(Math.random() * strainLevels.length)];
		}, 3000);
	});

	function handleSetFeedback(event: CustomEvent) {
		console.log('Set feedback received:', event.detail);
		// In real app, this would update the adaptive training algorithm
	}

	function handleWorkoutComplete(event: CustomEvent) {
		console.log('Workout completed:', event.detail);
		// In real app, this would save workout data and show summary
	}

	function handleWorkoutPaused() {
		console.log('Workout paused');
		// In real app, this would show pause menu
	}
</script>

<div class="demo-container">
	<div class="demo-header">
		<h1>Wearable Workout UI Demo</h1>
		<p>This demonstrates the complete wearable workout experience with live metrics simulation.</p>
	</div>

	<div class="wearable-simulator">
		<div class="wearable-frame">
			<WearableWorkoutController
				{workout}
				{liveMetrics}
				on:setFeedback={handleSetFeedback}
				on:workoutComplete={handleWorkoutComplete}
				on:workoutPaused={handleWorkoutPaused}
			/>
		</div>
	</div>

	<div class="demo-controls">
		<h3>Demo Controls</h3>
		<div class="control-group">
			<label for="heartRate">Heart Rate: {liveMetrics.heartRate} BPM</label>
			<input id="heartRate" type="range" min="100" max="180" bind:value={liveMetrics.heartRate} />
		</div>

		<div class="control-group">
			<label for="spo2">SpO₂: {liveMetrics.spo2}%</label>
			<input id="spo2" type="range" min="90" max="100" bind:value={liveMetrics.spo2} />
		</div>

		<div class="control-group">
			<label for="strainLevel">Strain Level:</label>
			<select id="strainLevel" bind:value={liveMetrics.strainLevel}>
				<option value="low">Low</option>
				<option value="moderate">Moderate</option>
				<option value="high">High</option>
			</select>
		</div>
	</div>

	<div class="demo-info">
		<h3>How to Use</h3>
		<ul>
			<li><strong>Pre-set Screen:</strong> Adjust reps and weight using the controls</li>
			<li><strong>In-set Screen:</strong> Tap to count reps, watch live metrics</li>
			<li><strong>Feedback:</strong> Rate difficulty after each set</li>
			<li><strong>Post-set:</strong> Quick summary before next set</li>
		</ul>

		<h3>Wearable Features</h3>
		<ul>
			<li>Rotary crown support for adjustments</li>
			<li>Haptic feedback integration</li>
			<li>Live health metrics display</li>
			<li>Adaptive strain monitoring</li>
		</ul>
	</div>
</div>

<style>
	.demo-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
	}

	.demo-header {
		text-align: center;
		margin-bottom: 40px;
	}

	.demo-header h1 {
		font-size: 2.5rem;
		margin-bottom: 10px;
		background: linear-gradient(135deg, #007aff, #5ac8fa);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.demo-header p {
		font-size: 1.1rem;
		color: #666;
	}

	.wearable-simulator {
		display: flex;
		justify-content: center;
		margin-bottom: 40px;
	}

	.wearable-frame {
		width: 200px;
		height: 300px;
		border-radius: 25px;
		background: #000;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		overflow: hidden;
		position: relative;
	}

	.wearable-frame::before {
		content: '';
		position: absolute;
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
		width: 120px;
		height: 8px;
		background: #333;
		border-radius: 4px;
		z-index: 10;
	}

	.demo-controls {
		background: #f8f9fa;
		padding: 20px;
		border-radius: 12px;
		margin-bottom: 30px;
	}

	.demo-controls h3 {
		margin-bottom: 15px;
		color: #333;
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 15px;
		margin-bottom: 15px;
	}

	.control-group label {
		min-width: 120px;
		font-weight: 500;
	}

	.control-group input,
	.control-group select {
		flex: 1;
		max-width: 200px;
	}

	.demo-info {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 30px;
	}

	.demo-info h3 {
		color: #333;
		margin-bottom: 15px;
	}

	.demo-info ul {
		list-style: none;
		padding: 0;
	}

	.demo-info li {
		margin-bottom: 8px;
		padding-left: 20px;
		position: relative;
	}

	.demo-info li::before {
		content: '✓';
		position: absolute;
		left: 0;
		color: #007aff;
		font-weight: bold;
	}

	@media (max-width: 768px) {
		.demo-info {
			grid-template-columns: 1fr;
		}

		.wearable-frame {
			width: 180px;
			height: 270px;
		}
	}
</style>
