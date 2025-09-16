<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '../convex';

	type DailyActiveUserPoint = { date: string; value: number };
	type UserGrowthAnalytics = {
		totalNewUsers: number;
		userRetention: number;
		growthRate: number;
		dailyActiveUsers: DailyActiveUserPoint[];
	};

	let chartData: DailyActiveUserPoint[] = [];
	let loading = true;

	onMount(async () => {
		loading = true;
		const analytics: UserGrowthAnalytics = await api.admin.analytics.getUserGrowthAnalytics();
		chartData = analytics.dailyActiveUsers;
		loading = false;
	});
</script>

<div
	class="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center min-h-[120px]"
	role="region"
	aria-labelledby="chart-title"
>
	{#if loading}
		<div class="text-gray-400" aria-live="polite">Loading chart data...</div>
	{:else}
		<div
			class="w-full h-20 bg-gradient-to-r from-primary to-blue-400 rounded mb-2 flex items-end"
			role="img"
			aria-label="Daily active users chart showing {chartData.length} data points"
		>
			<!-- Simple bar chart mockup -->
			{#each chartData as point, index (point.date)}
				<div class="flex-1 mx-0.5">
					<div
						class="bg-blue-500 rounded-t"
						style="height: {Math.max(10, point.value / 3)}px"
						title={point.value}
						aria-label="Day {index + 1}: {point.value} active users"
					></div>
				</div>
			{/each}
		</div>
		<div class="text-gray-500 text-sm" id="chart-title">Daily Active Users</div>
	{/if}
</div>
