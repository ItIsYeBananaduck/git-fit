<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/convex';

	export let userId;
	export let compact = false;

	let progressData = {
		workoutsThisWeek: 0,
		workoutGoal: 7,
		caloriesToday: 0,
		calorieGoal: 2000,
		achievementsEarned: 0,
		totalAchievements: 0,
		currentStreak: 0
	};
	let loading = true;

	// Load progress data
	async function loadProgress() {
		try {
			loading = true;

			// Mock data for now - in real implementation, these would come from actual queries
			progressData = {
				workoutsThisWeek: 4,
				workoutGoal: 7,
				caloriesToday: 1850,
				calorieGoal: 2000,
				achievementsEarned: 12,
				totalAchievements: 25,
				currentStreak: 5
			};

			// In real implementation:
			// const [workouts, nutrition, achievements] = await Promise.all([
			//   api.fitnessData.getWeeklyWorkouts.query({ userId }),
			//   api.nutrition.getTodayNutrition.query({ userId }),
			//   api.achievements.getUserAchievements.query({ userId })
			// ]);
		} catch (error) {
			console.error('Error loading progress:', error);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadProgress();
	});

	// Calculate percentages
	$: workoutProgress = (progressData.workoutsThisWeek / progressData.workoutGoal) * 100;
	$: calorieProgress = (progressData.caloriesToday / progressData.calorieGoal) * 100;
	$: achievementProgress = (progressData.achievementsEarned / progressData.totalAchievements) * 100;
</script>

{#if compact}
	<!-- Compact Progress Bar -->
	<div class="bg-white rounded-lg shadow-sm border p-4">
		<div class="flex items-center justify-between mb-3">
			<h3 class="text-sm font-medium text-gray-900">Today's Progress</h3>
			<span class="text-xs text-gray-500"
				>{Math.round((workoutProgress + calorieProgress) / 2)}% complete</span
			>
		</div>

		<div class="space-y-2">
			<!-- Workout Progress -->
			<div>
				<div class="flex justify-between text-xs text-gray-600 mb-1">
					<span>Workouts</span>
					<span>{progressData.workoutsThisWeek}/{progressData.workoutGoal}</span>
				</div>
				<div class="w-full bg-gray-200 rounded-full h-1.5">
					<div
						class="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
						style="width: {Math.min(workoutProgress, 100)}%"
					></div>
				</div>
			</div>

			<!-- Calorie Progress -->
			<div>
				<div class="flex justify-between text-xs text-gray-600 mb-1">
					<span>Calories</span>
					<span>{progressData.caloriesToday}/{progressData.calorieGoal}</span>
				</div>
				<div class="w-full bg-gray-200 rounded-full h-1.5">
					<div
						class="bg-green-600 h-1.5 rounded-full transition-all duration-500"
						style="width: {Math.min(calorieProgress, 100)}%"
					></div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- Full Progress Dashboard -->
	<div class="bg-white rounded-lg shadow-sm border p-6">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-bold text-gray-900">Your Progress</h2>
			<div class="text-sm text-gray-500">
				🔥 {progressData.currentStreak} day streak
			</div>
		</div>

		{#if loading}
			<div class="flex justify-center items-center py-8">
				<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<!-- Workout Progress -->
				<div class="text-center">
					<div class="relative w-24 h-24 mx-auto mb-4">
						<svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
							<path
								d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
								fill="none"
								stroke="#e5e7eb"
								stroke-width="2"
							/>
							<path
								d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
								fill="none"
								stroke="#3b82f6"
								stroke-width="2"
								stroke-dasharray="{workoutProgress}, 100"
							/>
						</svg>
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="text-lg font-semibold text-gray-900"
								>{progressData.workoutsThisWeek}</span
							>
						</div>
					</div>
					<h3 class="font-medium text-gray-900 mb-1">Weekly Workouts</h3>
					<p class="text-sm text-gray-600">
						{progressData.workoutsThisWeek} of {progressData.workoutGoal} completed
					</p>
				</div>

				<!-- Nutrition Progress -->
				<div class="text-center">
					<div class="relative w-24 h-24 mx-auto mb-4">
						<svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
							<path
								d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
								fill="none"
								stroke="#e5e7eb"
								stroke-width="2"
							/>
							<path
								d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
								fill="none"
								stroke="#10b981"
								stroke-width="2"
								stroke-dasharray="{calorieProgress}, 100"
							/>
						</svg>
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="text-lg font-semibold text-gray-900">{Math.round(calorieProgress)}%</span
							>
						</div>
					</div>
					<h3 class="font-medium text-gray-900 mb-1">Daily Calories</h3>
					<p class="text-sm text-gray-600">
						{progressData.caloriesToday} of {progressData.calorieGoal} kcal
					</p>
				</div>

				<!-- Achievement Progress -->
				<div class="text-center">
					<div class="relative w-24 h-24 mx-auto mb-4">
						<svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
							<path
								d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
								fill="none"
								stroke="#e5e7eb"
								stroke-width="2"
							/>
							<path
								d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
								fill="none"
								stroke="#8b5cf6"
								stroke-width="2"
								stroke-dasharray="{achievementProgress}, 100"
							/>
						</svg>
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="text-lg font-semibold text-gray-900"
								>{progressData.achievementsEarned}</span
							>
						</div>
					</div>
					<h3 class="font-medium text-gray-900 mb-1">Achievements</h3>
					<p class="text-sm text-gray-600">
						{progressData.achievementsEarned} of {progressData.totalAchievements} earned
					</p>
				</div>
			</div>

			<!-- Quick Stats -->
			<div class="mt-6 pt-6 border-t border-gray-200">
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
					<div>
						<div class="text-2xl font-bold text-blue-600">{progressData.workoutsThisWeek}</div>
						<div class="text-sm text-gray-600">This Week</div>
					</div>
					<div>
						<div class="text-2xl font-bold text-green-600">{progressData.caloriesToday}</div>
						<div class="text-sm text-gray-600">Today (kcal)</div>
					</div>
					<div>
						<div class="text-2xl font-bold text-purple-600">{progressData.achievementsEarned}</div>
						<div class="text-sm text-gray-600">Achievements</div>
					</div>
					<div>
						<div class="text-2xl font-bold text-orange-600">{progressData.currentStreak}</div>
						<div class="text-sm text-gray-600">Day Streak</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
