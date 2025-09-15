<script lang="ts">
	import { onMount } from 'svelte';
	import { advancedAnalyticsService } from '$lib/services/advancedAnalyticsService';
	import type { UserBehaviorAnalytics, ConversionFunnel } from '$lib/types/admin';
	import type { Id } from 'convex/_generated/dataModel';
	import UserBehaviorAnalyticsComponent from './UserBehaviorAnalytics.svelte';
	import ConversionFunnelAnalytics from './ConversionFunnelAnalytics.svelte';
	import CohortAnalysis from './CohortAnalysis.svelte';
	import CustomReportBuilder from './CustomReportBuilder.svelte';
	import ReportScheduler from './ReportScheduler.svelte';

	export let adminId: string;

	let activeTab = 'behavior';
	let loading = false;
	let error: string | null = null;

	let userBehaviorData: UserBehaviorAnalytics | null = null;
	let conversionFunnelData: ConversionFunnel | null = null;
	let cohortData: any = null;

	let dateRange = {
		start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		end: new Date().toISOString().split('T')[0]
	};

	const tabs = [
		{ id: 'behavior', label: 'User Behavior', icon: '👥' },
		{ id: 'funnels', label: 'Conversion Funnels', icon: '📊' },
		{ id: 'cohorts', label: 'Cohort Analysis', icon: '📈' },
		{ id: 'reports', label: 'Custom Reports', icon: '📋' },
		{ id: 'scheduler', label: 'Report Scheduler', icon: '⏰' }
	];

	onMount(() => {
		loadAnalyticsData();
	});

	async function loadAnalyticsData() {
		loading = true;
		error = null;

		try {
			// Load initial data for all tabs
			await Promise.all([loadUserBehaviorData(), loadConversionFunnelData(), loadCohortData()]);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load analytics data';
		} finally {
			loading = false;
		}
	}

	async function loadUserBehaviorData() {
		try {
			userBehaviorData = await advancedAnalyticsService.getUserBehaviorAnalytics(
				dateRange,
				'role',
				adminId as Id<'adminUsers'>
			);
		} catch (err) {
			console.error('Failed to load user behavior data:', err);
		}
	}

	async function loadConversionFunnelData() {
		try {
			conversionFunnelData = await advancedAnalyticsService.getConversionFunnelAnalytics(
				'signup',
				dateRange,
				adminId as Id<'adminUsers'>
			);
		} catch (err) {
			console.error('Failed to load conversion funnel data:', err);
		}
	}

	async function loadCohortData() {
		try {
			cohortData = await advancedAnalyticsService.analyzeCohortRetention(
				'monthly',
				dateRange.start,
				dateRange.end,
				adminId as Id<'adminUsers'>
			);
		} catch (err) {
			console.error('Failed to load cohort data:', err);
		}
	}

	function handleDateRangeChange() {
		loadAnalyticsData();
	}
</script>

<div class="advanced-analytics-dashboard">
	<div class="dashboard-header">
		<h1>Advanced Analytics & Reporting</h1>
		<div class="date-range-selector">
			<label>
				From:
				<input type="date" bind:value={dateRange.start} on:change={handleDateRangeChange} />
			</label>
			<label>
				To:
				<input type="date" bind:value={dateRange.end} on:change={handleDateRangeChange} />
			</label>
		</div>
	</div>

	<div class="tab-navigation">
		{#each tabs as tab}
			<button
				class="tab-button"
				class:active={activeTab === tab.id}
				on:click={() => (activeTab = tab.id)}
			>
				<span class="tab-icon">{tab.icon}</span>
				{tab.label}
			</button>
		{/each}
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading analytics data...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>Error: {error}</p>
			<button on:click={loadAnalyticsData}>Retry</button>
		</div>
	{:else}
		<div class="tab-content">
			{#if activeTab === 'behavior'}
				<UserBehaviorAnalyticsComponent
					data={userBehaviorData}
					{dateRange}
					{adminId}
					on:refresh={loadUserBehaviorData}
				/>
			{:else if activeTab === 'funnels'}
				<ConversionFunnelAnalytics
					data={conversionFunnelData}
					{dateRange}
					{adminId}
					on:refresh={loadConversionFunnelData}
				/>
			{:else if activeTab === 'cohorts'}
				<CohortAnalysis data={cohortData} {dateRange} {adminId} on:refresh={loadCohortData} />
			{:else if activeTab === 'reports'}
				<CustomReportBuilder {adminId} {dateRange} />
			{:else if activeTab === 'scheduler'}
				<ReportScheduler {adminId} />
			{/if}
		</div>
	{/if}
</div>

<style>
	.advanced-analytics-dashboard {
		padding: 24px;
		max-width: 1400px;
		margin: 0 auto;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32px;
		padding-bottom: 16px;
		border-bottom: 1px solid #e5e7eb;
	}

	.dashboard-header h1 {
		font-size: 28px;
		font-weight: 700;
		color: #111827;
		margin: 0;
	}

	.date-range-selector {
		display: flex;
		gap: 16px;
		align-items: center;
	}

	.date-range-selector label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 14px;
		font-weight: 500;
		color: #374151;
	}

	.date-range-selector input {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
	}

	.tab-navigation {
		display: flex;
		gap: 4px;
		margin-bottom: 24px;
		border-bottom: 1px solid #e5e7eb;
	}

	.tab-button {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 20px;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		font-size: 14px;
		font-weight: 500;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab-button:hover {
		color: #374151;
		background-color: #f9fafb;
	}

	.tab-button.active {
		color: #3b82f6;
		border-bottom-color: #3b82f6;
		background-color: #eff6ff;
	}

	.tab-icon {
		font-size: 16px;
	}

	.tab-content {
		min-height: 600px;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 20px;
		color: #6b7280;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 16px;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 20px;
		color: #dc2626;
	}

	.error-state button {
		margin-top: 16px;
		padding: 8px 16px;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
</style>
