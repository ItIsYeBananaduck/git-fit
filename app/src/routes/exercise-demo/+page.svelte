<script lang="ts">
	import EquipmentSelector from '$lib/components/EquipmentSelector.svelte';

	// Sample exercise data to demonstrate the equipment recommendation system
	let sampleExercises = [
		{
			name: 'Dumbbell Bench Press',
			primaryEquipment: 'dumbbell',
			recommendedMachines: ['Adjustable Dumbbells', 'Fixed Weight Dumbbells', 'Olympic Dumbbells'],
			alternativeEquipment: ['Resistance Bands', 'Cable Machine', 'Barbell', 'Push-ups'],
			selectedEquipment: ''
		},
		{
			name: 'Lat Pulldown',
			primaryEquipment: 'cable',
			recommendedMachines: ['Lat Pulldown Machine', 'Cable Crossover', 'Functional Trainer'],
			alternativeEquipment: ['Resistance Bands', 'Pull-up Bar', 'Suspension Trainer'],
			selectedEquipment: ''
		},
		{
			name: 'Barbell Squat',
			primaryEquipment: 'barbell',
			recommendedMachines: ['Olympic Barbell', 'Safety Squat Bar', 'Power Rack'],
			alternativeEquipment: ['Dumbbells', 'Kettlebells', 'Bodyweight Squats', 'Leg Press Machine'],
			selectedEquipment: ''
		},
		{
			name: 'Push-ups',
			primaryEquipment: 'body only',
			recommendedMachines: ['Exercise Mat', 'Push-up Handles', 'Suspension Trainer'],
			alternativeEquipment: ['Resistance Bands', 'Dumbbell Press', 'Chest Press Machine'],
			selectedEquipment: ''
		}
	];

	// Mock user preferences
	let userPreferences = ['Adjustable', 'Functional', 'Olympic'];

	function handleEquipmentSelection(event: CustomEvent) {
		const { exerciseName, equipment, isAlternative } = event.detail;
		console.log(`Selected ${equipment} for ${exerciseName} (Alternative: ${isAlternative})`);

		// Update the exercise selection
		const exercise = sampleExercises.find((ex) => ex.name === exerciseName);
		if (exercise) {
			exercise.selectedEquipment = equipment;
			sampleExercises = [...sampleExercises]; // Trigger reactivity
		}
	}

	function getSelectionSummary() {
		const selected = sampleExercises.filter((ex) => ex.selectedEquipment);
		const optimal = selected.filter((ex) => ex.recommendedMachines.includes(ex.selectedEquipment));
		const alternatives = selected.filter(
			(ex) => !ex.recommendedMachines.includes(ex.selectedEquipment)
		);

		return {
			total: selected.length,
			optimal: optimal.length,
			alternatives: alternatives.length
		};
	}

	$: summary = getSelectionSummary();
</script>

<svelte:head>
	<title>Exercise Equipment Demo - Adaptive fIt</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<h1 class="text-2xl font-bold text-gray-900 mb-2">Equipment Recommendation Demo</h1>
		<p class="text-gray-600">
			See how GitFit automatically recommends equipment and provides alternatives for each exercise
		</p>
	</div>

	<!-- Summary Stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
			<div class="text-2xl font-bold text-blue-600">{sampleExercises.length}</div>
			<div class="text-sm text-gray-600">Sample Exercises</div>
		</div>
		<div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
			<div class="text-2xl font-bold text-green-600">{summary.total}</div>
			<div class="text-sm text-gray-600">Equipment Selected</div>
		</div>
		<div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
			<div class="text-2xl font-bold text-green-600">{summary.optimal}</div>
			<div class="text-sm text-gray-600">Optimal Choices</div>
		</div>
		<div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
			<div class="text-2xl font-bold text-yellow-600">{summary.alternatives}</div>
			<div class="text-sm text-gray-600">Alternatives Used</div>
		</div>
	</div>

	<!-- User Preferences -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<h2 class="text-xl font-semibold text-gray-900 mb-4">Your Equipment Preferences</h2>
		<div class="flex flex-wrap gap-2">
			{#each userPreferences as preference}
				<span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
					{preference}
				</span>
			{/each}
		</div>
		<p class="text-sm text-gray-600 mt-2">
			The system prioritizes equipment containing these keywords when making recommendations.
		</p>
	</div>

	<!-- Exercise Equipment Selectors -->
	<div class="space-y-6">
		<h2 class="text-xl font-semibold text-gray-900">Exercise Equipment Selection</h2>

		{#each sampleExercises as exercise}
			<EquipmentSelector
				exerciseName={exercise.name}
				primaryEquipment={exercise.primaryEquipment}
				recommendedMachines={exercise.recommendedMachines}
				alternativeEquipment={exercise.alternativeEquipment}
				selectedEquipment={exercise.selectedEquipment}
				{userPreferences}
				on:equipmentSelected={handleEquipmentSelection}
			/>
		{/each}
	</div>

	<!-- How It Works -->
	<div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
		<h2 class="text-xl font-semibold text-gray-900 mb-4">How the Smart Recommendations Work</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div>
				<h3 class="font-medium text-gray-900 mb-3 flex items-center">
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
					</svg>
					Intelligent Matching
				</h3>
				<ul class="space-y-2 text-sm text-gray-700">
					<li>• Analyzes exercise requirements and muscle groups</li>
					<li>• Matches equipment to exercise biomechanics</li>
					<li>• Considers user's available equipment and preferences</li>
					<li>• Provides ranked recommendations from best to alternatives</li>
				</ul>
			</div>
			<div>
				<h3 class="font-medium text-gray-900 mb-3">🔄 Adaptive Learning</h3>
				<ul class="space-y-2 text-sm text-gray-700">
					<li>• Learns from your equipment choices over time</li>
					<li>• Remembers your gym setup (home, commercial, budget)</li>
					<li>• Suggests equipment upgrades based on your progress</li>
					<li>• Adapts to equipment availability and constraints</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Equipment Selection Summary -->
	{#if summary.total > 0}
		<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Your Equipment Selections</h2>
			<div class="space-y-3">
				{#each sampleExercises.filter((ex) => ex.selectedEquipment) as exercise}
					<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<div>
							<div class="font-medium text-gray-900">{exercise.name}</div>
							<div class="text-sm text-gray-600">Using: {exercise.selectedEquipment}</div>
						</div>
						<span
							class="px-3 py-1 rounded-full text-xs font-medium {exercise.recommendedMachines.includes(
								exercise.selectedEquipment
							)
								? 'bg-green-100 text-green-800 border border-green-200'
								: 'bg-yellow-100 text-yellow-800 border border-yellow-200'}"
						>
							{exercise.recommendedMachines.includes(exercise.selectedEquipment)
								? 'Optimal'
								: 'Alternative'}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
