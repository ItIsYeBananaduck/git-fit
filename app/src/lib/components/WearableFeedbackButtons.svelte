<script>
	import { createEventDispatcher } from 'svelte';

	export let exercise = '';
	export let setNumber = 1;
	export let isVisible = true;

	const dispatch = createEventDispatcher();

	function submitFeedback(difficulty) {
		dispatch('feedback', {
			exercise,
			setNumber,
			difficulty,
			timestamp: Date.now()
		});
	}

	function handleTooEasy() {
		submitFeedback('easy');
	}

	function handleModerate() {
		submitFeedback('moderate');
	}

	function handleTooHard() {
		submitFeedback('hard');
	}
</script>

{#if isVisible}
	<div class="wearable-feedback-overlay">
		<div class="feedback-container">
			<!-- Header -->
			<div class="feedback-header">
				<h3 class="feedback-title">How was that set?</h3>
				<div class="set-info">Set {setNumber} • {exercise}</div>
			</div>

			<!-- Feedback Buttons -->
			<div class="feedback-buttons">
				<!-- Too Easy -->
				<button class="feedback-btn easy-btn" on:click={handleTooEasy}>
					<div class="btn-icon">😊</div>
					<div class="btn-text">Too Easy</div>
					<div class="btn-desc">Increase weight</div>
				</button>

				<!-- Just Right -->
				<button class="feedback-btn moderate-btn" on:click={handleModerate}>
					<div class="btn-icon">👍</div>
					<div class="btn-text">Just Right</div>
					<div class="btn-desc">Keep going</div>
				</button>

				<!-- Too Hard -->
				<button class="feedback-btn hard-btn" on:click={handleTooHard}>
					<div class="btn-icon">😰</div>
					<div class="btn-text">Too Hard</div>
					<div class="btn-desc">Reduce weight</div>
				</button>
			</div>

			<!-- Skip Option -->
			<button class="skip-feedback-btn" on:click={() => dispatch('skip')}> Skip for now </button>
		</div>
	</div>
{/if}

<style>
	.wearable-feedback-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 16px;
	}

	.feedback-container {
		background: #1a1a1a;
		border-radius: 12px;
		padding: 20px;
		width: 100%;
		max-width: 320px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
	}

	.feedback-header {
		text-align: center;
		margin-bottom: 24px;
	}

	.feedback-title {
		font-size: 18px;
		font-weight: 600;
		color: #fff;
		margin: 0 0 8px 0;
	}

	.set-info {
		font-size: 14px;
		color: #888;
	}

	.feedback-buttons {
		display: grid;
		grid-template-columns: 1fr;
		gap: 12px;
		margin-bottom: 20px;
	}

	.feedback-btn {
		display: flex;
		align-items: center;
		padding: 16px;
		border-radius: 8px;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		background: #2a2a2a;
		color: #fff;
		text-align: left;
	}

	.feedback-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.feedback-btn:active {
		transform: translateY(0);
	}

	.easy-btn:hover {
		background: linear-gradient(135deg, #4ade80, #22c55e);
		box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
	}

	.moderate-btn:hover {
		background: linear-gradient(135deg, #fbbf24, #f59e0b);
		box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
	}

	.hard-btn:hover {
		background: linear-gradient(135deg, #ef4444, #dc2626);
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
	}

	.btn-icon {
		font-size: 24px;
		margin-right: 12px;
		flex-shrink: 0;
	}

	.btn-text {
		font-size: 16px;
		font-weight: 600;
		margin-bottom: 2px;
	}

	.btn-desc {
		font-size: 12px;
		color: #ccc;
		opacity: 0.8;
	}

	.skip-feedback-btn {
		width: 100%;
		padding: 12px;
		border-radius: 8px;
		border: 1px solid #444;
		background: transparent;
		color: #888;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.skip-feedback-btn:hover {
		background: #333;
		color: #ccc;
	}

	/* Wearable-specific adjustments */
	@media (max-width: 200px) {
		.wearable-feedback-overlay {
			padding: 12px;
		}

		.feedback-container {
			padding: 16px;
		}

		.feedback-title {
			font-size: 16px;
		}

		.feedback-btn {
			padding: 12px;
		}

		.btn-icon {
			font-size: 20px;
			margin-right: 8px;
		}

		.btn-text {
			font-size: 14px;
		}

		.btn-desc {
			font-size: 11px;
		}
	}
</style>
