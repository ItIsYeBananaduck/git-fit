<!--
AI Training Settings and Privacy Controls Component
Comprehensive user settings for AI training preferences, data privacy, and constitutional compliance
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { toast } from '$lib/components/ui/toast';

	export let userId: string;

	// State management
	const settingsState = writable({
		isLoading: true,
		isSaving: false,
		error: null,
		settings: null,
		hasUnsavedChanges: false
	});

	// Settings categories
	let activeTab = 'ai-training';

	// AI Training Settings
	let aiTrainingEnabled = true;
	let aiModelTypes = {
		coaching: true,
		nutrition: true,
		recovery: true,
		voice: true
	};
	let dataCollectionTypes = {
		workoutFeedback: true,
		userPreferences: true,
		goalAdjustments: true,
		voiceInteractions: true,
		biometricData: false,
		locationData: false
	};
	let trainingFrequency = 'weekly';
	let dataRetentionPeriod = '2years';

	// Voice Settings
	let voiceEnabled = true;
	let selectedVoice = 'alloy';
	let voiceSpeed = 1.0;
	let voiceVolume = 0.8;
	let voiceCachingEnabled = true;
	let voicePrivacyMode = false;

	// Privacy Settings
	let dataProcessingConsent = false;
	let thirdPartySharing = false;
	let anonymizedDataSharing = true;
	let marketingCommunications = false;
	let researchParticipation = false;

	// Constitutional Compliance Settings
	let constitutionalComplianceEnabled = true;
	let complianceProfile = 'balanced';
	let customEthicalGuidelines = '';
	let biasDetectionEnabled = true;
	let explainabilityRequired = true;

	// Advanced Settings
	let advancedMode = false;
	let debugLogging = false;
	let betaFeatures = false;
	let experimentalModels = false;

	onMount(() => {
		loadSettings();
	});

	async function loadSettings() {
		try {
			$settingsState.isLoading = true;
			$settingsState.error = null;

			const response = await fetch(`/api/user/settings?userId=${userId}`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('auth_token')}`
				}
			});

			if (!response.ok) {
				throw new Error('Failed to load settings');
			}

			const data = await response.json();
			populateSettings(data);

			settingsState.update((state) => ({
				...state,
				isLoading: false,
				settings: data,
				hasUnsavedChanges: false
			}));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			settingsState.update((state) => ({
				...state,
				isLoading: false,
				error: errorMessage
			}));
			toast.error(`Failed to load settings: ${errorMessage}`);
		}
	}

	function populateSettings(data: any) {
		// AI Training Settings
		if (data.aiTraining) {
			aiTrainingEnabled = data.aiTraining.enabled ?? true;
			aiModelTypes = { ...aiModelTypes, ...data.aiTraining.modelTypes };
			dataCollectionTypes = { ...dataCollectionTypes, ...data.aiTraining.dataCollectionTypes };
			trainingFrequency = data.aiTraining.frequency ?? 'weekly';
			dataRetentionPeriod = data.aiTraining.dataRetentionPeriod ?? '2years';
		}

		// Voice Settings
		if (data.voice) {
			voiceEnabled = data.voice.enabled ?? true;
			selectedVoice = data.voice.selectedVoice ?? 'alloy';
			voiceSpeed = data.voice.speed ?? 1.0;
			voiceVolume = data.voice.volume ?? 0.8;
			voiceCachingEnabled = data.voice.cachingEnabled ?? true;
			voicePrivacyMode = data.voice.privacyMode ?? false;
		}

		// Privacy Settings
		if (data.privacy) {
			dataProcessingConsent = data.privacy.dataProcessingConsent ?? false;
			thirdPartySharing = data.privacy.thirdPartySharing ?? false;
			anonymizedDataSharing = data.privacy.anonymizedDataSharing ?? true;
			marketingCommunications = data.privacy.marketingCommunications ?? false;
			researchParticipation = data.privacy.researchParticipation ?? false;
		}

		// Constitutional Compliance
		if (data.compliance) {
			constitutionalComplianceEnabled = data.compliance.enabled ?? true;
			complianceProfile = data.compliance.profile ?? 'balanced';
			customEthicalGuidelines = data.compliance.customGuidelines ?? '';
			biasDetectionEnabled = data.compliance.biasDetection ?? true;
			explainabilityRequired = data.compliance.explainability ?? true;
		}

		// Advanced Settings
		if (data.advanced) {
			advancedMode = data.advanced.enabled ?? false;
			debugLogging = data.advanced.debugLogging ?? false;
			betaFeatures = data.advanced.betaFeatures ?? false;
			experimentalModels = data.advanced.experimentalModels ?? false;
		}
	}

	async function saveSettings() {
		try {
			settingsState.update((state) => ({ ...state, isSaving: true, error: null }));

			const settingsData = {
				aiTraining: {
					enabled: aiTrainingEnabled,
					modelTypes: aiModelTypes,
					dataCollectionTypes: dataCollectionTypes,
					frequency: trainingFrequency,
					dataRetentionPeriod: dataRetentionPeriod
				},
				voice: {
					enabled: voiceEnabled,
					selectedVoice: selectedVoice,
					speed: voiceSpeed,
					volume: voiceVolume,
					cachingEnabled: voiceCachingEnabled,
					privacyMode: voicePrivacyMode
				},
				privacy: {
					dataProcessingConsent: dataProcessingConsent,
					thirdPartySharing: thirdPartySharing,
					anonymizedDataSharing: anonymizedDataSharing,
					marketingCommunications: marketingCommunications,
					researchParticipation: researchParticipation
				},
				compliance: {
					enabled: constitutionalComplianceEnabled,
					profile: complianceProfile,
					customGuidelines: customEthicalGuidelines,
					biasDetection: biasDetectionEnabled,
					explainability: explainabilityRequired
				},
				advanced: {
					enabled: advancedMode,
					debugLogging: debugLogging,
					betaFeatures: betaFeatures,
					experimentalModels: experimentalModels
				}
			};

			const response = await fetch(`/api/user/settings`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('auth_token')}`
				},
				body: JSON.stringify({
					userId,
					settings: settingsData
				})
			});

			if (!response.ok) {
				throw new Error('Failed to save settings');
			}

			settingsState.update((state) => ({
				...state,
				isSaving: false,
				hasUnsavedChanges: false,
				settings: settingsData
			}));

			toast.success('Settings saved successfully');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			settingsState.update((state) => ({
				...state,
				isSaving: false,
				error: errorMessage
			}));
			toast.error(`Failed to save settings: ${errorMessage}`);
		}
	}

	function markAsChanged() {
		settingsState.update((state) => ({ ...state, hasUnsavedChanges: true }));
	}

	async function resetToDefaults() {
		if (!confirm('Are you sure you want to reset all settings to their default values?')) {
			return;
		}

		// Reset to default values
		aiTrainingEnabled = true;
		aiModelTypes = { coaching: true, nutrition: true, recovery: true, voice: true };
		dataCollectionTypes = {
			workoutFeedback: true,
			userPreferences: true,
			goalAdjustments: true,
			voiceInteractions: true,
			biometricData: false,
			locationData: false
		};
		trainingFrequency = 'weekly';
		dataRetentionPeriod = '2years';

		voiceEnabled = true;
		selectedVoice = 'alloy';
		voiceSpeed = 1.0;
		voiceVolume = 0.8;
		voiceCachingEnabled = true;
		voicePrivacyMode = false;

		dataProcessingConsent = false;
		thirdPartySharing = false;
		anonymizedDataSharing = true;
		marketingCommunications = false;
		researchParticipation = false;

		constitutionalComplianceEnabled = true;
		complianceProfile = 'balanced';
		customEthicalGuidelines = '';
		biasDetectionEnabled = true;
		explainabilityRequired = true;

		advancedMode = false;
		debugLogging = false;
		betaFeatures = false;
		experimentalModels = false;

		markAsChanged();
		toast.info('Settings reset to defaults');
	}

	async function exportData() {
		try {
			const response = await fetch(`/api/user/data-export?userId=${userId}`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('auth_token')}`
				}
			});

			if (!response.ok) {
				throw new Error('Failed to export data');
			}

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `ai-training-data-${userId}-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toast.success('Data export completed');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			toast.error(`Failed to export data: ${errorMessage}`);
		}
	}

	async function deleteAllData() {
		const confirmation = prompt(
			'WARNING: This will permanently delete all your AI training data. Type "DELETE ALL DATA" to confirm:'
		);

		if (confirmation !== 'DELETE ALL DATA') {
			return;
		}

		try {
			const response = await fetch(`/api/user/data?userId=${userId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${localStorage.getItem('auth_token')}`
				}
			});

			if (!response.ok) {
				throw new Error('Failed to delete data');
			}

			toast.success('All AI training data has been deleted');
			// Reload the page or redirect as needed
			window.location.reload();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			toast.error(`Failed to delete data: ${errorMessage}`);
		}
	}

	function testVoice() {
		if (voiceEnabled) {
			// This would integrate with the VoiceSynthesis component
			const testText = 'This is a test of your voice settings. How does this sound?';
			// Implement voice synthesis test
			toast.info('Voice test started');
		} else {
			toast.warning('Voice is disabled');
		}
	}

	// Available voice options
	const voiceOptions = [
		{ value: 'alloy', label: 'Alloy (Neutral)' },
		{ value: 'echo', label: 'Echo (Energetic)' },
		{ value: 'fable', label: 'Fable (Warm)' },
		{ value: 'onyx', label: 'Onyx (Deep)' },
		{ value: 'nova', label: 'Nova (Bright)' },
		{ value: 'shimmer', label: 'Shimmer (Soft)' }
	];

	// Compliance profile options
	const complianceProfiles = [
		{ value: 'strict', label: 'Strict - Maximum privacy and ethics compliance' },
		{ value: 'balanced', label: 'Balanced - Standard privacy with AI enhancement' },
		{ value: 'performance', label: 'Performance - Optimized for AI accuracy' },
		{ value: 'custom', label: 'Custom - Define your own guidelines' }
	];
</script>

<div class="ai-settings-container">
	<!-- Settings Header -->
	<div class="settings-header">
		<h2>AI Training Settings</h2>
		<div class="header-actions">
			{#if $settingsState.hasUnsavedChanges}
				<button class="action-button secondary" on:click={loadSettings}> Cancel Changes </button>
				<button
					class="action-button primary"
					on:click={saveSettings}
					disabled={$settingsState.isSaving}
				>
					{$settingsState.isSaving ? 'Saving...' : 'Save Changes'}
				</button>
			{/if}
		</div>
	</div>

	{#if $settingsState.isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<p>Loading settings...</p>
		</div>
	{:else if $settingsState.error}
		<div class="error-container">
			<svg viewBox="0 0 24 24" fill="currentColor" class="error-icon">
				<circle cx="12" cy="12" r="10" />
				<line x1="15" y1="9" x2="9" y2="15" />
				<line x1="9" y1="9" x2="15" y2="15" />
			</svg>
			<p>{$settingsState.error}</p>
			<button class="retry-button" on:click={loadSettings}>Try Again</button>
		</div>
	{:else}
		<!-- Settings Navigation -->
		<div class="settings-nav">
			<button
				class="nav-tab {activeTab === 'ai-training' ? 'active' : ''}"
				on:click={() => (activeTab = 'ai-training')}
			>
				<svg viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
					/>
				</svg>
				AI Training
			</button>
			<button
				class="nav-tab {activeTab === 'voice' ? 'active' : ''}"
				on:click={() => (activeTab = 'voice')}
			>
				<svg viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M12 1c-4.6 0-8 3.4-8 8v7c0 1.1.9 2 2 2h1.3c1.1 0 1.7-.9 1.7-2v-4c0-1.1-.6-2-1.7-2H6V9c0-3.3 2.7-6 6-6s6 2.7 6 6v2h-1.3c-1.1 0-1.7.9-1.7 2v4c0 1.1.6 2 1.7 2H18c1.1 0 2-.9 2-2V9c0-4.6-3.4-8-8-8z"
					/>
				</svg>
				Voice
			</button>
			<button
				class="nav-tab {activeTab === 'privacy' ? 'active' : ''}"
				on:click={() => (activeTab = 'privacy')}
			>
				<svg viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16V18H8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z"
					/>
				</svg>
				Privacy
			</button>
			<button
				class="nav-tab {activeTab === 'compliance' ? 'active' : ''}"
				on:click={() => (activeTab = 'compliance')}
			>
				<svg viewBox="0 0 24 24" fill="currentColor">
					<path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
				</svg>
				Compliance
			</button>
			<button
				class="nav-tab {activeTab === 'advanced' ? 'active' : ''}"
				on:click={() => (activeTab = 'advanced')}
			>
				<svg viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.62L12.75,4H11.25Z"
					/>
				</svg>
				Advanced
			</button>
		</div>

		<!-- Settings Content -->
		<div class="settings-content">
			{#if activeTab === 'ai-training'}
				<div class="settings-section">
					<h3>AI Training Preferences</h3>

					<div class="setting-group">
						<div class="setting-item">
							<div class="setting-header">
								<label class="toggle-label">
									<input
										type="checkbox"
										bind:checked={aiTrainingEnabled}
										on:change={markAsChanged}
										class="toggle-input"
									/>
									<span class="toggle-slider"></span>
									Enable AI Training
								</label>
							</div>
							<p class="setting-description">
								Allow the system to train personalized AI models based on your workout data and
								preferences.
							</p>
						</div>
					</div>

					<div class="setting-group">
						<h4>AI Model Types</h4>
						<div class="checkbox-grid">
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={aiModelTypes.coaching}
									on:change={markAsChanged}
									disabled={!aiTrainingEnabled}
								/>
								<span class="checkbox-text">Coaching AI</span>
								<p class="checkbox-description">
									Personalized workout guidance and form corrections
								</p>
							</label>
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={aiModelTypes.nutrition}
									on:change={markAsChanged}
									disabled={!aiTrainingEnabled}
								/>
								<span class="checkbox-text">Nutrition AI</span>
								<p class="checkbox-description">Meal planning and dietary recommendations</p>
							</label>
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={aiModelTypes.recovery}
									on:change={markAsChanged}
									disabled={!aiTrainingEnabled}
								/>
								<span class="checkbox-text">Recovery AI</span>
								<p class="checkbox-description">Sleep and recovery optimization</p>
							</label>
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={aiModelTypes.voice}
									on:change={markAsChanged}
									disabled={!aiTrainingEnabled}
								/>
								<span class="checkbox-text">Voice AI</span>
								<p class="checkbox-description">Natural voice interactions and commands</p>
							</label>
						</div>
					</div>

					<div class="setting-group">
						<h4>Data Collection Types</h4>
						<div class="checkbox-grid">
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={dataCollectionTypes.workoutFeedback}
									on:change={markAsChanged}
									disabled={!aiTrainingEnabled}
								/>
								<span class="checkbox-text">Workout Feedback</span>
								<p class="checkbox-description">Exercise performance and difficulty ratings</p>
							</label>
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={dataCollectionTypes.userPreferences}
									on:change={markAsChanged}
									disabled={!aiTrainingEnabled}
								/>
								<span class="checkbox-text">User Preferences</span>
								<p class="checkbox-description">Exercise preferences and goal adjustments</p>
							</label>
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={dataCollectionTypes.goalAdjustments}
									on:change={markAsChanged}
									disabled={!aiTrainingEnabled}
								/>
								<span class="checkbox-text">Goal Adjustments</span>
								<p class="checkbox-description">Changes to fitness goals and targets</p>
							</label>
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={dataCollectionTypes.voiceInteractions}
									on:change={markAsChanged}
									disabled={!aiTrainingEnabled}
								/>
								<span class="checkbox-text">Voice Interactions</span>
								<p class="checkbox-description">Voice commands and conversation patterns</p>
							</label>
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={dataCollectionTypes.biometricData}
									on:change={markAsChanged}
									disabled={!aiTrainingEnabled}
								/>
								<span class="checkbox-text">Biometric Data</span>
								<p class="checkbox-description">Heart rate, sleep, and health metrics</p>
							</label>
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={dataCollectionTypes.locationData}
									on:change={markAsChanged}
									disabled={!aiTrainingEnabled}
								/>
								<span class="checkbox-text">Location Data</span>
								<p class="checkbox-description">Workout locations and movement patterns</p>
							</label>
						</div>
					</div>

					<div class="setting-group">
						<h4>Training Schedule</h4>
						<div class="select-group">
							<label for="training-frequency">Training Frequency:</label>
							<select
								id="training-frequency"
								bind:value={trainingFrequency}
								on:change={markAsChanged}
								disabled={!aiTrainingEnabled}
								class="setting-select"
							>
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
								<option value="manual">Manual Only</option>
							</select>
						</div>
						<div class="select-group">
							<label for="data-retention">Data Retention Period:</label>
							<select
								id="data-retention"
								bind:value={dataRetentionPeriod}
								on:change={markAsChanged}
								disabled={!aiTrainingEnabled}
								class="setting-select"
							>
								<option value="6months">6 Months</option>
								<option value="1year">1 Year</option>
								<option value="2years">2 Years</option>
								<option value="5years">5 Years</option>
								<option value="indefinite">Indefinite</option>
							</select>
						</div>
					</div>
				</div>
			{:else if activeTab === 'voice'}
				<div class="settings-section">
					<h3>Voice Settings</h3>

					<div class="setting-group">
						<div class="setting-item">
							<div class="setting-header">
								<label class="toggle-label">
									<input
										type="checkbox"
										bind:checked={voiceEnabled}
										on:change={markAsChanged}
										class="toggle-input"
									/>
									<span class="toggle-slider"></span>
									Enable Voice Features
								</label>
							</div>
							<p class="setting-description">
								Enable voice synthesis, commands, and audio feedback during workouts.
							</p>
						</div>
					</div>

					<div class="setting-group">
						<h4>Voice Selection</h4>
						<div class="voice-grid">
							{#each voiceOptions as voice}
								<label class="voice-option">
									<input
										type="radio"
										bind:group={selectedVoice}
										value={voice.value}
										on:change={markAsChanged}
										disabled={!voiceEnabled}
									/>
									<span class="voice-name">{voice.label}</span>
								</label>
							{/each}
						</div>
						<button class="test-voice-button" on:click={testVoice} disabled={!voiceEnabled}>
							Test Voice
						</button>
					</div>

					<div class="setting-group">
						<h4>Voice Parameters</h4>
						<div class="slider-group">
							<label for="voice-speed">Speed: {voiceSpeed.toFixed(1)}x</label>
							<input
								id="voice-speed"
								type="range"
								min="0.5"
								max="2.0"
								step="0.1"
								bind:value={voiceSpeed}
								on:input={markAsChanged}
								disabled={!voiceEnabled}
								class="setting-slider"
							/>
						</div>
						<div class="slider-group">
							<label for="voice-volume">Volume: {Math.round(voiceVolume * 100)}%</label>
							<input
								id="voice-volume"
								type="range"
								min="0"
								max="1"
								step="0.05"
								bind:value={voiceVolume}
								on:input={markAsChanged}
								disabled={!voiceEnabled}
								class="setting-slider"
							/>
						</div>
					</div>

					<div class="setting-group">
						<h4>Voice Privacy</h4>
						<div class="setting-item">
							<label class="toggle-label">
								<input
									type="checkbox"
									bind:checked={voiceCachingEnabled}
									on:change={markAsChanged}
									disabled={!voiceEnabled}
									class="toggle-input"
								/>
								<span class="toggle-slider"></span>
								Enable Voice Caching
							</label>
							<p class="setting-description">
								Cache synthesized audio locally for faster playback and reduced API costs.
							</p>
						</div>
						<div class="setting-item">
							<label class="toggle-label">
								<input
									type="checkbox"
									bind:checked={voicePrivacyMode}
									on:change={markAsChanged}
									disabled={!voiceEnabled}
									class="toggle-input"
								/>
								<span class="toggle-slider"></span>
								Voice Privacy Mode
							</label>
							<p class="setting-description">
								Disable voice data collection and use only local voice processing when possible.
							</p>
						</div>
					</div>
				</div>
			{:else if activeTab === 'privacy'}
				<div class="settings-section">
					<h3>Privacy & Data Control</h3>

					<div class="setting-group">
						<h4>Data Processing Consent</h4>
						<div class="setting-item">
							<label class="toggle-label required">
								<input
									type="checkbox"
									bind:checked={dataProcessingConsent}
									on:change={markAsChanged}
									class="toggle-input"
								/>
								<span class="toggle-slider"></span>
								I consent to AI training data processing
							</label>
							<p class="setting-description required">
								Required for AI features. Your data is processed according to our privacy policy and
								constitutional AI principles.
							</p>
						</div>
					</div>

					<div class="setting-group">
						<h4>Data Sharing Preferences</h4>
						<div class="setting-item">
							<label class="toggle-label">
								<input
									type="checkbox"
									bind:checked={thirdPartySharing}
									on:change={markAsChanged}
									class="toggle-input"
								/>
								<span class="toggle-slider"></span>
								Allow third-party data sharing
							</label>
							<p class="setting-description">
								Share data with trusted fitness and health partners for enhanced features.
							</p>
						</div>
						<div class="setting-item">
							<label class="toggle-label">
								<input
									type="checkbox"
									bind:checked={anonymizedDataSharing}
									on:change={markAsChanged}
									class="toggle-input"
								/>
								<span class="toggle-slider"></span>
								Allow anonymized data for research
							</label>
							<p class="setting-description">
								Help improve fitness AI by contributing anonymized workout patterns and outcomes.
							</p>
						</div>
					</div>

					<div class="setting-group">
						<h4>Communications</h4>
						<div class="setting-item">
							<label class="toggle-label">
								<input
									type="checkbox"
									bind:checked={marketingCommunications}
									on:change={markAsChanged}
									class="toggle-input"
								/>
								<span class="toggle-slider"></span>
								Marketing communications
							</label>
							<p class="setting-description">
								Receive personalized fitness tips, product updates, and special offers.
							</p>
						</div>
						<div class="setting-item">
							<label class="toggle-label">
								<input
									type="checkbox"
									bind:checked={researchParticipation}
									on:change={markAsChanged}
									class="toggle-input"
								/>
								<span class="toggle-slider"></span>
								Research participation
							</label>
							<p class="setting-description">
								Participate in fitness research studies and contribute to scientific knowledge.
							</p>
						</div>
					</div>

					<div class="setting-group">
						<h4>Data Management</h4>
						<div class="data-actions">
							<button class="data-action-button export" on:click={exportData}>
								<svg viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
									/>
								</svg>
								Export My Data
							</button>
							<button class="data-action-button delete" on:click={deleteAllData}>
								<svg viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
									/>
								</svg>
								Delete All Data
							</button>
						</div>
					</div>
				</div>
			{:else if activeTab === 'compliance'}
				<div class="settings-section">
					<h3>Constitutional AI Compliance</h3>

					<div class="setting-group">
						<div class="setting-item">
							<label class="toggle-label">
								<input
									type="checkbox"
									bind:checked={constitutionalComplianceEnabled}
									on:change={markAsChanged}
									class="toggle-input"
								/>
								<span class="toggle-slider"></span>
								Enable Constitutional AI Compliance
							</label>
							<p class="setting-description">
								Ensure AI training and inference follows constitutional AI principles for safety and
								ethics.
							</p>
						</div>
					</div>

					<div class="setting-group">
						<h4>Compliance Profile</h4>
						<div class="compliance-profiles">
							{#each complianceProfiles as profile}
								<label class="compliance-option">
									<input
										type="radio"
										bind:group={complianceProfile}
										value={profile.value}
										on:change={markAsChanged}
										disabled={!constitutionalComplianceEnabled}
									/>
									<span class="compliance-content">
										<span class="compliance-name">{profile.label}</span>
									</span>
								</label>
							{/each}
						</div>
					</div>

					{#if complianceProfile === 'custom'}
						<div class="setting-group">
							<h4>Custom Ethical Guidelines</h4>
							<textarea
								bind:value={customEthicalGuidelines}
								on:input={markAsChanged}
								disabled={!constitutionalComplianceEnabled}
								placeholder="Define your custom ethical guidelines for AI training and inference..."
								class="custom-guidelines-textarea"
								rows="6"
							></textarea>
						</div>
					{/if}

					<div class="setting-group">
						<h4>Additional Safeguards</h4>
						<div class="setting-item">
							<label class="toggle-label">
								<input
									type="checkbox"
									bind:checked={biasDetectionEnabled}
									on:change={markAsChanged}
									disabled={!constitutionalComplianceEnabled}
									class="toggle-input"
								/>
								<span class="toggle-slider"></span>
								Enable bias detection
							</label>
							<p class="setting-description">
								Automatically detect and correct potential biases in AI recommendations.
							</p>
						</div>
						<div class="setting-item">
							<label class="toggle-label">
								<input
									type="checkbox"
									bind:checked={explainabilityRequired}
									on:change={markAsChanged}
									disabled={!constitutionalComplianceEnabled}
									class="toggle-input"
								/>
								<span class="toggle-slider"></span>
								Require AI explainability
							</label>
							<p class="setting-description">
								Always provide explanations for AI recommendations and decisions.
							</p>
						</div>
					</div>
				</div>
			{:else if activeTab === 'advanced'}
				<div class="settings-section">
					<h3>Advanced Settings</h3>

					<div class="setting-group">
						<div class="setting-item">
							<label class="toggle-label">
								<input
									type="checkbox"
									bind:checked={advancedMode}
									on:change={markAsChanged}
									class="toggle-input"
								/>
								<span class="toggle-slider"></span>
								Enable Advanced Mode
							</label>
							<p class="setting-description">
								Access experimental features, detailed logging, and advanced AI configuration
								options.
							</p>
						</div>
					</div>

					<div class="setting-group">
						<h4>Development Features</h4>
						<div class="setting-item">
							<label class="toggle-label">
								<input
									type="checkbox"
									bind:checked={debugLogging}
									on:change={markAsChanged}
									disabled={!advancedMode}
									class="toggle-input"
								/>
								<span class="toggle-slider"></span>
								Debug logging
							</label>
							<p class="setting-description">
								Enable detailed logging for troubleshooting and performance analysis.
							</p>
						</div>
						<div class="setting-item">
							<label class="toggle-label">
								<input
									type="checkbox"
									bind:checked={betaFeatures}
									on:change={markAsChanged}
									disabled={!advancedMode}
									class="toggle-input"
								/>
								<span class="toggle-slider"></span>
								Beta features
							</label>
							<p class="setting-description">
								Access new features before they're released to all users.
							</p>
						</div>
						<div class="setting-item">
							<label class="toggle-label">
								<input
									type="checkbox"
									bind:checked={experimentalModels}
									on:change={markAsChanged}
									disabled={!advancedMode}
									class="toggle-input"
								/>
								<span class="toggle-slider"></span>
								Experimental AI models
							</label>
							<p class="setting-description">
								Use cutting-edge AI models that may be less stable but offer enhanced capabilities.
							</p>
						</div>
					</div>

					<div class="setting-group">
						<h4>System Actions</h4>
						<div class="system-actions">
							<button class="system-action-button" on:click={resetToDefaults}>
								<svg viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M12,4C14.1,4.1 15.9,5.1 17.1,6.7L15.5,8.3C14.6,7.2 13.4,6.5 12,6.5C9.5,6.5 7.5,8.5 7.5,11S9.5,15.5 12,15.5C13.4,15.5 14.6,14.8 15.5,13.7L17.1,15.3C15.9,16.9 14.1,17.9 12,18C8.1,18 5,14.9 5,11S8.1,4 12,4M19,13H15L19,9V13Z"
									/>
								</svg>
								Reset to Defaults
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.ai-settings-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 24px;
		background: #f8fafc;
		min-height: 100vh;
	}

	.settings-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
		background: white;
		padding: 24px;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.settings-header h2 {
		margin: 0;
		font-size: 28px;
		font-weight: 700;
		color: #1f2937;
	}

	.header-actions {
		display: flex;
		gap: 12px;
	}

	.action-button {
		padding: 10px 16px;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 14px;
		font-weight: 500;
	}

	.action-button.primary {
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
		color: white;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
	}

	.action-button.primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.action-button.primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.action-button.secondary {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.action-button.secondary:hover {
		background: #e5e7eb;
	}

	.loading-container,
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		background: white;
		border-radius: 12px;
		color: #6b7280;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 16px;
	}

	.error-icon {
		width: 48px;
		height: 48px;
		color: #ef4444;
		margin-bottom: 16px;
	}

	.retry-button {
		padding: 8px 16px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		margin-top: 12px;
	}

	.settings-nav {
		display: flex;
		background: white;
		border-radius: 12px;
		padding: 4px;
		margin-bottom: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		overflow-x: auto;
	}

	.nav-tab {
		flex: 1;
		padding: 12px 16px;
		border: none;
		background: transparent;
		color: #6b7280;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 500;
		min-width: fit-content;
	}

	.nav-tab svg {
		width: 16px;
		height: 16px;
	}

	.nav-tab:hover {
		background: #f3f4f6;
		color: #374151;
	}

	.nav-tab.active {
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
		color: white;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
	}

	.settings-content {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.settings-section h3 {
		margin: 0 0 24px 0;
		font-size: 20px;
		font-weight: 600;
		color: #1f2937;
	}

	.setting-group {
		margin-bottom: 32px;
	}

	.setting-group h4 {
		margin: 0 0 16px 0;
		font-size: 16px;
		font-weight: 600;
		color: #374151;
	}

	.setting-item {
		margin-bottom: 20px;
	}

	.setting-header {
		margin-bottom: 8px;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 12px;
		cursor: pointer;
		font-size: 16px;
		font-weight: 500;
		color: #1f2937;
	}

	.toggle-label.required {
		color: #dc2626;
	}

	.toggle-input {
		display: none;
	}

	.toggle-slider {
		width: 44px;
		height: 24px;
		background: #d1d5db;
		border-radius: 12px;
		position: relative;
		transition: all 0.2s ease;
	}

	.toggle-slider::before {
		content: '';
		position: absolute;
		width: 20px;
		height: 20px;
		background: white;
		border-radius: 50%;
		top: 2px;
		left: 2px;
		transition: all 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.toggle-input:checked + .toggle-slider {
		background: #3b82f6;
	}

	.toggle-input:checked + .toggle-slider::before {
		transform: translateX(20px);
	}

	.toggle-input:disabled + .toggle-slider {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.setting-description {
		margin: 0;
		font-size: 14px;
		color: #6b7280;
		line-height: 1.5;
	}

	.setting-description.required {
		color: #dc2626;
		font-weight: 500;
	}

	.checkbox-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 16px;
	}

	.checkbox-label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 16px;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.checkbox-label:hover {
		border-color: #3b82f6;
		background: #f8fafc;
	}

	.checkbox-label input {
		margin-right: 8px;
	}

	.checkbox-text {
		font-weight: 500;
		color: #1f2937;
	}

	.checkbox-description {
		font-size: 12px;
		color: #6b7280;
		margin: 0;
	}

	.select-group {
		margin-bottom: 16px;
	}

	.select-group label {
		display: block;
		margin-bottom: 6px;
		font-size: 14px;
		font-weight: 500;
		color: #374151;
	}

	.setting-select {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: white;
		font-size: 14px;
		cursor: pointer;
	}

	.setting-select:focus {
		outline: none;
		border-color: #3b82f6;
	}

	.setting-select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.voice-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
		margin-bottom: 16px;
	}

	.voice-option {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.voice-option:hover {
		border-color: #3b82f6;
		background: #f8fafc;
	}

	.voice-option input:checked + .voice-name {
		font-weight: 600;
		color: #3b82f6;
	}

	.voice-name {
		font-size: 14px;
		color: #374151;
	}

	.test-voice-button {
		padding: 8px 16px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
	}

	.test-voice-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.slider-group {
		margin-bottom: 16px;
	}

	.slider-group label {
		display: block;
		margin-bottom: 8px;
		font-size: 14px;
		font-weight: 500;
		color: #374151;
	}

	.setting-slider {
		width: 100%;
		height: 6px;
		background: #e5e7eb;
		border-radius: 3px;
		outline: none;
		cursor: pointer;
	}

	.setting-slider::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		background: #3b82f6;
		border-radius: 50%;
		cursor: pointer;
	}

	.setting-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		background: #3b82f6;
		border-radius: 50%;
		cursor: pointer;
		border: none;
	}

	.setting-slider:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.compliance-profiles {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.compliance-option {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.compliance-option:hover {
		border-color: #3b82f6;
		background: #f8fafc;
	}

	.compliance-content {
		flex: 1;
	}

	.compliance-name {
		font-weight: 500;
		color: #1f2937;
	}

	.custom-guidelines-textarea {
		width: 100%;
		padding: 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		font-family: inherit;
		resize: vertical;
		min-height: 120px;
	}

	.custom-guidelines-textarea:focus {
		outline: none;
		border-color: #3b82f6;
	}

	.custom-guidelines-textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.data-actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.data-action-button {
		padding: 10px 16px;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 500;
	}

	.data-action-button svg {
		width: 16px;
		height: 16px;
	}

	.data-action-button.export {
		background: #059669;
		color: white;
	}

	.data-action-button.export:hover {
		background: #047857;
	}

	.data-action-button.delete {
		background: #dc2626;
		color: white;
	}

	.data-action-button.delete:hover {
		background: #b91c1c;
	}

	.system-actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.system-action-button {
		padding: 10px 16px;
		background: #f59e0b;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 500;
	}

	.system-action-button svg {
		width: 16px;
		height: 16px;
	}

	.system-action-button:hover {
		background: #d97706;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.ai-settings-container {
			padding: 16px;
		}

		.settings-header {
			flex-direction: column;
			align-items: stretch;
			gap: 16px;
		}

		.settings-nav {
			flex-direction: column;
		}

		.nav-tab {
			justify-content: center;
		}

		.checkbox-grid {
			grid-template-columns: 1fr;
		}

		.voice-grid {
			grid-template-columns: 1fr;
		}

		.data-actions,
		.system-actions {
			flex-direction: column;
		}
	}
</style>
