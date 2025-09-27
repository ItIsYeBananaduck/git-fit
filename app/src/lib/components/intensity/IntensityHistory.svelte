<!--
  IntensityHistory.svelte
  Phase 3.5 - Frontend Components
  
  Historical workout data visualization component showing intensity
  trends, performance analytics, and progress over time.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { intensityScoring } from '$lib/services/intensityScoring';
  import { api } from '$lib/convex';
  
  // Chart library (we'll use a simple custom implementation for now)
  interface ChartDataPoint {
    date: Date;
    averageIntensity: number;
    peakIntensity: number;
    workoutDuration: number;
    exerciseType: string;
    totalSets: number;
    targetAchieved: boolean;
  }

  interface HistoryFilters {
    timeRange: '7d' | '30d' | '3m' | '1y' | 'all';
    exerciseType: 'all' | 'strength' | 'cardio' | 'flexibility';
    sortBy: 'date' | 'intensity' | 'duration';
    sortOrder: 'asc' | 'desc';
  }

  // Props
  export let userId: string;
  export let isVisible: boolean = true;

  // State
  let workoutHistory: ChartDataPoint[] = [];
  let filteredHistory: ChartDataPoint[] = [];
  let isLoading = true;
  let error: string | null = null;
  
  let filters: HistoryFilters = {
    timeRange: '30d',
    exerciseType: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  };

  // Statistics
  let stats = {
    totalWorkouts: 0,
    averageIntensity: 0,
    bestIntensity: 0,
    totalDuration: 0,
    targetAchievementRate: 0,
    improvementTrend: 0
  };

  let selectedWorkout: ChartDataPoint | null = null;
  let viewMode: 'chart' | 'list' | 'calendar' = 'chart';

  onMount(() => {
    loadWorkoutHistory();
  });

  async function loadWorkoutHistory() {
    try {
      isLoading = true;
      error = null;

      // Fetch workout history from Convex
      const workouts = await api.intensity.getWorkoutHistory({ userId, limit: 100 });
      
      // Transform data into chart format
      workoutHistory = workouts.map(workout => ({
        date: new Date(workout._creationTime),
        averageIntensity: workout.averageIntensity || 0,
        peakIntensity: workout.peakIntensity || 0,
        workoutDuration: workout.duration || 0,
        exerciseType: workout.exerciseType || 'strength',
        totalSets: workout.sets?.length || 0,
        targetAchieved: (workout.averageIntensity || 0) >= 60 && (workout.averageIntensity || 0) <= 85
      }));

      applyFilters();
      calculateStats();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load workout history';
      console.error('Error loading workout history:', err);
    } finally {
      isLoading = false;
    }
  }

  function applyFilters() {
    let filtered = [...workoutHistory];

    // Time range filter
    const now = new Date();
    const timeRangeMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '3m': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };

    if (filters.timeRange !== 'all') {
      const cutoff = new Date(now.getTime() - timeRangeMs[filters.timeRange]);
      filtered = filtered.filter(workout => workout.date >= cutoff);
    }

    // Exercise type filter
    if (filters.exerciseType !== 'all') {
      filtered = filtered.filter(workout => workout.exerciseType === filters.exerciseType);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (filters.sortBy) {
        case 'intensity':
          aVal = a.averageIntensity;
          bVal = b.averageIntensity;
          break;
        case 'duration':
          aVal = a.workoutDuration;
          bVal = b.workoutDuration;
          break;
        case 'date':
        default:
          aVal = a.date.getTime();
          bVal = b.date.getTime();
          break;
      }

      const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return filters.sortOrder === 'desc' ? -result : result;
    });

    filteredHistory = filtered;
  }

  function calculateStats() {
    if (filteredHistory.length === 0) {
      stats = {
        totalWorkouts: 0,
        averageIntensity: 0,
        bestIntensity: 0,
        totalDuration: 0,
        targetAchievementRate: 0,
        improvementTrend: 0
      };
      return;
    }

    stats.totalWorkouts = filteredHistory.length;
    stats.averageIntensity = filteredHistory.reduce((sum, w) => sum + w.averageIntensity, 0) / filteredHistory.length;
    stats.bestIntensity = Math.max(...filteredHistory.map(w => w.peakIntensity));
    stats.totalDuration = filteredHistory.reduce((sum, w) => sum + w.workoutDuration, 0);
    stats.targetAchievementRate = (filteredHistory.filter(w => w.targetAchieved).length / filteredHistory.length) * 100;

    // Calculate improvement trend (last 7 workouts vs previous 7)
    if (filteredHistory.length >= 14) {
      const recent = filteredHistory.slice(0, 7);
      const previous = filteredHistory.slice(7, 14);
      const recentAvg = recent.reduce((sum, w) => sum + w.averageIntensity, 0) / recent.length;
      const previousAvg = previous.reduce((sum, w) => sum + w.averageIntensity, 0) / previous.length;
      stats.improvementTrend = ((recentAvg - previousAvg) / previousAvg) * 100;
    }
  }

  // Reactive updates
  $: {
    applyFilters();
    calculateStats();
  }

  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  function getIntensityColor(intensity: number): string {
    if (intensity >= 85) return 'text-red-400';
    if (intensity >= 70) return 'text-orange-400';
    if (intensity >= 60) return 'text-green-400';
    if (intensity >= 40) return 'text-yellow-400';
    return 'text-blue-400';
  }

  function getIntensityBgColor(intensity: number): string {
    if (intensity >= 85) return 'bg-red-400';
    if (intensity >= 70) return 'bg-orange-400';
    if (intensity >= 60) return 'bg-green-400';
    if (intensity >= 40) return 'bg-yellow-400';
    return 'bg-blue-400';
  }

  function selectWorkout(workout: ChartDataPoint) {
    selectedWorkout = workout;
  }

  function refreshData() {
    loadWorkoutHistory();
  }
</script>

{#if isVisible}
  <div class="bg-gray-900 text-white rounded-xl p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold">Intensity History</h2>
        <p class="text-sm text-gray-400">Track your workout intensity over time</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          on:click={refreshData}
          class="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh data"
        >
          🔄
        </button>
        
        <!-- View Mode Toggle -->
        <div class="flex bg-gray-800 rounded-lg overflow-hidden">
          <button
            class="px-3 py-2 text-sm transition-colors"
            class:bg-blue-600={viewMode === 'chart'}
            class:text-white={viewMode === 'chart'}
            class:text-gray-400={viewMode !== 'chart'}
            on:click={() => viewMode = 'chart'}
          >
            📊 Chart
          </button>
          <button
            class="px-3 py-2 text-sm transition-colors"
            class:bg-blue-600={viewMode === 'list'}
            class:text-white={viewMode === 'list'}
            class:text-gray-400={viewMode !== 'list'}
            on:click={() => viewMode = 'list'}
          >
            📋 List
          </button>
          <button
            class="px-3 py-2 text-sm transition-colors"
            class:bg-blue-600={viewMode === 'calendar'}
            class:text-white={viewMode === 'calendar'}
            class:text-gray-400={viewMode !== 'calendar'}
            on:click={() => viewMode = 'calendar'}
          >
            📅 Calendar
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 p-4 bg-gray-800 rounded-lg">
      <!-- Time Range -->
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-400">Period:</label>
        <select 
          bind:value={filters.timeRange}
          class="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="3m">Last 3 months</option>
          <option value="1y">Last year</option>
          <option value="all">All time</option>
        </select>
      </div>

      <!-- Exercise Type -->
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-400">Type:</label>
        <select 
          bind:value={filters.exerciseType}
          class="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All exercises</option>
          <option value="strength">Strength</option>
          <option value="cardio">Cardio</option>
          <option value="flexibility">Flexibility</option>
        </select>
      </div>

      <!-- Sort -->
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-400">Sort:</label>
        <select 
          bind:value={filters.sortBy}
          class="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Date</option>
          <option value="intensity">Intensity</option>
          <option value="duration">Duration</option>
        </select>
        <button
          class="p-1 hover:bg-gray-600 rounded transition-colors"
          on:click={() => filters.sortOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc'}
        >
          {filters.sortOrder === 'asc' ? '⬆️' : '⬇️'}
        </button>
      </div>
    </div>

    {#if isLoading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span class="ml-3 text-gray-400">Loading workout history...</span>
      </div>
    {:else if error}
      <div class="p-6 bg-red-900/20 border border-red-500/20 rounded-lg text-center">
        <p class="text-red-400 mb-2">⚠️ Error loading data</p>
        <p class="text-sm text-gray-400">{error}</p>
        <button 
          on:click={refreshData}
          class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    {:else if filteredHistory.length === 0}
      <div class="p-12 text-center">
        <div class="text-6xl mb-4">📊</div>
        <h3 class="text-lg font-semibold mb-2">No workout data found</h3>
        <p class="text-gray-400 mb-4">Start tracking your workouts to see intensity history here</p>
        <button 
          class="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          on:click={() => window.location.href = '/workouts/new'}
        >
          Start a Workout
        </button>
      </div>
    {:else}
      
      <!-- Statistics Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="p-4 bg-gray-800 rounded-lg">
          <div class="text-2xl font-bold text-blue-400">{stats.totalWorkouts}</div>
          <div class="text-sm text-gray-400">Total Workouts</div>
        </div>
        <div class="p-4 bg-gray-800 rounded-lg">
          <div class="text-2xl font-bold text-green-400">{stats.averageIntensity.toFixed(1)}%</div>
          <div class="text-sm text-gray-400">Avg Intensity</div>
        </div>
        <div class="p-4 bg-gray-800 rounded-lg">
          <div class="text-2xl font-bold text-orange-400">{stats.bestIntensity.toFixed(1)}%</div>
          <div class="text-sm text-gray-400">Best Intensity</div>
        </div>
        <div class="p-4 bg-gray-800 rounded-lg">
          <div class="text-2xl font-bold text-purple-400">{formatDuration(stats.totalDuration)}</div>
          <div class="text-sm text-gray-400">Total Time</div>
        </div>
        <div class="p-4 bg-gray-800 rounded-lg">
          <div class="text-2xl font-bold text-yellow-400">{stats.targetAchievementRate.toFixed(1)}%</div>
          <div class="text-sm text-gray-400">Target Hit Rate</div>
        </div>
        <div class="p-4 bg-gray-800 rounded-lg">
          <div class="text-2xl font-bold" class:text-green-400={stats.improvementTrend > 0} class:text-red-400={stats.improvementTrend < 0} class:text-gray-400={stats.improvementTrend === 0}>
            {stats.improvementTrend > 0 ? '+' : ''}{stats.improvementTrend.toFixed(1)}%
          </div>
          <div class="text-sm text-gray-400">Trend</div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Chart/List/Calendar View -->
        <div class="lg:col-span-2">
          {#if viewMode === 'chart'}
            <!-- Simple Chart Visualization -->
            <div class="bg-gray-800 rounded-lg p-6">
              <h3 class="text-lg font-semibold mb-4">Intensity Trend</h3>
              
              <!-- Chart Area -->
              <div class="relative h-64 bg-gray-900 rounded-lg p-4 overflow-hidden">
                <!-- Grid lines -->
                <div class="absolute inset-4">
                  {#each Array(5) as _, i}
                    <div 
                      class="absolute w-full border-t border-gray-700"
                      style="top: {i * 25}%"
                    ></div>
                    <div class="absolute left-0 text-xs text-gray-500" style="top: {i * 25 - 2}%">
                      {100 - i * 25}%
                    </div>
                  {/each}
                </div>
                
                <!-- Data points -->
                <div class="relative h-full">
                  {#each filteredHistory.slice(-20) as workout, i}
                    <button
                      class="absolute w-3 h-3 rounded-full border-2 border-white hover:scale-150 transition-transform cursor-pointer"
                      class:bg-red-400={workout.averageIntensity >= 85}
                      class:bg-orange-400={workout.averageIntensity >= 70 && workout.averageIntensity < 85}
                      class:bg-green-400={workout.averageIntensity >= 60 && workout.averageIntensity < 70}
                      class:bg-yellow-400={workout.averageIntensity >= 40 && workout.averageIntensity < 60}
                      class:bg-blue-400={workout.averageIntensity < 40}
                      style="left: {(i / Math.max(1, filteredHistory.slice(-20).length - 1)) * 100}%; bottom: {workout.averageIntensity}%; transform: translate(-50%, 50%)"
                      on:click={() => selectWorkout(workout)}
                      title="{workout.date.toLocaleDateString()}: {workout.averageIntensity.toFixed(1)}%"
                    >
                    </button>
                  {/each}
                </div>
              </div>
              
              <!-- Legend -->
              <div class="flex items-center justify-center gap-4 mt-4 text-sm">
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span class="text-gray-400">Very High (85%+)</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-orange-400 rounded-full"></div>
                  <span class="text-gray-400">High (70-84%)</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span class="text-gray-400">Target (60-69%)</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span class="text-gray-400">Moderate (40-59%)</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span class="text-gray-400">Low (<40%)</span>
                </div>
              </div>
            </div>
          
          {:else if viewMode === 'list'}
            <!-- List View -->
            <div class="bg-gray-800 rounded-lg overflow-hidden">
              <div class="p-4 border-b border-gray-700">
                <h3 class="text-lg font-semibold">Workout Sessions</h3>
              </div>
              
              <div class="max-h-96 overflow-y-auto">
                {#each filteredHistory as workout, i}
                  <button
                    class="w-full p-4 border-b border-gray-700 hover:bg-gray-700 transition-colors text-left"
                    class:bg-gray-700={selectedWorkout === workout}
                    on:click={() => selectWorkout(workout)}
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-3 h-3 rounded-full {getIntensityBgColor(workout.averageIntensity)}"></div>
                        <div>
                          <div class="font-medium">{workout.date.toLocaleDateString()}</div>
                          <div class="text-sm text-gray-400">{workout.exerciseType} • {workout.totalSets} sets</div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="font-bold {getIntensityColor(workout.averageIntensity)}">
                          {workout.averageIntensity.toFixed(1)}%
                        </div>
                        <div class="text-sm text-gray-400">
                          {formatDuration(workout.workoutDuration)}
                        </div>
                      </div>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          
          {:else if viewMode === 'calendar'}
            <!-- Calendar View (simplified) -->
            <div class="bg-gray-800 rounded-lg p-6">
              <h3 class="text-lg font-semibold mb-4">Workout Calendar</h3>
              
              <!-- Calendar grid would go here - simplified for now -->
              <div class="grid grid-cols-7 gap-2 text-center text-sm">
                <div class="p-2 text-gray-400 font-medium">Sun</div>
                <div class="p-2 text-gray-400 font-medium">Mon</div>
                <div class="p-2 text-gray-400 font-medium">Tue</div>
                <div class="p-2 text-gray-400 font-medium">Wed</div>
                <div class="p-2 text-gray-400 font-medium">Thu</div>
                <div class="p-2 text-gray-400 font-medium">Fri</div>
                <div class="p-2 text-gray-400 font-medium">Sat</div>
                
                <!-- Calendar days would be generated here -->
                {#each Array(35) as _, day}
                  <div class="aspect-square p-1">
                    <div class="w-full h-full rounded bg-gray-700 flex items-center justify-center text-xs">
                      {((day % 31) + 1)}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- Workout Detail Panel -->
        <div class="bg-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">
            {selectedWorkout ? 'Workout Details' : 'Select a Workout'}
          </h3>
          
          {#if selectedWorkout}
            <div class="space-y-4">
              <!-- Date and Type -->
              <div>
                <div class="text-sm text-gray-400">Date</div>
                <div class="font-medium">{selectedWorkout.date.toLocaleDateString()}</div>
              </div>
              
              <!-- Intensity Scores -->
              <div>
                <div class="text-sm text-gray-400 mb-2">Intensity</div>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span>Average:</span>
                    <span class="font-bold {getIntensityColor(selectedWorkout.averageIntensity)}">
                      {selectedWorkout.averageIntensity.toFixed(1)}%
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span>Peak:</span>
                    <span class="font-bold {getIntensityColor(selectedWorkout.peakIntensity)}">
                      {selectedWorkout.peakIntensity.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Workout Stats -->
              <div>
                <div class="text-sm text-gray-400 mb-2">Statistics</div>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span>Duration:</span>
                    <span>{formatDuration(selectedWorkout.workoutDuration)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Exercise Type:</span>
                    <span class="capitalize">{selectedWorkout.exerciseType}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Total Sets:</span>
                    <span>{selectedWorkout.totalSets}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Target Achieved:</span>
                    <span class="text-green-400">{selectedWorkout.targetAchieved ? '✅ Yes' : '❌ No'}</span>
                  </div>
                </div>
              </div>
              
              <!-- Progress Indicator -->
              <div class="pt-4 border-t border-gray-700">
                <div class="text-sm text-gray-400 mb-2">Intensity Distribution</div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    class="h-2 rounded-full {getIntensityBgColor(selectedWorkout.averageIntensity)}"
                    style="width: {selectedWorkout.averageIntensity}%"
                  ></div>
                </div>
              </div>
            </div>
          {:else}
            <div class="text-center text-gray-400 py-8">
              <div class="text-4xl mb-2">📊</div>
              <p>Click on a workout to view details</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}