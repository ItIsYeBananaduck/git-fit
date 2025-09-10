<script lang="ts">
	import WorkoutCard from '$lib/components/WorkoutCard.svelte';

	// Mock workout data
	let activePrograms = [
		{
			id: 1,
			name: 'Full Body Transformation',
			currentWeek: 3,
			totalWeeks: 12,
			progress: 25,
			nextWorkout: {
				id: 101,
				name: 'Upper Body Strength',
				estimatedDuration: 45,
				exercises: 8
			}
		},
		{
			id: 2,
			name: 'HIIT Fat Burner',
			currentWeek: 2,
			totalWeeks: 6,
			progress: 33,
			nextWorkout: {
				id: 102,
				name: 'Cardio Blast',
				estimatedDuration: 30,
				exercises: 6
			}
		}
	];

	let quickWorkouts = [
		{
			id: 201,
			name: '15-Min Morning Boost',
			duration: 15,
			difficulty: 'beginner',
			type: 'cardio',
			exercises: 5
		},
		{
			id: 202,
			name: 'Core Crusher',
			duration: 20,
			difficulty: 'intermediate',
			type: 'strength',
			exercises: 6
		},
		{
			id: 203,
			name: 'Full Body HIIT',
			duration: 25,
			difficulty: 'advanced',
			type: 'cardio',
			exercises: 8
		}
	];

	let recentWorkouts = [
		{
			id: 301,
			name: 'Lower Body Power',
			program: 'Full Body Transformation',
			completedAt: '2025-02-01T14:30:00',
			duration: 48,
			caloriesBurned: 340
		},
		{
			id: 302,
			name: 'HIIT Cardio Blast',
			program: 'Fat Loss Program',
			completedAt: '2025-01-30T09:15:00',
			duration: 32,
			caloriesBurned: 290
		}
	];
</script>

<svelte:head>
	<title>Workouts - Technically Fit</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<h1 class="text-2xl font-bold text-gray-900 mb-2">Your Workouts</h1>
		<p class="text-gray-600">Track your progress and stay consistent with your fitness journey</p>
	</div>

	<!-- Active Programs -->
	{#if activePrograms.length > 0}
		<div class="space-y-4">
			<h2 class="text-xl font-semibold text-gray-900">Active Programs</h2>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{#each activePrograms as program}
					<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-semibold text-gray-900">{program.name}</h3>
							<span class="text-sm text-gray-500">
								Week {program.currentWeek} of {program.totalWeeks}
							</span>
						</div>

						<!-- Progress Bar -->
						<div class="mb-4">
							<div class="flex justify-between text-sm mb-2">
								<span class="text-gray-600">Progress</span>
								<span class="font-medium">{program.progress}%</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div
									class="bg-secondary h-2 rounded-full transition-all duration-500"
									style="width: {program.progress}%"
								></div>
							</div>
						</div>

						<!-- Next Workout -->
						<div class="bg-gray-50 rounded-lg p-4">
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm text-gray-600">Next Workout</span>
								<span class="text-xs text-gray-500">{program.nextWorkout.exercises} exercises</span>
							</div>
							<h4 class="font-medium text-gray-900 mb-2">{program.nextWorkout.name}</h4>
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-600"
									>{program.nextWorkout.estimatedDuration} min</span
								>
								<button
									class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
								>
									Start Workout
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Quick Workouts -->
	<div class="space-y-4">
		<h2 class="text-xl font-semibold text-gray-900">Quick Workouts</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each quickWorkouts as workout}
				<WorkoutCard {workout} />
			{/each}
		</div>
	</div>

	<!-- Recent Workouts -->
	<div class="space-y-4">
		<h2 class="text-xl font-semibold text-gray-900">Recent Activity</h2>
		<div class="bg-white rounded-xl shadow-sm border border-gray-200">
			{#each recentWorkouts as workout, index}
				<div class="p-6 {index !== recentWorkouts.length - 1 ? 'border-b border-gray-200' : ''}">
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<h3 class="font-medium text-gray-900">{workout.name}</h3>
							<p class="text-sm text-gray-600 mt-1">{workout.program}</p>
							<div class="flex items-center mt-2 space-x-4 text-xs text-gray-500">
								<span>{new Date(workout.completedAt).toLocaleDateString()}</span>
								<span>{workout.duration} min</span>
								<span>{workout.caloriesBurned} cal</span>
							</div>
						</div>
						<div class="flex items-center">
							<div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
								<svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
