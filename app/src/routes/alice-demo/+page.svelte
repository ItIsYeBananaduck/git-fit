<!-- Enhanced Alice Orb Demo with Iris Customization -->
<script lang="ts">
	import { onMount } from 'svelte';
	import AliceUnified from '$lib/components/AliceUnified.svelte';

	// Alice customization state
	let subscriptionTier: 'free' | 'trial' | 'paid' | 'trainer' = 'paid'; // Full access
	let irisColor = '#00BFFF'; // Default bright blue
	let irisPattern = 'solid';
	let customColor = '#1a1a2e'; // Alice body color
	let eyeState: 'normal' | 'wink' | 'droop' | 'excited' = 'normal';
	let intensity = 65; // Start with some intensity
	let mode: 'idle' | 'workout' | 'nutrition' | 'analytics' | 'radio' = 'workout';
	let twoEyes = false;
	let rogueEye = false; // Toggle for one eye vs two eyes
	
	// Workout card state
	let showWorkoutCard = false;
	let currentWorkout = 0;
	
	// Sample workout data
	const workoutData = [
		{ 
			name: 'Morning Cardio', 
			duration: '25 min', 
			calories: '240 cal',
			intensityScore: 7,
			stressScore: 3,
			exercises: [
				{
					name: 'Treadmill Run',
					notes: 'Maintain steady pace, focus on breathing',
					sets: [
						{ reps: null, weight: null, weightNum: 0, duration: '8 min', completed: false, skipped: false },
						{ reps: null, weight: null, weightNum: 0, duration: '6 min', completed: false, skipped: false },
						{ reps: null, weight: null, weightNum: 0, duration: '5 min', completed: false, skipped: false }
					]
				},
				{
					name: 'Burpees',
					notes: 'Full body movement, explosive power',
					sets: [
						{ reps: 12, weight: null, weightNum: 0, duration: null, completed: false, skipped: false },
						{ reps: 10, weight: null, weightNum: 0, duration: null, completed: false, skipped: false },
						{ reps: 8, weight: null, weightNum: 0, duration: null, completed: false, skipped: false }
					]
				}
			]
		},
		{ 
			name: 'Strength Training', 
			duration: '45 min', 
			calories: '380 cal',
			intensityScore: 9,
			stressScore: 6,
			exercises: [
				{
					name: 'Bench Press',
					notes: 'Keep core tight, controlled movement',
					sets: [
						{ reps: 12, weight: '135 lbs', weightNum: 135, duration: null, completed: false, skipped: false },
						{ reps: 10, weight: '155 lbs', weightNum: 155, duration: null, completed: false, skipped: false },
						{ reps: 8, weight: '175 lbs', weightNum: 175, duration: null, completed: false, skipped: false },
						{ reps: 6, weight: '185 lbs', weightNum: 185, duration: null, completed: false, skipped: false }
					]
				},
				{
					name: 'Squats',
					notes: 'Deep squat, drive through heels',
					sets: [
						{ reps: 15, weight: '95 lbs', weightNum: 95, duration: null, completed: false, skipped: false },
						{ reps: 12, weight: '115 lbs', weightNum: 115, duration: null, completed: false, skipped: false },
						{ reps: 10, weight: '135 lbs', weightNum: 135, duration: null, completed: false, skipped: false }
					]
				}
			]
		},
		{ 
			name: 'Yoga Flow', 
			duration: '30 min', 
			calories: '150 cal',
			intensityScore: 4,
			stressScore: 1,
			exercises: [
				{
					name: 'Sun Salutation',
					notes: 'Flow with breath, 4 counts per pose',
					sets: [
						{ reps: null, weight: null, weightNum: 0, duration: '8 min', completed: false, skipped: false },
						{ reps: null, weight: null, weightNum: 0, duration: '6 min', completed: false, skipped: false }
					]
				},
				{
					name: 'Warrior Poses',
					notes: 'Hold each pose for 30 seconds',
					sets: [
						{ reps: null, weight: null, weightNum: 0, duration: '8 min', completed: false, skipped: false },
						{ reps: null, weight: null, weightNum: 0, duration: '8 min', completed: false, skipped: false }
					]
				}
			]
		},
		{ 
			name: 'HIIT Session', 
			duration: '20 min', 
			calories: '300 cal',
			intensityScore: 10,
			stressScore: 8,
			exercises: [
				{
					name: 'Mountain Climbers',
					notes: 'High knees, fast pace',
					sets: [
						{ reps: 15, weight: null, weightNum: 0, duration: '45s', completed: false, skipped: false },
						{ reps: 15, weight: null, weightNum: 0, duration: '45s', completed: false, skipped: false },
						{ reps: 15, weight: null, weightNum: 0, duration: '45s', completed: false, skipped: false }
					]
				},
				{
					name: 'Jump Squats',
					notes: 'Explosive movement, soft landing',
					sets: [
						{ reps: 20, weight: null, weightNum: 0, duration: '60s', completed: false, skipped: false },
						{ reps: 18, weight: null, weightNum: 0, duration: '50s', completed: false, skipped: false },
						{ reps: 15, weight: null, weightNum: 0, duration: '30s', completed: false, skipped: false }
					]
				}
			]
		}
	];

	// Dispatch updates to sync with layout Alice
	$: if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent('alice-demo-update', {
			detail: {
				subscriptionTier,
				customPattern: 'solid',
				customColor,
				irisColor,
				irisPattern,
				mode,
				zenMode: false,
				playMode: false,
				heartRate: 75,
				intensity,
				isBackgroundMonitoring: false,
				eyeState,
				twoEyes,
				rogueEye,
				showWorkoutCard,
				workoutData: showWorkoutCard ? workoutData[currentWorkout] : null
			}
		}));
	}

	// Available patterns for iris
	const irisPatterns = [
		{ value: 'solid', label: 'Solid', emoji: '⚪' },
		{ value: 'stripes', label: 'Stripes', emoji: '🦓' },
		{ value: 'spots', label: 'Spots', emoji: '🐆' },
		{ value: 'leopard', label: 'Leopard', emoji: '🐅' },
		{ value: 'chrome', label: 'Chrome', emoji: '🔘' },
		{ value: 'glitch', label: 'Glitch', emoji: '⚡' }
	];

	// Preset iris combinations
	const irisPresets = [
		{ name: 'Electric Blue', color: '#00BFFF', pattern: 'solid' },
		{ name: 'Fire Red', color: '#FF4500', pattern: 'solid' },
		{ name: 'Forest Green', color: '#228B22', pattern: 'solid' },
		{ name: 'Purple Magic', color: '#8A2BE2', pattern: 'solid' },
		{ name: 'Golden Tiger', color: '#FF8C00', pattern: 'stripes' },
		{ name: 'Chrome Steel', color: '#C0C0C0', pattern: 'chrome' },
		{ name: 'Digital Matrix', color: '#00FF41', pattern: 'glitch' },
		{ name: 'Spotted Cat', color: '#DAA520', pattern: 'spots' }
	];

	// Auto demo functionality
	let autoDemo = false;
	let demoInterval: number;

	function startAutoDemo() {
		autoDemo = true;
		demoInterval = setInterval(() => {
			// Randomly change intensity
			intensity = Math.floor(Math.random() * 100);
			
			// Randomly trigger eye states
			const action = Math.random();
			if (action < 0.2) {
				eyeState = 'wink';
				setTimeout(() => eyeState = 'normal', 500);
			} else if (action < 0.3) {
				eyeState = 'excited';
				setTimeout(() => eyeState = 'normal', 800);
			} else if (action < 0.4) {
				eyeState = 'droop';
				setTimeout(() => eyeState = 'normal', 1000);
			}
		}, 2000);
	}

	function stopAutoDemo() {
		autoDemo = false;
		if (demoInterval) clearInterval(demoInterval);
	}

	function applyPreset(preset: any) {
		irisColor = preset.color;
		irisPattern = preset.pattern;
	}

	function getContrastingColor(hexColor: string): string {
		const color = hexColor.replace('#', '');
		const r = parseInt(color.substring(0, 2), 16);
		const g = parseInt(color.substring(2, 4), 16);
		const b = parseInt(color.substring(4, 6), 16);
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		return luminance > 0.5 ? '#000000' : '#FFFFFF';
	}

	// Handle Alice interactions
	function handleAliceTapped(event: CustomEvent) {
		console.log('Alice tapped:', event.detail);
	}

	function handleModeSelected(event: CustomEvent) {
		console.log('Mode selected:', event.detail);
		mode = event.detail.mode;
	}

	onMount(() => {
		return () => {
			if (demoInterval) clearInterval(demoInterval);
		};
	});
</script>

<div class="alice-demo">
	<h1>🎨 Alice AI Enhanced Demo</h1>
	<p class="subtitle">Now with customizable iris patterns and colors!</p>
	
	<div class="demo-grid">
		<!-- Alice Preview -->
		<div class="alice-section">
			<div class="alice-container">
				<AliceUnified 
					{subscriptionTier}
					{customColor}
					{irisColor}
					{irisPattern}
					{mode}
					{eyeState}
					{twoEyes}
					{rogueEye}
					heartRate={75}
					{intensity}
					size={200}
					{showWorkoutCard}
					workoutData={showWorkoutCard ? workoutData[currentWorkout] : null}
					on:alice-tapped={handleAliceTapped}
					on:modeSelected={handleModeSelected}
				/>
			</div>
			
			<div class="alice-info">
				<h3>Current Settings</h3>
				<div class="info-grid">
					<div class="info-item">
						<span class="label">Iris:</span>
						<span class="color-indicator" style="background-color: {irisColor};"></span>
						<span class="value">{irisColor}</span>
					</div>
					<div class="info-item">
						<span class="label">Pattern:</span>
						<span class="value">{irisPattern}</span>
					</div>
					<div class="info-item">
						<span class="label">Pupil:</span>
						<span class="color-indicator" style="background-color: {getContrastingColor(irisColor)};"></span>
						<span class="value">{getContrastingColor(irisColor)}</span>
					</div>
					<div class="info-item">
						<span class="label">Body:</span>
						<span class="color-indicator" style="background-color: {customColor};"></span>
						<span class="value">{customColor}</span>
					</div>
					<div class="info-item">
						<span class="label">Eye State:</span>
						<span class="value">{eyeState}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Controls Panel -->
		<div class="controls-section">
			<h3>🎛️ Customization Controls</h3>
			
			<!-- Iris Color -->
			<div class="control-group">
				<div class="control-label">Iris Color</div>
				<div class="color-control">
					<input type="color" bind:value={irisColor} class="color-picker" />
					<input type="text" bind:value={irisColor} class="color-input" placeholder="#00BFFF" />
				</div>
			</div>

			<!-- Iris Pattern -->
			<div class="control-group">
				<div class="control-label">Iris Pattern</div>
				<div class="pattern-selector">
					{#each irisPatterns as pattern}
						<button 
							class="pattern-btn {irisPattern === pattern.value ? 'active' : ''}"
							onclick={() => irisPattern = pattern.value}
						>
							<span class="pattern-emoji">{pattern.emoji}</span>
							<span class="pattern-name">{pattern.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Eye State Controls -->
			<div class="control-group">
				<div class="control-label">Eye Actions</div>
				<div class="action-buttons">
					<button onclick={() => { eyeState = 'wink'; setTimeout(() => eyeState = 'normal', 500); }} class="btn-action">😉 Wink</button>
					<button onclick={() => { eyeState = 'excited'; setTimeout(() => eyeState = 'normal', 800); }} class="btn-action">🤩 Excited</button>
					<button onclick={() => { eyeState = 'droop'; setTimeout(() => eyeState = 'normal', 1000); }} class="btn-action">😴 Sleepy</button>
				</div>
			</div>

			<!-- Two Eyes Toggle -->
			<div class="control-group">
				<div class="control-label">Eye Configuration</div>
				<div class="toggle-control">
					<label class="toggle-switch">
						<input type="checkbox" bind:checked={twoEyes} />
						<span class="toggle-slider"></span>
						<span class="toggle-label">{twoEyes ? '👀 Two Eyes' : '👁️ One Eye'}</span>
					</label>
				</div>
			</div>

			<!-- Rogue Eye Toggle (only show when two eyes are enabled) -->
			{#if twoEyes}
			<div class="control-group">
				<div class="control-label">Rogue Eye Mode</div>
				<div class="toggle-control">
					<label class="toggle-switch">
						<input type="checkbox" bind:checked={rogueEye} />
						<span class="toggle-slider"></span>
						<span class="toggle-label">{rogueEye ? '🤪 Rogue Eye' : '😌 Normal Eyes'}</span>
					</label>
				</div>
				<div class="help-text">One eye tracks clicks, the other wanders randomly</div>
			</div>
			{/if}

			<!-- Workout Card Controls -->
			<div class="control-group">
				<div class="control-label">Workout Card</div>
				<div class="toggle-control">
					<label class="toggle-switch">
						<input type="checkbox" bind:checked={showWorkoutCard} />
						<span class="toggle-slider"></span>
						<span class="toggle-label">{showWorkoutCard ? '📊 Card Visible' : '📋 Card Hidden'}</span>
					</label>
				</div>
				<div class="help-text">Shows workout card sliding down from Alice</div>
			</div>

			<!-- Workout Selection (only show when card is enabled) -->
			{#if showWorkoutCard}
			<div class="control-group">
				<div class="control-label">Select Workout</div>
				<div class="select-control">
					<select bind:value={currentWorkout} class="workout-select">
						{#each workoutData as workout, index}
							<option value={index}>{workout.name}</option>
						{/each}
					</select>
				</div>
				<div class="help-text">Choose different workout types to display</div>
			</div>
			{/if}

			<!-- Alice Body Color -->
			<div class="control-group">
				<div class="control-label">Alice Body Color</div>
				<div class="color-control">
					<input type="color" bind:value={customColor} class="color-picker" />
					<input type="text" bind:value={customColor} class="color-input" placeholder="#1a1a2e" />
				</div>
			</div>

			<!-- Auto Demo Toggle -->
			<div class="control-group">
				<div class="control-label">Auto Demo</div>
				<div class="demo-controls">
					{#if autoDemo}
						<button onclick={stopAutoDemo} class="btn-stop">⏹️ Stop Demo</button>
					{:else}
						<button onclick={startAutoDemo} class="btn-start">▶️ Start Demo</button>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Preset Combinations -->
	<div class="presets-section">
		<h3>✨ Preset Combinations</h3>
		<div class="presets-grid">
			{#each irisPresets as preset}
				<button 
					class="preset-card"
					style="background: linear-gradient(135deg, {preset.color}44, {preset.color}22); border-color: {preset.color};"
					onclick={() => applyPreset(preset)}
				>
					<div class="preset-name">{preset.name}</div>
					<div class="preset-details">{preset.color} • {preset.pattern}</div>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.alice-demo {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
		min-height: 100vh;
		color: white;
	}

	h1 {
		text-align: center;
		color: #00bfff;
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		background: linear-gradient(45deg, #00BFFF, #FF69B4);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.subtitle {
		text-align: center;
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 2rem;
		font-size: 1.1rem;
	}

	.demo-grid {
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.alice-section {
		background: rgba(0, 191, 255, 0.1);
		border-radius: 20px;
		padding: 1rem;
		border: 3px solid #00BFFF;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 200px;
		box-sizing: border-box;
	}

	.alice-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 200px;
		height: 200px;
		margin: 0 auto;
		padding: 0;
		/* Force reload - Alice should be 200px */
	}

	.alice-info h3 {
		color: #00bfff;
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.info-grid {
		display: grid;
		gap: 0.5rem;
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
	}

	.label {
		font-weight: 600;
		min-width: 70px;
	}

	.value {
		font-family: monospace;
		color: #00bfff;
	}

	.color-indicator {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.controls-section {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		padding: 2rem;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.controls-section h3 {
		color: #00bfff;
		margin-bottom: 1.5rem;
		font-size: 1.3rem;
	}

	.control-group {
		margin-bottom: 1.5rem;
	}

	.control-group .control-label {
		display: block;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #00bfff;
	}

	.color-control {
		display: flex;
		gap: 0.5rem;
	}

	.color-picker {
		width: 50px;
		height: 40px;
		border: none;
		border-radius: 8px;
		cursor: pointer;
	}

	.workout-select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.4);
		color: white;
		font-family: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.workout-select:hover {
		border-color: rgba(255, 255, 255, 0.5);
		background: rgba(0, 0, 0, 0.5);
	}

	.workout-select:focus {
		outline: none;
		border-color: #00BFFF;
		box-shadow: 0 0 0 2px rgba(0, 191, 255, 0.2);
	}

	.workout-select option {
		background: #1a1a2e;
		color: white;
		padding: 0.5rem;
	}

	.color-input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.3);
		color: white;
		font-family: monospace;
	}

	.pattern-selector {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}

	.pattern-btn {
		padding: 0.75rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 12px;
		background: rgba(0, 0, 0, 0.3);
		color: white;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.pattern-btn:hover {
		border-color: #00bfff;
		background: rgba(0, 191, 255, 0.2);
	}

	.pattern-btn.active {
		border-color: #00bfff;
		background: rgba(0, 191, 255, 0.3);
		box-shadow: 0 0 15px rgba(0, 191, 255, 0.5);
	}

	.pattern-emoji {
		font-size: 1.2rem;
	}

	.pattern-name {
		font-size: 0.9rem;
		font-weight: 600;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.btn-action {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 20px;
		background: rgba(0, 191, 255, 0.8);
		color: white;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.3s ease;
		flex: 1;
	}

	.btn-action:hover {
		background: rgba(0, 191, 255, 1);
		transform: translateY(-2px);
	}

	.demo-controls {
		display: flex;
		gap: 0.5rem;
	}

	.btn-start {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 20px;
		background: #10b981;
		color: white;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-stop {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 20px;
		background: #ef4444;
		color: white;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-start:hover,
	.btn-stop:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.presets-section {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 20px;
		padding: 2rem;
		margin-top: 2rem;
	}

	.presets-section h3 {
		color: #00bfff;
		margin-bottom: 1rem;
		font-size: 1.3rem;
	}

	.presets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
	}

	.preset-card {
		padding: 1rem;
		border: 2px solid;
		border-radius: 12px;
		background: transparent;
		color: white;
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: center;
	}

	.preset-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
	}

	.preset-name {
		display: block;
		font-weight: bold;
		margin-bottom: 0.25rem;
	}

	.preset-details {
		display: block;
		font-size: 0.8rem;
		opacity: 0.8;
		font-family: monospace;
	}

	.toggle-control {
		display: flex;
		align-items: center;
	}

	.toggle-switch {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
	}

	.toggle-switch input[type="checkbox"] {
		display: none;
	}

	.toggle-slider {
		position: relative;
		width: 50px;
		height: 26px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 13px;
		transition: all 0.3s ease;
		border: 2px solid rgba(0, 191, 255, 0.3);
	}

	.toggle-slider::before {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		background: white;
		border-radius: 50%;
		transition: all 0.3s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.toggle-switch input[type="checkbox"]:checked + .toggle-slider {
		background: #00BFFF;
		border-color: #00BFFF;
	}

	.toggle-switch input[type="checkbox"]:checked + .toggle-slider::before {
		transform: translateX(24px);
	}

	.toggle-label {
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
	}


	@media (max-width: 768px) {
		.demo-grid {
			grid-template-columns: 1fr;
		}
		
		.alice-demo {
			padding: 1rem;
		}
		
		.pattern-selector {
			grid-template-columns: repeat(2, 1fr);
		}
		
		.action-buttons {
			flex-direction: column;
		}
	}
</style>
