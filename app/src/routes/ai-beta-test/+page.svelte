<!-- Test scenario for AI integration: Pro user with HR 152, prefers rack-pull -->
<script lang="ts">
	import { AIWorkoutIntegrationService } from '../../lib/services/aiWorkoutIntegration.js';
	import { DailyStrainAssessmentService } from '../../lib/services/dailyStrainAssessmentService.js';

	const strainService = new DailyStrainAssessmentService();
	const aiService = new AIWorkoutIntegrationService(strainService);

	let testResult = null;
	let isRunningTest = false;

	/**
	 * Test the beta scenario: Pro user, HR 152, prefers rack-pull, expect +30s rest to 90s max
	 */
	async function runBetaTest() {
		isRunningTest = true;
		testResult = null;

		try {
			// Scenario: Pro user with HR 152, prefers rack-pull
			const testContext = {
				userId: 'pro_user_beta',
				currentExercise: 'rack_pull',
				currentWeight: 185,
				currentReps: 8,
				heartRate: 152, // Elevated HR
				spo2: 97, // Good oxygen levels
				lastWorkouts: [
					{
						date: '2025-09-23',
						exercises: ['deadlift', 'squat', 'rack_pull'],
						avgHeartRate: 145,
						feedback: 'moderate'
					},
					{
						date: '2025-09-22',
						exercises: ['rack_pull', 'hip_thrust', 'squat'],
						avgHeartRate: 140,
						feedback: 'easy'
					},
					{
						date: '2025-09-21',
						exercises: ['deadlift', 'rack_pull'],
						avgHeartRate: 148,
						feedback: 'hard'
					}
				],
				userPrefs: {
					blacklistedExercises: [], // No deadlift blacklisted yet
					preferredExercises: ['rack_pull'], // Prefers rack-pull over deadlift
					successRates: {
						rack_pull: 0.75,
						deadlift: 0.45, // Lower success rate with deadlift
						hip_thrust: 0.8
					},
					maxHeartRate: 180, // Age ~30, 220-30=190, 85% = 161.5, so 152 < max
					calibrated: true,
					age: 30
				}
			};

			// Test 1: Normal scenario (HR below max)
			console.log('=== TEST 1: Normal HR scenario ===');
			const normalResult = await aiService.getAIRecommendation(testContext);

			// Test 2: Elevated HR scenario (above 85% max = 153)
			console.log('=== TEST 2: Elevated HR scenario ===');
			const elevatedContext = {
				...testContext,
				heartRate: 155, // Above 85% max (153)
				maxHeartRate: 180
			};

			const elevatedResult = await aiService.getAIRecommendation(elevatedContext);

			// Test 3: Critical HR scenario (way above max)
			console.log('=== TEST 3: Critical HR scenario ===');
			const criticalContext = {
				...testContext,
				heartRate: 170, // Way above safe limit
				spo2: 94 // Also slightly low SpO2
			};

			const criticalResult = await aiService.getAIRecommendation(criticalContext);

			// Test 4: Exercise swap tracking
			console.log('=== TEST 4: Exercise swap tracking ===');
			const swapResult = await aiService.trackExerciseSwap(
				'pro_user_beta',
				'deadlift',
				'rack_pull'
			);

			testResult = {
				success: true,
				scenarios: [
					{
						name: 'Normal HR (152 BPM, <85% max)',
						input: { hr: 152, spo2: 97, maxHR: 180 },
						result: normalResult,
						expected: 'Weight increase or rep adjustment',
						analysis: analyzeResult(normalResult, 'normal')
					},
					{
						name: 'Elevated HR (155 BPM, >85% max)',
						input: { hr: 155, spo2: 97, maxHR: 180 },
						result: elevatedResult,
						expected: '+30s rest (to 90s max)',
						analysis: analyzeResult(elevatedResult, 'elevated')
					},
					{
						name: 'Critical HR (170 BPM) + Low SpO2 (94%)',
						input: { hr: 170, spo2: 94, maxHR: 180 },
						result: criticalResult,
						expected: 'Maximum rest (90s) + safety warning',
						analysis: analyzeResult(criticalResult, 'critical')
					},
					{
						name: 'Exercise Swap Tracking',
						input: { from: 'deadlift', to: 'rack_pull', swapCount: 1 },
						result: swapResult,
						expected: 'No blacklist prompt yet (need 3+ swaps)',
						analysis: analyzeSwapResult(swapResult)
					}
				]
			};
		} catch (error) {
			testResult = {
				success: false,
				error: error.message
			};
		} finally {
			isRunningTest = false;
		}
	}

	function analyzeResult(result, scenario) {
		const analysis = {
			correct: false,
			issues: [],
			strengths: []
		};

		switch (scenario) {
			case 'normal':
				if (result.type === 'weight_increase' || result.type === 'add_rep') {
					analysis.correct = true;
					analysis.strengths.push('Suggested progression as expected for normal HR');
				} else if (result.type === 'increase_rest') {
					analysis.issues.push('Should not suggest rest increase for normal HR');
				}
				break;

			case 'elevated':
				if (result.type === 'increase_rest') {
					analysis.correct = true;
					analysis.strengths.push('Correctly identified elevated HR and suggested rest');
					if (result.value >= 60 && result.value <= 90) {
						analysis.strengths.push('Rest time within safe bounds (60-90s)');
					}
				} else {
					analysis.issues.push('Should suggest rest increase for elevated HR');
				}
				break;

			case 'critical':
				if (result.type === 'increase_rest' && result.value === 90) {
					analysis.correct = true;
					analysis.strengths.push('Correctly applied maximum rest for critical HR');
				} else {
					analysis.issues.push('Should apply maximum rest (90s) for critical HR/SpO2');
				}
				break;
		}

		if (result.clamped) {
			analysis.strengths.push('Safety clamping applied correctly');
		}

		return analysis;
	}

	function analyzeSwapResult(result) {
		return {
			correct: result === null,
			issues: result !== null ? ['Should not prompt blacklist on first swap'] : [],
			strengths: result === null ? ['Correctly tracking swaps without premature blacklist'] : []
		};
	}
</script>

<svelte:head>
	<title>AI Beta Test - Adaptive fIt</title>
</svelte:head>

<div class="space-y-6">
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<h1 class="text-2xl font-bold text-gray-900 mb-2">AI Integration Beta Test</h1>
		<p class="text-gray-600">
			Test the AI integration with the beta scenario: Pro user, HR 152, prefers rack-pull
		</p>
	</div>

	<!-- Test Scenario Overview -->
	<div class="bg-blue-50 rounded-xl p-6 border border-blue-200">
		<h2 class="text-lg font-semibold text-blue-900 mb-4">Beta Test Scenario</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="bg-white rounded-lg p-4">
				<div class="text-sm text-gray-600">User Type</div>
				<div class="font-semibold">Pro User ($15/month)</div>
			</div>
			<div class="bg-white rounded-lg p-4">
				<div class="text-sm text-gray-600">Heart Rate</div>
				<div class="font-semibold text-orange-600">152 BPM</div>
			</div>
			<div class="bg-white rounded-lg p-4">
				<div class="text-sm text-gray-600">Preferred Exercise</div>
				<div class="font-semibold">Rack-pull</div>
			</div>
		</div>

		<div class="mt-4 p-4 bg-white rounded-lg">
			<div class="text-sm text-gray-600 mb-2">Expected Behavior</div>
			<ul class="text-sm space-y-1">
				<li>• Normal HR (152 below 153 max): Suggest weight/rep progression</li>
				<li>• Elevated HR (over 85% max): Increase rest by 30s (max 90s)</li>
				<li>• Critical HR + Low SpO2: Maximum rest (90s) + safety priority</li>
				<li>• Exercise swaps: Track but don't blacklist until 3+ swaps</li>
			</ul>
		</div>
	</div>

	<!-- Test Control -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold text-gray-900">Run Beta Test</h2>
			<button
				on:click={runBetaTest}
				disabled={isRunningTest}
				class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
			>
				{#if isRunningTest}
					<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					Testing...
				{:else}
					🧪 Run Test
				{/if}
			</button>
		</div>

		<p class="text-gray-600 text-sm">
			This will test the AI integration service with various heart rate scenarios and exercise
			preferences.
		</p>
	</div>

	<!-- Test Results -->
	{#if testResult}
		<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>

			{#if testResult.success}
				<div class="space-y-6">
					{#each testResult.scenarios as scenario, i}
						<div class="border border-gray-200 rounded-lg p-4">
							<div class="flex items-start justify-between mb-4">
								<div>
									<h3 class="font-semibold text-gray-900">{scenario.name}</h3>
									<p class="text-sm text-gray-600">Expected: {scenario.expected}</p>
								</div>
								<div class="flex items-center gap-2">
									{#if scenario.analysis.correct}
										<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium"
											>✓ PASS</span
										>
									{:else}
										<span class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium"
											>✗ FAIL</span
										>
									{/if}
								</div>
							</div>

							<!-- Input Parameters -->
							<div class="bg-gray-50 rounded-lg p-3 mb-4">
								<div class="text-sm font-medium text-gray-700 mb-2">Input:</div>
								<div class="text-sm text-gray-600 font-mono">
									{JSON.stringify(scenario.input, null, 2)}
								</div>
							</div>

							<!-- AI Response -->
							<div class="bg-blue-50 rounded-lg p-3 mb-4">
								<div class="text-sm font-medium text-blue-800 mb-2">AI Response:</div>
								<div class="space-y-1">
									<div><span class="font-medium">Type:</span> {scenario.result.type}</div>
									<div><span class="font-medium">Value:</span> {scenario.result.value}</div>
									<div><span class="font-medium">Reason:</span> {scenario.result.reason}</div>
									{#if scenario.result.clamped}
										<div class="text-orange-600">
											<span class="font-medium">⚠️ Clamped:</span> Safety limits applied
										</div>
									{/if}
								</div>
							</div>

							<!-- Analysis -->
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								{#if scenario.analysis.strengths.length > 0}
									<div>
										<div class="text-sm font-medium text-green-700 mb-2">✓ Strengths:</div>
										<ul class="text-sm text-green-600 space-y-1">
											{#each scenario.analysis.strengths as strength}
												<li>• {strength}</li>
											{/each}
										</ul>
									</div>
								{/if}

								{#if scenario.analysis.issues.length > 0}
									<div>
										<div class="text-sm font-medium text-red-700 mb-2">✗ Issues:</div>
										<ul class="text-sm text-red-600 space-y-1">
											{#each scenario.analysis.issues as issue}
												<li>• {issue}</li>
											{/each}
										</ul>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<!-- Overall Summary -->
				<div class="mt-6 p-4 bg-gray-50 rounded-lg">
					<h3 class="font-semibold text-gray-900 mb-2">Overall Assessment</h3>
					{#if testResult.scenarios.every((s) => s.analysis.correct)}
						<p class="text-green-600 font-medium">
							🎉 All tests passed! AI integration is working correctly.
						</p>
					{:else}
						<p class="text-orange-600 font-medium">
							⚠️ Some tests failed. Review the issues above for improvements.
						</p>
					{/if}

					<div class="mt-3 text-sm text-gray-600">
						<p>
							<strong>Beta readiness:</strong>
							{testResult.scenarios.filter((s) => s.analysis.correct).length}/{testResult.scenarios
								.length} scenarios working correctly
						</p>
						<p>
							<strong>Next steps:</strong> Address any failing tests, then deploy to 10-50 beta users
						</p>
					</div>
				</div>
			{:else}
				<div class="bg-red-50 border border-red-200 rounded-lg p-4">
					<div class="text-red-800">
						<h3 class="font-medium">Test Failed</h3>
						<p class="text-sm mt-1">{testResult.error}</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Implementation Status -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<h2 class="text-xl font-semibold text-gray-900 mb-4">Implementation Status</h2>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div>
				<h3 class="font-medium text-gray-900 mb-3">✅ Completed Features</h3>
				<ul class="space-y-2 text-sm text-gray-600">
					<li class="flex items-start">
						<span class="text-green-500 mr-2">✓</span>
						AI Integration Service with deployed service connection
					</li>
					<li class="flex items-start">
						<span class="text-green-500 mr-2">✓</span>
						Rule-based configuration (weight jumps: 2.5, 5, 10 lbs)
					</li>
					<li class="flex items-start">
						<span class="text-green-500 mr-2">✓</span>
						Strain monitoring with 85% HR limit + rest adjustment
					</li>
					<li class="flex items-start">
						<span class="text-green-500 mr-2">✓</span>
						Exercise swap tracking and blacklist prompts
					</li>
					<li class="flex items-start">
						<span class="text-green-500 mr-2">✓</span>
						15-second jump test calibration prompt
					</li>
					<li class="flex items-start">
						<span class="text-green-500 mr-2">✓</span>
						YouTube admin UI for knowledge base updates
					</li>
				</ul>
			</div>

			<div>
				<h3 class="font-medium text-gray-900 mb-3">🎯 Beta Timeline</h3>
				<div class="space-y-3 text-sm">
					<div class="flex justify-between items-center p-2 bg-green-50 rounded">
						<span>October 1, 2025</span>
						<span class="text-green-600 font-medium">Beta Launch Target</span>
					</div>
					<div class="flex justify-between items-center p-2 bg-blue-50 rounded">
						<span>10-50 users</span>
						<span class="text-blue-600 font-medium">Initial Beta Group</span>
					</div>
					<div class="flex justify-between items-center p-2 bg-purple-50 rounded">
						<span>$0-$10/month</span>
						<span class="text-purple-600 font-medium">Scaling Target</span>
					</div>
					<div class="flex justify-between items-center p-2 bg-orange-50 rounded">
						<span>1-2 pro users</span>
						<span class="text-orange-600 font-medium">Profitability</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
