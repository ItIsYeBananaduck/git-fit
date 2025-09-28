<script>
	import { page } from '$app/stores';
	import AchievementList from '$lib/components/achievements/AchievementList.svelte';
	import ProgressIndicator from '$lib/components/progress/ProgressIndicator.svelte';

	// Get user ID from auth store or page params
	let userId = 'current-user'; // In real app, get from auth
</script>

<svelte:head>
	<title>Achievements - Adaptive fIt</title>
	<meta name="description" content="Track your fitness achievements and progress" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Page Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Achievements</h1>
			<p class="text-lg text-gray-600">
				Celebrate your fitness journey with badges, milestones, and rewards
			</p>
		</div>

		<!-- Progress Overview -->
		<div class="mb-8">
			<ProgressIndicator {userId} />
		</div>

		<!-- Achievement Categories Quick Nav -->
		<div class="mb-6">
			<div class="flex flex-wrap gap-2">
				<button
					class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
					on:click={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
				>
					🏆 All
				</button>
				<button
					class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
					on:click={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
				>
					🏃 Workout
				</button>
				<button
					class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
					on:click={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
				>
					🍎 Nutrition
				</button>
				<button
					class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
					on:click={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
				>
					💪 Strength
				</button>
				<button
					class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
					on:click={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
				>
					🏅 Special
				</button>
			</div>
		</div>

		<!-- Achievements List -->
		<AchievementList {userId} />

		<!-- Achievement Tips -->
		<div class="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-6 w-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-blue-800">Achievement Tips</h3>
					<div class="mt-2 text-sm text-blue-700">
						<ul class="list-disc list-inside space-y-1">
							<li>Complete workouts consistently to build streaks</li>
							<li>Log your meals daily to unlock nutrition achievements</li>
							<li>Track your strength gains to earn powerlifting badges</li>
							<li>Share your progress to unlock social achievements</li>
							<li>Stay consistent to earn rare and epic achievements</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
