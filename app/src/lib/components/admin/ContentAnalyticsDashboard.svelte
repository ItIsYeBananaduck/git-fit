<script lang="ts">
	import { onMount } from 'svelte';
	import { userReportService } from '../../services/userReportService.js';
	import type { ContentAnalytics } from '../../services/userReportService.js';
	import type { Id } from '../../../../convex/_generated/dataModel.js';

	// Props
	export let adminId: Id<'adminUsers'>;

	// State
	let analytics: ContentAnalytics | null = null;
	let loading = false;
	let error = '';

	// Time range selection
	let timeRange = '7d';
	let customStartDate = '';
	let customEndDate = '';

	// Content type filter
	let selectedContentType:
		| ''
		| 'custom_exercise'
		| 'trainer_message'
		| 'user_report'
		| 'program_content'
		| 'user_profile' = '';

	onMount(() => {
		loadAnalytics();
		// Refresh analytics every 5 minutes
		const interval = setInterval(loadAnalytics, 5 * 60 * 1000);
		return () => clearInterval(interval);
	});

	async function loadAnalytics() {
		try {
			loading = true;
			error = '';

			const { start, end } = getTimeRange();

			analytics = await userReportService.getContentAnalytics(
				{ start, end },
				selectedContentType || undefined,
				adminId
			);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load analytics';
		} finally {
			loading = false;
		}
	}

	function getTimeRange(): { start: string; end: string } {
		const now = new Date();
		const end = now.toISOString();
		let start: string;

		switch (timeRange) {
			case '1d':
				start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
				break;
			case '7d':
				start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
				break;
			case '30d':
				start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
				break;
			case '90d':
				start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
				break;
			case 'custom':
				start = customStartDate
					? new Date(customStartDate).toISOString()
					: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
				break;
			default:
				start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
		}

		return { start, end };
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'pending':
				return 'text-orange-600';
			case 'under_review':
				return 'text-yellow-600';
			case 'approved':
				return 'text-green-600';
			case 'rejected':
				return 'text-red-600';
			case 'escalated':
				return 'text-purple-600';
			default:
				return 'text-gray-600';
		}
	}

	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'urgent':
				return 'text-red-600';
			case 'high':
				return 'text-orange-600';
			case 'medium':
				return 'text-yellow-600';
			case 'low':
				return 'text-green-600';
			default:
				return 'text-gray-600';
		}
	}

	function formatPercentage(value: number): string {
		return `${value.toFixed(1)}%`;
	}

	function formatTime(hours: number): string {
		if (hours < 1) {
			return `${Math.round(hours * 60)}m`;
		} else if (hours < 24) {
			return `${hours.toFixed(1)}h`;
		} else {
			return `${Math.round(hours / 24)}d`;
		}
	}

	function getTopEntries(
		obj: Record<string, number>,
		limit: number = 5
	): Array<{ key: string; value: number }> {
		return Object.entries(obj)
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit)
			.map(([key, value]) => ({ key, value }));
	}
</script>

<div class="p-6 bg-white">
	<div class="mb-6">
		<h1 class="text-2xl font-semibold text-gray-900 mb-2">Content Analytics</h1>
		<p class="text-gray-600">Monitor content moderation metrics and safety trends</p>
	</div>

	<!-- Controls -->
	<div class="mb-6 flex flex-wrap items-center gap-4">
		<div>
			<label for="timeRange" class="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
			<select
				id="timeRange"
				bind:value={timeRange}
				on:change={loadAnalytics}
				class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				<option value="1d">Last 24 Hours</option>
				<option value="7d">Last 7 Days</option>
				<option value="30d">Last 30 Days</option>
				<option value="90d">Last 90 Days</option>
				<option value="custom">Custom Range</option>
			</select>
		</div>

		{#if timeRange === 'custom'}
			<div class="flex items-center gap-2">
				<input
					type="date"
					bind:value={customStartDate}
					class="px-3 py-2 border border-gray-300 rounded-md text-sm"
				/>
				<span class="text-gray-500">to</span>
				<input
					type="date"
					bind:value={customEndDate}
					class="px-3 py-2 border border-gray-300 rounded-md text-sm"
				/>
				<button
					on:click={loadAnalytics}
					class="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
				>
					Apply
				</button>
			</div>
		{/if}

		<div>
			<label for="contentType" class="block text-sm font-medium text-gray-700 mb-1"
				>Content Type</label
			>
			<select
				id="contentType"
				bind:value={selectedContentType}
				on:change={loadAnalytics}
				class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				<option value="">All Types</option>
				<option value="custom_exercise">Custom Exercises</option>
				<option value="trainer_message">Trainer Messages</option>
				<option value="user_report">User Reports</option>
				<option value="program_content">Program Content</option>
				<option value="user_profile">User Profiles</option>
			</select>
		</div>

		<button
			on:click={loadAnalytics}
			disabled={loading}
			class="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 disabled:opacity-50"
		>
			{loading ? 'Loading...' : 'Refresh'}
		</button>
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
			<p class="mt-2 text-gray-600">Loading analytics...</p>
		</div>
	{:else if analytics}
		<!-- Key Metrics -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			<div class="bg-white border border-gray-200 rounded-lg p-6">
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
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								></path>
							</svg>
						</div>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Total Items</p>
						<p class="text-2xl font-semibold text-gray-900">
							{analytics.totalItems.toLocaleString()}
						</p>
					</div>
				</div>
			</div>

			<div class="bg-white border border-gray-200 rounded-lg p-6">
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
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
								></path>
							</svg>
						</div>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Auto Flagged</p>
						<p class="text-2xl font-semibold text-gray-900">
							{analytics.autoFlagged.toLocaleString()}
						</p>
					</div>
				</div>
			</div>

			<div class="bg-white border border-gray-200 rounded-lg p-6">
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
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
						</div>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Avg Resolution Time</p>
						<p class="text-2xl font-semibold text-gray-900">
							{formatTime(analytics.averageResolutionTime)}
						</p>
					</div>
				</div>
			</div>

			<div class="bg-white border border-gray-200 rounded-lg p-6">
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
									d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
								></path>
							</svg>
						</div>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Escalation Rate</p>
						<p class="text-2xl font-semibold text-gray-900">
							{formatPercentage(analytics.escalationRate)}
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Charts and Breakdowns -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
			<!-- Status Breakdown -->
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Status Breakdown</h3>
				<div class="space-y-3">
					{#each Object.entries(analytics.byStatus) as [status, count]}
						<div class="flex items-center justify-between">
							<div class="flex items-center">
								<div
									class="w-3 h-3 rounded-full {getStatusColor(status)} bg-current opacity-20 mr-3"
								></div>
								<span class="text-sm font-medium text-gray-700 capitalize">
									{status.replace('_', ' ')}
								</span>
							</div>
							<div class="flex items-center">
								<span class="text-sm text-gray-900 mr-2">{count.toLocaleString()}</span>
								<span class="text-xs text-gray-500">
									({analytics.totalItems > 0
										? ((count / analytics.totalItems) * 100).toFixed(1)
										: 0}%)
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Priority Breakdown -->
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Priority Breakdown</h3>
				<div class="space-y-3">
					{#each Object.entries(analytics.byPriority) as [priority, count]}
						<div class="flex items-center justify-between">
							<div class="flex items-center">
								<div
									class="w-3 h-3 rounded-full {getPriorityColor(
										priority
									)} bg-current opacity-20 mr-3"
								></div>
								<span class="text-sm font-medium text-gray-700 capitalize">{priority}</span>
							</div>
							<div class="flex items-center">
								<span class="text-sm text-gray-900 mr-2">{count.toLocaleString()}</span>
								<span class="text-xs text-gray-500">
									({analytics.totalItems > 0
										? ((count / analytics.totalItems) * 100).toFixed(1)
										: 0}%)
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Content Type Breakdown -->
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Content Type Breakdown</h3>
				<div class="space-y-3">
					{#each Object.entries(analytics.byType) as [type, count]}
						<div class="flex items-center justify-between">
							<div class="flex items-center">
								<div class="w-3 h-3 rounded-full bg-blue-500 opacity-20 mr-3"></div>
								<span class="text-sm font-medium text-gray-700 capitalize">
									{type.replace('_', ' ')}
								</span>
							</div>
							<div class="flex items-center">
								<span class="text-sm text-gray-900 mr-2">{count.toLocaleString()}</span>
								<span class="text-xs text-gray-500">
									({analytics.totalItems > 0
										? ((count / analytics.totalItems) * 100).toFixed(1)
										: 0}%)
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Top Flags -->
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Top Flags</h3>
				<div class="space-y-3">
					{#each getTopEntries(analytics.topFlags) as { key, value }}
						<div class="flex items-center justify-between">
							<div class="flex items-center">
								<div class="w-3 h-3 rounded-full bg-red-500 opacity-20 mr-3"></div>
								<span class="text-sm font-medium text-gray-700 capitalize">
									{key.replace('_', ' ')}
								</span>
							</div>
							<div class="flex items-center">
								<span class="text-sm text-gray-900 mr-2">{value.toLocaleString()}</span>
								<span class="text-xs text-gray-500">
									({analytics.totalItems > 0
										? ((value / analytics.totalItems) * 100).toFixed(1)
										: 0}%)
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Additional Metrics -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-2">Manual vs Auto Reports</h3>
				<div class="space-y-2">
					<div class="flex justify-between">
						<span class="text-sm text-gray-600">Manual Reports</span>
						<span class="text-sm font-medium text-gray-900"
							>{analytics.manualReports.toLocaleString()}</span
						>
					</div>
					<div class="flex justify-between">
						<span class="text-sm text-gray-600">Auto Flagged</span>
						<span class="text-sm font-medium text-gray-900"
							>{analytics.autoFlagged.toLocaleString()}</span
						>
					</div>
					<div class="pt-2 border-t">
						<div class="flex justify-between">
							<span class="text-sm font-medium text-gray-700">Auto Detection Rate</span>
							<span class="text-sm font-medium text-gray-900">
								{analytics.totalItems > 0
									? formatPercentage((analytics.autoFlagged / analytics.totalItems) * 100)
									: '0%'}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-2">Appeal Rate</h3>
				<div class="text-3xl font-bold text-gray-900 mb-1">
					{formatPercentage(analytics.appealRate)}
				</div>
				<p class="text-sm text-gray-600">
					{analytics.appealRate < 5
						? 'Low appeal rate indicates good moderation quality'
						: analytics.appealRate < 15
							? 'Moderate appeal rate'
							: 'High appeal rate may indicate review quality issues'}
				</p>
			</div>

			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-2">System Health</h3>
				<div class="space-y-2">
					<div class="flex items-center">
						<div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
						<span class="text-sm text-gray-600">Moderation System</span>
					</div>
					<div class="flex items-center">
						<div
							class="w-2 h-2 {analytics.averageResolutionTime < 24
								? 'bg-green-500'
								: analytics.averageResolutionTime < 72
									? 'bg-yellow-500'
									: 'bg-red-500'} rounded-full mr-2"
						></div>
						<span class="text-sm text-gray-600">Response Time</span>
					</div>
					<div class="flex items-center">
						<div
							class="w-2 h-2 {analytics.escalationRate < 10
								? 'bg-green-500'
								: analytics.escalationRate < 20
									? 'bg-yellow-500'
									: 'bg-red-500'} rounded-full mr-2"
						></div>
						<span class="text-sm text-gray-600">Escalation Rate</span>
					</div>
				</div>
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
				></path>
			</svg>
			<h3 class="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
			<p class="mt-1 text-sm text-gray-500">
				Get started by selecting a time range and content type.
			</p>
		</div>
	{/if}
</div>
