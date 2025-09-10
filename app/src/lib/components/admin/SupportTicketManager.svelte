<script lang="ts">
	import { onMount } from 'svelte';
	import { supportService } from '../../services/supportService';
	import { adminAuthService } from '../../services/adminAuth';
	import type { SupportTicket, SupportMessage } from '../../types/admin';
	import type { Id } from '../../../../convex/_generated/dataModel';

	// Props
	export let adminId: Id<'adminUsers'>;

	// State
	let tickets: SupportTicket[] = [];
	let selectedTicket: SupportTicket | null = null;
	let loading = false;
	let error = '';
	let filters = {
		status: '',
		priority: '',
		assignedTo: '',
		userId: ''
	};
	let newMessage = '';
	let isInternal = false;

	// Pagination
	let currentPage = 1;
	let totalTickets = 0;
	let hasMore = false;
	const pageSize = 20;

	onMount(() => {
		loadTickets();
	});

	async function loadTickets() {
		try {
			loading = true;
			error = '';

			const result = await supportService.getSupportTickets(
				{
					status: filters.status || undefined,
					priority: filters.priority || undefined,
					assignedTo: filters.assignedTo || undefined,
					userId: filters.userId || undefined
				},
				adminId,
				pageSize,
				(currentPage - 1) * pageSize
			);

			tickets = result.tickets;
			totalTickets = result.total;
			hasMore = result.hasMore;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load tickets';
		} finally {
			loading = false;
		}
	}

	async function selectTicket(ticket: SupportTicket) {
		try {
			selectedTicket = await supportService.getSupportTicketDetails(ticket.id, adminId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load ticket details';
		}
	}

	async function updateTicketStatus(status: string) {
		if (!selectedTicket) return;

		try {
			await supportService.updateSupportTicket(
				selectedTicket.id,
				{ status: status as any },
				adminId
			);

			// Refresh ticket details
			selectedTicket = await supportService.getSupportTicketDetails(selectedTicket.id, adminId);

			// Refresh tickets list
			await loadTickets();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update ticket';
		}
	}

	async function assignTicket(assignedTo: Id<'adminUsers'>) {
		if (!selectedTicket) return;

		try {
			await supportService.updateSupportTicket(selectedTicket.id, { assignedTo }, adminId);

			selectedTicket = await supportService.getSupportTicketDetails(selectedTicket.id, adminId);
			await loadTickets();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to assign ticket';
		}
	}

	async function addMessage() {
		if (!selectedTicket || !newMessage.trim()) return;

		try {
			await supportService.addTicketMessage(
				selectedTicket.id,
				{
					content: newMessage.trim(),
					isInternal
				},
				adminId,
				'admin'
			);

			newMessage = '';
			isInternal = false;

			// Refresh ticket details
			selectedTicket = await supportService.getSupportTicketDetails(selectedTicket.id, adminId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add message';
		}
	}

	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'urgent':
				return 'text-red-600 bg-red-50';
			case 'high':
				return 'text-orange-600 bg-orange-50';
			case 'medium':
				return 'text-yellow-600 bg-yellow-50';
			case 'low':
				return 'text-green-600 bg-green-50';
			default:
				return 'text-gray-600 bg-gray-50';
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'open':
				return 'text-blue-600 bg-blue-50';
			case 'in_progress':
				return 'text-yellow-600 bg-yellow-50';
			case 'resolved':
				return 'text-green-600 bg-green-50';
			case 'closed':
				return 'text-gray-600 bg-gray-50';
			default:
				return 'text-gray-600 bg-gray-50';
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}
</script>

<div class="flex h-full bg-white">
	<!-- Tickets List -->
	<div class="w-1/3 border-r border-gray-200 flex flex-col">
		<div class="p-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Support Tickets</h2>

			<!-- Filters -->
			<div class="space-y-2">
				<select
					bind:value={filters.status}
					on:change={loadTickets}
					class="w-full p-2 border border-gray-300 rounded-md text-sm"
				>
					<option value="">All Statuses</option>
					<option value="open">Open</option>
					<option value="in_progress">In Progress</option>
					<option value="resolved">Resolved</option>
					<option value="closed">Closed</option>
				</select>

				<select
					bind:value={filters.priority}
					on:change={loadTickets}
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

		<!-- Tickets List -->
		<div class="flex-1 overflow-y-auto">
			{#if loading}
				<div class="p-4 text-center text-gray-500">Loading tickets...</div>
			{:else if error}
				<div class="p-4 text-center text-red-600">{error}</div>
			{:else if tickets.length === 0}
				<div class="p-4 text-center text-gray-500">No tickets found</div>
			{:else}
				{#each tickets as ticket}
					<div
						class="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 {selectedTicket?.id ===
						ticket.id
							? 'bg-blue-50 border-blue-200'
							: ''}"
						on:click={() => selectTicket(ticket)}
					>
						<div class="flex items-start justify-between mb-2">
							<h3 class="font-medium text-gray-900 text-sm truncate">{ticket.subject}</h3>
							<span class="px-2 py-1 text-xs rounded-full {getPriorityColor(ticket.priority)}">
								{ticket.priority}
							</span>
						</div>

						<div class="flex items-center justify-between text-xs text-gray-500">
							<span class="px-2 py-1 rounded-full {getStatusColor(ticket.status)}">
								{ticket.status.replace('_', ' ')}
							</span>
							<span>{formatDate(ticket.createdAt)}</span>
						</div>

						<div class="mt-2 text-xs text-gray-600">
							User: {ticket.user?.name || 'Unknown'}
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Pagination -->
		{#if totalTickets > pageSize}
			<div class="p-4 border-t border-gray-200 flex justify-between items-center">
				<button
					on:click={() => {
						currentPage--;
						loadTickets();
					}}
					disabled={currentPage === 1}
					class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50"
				>
					Previous
				</button>
				<span class="text-sm text-gray-600">
					Page {currentPage} of {Math.ceil(totalTickets / pageSize)}
				</span>
				<button
					on:click={() => {
						currentPage++;
						loadTickets();
					}}
					disabled={!hasMore}
					class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50"
				>
					Next
				</button>
			</div>
		{/if}
	</div>

	<!-- Ticket Details -->
	<div class="flex-1 flex flex-col">
		{#if selectedTicket}
			<!-- Ticket Header -->
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-start justify-between mb-4">
					<div>
						<h1 class="text-xl font-semibold text-gray-900">{selectedTicket.subject}</h1>
						<p class="text-sm text-gray-600 mt-1">
							Created by {selectedTicket.user?.name} on {formatDate(selectedTicket.createdAt)}
						</p>
					</div>

					<div class="flex items-center space-x-2">
						<span
							class="px-3 py-1 text-sm rounded-full {getPriorityColor(selectedTicket.priority)}"
						>
							{selectedTicket.priority}
						</span>
						<span class="px-3 py-1 text-sm rounded-full {getStatusColor(selectedTicket.status)}">
							{selectedTicket.status.replace('_', ' ')}
						</span>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center space-x-4">
					<select
						value={selectedTicket.status}
						on:change={(e) => updateTicketStatus(e.target.value)}
						class="px-3 py-2 border border-gray-300 rounded-md text-sm"
					>
						<option value="open">Open</option>
						<option value="in_progress">In Progress</option>
						<option value="resolved">Resolved</option>
						<option value="closed">Closed</option>
					</select>

					<button
						on:click={() => assignTicket(adminId)}
						class="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
					>
						Assign to Me
					</button>
				</div>
			</div>

			<!-- Messages -->
			<div class="flex-1 overflow-y-auto p-6">
				<div class="space-y-4">
					{#each selectedTicket.messages as message}
						<div class="flex {message.senderType === 'admin' ? 'justify-end' : 'justify-start'}">
							<div
								class="max-w-2xl {message.senderType === 'admin'
									? 'bg-blue-50 border-blue-200'
									: 'bg-gray-50 border-gray-200'} border rounded-lg p-4"
							>
								<div class="flex items-center justify-between mb-2">
									<span class="text-sm font-medium text-gray-900">
										{message.senderInfo?.name || 'Unknown'}
									</span>
									<span class="text-xs text-gray-500">
										{formatDate(message.timestamp)}
									</span>
								</div>
								<p class="text-sm text-gray-700 whitespace-pre-wrap">{message.content}</p>
								{#if message.attachments && message.attachments.length > 0}
									<div class="mt-2">
										{#each message.attachments as attachment}
											<a href={attachment} class="text-xs text-blue-600 hover:underline block">
												📎 {attachment.split('/').pop()}
											</a>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Reply Form -->
			<div class="p-6 border-t border-gray-200">
				<div class="space-y-4">
					<textarea
						bind:value={newMessage}
						placeholder="Type your response..."
						rows="4"
						class="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					></textarea>

					<div class="flex items-center justify-between">
						<label class="flex items-center">
							<input type="checkbox" bind:checked={isInternal} class="mr-2" />
							<span class="text-sm text-gray-600">Internal note (not visible to user)</span>
						</label>

						<button
							on:click={addMessage}
							disabled={!newMessage.trim()}
							class="px-6 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Send Reply
						</button>
					</div>
				</div>
			</div>
		{:else}
			<div class="flex-1 flex items-center justify-center text-gray-500">
				Select a ticket to view details
			</div>
		{/if}
	</div>
</div>
