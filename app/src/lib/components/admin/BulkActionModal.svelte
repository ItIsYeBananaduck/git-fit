<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { BulkUserAction } from '$lib/types/admin';

	export let userCount: number;

	const dispatch = createEventDispatcher<{
		close: void;
		action: BulkUserAction;
	}>();

	let selectedAction: 'suspend' | 'activate' | 'delete' | 'send_message' = 'suspend';
	let reason = '';
	let duration: number | undefined = undefined;
	let message = '';
	let confirmText = '';

	$: requiredConfirmText = `CONFIRM ${selectedAction.toUpperCase()}`;
	$: canExecute =
		reason.trim() &&
		(selectedAction !== 'send_message' || message.trim()) &&
		confirmText === requiredConfirmText;

	function closeModal() {
		dispatch('close');
	}

	function executeAction() {
		if (!canExecute) return;

		const action: BulkUserAction = {
			action: selectedAction,
			reason: reason.trim(),
			duration: selectedAction === 'suspend' ? duration : undefined,
			message: selectedAction === 'send_message' ? message.trim() : undefined
		};

		dispatch('action', action);
	}

	function getActionDescription(action: string) {
		switch (action) {
			case 'suspend':
				return 'Temporarily suspend user accounts. Users will not be able to access the platform.';
			case 'activate':
				return 'Reactivate suspended user accounts. Users will regain access to the platform.';
			case 'delete':
				return 'Permanently delete user accounts and all associated data. This action cannot be undone.';
			case 'send_message':
				return 'Send a message to all selected users via email or in-app notification.';
			default:
				return '';
		}
	}

	function getActionColor(action: string) {
		switch (action) {
			case 'suspend':
				return 'text-orange-600 bg-orange-50 border-orange-200';
			case 'activate':
				return 'text-green-600 bg-green-50 border-green-200';
			case 'delete':
				return 'text-red-600 bg-red-50 border-red-200';
			case 'send_message':
				return 'text-blue-600 bg-blue-50 border-blue-200';
			default:
				return 'text-gray-600 bg-gray-50 border-gray-200';
		}
	}

	function getButtonColor(action: string) {
		switch (action) {
			case 'suspend':
				return 'bg-orange-600 hover:bg-orange-700';
			case 'activate':
				return 'bg-green-600 hover:bg-green-700';
			case 'delete':
				return 'bg-red-600 hover:bg-red-700';
			case 'send_message':
				return 'bg-blue-600 hover:bg-blue-700';
			default:
				return 'bg-gray-600 hover:bg-gray-700';
		}
	}
</script>

<!-- Modal Backdrop -->
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
	<div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
		<!-- Modal Header -->
		<div class="px-6 py-4 border-b border-gray-200">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">Bulk User Actions</h2>
				<button on:click={closeModal} class="text-gray-400 hover:text-gray-600 transition-colors">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
			<p class="text-gray-600 mt-1">
				Perform actions on {userCount} selected users
			</p>
		</div>

		<!-- Modal Content -->
		<div class="p-6 space-y-6">
			<!-- Action Selection -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-3"> Select Action </label>
				<div class="grid grid-cols-2 gap-3">
					<button
						on:click={() => (selectedAction = 'suspend')}
						class="p-4 text-left border-2 rounded-lg transition-colors {selectedAction === 'suspend'
							? 'border-orange-500 bg-orange-50'
							: 'border-gray-200 hover:border-gray-300'}"
					>
						<div class="font-medium text-gray-900">Suspend Users</div>
						<div class="text-sm text-gray-600 mt-1">Temporarily disable accounts</div>
					</button>

					<button
						on:click={() => (selectedAction = 'activate')}
						class="p-4 text-left border-2 rounded-lg transition-colors {selectedAction ===
						'activate'
							? 'border-green-500 bg-green-50'
							: 'border-gray-200 hover:border-gray-300'}"
					>
						<div class="font-medium text-gray-900">Activate Users</div>
						<div class="text-sm text-gray-600 mt-1">Reactivate suspended accounts</div>
					</button>

					<button
						on:click={() => (selectedAction = 'send_message')}
						class="p-4 text-left border-2 rounded-lg transition-colors {selectedAction ===
						'send_message'
							? 'border-blue-500 bg-blue-50'
							: 'border-gray-200 hover:border-gray-300'}"
					>
						<div class="font-medium text-gray-900">Send Message</div>
						<div class="text-sm text-gray-600 mt-1">Send notification to users</div>
					</button>

					<button
						on:click={() => (selectedAction = 'delete')}
						class="p-4 text-left border-2 rounded-lg transition-colors {selectedAction === 'delete'
							? 'border-red-500 bg-red-50'
							: 'border-gray-200 hover:border-gray-300'}"
					>
						<div class="font-medium text-gray-900">Delete Users</div>
						<div class="text-sm text-gray-600 mt-1 text-red-600">⚠️ Permanent action</div>
					</button>
				</div>
			</div>

			<!-- Action Description -->
			<div class="border rounded-lg p-4 {getActionColor(selectedAction)}">
				<div class="flex items-start">
					<div class="flex-shrink-0 mr-3 mt-0.5">
						{#if selectedAction === 'delete'}
							⚠️
						{:else if selectedAction === 'suspend'}
							⏸️
						{:else if selectedAction === 'activate'}
							▶️
						{:else}
							📧
						{/if}
					</div>
					<div>
						<h4 class="font-medium mb-1 capitalize">{selectedAction} {userCount} Users</h4>
						<p class="text-sm">{getActionDescription(selectedAction)}</p>
					</div>
				</div>
			</div>

			<!-- Action-specific Fields -->
			<div class="space-y-4">
				<!-- Reason (required for all actions) -->
				<div>
					<label for="reason" class="block text-sm font-medium text-gray-700 mb-2">
						Reason *
					</label>
					<textarea
						id="reason"
						bind:value={reason}
						placeholder="Enter reason for this action..."
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						rows="3"
						required
					></textarea>
				</div>

				<!-- Duration (for suspend action) -->
				{#if selectedAction === 'suspend'}
					<div>
						<label for="duration" class="block text-sm font-medium text-gray-700 mb-2">
							Suspension Duration (days)
						</label>
						<input
							id="duration"
							type="number"
							bind:value={duration}
							placeholder="Leave empty for indefinite suspension"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							min="1"
							max="365"
						/>
						<p class="text-xs text-gray-500 mt-1">
							If left empty, users will be suspended indefinitely until manually reactivated.
						</p>
					</div>
				{/if}

				<!-- Message (for send_message action) -->
				{#if selectedAction === 'send_message'}
					<div>
						<label for="message" class="block text-sm font-medium text-gray-700 mb-2">
							Message Content *
						</label>
						<textarea
							id="message"
							bind:value={message}
							placeholder="Enter the message to send to users..."
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							rows="4"
							required
						></textarea>
						<p class="text-xs text-gray-500 mt-1">
							This message will be sent to all selected users via email and in-app notification.
						</p>
					</div>
				{/if}
			</div>

			<!-- Confirmation -->
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
				<div class="flex items-start">
					<div class="flex-shrink-0 mr-3 mt-0.5">⚠️</div>
					<div class="flex-1">
						<h4 class="font-medium text-yellow-800 mb-2">Confirmation Required</h4>
						<p class="text-sm text-yellow-700 mb-3">
							This action will affect {userCount} users. To confirm, type
							<strong>{requiredConfirmText}</strong> below:
						</p>
						<input
							type="text"
							bind:value={confirmText}
							placeholder={requiredConfirmText}
							class="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Modal Footer -->
		<div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
			<button
				on:click={closeModal}
				class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
			>
				Cancel
			</button>
			<button
				on:click={executeAction}
				disabled={!canExecute}
				class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed {getButtonColor(
					selectedAction
				)}"
			>
				{selectedAction === 'delete'
					? 'Delete Users'
					: selectedAction === 'suspend'
						? 'Suspend Users'
						: selectedAction === 'activate'
							? 'Activate Users'
							: 'Send Message'}
			</button>
		</div>
	</div>
</div>
