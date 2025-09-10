<script lang="ts">
	import { onMount } from 'svelte';
	import { supportService } from '../../services/supportService';
	import { userManagementService } from '../../services/userManagementService';
	import type { Id, BulkUserAction, UserSearchCriteria } from '../../types/admin';

	// Props
	export let adminId: Id<'adminUsers'>;

	// State
	let loading = false;
	let error = '';
	let success = '';
	let selectedUsers: Id<'users'>[] = [];
	let searchResults: any[] = [];
	let searchLoading = false;

	// Search criteria
	let searchCriteria: UserSearchCriteria = {
		query: '',
		role: undefined,
		subscriptionStatus: undefined,
		activityLevel: undefined,
		dateRange: undefined,
		limit: 50,
		offset: 0
	};

	// Bulk action form
	let bulkAction: BulkUserAction = {
		action: 'suspend',
		reason: '',
		duration: undefined,
		message: ''
	};

	// Action results
	let actionResults: any = null;

	onMount(() => {
		searchUsers();
	});

	async function searchUsers() {
		searchLoading = true;
		error = '';

		try {
			const result = await userManagementService.searchUsers(searchCriteria, adminId);
			searchResults = result.users;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to search users';
		} finally {
			searchLoading = false;
		}
	}

	async function performBulkAction() {
		if (selectedUsers.length === 0) {
			error = 'Please select at least one user';
			return;
		}

		if (!bulkAction.reason && bulkAction.action !== 'activate') {
			error = 'Please provide a reason for this action';
			return;
		}

		const confirmed = confirm(
			`Are you sure you want to ${bulkAction.action} ${selectedUsers.length} user(s)?`
		);
		if (!confirmed) return;

		loading = true;
		error = '';
		success = '';

		try {
			const result = await supportService.performBulkUserAction(bulkAction, selectedUsers, adminId);

			actionResults = result;
			success = `Bulk action completed: ${result.successful} successful, ${result.failed} failed`;
			selectedUsers = [];
			await searchUsers(); // Refresh the list
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to perform bulk action';
		} finally {
			loading = false;
		}
	}

	function toggleUserSelection(userId: Id<'users'>) {
		if (selectedUsers.includes(userId)) {
			selectedUsers = selectedUsers.filter((id) => id !== userId);
		} else {
			selectedUsers = [...selectedUsers, userId];
		}
	}

	function selectAllUsers() {
		selectedUsers = searchResults.map((user) => user._id);
	}

	function clearSelection() {
		selectedUsers = [];
	}

	function resetBulkAction() {
		bulkAction = {
			action: 'suspend',
			reason: '',
			duration: undefined,
			message: ''
		};
	}

	function getRoleColor(role: string): string {
		switch (role) {
			case 'client':
				return 'bg-blue-100 text-blue-800';
			case 'trainer':
				return 'bg-green-100 text-green-800';
			case 'admin':
				return 'bg-purple-100 text-purple-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	// Reactive statements
	$: canPerformAction =
		selectedUsers.length > 0 && (bulkAction.reason || bulkAction.action === 'activate');
</script>

<div class="p-6">
	<div class="flex justify-between items-center mb-6">
		<h2 class="text-2xl font-bold text-gray-900">Bulk User Actions</h2>
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

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- User Search and Selection -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Search Filters -->
			<div class="bg-white shadow rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Search Users</h3>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Search Query</label>
						<input
							type="text"
							bind:value={searchCriteria.query}
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Search by name or email"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
						<select
							bind:value={searchCriteria.role}
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value={undefined}>All Roles</option>
							<option value="client">Clients</option>
							<option value="trainer">Trainers</option>
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Subscription Status</label>
						<select
							bind:value={searchCriteria.subscriptionStatus}
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value={undefined}>All Statuses</option>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
							<option value="cancelled">Cancelled</option>
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
						<select
							bind:value={searchCriteria.activityLevel}
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value={undefined}>All Levels</option>
							<option value="high">High</option>
							<option value="medium">Medium</option>
							<option value="low">Low</option>
							<option value="inactive">Inactive</option>
						</select>
					</div>
				</div>

				<button
					on:click={searchUsers}
					disabled={searchLoading}
					class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
				>
					{searchLoading ? 'Searching...' : 'Search Users'}
				</button>
			</div>

			<!-- User Selection -->
			<div class="bg-white shadow rounded-lg">
				<div class="px-6 py-4 border-b border-gray-200">
					<div class="flex justify-between items-center">
						<h3 class="text-lg font-medium text-gray-900">
							Users ({searchResults.length})
						</h3>
						<div class="flex space-x-2">
							<button
								on:click={selectAllUsers}
								disabled={searchResults.length === 0}
								class="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
							>
								Select All
							</button>
							<button
								on:click={clearSelection}
								disabled={selectedUsers.length === 0}
								class="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
							>
								Clear Selection
							</button>
						</div>
					</div>
					{#if selectedUsers.length > 0}
						<p class="text-sm text-gray-600 mt-2">
							{selectedUsers.length} user(s) selected
						</p>
					{/if}
				</div>

				{#if searchLoading}
					<div class="p-8 text-center">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
						<p class="mt-2 text-gray-600">Loading users...</p>
					</div>
				{:else if searchResults.length === 0}
					<div class="p-8 text-center text-gray-500">No users found matching your criteria.</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Select
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										User
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Role
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Created
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										Last Activity
									</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each searchResults as user}
									<tr
										class="hover:bg-gray-50 {selectedUsers.includes(user._id) ? 'bg-blue-50' : ''}"
									>
										<td class="px-6 py-4 whitespace-nowrap">
											<input
												type="checkbox"
												checked={selectedUsers.includes(user._id)}
												on:change={() => toggleUserSelection(user._id)}
												class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
											/>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<div>
												<div class="text-sm font-medium text-gray-900">{user.name}</div>
												<div class="text-sm text-gray-500">{user.email}</div>
											</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<span
												class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getRoleColor(
													user.role
												)}"
											>
												{user.role}
											</span>
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{new Date(user.createdAt).toLocaleDateString()}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{user.lastActivity
												? new Date(user.lastActivity).toLocaleDateString()
												: 'Never'}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>

		<!-- Bulk Actions Panel -->
		<div class="space-y-6">
			<!-- Action Configuration -->
			<div class="bg-white shadow rounded-lg p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Bulk Action</h3>

				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Action</label>
						<select
							bind:value={bulkAction.action}
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="suspend">Suspend Users</option>
							<option value="activate">Activate Users</option>
							<option value="delete">Delete Users</option>
							<option value="send_message">Send Message</option>
						</select>
					</div>

					{#if bulkAction.action === 'suspend'}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
							<input
								type="number"
								bind:value={bulkAction.duration}
								class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="Leave empty for permanent"
							/>
						</div>
					{/if}

					{#if bulkAction.action !== 'activate'}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								{bulkAction.action === 'send_message' ? 'Message' : 'Reason'}
							</label>
							<textarea
								bind:value={
									bulkAction.action === 'send_message' ? bulkAction.message : bulkAction.reason
								}
								rows="3"
								class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder={bulkAction.action === 'send_message'
									? 'Enter message content'
									: 'Enter reason for action'}
							></textarea>
						</div>
					{/if}

					<button
						on:click={performBulkAction}
						disabled={loading || !canPerformAction}
						class="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
					>
						{loading
							? 'Processing...'
							: `${bulkAction.action.charAt(0).toUpperCase() + bulkAction.action.slice(1)} ${selectedUsers.length} User(s)`}
					</button>
				</div>
			</div>

			<!-- Action Preview -->
			{#if selectedUsers.length > 0}
				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h4 class="text-sm font-medium text-yellow-800 mb-2">Action Preview</h4>
					<ul class="text-sm text-yellow-700 space-y-1">
						<li>• Action: {bulkAction.action}</li>
						<li>• Users affected: {selectedUsers.length}</li>
						{#if bulkAction.reason}
							<li>• Reason: {bulkAction.reason}</li>
						{/if}
						{#if bulkAction.duration}
							<li>• Duration: {bulkAction.duration} days</li>
						{/if}
						{#if bulkAction.message}
							<li>
								• Message: {bulkAction.message.substring(0, 50)}{bulkAction.message.length > 50
									? '...'
									: ''}
							</li>
						{/if}
					</ul>
				</div>
			{/if}

			<!-- Action Results -->
			{#if actionResults}
				<div class="bg-white shadow rounded-lg p-6">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Action Results</h3>

					<div class="space-y-3">
						<div class="flex justify-between items-center">
							<span class="text-sm text-gray-600">Successful</span>
							<span class="text-sm font-medium text-green-600">{actionResults.successful}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-sm text-gray-600">Failed</span>
							<span class="text-sm font-medium text-red-600">{actionResults.failed}</span>
						</div>
					</div>

					{#if actionResults.errors && actionResults.errors.length > 0}
						<div class="mt-4">
							<h4 class="text-sm font-medium text-gray-900 mb-2">Errors</h4>
							<div class="space-y-2 max-h-32 overflow-y-auto">
								{#each actionResults.errors as error}
									<div class="text-sm text-red-600 bg-red-50 p-2 rounded">
										User {error.userId}: {error.error}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<button
						on:click={() => {
							actionResults = null;
							resetBulkAction();
						}}
						class="mt-4 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
					>
						Clear Results
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
