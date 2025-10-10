<!-- File: NutritionTracker.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api/convex';
	import type { Id } from '../../../convex/_generated/dataModel.js';

	import { NutritionCalculator } from '../nutrition/nutritionCalculator.js';
	import { FoodDatabaseService } from '../nutrition/foodDatabaseService.js';
	import { BarcodeScanner } from '../nutrition/barcodeScanner.js';
	import type {
		NutritionGoals,
		FoodEntry,
		NutritionInfo,
		FoodItem
	} from '../nutrition/nutritionCalculator.js';

	// Convex client
	import { useQuery } from 'convex-svelte';
	import { authStore } from '../stores/auth.js';

	// Component state
	let nutritionCalculator: NutritionCalculator;
	let foodService: FoodDatabaseService;
	let barcodeScanner: BarcodeScanner;

	let currentUser: any = null;
	let currentGoals: NutritionGoals | null = null;
	let dailyEntries: any[] = [];
	let dailyTotals: NutritionInfo | null = null;
	let goalProgress: any = null;

	let showFoodSearch = false;
	let showBarcodeScanner = false;
	let searchQuery = '';
	let searchResults: any[] = [];
	let isSearching = false;

	let selectedMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'breakfast';
	let videoElement: HTMLVideoElement;

	// Convex queries and mutations
	$: userId = currentUser?._id;
	$: today = new Date().toISOString().split('T')[0];

	$: nutritionGoals = useQuery(api.nutrition.getNutritionGoals, userId ? { userId } : 'skip');
	$: activeGoal = useQuery(api.nutrition.getActiveNutritionGoal, userId ? { userId } : 'skip');
	$: foodEntries = useQuery(
		api.nutrition.getFoodEntries,
		userId && today ? { userId, date: today } : 'skip'
	);
	$: dailyNutritionTotals = useQuery(
		api.nutrition.getDailyNutritionTotals,
		userId && today ? { userId, date: today } : 'skip'
	);

	const addFoodEntryMutation = null; // TODO: Implement mutation
	const deleteFoodEntryMutation = null; // TODO: Implement mutation
	const searchFoodsQuery = useQuery(
		api.nutrition.searchFoods,
		searchQuery ? { query: searchQuery, limit: 10 } : 'skip'
	);

	// Initialize services
	onMount(async () => {
		nutritionCalculator = new NutritionCalculator();
		foodService = new FoodDatabaseService();
		barcodeScanner = new BarcodeScanner(foodService);

		// Get current user
		currentUser = await authStore.getAuthUser();

		loadNutritionData();
	});

	// Reactive statements for data updates
	$: if (activeGoal?.data) {
		currentGoals = activeGoal.data;
	}

	$: if (foodEntries?.data) {
		dailyEntries = foodEntries.data;
	}

	$: if (dailyNutritionTotals?.data) {
		dailyTotals = dailyNutritionTotals.data;
		if (currentGoals && dailyTotals) {
			goalProgress = nutritionCalculator?.analyzeGoalProgress(currentGoals, dailyTotals);
		}
	}

	$: if (searchFoodsQuery?.data) {
		searchResults = searchFoodsQuery.data;
	}

	async function loadNutritionData() {
		// Data is loaded reactively via Convex queries
		// Additional client-side calculations can be done here if needed
	}

	async function searchFoods() {
		if (!searchQuery.trim()) return;

		isSearching = true;
		try {
			// Search is handled reactively via Convex query
			// Additional client-side filtering can be done here if needed
		} catch (error) {
			console.error('Food search error:', error);
		} finally {
			isSearching = false;
		}
	}

	async function startBarcodeScanning() {
		try {
			showBarcodeScanner = true;
			await barcodeScanner.initializeScanner();

			const result = await barcodeScanner.startScanning(videoElement);

			if (result.success && result.food) {
				await addFoodToLog(result.food, 100); // Default 100g serving
			} else {
				alert(result.error || 'No food found for this barcode');
			}
		} catch (error) {
			console.error('Barcode scanning error:', error);
			alert('Failed to start barcode scanner');
		} finally {
			showBarcodeScanner = false;
			barcodeScanner.stopScanning();
		}
	}

	async function addFoodToLog(food: any, servingGrams: number) {
		if (!currentUser) {
			alert('Please log in to add food entries');
			return;
		}

		try {
			const nutrition = nutritionCalculator.calculateNutritionForServing(food, servingGrams);

			if (addFoodEntryMutation) {
				await addFoodEntryMutation({
					userId: currentUser._id,
					foodId: food.id,
					servingSize: servingGrams,
					mealType: selectedMealType,
					date: today,
					time: new Date().toTimeString().split(' ')[0] // HH:MM:SS format
				});
			} else {
				console.log('Food entry added (mock):', { food, servingGrams, selectedMealType });
			}

			// Close search/scanner
			showFoodSearch = false;
			showBarcodeScanner = false;
		} catch (error) {
			console.error('Error adding food entry:', error);
			alert('Failed to add food entry. Please check your permissions.');
		}
	}

	async function removeFoodEntry(entryId: string) {
		try {
			if (deleteFoodEntryMutation) {
				await deleteFoodEntryMutation({ entryId });
			} else {
				console.log('Food entry removed (mock):', entryId);
			}
		} catch (error) {
			console.error('Error removing food entry:', error);
			alert('Failed to remove food entry. Please check your permissions.');
		}
	}

	function getProgressColor(percentage: number): string {
		if (percentage < 70) return 'text-red-600';
		if (percentage < 95) return 'text-yellow-600';
		if (percentage > 115) return 'text-red-600';
		return 'text-green-600';
	}

	function getProgressWidth(percentage: number): number {
		return Math.min(percentage, 100);
	}
</script>

<div class="max-w-4xl mx-auto p-6 space-y-6">
	<!-- Header with Goals Overview -->
	<div class="bg-white rounded-lg shadow-md p-6">
		<div class="flex items-center justify-between mb-4">
			<h1 class="text-2xl font-bold text-gray-900">Nutrition Tracking</h1>
			<button
				on:click={() => (showFoodSearch = true)}
				class="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
			>
				<span class="text-lg" aria-hidden="true">➕</span>
				<span>Add Food</span>
			</button>
		</div>

		{#if currentGoals && dailyTotals && goalProgress}
			<!-- Macro Progress Bars -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="text-center">
					<div class="text-2xl font-bold {getProgressColor(goalProgress.percentages.calories)}">
						{dailyTotals.calories}
					</div>
					<div class="text-sm text-gray-600">{currentGoals.calories} cal</div>
					<div class="w-full bg-gray-200 rounded-full h-2 mt-1">
						<div
							class="bg-blue-600 h-2 rounded-full"
							style="width: {getProgressWidth(goalProgress.percentages.calories)}%"
						></div>
					</div>
					<div class="text-xs text-gray-500 mt-1">
						{Math.round(goalProgress.percentages.calories)}%
					</div>
				</div>

				<div class="text-center">
					<div class="text-2xl font-bold {getProgressColor(goalProgress.percentages.protein)}">
						{Math.round(dailyTotals.protein)}g
					</div>
					<div class="text-sm text-gray-600">{currentGoals.protein}g protein</div>
					<div class="w-full bg-gray-200 rounded-full h-2 mt-1">
						<div
							class="bg-red-500 h-2 rounded-full"
							style="width: {getProgressWidth(goalProgress.percentages.protein)}%"
						></div>
					</div>
					<div class="text-xs text-gray-500 mt-1">
						{Math.round(goalProgress.percentages.protein)}%
					</div>
				</div>

				<div class="text-center">
					<div class="text-2xl font-bold {getProgressColor(goalProgress.percentages.carbs)}">
						{Math.round(dailyTotals.carbs)}g
					</div>
					<div class="text-sm text-gray-600">{currentGoals.carbs}g carbs</div>
					<div class="w-full bg-gray-200 rounded-full h-2 mt-1">
						<div
							class="bg-yellow-500 h-2 rounded-full"
							style="width: {getProgressWidth(goalProgress.percentages.carbs)}%"
						></div>
					</div>
					<div class="text-xs text-gray-500 mt-1">
						{Math.round(goalProgress.percentages.carbs)}%
					</div>
				</div>

				<div class="text-center">
					<div class="text-2xl font-bold {getProgressColor(goalProgress.percentages.fat)}">
						{Math.round(dailyTotals.fat)}g
					</div>
					<div class="text-sm text-gray-600">{currentGoals.fat}g fat</div>
					<div class="w-full bg-gray-200 rounded-full h-2 mt-1">
						<div
							class="bg-purple-500 h-2 rounded-full"
							style="width: {getProgressWidth(goalProgress.percentages.fat)}%"
						></div>
					</div>
					<div class="text-xs text-gray-500 mt-1">{Math.round(goalProgress.percentages.fat)}%</div>
				</div>
			</div>

			<!-- Suggestions -->
			{#if goalProgress.suggestions.length > 0}
				<div class="mt-4 p-3 bg-blue-50 rounded-lg">
					<h3 class="font-medium text-blue-900 mb-2">💡 Suggestions</h3>
					<ul class="text-sm text-blue-800 space-y-1">
						{#each goalProgress.suggestions as suggestion}
							<li>{suggestion}</li>
						{/each}
					</ul>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Food Entries by Meal -->
	<div class="space-y-4">
		{#each ['breakfast', 'lunch', 'dinner', 'snack'] as mealType}
			<div class="bg-white rounded-lg shadow-md p-4">
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-lg font-semibold capitalize">{mealType}</h3>
					<button
						on:click={() => {
							selectedMealType = mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack';
							showFoodSearch = true;
						}}
						class="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
					>
						<span class="text-sm" aria-hidden="true">➕</span>
						<span>Add</span>
					</button>
				</div>

				{#each dailyEntries.filter((entry) => entry.mealType === mealType) as entry}
					<!-- Display food entry with backend data -->
					<div
						class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
					>
						<div>
							<div class="font-medium">{entry.food?.name || 'Unknown Food'}</div>
							<div class="text-sm text-gray-600">{entry.servingSize}g</div>
						</div>
						<div class="text-right">
							<div class="font-medium">{entry.nutrition.calories} cal</div>
							<div class="text-sm text-gray-600">
								P: {Math.round(entry.nutrition.protein)}g | C: {Math.round(entry.nutrition.carbs)}g
								| F: {Math.round(entry.nutrition.fat)}g
							</div>
						</div>
						<button
							on:click={() => removeFoodEntry(entry._id)}
							class="text-red-600 hover:text-red-700 ml-4"
						>
							×
						</button>
					</div>
				{/each}

				{#if dailyEntries.filter((entry) => entry.mealType === mealType).length === 0}
					<p class="text-gray-500 text-center py-4">No foods logged for {mealType}</p>
				{/if}
			</div>
		{/each}
	</div>
</div>

<!-- Food Search Modal -->
{#if showFoodSearch}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg max-w-md w-full m-4 max-h-96 overflow-hidden">
			<div class="p-4 border-b">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold">Add Food</h3>
					<button
						on:click={() => (showFoodSearch = false)}
						class="text-gray-500 hover:text-gray-700"
					>
						×
					</button>
				</div>

				<div class="space-y-3">
					<!-- Search Input -->
					<div class="relative">
						<input
							type="text"
							bind:value={searchQuery}
							on:input={searchFoods}
							placeholder="Search for food..."
							class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						<span class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" aria-hidden="true">🔍</span>
					</div>

					<!-- Quick Actions -->
					<div class="flex space-x-2">
						<button
							on:click={startBarcodeScanning}
							class="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-700"
						>
							<span class="text-sm" aria-hidden="true">📱</span>
							<span>Scan Barcode</span>
						</button>
					</div>
				</div>
			</div>

			<!-- Search Results -->
			<div class="p-4 max-h-64 overflow-y-auto">
				{#if isSearching}
					<div class="text-center py-4">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
						<p class="text-gray-600 mt-2">Searching...</p>
					</div>
				{:else if searchResults.length > 0}
					<div class="space-y-2">
						{#each searchResults as food}
							<button
								on:click={() => addFoodToLog(food, 100)}
								class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
							>
								<div class="font-medium">{food.name}</div>
								{#if food.brand}
									<div class="text-sm text-gray-600">{food.brand}</div>
								{/if}
								<div class="text-sm text-gray-600">
									{food.nutritionPer100g.calories} cal per 100g
								</div>
							</button>
						{/each}
					</div>
				{:else if searchQuery}
					<p class="text-gray-500 text-center py-4">No foods found</p>
				{:else}
					<p class="text-gray-500 text-center py-4">Start typing to search for foods</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Barcode Scanner Modal -->
{#if showBarcodeScanner}
	<div class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg max-w-md w-full m-4">
			<div class="p-4 border-b">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold">Scan Barcode</h3>
					<button
						on:click={() => {
							showBarcodeScanner = false;
							barcodeScanner.stopScanning();
						}}
						class="text-gray-500 hover:text-gray-700"
					>
						×
					</button>
				</div>
			</div>

			<div class="p-4">
				<div class="bg-black rounded-lg overflow-hidden mb-4">
					<video
						bind:this={videoElement}
						class="w-full h-64 object-cover"
						autoplay
						muted
						playsinline
					></video>
				</div>

				<div class="text-center">
					<p class="text-gray-600 mb-4">Position the barcode within the camera view</p>
					<button
						on:click={() => barcodeScanner.toggleFlashlight()}
						class="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
					>
						💡 Toggle Flash
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
