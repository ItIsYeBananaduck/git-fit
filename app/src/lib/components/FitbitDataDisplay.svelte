<script lang="ts">
  import { onMount } from 'svelte';
  import { fitbitState, fitbitData } from '$lib/stores/fitbit';
  import { fitbitDataService } from '$lib/services/fitbitDataService';

  export let compact = false;
  
  let isLoading = false;
  
  onMount(() => {
    // Fetch latest data when component mounts
    if ($fitbitState.isConnected) {
      refreshData();
    }
  });

  async function refreshData() {
    if (!$fitbitState.isConnected) return;
    
    isLoading = true;
    await fitbitDataService.fetchLatestData();
    isLoading = false;
  }

  function getScoreColor(score: number | null, type: 'heart' | 'activity' = 'activity'): string {
    if (!score) return 'text-gray-400';
    
    if (type === 'heart') {
      // Heart rate zones use different thresholds
      if (score >= 150) return 'text-red-600'; // High intensity
      if (score >= 120) return 'text-orange-600'; // Moderate
      if (score >= 90) return 'text-yellow-600'; // Light
      return 'text-green-600'; // Resting
    }
    
    // Activity scores
    if (score >= 8000) return 'text-green-600'; // Steps goal
    if (score >= 5000) return 'text-blue-600';
    if (score >= 2000) return 'text-yellow-600';
    return 'text-gray-600';
  }

  function formatDuration(minutes: number | null): string {
    if (!minutes) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  function formatSteps(steps: number | null): string {
    if (!steps) return '--';
    return steps.toLocaleString();
  }

  $: latestSleep = $fitbitData.sleep.length > 0 ? $fitbitData.sleep[$fitbitData.sleep.length - 1] : null;
  $: latestHeartRate = $fitbitData.heartRate.length > 0 ? $fitbitData.heartRate[$fitbitData.heartRate.length - 1] : null;
  $: latestActivity = $fitbitData.activity;
</script>

{#if $fitbitState.isConnected}
  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    {#if !compact}
      <!-- Header -->
      <div class="px-4 py-3 bg-green-50 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 class="font-medium text-gray-900">Fitbit Data</h3>
          </div>
          
          <div class="flex items-center gap-2">
            <button
              on:click={refreshData}
              disabled={isLoading}
              class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Syncing...' : 'Sync'}
            </button>
            
            {#if $fitbitState.lastSync}
              <span class="text-xs text-gray-500">
                {$fitbitState.lastSync.toLocaleTimeString()}
              </span>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- Data Content -->
    <div class="p-4">
      {#if $fitbitState.isLoading}
        <div class="text-center py-4">
          <div class="inline-flex items-center gap-2 text-sm text-gray-500">
            <div class="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            Loading Fitbit data...
          </div>
        </div>
      {:else if latestActivity || latestHeartRate || latestSleep}
        <div class="grid grid-cols-1 {compact ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4">
          <!-- Steps -->
          {#if latestActivity?.summary?.steps}
            <div class="text-center">
              <div class="text-2xl font-bold {getScoreColor(latestActivity.summary.steps)} mb-1">
                {formatSteps(latestActivity.summary.steps)}
              </div>
              <div class="text-sm text-gray-600">Steps</div>
              {#if latestActivity.goals?.steps && !compact}
                <div class="text-xs text-gray-400 mt-1">
                  Goal: {formatSteps(latestActivity.goals.steps)}
                </div>
              {/if}
            </div>
          {/if}

          <!-- Heart Rate -->
          {#if $fitbitData.restingHeartRate}
            <div class="text-center">
              <div class="text-2xl font-bold {getScoreColor($fitbitData.restingHeartRate, 'heart')} mb-1">
                {$fitbitData.restingHeartRate}
              </div>
              <div class="text-sm text-gray-600">Resting HR</div>
              <div class="text-xs text-gray-400 mt-1">bpm</div>
            </div>
          {/if}

          <!-- Sleep -->
          {#if latestSleep}
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600 mb-1">
                {formatDuration(latestSleep.minutesAsleep)}
              </div>
              <div class="text-sm text-gray-600">Sleep</div>
              {#if latestSleep.efficiency && !compact}
                <div class="text-xs text-gray-400 mt-1">
                  {latestSleep.efficiency}% efficiency
                </div>
              {/if}
            </div>
          {/if}

          <!-- Calories (if available) -->
          {#if latestActivity?.summary?.caloriesOut}
            <div class="text-center">
              <div class="text-2xl font-bold text-orange-600 mb-1">
                {latestActivity.summary.caloriesOut.toLocaleString()}
              </div>
              <div class="text-sm text-gray-600">Calories</div>
              {#if latestActivity.goals?.caloriesOut && !compact}
                <div class="text-xs text-gray-400 mt-1">
                  Goal: {latestActivity.goals.caloriesOut.toLocaleString()}
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Additional Metrics (non-compact) -->
        {#if !compact && latestActivity}
          <div class="mt-4 pt-4 border-t border-gray-100">
            <div class="grid grid-cols-2 gap-4 text-sm">
              {#if latestActivity.summary.veryActiveMinutes}
                <div>
                  <span class="text-gray-600">Very Active:</span>
                  <span class="ml-2 font-medium text-gray-900">{latestActivity.summary.veryActiveMinutes} min</span>
                </div>
              {/if}
              
              {#if latestActivity.summary.fairlyActiveMinutes}
                <div>
                  <span class="text-gray-600">Fairly Active:</span>
                  <span class="ml-2 font-medium text-gray-900">{latestActivity.summary.fairlyActiveMinutes} min</span>
                </div>
              {/if}
              
              {#if latestActivity.summary.floors}
                <div>
                  <span class="text-gray-600">Floors:</span>
                  <span class="ml-2 font-medium text-gray-900">{latestActivity.summary.floors}</span>
                </div>
              {/if}
              
              {#if $fitbitData.hrv}
                <div>
                  <span class="text-gray-600">HRV:</span>
                  <span class="ml-2 font-medium text-gray-900">{$fitbitData.hrv.toFixed(1)}ms</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Heart Rate Zones (non-compact) -->
        {#if !compact && latestHeartRate?.value?.heartRateZones}
          <div class="mt-4 pt-4 border-t border-gray-100">
            <h5 class="text-sm font-medium text-gray-900 mb-3">Heart Rate Zones</h5>
            <div class="grid grid-cols-2 gap-2">
              {#each latestHeartRate.value.heartRateZones as zone}
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                  <span class="font-medium text-gray-700">{zone.name}:</span>
                  <span class="text-gray-900">{zone.minutes} min</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {:else}
        <div class="text-center py-6">
          <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <p class="text-sm text-gray-500 mb-2">No data available</p>
          <button
            on:click={refreshData}
            disabled={isLoading}
            class="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Fetch Data'}
          </button>
        </div>
      {/if}

      <!-- Error Display -->
      {#if $fitbitState.error}
        <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div class="text-xs text-red-600">
            {$fitbitState.error}
          </div>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
    <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
      <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    </div>
    <p class="text-sm text-gray-500">Fitbit not connected</p>
  </div>
{/if}