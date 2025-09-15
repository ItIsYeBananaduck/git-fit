<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { advancedAnalyticsService } from '$lib/services/advancedAnalyticsService';
	import type { ConversionFunnel } from '$lib/types/admin';
	import type { Id } from '../../../../../convex/_generated/dataModel';

	export let data: ConversionFunnel | null;
	export let dateRange: { start: string; end: string };
	export let adminId: Id<'adminUsers'>;

	const dispatch = createEventDispatcher();

	let selectedFunnelType = 'signup';
	let loading = false;

	const funnelTypes = [
		{ value: 'signup', label: 'User Signup Funnel' },
		{ value: 'purchase', label: 'Purchase Funnel' },
		{ value: 'engagement', label: 'Engagement Funnel' }
	];

	async function loadFunnelData() {
		loading = true;
		try {
			data = await advancedAnalyticsService.getConversionFunnelAnalytics(
				selectedFunnelType as 'signup' | 'purchase' | 'engagement',
				dateRange,
				adminId
			);
		} catch (error) {
			console.error('Failed to load funnel data:', error);
		} finally {
			loading = false;
		}
	}

	function handleFunnelTypeChange() {
		loadFunnelData();
	}

	function formatNumber(num: number): string {
		return new Intl.NumberFormat().format(num);
	}

	function formatPercentage(num: number): string {
		return `${num.toFixed(1)}%`;
	}

	function getStepColor(conversionRate: number): string {
		if (conversionRate >= 80) return '#10b981'; // green
		if (conversionRate >= 60) return '#f59e0b'; // yellow
		if (conversionRate >= 40) return '#f97316'; // orange
		return '#ef4444'; // red
	}
</script>

<div class="conversion-funnel-analytics">
	<div class="section-header">
		<h2>Conversion Funnel Analytics</h2>
		<div class="controls">
			<select bind:value={selectedFunnelType} on:change={handleFunnelTypeChange}>
				{#each funnelTypes as funnelType}
					<option value={funnelType.value}>{funnelType.label}</option>
				{/each}
			</select>
			<button on:click={() => dispatch('refresh')}> Refresh Data </button>
		</div>
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading funnel data...</p>
		</div>
	{:else if data}
		<div class="funnel-overview">
			<div class="overview-metrics">
				<div class="metric-card">
					<h3>Total Users</h3>
					<div class="metric-value">{formatNumber(data.totalUsers)}</div>
				</div>
				<div class="metric-card">
					<h3>Overall Conversion</h3>
					<div class="metric-value">{formatPercentage(data.overallConversion)}</div>
				</div>
				<div class="metric-card">
					<h3>Funnel Steps</h3>
					<div class="metric-value">{data.steps.length}</div>
				</div>
			</div>
		</div>

		<div class="funnel-visualization">
			<h3>Funnel Steps</h3>
			<div class="funnel-steps">
				{#each data.steps as step, index}
					<div class="funnel-step">
						<div class="step-header">
							<span class="step-number">{index + 1}</span>
							<span class="step-name">{step.name}</span>
						</div>
						<div class="step-metrics">
							<div class="step-users">
								<span class="users-count">{formatNumber(step.users)}</span>
								<span class="users-label">users</span>
							</div>
							<div
								class="conversion-bar"
								style="background-color: {getStepColor(step.conversionRate)}"
							>
								<span class="conversion-rate">{formatPercentage(step.conversionRate)}</span>
							</div>
						</div>
						{#if index < data.steps.length - 1}
							<div class="step-connector">
								<div class="connector-line"></div>
								<div class="users-lost">
									-{formatNumber(step.users - data.steps[index + 1].users)} users
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<div class="dropoff-analysis">
			<h3>Drop-off Analysis</h3>
			<div class="dropoff-cards">
				{#each data.dropoffAnalysis as dropoff}
					<div class="dropoff-card">
						<div class="dropoff-header">
							<h4>{dropoff.step}</h4>
							<div class="dropoff-rate" style="color: {getStepColor(100 - dropoff.dropoffRate)}">
								{formatPercentage(dropoff.dropoffRate)} drop-off
							</div>
						</div>
						<div class="users-lost">
							<strong>{formatNumber(dropoff.usersLost)}</strong> users lost
						</div>

						<div class="common-reasons">
							<h5>Common Reasons:</h5>
							<ul>
								{#each dropoff.commonReasons as reason}
									<li>{reason}</li>
								{/each}
							</ul>
						</div>

						<div class="recommendations">
							<h5>Recommendations:</h5>
							<ul>
								{#each dropoff.recommendations as recommendation}
									<li>{recommendation}</li>
								{/each}
							</ul>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="funnel-optimization">
			<h3>Optimization Opportunities</h3>
			<div class="optimization-insights">
				<div class="insight-card">
					<h4>Biggest Drop-off Point</h4>
					{#if data.dropoffAnalysis.length > 0}
						{@const biggestDropoff = data.dropoffAnalysis.reduce((max, current) =>
							current.dropoffRate > max.dropoffRate ? current : max
						)}
						<p>
							<strong>{biggestDropoff.step}</strong> has the highest drop-off rate at
							<strong>{formatPercentage(biggestDropoff.dropoffRate)}</strong>
						</p>
						<p class="insight-recommendation">
							Focus optimization efforts here for maximum impact.
						</p>
					{/if}
				</div>

				<div class="insight-card">
					<h4>Conversion Potential</h4>
					{#if data.steps.length >= 2}
						{@const firstStep = data.steps[0]}
						{@const lastStep = data.steps[data.steps.length - 1]}
						{@const potentialUsers = firstStep.users - lastStep.users}
						<p>
							<strong>{formatNumber(potentialUsers)}</strong> users could potentially convert with funnel
							improvements
						</p>
						<p class="insight-recommendation">
							Even a 10% improvement could add {formatNumber(Math.floor(potentialUsers * 0.1))} conversions.
						</p>
					{/if}
				</div>

				<div class="insight-card">
					<h4>Performance Benchmark</h4>
					<p>
						Current overall conversion rate: <strong
							>{formatPercentage(data.overallConversion)}</strong
						>
					</p>
					<p class="insight-recommendation">
						{#if data.overallConversion >= 20}
							Excellent performance! Focus on scaling traffic.
						{:else if data.overallConversion >= 10}
							Good performance with room for optimization.
						{:else if data.overallConversion >= 5}
							Below average - significant optimization needed.
						{:else}
							Critical - immediate funnel optimization required.
						{/if}
					</p>
				</div>
			</div>
		</div>
	{:else}
		<div class="no-data">
			<p>No funnel data available for the selected date range and funnel type.</p>
		</div>
	{/if}
</div>

<style>
	.conversion-funnel-analytics {
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

	.funnel-overview {
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

	.funnel-visualization {
		background: white;
		padding: 24px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 32px;
	}

	.funnel-visualization h3 {
		font-size: 18px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 24px 0;
	}

	.funnel-steps {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.funnel-step {
		position: relative;
	}

	.step-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 8px;
	}

	.step-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background-color: #3b82f6;
		color: white;
		border-radius: 50%;
		font-size: 14px;
		font-weight: 600;
	}

	.step-name {
		font-size: 16px;
		font-weight: 600;
		color: #111827;
	}

	.step-metrics {
		display: flex;
		align-items: center;
		gap: 20px;
		margin-left: 44px;
	}

	.step-users {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 80px;
	}

	.users-count {
		font-size: 20px;
		font-weight: 700;
		color: #111827;
	}

	.users-label {
		font-size: 12px;
		color: #6b7280;
	}

	.conversion-bar {
		flex: 1;
		height: 40px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		min-width: 200px;
	}

	.step-connector {
		display: flex;
		align-items: center;
		margin-left: 60px;
		margin-top: 8px;
		margin-bottom: 8px;
	}

	.connector-line {
		width: 2px;
		height: 20px;
		background-color: #d1d5db;
		margin-right: 12px;
	}

	.users-lost {
		font-size: 14px;
		color: #ef4444;
		font-weight: 500;
	}

	.dropoff-analysis {
		background: white;
		padding: 24px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 32px;
	}

	.dropoff-analysis h3 {
		font-size: 18px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 20px 0;
	}

	.dropoff-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 20px;
	}

	.dropoff-card {
		background: #f9fafb;
		padding: 20px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.dropoff-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.dropoff-header h4 {
		font-size: 16px;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.dropoff-rate {
		font-size: 14px;
		font-weight: 600;
	}

	.dropoff-card .users-lost {
		font-size: 14px;
		color: #6b7280;
		margin-bottom: 16px;
	}

	.common-reasons,
	.recommendations {
		margin-bottom: 16px;
	}

	.common-reasons h5,
	.recommendations h5 {
		font-size: 14px;
		font-weight: 600;
		color: #374151;
		margin: 0 0 8px 0;
	}

	.common-reasons ul,
	.recommendations ul {
		margin: 0;
		padding-left: 20px;
	}

	.common-reasons li,
	.recommendations li {
		font-size: 14px;
		color: #6b7280;
		margin-bottom: 4px;
	}

	.funnel-optimization {
		background: white;
		padding: 24px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.funnel-optimization h3 {
		font-size: 18px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 20px 0;
	}

	.optimization-insights {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
	}

	.insight-card {
		background: #f0f9ff;
		padding: 20px;
		border-radius: 8px;
		border: 1px solid #bae6fd;
	}

	.insight-card h4 {
		font-size: 16px;
		font-weight: 600;
		color: #0c4a6e;
		margin: 0 0 12px 0;
	}

	.insight-card p {
		font-size: 14px;
		color: #374151;
		margin: 0 0 8px 0;
	}

	.insight-recommendation {
		font-style: italic;
		color: #0369a1 !important;
	}

	.no-data {
		text-align: center;
		padding: 60px 20px;
		color: #6b7280;
	}
</style>
