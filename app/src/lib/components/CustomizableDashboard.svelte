<script lang="ts">
	// Placeholder for dashboard widget configuration
	let widgets = [{ type: 'stats' }, { type: 'chart' }, { type: 'activity' }, { type: 'dashboard' }];
</script>

<div
	class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6"
	role="main"
	aria-label="Customizable dashboard with fitness metrics widgets"
>
	{#each widgets as widget, index}
		{#if widget.type === 'stats'}
			<div aria-label="Statistics widget {index + 1}">
				<StatsWidget />
			</div>
		{:else if widget.type === 'chart'}
			<div aria-label="Chart widget {index + 1}">
				<ChartWidget />
			</div>
		{:else if widget.type === 'activity'}
			<div aria-label="Activity widget {index + 1}">
				<ActivityWidget />
			</div>
		{:else if widget.type === 'dashboard'}
			<div aria-label="Custom widget {index + 1}">
				<DashboardWidget />
			</div>
		{/if}
	{/each}
</div>
