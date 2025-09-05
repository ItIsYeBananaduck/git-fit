<script lang="ts">
  import AdaptiveWorkoutCard from '$lib/components/AdaptiveWorkoutCard.svelte';
  import ProgressionAnalytics from '$lib/components/ProgressionAnalytics.svelte';
  import WHOOPDataDisplay from '$lib/components/WHOOPDataDisplay.svelte';
  import { whoopState } from '$lib/stores/whoop';
  import { Brain, Target, TrendingUp, Zap } from 'lucide-svelte';

  let selectedExercise = 'Bench Press';
  
  const exercises = [
    {
      name: 'Bench Press',
      baseParams: {
        load: 80,
        reps: 8,
        sets: 3,
        restBetweenSets: 90,
        restBetweenExercises: 180,
        intensity: 'moderate'
      }
    },
    {
      name: 'Squat',
      baseParams: {
        load: 75,
        reps: 10,
        sets: 3,
        restBetweenSets: 120,
        restBetweenExercises: 180,
        intensity: 'moderate'
      }
    },
    {
      name: 'Deadlift',
      baseParams: {
        load: 85,
        reps: 5,
        sets: 3,
        restBetweenSets: 180,
        restBetweenExercises: 240,
        intensity: 'high'
      }
    }
  ];

  $: whoopConnected = $whoopState.isConnected;
  $: selectedExerciseData = exercises.find(e => e.name === selectedExercise) || exercises[0];
</script>

<svelte:head>
  <title>Adaptive Training - GitFit</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center mb-4">
        <Brain size={32} class="text-blue-600 mr-3" />
        <h1 class="text-3xl font-bold text-gray-900">Adaptive Training System</h1>
      </div>
      <p class="text-lg text-gray-600">
        AI-powered workout adjustments based on your WHOOP recovery, strain, and adaptation patterns
      </p>
    </div>

    <!-- How It Works Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
          <Zap size={24} class="text-blue-600" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Daily Assessment</h3>
        <p class="text-gray-600">
          Analyzes your WHOOP recovery, strain, and HRV to determine optimal training intensity for today
        </p>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
          <Target size={24} class="text-green-600" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Smart Adjustments</h3>
        <p class="text-gray-600">
          Automatically modifies load, reps, sets, and rest periods based on your body's readiness
        </p>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
          <TrendingUp size={24} class="text-purple-600" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Progressive Learning</h3>
        <p class="text-gray-600">
          Learns your adaptation patterns over time to optimize long-term progression and prevent plateaus
        </p>
      </div>
    </div>

    <!-- WHOOP Data Overview -->
    {#if whoopConnected}
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Today's Readiness</h2>
        <WHOOPDataDisplay compact={true} />
      </div>
    {:else}
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <div class="flex">
          <svg class="w-5 h-5 text-yellow-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div>
            <h3 class="text-sm font-medium text-yellow-800">Connect WHOOP for Personalized Training</h3>
            <p class="text-sm text-yellow-700 mt-1">
              Connect your WHOOP device to enable AI-powered workout adjustments based on your recovery data.
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Exercise Selection -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Select Exercise</h2>
      <div class="flex space-x-2">
        {#each exercises as exercise}
          <button
            class="px-4 py-2 rounded-lg font-medium transition-colors {
              selectedExercise === exercise.name
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }"
            on:click={() => selectedExercise = exercise.name}
          >
            {exercise.name}
          </button>
        {/each}
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Adaptive Workout Card -->
      <div>
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Today's Workout</h2>
        <AdaptiveWorkoutCard exercise={selectedExerciseData} />
      </div>

      <!-- Progression Analytics -->
      <div>
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Progress Tracking</h2>
        <ProgressionAnalytics exercise={selectedExercise} />
      </div>
    </div>

    <!-- Algorithm Details -->
    <div class="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">How the Algorithm Works</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 class="font-medium text-gray-900 mb-3">Recovery-Based Adjustments</h4>
          <div class="space-y-2 text-sm text-gray-600">
            <div class="flex justify-between">
              <span>Recovery &lt; 30%:</span>
              <span class="font-medium text-red-600">Complete rest</span>
            </div>
            <div class="flex justify-between">
              <span>Recovery 30-50%:</span>
              <span class="font-medium text-yellow-600">Light activity (-35% load)</span>
            </div>
            <div class="flex justify-between">
              <span>Recovery 50-70%:</span>
              <span class="font-medium text-blue-600">Moderate training (-15% load)</span>
            </div>
            <div class="flex justify-between">
              <span>Recovery &gt; 70%:</span>
              <span class="font-medium text-green-600">High intensity ready</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 class="font-medium text-gray-900 mb-3">Progressive Adaptation</h4>
          <div class="space-y-2 text-sm text-gray-600">
            <div class="flex items-center">
              <div class="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              <span>Completion rate &gt; 85% → Load +2.5%</span>
            </div>
            <div class="flex items-center">
              <div class="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
              <span>Recovery trending up → Add volume</span>
            </div>
            <div class="flex items-center">
              <div class="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
              <span>High strain days → Auto rest</span>
            </div>
            <div class="flex items-center">
              <div class="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
              <span>Poor adaptation → Reduce load -5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>