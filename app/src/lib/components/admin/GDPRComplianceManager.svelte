<script lang="ts">
	import { onMount } from 'svelte';
	import { supportService } from '../../services/supportService';
	import type { Id } from '../../../../convex/_generated/dataModel';

	// Props
	export let adminId: Id<'adminUsers'>;

	// State
	let activeTab = 'requests';
	let loading = false;
	let error = '';
	let success = '';

	// Privacy requests
	let privacyRequests: any[] = [];
	let selectedRequest: any = null;

	// Data export form
	let exportForm = {
		userId: '',
		includeDeleted: false
	};

	// Data deletion form
	let deletionForm = {
		userId: '',
		deletionType: 'soft' as 'soft' | 'hard',
		reason: ''
	};

	// Bulk actions
	let bulkActionForm = {
		action: 'send_message' as 'suspend' | 'activate' | 'delete' | 'send_message',
		userIds: [] as Id<'users'>[],
		reason: '',
		message: '',
		duration: 0
	};

	let userSearchQuery = '';
	let searchResults: any[] = [];
	let selectedUsers: any[] = [];

	onMount(() => {
		loadPrivacyRequests();
	});

	async function loadPrivacyRequests() {
		try {
			loading = true;
			// This would call a privacy service to get requests
			// For now, we'll simulate it
			privacyRequests = [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load privacy requests';
		} finally {
			loading = false;
		}
	}

	async function handleGDPRRequest(userId: Id<'users'>, requestType: string) {
		try {
			loading = true;
			error = '';
			success = '';

			const result = await supportService.handleGDPRDeletionRequest(
				userId,
				requestType as any,
				adminId,
				'Admin initiated request'
			);

			success = `GDPR ${requestType} request created successfully`;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create GDPR request';
		} finally {
			loading = false;
		}
	}

	async function exportUserData() {
		try {
			loading = true;
			error = '';
			success = '';

			if (!exportForm.userId) {
				error = 'Please enter a user ID';
				return;
			}

			const result = await supportService.exportUserData(
				exportForm.userId as Id<'users'>,
				adminId,
				exportForm.includeDeleted
			);

			success = `Data export initiated. Download will be available at: ${result.downloadUrl}`;

			// Reset form
			exportForm = {
				userId: '',
				includeDeleted: false
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to export user data';
		} finally {
			loading = false;
		}
	}

	async function performBulkAction() {
		try {
			loading = true;
			error = '';
			success = '';

			if (selectedUsers.length === 0) {
				error = 'Please select users for bulk action';
				return;
			}

			const action = {
				action: bulkActionForm.action,
				reason: bulkActionForm.reason,
				message: bulkActionForm.message,
				duration: bulkActionForm.duration
			};

			const userIds = selectedUsers.map((u) => u._id);

			const result = await supportService.performBulkUserAction(action, userIds, adminId);

			success = `Bulk action completed. ${result.successful} successful, ${result.failed} failed.`;

			// Reset form
			selectedUsers = [];
			bulkActionForm = {
				action: 'send_message',
				userIds: [],
				reason: '',
				message: '',
				duration: 0
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to perform bulk action';
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

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}
</script>

<div class="max-w-6xl mx-auto p-6">
	<h1 class="text-2xl font-bold text-gray-900 mb-6">GDPR Compliance & User Management</h1>

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
					<button on:click={clearMessages} class="text-red-400 hover:text-red-600">
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
					<button on:click={clearMessages} class="text-green-400 hover:text-green-600">
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
				class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'requests'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				on:click={() => (activeTab = 'requests')}
			>
				Privacy Requests
			</button>
			<button
				class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'export'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				on:click={() => (activeTab = 'export')}
			>
				Data Export
			</button>
			<button
				class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'bulk'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				on:click={() => (activeTab = 'bulk')}
			>
				Bulk Actions
			</button>
		</nav>
	</div>

	{#if activeTab === 'requests'}
		<!-- Privacy Requests -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Create New Request -->
			<div class="bg-white shadow rounded-lg p-6">
				<h2 class="text-lg font-medium text-gray-900 mb-4">Create GDPR Request</h2>

				<div class="space-y-4">
					<div>
						<label for="user-id" class="block text-sm font-medium text-gray-700 mb-1">User ID</label
						>
						<input
							type="text"
							id="user-id"
							bind:value={exportForm.userId}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Enter user ID"
						/>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<button
							on:click={() => handleGDPRRequest(exportForm.userId as Id<'users'>, 'access')}
							disabled={loading || !exportForm.userId}
							class="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
						>
							Data Access
						</button>
						<button
							on:click={() => handleGDPRRequest(exportForm.userId as Id<'users'>, 'portability')}
							disabled={loading || !exportForm.userId}
							class="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
						>
							Data Portability
						</button>
						<button
							on:click={() => handleGDPRRequest(exportForm.userId as Id<'users'>, 'rectification')}
							disabled={loading || !exportForm.userId}
							class="px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 disabled:opacity-50"
						>
							Data Rectification
						</button>
						<button
							on:click={() => handleGDPRRequest(exportForm.userId as Id<'users'>, 'deletion')}
							disabled={loading || !exportForm.userId}
							class="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
						>
							Data Deletion
						</button>
					</div>
				</div>
			</div>

			<!-- Recent Requests -->
			<div class="bg-white shadow rounded-lg p-6">
				<h2 class="text-lg font-medium text-gray-900 mb-4">Recent Privacy Requests</h2>

				{#if privacyRequests.length === 0}
					<p class="text-gray-500 text-sm">No privacy requests found</p>
				{:else}
					<div class="space-y-3">
						{#each privacyRequests as request}
							<div class="border border-gray-200 rounded-md p-3">
								<div class="flex items-center justify-between mb-2">
									<span class="text-sm font-medium text-gray-900">{request.requestType}</span>
									<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
										{request.status}
									</span>
								</div>
								<p class="text-xs text-gray-600">
									User: {request.user?.name} • {formatDate(request.requestedAt)}
								</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{:else if activeTab === 'export'}
		<!-- Data Export -->
		<div class="bg-white shadow rounded-lg p-6 max-w-2xl">
			<h2 class="text-lg font-medium text-gray-900 mb-4">Export User Data</h2>

			<form on:submit|preventDefault={exportUserData} class="space-y-4">
				<div>
					<label for="export-user-id" class="block text-sm font-medium text-gray-700 mb-1"
						>User ID</label
					>
					<input
						type="text"
						id="export-user-id"
						bind:value={exportForm.userId}
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="Enter user ID to export data"
					/>
				</div>

				<div>
					<label class="flex items-center">
						<input type="checkbox" bind:checked={exportForm.includeDeleted} class="mr-2" />
						<span class="text-sm text-gray-700">Include deleted data</span>
					</label>
				</div>

				<div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="ml-3">
							<p class="text-sm text-yellow-800">
								This will export all user data including personal information, fitness data,
								messages, and transaction history. The export will be available for download for 7
								days.
							</p>
						</div>
					</div>
				</div>

				<div class="flex justify-end">
					<button
						type="submit"
						disabled={loading}
						class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Exporting...' : 'Export Data'}
					</button>
				</div>
			</form>
		</div>
	{:else if activeTab === 'bulk'}
		<!-- Bulk Actions -->
		<div class="bg-white shadow rounded-lg p-6">
			<h2 class="text-lg font-medium text-gray-900 mb-4">Bulk User Actions</h2>

			<form on:submit|preventDefault={performBulkAction} class="space-y-6">
				<!-- Selected Users -->
				{#if selectedUsers.length > 0}
					<div>
						<h3 class="text-sm font-medium text-gray-700 mb-2">
							Selected Users ({selectedUsers.length})
						</h3>
						<div class="flex flex-wrap gap-2 mb-4">
							{#each selectedUsers as user}
								<span
									class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
								>
									{user.name} ({user.email})
									<button
										type="button"
										on:click={() => removeSelectedUser(user._id)}
										class="ml-2 text-blue-600 hover:text-blue-800"
									>
										×
									</button>
								</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Action Selection -->
				<div>
					<label for="bulk-action" class="block text-sm font-medium text-gray-700 mb-1"
						>Action</label
					>
					<select
						id="bulk-action"
						bind:value={bulkActionForm.action}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="send_message">Send Message</option>
						<option value="suspend">Suspend Users</option>
						<option value="activate">Activate Users</option>
						<option value="delete">Delete Users</option>
					</select>
				</div>

				<!-- Action-specific fields -->
				{#if bulkActionForm.action === 'suspend'}
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="suspension-reason" class="block text-sm font-medium text-gray-700 mb-1"
								>Reason</label
							>
							<input
								type="text"
								id="suspension-reason"
								bind:value={bulkActionForm.reason}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="Reason for suspension"
							/>
						</div>
						<div>
							<label for="suspension-duration" class="block text-sm font-medium text-gray-700 mb-1"
								>Duration (days)</label
							>
							<input
								type="number"
								id="suspension-duration"
								bind:value={bulkActionForm.duration}
								min="1"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="Leave empty for permanent"
							/>
						</div>
					</div>
				{:else if bulkActionForm.action === 'send_message'}
					<div>
						<label for="bulk-message" class="block text-sm font-medium text-gray-700 mb-1"
							>Message</label
						>
						<textarea
							id="bulk-message"
							bind:value={bulkActionForm.message}
							required
							rows="4"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Message to send to selected users"
						></textarea>
					</div>
				{:else if bulkActionForm.action === 'delete'}
					<div>
						<label for="deletion-reason" class="block text-sm font-medium text-gray-700 mb-1"
							>Deletion Reason</label
						>
						<input
							type="text"
							id="deletion-reason"
							bind:value={bulkActionForm.reason}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Reason for deletion"
						/>
					</div>

					<div class="bg-red-50 border border-red-200 rounded-md p-4">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
							<div class="ml-3">
								<p class="text-sm text-red-800">
									<strong>Warning:</strong> This action will permanently delete user accounts and all
									associated data. This action cannot be undone.
								</p>
							</div>
						</div>
					</div>
				{/if}

				<div class="flex justify-end">
					<button
						type="submit"
						disabled={loading || selectedUsers.length === 0}
						class="px-6 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Processing...' : `Perform Action on ${selectedUsers.length} Users`}
					</button>
				</div>
			</form>
		</div>
	{/if}
</div>
