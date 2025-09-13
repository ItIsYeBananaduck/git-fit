<script>
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';

	export let exercise = '';
	export let setNumber = 1;
	export let totalSets = 3;
	export let completedReps = 10;
	export let targetReps = 10;
	export let duration = 45; // seconds
	export let avgHeartRate = 145;
	export let strainLevel = 'moderate';
	export let isVisible = true;

	const dispatch = createEventDispatcher();

	let autoAdvanceTimer;
	let countdown = 3;

	onMount(() => {
		// Auto-advance after 3 seconds
		autoAdvanceTimer = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				nextSet();
			}
		}, 1000);
	});

	function nextSet() {
		if (autoAdvanceTimer) {
			clearInterval(autoAdvanceTimer);
		}
		dispatch('nextSet');
	}

	function repeatSet() {
		if (autoAdvanceTimer) {
			clearInterval(autoAdvanceTimer);
		}
		dispatch('repeatSet');
	}

	function endWorkout() {
		if (autoAdvanceTimer) {
			clearInterval(autoAdvanceTimer);
		}
		dispatch('endWorkout');
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

	$: completionRate = Math.round((completedReps / targetReps) * 100);
	$: isLastSet = setNumber >= totalSets;
</script>

{#if isVisible}
	<div class="wearable-post-set">
		<!-- Header -->
		<div class="summary-header">
			<div class="set-complete-icon">✅</div>
			<h2 class="summary-title">Set {setNumber} Complete!</h2>
			<div class="auto-advance">Next in {countdown}s</div>
		</div>

		<!-- Quick Stats -->
		<div class="quick-stats">
			<div class="stat-item">
				<div class="stat-value">{completedReps}</div>
				<div class="stat-label">Reps</div>
			</div>
			<div class="stat-item">
				<div class="stat-value">{formatTime(duration)}</div>
				<div class="stat-label">Time</div>
			</div>
			<div class="stat-item">
				<div class="stat-value" style="color: {getStrainColor()}">
					{getStrainEmoji()}
				</div>
				<div class="stat-label">Strain</div>
			</div>
		</div>

		<!-- Performance Indicator -->
		<div class="performance-indicator">
			<div class="completion-rate">
				<span class="rate-text">{completionRate}%</span>
				<span class="rate-label">Complete</span>
			</div>
			{#if avgHeartRate > 0}
				<div class="heart-rate">
					<span class="hr-text">{avgHeartRate}</span>
					<span class="hr-label">Avg BPM</span>
				</div>
			{/if}
		</div>

		<!-- Action Buttons -->
		<div class="action-buttons">
			{#if !isLastSet}
				<button class="primary-btn" on:click={nextSet}> Next Set </button>
			{:else}
				<button class="primary-btn" on:click={endWorkout}> Finish Workout </button>
			{/if}

			<div class="secondary-actions">
				<button class="secondary-btn" on:click={repeatSet}> Repeat Set </button>
				{#if !isLastSet}
					<button class="secondary-btn" on:click={endWorkout}> End Early </button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.wearable-post-set {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 20px;
		background: #000;
		color: #fff;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
	}

	.summary-header {
		text-align: center;
		margin-bottom: 24px;
	}

	.set-complete-icon {
		font-size: 32px;
		margin-bottom: 8px;
	}

	.summary-title {
		font-size: 20px;
		font-weight: 600;
		margin: 0 0 8px 0;
	}

	.auto-advance {
		font-size: 14px;
		color: #888;
		font-variant-numeric: tabular-nums;
	}

	.quick-stats {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 16px;
		margin-bottom: 24px;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 12px;
		background: #1a1a1a;
		border-radius: 8px;
		text-align: center;
	}

	.stat-value {
		font-size: 24px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.stat-label {
		font-size: 12px;
		color: #888;
		margin-top: 4px;
	}

	.performance-indicator {
		display: flex;
		justify-content: center;
		gap: 24px;
		margin-bottom: 32px;
		padding: 16px;
		background: #1a1a1a;
		border-radius: 8px;
	}

	.completion-rate,
	.heart-rate {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.rate-text,
	.hr-text {
		font-size: 18px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.rate-label,
	.hr-label {
		font-size: 12px;
		color: #888;
		margin-top: 2px;
	}

	.action-buttons {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.primary-btn {
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

	.primary-btn:hover {
		background: #0056cc;
	}

	.secondary-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.secondary-btn {
		padding: 12px;
		border-radius: 6px;
		border: 1px solid #444;
		background: #2a2a2a;
		color: #fff;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.secondary-btn:hover {
		background: #333;
		border-color: #666;
	}

	/* Wearable-specific responsive adjustments */
	@media (max-width: 200px) {
		.wearable-post-set {
			padding: 16px;
		}

		.summary-title {
			font-size: 18px;
		}

		.quick-stats {
			gap: 8px;
		}

		.stat-item {
			padding: 8px;
		}

		.stat-value {
			font-size: 20px;
		}

		.performance-indicator {
			gap: 16px;
			padding: 12px;
		}

		.rate-text,
		.hr-text {
			font-size: 16px;
		}
	}
</style>
