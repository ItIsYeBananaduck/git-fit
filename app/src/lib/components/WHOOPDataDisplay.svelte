<script lang="ts">
  import { onMount } from 'svelte';
  import { whoopData, whoopState } from '$lib/stores/whoop';
  import { Zap, Heart, Moon, Activity } from 'lucide-svelte';
  
  export let compact = false;

  let data = $whoopData;
  let state = $whoopState;

  $: data = $whoopData;
  $: state = $whoopState;

  // Get latest values for each metric
  $: latestRecovery = data.recovery[0]?.score?.recovery_score || null;
  $: latestStrain = data.strain[0]?.score?.strain || null;
  $: latestHRV = data.recovery[0]?.score?.hrv_rmssd_milli || null;
  $: latestSleep = data.sleep[0]?.score?.sleep_performance_percentage || null;

  function getStrainColor(strain: number): string {
    if (strain < 10) return 'text-green-600';
    if (strain < 15) return 'text-yellow-600';
    if (strain < 18) return 'text-orange-600';
    return 'text-red-600';
  }

  function getRecoveryColor(recovery: number): string {
    if (recovery >= 67) return 'text-green-600';
    if (recovery >= 34) return 'text-yellow-600';
    return 'text-red-600';
  }

  function formatHRV(hrv: number): string {
    return `${hrv.toFixed(1)}ms`;
  }

  function formatSleepPerformance(performance: number): string {
    return `${Math.round(performance)}%`;
  }
</script>

{#if state.isConnected}
  <div class="space-y-4">
    {#if !compact}
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">WHOOP Data</h3>
        {#if state.lastSync}
          <p class="text-sm text-gray-500">
            Last sync: {new Date(state.lastSync).toLocaleString()}
          </p>
        {/if}
      </div>
    {/if}

    <div class="grid grid-cols-1 {compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-4">
      <!-- Strain Score -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
            <Zap size={20} class="text-yellow-600" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">Strain</p>
            {#if latestStrain !== null}
              <p class="text-xl font-semibold {getStrainColor(latestStrain)}">{latestStrain.toFixed(1)}</p>
            {:else}
              <p class="text-sm text-gray-400">No data</p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Recovery Score -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
            <Activity size={20} class="text-green-600" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">Recovery</p>
            {#if latestRecovery !== null}
              <p class="text-xl font-semibold {getRecoveryColor(latestRecovery)}">{Math.round(latestRecovery)}%</p>
            {:else}
              <p class="text-sm text-gray-400">No data</p>
            {/if}
          </div>
        </div>
      </div>

      <!-- HRV -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <Heart size={20} class="text-blue-600" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">HRV</p>
            {#if latestHRV !== null}
              <p class="text-xl font-semibold text-blue-600">{formatHRV(latestHRV)}</p>
            {:else}
              <p class="text-sm text-gray-400">No data</p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Sleep Performance -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
            <Moon size={20} class="text-purple-600" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">Sleep</p>
            {#if latestSleep !== null}
              <p class="text-xl font-semibold text-purple-600">{formatSleepPerformance(latestSleep)}</p>
            {:else}
              <p class="text-sm text-gray-400">No data</p>
            {/if}
          </div>
        </div>
      </div>
    </div>

    {#if !compact && (data.recovery.length > 0 || data.strain.length > 0)}
      <div class="mt-6">
        <h4 class="text-md font-medium text-gray-900 mb-3">Recent Trends</h4>
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-600">Avg Strain (7d):</span>
              <span class="ml-2 font-semibold">
                {#if data.strain.length > 0}
                  {(data.strain.slice(0, 7).reduce((sum, s) => sum + s.score.strain, 0) / Math.min(7, data.strain.length)).toFixed(1)}
                {:else}
                  N/A
                {/if}
              </span>
            </div>
            <div>
              <span class="font-medium text-gray-600">Avg Recovery (7d):</span>
              <span class="ml-2 font-semibold">
                {#if data.recovery.length > 0}
                  {Math.round(data.recovery.slice(0, 7).reduce((sum, r) => sum + r.score.recovery_score, 0) / Math.min(7, data.recovery.length))}%
                {:else}
                  N/A
                {/if}
              </span>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="text-center py-8 text-gray-500">
    <Zap size={48} class="mx-auto mb-4 text-gray-300" />
    <p class="text-sm">Connect your WHOOP device to see your strain, recovery, and sleep data</p>
  </div>
{/if}