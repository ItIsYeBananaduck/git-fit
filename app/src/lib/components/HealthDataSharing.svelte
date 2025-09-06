<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Shield, Eye, Download, BarChart3, Clock, Heart, Zap } from 'lucide-svelte';

  export let serviceId: string;
  export let trainerId: string;
  export let isActive: boolean = false;
  export let sharedDataTypes: string[] = [];
  export let shareLevel: 'summary' | 'detailed' | 'full' = 'summary';

  const dispatch = createEventDispatcher();

  const availableDataTypes = [
    { id: 'steps', label: 'Steps', icon: Clock, description: 'Daily step count and walking data' },
    { id: 'heartRate', label: 'Heart Rate', icon: Heart, description: 'Resting and active heart rate data' },
    { id: 'sleep', label: 'Sleep', icon: Clock, description: 'Sleep duration and quality metrics' },
    { id: 'calories', label: 'Calories', icon: Zap, description: 'Calories burned throughout the day' },
    { id: 'strain', label: 'Strain Score', icon: BarChart3, description: 'WHOOP strain and recovery data' },
    { id: 'hrv', label: 'Heart Rate Variability', icon: Heart, description: 'HRV and recovery metrics' },
    { id: 'recovery', label: 'Recovery', icon: Shield, description: 'Recovery scores and readiness' }
  ];

  const shareLevels = [
    { id: 'summary', label: 'Summary Only', description: 'Weekly averages and trends' },
    { id: 'detailed', label: 'Detailed Data', description: 'Daily breakdowns and patterns' },
    { id: 'full', label: 'Full Access', description: 'Complete historical data and real-time updates' }
  ];

  function toggleDataType(dataType: string) {
    if (sharedDataTypes.includes(dataType)) {
      sharedDataTypes = sharedDataTypes.filter(type => type !== dataType);
    } else {
      sharedDataTypes = [...sharedDataTypes, dataType];
    }
  }

  function updateSharingSettings() {
    dispatch('updateSharing', {
      serviceId,
      trainerId,
      isActive,
      sharedDataTypes,
      shareLevel
    });
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
  <div class="flex items-center mb-6">
    <Shield class="w-6 h-6 text-blue-600 mr-3" />
    <div>
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
        Health Data Sharing
      </h3>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Control what fitness data your trainer can access to personalize your program
      </p>
    </div>
  </div>

  <!-- Master Toggle -->
  <div class="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
    <div class="flex items-center justify-between">
      <div>
        <h4 class="font-medium text-slate-900 dark:text-white">
          Enable Data Sharing
        </h4>
        <p class="text-sm text-slate-600 dark:text-slate-300">
          Allow your trainer to access your fitness data for better program adjustments
        </p>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          bind:checked={isActive}
          class="sr-only peer"
          data-testid="toggle-data-sharing"
        />
        <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
      </label>
    </div>
  </div>

  {#if isActive}
    <!-- Share Level Selection -->
    <div class="mb-6">
      <h4 class="font-medium text-slate-900 dark:text-white mb-3">
        Sharing Level
      </h4>
      <div class="space-y-2">
        {#each shareLevels as level}
          <label class="flex items-center p-3 border border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
            <input
              type="radio"
              bind:group={shareLevel}
              value={level.id}
              class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-blue-500"
              data-testid="radio-share-level"
            />
            <div class="ml-3">
              <div class="font-medium text-slate-900 dark:text-white">
                {level.label}
              </div>
              <div class="text-sm text-slate-600 dark:text-slate-300">
                {level.description}
              </div>
            </div>
          </label>
        {/each}
      </div>
    </div>

    <!-- Data Types Selection -->
    <div class="mb-6">
      <h4 class="font-medium text-slate-900 dark:text-white mb-3">
        Data Types to Share
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        {#each availableDataTypes as dataType}
          <label class="flex items-start p-3 border border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
            <input
              type="checkbox"
              checked={sharedDataTypes.includes(dataType.id)}
              on:change={() => toggleDataType(dataType.id)}
              class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 mt-1"
              data-testid="checkbox-data-type"
            />
            <div class="ml-3 flex-1">
              <div class="flex items-center">
                <svelte:component this={dataType.icon} class="w-4 h-4 text-slate-500 mr-2" />
                <span class="font-medium text-slate-900 dark:text-white">
                  {dataType.label}
                </span>
              </div>
              <div class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {dataType.description}
              </div>
            </div>
          </label>
        {/each}
      </div>
    </div>

    <!-- Privacy Notice -->
    <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div class="flex items-start">
        <Eye class="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
        <div>
          <h5 class="font-medium text-blue-900 dark:text-blue-200 mb-1">
            Privacy Protection
          </h5>
          <p class="text-sm text-blue-800 dark:text-blue-300">
            Your data is encrypted and only accessible to your assigned trainer. You can revoke access at any time.
            Data sharing is automatically disabled when your coaching service ends.
          </p>
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <button
      on:click={updateSharingSettings}
      class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg 
             transition-colors duration-200 flex items-center justify-center"
      data-testid="button-save-sharing"
    >
      <Download class="w-4 h-4 mr-2" />
      Update Sharing Settings
    </button>
  {/if}
</div>