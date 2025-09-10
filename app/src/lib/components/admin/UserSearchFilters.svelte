<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { UserSearchCriteria } from '$lib/types/admin';

	export let loading = false;

	const dispatch = createEventDispatcher<{
		search: UserSearchCriteria;
	}>();

	// Form state
	let query = '';
	let role: 'client' | 'trainer' | 'admin' | undefined = undefined;
	let subscriptionStatus: 'active' | 'inactive' | 'cancelled' | undefined = undefined;
	let activityLevel: 'high' | 'medium' | 'low' | 'inactive' | undefined = undefined;
	let dateRangeStart = '';
	let dateRangeEnd = '';
	let showAdvanced = false;

	function handleSearch() {
		const criteria: UserSearchCriteria = {
			query: query.trim() || undefined,
			role,
			subscriptionStatus,
			activityLevel,
			dateRange:
				dateRangeStart && dateRangeEnd
					? {
							start: dateRangeStart,
							end: dateRangeEnd
						}
					: undefined
		};

		dispatch('search', criteria);
	}

	function clearFilters() {
		query = '';
		role = undefined;
		subscriptionStatus = undefined;
		activityLevel = undefined;
		dateRangeStart = '';
		dateRangeEnd = '';
		handleSearch();
	}

	// Auto-search on query change with debounce
	let searchTimeout: NodeJS.Timeout;
	$: if (query !== undefined) {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			if (query.length === 0 || query.length >= 2) {
				handleSearch();
			}
		}, 300);
	}
</script>

<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
	<div class="space-y-4">
		<!-- Basic Search -->
		<div class="flex items-center gap-4">
			<div class="flex-1">
				<label for="search" class="block text-sm font-medium text-gray-700 mb-2">
					Search Users
				</label>
				<div class="relative">
					<input
						id="search"
						type="text"
						bind:value={query}
						placeholder="Search by name or email..."
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						disabled={loading}
					/>
					<div class="absolute inset-y-0 right-0 flex items-center pr-3">
						{#if loading}
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
						{:else}
							<svg
								class="h-4 w-4 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						{/if}
					</div>
				</div>
			</div>

			<div class="flex items-end gap-2">
				<button
					type="button"
					on:click={() => (showAdvanced = !showAdvanced)}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
				>
					{showAdvanced ? 'Hide' : 'Show'} Filters
				</button>

				<button
					type="button"
					on:click={clearFilters}
					class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
					disabled={loading}
				>
					Clear All
				</button>
			</div>
		</div>

		<!-- Advanced Filters -->
		{#if showAdvanced}
			<div
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200"
			>
				<!-- Role Filter -->
				<div>
					<label for="role" class="block text-sm font-medium text-gray-700 mb-2"> Role </label>
					<select
						id="role"
						bind:value={role}
						on:change={handleSearch}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						disabled={loading}
					>
						<option value={undefined}>All Roles</option>
						<option value="client">Client</option>
						<option value="trainer">Trainer</option>
						<option value="admin">Admin</option>
					</select>
				</div>

				<!-- Subscription Status Filter -->
				<div>
					<label for="subscription" class="block text-sm font-medium text-gray-700 mb-2">
						Subscription
					</label>
					<select
						id="subscription"
						bind:value={subscriptionStatus}
						on:change={handleSearch}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						disabled={loading}
					>
						<option value={undefined}>All Statuses</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
						<option value="cancelled">Cancelled</option>
					</select>
				</div>

				<!-- Activity Level Filter -->
				<div>
					<label for="activity" class="block text-sm font-medium text-gray-700 mb-2">
						Activity Level
					</label>
					<select
						id="activity"
						bind:value={activityLevel}
						on:change={handleSearch}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						disabled={loading}
					>
						<option value={undefined}>All Levels</option>
						<option value="high">High</option>
						<option value="medium">Medium</option>
						<option value="low">Low</option>
						<option value="inactive">Inactive</option>
					</select>
				</div>

				<!-- Date Range -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2"> Registration Date </label>
					<div class="space-y-2">
						<input
							type="date"
							bind:value={dateRangeStart}
							on:change={handleSearch}
							placeholder="Start date"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
							disabled={loading}
						/>
						<input
							type="date"
							bind:value={dateRangeEnd}
							on:change={handleSearch}
							placeholder="End date"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
							disabled={loading}
						/>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
