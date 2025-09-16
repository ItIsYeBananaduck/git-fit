<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '../convex';

	type UserMetrics = {
		totalUsers: number;
		activeUsers: number;
	};
	type DashboardMetrics = {
		userMetrics: UserMetrics;
		revenueMetrics: { totalRevenue: number; monthlyRevenue: number };
		engagementMetrics: { averageSessionDuration: number; dailyActiveUsers: number };
	};

	let stats: UserMetrics = { totalUsers: 0, activeUsers: 0 };
	let loading = true;

	onMount(async () => {
		loading = true;
		const metrics: DashboardMetrics = await api.admin.analytics.getDashboardMetrics();
		stats = metrics.userMetrics;
		loading = false;
	});
</script>

<div
	class="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center min-h-[120px]"
	role="region"
	aria-labelledby="stats-title"
>
	{#if loading}
		<div class="text-gray-400" aria-live="polite">Loading user statistics...</div>
	{:else}
		<div class="text-2xl font-bold text-primary" aria-label="Total users: {stats.totalUsers}">
			{stats.totalUsers}
		</div>
		<div class="text-gray-500 text-sm mt-1" id="stats-title">Total Users</div>
		<div
			class="text-xl font-semibold text-secondary mt-2"
			aria-label="Active users: {stats.activeUsers}"
		>
			{stats.activeUsers}
		</div>
		<div class="text-gray-500 text-sm">Active Users</div>
	{/if}
</div>
