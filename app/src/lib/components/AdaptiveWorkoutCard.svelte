<script lang="ts">
  import { onMount } from 'svelte';
  import { whoopState, whoopData } from '$lib/stores/whoop';
  import { AdaptiveTrainingEngine } from '$lib/services/adaptiveTraining';
  import type { TrainingParameters } from '$lib/services/adaptiveTraining';
  import { TrendingUp, TrendingDown, Minus, Zap, Clock, Repeat } from 'lucide-svelte';

  export let exercise = {
    name: 'Bench Press',
    baseParams: {
      load: 80, // % of 1RM
      reps: 8,
      sets: 3,
      restBetweenSets: 90,
      restBetweenExercises: 180,
      intensity: 'moderate'
    } as TrainingParameters
  };

  let state = $whoopState;
  let data = $whoopData;
  let adaptiveEngine: AdaptiveTrainingEngine;
  let todaysRecommendation: any = null;
  let adaptedParams: TrainingParameters = { ...exercise.baseParams };
  let suggestions: string[] = [];

  $: state = $whoopState;
  $: data = $whoopData;

  onMount(() => {
    adaptiveEngine = new AdaptiveTrainingEngine('user-123'); // Replace with actual user ID
    calculateTodaysWorkout();
  });

  function calculateTodaysWorkout() {
    if (!state.isConnected || data.recovery.length === 0) {
      // Use default parameters when no WHOOP data
      adaptedParams = { ...exercise.baseParams };
      suggestions = ['Connect WHOOP for personalized training adjustments'];
      return;
    }

    const latestRecovery = data.recovery[0]?.score?.recovery_score || 50;
    const latestStrain = data.strain[0]?.score?.strain || 10;
    const latestHRV = data.recovery[0]?.score?.hrv_rmssd_milli || 50;
    const sleepScore = data.sleep[0]?.score?.sleep_performance_percentage || null;

    // Get daily recommendation
    todaysRecommendation = adaptiveEngine.getDailyTrainingRecommendation(
      latestRecovery,
      latestStrain,
      latestHRV,
      [] // Empty recent sessions for demo
    );

    // Adapt workout parameters
    adaptedParams = adaptiveEngine.adaptWorkoutParameters(
      exercise.baseParams,
      todaysRecommendation
    );

    // Get training suggestions
    suggestions = adaptiveEngine.generateTrainingSuggestions(
      latestRecovery,
      latestStrain,
      latestHRV,
      sleepScore || undefined
    );
  }

  function getIntensityColor(intensity: string): string {
    switch (intensity) {
      case 'light': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  function getChangeIcon(original: number, adapted: number) {
    if (adapted > original) return TrendingUp;
    if (adapted < original) return TrendingDown;
    return Minus;
  }

  function getChangeColor(original: number, adapted: number): string {
    if (adapted > original) return 'text-green-600';
    if (adapted < original) return 'text-red-600';
    return 'text-gray-600';
  }

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${minutes}min`;
  }

  // Reactive updates when WHOOP data changes
  $: if (adaptiveEngine && (state.isConnected || data.recovery.length > 0)) {
    calculateTodaysWorkout();
  }
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-900">{exercise.name}</h3>
    {#if todaysRecommendation}
      <div class="px-3 py-1 rounded-full text-sm font-medium {getIntensityColor(todaysRecommendation.intensity)}">
        {todaysRecommendation.intensity} intensity
      </div>
    {/if}
  </div>

  {#if todaysRecommendation}
    <div class="mb-4 p-3 bg-blue-50 rounded-lg">
      <p class="text-sm font-medium text-blue-900 mb-1">Today's Recommendation</p>
      <p class="text-sm text-blue-800">{todaysRecommendation.recommendation}</p>
    </div>
  {/if}

  <!-- Adaptive Parameters -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <!-- Load -->
    <div class="text-center">
      <div class="flex items-center justify-center mb-2">
        <Zap size={20} class="{getChangeColor(exercise.baseParams.load, adaptedParams.load)} mr-2" />
        <svelte:component 
          this={getChangeIcon(exercise.baseParams.load, adaptedParams.load)} 
          size={16} 
          class="{getChangeColor(exercise.baseParams.load, adaptedParams.load)}"
        />
      </div>
      <p class="text-2xl font-bold text-gray-900">{adaptedParams.load}%</p>
      <p class="text-sm text-gray-600">Load</p>
      {#if adaptedParams.load !== exercise.baseParams.load}
        <p class="text-xs text-gray-500">was {exercise.baseParams.load}%</p>
      {/if}
    </div>

    <!-- Reps -->
    <div class="text-center">
      <div class="flex items-center justify-center mb-2">
        <Repeat size={20} class="{getChangeColor(exercise.baseParams.reps, adaptedParams.reps)} mr-2" />
        <svelte:component 
          this={getChangeIcon(exercise.baseParams.reps, adaptedParams.reps)} 
          size={16} 
          class="{getChangeColor(exercise.baseParams.reps, adaptedParams.reps)}"
        />
      </div>
      <p class="text-2xl font-bold text-gray-900">{adaptedParams.reps}</p>
      <p class="text-sm text-gray-600">Reps</p>
      {#if adaptedParams.reps !== exercise.baseParams.reps}
        <p class="text-xs text-gray-500">was {exercise.baseParams.reps}</p>
      {/if}
    </div>

    <!-- Sets -->
    <div class="text-center">
      <div class="flex items-center justify-center mb-2">
        <div class="w-5 h-5 bg-gray-400 rounded mr-2"></div>
      </div>
      <p class="text-2xl font-bold text-gray-900">{adaptedParams.sets}</p>
      <p class="text-sm text-gray-600">Sets</p>
    </div>

    <!-- Rest -->
    <div class="text-center">
      <div class="flex items-center justify-center mb-2">
        <Clock size={20} class="{getChangeColor(exercise.baseParams.restBetweenSets, adaptedParams.restBetweenSets)} mr-2" />
        <svelte:component 
          this={getChangeIcon(exercise.baseParams.restBetweenSets, adaptedParams.restBetweenSets)} 
          size={16} 
          class="{getChangeColor(exercise.baseParams.restBetweenSets, adaptedParams.restBetweenSets)}"
        />
      </div>
      <p class="text-2xl font-bold text-gray-900">{formatTime(adaptedParams.restBetweenSets)}</p>
      <p class="text-sm text-gray-600">Rest</p>
      {#if adaptedParams.restBetweenSets !== exercise.baseParams.restBetweenSets}
        <p class="text-xs text-gray-500">was {formatTime(exercise.baseParams.restBetweenSets)}</p>
      {/if}
    </div>
  </div>

  <!-- Reasoning -->
  {#if todaysRecommendation?.reasoning && todaysRecommendation.reasoning.length > 0}
    <div class="mb-4">
      <p class="text-sm font-medium text-gray-900 mb-2">Why these adjustments:</p>
      <div class="space-y-1">
        {#each todaysRecommendation.reasoning as reason}
          <p class="text-sm text-gray-600">• {reason}</p>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Training Suggestions -->
  {#if suggestions.length > 0}
    <div class="border-t pt-4">
      <p class="text-sm font-medium text-gray-900 mb-3">Today's Training Tips:</p>
      <div class="space-y-2">
        {#each suggestions.slice(0, 4) as suggestion}
          <div class="flex items-start">
            <div class="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p class="text-sm text-gray-700">{suggestion}</p>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>