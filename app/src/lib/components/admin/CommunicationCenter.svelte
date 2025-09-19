<script lang="ts">
	import { onMount } from 'svelte';
	import { supportService } from '../../services/supportService.js';
	import type { Id } from '../../../../convex/_generated/dataModel.js';

	// Props
	export let adminId: Id<'adminUsers'>;

	// State
	let activeTab = 'announcements';
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

	// Targeted message form
	let messageForm = {
		subject: '',
		content: '',
		type: 'email' as 'email' | 'push' | 'in_app',
		userIds: [] as Id<'users'>[],
		userCriteria: {
			role: '' as '' | 'client' | 'trainer' | 'admin',
			subscriptionStatus: '' as '' | 'active' | 'inactive' | 'cancelled',
			activityLevel: '' as '' | 'high' | 'medium' | 'low' | 'inactive',
			dateRange: {
				start: '',
				end: ''
			}
		}
	};

	// User search
	let userSearchQuery = '';
	let searchResults: any[] = [];
	let selectedUsers: any[] = [];

	async function sendAnnouncement() {
		try {
			loading = true;
			error = '';
			success = '';

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

			// Reset form
			announcementForm = {
				title: '',
				content: '',
				type: 'info',
				targetAudience: 'all',
				scheduledFor: new Date().toISOString().slice(0, 16),
				expiresAt: ''
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to send announcement';
		} finally {
			loading = false;
		}
	}

	async function sendTargetedMessage() {
		try {
			loading = true;
			error = '';
			success = '';

			const userIds = selectedUsers.length > 0 ? selectedUsers.map((u) => u._id) : undefined;

			const userCriteria = {
				role: (messageForm.userCriteria.role || undefined) as
					| 'client'
					| 'trainer'
					| 'admin'
					| undefined,
				subscriptionStatus: (messageForm.userCriteria.subscriptionStatus || undefined) as
					| 'active'
					| 'inactive'
					| 'cancelled'
					| undefined,
				activityLevel: (messageForm.userCriteria.activityLevel || undefined) as
					| 'high'
					| 'medium'
					| 'low'
					| 'inactive'
					| undefined,
				dateRange:
					messageForm.userCriteria.dateRange.start && messageForm.userCriteria.dateRange.end
						? messageForm.userCriteria.dateRange
						: undefined
			};

			if (!userIds && !userCriteria) {
				error = 'Please select users or specify criteria';
				return;
			}

			const result = await supportService.sendTargetedMessage(
				{
					subject: messageForm.subject,
					content: messageForm.content,
					type: messageForm.type,
					userIds,
					userCriteria
				},
				adminId
			);

			success = `Message sent to ${result.recipientCount} users`;

			// Reset form
			messageForm = {
				subject: '',
				content: '',
				type: 'email',
				userIds: [],
				userCriteria: {
					role: '' as '' | 'client' | 'trainer' | 'admin',
					subscriptionStatus: '' as '' | 'active' | 'inactive' | 'cancelled',
					activityLevel: '' as '' | 'high' | 'medium' | 'low' | 'inactive',
					dateRange: { start: '', end: '' }
				}
			};
			selectedUsers = [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to send message';
		} finally {
			loading = false;
		}
	}

	function removeSelectedUser(userId: Id<'users'>) {
		selectedUsers = selectedUsers.filter((u) => u._id !== userId);
	}

	function clearMessages() {
		error = '';
		success = '';
	}
</script>

<div class="max-w-4xl mx-auto p-6">
	<h1 class="text-2xl font-bold text-gray-900 mb-6">Communication Center</h1>

	<!-- Status Messages -->
	{#if error}
		<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
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
						on:click={clearMessages}
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

	{#if success}
		<div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm text-green-800">{success}</p>
				</div>
				<div class="ml-auto pl-3">
					<button
						on:click={clearMessages}
						class="text-green-400 hover:text-green-600"
						aria-label="Clear success message"
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

	<!-- Tabs -->
	<div class="border-b border-gray-200 mb-6">
		<nav class="-mb-px flex space-x-8">
			<button
				class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'announcements'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				on:click={() => (activeTab = 'announcements')}
			>
				Platform Announcements
			</button>
			<button
				class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'messages'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				on:click={() => (activeTab = 'messages')}
			>
				Targeted Messages
			</button>
		</nav>
	</div>

	{#if activeTab === 'announcements'}
		<!-- Platform Announcements -->
		<div class="bg-white shadow rounded-lg p-6">
			<h2 class="text-lg font-medium text-gray-900 mb-4">Send Platform Announcement</h2>

			<form on:submit|preventDefault={sendAnnouncement} class="space-y-4">
				<div>
					<label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
					<input
						type="text"
						id="title"
						bind:value={announcementForm.title}
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="Announcement title"
					/>
				</div>

				<div>
					<label for="content" class="block text-sm font-medium text-gray-700 mb-1">Content</label>
					<textarea
						id="content"
						bind:value={announcementForm.content}
						required
						rows="4"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="Announcement content"
					></textarea>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="type" class="block text-sm font-medium text-gray-700 mb-1">Type</label>
						<select
							id="type"
							bind:value={announcementForm.type}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="info">Information</option>
							<option value="warning">Warning</option>
							<option value="maintenance">Maintenance</option>
							<option value="feature">New Feature</option>
						</select>
					</div>

					<div>
						<label for="audience" class="block text-sm font-medium text-gray-700 mb-1"
							>Target Audience</label
						>
						<select
							id="audience"
							bind:value={announcementForm.targetAudience}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="all">All Users</option>
							<option value="clients">Clients Only</option>
							<option value="trainers">Trainers Only</option>
							<option value="premium">Premium Users</option>
						</select>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="scheduled" class="block text-sm font-medium text-gray-700 mb-1"
							>Scheduled For</label
						>
						<input
							type="datetime-local"
							id="scheduled"
							bind:value={announcementForm.scheduledFor}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div>
						<label for="expires" class="block text-sm font-medium text-gray-700 mb-1"
							>Expires At (Optional)</label
						>
						<input
							type="datetime-local"
							id="expires"
							bind:value={announcementForm.expiresAt}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
				</div>

				<div class="flex justify-end">
					<button
						type="submit"
						disabled={loading}
						class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Sending...' : 'Send Announcement'}
					</button>
				</div>
			</form>
		</div>
	{:else if activeTab === 'messages'}
		<!-- Targeted Messages -->
		<div class="bg-white shadow rounded-lg p-6">
			<h2 class="text-lg font-medium text-gray-900 mb-4">Send Targeted Message</h2>

			<form on:submit|preventDefault={sendTargetedMessage} class="space-y-4">
				<div>
					<label for="subject" class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
					<input
						type="text"
						id="subject"
						bind:value={messageForm.subject}
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="Message subject"
					/>
				</div>

				<div>
					<label for="message-content" class="block text-sm font-medium text-gray-700 mb-1"
						>Content</label
					>
					<textarea
						id="message-content"
						bind:value={messageForm.content}
						required
						rows="4"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="Message content"
					></textarea>
				</div>

				<div>
					<label for="message-type" class="block text-sm font-medium text-gray-700 mb-1"
						>Message Type</label
					>
					<select
						id="message-type"
						bind:value={messageForm.type}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="email">Email</option>
						<option value="push">Push Notification</option>
						<option value="in_app">In-App Message</option>
					</select>
				</div>

				<!-- User Selection -->
				<div>
					<h3 class="text-sm font-medium text-gray-700 mb-2">Target Users</h3>
					<p class="text-xs text-gray-500 mb-3">Select specific users or use criteria below</p>

					{#if selectedUsers.length > 0}
						<div class="mb-3">
							<h4 class="text-sm font-medium text-gray-700 mb-2">
								Selected Users ({selectedUsers.length})
							</h4>
							<div class="flex flex-wrap gap-2">
								{#each selectedUsers as user}
									<span
										class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
									>
										{user.name}
										<button
											type="button"
											on:click={() => removeSelectedUser(user._id)}
											class="ml-1 text-blue-600 hover:text-blue-800"
										>
											×
										</button>
									</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- User Criteria -->
				<div>
					<h3 class="text-sm font-medium text-gray-700 mb-2">Or Use Criteria</h3>
					<div class="grid grid-cols-3 gap-4">
						<div>
							<label for="role-filter" class="block text-xs font-medium text-gray-600 mb-1"
								>Role</label
							>
							<select
								id="role-filter"
								bind:value={messageForm.userCriteria.role}
								class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
							>
								<option value="">All Roles</option>
								<option value="client">Clients</option>
								<option value="trainer">Trainers</option>
								<option value="admin">Admins</option>
							</select>
						</div>

						<div>
							<label for="subscription-filter" class="block text-xs font-medium text-gray-600 mb-1"
								>Subscription</label
							>
							<select
								id="subscription-filter"
								bind:value={messageForm.userCriteria.subscriptionStatus}
								class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
							>
								<option value="">All Subscriptions</option>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
								<option value="cancelled">Cancelled</option>
							</select>
						</div>

						<div>
							<label for="activity-filter" class="block text-xs font-medium text-gray-600 mb-1"
								>Activity Level</label
							>
							<select
								id="activity-filter"
								bind:value={messageForm.userCriteria.activityLevel}
								class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
							>
								<option value="">All Activity Levels</option>
								<option value="high">High</option>
								<option value="medium">Medium</option>
								<option value="low">Low</option>
								<option value="inactive">Inactive</option>
							</select>
						</div>
					</div>
				</div>

				<div class="flex justify-end">
					<button
						type="submit"
						disabled={loading}
						class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Sending...' : 'Send Message'}
					</button>
				</div>
			</form>
		</div>
	{/if}
</div>
