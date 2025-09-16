<script lang="ts">
	import { Plus, Check, AlertCircle, Wifi, WifiOff } from 'lucide-svelte';
	import type { FitnessTracker, TrackerType } from '$lib/types/fitnessTrackers';
	import { TRACKER_DEFINITIONS } from '$lib/types/fitnessTrackers';

	export let connectedTrackers: FitnessTracker[] = [];
	export let onTrackerAdd: (trackerType: TrackerType) => void;
	export let onTrackerRemove: (trackerId: string) => void;

	let showAddModal = false;
	let selectedTrackerType: TrackerType | null = null;

	const availableTrackers = Object.entries(TRACKER_DEFINITIONS).map(([type, def]) => ({
		type: type as TrackerType,
		...def
	}));

	function handleAddTracker() {
		if (selectedTrackerType) {
			onTrackerAdd(selectedTrackerType);
			showAddModal = false;
			selectedTrackerType = null;
		}
	}

	function isTrackerConnected(type: TrackerType): boolean {
		return connectedTrackers.some((t) => t.type === type);
	}

	function getCapabilityScore(tracker: (typeof availableTrackers)[0]): number {
		const caps = tracker.capabilities;
		let score = 0;
		if (caps.hasRecovery) score += 3;
		if (caps.hasStrain) score += 3;
		if (caps.hasHRV) score += 2;
		if (caps.realTimeData) score += 2;
		if (caps.hasWorkoutDetection) score += 1;
		return score;
	}

	$: sortedTrackers = availableTrackers.sort(
		(a, b) => getCapabilityScore(b) - getCapabilityScore(a)
	);
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-lg font-semibold text-gray-900">Connected Trackers</h3>
			<p class="text-sm text-gray-600">Manage your fitness tracking devices</p>
		</div>

		<button
			on:click={() => (showAddModal = true)}
			class="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
		>
			<Plus size={16} class="mr-1" />
			Add Tracker
		</button>
	</div>

	<!-- Connected Trackers -->
	{#if connectedTrackers.length > 0}
		<div class="space-y-3 mb-6">
			{#each connectedTrackers as tracker}
				<div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
					<div class="flex items-center space-x-3">
						<div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
							{#if tracker.isConnected}
								<Wifi size={20} class="text-green-600" />
							{:else}
								<WifiOff size={20} class="text-gray-400" />
							{/if}
						</div>

						<div>
							<h4 class="text-sm font-semibold text-gray-900">{tracker.name}</h4>
							<div class="flex items-center space-x-2">
								<span
									class="text-xs px-2 py-1 rounded-full {tracker.isConnected
										? 'bg-green-100 text-green-700'
										: 'bg-gray-100 text-gray-600'}"
								>
									{tracker.isConnected ? 'Connected' : 'Disconnected'}
								</span>
								{#if tracker.lastSync}
									<span class="text-xs text-gray-500">
										Last sync: {tracker.lastSync.toLocaleTimeString()}
									</span>
								{/if}
							</div>
						</div>
					</div>

					<div class="flex items-center space-x-2">
						<!-- Capabilities indicators -->
						<div class="flex space-x-1">
							{#each [{ key: 'hasRecovery', label: 'Recovery', color: 'bg-blue-500' }, { key: 'hasStrain', label: 'Strain', color: 'bg-purple-500' }, { key: 'hasHRV', label: 'HRV', color: 'bg-green-500' }, { key: 'realTimeData', label: 'Live', color: 'bg-orange-500' }] as cap}
								{#if tracker.capabilities[cap.key as keyof typeof tracker.capabilities]}
									<div class="w-2 h-2 rounded-full {cap.color}" title={cap.label}></div>
								{/if}
							{/each}
						</div>

						<button
							on:click={() => onTrackerRemove(tracker.id)}
							class="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
						>
							Remove
						</button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-8 text-gray-500">
			<AlertCircle size={48} class="mx-auto mb-4 text-gray-400" />
			<p class="text-sm">No trackers connected</p>
			<p class="text-xs">Add a fitness tracker to enable personalized training</p>
		</div>
	{/if}

	<!-- Add Tracker Modal -->
	{#if showAddModal}
		<div
			class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
			role="dialog"
			aria-modal="true"
			aria-labelledby="add-tracker-title"
		>
			<div
				class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
				tabindex="-1"
				bind:this={modalEl}
				on:keydown={handleModalKeydown}
			>
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-gray-900" id="add-tracker-title">
						Add Fitness Tracker
					</h3>
					<button
						on:click={() => (showAddModal = false)}
						class="text-gray-400 hover:text-gray-600"
						aria-label="Close add tracker dialog"
						tabindex="0"
						on:keydown={(e) =>
							(e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), (showAddModal = false))}
					>
						×
					</button>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
					{#each sortedTrackers as tracker}
						<button
							on:click={() => (selectedTrackerType = tracker.type)}
							disabled={isTrackerConnected(tracker.type)}
							class="p-4 border rounded-lg text-left transition-colors {selectedTrackerType ===
							tracker.type
								? 'border-blue-500 bg-blue-50'
								: isTrackerConnected(tracker.type)
									? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
									: 'border-gray-200 hover:border-gray-300'}"
							aria-pressed={selectedTrackerType === tracker.type}
							aria-label={`Select ${tracker.name}`}
							tabindex="0"
							on:keydown={(e) =>
								(e.key === 'Enter' || e.key === ' ') &&
								(e.preventDefault(), (selectedTrackerType = tracker.type))}
						>
							<div class="flex items-center justify-between mb-2">
								<h4 class="text-sm font-semibold text-gray-900">{tracker.name}</h4>
								{#if isTrackerConnected(tracker.type)}
									<Check size={16} class="text-green-600" />
								{:else if selectedTrackerType === tracker.type}
									<div class="w-4 h-4 border-2 border-blue-500 rounded-full bg-blue-500"></div>
								{:else}
									<div class="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
								{/if}
							</div>

							<!-- Capability badges -->
							<div class="flex flex-wrap gap-1 mb-2">
								{#each [{ key: 'hasRecovery', label: 'Recovery', color: 'blue' }, { key: 'hasStrain', label: 'Strain', color: 'purple' }, { key: 'hasHRV', label: 'HRV', color: 'green' }, { key: 'realTimeData', label: 'Live', color: 'orange' }] as cap}
									{#if tracker.capabilities[cap.key as keyof typeof tracker.capabilities]}
										<span class="text-xs px-2 py-1 bg-{cap.color}-100 text-{cap.color}-700 rounded">
											{cap.label}
										</span>
									{/if}
								{/each}
							</div>

							<div class="text-xs text-gray-600">
								Capability Score: {getCapabilityScore(tracker)}/11
							</div>

							{#if isTrackerConnected(tracker.type)}
								<div class="text-xs text-green-600 mt-1">Already connected</div>
							{/if}
						</button>
					{/each}
				</div>

				<div class="flex justify-end space-x-3">
					<button
						on:click={() => (showAddModal = false)}
						class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
						aria-label="Cancel add tracker"
						tabindex="0"
						on:keydown={(e) =>
							(e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), (showAddModal = false))}
					>
						Cancel
					</button>
					<button
						on:click={handleAddTracker}
						disabled={!selectedTrackerType || isTrackerConnected(selectedTrackerType)}
						class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						aria-label="Connect tracker"
						tabindex="0"
						on:keydown={(e) =>
							(e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleAddTracker())}
					>
						Connect Tracker
					</button>
					<script lang="ts">
						// ...existing code...
						import { onMount } from 'svelte';
						let modalEl: HTMLDivElement | null = null;
						function handleModalKeydown(e: KeyboardEvent) {
							if (e.key === 'Escape') {
								showAddModal = false;
							}
							// Trap focus inside modal
							if (e.key === 'Tab' && modalEl) {
								const focusable = modalEl.querySelectorAll<HTMLElement>(
									'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
								);
								const first = focusable[0];
								const last = focusable[focusable.length - 1];
								if (e.shiftKey) {
									if (document.activeElement === first) {
										last.focus();
										e.preventDefault();
									}
								} else {
									if (document.activeElement === last) {
										first.focus();
										e.preventDefault();
									}
								}
							}
						}
						onMount(() => {
							if (showAddModal && modalEl) {
								setTimeout(() => modalEl?.focus(), 0);
							}
						});
					</script>
					<style>
						button:focus {
							box-shadow: 0 0 0 3px #2563eb55;
							outline: none;
						}
					</style>
				</div>

				<!-- Capabilities Legend -->
				<div class="mt-6 p-4 bg-gray-50 rounded-lg">
					<h5 class="text-xs font-semibold text-gray-900 mb-2">Capability Guide</h5>
					<div class="grid grid-cols-2 gap-2 text-xs text-gray-600">
						<div>
							<span class="font-medium text-blue-700">Recovery:</span> Daily readiness scores
						</div>
						<div>
							<span class="font-medium text-purple-700">Strain:</span> Workout intensity tracking
						</div>
						<div><span class="font-medium text-green-700">HRV:</span> Heart rate variability</div>
						<div>
							<span class="font-medium text-orange-700">Live:</span> Real-time data during workouts
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
