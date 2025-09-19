<script lang="ts">
	import StatsWidget from './StatsWidget.svelte';
	import ChartWidget from './ChartWidget.svelte';
	import ActivityWidget from './ActivityWidget.svelte';
	import DashboardWidget from './DashboardWidget.svelte';

	// Placeholder for dashboard widget configuration
	let widgets = [{ type: 'stats' }, { type: 'chart' }, { type: 'activity' }, { type: 'dashboard' }];

	// Keyboard navigation between widgets
	function handleWidgetNavigation(event: KeyboardEvent): void {
		const widgetElements = document.querySelectorAll('[data-widget]');
		const currentIndex = Array.from(widgetElements).findIndex(
			(el) => el === document.activeElement
		);

		switch (event.key) {
			case 'ArrowRight':
				event.preventDefault();
				const nextIndex = (currentIndex + 1) % widgetElements.length;
				(widgetElements[nextIndex] as HTMLElement)?.focus();
				break;
			case 'ArrowLeft':
				event.preventDefault();
				const prevIndex = currentIndex <= 0 ? widgetElements.length - 1 : currentIndex - 1;
				(widgetElements[prevIndex] as HTMLElement)?.focus();
				break;
		}
	}
</script>

<div
	class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6"
	role="main"
	aria-label="Customizable dashboard with fitness metrics widgets"
>
	{#each widgets as widget, index}
		{#if widget.type === 'stats'}
			<div
				aria-label="Statistics widget {index + 1}"
				data-widget
				tabindex="0"
				role="button"
				on:keydown={handleWidgetNavigation}
			>
				<StatsWidget />
			</div>
		{:else if widget.type === 'chart'}
			<div
				aria-label="Chart widget {index + 1}"
				data-widget
				tabindex="0"
				role="button"
				on:keydown={handleWidgetNavigation}
			>
				<ChartWidget />
			</div>
		{:else if widget.type === 'activity'}
			<div
				aria-label="Activity widget {index + 1}"
				data-widget
				tabindex="0"
				role="button"
				on:keydown={handleWidgetNavigation}
			>
				<ActivityWidget />
			</div>
		{:else if widget.type === 'dashboard'}
			<div
				aria-label="Custom widget {index + 1}"
				data-widget
				tabindex="0"
				role="button"
				on:keydown={handleWidgetNavigation}
			>
				<DashboardWidget />
			</div>
		{/if}
	{/each}
</div>
