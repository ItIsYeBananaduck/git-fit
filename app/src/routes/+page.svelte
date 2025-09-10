<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { user, isAuthenticated } from '$lib/stores/auth';
	import FitnessStats from '$lib/components/FitnessStats.svelte';
	import QuickActions from '$lib/components/QuickActions.svelte';
	import RecentWorkouts from '$lib/components/RecentWorkouts.svelte';
	import ProgressChart from '$lib/components/ProgressChart.svelte';

	// Redirect to login if not authenticated
	$: if (!$isAuthenticated && $user === null) {
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
		<div class="bg-gradient-to-r from-primary to-blue-600 rounded-xl p-6 text-white">
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
	{/if}

	<!-- Quick Stats Grid -->
	<FitnessStats {fitnessData} />

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left Column - Quick Actions & Progress -->
		<div class="lg:col-span-1 space-y-6">
			{#if $user}
				<QuickActions userRole={$user.role} />
			{/if}

			<!-- Weekly Progress -->
			<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
				<div class="space-y-4">
					<div>
						<div class="flex justify-between text-sm mb-2">
							<span class="text-gray-600">Steps Goal</span>
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
							<span class="text-gray-600">Workouts This Week</span>
							<span class="font-medium">4 / 5</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-2">
							<div class="bg-accent h-2 rounded-full w-4/5"></div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Right Column - Charts & Recent Activity -->
		<div class="lg:col-span-2 space-y-6">
			<ProgressChart />
			<RecentWorkouts />
		</div>
	</div>
</div>
