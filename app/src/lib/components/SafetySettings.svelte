<script lang="ts">
  import { Shield, AlertTriangle, Settings, ToggleLeft, ToggleRight } from 'lucide-svelte';
  import type { SafetySettings } from '$lib/types/fitnessTrackers';
  import { DEFAULT_SAFETY_SETTINGS } from '$lib/types/fitnessTrackers';

  export let settings: SafetySettings = { ...DEFAULT_SAFETY_SETTINGS };
  export let onSettingsChange: (settings: SafetySettings) => void;

  function updateSetting<K extends keyof SafetySettings>(
    key: K,
    value: SafetySettings[K]
  ) {
    settings = { ...settings, [key]: value };
    onSettingsChange(settings);
  }

  function resetToDefaults() {
    settings = { ...DEFAULT_SAFETY_SETTINGS };
    onSettingsChange(settings);
  }

  $: riskLevelColor = {
    'conservative': 'text-green-600 bg-green-100',
    'moderate': 'text-yellow-600 bg-yellow-100',
    'aggressive': 'text-red-600 bg-red-100'
  }[settings.injuryRiskTolerance];
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center space-x-3">
      <Shield size={24} class="text-blue-600" />
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Safety Settings</h3>
        <p class="text-sm text-gray-600">Configure workout safety and stopping behavior</p>
      </div>
    </div>
    
    <button
      on:click={resetToDefaults}
      class="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
    >
      Reset Defaults
    </button>
  </div>

  <div class="space-y-6">
    <!-- Hard Stop vs Warning -->
    <div class="border-b border-gray-200 pb-4">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h4 class="text-sm font-semibold text-gray-900">Workout Hard Stop</h4>
          <p class="text-xs text-gray-600">Automatically stop workouts vs show warnings only</p>
        </div>
        <button
          on:click={() => updateSetting('enableHardStop', !settings.enableHardStop)}
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {
            settings.enableHardStop ? 'bg-blue-600' : 'bg-gray-200'
          }"
        >
          <span class="sr-only">Enable hard stop</span>
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform {
              settings.enableHardStop ? 'translate-x-6' : 'translate-x-1'
            }"
          ></span>
        </button>
      </div>
      
      {#if settings.enableHardStop}
        <div class="ml-4 pl-4 border-l-2 border-blue-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-900">Only During Deload Weeks</p>
              <p class="text-xs text-gray-600">Restrict hard stops to deload weeks only</p>
            </div>
            <button
              on:click={() => updateSetting('hardStopOnlyDuringDeload', !settings.hardStopOnlyDuringDeload)}
              class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none {
                settings.hardStopOnlyDuringDeload ? 'bg-blue-500' : 'bg-gray-300'
              }"
            >
              <span class="sr-only">Hard stop only during deload</span>
              <span
                class="inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform {
                  settings.hardStopOnlyDuringDeload ? 'translate-x-5' : 'translate-x-1'
                }"
              ></span>
            </button>
          </div>
        </div>
      {:else}
        <div class="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
          ⚠️ Workouts will show warnings only - you control when to stop
        </div>
      {/if}
    </div>

    <!-- Strain Warning Threshold -->
    <div class="border-b border-gray-200 pb-4">
      <div class="mb-3">
        <h4 class="text-sm font-semibold text-gray-900">Strain Warning Threshold</h4>
        <p class="text-xs text-gray-600">Warning when you reach this % of target strain</p>
      </div>
      
      <div class="flex items-center space-x-4">
        <input
          type="range"
          min="0.7"
          max="1.0"
          step="0.05"
          bind:value={settings.strainWarningThreshold}
          on:input={(e) => updateSetting('strainWarningThreshold', parseFloat(e.target.value))}
          class="flex-1"
        />
        <div class="w-16 text-sm font-medium text-gray-900">
          {Math.round(settings.strainWarningThreshold * 100)}%
        </div>
      </div>
      
      <div class="mt-2 flex justify-between text-xs text-gray-500">
        <span>70% (Early warning)</span>
        <span>100% (At target)</span>
      </div>
    </div>

    <!-- Recovery Minimum -->
    <div class="border-b border-gray-200 pb-4">
      <div class="mb-3">
        <h4 class="text-sm font-semibold text-gray-900">Minimum Recovery to Train</h4>
        <p class="text-xs text-gray-600">Below this recovery score, recommend rest days</p>
      </div>
      
      <div class="flex items-center space-x-4">
        <input
          type="range"
          min="20"
          max="50"
          step="5"
          bind:value={settings.recoveryMinimum}
          on:input={(e) => updateSetting('recoveryMinimum', parseInt(e.target.value))}
          class="flex-1"
        />
        <div class="w-16 text-sm font-medium text-gray-900">
          {settings.recoveryMinimum}%
        </div>
      </div>
      
      <div class="mt-2 flex justify-between text-xs text-gray-500">
        <span>20% (Very permissive)</span>
        <span>50% (Conservative)</span>
      </div>
    </div>

    <!-- Injury Risk Tolerance -->
    <div class="border-b border-gray-200 pb-4">
      <div class="mb-3">
        <h4 class="text-sm font-semibold text-gray-900">Injury Risk Tolerance</h4>
        <p class="text-xs text-gray-600">How conservative the safety algorithms should be</p>
      </div>
      
      <div class="grid grid-cols-3 gap-2">
        {#each [
          { value: 'conservative', label: 'Conservative', desc: 'Maximum safety' },
          { value: 'moderate', label: 'Moderate', desc: 'Balanced approach' },
          { value: 'aggressive', label: 'Aggressive', desc: 'Push harder' }
        ] as option}
          <button
            on:click={() => updateSetting('injuryRiskTolerance', option.value)}
            class="p-3 rounded-lg text-center transition-colors border {
              settings.injuryRiskTolerance === option.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
            }"
          >
            <div class="text-xs font-medium">{option.label}</div>
            <div class="text-xs text-gray-600 mt-1">{option.desc}</div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Auto Deload -->
    <div>
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-sm font-semibold text-gray-900">Auto Deload Recommendations</h4>
          <p class="text-xs text-gray-600">Automatically suggest deload weeks based on performance</p>
        </div>
        <button
          on:click={() => updateSetting('autoDeloadTrigger', !settings.autoDeloadTrigger)}
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {
            settings.autoDeloadTrigger ? 'bg-blue-600' : 'bg-gray-200'
          }"
        >
          <span class="sr-only">Enable auto deload</span>
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform {
              settings.autoDeloadTrigger ? 'translate-x-6' : 'translate-x-1'
            }"
          ></span>
        </button>
      </div>
    </div>
  </div>

  <!-- Settings Summary -->
  <div class="mt-6 p-4 bg-gray-50 rounded-lg">
    <h5 class="text-xs font-semibold text-gray-900 mb-2">Current Configuration</h5>
    <div class="space-y-1 text-xs text-gray-600">
      <div class="flex justify-between">
        <span>Workout stopping:</span>
        <span class="font-medium">
          {settings.enableHardStop ? 'Auto-stop enabled' : 'Warnings only'}
          {#if settings.enableHardStop && settings.hardStopOnlyDuringDeload}
            <span class="text-blue-600"> (deload weeks only)</span>
          {/if}
        </span>
      </div>
      <div class="flex justify-between">
        <span>Strain warning:</span>
        <span class="font-medium">{Math.round(settings.strainWarningThreshold * 100)}% of target</span>
      </div>
      <div class="flex justify-between">
        <span>Recovery minimum:</span>
        <span class="font-medium">{settings.recoveryMinimum}%</span>
      </div>
      <div class="flex justify-between">
        <span>Risk tolerance:</span>
        <span class="font-medium capitalize px-2 py-1 rounded text-xs {riskLevelColor}">
          {settings.injuryRiskTolerance}
        </span>
      </div>
      <div class="flex justify-between">
        <span>Auto deload:</span>
        <span class="font-medium">{settings.autoDeloadTrigger ? 'Enabled' : 'Disabled'}</span>
      </div>
    </div>
  </div>
</div>