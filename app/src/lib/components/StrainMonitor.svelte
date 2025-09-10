<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Target, AlertTriangle, Play, Square } from 'lucide-svelte';
  
  export let targetStrain = 14;
  export let onStrainReached: () => void = () => {};
  
  let currentStrain = 0;
  let isMonitoring = false;
  let interval: ReturnType<typeof setInterval>;
  let progress = 0;
  let shouldStop = false;
  let message = '';

  $: progress = Math.min(1, currentStrain / targetStrain);
  $: shouldStop = currentStrain >= targetStrain;
  $: {
    if (shouldStop) {
      message = `🛑 STOP: Target strain reached (${currentStrain.toFixed(1)}/${targetStrain})`;
      stopMonitoring();
      onStrainReached();
    } else if (progress > 0.9) {
      message = `⚡ Warning: Approaching strain target (${currentStrain.toFixed(1)}/${targetStrain})`;
    } else {
      message = `Strain progress: ${currentStrain.toFixed(1)}/${targetStrain} (${Math.round(progress * 100)}%)`;
    }
  }

  function startMonitoring() {
    isMonitoring = true;
    // Simulate strain accumulation over time
    interval = setInterval(() => {
      if (currentStrain < targetStrain) {
        currentStrain += 0.1 + (Math.random() * 0.2); // Random strain increase
      }
    }, 2000);
  }

  function stopMonitoring() {
    isMonitoring = false;
    if (interval) {
      clearInterval(interval);
    }
  }

  function resetStrain() {
    currentStrain = 0;
    shouldStop = false;
    stopMonitoring();
  }

  onDestroy(() => {
    if (interval) {
      clearInterval(interval);
    }
  });
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center">
      <Target size={20} class="text-gray-600 mr-2" />
      <h3 class="text-lg font-semibold text-gray-900">Live Strain Monitor</h3>
    </div>
    <div class="text-sm font-bold text-gray-900">
      {currentStrain.toFixed(1)}/{targetStrain}
    </div>
  </div>

  <!-- Strain Progress Bar -->
  <div class="mb-4">
    <div class="flex justify-between text-xs text-gray-600 mb-1">
      <span>Current Strain</span>
      <span>{Math.round(progress * 100)}%</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-3">
      <div 
        class="h-3 rounded-full transition-all duration-500 {
          shouldStop ? 'bg-red-500' : 
          progress > 0.9 ? 'bg-yellow-500' : 
          'bg-blue-500'
        }" 
        style="width: {progress * 100}%"
      ></div>
    </div>
  </div>

  <!-- Status Message -->
  <div class="mb-4 p-3 rounded-lg {
    shouldStop ? 'bg-red-50 text-red-800' :
    progress > 0.9 ? 'bg-yellow-50 text-yellow-800' :
    'bg-gray-50 text-gray-700'
  }">
    {#if shouldStop}
      <div class="flex items-center">
        <AlertTriangle size={16} class="mr-2" />
        <span class="text-sm font-medium">{message}</span>
      </div>
    {:else}
      <span class="text-sm">{message}</span>
    {/if}
  </div>

  <!-- Controls -->
  <div class="flex space-x-2">
    {#if !isMonitoring && !shouldStop}
      <button
        on:click={startMonitoring}
        class="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
      >
        <Play size={14} class="mr-1" />
        Start Workout
      </button>
    {:else if isMonitoring && !shouldStop}
      <button
        on:click={stopMonitoring}
        class="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
      >
        <Square size={14} class="mr-1" />
        Stop Workout
      </button>
    {/if}
    
    <button
      on:click={resetStrain}
      class="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
    >
      Reset
    </button>
  </div>

  <!-- Target Info -->
  <div class="mt-4 pt-4 border-t border-gray-200">
    <p class="text-xs text-gray-600">
      Target strain is calculated based on your recovery ({Math.round(Math.random() * 30 + 50)}%), 
      yesterday's strain ({Math.round(Math.random() * 5 + 10)}), and training history.
    </p>
  </div>
</div>