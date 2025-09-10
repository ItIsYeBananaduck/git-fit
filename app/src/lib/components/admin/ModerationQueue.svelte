<script lang="ts">
	import { onMount } from 'svelte';
	import { contentModerationService } from '../../services/contentModerationService';
	import type { ModerationItem, ModerationDecision } from '../../types/admin';
	import type { Id } from '../../../convex/_generated/dataModel';

	// Props
	export let adminId: Id<'adminUsers'>;

	// State
	let moderationItems: ModerationItem[] = [];
	let selectedItem: ModerationItem | null = null;
	let loading = false;
	let error = '';
	let success = '';

	// Filters
	let filters = {
		itemType: '' as
			| ''
			| 'custom_exercise'
			| 'trainer_message'
			| 'user_report'
			| 'program_content'
			| 'user_profile',
		status: '' as '' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'escalated',
		priority: '' as '' | 'low' | 'medium' | 'high' | 'urgent',
		assignedTo: '',
		autoFlagged: undefined as boolean | undefined
	};

	// Pagination
	let currentPage = 1;
	let totalItems = 0;
	let hasMore = false;
	const pageSize = 20;

	// Moderation decision form
	let moderationDecision: ModerationDecision = {
		decision: 'approve',
		reason: '',
		modifications: null,
		followUpActions: [],
		notifyUser: true
	};

	let showDecisionModal = false;

	onMount(() => {
		loadModerationQueue();
	});

	async function loadModerationQueue() {
		try {
			loading = true;
			error = '';

			const result = await contentModerationService.getModerationQueue(
				{
					itemType: filters.itemType || undefined,
					status: filters.status || undefined,
					priority: filters.priority || undefined,
					assignedTo: filters.assignedTo || undefined,
					autoFlagged: filters.autoFlagged
				},
				adminId,
				pageSize,
				(currentPage - 1) * pageSize
			);

			moderationItems = result.items;
			totalItems = result.total;
			hasMore = result.hasMore;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load moderation queue';
		} finally {
			loading = false;
		}
	}

	async function selectItem(item: ModerationItem) {
		selectedItem = item;

		// Assign item to current admin if not already assigned
		if (!item.assignedTo) {
			try {
				await contentModerationService.assignModerationItem(item.itemId, adminId, adminId);
				await loadModerationQueue(); // Refresh to show assignment
			} catch (err) {
				console.error('Failed to assign item:', err);
			}
		}
	}

	function openDecisionModal(decision: 'approve' | 'reject' | 'modify' | 'escalate') {
		moderationDecision = {
			decision,
			reason: '',
			modifications: null,
			followUpActions: [],
			notifyUser: true
		};
		showDecisionModal = true;
	}

	async function submitModerationDecision() {
		if (!selectedItem) return;

		try {
			loading = true;
			error = '';
			success = '';

			await contentModerationService.reviewContent(
				selectedItem.itemId,
				moderationDecision,
				adminId
			);

			success = `Content ${moderationDecision.decision}d successfully`;
			showDecisionModal = false;
			selectedItem = null;

			// Refresh the queue
			await loadModerationQueue();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to submit moderation decision';
		} finally {
			loading = false;
		}
	}

	async function flagContent(contentId: string, contentType: string, reason: string) {
		try {
			await contentModerationService.flagInappropriateContent(
				contentId,
				contentType as any,
				reason,
				undefined,
				adminId
			);

			success = 'Content flagged for review';
			await loadModerationQueue();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to flag content';
		}
	}

	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'urgent':
				return 'text-red-600 bg-red-50 border-red-200';
			case 'high':
				return 'text-orange-600 bg-orange-50 border-orange-200';
			case 'medium':
				return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			case 'low':
				return 'text-green-600 bg-green-50 border-green-200';
			default:
				return 'text-gray-600 bg-gray-50 border-gray-200';
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'pending':
				return 'text-blue-600 bg-blue-50';
			case 'under_review':
				return 'text-yellow-600 bg-yellow-50';
			case 'approved':
				return 'text-green-600 bg-green-50';
			case 'rejected':
				return 'text-red-600 bg-red-50';
			case 'escalated':
				return 'text-purple-600 bg-purple-50';
			default:
				return 'text-gray-600 bg-gray-50';
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}

	function getItemTypeIcon(itemType: string): string {
		switch (itemType) {
			case 'custom_exercise':
				return '🏋️';
			case 'trainer_message':
				return '💬';
			case 'user_report':
				return '🚨';
			case 'program_content':
				return '📋';
			case 'user_profile':
				return '👤';
			default:
				return '📄';
		}
	}

	function clearMessages() {
		error = '';
		success = '';
	}
</script>

<div class="flex h-full bg-white">
	<!-- Moderation Queue List -->
	<div class="w-1/3 border-r border-gray-200 flex flex-col">
		<div class="p-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Moderation Queue</h2>

			<!-- Filters -->
			<div class="space-y-2">
				<select
					bind:value={filters.itemType}
					on:change={loadModerationQueue}
					class="w-full p-2 border border-gray-300 rounded-md text-sm"
				>
					<option value="">All Types</option>
					<option value="custom_exercise">Custom Exercises</option>
					<option value="trainer_message">Trainer Messages</option>
					<option value="user_report">User Reports</option>
					<option value="program_content">Program Content</option>
					<option value="user_profile">User Profiles</option>
				</select>

				<select
					bind:value={filters.status}
					on:change={loadModerationQueue}
					class="w-full p-2 border border-gray-300 rounded-md text-sm"
				>
					<option value="">All Statuses</option>
					<option value="pending">Pending</option>
					<option value="under_review">Under Review</option>
					<option value="approved">Approved</option>
					<option value="rejected">Rejected</option>
					<option value="escalated">Escalated</option>
				</select>

				<select
					bind:value={filters.priority}
					on:change={loadModerationQueue}
					class="w-full p-2 border border-gray-300 rounded-md text-sm"
				>
					<option value="">All Priorities</option>
					<option value="urgent">Urgent</option>
					<option value="high">High</option>
					<option value="medium">Medium</option>
					<option value="low">Low</option>
				</select>
			</div>
		</div>

		<!-- Status Messages -->
		{#if error}
			<div class="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
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
			<div class="mx-4 mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
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

		<!-- Items List -->
		<div class="flex-1 overflow-y-auto">
			{#if loading}
				<div class="p-4 text-center text-gray-500">Loading moderation items...</div>
			{:else if moderationItems.length === 0}
				<div class="p-4 text-center text-gray-500">No items in moderation queue</div>
			{:else}
				{#each moderationItems as item}
					<button
						class="w-full p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 text-left {selectedItem?._id ===
						item._id
							? 'bg-blue-50 border-blue-200'
							: ''}"
						on:click={() => selectItem(item)}
						on:keydown={(e) => e.key === 'Enter' && selectItem(item)}
					>
						<div class="flex items-start justify-between mb-2">
							<div class="flex items-center">
								<span class="text-lg mr-2">{getItemTypeIcon(item.itemType)}</span>
								<div>
									<h3 class="font-medium text-gray-900 text-sm">
										{item.itemType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
									</h3>
									<p class="text-xs text-gray-600">ID: {item.itemId}</p>
								</div>
							</div>
							<div class="flex flex-col items-end space-y-1">
								<span
									class="px-2 py-1 text-xs rounded-full border {getPriorityColor(item.priority)}"
								>
									{item.priority}
								</span>
								<span class="px-2 py-1 text-xs rounded-full {getStatusColor(item.status)}">
									{item.status.replace('_', ' ')}
								</span>
							</div>
						</div>

						{#if item.reportReason}
							<p class="text-xs text-gray-700 mb-2">
								<strong>Reason:</strong>
								{item.reportReason}
							</p>
						{/if}

						<div class="flex items-center justify-between text-xs text-gray-500">
							<span>{formatDate(item.createdAt)}</span>
							{#if item.autoFlagged}
								<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Auto-flagged</span>
							{/if}
						</div>

						{#if item.assignedTo}
							<div class="mt-2 text-xs text-blue-600">Assigned to admin</div>
						{/if}
					</button>
				{/each}
			{/if}
		</div>

		<!-- Pagination -->
		{#if totalItems > pageSize}
			<div class="p-4 border-t border-gray-200 flex justify-between items-center">
				<button
					on:click={() => {
						currentPage--;
						loadModerationQueue();
					}}
					disabled={currentPage === 1}
					class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50"
				>
					Previous
				</button>
				<span class="text-sm text-gray-600">
					Page {currentPage} of {Math.ceil(totalItems / pageSize)}
				</span>
				<button
					on:click={() => {
						currentPage++;
						loadModerationQueue();
					}}
					disabled={!hasMore}
					class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50"
				>
					Next
				</button>
			</div>
		{/if}
	</div>

	<!-- Item Details and Review -->
	<div class="flex-1 flex flex-col">
		{#if selectedItem}
			<!-- Item Header -->
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-start justify-between mb-4">
					<div>
						<h1 class="text-xl font-semibold text-gray-900 flex items-center">
							<span class="text-2xl mr-3">{getItemTypeIcon(selectedItem.itemType)}</span>
							{selectedItem.itemType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
						</h1>
						<p class="text-sm text-gray-600 mt-1">
							Created {formatDate(selectedItem.createdAt)}
							{#if selectedItem.reportedBy}
								• Reported by user
							{/if}
						</p>
					</div>

					<div class="flex items-center space-x-2">
						<span
							class="px-3 py-1 text-sm rounded-full border {getPriorityColor(
								selectedItem.priority
							)}"
						>
							{selectedItem.priority}
						</span>
						<span class="px-3 py-1 text-sm rounded-full {getStatusColor(selectedItem.status)}">
							{selectedItem.status.replace('_', ' ')}
						</span>
					</div>
				</div>

				{#if selectedItem.reportReason}
					<div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
						<h3 class="text-sm font-medium text-yellow-800 mb-1">Report Reason</h3>
						<p class="text-sm text-yellow-700">{selectedItem.reportReason}</p>
					</div>
				{/if}

				<!-- Action Buttons -->
				<div class="flex items-center space-x-3">
					<button
						on:click={() => openDecisionModal('approve')}
						class="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
					>
						Approve
					</button>
					<button
						on:click={() => openDecisionModal('reject')}
						class="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
					>
						Reject
					</button>
					<button
						on:click={() => openDecisionModal('modify')}
						class="px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700"
					>
						Modify
					</button>
					<button
						on:click={() => openDecisionModal('escalate')}
						class="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
					>
						Escalate
					</button>
				</div>
			</div>

			<!-- Content Preview -->
			<div class="flex-1 overflow-y-auto p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Content Preview</h3>

				<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
					<pre class="whitespace-pre-wrap text-sm text-gray-700">{JSON.stringify(
							selectedItem.content,
							null,
							2
						)}</pre>
				</div>

				{#if selectedItem.flags && selectedItem.flags.length > 0}
					<div class="mt-6">
						<h4 class="text-md font-medium text-gray-900 mb-2">Automated Flags</h4>
						<div class="flex flex-wrap gap-2">
							{#each selectedItem.flags as flag}
								<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">{flag}</span>
							{/each}
						</div>
					</div>
				{/if}

				{#if selectedItem.reviewNotes}
					<div class="mt-6">
						<h4 class="text-md font-medium text-gray-900 mb-2">Review Notes</h4>
						<p class="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-md p-3">
							{selectedItem.reviewNotes}
						</p>
					</div>
				{/if}
			</div>
		{:else}
			<div class="flex-1 flex items-center justify-center text-gray-500">
				Select an item from the moderation queue to review
			</div>
		{/if}
	</div>
</div>

<!-- Moderation Decision Modal -->
{#if showDecisionModal}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 class="text-lg font-medium text-gray-900 mb-4">
					{moderationDecision.decision.charAt(0).toUpperCase() +
						moderationDecision.decision.slice(1)} Content
				</h3>

				<div class="space-y-4">
					<div>
						<label for="reason" class="block text-sm font-medium text-gray-700 mb-1">Reason</label>
						<textarea
							id="reason"
							bind:value={moderationDecision.reason}
							required
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Explain your decision..."
						></textarea>
					</div>

					{#if moderationDecision.decision === 'modify'}
						<div>
							<label for="modifications" class="block text-sm font-medium text-gray-700 mb-1"
								>Modifications</label
							>
							<textarea
								id="modifications"
								bind:value={moderationDecision.modifications}
								rows="3"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="Describe the required modifications..."
							></textarea>
						</div>
					{/if}

					<div>
						<label class="flex items-center">
							<input type="checkbox" bind:checked={moderationDecision.notifyUser} class="mr-2" />
							<span class="text-sm text-gray-700">Notify user of this decision</span>
						</label>
					</div>
				</div>

				<div class="flex justify-end space-x-3 mt-6">
					<button
						on:click={() => (showDecisionModal = false)}
						class="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
					>
						Cancel
					</button>
					<button
						on:click={submitModerationDecision}
						disabled={!moderationDecision.reason.trim()}
						class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Submit Decision
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
