<script lang="ts">
	import { onMount } from 'svelte';
	import { user, isAuthenticated } from '$lib/stores/auth';
	import { NutritionAI } from '$lib/services/nutritionAI';
	import { AdaptiveTrainingEngine } from '$lib/services/adaptiveTraining';
	import { whoopState } from '$lib/stores/whoop';
	import { ouraState } from '$lib/stores/oura';
	import { 
		Target, 
		TrendingUp, 
		Zap, 
		Apple, 
		Trophy, 
		Calendar,
		AlertTriangle,
		CheckCircle,
		Clock,
		Heart
	} from 'lucide-svelte';

	// Mock data - replace with real Convex queries
	let nutritionGoals = {
		dailyCalories: 2200,
		dailyProtein: 150,
		dailyCarbs: 250,
		dailyFat: 80,
		goalType: 'muscle_gain' as const
	};

	let todaysNutrition = {
		calories: 1650,
		protein: 98,
		carbs: 180,
		fat: 55,
		fiber: 18
	};

	let recoveryData = {
		recovery: 72,
		strain: 12.4,
		sleepScore: 78,
		hrv: 45
	};

	let workoutData = {
		plannedWorkout: 'Upper Body Strength',
		lastWorkout: '2 days ago',
		weeklyProgress: 4,
		weeklyGoal: 5
	};

	let recommendations: Array<{
		id: string;
		type: 'nutrition' | 'training' | 'recovery';
		title: string;
		description: string;
		priority: 'high' | 'medium' | 'low';
		actionable: boolean;
	}> = [];

	let achievements: Array<{
		id: string;
		title: string;
		description: string;
		progress: number;
		maxProgress: number;
		completed: boolean;
		icon: string;
		color: string;
	}> = [];

	$: nutritionProgress = {
		calories: (todaysNutrition.calories / nutritionGoals.dailyCalories) * 100,
		protein: (todaysNutrition.protein / nutritionGoals.dailyProtein) * 100,
		carbs: (todaysNutrition.carbs / nutritionGoals.dailyCarbs) * 100,
		fat: (todaysNutrition.fat / nutritionGoals.dailyFat) * 100
	};

	$: isConnectedToTracker = $whoopState.isConnected || $ouraState.isConnected;

	onMount(async () => {
		await loadUnifiedDashboardData();
		generatePersonalizedRecommendations();
		loadAchievements();
	});

	async function loadUnifiedDashboardData() {
		// TODO: Replace with real Convex queries
		console.log('Loading unified dashboard data...');
	}

	function generatePersonalizedRecommendations() {
		const recs = [];

		// Nutrition recommendations
		if (nutritionProgress.protein < 70) {
			recs.push({
				id: 'protein-low',
				type: 'nutrition' as const,
				title: 'Protein Intake Low',
				description: `You need ${Math.round(nutritionGoals.dailyProtein - todaysNutrition.protein)}g more protein today. Try adding Greek yogurt or a protein shake.`,
				priority: 'high' as const,
				actionable: true
			});
		}

		// Recovery-based recommendations
		if (recoveryData.recovery < 50) {
			recs.push({
				id: 'recovery-low',
				type: 'recovery' as const,
				title: 'Low Recovery Detected',
				description: 'Consider reducing workout intensity and focusing on hydration and sleep.',
				priority: 'high' as const,
				actionable: true
			});
		}

		// Training recommendations
		if (workoutData.weeklyProgress >= workoutData.weeklyGoal) {
			recs.push({
				id: 'goal-achieved',
				type: 'training' as const,
				title: 'Weekly Goal Achieved!',
				description: 'Great consistency this week. Consider adding a light recovery session.',
				priority: 'low' as const,
				actionable: false
			});
		}

		recommendations = recs;
	}

	function loadAchievements() {
		achievements = [
			{
				id: 'nutrition-streak',
				title: 'Nutrition Consistency',
				description: 'Log meals for 7 consecutive days',
				progress: 5,
				maxProgress: 7,
				completed: false,
				icon: 'apple',
				color: 'green'
			},
			{
				id: 'workout-streak',
				title: 'Workout Warrior',
				description: 'Complete 10 workouts this month',
				progress: 8,
				maxProgress: 10,
				completed: false,
				icon: 'dumbbell',
				color: 'blue'
			},
			{
				id: 'recovery-master',
				title: 'Recovery Master',
				description: 'Maintain 70+ recovery for 5 days',
				progress: 3,
				maxProgress: 5,
				completed: false,
				icon: 'heart',
				color: 'purple'
			}
		];
	}

	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'high': return 'bg-red-100 text-red-800 border-red-200';
			case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'low': return 'bg-green-100 text-green-800 border-green-200';
			default: return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}

	function getTypeIcon(type: string) {
		switch (type) {
			case 'nutrition': return Apple;
			case 'training': return Target;
			case 'recovery': return Heart;
			default: return AlertTriangle;
		}
	}

	function dismissRecommendation(id: string) {
		recommendations = recommendations.filter(rec => rec.id !== id);
	}

	function quickLogMeal() {
		// TODO: Open quick meal logging modal
		console.log('Opening quick meal log...');
	}

	function startWorkout() {
		// TODO: Navigate to workout start
		console.log('Starting workout...');
	}
</script>

<svelte:head>
	<title>Unified Dashboard - Technically Fit</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Header with personalized greeting -->
		{#if $user}
			<div class="mb-8">
				<div class="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 rounded-xl p-6 text-white">
					<div class="flex items-center justify-between">
						<div>
							<h1 class="text-3xl font-bold">Good morning, {$user.name}! 🌟</h1>
							<p class="text-blue-100 mt-2">
								{#if isConnectedToTracker}
									Your recovery is {recoveryData.recovery}% - ready for a {recoveryData.recovery > 70 ? 'challenging' : 'moderate'} day!
								{:else}
									Connect your fitness tracker for personalized insights
								{/if}
							</p>
						</div>
						<div class="hidden sm:block">
							<div class="text-right">
								<div class="text-sm text-blue-100">Today's Focus</div>
								<div class="text-lg font-semibold">
									{nutritionProgress.protein < 70 ? 'Protein Power' : 
									 recoveryData.recovery < 50 ? 'Recovery Mode' : 
									 'Steady Progress'}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Quick Actions Row -->
		<div class="mb-8">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<button 
					on:click={quickLogMeal}
					class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group"
				>
					<div class="flex items-center space-x-3">
						<div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
							<Apple size={20} class="text-green-600" />
						</div>
						<div class="text-left">
							<div class="font-medium text-gray-900">Log Meal</div>
							<div class="text-sm text-gray-500">Quick entry</div>
						</div>
					</div>
				</button>

				<button 
					on:click={startWorkout}
					class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group"
				>
					<div class="flex items-center space-x-3">
						<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
							<Target size={20} class="text-blue-600" />
						</div>
						<div class="text-left">
							<div class="font-medium text-gray-900">Start Workout</div>
							<div class="text-sm text-gray-500">{workoutData.plannedWorkout}</div>
						</div>
					</div>
				</button>

				<div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
					<div class="flex items-center space-x-3">
						<div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
							<Heart size={20} class="text-purple-600" />
						</div>
						<div class="text-left">
							<div class="font-medium text-gray-900">Recovery</div>
							<div class="text-sm text-gray-500">{recoveryData.recovery}% today</div>
						</div>
					</div>
				</div>

				<div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
					<div class="flex items-center space-x-3">
						<div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
							<Trophy size={20} class="text-yellow-600" />
						</div>
						<div class="text-left">
							<div class="font-medium text-gray-900">Achievements</div>
							<div class="text-sm text-gray-500">{achievements.filter(a => a.completed).length} earned</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Left Column - Today's Nutrition -->
			<div class="lg:col-span-1">
				<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
					<div class="flex items-center justify-between mb-6">
						<h3 class="text-lg font-semibold text-gray-900">Today's Nutrition</h3>
						<Apple size={20} class="text-green-600" />
					</div>

					<div class="space-y-4">
						<!-- Calories -->
						<div>
							<div class="flex justify-between text-sm mb-2">
								<span class="text-gray-600">Calories</span>
								<span class="font-medium">{todaysNutrition.calories} / {nutritionGoals.dailyCalories}</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div 
									class="bg-blue-500 h-2 rounded-full transition-all duration-500"
									style="width: {Math.min(nutritionProgress.calories, 100)}%"
								></div>
							</div>
							<div class="text-xs text-gray-500 mt-1">
								{Math.round(nutritionProgress.calories)}% of goal
							</div>
						</div>

						<!-- Protein -->
						<div>
							<div class="flex justify-between text-sm mb-2">
								<span class="text-gray-600">Protein</span>
								<span class="font-medium">{todaysNutrition.protein}g / {nutritionGoals.dailyProtein}g</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div 
									class="bg-green-500 h-2 rounded-full transition-all duration-500"
									style="width: {Math.min(nutritionProgress.protein, 100)}%"
								></div>
							</div>
							<div class="text-xs text-gray-500 mt-1">
								{Math.round(nutritionProgress.protein)}% of goal
							</div>
						</div>

						<!-- Carbs -->
						<div>
							<div class="flex justify-between text-sm mb-2">
								<span class="text-gray-600">Carbohydrates</span>
								<span class="font-medium">{todaysNutrition.carbs}g / {nutritionGoals.dailyCarbs}g</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div 
									class="bg-yellow-500 h-2 rounded-full transition-all duration-500"
									style="width: {Math.min(nutritionProgress.carbs, 100)}%"
								></div>
							</div>
							<div class="text-xs text-gray-500 mt-1">
								{Math.round(nutritionProgress.carbs)}% of goal
							</div>
						</div>

						<!-- Fat -->
						<div>
							<div class="flex justify-between text-sm mb-2">
								<span class="text-gray-600">Fat</span>
								<span class="font-medium">{todaysNutrition.fat}g / {nutritionGoals.dailyFat}g</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div 
									class="bg-purple-500 h-2 rounded-full transition-all duration-500"
									style="width: {Math.min(nutritionProgress.fat, 100)}%"
								></div>
							</div>
							<div class="text-xs text-gray-500 mt-1">
								{Math.round(nutritionProgress.fat)}% of goal
							</div>
						</div>
					</div>

					<!-- Quick add common foods -->
					<div class="mt-6 pt-6 border-t border-gray-200">
						<h4 class="text-sm font-medium text-gray-900 mb-3">Quick Add</h4>
						<div class="grid grid-cols-2 gap-2">
							<button class="text-xs bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
								Protein Shake
							</button>
							<button class="text-xs bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
								Greek Yogurt
							</button>
							<button class="text-xs bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
								Banana
							</button>
							<button class="text-xs bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
								Almonds
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Middle Column - AI Recommendations & Training -->
			<div class="lg:col-span-1 space-y-6">
				<!-- AI Recommendations -->
				<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
					<div class="flex items-center justify-between mb-6">
						<h3 class="text-lg font-semibold text-gray-900">AI Recommendations</h3>
						<Zap size={20} class="text-yellow-500" />
					</div>

					{#if recommendations.length === 0}
						<div class="text-center py-8">
							<CheckCircle size={48} class="text-green-500 mx-auto mb-4" />
							<p class="text-gray-600">Looking great! Keep up the excellent work.</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each recommendations as rec}
								<div class="p-4 rounded-lg border {getPriorityColor(rec.priority)}">
									<div class="flex items-start justify-between">
										<div class="flex items-start space-x-3">
											<svelte:component this={getTypeIcon(rec.type)} size={16} class="mt-1" />
											<div>
												<h4 class="font-medium text-sm">{rec.title}</h4>
												<p class="text-xs mt-1 opacity-90">{rec.description}</p>
											</div>
										</div>
										<button 
											on:click={() => dismissRecommendation(rec.id)}
											class="text-xs opacity-60 hover:opacity-100"
										>
											×
										</button>
									</div>
									{#if rec.actionable}
										<button class="mt-3 text-xs bg-white bg-opacity-50 hover:bg-opacity-75 px-3 py-1 rounded transition-all">
											Take Action
										</button>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Training Overview -->
				<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
					<div class="flex items-center justify-between mb-6">
						<h3 class="text-lg font-semibold text-gray-900">Training Progress</h3>
						<Target size={20} class="text-blue-600" />
					</div>

					<div class="space-y-4">
						<div>
							<div class="flex justify-between text-sm mb-2">
								<span class="text-gray-600">This Week</span>
								<span class="font-medium">{workoutData.weeklyProgress} / {workoutData.weeklyGoal} workouts</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div 
									class="bg-blue-500 h-2 rounded-full transition-all duration-500"
									style="width: {Math.min((workoutData.weeklyProgress / workoutData.weeklyGoal) * 100, 100)}%"
								></div>
							</div>
						</div>

						<div class="flex items-center justify-between py-2">
							<span class="text-sm text-gray-600">Last Workout</span>
							<span class="text-sm font-medium">{workoutData.lastWorkout}</span>
						</div>

						<div class="flex items-center justify-between py-2">
							<span class="text-sm text-gray-600">Next Planned</span>
							<span class="text-sm font-medium">{workoutData.plannedWorkout}</span>
						</div>
					</div>

					{#if isConnectedToTracker}
						<div class="mt-4 p-3 bg-blue-50 rounded-lg">
							<div class="text-xs text-blue-600 font-medium mb-2">Recovery Status</div>
							<div class="grid grid-cols-2 gap-4 text-xs">
								<div>
									<div class="text-gray-600">Recovery</div>
									<div class="font-medium">{recoveryData.recovery}%</div>
								</div>
								<div>
									<div class="text-gray-600">HRV</div>
									<div class="font-medium">{recoveryData.hrv}ms</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Right Column - Achievements & Insights -->
			<div class="lg:col-span-1 space-y-6">
				<!-- Achievements -->
				<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
					<div class="flex items-center justify-between mb-6">
						<h3 class="text-lg font-semibold text-gray-900">Achievements</h3>
						<Trophy size={20} class="text-yellow-500" />
					</div>

					<div class="space-y-4">
						{#each achievements as achievement}
							<div class="flex items-center space-x-3">
								<div class="w-12 h-12 bg-{achievement.color}-100 rounded-lg flex items-center justify-center">
									<div class="text-{achievement.color}-600 text-lg">
										{#if achievement.icon === 'apple'}🍎
										{:else if achievement.icon === 'dumbbell'}💪
										{:else if achievement.icon === 'heart'}❤️
										{:else}🏆{/if}
									</div>
								</div>
								<div class="flex-1">
									<div class="text-sm font-medium text-gray-900">{achievement.title}</div>
									<div class="text-xs text-gray-500 mb-2">{achievement.description}</div>
									<div class="w-full bg-gray-200 rounded-full h-1.5">
										<div 
											class="bg-{achievement.color}-500 h-1.5 rounded-full transition-all duration-500"
											style="width: {(achievement.progress / achievement.maxProgress) * 100}%"
										></div>
									</div>
									<div class="text-xs text-gray-500 mt-1">
										{achievement.progress} / {achievement.maxProgress}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Weekly Insights -->
				<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
					<div class="flex items-center justify-between mb-6">
						<h3 class="text-lg font-semibold text-gray-900">Weekly Insights</h3>
						<TrendingUp size={20} class="text-green-500" />
					</div>

					<div class="space-y-4">
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 bg-green-400 rounded-full"></div>
							<div class="text-sm text-gray-700">Protein intake improved by 15% this week</div>
						</div>
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 bg-blue-400 rounded-full"></div>
							<div class="text-sm text-gray-700">Workout consistency at 80% - great progress!</div>
						</div>
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 bg-purple-400 rounded-full"></div>
							<div class="text-sm text-gray-700">Recovery trending upward over 7 days</div>
						</div>
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 bg-yellow-400 rounded-full"></div>
							<div class="text-sm text-gray-700">Sleep quality correlates with better workouts</div>
						</div>
					</div>

					<div class="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
						<div class="text-sm font-medium text-gray-900 mb-2">💡 AI Insight</div>
						<div class="text-xs text-gray-700">
							Your best performance days happen when you eat protein within 2 hours of waking up. 
							Consider setting a morning protein reminder!
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Bottom Section - Quick Stats Grid -->
		<div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
				<div class="text-2xl font-bold text-blue-600">{workoutData.weeklyProgress}</div>
				<div class="text-sm text-gray-600">Workouts This Week</div>
			</div>
			<div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
				<div class="text-2xl font-bold text-green-600">{Math.round(nutritionProgress.protein)}%</div>
				<div class="text-sm text-gray-600">Protein Goal</div>
			</div>
			<div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
				<div class="text-2xl font-bold text-purple-600">{recoveryData.recovery}%</div>
				<div class="text-sm text-gray-600">Recovery Score</div>
			</div>
			<div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
				<div class="text-2xl font-bold text-yellow-600">{achievements.filter(a => a.completed).length}</div>
				<div class="text-sm text-gray-600">Achievements Earned</div>
			</div>
		</div>
	</div>
</div>