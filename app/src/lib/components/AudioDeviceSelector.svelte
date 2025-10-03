<!--
  AudioDeviceSelector Component
  
  Purpose: Audio device management for Alice voice and workout audio
  Features:
  - Audio device detection and selection
  - Voice output configuration (Alice responses)
  - Workout audio mixing and routing
  - Volume controls with independent channels
  - Audio quality settings and testing
-->

<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';

	// Props
	export let selectedDeviceId: string = '';
	export let voiceVolume: number = 80; // 0-100
	export let workoutVolume: number = 70; // 0-100
	export let microphoneEnabled: boolean = false;
	export let noiseReduction: boolean = true;
	export let audioQuality: 'low' | 'medium' | 'high' = 'medium';
	export let spatialAudio: boolean = false;
	export let disabled: boolean = false;
	export let autoSelect: boolean = true;

	// Component state
	let availableDevices: MediaDeviceInfo[] = [];
	let selectedDevice: MediaDeviceInfo | null = null;
	let isDetecting: boolean = false;
	let audioContext: AudioContext | null = null;
	let testAudioElement: HTMLAudioElement | null = null;
	let isTestingAudio: boolean = false;
	let devicePermissions: boolean = false;
	let audioLatency: number = 0;
	let connectionStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
	let volumeTestTimeout: number;

	const dispatch = createEventDispatcher<{
		deviceChange: { deviceId: string; device: MediaDeviceInfo };
		volumeChange: { voice: number; workout: number };
		settingsChange: {
			noiseReduction: boolean;
			audioQuality: string;
			spatialAudio: boolean;
			microphoneEnabled: boolean;
		};
		audioTest: { type: 'start' | 'stop'; device: string };
		error: { message: string; code?: string };
	}>();

	// Audio quality presets
	const audioQualitySettings = {
		low: { bitrate: 64, sampleRate: 22050, channels: 1 },
		medium: { bitrate: 128, sampleRate: 44100, channels: 2 },
		high: { bitrate: 320, sampleRate: 48000, channels: 2 }
	};

	// Reactive computations
	$: currentQualitySettings = audioQualitySettings[audioQuality];
	$: canTestAudio = selectedDevice && !isTestingAudio && !disabled;
	$: deviceDisplayName =
		selectedDevice?.label || selectedDevice?.deviceId?.slice(0, 8) || 'Unknown Device';

	/**
	 * Request audio device permissions
	 */
	async function requestPermissions(): Promise<boolean> {
		if (!browser) return false;

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			stream.getTracks().forEach((track) => track.stop());
			devicePermissions = true;
			return true;
		} catch (error) {
			console.error('Failed to get audio permissions:', error);
			devicePermissions = false;
			return false;
		}
	}

	/**
	 * Detect available audio devices
	 */
	async function detectAudioDevices() {
		if (!browser || !navigator.mediaDevices) {
			dispatch('error', { message: 'Audio devices not supported in this browser' });
			return;
		}

		isDetecting = true;

		try {
			// Request permissions first
			if (!devicePermissions) {
				const hasPermissions = await requestPermissions();
				if (!hasPermissions) {
					throw new Error('Microphone permissions required to detect audio devices');
				}
			}

			const devices = await navigator.mediaDevices.enumerateDevices();
			availableDevices = devices.filter((device) => device.kind === 'audiooutput');

			// Auto-select first device if none selected and auto-select is enabled
			if (autoSelect && availableDevices.length > 0 && !selectedDeviceId) {
				selectDevice(availableDevices[0]);
			} else if (selectedDeviceId) {
				// Find and set the previously selected device
				const device = availableDevices.find((d) => d.deviceId === selectedDeviceId);
				if (device) {
					selectedDevice = device;
					connectionStatus = 'connected';
				}
			}
		} catch (error) {
			console.error('Failed to detect audio devices:', error);
			dispatch('error', {
				message: `Failed to detect audio devices: ${error.message}`,
				code: 'DEVICE_DETECTION_FAILED'
			});
		} finally {
			isDetecting = false;
		}
	}

	/**
	 * Select an audio device
	 */
	async function selectDevice(device: MediaDeviceInfo) {
		if (disabled) return;

		try {
			selectedDevice = device;
			selectedDeviceId = device.deviceId;
			connectionStatus = 'connected';

			// Test audio latency
			await measureAudioLatency();

			dispatch('deviceChange', {
				deviceId: device.deviceId,
				device
			});
		} catch (error) {
			console.error('Failed to select device:', error);
			connectionStatus = 'error';
			dispatch('error', {
				message: `Failed to select device: ${error.message}`,
				code: 'DEVICE_SELECTION_FAILED'
			});
		}
	}

	/**
	 * Measure audio latency for the selected device
	 */
	async function measureAudioLatency() {
		if (!selectedDevice || !browser) return;

		try {
			if (audioContext) {
				audioContext.close();
			}

			audioContext = new AudioContext();
			const startTime = audioContext.currentTime;

			// Create a brief test tone
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);

			oscillator.frequency.setValueAtTime(440, startTime);
			gainNode.gain.setValueAtTime(0.01, startTime); // Very quiet

			oscillator.start(startTime);
			oscillator.stop(startTime + 0.1);

			// Estimate latency (simplified)
			audioLatency = Math.round(audioContext.baseLatency * 1000);
		} catch (error) {
			console.error('Failed to measure audio latency:', error);
			audioLatency = 0;
		}
	}

	/**
	 * Test audio output with a brief tone
	 */
	async function testAudioOutput() {
		if (!canTestAudio || !selectedDevice) return;

		isTestingAudio = true;

		try {
			dispatch('audioTest', { type: 'start', device: selectedDevice.deviceId });

			// Create audio context if needed
			if (!audioContext) {
				audioContext = new AudioContext();
			}

			// Create test tone (440Hz for 1 second)
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);

			oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
			gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

			oscillator.start();
			oscillator.stop(audioContext.currentTime + 1);

			// Stop testing after 1 second
			setTimeout(() => {
				isTestingAudio = false;
				dispatch('audioTest', { type: 'stop', device: selectedDevice?.deviceId || '' });
			}, 1000);
		} catch (error) {
			console.error('Audio test failed:', error);
			isTestingAudio = false;
			dispatch('error', {
				message: `Audio test failed: ${error.message}`,
				code: 'AUDIO_TEST_FAILED'
			});
		}
	}

	/**
	 * Handle voice volume change
	 */
	function handleVoiceVolumeChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newVolume = parseInt(target.value);

		if (newVolume >= 0 && newVolume <= 100) {
			voiceVolume = newVolume;
			emitVolumeChange();
		}
	}

	/**
	 * Handle workout volume change
	 */
	function handleWorkoutVolumeChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newVolume = parseInt(target.value);

		if (newVolume >= 0 && newVolume <= 100) {
			workoutVolume = newVolume;
			emitVolumeChange();
		}
	}

	/**
	 * Emit volume change event
	 */
	function emitVolumeChange() {
		dispatch('volumeChange', {
			voice: voiceVolume,
			workout: workoutVolume
		});
	}

	/**
	 * Toggle microphone enabled
	 */
	function toggleMicrophone() {
		microphoneEnabled = !microphoneEnabled;
		emitSettingsChange();
	}

	/**
	 * Toggle noise reduction
	 */
	function toggleNoiseReduction() {
		noiseReduction = !noiseReduction;
		emitSettingsChange();
	}

	/**
	 * Toggle spatial audio
	 */
	function toggleSpatialAudio() {
		spatialAudio = !spatialAudio;
		emitSettingsChange();
	}

	/**
	 * Handle audio quality change
	 */
	function handleQualityChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		audioQuality = target.value as 'low' | 'medium' | 'high';
		emitSettingsChange();
	}

	/**
	 * Emit settings change event
	 */
	function emitSettingsChange() {
		dispatch('settingsChange', {
			noiseReduction,
			audioQuality,
			spatialAudio,
			microphoneEnabled
		});
	}

	/**
	 * Refresh device list
	 */
	async function refreshDevices() {
		await detectAudioDevices();
	}

	/**
	 * Get volume level indicator class
	 */
	function getVolumeLevelClass(volume: number): string {
		if (volume >= 80) return 'high';
		if (volume >= 40) return 'medium';
		return 'low';
	}

	/**
	 * Handle device change from navigator
	 */
	function handleDeviceChange() {
		detectAudioDevices();
	}

	// Initialize on mount
	onMount(async () => {
		if (browser) {
			await detectAudioDevices();

			// Listen for device changes
			if (navigator.mediaDevices) {
				navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
			}
		}

		return () => {
			if (audioContext) {
				audioContext.close();
			}
			if (testAudioElement) {
				testAudioElement.pause();
				testAudioElement = null;
			}
			if (navigator.mediaDevices) {
				navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
			}
		};
	});

	onDestroy(() => {
		if (audioContext) {
			audioContext.close();
		}
		if (volumeTestTimeout) {
			clearTimeout(volumeTestTimeout);
		}
	});
</script>

<div class="audio-device-selector" class:disabled>
	<!-- Header -->
	<div class="selector-header">
		<h3>Audio Device Settings</h3>
		<button
			class="refresh-button"
			on:click={refreshDevices}
			disabled={disabled || isDetecting}
			aria-label="Refresh audio device list"
		>
			{#if isDetecting}
				Detecting...
			{:else}
				🔄 Refresh
			{/if}
		</button>
	</div>

	<!-- Device Selection -->
	<div class="device-selection">
		<h4>Output Device</h4>

		{#if !devicePermissions}
			<div class="permission-request">
				<p>Microphone permissions are required to detect audio devices.</p>
				<button class="permission-button" on:click={requestPermissions} {disabled}>
					Grant Permissions
				</button>
			</div>
		{:else if availableDevices.length === 0}
			<div class="no-devices">
				<p>No audio devices detected.</p>
				<button
					class="detect-button"
					on:click={detectAudioDevices}
					disabled={disabled || isDetecting}
				>
					Detect Devices
				</button>
			</div>
		{:else}
			<div class="device-list">
				{#each availableDevices as device}
					<div
						class="device-item"
						class:selected={device.deviceId === selectedDeviceId}
						class:default={device.deviceId === 'default'}
					>
						<button
							class="device-button"
							on:click={() => selectDevice(device)}
							{disabled}
							aria-label="Select {device.label || 'Unknown Device'}"
						>
							<div class="device-info">
								<span class="device-name">
									{device.label || `Device ${device.deviceId.slice(0, 8)}`}
								</span>
								{#if device.deviceId === 'default'}
									<span class="device-badge">Default</span>
								{/if}
								{#if device.deviceId === selectedDeviceId}
									<span class="device-badge selected">Selected</span>
								{/if}
							</div>

							{#if device.deviceId === selectedDeviceId}
								<div
									class="connection-indicator"
									class:connected={connectionStatus === 'connected'}
								>
									<div class="indicator-dot"></div>
								</div>
							{/if}
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Selected Device Info -->
	{#if selectedDevice}
		<div class="selected-device-info">
			<h4>Current Device</h4>
			<div class="device-details">
				<div class="detail-row">
					<span class="detail-label">Device:</span>
					<span class="detail-value">{deviceDisplayName}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Status:</span>
					<span
						class="detail-value"
						class:connected={connectionStatus === 'connected'}
						class:error={connectionStatus === 'error'}
					>
						{connectionStatus === 'connected'
							? 'Connected'
							: connectionStatus === 'error'
								? 'Error'
								: 'Disconnected'}
					</span>
				</div>
				{#if audioLatency > 0}
					<div class="detail-row">
						<span class="detail-label">Latency:</span>
						<span class="detail-value">{audioLatency}ms</span>
					</div>
				{/if}
			</div>

			<button
				class="test-audio-button"
				class:testing={isTestingAudio}
				on:click={testAudioOutput}
				disabled={!canTestAudio}
				aria-label="Test audio output with selected device"
			>
				{#if isTestingAudio}
					Testing Audio...
				{:else}
					🔊 Test Audio
				{/if}
			</button>
		</div>
	{/if}

	<!-- Volume Controls -->
	<div class="volume-controls">
		<h4>Volume Settings</h4>

		<!-- Voice Volume -->
		<div class="volume-group">
			<label for="voice-volume" class="volume-label">
				Alice Voice ({voiceVolume}%)
			</label>
			<div class="volume-slider-container">
				<input
					id="voice-volume"
					type="range"
					min="0"
					max="100"
					step="1"
					bind:value={voiceVolume}
					on:input={handleVoiceVolumeChange}
					{disabled}
					class="volume-slider voice"
					aria-label="Adjust Alice voice volume from 0 to 100 percent"
				/>
				<div class="volume-indicator {getVolumeLevelClass(voiceVolume)}">
					<div class="volume-level" style="width: {voiceVolume}%"></div>
				</div>
			</div>
		</div>

		<!-- Workout Volume -->
		<div class="volume-group">
			<label for="workout-volume" class="volume-label">
				Workout Audio ({workoutVolume}%)
			</label>
			<div class="volume-slider-container">
				<input
					id="workout-volume"
					type="range"
					min="0"
					max="100"
					step="1"
					bind:value={workoutVolume}
					on:input={handleWorkoutVolumeChange}
					{disabled}
					class="volume-slider workout"
					aria-label="Adjust workout audio volume from 0 to 100 percent"
				/>
				<div class="volume-indicator {getVolumeLevelClass(workoutVolume)}">
					<div class="volume-level" style="width: {workoutVolume}%"></div>
				</div>
			</div>
		</div>
	</div>

	<!-- Audio Settings -->
	<div class="audio-settings">
		<h4>Audio Quality & Features</h4>

		<!-- Audio Quality -->
		<div class="setting-group">
			<label for="audio-quality">Audio Quality:</label>
			<select
				id="audio-quality"
				bind:value={audioQuality}
				on:change={handleQualityChange}
				{disabled}
			>
				<option value="low">Low (64kbps, 22kHz)</option>
				<option value="medium">Medium (128kbps, 44kHz)</option>
				<option value="high">High (320kbps, 48kHz)</option>
			</select>
			<div class="quality-info">
				<span>Bitrate: {currentQualitySettings.bitrate}kbps</span>
				<span>Sample Rate: {(currentQualitySettings.sampleRate / 1000).toFixed(1)}kHz</span>
				<span>Channels: {currentQualitySettings.channels}</span>
			</div>
		</div>

		<!-- Feature Toggles -->
		<div class="feature-toggles">
			<div class="toggle-item">
				<label class="feature-toggle">
					<input
						type="checkbox"
						bind:checked={microphoneEnabled}
						on:change={toggleMicrophone}
						{disabled}
					/>
					<span class="toggle-slider"></span>
					<span class="toggle-label">Microphone Input</span>
				</label>
				<span class="toggle-description">Enable voice commands</span>
			</div>

			<div class="toggle-item">
				<label class="feature-toggle">
					<input
						type="checkbox"
						bind:checked={noiseReduction}
						on:change={toggleNoiseReduction}
						{disabled}
					/>
					<span class="toggle-slider"></span>
					<span class="toggle-label">Noise Reduction</span>
				</label>
				<span class="toggle-description">Reduce background noise</span>
			</div>

			<div class="toggle-item">
				<label class="feature-toggle">
					<input
						type="checkbox"
						bind:checked={spatialAudio}
						on:change={toggleSpatialAudio}
						{disabled}
					/>
					<span class="toggle-slider"></span>
					<span class="toggle-label">Spatial Audio</span>
				</label>
				<span class="toggle-description">3D audio positioning</span>
			</div>
		</div>
	</div>
</div>

<style>
	.audio-device-selector {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 24px;
		max-width: 580px;
		margin: 0 auto;
	}

	.audio-device-selector.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	/* Header */
	.selector-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.selector-header h3 {
		margin: 0;
		color: rgba(255, 255, 255, 0.9);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.refresh-button {
		padding: 8px 16px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.refresh-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.5);
	}

	/* Section Headings */
	h4 {
		margin: 0 0 16px 0;
		color: rgba(255, 255, 255, 0.8);
		font-size: 1rem;
		font-weight: 500;
	}

	/* Device Selection */
	.device-selection {
		margin-bottom: 32px;
	}

	.permission-request,
	.no-devices {
		text-align: center;
		padding: 32px 16px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
		border: 2px dashed rgba(255, 255, 255, 0.2);
	}

	.permission-request p,
	.no-devices p {
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 16px;
	}

	.permission-button,
	.detect-button {
		padding: 12px 24px;
		border: none;
		border-radius: 8px;
		background: var(--primary-color, #0066ff);
		color: white;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.permission-button:hover,
	.detect-button:hover {
		background: var(--primary-color-dark, #0052cc);
		transform: translateY(-1px);
	}

	.device-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.device-item {
		border-radius: 8px;
		overflow: hidden;
		transition: all 0.2s ease;
	}

	.device-item.selected {
		background: rgba(0, 102, 255, 0.1);
		border: 1px solid rgba(0, 102, 255, 0.3);
	}

	.device-button {
		width: 100%;
		padding: 16px;
		border: none;
		background: rgba(255, 255, 255, 0.05);
		color: inherit;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.device-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
	}

	.device-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.device-name {
		color: rgba(255, 255, 255, 0.9);
		font-size: 1rem;
		font-weight: 500;
	}

	.device-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.device-badge:not(.selected) {
		background: rgba(255, 255, 255, 0.2);
		color: rgba(255, 255, 255, 0.8);
	}

	.device-badge.selected {
		background: var(--primary-color, #0066ff);
		color: white;
	}

	.connection-indicator {
		display: flex;
		align-items: center;
	}

	.indicator-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		transition: background-color 0.3s ease;
	}

	.connection-indicator.connected .indicator-dot {
		background: #00ff00;
		box-shadow: 0 0 8px rgba(0, 255, 0, 0.4);
	}

	/* Selected Device Info */
	.selected-device-info {
		margin-bottom: 32px;
		padding: 20px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
	}

	.device-details {
		margin-bottom: 16px;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.detail-label {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.9rem;
	}

	.detail-value {
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
	}

	.detail-value.connected {
		color: #00ff00;
	}

	.detail-value.error {
		color: #ff4444;
	}

	.test-audio-button {
		width: 100%;
		padding: 12px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.test-audio-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.5);
	}

	.test-audio-button.testing {
		animation: pulse 1s ease-in-out infinite;
	}

	/* Volume Controls */
	.volume-controls {
		margin-bottom: 32px;
	}

	.volume-group {
		margin-bottom: 24px;
	}

	.volume-label {
		display: block;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
		font-weight: 500;
		margin-bottom: 8px;
	}

	.volume-slider-container {
		position: relative;
	}

	.volume-slider {
		width: 100%;
		height: 32px;
		background: transparent;
		outline: none;
		cursor: pointer;
		position: relative;
		z-index: 2;
	}

	.volume-slider::-webkit-slider-thumb {
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: white;
		border: 2px solid rgba(0, 0, 0, 0.2);
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.volume-indicator {
		position: absolute;
		top: 6px;
		left: 0;
		right: 0;
		height: 20px;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.1);
		overflow: hidden;
		z-index: 1;
	}

	.volume-level {
		height: 100%;
		border-radius: 10px;
		transition: width 0.2s ease;
	}

	.volume-indicator.low .volume-level {
		background: linear-gradient(to right, #ff4444, #ff8844);
	}

	.volume-indicator.medium .volume-level {
		background: linear-gradient(to right, #ffaa00, #ffdd00);
	}

	.volume-indicator.high .volume-level {
		background: linear-gradient(to right, #00ff00, #44ff44);
	}

	/* Audio Settings */
	.audio-settings {
		margin-bottom: 20px;
	}

	.setting-group {
		margin-bottom: 24px;
	}

	.setting-group label {
		display: block;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
		margin-bottom: 8px;
	}

	.setting-group select {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
	}

	.quality-info {
		display: flex;
		gap: 16px;
		margin-top: 8px;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.6);
	}

	/* Feature Toggles */
	.feature-toggles {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.toggle-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.feature-toggle {
		display: flex;
		align-items: center;
		gap: 12px;
		cursor: pointer;
		user-select: none;
	}

	.feature-toggle input {
		display: none;
	}

	.toggle-slider {
		position: relative;
		width: 44px;
		height: 24px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		transition: background-color 0.3s ease;
	}

	.toggle-slider::before {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		background: white;
		border-radius: 50%;
		transition: transform 0.3s ease;
	}

	.feature-toggle input:checked + .toggle-slider {
		background: var(--primary-color, #0066ff);
	}

	.feature-toggle input:checked + .toggle-slider::before {
		transform: translateX(20px);
	}

	.toggle-label {
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
		font-weight: 500;
	}

	.toggle-description {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.8rem;
		margin-left: 56px;
	}

	/* Animations */
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	/* Responsive Design */
	@media (max-width: 580px) {
		.audio-device-selector {
			padding: 16px;
			margin: 0 8px;
		}

		.selector-header {
			flex-direction: column;
			gap: 16px;
			align-items: flex-start;
		}

		.quality-info {
			flex-direction: column;
			gap: 4px;
		}

		.detail-row {
			flex-direction: column;
			gap: 4px;
		}
	}

	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		* {
			animation: none;
			transition: none;
		}
	}

	@media (prefers-contrast: high) {
		.audio-device-selector {
			border-color: currentColor;
		}

		.device-button:focus {
			outline: 2px solid currentColor;
			outline-offset: 2px;
		}
	}
</style>
