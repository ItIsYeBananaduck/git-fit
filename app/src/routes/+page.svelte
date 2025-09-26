<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { user, isAuthenticated } from '$lib/stores/auth.js';
	import { Activity, Target, TrendingUp, Clock } from 'lucide-svelte';

	// Redirect to login if not authenticated (only in browser)
	$: if (browser && !$isAuthenticated && $user === null) {
		goto(`/auth/login?redirect=${encodeURIComponent($page.url.pathname)}`);
	}

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
	<title>Dashboard - Technically Fit</title>
</svelte:head>

<div class="space-y-6">
	{#if $user}
		<!-- Welcome Header -->
		<div class="card bg-gradient-to-r from-primary to-blue-600 text-white border-0">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold">Welcome back, {$user.name}!</h1>
					<p class="text-blue-100 mt-1">Ready to crush your fitness goals today?</p>
				</div>
				<div class="hidden sm:block">
					<div class="text-right">
						<div class="text-sm text-blue-100">Role</div>
						<div class="text-lg font-semibold capitalize">{$user.role}</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Quick Stats Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="card">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
						<Activity class="w-5 h-5 text-primary" />
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
						<Target class="w-5 h-5 text-secondary" />
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
						<TrendingUp class="w-5 h-5 text-success" />
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
						<Clock class="w-5 h-5 text-warning" />
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
						<a href="/workouts" class="btn-primary w-full"> Start Workout </a>
						<a href="/nutrition" class="btn-secondary w-full"> Log Meal </a>
						<a href="/programs" class="btn-ghost w-full"> View Programs </a>
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
									<Activity class="w-4 h-4 text-primary" />
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
									<Target class="w-4 h-4 text-secondary" />
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
									<TrendingUp class="w-4 h-4 text-warning" />
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
						<a href="/workouts" class="btn-ghost w-full"> View All Workouts </a>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Not authenticated fallback -->
		<div class="card text-center">
			<h1 class="text-2xl font-bold mb-4">Welcome to Technically Fit</h1>
			<p class="text-muted mb-6">Sign in to access your personalized fitness dashboard</p>
			<div class="space-x-2">
				<a href="/auth/login" class="btn-primary">Sign In</a>
				<a href="/auth/register" class="btn-secondary">Get Started</a>
			</div>
		</div>
	{/if}
</div>
