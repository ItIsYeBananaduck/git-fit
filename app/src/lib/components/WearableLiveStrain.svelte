<!-- 
  Simplified Wearable Live Strain Display
  Shows only essential strain and intensity metrics for wearable devices
  
  Focuses on:
  - Live strain score (0-100)
  - Intensity capacity (0-100) 
  - Heart rate status (green/yellow/red)
  - SpO2 status (green/yellow/red)
  - Overall status indicator
  - Minimal, wearable-friendly UI
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import {
		enhancedStrainCoachingService,
		type LiveStrainMetrics
	} from '$lib/services/enhancedStrainCoachingService.js';

	export let userId: string = 'demo-user';
	export let currentHeartRate: number = 75;
	export let currentSpO2: number = 98;
	export let baselineHeartRate: number = 65;
	export let baselineSpO2: number = 97;

	let liveMetrics: LiveStrainMetrics | null = null;
	let isLoading = true;
	let updateInterval: NodeJS.Timeout;

	// Update live metrics every 5 seconds for wearable
	onMount(() => {
		updateLiveMetrics();
		updateInterval = setInterval(updateLiveMetrics, 5000);

		return () => {
			if (updateInterval) clearInterval(updateInterval);
		};
	});

	async function updateLiveMetrics() {
		try {
			liveMetrics = await enhancedStrainCoachingService.calculateLiveStrainMetrics(
				userId,
				currentHeartRate,
				currentSpO2,
				baselineHeartRate,
				baselineSpO2
			);
			isLoading = false;
		} catch (error) {
			console.error('Failed to update live strain metrics:', error);
			isLoading = false;
		}
	}

	function getStatusColor(status: 'green' | 'yellow' | 'red'): string {
		switch (status) {
			case 'green':
				return '#22c55e';
			case 'yellow':
				return '#eab308';
			case 'red':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	}

	function getOverallStatusEmoji(status: string): string {
		switch (status) {
			case 'ready':
				return '🟢';
			case 'moderate':
				return '🟡';
			case 'compromised':
				return '🟠';
			case 'high_risk':
				return '🔴';
			default:
				return '⚪';
		}
	}

	function getIntensityRecommendation(intensityScore: number): string {
		if (intensityScore > 80) return 'PUSH HARD';
		if (intensityScore > 60) return 'MODERATE';
		if (intensityScore > 40) return 'LIGHT';
		return 'REST';
	}
</script>

<!-- Wearable-optimized layout -->
<div class="wearable-strain-display">
	{#if isLoading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading...</p>
		</div>
	{:else if liveMetrics}
		<!-- Main Strain Score -->
		<div class="strain-circle">
			<div class="strain-value">{liveMetrics.currentStrain}</div>
			<div class="strain-label">STRAIN</div>
		</div>

		<!-- Intensity Capacity -->
		<div class="intensity-section">
			<div class="intensity-bar">
				<div
					class="intensity-fill"
					style="width: {liveMetrics.intensityScore}%; background: linear-gradient(90deg, #ef4444 0%, #eab308 50%, #22c55e 100%)"
				></div>
			</div>
			<div class="intensity-text">
				<span class="intensity-value">{liveMetrics.intensityScore}%</span>
				<span class="intensity-rec">{getIntensityRecommendation(liveMetrics.intensityScore)}</span>
			</div>
		</div>

		<!-- Health Status Indicators -->
		<div class="status-grid">
			<div class="status-item">
				<div class="status-icon" style="color: {getStatusColor(liveMetrics.heartRateStatus)}">
					❤️
				</div>
				<div class="status-label">HR</div>
			</div>

			<div class="status-item">
				<div class="status-icon" style="color: {getStatusColor(liveMetrics.spo2Status)}">🩸</div>
				<div class="status-label">SpO₂</div>
			</div>

			<div class="status-item">
				<div class="status-icon">{getOverallStatusEmoji(liveMetrics.overallStatus)}</div>
				<div class="status-label">{liveMetrics.overallStatus.toUpperCase()}</div>
			</div>
		</div>

		<!-- Confidence Score -->
		<div class="confidence">
			<div class="confidence-bar">
				<div
					class="confidence-fill"
					style="width: {liveMetrics.confidence}%; background: {liveMetrics.confidence > 70
						? '#22c55e'
						: liveMetrics.confidence > 40
							? '#eab308'
							: '#ef4444'}"
				></div>
			</div>
			<div class="confidence-label">Confidence {liveMetrics.confidence}%</div>
		</div>

		<!-- Timestamp -->
		<div class="timestamp">
			Last Update: {new Date(liveMetrics.timestamp).toLocaleTimeString()}
		</div>
	{:else}
		<div class="error">
			<p>Unable to load strain data</p>
			<button on:click={updateLiveMetrics}>Retry</button>
		</div>
	{/if}
</div>

<style>
	.wearable-strain-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 1rem;
		background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
		color: white;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		text-align: center;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #4b5563;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.strain-circle {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		border: 4px solid #3b82f6;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.5rem;
		background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
	}

	.strain-value {
		font-size: 2.5rem;
		font-weight: bold;
		color: #3b82f6;
	}

	.strain-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #94a3b8;
		margin-top: -0.25rem;
	}

	.intensity-section {
		width: 100%;
		max-width: 200px;
		margin-bottom: 1.5rem;
	}

	.intensity-bar {
		width: 100%;
		height: 8px;
		background: #374151;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.intensity-fill {
		height: 100%;
		border-radius: 4px;
		transition: width 0.5s ease;
	}

	.intensity-text {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
	}

	.intensity-value {
		font-weight: bold;
		color: #e5e7eb;
	}

	.intensity-rec {
		font-weight: 600;
		color: #94a3b8;
		font-size: 0.75rem;
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
		width: 100%;
		max-width: 200px;
	}

	.status-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.status-icon {
		font-size: 1.5rem;
	}

	.status-label {
		font-size: 0.625rem;
		font-weight: 600;
		color: #94a3b8;
	}

	.confidence {
		width: 100%;
		max-width: 160px;
		margin-bottom: 1rem;
	}

	.confidence-bar {
		width: 100%;
		height: 4px;
		background: #374151;
		border-radius: 2px;
		overflow: hidden;
		margin-bottom: 0.25rem;
	}

	.confidence-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 0.5s ease;
	}

	.confidence-label {
		font-size: 0.625rem;
		color: #94a3b8;
		text-align: center;
	}

	.timestamp {
		font-size: 0.5rem;
		color: #6b7280;
		margin-top: 0.5rem;
	}

	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.error button {
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.error button:hover {
		background: #2563eb;
	}

	/* Wearable-specific optimizations */
	@media (max-width: 300px) {
		.wearable-strain-display {
			padding: 0.5rem;
		}

		.strain-circle {
			width: 100px;
			height: 100px;
		}

		.strain-value {
			font-size: 2rem;
		}

		.status-grid {
			gap: 0.5rem;
		}
	}
</style>
