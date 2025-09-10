<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { DetailedUserProfile } from '$lib/types/admin';

	export let user: DetailedUserProfile;

	const dispatch = createEventDispatcher<{
		close: void;
		action: { action: string; data?: any };
	}>();

	let activeTab = 'overview';
	let showActionModal = false;
	let selectedAction = '';
	let actionReason = '';
	let actionDuration: number | undefined = undefined;

	function closeModal() {
		dispatch('close');
	}

	function openActionModal(action: string) {
		selectedAction = action;
		actionReason = '';
		actionDuration = undefined;
		showActionModal = true;
	}

	function executeAction() {
		const data: any = { reason: actionReason };

		if (actionDuration !== undefined) {
			data.duration = actionDuration;
		}

		dispatch('action', { action: selectedAction, data });
		showActionModal = false;
	}

	function formatDate(dateString?: string) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString();
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function getRiskColor(riskScore: number) {
		if (riskScore >= 70) return 'text-red-600 bg-red-50';
		if (riskScore >= 40) return 'text-yellow-600 bg-yellow-50';
		return 'text-green-600 bg-green-50';
	}

	function getEngagementColor(score: number) {
		if (score >= 0.7) return 'text-green-600';
		if (score >= 0.4) return 'text-yellow-600';
		return 'text-red-600';
	}
</script>

<!-- Modal Backdrop -->
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
	<div class="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
		<!-- Modal Header -->
		<div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
			<div class="flex items-center gap-4">
				<div class="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
					<span class="text-lg font-medium text-gray-700">
						{user.basicInfo.name.charAt(0).toUpperCase()}
					</span>
				</div>
				<div>
					<h2 class="text-xl font-semibold text-gray-900">{user.basicInfo.name}</h2>
					<p class="text-gray-600">{user.basicInfo.email}</p>
				</div>
			</div>
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

		<!-- Modal Content -->
		<div class="flex h-[calc(90vh-80px)]">
			<!-- Sidebar Navigation -->
			<div class="w-64 bg-gray-50 border-r border-gray-200 p-4">
				<nav class="space-y-2">
					<button
						on:click={() => (activeTab = 'overview')}
						class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors {activeTab ===
						'overview'
							? 'bg-blue-100 text-blue-700'
							: 'text-gray-600 hover:bg-gray-100'}"
					>
						Overview
					</button>
					<button
						on:click={() => (activeTab = 'activity')}
						class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors {activeTab ===
						'activity'
							? 'bg-blue-100 text-blue-700'
							: 'text-gray-600 hover:bg-gray-100'}"
					>
						Activity & Metrics
					</button>
					<button
						on:click={() => (activeTab = 'financial')}
						class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors {activeTab ===
						'financial'
							? 'bg-blue-100 text-blue-700'
							: 'text-gray-600 hover:bg-gray-100'}"
					>
						Financial Summary
					</button>
					<button
						on:click={() => (activeTab = 'support')}
						class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors {activeTab ===
						'support'
							? 'bg-blue-100 text-blue-700'
							: 'text-gray-600 hover:bg-gray-100'}"
					>
						Support History
					</button>
					<button
						on:click={() => (activeTab = 'moderation')}
						class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors {activeTab ===
						'moderation'
							? 'bg-blue-100 text-blue-700'
							: 'text-gray-600 hover:bg-gray-100'}"
					>
						Moderation History
					</button>
					<button
						on:click={() => (activeTab = 'devices')}
						class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors {activeTab ===
						'devices'
							? 'bg-blue-100 text-blue-700'
							: 'text-gray-600 hover:bg-gray-100'}"
					>
						Connected Devices
					</button>
				</nav>

				<!-- Action Buttons -->
				<div class="mt-8 space-y-2">
					<button
						on:click={() => openActionModal('warn')}
						class="w-full px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition-colors"
					>
						Issue Warning
					</button>
					<button
						on:click={() => openActionModal('suspend')}
						class="w-full px-3 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
					>
						Suspend User
					</button>
					<button
						on:click={() => openActionModal('impersonate')}
						class="w-full px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
					>
						Impersonate User
					</button>
					<button
						on:click={() => openActionModal('terminate')}
						class="w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
					>
						Terminate Account
					</button>
				</div>
			</div>

			<!-- Main Content -->
			<div class="flex-1 overflow-y-auto p-6">
				{#if activeTab === 'overview'}
					<div class="space-y-6">
						<!-- Basic Info -->
						<div class="grid grid-cols-2 gap-6">
							<div class="bg-gray-50 rounded-lg p-4">
								<h3 class="font-medium text-gray-900 mb-3">Account Information</h3>
								<dl class="space-y-2">
									<div class="flex justify-between">
										<dt class="text-sm text-gray-600">Role:</dt>
										<dd class="text-sm font-medium text-gray-900">{user.basicInfo.role}</dd>
									</div>
									<div class="flex justify-between">
										<dt class="text-sm text-gray-600">Status:</dt>
										<dd class="text-sm font-medium text-gray-900">
											{user.basicInfo.isActive ? 'Active' : 'Inactive'}
										</dd>
									</div>
									<div class="flex justify-between">
										<dt class="text-sm text-gray-600">Registered:</dt>
										<dd class="text-sm font-medium text-gray-900">
											{formatDate(user.basicInfo.createdAt)}
										</dd>
									</div>
									<div class="flex justify-between">
										<dt class="text-sm text-gray-600">Last Updated:</dt>
										<dd class="text-sm font-medium text-gray-900">
											{formatDate(user.basicInfo.updatedAt)}
										</dd>
									</div>
								</dl>
							</div>

							<div class="bg-gray-50 rounded-lg p-4">
								<h3 class="font-medium text-gray-900 mb-3">Risk Assessment</h3>
								<div class="text-center">
									<div class="text-3xl font-bold {getRiskColor(user.riskScore)} rounded-lg p-4">
										{user.riskScore}%
									</div>
									<p class="text-sm text-gray-600 mt-2">
										{user.riskScore >= 70
											? 'High Risk'
											: user.riskScore >= 40
												? 'Medium Risk'
												: 'Low Risk'}
									</p>
								</div>
							</div>
						</div>

						<!-- Subscription Info -->
						<div class="bg-gray-50 rounded-lg p-4">
							<h3 class="font-medium text-gray-900 mb-3">Subscription Details</h3>
							<dl class="grid grid-cols-2 gap-4">
								<div class="flex justify-between">
									<dt class="text-sm text-gray-600">Status:</dt>
									<dd class="text-sm font-medium text-gray-900">{user.subscriptionInfo.status}</dd>
								</div>
								<div class="flex justify-between">
									<dt class="text-sm text-gray-600">Tier:</dt>
									<dd class="text-sm font-medium text-gray-900">
										{user.subscriptionInfo.tier || 'N/A'}
									</dd>
								</div>
								<div class="flex justify-between">
									<dt class="text-sm text-gray-600">Start Date:</dt>
									<dd class="text-sm font-medium text-gray-900">
										{formatDate(user.subscriptionInfo.startDate)}
									</dd>
								</div>
								<div class="flex justify-between">
									<dt class="text-sm text-gray-600">Auto Renew:</dt>
									<dd class="text-sm font-medium text-gray-900">
										{user.subscriptionInfo.autoRenew ? 'Yes' : 'No'}
									</dd>
								</div>
							</dl>
						</div>
					</div>
				{:else if activeTab === 'activity'}
					<div class="space-y-6">
						<h3 class="text-lg font-medium text-gray-900">Activity & Engagement Metrics</h3>

						<div class="grid grid-cols-2 gap-6">
							<div class="bg-gray-50 rounded-lg p-4">
								<h4 class="font-medium text-gray-900 mb-3">Session Statistics</h4>
								<dl class="space-y-2">
									<div class="flex justify-between">
										<dt class="text-sm text-gray-600">Total Sessions:</dt>
										<dd class="text-sm font-medium text-gray-900">
											{user.activityMetrics.sessionCount}
										</dd>
									</div>
									<div class="flex justify-between">
										<dt class="text-sm text-gray-600">Avg Duration:</dt>
										<dd class="text-sm font-medium text-gray-900">
											{Math.round(user.activityMetrics.averageSessionDuration)} min
										</dd>
									</div>
									<div class="flex justify-between">
										<dt class="text-sm text-gray-600">Last Login:</dt>
										<dd class="text-sm font-medium text-gray-900">
											{formatDate(user.activityMetrics.lastLogin)}
										</dd>
									</div>
								</dl>
							</div>

							<div class="bg-gray-50 rounded-lg p-4">
								<h4 class="font-medium text-gray-900 mb-3">Engagement</h4>
								<div class="text-center">
									<div
										class="text-2xl font-bold {getEngagementColor(
											user.activityMetrics.engagementScore
										)}"
									>
										{Math.round(user.activityMetrics.engagementScore * 100)}%
									</div>
									<p class="text-sm text-gray-600 mt-1">Engagement Score</p>
								</div>
								<p class="text-xs text-gray-500 mt-2 text-center">
									Cohort: {user.activityMetrics.retentionCohort}
								</p>
							</div>
						</div>

						<!-- Feature Usage -->
						<div class="bg-gray-50 rounded-lg p-4">
							<h4 class="font-medium text-gray-900 mb-3">Feature Usage</h4>
							<div class="space-y-2">
								{#each Object.entries(user.activityMetrics.featureUsage) as [feature, usage]}
									<div class="flex justify-between items-center">
										<span class="text-sm text-gray-600 capitalize">{feature}:</span>
										<span class="text-sm font-medium text-gray-900">{usage}</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{:else if activeTab === 'financial'}
					<div class="space-y-6">
						<h3 class="text-lg font-medium text-gray-900">Financial Summary</h3>

						<div class="grid grid-cols-2 gap-6">
							<div class="bg-gray-50 rounded-lg p-4">
								<h4 class="font-medium text-gray-900 mb-3">Spending Overview</h4>
								<dl class="space-y-2">
									<div class="flex justify-between">
										<dt class="text-sm text-gray-600">Total Spent:</dt>
										<dd class="text-sm font-medium text-gray-900">
											{formatCurrency(user.financialSummary.totalSpent)}
										</dd>
									</div>
									<div class="flex justify-between">
										<dt class="text-sm text-gray-600">Total Refunds:</dt>
										<dd class="text-sm font-medium text-red-600">
											{formatCurrency(user.financialSummary.totalRefunds)}
										</dd>
									</div>
									<div class="flex justify-between">
										<dt class="text-sm text-gray-600">Avg Order Value:</dt>
										<dd class="text-sm font-medium text-gray-900">
											{formatCurrency(user.financialSummary.averageOrderValue)}
										</dd>
									</div>
									<div class="flex justify-between">
										<dt class="text-sm text-gray-600">Outstanding Balance:</dt>
										<dd class="text-sm font-medium text-gray-900">
											{formatCurrency(user.financialSummary.outstandingBalance)}
										</dd>
									</div>
								</dl>
							</div>

							<div class="bg-gray-50 rounded-lg p-4">
								<h4 class="font-medium text-gray-900 mb-3">Payment Information</h4>
								<dl class="space-y-2">
									<div class="flex justify-between">
										<dt class="text-sm text-gray-600">Last Payment:</dt>
										<dd class="text-sm font-medium text-gray-900">
											{formatDate(user.financialSummary.lastPayment)}
										</dd>
									</div>
									<div>
										<dt class="text-sm text-gray-600 mb-1">Payment Methods:</dt>
										<dd class="text-sm font-medium text-gray-900">
											{#each user.financialSummary.paymentMethods as method}
												<span
													class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1"
												>
													{method}
												</span>
											{/each}
										</dd>
									</div>
								</dl>
							</div>
						</div>
					</div>
				{:else if activeTab === 'support'}
					<div class="space-y-6">
						<h3 class="text-lg font-medium text-gray-900">Support History</h3>

						{#if user.supportHistory.length === 0}
							<div class="text-center py-8">
								<p class="text-gray-500">No support tickets found</p>
							</div>
						{:else}
							<div class="space-y-4">
								{#each user.supportHistory as ticket}
									<div class="bg-gray-50 rounded-lg p-4">
										<div class="flex justify-between items-start mb-2">
											<h4 class="font-medium text-gray-900">{ticket.subject}</h4>
											<span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
												{ticket.status}
											</span>
										</div>
										<p class="text-sm text-gray-600 mb-2">
											Created: {formatDate(ticket.createdAt)}
										</p>
										<p class="text-sm text-gray-500">
											{ticket.messages.length} messages
										</p>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{:else if activeTab === 'moderation'}
					<div class="space-y-6">
						<h3 class="text-lg font-medium text-gray-900">Moderation History</h3>

						{#if user.moderationHistory.length === 0}
							<div class="text-center py-8">
								<p class="text-gray-500">No moderation actions found</p>
							</div>
						{:else}
							<div class="space-y-4">
								{#each user.moderationHistory as action}
									<div class="bg-gray-50 rounded-lg p-4">
										<div class="flex justify-between items-start mb-2">
											<h4 class="font-medium text-gray-900 capitalize">{action.action}</h4>
											<span class="text-xs text-gray-500">{formatDate(action.timestamp)}</span>
										</div>
										<p class="text-sm text-gray-600">{action.reason}</p>
										{#if action.duration}
											<p class="text-xs text-gray-500 mt-1">Duration: {action.duration} days</p>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{:else if activeTab === 'devices'}
					<div class="space-y-6">
						<h3 class="text-lg font-medium text-gray-900">Connected Devices</h3>

						{#if user.deviceConnections.length === 0}
							<div class="text-center py-8">
								<p class="text-gray-500">No devices connected</p>
							</div>
						{:else}
							<div class="space-y-4">
								{#each user.deviceConnections as device}
									<div class="bg-gray-50 rounded-lg p-4">
										<div class="flex justify-between items-start mb-2">
											<h4 class="font-medium text-gray-900">{device.deviceType}</h4>
											<span
												class="text-xs px-2 py-1 rounded-full {device.isActive
													? 'bg-green-100 text-green-800'
													: 'bg-red-100 text-red-800'}"
											>
												{device.isActive ? 'Active' : 'Inactive'}
											</span>
										</div>
										<dl class="text-sm space-y-1">
											<div class="flex justify-between">
												<dt class="text-gray-600">Device ID:</dt>
												<dd class="text-gray-900 font-mono">{device.deviceId}</dd>
											</div>
											<div class="flex justify-between">
												<dt class="text-gray-600">Connected:</dt>
												<dd class="text-gray-900">{formatDate(device.connectedAt)}</dd>
											</div>
											<div class="flex justify-between">
												<dt class="text-gray-600">Last Sync:</dt>
												<dd class="text-gray-900">{formatDate(device.lastSync)}</dd>
											</div>
										</dl>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Action Modal -->
{#if showActionModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
		<div class="bg-white rounded-xl max-w-md w-full p-6">
			<h3 class="text-lg font-medium text-gray-900 mb-4 capitalize">
				{selectedAction} User
			</h3>

			<div class="space-y-4">
				<div>
					<label for="reason" class="block text-sm font-medium text-gray-700 mb-2">
						Reason *
					</label>
					<textarea
						id="reason"
						bind:value={actionReason}
						placeholder="Enter reason for this action..."
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						rows="3"
						required
					></textarea>
				</div>

				{#if selectedAction === 'suspend'}
					<div>
						<label for="duration" class="block text-sm font-medium text-gray-700 mb-2">
							Duration (days)
						</label>
						<input
							id="duration"
							type="number"
							bind:value={actionDuration}
							placeholder="Leave empty for indefinite"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							min="1"
						/>
					</div>
				{/if}
			</div>

			<div class="flex justify-end gap-3 mt-6">
				<button
					on:click={() => (showActionModal = false)}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
				>
					Cancel
				</button>
				<button
					on:click={executeAction}
					disabled={!actionReason.trim()}
					class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{selectedAction === 'terminate' ? 'Terminate' : 'Confirm'}
				</button>
			</div>
		</div>
	</div>
{/if}
