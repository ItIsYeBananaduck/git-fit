<script lang="ts">
	export let workout: any;

	function getDifficultyColor(difficulty: string) {
		switch (difficulty) {
			case 'beginner': return 'bg-green-100 text-green-800';
			case 'intermediate': return 'bg-yellow-100 text-yellow-800';
			case 'advanced': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getTypeIcon(type: string) {
		switch (type) {
			case 'cardio': return '🏃';
			case 'strength': return '💪';
			case 'flexibility': return '🧘';
			case 'hiit': return '⚡';
			default: return '🏋️';
		}
	}
</script>

<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
	<div class="flex items-start justify-between mb-4">
		<div class="flex items-center">
			<span class="text-2xl mr-3">{getTypeIcon(workout.type)}</span>
			<div>
				<h3 class="font-semibold text-gray-900">{workout.name}</h3>
				<div class="flex items-center mt-1 space-x-2">
					<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getDifficultyColor(workout.difficulty)}">
						{workout.difficulty}
					</span>
				</div>
			</div>
		</div>
	</div>

	<div class="space-y-3 mb-6">
		<div class="flex items-center justify-between text-sm">
			<span class="text-gray-600">Duration</span>
			<span class="font-medium">{workout.duration} minutes</span>
		</div>
		<div class="flex items-center justify-between text-sm">
			<span class="text-gray-600">Exercises</span>
			<span class="font-medium">{workout.exercises}</span>
		</div>
	</div>

	<button class="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
		Start Workout
	</button>
</div>