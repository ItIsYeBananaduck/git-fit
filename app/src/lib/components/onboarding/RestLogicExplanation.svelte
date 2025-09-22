<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let understood = false;

	const restFeatures = [
		{
			icon: '⏱️',
			title: 'Smart Rest Timing',
			description:
				'Our AI analyzes your heart rate recovery to determine the perfect rest time between sets.',
			details:
				'At 30 seconds: Rest ends if HR drops 30+ bpm. At 60 seconds: Rest ends if HR drops 25+ bpm. At 90 seconds: Always ends (maximum rest).'
		},
		{
			icon: '❤️',
			title: 'Heart Rate Monitoring',
			description:
				"Real-time heart rate tracking ensures you're recovered before starting your next set.",
			details:
				'Connect your WHOOP, Apple Watch, or other wearable for automatic strain monitoring and recovery detection.'
		},
		{
			icon: '🎯',
			title: 'Adaptive Adjustments',
			description:
				'Rest times automatically adjust based on your current fatigue and recovery state.',
			details:
				"If you're not recovered, rest extends. If you're ready early, you can start sooner. No more guessing!"
		},
		{
			icon: '🔔',
			title: 'Smart Notifications',
			description: 'Voice cues from Alice or Aiden guide you through your rest periods.',
			details:
				'Get personalized encouragement and timing cues. "Let\'s go! Start your next set." when you\'re ready.'
		},
		{
			icon: '📊',
			title: 'Progress Tracking',
			description: 'All rest data is tracked to optimize your future workouts.',
			details:
				"Learn your recovery patterns and get better at knowing when you're truly ready for the next set."
		}
	];

	const restScenarios = [
		{
			scenario: 'Fresh & Ready',
			description: "You're well-rested and recovered quickly",
			restTime: '30-45 seconds',
			outcome: 'Shorter rests, more efficient workouts'
		},
		{
			scenario: 'Moderate Fatigue',
			description: "You're working hard but recovering steadily",
			restTime: '60-75 seconds',
			outcome: 'Balanced rest for optimal performance'
		},
		{
			scenario: 'High Fatigue',
			description: "You're pushing your limits and need more recovery",
			restTime: '75-90 seconds',
			outcome: 'Extended rest to prevent overtraining'
		}
	];

	function acknowledgeUnderstanding() {
		dispatch('acknowledge');
	}
</script>

<div class="max-w-4xl mx-auto space-y-8">
	<div class="text-center">
		<h2 class="text-3xl font-bold text-gray-900 mb-4">How Our Smart Rest System Works</h2>
		<p class="text-gray-600 text-lg max-w-3xl mx-auto">
			Our AI-powered rest system uses heart rate monitoring to ensure you get the perfect amount of
			rest between sets. No more guessing - let science guide your recovery.
		</p>
	</div>

	<!-- Rest Features -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each restFeatures as feature}
			<div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
				<div class="text-4xl mb-4">{feature.icon}</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
				<p class="text-gray-600 mb-3">{feature.description}</p>
				<p class="text-sm text-gray-500 italic">{feature.details}</p>
			</div>
		{/each}
	</div>

	<!-- How It Works -->
	<div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8">
		<h3 class="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h3>

		<div class="space-y-6">
			<div class="flex items-start space-x-4">
				<div
					class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold"
				>
					1
				</div>
				<div>
					<h4 class="font-semibold text-gray-900">Set Completion</h4>
					<p class="text-gray-600">You finish your set and the timer starts automatically.</p>
				</div>
			</div>

			<div class="flex items-start space-x-4">
				<div
					class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold"
				>
					2
				</div>
				<div>
					<h4 class="font-semibold text-gray-900">Heart Rate Monitoring</h4>
					<p class="text-gray-600">Your wearable tracks heart rate recovery in real-time.</p>
				</div>
			</div>

			<div class="flex items-start space-x-4">
				<div
					class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold"
				>
					3
				</div>
				<div>
					<h4 class="font-semibold text-gray-900">Smart Detection</h4>
					<p class="text-gray-600">
						AI analyzes when you've recovered enough to start your next set safely.
					</p>
				</div>
			</div>

			<div class="flex items-start space-x-4">
				<div
					class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold"
				>
					4
				</div>
				<div>
					<h4 class="font-semibold text-gray-900">Voice Guidance</h4>
					<p class="text-gray-600">
						Alice or Aiden gives you the perfect cue to start your next set.
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Rest Scenarios -->
	<div class="bg-white rounded-lg shadow-lg p-8">
		<h3 class="text-xl font-semibold text-gray-900 mb-6 text-center">Rest Time Examples</h3>
		<p class="text-gray-600 mb-6 text-center">
			Here are typical rest times based on your recovery state:
		</p>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			{#each restScenarios as scenario}
				<div class="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
					<h4 class="font-semibold text-gray-900 mb-2">{scenario.scenario}</h4>
					<p class="text-gray-600 text-sm mb-3">{scenario.description}</p>
					<div class="bg-blue-50 rounded p-3">
						<div class="text-sm font-medium text-blue-900">Typical Rest: {scenario.restTime}</div>
						<div class="text-xs text-blue-700 mt-1">{scenario.outcome}</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Benefits -->
	<div class="bg-green-50 border border-green-200 rounded-lg p-8">
		<h3 class="text-xl font-semibold text-green-900 mb-4 text-center">Why This Matters</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div class="flex items-start space-x-3">
				<div class="text-green-600 text-xl">✅</div>
				<div>
					<h4 class="font-medium text-green-900">Prevents Overtraining</h4>
					<p class="text-green-800 text-sm">Ensures adequate recovery between sets</p>
				</div>
			</div>
			<div class="flex items-start space-x-3">
				<div class="text-green-600 text-xl">✅</div>
				<div>
					<h4 class="font-medium text-green-900">Optimizes Performance</h4>
					<p class="text-green-800 text-sm">Start sets when you're truly ready</p>
				</div>
			</div>
			<div class="flex items-start space-x-3">
				<div class="text-green-600 text-xl">✅</div>
				<div>
					<h4 class="font-medium text-green-900">Reduces Injury Risk</h4>
					<p class="text-green-800 text-sm">Prevents training in a fatigued state</p>
				</div>
			</div>
			<div class="flex items-start space-x-3">
				<div class="text-green-600 text-xl">✅</div>
				<div>
					<h4 class="font-medium text-green-900">Personalized Training</h4>
					<p class="text-green-800 text-sm">Adapts to your unique recovery patterns</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Acknowledgment -->
	<div class="bg-white rounded-lg shadow-lg p-8">
		<div class="text-center">
			<h3 class="text-xl font-semibold text-gray-900 mb-4">Ready to Experience Smart Rest?</h3>
			<p class="text-gray-600 mb-6">
				This system will revolutionize how you train. You'll never have to guess about rest times
				again.
			</p>

			<label class="flex items-center justify-center space-x-3 mb-6">
				<input
					type="checkbox"
					bind:checked={understood}
					class="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
				/>
				<span class="text-gray-700">
					I understand how the smart rest system works and am ready to use it
				</span>
			</label>

			<button
				on:click={acknowledgeUnderstanding}
				disabled={!understood}
				class="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
			>
				Start My Fitness Journey
			</button>
		</div>
	</div>
</div>
