<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { advancedAnalyticsService } from '$lib/services/advancedAnalyticsS						{#if data.cohorts.length > 0}
							{@const bestCohort = data.cohorts.reduce((best: any, current: any) =>
								(current.retention.week_8 || 0) > (best.retention.week_8 || 0) ? current : best
							)}ce';
	import type { Id } from '../../../../../convex/_generated/dataModel';

	export let data: any;
	export let dateRange: { start: string; end: string };
	export let adminId: Id<'adminUsers'>;

	const dispatch = createEventDispatcher();

	let cohortPeriod = 'monthly';
	let loading = false;

	const periodOptions = [
		{ value: 'weekly', label: 'Weekly Cohorts' },
		{ value: 'monthly', label: 'Monthly Cohorts' }
	];

	async function loadCohortData() {
		loading = true;
		try {
			data = await advancedAnalyticsService.analyzeCohortRetention(
				cohortPeriod as 'weekly' | 'monthly',
				dateRange.start,
				dateRange.end,
				adminId
			);
		} catch (error) {
			console.error('Failed to load cohort data:', error);
		} finally {
			loading = false;
		}
	}

	function handlePeriodChange() {
		loadCohortData();
	}

	function formatNumber(num: number): string {
		return new Intl.NumberFormat().format(num);
	}

	function getRetentionColor(rate: number): string {
		if (rate >= 80) return '#10b981'; // green
		if (rate >= 60) return '#f59e0b'; // yellow
		if (rate >= 40) return '#f97316'; // orange
		return '#ef4444'; // red
	}

	function getRetentionClass(rate: number): string {
		if (rate >= 80) return 'excellent';
		if (rate >= 60) return 'good';
		if (rate >= 40) return 'average';
		return 'poor';
	}
</script>

<div class="cohort-analysis">
	<div class="section-header">
		<h2>Cohort Retention Analysis</h2>
		<div class="controls">
			<select bind:value={cohortPeriod} on:change={handlePeriodChange}>
				{#each periodOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
			<button on:click={() => dispatch('refresh')}> Refresh Data </button>
		</div>
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading cohort data...</p>
		</div>
	{:else if data}
		<div class="cohort-overview">
			<div class="overview-metrics">
				<div class="metric-card">
					<h3>Total Cohorts</h3>
					<div class="metric-value">{data.cohorts.length}</div>
				</div>
				<div class="metric-card">
					<h3>Avg Week 1 Retention</h3>
					<div class="metric-value">{data.averageRetention.week_1}%</div>
				</div>
				<div class="metric-card">
					<h3>Avg Week 8 Retention</h3>
					<div class="metric-value">{data.averageRetention.week_8}%</div>
				</div>
			</div>
		</div>

		<div class="cohort-table-container">
			<h3>Cohort Retention Table</h3>
			<div class="table-wrapper">
				<table class="cohort-table">
					<thead>
						<tr>
							<th class="cohort-header">Cohort</th>
							<th class="size-header">Size</th>
							<th class="retention-header">Week 1</th>
							<th class="retention-header">Week 2</th>
							<th class="retention-header">Week 4</th>
							<th class="retention-header">Week 8</th>
							<th class="retention-header">Week 12</th>
							<th class="retention-header">Week 24</th>
						</tr>
					</thead>
					<tbody>
						{#each data.cohorts as cohort}
							<tr>
								<td class="cohort-name">{cohort.cohort}</td>
								<td class="cohort-size">{formatNumber(cohort.size)}</td>
								<td class="retention-cell {getRetentionClass(cohort.retention.week_1 || 0)}">
									{cohort.retention.week_1 || 0}%
								</td>
								<td class="retention-cell {getRetentionClass(cohort.retention.week_2 || 0)}">
									{cohort.retention.week_2 || 0}%
								</td>
								<td class="retention-cell {getRetentionClass(cohort.retention.week_4 || 0)}">
									{cohort.retention.week_4 || 0}%
								</td>
								<td class="retention-cell {getRetentionClass(cohort.retention.week_8 || 0)}">
									{cohort.retention.week_8 || 0}%
								</td>
								<td class="retention-cell {getRetentionClass(cohort.retention.week_12 || 0)}">
									{cohort.retention.week_12 || 0}%
								</td>
								<td class="retention-cell {getRetentionClass(cohort.retention.week_24 || 0)}">
									{cohort.retention.week_24 || 0}%
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<div class="retention-insights">
			<h3>Retention Insights</h3>
			<div class="insights-grid">
				<div class="insight-card">
					<h4>Best Performing Cohort</h4>
					{#if data.cohorts.length > 0}
						{@const bestCohort = data.cohorts.reduce((best, current) =>
							(current.retention.week_8 || 0) > (best.retention.week_8 || 0) ? current : best
						)}
						<div class="insight-content">
							<div class="cohort-highlight">
								<span class="cohort-name">{bestCohort.cohort}</span>
								<span class="retention-rate">{bestCohort.retention.week_8 || 0}% retention</span>
							</div>
							<p class="insight-description">
								This cohort shows the highest 8-week retention rate with {formatNumber(
									bestCohort.size
								)} users.
							</p>
						</div>
					{/if}
				</div>

				<div class="insight-card">
					<h4>Retention Trend</h4>
					<div class="insight-content">
						<div class="trend-analysis">
							{#if data.cohorts.length >= 2}
								{@const latestCohort = data.cohorts[0]}
								{@const previousCohort = data.cohorts[1]}
								{@const trendChange =
									(latestCohort.retention.week_4 || 0) - (previousCohort.retention.week_4 || 0)}
								<div class="trend-indicator {trendChange >= 0 ? 'positive' : 'negative'}">
									{trendChange >= 0 ? '↗' : '↘'}
									{Math.abs(trendChange).toFixed(1)}%
								</div>
								<p class="trend-description">
									{trendChange >= 0 ? 'Improving' : 'Declining'} retention compared to previous cohort
								</p>
							{:else}
								<p>Need more cohorts for trend analysis</p>
							{/if}
						</div>
					</div>
				</div>

				<div class="insight-card">
					<h4>Critical Drop-off Period</h4>
					<div class="insight-content">
						{#if data.averageRetention}
							{@const avgWeek1 = data.averageRetention.week_1}
							{@const avgWeek2 = data.averageRetention.week_2}
							{@const avgWeek4 = data.averageRetention.week_4}
							{@const week1to2Drop = avgWeek1 - avgWeek2}
							{@const week2to4Drop = avgWeek2 - avgWeek4}
							<div class="dropoff-analysis">
								<div class="dropoff-period">
									<span class="period">Week 1-2:</span>
									<span class="dropoff-rate">{week1to2Drop.toFixed(1)}% drop</span>
								</div>
								<div class="dropoff-period">
									<span class="period">Week 2-4:</span>
									<span class="dropoff-rate">{week2to4Drop.toFixed(1)}% drop</span>
								</div>
							</div>
							<p class="insight-description">
								{week1to2Drop > week2to4Drop ? 'Early engagement' : 'Mid-term retention'} is the critical
								focus area.
							</p>
						{/if}
					</div>
				</div>

				<div class="insight-card">
					<h4>Cohort Size Impact</h4>
					<div class="insight-content">
						{#if data.cohorts.length > 0}
							{@const largestCohort = data.cohorts.reduce((largest, current) =>
								current.size > largest.size ? current : largest
							)}
							{@const smallestCohort = data.cohorts.reduce((smallest, current) =>
								current.size < smallest.size ? current : smallest
							)}
							<div class="size-comparison">
								<div class="size-item">
									<span class="label">Largest:</span>
									<span class="value">{formatNumber(largestCohort.size)} users</span>
									<span class="retention">({largestCohort.retention.week_8 || 0}% retention)</span>
								</div>
								<div class="size-item">
									<span class="label">Smallest:</span>
									<span class="value">{formatNumber(smallestCohort.size)} users</span>
									<span class="retention">({smallestCohort.retention.week_8 || 0}% retention)</span>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<div class="retention-recommendations">
			<h3>Retention Improvement Recommendations</h3>
			<div class="recommendations-list">
				<div class="recommendation-card">
					<h4>🎯 Focus on Week 1 Engagement</h4>
					<p>Week 1 retention is critical for long-term success. Consider implementing:</p>
					<ul>
						<li>Personalized onboarding sequences</li>
						<li>Early value demonstration</li>
						<li>Proactive user support</li>
					</ul>
				</div>

				<div class="recommendation-card">
					<h4>📊 Monitor Cohort Performance</h4>
					<p>Track cohort performance to identify successful acquisition channels:</p>
					<ul>
						<li>Segment cohorts by acquisition source</li>
						<li>Compare retention across user types</li>
						<li>Identify seasonal patterns</li>
					</ul>
				</div>

				<div class="recommendation-card">
					<h4>🔄 Implement Retention Campaigns</h4>
					<p>Target users at critical drop-off points:</p>
					<ul>
						<li>Re-engagement emails at week 2</li>
						<li>Feature education at week 4</li>
						<li>Loyalty programs for long-term users</li>
					</ul>
				</div>
			</div>
		</div>
	{:else}
		<div class="no-data">
			<p>No cohort data available for the selected date range.</p>
		</div>
	{/if}
</div>

<style>
	.cohort-analysis {
		padding: 20px;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.section-header h2 {
		font-size: 24px;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.controls {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.controls select {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
	}

	.controls button {
		padding: 8px 16px;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		cursor: pointer;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		color: #6b7280;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid #e5e7eb;
		border-top: 2px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 12px;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.cohort-overview {
		margin-bottom: 32px;
	}

	.overview-metrics {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 20px;
	}

	.metric-card {
		background: white;
		padding: 20px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.metric-card h3 {
		font-size: 14px;
		font-weight: 500;
		color: #6b7280;
		margin: 0 0 8px 0;
	}

	.metric-value {
		font-size: 28px;
		font-weight: 700;
		color: #111827;
	}

	.cohort-table-container {
		background: white;
		padding: 24px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 32px;
	}

	.cohort-table-container h3 {
		font-size: 18px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 20px 0;
	}

	.table-wrapper {
		overflow-x: auto;
	}

	.cohort-table {
		width: 100%;
		border-collapse: collapse;
		min-width: 800px;
	}

	.cohort-table th {
		background-color: #f9fafb;
		padding: 12px;
		text-align: left;
		font-weight: 600;
		color: #374151;
		border-bottom: 2px solid #e5e7eb;
	}

	.cohort-table td {
		padding: 12px;
		border-bottom: 1px solid #e5e7eb;
	}

	.cohort-name {
		font-weight: 600;
		color: #111827;
	}

	.cohort-size {
		font-weight: 500;
		color: #374151;
	}

	.retention-cell {
		text-align: center;
		font-weight: 600;
		border-radius: 4px;
		margin: 2px;
	}

	.retention-cell.excellent {
		background-color: #d1fae5;
		color: #065f46;
	}

	.retention-cell.good {
		background-color: #fef3c7;
		color: #92400e;
	}

	.retention-cell.average {
		background-color: #fed7aa;
		color: #9a3412;
	}

	.retention-cell.poor {
		background-color: #fecaca;
		color: #991b1b;
	}

	.retention-insights {
		background: white;
		padding: 24px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 32px;
	}

	.retention-insights h3 {
		font-size: 18px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 20px 0;
	}

	.insights-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
	}

	.insight-card {
		background: #f9fafb;
		padding: 20px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.insight-card h4 {
		font-size: 16px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 12px 0;
	}

	.insight-content {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.cohort-highlight {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: white;
		padding: 12px;
		border-radius: 6px;
		border: 1px solid #d1d5db;
	}

	.cohort-highlight .cohort-name {
		font-weight: 600;
		color: #111827;
	}

	.cohort-highlight .retention-rate {
		font-weight: 600;
		color: #10b981;
	}

	.insight-description {
		font-size: 14px;
		color: #6b7280;
		margin: 0;
	}

	.trend-indicator {
		font-size: 24px;
		font-weight: 700;
		text-align: center;
		padding: 8px;
		border-radius: 6px;
	}

	.trend-indicator.positive {
		background-color: #d1fae5;
		color: #065f46;
	}

	.trend-indicator.negative {
		background-color: #fecaca;
		color: #991b1b;
	}

	.trend-description {
		font-size: 14px;
		color: #6b7280;
		text-align: center;
		margin: 0;
	}

	.dropoff-analysis {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.dropoff-period {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: white;
		padding: 8px 12px;
		border-radius: 4px;
		border: 1px solid #d1d5db;
	}

	.dropoff-period .period {
		font-weight: 500;
		color: #374151;
	}

	.dropoff-period .dropoff-rate {
		font-weight: 600;
		color: #ef4444;
	}

	.size-comparison {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.size-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: white;
		padding: 8px 12px;
		border-radius: 4px;
		border: 1px solid #d1d5db;
	}

	.size-item .label {
		font-weight: 500;
		color: #6b7280;
	}

	.size-item .value {
		font-weight: 600;
		color: #111827;
	}

	.size-item .retention {
		font-size: 12px;
		color: #6b7280;
	}

	.retention-recommendations {
		background: white;
		padding: 24px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.retention-recommendations h3 {
		font-size: 18px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 20px 0;
	}

	.recommendations-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 20px;
	}

	.recommendation-card {
		background: #f0f9ff;
		padding: 20px;
		border-radius: 8px;
		border: 1px solid #bae6fd;
	}

	.recommendation-card h4 {
		font-size: 16px;
		font-weight: 600;
		color: #0c4a6e;
		margin: 0 0 12px 0;
	}

	.recommendation-card p {
		font-size: 14px;
		color: #374151;
		margin: 0 0 12px 0;
	}

	.recommendation-card ul {
		margin: 0;
		padding-left: 20px;
	}

	.recommendation-card li {
		font-size: 14px;
		color: #6b7280;
		margin-bottom: 4px;
	}

	.no-data {
		text-align: center;
		padding: 60px 20px;
		color: #6b7280;
	}
</style>
