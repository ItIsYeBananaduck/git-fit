<script lang="ts">
	export let title: string;
	export let type: 'metric' | 'chart' | 'table' | 'status';
	export let size: 'small' | 'medium' | 'large' = 'medium';
	export let refreshable = true;
	export let exportable = true;
	export let configurable = true;
	export let loading = false;
	export let error = '';
	export let lastUpdated: string | null = null;

	// Events
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	function handleRefresh() {
		dispatch('refresh');
	}

	function handleExport() {
		dispatch('export');
	}

	function handleConfigure() {
		dispatch('configure');
	}

	function handleRemove() {
		dispatch('remove');
	}

	$: sizeClasses = {
		small: 'col-span-1 row-span-1',
		medium: 'col-span-2 row-span-1',
		large: 'col-span-3 row-span-2'
	}[size];
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 {sizeClasses}">
	<!-- Widget Header -->
	<div class="flex items-center justify-between p-4 border-b border-gray-200">
		<div class="flex items-center space-x-2">
			<h3 class="text-sm font-medium text-gray-900">{title}</h3>
			{#if loading}
				<div
					class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
				></div>
			{/if}
		</div>

		<div class="flex items-center space-x-1">
			{#if refreshable}
				<button
					on:click={handleRefresh}
					disabled={loading}
					class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
					title="Refresh"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
				</button>
			{/if}

			{#if exportable}
				<button
					on:click={handleExport}
					class="p-1 text-gray-400 hover:text-gray-600"
					title="Export"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
				</button>
			{/if}

			{#if configurable}
				<button
					on:click={handleConfigure}
					class="p-1 text-gray-400 hover:text-gray-600"
					title="Configure"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
				</button>
			{/if}

			<button on:click={handleRemove} class="p-1 text-gray-400 hover:text-red-600" title="Remove">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Widget Content -->
	<div class="p-4 {size === 'large' ? 'h-96' : size === 'medium' ? 'h-48' : 'h-32'} overflow-auto">
		{#if error}
			<div class="flex items-center justify-center h-full">
				<div class="text-center">
					<svg
						class="mx-auto h-8 w-8 text-red-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p class="mt-2 text-sm text-red-600">{error}</p>
				</div>
			</div>
		{:else if loading}
			<div class="flex items-center justify-center h-full">
				<div class="text-center">
					<div
						class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"
					></div>
					<p class="mt-2 text-sm text-gray-600">Loading...</p>
				</div>
			</div>
		{:else}
			<slot />
		{/if}
	</div>

	<!-- Widget Footer -->
	{#if lastUpdated}
		<div class="px-4 py-2 border-t border-gray-200 bg-gray-50">
			<p class="text-xs text-gray-500">
				Last updated: {new Date(lastUpdated).toLocaleString()}
			</p>
		</div>
	{/if}
</div>
