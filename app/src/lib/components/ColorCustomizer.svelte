<!--
  ColorCustomizer Component
  
  Purpose: User interface for customizing Alice orb colors
  Features:
  - Hue slider with live preview
  - Color picker with HSL controls
  - Real-time color updates with persistence
  - Preset color options and reset functionality
-->

<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import { hslToRgb, hslToHex, normalizeHue } from '$lib/utils/colorUtils.js';
	import AliceOrb from './AliceOrb.svelte';

	// Props
	export let initialHue: number = 240; // Default blue
	export let customColorEnabled: boolean = true;
	export let showPreview: boolean = true;
	export let showPresets: boolean = true;
	export let showAdvancedControls: boolean = false;
	export let disabled: boolean = false;
	export let autoSave: boolean = true;
	export let saveDelay: number = 500; // ms

	// Component state
	let currentHue: number = initialHue;
	let saturation: number = 100;
	let lightness: number = 50;
	let isCustomEnabled: boolean = customColorEnabled;
	let isDragging: boolean = false;
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	let hasUnsavedChanges: boolean = false;
	let lastSavedHue: number = initialHue;

	const dispatch = createEventDispatcher<{
		colorChange: { hue: number; customEnabled: boolean; hsl: { h: number; s: number; l: number } };
		save: { hue: number; customEnabled: boolean };
		reset: { hue: number };
		presetSelect: { name: string; hue: number };
	}>();

	// Color presets
	const colorPresets = [
		{ name: 'Default Blue', hue: 240, color: '#0066ff' },
		{ name: 'Energetic Red', hue: 0, color: '#ff0000' },
		{ name: 'Calm Green', hue: 120, color: '#00ff00' },
		{ name: 'Focus Purple', hue: 270, color: '#8000ff' },
		{ name: 'Warm Orange', hue: 30, color: '#ff8000' },
		{ name: 'Cool Cyan', hue: 180, color: '#00ffff' },
		{ name: 'Royal Purple', hue: 280, color: '#9000ff' },
		{ name: 'Fresh Lime', hue: 90, color: '#80ff00' }
	];

	// Reactive computations
	$: currentColor = { h: currentHue, s: saturation, l: lightness };
	$: currentColorHex = hslToHex(currentColor);
	$: hasUnsavedChanges = currentHue !== lastSavedHue || isCustomEnabled !== customColorEnabled;

	/**
	 * Handle hue slider change
	 */
	function handleHueChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newHue = parseInt(target.value);

		if (!isNaN(newHue) && newHue >= 0 && newHue <= 360) {
			currentHue = normalizeHue(newHue);
			emitColorChange();
			scheduleAutoSave();
		}
	}

	/**
	 * Handle saturation change
	 */
	function handleSaturationChange(event: Event) {
		const target = event.target as HTMLInputElement;
		saturation = Math.max(0, Math.min(100, parseInt(target.value)));
		emitColorChange();
		scheduleAutoSave();
	}

	/**
	 * Handle lightness change
	 */
	function handleLightnessChange(event: Event) {
		const target = event.target as HTMLInputElement;
		lightness = Math.max(0, Math.min(100, parseInt(target.value)));
		emitColorChange();
		scheduleAutoSave();
	}

	/**
	 * Handle custom color toggle
	 */
	function handleCustomToggle() {
		isCustomEnabled = !isCustomEnabled;
		emitColorChange();
		scheduleAutoSave();
	}

	/**
	 * Emit color change event
	 */
	function emitColorChange() {
		dispatch('colorChange', {
			hue: currentHue,
			customEnabled: isCustomEnabled,
			hsl: currentColor
		});
	}

	/**
	 * Schedule auto-save if enabled
	 */
	function scheduleAutoSave() {
		if (!autoSave) return;

		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		saveTimeout = setTimeout(() => {
			saveSettings();
		}, saveDelay);
	}

	/**
	 * Save current settings
	 */
	async function saveSettings() {
		try {
			lastSavedHue = currentHue;

			dispatch('save', {
				hue: currentHue,
				customEnabled: isCustomEnabled
			});

			// Update browser storage if available
			if (browser && localStorage) {
				localStorage.setItem(
					'alice-orb-preferences',
					JSON.stringify({
						hue: currentHue,
						saturation,
						lightness,
						customEnabled: isCustomEnabled,
						lastModified: Date.now()
					})
				);
			}
		} catch (error) {
			console.error('Failed to save color settings:', error);
		}
	}

	/**
	 * Reset to default blue color
	 */
	function resetToDefault() {
		currentHue = 240;
		saturation = 100;
		lightness = 50;
		isCustomEnabled = true;

		emitColorChange();
		dispatch('reset', { hue: 240 });

		if (autoSave) {
			saveSettings();
		}
	}

	/**
	 * Select a color preset
	 */
	function selectPreset(preset: (typeof colorPresets)[0]) {
		currentHue = preset.hue;
		saturation = 100;
		lightness = 50;
		isCustomEnabled = true;

		emitColorChange();
		dispatch('presetSelect', { name: preset.name, hue: preset.hue });

		if (autoSave) {
			saveSettings();
		}
	}

	/**
	 * Handle keyboard navigation for hue slider
	 */
	function handleHueKeydown(event: KeyboardEvent) {
		const step = event.shiftKey ? 10 : 1;

		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowDown':
				event.preventDefault();
				currentHue = Math.max(0, currentHue - step);
				emitColorChange();
				scheduleAutoSave();
				break;

			case 'ArrowRight':
			case 'ArrowUp':
				event.preventDefault();
				currentHue = Math.min(360, currentHue + step);
				emitColorChange();
				scheduleAutoSave();
				break;

			case 'Home':
				event.preventDefault();
				currentHue = 0;
				emitColorChange();
				scheduleAutoSave();
				break;

			case 'End':
				event.preventDefault();
				currentHue = 360;
				emitColorChange();
				scheduleAutoSave();
				break;
		}
	}

	/**
	 * Load saved preferences
	 */
	function loadSavedPreferences() {
		if (!browser || !localStorage) return;

		try {
			const saved = localStorage.getItem('alice-orb-preferences');
			if (saved) {
				const preferences = JSON.parse(saved);
				currentHue = preferences.hue || initialHue;
				saturation = preferences.saturation || 100;
				lightness = preferences.lightness || 50;
				isCustomEnabled = preferences.customEnabled ?? true;
				lastSavedHue = currentHue;
			}
		} catch (error) {
			console.error('Failed to load saved preferences:', error);
		}
	}

	// Load preferences on mount
	onMount(() => {
		loadSavedPreferences();
		emitColorChange();
	});

	// Cleanup on destroy
	onDestroy(() => {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}
	});
</script>

<div class="color-customizer" class:disabled>
	<!-- Header -->
	<div class="customizer-header">
		<h3>Customize Alice Orb Color</h3>
		<div class="header-controls">
			<label class="custom-toggle">
				<input
					type="checkbox"
					bind:checked={isCustomEnabled}
					on:change={handleCustomToggle}
					{disabled}
				/>
				<span class="toggle-slider"></span>
				<span class="toggle-label">Custom Color</span>
			</label>

			{#if hasUnsavedChanges && !autoSave}
				<button
					class="save-button"
					on:click={saveSettings}
					{disabled}
					aria-label="Save color changes"
				>
					Save
				</button>
			{/if}
		</div>
	</div>

	<!-- Preview Section -->
	{#if showPreview}
		<div class="preview-section">
			<div class="preview-container">
				<AliceOrb
					baseColor={currentColorHex}
					strain={0}
					isResting={false}
					size={120}
					earbudsConnected={false}
					musicActive={false}
					on:colorChange
				/>

				<div class="color-info">
					<div class="color-value">
						<span class="label">HSL:</span>
						<span class="value">({currentHue}, {saturation}%, {lightness}%)</span>
					</div>
					<div class="color-value">
						<span class="label">Hex:</span>
						<span class="value">{currentColorHex}</span>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Controls -->
	<div class="controls-section" class:enabled={isCustomEnabled}>
		<!-- Hue Slider -->
		<div class="control-group">
			<label for="hue-slider" class="control-label">
				Hue ({currentHue}°)
			</label>
			<div class="slider-container">
				<input
					id="hue-slider"
					type="range"
					min="0"
					max="360"
					step="1"
					bind:value={currentHue}
					on:input={handleHueChange}
					on:keydown={handleHueKeydown}
					on:mousedown={() => (isDragging = true)}
					on:mouseup={() => (isDragging = false)}
					disabled={disabled || !isCustomEnabled}
					class="hue-slider"
					aria-label="Select hue value from 0 to 360 degrees"
				/>
				<div class="hue-gradient" aria-hidden="true"></div>
			</div>
		</div>

		<!-- Advanced Controls -->
		{#if showAdvancedControls}
			<div class="advanced-controls">
				<!-- Saturation -->
				<div class="control-group">
					<label for="saturation-slider" class="control-label">
						Saturation ({saturation}%)
					</label>
					<input
						id="saturation-slider"
						type="range"
						min="0"
						max="100"
						step="1"
						bind:value={saturation}
						on:input={handleSaturationChange}
						disabled={disabled || !isCustomEnabled}
						class="saturation-slider"
						aria-label="Select saturation from 0 to 100 percent"
					/>
				</div>

				<!-- Lightness -->
				<div class="control-group">
					<label for="lightness-slider" class="control-label">
						Lightness ({lightness}%)
					</label>
					<input
						id="lightness-slider"
						type="range"
						min="0"
						max="100"
						step="1"
						bind:value={lightness}
						on:input={handleLightnessChange}
						disabled={disabled || !isCustomEnabled}
						class="lightness-slider"
						aria-label="Select lightness from 0 to 100 percent"
					/>
				</div>
			</div>
		{/if}
	</div>

	<!-- Preset Colors -->
	{#if showPresets}
		<div class="presets-section">
			<h4>Quick Presets</h4>
			<div class="presets-grid">
				{#each colorPresets as preset}
					<button
						class="preset-button"
						class:active={currentHue === preset.hue && isCustomEnabled}
						style="background-color: {preset.color}"
						on:click={() => selectPreset(preset)}
						disabled={disabled || !isCustomEnabled}
						aria-label="Select {preset.name} color preset"
						title={preset.name}
					>
						<span class="preset-name">{preset.name}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Reset Button -->
	<div class="reset-section">
		<button
			class="reset-button"
			on:click={resetToDefault}
			disabled={disabled || (currentHue === 240 && saturation === 100 && lightness === 50)}
			aria-label="Reset to default blue color"
		>
			Reset to Default
		</button>
	</div>

	<!-- Status indicator -->
	{#if hasUnsavedChanges && autoSave}
		<div class="status-indicator" aria-live="polite">
			<span class="saving-text">Auto-saving changes...</span>
		</div>
	{/if}
</div>

<style>
	.color-customizer {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 24px;
		max-width: 480px;
		margin: 0 auto;
	}

	.color-customizer.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	/* Header */
	.customizer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.customizer-header h3 {
		margin: 0;
		color: rgba(255, 255, 255, 0.9);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	/* Custom Toggle */
	.custom-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		user-select: none;
	}

	.custom-toggle input {
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

	.custom-toggle input:checked + .toggle-slider {
		background: var(--primary-color, #0066ff);
	}

	.custom-toggle input:checked + .toggle-slider::before {
		transform: translateX(20px);
	}

	.toggle-label {
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
	}

	/* Preview Section */
	.preview-section {
		text-align: center;
		margin-bottom: 32px;
	}

	.preview-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	.color-info {
		display: flex;
		gap: 24px;
		font-size: 0.9rem;
	}

	.color-value {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.color-value .label {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.color-value .value {
		color: rgba(255, 255, 255, 0.9);
		font-family: monospace;
		font-weight: 500;
	}

	/* Controls Section */
	.controls-section {
		margin-bottom: 24px;
		transition: opacity 0.3s ease;
	}

	.controls-section:not(.enabled) {
		opacity: 0.4;
	}

	.control-group {
		margin-bottom: 20px;
	}

	.control-label {
		display: block;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
		font-weight: 500;
		margin-bottom: 8px;
	}

	/* Hue Slider */
	.slider-container {
		position: relative;
		margin-bottom: 12px;
	}

	.hue-slider {
		width: 100%;
		height: 32px;
		background: transparent;
		outline: none;
		cursor: pointer;
		position: relative;
		z-index: 2;
	}

	.hue-slider::-webkit-slider-thumb {
		appearance: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: white;
		border: 2px solid rgba(0, 0, 0, 0.2);
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.hue-slider::-moz-range-thumb {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: white;
		border: 2px solid rgba(0, 0, 0, 0.2);
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.hue-gradient {
		position: absolute;
		top: 4px;
		left: 0;
		right: 0;
		height: 24px;
		border-radius: 12px;
		background: linear-gradient(
			to right,
			hsl(0, 100%, 50%),
			hsl(60, 100%, 50%),
			hsl(120, 100%, 50%),
			hsl(180, 100%, 50%),
			hsl(240, 100%, 50%),
			hsl(300, 100%, 50%),
			hsl(360, 100%, 50%)
		);
		pointer-events: none;
		z-index: 1;
	}

	/* Regular sliders */
	.saturation-slider,
	.lightness-slider {
		width: 100%;
		height: 24px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		outline: none;
		cursor: pointer;
	}

	/* Presets Section */
	.presets-section {
		margin-bottom: 24px;
	}

	.presets-section h4 {
		margin: 0 0 16px 0;
		color: rgba(255, 255, 255, 0.8);
		font-size: 1rem;
		font-weight: 500;
	}

	.presets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 12px;
	}

	.preset-button {
		position: relative;
		height: 60px;
		border: 2px solid transparent;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		overflow: hidden;
	}

	.preset-button:hover {
		transform: scale(1.05);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.preset-button.active {
		border-color: white;
		box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
	}

	.preset-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.preset-name {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		font-size: 0.7rem;
		padding: 4px 6px;
		text-align: center;
	}

	/* Buttons */
	.save-button,
	.reset-button {
		padding: 8px 16px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.save-button:hover,
	.reset-button:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.5);
	}

	.save-button:disabled,
	.reset-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.reset-section {
		text-align: center;
	}

	/* Status Indicator */
	.status-indicator {
		margin-top: 16px;
		text-align: center;
	}

	.saving-text {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.8rem;
		font-style: italic;
	}

	/* Responsive Design */
	@media (max-width: 480px) {
		.color-customizer {
			padding: 16px;
			margin: 0 8px;
		}

		.customizer-header {
			flex-direction: column;
			gap: 16px;
			align-items: flex-start;
		}

		.color-info {
			flex-direction: column;
			gap: 8px;
		}

		.presets-grid {
			grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
		}
	}

	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		* {
			transition: none;
		}
	}

	@media (prefers-contrast: high) {
		.color-customizer {
			border-color: currentColor;
		}

		.preset-button:focus {
			outline: 2px solid currentColor;
			outline-offset: 2px;
		}
	}
</style>
