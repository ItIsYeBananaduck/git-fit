<!-- AI Integration Test Runner -->
<!-- Demonstrates the enhanced AI rules implementation -->

<script>
	import { onMount } from 'svelte';
	import { AIIntegrationTest } from '../../lib/services/aiIntegrationTest.js';

	let testResults = null;
	let isRunning = false;
	let currentTest = '';

	async function runTests() {
		isRunning = true;
		currentTest = 'Initializing AI Integration Tests...';

		try {
			const tester = new AIIntegrationTest();
			currentTest = 'Running comprehensive test suite...';

			const results = await tester.runAllTests();
			testResults = results;
			currentTest = 'Tests completed!';
		} catch (error) {
			console.error('Test execution failed:', error);
			currentTest = `Test failed: ${error.message}`;
			testResults = { allPassed: false, error: error.message };
		} finally {
			isRunning = false;
		}
	}

	async function runExampleScenarioOnly() {
		isRunning = true;
		currentTest = 'Running example scenario: 4-week cycle, 40% squats completion...';

		try {
			const tester = new AIIntegrationTest();
			const result = await tester.testExampleScenario();
			testResults = {
				exampleOnly: true,
				result,
				allPassed: result
			};
			currentTest = 'Example test completed!';
		} catch (error) {
			console.error('Example test failed:', error);
			currentTest = `Test failed: ${error.message}`;
			testResults = { allPassed: false, error: error.message };
		} finally {
			isRunning = false;
		}
	}
</script>

<div class="ai-test-runner">
	<div class="test-header">
		<h2>🤖 AI Integration Rules Test</h2>
		<p>Testing the enhanced AI workout integration with:</p>
		<ul>
			<li>✅ 4-week mesocycle tracking (set → reps → volume cycling)</li>
			<li>✅ Exercise replacement for &lt;50% completion rates</li>
			<li>✅ Strain limits with automatic rest increases</li>
			<li>✅ 3+ swap tracking with blacklist prompts</li>
			<li>✅ Weight progression clamping (2.5, 5, 10 lbs only)</li>
			<li>✅ Fixed prompt template with mesocycle context</li>
		</ul>
	</div>

	<div class="test-controls">
		<button class="test-btn primary" on:click={runExampleScenarioOnly} disabled={isRunning}>
			🎯 Run Example Scenario
		</button>

		<button class="test-btn secondary" on:click={runTests} disabled={isRunning}>
			🧪 Run All Tests
		</button>
	</div>

	<div class="test-scenario">
		<h3>📋 Example Scenario</h3>
		<div class="scenario-details">
			<p><strong>Input:</strong> User completed 4-week mesocycle</p>
			<ul>
				<li>Week 1 (+1 set): Squats 45% completion</li>
				<li>Week 2 (+5 lbs): Squats 35% completion</li>
				<li>Week 3 (+1 rep): Squats 40% completion</li>
				<li>Week 4 (+1 set): Squats 38% completion</li>
			</ul>
			<p><strong>Conditions:</strong> HR 145 (below 85% max), 70% success rate</p>
			<p><strong>Expected Output:</strong> "replace squats with lunges" (same muscle group)</p>
		</div>
	</div>

	{#if isRunning}
		<div class="test-status running">
			<div class="loading-spinner"></div>
			<p>{currentTest}</p>
		</div>
	{/if}

	{#if testResults}
		<div
			class="test-results"
			class:success={testResults.allPassed}
			class:error={!testResults.allPassed}
		>
			<h3>📊 Test Results</h3>

			{#if testResults.error}
				<div class="error-message">
					<h4>❌ Test Execution Error</h4>
					<p>{testResults.error}</p>
					<p>Check console for detailed error information.</p>
				</div>
			{:else if testResults.exampleOnly}
				<div class="example-results">
					<h4>{testResults.allPassed ? '✅' : '❌'} Example Scenario Test</h4>
					<p>Expected: Replace squats with lunges (muscle group appropriate)</p>
					<p>Result: {testResults.result ? 'PASSED' : 'FAILED'}</p>
					{#if testResults.result}
						<p class="success-note">
							🎉 AI correctly identified low-completion exercise and suggested same-muscle-group
							replacement!
						</p>
					{/if}
				</div>
			{:else}
				<div class="full-results">
					<h4>Comprehensive Test Results</h4>
					<div class="result-grid">
						<div class="result-item" class:pass={testResults.results?.exampleScenario}>
							<span class="result-icon">{testResults.results?.exampleScenario ? '✅' : '❌'}</span>
							<span>Example Scenario (squat → lunges)</span>
						</div>
						<div class="result-item" class:pass={testResults.results?.strainLimits}>
							<span class="result-icon">{testResults.results?.strainLimits ? '✅' : '❌'}</span>
							<span>Strain Limits Protection</span>
						</div>
						<div class="result-item" class:pass={testResults.results?.blacklistPrompt}>
							<span class="result-icon">{testResults.results?.blacklistPrompt ? '✅' : '❌'}</span>
							<span>Blacklist Prompt (3+ swaps)</span>
						</div>
					</div>

					<div class="overall-status">
						<h4>{testResults.allPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}</h4>
						{#if testResults.allPassed}
							<p>All AI integration rules are working correctly!</p>
							<p>The system will automatically:</p>
							<ul>
								<li>Replace exercises with &lt;50% completion (same muscle group)</li>
								<li>Increase rest when HR exceeds 85% max</li>
								<li>Prompt for blacklisting after 3+ exercise swaps</li>
								<li>Clamp weight increases to 2.5, 5, 10 lbs only</li>
								<li>Follow mesocycle progression (set → reps → volume)</li>
							</ul>
						{:else}
							<p>Some tests failed. Check console for detailed information.</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<div class="implementation-notes">
		<h3>🔧 Implementation Notes</h3>
		<p>This test demonstrates the enhanced AI integration that follows your detailed rules:</p>
		<ul>
			<li><strong>Mesocycle Tracking:</strong> 4-week cycles with progressive overload rotation</li>
			<li>
				<strong>Exercise Cycling:</strong> Replace exercises with &lt;50% completion over 4 weeks
			</li>
			<li>
				<strong>Safety First:</strong> Strain limits enforced automatically, no breaking hard constraints
			</li>
			<li>
				<strong>Smart Progression:</strong> Weight jumps limited to 2.5/5/10 lbs, rep max 5 per set
			</li>
			<li>
				<strong>User-Friendly:</strong> Blacklist prompts after 3+ swaps, automatic implementation within
				bounds
			</li>
		</ul>
	</div>
</div>

<style>
	.ai-test-runner {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'SF Pro Text', system-ui, sans-serif;
	}

	.test-header h2 {
		color: #2d3748;
		margin-bottom: 1rem;
	}

	.test-header ul {
		background: #f7fafc;
		padding: 1rem;
		border-radius: 8px;
		border-left: 4px solid #48bb78;
	}

	.test-controls {
		display: flex;
		gap: 1rem;
		margin: 2rem 0;
	}

	.test-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.test-btn.primary {
		background: #4299e1;
		color: white;
	}

	.test-btn.secondary {
		background: #e2e8f0;
		color: #4a5568;
	}

	.test-btn:hover:not(:disabled) {
		transform: translateY(-1px);
	}

	.test-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.test-scenario {
		background: #edf2f7;
		padding: 1.5rem;
		border-radius: 8px;
		margin: 1.5rem 0;
	}

	.scenario-details ul {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.test-status.running {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #bee3f8;
		border-radius: 8px;
		margin: 1rem 0;
	}

	.loading-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid #4299e1;
		border-top: 2px solid transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.test-results {
		margin: 2rem 0;
		padding: 1.5rem;
		border-radius: 8px;
		border: 2px solid;
	}

	.test-results.success {
		background: #f0fff4;
		border-color: #48bb78;
	}

	.test-results.error {
		background: #fed7d7;
		border-color: #f56565;
	}

	.result-grid {
		display: grid;
		gap: 0.5rem;
		margin: 1rem 0;
	}

	.result-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 4px;
		background: #f7fafc;
	}

	.result-item.pass {
		background: #f0fff4;
	}

	.overall-status {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.success-note {
		color: #22543d;
		font-weight: 600;
		background: #c6f6d5;
		padding: 0.5rem;
		border-radius: 4px;
	}

	.implementation-notes {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		margin-top: 2rem;
		border-left: 4px solid #667eea;
	}

	.implementation-notes ul {
		margin-top: 1rem;
	}

	.implementation-notes li {
		margin-bottom: 0.5rem;
	}
</style>
