<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { analyticsService } from '../../services/analyticsService';
	import DashboardLayoutManager from './DashboardLayoutManager.svelte';
	import type {
		DashboardMetrics,
		GrowthAnalytics,
		RevenueAnalytics,
		EngagementMetrics
	} from '../../services/analyticsService';
	import type { Id } from '../../../../../convex/_generated/dataModel';

	// Props
	export let adminId: Id<'adminUsers'>;

	// State
	let dashboardMetrics: DashboardMetrics | null = null;
	let userGrowth: GrowthAnalytics | null = null;
	let revenueAnalytics: RevenueAnalytics | null = null;
	let engagementMetrics: EngagementMetrics | null = null;
	let loading = false;
	let error = '';

	// Real-time subscriptions
	let subscriptions: string[] = [];

	// Time period selection
	let selectedPeriod: '1d' | '7d' | '30d' | '90d' | '1y' = '30d';
	let customTimeframe = {
		start: '',
		end: ''
	};
	let useCustomTimeframe = false;

	// Auto-refresh settings
	let autoRefresh = true;
	let refreshInterval = 30; // seconds
	let refreshTimer: NodeJS.Timeout | null = null;

	// Widget visibility and layout
	let visibleWidgets = {
		overview: true,
		userGrowth: true,
		revenue: true,
		engagement: true,
		systemHealth: true,
		comparison: true,
		trends: true
	};

	// Dashboard customization
	let dashboardLayout = 'default';
	let availableLayouts = ['default', 'compact', 'detailed', 'executive'];
	let customDashboards: any[] = [];
	let selectedDashboard = 'default';

	// Metric comparison
	let comparisonMode = false;
	let comparisonPeriod: '1d' | '7d' | '30d' | '90d' | '1y' = '30d';
	let comparisonData: any = null;

	// Trend analysis
	let trendAnalysis = {
		userGrowthTrend: 'stable',
		revenueTrend: 'increasing',
		engagementTrend: 'stable'
	};

	// Real-time status
	let realTimeStatus = 'connected';
	let lastUpdate = new Date().toISOString();

	onMount(() => {
		loadDashboardData();
		loadCustomDashboards();
		setupRealTimeUpdates();

		if (autoRefresh) {
			startAutoRefresh();
		}
	});

	onDestroy(() => {
		cleanup();
	});

	async function loadDashboardData() {
		try {
			loading = true;
			error = '';

			const timeframe =
				useCustomTimeframe && customTimeframe.start && customTimeframe.end
					? customTimeframe
					: undefined;

			// Load all dashboard data
			const [metrics, growth, revenue, engagement] = await Promise.all([
				analyticsService.getDashboardMetrics(timeframe, adminId),
				analyticsService.getUserGrowthAnalytics(
					selectedPeriod,
					timeframe?.start,
					timeframe?.end,
					adminId
				),
				analyticsService.getRevenueAnalytics(
					selectedPeriod,
					timeframe?.start,
					timeframe?.end,
					adminId
				),
				analyticsService.getEngagementMetrics(
					selectedPeriod,
					timeframe?.start,
					timeframe?.end,
					adminId
				)
			]);

			dashboardMetrics = metrics;
			userGrowth = growth;
			revenueAnalytics = revenue;
			engagementMetrics = engagement;

			// Update trend analysis
			updateTrendAnalysis();

			// Load comparison data if in comparison mode
			if (comparisonMode) {
				await loadComparisonData();
			}

			lastUpdate = new Date().toISOString();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load dashboard data';
		} finally {
			loading = false;
		}
	}

	async function loadCustomDashboards() {
		try {
			customDashboards = await analyticsService.getCustomDashboards(adminId);
		} catch (err) {
			console.error('Failed to load custom dashboards:', err);
		}
	}

	async function loadComparisonData() {
		if (!dashboardMetrics) return;

		try {
			const currentPeriod = {
				start: useCustomTimeframe ? customTimeframe.start : getPeriodStart(selectedPeriod),
				end: useCustomTimeframe ? customTimeframe.end : new Date().toISOString()
			};

			const previousPeriod = {
				start: getPeriodStart(comparisonPeriod, true),
				end: getPeriodStart(selectedPeriod)
			};

			const [userComparison, revenueComparison, engagementComparison] = await Promise.all([
				analyticsService.compareMetrics('users', currentPeriod, previousPeriod, adminId),
				analyticsService.compareMetrics('revenue', currentPeriod, previousPeriod, adminId),
				analyticsService.compareMetrics('engagement', currentPeriod, previousPeriod, adminId)
			]);

			comparisonData = {
				users: userComparison,
				revenue: revenueComparison,
				engagement: engagementComparison
			};
		} catch (err) {
			console.error('Failed to load comparison data:', err);
		}
	}

	function updateTrendAnalysis() {
		if (!userGrowth || !revenueAnalytics || !engagementMetrics) return;

		// Simple trend analysis based on recent data points
		const userGrowthPoints = userGrowth.userGrowth.slice(-7);
		const revenuePoints = revenueAnalytics.revenueGrowth.slice(-7);
		const engagementPoints = engagementMetrics.dailyActiveUsers.slice(-7);

		// Calculate trends
		trendAnalysis.userGrowthTrend = calculateTrend(userGrowthPoints);
		trendAnalysis.revenueTrend = calculateTrend(revenuePoints);
		trendAnalysis.engagementTrend = calculateTrend(engagementPoints);
	}

	function calculateTrend(dataPoints: Array<{ date: string; value: number }>): string {
		if (dataPoints.length < 2) return 'stable';

		const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
		const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

		const firstAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
		const secondAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;

		const change = ((secondAvg - firstAvg) / firstAvg) * 100;

		if (change > 5) return 'increasing';
		if (change < -5) return 'decreasing';
		return 'stable';
	}

	function getPeriodStart(period: string, isPrevious = false): string {
		const now = new Date();
		let days = 30;

		switch (period) {
			case '1d':
				days = 1;
				break;
			case '7d':
				days = 7;
				break;
			case '30d':
				days = 30;
				break;
			case '90d':
				days = 90;
				break;
			case '1y':
				days = 365;
				break;
		}

		if (isPrevious) {
			days *= 2; // Go back twice as far for previous period
		}

		return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
	}

	async function setupRealTimeUpdates() {
		try {
			// Subscribe to real-time updates for each metric type
			const dashboardSub = await analyticsService.subscribeToMetrics(
				'dashboard',
				adminId,
				(data) => {
					dashboardMetrics = data;
					lastUpdate = new Date().toISOString();
					realTimeStatus = 'connected';
				}
			);
			subscriptions.push(dashboardSub);

			const userSub = await analyticsService.subscribeToMetrics('users', adminId, (data) => {
				userGrowth = data;
				lastUpdate = new Date().toISOString();
			});
			subscriptions.push(userSub);

			const revenueSub = await analyticsService.subscribeToMetrics('revenue', adminId, (data) => {
				revenueAnalytics = data;
				lastUpdate = new Date().toISOString();
			});
			subscriptions.push(revenueSub);

			const engagementSub = await analyticsService.subscribeToMetrics(
				'engagement',
				adminId,
				(data) => {
					engagementMetrics = data;
					lastUpdate = new Date().toISOString();
					// Update trend analysis when new data arrives
					updateTrendAnalysis();
				}
			);
			subscriptions.push(engagementSub);

			realTimeStatus = 'connected';
		} catch (err) {
			console.error('Failed to setup real-time updates:', err);
			realTimeStatus = 'disconnected';
		}
	}

	function startAutoRefresh() {
		if (refreshTimer) {
			clearInterval(refreshTimer);
		}

		refreshTimer = setInterval(() => {
			if (autoRefresh) {
				loadDashboardData();
			}
		}, refreshInterval * 1000);
	}

	function stopAutoRefresh() {
		if (refreshTimer) {
			clearInterval(refreshTimer);
			refreshTimer = null;
		}
	}

	function toggleAutoRefresh() {
		autoRefresh = !autoRefresh;
		if (autoRefresh) {
			startAutoRefresh();
		} else {
			stopAutoRefresh();
		}
	}

	function cleanup() {
		// Unsubscribe from all real-time updates
		subscriptions.forEach((subId) => {
			analyticsService.unsubscribeFromMetrics(subId);
		});
		subscriptions = [];

		// Clear refresh timer
		stopAutoRefresh();
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

	function formatDuration(minutes: number): string {
		if (minutes < 60) {
			return `${Math.round(minutes)}m`;
		}
		const hours = Math.floor(minutes / 60);
		const mins = Math.round(minutes % 60);
		return `${hours}h ${mins}m`;
	}

	function getChangeColor(value: number): string {
		if (value > 0) return 'text-green-600';
		if (value < 0) return 'text-red-600';
		return 'text-gray-600';
	}

	function getHealthColor(
		value: number,
		type: 'uptime' | 'response' | 'error' | 'resource'
	): string {
		switch (type) {
			case 'uptime':
				return value >= 99.5 ? 'text-green-600' : value >= 99 ? 'text-yellow-600' : 'text-red-600';
			case 'response':
				return value <= 200 ? 'text-green-600' : value <= 500 ? 'text-yellow-600' : 'text-red-600';
			case 'error':
				return value <= 1 ? 'text-green-600' : value <= 5 ? 'text-yellow-600' : 'text-red-600';
			case 'resource':
				return value <= 70 ? 'text-green-600' : value <= 85 ? 'text-yellow-600' : 'text-red-600';
			default:
				return 'text-gray-600';
		}
	}

	function getTrendColor(trend: string): string {
		switch (trend) {
			case 'increasing':
				return 'text-green-600';
			case 'decreasing':
				return 'text-red-600';
			default:
				return 'text-gray-600';
		}
	}

	function getTrendIcon(trend: string): string {
		switch (trend) {
			case 'increasing':
				return '↗';
			case 'decreasing':
				return '↘';
			default:
				return '→';
		}
	}

	async function toggleComparisonMode() {
		comparisonMode = !comparisonMode;
		if (comparisonMode) {
			await loadComparisonData();
		} else {
			comparisonData = null;
		}
	}

	async function saveDashboardLayout() {
		try {
			const layoutConfig = {
				visibleWidgets,
				dashboardLayout,
				refreshInterval,
				autoRefresh
			};

			await analyticsService.saveCustomDashboard(
				`Custom Dashboard ${Date.now()}`,
				layoutConfig,
				Object.keys(visibleWidgets).filter(
					(key) => visibleWidgets[key as keyof typeof visibleWidgets]
				),
				adminId
			);

			await loadCustomDashboards();
		} catch (err) {
			console.error('Failed to save dashboard layout:', err);
		}
	}

	function toggleWidget(widgetName: keyof typeof visibleWidgets) {
		visibleWidgets[widgetName] = !visibleWidgets[widgetName];
	}

	function exportDashboard() {
		const data = {
			dashboardMetrics,
			userGrowth,
			revenueAnalytics,
			engagementMetrics,
			comparisonData,
			trendAnalysis,
			exportedAt: new Date().toISOString()
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<div class="p-6 bg-gray-50 min-h-screen">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-gray-900">Real-Time Dashboard</h1>
				<div class="flex items-center space-x-4 mt-1">
					<p class="text-gray-600">Live platform metrics and analytics</p>
					<div class="flex items-center space-x-2">
						<div
							class="w-2 h-2 rounded-full {realTimeStatus === 'connected'
								? 'bg-green-500'
								: 'bg-red-500'}"
						></div>
						<span class="text-xs text-gray-500">
							{realTimeStatus === 'connected' ? 'Live' : 'Disconnected'}
						</span>
						<span class="text-xs text-gray-400">
							Last update: {new Date(lastUpdate).toLocaleTimeString()}
						</span>
					</div>
				</div>
			</div>

			<div class="flex items-center space-x-4">
				<!-- Dashboard Layout Selector -->
				<div class="flex items-center space-x-2">
					<label for="layout-select" class="text-sm font-medium text-gray-700">Layout:</label>
					<select
						id="layout-select"
						bind:value={dashboardLayout}
						class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						{#each availableLayouts as layout}
							<option value={layout}>{layout.charAt(0).toUpperCase() + layout.slice(1)}</option>
						{/each}
					</select>
				</div>

				<!-- Time Period Selector -->
				<div class="flex items-center space-x-2">
					<label for="period-select" class="text-sm font-medium text-gray-700">Period:</label>
					<select
						id="period-select"
						bind:value={selectedPeriod}
						on:change={loadDashboardData}
						class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="1d">Last 24 Hours</option>
						<option value="7d">Last 7 Days</option>
						<option value="30d">Last 30 Days</option>
						<option value="90d">Last 90 Days</option>
						<option value="1y">Last Year</option>
					</select>
				</div>

				<!-- Comparison Toggle -->
				<button
					on:click={toggleComparisonMode}
					class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 {comparisonMode
						? 'bg-blue-50 border-blue-300 text-blue-700'
						: 'text-gray-700'}"
				>
					Compare
				</button>

				<!-- Auto-refresh Toggle -->
				<div class="flex items-center space-x-2">
					<label for="auto-refresh" class="text-sm font-medium text-gray-700">Auto-refresh:</label>
					<button
						id="auto-refresh"
						on:click={toggleAutoRefresh}
						class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {autoRefresh
							? 'bg-blue-600'
							: 'bg-gray-200'}"
						aria-label="Toggle auto-refresh"
					>
						<span
							class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {autoRefresh
								? 'translate-x-6'
								: 'translate-x-1'}"
						></span>
					</button>
					<span class="text-sm text-gray-600">{refreshInterval}s</span>
				</div>

				<!-- Actions Menu -->
				<div class="flex items-center space-x-2">
					<button
						on:click={loadDashboardData}
						disabled={loading}
						class="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Loading...' : 'Refresh'}
					</button>

					<button
						on:click={saveDashboardLayout}
						class="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
					>
						Save Layout
					</button>

					<button
						on:click={exportDashboard}
						class="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
					>
						Export
					</button>
				</div>
			</div>
		</div>

		<!-- Widget Visibility Controls -->
		<div class="mt-4 flex flex-wrap gap-2">
			{#each Object.entries(visibleWidgets) as [widgetName, isVisible]}
				<button
					on:click={() => toggleWidget(widgetName as keyof typeof visibleWidgets)}
					class="px-3 py-1 text-xs rounded-full border {isVisible
						? 'bg-blue-100 border-blue-300 text-blue-700'
						: 'bg-gray-100 border-gray-300 text-gray-600'}"
				>
					{widgetName.charAt(0).toUpperCase() + widgetName.slice(1).replace(/([A-Z])/g, ' $1')}
				</button>
			{/each}
		</div>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm text-red-800">{error}</p>
				</div>
				<div class="ml-auto pl-3">
					<button
						on:click={() => (error = '')}
						class="text-red-400 hover:text-red-600"
						aria-label="Clear error message"
					>
						<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if loading}
		<div class="text-center py-12">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<p class="mt-2 text-gray-600">Loading dashboard...</p>
		</div>
	{:else if dashboardMetrics}
		<!-- Trend Analysis Summary -->
		{#if visibleWidgets.trends}
			<div class="bg-white rounded-lg shadow p-4 mb-6">
				<h3 class="text-lg font-medium text-gray-900 mb-3">Trend Analysis</h3>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="flex items-center space-x-3">
						<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
							<span class="text-lg {getTrendColor(trendAnalysis.userGrowthTrend)}">
								{getTrendIcon(trendAnalysis.userGrowthTrend)}
							</span>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-900">User Growth</p>
							<p class="text-xs {getTrendColor(trendAnalysis.userGrowthTrend)}">
								{trendAnalysis.userGrowthTrend}
							</p>
						</div>
					</div>
					<div class="flex items-center space-x-3">
						<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
							<span class="text-lg {getTrendColor(trendAnalysis.revenueTrend)}">
								{getTrendIcon(trendAnalysis.revenueTrend)}
							</span>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-900">Revenue</p>
							<p class="text-xs {getTrendColor(trendAnalysis.revenueTrend)}">
								{trendAnalysis.revenueTrend}
							</p>
						</div>
					</div>
					<div class="flex items-center space-x-3">
						<div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
							<span class="text-lg {getTrendColor(trendAnalysis.engagementTrend)}">
								{getTrendIcon(trendAnalysis.engagementTrend)}
							</span>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-900">Engagement</p>
							<p class="text-xs {getTrendColor(trendAnalysis.engagementTrend)}">
								{trendAnalysis.engagementTrend}
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Overview Metrics -->
		{#if visibleWidgets.overview}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<!-- User Metrics -->
				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
								<svg
									class="w-4 h-4 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
									></path>
								</svg>
							</div>
						</div>
						<div class="ml-4 flex-1">
							<p class="text-sm font-medium text-gray-600">Total Users</p>
							<p class="text-2xl font-semibold text-gray-900">
								{formatNumber(dashboardMetrics.userMetrics.totalUsers)}
							</p>
							<div class="flex items-center justify-between">
								<p class="text-sm {getChangeColor(dashboardMetrics.userMetrics.newUsers)}">
									+{dashboardMetrics.userMetrics.newUsers} new
								</p>
								{#if comparisonData?.users}
									<p class="text-xs text-gray-500">
										vs {comparisonData.users.changePercent > 0
											? '+'
											: ''}{comparisonData.users.changePercent.toFixed(1)}%
									</p>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Revenue Metrics -->
				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
								<svg
									class="w-4 h-4 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
									></path>
								</svg>
							</div>
						</div>
						<div class="ml-4 flex-1">
							<p class="text-sm font-medium text-gray-600">Total Revenue</p>
							<p class="text-2xl font-semibold text-gray-900">
								{formatCurrency(dashboardMetrics.revenueMetrics.totalRevenue)}
							</p>
							<div class="flex items-center justify-between">
								<p class="text-sm text-gray-600">
									ARPU: {formatCurrency(dashboardMetrics.revenueMetrics.averageRevenuePerUser)}
								</p>
								{#if comparisonData?.revenue}
									<p class="text-xs text-gray-500">
										vs {comparisonData.revenue.changePercent > 0
											? '+'
											: ''}{comparisonData.revenue.changePercent.toFixed(1)}%
									</p>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Engagement Metrics -->
				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
								<svg
									class="w-4 h-4 text-purple-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 10V3L4 14h7v7l9-11h-7z"
									></path>
								</svg>
							</div>
						</div>
						<div class="ml-4 flex-1">
							<p class="text-sm font-medium text-gray-600">Daily Active Users</p>
							<p class="text-2xl font-semibold text-gray-900">
								{formatNumber(dashboardMetrics.engagementMetrics.dailyActiveUsers)}
							</p>
							<div class="flex items-center justify-between">
								<p class="text-sm text-gray-600">
									Avg Session: {formatDuration(dashboardMetrics.engagementMetrics.sessionDuration)}
								</p>
								{#if comparisonData?.engagement}
									<p class="text-xs text-gray-500">
										vs {comparisonData.engagement.changePercent > 0
											? '+'
											: ''}{comparisonData.engagement.changePercent.toFixed(1)}%
									</p>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- System Health -->
				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
								<svg
									class="w-4 h-4 text-yellow-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
							</div>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-600">System Health</p>
							<p
								class="text-2xl font-semibold {getHealthColor(
									dashboardMetrics.systemMetrics.uptime,
									'uptime'
								)}"
							>
								{formatPercentage(dashboardMetrics.systemMetrics.uptime)}
							</p>
							<p class="text-sm text-gray-600">
								{dashboardMetrics.systemMetrics.responseTime}ms avg
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Comparison Section -->
		{#if comparisonMode && comparisonData}
			<div class="bg-white rounded-lg shadow p-6 mb-8">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-medium text-gray-900">Period Comparison</h3>
					<select
						bind:value={comparisonPeriod}
						on:change={loadComparisonData}
						class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="1d">vs Previous Day</option>
						<option value="7d">vs Previous Week</option>
						<option value="30d">vs Previous Month</option>
						<option value="90d">vs Previous Quarter</option>
					</select>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<!-- User Comparison -->
					<div class="text-center">
						<h4 class="text-sm font-medium text-gray-700 mb-2">User Growth</h4>
						<div class="text-2xl font-semibold {getChangeColor(comparisonData.users.change)}">
							{comparisonData.users.change > 0 ? '+' : ''}{comparisonData.users.change}
						</div>
						<div class="text-sm text-gray-600">
							{comparisonData.users.changePercent > 0
								? '+'
								: ''}{comparisonData.users.changePercent.toFixed(1)}%
						</div>
					</div>

					<!-- Revenue Comparison -->
					<div class="text-center">
						<h4 class="text-sm font-medium text-gray-700 mb-2">Revenue Change</h4>
						<div class="text-2xl font-semibold {getChangeColor(comparisonData.revenue.change)}">
							{formatCurrency(comparisonData.revenue.change)}
						</div>
						<div class="text-sm text-gray-600">
							{comparisonData.revenue.changePercent > 0
								? '+'
								: ''}{comparisonData.revenue.changePercent.toFixed(1)}%
						</div>
					</div>

					<!-- Engagement Comparison -->
					<div class="text-center">
						<h4 class="text-sm font-medium text-gray-700 mb-2">Engagement Change</h4>
						<div class="text-2xl font-semibold {getChangeColor(comparisonData.engagement.change)}">
							{comparisonData.engagement.change > 0 ? '+' : ''}{comparisonData.engagement.change}
						</div>
						<div class="text-sm text-gray-600">
							{comparisonData.engagement.changePercent > 0
								? '+'
								: ''}{comparisonData.engagement.changePercent.toFixed(1)}%
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Charts Section -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
			<!-- User Growth Chart -->
			{#if visibleWidgets.userGrowth && userGrowth}
				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-lg font-medium text-gray-900">User Growth</h3>
						<div class="flex items-center space-x-2">
							<span class="text-sm {getTrendColor(trendAnalysis.userGrowthTrend)}">
								{getTrendIcon(trendAnalysis.userGrowthTrend)}
								{trendAnalysis.userGrowthTrend}
							</span>
						</div>
					</div>
					<div class="h-64">
						<!-- Enhanced Chart Placeholder with Data Points -->
						<div class="h-full flex items-end justify-between space-x-1 px-4">
							{#each userGrowth.userGrowth.slice(-7) as dataPoint, index}
								<div class="flex flex-col items-center">
									<div
										class="bg-blue-500 rounded-t"
										style="height: {Math.max(
											4,
											(dataPoint.value /
												Math.max(...userGrowth.userGrowth.slice(-7).map((d) => d.value))) *
												200
										)}px; width: 24px;"
									></div>
									<div class="text-xs text-gray-500 mt-1 transform -rotate-45">
										{new Date(dataPoint.date).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric'
										})}
									</div>
								</div>
							{/each}
						</div>
						<div class="mt-4 text-center">
							<p class="text-sm text-gray-600">Total new users: {userGrowth.totalNewUsers}</p>
							<p class="text-xs text-gray-500">Last 7 days trend</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Revenue Chart -->
			{#if visibleWidgets.revenue && revenueAnalytics}
				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-lg font-medium text-gray-900">Revenue Trends</h3>
						<div class="flex items-center space-x-2">
							<span class="text-sm {getTrendColor(trendAnalysis.revenueTrend)}">
								{getTrendIcon(trendAnalysis.revenueTrend)}
								{trendAnalysis.revenueTrend}
							</span>
						</div>
					</div>
					<div class="h-64">
						<!-- Enhanced Revenue Chart -->
						<div class="h-full flex items-end justify-between space-x-1 px-4">
							{#each revenueAnalytics.revenueGrowth.slice(-7) as dataPoint, index}
								<div class="flex flex-col items-center">
									<div
										class="bg-green-500 rounded-t"
										style="height: {Math.max(
											4,
											(dataPoint.value /
												Math.max(...revenueAnalytics.revenueGrowth.slice(-7).map((d) => d.value))) *
												200
										)}px; width: 24px;"
									></div>
									<div class="text-xs text-gray-500 mt-1 transform -rotate-45">
										{new Date(dataPoint.date).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric'
										})}
									</div>
								</div>
							{/each}
						</div>
						<div class="mt-4 text-center">
							<p class="text-sm text-gray-600">
								Total: {formatCurrency(revenueAnalytics.totalRevenue)}
							</p>
							<p class="text-xs text-gray-500">Last 7 days trend</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Dashboard Layout Manager -->
		<DashboardLayoutManager
			{adminId}
			layout={dashboardLayout}
			dashboardData={{
				dashboardMetrics,
				userGrowth,
				revenueAnalytics,
				engagementMetrics,
				comparisonData,
				trendAnalysis
			}}
		/>
	{:else}
		<div class="text-center py-12">
			<svg
				class="mx-auto h-12 w-12 text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
				></path>
			</svg>
			<h3 class="mt-2 text-sm font-medium text-gray-900">No dashboard data</h3>
			<p class="mt-1 text-sm text-gray-500">Get started by loading the dashboard metrics.</p>
		</div>
	{/if}
</div>
