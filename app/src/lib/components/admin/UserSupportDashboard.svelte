<script lang="ts">
	import { onMount } from 'svelte';
	import { supportService } from '../../services/supportService';
	import SupportTicketManager from './SupportTicketManager.svelte';
	import CommunicationCenter from './CommunicationCenter.svelte';
	import GDPRComplianceManager from './GDPRComplianceManager.svelte';
	import type { Id } from '../../../../convex/_generated/dataModel';

	// Props
	export let adminId: Id<'adminUsers'>;

	// State
	let activeTab = 'tickets';
	let loading = false;
	let stats = {
		openTickets: 0,
		inProgressTickets: 0,
		resolvedToday: 0,
		averageResponseTime: 0,
		totalAnnouncements: 0,
		messagesSentToday: 0,
		gdprRequestsPending: 0,
		dataExportsCompleted: 0
	};

	onMount(() => {
		loadDashboardStats();
	});

	async function loadDashboardStats() {
		try {
			loading = true;

			// Get communication analytics for today
			const today = new Date();
			const startOfDay = new Date(
				today.getFullYear(),
				today.getMonth(),
				today.getDate()
			).toISOString();
			const endOfDay = new Date(
				today.getFullYear(),
				today.getMonth(),
				today.getDate() + 1
			).toISOString();

			const analytics = await supportService.getCommunicationAnalytics(
				{ start: startOfDay, end: endOfDay },
				adminId
			);

			stats = {
				openTickets: 0, // Would be loaded from support service
				inProgressTickets: 0,
				resolvedToday: analytics.ticketsResolved,
				averageResponseTime: analytics.averageResponseTime,
				totalAnnouncements: analytics.announcementsSent,
				messagesSentToday: analytics.messagesSent,
				gdprRequestsPending: 0, // Would be loaded from privacy service
				dataExportsCompleted: 0
			};
		} catch (error) {
			console.error('Failed to load dashboard stats:', error);
		} finally {
			loading = false;
		}
	}

	function formatTime(hours: number): string {
		if (hours < 1) {
			return `${Math.round(hours * 60)}m`;
		}
		return `${Math.round(hours * 10) / 10}h`;
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div>
					<h1 class="text-2xl font-bold text-gray-900">User Support & Communication</h1>
					<p class="mt-1 text-sm text-gray-600">
						Manage support tickets, communications, and GDPR compliance
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Stats Overview -->
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			<!-- Support Tickets Stats -->
			<div class="bg-white overflow-hidden shadow rounded-lg">
				<div class="p-5">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<svg
								class="h-6 w-6 text-blue-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
								/>
							</svg>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">Open Tickets</dt>
								<dd class="text-lg font-medium text-gray-900">{stats.openTickets}</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>

			<div class="bg-white overflow-hidden shadow rounded-lg">
				<div class="p-5">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<svg
								class="h-6 w-6 text-yellow-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">Avg Response Time</dt>
								<dd class="text-lg font-medium text-gray-900">
									{formatTime(stats.averageResponseTime)}
								</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>

			<!-- Communication Stats -->
			<div class="bg-white overflow-hidden shadow rounded-lg">
				<div class="p-5">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<svg
								class="h-6 w-6 text-green-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
								/>
							</svg>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">Messages Sent Today</dt>
								<dd class="text-lg font-medium text-gray-900">{stats.messagesSentToday}</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>

			<!-- GDPR Stats -->
			<div class="bg-white overflow-hidden shadow rounded-lg">
				<div class="p-5">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<svg
								class="h-6 w-6 text-purple-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
								/>
							</svg>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">GDPR Requests</dt>
								<dd class="text-lg font-medium text-gray-900">{stats.gdprRequestsPending}</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Navigation Tabs -->
		<div class="border-b border-gray-200 mb-6">
			<nav class="-mb-px flex space-x-8">
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'tickets'
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					on:click={() => (activeTab = 'tickets')}
				>
					<svg
						class="w-5 h-5 inline-block mr-2"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
						/>
					</svg>
					Support Tickets
				</button>
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'communication'
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					on:click={() => (activeTab = 'communication')}
				>
					<svg
						class="w-5 h-5 inline-block mr-2"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
						/>
					</svg>
					Communications
				</button>
				<button
					class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'gdpr'
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					on:click={() => (activeTab = 'gdpr')}
				>
					<svg
						class="w-5 h-5 inline-block mr-2"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
						/>
					</svg>
					GDPR & Privacy
				</button>
			</nav>
		</div>

		<!-- Tab Content -->
		<div class="bg-white shadow rounded-lg overflow-hidden">
			{#if activeTab === 'tickets'}
				<SupportTicketManager {adminId} />
			{:else if activeTab === 'communication'}
				<CommunicationCenter {adminId} />
			{:else if activeTab === 'gdpr'}
				<GDPRComplianceManager {adminId} />
			{/if}
		</div>
	</div>
</div>
