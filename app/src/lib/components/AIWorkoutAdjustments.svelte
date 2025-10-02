<script lang="ts">
	import { api } from '$lib/convex/_generated/api';
	import { createEventDispatcher } from 'svelte';

	export let userId: string;
	export let currentExercise: string;
	export let currentSet: number;
	export let currentWeight: number;
	export let currentReps: number;
	export let heartRate: number = 0;
	export let spo2: number = 98;

	const dispatch = createEventDispatcher();

	let aiRecommendation: any = null;
	let loading = false;
	let lastAdjustment: string | null = null;

	// Send AI event and get recommendation
	async function sendAIEvent(eventType: 'skip_set' | 'struggle_set' | 'complete_workout') {
		loading = true;

		try {
			// Use environment variable for AI service URL
			const AI_SERVICE_URL =
				import.meta.env.VITE_AI_API_URL || 'https://technically-fit-ai.fly.dev';

			const eventData = {
				event: eventType,
				user_id: userId,
				context: {
					exercise: currentExercise.toLowerCase().replace(' ', '_'),
					set_number: currentSet,
					current_weight: currentWeight,
					current_reps: currentReps,
					heart_rate: heartRate,
					spo2: spo2
				},
				user_data: {
					fitness_level: 'intermediate', // Could be dynamic from user profile
					current_program: {
						planned_reps: currentReps,
						planned_weight: currentWeight
					},
					goals: ['build_muscle', 'increase_strength']
				}
			};

			const response = await fetch(`${AI_SERVICE_URL}/event`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(eventData)
			});

			if (response.ok) {
				const result = await response.json();
				if (result.success && result.tweak) {
					aiRecommendation = result.tweak;
					lastAdjustment = `${result.tweak.action}: ${result.tweak.reason}`;

					// Dispatch event to parent component
					dispatch('aiAdjustment', {
						action: result.tweak.action,
						modifications: result.tweak.modifications,
						reason: result.tweak.reason
					});
				}
			} else {
				console.error('AI service error:', response.statusText);
				aiRecommendation = {
					action: 'continue',
					reason: 'AI service temporarily unavailable. Continue with current plan.',
					modifications: {}
				};
			}
		} catch (error) {
			console.error('Failed to get AI recommendation:', error);
			// Fallback recommendation
			aiRecommendation = {
				action: eventType === 'skip_set' ? 'reduce_volume' : 'continue',
				reason: 'Network error. Using safe fallback recommendation.',
				modifications: eventType === 'skip_set' ? { sets: -1 } : {}
			};
		} finally {
			loading = false;
		}
	}

	// Apply AI recommendation automatically
	function applyRecommendation() {
		if (aiRecommendation?.modifications) {
			dispatch('applyAdjustment', aiRecommendation);
		}
		aiRecommendation = null;
	}

	// Dismiss recommendation
	function dismissRecommendation() {
		aiRecommendation = null;
	}
</script>

<div
	class="ai-workout-panel bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200"
>
	<h3 class="text-lg font-semibold mb-3 text-blue-800">🤖 AI Workout Coach</h3>

	<!-- Current Status Display -->
	<div class="flex items-center gap-4 mb-3 text-sm text-gray-600">
		<span>📋 {currentExercise}</span>
		<span>🏋️ Set {currentSet}</span>
		<span>⚖️ {currentWeight}lbs</span>
		{#if heartRate > 0}
			<span class="text-red-500">❤️ {heartRate} BPM</span>
		{/if}
		{#if spo2 < 98}
			<span class="text-orange-500">🫁 {spo2}%</span>
		{/if}
	</div>

	<!-- AI Event Buttons -->
	<div class="flex gap-2 mb-4">
		<button
			class="btn btn-sm btn-warning"
			on:click={() => sendAIEvent('skip_set')}
			disabled={loading}
		>
			{loading ? '...' : '⏭️ Skip Set'}
		</button>

		<button
			class="btn btn-sm btn-error"
			on:click={() => sendAIEvent('struggle_set')}
			disabled={loading}
		>
			{loading ? '...' : '😤 Struggling'}
		</button>

		<button
			class="btn btn-sm btn-success"
			on:click={() => sendAIEvent('complete_workout')}
			disabled={loading}
		>
			{loading ? '...' : '✅ Complete Set'}
		</button>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="flex items-center gap-2 text-blue-600 p-3 bg-blue-50 rounded-lg animate-pulse">
			<div class="relative">
				<div
					class="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"
				></div>
				<div class="absolute inset-0 w-6 h-6 border border-blue-200 rounded-full"></div>
			</div>
			<div class="flex flex-col">
				<span class="font-medium">AI analyzing workout...</span>
				<span class="text-xs text-blue-500">Processing vitals and performance data</span>
			</div>
		</div>
	{/if}

	<!-- AI Recommendation Display -->
	{#if aiRecommendation}
		<div
			class="bg-white p-4 rounded-xl border border-blue-300 mb-3 shadow-lg transform transition-all duration-300 ease-out animate-fade-in"
		>
			<div class="flex items-start justify-between">
				<div class="flex-1">
					<div class="flex items-center gap-2 mb-2">
						<div
							class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
						>
							<span class="text-white text-sm">🤖</span>
						</div>
						<h4 class="font-semibold text-blue-800">
							{aiRecommendation.action.replace('_', ' ').toUpperCase()}
						</h4>
						<div class="px-2 py-1 bg-blue-100 rounded-full">
							<span class="text-xs font-medium text-blue-700">AI Recommended</span>
						</div>
					</div>

					<p class="text-sm text-gray-700 mb-3 leading-relaxed">{aiRecommendation.reason}</p>

					{#if aiRecommendation.modifications && Object.keys(aiRecommendation.modifications).length > 0}
						<div class="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
							<div class="text-xs font-medium text-gray-700 mb-2">Proposed Changes:</div>
							<div class="flex flex-wrap gap-2">
								{#each Object.entries(aiRecommendation.modifications) as [key, value]}
									<div
										class="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-blue-200 shadow-sm"
									>
										<span class="text-xs font-medium text-gray-600">{key}:</span>
										<span class="text-xs font-bold {value > 0 ? 'text-green-600' : 'text-red-600'}">
											{value > 0 ? '+' : ''}{value}
										</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<div class="flex flex-col gap-2 ml-4">
					<button
						class="btn btn-sm btn-primary shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
						on:click={applyRecommendation}
					>
						✓ Apply
					</button>
					<button
						class="btn btn-sm btn-ghost hover:bg-gray-100 transition-colors duration-200"
						on:click={dismissRecommendation}
					>
						✕
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Last Adjustment Display -->
	{#if lastAdjustment && !aiRecommendation}
		<div
			class="text-xs text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200 transform transition-all duration-300"
		>
			<div class="flex items-center gap-2">
				<div class="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
					<span class="text-white text-xs">✓</span>
				</div>
				<div>
					<div class="font-medium text-green-800">Last AI Adjustment Applied</div>
					<div class="text-green-600">{lastAdjustment}</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.ai-workout-panel {
		box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);
		transition: all 0.3s ease;
	}

	.ai-workout-panel:hover {
		box-shadow: 0 8px 25px -1px rgba(59, 130, 246, 0.15);
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-10px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}

	/* Pulse animation for buttons */
	.btn:hover {
		transform: scale(1.05);
		transition: transform 0.2s ease;
	}

	/* Loading pulse effect */
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
