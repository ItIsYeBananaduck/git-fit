<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		ttsEngine,
		narrationQueueManager,
		getTTSStatus,
		type NarrationSegment
	} from '$lib/services/ttsEngine';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let isTTSAvailable = false;
	let isNarrationEnabled = true;
	let currentVoice = 'alice';
	let volume = 0.8;
	let rate = 1.0;
	let isQueuePlaying = false;
	let queueLength = 0;

	// TTS status
	$: ttsStatus = getTTSStatus();

	onMount(() => {
		isTTSAvailable = ttsStatus.available;

		// Set up queue event handlers
		narrationQueueManager.setEventHandlers({
			onNarrationStart: (segment: NarrationSegment) => {
				dispatch('narrationStart', { segment });
			},
			onNarrationEnd: (segment: NarrationSegment) => {
				dispatch('narrationEnd', { segment });
			}
		});

		// Update queue status periodically
		const updateQueueStatus = () => {
			const status = narrationQueueManager.getQueueStatus();
			isQueuePlaying = status.isPlaying;
			queueLength = status.length;
		};

		const interval = setInterval(updateQueueStatus, 1000);
		updateQueueStatus();

		return () => clearInterval(interval);
	});

	function toggleNarration() {
		isNarrationEnabled = !isNarrationEnabled;
		dispatch('narrationToggle', { enabled: isNarrationEnabled });
	}

	function changeVoice(voice: 'alice' | 'aiden') {
		currentVoice = voice;
		ttsEngine.updateConfig({ voice });
		dispatch('voiceChange', { voice });
	}

	function updateVolume(newVolume: number) {
		volume = newVolume;
		ttsEngine.updateConfig({ volume });
		dispatch('volumeChange', { volume });
	}

	function updateRate(newRate: number) {
		rate = newRate;
		ttsEngine.updateConfig({ rate });
		dispatch('rateChange', { rate });
	}

	function stopNarration() {
		narrationQueueManager.stopProcessing();
		dispatch('narrationStop');
	}

	function clearQueue() {
		narrationQueueManager.clearQueue();
		dispatch('queueClear');
	}

	// Export functions for parent components
	export { toggleNarration, changeVoice, updateVolume, updateRate, stopNarration, clearQueue };
</script>

<div class="tts-controls bg-white rounded-lg shadow-sm border p-4">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-semibold text-gray-900">Voice Coach</h3>
		{#if isTTSAvailable}
			<span
				class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
			>
				Available
			</span>
		{:else}
			<span
				class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
			>
				Unavailable
			</span>
		{/if}
	</div>

	{#if isTTSAvailable}
		<div class="space-y-4">
			<!-- Narration Toggle -->
			<div class="flex items-center justify-between">
				<label class="text-sm font-medium text-gray-700">Voice Narration</label>
				<button
					on:click={toggleNarration}
					class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 {isNarrationEnabled
						? 'bg-indigo-600'
						: 'bg-gray-200'}"
				>
					<span
						class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {isNarrationEnabled
							? 'translate-x-6'
							: 'translate-x-1'}"
					></span>
				</button>
			</div>

			<!-- Voice Selection -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">Coach Voice</label>
				<div class="grid grid-cols-2 gap-2">
					<button
						on:click={() => changeVoice('alice')}
						class="px-3 py-2 text-sm font-medium rounded-md border {currentVoice === 'alice'
							? 'border-indigo-500 bg-indigo-50 text-indigo-700'
							: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
					>
						Alice
						<span class="block text-xs text-gray-500">Encouraging</span>
					</button>
					<button
						on:click={() => changeVoice('aiden')}
						class="px-3 py-2 text-sm font-medium rounded-md border {currentVoice === 'aiden'
							? 'border-indigo-500 bg-indigo-50 text-indigo-700'
							: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
					>
						Aiden
						<span class="block text-xs text-gray-500">Structured</span>
					</button>
				</div>
			</div>

			<!-- Volume Control -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">
					Volume: {Math.round(volume * 100)}%
				</label>
				<input
					type="range"
					min="0"
					max="1"
					step="0.1"
					bind:value={volume}
					on:input={(e) => updateVolume(parseFloat(e.target.value))}
					class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
				/>
			</div>

			<!-- Rate Control -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">
					Speech Rate: {rate.toFixed(1)}x
				</label>
				<input
					type="range"
					min="0.5"
					max="2.0"
					step="0.1"
					bind:value={rate}
					on:input={(e) => updateRate(parseFloat(e.target.value))}
					class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
				/>
			</div>

			<!-- Queue Status -->
			{#if queueLength > 0 || isQueuePlaying}
				<div class="bg-gray-50 rounded-md p-3">
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-600">
							{#if isQueuePlaying}
								Playing narration ({queueLength} remaining)
							{:else}
								{queueLength} narrations queued
							{/if}
						</span>
						<div class="flex space-x-2">
							{#if isQueuePlaying}
								<button
									on:click={stopNarration}
									class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
								>
									Stop
								</button>
							{/if}
							<button
								on:click={clearQueue}
								class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
							>
								Clear
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="text-center py-4">
			<p class="text-sm text-gray-500 mb-2">Voice narration is not available in your browser.</p>
			<p class="text-xs text-gray-400">
				Try using Chrome, Edge, or Safari for the best experience.
			</p>
		</div>
	{/if}
</div>

<style>
	/* Custom slider styles */
	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		height: 16px;
		width: 16px;
		border-radius: 50%;
		background: #4f46e5;
		cursor: pointer;
	}

	input[type='range']::-moz-range-thumb {
		height: 16px;
		width: 16px;
		border-radius: 50%;
		background: #4f46e5;
		cursor: pointer;
		border: none;
	}
</style>
