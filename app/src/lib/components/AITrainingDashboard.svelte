<!-- File: AITrainingDashboard.svelte -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Brain, Target, TrendingUp, Zap, Activity, Heart, Timer } from 'lucide-svelte';
  
  import { AITrainingEngineImpl } from '$lib/training/aiTrainingEngine';
  import { AdaptiveTrainingEngine } from '$lib/services/adaptiveTraining';
  import type { 
    PerformanceAnalysis, 
    ProgramAdjustments, 
    RIRPrediction,
    RecoveryStatus,
    DeloadRecommendation 
  } from '$lib/training/aiTrainingEngine';

  // AI Engine instances
  let aiEngine: AITrainingEngineImpl;
  let adaptiveEngine: AdaptiveTrainingEngine;
  
  // State
  let currentAnalysis: PerformanceAnalysis | null = null;
  let programAdjustments: ProgramAdjustments | null = null;
  let rirPredictions: Map<string, RIRPrediction> = new Map();
  let recoveryStatus: RecoveryStatus | null = null;
  let deloadRecommendation: DeloadRecommendation | null = null;
  
  let currentExercise = 'Bench Press';
  let currentSet = 1;
  let isLoading = false;

  // Mock data for demonstration
  let mockRecoveryData = [
    {
      userId: 'user1',
      date: new Date().toISOString(),
      recoveryScore: 68,
      hrvScore: 42,
      restingHeartRate: 58,
      sleepPerformance: 75,
      strainYesterday: 12.5,
      baselineDeviation: -5,
      trend: 'stable' as const
    }
  ];

  let mockTrainingSessions = [
    {
      id: 'session1',
      userId: 'user1',
      date: new Date().toISOString(),
      exerciseId: 'bench_press',
      plannedParams: {
        load: 80,
        reps: 8,
        sets: 3,
        restBetweenSets: 120,
        restBetweenExercises: 180,
        intensity: 'moderate' as const
      },
      completed: true,
      targetReps: 8,
      actualReps: 8,
      perceivedEffort: 7
    }
  ];

  onMount(async () => {
    aiEngine = new AITrainingEngineImpl();
    adaptiveEngine = new AdaptiveTrainingEngine('user1');
    
    await loadAIInsights();
  });

  async function loadAIInsights() {
    isLoading = true;
    
    try {
      // Get weekly performance analysis
      const weekData = {
        sessions: mockTrainingSessions,
        recoveryMetrics: mockRecoveryData
      };
      
      currentAnalysis = await aiEngine.analyzeWeeklyPerformance('user1', weekData);
      
      // Get program adjustments
      if (currentAnalysis) {
        programAdjustments = await aiEngine.calculateProgramAdjustments(
          currentAnalysis, 
          {} as any // Mock program
        );
      }

      // Get RIR prediction for current exercise
      const exercise = { name: currentExercise, muscleGroup: 'chest', equipment: 'barbell' };
      const rirPrediction = await aiEngine.predictRIR('user1', exercise, currentSet);
      rirPredictions.set(currentExercise, rirPrediction);

      // Get recovery status
      recoveryStatus = await aiEngine.assessRecoveryStatus(mockRecoveryData);

      // Get deload recommendation
      deloadRecommendation = await aiEngine.determineDeloadTiming(
        'user1', 
        4, 
        { trend: 'stable', averageRecovery: 68 }
      );

    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      isLoading = false;
    }
  }

  async function updateRIRPrediction(exercise: string, setNumber: number) {
    const exerciseData = { name: exercise, muscleGroup: 'chest', equipment: 'barbell' };
    const prediction = await aiEngine.predictRIR('user1', exerciseData, setNumber);
    rirPredictions.set(exercise, prediction);
    rirPredictions = rirPredictions; // Trigger reactivity
  }

  function getPerformanceColor(score: number): string {
    if (score > 80) return 'text-green-600';
    if (score > 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getTrendIcon(trend: number): string {
    if (trend > 10) return '📈';
    if (trend < -10) return '📉';
    return '➡️';
  }

  function getFatigueColor(level: string): string {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      case 'very_high': return 'text-red-800';
      default: return 'text-gray-600';
    }
  }
</script>

<div class="max-w-6xl mx-auto p-6 space-y-6">
  <!-- Header -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex items-center space-x-3 mb-4">
      <Brain class="h-8 w-8 text-blue-600" />
      <h1 class="text-3xl font-bold text-gray-900">AI Training Dashboard</h1>
    </div>
    <p class="text-gray-600">
      Intelligent training adaptations powered by machine learning and real-time biometric data
    </p>
  </div>

  {#if isLoading}
    <div class="bg-white rounded-lg shadow-md p-8 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Analyzing your training data...</p>
    </div>
  {:else}
    <!-- Performance Analysis -->
    {#if currentAnalysis}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-2">
            <Target class="h-6 w-6 text-blue-600" />
            <span class="text-sm text-gray-500">Consistency</span>
          </div>
          <div class="text-2xl font-bold {getPerformanceColor(currentAnalysis.consistencyScore)}">
            {Math.round(currentAnalysis.consistencyScore)}%
          </div>
          <p class="text-sm text-gray-600 mt-1">Training consistency this week</p>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-2">
            <TrendingUp class="h-6 w-6 text-green-600" />
            <span class="text-sm text-gray-500">Effort Trend</span>
          </div>
          <div class="text-2xl font-bold {getPerformanceColor(Math.abs(currentAnalysis.effortTrend))}">
            {getTrendIcon(currentAnalysis.effortTrend)} {Math.abs(Math.round(currentAnalysis.effortTrend))}%
          </div>
          <p class="text-sm text-gray-600 mt-1">
            {currentAnalysis.effortTrend > 0 ? 'Increasing' : 'Decreasing'} effort trend
          </p>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-2">
            <Heart class="h-6 w-6 text-red-600" />
            <span class="text-sm text-gray-500">Recovery</span>
          </div>
          <div class="text-2xl font-bold {getPerformanceColor(Math.abs(currentAnalysis.recoveryTrend))}">
            {getTrendIcon(currentAnalysis.recoveryTrend)} {Math.abs(Math.round(currentAnalysis.recoveryTrend))}%
          </div>
          <p class="text-sm text-gray-600 mt-1">Recovery trend analysis</p>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-2">
            <Zap class="h-6 w-6 text-yellow-600" />
            <span class="text-sm text-gray-500">Adaptation</span>
          </div>
          <div class="text-2xl font-bold {getPerformanceColor(currentAnalysis.adaptationScore)}">
            {Math.round(currentAnalysis.adaptationScore)}%
          </div>
          <p class="text-sm text-gray-600 mt-1">Training adaptation rate</p>
        </div>
      </div>
    {/if}

    <!-- RIR Prediction -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center space-x-2">
        <Activity class="h-6 w-6 text-purple-600" />
        <span>Reps in Reserve (RIR) Predictor</span>
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Exercise</label>
          <select
            bind:value={currentExercise}
            on:change={() => updateRIRPrediction(currentExercise, currentSet)}
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Bench Press">Bench Press</option>
            <option value="Squat">Squat</option>
            <option value="Deadlift">Deadlift</option>
            <option value="Overhead Press">Overhead Press</option>
            <option value="Barbell Row">Barbell Row</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Set Number</label>
          <select
            bind:value={currentSet}
            on:change={() => updateRIRPrediction(currentExercise, currentSet)}
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {#each [1, 2, 3, 4, 5] as setNum}
              <option value={setNum}>Set {setNum}</option>
            {/each}
          </select>
        </div>
      </div>

      {#if rirPredictions.has(currentExercise)}
        {@const prediction = rirPredictions.get(currentExercise)}
        <div class="mt-6 p-4 bg-purple-50 rounded-lg">
          <div class="flex items-center justify-between mb-2">
            <span class="text-lg font-semibold">Predicted RIR: {prediction.predictedRIR}</span>
            <span class="text-sm text-gray-600">
              Confidence: {Math.round(prediction.confidence * 100)}%
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-purple-600 h-2 rounded-full"
              style="width: {prediction.confidence * 100}%"
            ></div>
          </div>
          <p class="text-sm text-gray-600 mt-2">
            Stop when you have approximately {prediction.predictedRIR} reps left in the tank
          </p>
        </div>
      {/if}
    </div>

    <!-- Recovery & Deload Status -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recovery Status -->
      {#if recoveryStatus}
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Heart class="h-5 w-5 text-red-600" />
            <span>Recovery Status</span>
          </h3>

          <div class="space-y-4">
            <div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm font-medium">Recovery Score</span>
                <span class="text-lg font-bold {getPerformanceColor(recoveryStatus.recoveryScore)}">
                  {recoveryStatus.recoveryScore}%
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div
                  class="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                  style="width: {recoveryStatus.recoveryScore}%"
                ></div>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Fatigue Level</span>
              <span class="capitalize font-semibold {getFatigueColor(recoveryStatus.fatigueLevel)}">
                {recoveryStatus.fatigueLevel.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      {/if}

      <!-- Deload Recommendation -->
      {#if deloadRecommendation}
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Timer class="h-5 w-5 text-blue-600" />
            <span>Deload Recommendation</span>
          </h3>

          <div class="space-y-4">
            <div class="p-4 rounded-lg {deloadRecommendation.shouldDeload ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}">
              <div class="flex items-center space-x-2 mb-2">
                <span class="text-lg font-semibold">
                  {deloadRecommendation.shouldDeload ? '⚠️ Deload Recommended' : '✅ Continue Training'}
                </span>
              </div>
              <p class="text-sm text-gray-700">{deloadRecommendation.reasoning}</p>
            </div>

            {#if deloadRecommendation.shouldDeload}
              <div class="text-sm text-gray-600 space-y-1">
                <p>• Reduce training intensity by 40-60%</p>
                <p>• Decrease training volume by 30-50%</p>
                <p>• Focus on movement quality and recovery</p>
                <p>• Duration: 1 week</p>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Program Adjustments -->
    {#if programAdjustments}
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Target class="h-6 w-6 text-blue-600" />
          <span>AI Program Adjustments</span>
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600 mb-1">
              {programAdjustments.loadAdjustment > 0 ? '+' : ''}{Math.round(programAdjustments.loadAdjustment * 100)}%
            </div>
            <div class="text-sm font-medium text-gray-700">Load Adjustment</div>
            <div class="text-xs text-gray-600 mt-1">
              {programAdjustments.loadAdjustment > 0 ? 'Increase weight' : programAdjustments.loadAdjustment < 0 ? 'Decrease weight' : 'Maintain weight'}
            </div>
          </div>

          <div class="text-center p-4 bg-green-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600 mb-1">
              {programAdjustments.volumeAdjustment > 0 ? '+' : ''}{Math.round(programAdjustments.volumeAdjustment * 100)}%
            </div>
            <div class="text-sm font-medium text-gray-700">Volume Adjustment</div>
            <div class="text-xs text-gray-600 mt-1">
              {programAdjustments.volumeAdjustment > 0 ? 'Add sets/reps' : programAdjustments.volumeAdjustment < 0 ? 'Reduce sets/reps' : 'Maintain volume'}
            </div>
          </div>

          <div class="text-center p-4 bg-purple-50 rounded-lg">
            <div class="text-2xl font-bold text-purple-600 mb-1">
              {programAdjustments.intensityAdjustment > 0 ? '+' : ''}{Math.round(programAdjustments.intensityAdjustment * 100)}%
            </div>
            <div class="text-sm font-medium text-gray-700">Intensity Adjustment</div>
            <div class="text-xs text-gray-600 mt-1">
              {programAdjustments.intensityAdjustment > 0 ? 'Increase effort' : programAdjustments.intensityAdjustment < 0 ? 'Decrease effort' : 'Maintain effort'}
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- AI Insights & Tips -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center space-x-2">
        <Brain class="h-6 w-6 text-purple-600" />
        <span>AI Training Insights</span>
      </h2>

      <div class="space-y-3">
        <div class="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <p class="text-sm text-blue-800">
            💡 <strong>Personalization:</strong> Your RIR predictions will become more accurate as you complete more training sessions. The AI learns your individual fatigue patterns.
          </p>
        </div>

        <div class="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
          <p class="text-sm text-green-800">
            🎯 <strong>Auto-Calibration:</strong> The system automatically adjusts training parameters based on your recovery data and performance trends.
          </p>
        </div>

        <div class="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
          <p class="text-sm text-yellow-800">
            ⚠️ <strong>Fatigue Monitoring:</strong> Real-time strain monitoring helps prevent overtraining and reduces injury risk through intelligent rest period adjustments.
          </p>
        </div>
      </div>
    </div>
  {/if}
</div>