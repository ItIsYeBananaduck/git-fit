<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { Capacitor } from '@capacitor/core';
	import { Haptics, ImpactStyle } from '@capacitor/haptics';

	// Props
	export let userId: string;
	export let currentExercise: string;
	export let currentSet: number;
	export let currentWeight: number;
	export let currentReps: number;
	export let heartRate: number = 0;
	export let spo2: number = 98;

	// Internal state
	let isAnalyzing = false;
	let currentSuggestion: WorkoutAdjustment | null = null;
	let analysisHistory: WorkoutAdjustment[] = [];
	let lastAnalysisTime = 0;
	let adjustmentCooldown = 30000; // 30 seconds between suggestions

	const dispatch = createEventDispatcher<{
		aiAdjustment: WorkoutAdjustment;
		applyAdjustment: WorkoutAdjustment;
	}>();

	// Types
	interface WorkoutAdjustment {
		action: string;
		modifications: {
			weight?: number;
			reps?: number;
			sets?: number;
		};
		reason: string;
		confidence: number;
		timestamp: number;
	}

	// AI analysis using Llama 3.1
	async function analyzeWorkoutMetrics(): Promise<WorkoutAdjustment | null> {
		if (isAnalyzing) return null;

		isAnalyzing = true;

		try {
			// Prepare metrics for AI analysis
			const metrics = {
				exercise: currentExercise,
				set: currentSet,
				weight: currentWeight,
				reps: currentReps,
				heartRate,
				spo2,
				userId
			};

			// In production, this would call Llama 3.1 API
			// For now, use rule-based logic with some randomization
			const adjustment = await generateSmartAdjustment(metrics);

			if (adjustment) {
				currentSuggestion = adjustment;
				analysisHistory.push(adjustment);

				// Auto-apply high confidence adjustments after delay
				if (adjustment.confidence > 0.8) {
					setTimeout(() => {
						if (currentSuggestion === adjustment) {
							dispatch('aiAdjustment', adjustment);
							// Haptic feedback for auto-adjustment
							if (Capacitor.isNativePlatform()) {
								Haptics.impact({ style: ImpactStyle.Medium });
							}
						}
					}, 2000);
				}
			}

			return adjustment;
		} catch (error) {
			console.error('AI analysis failed:', error);
			return null;
		} finally {
			isAnalyzing = false;
		}
	}

	// Smart adjustment generation (would use Llama 3.1 in production)
	async function generateSmartAdjustment(metrics: any): Promise<WorkoutAdjustment | null> {
		const { heartRate, spo2, currentSet, currentReps, currentWeight } = metrics;

		// Heart rate analysis
		const isHighHR = heartRate > 160;
		const isLowHR = heartRate < 120 && heartRate > 0;
		const isNormalHR = heartRate >= 120 && heartRate <= 160;

		// SpO2 analysis
		const isLowOxygen = spo2 < 95;

		// Generate adjustment based on metrics
		let adjustment: WorkoutAdjustment | null = null;

		if (isLowOxygen) {
			adjustment = {
				action: 'Reduce intensity - Low oxygen saturation detected',
				modifications: {
					weight: -Math.round(currentWeight * 0.2),
					reps: -2
				},
				reason: `SpO2 at ${spo2}%. Reducing load to prevent overexertion.`,
				confidence: 0.9,
				timestamp: Date.now()
			};
		} else if (isHighHR && currentSet > 2) {
			adjustment = {
				action: 'Increase rest time - High heart rate detected',
				modifications: {
					reps: -1
				},
				reason: `Heart rate at ${heartRate} bpm. Consider taking extra rest between sets.`,
				confidence: 0.8,
				timestamp: Date.now()
			};
		} else if (isLowHR && currentSet > 1) {
			adjustment = {
				action: 'Increase intensity - Heart rate too low',
				modifications: {
					weight: Math.round(currentWeight * 0.1),
					reps: 1
				},
				reason: `Heart rate at ${heartRate} bpm. You can handle more intensity.`,
				confidence: 0.7,
				timestamp: Date.now()
			};
		} else if (isNormalHR && currentSet > 3) {
			// Progressive overload suggestion
			adjustment = {
				action: 'Progressive overload - Ready for more weight',
				modifications: {
					weight: Math.round(currentWeight * 0.05)
				},
				reason: `Consistent performance detected. Ready for 5% weight increase.`,
				confidence: 0.6,
				timestamp: Date.now()
			};
		}

		return adjustment;
	}

	// Manual analysis trigger
	function triggerAnalysis() {
		const now = Date.now();
		if (now - lastAnalysisTime > adjustmentCooldown) {
			lastAnalysisTime = now;
			analyzeWorkoutMetrics();
		}
	}

	// Apply current suggestion
	function applySuggestion() {
		if (currentSuggestion) {
			dispatch('applyAdjustment', currentSuggestion);
			currentSuggestion = null;

			// Haptic feedback
			if (Capacitor.isNativePlatform()) {
				Haptics.impact({ style: ImpactStyle.Light });
			}
		}
	}

	// Dismiss current suggestion
	function dismissSuggestion() {
		currentSuggestion = null;
	}

	// Auto-analyze when metrics change significantly
	$: if (heartRate > 0 || spo2 < 100) {
		// Debounce analysis
		setTimeout(() => {
			const now = Date.now();
			if (now - lastAnalysisTime > adjustmentCooldown) {
				analyzeWorkoutMetrics();
			}
		}, 1000);
	}

	onMount(() => {
		// Initial analysis after component mounts
		setTimeout(() => {
			analyzeWorkoutMetrics();
		}, 2000);
	});
</script>

<div class="ai-workout-adjustments">
	<!-- AI Status Indicator -->
	<div class="ai-status">
		<div class="status-indicator {isAnalyzing ? 'analyzing' : 'idle'}">
			<div class="status-dot"></div>
			<span class="status-text">
				{isAnalyzing ? 'AI Analyzing...' : 'AI Monitoring'}
			</span>
		</div>

		{#if analysisHistory.length > 0}
			<div class="history-count">
				{analysisHistory.length} adjustments
			</div>
		{/if}
	</div>

	<!-- Current Suggestion -->
	{#if currentSuggestion}
		<div class="adjustment-card" class:urgent={currentSuggestion.confidence > 0.8}>
			<div class="card-header">
				<div class="action-icon">
					{#if currentSuggestion.action.includes('Reduce')}
						⚠️
					{:else if currentSuggestion.action.includes('Increase')}
						📈
					{:else}
						🎯
					{/if}
				</div>
				<div class="action-title">{currentSuggestion.action}</div>
				<div class="confidence-badge" class:confident={currentSuggestion.confidence > 0.7}>
					{Math.round(currentSuggestion.confidence * 100)}%
				</div>
			</div>

			<div class="modifications">
				{#if currentSuggestion.modifications.weight}
					<div class="mod-item">
						<span class="mod-label">Weight:</span>
						<span
							class="mod-value {currentSuggestion.modifications.weight > 0
								? 'increase'
								: 'decrease'}"
						>
							{currentSuggestion.modifications.weight > 0 ? '+' : ''}{currentSuggestion
								.modifications.weight} lbs
						</span>
					</div>
				{/if}
				{#if currentSuggestion.modifications.reps}
					<div class="mod-item">
						<span class="mod-label">Reps:</span>
						<span
							class="mod-value {currentSuggestion.modifications.reps > 0 ? 'increase' : 'decrease'}"
						>
							{currentSuggestion.modifications.reps > 0 ? '+' : ''}{currentSuggestion.modifications
								.reps}
						</span>
					</div>
				{/if}
			</div>

			<div class="reason">
				{currentSuggestion.reason}
			</div>

			<div class="action-buttons">
				<button class="btn-apply" on:click={applySuggestion}> Apply Adjustment </button>
				<button class="btn-dismiss" on:click={dismissSuggestion}> Dismiss </button>
			</div>
		</div>
	{/if}

	<!-- Manual Analysis Button -->
	{#if !currentSuggestion && !isAnalyzing}
		<div class="manual-analysis">
			<button class="btn-analyze" on:click={triggerAnalysis}> 🔍 Request AI Analysis </button>
		</div>
	{/if}

	<!-- Metrics Display -->
	<div class="metrics-display">
		<div class="metric-item">
			<span class="metric-label">Heart Rate:</span>
			<span class="metric-value {heartRate > 160 ? 'high' : heartRate < 120 ? 'low' : 'normal'}">
				{heartRate || '--'} bpm
			</span>
		</div>
		<div class="metric-item">
			<span class="metric-label">SpO2:</span>
			<span class="metric-value {spo2 < 95 ? 'low' : 'normal'}">
				{spo2 || '--'}%
			</span>
		</div>
	</div>
</div>

<style>
	.ai-workout-adjustments {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 1rem;
		border: 1px solid rgba(0, 191, 255, 0.2);
	}

	.ai-status {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #666;
		transition: all 0.3s ease;
	}

	.status-indicator.analyzing .status-dot {
		background: #00bfff;
		animation: pulse 1s ease-in-out infinite;
	}

	.status-text {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.history-count {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.6);
		background: rgba(0, 191, 255, 0.1);
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
	}

	.adjustment-card {
		background: rgba(0, 191, 255, 0.1);
		border: 1px solid rgba(0, 191, 255, 0.3);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
		transition: all 0.3s ease;
	}

	.adjustment-card.urgent {
		background: rgba(255, 165, 0, 0.1);
		border-color: rgba(255, 165, 0, 0.5);
		animation: urgent-pulse 2s ease-in-out infinite;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.action-icon {
		font-size: 1.5rem;
	}

	.action-title {
		flex: 1;
		font-weight: 600;
		color: #00bfff;
	}

	.confidence-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: 600;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.7);
	}

	.confidence-badge.confident {
		background: rgba(0, 191, 255, 0.2);
		color: #00bfff;
	}

	.modifications {
		margin-bottom: 0.75rem;
	}

	.mod-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0;
	}

	.mod-label {
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
	}

	.mod-value {
		font-weight: 600;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.mod-value.increase {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	.mod-value.decrease {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}

	.reason {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 1rem;
		line-height: 1.4;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.btn-apply,
	.btn-dismiss {
		flex: 1;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-apply {
		background: #00bfff;
		color: white;
	}

	.btn-apply:hover {
		background: #0099cc;
		transform: translateY(-1px);
	}

	.btn-dismiss {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.btn-dismiss:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.manual-analysis {
		text-align: center;
		padding: 1rem;
	}

	.btn-analyze {
		background: rgba(0, 191, 255, 0.1);
		color: #00bfff;
		border: 1px solid rgba(0, 191, 255, 0.3);
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-analyze:hover {
		background: rgba(0, 191, 255, 0.2);
		transform: translateY(-1px);
	}

	.metrics-display {
		display: flex;
		justify-content: space-between;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.metric-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.metric-label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.metric-value {
		font-weight: 600;
		font-size: 0.9rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.metric-value.normal {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
	}

	.metric-value.high {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	.metric-value.low {
		background: rgba(255, 165, 0, 0.1);
		color: #f59e0b;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	@keyframes urgent-pulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.4);
		}
		50% {
			box-shadow: 0 0 0 4px rgba(255, 165, 0, 0);
		}
	}

	@media (max-width: 768px) {
		.ai-workout-adjustments {
			padding: 0.75rem;
		}

		.action-buttons {
			flex-direction: column;
		}

		.metrics-display {
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>
