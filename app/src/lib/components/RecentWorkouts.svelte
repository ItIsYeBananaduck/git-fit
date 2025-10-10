<script lang="ts">
	// Mock recent workouts data
	let recentWorkouts = [
		{
			id: 1,
			name: 'Full Body Strength',
			program: 'Beginner Fitness Program',
			date: '2025-02-01',
			duration: 45,
			caloriesBurned: 320,
			completed: true
		},
		{
			id: 2,
			name: 'HIIT Cardio Blast',
			program: 'Fat Loss Program',
			date: '2025-01-30',
			duration: 30,
			caloriesBurned: 280,
			completed: true
		},
		{
			id: 3,
			name: 'Upper Body Power',
			program: 'Strength Building',
			date: '2025-01-28',
			duration: 50,
			caloriesBurned: 350,
			completed: true
		},
		{
			id: 4,
			name: 'Core & Flexibility',
			program: 'Recovery Program',
			date: '2025-01-26',
			duration: 25,
			caloriesBurned: 150,
			completed: false
		}
	];
</script>

<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
	<div class="flex items-center justify-between mb-6">
		<h3 class="text-lg font-semibold text-gray-900">Recent Workouts</h3>
		<a href="/workouts" class="text-primary hover:text-blue-700 text-sm font-medium">
			View All
		</a>
	</div>

	<div class="space-y-4">
		{#each recentWorkouts as workout}
			<div class="flex items-center p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
				<div class="flex-shrink-0">
					<div class="w-10 h-10 rounded-lg flex items-center justify-center
						{workout.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}">
						{#if workout.completed}
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
						{:else}
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
							</svg>
						{/if}
					</div>
				</div>
				
				<div class="ml-4 flex-1">
					<div class="flex items-center justify-between">
						<h4 class="text-sm font-medium text-gray-900">{workout.name}</h4>
						<span class="text-xs text-gray-500">
							{new Date(workout.date).toLocaleDateString()}
						</span>
					</div>
					<p class="text-sm text-gray-600 mt-1">{workout.program}</p>
					<div class="flex items-center mt-2 space-x-4 text-xs text-gray-500">
						<span>⏱️ {workout.duration} min</span>
						<span>🔥 {workout.caloriesBurned} cal</span>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-4 pt-4 border-t border-gray-200">
		<button class="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
			Start New Workout
		</button>
	</div>
</div>