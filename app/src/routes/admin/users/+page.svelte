<script lang="ts">
	import { onMount } from 'svelte';
	import { userManagementService } from '$lib/services/userManagementService';
	import { adminAuthService } from '$lib/services/adminAuth';
	import UserSearchFilters from '$lib/components/admin/UserSearchFilters.svelte';
	import UserList from '$lib/components/admin/UserList.svelte';
	import UserProfileModal from '$lib/components/admin/UserProfileModal.svelte';
	import BulkActionModal from '$lib/components/admin/BulkActionModal.svelte';
	import type {
		UserSearchCriteria,
		UserSearchResult,
		DetailedUserProfile,
		BulkUserAction
	} from '$lib/types/admin';
	import type { Id } from '../../../../../convex/_generated/dataModel';

	// State
	let users: UserSearchResult[] = [];
	let totalUsers = 0;
	let hasMore = false;
	let loading = false;
	let error = '';
	let currentPage = 0;
	const pageSize = 50;

	// Modals
	let selectedUser: DetailedUserProfile | null = null;
	let showUserProfile = false;
	let showBulkActions = false;
	let selectedUserIds: Id<'users'>[] = [];

	// Search criteria
	let searchCriteria: UserSearchCriteria = {
		query: '',
		role: undefined,
		subscriptionStatus: undefined,
		activityLevel: undefined,
		dateRange: undefined,
		limit: pageSize,
		offset: 0
	};

	// Mock admin ID - in real app this would come from auth context
	const adminId = 'admin_123' as Id<'adminUsers'>;

	onMount(() => {
		loadUsers();
	});

	async function loadUsers(resetPage = false) {
		if (resetPage) {
			currentPage = 0;
			searchCriteria.offset = 0;
		}

		loading = true;
		error = '';

		try {
			const result = await userManagementService.searchUsers(
				{
					...searchCriteria,
					offset: currentPage * pageSize
				},
				adminId
			);

			if (resetPage) {
				users = result.users;
			} else {
				users = [...users, ...result.users];
			}

			totalUsers = result.total;
			hasMore = result.hasMore;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load users';
			console.error('Error loading users:', err);
		} finally {
			loading = false;
		}
	}

	async function handleSearch(criteria: UserSearchCriteria) {
		searchCriteria = { ...criteria, limit: pageSize, offset: 0 };
		currentPage = 0;
		await loadUsers(true);
	}

	async function loadMore() {
		if (!hasMore || loading) return;
		currentPage++;
		await loadUsers();
	}

	async function viewUserProfile(userId: Id<'users'>) {
		try {
			selectedUser = await userManagementService.getUserProfile(userId, adminId);
			showUserProfile = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load user profile';
		}
	}

	function handleUserSelection(userIds: Id<'users'>[]) {
		selectedUserIds = userIds;
	}

	function openBulkActions() {
		if (selectedUserIds.length === 0) {
			error = 'Please select users first';
			return;
		}
		showBulkActions = true;
	}

	async function handleBulkAction(action: BulkUserAction) {
		try {
			const result = await userManagementService.bulkUserAction(selectedUserIds, action, adminId);

			if (result.successful > 0) {
				// Refresh user list
				await loadUsers(true);
				selectedUserIds = [];
			}

			if (result.failed > 0) {
				error = `${result.successful} users processed successfully, ${result.failed} failed`;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Bulk action failed';
		} finally {
			showBulkActions = false;
		}
	}

	async function handleUserAction(action: string, userId: Id<'users'>, data?: any) {
		try {
			switch (action) {
				case 'suspend':
					await userManagementService.suspendUser(userId, data.reason, adminId, data.duration);
					break;
				case 'warn':
					await userManagementService.issueUserWarning(userId, data.reason, adminId);
					break;
				case 'terminate':
					await userManagementService.terminateUser(userId, data.reason, adminId);
					break;
				case 'impersonate':
					const session = await userManagementService.impersonateUser(userId, data.reason, adminId);
					// Handle impersonation session
					console.log('Impersonation session started:', session);
					break;
			}

			// Refresh user list
			await loadUsers(true);
			showUserProfile = false;
		} catch (err) {
			error = err instanceof Error ? err.message : `Failed to ${action} user`;
		}
	}
</script>

<svelte:head>
	<title>User Management - Admin Dashboard</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">User Management</h1>
				<p class="text-gray-600 mt-1">
					Manage user accounts, view profiles, and handle support requests
				</p>
			</div>
			<div class="flex items-center gap-3">
				<span class="text-sm text-gray-500">
					{totalUsers} total users
				</span>
				{#if selectedUserIds.length > 0}
					<button
						on:click={openBulkActions}
						class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
					>
						Bulk Actions ({selectedUserIds.length})
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Error Display -->
	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<div class="flex items-center">
				<svg class="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
				<div class="text-red-800">{error}</div>
				<button on:click={() => (error = '')} class="ml-auto text-red-600 hover:text-red-800">
					×
				</button>
			</div>
		</div>
	{/if}

	<!-- Search Filters -->
	<UserSearchFilters on:search={(e) => handleSearch(e.detail)} {loading} />

	<!-- User List -->
	<UserList
		{users}
		{loading}
		{hasMore}
		on:loadMore={loadMore}
		on:viewProfile={(e) => viewUserProfile(e.detail)}
		on:userSelection={(e) => handleUserSelection(e.detail)}
	/>

	<!-- Loading More Indicator -->
	{#if loading && users.length > 0}
		<div class="flex justify-center py-4">
			<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
		</div>
	{/if}
</div>

<!-- User Profile Modal -->
{#if showUserProfile && selectedUser}
	<UserProfileModal
		user={selectedUser}
		on:close={() => (showUserProfile = false)}
		on:action={(e) => handleUserAction(e.detail.action, selectedUser.basicInfo._id, e.detail.data)}
	/>
{/if}

<!-- Bulk Actions Modal -->
{#if showBulkActions}
	<BulkActionModal
		userCount={selectedUserIds.length}
		on:close={() => (showBulkActions = false)}
		on:action={(e) => handleBulkAction(e.detail)}
	/>
{/if}

<style>
	/* Add any custom styles here */
</style>
