<script>
	import { createEventDispatcher } from 'svelte';
	import { onMount, onDestroy } from 'svelte';

	export let exercise = '';
	export let currentRep = 0;
	export let targetReps = 10;
	export let elapsedTime = 0;
	export let heartRate = 0;
	export let spo2 = 0;
	export let strainLevel = 'moderate'; // 'low', 'moderate', 'high'

	const dispatch = createEventDispatcher();

	let timer;
	let startTime = Date.now();

	// Start timer when component mounts
	onMount(() => {
		timer = setInterval(() => {
			elapsedTime = Math.floor((Date.now() - startTime) / 1000);
		}, 1000);
	});

	onDestroy(() => {
		if (timer) {
			clearInterval(timer);
		}
	});

	function completeSet() {
		dispatch('completeSet', {
			reps: currentRep,
			duration: elapsedTime,
			heartRate,
			spo2
		});
	}

	function pauseWorkout() {
		dispatch('pauseWorkout');
	}

	function getStrainColor() {
		switch (strainLevel) {
			case 'low':
				return '#4ade80';
			case 'moderate':
				return '#fbbf24';
			case 'high':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	}

	function getStrainEmoji() {
		switch (strainLevel) {
			case 'low':
				return '🟢';
			case 'moderate':
				return '🟡';
			case 'high':
				return '🔴';
			default:
				return '⚪';
		}
	}

	function formatTime(seconds) {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<div class="wearable-in-set">
	<!-- Header -->
	<div class="header">
		<div class="exercise-info">
			<h2 class="exercise-name">{exercise}</h2>
			<div class="timer">{formatTime(elapsedTime)}</div>
		</div>
		<button class="pause-btn" on:click={pauseWorkout}>⏸️</button>
	</div>

	<!-- Main Workout Display -->
	<div class="workout-display">
		<!-- Rep Counter -->
		<div class="rep-counter">
			<div class="current-rep">{currentRep}</div>
			<div class="target-rep">/ {targetReps}</div>
		</div>

		<!-- Progress Ring -->
		<div class="progress-ring">
			<svg width="120" height="120" viewBox="0 0 120 120">
				<circle cx="60" cy="60" r="50" fill="none" stroke="#333" stroke-width="8" />
				<circle
					cx="60"
					cy="60"
					r="50"
					fill="none"
					stroke="#007aff"
					stroke-width="8"
					stroke-dasharray={`${(currentRep / targetReps) * 314} 314`}
					stroke-linecap="round"
					transform="rotate(-90 60 60)"
				/>
			</svg>
		</div>
	</div>

	<!-- Live Metrics -->
	<div class="metrics-grid">
		<!-- Heart Rate -->
		<div class="metric-card">
			<div class="metric-icon">❤️</div>
			<div class="metric-value">{heartRate || '--'}</div>
			<div class="metric-label">BPM</div>
		</div>

		<!-- SpO2 -->
		<div class="metric-card">
			<div class="metric-icon">🩸</div>
			<div class="metric-value">{spo2 || '--'}</div>
			<div class="metric-label">SpO₂</div>
		</div>

		<!-- Strain Level -->
		<div class="metric-card">
			<div class="metric-icon">{getStrainEmoji()}</div>
			<div class="metric-value" style="color: {getStrainColor()}">
				{strainLevel.toUpperCase()}
			</div>
			<div class="metric-label">Strain</div>
		</div>
	</div>

	<!-- Complete Set Button -->
	<button class="complete-set-btn" on:click={completeSet} disabled={currentRep === 0}>
		Complete Set
	</button>
</div>

<style>
	.wearable-in-set {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 16px;
		background: #000;
		color: #fff;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.exercise-info {
		flex: 1;
	}

	.exercise-name {
		font-size: 16px;
		font-weight: 600;
		margin: 0 0 4px 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.timer {
		font-size: 14px;
		color: #888;
		font-variant-numeric: tabular-nums;
	}

	.pause-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: none;
		background: #333;
		color: #fff;
		font-size: 14px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.workout-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 24px;
	}

	.rep-counter {
		display: flex;
		align-items: baseline;
		margin-bottom: 16px;
	}

	.current-rep {
		font-size: 48px;
		font-weight: bold;
		font-variant-numeric: tabular-nums;
	}

	.target-rep {
		font-size: 24px;
		color: #888;
		margin-left: 8px;
	}

	.progress-ring {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 12px;
		margin-bottom: 24px;
	}

	.metric-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 12px;
		background: #1a1a1a;
		border-radius: 8px;
		text-align: center;
	}

	.metric-icon {
		font-size: 20px;
		margin-bottom: 4px;
	}

	.metric-value {
		font-size: 18px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.metric-label {
		font-size: 12px;
		color: #888;
		margin-top: 2px;
	}

	.complete-set-btn {
		width: 100%;
		padding: 16px;
		border-radius: 8px;
		border: none;
		background: #007aff;
		color: #fff;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.complete-set-btn:hover:not(:disabled) {
		background: #0056cc;
	}

	.complete-set-btn:disabled {
		background: #333;
		cursor: not-allowed;
		opacity: 0.6;
	}
</style>
