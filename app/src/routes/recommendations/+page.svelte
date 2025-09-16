<script>
	import { page } from '$app/stores';
	import AdaptiveRecommendationsList from '$lib/components/recommendations/AdaptiveRecommendationsList.svelte';
	import ProgressIndicator from '$lib/components/progress/ProgressIndicator.svelte';

	// Get user ID from auth store or page params
	let userId = 'current-user'; // In real app, get from auth
</script>

<svelte:head>
	<title>Adaptive Recommendations - Technically Fit</title>
	<meta name="description" content="Personalized fitness recommendations based on your progress" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Page Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Adaptive Recommendations</h1>
			<p class="text-lg text-gray-600">
				AI-powered suggestions to optimize your fitness journey based on your unique progress and
				performance data
			</p>
		</div>

		<!-- Progress Overview -->
		<div class="mb-8">
			<ProgressIndicator {userId} />
		</div>

		<!-- Quick Stats -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
			<div class="bg-white rounded-lg shadow-sm border p-6">
				<div class="flex items-center">
					<div class="text-3xl mr-4">🧠</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900">AI Analysis</h3>
						<p class="text-sm text-gray-600">Real-time performance analysis</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-lg shadow-sm border p-6">
				<div class="flex items-center">
					<div class="text-3xl mr-4">📊</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900">Data-Driven</h3>
						<p class="text-sm text-gray-600">Based on your actual workout data</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-lg shadow-sm border p-6">
				<div class="flex items-center">
					<div class="text-3xl mr-4">🎯</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900">Goal-Aligned</h3>
						<p class="text-sm text-gray-600">Tailored to your fitness goals</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Recommendations List -->
		<AdaptiveRecommendationsList {userId} />

		<!-- Recommendation Categories Info -->
		<div class="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<div class="bg-white rounded-lg shadow-sm border p-6">
				<div class="text-2xl mb-3">💪</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Workout Optimization</h3>
				<p class="text-sm text-gray-600">
					Adjust training frequency, intensity, and exercise selection based on your progress and
					recovery needs.
				</p>
			</div>

			<div class="bg-white rounded-lg shadow-sm border p-6">
				<div class="text-2xl mb-3">🥗</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Nutrition Guidance</h3>
				<p class="text-sm text-gray-600">
					Optimize macronutrient distribution, meal timing, and calorie consistency for better
					results.
				</p>
			</div>

			<div class="bg-white rounded-lg shadow-sm border p-6">
				<div class="text-2xl mb-3">😴</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Recovery Focus</h3>
				<p class="text-sm text-gray-600">
					Prioritize sleep quality, active recovery, and stress management for optimal performance.
				</p>
			</div>

			<div class="bg-white rounded-lg shadow-sm border p-6">
				<div class="text-2xl mb-3">📈</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Progress Acceleration</h3>
				<p class="text-sm text-gray-600">
					Implement progressive overload and periodization strategies to break through plateaus.
				</p>
			</div>

			<div class="bg-white rounded-lg shadow-sm border p-6">
				<div class="text-2xl mb-3">🚀</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Plateau Busters</h3>
				<p class="text-sm text-gray-600">
					Strategic interventions to overcome training stagnation and reignite progress.
				</p>
			</div>

			<div class="bg-white rounded-lg shadow-sm border p-6">
				<div class="text-2xl mb-3">🎯</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Goal Alignment</h3>
				<p class="text-sm text-gray-600">
					Ensure your training and nutrition align with your specific fitness objectives.
				</p>
			</div>
		</div>
	</div>
</div>
