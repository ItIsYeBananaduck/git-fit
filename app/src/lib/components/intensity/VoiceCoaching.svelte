<!--
  VoiceCoaching.svelte
  Phase 3.5 - Frontend Components
  
  Dedicated voice coaching interface providing real-time audio feedback,
  customizable coaching commands, and voice control settings.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { voiceService } from '$lib/services/voiceService';
  import { intensityScoring } from '$lib/services/intensityScoring';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    settingsChanged: { settings: VoiceSettings };
    coachingToggled: { enabled: boolean };
  }>();

  interface VoiceSettings {
    enabled: boolean;
    volume: number;
    rate: number;
    pitch: number;
    voice: string;
    language: string;
    autoCoaching: {
      intensityAlerts: boolean;
      formFeedback: boolean;
      motivationalCues: boolean;
      restReminders: boolean;
      intervalCues: boolean;
    };
    triggerThresholds: {
      lowIntensity: number;
      highIntensity: number;
      inconsistentForm: number;
      restTime: number; // seconds
    };
    customCommands: Array<{
      id: string;
      phrase: string;
      action: string;
      enabled: boolean;
    }>;
  }

  // Props
  export let currentIntensity: number = 0;
  export let currentSet: number = 1;
  export let targetIntensity: { min: number; max: number } = { min: 60, max: 85 };
  export let workoutPhase: 'warmup' | 'exercise' | 'rest' | 'cooldown' = 'exercise';

  // State
  let settings: VoiceSettings = {
    enabled: false,
    volume: 0.8,
    rate: 1.0,
    pitch: 1.0,
    voice: '',
    language: 'en-US',
    autoCoaching: {
      intensityAlerts: true,
      formFeedback: true,
      motivationalCues: true,
      restReminders: true,
      intervalCues: true
    },
    triggerThresholds: {
      lowIntensity: 50,
      highIntensity: 90,
      inconsistentForm: 30,
      restTime: 60
    },
    customCommands: [
      { id: '1', phrase: 'start coaching', action: 'enableCoaching', enabled: true },
      { id: '2', phrase: 'stop coaching', action: 'disableCoaching', enabled: true },
      { id: '3', phrase: 'increase intensity', action: 'intensityUp', enabled: true },
      { id: '4', phrase: 'decrease intensity', action: 'intensityDown', enabled: true },
      { id: '5', phrase: 'take a break', action: 'startRest', enabled: true }
    ]
  };

  let availableVoices: SpeechSynthesisVoice[] = [];
  let isListening = false;
  let recognition: SpeechRecognition | null = null;
  let lastCoachingMessage = '';
  let coachingHistory: Array<{ timestamp: Date; message: string; type: string }> = [];
  let currentlyPlaying = false;
  
  // Voice coaching logic state
  let lastIntensityCheck = 0;
  let consecutiveLowIntensity = 0;
  let consecutiveHighIntensity = 0;
  let lastFormWarning = 0;
  let restStartTime: Date | null = null;

  onMount(() => {
    initializeVoiceService();
    setupSpeechRecognition();
    loadSettings();
  });

  onDestroy(() => {
    if (recognition) {
      recognition.stop();
    }
    voiceService.stop();
  });

  function initializeVoiceService() {
    // Get available voices
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        availableVoices = speechSynthesis.getVoices();
        if (availableVoices.length > 0 && !settings.voice) {
          // Default to first English voice
          const englishVoice = availableVoices.find(voice => voice.lang.startsWith('en'));
          settings.voice = englishVoice?.name || availableVoices[0].name;
        }
      };
      
      updateVoices();
      speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  function setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = settings.language;

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        handleVoiceCommand(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          addToHistory('Microphone access denied', 'error');
        }
      };

      recognition.onend = () => {
        if (isListening && settings.enabled) {
          // Restart recognition if it stops unexpectedly
          setTimeout(() => recognition?.start(), 1000);
        }
      };
    }
  }

  function loadSettings() {
    const saved = localStorage.getItem('voiceCoachingSettings');
    if (saved) {
      settings = { ...settings, ...JSON.parse(saved) };
    }
  }

  function saveSettings() {
    localStorage.setItem('voiceCoachingSettings', JSON.stringify(settings));
    dispatch('settingsChanged', { settings });
  }

  function toggleVoiceCoaching() {
    settings.enabled = !settings.enabled;
    
    if (settings.enabled) {
      startVoiceCoaching();
    } else {
      stopVoiceCoaching();
    }
    
    saveSettings();
    dispatch('coachingToggled', { enabled: settings.enabled });
  }

  function startVoiceCoaching() {
    if (settings.enabled) {
      voiceService.setSettings({
        volume: settings.volume,
        rate: settings.rate,
        pitch: settings.pitch,
        voice: settings.voice
      });
      
      speak("Voice coaching activated. I'm here to help you optimize your workout.");
      addToHistory("Voice coaching activated", "system");
    }
  }

  function stopVoiceCoaching() {
    voiceService.stop();
    if (recognition && isListening) {
      recognition.stop();
      isListening = false;
    }
    addToHistory("Voice coaching deactivated", "system");
  }

  function toggleListening() {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      isListening = false;
    } else {
      recognition.start();
      isListening = true;
      addToHistory("Voice commands enabled", "system");
    }
  }

  async function speak(text: string, priority: 'low' | 'normal' | 'high' = 'normal') {
    if (!settings.enabled) return;

    currentlyPlaying = true;
    lastCoachingMessage = text;
    
    try {
      await voiceService.speak(text);
      addToHistory(text, 'coaching');
    } catch (error) {
      console.error('TTS Error:', error);
      addToHistory('Speech synthesis error', 'error');
    } finally {
      currentlyPlaying = false;
    }
  }

  function addToHistory(message: string, type: string) {
    coachingHistory = [
      { timestamp: new Date(), message, type },
      ...coachingHistory.slice(0, 49) // Keep last 50 entries
    ];
  }

  function handleVoiceCommand(transcript: string) {
    addToHistory(`Command: "${transcript}"`, 'command');
    
    // Check custom commands
    for (const command of settings.customCommands) {
      if (command.enabled && transcript.includes(command.phrase)) {
        executeCommand(command.action);
        return;
      }
    }

    // Fallback to built-in commands
    if (transcript.includes('start coaching')) {
      settings.enabled = true;
      startVoiceCoaching();
    } else if (transcript.includes('stop coaching')) {
      settings.enabled = false;
      stopVoiceCoaching();
    } else if (transcript.includes('volume up')) {
      settings.volume = Math.min(1.0, settings.volume + 0.1);
      speak(`Volume set to ${Math.round(settings.volume * 100)}%`);
    } else if (transcript.includes('volume down')) {
      settings.volume = Math.max(0.1, settings.volume - 0.1);
      speak(`Volume set to ${Math.round(settings.volume * 100)}%`);
    }
  }

  function executeCommand(action: string) {
    switch (action) {
      case 'enableCoaching':
        settings.enabled = true;
        startVoiceCoaching();
        break;
      case 'disableCoaching':
        settings.enabled = false;
        stopVoiceCoaching();
        break;
      case 'intensityUp':
        speak("Increase your intensity! Push a little harder!");
        break;
      case 'intensityDown':
        speak("Ease up a bit. Find a sustainable pace.");
        break;
      case 'startRest':
        speak("Take a well-deserved break. Focus on your breathing.");
        break;
      default:
        speak("Command not recognized.");
    }
  }

  function testVoice() {
    speak("This is a test of your voice coaching settings. How does this sound?");
  }

  function clearHistory() {
    coachingHistory = [];
  }

  function addCustomCommand() {
    const newCommand = {
      id: Date.now().toString(),
      phrase: '',
      action: 'custom',
      enabled: true
    };
    settings.customCommands = [...settings.customCommands, newCommand];
  }

  function removeCustomCommand(id: string) {
    settings.customCommands = settings.customCommands.filter(cmd => cmd.id !== id);
  }

  // Auto-coaching logic
  $: if (settings.enabled && settings.autoCoaching.intensityAlerts) {
    checkIntensityAndProvideGuidance();
  }

  function checkIntensityAndProvideGuidance() {
    const now = Date.now();
    
    // Intensity guidance (check every 10 seconds)
    if (now - lastIntensityCheck > 10000) {
      lastIntensityCheck = now;

      if (currentIntensity < settings.triggerThresholds.lowIntensity) {
        consecutiveLowIntensity++;
        consecutiveHighIntensity = 0;
        
        if (consecutiveLowIntensity >= 2) {
          speak("Your intensity is low. Try to push yourself a bit harder!");
          consecutiveLowIntensity = 0;
        }
      } else if (currentIntensity > settings.triggerThresholds.highIntensity) {
        consecutiveHighIntensity++;
        consecutiveLowIntensity = 0;
        
        if (consecutiveHighIntensity >= 2) {
          speak("Great intensity! Make sure you can maintain this pace.");
          consecutiveHighIntensity = 0;
        }
      } else {
        // Reset counters when in target range
        consecutiveLowIntensity = 0;
        consecutiveHighIntensity = 0;
        
        if (currentIntensity >= targetIntensity.min && currentIntensity <= targetIntensity.max) {
          if (Math.random() < 0.3) { // 30% chance of positive reinforcement
            const messages = [
              "Perfect intensity! Keep it up!",
              "You're in the zone! Excellent work!",
              "Great pace! This is your target range!",
              "Outstanding! You're hitting your marks!"
            ];
            speak(messages[Math.floor(Math.random() * messages.length)]);
          }
        }
      }
    }

    // Rest reminders
    if (settings.autoCoaching.restReminders && workoutPhase === 'rest') {
      if (!restStartTime) {
        restStartTime = new Date();
      } else if (now - restStartTime.getTime() > settings.triggerThresholds.restTime * 1000) {
        speak("Rest time is up! Ready for your next set?");
        restStartTime = null;
      }
    } else if (workoutPhase !== 'rest') {
      restStartTime = null;
    }
  }

  // Reactive settings updates
  $: if (settings.voice && availableVoices.length > 0) {
    voiceService.setSettings({
      voice: settings.voice,
      rate: settings.rate,
      pitch: settings.pitch,
      volume: settings.volume
    });
  }
</script>

<!-- Voice Coaching Interface -->
<div class="bg-gray-900 text-white rounded-xl p-6 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="text-2xl">🎤</div>
      <div>
        <h2 class="text-xl font-bold">Voice Coaching</h2>
        <p class="text-sm text-gray-400">AI-powered workout guidance</p>
      </div>
    </div>
    
    <!-- Master Toggle -->
    <label class="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        bind:checked={settings.enabled}
        on:change={toggleVoiceCoaching}
        class="sr-only peer"
      />
      <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  </div>

  {#if settings.enabled}
    <!-- Status Bar -->
    <div class="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full" class:bg-green-400={settings.enabled} class:bg-gray-500={!settings.enabled}></div>
        <span class="text-sm">Coaching: {settings.enabled ? 'Active' : 'Inactive'}</span>
      </div>
      
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full" class:bg-blue-400={isListening} class:bg-gray-500={!isListening}></div>
        <span class="text-sm">Voice Commands: {isListening ? 'Listening' : 'Disabled'}</span>
      </div>

      {#if currentlyPlaying}
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-orange-400 animate-pulse"></div>
          <span class="text-sm">Speaking...</span>
        </div>
      {/if}
    </div>

    <!-- Current Coaching Message -->
    {#if lastCoachingMessage}
      <div class="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
        <div class="flex items-start gap-3">
          <div class="text-2xl">💬</div>
          <div>
            <div class="font-medium text-blue-400">Latest Guidance:</div>
            <div class="text-sm mt-1">{lastCoachingMessage}</div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Quick Controls -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <button 
        on:click={toggleListening}
        class="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        class:bg-blue-800={isListening}
        class:hover:bg-blue-700={isListening}
      >
        <div class="text-lg mb-1">🎙️</div>
        <div class="text-xs">{isListening ? 'Stop' : 'Start'} Listening</div>
      </button>

      <button 
        on:click={testVoice}
        class="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
      >
        <div class="text-lg mb-1">🔊</div>
        <div class="text-xs">Test Voice</div>
      </button>

      <button 
        on:click={() => speak("Stay focused! You're doing great!")}
        class="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
      >
        <div class="text-lg mb-1">💪</div>
        <div class="text-xs">Motivate</div>
      </button>

      <button 
        on:click={clearHistory}
        class="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
      >
        <div class="text-lg mb-1">🗑️</div>
        <div class="text-xs">Clear History</div>
      </button>
    </div>

    <!-- Settings Tabs -->
    <div class="border-t border-gray-700 pt-6">
      <div class="space-y-6">
        
        <!-- Voice Settings -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Voice Settings</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Voice Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Voice</label>
              <select 
                bind:value={settings.voice}
                on:change={saveSettings}
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {#each availableVoices as voice}
                  <option value={voice.name}>{voice.name} ({voice.lang})</option>
                {/each}
              </select>
            </div>

            <!-- Language -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Language</label>
              <select 
                bind:value={settings.language}
                on:change={saveSettings}
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
              </select>
            </div>
          </div>

          <!-- Voice Controls -->
          <div class="space-y-4">
            <!-- Volume -->
            <div>
              <div class="flex justify-between items-center mb-2">
                <label class="text-sm font-medium text-gray-300">Volume</label>
                <span class="text-sm text-blue-400">{Math.round(settings.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                bind:value={settings.volume}
                on:input={saveSettings}
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <!-- Rate -->
            <div>
              <div class="flex justify-between items-center mb-2">
                <label class="text-sm font-medium text-gray-300">Speech Rate</label>
                <span class="text-sm text-blue-400">{settings.rate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                bind:value={settings.rate}
                on:input={saveSettings}
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <!-- Pitch -->
            <div>
              <div class="flex justify-between items-center mb-2">
                <label class="text-sm font-medium text-gray-300">Pitch</label>
                <span class="text-sm text-blue-400">{settings.pitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                bind:value={settings.pitch}
                on:input={saveSettings}
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        <!-- Auto Coaching Settings -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Auto Coaching</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                bind:checked={settings.autoCoaching.intensityAlerts}
                on:change={saveSettings}
                class="rounded"
              />
              <div>
                <div class="font-medium">Intensity Alerts</div>
                <div class="text-xs text-gray-400">Guidance when intensity is too low/high</div>
              </div>
            </label>

            <label class="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                bind:checked={settings.autoCoaching.formFeedback}
                on:change={saveSettings}
                class="rounded"
              />
              <div>
                <div class="font-medium">Form Feedback</div>
                <div class="text-xs text-gray-400">Alerts for form inconsistencies</div>
              </div>
            </label>

            <label class="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                bind:checked={settings.autoCoaching.motivationalCues}
                on:change={saveSettings}
                class="rounded"
              />
              <div>
                <div class="font-medium">Motivational Cues</div>
                <div class="text-xs text-gray-400">Positive reinforcement messages</div>
              </div>
            </label>

            <label class="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                bind:checked={settings.autoCoaching.restReminders}
                on:change={saveSettings}
                class="rounded"
              />
              <div>
                <div class="font-medium">Rest Reminders</div>
                <div class="text-xs text-gray-400">Alerts when rest time is complete</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Custom Commands -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Custom Commands</h3>
            <button 
              on:click={addCustomCommand}
              class="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors"
            >
              Add Command
            </button>
          </div>
          
          <div class="space-y-2">
            {#each settings.customCommands as command (command.id)}
              <div class="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <input
                  type="checkbox"
                  bind:checked={command.enabled}
                  on:change={saveSettings}
                  class="rounded"
                />
                <input
                  type="text"
                  bind:value={command.phrase}
                  on:blur={saveSettings}
                  placeholder="Voice command phrase"
                  class="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                />
                <select
                  bind:value={command.action}
                  on:change={saveSettings}
                  class="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                >
                  <option value="enableCoaching">Enable Coaching</option>
                  <option value="disableCoaching">Disable Coaching</option>
                  <option value="intensityUp">Increase Intensity</option>
                  <option value="intensityDown">Decrease Intensity</option>
                  <option value="startRest">Start Rest</option>
                </select>
                <button 
                  on:click={() => removeCustomCommand(command.id)}
                  class="p-1 text-red-400 hover:bg-red-900/20 rounded transition-colors"
                >
                  ❌
                </button>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Coaching History -->
    {#if coachingHistory.length > 0}
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Coaching History</h3>
          <span class="text-sm text-gray-400">{coachingHistory.length} messages</span>
        </div>
        
        <div class="max-h-40 overflow-y-auto space-y-2">
          {#each coachingHistory.slice(0, 10) as entry}
            <div class="flex items-start gap-3 p-2 bg-gray-800 rounded text-sm">
              <div class="text-xs text-gray-400 whitespace-nowrap">
                {entry.timestamp.toLocaleTimeString()}
              </div>
              <div class="flex-1">
                <span class="inline-block px-2 py-1 text-xs rounded" 
                      class:bg-blue-900={entry.type === 'coaching'}
                      class:bg-green-900={entry.type === 'system'}
                      class:bg-purple-900={entry.type === 'command'}
                      class:bg-red-900={entry.type === 'error'}>
                  {entry.type}
                </span>
                <span class="ml-2">{entry.message}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {:else}
    <!-- Disabled State -->
    <div class="text-center py-12">
      <div class="text-6xl mb-4">🎤</div>
      <h3 class="text-lg font-semibold mb-2">Voice Coaching Disabled</h3>
      <p class="text-gray-400 mb-6">Enable voice coaching to receive real-time guidance during your workout</p>
      <button 
        on:click={toggleVoiceCoaching}
        class="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
      >
        Enable Voice Coaching
      </button>
    </div>
  {/if}
</div>

<style>
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    box-shadow: 0 0 2px 0 #555;
    transition: background .15s ease-in-out;
  }
  
  .slider::-webkit-slider-thumb:hover {
    background: #2563eb;
  }
  
  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 2px 0 #555;
  }
</style>