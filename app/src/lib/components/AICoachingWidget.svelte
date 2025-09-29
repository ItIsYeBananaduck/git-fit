<!--
  AI Coaching Component
  Task: T042 - Main coaching interface component
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { api } from '$lib/api/convex';
	import type { Id } from '../../../convex/_generated/dataModel.js';

	// Props
	export let userId: Id<'users'>;
	export let workoutId: Id<'workouts'> | null = null;
	export let exerciseType: string = '';
	export let workoutData: any = {};

	// State
	let isGenerating = false;
	let isPlaying = false;
	let currentResponse: any = null;
	let audioElement: HTMLAudioElement | null = null;
	let subscription: any = null;
	let responseHistory: any[] = [];
	let errorMessage = '';

	// Stores
	const coachingEnabled = writable(true);
	const volume = writable(0.8);

	onMount(async () => {
		await loadUserSubscription();
		await loadResponseHistory();
		setupAudioPlayer();
	});

	onDestroy(() => {
		if (audioElement) {
			audioElement.pause();
			audioElement = null;
		}
	});

	async function loadUserSubscription() {
		try {
			// Mock subscription data for development
			subscription = {
				_id: 'mock-subscription-1',
				persona_id: 'alice',
				persona_name: 'Alice',
				subscription_type: 'premium',
				preferences: {
					voice_enabled: true,
					frequency: 'medium',
					trigger_types: ['motivation', 'form_correction', 'encouragement'],
					quiet_hours: {
						start_time: '22:00',
						end_time: '07:00',
						timezone: 'America/New_York'
					}
				},
				is_trial: false
			};
			$coachingEnabled = subscription.preferences.voice_enabled;
		} catch (error) {
			console.error('Failed to load subscription:', error);
		}
	}

	async function loadResponseHistory() {
		try {
			// Mock response history for development
			responseHistory = [
				{
					_id: 'mock-response-1',
					text_content:
						'Great form on that squat! Keep your core tight and drive through your heels.',
					response_type: 'form_correction',
					created_at: Date.now() - 300000
				},
				{
					_id: 'mock-response-2',
					text_content: "You're doing amazing! Push through this last set!",
					response_type: 'motivation',
					created_at: Date.now() - 600000
				}
			];
		} catch (error) {
			console.error('Failed to load response history:', error);
		}
	}

	function setupAudioPlayer() {
		audioElement = new Audio();
		audioElement.volume = $volume;

		audioElement.addEventListener('ended', () => {
			isPlaying = false;
			markResponseAsDelivered();
		});

		audioElement.addEventListener('error', (e) => {
			console.error('Audio playback error:', e);
			isPlaying = false;
			errorMessage = 'Audio playback failed';
		});
	}

	async function generateCoachingResponse(triggerType: string = 'motivation') {
		if (!$coachingEnabled || isGenerating) return;

		isGenerating = true;
		errorMessage = '';

		try {
			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Mock coaching responses based on trigger type
			const mockResponses = {
				motivation: [
					"You've got this! Every rep brings you closer to your goal!",
					'Power through! Your body is capable of amazing things!',
					'Keep pushing! Champions are made in moments like this!'
				],
				form_correction: [
					'Great effort! Remember to keep your core engaged throughout the movement.',
					'Nice work! Try to control the weight on the way down for maximum benefit.',
					'Excellent! Focus on driving through your heels on the next rep.'
				],
				encouragement: [
					"Amazing progress! You're getting stronger every day!",
					"Fantastic form! You're really mastering this movement!",
					'Outstanding! Your dedication is really paying off!'
				],
				instruction: [
					'For your next set, try increasing the weight by 5 pounds.',
					'Remember to breathe out on the exertion phase of the movement.',
					'Keep your shoulders back and chest up throughout the exercise.'
				],
				completion: [
					'Workout complete! You absolutely crushed it today!',
					'Amazing session! Your consistency is building real strength!',
					'Fantastic work! You should be proud of what you accomplished!'
				]
			};

			const responses =
				mockResponses[triggerType as keyof typeof mockResponses] || mockResponses.motivation;
			const randomResponse = responses[Math.floor(Math.random() * responses.length)];

			currentResponse = {
				response_id: `mock-${Date.now()}`,
				text_response: randomResponse,
				audio_url: null, // No audio in mock mode
				response_type: triggerType,
				persona: {
					id: subscription?.persona_id || 'alice',
					name: subscription?.persona_name || 'Alice',
					voice_id: 'mock-voice-id'
				},
				generation_stats: {
					generation_time_ms: 850 + Math.random() * 300,
					cache_hit: Math.random() > 0.5,
					tokens_used: 45 + Math.floor(Math.random() * 20)
				}
			};

			responseHistory = [currentResponse, ...responseHistory.slice(0, 9)];

			// Show success message
			errorMessage = '';
		} catch (error) {
			console.error('Coaching generation error:', error);
			errorMessage = 'Failed to generate coaching response';
		} finally {
			isGenerating = false;
		}
	}

	async function playAudioResponse(audioUrl: string) {
		if (!audioElement || isPlaying) return;

		try {
			audioElement.src = audioUrl;
			audioElement.volume = $volume;
			isPlaying = true;
			await audioElement.play();
		} catch (error) {
			console.error('Audio play error:', error);
			isPlaying = false;
			errorMessage = 'Failed to play audio';
		}
	}

	async function markResponseAsDelivered() {
		if (!currentResponse) return;

		try {
			// Mock implementation - just log the delivery
			console.log('Response delivered:', currentResponse.response_id);
		} catch (error) {
			console.error('Failed to mark response as delivered:', error);
		}
	}

	async function provideFeedback(
		responseId: string,
		feedbackType: 'positive' | 'negative' | 'correction',
		improvedResponse?: string
	) {
		try {
			// Mock implementation - just log the feedback
			console.log('Feedback provided:', { responseId, feedbackType, improvedResponse });

			// Show a brief success message
			const originalError = errorMessage;
			errorMessage = `Feedback submitted: ${feedbackType}`;
			setTimeout(() => {
				errorMessage = originalError;
			}, 2000);
		} catch (error) {
			console.error('Failed to submit feedback:', error);
		}
	}

	function stopAudio() {
		if (audioElement && isPlaying) {
			audioElement.pause();
			audioElement.currentTime = 0;
			isPlaying = false;
		}
	}

	function toggleCoaching() {
		$coachingEnabled = !$coachingEnabled;

		if (!$coachingEnabled) {
			stopAudio();
		}
	}

	// Re-enable coaching when the setting is turned back on
	$: {
		if (!$coachingEnabled) {
			stopAudio();
		}
	}

	// Reactive statements
	$: if (audioElement) {
		audioElement.volume = $volume;
	} // Reactive statements
	$: if (audioElement) {
		audioElement.volume = $volume;
	}

	// Auto-generate coaching based on workout events
	export function onFormCorrection(formScore: number) {
		if (formScore < 0.7) {
			generateCoachingResponse('form_correction');
		}
	}

	export function onWorkoutComplete() {
		generateCoachingResponse('completion');
	}

	export function onRestPeriod() {
		generateCoachingResponse('rest_period');
	}

	export function onMotivationNeeded() {
		generateCoachingResponse('motivation');
	}
</script>

<div class="ai-coaching-container">
	<!-- Coaching Control Header -->
	<div class="coaching-header">
		<div class="coaching-status">
			<button
				class="toggle-coaching {$coachingEnabled ? 'enabled' : 'disabled'}"
				on:click={toggleCoaching}
				aria-label={$coachingEnabled ? 'Disable AI Coaching' : 'Enable AI Coaching'}
			>
				<span class="status-icon">
					{#if $coachingEnabled}
						🎤
					{:else}
						🔇
					{/if}
				</span>
				<span class="status-text">
					AI Coach {$coachingEnabled ? 'ON' : 'OFF'}
				</span>
			</button>
		</div>

		{#if subscription}
			<div class="persona-info">
				<span class="persona-name">{subscription.persona_name}</span>
				{#if subscription.is_trial}
					<span class="trial-badge">Trial</span>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Current Response Display -->
	{#if currentResponse}
		<div class="current-response">
			<div class="response-content">
				<div class="response-text">
					{currentResponse.text_response}
				</div>

				{#if currentResponse.audio_url}
					<div class="audio-controls">
						{#if isPlaying}
							<button class="audio-btn stop" on:click={stopAudio}> ⏹️ Stop </button>
						{:else}
							<button
								class="audio-btn play"
								on:click={() => playAudioResponse(currentResponse.audio_url)}
							>
								▶️ Play
							</button>
						{/if}
					</div>
				{/if}

				<div class="response-meta">
					<span class="response-type">{currentResponse.response_type}</span>
					<span class="generation-time"
						>{currentResponse.generation_stats.generation_time_ms}ms</span
					>
					{#if currentResponse.generation_stats.cache_hit}
						<span class="cache-indicator">⚡ Cached</span>
					{/if}
				</div>
			</div>

			<!-- Feedback Buttons -->
			<div class="feedback-section">
				<button
					class="feedback-btn positive"
					on:click={() => provideFeedback(currentResponse.response_id, 'positive')}
				>
					👍
				</button>
				<button
					class="feedback-btn negative"
					on:click={() => provideFeedback(currentResponse.response_id, 'negative')}
				>
					👎
				</button>
			</div>
		</div>
	{/if}

	<!-- Manual Coaching Triggers -->
	<div class="manual-triggers">
		<h3>Request Coaching</h3>
		<div class="trigger-buttons">
			<button
				class="trigger-btn motivation"
				on:click={() => generateCoachingResponse('motivation')}
				disabled={isGenerating || !$coachingEnabled}
			>
				💪 Motivation
			</button>
			<button
				class="trigger-btn instruction"
				on:click={() => generateCoachingResponse('instruction')}
				disabled={isGenerating || !$coachingEnabled}
			>
				📚 Instruction
			</button>
			<button
				class="trigger-btn encouragement"
				on:click={() => generateCoachingResponse('encouragement')}
				disabled={isGenerating || !$coachingEnabled}
			>
				🌟 Encouragement
			</button>
		</div>
	</div>

	<!-- Volume Control -->
	<div class="volume-control">
		<label for="volume">Volume: {Math.round($volume * 100)}%</label>
		<input type="range" id="volume" min="0" max="1" step="0.1" bind:value={$volume} />
	</div>

	<!-- Response History -->
	{#if responseHistory.length > 0}
		<div class="response-history">
			<h3>Recent Coaching</h3>
			<div class="history-list">
				{#each responseHistory.slice(0, 5) as response}
					<div class="history-item">
						<div class="history-text">{response.text_content || response.text_response}</div>
						<div class="history-meta">
							<span class="history-type">{response.response_type}</span>
							<span class="history-time">
								{new Date(response.created_at).toLocaleTimeString()}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Error Display -->
	{#if errorMessage}
		<div class="error-message">
			<span class="error-icon">⚠️</span>
			{errorMessage}
			<button class="error-dismiss" on:click={() => (errorMessage = '')}>×</button>
		</div>
	{/if}

	<!-- Loading State -->
	{#if isGenerating}
		<div class="loading-overlay">
			<div class="loading-spinner"></div>
			<div class="loading-text">Generating coaching response...</div>
		</div>
	{/if}
</div>

<style>
	.ai-coaching-container {
		padding: 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 12px;
		color: white;
		position: relative;
		max-width: 400px;
		margin: 0 auto;
	}

	.coaching-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.toggle-coaching {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.2);
		border: none;
		border-radius: 20px;
		padding: 0.5rem 1rem;
		color: white;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.toggle-coaching.enabled {
		background: rgba(76, 175, 80, 0.3);
	}

	.toggle-coaching.disabled {
		background: rgba(244, 67, 54, 0.3);
	}

	.persona-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.trial-badge {
		background: #ff9800;
		color: white;
		padding: 0.2rem 0.5rem;
		border-radius: 10px;
		font-size: 0.7rem;
		font-weight: bold;
	}

	.current-response {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.response-text {
		font-size: 1.1rem;
		line-height: 1.4;
		margin-bottom: 0.5rem;
	}

	.audio-controls {
		margin: 0.5rem 0;
	}

	.audio-btn {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		border-radius: 20px;
		padding: 0.5rem 1rem;
		color: white;
		cursor: pointer;
		transition: background 0.3s ease;
	}

	.audio-btn:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.response-meta {
		display: flex;
		gap: 0.5rem;
		font-size: 0.8rem;
		opacity: 0.8;
		margin-top: 0.5rem;
	}

	.cache-indicator {
		color: #4caf50;
	}

	.feedback-section {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.feedback-btn {
		background: none;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		width: 40px;
		height: 40px;
		cursor: pointer;
		font-size: 1.2rem;
		transition: all 0.3s ease;
	}

	.feedback-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.1);
	}

	.manual-triggers {
		margin-bottom: 1rem;
	}

	.manual-triggers h3 {
		margin-bottom: 0.5rem;
		font-size: 1rem;
	}

	.trigger-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.trigger-btn {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		border-radius: 20px;
		padding: 0.5rem 1rem;
		color: white;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.9rem;
	}

	.trigger-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-2px);
	}

	.trigger-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.volume-control {
		margin-bottom: 1rem;
	}

	.volume-control label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.volume-control input[type='range'] {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.2);
		outline: none;
	}

	.response-history {
		margin-top: 1rem;
	}

	.response-history h3 {
		margin-bottom: 0.5rem;
		font-size: 1rem;
	}

	.history-item {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		padding: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.history-text {
		font-size: 0.9rem;
		margin-bottom: 0.3rem;
	}

	.history-meta {
		display: flex;
		justify-content: space-between;
		font-size: 0.7rem;
		opacity: 0.7;
	}

	.error-message {
		background: rgba(244, 67, 54, 0.9);
		color: white;
		padding: 0.8rem;
		border-radius: 6px;
		margin-top: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.error-dismiss {
		background: none;
		border: none;
		color: white;
		cursor: pointer;
		font-size: 1.2rem;
		margin-left: auto;
	}

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top: 3px solid white;
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

	.loading-text {
		font-size: 0.9rem;
		opacity: 0.8;
	}
</style>
