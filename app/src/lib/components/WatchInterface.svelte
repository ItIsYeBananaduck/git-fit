<!--
  WatchInterface Component
  
  Purpose: Smartwatch control interface with exercise parameters and sync status
  Features:
  - Exercise parameter controls (intensity, duration, type)
  - Real-time sync status with smartwatch
  - Haptic feedback triggers
  - Battery and connectivity monitoring
  - Offline capability with sync queue
-->

<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';

	// Props
	export let connected: boolean = false;
	export let batteryLevel: number = 0; // 0-100
	export let exerciseInProgress: boolean = false;
	export let currentIntensity: number = 0; // 0-10
	export let targetIntensity: number = 5;
	export let exerciseDuration: number = 0; // seconds
	export let exerciseType: string = 'general';
	export let syncStatus: 'synced' | 'syncing' | 'pending' | 'error' = 'synced';
	export let hapticEnabled: boolean = true;
	export let autoSync: boolean = true;
	export let offlineMode: boolean = false;
	export let watchModel: string = '';
	export let disabled: boolean = false;

	// Component state
	let connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';
	let lastSyncTime: Date | null = null;
	let pendingSyncCount: number = 0;
	let isReconnecting: boolean = false;
	let heartRate: number = 0;
	let stepCount: number = 0;
	let caloriesBurned: number = 0;
	let exerciseStartTime: Date | null = null;
	let syncRetryCount: number = 0;
	let maxRetries: number = 3;

	const dispatch = createEventDispatcher<{
		startExercise: { type: string; targetIntensity: number };
		stopExercise: { duration: number; avgIntensity: number };
		intensityChange: { intensity: number };
		syncTrigger: { manual: boolean };
		connectionToggle: { connecting: boolean };
		hapticTrigger: { type: 'success' | 'warning' | 'error' | 'info' };
		settingsChange: { hapticEnabled: boolean; autoSync: boolean };
	}>();

	// Exercise types available
	const exerciseTypes = [
		{ value: 'general', label: 'General Workout', icon: '🏃' },
		{ value: 'strength', label: 'Strength Training', icon: '💪' },
		{ value: 'cardio', label: 'Cardio', icon: '❤️' },
		{ value: 'yoga', label: 'Yoga/Stretching', icon: '🧘' },
		{ value: 'running', label: 'Running', icon: '🏃‍♂️' },
		{ value: 'cycling', label: 'Cycling', icon: '🚴' },
		{ value: 'swimming', label: 'Swimming', icon: '🏊' },
		{ value: 'hiit', label: 'HIIT', icon: '⚡' }
	];

	// Reactive computations
	$: connectionStatus = connected ? 'connected' : isReconnecting ? 'connecting' : 'disconnected';
	$: batteryStatus = getBatteryStatus(batteryLevel);
	$: exerciseElapsed = exerciseStartTime
		? Math.floor((Date.now() - exerciseStartTime.getTime()) / 1000)
		: 0;
	$: syncStatusMessage = getSyncStatusMessage(syncStatus, lastSyncTime, pendingSyncCount);
	$: canStartExercise = connected && !exerciseInProgress && !disabled;
	$: canStopExercise = connected && exerciseInProgress && !disabled;

	/**
	 * Get battery status color and text
	 */
	function getBatteryStatus(level: number) {
		if (level > 50) return { color: 'green', text: 'Good' };
		if (level > 20) return { color: 'orange', text: 'Low' };
		return { color: 'red', text: 'Critical' };
	}

	/**
	 * Get sync status message
	 */
	function getSyncStatusMessage(status: typeof syncStatus, lastSync: Date | null, pending: number) {
		switch (status) {
			case 'synced':
				return lastSync ? `Last sync: ${formatRelativeTime(lastSync)}` : 'Synced';
			case 'syncing':
				return 'Syncing...';
			case 'pending':
				return `${pending} items pending sync`;
			case 'error':
				return 'Sync failed - will retry';
			default:
				return 'Unknown status';
		}
	}

	/**
	 * Format relative time
	 */
	function formatRelativeTime(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;

		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;

		const diffDays = Math.floor(diffHours / 24);
		return `${diffDays}d ago`;
	}

	/**
	 * Format duration in MM:SS format
	 */
	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	/**
	 * Start exercise with current parameters
	 */
	async function startExercise() {
		if (!canStartExercise) return;

		try {
			exerciseStartTime = new Date();

			dispatch('startExercise', {
				type: exerciseType,
				targetIntensity: targetIntensity
			});

			if (hapticEnabled) {
				triggerHaptic('success');
			}
		} catch (error) {
			console.error('Failed to start exercise:', error);
			triggerHaptic('error');
		}
	}

	/**
	 * Stop current exercise
	 */
	async function stopExercise() {
		if (!canStopExercise || !exerciseStartTime) return;

		try {
			const duration = Math.floor((Date.now() - exerciseStartTime.getTime()) / 1000);
			const avgIntensity = currentIntensity; // Could be calculated average

			dispatch('stopExercise', {
				duration,
				avgIntensity
			});

			exerciseStartTime = null;

			if (hapticEnabled) {
				triggerHaptic('success');
			}
		} catch (error) {
			console.error('Failed to stop exercise:', error);
			triggerHaptic('error');
		}
	}

	/**
	 * Handle intensity adjustment
	 */
	function handleIntensityChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newIntensity = parseInt(target.value);

		if (newIntensity >= 0 && newIntensity <= 10) {
			dispatch('intensityChange', { intensity: newIntensity });

			if (hapticEnabled && Math.abs(newIntensity - currentIntensity) >= 2) {
				triggerHaptic('info');
			}
		}
	}

	/**
	 * Toggle connection to smartwatch
	 */
	async function toggleConnection() {
		if (connectionStatus === 'connecting') return;

		try {
			isReconnecting = true;

			dispatch('connectionToggle', { connecting: !connected });

			// Simulate connection attempt
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (error) {
			console.error('Connection toggle failed:', error);
			triggerHaptic('error');
		} finally {
			isReconnecting = false;
		}
	}

	/**
	 * Trigger manual sync
	 */
	async function triggerSync() {
		if (syncStatus === 'syncing') return;

		try {
			syncRetryCount = 0;
			dispatch('syncTrigger', { manual: true });

			if (hapticEnabled) {
				triggerHaptic('info');
			}
		} catch (error) {
			console.error('Manual sync failed:', error);
			triggerHaptic('error');
		}
	}

	/**
	 * Trigger haptic feedback
	 */
	function triggerHaptic(type: 'success' | 'warning' | 'error' | 'info') {
		if (!hapticEnabled) return;

		dispatch('hapticTrigger', { type });

		// Browser vibration API fallback
		if (browser && navigator.vibrate) {
			const patterns = {
				success: [100],
				warning: [100, 50, 100],
				error: [200, 100, 200],
				info: [50]
			};

			navigator.vibrate(patterns[type]);
		}
	}

	/**
	 * Toggle haptic feedback setting
	 */
	function toggleHaptic() {
		hapticEnabled = !hapticEnabled;

		dispatch('settingsChange', {
			hapticEnabled,
			autoSync
		});

		if (hapticEnabled) {
			triggerHaptic('success');
		}
	}

	/**
	 * Toggle auto-sync setting
	 */
	function toggleAutoSync() {
		autoSync = !autoSync;

		dispatch('settingsChange', {
			hapticEnabled,
			autoSync
		});

		if (hapticEnabled) {
			triggerHaptic('info');
		}
	}

	/**
	 * Handle keyboard shortcuts
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;

		switch (event.key) {
			case ' ': // Spacebar
				event.preventDefault();
				if (exerciseInProgress) {
					stopExercise();
				} else {
					startExercise();
				}
				break;

			case 's': // 'S' for sync
				if (event.ctrlKey || event.metaKey) {
					event.preventDefault();
					triggerSync();
				}
				break;

			case 'c': // 'C' for connect
				if (event.ctrlKey || event.metaKey) {
					event.preventDefault();
					toggleConnection();
				}
				break;
		}
	}

	// Auto-sync interval
	let autoSyncInterval: number;

	onMount(() => {
		// Set up auto-sync if enabled
		if (autoSync && connected) {
			autoSyncInterval = setInterval(() => {
				if (syncStatus !== 'syncing' && pendingSyncCount > 0) {
					triggerSync();
				}
			}, 30000); // Every 30 seconds
		}

		// Add keyboard listener
		document.addEventListener('keydown', handleKeydown);

		// Simulate initial data
		heartRate = 75 + Math.floor(Math.random() * 25);
		stepCount = Math.floor(Math.random() * 1000);

		return () => {
			if (autoSyncInterval) {
				clearInterval(autoSyncInterval);
			}
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	onDestroy(() => {
		if (autoSyncInterval) {
			clearInterval(autoSyncInterval);
		}
	});
</script>

<div class="watch-interface" class:disabled class:offline={offlineMode}>
	<!-- Header -->
	<div class="interface-header">
		<div class="watch-info">
			<h3>Smartwatch Control</h3>
			{#if watchModel}
				<span class="watch-model">{watchModel}</span>
			{/if}
		</div>

		<div
			class="connection-status"
			class:connected
			class:connecting={connectionStatus === 'connecting'}
		>
			<div class="status-indicator"></div>
			<span class="status-text">
				{#if connectionStatus === 'connecting'}
					Connecting...
				{:else if connected}
					Connected
				{:else}
					Disconnected
				{/if}
			</span>
		</div>
	</div>

	<!-- Device Stats -->
	<div class="device-stats">
		<div class="stat-item">
			<span class="stat-label">Battery</span>
			<div class="battery-indicator">
				<div
					class="battery-level"
					style="width: {batteryLevel}%; background-color: {batteryStatus.color}"
				></div>
				<span class="battery-text">{batteryLevel}%</span>
			</div>
		</div>

		<div class="stat-item">
			<span class="stat-label">Heart Rate</span>
			<span class="stat-value">{heartRate} BPM</span>
		</div>

		<div class="stat-item">
			<span class="stat-label">Steps</span>
			<span class="stat-value">{stepCount.toLocaleString()}</span>
		</div>
	</div>

	<!-- Exercise Controls -->
	<div class="exercise-controls">
		<h4>Exercise Control</h4>

		<div class="exercise-type-selector">
			<label for="exercise-type">Exercise Type:</label>
			<select id="exercise-type" bind:value={exerciseType} {disabled}>
				{#each exerciseTypes as type}
					<option value={type.value}>{type.icon} {type.label}</option>
				{/each}
			</select>
		</div>

		<div class="intensity-control">
			<label for="target-intensity" class="intensity-label">
				Target Intensity: {targetIntensity}/10
			</label>
			<input
				id="target-intensity"
				type="range"
				min="1"
				max="10"
				step="1"
				bind:value={targetIntensity}
				{disabled}
				class="intensity-slider"
				aria-label="Set target exercise intensity from 1 to 10"
			/>
			<div class="intensity-scale">
				<span>Low</span>
				<span>Medium</span>
				<span>High</span>
			</div>
		</div>

		{#if exerciseInProgress}
			<div class="exercise-status">
				<div class="status-row">
					<span class="status-label">Duration:</span>
					<span class="status-value">{formatDuration(exerciseElapsed)}</span>
				</div>
				<div class="status-row">
					<span class="status-label">Current Intensity:</span>
					<span class="status-value">{currentIntensity}/10</span>
				</div>
				<div class="status-row">
					<span class="status-label">Calories:</span>
					<span class="status-value">{caloriesBurned}</span>
				</div>
			</div>
		{/if}

		<div class="exercise-buttons">
			<button
				class="exercise-button start"
				class:disabled={!canStartExercise}
				on:click={startExercise}
				disabled={!canStartExercise}
				aria-label="Start exercise with current settings"
			>
				{#if exerciseInProgress}
					Exercise in Progress
				{:else}
					Start Exercise
				{/if}
			</button>

			{#if exerciseInProgress}
				<button
					class="exercise-button stop"
					class:disabled={!canStopExercise}
					on:click={stopExercise}
					disabled={!canStopExercise}
					aria-label="Stop current exercise"
				>
					Stop Exercise
				</button>
			{/if}
		</div>
	</div>

	<!-- Sync Status -->
	<div class="sync-section">
		<div class="sync-header">
			<h4>Sync Status</h4>
			<button
				class="sync-button"
				class:syncing={syncStatus === 'syncing'}
				on:click={triggerSync}
				disabled={disabled || syncStatus === 'syncing'}
				aria-label="Manually trigger data synchronization"
			>
				{#if syncStatus === 'syncing'}
					Syncing...
				{:else}
					Sync Now
				{/if}
			</button>
		</div>

		<div
			class="sync-status"
			class:error={syncStatus === 'error'}
			class:pending={syncStatus === 'pending'}
		>
			<div class="sync-indicator" class:active={syncStatus === 'syncing'}></div>
			<span class="sync-message">{syncStatusMessage}</span>
		</div>

		{#if syncStatus === 'error' && syncRetryCount < maxRetries}
			<div class="retry-info">
				<span>Retry {syncRetryCount + 1}/{maxRetries} in progress...</span>
			</div>
		{/if}
	</div>

	<!-- Connection Controls -->
	<div class="connection-controls">
		<button
			class="connection-button"
			class:connected
			class:connecting={connectionStatus === 'connecting'}
			on:click={toggleConnection}
			disabled={disabled || connectionStatus === 'connecting'}
			aria-label={connected ? 'Disconnect from smartwatch' : 'Connect to smartwatch'}
		>
			{#if connectionStatus === 'connecting'}
				Connecting...
			{:else if connected}
				Disconnect
			{:else}
				Connect
			{/if}
		</button>
	</div>

	<!-- Settings -->
	<div class="watch-settings">
		<h4>Settings</h4>

		<div class="setting-item">
			<label class="setting-toggle">
				<input type="checkbox" bind:checked={hapticEnabled} on:change={toggleHaptic} {disabled} />
				<span class="toggle-slider"></span>
				<span class="setting-label">Haptic Feedback</span>
			</label>
		</div>

		<div class="setting-item">
			<label class="setting-toggle">
				<input type="checkbox" bind:checked={autoSync} on:change={toggleAutoSync} {disabled} />
				<span class="toggle-slider"></span>
				<span class="setting-label">Auto-Sync</span>
			</label>
		</div>
	</div>

	<!-- Offline Indicator -->
	{#if offlineMode}
		<div class="offline-indicator">
			<span class="offline-icon">📱</span>
			<span class="offline-text">Offline Mode - Data will sync when connected</span>
		</div>
	{/if}
</div>

<style>
	.watch-interface {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 24px;
		max-width: 480px;
		margin: 0 auto;
		position: relative;
	}

	.watch-interface.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.watch-interface.offline {
		border-color: rgba(255, 165, 0, 0.3);
	}

	/* Header */
	.interface-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.watch-info h3 {
		margin: 0;
		color: rgba(255, 255, 255, 0.9);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.watch-model {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.85rem;
		display: block;
		margin-top: 4px;
	}

	.connection-status {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.status-indicator {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		transition: background-color 0.3s ease;
	}

	.connection-status.connected .status-indicator {
		background: #00ff00;
		box-shadow: 0 0 8px rgba(0, 255, 0, 0.4);
	}

	.connection-status.connecting .status-indicator {
		background: #ffaa00;
		animation: pulse 1s ease-in-out infinite;
	}

	.status-text {
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
	}

	/* Device Stats */
	.device-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 16px;
		margin-bottom: 32px;
		padding: 16px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
	}

	.stat-item {
		text-align: center;
	}

	.stat-label {
		display: block;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.8rem;
		margin-bottom: 8px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-value {
		color: rgba(255, 255, 255, 0.9);
		font-size: 1.1rem;
		font-weight: 600;
	}

	.battery-indicator {
		position: relative;
		width: 60px;
		height: 20px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 10px;
		margin: 0 auto;
		overflow: hidden;
	}

	.battery-level {
		height: 100%;
		border-radius: 10px;
		transition: width 0.3s ease;
	}

	.battery-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 0.7rem;
		color: white;
		font-weight: 600;
	}

	/* Exercise Controls */
	.exercise-controls {
		margin-bottom: 32px;
	}

	.exercise-controls h4 {
		margin: 0 0 16px 0;
		color: rgba(255, 255, 255, 0.8);
		font-size: 1rem;
		font-weight: 500;
	}

	.exercise-type-selector {
		margin-bottom: 20px;
	}

	.exercise-type-selector label {
		display: block;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
		margin-bottom: 8px;
	}

	.exercise-type-selector select {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
	}

	.intensity-control {
		margin-bottom: 20px;
	}

	.intensity-label {
		display: block;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
		margin-bottom: 8px;
	}

	.intensity-slider {
		width: 100%;
		height: 24px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		outline: none;
		cursor: pointer;
		margin-bottom: 8px;
	}

	.intensity-scale {
		display: flex;
		justify-content: space-between;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.8rem;
	}

	.exercise-status {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 20px;
	}

	.status-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.status-row:last-child {
		margin-bottom: 0;
	}

	.status-label {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.9rem;
	}

	.status-value {
		color: rgba(255, 255, 255, 0.9);
		font-weight: 600;
	}

	.exercise-buttons {
		display: flex;
		gap: 12px;
	}

	.exercise-button {
		flex: 1;
		padding: 12px 20px;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.exercise-button.start {
		background: #00ff00;
		color: #000;
	}

	.exercise-button.start:hover:not(.disabled) {
		background: #00cc00;
		transform: translateY(-1px);
	}

	.exercise-button.stop {
		background: #ff4444;
		color: white;
	}

	.exercise-button.stop:hover:not(.disabled) {
		background: #cc0000;
		transform: translateY(-1px);
	}

	.exercise-button.disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	/* Sync Section */
	.sync-section {
		margin-bottom: 32px;
	}

	.sync-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.sync-header h4 {
		margin: 0;
		color: rgba(255, 255, 255, 0.8);
		font-size: 1rem;
		font-weight: 500;
	}

	.sync-button {
		padding: 6px 12px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.sync-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
	}

	.sync-button.syncing {
		animation: pulse 1s ease-in-out infinite;
	}

	.sync-status {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 6px;
	}

	.sync-indicator {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		transition: background-color 0.3s ease;
	}

	.sync-indicator.active {
		background: #00ff00;
		animation: pulse 1s ease-in-out infinite;
	}

	.sync-status.error .sync-indicator {
		background: #ff4444;
	}

	.sync-status.pending .sync-indicator {
		background: #ffaa00;
	}

	.sync-message {
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
	}

	.retry-info {
		margin-top: 8px;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.8rem;
		font-style: italic;
	}

	/* Connection Controls */
	.connection-controls {
		text-align: center;
		margin-bottom: 32px;
	}

	.connection-button {
		padding: 12px 24px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		background: transparent;
		color: rgba(255, 255, 255, 0.9);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.connection-button:hover:not(:disabled) {
		border-color: rgba(255, 255, 255, 0.6);
		background: rgba(255, 255, 255, 0.1);
	}

	.connection-button.connected {
		border-color: #ff4444;
		color: #ff4444;
	}

	.connection-button.connecting {
		animation: pulse 1s ease-in-out infinite;
	}

	/* Settings */
	.watch-settings {
		margin-bottom: 20px;
	}

	.watch-settings h4 {
		margin: 0 0 16px 0;
		color: rgba(255, 255, 255, 0.8);
		font-size: 1rem;
		font-weight: 500;
	}

	.setting-item {
		margin-bottom: 16px;
	}

	.setting-toggle {
		display: flex;
		align-items: center;
		gap: 12px;
		cursor: pointer;
		user-select: none;
	}

	.setting-toggle input {
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

	.setting-toggle input:checked + .toggle-slider {
		background: var(--primary-color, #0066ff);
	}

	.setting-toggle input:checked + .toggle-slider::before {
		transform: translateX(20px);
	}

	.setting-label {
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
	}

	/* Offline Indicator */
	.offline-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px;
		background: rgba(255, 165, 0, 0.1);
		border: 1px solid rgba(255, 165, 0, 0.3);
		border-radius: 6px;
		color: rgba(255, 165, 0, 0.9);
		font-size: 0.9rem;
	}

	.offline-icon {
		font-size: 1.2rem;
	}

	/* Animations */
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	/* Responsive Design */
	@media (max-width: 480px) {
		.watch-interface {
			padding: 16px;
			margin: 0 8px;
		}

		.interface-header {
			flex-direction: column;
			gap: 12px;
			align-items: flex-start;
		}

		.device-stats {
			grid-template-columns: 1fr 1fr;
		}

		.exercise-buttons {
			flex-direction: column;
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
		.watch-interface {
			border-color: currentColor;
		}
	}
</style>
