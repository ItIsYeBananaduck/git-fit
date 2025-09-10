<script lang="ts">
  import { onMount } from 'svelte';
  import { ouraState, ouraData } from '$lib/stores/oura';
  import { ouraDataService } from '$lib/services/ouraDataService';

  export let compact = false;
  
  let isLoading = false;
  
  onMount(() => {
    // Fetch latest data when component mounts
    if ($ouraState.isConnected) {
      refreshData();
    }
  });

  async function refreshData() {
    if (!$ouraState.isConnected) return;
    
    isLoading = true;
    await ouraDataService.fetchLatestData();
    isLoading = false;
  }

  function formatScore(score: number | null): string {
    if (score === null || score === undefined) return '--';
    return score.toString();
  }

  function getScoreColor(score: number | null): string {
    if (!score) return 'text-gray-400';
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return '--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  $: latestSleep = $ouraData.sleep.length > 0 ? $ouraData.sleep[$ouraData.sleep.length - 1] : null;
  $: latestReadiness = $ouraData.readiness.length > 0 ? $ouraData.readiness[$ouraData.readiness.length - 1] : null;
  $: latestActivity = $ouraData.activity.length > 0 ? $ouraData.activity[$ouraData.activity.length - 1] : null;
</script>

{#if $ouraState.isConnected}
  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    {#if !compact}
      <!-- Header -->
      <div class="px-4 py-3 bg-purple-50 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
              <div class="w-3 h-3 border border-purple-600 rounded-full"></div>
            </div>
            <h3 class="font-medium text-gray-900">Oura Ring Data</h3>
          </div>
          
          <div class="flex items-center gap-2">
            <button
              on:click={refreshData}
              disabled={isLoading}
              class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Syncing...' : 'Sync'}
            </button>
            
            {#if $ouraState.lastSync}
              <span class="text-xs text-gray-500">
                {$ouraState.lastSync.toLocaleTimeString()}
              </span>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- Data Content -->
    <div class="p-4">
      {#if $ouraState.isLoading}
        <div class="text-center py-4">
          <div class="inline-flex items-center gap-2 text-sm text-gray-500">
            <div class="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            Loading Oura data...
          </div>
        </div>
      {:else if latestReadiness || latestSleep || latestActivity}
        <div class="grid grid-cols-1 {compact ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4">
          <!-- Readiness Score -->
          {#if latestReadiness}
            <div class="text-center">
              <div class="text-2xl font-bold {getScoreColor(latestReadiness.score)} mb-1">
                {formatScore(latestReadiness.score)}
              </div>
              <div class="text-sm text-gray-600">Readiness</div>
              {#if latestReadiness.score && !compact}
                <div class="text-xs text-gray-400 mt-1">
                  {latestReadiness.score >= 85 ? 'Excellent' :
                   latestReadiness.score >= 70 ? 'Good' :
                   latestReadiness.score >= 50 ? 'Fair' : 'Pay attention'}
                </div>
              {/if}
            </div>
          {/if}

          <!-- Sleep Score -->
          {#if latestSleep}
            <div class="text-center">
              <div class="text-2xl font-bold {getScoreColor(latestSleep.score)} mb-1">
                {formatScore(latestSleep.score)}
              </div>
              <div class="text-sm text-gray-600">Sleep</div>
              {#if latestSleep.total_sleep_duration && !compact}
                <div class="text-xs text-gray-400 mt-1">
                  {formatDuration(latestSleep.total_sleep_duration)}
                </div>
              {/if}
            </div>
          {/if}

          <!-- Activity Score -->
          {#if latestActivity}
            <div class="text-center">
              <div class="text-2xl font-bold {getScoreColor(latestActivity.score)} mb-1">
                {formatScore(latestActivity.score)}
              </div>
              <div class="text-sm text-gray-600">Activity</div>
              {#if latestActivity.steps && !compact}
                <div class="text-xs text-gray-400 mt-1">
                  {latestActivity.steps.toLocaleString()} steps
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Additional Metrics (non-compact) -->
        {#if !compact && (latestSleep?.average_hrv || $ouraData.averageHRV)}
          <div class="mt-4 pt-4 border-t border-gray-100">
            <div class="grid grid-cols-2 gap-4 text-sm">
              {#if latestSleep?.average_hrv || $ouraData.averageHRV}
                <div>
                  <span class="text-gray-600">HRV:</span>
                  <span class="ml-2 font-medium text-gray-900">
                    {(latestSleep?.average_hrv || $ouraData.averageHRV || 0).toFixed(1)}ms
                  </span>
                </div>
              {/if}
              
              {#if latestSleep?.lowest_heart_rate}
                <div>
                  <span class="text-gray-600">Resting HR:</span>
                  <span class="ml-2 font-medium text-gray-900">{latestSleep.lowest_heart_rate} bpm</span>
                </div>
              {/if}
              
              {#if latestReadiness?.temperature_deviation}
                <div>
                  <span class="text-gray-600">Temp Dev:</span>
                  <span class="ml-2 font-medium text-gray-900">
                    {latestReadiness.temperature_deviation > 0 ? '+' : ''}{latestReadiness.temperature_deviation.toFixed(1)}°C
                  </span>
                </div>
              {/if}
              
              {#if latestSleep?.sleep_efficiency}
                <div>
                  <span class="text-gray-600">Sleep Efficiency:</span>
                  <span class="ml-2 font-medium text-gray-900">{latestSleep.sleep_efficiency}%</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      {:else}
        <div class="text-center py-6">
          <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <div class="w-6 h-6 border border-gray-400 rounded-full"></div>
          </div>
          <p class="text-sm text-gray-500 mb-2">No data available</p>
          <button
            on:click={refreshData}
            disabled={isLoading}
            class="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Fetch Data'}
          </button>
        </div>
      {/if}

      <!-- Error Display -->
      {#if $ouraState.error}
        <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div class="text-xs text-red-600">
            {$ouraState.error}
          </div>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
    <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
      <div class="w-6 h-6 border border-gray-400 rounded-full"></div>
    </div>
    <p class="text-sm text-gray-500">Oura Ring not connected</p>
  </div>
{/if}