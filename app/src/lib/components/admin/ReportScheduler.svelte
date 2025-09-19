<script lang="ts">
	import { onMount } from 'svelte';
	import { advancedAnalyticsService } from '$lib/services/advancedAnalyticsService.js';
	import type { ReportSchedule } from '$lib/types/admin.js';

	export let adminId: string;

	let schedules: ReportSchedule[] = [];
	let loading = false;
	let error: string | null = null;
	let showCreateForm = false;

	let newSchedule = {
		reportConfig: {
			name: '',
			type: 'users' as 'users' | 'revenue' | 'engagement' | 'custom',
			dateRange: 'last_30_days',
			metrics: [] as string[],
			format: 'pdf' as 'json' | 'csv' | 'pdf'
		},
		schedule: {
			frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
			time: '09:00',
			dayOfWeek: 1,
			dayOfMonth: 1
		},
		recipients: [] as string[]
	};

	let recipientEmail = '';

	const availableMetrics: Record<string, string[]> = {
		users: [
			'total_users',
			'active_users',
			'new_users',
			'user_growth_rate',
			'churn_rate',
			'retention_rate'
		],
		revenue: [
			'total_revenue',
			'recurring_revenue',
			'average_revenue_per_user',
			'revenue_growth_rate'
		],
		engagement: [
			'daily_active_users',
			'weekly_active_users',
			'feature_adoption_rate',
			'conversion_rate'
		],
		custom: ['custom_metric_1', 'custom_metric_2']
	};

	const dayOfWeekOptions = [
		{ value: 1, label: 'Monday' },
		{ value: 2, label: 'Tuesday' },
		{ value: 3, label: 'Wednesday' },
		{ value: 4, label: 'Thursday' },
		{ value: 5, label: 'Friday' },
		{ value: 6, label: 'Saturday' },
		{ value: 0, label: 'Sunday' }
	];

	onMount(() => {
		loadSchedules();
	});

	async function loadSchedules() {
		loading = true;
		try {
			// This would be implemented in the service
			schedules = [
				{
					scheduleId: '1',
					reportConfig: {
						name: 'Weekly User Report',
						type: 'users',
						dateRange: 'last_7_days',
						metrics: ['total_users', 'active_users', 'new_users'],
						format: 'pdf'
					},
					schedule: {
						frequency: 'weekly',
						time: '09:00',
						dayOfWeek: 1
					},
					recipients: ['admin@example.com', 'manager@example.com'],
					status: 'active',
					nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
					createdAt: new Date().toISOString(),
					createdBy: adminId
				}
			];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load schedules';
		} finally {
			loading = false;
		}
	}

	function toggleMetric(metric: string) {
		if (newSchedule.reportConfig.metrics.includes(metric)) {
			newSchedule.reportConfig.metrics = newSchedule.reportConfig.metrics.filter(
				(m) => m !== metric
			);
		} else {
			newSchedule.reportConfig.metrics = [...newSchedule.reportConfig.metrics, metric];
		}
	}

	function addRecipient() {
		if (recipientEmail.trim() && !newSchedule.recipients.includes(recipientEmail.trim())) {
			newSchedule.recipients = [...newSchedule.recipients, recipientEmail.trim()];
			recipientEmail = '';
		}
	}

	function removeRecipient(email: string) {
		newSchedule.recipients = newSchedule.recipients.filter((r) => r !== email);
	}

	async function createSchedule() {
		if (!newSchedule.reportConfig.name.trim()) {
			error = 'Report name is required';
			return;
		}

		if (newSchedule.reportConfig.metrics.length === 0) {
			error = 'At least one metric must be selected';
			return;
		}

		if (newSchedule.recipients.length === 0) {
			error = 'At least one recipient is required';
			return;
		}

		loading = true;
		error = null;

		try {
			const schedule = await advancedAnalyticsService.scheduleReport(
				newSchedule.reportConfig,
				newSchedule.schedule,
				newSchedule.recipients,
				adminId
			);

			schedules = [schedule, ...schedules];

			// Reset form
			newSchedule = {
				reportConfig: {
					name: '',
					type: 'users',
					dateRange: 'last_30_days',
					metrics: [],
					format: 'pdf'
				},
				schedule: {
					frequency: 'weekly',
					time: '09:00',
					dayOfWeek: 1,
					dayOfMonth: 1
				},
				recipients: []
			};

			showCreateForm = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create schedule';
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString();
	}

	function formatTime(timeString: string): string {
		return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getFrequencyLabel(frequency: string): string {
		switch (frequency) {
			case 'daily':
				return 'Daily';
			case 'weekly':
				return 'Weekly';
			case 'monthly':
				return 'Monthly';
			default:
				return frequency;
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'active':
				return '#10b981';
			case 'paused':
				return '#f59e0b';
			case 'cancelled':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	}

	function getDayOfWeekLabel(dayOfWeek: number): string {
		const option = dayOfWeekOptions.find((opt) => opt.value === dayOfWeek);
		return option ? option.label : 'Unknown';
	}
</script>

<div class="report-scheduler">
	<div class="scheduler-header">
		<h2>Automated Report Scheduler</h2>
		<button class="create-button" on:click={() => (showCreateForm = !showCreateForm)}>
			{showCreateForm ? 'Cancel' : 'Schedule New Report'}
		</button>
	</div>

	{#if showCreateForm}
		<div class="create-form">
			<h3>Schedule New Report</h3>

			<div class="form-grid">
				<div class="form-group">
					<label for="report-name">Report Name</label>
					<input
						id="report-name"
						type="text"
						bind:value={newSchedule.reportConfig.name}
						placeholder="Enter report name..."
						class="form-input"
					/>
				</div>

				<div class="form-group">
					<label for="report-type">Report Type</label>
					<select id="report-type" bind:value={newSchedule.reportConfig.type} class="form-select">
						<option value="users">User Analytics</option>
						<option value="revenue">Revenue Analytics</option>
						<option value="engagement">Engagement Analytics</option>
						<option value="custom">Custom Metrics</option>
					</select>
				</div>

				<div class="form-group">
					<label for="date-range">Date Range</label>
					<select
						id="date-range"
						bind:value={newSchedule.reportConfig.dateRange}
						class="form-select"
					>
						<option value="last_7_days">Last 7 Days</option>
						<option value="last_30_days">Last 30 Days</option>
						<option value="last_90_days">Last 90 Days</option>
						<option value="month_to_date">Month to Date</option>
						<option value="quarter_to_date">Quarter to Date</option>
					</select>
				</div>

				<div class="form-group">
					<label for="format">Export Format</label>
					<select id="format" bind:value={newSchedule.reportConfig.format} class="form-select">
						<option value="pdf">PDF</option>
						<option value="csv">CSV</option>
						<option value="json">JSON</option>
					</select>
				</div>

				<div class="form-group">
					<label for="frequency">Frequency</label>
					<select id="frequency" bind:value={newSchedule.schedule.frequency} class="form-select">
						<option value="daily">Daily</option>
						<option value="weekly">Weekly</option>
						<option value="monthly">Monthly</option>
					</select>
				</div>

				<div class="form-group">
					<label for="time">Time</label>
					<input id="time" type="time" bind:value={newSchedule.schedule.time} class="form-input" />
				</div>

				{#if newSchedule.schedule.frequency === 'weekly'}
					<div class="form-group">
						<label for="day-of-week">Day of Week</label>
						<select
							id="day-of-week"
							bind:value={newSchedule.schedule.dayOfWeek}
							class="form-select"
						>
							{#each dayOfWeekOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
				{/if}

				{#if newSchedule.schedule.frequency === 'monthly'}
					<div class="form-group">
						<label for="day-of-month">Day of Month</label>
						<input
							id="day-of-month"
							type="number"
							min="1"
							max="28"
							bind:value={newSchedule.schedule.dayOfMonth}
							class="form-input"
						/>
					</div>
				{/if}
			</div>

			<div class="form-group">
				<h4 class="form-group-title">Metrics to Include</h4>
				<div class="metrics-grid">
					{#each availableMetrics[newSchedule.reportConfig.type] as metric}
						<label class="metric-checkbox">
							<input
								type="checkbox"
								checked={newSchedule.reportConfig.metrics.includes(metric)}
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
				<label for="recipientEmail">Recipients</label>
				<div class="recipients-section">
					<div class="add-recipient">
						<input
							id="recipientEmail"
							type="email"
							bind:value={recipientEmail}
							placeholder="Enter email address..."
							class="form-input"
							on:keydown={(e) => e.key === 'Enter' && addRecipient()}
						/>
						<button type="button" on:click={addRecipient} class="add-button"> Add </button>
					</div>

					{#if newSchedule.recipients.length > 0}
						<div class="recipients-list">
							{#each newSchedule.recipients as recipient}
								<div class="recipient-tag">
									<span>{recipient}</span>
									<button
										type="button"
										on:click={() => removeRecipient(recipient)}
										class="remove-button"
									>
										×
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			{#if error}
				<div class="error-message">
					{error}
				</div>
			{/if}

			<div class="form-actions">
				<button type="button" on:click={() => (showCreateForm = false)} class="cancel-button">
					Cancel
				</button>
				<button type="button" on:click={createSchedule} disabled={loading} class="submit-button">
					{loading ? 'Creating...' : 'Create Schedule'}
				</button>
			</div>
		</div>
	{/if}

	<div class="schedules-list">
		<h3>Scheduled Reports</h3>

		{#if loading && schedules.length === 0}
			<div class="loading-state">
				<div class="spinner"></div>
				<p>Loading schedules...</p>
			</div>
		{:else if schedules.length === 0}
			<div class="no-schedules">
				<p>No scheduled reports yet. Create your first automated report above.</p>
			</div>
		{:else}
			<div class="schedules-grid">
				{#each schedules as schedule}
					<div class="schedule-card">
						<div class="schedule-header">
							<h4 class="schedule-name">{schedule.reportConfig.name}</h4>
							<div
								class="schedule-status"
								style="background-color: {getStatusColor(schedule.status)}"
							>
								{schedule.status}
							</div>
						</div>

						<div class="schedule-details">
							<div class="detail-row">
								<span class="label">Type:</span>
								<span class="value">{schedule.reportConfig.type}</span>
							</div>
							<div class="detail-row">
								<span class="label">Frequency:</span>
								<span class="value">
									{getFrequencyLabel(schedule.schedule.frequency)}
									{#if schedule.schedule.frequency === 'weekly'}
										on {getDayOfWeekLabel(schedule.schedule.dayOfWeek || 1)}
									{:else if schedule.schedule.frequency === 'monthly'}
										on day {schedule.schedule.dayOfMonth || 1}
									{/if}
								</span>
							</div>
							<div class="detail-row">
								<span class="label">Time:</span>
								<span class="value">{formatTime(schedule.schedule.time)}</span>
							</div>
							<div class="detail-row">
								<span class="label">Format:</span>
								<span class="value">{schedule.reportConfig.format.toUpperCase()}</span>
							</div>
							<div class="detail-row">
								<span class="label">Recipients:</span>
								<span class="value">{schedule.recipients.length} recipient(s)</span>
							</div>
							<div class="detail-row">
								<span class="label">Next Run:</span>
								<span class="value">{formatDate(schedule.nextRun)}</span>
							</div>
						</div>

						<div class="schedule-actions">
							<button class="action-button edit">Edit</button>
							<button class="action-button pause">
								{schedule.status === 'active' ? 'Pause' : 'Resume'}
							</button>
							<button class="action-button delete">Delete</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.report-scheduler {
		padding: 20px;
	}

	.scheduler-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.scheduler-header h2 {
		font-size: 24px;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.create-button {
		padding: 10px 20px;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.create-button:hover {
		background-color: #2563eb;
	}

	.create-form {
		background: white;
		padding: 24px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 32px;
	}

	.create-form h3 {
		font-size: 18px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 20px 0;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 16px;
		margin-bottom: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-group-title {
		font-size: 14px;
		font-weight: 500;
		color: #374151;
		margin: 0 0 6px 0;
	}

	.form-input,
	.form-select {
		padding: 8px 12px;
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

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 8px;
		padding: 12px;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		background: #f9fafb;
		max-height: 150px;
		overflow-y: auto;
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

	.metric-label {
		font-size: 14px;
		color: #374151;
	}

	.recipients-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.add-recipient {
		display: flex;
		gap: 8px;
	}

	.add-recipient .form-input {
		flex: 1;
	}

	.add-button {
		padding: 8px 16px;
		background-color: #10b981;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		cursor: pointer;
	}

	.recipients-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.recipient-tag {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 8px;
		background-color: #e0e7ff;
		color: #3730a3;
		border-radius: 4px;
		font-size: 14px;
	}

	.remove-button {
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		font-size: 16px;
		line-height: 1;
	}

	.error-message {
		padding: 12px;
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 6px;
		color: #dc2626;
		font-size: 14px;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 20px;
	}

	.cancel-button {
		padding: 8px 16px;
		background-color: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		cursor: pointer;
	}

	.submit-button {
		padding: 8px 16px;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		cursor: pointer;
	}

	.submit-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.schedules-list {
		background: white;
		padding: 24px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.schedules-list h3 {
		font-size: 18px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 20px 0;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 20px;
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

	.no-schedules {
		text-align: center;
		padding: 40px 20px;
		color: #6b7280;
	}

	.schedules-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 20px;
	}

	.schedule-card {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 20px;
		background: #f9fafb;
	}

	.schedule-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.schedule-name {
		font-size: 16px;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.schedule-status {
		padding: 4px 8px;
		border-radius: 4px;
		color: white;
		font-size: 12px;
		font-weight: 500;
		text-transform: uppercase;
	}

	.schedule-details {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 16px;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.detail-row .label {
		font-size: 14px;
		color: #6b7280;
	}

	.detail-row .value {
		font-size: 14px;
		font-weight: 500;
		color: #111827;
	}

	.schedule-actions {
		display: flex;
		gap: 8px;
	}

	.action-button {
		padding: 6px 12px;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-button.edit {
		background-color: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.action-button.pause {
		background-color: #f59e0b;
		color: white;
		border-color: #f59e0b;
	}

	.action-button.delete {
		background-color: #ef4444;
		color: white;
		border-color: #ef4444;
	}

	.action-button:hover {
		opacity: 0.8;
	}
</style>
