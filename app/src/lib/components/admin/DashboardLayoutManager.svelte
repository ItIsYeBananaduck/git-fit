<script lang="ts">
	import { onMount } from 'svelte';
	import { analyticsService } from '../../services/analyticsService';
	import DashboardWidget from './DashboardWidget.svelte';
	import MetricsComparison from './MetricsComparison.svelte';
	import type { Id } from '../../../convex/_generated/dataModel';

	// Props
	export let adminId: Id<'adminUsers'>;
	export let dashboardData: any;
	export let layout: string = 'default';

	// State
	let widgets: any[] = [];
	let availableWidgets = [
		{ id: 'user-metrics', title: 'User Metrics', type: 'metric', size: 'small' },
		{ id: 'revenue-metrics', title: 'Revenue Metrics', type: 'metric', size: 'small' },
		{ id: 'engagement-metrics', title: 'Engagement Metrics', type: 'metric', size: 'small' },
		{ id: 'system-health', title: 'System Health', type: 'status', size: 'small' },
		{ id: 'user-growth-chart', title: 'User Growth Chart', type: 'chart', size: 'medium' },
		{ id: 'revenue-chart', title: 'Revenue Chart', type: 'chart', size: 'medium' },
		{ id: 'engagement-chart', title: 'Engagement Chart', type: 'chart', size: 'medium' },
		{ id: 'metrics-comparison', title: 'Metrics Comparison', type: 'chart', size: 'large' },
		{ id: 'top-performers', title: 'Top Performers', type: 'table', size: 'medium' },
		{ id: 'recent-activity', title: 'Recent Activity', type: 'table', size: 'medium' }
	];

	let customLayouts = {
		default: [
			{ id: 'user-metrics', position: { x: 0, y: 0 } },
			{ id: 'revenue-metrics', position: { x: 1, y: 0 } },
			{ id: 'engagement-metrics', position: { x: 2, y: 0 } },
			{ id: 'system-health', position: { x: 3, y: 0 } },
			{ id: 'user-growth-chart', position: { x: 0, y: 1 } },
			{ id: 'revenue-chart', position: { x: 2, y: 1 } }
		],
		compact: [
			{ id: 'user-metrics', position: { x: 0, y: 0 } },
			{ id: 'revenue-metrics', position: { x: 1, y: 0 } },
			{ id: 'engagement-metrics', position: { x: 0, y: 1 } },
			{ id: 'system-health', position: { x: 1, y: 1 } }
		],
		detailed: [
			{ id: 'user-metrics', position: { x: 0, y: 0 } },
			{ id: 'revenue-metrics', position: { x: 1, y: 0 } },
			{ id: 'engagement-metrics', position: { x: 2, y: 0 } },
			{ id: 'system-health', position: { x: 3, y: 0 } },
			{ id: 'metrics-comparison', position: { x: 0, y: 1 } },
			{ id: 'user-growth-chart', position: { x: 0, y: 3 } },
			{ id: 'revenue-chart', position: { x: 2, y: 3 } },
			{ id: 'top-performers', position: { x: 0, y: 4 } },
			{ id: 'recent-activity', position: { x: 2, y: 4 } }
		],
		executive: [
			{ id: 'user-metrics', position: { x: 0, y: 0 } },
			{ id: 'revenue-metrics', position: { x: 1, y: 0 } },
			{ id: 'engagement-metrics', position: { x: 2, y: 0 } },
			{ id: 'metrics-comparison', position: { x: 0, y: 1 } }
		]
	};

	let editMode = false;
	let draggedWidget: any = null;

	onMount(() => {
		loadLayout();
	});

	function loadLayout() {
		const layoutConfig =
			customLayouts[layout as keyof typeof customLayouts] || customLayouts.default;
		widgets = layoutConfig.map((item) => {
			const widgetDef = availableWidgets.find((w) => w.id === item.id);
			return {
				...widgetDef,
				...item,
				loading: false,
				error: '',
				lastUpdated: new Date().toISOString()
			};
		});
	}

	function handleWidgetRefresh(widgetId: string) {
		const widget = widgets.find((w) => w.id === widgetId);
		if (widget) {
			widget.loading = true;
			// Simulate refresh
			setTimeout(() => {
				widget.loading = false;
				widget.lastUpdated = new Date().toISOString();
			}, 1000);
		}
	}

	function handleWidgetExport(widgetId: string) {
		const widget = widgets.find((w) => w.id === widgetId);
		if (widget && dashboardData) {
			const exportData = getWidgetData(widgetId);
			const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${widget.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	}

	function handleWidgetConfigure(widgetId: string) {
		// Open configuration modal (would be implemented)
		console.log('Configure widget:', widgetId);
	}

	function handleWidgetRemove(widgetId: string) {
		widgets = widgets.filter((w) => w.id !== widgetId);
	}

	function getWidgetData(widgetId: string) {
		if (!dashboardData) return null;

		switch (widgetId) {
			case 'user-metrics':
				return dashboardData.dashboardMetrics?.userMetrics;
			case 'revenue-metrics':
				return dashboardData.dashboardMetrics?.revenueMetrics;
			case 'engagement-metrics':
				return dashboardData.dashboardMetrics?.engagementMetrics;
			case 'system-health':
				return dashboardData.dashboardMetrics?.systemMetrics;
			case 'user-growth-chart':
				return dashboardData.userGrowth;
			case 'revenue-chart':
				return dashboardData.revenueAnalytics;
			case 'engagement-chart':
				return dashboardData.engagementMetrics;
			default:
				return null;
		}
	}

	function addWidget(widgetDef: any) {
		const newWidget = {
			...widgetDef,
			position: { x: 0, y: Math.max(...widgets.map((w) => w.position.y)) + 1 },
			loading: false,
			error: '',
			lastUpdated: new Date().toISOString()
		};
		widgets = [...widgets, newWidget];
	}

	function toggleEditMode() {
		editMode = !editMode;
	}

	async function saveLayout() {
		try {
			const layoutConfig = {
				layout,
				widgets: widgets.map((w) => ({
					id: w.id,
					position: w.position,
					size: w.size
				}))
			};

			await analyticsService.saveCustomDashboard(
				`Custom Layout ${Date.now()}`,
				layoutConfig,
				widgets.map((w) => w.id),
				adminId
			);

			editMode = false;
		} catch (err) {
			console.error('Failed to save layout:', err);
		}
	}

	function formatNumber(num: number): string {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		} else if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		}
		return num.toLocaleString();
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function formatPercentage(value: number): string {
		return `${value.toFixed(1)}%`;
	}

	$: gridCols = layout === 'compact' ? 2 : layout === 'executive' ? 3 : 4;
</script>

<div class="space-y-6">
	<!-- Layout Controls -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<h3 class="text-lg font-medium text-gray-900">Dashboard Layout</h3>
			<span class="text-sm text-gray-500">({layout})</span>
		</div>

		<div class="flex items-center space-x-2">
			{#if editMode}
				<button
					on:click={saveLayout}
					class="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
				>
					Save Layout
				</button>
				<button
					on:click={() => (editMode = false)}
					class="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
				>
					Cancel
				</button>
			{:else}
				<button
					on:click={toggleEditMode}
					class="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
				>
					Edit Layout
				</button>
			{/if}
		</div>
	</div>

	<!-- Widget Palette (Edit Mode) -->
	{#if editMode}
		<div class="bg-gray-50 rounded-lg p-4">
			<h4 class="text-sm font-medium text-gray-900 mb-3">Available Widgets</h4>
			<div class="flex flex-wrap gap-2">
				{#each availableWidgets as widgetDef}
					{#if !widgets.find((w) => w.id === widgetDef.id)}
						<button
							on:click={() => addWidget(widgetDef)}
							class="px-3 py-2 bg-white border border-gray-300 text-sm rounded-md hover:bg-gray-50"
						>
							+ {widgetDef.title}
						</button>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	<!-- Dashboard Grid -->
	<div class="grid grid-cols-{gridCols} gap-6 auto-rows-min">
		{#each widgets as widget (widget.id)}
			<DashboardWidget
				title={widget.title}
				type={widget.type}
				size={widget.size}
				loading={widget.loading}
				error={widget.error}
				lastUpdated={widget.lastUpdated}
				on:refresh={() => handleWidgetRefresh(widget.id)}
				on:export={() => handleWidgetExport(widget.id)}
				on:configure={() => handleWidgetConfigure(widget.id)}
				on:remove={() => handleWidgetRemove(widget.id)}
			>
				{#if widget.id === 'user-metrics' && dashboardData?.dashboardMetrics}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Total Users</span>
							<span class="text-lg font-semibold">
								{formatNumber(dashboardData.dashboardMetrics.userMetrics.totalUsers)}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Active Users</span>
							<span class="text-lg font-semibold">
								{formatNumber(dashboardData.dashboardMetrics.userMetrics.activeUsers)}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">New Users</span>
							<span class="text-lg font-semibold text-green-600">
								+{formatNumber(dashboardData.dashboardMetrics.userMetrics.newUsers)}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Churn Rate</span>
							<span class="text-lg font-semibold text-red-600">
								{formatPercentage(dashboardData.dashboardMetrics.userMetrics.churnRate)}
							</span>
						</div>
					</div>
				{:else if widget.id === 'revenue-metrics' && dashboardData?.dashboardMetrics}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Total Revenue</span>
							<span class="text-lg font-semibold">
								{formatCurrency(dashboardData.dashboardMetrics.revenueMetrics.totalRevenue)}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Recurring Revenue</span>
							<span class="text-lg font-semibold">
								{formatCurrency(dashboardData.dashboardMetrics.revenueMetrics.recurringRevenue)}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">ARPU</span>
							<span class="text-lg font-semibold">
								{formatCurrency(
									dashboardData.dashboardMetrics.revenueMetrics.averageRevenuePerUser
								)}
							</span>
						</div>
					</div>
				{:else if widget.id === 'engagement-metrics' && dashboardData?.dashboardMetrics}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Daily Active Users</span>
							<span class="text-lg font-semibold">
								{formatNumber(dashboardData.dashboardMetrics.engagementMetrics.dailyActiveUsers)}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Avg Session</span>
							<span class="text-lg font-semibold">
								{Math.round(dashboardData.dashboardMetrics.engagementMetrics.sessionDuration)}m
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Retention Rate</span>
							<span class="text-lg font-semibold">
								{formatPercentage(dashboardData.dashboardMetrics.engagementMetrics.retentionRate)}
							</span>
						</div>
					</div>
				{:else if widget.id === 'system-health' && dashboardData?.dashboardMetrics}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Uptime</span>
							<span class="text-lg font-semibold text-green-600">
								{formatPercentage(dashboardData.dashboardMetrics.systemMetrics.uptime)}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Response Time</span>
							<span class="text-lg font-semibold">
								{dashboardData.dashboardMetrics.systemMetrics.responseTime}ms
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Error Rate</span>
							<span class="text-lg font-semibold">
								{formatPercentage(dashboardData.dashboardMetrics.systemMetrics.errorRate)}
							</span>
						</div>
					</div>
				{:else if widget.id === 'user-growth-chart' && dashboardData?.userGrowth}
					<div class="h-full">
						<div class="h-32 flex items-end justify-between space-x-1">
							{#each dashboardData.userGrowth.userGrowth.slice(-7) as dataPoint}
								<div class="flex flex-col items-center">
									<div
										class="bg-blue-500 rounded-t"
										style="height: {Math.max(
											4,
											(dataPoint.value /
												Math.max(
													...dashboardData.userGrowth.userGrowth.slice(-7).map((d) => d.value)
												)) *
												100
										)}px; width: 16px;"
									></div>
									<div class="text-xs text-gray-500 mt-1">
										{new Date(dataPoint.date).getDate()}
									</div>
								</div>
							{/each}
						</div>
						<div class="mt-2 text-center">
							<p class="text-sm text-gray-600">Total: {dashboardData.userGrowth.totalNewUsers}</p>
						</div>
					</div>
				{:else if widget.id === 'revenue-chart' && dashboardData?.revenueAnalytics}
					<div class="h-full">
						<div class="h-32 flex items-end justify-between space-x-1">
							{#each dashboardData.revenueAnalytics.revenueGrowth.slice(-7) as dataPoint}
								<div class="flex flex-col items-center">
									<div
										class="bg-green-500 rounded-t"
										style="height: {Math.max(
											4,
											(dataPoint.value /
												Math.max(
													...dashboardData.revenueAnalytics.revenueGrowth
														.slice(-7)
														.map((d) => d.value)
												)) *
												100
										)}px; width: 16px;"
									></div>
									<div class="text-xs text-gray-500 mt-1">
										{new Date(dataPoint.date).getDate()}
									</div>
								</div>
							{/each}
						</div>
						<div class="mt-2 text-center">
							<p class="text-sm text-gray-600">
								Total: {formatCurrency(dashboardData.revenueAnalytics.totalRevenue)}
							</p>
						</div>
					</div>
				{:else if widget.id === 'metrics-comparison'}
					<MetricsComparison
						{adminId}
						currentPeriod={{
							start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
							end: new Date().toISOString()
						}}
						previousPeriod={{
							start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
							end: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
						}}
					/>
				{:else}
					<div class="flex items-center justify-center h-full text-gray-500">
						<div class="text-center">
							<svg
								class="mx-auto h-8 w-8 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
							<p class="mt-2 text-sm">Widget content loading...</p>
						</div>
					</div>
				{/if}
			</DashboardWidget>
		{/each}
	</div>
</div>
