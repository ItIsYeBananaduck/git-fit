<!--
AI Training Dashboard Component
Comprehensive monitoring of training sessions, model performance, and progress visualization
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { toast } from '$lib/components/ui/toast';
	import type { TrainingSession, AIModel, TrainingDataSummary } from '$lib/types/aiTraining';

	export let userId: string;

	// State management
	const dashboardState = writable({
		isLoading: true,
		error: null,
		trainingSessions: [],
		aiModels: [],
		dataSummary: null,
		weeklyPipelineStatus: null
	});

	// Filters and display options
	let selectedTimeRange = '30d';
	let selectedModelType = 'all';
	let selectedStatus = 'all';
	let refreshInterval: number | null = null;

	// Chart data
	let trainingProgressChart: any = null;
	let modelPerformanceChart: any = null;
	let dataCollectionChart: any = null;

	onMount(() => {
		loadDashboardData();
		setupAutoRefresh();
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	async function loadDashboardData() {
		try {
			$dashboardState.isLoading = true;
			$dashboardState.error = null;

			// Load training sessions
			const sessionsResponse = await fetch(
				`/api/ai-training/sessions?userId=${userId}&timeRange=${selectedTimeRange}&status=${selectedStatus}`,
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem('auth_token')}`
					}
				}
			);

			if (!sessionsResponse.ok) {
				throw new Error('Failed to load training sessions');
			}

			const sessions = await sessionsResponse.json();

			// Load AI models
			const modelsResponse = await fetch(
				`/api/ai-training/models?userId=${userId}&modelType=${selectedModelType}`,
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem('auth_token')}`
					}
				}
			);

			if (!modelsResponse.ok) {
				throw new Error('Failed to load AI models');
			}

			const models = await modelsResponse.json();

			// Load data summary
			const summaryResponse = await fetch(
				`/api/ai-training/data-summary?userId=${userId}&timeRange=${selectedTimeRange}`,
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem('auth_token')}`
					}
				}
			);

			if (!summaryResponse.ok) {
				throw new Error('Failed to load data summary');
			}

			const dataSummary = await summaryResponse.json();

			// Load weekly pipeline status
			const pipelineResponse = await fetch('/api/ai-training/pipeline-status', {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('auth_token')}`
				}
			});

			const weeklyPipelineStatus = pipelineResponse.ok ? await pipelineResponse.json() : null;

			dashboardState.update((state) => ({
				...state,
				isLoading: false,
				trainingSessions: sessions,
				aiModels: models,
				dataSummary,
				weeklyPipelineStatus
			}));

			// Update charts
			updateCharts();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			dashboardState.update((state) => ({
				...state,
				isLoading: false,
				error: errorMessage
			}));
			toast.error(`Failed to load dashboard: ${errorMessage}`);
		}
	}

	function setupAutoRefresh() {
		// Refresh every 30 seconds
		refreshInterval = setInterval(() => {
			loadDashboardData();
		}, 30000);
	}

	function updateCharts() {
		// This would integrate with a charting library like Chart.js or D3
		// For now, we'll create simplified data structures

		const sessions = $dashboardState.trainingSessions;
		const models = $dashboardState.aiModels;

		// Training progress over time
		trainingProgressChart = {
			labels: getLast30Days(),
			datasets: [
				{
					label: 'Training Sessions',
					data: generateSessionsOverTime(sessions),
					borderColor: '#3b82f6',
					backgroundColor: 'rgba(59, 130, 246, 0.1)',
					tension: 0.4
				}
			]
		};

		// Model performance metrics
		modelPerformanceChart = {
			labels: models.map((m) => m.modelName),
			datasets: [
				{
					label: 'Accuracy',
					data: models.map((m) => m.performance?.accuracy || 0),
					backgroundColor: 'rgba(34, 197, 94, 0.8)'
				},
				{
					label: 'Training Time (hours)',
					data: models.map((m) => (m.trainingTime || 0) / 3600000),
					backgroundColor: 'rgba(251, 191, 36, 0.8)'
				}
			]
		};

		// Data collection trends
		dataCollectionChart = {
			labels: ['Workout Feedback', 'User Preferences', 'Goal Adjustments', 'Voice Interactions'],
			datasets: [
				{
					label: 'Data Points',
					data: [
						$dashboardState.dataSummary?.workoutFeedback || 0,
						$dashboardState.dataSummary?.userPreferences || 0,
						$dashboardState.dataSummary?.goalAdjustments || 0,
						$dashboardState.dataSummary?.voiceInteractions || 0
					],
					backgroundColor: [
						'rgba(59, 130, 246, 0.8)',
						'rgba(34, 197, 94, 0.8)',
						'rgba(251, 191, 36, 0.8)',
						'rgba(168, 85, 247, 0.8)'
					]
				}
			]
		};
	}

	function getLast30Days(): string[] {
		const days = [];
		for (let i = 29; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			days.push(date.toISOString().split('T')[0]);
		}
		return days;
	}

	function generateSessionsOverTime(sessions: any[]): number[] {
		const days = getLast30Days();
		return days.map((day) => {
			return sessions.filter(
				(session) => session.createdAt?.startsWith(day) || session.startTime?.startsWith(day)
			).length;
		});
	}

	async function startTrainingSession() {
		try {
			const response = await fetch('/api/ai-training/sessions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('auth_token')}`
				},
				body: JSON.stringify({
					userId,
					modelType: 'coaching',
					dataTypes: ['workout_feedback', 'user_preferences', 'goal_adjustments'],
					scheduledFor: Date.now()
				})
			});

			if (!response.ok) {
				throw new Error('Failed to start training session');
			}

			const session = await response.json();
			toast.success('Training session started successfully');
			loadDashboardData(); // Refresh data
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			toast.error(`Failed to start training: ${errorMessage}`);
		}
	}

	async function downloadModel(modelId: string) {
		try {
			const response = await fetch(`/api/ai-training/models/${modelId}/download`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('auth_token')}`
				}
			});

			if (!response.ok) {
				throw new Error('Failed to download model');
			}

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `ai-model-${modelId}.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toast.success('Model downloaded successfully');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			toast.error(`Failed to download model: ${errorMessage}`);
		}
	}

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'completed':
				return 'status-completed';
			case 'training':
			case 'running':
				return 'status-training';
			case 'failed':
				return 'status-failed';
			case 'pending':
				return 'status-pending';
			default:
				return 'status-unknown';
		}
	}

	function formatDuration(ms: number): string {
		const hours = Math.floor(ms / 3600000);
		const minutes = Math.floor((ms % 3600000) / 60000);
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	}

	function formatDate(timestamp: number | string): string {
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Reactive declarations
	$: filteredSessions =
		$dashboardState.trainingSessions?.filter((session) => {
			if (selectedStatus !== 'all' && session.status !== selectedStatus) return false;
			return true;
		}) || [];

	$: filteredModels =
		$dashboardState.aiModels?.filter((model) => {
			if (selectedModelType !== 'all' && model.modelType !== selectedModelType) return false;
			return true;
		}) || [];
</script>

<div class="ai-training-dashboard">
	<!-- Dashboard Header -->
	<div class="dashboard-header">
		<div class="header-content">
			<h2>AI Training Dashboard</h2>
			<div class="header-actions">
				<button class="action-button primary" on:click={startTrainingSession}>
					<svg viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
						/>
					</svg>
					Start Training
				</button>
				<button class="action-button secondary" on:click={loadDashboardData}>
					<svg viewBox="0 0 24 24" fill="currentColor">
						<path d="M4 12a8 8 0 0 1 7.5-7.98v2.02A6 6 0 1 0 18 12h2A8 8 0 0 1 4 12z" />
					</svg>
					Refresh
				</button>
			</div>
		</div>

		<!-- Filters -->
		<div class="filters-container">
			<div class="filter-group">
				<label for="time-range">Time Range:</label>
				<select
					id="time-range"
					bind:value={selectedTimeRange}
					on:change={loadDashboardData}
					class="filter-select"
				>
					<option value="7d">Last 7 days</option>
					<option value="30d">Last 30 days</option>
					<option value="90d">Last 90 days</option>
					<option value="1y">Last year</option>
				</select>
			</div>

			<div class="filter-group">
				<label for="model-type">Model Type:</label>
				<select
					id="model-type"
					bind:value={selectedModelType}
					on:change={loadDashboardData}
					class="filter-select"
				>
					<option value="all">All Types</option>
					<option value="coaching">Coaching</option>
					<option value="nutrition">Nutrition</option>
					<option value="recovery">Recovery</option>
				</select>
			</div>

			<div class="filter-group">
				<label for="status">Status:</label>
				<select
					id="status"
					bind:value={selectedStatus}
					on:change={loadDashboardData}
					class="filter-select"
				>
					<option value="all">All Status</option>
					<option value="pending">Pending</option>
					<option value="training">Training</option>
					<option value="completed">Completed</option>
					<option value="failed">Failed</option>
				</select>
			</div>
		</div>
	</div>

	{#if $dashboardState.isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<p>Loading dashboard data...</p>
		</div>
	{:else if $dashboardState.error}
		<div class="error-container">
			<svg viewBox="0 0 24 24" fill="currentColor" class="error-icon">
				<circle cx="12" cy="12" r="10" />
				<line x1="15" y1="9" x2="9" y2="15" />
				<line x1="9" y1="9" x2="15" y2="15" />
			</svg>
			<p>{$dashboardState.error}</p>
			<button class="retry-button" on:click={loadDashboardData}>Try Again</button>
		</div>
	{:else}
		<!-- Dashboard Content -->
		<div class="dashboard-content">
			<!-- Summary Cards -->
			<div class="summary-cards">
				<div class="summary-card">
					<div class="card-icon training">
						<svg viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
							/>
						</svg>
					</div>
					<div class="card-content">
						<h3>Active Sessions</h3>
						<p class="card-value">
							{filteredSessions.filter((s) => s.status === 'training' || s.status === 'pending')
								.length}
						</p>
						<p class="card-subtitle">Currently training</p>
					</div>
				</div>

				<div class="summary-card">
					<div class="card-icon models">
						<svg viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M13 9h5.5L13 3.5V9zM6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm9 16v-2H6v2h9zm3-4v-2H6v2h12z"
							/>
						</svg>
					</div>
					<div class="card-content">
						<h3>Trained Models</h3>
						<p class="card-value">
							{filteredModels.filter((m) => m.status === 'deployed').length}
						</p>
						<p class="card-subtitle">Ready for use</p>
					</div>
				</div>

				<div class="summary-card">
					<div class="card-icon data">
						<svg viewBox="0 0 24 24" fill="currentColor">
							<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
						</svg>
					</div>
					<div class="card-content">
						<h3>Data Points</h3>
						<p class="card-value">
							{$dashboardState.dataSummary?.totalDataPoints || 0}
						</p>
						<p class="card-subtitle">Collected this period</p>
					</div>
				</div>

				<div class="summary-card">
					<div class="card-icon performance">
						<svg viewBox="0 0 24 24" fill="currentColor">
							<path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
						</svg>
					</div>
					<div class="card-content">
						<h3>Avg Accuracy</h3>
						<p class="card-value">
							{filteredModels.length > 0
								? (
										filteredModels.reduce((sum, m) => sum + (m.performance?.accuracy || 0), 0) /
										filteredModels.length
									).toFixed(1)
								: 0}%
						</p>
						<p class="card-subtitle">Model performance</p>
					</div>
				</div>
			</div>

			<!-- Charts Section -->
			<div class="charts-section">
				<div class="chart-container">
					<h3>Training Progress</h3>
					<div class="chart-placeholder">
						<svg viewBox="0 0 400 200" class="chart-svg">
							<!-- Simple line chart representation -->
							{#if trainingProgressChart}
								<polyline
									points={trainingProgressChart.datasets[0].data
										.map(
											(value, index) =>
												`${(index / (trainingProgressChart.datasets[0].data.length - 1)) * 380 + 10},${190 - value * 15}`
										)
										.join(' ')}
									fill="none"
									stroke="#3b82f6"
									stroke-width="2"
								/>
								{#each trainingProgressChart.datasets[0].data as value, index}
									<circle
										cx={(index / (trainingProgressChart.datasets[0].data.length - 1)) * 380 + 10}
										cy={190 - value * 15}
										r="3"
										fill="#3b82f6"
									/>
								{/each}
							{/if}
						</svg>
					</div>
				</div>

				<div class="chart-container">
					<h3>Data Collection</h3>
					<div class="chart-placeholder">
						<div class="pie-chart">
							{#if dataCollectionChart}
								{#each dataCollectionChart.labels as label, index}
									<div
										class="pie-segment"
										style="color: {dataCollectionChart.datasets[0].backgroundColor[index]}"
									>
										<div class="segment-label">{label}</div>
										<div class="segment-value">{dataCollectionChart.datasets[0].data[index]}</div>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Training Sessions Table -->
			<div class="table-section">
				<h3>Recent Training Sessions</h3>
				<div class="table-container">
					<table class="data-table">
						<thead>
							<tr>
								<th>Session ID</th>
								<th>Model Type</th>
								<th>Status</th>
								<th>Started</th>
								<th>Duration</th>
								<th>Data Points</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredSessions.slice(0, 10) as session}
								<tr>
									<td>
										<span class="session-id"
											>{session.sessionId?.slice(-8) || session._id?.slice(-8)}</span
										>
									</td>
									<td>
										<span class="model-type">{session.modelType}</span>
									</td>
									<td>
										<span class="status-badge {getStatusBadgeClass(session.status)}">
											{session.status}
										</span>
									</td>
									<td>{formatDate(session.createdAt || session.startTime || Date.now())}</td>
									<td>
										{session.duration
											? formatDuration(session.duration)
											: session.status === 'training'
												? 'Running...'
												: '-'}
									</td>
									<td>{session.totalDataPoints || 0}</td>
									<td>
										<div class="action-buttons">
											{#if session.status === 'completed' && session.modelId}
												<button
													class="table-action-button"
													on:click={() => downloadModel(session.modelId)}
													title="Download model"
												>
													<svg viewBox="0 0 24 24" fill="currentColor">
														<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
													</svg>
												</button>
											{/if}
											<button class="table-action-button" title="View details">
												<svg viewBox="0 0 24 24" fill="currentColor">
													<path
														d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
													/>
												</svg>
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>

					{#if filteredSessions.length === 0}
						<div class="empty-state">
							<svg viewBox="0 0 24 24" fill="currentColor" class="empty-icon">
								<path
									d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
								/>
							</svg>
							<h4>No Training Sessions</h4>
							<p>Start your first training session to see it here.</p>
							<button class="start-training-button" on:click={startTrainingSession}>
								Start Training
							</button>
						</div>
					{/if}
				</div>
			</div>

			<!-- Weekly Pipeline Status -->
			{#if $dashboardState.weeklyPipelineStatus}
				<div class="pipeline-section">
					<h3>Weekly Training Pipeline</h3>
					<div class="pipeline-status">
						<div class="pipeline-info">
							<div class="pipeline-stat">
								<span class="stat-label">Last Run:</span>
								<span class="stat-value">
									{formatDate($dashboardState.weeklyPipelineStatus.lastRun)}
								</span>
							</div>
							<div class="pipeline-stat">
								<span class="stat-label">Users Processed:</span>
								<span class="stat-value">
									{$dashboardState.weeklyPipelineStatus.usersProcessed || 0}
								</span>
							</div>
							<div class="pipeline-stat">
								<span class="stat-label">Success Rate:</span>
								<span class="stat-value">
									{$dashboardState.weeklyPipelineStatus.successRate || 0}%
								</span>
							</div>
							<div class="pipeline-stat">
								<span class="stat-label">Next Run:</span>
								<span class="stat-value">
									{formatDate($dashboardState.weeklyPipelineStatus.nextRun)}
								</span>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.ai-training-dashboard {
		padding: 24px;
		background: #f8fafc;
		min-height: 100vh;
	}

	.dashboard-header {
		background: white;
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.header-content h2 {
		margin: 0;
		font-size: 28px;
		font-weight: 700;
		color: #1f2937;
	}

	.header-actions {
		display: flex;
		gap: 12px;
	}

	.action-button {
		padding: 10px 16px;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		font-weight: 500;
	}

	.action-button.primary {
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
		color: white;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
	}

	.action-button.primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.action-button.secondary {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.action-button.secondary:hover {
		background: #e5e7eb;
	}

	.action-button svg {
		width: 16px;
		height: 16px;
	}

	.filters-container {
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.filter-group label {
		font-size: 14px;
		font-weight: 500;
		color: #374151;
	}

	.filter-select {
		padding: 6px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: white;
		font-size: 14px;
		cursor: pointer;
	}

	.filter-select:focus {
		outline: none;
		border-color: #3b82f6;
	}

	.loading-container,
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		background: white;
		border-radius: 12px;
		color: #6b7280;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 16px;
	}

	.error-icon {
		width: 48px;
		height: 48px;
		color: #ef4444;
		margin-bottom: 16px;
	}

	.retry-button {
		padding: 8px 16px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		margin-top: 12px;
	}

	.dashboard-content {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.summary-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 20px;
	}

	.summary-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.card-icon {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-icon svg {
		width: 24px;
		height: 24px;
		color: white;
	}

	.card-icon.training {
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
	}

	.card-icon.models {
		background: linear-gradient(135deg, #059669, #047857);
	}

	.card-icon.data {
		background: linear-gradient(135deg, #7c3aed, #5b21b6);
	}

	.card-icon.performance {
		background: linear-gradient(135deg, #dc2626, #b91c1c);
	}

	.card-content h3 {
		margin: 0 0 4px 0;
		font-size: 14px;
		font-weight: 500;
		color: #6b7280;
	}

	.card-value {
		margin: 0 0 4px 0;
		font-size: 32px;
		font-weight: 700;
		color: #1f2937;
	}

	.card-subtitle {
		margin: 0;
		font-size: 12px;
		color: #9ca3af;
	}

	.charts-section {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 24px;
	}

	.chart-container {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.chart-container h3 {
		margin: 0 0 20px 0;
		font-size: 18px;
		font-weight: 600;
		color: #1f2937;
	}

	.chart-placeholder {
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f9fafb;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.chart-svg {
		width: 100%;
		height: 100%;
	}

	.pie-chart {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
		padding: 20px;
	}

	.pie-segment {
		text-align: center;
		padding: 12px;
		border-radius: 8px;
		background: currentColor;
		color: white;
		opacity: 0.9;
	}

	.segment-label {
		font-size: 12px;
		font-weight: 500;
		margin-bottom: 4px;
	}

	.segment-value {
		font-size: 18px;
		font-weight: 700;
	}

	.table-section {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.table-section h3 {
		margin: 0 0 20px 0;
		font-size: 18px;
		font-weight: 600;
		color: #1f2937;
	}

	.table-container {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
	}

	.data-table th {
		text-align: left;
		padding: 12px;
		background: #f9fafb;
		color: #374151;
		font-weight: 500;
		border-bottom: 1px solid #e5e7eb;
	}

	.data-table td {
		padding: 12px;
		border-bottom: 1px solid #f3f4f6;
	}

	.session-id {
		font-family: 'Courier New', monospace;
		font-size: 12px;
		background: #f3f4f6;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.model-type {
		text-transform: capitalize;
		font-weight: 500;
	}

	.status-badge {
		padding: 4px 8px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 500;
		text-transform: capitalize;
	}

	.status-completed {
		background: #d1fae5;
		color: #065f46;
	}

	.status-training {
		background: #dbeafe;
		color: #1e40af;
	}

	.status-failed {
		background: #fee2e2;
		color: #991b1b;
	}

	.status-pending {
		background: #fef3c7;
		color: #92400e;
	}

	.status-unknown {
		background: #f3f4f6;
		color: #6b7280;
	}

	.action-buttons {
		display: flex;
		gap: 4px;
	}

	.table-action-button {
		width: 28px;
		height: 28px;
		border: none;
		background: #f3f4f6;
		color: #6b7280;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.table-action-button:hover {
		background: #e5e7eb;
		color: #374151;
	}

	.table-action-button svg {
		width: 14px;
		height: 14px;
	}

	.empty-state {
		text-align: center;
		padding: 60px 20px;
		color: #6b7280;
	}

	.empty-icon {
		width: 48px;
		height: 48px;
		margin: 0 auto 16px;
		opacity: 0.5;
	}

	.empty-state h4 {
		margin: 0 0 8px 0;
		font-size: 18px;
		color: #374151;
	}

	.empty-state p {
		margin: 0 0 20px 0;
	}

	.start-training-button {
		padding: 10px 20px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
	}

	.pipeline-section {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.pipeline-section h3 {
		margin: 0 0 20px 0;
		font-size: 18px;
		font-weight: 600;
		color: #1f2937;
	}

	.pipeline-info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 20px;
	}

	.pipeline-stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.stat-label {
		font-size: 14px;
		color: #6b7280;
		font-weight: 500;
	}

	.stat-value {
		font-size: 18px;
		color: #1f2937;
		font-weight: 600;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.ai-training-dashboard {
			padding: 16px;
		}

		.header-content {
			flex-direction: column;
			align-items: stretch;
			gap: 16px;
		}

		.filters-container {
			flex-direction: column;
			gap: 12px;
		}

		.summary-cards {
			grid-template-columns: 1fr;
		}

		.charts-section {
			grid-template-columns: 1fr;
		}

		.data-table {
			font-size: 12px;
		}

		.data-table th,
		.data-table td {
			padding: 8px;
		}
	}
</style>
