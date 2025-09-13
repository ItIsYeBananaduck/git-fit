<script>
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';

	export let exercise = '';
	export let targetReps = 10;
	export let targetWeight = 0;
	export let currentSet = 1;
	export let totalSets = 3;

	const dispatch = createEventDispatcher();

	let isAdjusting = false;

	function startWorkout() {
		dispatch('startWorkout', {
			exercise,
			targetReps,
			targetWeight,
			totalSets
		});
	}

	function adjustReps(delta) {
		targetReps = Math.max(1, Math.min(50, targetReps + delta));
	}

	function adjustWeight(delta) {
		targetWeight = Math.max(0, targetWeight + delta);
	}

	// Handle rotary input for adjustments
	function handleRotary(event) {
		if (!isAdjusting) return;

		const delta = event.delta > 0 ? 1 : -1;
		if (isAdjusting === 'reps') {
			adjustReps(delta);
		} else if (isAdjusting === 'weight') {
			adjustWeight(delta * 2.5); // 2.5kg increments
		}
	}

	onMount(() => {
		// Add rotary event listener for wearables
		if (typeof window !== 'undefined' && 'addEventListener' in window) {
			window.addEventListener('rotarydetent', handleRotary);
		}

		return () => {
			if (typeof window !== 'undefined' && 'removeEventListener' in window) {
				window.removeEventListener('rotarydetent', handleRotary);
			}
		};
	});
</script>

<div class="wearable-pre-set">
	<!-- Exercise Header -->
	<div class="exercise-header">
		<h2 class="exercise-name">{exercise}</h2>
		<div class="set-indicator">Set {currentSet} of {totalSets}</div>
	</div>

	<!-- Target Settings -->
	<div class="target-settings">
		<!-- Reps Adjustment -->
		<div class="adjustment-group" class:active={isAdjusting === 'reps'}>
			<label class="adjustment-label">Reps</label>
			<div class="adjustment-controls">
				<button class="adjust-btn" on:click={() => adjustReps(-1)} disabled={targetReps <= 1}
					>−</button
				>
				<span class="value">{targetReps}</span>
				<button class="adjust-btn" on:click={() => adjustReps(1)} disabled={targetReps >= 50}
					>+</button
				>
			</div>
			<button
				class="rotary-toggle"
				on:click={() => (isAdjusting = isAdjusting === 'reps' ? false : 'reps')}
			>
				{isAdjusting === 'reps' ? '✓' : '🎯'}
			</button>
		</div>

		<!-- Weight Adjustment -->
		<div class="adjustment-group" class:active={isAdjusting === 'weight'}>
			<label class="adjustment-label">Weight</label>
			<div class="adjustment-controls">
				<button class="adjust-btn" on:click={() => adjustWeight(-2.5)} disabled={targetWeight <= 0}
					>−</button
				>
				<span class="value">{targetWeight}kg</span>
				<button class="adjust-btn" on:click={() => adjustWeight(2.5)}>+</button>
			</div>
			<button
				class="rotary-toggle"
				on:click={() => (isAdjusting = isAdjusting === 'weight' ? false : 'weight')}
			>
				{isAdjusting === 'weight' ? '✓' : '⚖️'}
			</button>
		</div>
	</div>

	<!-- Start Button -->
	<button class="start-workout-btn" on:click={startWorkout}> Start Set </button>
</div>

<style>
	.wearable-pre-set {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 16px;
		background: #000;
		color: #fff;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
	}

	.exercise-header {
		text-align: center;
		margin-bottom: 24px;
	}

	.exercise-name {
		font-size: 18px;
		font-weight: 600;
		margin: 0 0 8px 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.set-indicator {
		font-size: 14px;
		color: #888;
	}

	.target-settings {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.adjustment-group {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px;
		border-radius: 8px;
		background: #1a1a1a;
		transition: background-color 0.2s;
	}

	.adjustment-group.active {
		background: #2a2a2a;
		border: 1px solid #007aff;
	}

	.adjustment-label {
		font-size: 14px;
		font-weight: 500;
		min-width: 50px;
	}

	.adjustment-controls {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.adjust-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: none;
		background: #333;
		color: #fff;
		font-size: 16px;
		font-weight: bold;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.adjust-btn:hover:not(:disabled) {
		background: #444;
	}

	.adjust-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.value {
		font-size: 16px;
		font-weight: 600;
		min-width: 40px;
		text-align: center;
	}

	.rotary-toggle {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: none;
		background: #007aff;
		color: #fff;
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.rotary-toggle:hover {
		background: #0056cc;
	}

	.start-workout-btn {
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
		margin-top: 16px;
	}

	.start-workout-btn:hover {
		background: #0056cc;
	}

	.start-workout-btn:active {
		background: #004499;
	}
</style>
