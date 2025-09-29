<script lang="ts">
  import { onMount } from 'svelte';
  import { aiCoaching, type UserInsights } from '../lib/ai-coaching.js';

  export let userId: string;

  let insights: UserInsights | null = null;
  let userProfile: any = null;
  let loading = false;
  let error = '';

  onMount(async () => {
    await loadInsights();
    await loadUserProfile();
  });

  async function loadInsights() {
    loading = true;
    error = '';
    
    try {
      insights = await aiCoaching.getUserInsights(userId);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load insights';
      console.error('Error loading insights:', err);
    } finally {
      loading = false;
    }
  }

  async function loadUserProfile() {
    try {
      userProfile = await aiCoaching.getUserProfile(userId);
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getScoreBgColor(score: number): string {
    if (score >= 0.8) return 'bg-green-100';
    if (score >= 0.6) return 'bg-yellow-100';
    return 'bg-red-100';
  }

  function formatPercentage(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  function formatNumber(value: number): string {
    return value.toFixed(1);
  }

  function getProgressWidth(value: number): string {
    return `${Math.max(5, value * 100)}%`;
  }
</script>

<div class="ai-insights-dashboard bg-white rounded-lg shadow-lg p-6 m-4">
  <div class="flex items-center gap-2 mb-6">
    <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
      <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
      </svg>
    </div>
    <h2 class="text-xl font-bold text-gray-800">AI Insights Dashboard</h2>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      <span class="ml-2 text-gray-600">Loading your personalized insights...</span>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <div class="ml-3">
          <p class="text-sm text-red-700">{error}</p>
          <button 
            on:click={loadInsights}
            class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  {:else if insights}
    <div class="space-y-6">
      <!-- User Profile Summary -->
      {#if userProfile}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-sm font-medium text-blue-700 mb-1">Total Interactions</div>
            <div class="text-2xl font-bold text-blue-900">{userProfile.total_interactions}</div>
            <div class="text-xs text-blue-600">Learning Rate: {formatNumber(userProfile.learning_rate)}</div>
          </div>
          
          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-sm font-medium text-green-700 mb-1">Acceptance Rate</div>
            <div class="text-2xl font-bold text-green-900">{formatPercentage(userProfile.acceptance_rate)}</div>
            <div class="text-xs text-green-600">Modifications: {formatPercentage(userProfile.modification_frequency)}</div>
          </div>
          
          <div class="bg-purple-50 rounded-lg p-4">
            <div class="text-sm font-medium text-purple-700 mb-1">Workout Confidence</div>
            <div class="text-2xl font-bold text-purple-900">{formatPercentage(userProfile.workout_confidence)}</div>
            <div class="text-xs text-purple-600">Last Updated: {new Date(userProfile.last_updated).toLocaleDateString()}</div>
          </div>
        </div>
      {/if}

      <!-- Preference Summary -->
      <div class="bg-gray-50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Workout Preferences</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-sm text-gray-600 mb-1">Intensity</div>
            <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
              <span class="text-lg font-bold text-gray-800">{formatNumber(insights.preference_summary.preferred_intensity)}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-red-500 h-2 rounded-full transition-all duration-300"
                style="width: {getProgressWidth(insights.preference_summary.preferred_intensity / 10)}"
              ></div>
            </div>
          </div>

          <div class="text-center">
            <div class="text-sm text-gray-600 mb-1">Volume</div>
            <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
              <span class="text-lg font-bold text-gray-800">{formatNumber(insights.preference_summary.volume_tolerance)}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style="width: {getProgressWidth(insights.preference_summary.volume_tolerance / 10)}"
              ></div>
            </div>
          </div>

          <div class="text-center">
            <div class="text-sm text-gray-600 mb-1">Progression</div>
            <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
              <span class="text-lg font-bold text-gray-800">{formatNumber(insights.preference_summary.progression_rate)}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-green-500 h-2 rounded-full transition-all duration-300"
                style="width: {getProgressWidth(insights.preference_summary.progression_rate / 10)}"
              ></div>
            </div>
          </div>

          <div class="text-center">
            <div class="text-sm text-gray-600 mb-1">Style</div>
            <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
              <span class="text-xs font-bold text-gray-800 text-center leading-tight">
                {insights.preference_summary.workout_style.substring(0, 4).toUpperCase()}
              </span>
            </div>
            <div class="text-xs text-gray-500">{insights.preference_summary.workout_style}</div>
          </div>
        </div>
      </div>

      <!-- Performance Trends -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Performance Trends</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Acceptance Rate</span>
              <div class="flex items-center gap-2">
                <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-green-500 transition-all duration-300"
                    style="width: {getProgressWidth(insights.performance_trends.acceptance_rate)}"
                  ></div>
                </div>
                <span class="text-sm font-medium {getScoreColor(insights.performance_trends.acceptance_rate)}">
                  {formatPercentage(insights.performance_trends.acceptance_rate)}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Improvement Rate</span>
              <div class="flex items-center gap-2">
                <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-blue-500 transition-all duration-300"
                    style="width: {getProgressWidth(insights.performance_trends.improvement_rate)}"
                  ></div>
                </div>
                <span class="text-sm font-medium {getScoreColor(insights.performance_trends.improvement_rate)}">
                  {formatPercentage(insights.performance_trends.improvement_rate)}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Consistency Score</span>
              <div class="flex items-center gap-2">
                <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-purple-500 transition-all duration-300"
                    style="width: {getProgressWidth(insights.performance_trends.consistency_score)}"
                  ></div>
                </div>
                <span class="text-sm font-medium {getScoreColor(insights.performance_trends.consistency_score)}">
                  {formatPercentage(insights.performance_trends.consistency_score)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">AI Effectiveness</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Accuracy</span>
              <span class="text-sm font-medium {getScoreColor(insights.ai_effectiveness.recommendation_accuracy)}">
                {formatPercentage(insights.ai_effectiveness.recommendation_accuracy)}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">User Satisfaction</span>
              <span class="text-sm font-medium {getScoreColor(insights.ai_effectiveness.user_satisfaction)}">
                {formatPercentage(insights.ai_effectiveness.user_satisfaction)}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Personalization</span>
              <span class="text-sm font-medium {getScoreColor(insights.ai_effectiveness.personalization_level)}">
                {formatPercentage(insights.ai_effectiveness.personalization_level)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Strengths & Weaknesses -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            Strong Areas
          </h3>
          <div class="space-y-2">
            {#each insights.performance_trends.strong_areas as area}
              <div class="bg-green-100 text-green-800 px-3 py-2 rounded-md text-sm">
                {area}
              </div>
            {/each}
          </div>
        </div>

        <div class="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            Areas for Improvement
          </h3>
          <div class="space-y-2">
            {#each insights.performance_trends.weak_areas as area}
              <div class="bg-orange-100 text-orange-800 px-3 py-2 rounded-md text-sm">
                {area}
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Next Focus Areas -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          Recommended Focus Areas
        </h3>
        <div class="flex flex-wrap gap-2">
          {#each insights.next_focus_areas as area}
            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {area}
            </span>
          {/each}
        </div>
      </div>

      <!-- Refresh Button -->
      <div class="text-center pt-4">
        <button 
          on:click={() => { loadInsights(); loadUserProfile(); }}
          class="bg-purple-500 hover:bg-purple-600 text-white py-2 px-6 rounded-md text-sm font-medium transition-colors"
        >
          Refresh Insights
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .ai-insights-dashboard {
    max-width: 900px;
  }
</style>