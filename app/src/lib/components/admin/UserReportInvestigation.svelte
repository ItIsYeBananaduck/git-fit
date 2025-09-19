<script lang="ts">
	import { onMount } from 'svelte';
	import { userReportService } from '../../services/userReportService.js';
	import type {
		UserReport,
		Investigation,
		ModerationAction
	} from '../../services/userReportService.js';
	import type { Id } from '../../../../../convex/_generated/dataModel.js';

	// Props
	export let adminId: Id<'adminUsers'>;

	// State
	let userReports: UserReport[] = [];
	let selectedReport: UserReport | null = null;
	let moderationActions: ModerationAction[] = [];
	let loading = false;
	let error = '';
	let success = '';

	// Filters
	let filters = {
		userId: '',
		reportType: '' as
			| ''
			| 'harassment'
			| 'inappropriate_content'
			| 'spam'
			| 'fake_profile'
			| 'safety_concern'
			| 'other',
		status: '' as '' | 'pending' | 'under_review' | 'resolved' | 'dismissed'
	};

	// Pagination
	let currentPage = 1;
	let totalReports = 0;
	let hasMore = false;
	const pageSize = 20;

	// Investigation form
	let investigationForm: Investigation = {
		investigatorId: adminId,
		findings: '',
		evidence: [],
		recommendation: 'dismiss',
		actionTaken: '',
		followUpRequired: false,
		investigatedAt: new Date().toISOString()
	};

	let showInvestigationModal = false;
	let evidenceInput = '';

	// Report creation form
	let reportForm = {
		reportedUserId: '',
		reportType: 'other' as
			| 'harassment'
			| 'inappropriate_content'
			| 'spam'
			| 'fake_profile'
			| 'safety_concern'
			| 'other',
		reason: '',
		description: '',
		evidence: [] as string[],
		relatedContentId: ''
	};

	let showReportModal = false;

	onMount(() => {
		loadUserReports();
		loadModerationActions();
	});

	async function loadUserReports() {
		try {
			loading = true;
			error = '';

			const result = await userReportService.getUserReports(
				{
					userId: filters.userId ? (filters.userId as Id<'users'>) : undefined,
					reportType: filters.reportType || undefined,
					status: filters.status || undefined
				},
				adminId,
				pageSize,
				(currentPage - 1) * pageSize
			);

			userReports = result.reports;
			totalReports = result.total;
			hasMore = result.hasMore;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load user reports';
		} finally {
			loading = false;
		}
	}

	async function loadModerationActions() {
		try {
			const actions = await userReportService.getModerationActions(
				{
					startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
					endDate: new Date().toISOString()
				},
				adminId,
				50
			);

			moderationActions = actions;
		} catch (err) {
			console.error('Failed to load moderation actions:', err);
		}
	}

	function selectReport(report: UserReport) {
		selectedReport = report;
		// Reset investigation form
		investigationForm = {
			investigatorId: adminId,
			findings: '',
			evidence: [],
			recommendation: 'dismiss',
			actionTaken: '',
			followUpRequired: false,
			investigatedAt: new Date().toISOString()
		};
	}

	function openInvestigationModal() {
		if (!selectedReport) return;
		showInvestigationModal = true;
	}

	function addEvidence() {
		if (evidenceInput.trim() && !investigationForm.evidence.includes(evidenceInput.trim())) {
			investigationForm.evidence = [...investigationForm.evidence, evidenceInput.trim()];
			evidenceInput = '';
		}
	}

	function removeEvidence(evidence: string) {
		investigationForm.evidence = investigationForm.evidence.filter((e) => e !== evidence);
	}

	async function submitInvestigation() {
		if (!selectedReport) return;

		try {
			loading = true;
			error = '';
			success = '';

			await userReportService.investigateUserReport(selectedReport._id, investigationForm, adminId);

			success = `Investigation completed with recommendation: ${investigationForm.recommendation}`;
			showInvestigationModal = false;
			selectedReport = null;

			// Refresh data
			await loadUserReports();
			await loadModerationActions();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to submit investigation';
		} finally {
			loading = false;
		}
	}

	async function createUserReport() {
		try {
			loading = true;
			error = '';
			success = '';

			await userReportService.createUserReport({
				reportedUserId: reportForm.reportedUserId as Id<'users'>,
				reportedBy: adminId as Id<'users'>, // Cast adminId to users Id for reporting
				reportType: reportForm.reportType,
				reason: reportForm.reason,
				description: reportForm.description,
				evidence: reportForm.evidence.length > 0 ? reportForm.evidence : undefined,
				relatedContentId: reportForm.relatedContentId || undefined
			});

			success = 'User report created successfully';
			showReportModal = false;

			// Reset form
			reportForm = {
				reportedUserId: '',
				reportType: 'other',
				reason: '',
				description: '',
				evidence: [],
				relatedContentId: ''
			};

			// Refresh reports
			await loadUserReports();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create user report';
		} finally {
			loading = false;
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
			case 'resolved':
				return 'text-green-600 bg-green-50';
			case 'dismissed':
				return 'text-gray-600 bg-gray-50';
			default:
				return 'text-gray-600 bg-gray-50';
		}
	}

	function getReportTypeIcon(reportType: string): string {
		switch (reportType) {
			case 'harassment':
				return '🚨';
			case 'inappropriate_content':
				return '⚠️';
			case 'spam':
				return '📧';
			case 'fake_profile':
				return '👤';
			case 'safety_concern':
				return '🛡️';
			default:
				return '📋';
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}

	function clearMessages() {
		error = '';
		success = '';
	}
</script>

<div class="flex h-full bg-white">
	<!-- Reports List -->
	<div class="w-1/3 border-r border-gray-200 flex flex-col">
		<div class="p-4 border-b border-gray-200">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-gray-900">User Reports</h2>
				<button
					on:click={() => (showReportModal = true)}
					class="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
				>
					Create Report
				</button>
			</div>

			<!-- Filters -->
			<div class="space-y-2">
				<input
					type="text"
					bind:value={filters.userId}
					on:input={loadUserReports}
					placeholder="User ID..."
					class="w-full p-2 border border-gray-300 rounded-md text-sm"
				/>

				<select
					bind:value={filters.reportType}
					on:change={loadUserReports}
					class="w-full p-2 border border-gray-300 rounded-md text-sm"
				>
					<option value="">All Types</option>
					<option value="harassment">Harassment</option>
					<option value="inappropriate_content">Inappropriate Content</option>
					<option value="spam">Spam</option>
					<option value="fake_profile">Fake Profile</option>
					<option value="safety_concern">Safety Concern</option>
					<option value="other">Other</option>
				</select>

				<select
					bind:value={filters.status}
					on:change={loadUserReports}
					class="w-full p-2 border border-gray-300 rounded-md text-sm"
				>
					<option value="">All Statuses</option>
					<option value="pending">Pending</option>
					<option value="under_review">Under Review</option>
					<option value="resolved">Resolved</option>
					<option value="dismissed">Dismissed</option>
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

		<!-- Reports List -->
		<div class="flex-1 overflow-y-auto">
			{#if loading}
				<div class="p-4 text-center text-gray-500">Loading user reports...</div>
			{:else if userReports.length === 0}
				<div class="p-4 text-center text-gray-500">No user reports found</div>
			{:else}
				{#each userReports as report}
					<button
						class="w-full p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 text-left {selectedReport?._id ===
						report._id
							? 'bg-blue-50 border-blue-200'
							: ''}"
						on:click={() => selectReport(report)}
					>
						<div class="flex items-start justify-between mb-2">
							<div class="flex items-center">
								<span class="text-lg mr-2">{getReportTypeIcon(report.reportType)}</span>
								<div>
									<h3 class="font-medium text-gray-900 text-sm">
										{report.reportType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
									</h3>
									<p class="text-xs text-gray-600">User: {report.reportedUserId}</p>
								</div>
							</div>
							<div class="flex flex-col items-end space-y-1">
								<span
									class="px-2 py-1 text-xs rounded-full border {getPriorityColor(report.priority)}"
								>
									{report.priority}
								</span>
								<span class="px-2 py-1 text-xs rounded-full {getStatusColor(report.status)}">
									{report.status.replace('_', ' ')}
								</span>
							</div>
						</div>

						<p class="text-xs text-gray-700 mb-2 line-clamp-2">
							<strong>Reason:</strong>
							{report.reason}
						</p>

						<div class="flex items-center justify-between text-xs text-gray-500">
							<span>{formatDate(report.createdAt)}</span>
							{#if report.assignedTo}
								<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">Assigned</span>
							{/if}
						</div>
					</button>
				{/each}
			{/if}
		</div>

		<!-- Pagination -->
		{#if totalReports > pageSize}
			<div class="p-4 border-t border-gray-200 flex justify-between items-center">
				<button
					on:click={() => {
						currentPage--;
						loadUserReports();
					}}
					disabled={currentPage === 1}
					class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50"
				>
					Previous
				</button>
				<span class="text-sm text-gray-600">
					Page {currentPage} of {Math.ceil(totalReports / pageSize)}
				</span>
				<button
					on:click={() => {
						currentPage++;
						loadUserReports();
					}}
					disabled={!hasMore}
					class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50"
				>
					Next
				</button>
			</div>
		{/if}
	</div>

	<!-- Report Details and Investigation -->
	<div class="flex-1 flex flex-col">
		{#if selectedReport}
			<!-- Report Header -->
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-start justify-between mb-4">
					<div>
						<h1 class="text-xl font-semibold text-gray-900 flex items-center">
							<span class="text-2xl mr-3">{getReportTypeIcon(selectedReport.reportType)}</span>
							{selectedReport.reportType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
							Report
						</h1>
						<p class="text-sm text-gray-600 mt-1">
							Reported {formatDate(selectedReport.createdAt)}
							{#if selectedReport.reviewedAt}
								• Reviewed {formatDate(selectedReport.reviewedAt)}
							{/if}
						</p>
					</div>

					<div class="flex items-center space-x-2">
						<span
							class="px-3 py-1 text-sm rounded-full border {getPriorityColor(
								selectedReport.priority
							)}"
						>
							{selectedReport.priority}
						</span>
						<span class="px-3 py-1 text-sm rounded-full {getStatusColor(selectedReport.status)}">
							{selectedReport.status.replace('_', ' ')}
						</span>
					</div>
				</div>

				<!-- Action Buttons -->
				{#if selectedReport.status === 'pending' || selectedReport.status === 'under_review'}
					<div class="flex items-center space-x-3">
						<button
							on:click={openInvestigationModal}
							class="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
						>
							Start Investigation
						</button>
					</div>
				{/if}
			</div>

			<!-- Report Details -->
			<div class="flex-1 overflow-y-auto p-6">
				<div class="space-y-6">
					<!-- Basic Information -->
					<div>
						<h3 class="text-lg font-medium text-gray-900 mb-3">Report Details</h3>
						<div class="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
							<div>
								<span class="text-sm font-medium text-gray-700">Reported User:</span>
								<span class="text-sm text-gray-900 ml-2">{selectedReport.reportedUserId}</span>
							</div>
							<div>
								<span class="text-sm font-medium text-gray-700">Reported By:</span>
								<span class="text-sm text-gray-900 ml-2">{selectedReport.reportedBy}</span>
							</div>
							<div>
								<span class="text-sm font-medium text-gray-700">Reason:</span>
								<span class="text-sm text-gray-900 ml-2">{selectedReport.reason}</span>
							</div>
							{#if selectedReport.description}
								<div>
									<span class="text-sm font-medium text-gray-700">Description:</span>
									<p class="text-sm text-gray-900 mt-1">{selectedReport.description}</p>
								</div>
							{/if}
							{#if selectedReport.relatedContentId}
								<div>
									<span class="text-sm font-medium text-gray-700">Related Content:</span>
									<span class="text-sm text-gray-900 ml-2">{selectedReport.relatedContentId}</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Evidence -->
					{#if selectedReport.evidence && selectedReport.evidence.length > 0}
						<div>
							<h4 class="text-md font-medium text-gray-900 mb-2">Evidence</h4>
							<div class="space-y-2">
								{#each selectedReport.evidence as evidence}
									<div class="bg-blue-50 border border-blue-200 rounded-md p-3">
										<a
											href={evidence}
											target="_blank"
											class="text-blue-600 hover:text-blue-800 text-sm"
										>
											{evidence}
										</a>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Investigation Results -->
					{#if false}
						<div>
							<h4 class="text-md font-medium text-gray-900 mb-2">Investigation Results</h4>
							<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
								<div>
									<span class="text-sm font-medium text-gray-700">Findings:</span>
									<p class="text-sm text-gray-900 mt-1">Findings not available</p>
								</div>
								<div>
									<span class="text-sm font-medium text-gray-700">Recommendation:</span>
									<span class="text-sm text-gray-900 ml-2">Recommendation not available</span>
								</div>
								{#if false}
									<div>
										<span class="text-sm font-medium text-gray-700">Action Taken:</span>
										<span class="text-sm text-gray-900 ml-2">Action not available</span>
									</div>
								{/if}
								<div>
									<span class="text-sm font-medium text-gray-700">Investigated:</span>
									<span class="text-sm text-gray-900 ml-2">Date not available</span>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="flex-1 flex items-center justify-center text-gray-500">
				Select a user report to view details and start investigation
			</div>
		{/if}
	</div>
</div>

<!-- Investigation Modal -->
{#if showInvestigationModal}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Investigation Report</h3>

				<div class="space-y-4">
					<div>
						<label for="findings" class="block text-sm font-medium text-gray-700 mb-1"
							>Findings</label
						>
						<textarea
							id="findings"
							bind:value={investigationForm.findings}
							required
							rows="4"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Describe your investigation findings..."
						></textarea>
					</div>

					<div>
						<label for="recommendation" class="block text-sm font-medium text-gray-700 mb-1"
							>Recommendation</label
						>
						<select
							id="recommendation"
							bind:value={investigationForm.recommendation}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="dismiss">Dismiss Report</option>
							<option value="warn_user">Warn User</option>
							<option value="suspend_user">Suspend User</option>
							<option value="ban_user">Ban User</option>
							<option value="remove_content">Remove Content</option>
							<option value="escalate">Escalate</option>
						</select>
					</div>

					<div>
						<label for="actionTaken" class="block text-sm font-medium text-gray-700 mb-1"
							>Action Taken (Optional)</label
						>
						<input
							id="actionTaken"
							type="text"
							bind:value={investigationForm.actionTaken}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Describe any immediate actions taken..."
						/>
					</div>

					<div>
						<label for="evidenceInput" class="block text-sm font-medium text-gray-700 mb-2"
							>Evidence</label
						>
						<div class="flex space-x-2 mb-2">
							<input
								id="evidenceInput"
								type="text"
								bind:value={evidenceInput}
								on:keydown={(e) => e.key === 'Enter' && addEvidence()}
								class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="Add evidence URL or description..."
							/>
							<button
								on:click={addEvidence}
								class="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
							>
								Add
							</button>
						</div>
						{#if investigationForm.evidence.length > 0}
							<div class="space-y-1">
								{#each investigationForm.evidence as evidence}
									<div class="flex items-center justify-between bg-gray-50 p-2 rounded">
										<span class="text-sm">{evidence}</span>
										<button
											on:click={() => removeEvidence(evidence)}
											class="text-red-600 hover:text-red-800 text-sm"
										>
											Remove
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<div>
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={investigationForm.followUpRequired}
								class="mr-2"
							/>
							<span class="text-sm text-gray-700">Follow-up required</span>
						</label>
					</div>
				</div>

				<div class="flex justify-end space-x-3 mt-6">
					<button
						on:click={() => (showInvestigationModal = false)}
						class="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
					>
						Cancel
					</button>
					<button
						on:click={submitInvestigation}
						disabled={!investigationForm.findings.trim()}
						class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Submit Investigation
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Create Report Modal -->
{#if showReportModal}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-10 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Create User Report</h3>

				<div class="space-y-4">
					<div>
						<label for="reportedUserId" class="block text-sm font-medium text-gray-700 mb-1"
							>Reported User ID</label
						>
						<input
							id="reportedUserId"
							type="text"
							bind:value={reportForm.reportedUserId}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Enter user ID..."
						/>
					</div>

					<div>
						<label for="reportType" class="block text-sm font-medium text-gray-700 mb-1"
							>Report Type</label
						>
						<select
							id="reportType"
							bind:value={reportForm.reportType}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="harassment">Harassment</option>
							<option value="inappropriate_content">Inappropriate Content</option>
							<option value="spam">Spam</option>
							<option value="fake_profile">Fake Profile</option>
							<option value="safety_concern">Safety Concern</option>
							<option value="other">Other</option>
						</select>
					</div>

					<div>
						<label for="reason" class="block text-sm font-medium text-gray-700 mb-1">Reason</label>
						<input
							id="reason"
							type="text"
							bind:value={reportForm.reason}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Brief reason for report..."
						/>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-gray-700 mb-1"
							>Description</label
						>
						<textarea
							id="description"
							bind:value={reportForm.description}
							required
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Detailed description of the issue..."
						></textarea>
					</div>

					<div>
						<label for="relatedContentId" class="block text-sm font-medium text-gray-700 mb-1"
							>Related Content ID (Optional)</label
						>
						<input
							id="relatedContentId"
							type="text"
							bind:value={reportForm.relatedContentId}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="ID of related content..."
						/>
					</div>
				</div>

				<div class="flex justify-end space-x-3 mt-6">
					<button
						on:click={() => (showReportModal = false)}
						class="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
					>
						Cancel
					</button>
					<button
						on:click={createUserReport}
						disabled={!reportForm.reportedUserId.trim() ||
							!reportForm.reason.trim() ||
							!reportForm.description.trim()}
						class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Create Report
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
