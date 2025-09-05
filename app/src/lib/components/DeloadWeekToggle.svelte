<script lang="ts">
  import { RotateCcw, Calendar } from 'lucide-svelte';
  
  export let isDeloadWeek = false;
  export let onToggle: (enabled: boolean) => void;
  
  function handleToggle() {
    isDeloadWeek = !isDeloadWeek;
    onToggle(isDeloadWeek);
  }
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4">
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
        <RotateCcw size={20} class="text-blue-600" />
      </div>
      <div>
        <h3 class="text-sm font-semibold text-gray-900">Deload Week</h3>
        <p class="text-xs text-gray-600">50% weight, 2x reps, 90s rest</p>
      </div>
    </div>
    
    <button
      on:click={handleToggle}
      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {
        isDeloadWeek ? 'bg-blue-600' : 'bg-gray-200'
      }"
    >
      <span class="sr-only">Enable deload week</span>
      <span
        class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform {
          isDeloadWeek ? 'translate-x-6' : 'translate-x-1'
        }"
      ></span>
    </button>
  </div>
  
  {#if isDeloadWeek}
    <div class="mt-3 p-2 bg-blue-50 rounded">
      <div class="flex items-center text-xs text-blue-700">
        <Calendar size={12} class="mr-1" />
        <span>Active: Focus on form and recovery</span>
      </div>
    </div>
  {/if}
</div>