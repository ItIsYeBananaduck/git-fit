<script lang="ts">
	import { onMount } from 'svelte';
	import { contentModerationService } from '../../services/contentModerationService';
	import type { PolicyRule, ContentAnalytics } from '../../types/admin';
	import type { Id } from '../../../../../convex/_generated/dataModel';

	// Props
	export let adminId: Id<'adminUsers'>;

	// State
	let filteringRules: PolicyRule[] = [];
	let analytics: ContentAnalytics | null = null;
	let loading = false;
	let error = '';
	let success = '';

	// Filter configuration
	let filterConfig = {
		enableProfanityFilter: true,
		enableSpamDetection: true,
		enableHarassmentDetection: true,
		profanityThreshold: 0.8,
		spamThreshold: 0.9,
		harassmentThreshold: 0.7,
		autoRejectThreshold: 0.95,
		escalateThreshold: 0.85
	};

	// Analytics timeframe
	let analyticsTimeframe = {
		start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
		end: new Date().toISOString().split('T')[0] // today
	};

	onMount(() => {
		loadFilteringRules();
		loadAnalytics();
	});

	function loadFilteringRules() {
		// Generate filtering rules based on configuration
		filteringRules = [];

		if (filterConfig.enableProfanityFilter) {
			filteringRules.push({
				name: 'Profanity Detection',
				description: 'Automatically detect and flag profane language',
				keywords: ['profanity', 'inappropriate', 'offensive', 'vulgar'],
				threshold: filterConfig.profanityThreshold,
				action:
					filterConfig.profanityThreshold >= filterConfig.autoRejectThreshold
						? 'auto_reject'
						: 'flag'
			});
		}

		if (filterConfig.enableSpamDetection) {
			filteringRules.push({
				name: 'Spam Detection',
				description: 'Detect repetitive or spam-like content',
				pattern: '(.)\\1{4,}|(.{1,10})\\2{3,}', // Repetitive characters or phrases
				threshold: filterConfig.spamThreshold,
				action:
					filterConfig.spamThreshold >= filterConfig.autoRejectThreshold ? 'auto_reject' : 'flag'
			});
		}

		if (filterConfig.enableHarassmentDetection) {
			filteringRules.push({
				name: 'Harassment Detection',
				description: 'Detect harassment and threatening behavior',
				keywords: ['threat', 'harassment', 'abuse', 'bully', 'intimidate'],
				threshold: filterConfig.harassmentThreshold,
				action:
					filterConfig.harassmentThreshold >= filterConfig.escalateThreshold ? 'escalate' : 'flag'
			});
		}
	}

	async function loadAnalytics() {
		try {
			loading = true;
			error = '';

			analytics = await contentModerationService.getContentAnalytics(
				{
					start: analyticsTimeframe.start + 'T00:00:00.000Z',
					end: analyticsTimeframe.end + 'T23:59:59.999Z'
				},
				adminId
			);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load analytics';
		} finally {
			loading = false;
		}
	}

	async function applyFiltering() {
		try {
			loading = true;
			error = '';
			success = '';

			const result = await contentModerationService.automateContentFiltering(
				filteringRules,
				adminId
			);

			success = `Applied ${result.rulesApplied} filtering rules and flagged ${result.itemsFlagged} items for review`;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to apply automated filtering';
		} finally {
			loading = false;
		}
	}

	function updateFilteringRules() {
		loadFilteringRules();
		success = 'Filtering rules updated successfully';
	}

	function getThresholdColor(threshold: number): string {
		if (threshold >= 0.9) return 'text-red-600 bg-red-50';
		if (threshold >= 0.7) return 'text-orange-600 bg-orange-50';
		if (threshold >= 0.5) return 'text-yellow-600 bg-yellow-50';
		return 'text-green-600 bg-green-50';
	}

	function getActionColor(action: string): string {
		switch (action) {
			case 'flag':
				return 'text-blue-600 bg-blue-50';
			case 'auto_reject':
				return 'text-red-600 bg-red-50';
			case 'escalate':
				return 'text-purple-600 bg-purple-50';
			default:
				return 'text-gray-600 bg-gray-50';
		}
	}

	function clearMessages() {
		error = '';
		success = '';
	}
</script>

<div class="p-6 bg-white">
	<div class="mb-6">
		<h1 class="text-2xl font-semibold text-gray-900 mb-2">Automated Content Filtering</h1>
		<p class="text-gray-600">Configure and manage automated content moderation rules</p>
	</div>

	<!-- Status Messages -->
	{#if error}
		<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
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
		<div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
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

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Filter Configuration -->
		<div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
			<h2 class="text-lg font-medium text-gray-900 mb-4">Filter Configuration</h2>

			<div class="space-y-4">
				<!-- Profanity Filter -->
				<div class="border border-gray-200 rounded-lg p-4 bg-white">
					<div class="flex items-center justify-between mb-3">
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={filterConfig.enableProfanityFilter}
								on:change={updateFilteringRules}
								class="mr-2"
							/>
							<span class="font-medium text-gray-900">Profanity Filter</span>
						</label>
					</div>
					{#if filterConfig.enableProfanityFilter}
						<div>
							<label for="profanityThreshold" class="block text-sm text-gray-700 mb-1">
								Threshold: {filterConfig.profanityThreshold}
							</label>
							<input
								id="profanityThreshold"
								type="range"
								min="0.1"
								max="1"
								step="0.1"
								bind:value={filterConfig.profanityThreshold}
								on:change={updateFilteringRules}
								class="w-full"
							/>
						</div>
					{/if}
				</div>

				<!-- Spam Detection -->
				<div class="border border-gray-200 rounded-lg p-4 bg-white">
					<div class="flex items-center justify-between mb-3">
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={filterConfig.enableSpamDetection}
								on:change={updateFilteringRules}
								class="mr-2"
							/>
							<span class="font-medium text-gray-900">Spam Detection</span>
						</label>
					</div>
					{#if filterConfig.enableSpamDetection}
						<div>
							<label for="spamThreshold" class="block text-sm text-gray-700 mb-1">
								Threshold: {filterConfig.spamThreshold}
							</label>
							<input
								id="spamThreshold"
								type="range"
								min="0.1"
								max="1"
								step="0.1"
								bind:value={filterConfig.spamThreshold}
								on:change={updateFilteringRules}
								class="w-full"
							/>
						</div>
					{/if}
				</div>

				<!-- Harassment Detection -->
				<div class="border border-gray-200 rounded-lg p-4 bg-white">
					<div class="flex items-center justify-between mb-3">
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={filterConfig.enableHarassmentDetection}
								on:change={updateFilteringRules}
								class="mr-2"
							/>
							<span class="font-medium text-gray-900">Harassment Detection</span>
						</label>
					</div>
					{#if filterConfig.enableHarassmentDetection}
						<div>
							<label for="harassmentThreshold" class="block text-sm text-gray-700 mb-1">
								Threshold: {filterConfig.harassmentThreshold}
							</label>
							<input
								id="harassmentThreshold"
								type="range"
								min="0.1"
								max="1"
								step="0.1"
								bind:value={filterConfig.harassmentThreshold}
								on:change={updateFilteringRules}
								class="w-full"
							/>
						</div>
					{/if}
				</div>

				<!-- Action Thresholds -->
				<div class="border border-gray-200 rounded-lg p-4 bg-white">
					<h3 class="font-medium text-gray-900 mb-3">Action Thresholds</h3>
					<div class="space-y-3">
						<div>
							<label for="autoRejectThreshold" class="block text-sm text-gray-700 mb-1">
								Auto-reject threshold: {filterConfig.autoRejectThreshold}
							</label>
							<input
								id="autoRejectThreshold"
								type="range"
								min="0.5"
								max="1"
								step="0.05"
								bind:value={filterConfig.autoRejectThreshold}
								on:change={updateFilteringRules}
								class="w-full"
							/>
						</div>
						<div>
							<label for="escalateThreshold" class="block text-sm text-gray-700 mb-1">
								Escalate threshold: {filterConfig.escalateThreshold}
							</label>
							<input
								id="escalateThreshold"
								type="range"
								min="0.5"
								max="1"
								step="0.05"
								bind:value={filterConfig.escalateThreshold}
								on:change={updateFilteringRules}
								class="w-full"
							/>
						</div>
					</div>
				</div>

				<button
					on:click={applyFiltering}
					disabled={loading || filteringRules.length === 0}
					class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? 'Applying...' : 'Apply Filtering Rules'}
				</button>
			</div>
		</div>

		<!-- Active Rules and Analytics -->
		<div class="space-y-6">
			<!-- Active Rules -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
				<h2 class="text-lg font-medium text-gray-900 mb-4">Active Filtering Rules</h2>

				{#if filteringRules.length === 0}
					<p class="text-gray-500 text-center py-4">No filtering rules configured</p>
				{:else}
					<div class="space-y-3">
						{#each filteringRules as rule}
							<div class="bg-white border border-gray-200 rounded-lg p-3">
								<div class="flex items-start justify-between mb-2">
									<div>
										<h3 class="font-medium text-gray-900 text-sm">{rule.name}</h3>
										<p class="text-xs text-gray-600">{rule.description}</p>
									</div>
									<div class="flex items-center space-x-2">
										<span
											class="px-2 py-1 text-xs rounded-full {getThresholdColor(
												rule.threshold || 0
											)}"
										>
											{((rule.threshold || 0) * 100).toFixed(0)}%
										</span>
										<span class="px-2 py-1 text-xs rounded-full {getActionColor(rule.action)}">
											{rule.action.replace('_', ' ')}
										</span>
									</div>
								</div>

								{#if rule.keywords && rule.keywords.length > 0}
									<div class="flex flex-wrap gap-1 mt-2">
										{#each rule.keywords.slice(0, 3) as keyword}
											<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
												{keyword}
											</span>
										{/each}
										{#if rule.keywords.length > 3}
											<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
												+{rule.keywords.length - 3} more
											</span>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Analytics -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-medium text-gray-900">Content Analytics</h2>
					<button
						on:click={loadAnalytics}
						disabled={loading}
						class="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 disabled:opacity-50"
					>
						Refresh
					</button>
				</div>

				<div class="flex space-x-2 mb-4">
					<input
						type="date"
						bind:value={analyticsTimeframe.start}
						class="px-3 py-2 border border-gray-300 rounded-md text-sm"
					/>
					<span class="flex items-center text-gray-500">to</span>
					<input
						type="date"
						bind:value={analyticsTimeframe.end}
						class="px-3 py-2 border border-gray-300 rounded-md text-sm"
					/>
					<button
						on:click={loadAnalytics}
						class="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
					>
						Update
					</button>
				</div>

				{#if loading}
					<div class="text-center py-4 text-gray-500">Loading analytics...</div>
				{:else if analytics}
					<div class="grid grid-cols-2 gap-4">
						<div class="bg-white p-3 rounded-lg border border-gray-200">
							<div class="text-2xl font-semibold text-gray-900">{analytics.totalItems}</div>
							<div class="text-sm text-gray-600">Total Items</div>
						</div>
						<div class="bg-white p-3 rounded-lg border border-gray-200">
							<div class="text-2xl font-semibold text-orange-600">{analytics.pendingReview}</div>
							<div class="text-sm text-gray-600">Pending Review</div>
						</div>
						<div class="bg-white p-3 rounded-lg border border-gray-200">
							<div class="text-2xl font-semibold text-green-600">{analytics.approvedToday}</div>
							<div class="text-sm text-gray-600">Approved Today</div>
						</div>
						<div class="bg-white p-3 rounded-lg border border-gray-200">
							<div class="text-2xl font-semibold text-red-600">{analytics.rejectedToday}</div>
							<div class="text-sm text-gray-600">Rejected Today</div>
						</div>
						<div class="bg-white p-3 rounded-lg border border-gray-200">
							<div class="text-2xl font-semibold text-blue-600">{analytics.flaggedByAI}</div>
							<div class="text-sm text-gray-600">AI Flagged</div>
						</div>
						<div class="bg-white p-3 rounded-lg border border-gray-200">
							<div class="text-2xl font-semibold text-purple-600">{analytics.escalatedItems}</div>
							<div class="text-sm text-gray-600">Escalated</div>
						</div>
					</div>

					{#if analytics.averageReviewTime > 0}
						<div class="mt-4 bg-white p-3 rounded-lg border border-gray-200">
							<div class="text-lg font-semibold text-gray-900">
								{analytics.averageReviewTime.toFixed(1)}h
							</div>
							<div class="text-sm text-gray-600">Average Review Time</div>
						</div>
					{/if}
				{:else}
					<div class="text-center py-4 text-gray-500">No analytics data available</div>
				{/if}
			</div>
		</div>
	</div>
</div>
