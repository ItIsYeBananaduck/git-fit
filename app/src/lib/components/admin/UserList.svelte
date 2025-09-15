<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { UserSearchResult } from '$lib/types/admin';
	import type { Id } from '../../../../../convex/_generated/dataModel';

	export let users: UserSearchResult[] = [];
	export let loading = false;
	export let hasMore = false;

	const dispatch = createEventDispatcher<{
		loadMore: void;
		viewProfile: Id<'users'>;
		userSelection: Id<'users'>[];
	}>();

	let selectedUsers = new Set<Id<'users'>>();
	let selectAll = false;

	function toggleUserSelection(userId: Id<'users'>) {
		if (selectedUsers.has(userId)) {
			selectedUsers.delete(userId);
		} else {
			selectedUsers.add(userId);
		}
		selectedUsers = selectedUsers;
		updateSelectAll();
		dispatch('userSelection', Array.from(selectedUsers));
	}

	function toggleSelectAll() {
		if (selectAll) {
			selectedUsers.clear();
		} else {
			users.forEach((user) => selectedUsers.add(user._id));
		}
		selectedUsers = selectedUsers;
		selectAll = !selectAll;
		dispatch('userSelection', Array.from(selectedUsers));
	}

	function updateSelectAll() {
		selectAll = users.length > 0 && users.every((user) => selectedUsers.has(user._id));
	}

	function getRoleColor(role: string) {
		switch (role) {
			case 'admin':
				return 'bg-red-100 text-red-800';
			case 'trainer':
				return 'bg-blue-100 text-blue-800';
			case 'client':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800';
			case 'inactive':
				return 'bg-yellow-100 text-yellow-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getRiskColor(riskScore: number) {
		if (riskScore >= 70) return 'text-red-600';
		if (riskScore >= 40) return 'text-yellow-600';
		return 'text-green-600';
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString();
	}

	function formatLastActivity(dateString?: string) {
		if (!dateString) return 'Never';
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		return `${Math.floor(diffDays / 30)} months ago`;
	}

	// Update select all when users change
	$: if (users) {
		updateSelectAll();
	}
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
	<!-- Table Header -->
	<div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-medium text-gray-900">Users</h3>
			<div class="text-sm text-gray-500">
				{users.length} users shown
			</div>
		</div>
	</div>

	{#if loading && users.length === 0}
		<!-- Loading State -->
		<div class="p-8 text-center">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
			<p class="text-gray-500">Loading users...</p>
		</div>
	{:else if users.length === 0}
		<!-- Empty State -->
		<div class="p-8 text-center">
			<div class="text-gray-400 mb-4">
				<svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
					/>
				</svg>
			</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No users found</h3>
			<p class="text-gray-500">Try adjusting your search criteria or filters.</p>
		</div>
	{:else}
		<!-- User Table -->
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left">
							<input
								type="checkbox"
								bind:checked={selectAll}
								on:change={toggleSelectAll}
								class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
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
							Status
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Last Activity
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Risk Score
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Registered
						</th>
						<th
							class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each users as user (user._id)}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-6 py-4">
								<input
									type="checkbox"
									checked={selectedUsers.has(user._id)}
									on:change={() => toggleUserSelection(user._id)}
									class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								/>
							</td>
							<td class="px-6 py-4">
								<div class="flex items-center">
									<div class="flex-shrink-0 h-10 w-10">
										<div
											class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center"
										>
											<span class="text-sm font-medium text-gray-700">
												{user.name.charAt(0).toUpperCase()}
											</span>
										</div>
									</div>
									<div class="ml-4">
										<div class="text-sm font-medium text-gray-900">
											{user.name}
										</div>
										<div class="text-sm text-gray-500">
											{user.email}
										</div>
									</div>
								</div>
							</td>
							<td class="px-6 py-4">
								<span
									class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getRoleColor(
										user.role
									)}"
								>
									{user.role}
								</span>
							</td>
							<td class="px-6 py-4">
								<span
									class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(
										user.subscriptionStatus || 'inactive'
									)}"
								>
									{user.subscriptionStatus || 'inactive'}
								</span>
							</td>
							<td class="px-6 py-4 text-sm text-gray-900">
								{formatLastActivity(user.lastActivity)}
							</td>
							<td class="px-6 py-4">
								<span class="text-sm font-medium {getRiskColor(user.riskScore || 0)}">
									{user.riskScore || 0}%
								</span>
							</td>
							<td class="px-6 py-4 text-sm text-gray-500">
								{formatDate(user.createdAt)}
							</td>
							<td class="px-6 py-4 text-right text-sm font-medium">
								<button
									on:click={() => dispatch('viewProfile', user._id)}
									class="text-blue-600 hover:text-blue-900 transition-colors"
								>
									View Profile
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Load More Button -->
		{#if hasMore}
			<div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
				<button
					on:click={() => dispatch('loadMore')}
					disabled={loading}
					class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{loading ? 'Loading...' : 'Load More Users'}
				</button>
			</div>
		{/if}
	{/if}
</div>
