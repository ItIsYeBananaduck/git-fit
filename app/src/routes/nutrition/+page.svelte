<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { user, isAuthenticated } from '$lib/stores/auth';
	import { 
		Search, 
		Plus, 
		Camera, 
		Target, 
		TrendingUp, 
		Apple,
		BarChart3,
		Utensils
	} from 'lucide-svelte';

	// Redirect to login if not authenticated
	$: if (!$isAuthenticated && $user === null) {
		goto(`/auth/login?redirect=${encodeURIComponent($page.url.pathname)}`);
	} else if ($user && !['client', 'admin'].includes($user.role)) {
		goto('/unauthorized');
	}

	let activeTab: 'log' | 'goals' | 'insights' = 'log';
	let selectedMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'breakfast';
	let searchQuery = '';
	let showQuickAdd = false;

	// Mock data - replace with Convex queries
	let nutritionGoals = {
		dailyCalories: 2200,
		dailyProtein: 150,
		dailyCarbs: 250,
		dailyFat: 80,
		goalType: 'muscle_gain' as const
	};

	let todaysEntries: Array<{
		id: string;
		mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
		foodName: string;
		serving: string;
		calories: number;
		protein: number;
		carbs: number;
		fat: number;
		timestamp: string;
	}> = [
		{
			id: '1',
			mealType: 'breakfast',
			foodName: 'Greek Yogurt with Berries',
			serving: '200g',
			calories: 180,
			protein: 20,
			carbs: 15,
			fat: 6,
			timestamp: '08:30'
		},
		{
			id: '2',
			mealType: 'lunch',
			foodName: 'Grilled Chicken Breast',
			serving: '150g',
			calories: 231,
			protein: 43,
			carbs: 0,
			fat: 5,
			timestamp: '12:45'
		}
	];

	let quickAddFoods = [
		{ name: 'Protein Shake', calories: 130, protein: 25, carbs: 5, fat: 2 },
		{ name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0 },
		{ name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
		{ name: 'Almonds (28g)', calories: 164, protein: 6, carbs: 6, fat: 14 },
		{ name: 'Oatmeal (1 cup)', calories: 150, protein: 5, carbs: 27, fat: 3 },
		{ name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 4 }
	];

	$: todaysTotals = todaysEntries.reduce(
		(sum, entry) => ({
			calories: sum.calories + entry.calories,
			protein: sum.protein + entry.protein,
			carbs: sum.carbs + entry.carbs,
			fat: sum.fat + entry.fat
		}),
		{ calories: 0, protein: 0, carbs: 0, fat: 0 }
	);

	$: nutritionProgress = {
		calories: (todaysTotals.calories / nutritionGoals.dailyCalories) * 100,
		protein: (todaysTotals.protein / nutritionGoals.dailyProtein) * 100,
		carbs: (todaysTotals.carbs / nutritionGoals.dailyCarbs) * 100,
		fat: (todaysTotals.fat / nutritionGoals.dailyFat) * 100
	};

	$: mealEntries = {
		breakfast: todaysEntries.filter(e => e.mealType === 'breakfast'),
		lunch: todaysEntries.filter(e => e.mealType === 'lunch'),
		dinner: todaysEntries.filter(e => e.mealType === 'dinner'),
		snack: todaysEntries.filter(e => e.mealType === 'snack')
	};

	onMount(async () => {
		// Load today's nutrition data
		await loadTodaysNutrition();
	});

	async function loadTodaysNutrition() {
		// TODO: Replace with Convex query
		console.log('Loading nutrition data...');
	}

	function addQuickFood(food: typeof quickAddFoods[0]) {
		const newEntry = {
			id: Date.now().toString(),
			mealType: selectedMealType,
			foodName: food.name,
			serving: '1 serving',
			calories: food.calories,
			protein: food.protein,
			carbs: food.carbs,
			fat: food.fat,
			timestamp: new Date().toLocaleTimeString('en-US', { 
				hour: '2-digit', 
				minute: '2-digit',
				hour12: false 
			})
		};
		
		todaysEntries = [...todaysEntries, newEntry];
		showQuickAdd = false;
	}

	function removeEntry(entryId: string) {
		todaysEntries = todaysEntries.filter(e => e.id !== entryId);
	}

	function getMealIcon(mealType: string) {
		switch (mealType) {
			case 'breakfast': return '🌅';
			case 'lunch': return '☀️';
			case 'dinner': return '🌙';
			case 'snack': return '🍎';
			default: return '🍽️';
		}
	}

	function getProgressColor(percentage: number): string {
		if (percentage < 50) return 'bg-red-500';
		if (percentage < 80) return 'bg-yellow-500';
		if (percentage <= 110) return 'bg-green-500';
		return 'bg-orange-500';
	}

	function openCamera() {
		console.log('Opening camera for food logging...');
	}

	function scanBarcode() {
		console.log('Opening barcode scanner...');
	}
</script>

<svelte:head>
	<title>Nutrition Tracking - Technically Fit</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900 flex items-center">
						<Apple size={32} class="text-green-600 mr-3" />
						Nutrition Tracking
					</h1>
					<p class="text-lg text-gray-600 mt-1">
						AI-powered nutrition insights and meal logging
					</p>
				</div>
				<div class="flex space-x-3">
					<button
						on:click={openCamera}
						class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						<Camera size={18} class="mr-2" />
						Photo Log
					</button>
					<button
						on:click={scanBarcode}
						class="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
					>
						<Search size={18} class="mr-2" />
						Scan Barcode
					</button>
				</div>
			</div>
		</div>

		<!-- Tab Navigation -->
		<div class="mb-8">
			<div class="border-b border-gray-200">
				<nav class="-mb-px flex space-x-8">
					<button
						class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'log' 
							? 'border-blue-500 text-blue-600' 
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
						on:click={() => activeTab = 'log'}
					>
						<Utensils size={16} class="inline mr-2" />
						Food Log
					</button>
					<button
						class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'goals' 
							? 'border-blue-500 text-blue-600' 
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
						on:click={() => activeTab = 'goals'}
					>
						<Target size={16} class="inline mr-2" />
						Goals & Progress
					</button>
					<button
						class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'insights' 
							? 'border-blue-500 text-blue-600' 
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
						on:click={() => activeTab = 'insights'}
					>
						<BarChart3 size={16} class="inline mr-2" />
						AI Insights
					</button>
				</nav>
			</div>
		</div>

		{#if activeTab === 'log'}
			<!-- Food Logging Tab -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Left Column - Meal Logging -->
				<div class="lg:col-span-2 space-y-6">
					<!-- Today's Summary -->
					<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Today's Nutrition</h3>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div class="text-center">
								<div class="text-2xl font-bold text-blue-600">{todaysTotals.calories}</div>
								<div class="text-sm text-gray-600">Calories</div>
								<div class="text-xs text-gray-500">{Math.round(nutritionProgress.calories)}% of goal</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold text-green-600">{todaysTotals.protein}g</div>
								<div class="text-sm text-gray-600">Protein</div>
								<div class="text-xs text-gray-500">{Math.round(nutritionProgress.protein)}% of goal</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold text-yellow-600">{todaysTotals.carbs}g</div>
								<div class="text-sm text-gray-600">Carbs</div>
								<div class="text-xs text-gray-500">{Math.round(nutritionProgress.carbs)}% of goal</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold text-purple-600">{todaysTotals.fat}g</div>
								<div class="text-sm text-gray-600">Fat</div>
								<div class="text-xs text-gray-500">{Math.round(nutritionProgress.fat)}% of goal</div>
							</div>
						</div>
					</div>

					<!-- Meal Sections -->
					{#each ['breakfast', 'lunch', 'dinner', 'snack'] as mealType}
						<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
							<div class="flex items-center justify-between mb-4">
								<h3 class="text-lg font-semibold text-gray-900 flex items-center">
									<span class="text-2xl mr-3">{getMealIcon(mealType)}</span>
									{mealType.charAt(0).toUpperCase() + mealType.slice(1)}
								</h3>
								<button
									on:click={() => {
										selectedMealType = mealType;
										showQuickAdd = true;
									}}
									class="flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
								>
									<Plus size={16} class="mr-1" />
									Add Food
								</button>
							</div>

							{#if mealEntries[mealType].length === 0}
								<div class="text-center py-8 text-gray-500">
									<Utensils size={32} class="mx-auto mb-2 opacity-50" />
									<p>No foods logged for {mealType}</p>
								</div>
							{:else}
								<div class="space-y-3">
									{#each mealEntries[mealType] as entry}
										<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
											<div class="flex-1">
												<div class="font-medium text-gray-900">{entry.foodName}</div>
												<div class="text-sm text-gray-600">{entry.serving} • {entry.timestamp}</div>
											</div>
											<div class="flex items-center space-x-4">
												<div class="text-right">
													<div class="text-sm font-medium">{entry.calories} cal</div>
													<div class="text-xs text-gray-500">
														P:{entry.protein}g C:{entry.carbs}g F:{entry.fat}g
													</div>
												</div>
												<button
													on:click={() => removeEntry(entry.id)}
													class="text-red-500 hover:text-red-700 text-sm"
												>
													×
												</button>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Right Column - Progress & Goals -->
				<div class="lg:col-span-1 space-y-6">
					<!-- Daily Progress -->
					<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Daily Progress</h3>
						<div class="space-y-4">
							<!-- Calories -->
							<div>
								<div class="flex justify-between text-sm mb-2">
									<span class="text-gray-600">Calories</span>
									<span class="font-medium">{todaysTotals.calories} / {nutritionGoals.dailyCalories}</span>
								</div>
								<div class="w-full bg-gray-200 rounded-full h-3">
									<div 
										class="h-3 rounded-full transition-all duration-500 {getProgressColor(nutritionProgress.calories)}"
										style="width: {Math.min(nutritionProgress.calories, 100)}%"
									></div>
								</div>
							</div>

							<!-- Protein -->
							<div>
								<div class="flex justify-between text-sm mb-2">
									<span class="text-gray-600">Protein</span>
									<span class="font-medium">{todaysTotals.protein}g / {nutritionGoals.dailyProtein}g</span>
								</div>
								<div class="w-full bg-gray-200 rounded-full h-3">
									<div 
										class="h-3 rounded-full transition-all duration-500 {getProgressColor(nutritionProgress.protein)}"
										style="width: {Math.min(nutritionProgress.protein, 100)}%"
									></div>
								</div>
							</div>

							<!-- Carbs -->
							<div>
								<div class="flex justify-between text-sm mb-2">
									<span class="text-gray-600">Carbohydrates</span>
									<span class="font-medium">{todaysTotals.carbs}g / {nutritionGoals.dailyCarbs}g</span>
								</div>
								<div class="w-full bg-gray-200 rounded-full h-3">
									<div 
										class="h-3 rounded-full transition-all duration-500 {getProgressColor(nutritionProgress.carbs)}"
										style="width: {Math.min(nutritionProgress.carbs, 100)}%"
									></div>
								</div>
							</div>

							<!-- Fat -->
							<div>
								<div class="flex justify-between text-sm mb-2">
									<span class="text-gray-600">Fat</span>
									<span class="font-medium">{todaysTotals.fat}g / {nutritionGoals.dailyFat}g</span>
								</div>
								<div class="w-full bg-gray-200 rounded-full h-3">
									<div 
										class="h-3 rounded-full transition-all duration-500 {getProgressColor(nutritionProgress.fat)}"
										style="width: {Math.min(nutritionProgress.fat, 100)}%"
									></div>
								</div>
							</div>
						</div>

						<!-- Remaining nutrients needed -->
						<div class="mt-6 pt-4 border-t border-gray-200">
							<h4 class="text-sm font-medium text-gray-900 mb-3">Still Need Today</h4>
							<div class="space-y-2 text-sm">
								{#if nutritionGoals.dailyCalories - todaysTotals.calories > 0}
									<div class="flex justify-between">
										<span class="text-gray-600">Calories</span>
										<span class="font-medium">{nutritionGoals.dailyCalories - todaysTotals.calories}</span>
									</div>
								{/if}
								{#if nutritionGoals.dailyProtein - todaysTotals.protein > 0}
									<div class="flex justify-between">
										<span class="text-gray-600">Protein</span>
										<span class="font-medium">{Math.round(nutritionGoals.dailyProtein - todaysTotals.protein)}g</span>
									</div>
								{/if}
								{#if nutritionGoals.dailyCarbs - todaysTotals.carbs > 0}
									<div class="flex justify-between">
										<span class="text-gray-600">Carbs</span>
										<span class="font-medium">{Math.round(nutritionGoals.dailyCarbs - todaysTotals.carbs)}g</span>
									</div>
								{/if}
								{#if nutritionGoals.dailyFat - todaysTotals.fat > 0}
									<div class="flex justify-between">
										<span class="text-gray-600">Fat</span>
										<span class="font-medium">{Math.round(nutritionGoals.dailyFat - todaysTotals.fat)}g</span>
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Quick Add Foods -->
					<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Add</h3>
						<div class="space-y-2">
							{#each quickAddFoods as food}
								<button
									on:click={() => addQuickFood(food)}
									class="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
								>
									<div class="font-medium text-gray-900">{food.name}</div>
									<div class="text-sm text-gray-600">
										{food.calories} cal • P:{food.protein}g C:{food.carbs}g F:{food.fat}g
									</div>
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>

		{:else if activeTab === 'goals'}
			<!-- Goals & Progress Tab -->
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-6">Nutrition Goals & Progress</h3>
				<p class="text-gray-600">Goal setting and progress tracking interface coming soon...</p>
			</div>

		{:else if activeTab === 'insights'}
			<!-- AI Insights Tab -->
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-6">AI-Powered Nutrition Insights</h3>
				<p class="text-gray-600">Advanced analytics and personalized recommendations coming soon...</p>
			</div>
		{/if}
	</div>
</div>

<!-- Quick Add Modal -->
{#if showQuickAdd}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl max-w-2xl w-full max-h-96 overflow-hidden">
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-900">
						Add Food to {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}
					</h3>
					<button 
						on:click={() => showQuickAdd = false}
						class="text-gray-400 hover:text-gray-600"
					>
						×
					</button>
				</div>
			</div>

			<div class="p-6 max-h-80 overflow-y-auto">
				<!-- Quick Add Options -->
				<div class="space-y-2">
					{#each quickAddFoods as food}
						<button
							on:click={() => addQuickFood(food)}
							class="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
						>
							<div class="font-medium text-gray-900">{food.name}</div>
							<div class="text-sm text-gray-600">
								{food.calories} cal • P:{food.protein}g C:{food.carbs}g F:{food.fat}g
							</div>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}