<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { advancedAnalyticsService } from '$lib/services/advancedAnalyticsService';
	import type { UserBehaviorAnalytics } from '$lib/types/admin';

	export let data: UserBehaviorAnalytics | null;
	export let dateRange: { start: string; end: string };
	export let adminId: string;

	const dispatch = createEventDispatcher();

	let selectedSegment = 'role';
	let segmentationData: any = null;
	let loading = false;

	const segmentOptions = [
		{ value: 'role', label: 'User Role' },
		{ value: 'fitnessLevel', label: 'Fitness Level' },
		{ value: 'age', label: 'Age Group' },
		{ value: 'location', label: 'Location' }
	];

	async function loadSegmentationData() {
		loading = true;
		try {
			segmentationData = await advancedAnalyticsService.getUserSegmentation(
				'behavioral',
				{ segmentBy: selectedSegment },
				adminId
			);
		} catch (error) {
			console.error('Failed to load segmentation data:', error);
		} finally {
			loading = false;
		}
	}

	function handleSegmentChange() {
		loadSegmentationData();
	}

	function formatNumber(num: number): string {
		return new Intl.NumberFormat().format(num);
	}

	function formatDuration(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	}
</script>

<div class="user-behavior-analytics">
	<div class="section-header">
		<h2>User Behavior Analytics</h2>
		<div class="controls">
			<select bind:value={selectedSegment} on:change={handleSegmentChange}>
				{#each segmentOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
			<button on:click={() => dispatch('refresh')}> Refresh Data </button>
		</div>
	</div>

	{#if data}
		<div class="metrics-grid">
			<div class="metric-card">
				<h3>Total Users</h3>
				<div class="metric-value">{formatNumber(data.totalUsers)}</div>
			</div>
			<div class="metric-card">
				<h3>Total Sessions</h3>
				<div class="metric-value">{formatNumber(data.totalSessions)}</div>
			</div>
			<div class="metric-card">
				<h3>Avg Sessions/User</h3>
				<div class="metric-value">{data.averageSessionsPerUser.toFixed(1)}</div>
			</div>
		</div>

		<div class="analytics-sections">
			<!-- User Segments -->
			<div class="analytics-section">
				<h3>User Segments</h3>
				<div class="segments-grid">
					{#each Object.entries(data.segments) as [segmentName, segmentData]}
						<div class="segment-card">
							<h4>{segmentName}</h4>
							<div class="segment-metrics">
								<div class="segment-metric">
									<span class="label">Users:</span>
									<span class="value">{formatNumber(segmentData.userCount)}</span>
								</div>
								<div class="segment-metric">
									<span class="label">Sessions:</span>
									<span class="value">{formatNumber(segmentData.sessions)}</span>
								</div>
								<div class="segment-metric">
									<span class="label">Avg Duration:</span>
									<span class="value">{formatDuration(segmentData.avgSessionDuration)}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Cohort Analysis -->
			<div class="analytics-section">
				<h3>Cohort Retention</h3>
				<div class="cohort-table">
					<table>
						<thead>
							<tr>
								<th>Cohort</th>
								<th>Size</th>
								<th>Week 1</th>
								<th>Week 2</th>
								<th>Week 4</th>
								<th>Week 8</th>
							</tr>
						</thead>
						<tbody>
							{#each Object.entries(data.cohorts) as [cohortName, cohortData]}
								<tr>
									<td>{cohortName}</td>
									<td>{formatNumber(cohortData.size)}</td>
									<td>{cohortData.retention.week_1 || 0}%</td>
									<td>{cohortData.retention.week_2 || 0}%</td>
									<td>{cohortData.retention.week_4 || 0}%</td>
									<td>{cohortData.retention.week_8 || 0}%</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Behavior Patterns -->
			<div class="analytics-section">
				<h3>Behavior Patterns</h3>
				<div class="patterns-grid">
					<div class="pattern-card">
						<h4>Most Active Hours</h4>
						<div class="pattern-list">
							{#each data.behaviorPatterns.mostActiveHours as hour}
								<div class="pattern-item">
									<span class="time">{hour.hour}:00</span>
									<span class="count">{formatNumber(hour.sessions)} sessions</span>
								</div>
							{/each}
						</div>
					</div>

					<div class="pattern-card">
						<h4>Common Workout Types</h4>
						<div class="pattern-list">
							{#each data.behaviorPatterns.commonWorkoutTypes as workout}
								<div class="pattern-item">
									<span class="type">{workout.type}</span>
									<span class="count">{formatNumber(workout.count)} users</span>
								</div>
							{/each}
						</div>
					</div>

					<div class="pattern-card">
						<h4>Common Drop-off Points</h4>
						<div class="pattern-list">
							{#each data.behaviorPatterns.dropoffPoints as dropoff}
								<div class="pattern-item">
									<span class="point">{dropoff.point}</span>
									<span class="rate">{dropoff.rate}% drop-off</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Advanced Segmentation -->
		{#if segmentationData && !loading}
			<div class="analytics-section">
				<h3>Advanced User Segmentation</h3>
				<div class="segmentation-results">
					{#each segmentationData.segments as segment}
						<div class="advanced-segment-card">
							<h4>{segment.name}</h4>
							<div class="segment-size">Size: {formatNumber(segment.size)} users</div>
							<div class="segment-characteristics">
								<h5>Characteristics:</h5>
								<ul>
									{#each segment.characteristics as characteristic}
										<li>{characteristic}</li>
									{/each}
								</ul>
							</div>
							<div class="segment-metrics-advanced">
								<div class="metric">
									<span class="label">Avg Revenue:</span>
									<span class="value">${segment.metrics.averageRevenue}</span>
								</div>
								<div class="metric">
									<span class="label">Retention Rate:</span>
									<span class="value">{segment.metrics.retentionRate}%</span>
								</div>
								<div class="metric">
									<span class="label">Engagement Score:</span>
									<span class="value">{segment.metrics.engagementScore}/10</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<div class="no-data">
			<p>No user behavior data available for the selected date range.</p>
		</div>
	{/if}
</div>

<style>
	.user-behavior-analytics {
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

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 20px;
		margin-bottom: 32px;
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

	.analytics-sections {
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	.analytics-section {
		background: white;
		padding: 24px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.analytics-section h3 {
		font-size: 18px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 20px 0;
	}

	.segments-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 16px;
	}

	.segment-card {
		background: #f9fafb;
		padding: 16px;
		border-radius: 6px;
		border: 1px solid #e5e7eb;
	}

	.segment-card h4 {
		font-size: 16px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 12px 0;
	}

	.segment-metrics {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.segment-metric {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.segment-metric .label {
		font-size: 14px;
		color: #6b7280;
	}

	.segment-metric .value {
		font-size: 14px;
		font-weight: 600;
		color: #111827;
	}

	.cohort-table {
		overflow-x: auto;
	}

	.cohort-table table {
		width: 100%;
		border-collapse: collapse;
	}

	.cohort-table th,
	.cohort-table td {
		padding: 12px;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	.cohort-table th {
		background-color: #f9fafb;
		font-weight: 600;
		color: #374151;
	}

	.patterns-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
	}

	.pattern-card {
		background: #f9fafb;
		padding: 20px;
		border-radius: 6px;
		border: 1px solid #e5e7eb;
	}

	.pattern-card h4 {
		font-size: 16px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 16px 0;
	}

	.pattern-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.pattern-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid #e5e7eb;
	}

	.pattern-item:last-child {
		border-bottom: none;
	}

	.segmentation-results {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 20px;
	}

	.advanced-segment-card {
		background: #f9fafb;
		padding: 20px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.advanced-segment-card h4 {
		font-size: 18px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 8px 0;
	}

	.segment-size {
		font-size: 14px;
		color: #6b7280;
		margin-bottom: 16px;
	}

	.segment-characteristics h5 {
		font-size: 14px;
		font-weight: 600;
		color: #374151;
		margin: 0 0 8px 0;
	}

	.segment-characteristics ul {
		margin: 0 0 16px 0;
		padding-left: 20px;
	}

	.segment-characteristics li {
		font-size: 14px;
		color: #6b7280;
		margin-bottom: 4px;
	}

	.segment-metrics-advanced {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.segment-metrics-advanced .metric {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.segment-metrics-advanced .label {
		font-size: 14px;
		color: #6b7280;
	}

	.segment-metrics-advanced .value {
		font-size: 14px;
		font-weight: 600;
		color: #111827;
	}

	.no-data {
		text-align: center;
		padding: 60px 20px;
		color: #6b7280;
	}
</style>
