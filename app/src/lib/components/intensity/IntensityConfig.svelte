<!--
  IntensityConfig.svelte
  Phase 3.5 - Frontend Components
  
  Configuration component for users to set intensity target ranges,
  preferences, and calibration settings.
-->

<script lang="ts">
  import { intensityScoring } from '$lib/services/intensityScoring';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    save: { config: IntensityConfig };
    cancel: void;
  }>();

  // Configuration interface
  interface IntensityConfig {
    targetRange: {
      min: number;
      max: number;
    };
    weights: {
      tempo: number;
      motionSmoothness: number;
      repConsistency: number;
      userFeedback: number;
      strainModifier: number;
    };
    preferences: {
      enableVoiceFeedback: boolean;
      showBreakdown: boolean;
      showRecommendations: boolean;
      updateFrequency: number; // seconds
    };
    calibration: {
      restingHeartRate: number;
      maxHeartRate: number;
      fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    };
  }

  // Props
  export let initialConfig: Partial<IntensityConfig> = {};
  export let isOpen: boolean = false;

  // Default configuration
  let config: IntensityConfig = {
    targetRange: {
      min: 60,
      max: 85,
      ...initialConfig.targetRange
    },
    weights: {
      tempo: 30,
      motionSmoothness: 25,
      repConsistency: 20,
      userFeedback: 15,
      strainModifier: 10,
      ...initialConfig.weights
    },
    preferences: {
      enableVoiceFeedback: false,
      showBreakdown: true,
      showRecommendations: true,
      updateFrequency: 1,
      ...initialConfig.preferences
    },
    calibration: {
      restingHeartRate: 60,
      maxHeartRate: 190,
      fitnessLevel: 'intermediate',
      ...initialConfig.calibration
    }
  };

  // State
  let activeTab: 'targets' | 'weights' | 'preferences' | 'calibration' = 'targets';
  let isDirty = false;

  // Reactive validation
  $: weightSum = Object.values(config.weights).reduce((sum, weight) => sum + weight, 0);
  $: isWeightsValid = Math.abs(weightSum - 100) < 0.1;
  $: isTargetValid = config.targetRange.min < config.targetRange.max && 
                     config.targetRange.min >= 0 && 
                     config.targetRange.max <= 100;
  $: isCalibrationValid = config.calibration.restingHeartRate < config.calibration.maxHeartRate;
  $: isFormValid = isWeightsValid && isTargetValid && isCalibrationValid;

  // Mark as dirty when config changes
  $: if (config) {
    isDirty = true;
  }

  function normalizeWeights() {
    const sum = Object.values(config.weights).reduce((s, w) => s + w, 0);
    if (sum !== 100) {
      const factor = 100 / sum;
      config.weights.tempo = Math.round(config.weights.tempo * factor);
      config.weights.motionSmoothness = Math.round(config.weights.motionSmoothness * factor);
      config.weights.repConsistency = Math.round(config.weights.repConsistency * factor);
      config.weights.userFeedback = Math.round(config.weights.userFeedback * factor);
      config.weights.strainModifier = 100 - (config.weights.tempo + config.weights.motionSmoothness + config.weights.repConsistency + config.weights.userFeedback);
    }
  }

  function resetToDefaults() {
    config = {
      targetRange: { min: 60, max: 85 },
      weights: { tempo: 30, motionSmoothness: 25, repConsistency: 20, userFeedback: 15, strainModifier: 10 },
      preferences: { enableVoiceFeedback: false, showBreakdown: true, showRecommendations: true, updateFrequency: 1 },
      calibration: { restingHeartRate: 60, maxHeartRate: 190, fitnessLevel: 'intermediate' }
    };
  }

  function calculateMaxHeartRate(age: number): number {
    return Math.round(220 - age);
  }

  function handleSave() {
    if (isFormValid) {
      // Apply configuration to intensity scoring service
      intensityScoring.setTargetRange(config.targetRange.min, config.targetRange.max);
      
      dispatch('save', { config });
      isDirty = false;
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }

  // Auto-calculate max HR based on age (if provided)
  let userAge = 30;
  function updateMaxHRFromAge() {
    config.calibration.maxHeartRate = calculateMaxHeartRate(userAge);
  }
</script>

<!-- Configuration Modal/Panel -->
{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 text-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-700">
        <div>
          <h2 class="text-xl font-bold">Intensity Settings</h2>
          <p class="text-sm text-gray-400">Configure your intensity scoring preferences</p>
        </div>
        <button 
          on:click={handleCancel}
          class="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          ❌
        </button>
      </div>

      <!-- Tab Navigation -->
      <div class="flex border-b border-gray-700">
        <button 
          class="px-6 py-3 text-sm font-medium border-b-2 transition-colors"
          class:border-blue-500={activeTab === 'targets'}
          class:text-blue-400={activeTab === 'targets'}
          class:border-transparent={activeTab !== 'targets'}
          class:text-gray-400={activeTab !== 'targets'}
          on:click={() => activeTab = 'targets'}
        >
          Target Ranges
        </button>
        <button 
          class="px-6 py-3 text-sm font-medium border-b-2 transition-colors"
          class:border-blue-500={activeTab === 'weights'}
          class:text-blue-400={activeTab === 'weights'}
          class:border-transparent={activeTab !== 'weights'}
          class:text-gray-400={activeTab !== 'weights'}
          on:click={() => activeTab = 'weights'}
        >
          Score Weights
        </button>
        <button 
          class="px-6 py-3 text-sm font-medium border-b-2 transition-colors"
          class:border-blue-500={activeTab === 'preferences'}
          class:text-blue-400={activeTab === 'preferences'}
          class:border-transparent={activeTab !== 'preferences'}
          class:text-gray-400={activeTab !== 'preferences'}
          on:click={() => activeTab = 'preferences'}
        >
          Preferences
        </button>
        <button 
          class="px-6 py-3 text-sm font-medium border-b-2 transition-colors"
          class:border-blue-500={activeTab === 'calibration'}
          class:text-blue-400={activeTab === 'calibration'}
          class:border-transparent={activeTab !== 'calibration'}
          class:text-gray-400={activeTab !== 'calibration'}
          on:click={() => activeTab = 'calibration'}
        >
          Calibration
        </button>
      </div>

      <!-- Tab Content -->
      <div class="p-6 overflow-y-auto max-h-96">
        
        <!-- Target Ranges Tab -->
        {#if activeTab === 'targets'}
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold mb-4">Intensity Target Range</h3>
              <p class="text-sm text-gray-400 mb-4">
                Set your desired intensity range for workouts. Scores within this range are considered optimal.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <!-- Minimum Target -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Intensity (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  bind:value={config.targetRange.min}
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div class="mt-2 text-center">
                  <span class="text-lg font-bold text-blue-400">{config.targetRange.min}%</span>
                </div>
              </div>

              <!-- Maximum Target -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Intensity (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  bind:value={config.targetRange.max}
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div class="mt-2 text-center">
                  <span class="text-lg font-bold text-green-400">{config.targetRange.max}%</span>
                </div>
              </div>
            </div>

            <!-- Visual Range Indicator -->
            <div class="relative">
              <div class="w-full h-8 bg-gray-700 rounded-lg overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-blue-500 to-green-500 opacity-80"
                  style="margin-left: {config.targetRange.min}%; width: {config.targetRange.max - config.targetRange.min}%"
                ></div>
              </div>
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>Target Zone</span>
                <span>100%</span>
              </div>
            </div>

            {#if !isTargetValid}
              <div class="text-red-400 text-sm">⚠️ Minimum must be less than maximum</div>
            {/if}
          </div>
        {/if}

        <!-- Score Weights Tab -->
        {#if activeTab === 'weights'}
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold mb-2">Score Component Weights</h3>
              <p class="text-sm text-gray-400 mb-4">
                Adjust how much each component contributes to your overall intensity score.
              </p>
              <div class="text-sm">
                <span class="text-gray-300">Total: </span>
                <span class="font-bold" class:text-green-400={isWeightsValid} class:text-red-400={!isWeightsValid}>
                  {weightSum}%
                </span>
              </div>
            </div>

            <div class="space-y-4">
              <!-- Tempo Weight -->
              <div class="p-4 bg-gray-800 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium">Tempo Control</label>
                  <span class="text-lg font-bold text-blue-400">{config.weights.tempo}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  bind:value={config.weights.tempo}
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <p class="text-xs text-gray-400 mt-1">Consistency of exercise tempo and rhythm</p>
              </div>

              <!-- Motion Smoothness Weight -->
              <div class="p-4 bg-gray-800 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium">Motion Smoothness</label>
                  <span class="text-lg font-bold text-green-400">{config.weights.motionSmoothness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  bind:value={config.weights.motionSmoothness}
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <p class="text-xs text-gray-400 mt-1">Smoothness of movement patterns</p>
              </div>

              <!-- Rep Consistency Weight -->
              <div class="p-4 bg-gray-800 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium">Rep Consistency</label>
                  <span class="text-lg font-bold text-purple-400">{config.weights.repConsistency}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  bind:value={config.weights.repConsistency}
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <p class="text-xs text-gray-400 mt-1">Consistency between repetitions</p>
              </div>

              <!-- User Feedback Weight -->
              <div class="p-4 bg-gray-800 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium">Form Quality</label>
                  <span class="text-lg font-bold text-yellow-400">{config.weights.userFeedback}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  bind:value={config.weights.userFeedback}
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <p class="text-xs text-gray-400 mt-1">Perceived exertion and form quality</p>
              </div>

              <!-- Strain Modifier Weight -->
              <div class="p-4 bg-gray-800 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium">Strain Factor</label>
                  <span class="text-lg font-bold text-red-400">{config.weights.strainModifier}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  bind:value={config.weights.strainModifier}
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <p class="text-xs text-gray-400 mt-1">Heart rate and physiological strain</p>
              </div>
            </div>

            <div class="flex gap-3">
              <button 
                on:click={normalizeWeights}
                class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
                disabled={isWeightsValid}
              >
                Normalize to 100%
              </button>
              <button 
                on:click={resetToDefaults}
                class="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition-colors"
              >
                Reset Defaults
              </button>
            </div>
          </div>
        {/if}

        <!-- Preferences Tab -->
        {#if activeTab === 'preferences'}
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold mb-2">Display Preferences</h3>
              <p class="text-sm text-gray-400 mb-4">
                Customize how intensity data is displayed during workouts.
              </p>
            </div>

            <div class="space-y-4">
              <!-- Voice Feedback Toggle -->
              <div class="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <div class="font-medium">Voice Coaching</div>
                  <div class="text-sm text-gray-400">Enable real-time voice feedback</div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    bind:checked={config.preferences.enableVoiceFeedback}
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <!-- Show Breakdown Toggle -->
              <div class="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <div class="font-medium">Score Breakdown</div>
                  <div class="text-sm text-gray-400">Show detailed component scores</div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    bind:checked={config.preferences.showBreakdown}
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <!-- Show Recommendations Toggle -->
              <div class="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <div class="font-medium">Recommendations</div>
                  <div class="text-sm text-gray-400">Show improvement suggestions</div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    bind:checked={config.preferences.showRecommendations}
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <!-- Update Frequency -->
              <div class="p-4 bg-gray-800 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <label class="font-medium">Update Frequency</label>
                  <span class="text-blue-400 font-bold">{config.preferences.updateFrequency}s</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  bind:value={config.preferences.updateFrequency}
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div class="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Real-time</span>
                  <span>Conservative</span>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Calibration Tab -->
        {#if activeTab === 'calibration'}
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold mb-2">Heart Rate Calibration</h3>
              <p class="text-sm text-gray-400 mb-4">
                Calibrate your heart rate zones for accurate intensity calculations.
              </p>
            </div>

            <div class="space-y-4">
              <!-- Age Input for Max HR Calculation -->
              <div class="p-4 bg-gray-800 rounded-lg">
                <label class="block font-medium mb-2">Age (for max HR estimation)</label>
                <div class="flex items-center gap-3">
                  <input
                    type="number"
                    bind:value={userAge}
                    min="15"
                    max="100"
                    class="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span class="text-sm text-gray-400">years old</span>
                  <button 
                    on:click={updateMaxHRFromAge}
                    class="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors"
                  >
                    Calculate Max HR
                  </button>
                </div>
                <p class="text-xs text-gray-400 mt-1">Estimated max HR: {calculateMaxHeartRate(userAge)} bpm</p>
              </div>

              <!-- Resting Heart Rate -->
              <div class="p-4 bg-gray-800 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <label class="font-medium">Resting Heart Rate</label>
                  <span class="text-blue-400 font-bold">{config.calibration.restingHeartRate} bpm</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  bind:value={config.calibration.restingHeartRate}
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div class="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Athletic (40)</span>
                  <span>Average (80)</span>
                </div>
              </div>

              <!-- Maximum Heart Rate -->
              <div class="p-4 bg-gray-800 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <label class="font-medium">Maximum Heart Rate</label>
                  <span class="text-red-400 font-bold">{config.calibration.maxHeartRate} bpm</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="220"
                  bind:value={config.calibration.maxHeartRate}
                  class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div class="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Lower (150)</span>
                  <span>Higher (220)</span>
                </div>
              </div>

              <!-- Fitness Level -->
              <div class="p-4 bg-gray-800 rounded-lg">
                <label class="block font-medium mb-3">Fitness Level</label>
                <div class="grid grid-cols-3 gap-3">
                  <button
                    class="p-3 rounded-lg border-2 transition-colors"
                    class:border-blue-500={config.calibration.fitnessLevel === 'beginner'}
                    class:bg-blue-600={config.calibration.fitnessLevel === 'beginner'}
                    class:border-gray-600={config.calibration.fitnessLevel !== 'beginner'}
                    class:bg-gray-700={config.calibration.fitnessLevel !== 'beginner'}
                    on:click={() => config.calibration.fitnessLevel = 'beginner'}
                  >
                    <div class="text-sm font-medium">Beginner</div>
                    <div class="text-xs text-gray-400">New to fitness</div>
                  </button>
                  <button
                    class="p-3 rounded-lg border-2 transition-colors"
                    class:border-blue-500={config.calibration.fitnessLevel === 'intermediate'}
                    class:bg-blue-600={config.calibration.fitnessLevel === 'intermediate'}
                    class:border-gray-600={config.calibration.fitnessLevel !== 'intermediate'}
                    class:bg-gray-700={config.calibration.fitnessLevel !== 'intermediate'}
                    on:click={() => config.calibration.fitnessLevel = 'intermediate'}
                  >
                    <div class="text-sm font-medium">Intermediate</div>
                    <div class="text-xs text-gray-400">Regular training</div>
                  </button>
                  <button
                    class="p-3 rounded-lg border-2 transition-colors"
                    class:border-blue-500={config.calibration.fitnessLevel === 'advanced'}
                    class:bg-blue-600={config.calibration.fitnessLevel === 'advanced'}
                    class:border-gray-600={config.calibration.fitnessLevel !== 'advanced'}
                    class:bg-gray-700={config.calibration.fitnessLevel !== 'advanced'}
                    on:click={() => config.calibration.fitnessLevel = 'advanced'}
                  >
                    <div class="text-sm font-medium">Advanced</div>
                    <div class="text-xs text-gray-400">High performance</div>
                  </button>
                </div>
              </div>

              <!-- HR Zone Preview -->
              <div class="p-4 bg-gray-800 rounded-lg">
                <h4 class="font-medium mb-3">Heart Rate Zones</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-400">Recovery:</span>
                    <span>{config.calibration.restingHeartRate} - {Math.round(config.calibration.maxHeartRate * 0.6)} bpm</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-yellow-400">Moderate:</span>
                    <span>{Math.round(config.calibration.maxHeartRate * 0.6)} - {Math.round(config.calibration.maxHeartRate * 0.7)} bpm</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-orange-400">Vigorous:</span>
                    <span>{Math.round(config.calibration.maxHeartRate * 0.7)} - {Math.round(config.calibration.maxHeartRate * 0.85)} bpm</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-red-400">Maximum:</span>
                    <span>{Math.round(config.calibration.maxHeartRate * 0.85)} - {config.calibration.maxHeartRate} bpm</span>
                  </div>
                </div>
              </div>
            </div>

            {#if !isCalibrationValid}
              <div class="text-red-400 text-sm">⚠️ Resting HR must be less than max HR</div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Footer Actions -->
      <div class="flex items-center justify-between p-6 border-t border-gray-700">
        <div class="flex items-center gap-2">
          {#if isDirty}
            <span class="w-2 h-2 bg-orange-400 rounded-full"></span>
            <span class="text-sm text-gray-400">Unsaved changes</span>
          {/if}
        </div>
        
        <div class="flex gap-3">
          <button 
            on:click={handleCancel}
            class="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            on:click={handleSave}
            disabled={!isFormValid}
            class="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Custom slider styling */
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