<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/convex';

	let importStatus = '';
	let isImporting = false;
	let exerciseCount = 0;
	let importResult = null;

	onMount(async () => {
		try {
			const exercises = await api.exercises.getExercises({ limit: 1 });
			exerciseCount = exercises.length;
		} catch (error) {
			console.error('Error checking exercise count:', error);
		}
	});

	async function importExercises() {
		isImporting = true;
		importStatus = 'Fetching exercise data from GitHub...';

		try {
			// Fetch exercise data from Free Exercise Database
			const response = await fetch(
				'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
			);
			const exercises = await response.json();

			importStatus = `Importing ${exercises.length} exercises into database...`;

			// Import in batches to avoid timeouts
			const batchSize = 50;
			let totalImported = 0;

			for (let i = 0; i < exercises.length; i += batchSize) {
				const batch = exercises.slice(i, i + batchSize);

				const result = await api.exercises.importExercises({ exercises: batch });

				if (result.success) {
					totalImported += result.imported;
					importStatus = `Imported ${totalImported} of ${exercises.length} exercises...`;
				} else {
					importStatus = `Error importing batch: ${result.error}`;
					break;
				}
			}

			// Initialize equipment recommendations
			await api.exercises.initializeEquipmentRecommendations();

			importResult = {
				success: true,
				totalImported,
				totalExercises: exercises.length
			};

			importStatus = `Successfully imported ${totalImported} exercises!`;

			// Refresh exercise count
			const updatedExercises = await api.exercises.getExercises({ limit: 1 });
			exerciseCount = updatedExercises.length;
		} catch (error) {
			importResult = {
				success: false,
				error: error.message
			};
			importStatus = `Import failed: ${error.message}`;
		}

		isImporting = false;
	}

	async function testEquipmentRecommendations() {
		try {
			const dumbbellExercises = await api.exercises.getExercises({
				equipment: 'dumbbell',
				limit: 5
			});

			console.log('Sample dumbbell exercises:', dumbbellExercises);

			if (dumbbellExercises.length > 0) {
				const exerciseWithRecs = await api.exercises.getExerciseWithRecommendations({
					exerciseId: dumbbellExercises[0].exerciseId
				});
				console.log('Exercise with recommendations:', exerciseWithRecs);
			}
		} catch (error) {
			console.error('Error testing recommendations:', error);
		}
	}
</script>

<svelte:head>
	<title>Admin - Exercise Import - Technically Fit</title>
</svelte:head>

<div class="space-y-6">
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<h1 class="text-2xl font-bold text-gray-900 mb-2">Exercise Database Administration</h1>
		<p class="text-gray-600">
			Import exercises from Free Exercise Database and manage equipment recommendations
		</p>
	</div>

	<!-- Current Status -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<h2 class="text-xl font-semibold text-gray-900 mb-4">Database Status</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="bg-blue-50 rounded-lg p-4">
				<div class="text-2xl font-bold text-blue-600">{exerciseCount}</div>
				<div class="text-sm text-blue-600">Exercises in Database</div>
			</div>
			<div class="bg-green-50 rounded-lg p-4">
				<div class="text-2xl font-bold text-green-600">800+</div>
				<div class="text-sm text-green-600">Available to Import</div>
			</div>
			<div class="bg-purple-50 rounded-lg p-4">
				<div class="text-2xl font-bold text-purple-600">6</div>
				<div class="text-sm text-purple-600">Equipment Types</div>
			</div>
		</div>
	</div>

	<!-- Import Section -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<h2 class="text-xl font-semibold text-gray-900 mb-4">Import Exercises</h2>

		<div class="space-y-4">
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
				<div class="flex items-start">
					<div class="w-6 h-6 bg-yellow-600 rounded-full mr-3"></div>
					<div>
						<h3 class="font-medium text-yellow-800">About the Import</h3>
						<p class="text-sm text-yellow-700 mt-1">
							This will import 800+ exercises from the Free Exercise Database, including:
						</p>
						<ul class="text-sm text-yellow-700 mt-2 list-disc list-inside">
							<li>Exercise names, instructions, and difficulty levels</li>
							<li>Muscle group targeting and exercise categories</li>
							<li>Equipment requirements and automatic machine recommendations</li>
							<li>High-quality form demonstration images</li>
						</ul>
					</div>
				</div>
			</div>

			{#if isImporting}
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<div class="flex items-center">
						<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
						<span class="text-blue-800">{importStatus}</span>
					</div>
				</div>
			{/if}

			{#if importResult}
				<div
					class="rounded-lg p-4 {importResult.success
						? 'bg-green-50 border border-green-200'
						: 'bg-red-50 border border-red-200'}"
				>
					{#if importResult.success}
						<div class="text-green-800">
							<h3 class="font-medium">Import Successful!</h3>
							<p class="text-sm mt-1">
								Imported {importResult.totalImported} of {importResult.totalExercises} exercises
							</p>
						</div>
					{:else}
						<div class="text-red-800">
							<h3 class="font-medium">Import Failed</h3>
							<p class="text-sm mt-1">{importResult.error}</p>
						</div>
					{/if}
				</div>
			{/if}

			<div class="flex gap-4">
				<button
					on:click={importExercises}
					disabled={isImporting}
					class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
				>
					{isImporting ? 'Importing...' : 'Import Exercise Database'}
				</button>

				<button
					on:click={testEquipmentRecommendations}
					class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
				>
					Test Equipment Recommendations
				</button>
			</div>
		</div>
	</div>

	<!-- Equipment Recommendations Preview -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<h2 class="text-xl font-semibold text-gray-900 mb-4">Equipment Recommendation System</h2>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div>
				<h3 class="font-medium text-gray-900 mb-3">How It Works</h3>
				<ul class="space-y-2 text-sm text-gray-600">
					<li class="flex items-start">
						<span class="text-green-500 mr-2">✓</span>
						Auto-recommends primary machines for each exercise
					</li>
					<li class="flex items-start">
						<span class="text-green-500 mr-2">✓</span>
						Suggests alternative equipment options
					</li>
					<li class="flex items-start">
						<span class="text-green-500 mr-2">✓</span>
						Provides home gym alternatives
					</li>
					<li class="flex items-start">
						<span class="text-green-500 mr-2">✓</span>
						Remembers user equipment preferences
					</li>
				</ul>
			</div>

			<div>
				<h3 class="font-medium text-gray-900 mb-3">Equipment Categories</h3>
				<div class="grid grid-cols-2 gap-2 text-sm">
					<div class="bg-gray-50 rounded p-2">
						<div class="font-medium">Dumbbells</div>
						<div class="text-gray-600">Adjustable, Fixed, Olympic</div>
					</div>
					<div class="bg-gray-50 rounded p-2">
						<div class="font-medium">Machines</div>
						<div class="text-gray-600">Multi-station, Functional</div>
					</div>
					<div class="bg-gray-50 rounded p-2">
						<div class="font-medium">Cables</div>
						<div class="text-gray-600">Crossover, Pulldown</div>
					</div>
					<div class="bg-gray-50 rounded p-2">
						<div class="font-medium">Bodyweight</div>
						<div class="text-gray-600">Pull-up bar, Mat</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
