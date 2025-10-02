<!--
Voice Synthesis Component
Text-to-speech with ElevenLabs integration and voice selection
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { toast } from '$lib/components/ui/toast';
  import VoicePlayer from './VoicePlayer.svelte';
  import type { VoiceSynthesisState, VoicePreference } from '$lib/types/voice';

  export let userId: string;
  export let text: string = '';
  export let placeholder: string = 'Enter text to synthesize...';
  export let maxLength: number = 1000;
  export let showCharacterCount: boolean = true;
  export let autoPlay: boolean = false;

  // State management
  const synthesisState = writable<VoiceSynthesisState>({
    isLoading: false,
    isSynthesizing: false,
    error: null,
    audioUrl: null,
    cost: 0,
    characterCount: 0,
    cached: false,
  });

  // Voice preferences
  let availableVoices: any[] = [];
  let userVoicePreferences: VoicePreference[] = [];
  let selectedVoiceId: string = '';
  let voiceSettings = {
    stability: 0.8,
    similarityBoost: 0.8,
    style: 0.0,
    useSpeakerBoost: true,
  };

  // UI state
  let isVoiceSettingsOpen = false;
  let showAdvancedSettings = false;

  onMount(() => {
    loadAvailableVoices();
    loadUserVoicePreferences();
  });

  async function loadAvailableVoices() {
    try {
      const response = await fetch('/api/voice/available-voices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        availableVoices = await response.json();
      }
    } catch (error) {
      console.error('Failed to load available voices:', error);
    }
  }

  async function loadUserVoicePreferences() {
    try {
      const response = await fetch(`/api/voice/preferences/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        userVoicePreferences = await response.json();
        
        // Set default voice
        const defaultVoice = userVoicePreferences.find(pref => pref.isDefault);
        if (defaultVoice) {
          selectedVoiceId = defaultVoice.voiceId;
          if (defaultVoice.settings) {
            voiceSettings = { ...voiceSettings, ...defaultVoice.settings };
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user voice preferences:', error);
    }
  }

  async function synthesizeVoice() {
    if (!text.trim()) {
      toast.error('Please enter some text to synthesize');
      return;
    }

    if (text.length > maxLength) {
      toast.error(`Text is too long. Maximum ${maxLength} characters allowed.`);
      return;
    }

    synthesisState.update(state => ({
      ...state,
      isSynthesizing: true,
      error: null,
      audioUrl: null,
    }));

    try {
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          userId,
          text,
          voiceId: selectedVoiceId,
          settings: voiceSettings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Synthesis failed');
      }

      const result = await response.json();

      synthesisState.update(state => ({
        ...state,
        isSynthesizing: false,
        audioUrl: result.audioUrl,
        cost: result.cost || 0,
        characterCount: result.characterCount || text.length,
        cached: result.cached || false,
      }));

      if (result.cached) {
        toast.success('Audio retrieved from cache');
      } else {
        toast.success(`Voice synthesized successfully. Cost: $${result.cost?.toFixed(4) || '0.0000'}`);
      }

      // Auto-play if enabled
      if (autoPlay && result.audioUrl) {
        // The VoicePlayer component will handle auto-play
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      synthesisState.update(state => ({
        ...state,
        isSynthesizing: false,
        error: errorMessage,
      }));
      toast.error(`Synthesis failed: ${errorMessage}`);
    }
  }

  async function createVoiceClone() {
    // This would open a voice cloning dialog
    // For now, just show a placeholder message
    toast.info('Voice cloning feature coming soon!');
  }

  function handleVoiceChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    selectedVoiceId = select.value;

    // Load voice-specific settings if available
    const voicePreference = userVoicePreferences.find(pref => pref.voiceId === selectedVoiceId);
    if (voicePreference?.settings) {
      voiceSettings = { ...voiceSettings, ...voicePreference.settings };
    }
  }

  function calculateEstimatedCost(textLength: number): number {
    // ElevenLabs pricing: approximately $0.30 per 1000 characters
    return (textLength / 1000) * 0.30;
  }

  function resetSettings() {
    voiceSettings = {
      stability: 0.8,
      similarityBoost: 0.8,
      style: 0.0,
      useSpeakerBoost: true,
    };
  }

  // Reactive declarations
  $: estimatedCost = calculateEstimatedCost(text.length);
  $: charactersRemaining = maxLength - text.length;
  $: isTextValid = text.trim().length > 0 && text.length <= maxLength;
</script>

<div class="voice-synthesis">
  <div class="synthesis-header">
    <h3>Voice Synthesis</h3>
    <div class="header-actions">
      <button
        class="settings-button"
        class:active={isVoiceSettingsOpen}
        on:click={() => isVoiceSettingsOpen = !isVoiceSettingsOpen}
        aria-label="Voice settings"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Text Input -->
  <div class="text-input-container">
    <div class="input-header">
      <label for="synthesis-text">Text to synthesize</label>
      {#if showCharacterCount}
        <div class="character-count" class:warning={charactersRemaining < 100} class:error={charactersRemaining < 0}>
          {text.length} / {maxLength}
        </div>
      {/if}
    </div>
    
    <textarea
      id="synthesis-text"
      bind:value={text}
      {placeholder}
      maxlength={maxLength}
      class="text-input"
      class:error={!isTextValid && text.length > 0}
      rows="4"
    ></textarea>

    {#if estimatedCost > 0}
      <div class="cost-estimate">
        Estimated cost: ${estimatedCost.toFixed(4)}
        {#if $synthesisState.cached}
          <span class="cached-note">(Previous synthesis cached)</span>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Voice Selection -->
  <div class="voice-selection">
    <label for="voice-select">Voice</label>
    <div class="voice-input-group">
      <select
        id="voice-select"
        bind:value={selectedVoiceId}
        on:change={handleVoiceChange}
        class="voice-select"
      >
        <option value="">Select a voice...</option>
        
        <!-- User's custom voices -->
        {#if userVoicePreferences.length > 0}
          <optgroup label="Your Voices">
            {#each userVoicePreferences as pref}
              <option value={pref.voiceId}>
                {pref.voiceName} {pref.isDefault ? '(Default)' : ''}
              </option>
            {/each}
          </optgroup>
        {/if}

        <!-- Available voices -->
        {#if availableVoices.length > 0}
          <optgroup label="Available Voices">
            {#each availableVoices as voice}
              <option value={voice.voiceId}>
                {voice.name} ({voice.category})
              </option>
            {/each}
          </optgroup>
        {/if}
      </select>

      <button
        class="clone-voice-button"
        on:click={createVoiceClone}
        title="Create custom voice clone"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
        </svg>
        Clone Voice
      </button>
    </div>
  </div>

  <!-- Voice Settings Panel -->
  {#if isVoiceSettingsOpen}
    <div class="voice-settings-panel">
      <div class="settings-header">
        <h4>Voice Settings</h4>
        <div class="settings-actions">
          <button class="text-button" on:click={() => showAdvancedSettings = !showAdvancedSettings}>
            {showAdvancedSettings ? 'Hide' : 'Show'} Advanced
          </button>
          <button class="text-button" on:click={resetSettings}>Reset</button>
        </div>
      </div>

      <div class="settings-grid">
        <!-- Stability -->
        <div class="setting-item">
          <label for="stability">
            Stability
            <span class="setting-value">{voiceSettings.stability}</span>
          </label>
          <input
            id="stability"
            type="range"
            min="0"
            max="1"
            step="0.1"
            bind:value={voiceSettings.stability}
            class="setting-slider"
          />
          <div class="setting-description">
            Higher values make the voice more stable and consistent
          </div>
        </div>

        <!-- Similarity Boost -->
        <div class="setting-item">
          <label for="similarity">
            Similarity Boost
            <span class="setting-value">{voiceSettings.similarityBoost}</span>
          </label>
          <input
            id="similarity"
            type="range"
            min="0"
            max="1"
            step="0.1"
            bind:value={voiceSettings.similarityBoost}
            class="setting-slider"
          />
          <div class="setting-description">
            Enhances similarity to the original voice
          </div>
        </div>

        {#if showAdvancedSettings}
          <!-- Style -->
          <div class="setting-item">
            <label for="style">
              Style
              <span class="setting-value">{voiceSettings.style}</span>
            </label>
            <input
              id="style"
              type="range"
              min="0"
              max="1"
              step="0.1"
              bind:value={voiceSettings.style}
              class="setting-slider"
            />
            <div class="setting-description">
              Adjust the stylistic expression of the voice
            </div>
          </div>

          <!-- Speaker Boost -->
          <div class="setting-item checkbox">
            <label class="checkbox-label">
              <input
                type="checkbox"
                bind:checked={voiceSettings.useSpeakerBoost}
                class="setting-checkbox"
              />
              <span class="checkmark"></span>
              Use Speaker Boost
            </label>
            <div class="setting-description">
              Enhance clarity and pronunciation
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Action Button -->
  <div class="action-container">
    <button
      class="synthesize-button"
      class:loading={$synthesisState.isSynthesizing}
      disabled={!isTextValid || $synthesisState.isSynthesizing}
      on:click={synthesizeVoice}
    >
      {#if $synthesisState.isSynthesizing}
        <div class="loading-spinner"></div>
        Synthesizing...
      {:else}
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
        Generate Voice
      {/if}
    </button>
  </div>

  <!-- Audio Player -->
  {#if $synthesisState.audioUrl}
    <div class="player-container">
      <VoicePlayer
        audioUrl={$synthesisState.audioUrl}
        config={{
          showWaveform: true,
          showControls: true,
          autoPlay: autoPlay,
          waveformColor: '#3b82f6',
          progressColor: '#1d4ed8',
        }}
        on:playback-start={() => console.log('Playback started')}
        on:playback-end={() => console.log('Playback ended')}
        on:playback-error={(event) => console.error('Playback error:', event.detail)}
      />

      {#if $synthesisState.cost > 0}
        <div class="synthesis-info">
          <div class="info-item">
            <span class="label">Cost:</span>
            <span class="value">${$synthesisState.cost.toFixed(4)}</span>
          </div>
          <div class="info-item">
            <span class="label">Characters:</span>
            <span class="value">{$synthesisState.characterCount}</span>
          </div>
          {#if $synthesisState.cached}
            <div class="info-item">
              <span class="label">Source:</span>
              <span class="value cached">Cached</span>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Error Display -->
  {#if $synthesisState.error}
    <div class="error-message">
      <svg viewBox="0 0 24 24" fill="currentColor" class="error-icon">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      {$synthesisState.error}
    </div>
  {/if}
</div>

<style>
  .voice-synthesis {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
  }

  .synthesis-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .synthesis-header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .settings-button {
    width: 36px;
    height: 36px;
    border: none;
    background: #f3f4f6;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
  }

  .settings-button:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .settings-button.active {
    background: #3b82f6;
    color: white;
  }

  .settings-button svg {
    width: 18px;
    height: 18px;
  }

  .text-input-container {
    margin-bottom: 20px;
  }

  .input-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .input-header label {
    font-weight: 500;
    color: #374151;
  }

  .character-count {
    font-size: 14px;
    color: #6b7280;
  }

  .character-count.warning {
    color: #f59e0b;
  }

  .character-count.error {
    color: #ef4444;
  }

  .text-input {
    width: 100%;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s ease;
    resize: vertical;
    min-height: 100px;
  }

  .text-input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .text-input.error {
    border-color: #ef4444;
  }

  .cost-estimate {
    margin-top: 8px;
    font-size: 12px;
    color: #6b7280;
  }

  .cached-note {
    color: #059669;
    font-weight: 500;
  }

  .voice-selection {
    margin-bottom: 20px;
  }

  .voice-selection label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
  }

  .voice-input-group {
    display: flex;
    gap: 8px;
  }

  .voice-select {
    flex: 1;
    padding: 10px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    background: white;
    cursor: pointer;
  }

  .voice-select:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .clone-voice-button {
    padding: 10px 16px;
    border: 2px solid #e5e7eb;
    background: white;
    color: #6b7280;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    white-space: nowrap;
  }

  .clone-voice-button:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  .clone-voice-button svg {
    width: 16px;
    height: 16px;
  }

  .voice-settings-panel {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .settings-header h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #374151;
  }

  .settings-actions {
    display: flex;
    gap: 12px;
  }

  .text-button {
    background: none;
    border: none;
    color: #3b82f6;
    cursor: pointer;
    font-size: 14px;
    text-decoration: underline;
  }

  .text-button:hover {
    color: #1d4ed8;
  }

  .settings-grid {
    display: grid;
    gap: 16px;
  }

  .setting-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .setting-item label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
    color: #374151;
    font-size: 14px;
  }

  .setting-value {
    font-weight: normal;
    color: #6b7280;
    font-family: 'Courier New', monospace;
  }

  .setting-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #e5e7eb;
    outline: none;
    cursor: pointer;
  }

  .setting-slider::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .setting-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .setting-description {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.4;
  }

  .setting-item.checkbox {
    flex-direction: row;
    align-items: flex-start;
    gap: 12px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    flex-shrink: 0;
  }

  .setting-checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .action-container {
    margin-bottom: 20px;
  }

  .synthesize-button {
    width: 100%;
    padding: 14px 20px;
    border: none;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .synthesize-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  }

  .synthesize-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .synthesize-button svg {
    width: 20px;
    height: 20px;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .player-container {
    margin-bottom: 20px;
  }

  .synthesis-info {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
  }

  .info-item {
    display: flex;
    gap: 4px;
    font-size: 14px;
  }

  .info-item .label {
    color: #6b7280;
  }

  .info-item .value {
    color: #374151;
    font-weight: 500;
  }

  .info-item .value.cached {
    color: #059669;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    font-size: 14px;
    color: #b91c1c;
  }

  .error-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .voice-synthesis {
      padding: 16px;
    }

    .voice-input-group {
      flex-direction: column;
    }

    .synthesis-info {
      flex-direction: column;
      gap: 8px;
    }
  }
</style>