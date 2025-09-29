<script lang="ts">
  import { onMount } from 'svelte';
  import { aiCoaching, type AIRecommendation, type ExerciseData, type WorkoutContext, createFeedback } from '../lib/ai-coaching.js';

  export let userId: string;
  export let exerciseData: ExerciseData;
  export let workoutContext: WorkoutContext;
  export let onFeedbackSubmitted: (feedback: any) => void = () => {};

  let recommendation: AIRecommendation | null = null;
  let loading = false;
  let error = '';
  let showFeedbackForm = false;
  let feedbackSubmitted = false;

  // Feedback form state
  let accepted = false;
  let modified = false;
  let skipped = false;
  let difficultyRating = 5;
  let effectivenessRating = 5;
  let perceivedExertion = 5;
  let formQuality = 5;
  let notes = '';

  onMount(async () => {
    await loadRecommendation();
  });

  async function loadRecommendation() {
    loading = true;
    error = '';
    
    try {
      recommendation = await aiCoaching.getRecommendation(
        userId, 
        exerciseData, 
        workoutContext,
        'exercise_start'
      );
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load AI recommendation';
      console.error('Error loading recommendation:', err);
    } finally {
      loading = false;
    }
  }

  async function handleAccept() {
    if (!recommendation) return;
    
    accepted = true;
    await submitFeedback();
  }

  async function handleDecline() {
    if (!recommendation) return;
    
    skipped = true;
    showFeedbackForm = true;
  }

  async function handleModify() {
    if (!recommendation) return;
    
    modified = true;
    showFeedbackForm = true;
  }

  async function submitFeedback() {
    if (!recommendation) return;

    try {
      const feedbackData = createFeedback(
        userId,
        recommendation.id,
        accepted,
        {
          modified,
          skipped,
          difficultyRating,
          effectivenessRating,
          perceivedExertion,
          formQuality,
          notes
        }
      );

      await aiCoaching.provideFeedback(feedbackData);
      feedbackSubmitted = true;
      onFeedbackSubmitted(feedbackData);
      
      // Hide form after successful submission
      setTimeout(() => {
        showFeedbackForm = false;
      }, 2000);

    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to submit feedback';
      console.error('Error submitting feedback:', err);
    }
  }

  function getRiskColor(risk: string): string {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  function getConfidenceWidth(confidence: number): string {
    return `${Math.max(10, confidence * 100)}%`;
  }
</script>

<div class="ai-recommendation-card bg-white rounded-lg shadow-lg p-6 m-4 border-l-4 border-blue-500">
  <div class="flex items-center gap-2 mb-4">
    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
      <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
      </svg>
    </div>
    <h3 class="text-lg font-semibold text-gray-800">AI Coach Recommendation</h3>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span class="ml-2 text-gray-600">Getting personalized recommendation...</span>
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
            on:click={loadRecommendation}
            class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  {:else if recommendation}
    <div class="space-y-4">
      <!-- Recommendation Header -->
      <div class="flex items-start justify-between">
        <div>
          <h4 class="font-medium text-gray-900 capitalize">
            {recommendation.type.replace(/_/g, ' ')}
          </h4>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-sm text-gray-600">
              {recommendation.original_value} → {recommendation.suggested_value}
            </span>
            <span class="text-xs px-2 py-1 rounded-full {getRiskColor(recommendation.risk_assessment)} bg-gray-100">
              {recommendation.risk_assessment} risk
            </span>
          </div>
        </div>
        
        <!-- Confidence Indicator -->
        <div class="text-right">
          <div class="text-sm text-gray-600 mb-1">Confidence</div>
          <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              class="h-full bg-blue-500 transition-all duration-300"
              style="width: {getConfidenceWidth(recommendation.confidence)}"
            ></div>
          </div>
          <div class="text-xs text-gray-500 mt-1">{Math.round(recommendation.confidence * 100)}%</div>
        </div>
      </div>

      <!-- Reasoning -->
      <div class="bg-blue-50 rounded-md p-3">
        <p class="text-sm text-blue-800">{recommendation.reasoning}</p>
      </div>

      <!-- Factors -->
      {#if recommendation.factors.length > 0}
        <div>
          <h5 class="text-sm font-medium text-gray-700 mb-2">Key Factors:</h5>
          <div class="flex flex-wrap gap-2">
            {#each recommendation.factors as factor}
              <span class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                {factor}
              </span>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Expected Outcome -->
      <div class="border-t pt-3">
        <h5 class="text-sm font-medium text-gray-700 mb-1">Expected Outcome:</h5>
        <p class="text-sm text-gray-600">{recommendation.expected_outcome}</p>
      </div>

      <!-- Alternative Options -->
      {#if recommendation.alternative_options && recommendation.alternative_options.length > 0}
        <details class="border-t pt-3">
          <summary class="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
            Alternative Options ({recommendation.alternative_options.length})
          </summary>
          <div class="mt-2 space-y-2">
            {#each recommendation.alternative_options as alt}
              <div class="text-xs bg-gray-50 p-2 rounded">
                <span class="font-medium">{alt.type.replace(/_/g, ' ')}: {alt.value}</span>
                <p class="text-gray-600 mt-1">{alt.reasoning}</p>
              </div>
            {/each}
          </div>
        </details>
      {/if}

      <!-- Action Buttons -->
      {#if !feedbackSubmitted && !showFeedbackForm}
        <div class="flex gap-2 pt-4 border-t">
          <button 
            on:click={handleAccept}
            class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            Accept
          </button>
          <button 
            on:click={handleModify}
            class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            Modify
          </button>
          <button 
            on:click={handleDecline}
            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            Skip
          </button>
        </div>
      {/if}

      <!-- Feedback Form -->
      {#if showFeedbackForm && !feedbackSubmitted}
        <div class="border-t pt-4 space-y-3">
          <h5 class="font-medium text-gray-800">Feedback</h5>
          
          <!-- Rating Sliders -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Difficulty (1-10)
              </label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                bind:value={difficultyRating}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div class="text-center text-xs text-gray-500">{difficultyRating}</div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Effectiveness (1-10)
              </label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                bind:value={effectivenessRating}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div class="text-center text-xs text-gray-500">{effectivenessRating}</div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Perceived Exertion (1-10)
              </label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                bind:value={perceivedExertion}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div class="text-center text-xs text-gray-500">{perceivedExertion}</div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Form Quality (1-10)
              </label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                bind:value={formQuality}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div class="text-center text-xs text-gray-500">{formQuality}</div>
            </div>
          </div>
          
          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (Optional)
            </label>
            <textarea 
              bind:value={notes}
              placeholder="How did it feel? Any issues or observations?"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="2"
            ></textarea>
          </div>
          
          <div class="flex gap-2">
            <button 
              on:click={submitFeedback}
              class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
            >
              Submit Feedback
            </button>
            <button 
              on:click={() => showFeedbackForm = false}
              class="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      {/if}

      <!-- Success Message -->
      {#if feedbackSubmitted}
        <div class="bg-green-50 border border-green-200 rounded-md p-3 text-center">
          <svg class="w-5 h-5 text-green-400 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <p class="text-sm text-green-700">Thank you for your feedback! This helps improve future recommendations.</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .ai-recommendation-card {
    max-width: 500px;
  }
  
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
  }
  
  input[type="range"]::-moz-range-thumb {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
  }
</style>