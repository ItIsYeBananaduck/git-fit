<script lang="ts">
	import { advancedAnalyticsService } from '$lib/services/advancedAnalyticsService';
	import type { CustomReport } from '$lib/types/admin';

	export let adminId: string;
	export let dateRange: { start: string; end: string };

	let reportConfig = {
		name: '',
		type: 'users' as 'users' | 'revenue' | 'engagement' | 'custom',
		dateRange: { ...dateRange },
		metrics: [] as string[],
		filters: {},
		groupBy: '',
		format: 'json' as 'json' | 'csv' | 'pdf'
	};

	let availableMetrics: Record<string, string[]> = {
		users: [
			'total_users',
			'active_users',
			'new_users',
			'user_growth_rate',
			'churn_rate',
			'retention_rate',
			'session_count',
			'average_session_duration'
		],
		revenue: [
			'total_revenue',
			'recurring_revenue',
			'average_revenue_per_user',
			'revenue_growth_rate',
			'subscription_revenue',
			'transaction_revenue',
			'refunds',
			'chargebacks'
		],
		engagement: [
			'daily_active_users',
			'weekly_active_users',
			'monthly_active_users',
			'feature_adoption_rate',
			'bounce_rate',
			'pages_per_session',
			'conversion_rate',
			'engagement_score'
		],
		custom: ['custom_metric_1', 'custom_metric_2', 'custom_metric_3']
	};

	let groupByOptions = [
		{ value: '', label: 'No Grouping' },
		{ value: 'date', label: 'By Date' },
		{ value: 'user_role', label: 'By User Role' },
		{ value: 'subscription_tier', label: 'By Subscription Tier' },
		{ value: 'acquisition_channel', label: 'By Acquisition Channel' },
		{ value: 'location', label: 'By Location' },
		{ value: 'device_type', label: 'By Device Type' }
	];

	let generatedReports: CustomReport[] = [];
	let loading = false;
	let error: string | null = null;

	// Load existing reports on component mount
	import { onMount } from 'svelte';

	onMount(async () => {
		await loadReportHistory();
	});

	async function loadReportHistory() {
		try {
			generatedReports = await advancedAnalyticsService.getReportHistory({ adminId }, adminId, 20);
		} catch (err) {
			console.error('Failed to load report history:', err);
		}
	}

	function handleTypeChange() {
		// Reset metrics when type changes
		reportConfig.metrics = [];
	}

	function toggleMetric(metric: string) {
		if (reportConfig.metrics.includes(metric)) {
			reportConfig.metrics = reportConfig.metrics.filter((m) => m !== metric);
		} else {
			reportConfig.metrics = [...reportConfig.metrics, metric];
		}
	}

	async function generateReport() {
		if (!reportConfig.name.trim()) {
			error = 'Report name is required';
			return;
		}

		if (reportConfig.metrics.length === 0) {
			error = 'At least one metric must be selected';
			return;
		}

		loading = true;
		error = null;

		try {
			const report = await advancedAnalyticsService.generateCustomReport(reportConfig, adminId);

			generatedReports = [report, ...generatedReports];

			// Reset form
			reportConfig = {
				name: '',
				type: 'users',
				dateRange: { ...dateRange },
				metrics: [],
				filters: {},
				groupBy: '',
				format: 'json'
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to generate report';
		} finally {
			loading = false;
		}
	}

	function downloadReport(report: CustomReport) {
		// Create download link
		const link = document.createElement('a');
		link.href = report.downloadUrl;
		link.download = `${report.name}.${report.format}`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString();
	}

	function getReportTypeIcon(type: string): string {
		switch (type) {
			case 'users':
				return '👥';
			case 'revenue':
				return '💰';
			case 'engagement':
				return '📊';
			case 'custom':
				return '🔧';
			default:
				return '📋';
		}
	}

	function getFormatIcon(format: string): string {
		switch (format) {
			case 'json':
				return '📄';
			case 'csv':
				return '📊';
			case 'pdf':
				return '📕';
			default:
				return '📄';
		}
	}
</script>

<div class="custom-report-builder">
	<div class="builder-section">
		<h2>Custom Report Builder</h2>

		<div class="report-form">
			<div class="form-group">
				<label for="report-name">Report Name</label>
				<input
					id="report-name"
					type="text"
					bind:value={reportConfig.name}
					placeholder="Enter report name..."
					class="form-input"
				/>
			</div>

			<div class="form-group">
				<label for="report-type">Report Type</label>
				<select
					id="report-type"
					bind:value={reportConfig.type}
					on:change={handleTypeChange}
					class="form-select"
				>
					<option value="users">User Analytics</option>
					<option value="revenue">Revenue Analytics</option>
					<option value="engagement">Engagement Analytics</option>
					<option value="custom">Custom Metrics</option>
				</select>
			</div>

			<div class="form-group">
				<label>Date Range</label>
				<div class="date-range-inputs">
					<input type="date" bind:value={reportConfig.dateRange.start} class="form-input" />
					<span>to</span>
					<input type="date" bind:value={reportConfig.dateRange.end} class="form-input" />
				</div>
			</div>

			<div class="form-group">
				<label>Metrics to Include</label>
				<div class="metrics-grid">
					{#each availableMetrics[reportConfig.type] as metric}
						<label class="metric-checkbox">
							<input
								type="checkbox"
								checked={reportConfig.metrics.includes(metric)}
								on:change={() => toggleMetric(metric)}
							/>
							<span class="metric-label">
								{metric.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
							</span>
						</label>
					{/each}
				</div>
			</div>

			<div class="form-group">
				<label for="group-by">Group By</label>
				<select id="group-by" bind:value={reportConfig.groupBy} class="form-select">
					{#each groupByOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label for="format">Export Format</label>
				<select id="format" bind:value={reportConfig.format} class="form-select">
					<option value="json">JSON</option>
					<option value="csv">CSV</option>
					<option value="pdf">PDF</option>
				</select>
			</div>

			{#if error}
				<div class="error-message">
					{error}
				</div>
			{/if}

			<button class="generate-button" on:click={generateReport} disabled={loading}>
				{#if loading}
					<span class="spinner"></span>
					Generating Report...
				{:else}
					Generate Report
				{/if}
			</button>
		</div>
	</div>

	<div class="reports-history">
		<h3>Generated Reports</h3>

		{#if generatedReports.length === 0}
			<div class="no-reports">
				<p>No reports generated yet. Create your first custom report above.</p>
			</div>
		{:else}
			<div class="reports-list">
				{#each generatedReports as report}
					<div class="report-card">
						<div class="report-header">
							<div class="report-info">
								<span class="report-icon">{getReportTypeIcon(report.type)}</span>
								<div class="report-details">
									<h4 class="report-name">{report.name}</h4>
									<p class="report-meta">
										{report.type} • Generated {formatDate(report.generatedAt)}
									</p>
								</div>
							</div>
							<div class="report-actions">
								<span class="format-icon">{getFormatIcon(report.format)}</span>
								<button class="download-button" on:click={() => downloadReport(report)}>
									Download
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.custom-report-builder {
		padding: 20px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 32px;
		max-width: 1400px;
	}

	.builder-section {
		background: white;
		padding: 24px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		height: fit-content;
	}

	.builder-section h2 {
		font-size: 20px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 24px 0;
	}

	.report-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.form-group label {
		font-size: 14px;
		font-weight: 500;
		color: #374151;
	}

	.form-input,
	.form-select {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		background: white;
	}

	.form-input:focus,
	.form-select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.date-range-inputs {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.date-range-inputs span {
		font-size: 14px;
		color: #6b7280;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 8px;
		max-height: 200px;
		overflow-y: auto;
		padding: 12px;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		background: #f9fafb;
	}

	.metric-checkbox {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	.metric-checkbox:hover {
		background-color: #f3f4f6;
	}

	.metric-checkbox input[type='checkbox'] {
		margin: 0;
	}

	.metric-label {
		font-size: 14px;
		color: #374151;
	}

	.error-message {
		padding: 12px;
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 6px;
		color: #dc2626;
		font-size: 14px;
	}

	.generate-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px 24px;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.generate-button:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.generate-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.reports-history {
		background: white;
		padding: 24px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		height: fit-content;
	}

	.reports-history h3 {
		font-size: 18px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 20px 0;
	}

	.no-reports {
		text-align: center;
		padding: 40px 20px;
		color: #6b7280;
	}

	.reports-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		max-height: 600px;
		overflow-y: auto;
	}

	.report-card {
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 16px;
		background: #f9fafb;
		transition: background-color 0.2s;
	}

	.report-card:hover {
		background: #f3f4f6;
	}

	.report-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.report-info {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.report-icon {
		font-size: 20px;
	}

	.report-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.report-name {
		font-size: 16px;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.report-meta {
		font-size: 12px;
		color: #6b7280;
		margin: 0;
	}

	.report-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.format-icon {
		font-size: 16px;
	}

	.download-button {
		padding: 6px 12px;
		background-color: #10b981;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.download-button:hover {
		background-color: #059669;
	}

	@media (max-width: 1024px) {
		.custom-report-builder {
			grid-template-columns: 1fr;
		}
	}
</style>
