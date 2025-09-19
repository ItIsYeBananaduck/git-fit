<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { api } from '../convex.js';

	const dispatch = createEventDispatcher();

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

	function handleKeydown(event: KeyboardEvent) {
		if (
			event.key === 'ArrowRight' ||
			event.key === 'ArrowDown' ||
			event.key === 'ArrowLeft' ||
			event.key === 'ArrowUp'
		) {
			dispatch('navigate', {
				direction: event.key.toLowerCase().replace('arrow', ''),
				currentWidget: 'chart'
			});
			event.preventDefault();
		}
	}
</script>

<button
	class="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center min-h-[120px] w-full text-left cursor-pointer hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
	aria-labelledby="chart-title"
	on:keydown={handleKeydown}
	on:focus={() => dispatch('focus', { widget: 'chart' })}
	on:click={() => dispatch('select', { widget: 'chart' })}
>
	{#if loading}
		<div class="text-gray-500" aria-live="polite">Loading chart data...</div>
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
						title={point.value.toString()}
						aria-label="Day {index + 1}: {point.value} active users"
					></div>
				</div>
			{/each}
		</div>
		<div class="text-gray-600 text-sm" id="chart-title">Daily Active Users</div>
	{/if}
</button>
