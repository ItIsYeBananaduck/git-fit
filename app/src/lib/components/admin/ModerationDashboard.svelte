<script lang="ts">
	import { onMount } from 'svelte';
	import { contentModerationService } from '../../services/contentModerationService';
	import ModerationQueue from './ModerationQueue.svelte';
	import ContentPolicyManager from './ContentPolicyManager.svelte';
	import AutomatedContentFilter from './AutomatedContentFilter.svelte';
	import UserReportInvestigation from './UserReportInvestigation.svelte';
	import ContentAnalyticsDashboard from './ContentAnalyticsDashboard.svelte';
	import type { ContentAnalytics } from '../../types/admin';
	import type { Id } from '../../../convex/_generated/dataModel';

	// Props
	export let adminId: Id<'adminUsers'>;

	// State
	let activeTab = 'queue';
	let analytics: ContentAnalytics | null = null;
	let loading = false;
	let error = '';

	// Quick stats
	let quickStats = {
		pendingItems: 0,
		reviewedToday: 0,
		escalatedItems: 0,
		autoFlagged: 0
	};

	onMount(() => {
		loadDashboardData();
		// Refresh data every 30 seconds
		const interval = setInterval(loadDashboardData, 30000);
		return () => clearInterval(interval);
	});

	async function loadDashboardData() {
		try {
			loading = true;
			error = '';

			// Load analytics for the last 24 hours
			const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			analytics = await contentModerationService.getContentAnalytics(
				{ start: yesterday, end: now },
				adminId
			);

			// Update quick stats
			if (analytics) {
				quickStats = {
					pendingItems: analytics.pendingReview,
					reviewedToday: analytics.approvedToday + analytics.rejectedToday,
					escalatedItems: analytics.escalatedItems,
					autoFlagged: analytics.flaggedByAI
				};
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load dashboard data';
		} finally {
			loading = false;
		}
	}

	function setActiveTab(tab: string) {
		activeTab = tab;
	}

	function getTabClass(tab: string): string {
		const baseClass = 'px-4 py-2 text-sm font-medium rounded-md transition-colors';
		if (activeTab === tab) {
			return `${baseClass} bg-blue-600 text-white`;
		}
		return `${baseClass} text-gray-600 hover:text-gray-900 hover:bg-gray-100`;
	}

	function getStatColor(value: number, type: string): string {
		switch (type) {
			case 'pending':
				if (value > 50) return 'text-red-600';
				if (value > 20) return 'text-orange-600';
				return 'text-green-600';
			case 'escalated':
				if (value > 10) return 'text-red-600';
				if (value > 5) return 'text-orange-600';
				return 'text-green-600';
			default:
				return 'text-gray-900';
		}
	}
</script>

<div class="h-full flex flex-col bg-gray-50">
	<!-- Header -->
	<div class="bg-white border-b border-gray-200 px-6 py-4">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-gray-900">Content Moderation</h1>
				<p class="text-gray-600 mt-1">Manage content review, policies, and automated filtering</p>
			</div>

			<div class="flex items-center space-x-4">
				{#if loading}
					<div class="flex items-center text-gray-500">
						<svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
								fill="none"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Loading...
					</div>
				{/if}

				<button
					on:click={loadDashboardData}
					class="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
				>
					Refresh
				</button>
			</div>
		</div>

		<!-- Quick Stats -->
		<div class="grid grid-cols-4 gap-4 mt-6">
			<div class="bg-gray-50 p-4 rounded-lg">
				<div class="text-2xl font-semibold {getStatColor(quickStats.pendingItems, 'pending')}">
					{quickStats.pendingItems}
				</div>
				<div class="text-sm text-gray-600">Pending Review</div>
			</div>
			<div class="bg-gray-50 p-4 rounded-lg">
				<div class="text-2xl font-semibold text-gray-900">{quickStats.reviewedToday}</div>
				<div class="text-sm text-gray-600">Reviewed Today</div>
			</div>
			<div class="bg-gray-50 p-4 rounded-lg">
				<div class="text-2xl font-semibold {getStatColor(quickStats.escalatedItems, 'escalated')}">
					{quickStats.escalatedItems}
				</div>
				<div class="text-sm text-gray-600">Escalated Items</div>
			</div>
			<div class="bg-gray-50 p-4 rounded-lg">
				<div class="text-2xl font-semibold text-blue-600">{quickStats.autoFlagged}</div>
				<div class="text-sm text-gray-600">AI Flagged</div>
			</div>
		</div>

		<!-- Error Message -->
		{#if error}
			<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
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
	</div>

	<!-- Navigation Tabs -->
	<div class="bg-white border-b border-gray-200 px-6">
		<nav class="flex space-x-1">
			<button on:click={() => setActiveTab('queue')} class={getTabClass('queue')}>
				<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
					></path>
				</svg>
				Moderation Queue
			</button>
			<button on:click={() => setActiveTab('policies')} class={getTabClass('policies')}>
				<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					></path>
				</svg>
				Content Policies
			</button>
			<button on:click={() => setActiveTab('automation')} class={getTabClass('automation')}>
				<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					></path>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					></path>
				</svg>
				Automated Filtering
			</button>
			<button on:click={() => setActiveTab('reports')} class={getTabClass('reports')}>
				<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
					></path>
				</svg>
				User Reports
			</button>
			<button on:click={() => setActiveTab('analytics')} class={getTabClass('analytics')}>
				<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					></path>
				</svg>
				Analytics
			</button>
		</nav>
	</div>

	<!-- Tab Content -->
	<div class="flex-1 overflow-hidden">
		{#if activeTab === 'queue'}
			<ModerationQueue {adminId} />
		{:else if activeTab === 'policies'}
			<ContentPolicyManager {adminId} />
		{:else if activeTab === 'automation'}
			<AutomatedContentFilter {adminId} />
		{:else if activeTab === 'reports'}
			<UserReportInvestigation {adminId} />
		{:else if activeTab === 'analytics'}
			<ContentAnalyticsDashboard {adminId} />
		{/if}
	</div>
</div>
