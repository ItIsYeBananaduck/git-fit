<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { api } from '$lib/api/convex';

	const dispatch = createEventDispatcher();

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

	function handleKeydown(event: KeyboardEvent) {
		if (
			event.key === 'ArrowRight' ||
			event.key === 'ArrowDown' ||
			event.key === 'ArrowLeft' ||
			event.key === 'ArrowUp'
		) {
			dispatch('navigate', {
				direction: event.key.toLowerCase().replace('arrow', ''),
				currentWidget: 'stats'
			});
			event.preventDefault();
		}
	}
</script>

<button
	class="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center min-h-[120px] w-full text-left cursor-pointer hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
	aria-labelledby="stats-title"
	on:keydown={handleKeydown}
	on:focus={() => dispatch('focus', { widget: 'stats' })}
	on:click={() => dispatch('select', { widget: 'stats' })}
>
	{#if loading}
		<div class="text-gray-500" aria-live="polite">Loading user statistics...</div>
	{:else}
		<div class="text-2xl font-bold text-primary" aria-label="Total users: {stats.totalUsers}">
			{stats.totalUsers}
		</div>
		<div class="text-gray-600 text-sm mt-1" id="stats-title">Total Users</div>
		<div
			class="text-xl font-semibold text-secondary mt-2"
			aria-label="Active users: {stats.activeUsers}"
		>
			{stats.activeUsers}
		</div>
		<div class="text-gray-600 text-sm">Active Users</div>
	{/if}
</button>
