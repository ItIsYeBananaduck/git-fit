<script lang="ts">
	import { onMount } from 'svelte';
	import { supportService } from '../../services/supportService';
	import type { Id, UserSearchCriteria } from '../../types/admin';

	// Props
	export let adminId: Id<'adminUsers'>;

	// State
	let activeTab: 'announcements' | 'messages' | 'analytics' = 'announcements';
	let loading = false;
	let error = '';
	let success = '';

	// Announcement form
	let announcementForm = {
		title: '',
		content: '',
		type: 'info' as 'info' | 'warning' | 'maintenance' | 'feature',
		targetAudience: 'all' as 'all' | 'clients' | 'trainers' | 'premium',
		scheduledFor: new Date().toISOString().slice(0, 16),
		expiresAt: ''
	};

	// Message form
	let messageForm = {
		subject: '',
		content: '',
		type: 'email' as 'email' | 'push' | 'in_app',
		targetType: 'specific' as 'specific' | 'criteria',
		userIds: [] as Id<'users'>[],
		userCriteria: {
			role: undefined as 'client' | 'trainer' | undefined,
			dateRange: undefined as { start: string; end: string } | undefined
		} as UserSearchCriteria
	};

	// Analytics data
	let analytics = {
		announcementsSent: 0,
		messagesSent: 0,
		ticketsCreated: 0,
		ticketsResolved: 0,
		averageResponseTime: 0,
		userEngagement: {
			totalRecipients: 0,
			delivered: 0,
			read: 0,
			deliveryRate: 0,
			readRate: 0
		}
	};

	// Analytics timeframe
	let analyticsTimeframe = {
		start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
		end: new Date().toISOString().slice(0, 10)
	};

	onMount(() => {
		loadAnalytics();
	});

	async function sendAnnouncement() {
		if (!announcementForm.title || !announcementForm.content) {
			error = 'Please fill in all required fields';
			return;
		}

		loading = true;
		error = '';
		success = '';

		try {
			const result = await supportService.sendPlatformAnnouncement(
				{
					title: announcementForm.title,
					content: announcementForm.content,
					type: announcementForm.type,
					targetAudience: announcementForm.targetAudience,
					scheduledFor: announcementForm.scheduledFor,
					expiresAt: announcementForm.expiresAt || undefined
				},
				adminId
			);

			success = `Announcement sent to ${result.recipientCount} users`;
			resetAnnouncementForm();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to send announcement';
		} finally {
			loading = false;
		}
	}

	async function sendMessage() {
		if (!messageForm.subject || !messageForm.content) {
			error = 'Please fill in all required fields';
			return;
		}

		if (messageForm.targetType === 'specific' && messageForm.userIds.length === 0) {
			error = 'Please specify target users';
			return;
		}

		loading = true;
		error = '';
		success = '';

		try {
			const result = await supportService.sendTargetedMessage(
				{
					subject: messageForm.subject,
					content: messageForm.content,
					type: messageForm.type,
					userIds: messageForm.targetType === 'specific' ? messageForm.userIds : undefined,
					userCriteria: messageForm.targetType === 'criteria' ? messageForm.userCriteria : undefined
				},
				adminId
			);

			success = `Message sent to ${result.recipientCount} users`;
			resetMessageForm();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to send message';
		} finally {
			loading = false;
		}
	}

	async function loadAnalytics() {
		loading = true;
		error = '';

		try {
			analytics = await supportService.getCommunicationAnalytics(analyticsTimeframe, adminId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load analytics';
		} finally {
			loading = false;
		}
	}

	function resetAnnouncementForm() {
		announcementForm = {
			title: '',
			content: '',
			type: 'info',
			targetAudience: 'all',
			scheduledFor: new Date().toISOString().slice(0, 16),
			expiresAt: ''
		};
	}

	function resetMessageForm() {
		messageForm = {
			subject: '',
			content: '',
			type: 'email',
			targetType: 'specific',
			userIds: [],
			userCriteria: {
				role: undefined,
				dateRange: undefined
			}
		};
	}

	function addUserId() {
		const input = document.getElementById('userIdInput') as HTMLInputElement;
		const userId = input.value.trim();
		if (userId && !messageForm.userIds.includes(userId as Id<'users'>)) {
			messageForm.userIds = [...messageForm.userIds, userId as Id<'users'>];
			input.value = '';
		}
	}

	function removeUserId(userId: Id<'users'>) {
		messageForm.userIds = messageForm.userIds.filter((id) => id !== userId);
	}

	// Reactive statements
	$: {
		if (analyticsTimeframe.start && analyticsTimeframe.end) {
			loadAnalytics();
		}
	}
</script>

<div class="p-6">
	<div class="flex justify-between items-center mb-6">
		<h2 class="text-2xl font-bold text-gray-900">Communication Manager</h2>
	</div>

	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
			{error}
		</div>
	{/if}

	{#if success}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
			{success}
		</div>
	{/if}

	<!-- Tabs -->
	<div class="border-b border-gray-200 mb-6">
		<nav class="-mb-px flex space-x-8">
			<button
				on:click={() => (activeTab = 'announcements')}
				class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'announcements'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Announcements
			</button>
			<button
				on:click={() => (activeTab = 'messages')}
				class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'messages'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Messages
			</button>
			<button
				on:click={() => (activeTab = 'analytics')}
				class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'analytics'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Analytics
			</button>
		</nav>
	</div>

	<!-- Announcements Tab -->
	{#if activeTab === 'announcements'}
		<div class="bg-white shadow rounded-lg p-6">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Send Platform Announcement</h3>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
						<input
							type="text"
							bind:value={announcementForm.title}
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Enter announcement title"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
						<select
							bind:value={announcementForm.type}
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="info">Information</option>
							<option value="warning">Warning</option>
							<option value="maintenance">Maintenance</option>
							<option value="feature">New Feature</option>
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
						<select
							bind:value={announcementForm.targetAudience}
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="all">All Users</option>
							<option value="clients">Clients Only</option>
							<option value="trainers">Trainers Only</option>
							<option value="premium">Premium Users</option>
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Scheduled For</label>
						<input
							type="datetime-local"
							bind:value={announcementForm.scheduledFor}
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Expires At (Optional)</label
						>
						<input
							type="datetime-local"
							bind:value={announcementForm.expiresAt}
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Content</label>
					<textarea
						bind:value={announcementForm.content}
						rows="12"
						class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Enter announcement content"
					></textarea>
				</div>
			</div>

			<div class="mt-6 flex justify-end">
				<button
					on:click={sendAnnouncement}
					disabled={loading || !announcementForm.title || !announcementForm.content}
					class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
				>
					{loading ? 'Sending...' : 'Send Announcement'}
				</button>
			</div>
		</div>
	{/if}

	<!-- Messages Tab -->
	{#if activeTab === 'messages'}
		<div class="bg-white shadow rounded-lg p-6">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Send Targeted Message</h3>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
						<input
							type="text"
							bind:value={messageForm.subject}
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Enter message subject"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
						<select
							bind:value={messageForm.type}
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="email">Email</option>
							<option value="push">Push Notification</option>
							<option value="in_app">In-App Message</option>
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Target Type</label>
						<select
							bind:value={messageForm.targetType}
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="specific">Specific Users</option>
							<option value="criteria">User Criteria</option>
						</select>
					</div>

					{#if messageForm.targetType === 'specific'}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Target Users</label>
							<div class="flex space-x-2 mb-2">
								<input
									id="userIdInput"
									type="text"
									class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Enter user ID"
									on:keydown={(e) => e.key === 'Enter' && addUserId()}
								/>
								<button
									on:click={addUserId}
									class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
								>
									Add
								</button>
							</div>
							<div class="space-y-1">
								{#each messageForm.userIds as userId}
									<div class="flex items-center justify-between bg-gray-100 px-3 py-1 rounded">
										<span class="text-sm">{userId}</span>
										<button
											on:click={() => removeUserId(userId)}
											class="text-red-600 hover:text-red-800"
										>
											Remove
										</button>
									</div>
								{/each}
							</div>
						</div>
					{:else}
						<div class="space-y-3">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">User Role</label>
								<select
									bind:value={messageForm.userCriteria.role}
									class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value={undefined}>All Roles</option>
									<option value="client">Clients</option>
									<option value="trainer">Trainers</option>
								</select>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1"
									>Registration Date Range</label
								>
								<div class="grid grid-cols-2 gap-2">
									<input
										type="date"
										bind:value={messageForm.userCriteria.dateRange?.start}
										class="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Start date"
									/>
									<input
										type="date"
										bind:value={messageForm.userCriteria.dateRange?.end}
										class="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="End date"
									/>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
					<textarea
						bind:value={messageForm.content}
						rows="12"
						class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Enter message content"
					></textarea>
				</div>
			</div>

			<div class="mt-6 flex justify-end">
				<button
					on:click={sendMessage}
					disabled={loading || !messageForm.subject || !messageForm.content}
					class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
				>
					{loading ? 'Sending...' : 'Send Message'}
				</button>
			</div>
		</div>
	{/if}

	<!-- Analytics Tab -->
	{#if activeTab === 'analytics'}
		<div class="space-y-6">
			<!-- Timeframe Selector -->
			<div class="bg-white shadow rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Analytics Timeframe</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
						<input
							type="date"
							bind:value={analyticsTimeframe.start}
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
						<input
							type="date"
							bind:value={analyticsTimeframe.end}
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>
			</div>

			<!-- Analytics Cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<div class="bg-white shadow rounded-lg p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
								<svg
									class="w-5 h-5 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
									></path>
								</svg>
							</div>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">Announcements Sent</dt>
								<dd class="text-lg font-medium text-gray-900">{analytics.announcementsSent}</dd>
							</dl>
						</div>
					</div>
				</div>

				<div class="bg-white shadow rounded-lg p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
								<svg
									class="w-5 h-5 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									></path>
								</svg>
							</div>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">Messages Sent</dt>
								<dd class="text-lg font-medium text-gray-900">{analytics.messagesSent}</dd>
							</dl>
						</div>
					</div>
				</div>

				<div class="bg-white shadow rounded-lg p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
								<svg
									class="w-5 h-5 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
							</div>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">Tickets Created</dt>
								<dd class="text-lg font-medium text-gray-900">{analytics.ticketsCreated}</dd>
							</dl>
						</div>
					</div>
				</div>

				<div class="bg-white shadow rounded-lg p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
								<svg
									class="w-5 h-5 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
							</div>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">Tickets Resolved</dt>
								<dd class="text-lg font-medium text-gray-900">{analytics.ticketsResolved}</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>

			<!-- Engagement Metrics -->
			<div class="bg-white shadow rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">User Engagement</h3>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div class="text-center">
						<div class="text-2xl font-bold text-blue-600">
							{analytics.userEngagement.deliveryRate.toFixed(1)}%
						</div>
						<div class="text-sm text-gray-500">Delivery Rate</div>
						<div class="text-xs text-gray-400">
							{analytics.userEngagement.delivered} / {analytics.userEngagement.totalRecipients}
						</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-green-600">
							{analytics.userEngagement.readRate.toFixed(1)}%
						</div>
						<div class="text-sm text-gray-500">Read Rate</div>
						<div class="text-xs text-gray-400">
							{analytics.userEngagement.read} / {analytics.userEngagement.delivered}
						</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-purple-600">
							{analytics.averageResponseTime.toFixed(1)}h
						</div>
						<div class="text-sm text-gray-500">Avg Response Time</div>
						<div class="text-xs text-gray-400">Support tickets</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
