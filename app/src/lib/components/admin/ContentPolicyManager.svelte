<script lang="ts">
	import { onMount } from 'svelte';
	import { contentModerationService } from '../../services/contentModerationService.js';
	import type { ContentPolicy, PolicyRule } from '../../types/admin.js';
	import type { Id } from '../../../../convex/_generated/dataModel.js';

	// Props
	export let adminId: Id<'adminUsers'>;

	// State
	let contentPolicies: ContentPolicy[] = [];
	let selectedPolicy: ContentPolicy | null = null;
	let loading = false;
	let error = '';
	let success = '';

	// Policy form
	let policyForm = {
		type: '',
		rules: [] as PolicyRule[],
		autoEnforcement: false,
		severity: 'warning' as 'warning' | 'content_removal' | 'account_suspension'
	};

	// Rule form
	let ruleForm = {
		name: '',
		description: '',
		pattern: '',
		keywords: [] as string[],
		threshold: 0.8,
		action: 'flag' as 'flag' | 'auto_reject' | 'escalate'
	};

	let showPolicyModal = false;
	let showRuleModal = false;
	let editingPolicyIndex = -1;
	let editingRuleIndex = -1;
	let keywordInput = '';

	onMount(() => {
		loadContentPolicies();
	});

	async function loadContentPolicies() {
		try {
			loading = true;
			error = '';

			// For now, load some default policies since the backend returns mock data
			contentPolicies = [
				{
					type: 'inappropriate_language',
					rules: [
						{
							name: 'Profanity Filter',
							description: 'Detect and flag profane language',
							keywords: ['inappropriate', 'offensive'],
							threshold: 0.8,
							action: 'flag'
						}
					],
					autoEnforcement: true,
					severity: 'warning'
				},
				{
					type: 'spam_content',
					rules: [
						{
							name: 'Repetitive Content',
							description: 'Detect repetitive or spam-like content',
							threshold: 0.9,
							action: 'auto_reject'
						}
					],
					autoEnforcement: true,
					severity: 'content_removal'
				},
				{
					type: 'harassment',
					rules: [
						{
							name: 'Harassment Detection',
							description: 'Detect harassment and threatening behavior',
							keywords: ['threat', 'harassment', 'abuse'],
							threshold: 0.7,
							action: 'escalate'
						}
					],
					autoEnforcement: true,
					severity: 'account_suspension'
				}
			];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load content policies';
		} finally {
			loading = false;
		}
	}

	function openPolicyModal(policy?: ContentPolicy, index?: number) {
		if (policy && index !== undefined) {
			policyForm = { ...policy };
			editingPolicyIndex = index;
		} else {
			policyForm = {
				type: '',
				rules: [],
				autoEnforcement: false,
				severity: 'warning'
			};
			editingPolicyIndex = -1;
		}
		showPolicyModal = true;
	}

	function openRuleModal(rule?: PolicyRule, index?: number) {
		if (rule && index !== undefined) {
			ruleForm = {
				...rule,
				pattern: rule.pattern || '',
				keywords: rule.keywords || []
			};
			editingRuleIndex = index;
		} else {
			ruleForm = {
				name: '',
				description: '',
				pattern: '',
				keywords: [],
				threshold: 0.8,
				action: 'flag'
			};
			editingRuleIndex = -1;
		}
		showRuleModal = true;
	}

	function addKeyword() {
		if (keywordInput.trim() && !ruleForm.keywords.includes(keywordInput.trim())) {
			ruleForm.keywords = [...ruleForm.keywords, keywordInput.trim()];
			keywordInput = '';
		}
	}

	function removeKeyword(keyword: string) {
		ruleForm.keywords = ruleForm.keywords.filter((k) => k !== keyword);
	}

	function saveRule() {
		if (!ruleForm.name.trim() || !ruleForm.description.trim()) {
			error = 'Rule name and description are required';
			return;
		}

		if (editingRuleIndex >= 0) {
			policyForm.rules[editingRuleIndex] = { ...ruleForm };
		} else {
			policyForm.rules = [...policyForm.rules, { ...ruleForm }];
		}

		showRuleModal = false;
		editingRuleIndex = -1;
	}

	function removeRule(index: number) {
		policyForm.rules = policyForm.rules.filter((_, i) => i !== index);
	}

	async function savePolicy() {
		if (!policyForm.type.trim() || policyForm.rules.length === 0) {
			error = 'Policy type and at least one rule are required';
			return;
		}

		try {
			loading = true;
			error = '';
			success = '';

			await contentModerationService.setContentPolicy(policyForm, adminId);

			if (editingPolicyIndex >= 0) {
				contentPolicies[editingPolicyIndex] = { ...policyForm };
			} else {
				contentPolicies = [...contentPolicies, { ...policyForm }];
			}

			success = 'Content policy saved successfully';
			showPolicyModal = false;
			editingPolicyIndex = -1;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save content policy';
		} finally {
			loading = false;
		}
	}

	function deletePolicy(index: number) {
		if (confirm('Are you sure you want to delete this policy?')) {
			contentPolicies = contentPolicies.filter((_, i) => i !== index);
			success = 'Policy deleted successfully';
		}
	}

	async function applyAutomatedFiltering() {
		try {
			loading = true;
			error = '';
			success = '';

			const allRules = contentPolicies.flatMap((policy) => policy.rules);
			const result = await contentModerationService.automateContentFiltering(allRules, adminId);

			success = `Applied ${result.rulesApplied} rules and flagged ${result.itemsFlagged} items for review`;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to apply automated filtering';
		} finally {
			loading = false;
		}
	}

	function getSeverityColor(severity: string): string {
		switch (severity) {
			case 'warning':
				return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			case 'content_removal':
				return 'text-orange-600 bg-orange-50 border-orange-200';
			case 'account_suspension':
				return 'text-red-600 bg-red-50 border-red-200';
			default:
				return 'text-gray-600 bg-gray-50 border-gray-200';
		}
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

<div class="flex h-full bg-white">
	<!-- Policies List -->
	<div class="w-1/3 border-r border-gray-200 flex flex-col">
		<div class="p-4 border-b border-gray-200">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-gray-900">Content Policies</h2>
				<button
					on:click={() => openPolicyModal()}
					class="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
				>
					Add Policy
				</button>
			</div>

			<button
				on:click={applyAutomatedFiltering}
				disabled={loading || contentPolicies.length === 0}
				class="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Apply Automated Filtering
			</button>
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

		<!-- Policies List -->
		<div class="flex-1 overflow-y-auto">
			{#if loading}
				<div class="p-4 text-center text-gray-500">Loading content policies...</div>
			{:else if contentPolicies.length === 0}
				<div class="p-4 text-center text-gray-500">No content policies configured</div>
			{:else}
				{#each contentPolicies as policy, index}
					<div
						class="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 {selectedPolicy?.type ===
						policy.type
							? 'bg-blue-50 border-blue-200'
							: ''}"
						on:click={() => (selectedPolicy = policy)}
						on:keydown={(e) => e.key === 'Enter' && (selectedPolicy = policy)}
						role="button"
						tabindex="0"
					>
						<div class="flex items-start justify-between mb-2">
							<div>
								<h3 class="font-medium text-gray-900 text-sm">
									{policy.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
								</h3>
								<p class="text-xs text-gray-600">{policy.rules.length} rules</p>
							</div>
							<div class="flex flex-col items-end space-y-1">
								<span
									class="px-2 py-1 text-xs rounded-full border {getSeverityColor(policy.severity)}"
								>
									{policy.severity.replace(/_/g, ' ')}
								</span>
								{#if policy.autoEnforcement}
									<span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
										Auto-enforced
									</span>
								{/if}
							</div>
						</div>

						<div class="flex items-center justify-between text-xs text-gray-500">
							<span>{policy.rules.length} rule{policy.rules.length !== 1 ? 's' : ''}</span>
							<div class="flex space-x-2">
								<button
									on:click|stopPropagation={() => openPolicyModal(policy, index)}
									class="text-blue-600 hover:text-blue-800"
								>
									Edit
								</button>
								<button
									on:click|stopPropagation={() => deletePolicy(index)}
									class="text-red-600 hover:text-red-800"
								>
									Delete
								</button>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Policy Details -->
	<div class="flex-1 flex flex-col">
		{#if selectedPolicy}
			<!-- Policy Header -->
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-start justify-between mb-4">
					<div>
						<h1 class="text-xl font-semibold text-gray-900">
							{selectedPolicy.type
								.replace(/_/g, ' ')
								.replace(/\b\w/g, (l: string) => l.toUpperCase())}
						</h1>
						<p class="text-sm text-gray-600 mt-1">
							{selectedPolicy.rules.length} rule{selectedPolicy.rules.length !== 1 ? 's' : ''} configured
						</p>
					</div>

					<div class="flex items-center space-x-2">
						<span
							class="px-3 py-1 text-sm rounded-full border {getSeverityColor(
								selectedPolicy.severity
							)}"
						>
							{selectedPolicy.severity.replace(/_/g, ' ')}
						</span>
						{#if selectedPolicy.autoEnforcement}
							<span class="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
								Auto-enforced
							</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Rules List -->
			<div class="flex-1 overflow-y-auto p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-medium text-gray-900">Policy Rules</h3>
					<button
						on:click={() => openRuleModal()}
						class="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
					>
						Add Rule
					</button>
				</div>

				{#if selectedPolicy.rules.length === 0}
					<div class="text-center text-gray-500 py-8">No rules configured for this policy</div>
				{:else}
					<div class="space-y-4">
						{#each selectedPolicy.rules as rule, ruleIndex}
							<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
								<div class="flex items-start justify-between mb-3">
									<div>
										<h4 class="font-medium text-gray-900">{rule.name}</h4>
										<p class="text-sm text-gray-600 mt-1">{rule.description}</p>
									</div>
									<div class="flex items-center space-x-2">
										<span class="px-2 py-1 text-xs rounded-full {getActionColor(rule.action)}">
											{rule.action.replace(/_/g, ' ')}
										</span>
										<button
											on:click={() => openRuleModal(rule, ruleIndex)}
											class="text-blue-600 hover:text-blue-800 text-sm"
										>
											Edit
										</button>
									</div>
								</div>

								{#if rule.keywords && rule.keywords.length > 0}
									<div class="mb-2">
										<span class="text-xs font-medium text-gray-700">Keywords:</span>
										<div class="flex flex-wrap gap-1 mt-1">
											{#each rule.keywords as keyword}
												<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
													{keyword}
												</span>
											{/each}
										</div>
									</div>
								{/if}

								{#if rule.pattern}
									<div class="mb-2">
										<span class="text-xs font-medium text-gray-700">Pattern:</span>
										<code class="text-xs bg-gray-100 px-2 py-1 rounded ml-2">{rule.pattern}</code>
									</div>
								{/if}

								{#if rule.threshold !== undefined}
									<div>
										<span class="text-xs font-medium text-gray-700">Threshold:</span>
										<span class="text-xs text-gray-600 ml-2">{rule.threshold}</span>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{:else}
			<div class="flex-1 flex items-center justify-center text-gray-500">
				Select a content policy to view its details and rules
			</div>
		{/if}
	</div>
</div>

<!-- Policy Modal -->
{#if showPolicyModal}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 class="text-lg font-medium text-gray-900 mb-4">
					{editingPolicyIndex >= 0 ? 'Edit' : 'Add'} Content Policy
				</h3>

				<div class="space-y-4">
					<div>
						<label for="policyType" class="block text-sm font-medium text-gray-700 mb-1">
							Policy Type
						</label>
						<input
							id="policyType"
							type="text"
							bind:value={policyForm.type}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="e.g., inappropriate_language"
						/>
					</div>

					<div>
						<label for="severity" class="block text-sm font-medium text-gray-700 mb-1">
							Severity
						</label>
						<select
							id="severity"
							bind:value={policyForm.severity}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="warning">Warning</option>
							<option value="content_removal">Content Removal</option>
							<option value="account_suspension">Account Suspension</option>
						</select>
					</div>

					<div>
						<label class="flex items-center">
							<input type="checkbox" bind:checked={policyForm.autoEnforcement} class="mr-2" />
							<span class="text-sm text-gray-700">Enable automatic enforcement</span>
						</label>
					</div>

					<div>
						<h4 class="block text-sm font-medium text-gray-700 mb-2">
							Rules ({policyForm.rules.length})
						</h4>
						{#if policyForm.rules.length === 0}
							<p class="text-sm text-gray-500">No rules added yet</p>
						{:else}
							<div class="space-y-2 max-h-32 overflow-y-auto">
								{#each policyForm.rules as rule, index}
									<div class="flex items-center justify-between bg-gray-50 p-2 rounded">
										<span class="text-sm">{rule.name}</span>
										<button
											on:click={() => removeRule(index)}
											class="text-red-600 hover:text-red-800 text-sm"
										>
											Remove
										</button>
									</div>
								{/each}
							</div>
						{/if}
						<button
							on:click={() => openRuleModal()}
							class="mt-2 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
						>
							Add Rule
						</button>
					</div>
				</div>

				<div class="flex justify-end space-x-3 mt-6">
					<button
						on:click={() => (showPolicyModal = false)}
						class="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
					>
						Cancel
					</button>
					<button
						on:click={savePolicy}
						disabled={!policyForm.type.trim() || policyForm.rules.length === 0}
						class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Save Policy
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Rule Modal -->
{#if showRuleModal}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-10 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 class="text-lg font-medium text-gray-900 mb-4">
					{editingRuleIndex >= 0 ? 'Edit' : 'Add'} Rule
				</h3>

				<div class="space-y-4">
					<div>
						<label for="ruleName" class="block text-sm font-medium text-gray-700 mb-1">
							Rule Name
						</label>
						<input
							id="ruleName"
							type="text"
							bind:value={ruleForm.name}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="e.g., Profanity Filter"
						/>
					</div>

					<div>
						<label for="ruleDescription" class="block text-sm font-medium text-gray-700 mb-1">
							Description
						</label>
						<textarea
							id="ruleDescription"
							bind:value={ruleForm.description}
							required
							rows="2"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Describe what this rule does..."
						></textarea>
					</div>

					<div>
						<label for="ruleAction" class="block text-sm font-medium text-gray-700 mb-1">
							Action
						</label>
						<select
							id="ruleAction"
							bind:value={ruleForm.action}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="flag">Flag for Review</option>
							<option value="auto_reject">Auto Reject</option>
							<option value="escalate">Escalate</option>
						</select>
					</div>

					<div>
						<label for="ruleThreshold" class="block text-sm font-medium text-gray-700 mb-1">
							Threshold (0-1)
						</label>
						<input
							id="ruleThreshold"
							type="number"
							min="0"
							max="1"
							step="0.1"
							bind:value={ruleForm.threshold}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div>
						<label for="rulePattern" class="block text-sm font-medium text-gray-700 mb-1">
							Pattern (Optional)
						</label>
						<input
							id="rulePattern"
							type="text"
							bind:value={ruleForm.pattern}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Regular expression pattern"
						/>
					</div>

					<div>
						<label for="keywords" class="block text-sm font-medium text-gray-700 mb-2"
							>Keywords</label
						>
						<div class="flex space-x-2 mb-2">
							<input
								id="keywords"
								type="text"
								bind:value={keywordInput}
								on:keydown={(e) => e.key === 'Enter' && addKeyword()}
								class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="Add keyword..."
							/>
							<button
								on:click={addKeyword}
								class="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
							>
								Add
							</button>
						</div>
						{#if ruleForm.keywords.length > 0}
							<div class="flex flex-wrap gap-1">
								{#each ruleForm.keywords as keyword}
									<span
										class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded flex items-center"
									>
										{keyword}
										<button
											on:click={() => removeKeyword(keyword)}
											class="ml-1 text-blue-600 hover:text-blue-800"
											aria-label="Remove keyword"
										>
											×
										</button>
									</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<div class="flex justify-end space-x-3 mt-6">
					<button
						on:click={() => (showRuleModal = false)}
						class="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
					>
						Cancel
					</button>
					<button
						on:click={saveRule}
						disabled={!ruleForm.name.trim() || !ruleForm.description.trim()}
						class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Save Rule
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
