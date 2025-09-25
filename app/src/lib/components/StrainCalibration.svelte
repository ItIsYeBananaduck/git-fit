<!-- Strain Calibration Component -->
<!-- 15-second jump test to calibrate user's max heart rate -->

<script>
	import { createEventDispatcher } from 'svelte';
	import { AIWorkoutIntegrationService } from '../services/aiWorkoutIntegration.js';

	const dispatch = createEventDispatcher();

	export let aiService; // AIWorkoutIntegrationService instance
	export let userId = 'demo_user';

	let calibrationState = 'prompt'; // 'prompt', 'jumping', 'measuring', 'complete'
	let jumpTimer = 0;
	let jumpInterval = null;
	let currentHeartRate = 0;
	let peakHeartRate = 0;
	let calibratedMaxHR = 0;

	// Mock heart rate data (in real app, would come from wearable device)
	let mockHR = 75; // Resting HR
	let hrVariation = 0;

	function startJumpTest() {
		calibrationState = 'jumping';
		jumpTimer = 15; // 15 seconds
		peakHeartRate = 0;

		// Start countdown and HR simulation
		jumpInterval = setInterval(() => {
			jumpTimer--;

			// Simulate increasing heart rate during jump test
			const intensity = (15 - jumpTimer) / 15; // 0 to 1
			hrVariation = Math.sin(Date.now() / 500) * 10; // Add some variation
			currentHeartRate = Math.round(75 + intensity * 120 + hrVariation); // 75 to ~195 BPM
			peakHeartRate = Math.max(peakHeartRate, currentHeartRate);

			if (jumpTimer <= 0) {
				finishJumpTest();
			}
		}, 1000);
	}

	function finishJumpTest() {
		clearInterval(jumpInterval);
		calibrationState = 'measuring';

		// Calculate calibrated max HR (85% of peak jump test HR)
		calibratedMaxHR = Math.round(peakHeartRate * 0.85);

		// Save calibration via AI service
		aiService.calibrateMaxHeartRate(userId, peakHeartRate);

		setTimeout(() => {
			calibrationState = 'complete';
		}, 2000);
	}

	function skipCalibration() {
		// Use age-based fallback calculation
		const age = 30; // Would get from user profile
		calibratedMaxHR = Math.round((220 - age) * 0.85);
		calibrationState = 'complete';
	}

	function closeCalibration() {
		dispatch('calibrationComplete', {
			calibrated: calibrationState === 'complete',
			maxHeartRate: calibratedMaxHR
		});
	}
</script>

<div class="calibration-overlay">
	<div class="calibration-modal">
		{#if calibrationState === 'prompt'}
			<div class="calibration-prompt">
				<h3>🫀 Strain Calibration</h3>
				<p class="calibration-text">
					Wanna calibrate your safe strain? Jump in place for fifteen seconds. We'll read your heart
					rate and set a real limit. Skip if you want—we'll guess based on age.
				</p>

				<div class="calibration-buttons">
					<button class="btn-primary" on:click={startJumpTest}> 🏃‍♂️ Start Jump Test </button>
					<button class="btn-secondary" on:click={skipCalibration}> Skip (Use Age-Based) </button>
				</div>
			</div>
		{:else if calibrationState === 'jumping'}
			<div class="jump-test">
				<h3>🏃‍♂️ Jump Test Active</h3>
				<div class="timer-display">
					<div class="timer-circle">
						<span class="timer-number">{jumpTimer}</span>
					</div>
				</div>

				<p class="jump-instruction">Keep jumping in place!</p>

				<div class="hr-display">
					<span class="hr-label">Current HR:</span>
					<span class="hr-value">{currentHeartRate} BPM</span>
				</div>

				<div class="progress-bar">
					<div class="progress-fill" style="width: {((15 - jumpTimer) / 15) * 100}%"></div>
				</div>
			</div>
		{:else if calibrationState === 'measuring'}
			<div class="measuring">
				<h3>📊 Analyzing Results</h3>
				<div class="spinner"></div>
				<p>Processing your heart rate data...</p>

				<div class="results-preview">
					<div>Peak HR: <strong>{peakHeartRate} BPM</strong></div>
					<div>Safe Max: <strong>{calibratedMaxHR} BPM</strong> (85% of peak)</div>
				</div>
			</div>
		{:else if calibrationState === 'complete'}
			<div class="calibration-complete">
				<h3>✅ Calibration Complete</h3>

				<div class="calibration-results">
					<div class="result-item">
						<span class="result-label">Your Safe Max HR:</span>
						<span class="result-value">{calibratedMaxHR} BPM</span>
					</div>

					<div class="result-explanation">
						<p>
							🛡️ Your workouts will automatically adjust if your heart rate exceeds this limit. This
							ensures safe, effective training while preventing overexertion.
						</p>
					</div>
				</div>

				<button class="btn-primary" on:click={closeCalibration}> Continue to Workout </button>
			</div>
		{/if}
	</div>
</div>

<style>
	.calibration-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.calibration-modal {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		max-width: 400px;
		width: 90%;
		text-align: center;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
	}

	.calibration-prompt h3 {
		margin-bottom: 1rem;
		font-size: 1.5rem;
		color: #333;
	}

	.calibration-text {
		margin-bottom: 2rem;
		line-height: 1.6;
		color: #666;
	}

	.calibration-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.btn-primary {
		background: #4caf50;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary:hover {
		background: #45a049;
		transform: translateY(-2px);
	}

	.btn-secondary {
		background: #f5f5f5;
		color: #666;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-secondary:hover {
		background: #eee;
	}

	.timer-display {
		margin: 2rem 0;
	}

	.timer-circle {
		width: 120px;
		height: 120px;
		border: 8px solid #4caf50;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto;
		position: relative;
	}

	.timer-number {
		font-size: 3rem;
		font-weight: bold;
		color: #4caf50;
	}

	.jump-instruction {
		font-size: 1.2rem;
		color: #333;
		margin: 1rem 0;
		font-weight: 600;
	}

	.hr-display {
		margin: 1.5rem 0;
		padding: 1rem;
		background: #f8f8f8;
		border-radius: 8px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.hr-label {
		color: #666;
		font-weight: 500;
	}

	.hr-value {
		font-size: 1.3rem;
		font-weight: bold;
		color: #ff6b35;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: #eee;
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #4caf50;
		transition: width 0.5s ease;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #4caf50;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 1rem auto;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.results-preview {
		margin-top: 1rem;
		padding: 1rem;
		background: #f8f8f8;
		border-radius: 8px;
	}

	.calibration-results {
		margin: 2rem 0;
	}

	.result-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 1rem 0;
		padding: 1rem;
		background: #f8f8f8;
		border-radius: 8px;
	}

	.result-label {
		color: #666;
		font-weight: 500;
	}

	.result-value {
		font-size: 1.5rem;
		font-weight: bold;
		color: #4caf50;
	}

	.result-explanation {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #e8f5e8;
		border-radius: 8px;
		border-left: 4px solid #4caf50;
	}

	.result-explanation p {
		margin: 0;
		color: #2e7d32;
		font-size: 0.9rem;
		line-height: 1.5;
	}
</style>
