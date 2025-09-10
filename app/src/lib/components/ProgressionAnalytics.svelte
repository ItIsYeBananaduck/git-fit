<script lang="ts">
  import { onMount } from 'svelte';
  import { AdaptiveTrainingEngine } from '$lib/services/adaptiveTraining';
  import type { WorkoutSession } from '$lib/services/adaptiveTraining';
  import { TrendingUp, TrendingDown, Target, Calendar, Award } from 'lucide-svelte';

  export let exercise = 'Bench Press';
  export let userId = 'user-123';

  let adaptiveEngine: AdaptiveTrainingEngine;
  let progressionData: any = null;
  let mockSessions: WorkoutSession[] = [];
  let isLoading = true;

  onMount(() => {
    adaptiveEngine = new AdaptiveTrainingEngine(userId);
    loadProgressionData();
  });

  function loadProgressionData() {
    // Mock recent sessions with realistic progression data
    mockSessions = generateMockSessions();
    
    progressionData = adaptiveEngine.calculateProgressionAdjustments(
      exercise,
      mockSessions,
      28
    );
    
    isLoading = false;
  }

  function generateMockSessions(): WorkoutSession[] {
    const sessions: WorkoutSession[] = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 2)); // Every 2 days
      
      // Simulate progression over time
      const baseRecovery = 60 + (i * 2); // Recovery improving over time
      const baseLoad = 75 + (i * 0.5); // Gradual load increase
      const completionRate = 0.8 + (i * 0.02); // Improving completion
      
      sessions.push({
        id: `session-${i}`,
        userId,
        date: date.toISOString(),
        exerciseId: exercise,
        plannedParams: {
          load: Math.round(baseLoad),
          reps: 8,
          sets: 3,
          restBetweenSets: 90,
          restBetweenExercises: 180,
          intensity: 'moderate'
        },
        actualParams: {
          load: Math.round(baseLoad * 0.95), // Slightly lower than planned
          reps: 8,
          sets: 3,
          restBetweenSets: 95,
          restBetweenExercises: 185,
          intensity: 'moderate'
        },
        completedReps: [8, 7, 6].map(r => Math.floor(r * completionRate)),
        perceivedEffort: Math.max(4, Math.min(8, 6 - (i * 0.1))), // RPE improving
        recoveryBefore: Math.min(90, baseRecovery),
        strainAfter: Math.max(8, 15 - (i * 0.3)),
        adaptationScore: 0.5 + (i * 0.04) // Improving adaptation
      });
    }
    
    return sessions;
  }

  function getProgressionTrend(): 'improving' | 'stable' | 'declining' {
    if (!progressionData) return 'stable';
    
    if (progressionData.loadProgression > 0.01 || progressionData.volumeProgression > 0) {
      return 'improving';
    } else if (progressionData.loadProgression < -0.01) {
      return 'declining';
    }
    return 'stable';
  }

  function getTrendColor(trend: string): string {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  }

  function formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  function calculateWeeklyStats() {
    const recentSessions = mockSessions.slice(0, 7);
    const completionRates = recentSessions.map(s => {
      const completed = s.completedReps?.reduce((a, b) => a + b, 0) || 0;
      const planned = s.plannedParams.reps * s.plannedParams.sets;
      return completed / planned;
    });
    
    const avgCompletion = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
    const avgRecovery = recentSessions.reduce((sum, s) => sum + (s.recoveryBefore || 0), 0) / recentSessions.length;
    const avgEffort = recentSessions.reduce((sum, s) => sum + (s.perceivedEffort || 0), 0) / recentSessions.length;
    
    return {
      completion: avgCompletion,
      recovery: avgRecovery,
      effort: avgEffort,
      sessions: recentSessions.length
    };
  }

  $: weeklyStats = calculateWeeklyStats();
  $: trend = getProgressionTrend();
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <div class="flex items-center justify-between mb-6">
    <h3 class="text-lg font-semibold text-gray-900">Progression Analytics</h3>
    <div class="text-sm text-gray-500">{exercise}</div>
  </div>

  {#if isLoading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>
  {:else}
    <!-- Progression Status -->
    <div class="mb-6 p-4 bg-gray-50 rounded-lg">
      <div class="flex items-center mb-2">
        {#if trend === 'improving'}
          <TrendingUp size={20} class="text-green-600 mr-2" />
        {:else if trend === 'declining'}
          <TrendingDown size={20} class="text-red-600 mr-2" />
        {:else}
          <Target size={20} class="text-yellow-600 mr-2" />
        {/if}
        <span class="font-medium {getTrendColor(trend)}">
          {trend === 'improving' ? 'Progressing Well' : 
           trend === 'declining' ? 'Need Recovery' : 
           'Maintaining'}
        </span>
      </div>
      <p class="text-sm text-gray-700">{progressionData?.reasoning}</p>
    </div>

    <!-- Weekly Stats Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="text-center p-3 bg-blue-50 rounded-lg">
        <Calendar size={24} class="mx-auto mb-2 text-blue-600" />
        <p class="text-2xl font-bold text-gray-900">{weeklyStats.sessions}</p>
        <p class="text-sm text-gray-600">Sessions</p>
        <p class="text-xs text-gray-500">this week</p>
      </div>

      <div class="text-center p-3 bg-green-50 rounded-lg">
        <Award size={24} class="mx-auto mb-2 text-green-600" />
        <p class="text-2xl font-bold text-gray-900">{Math.round(weeklyStats.completion * 100)}%</p>
        <p class="text-sm text-gray-600">Completion</p>
        <p class="text-xs text-gray-500">avg rate</p>
      </div>

      <div class="text-center p-3 bg-purple-50 rounded-lg">
        <Target size={24} class="mx-auto mb-2 text-purple-600" />
        <p class="text-2xl font-bold text-gray-900">{Math.round(weeklyStats.recovery)}%</p>
        <p class="text-sm text-gray-600">Recovery</p>
        <p class="text-xs text-gray-500">avg score</p>
      </div>

      <div class="text-center p-3 bg-yellow-50 rounded-lg">
        <div class="w-6 h-6 bg-yellow-600 rounded mx-auto mb-2 flex items-center justify-center">
          <span class="text-white text-xs font-bold">RPE</span>
        </div>
        <p class="text-2xl font-bold text-gray-900">{weeklyStats.effort.toFixed(1)}</p>
        <p class="text-sm text-gray-600">Effort</p>
        <p class="text-xs text-gray-500">avg RPE</p>
      </div>
    </div>

    <!-- Next Progression -->
    {#if progressionData?.shouldProgress}
      <div class="border-t pt-4">
        <p class="text-sm font-medium text-gray-900 mb-3">Next Progression:</p>
        <div class="space-y-2">
          {#if progressionData.loadProgression !== 0}
            <div class="flex items-center justify-between p-3 bg-blue-50 rounded">
              <span class="text-sm font-medium text-blue-900">Load Adjustment</span>
              <span class="text-sm font-bold text-blue-800">
                {progressionData.loadProgression > 0 ? '+' : ''}{formatPercentage(progressionData.loadProgression)}
              </span>
            </div>
          {/if}
          {#if progressionData.volumeProgression !== 0}
            <div class="flex items-center justify-between p-3 bg-green-50 rounded">
              <span class="text-sm font-medium text-green-900">Volume Adjustment</span>
              <span class="text-sm font-bold text-green-800">
                {progressionData.volumeProgression > 0 ? '+' : ''}{progressionData.volumeProgression} reps
              </span>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Training Tips -->
    <div class="border-t pt-4 mt-4">
      <p class="text-sm font-medium text-gray-900 mb-3">Optimization Tips:</p>
      <div class="space-y-2">
        {#if weeklyStats.completion < 0.8}
          <div class="flex items-start">
            <div class="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p class="text-sm text-gray-700">Consider reducing load by 5-10% to improve completion rate</p>
          </div>
        {/if}
        {#if weeklyStats.recovery < 60}
          <div class="flex items-start">
            <div class="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p class="text-sm text-gray-700">Focus on recovery - consider extra rest days</p>
          </div>
        {/if}
        {#if weeklyStats.effort < 5}
          <div class="flex items-start">
            <div class="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p class="text-sm text-gray-700">RPE is low - ready for progression challenge</p>
          </div>
        {/if}
        {#if trend === 'improving'}
          <div class="flex items-start">
            <div class="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p class="text-sm text-gray-700">Great progress! Maintain current training consistency</p>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>