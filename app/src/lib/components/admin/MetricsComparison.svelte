<script lang="ts">
	import { onMount } from 'svelte';
	import { analyticsService } from '../../services/analyticsService';
	import type { Id } from '../../../convex/_generated/dataModel';

	// Props
	export let adminId: Id<'adminUsers'>;
	export let metricType: 'users' | 'revenue' | 'engagement' = 'users';
	export let currentPeriod: { start: string; end: string };
	export let previousPeriod: { start: string; end: string };

	// State
	let comparisonData: any = null;
	let loading = false;
	let error = '';

	// Comparison options
	let comparisonTypes = [
		{ value: 'users', label: 'User Metrics', icon: '👥' },
		{ value: 'revenue', label: 'Revenue Metrics', icon: '💰' },
		{ value: 'engagement', label: 'Engagement Metrics', icon: '📊' }
	];

	onMount(() => {
		loadComparisonData();
	});

	async function loadComparisonData() {
		try {
			loading = true;
			error = '';

			comparisonData = await analyticsService.compareMetrics(
				metricType,
				currentPeriod,
				previousPeriod,
				adminId
			);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load comparison data';
		} finally {
			loading = false;
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
		return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
	}

	function getChangeColor(value: number): string {
		if (value > 0) return 'text-green-600';
		if (value < 0) return 'text-red-600';
		return 'text-gray-600';
	}

	function getChangeIcon(value: number): string {
		if (value > 0) return '↗';
		if (value < 0) return '↘';
		return '→';
	}

	function getMetricValue(data: any, type: string): number {
		switch (type) {
			case 'users':
				return data?.totalNewUsers || 0;
			case 'revenue':
				return data?.totalRevenue || 0;
			case 'engagement':
				return data?.dailyActiveUsers?.reduce((sum: number, d: any) => sum + d.value, 0) || 0;
			default:
				return 0;
		}
	}

	$: currentValue = comparisonData ? getMetricValue(comparisonData.current, metricType) : 0;
	$: previousValue = comparisonData ? getMetricValue(comparisonData.previous, metricType) : 0;
	$: change = comparisonData?.change || 0;
	$: changePercent = comparisonData?.changePercent || 0;
</script>

<div class="bg-white rounded-lg shadow p-6">
	<div class="flex items-center justify-between mb-6">
		<h3 class="text-lg font-medium text-gray-900">Metrics Comparison</h3>

		<!-- Metric Type Selector -->
		<div class="flex space-x-1 bg-gray-100 rounded-lg p-1">
			{#each comparisonTypes as type}
				<button
					on:click={() => {
						metricType = type.value;
						loadComparisonData();
					}}
					class="px-3 py-1 text-sm rounded-md transition-colors {metricType === type.value
						? 'bg-white text-gray-900 shadow-sm'
						: 'text-gray-600 hover:text-gray-900'}"
				>
					<span class="mr-1">{type.icon}</span>
					{type.label}
				</button>
			{/each}
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="text-center">
				<div
					class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"
				></div>
				<p class="mt-2 text-sm text-gray-600">Loading comparison...</p>
			</div>
		</div>
	{:else if error}
		<div class="flex items-center justify-center py-12">
			<div class="text-center">
				<svg
					class="mx-auto h-8 w-8 text-red-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<p class="mt-2 text-sm text-red-600">{error}</p>
			</div>
		</div>
	{:else if comparisonData}
		<!-- Comparison Overview -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
			<!-- Current Period -->
			<div class="text-center">
				<div class="text-sm font-medium text-gray-600 mb-1">Current Period</div>
				<div class="text-2xl font-semibold text-gray-900">
					{metricType === 'revenue' ? formatCurrency(currentValue) : formatNumber(currentValue)}
				</div>
				<div class="text-xs text-gray-500">
					{new Date(currentPeriod.start).toLocaleDateString()} - {new Date(
						currentPeriod.end
					).toLocaleDateString()}
				</div>
			</div>

			<!-- Change -->
			<div class="text-center">
				<div class="text-sm font-medium text-gray-600 mb-1">Change</div>
				<div class="flex items-center justify-center space-x-2">
					<span class="text-2xl {getChangeColor(change)}">
						{getChangeIcon(change)}
					</span>
					<div>
						<div class="text-2xl font-semibold {getChangeColor(change)}">
							{metricType === 'revenue'
								? formatCurrency(Math.abs(change))
								: formatNumber(Math.abs(change))}
						</div>
						<div class="text-sm {getChangeColor(changePercent)}">
							{formatPercentage(changePercent)}
						</div>
					</div>
				</div>
			</div>

			<!-- Previous Period -->
			<div class="text-center">
				<div class="text-sm font-medium text-gray-600 mb-1">Previous Period</div>
				<div class="text-2xl font-semibold text-gray-900">
					{metricType === 'revenue' ? formatCurrency(previousValue) : formatNumber(previousValue)}
				</div>
				<div class="text-xs text-gray-500">
					{new Date(previousPeriod.start).toLocaleDateString()} - {new Date(
						previousPeriod.end
					).toLocaleDateString()}
				</div>
			</div>
		</div>

		<!-- Detailed Breakdown -->
		{#if metricType === 'users' && comparisonData.current && comparisonData.previous}
			<div class="border-t border-gray-200 pt-6">
				<h4 class="text-sm font-medium text-gray-900 mb-4">User Metrics Breakdown</h4>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div class="text-center">
						<div class="text-lg font-semibold text-gray-900">
							{formatNumber(comparisonData.current.totalNewUsers)}
						</div>
						<div class="text-xs text-gray-600">New Users</div>
						<div
							class="text-xs {getChangeColor(
								comparisonData.current.totalNewUsers - comparisonData.previous.totalNewUsers
							)}"
						>
							{formatPercentage(
								((comparisonData.current.totalNewUsers - comparisonData.previous.totalNewUsers) /
									comparisonData.previous.totalNewUsers) *
									100
							)}
						</div>
					</div>

					{#if comparisonData.current.acquisitionChannels}
						{#each Object.entries(comparisonData.current.acquisitionChannels) as [channel, count]}
							<div class="text-center">
								<div class="text-lg font-semibold text-gray-900">
									{formatNumber(count)}
								</div>
								<div class="text-xs text-gray-600 capitalize">{channel}</div>
								{#if comparisonData.previous.acquisitionChannels?.[channel]}
									<div
										class="text-xs {getChangeColor(
											count - comparisonData.previous.acquisitionChannels[channel]
										)}"
									>
										{formatPercentage(
											((count - comparisonData.previous.acquisitionChannels[channel]) /
												comparisonData.previous.acquisitionChannels[channel]) *
												100
										)}
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/if}

		{#if metricType === 'revenue' && comparisonData.current && comparisonData.previous}
			<div class="border-t border-gray-200 pt-6">
				<h4 class="text-sm font-medium text-gray-900 mb-4">Revenue Metrics Breakdown</h4>
				<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
					<div class="text-center">
						<div class="text-lg font-semibold text-gray-900">
							{formatCurrency(comparisonData.current.totalRevenue)}
						</div>
						<div class="text-xs text-gray-600">Total Revenue</div>
						<div
							class="text-xs {getChangeColor(
								comparisonData.current.totalRevenue - comparisonData.previous.totalRevenue
							)}"
						>
							{formatPercentage(
								((comparisonData.current.totalRevenue - comparisonData.previous.totalRevenue) /
									comparisonData.previous.totalRevenue) *
									100
							)}
						</div>
					</div>

					{#if comparisonData.current.revenueBySource}
						{#each Object.entries(comparisonData.current.revenueBySource) as [source, amount]}
							<div class="text-center">
								<div class="text-lg font-semibold text-gray-900">
									{formatCurrency(amount)}
								</div>
								<div class="text-xs text-gray-600 capitalize">{source.replace('_', ' ')}</div>
								{#if comparisonData.previous.revenueBySource?.[source]}
									<div
										class="text-xs {getChangeColor(
											amount - comparisonData.previous.revenueBySource[source]
										)}"
									>
										{formatPercentage(
											((amount - comparisonData.previous.revenueBySource[source]) /
												comparisonData.previous.revenueBySource[source]) *
												100
										)}
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/if}

		{#if metricType === 'engagement' && comparisonData.current && comparisonData.previous}
			<div class="border-t border-gray-200 pt-6">
				<h4 class="text-sm font-medium text-gray-900 mb-4">Engagement Metrics Breakdown</h4>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div class="text-center">
						<div class="text-lg font-semibold text-gray-900">
							{formatNumber(
								comparisonData.current.dailyActiveUsers?.reduce((sum, d) => sum + d.value, 0) || 0
							)}
						</div>
						<div class="text-xs text-gray-600">Total DAU</div>
					</div>

					<div class="text-center">
						<div class="text-lg font-semibold text-gray-900">
							{comparisonData.current.sessionMetrics?.averageDuration?.toFixed(1) || 0}m
						</div>
						<div class="text-xs text-gray-600">Avg Session</div>
					</div>

					<div class="text-center">
						<div class="text-lg font-semibold text-gray-900">
							{comparisonData.current.sessionMetrics?.bounceRate?.toFixed(1) || 0}%
						</div>
						<div class="text-xs text-gray-600">Bounce Rate</div>
					</div>

					<div class="text-center">
						<div class="text-lg font-semibold text-gray-900">
							{comparisonData.current.sessionMetrics?.returnVisitorRate?.toFixed(1) || 0}%
						</div>
						<div class="text-xs text-gray-600">Return Rate</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Insights -->
		<div class="border-t border-gray-200 pt-6 mt-6">
			<h4 class="text-sm font-medium text-gray-900 mb-3">Key Insights</h4>
			<div class="space-y-2">
				{#if changePercent > 10}
					<div class="flex items-center space-x-2 text-sm text-green-700">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<span
							>Strong growth of {formatPercentage(changePercent)} compared to previous period</span
						>
					</div>
				{:else if changePercent < -10}
					<div class="flex items-center space-x-2 text-sm text-red-700">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						<span
							>Significant decline of {formatPercentage(Math.abs(changePercent))} - requires attention</span
						>
					</div>
				{:else}
					<div class="flex items-center space-x-2 text-sm text-gray-700">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>Stable performance with {formatPercentage(changePercent)} change</span>
					</div>
				{/if}
			</div>
		</div>
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
				/>
			</svg>
			<h3 class="mt-2 text-sm font-medium text-gray-900">No comparison data</h3>
			<p class="mt-1 text-sm text-gray-500">Select periods to compare metrics.</p>
		</div>
	{/if}
</div>
