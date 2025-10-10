<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { workoutActions, aliceNavigationActions } from '$lib/stores/workoutStore';
	// Temporarily disabled auth for debugging
	// import { user, isAuthenticated } from '$lib/stores/auth';
	// Temporarily disabled problematic icons
	// import { Activity, Target, TrendingUp, Clock } from 'lucide-svelte';

	// Redirect to login if not authenticated (only in browser) - Temporarily disabled
	// $: if (browser && !$isAuthenticated && $user === null) {
	//   goto(`/auth/login?redirect=${encodeURIComponent($page.url.pathname)}`);
	// }

	// Check for workout mode parameter and trigger Alice
	$: if (browser && $page.url.searchParams.get('mode') === 'workout') {
		console.log('[HOME] Detected workout mode - triggering Alice');
		// Trigger Alice workout mode immediately
		setTimeout(() => {
			workoutActions.startNewWorkout();
		}, 100);
		// Clean up the URL
		const url = new URL($page.url);
		url.searchParams.delete('mode');
		window.history.replaceState({}, '', url.toString());
	}

	// Alice navigation event listener
	onMount(() => {
		if (browser) {
			const handleAliceNavigation = (event: CustomEvent) => {
				console.log('[NAVIGATION] Alice navigation event received:', event.detail);
				if (event.detail.shouldNavigate && event.detail.route) {
					goto(event.detail.route);
				}
			};

			window.addEventListener('alice-navigation', handleAliceNavigation as EventListener);
			
			return () => {
				window.removeEventListener('alice-navigation', handleAliceNavigation as EventListener);
			};
		}
	});

	let fitnessData = {
		todaySteps: 8432,
		weeklyGoal: 50000,
		weeklySteps: 35670,
		lastWorkout: '2025-01-02',
		avgHeartRate: 142,
		caloriesBurned: 2180
	};
</script>

<svelte:head>
	<title>Dashboard - Adaptive fIt</title>
</svelte:head>

<div class="space-y-6">
	<!-- Demo Mode - Auth temporarily disabled -->
		<!-- Welcome Header -->
		<div class="card bg-gradient-to-r from-primary to-blue-600 text-white border-0">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold">Welcome to Adaptive fIt</h1>
					<p class="text-blue-100 mt-1">Alice AI Companion Ready - Demo Mode Active</p>
				</div>
				<div class="hidden sm:block">
					<div class="text-right">
						<div class="text-sm text-blue-100">Mode</div>
						<div class="text-lg font-semibold capitalize">Demo</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Welcome Message -->
		<div class="card bg-gradient-to-br from-surface to-muted/20 border-primary/20">
			<div class="text-center space-y-4">
				<h2 class="text-xl font-semibold text-primary">Meet Alice, Your AI Fitness Companion</h2>
				<p class="text-muted">
					Alice is here to guide your fitness journey. She learns from your progress and adapts to help you reach your goals.
				</p>
				<p class="text-sm text-muted">
					💫 Swipe Alice left or right to navigate • Touch to interact
				</p>
			</div>
		</div>

		<!-- Quick Stats Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="card">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
						</svg>
					</div>
					<div>
						<p class="text-sm text-muted">Today's Steps</p>
						<p class="text-lg font-semibold">{fitnessData.todaySteps.toLocaleString()}</p>
					</div>
				</div>
			</div>

			<div class="card">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
						</svg>
					</div>
					<div>
						<p class="text-sm text-muted">Weekly Progress</p>
						<p class="text-lg font-semibold">
							{Math.round((fitnessData.weeklySteps / fitnessData.weeklyGoal) * 100)}%
						</p>
					</div>
				</div>
			</div>

			<div class="card">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
						<div class="w-5 h-5 text-success text-center">📊</div>
					</div>
					<div>
						<p class="text-sm text-muted">Avg Heart Rate</p>
						<p class="text-lg font-semibold">{fitnessData.avgHeartRate} bpm</p>
					</div>
				</div>
			</div>

			<div class="card">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
						</svg>
					</div>
					<div>
						<p class="text-sm text-muted">Calories Burned</p>
						<p class="text-lg font-semibold">{fitnessData.caloriesBurned.toLocaleString()}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Content -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Left Column - Quick Actions -->
			<div class="lg:col-span-1 space-y-6">
				<div class="card">
					<div class="card-header">
						<h3 class="card-title">Quick Actions</h3>
						<p class="card-description">Start a workout or plan your day</p>
					</div>
					<div class="space-y-3">
						<button 
							class="btn-primary w-full" 
							on:click={() => aliceNavigationActions.quickActions.startWorkout()}
						> 
							Start Workout 
						</button>
						<button 
							class="btn-secondary w-full" 
							on:click={() => aliceNavigationActions.quickActions.logMeal()}
						> 
							Log Meal 
						</button>
						<button 
							class="btn-ghost w-full" 
							on:click={() => aliceNavigationActions.quickActions.findPrograms()}
						> 
							View Programs 
						</button>
						<button 
							class="btn-ghost w-full" 
							on:click={() => aliceNavigationActions.quickActions.visitMarketplace()}
						> 
							Browse Marketplace 
						</button>
						<button 
							class="btn-ghost w-full" 
							on:click={() => aliceNavigationActions.quickActions.openSettings()}
						> 
							Settings 
						</button>
					</div>
				</div>

				<!-- Weekly Progress -->
				<div class="card">
					<div class="card-header">
						<h3 class="card-title">Weekly Progress</h3>
					</div>
					<div class="space-y-4">
						<div>
							<div class="flex justify-between text-sm mb-2">
								<span class="text-muted">Steps Goal</span>
								<span class="font-medium"
									>{fitnessData.weeklySteps.toLocaleString()} / {fitnessData.weeklyGoal.toLocaleString()}</span
								>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div
									class="bg-secondary h-2 rounded-full transition-all duration-500"
									style="width: {Math.min(
										(fitnessData.weeklySteps / fitnessData.weeklyGoal) * 100,
										100
									)}%"
								></div>
							</div>
						</div>

						<div>
							<div class="flex justify-between text-sm mb-2">
								<span class="text-muted">Workouts This Week</span>
								<span class="font-medium">4 / 5</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div class="bg-accent h-2 rounded-full w-4/5"></div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Right Column - Recent Activity -->
			<div class="lg:col-span-2 space-y-6">
				<div class="card">
					<div class="card-header">
						<h3 class="card-title">Recent Workouts</h3>
						<p class="card-description">Your latest training sessions</p>
					</div>
					<div class="space-y-3">
						<div class="flex items-center justify-between p-4 bg-surface rounded-lg">
							<div class="flex items-center gap-3">
								<div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
									<svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
									</svg>
								</div>
								<div>
									<p class="font-medium">Upper Body Strength</p>
									<p class="text-sm text-muted">45 minutes • Yesterday</p>
								</div>
							</div>
							<span class="text-sm font-medium text-success">Completed</span>
						</div>

						<div class="flex items-center justify-between p-4 bg-surface rounded-lg">
							<div class="flex items-center gap-3">
								<div class="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
									<svg class="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
									</svg>
								</div>
								<div>
									<p class="font-medium">Cardio HIIT</p>
									<p class="text-sm text-muted">30 minutes • 2 days ago</p>
								</div>
							</div>
							<span class="text-sm font-medium text-success">Completed</span>
						</div>

						<div class="flex items-center justify-between p-4 bg-surface rounded-lg">
							<div class="flex items-center gap-3">
								<div class="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
									<div class="w-4 h-4 text-warning text-center">📊</div>
								</div>
								<div>
									<p class="font-medium">Lower Body Power</p>
									<p class="text-sm text-muted">50 minutes • 3 days ago</p>
								</div>
							</div>
							<span class="text-sm font-medium text-success">Completed</span>
						</div>
					</div>
					<div class="mt-4">
						<button 
							class="btn-ghost w-full" 
							on:click={() => aliceNavigationActions.navigateTo('workouts')}
						> 
							View All Workouts 
						</button>
					</div>
				</div>
			</div>
		</div>
	<!-- Auth blocks temporarily removed for demo mode -->
</div>
