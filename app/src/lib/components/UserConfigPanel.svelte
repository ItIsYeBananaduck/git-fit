<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/convex';
	// import { useConvexClient, useQuery } from 'convex-svelte';
	// import { getUserId } from '$lib/auth'; // Assumes you have a helper for userId

	let userId: string = 'demo_user'; // Fallback for demo
	let config: any = null;
	let loading = true;
	let error = '';
	let success = '';
	let saving = false;

	// const getUserConfig = useQuery(api.userConfigs.getUserConfig);
	// const client = useConvexClient();
	const setUserConfig = async (data: any) => {
		// return await client.mutation(api.userConfigs.setUserConfig, data);
		console.log('Would save config:', data);
		return Promise.resolve();
	};

	// Default config structure
	const defaultConfig = {
		version: 'v1.3.1',
		defaultDeload: 6,
		deloadOptions: [4, 6],
		maxRestTimeSec: 90,
		weightIncrementLbs: 2.5,
		autoPurgeDays: 30,
		summarizeOn: 'monthly',
		maxMonthlySummaries: 12,
		maxYearlySummaries: 3,
		smartSetNudges: false,
		dynamicDeload: true,
		cycleLengthWeeks: 4
	};

	onMount(async () => {
		// userId = await getUserId();
		try {
			// config = await getUserConfig({ userId });
			// For demo, load default config
			config = defaultConfig;
		} catch (e) {
			error = 'Failed to load configuration.';
		} finally {
			loading = false;
		}
	});

	async function saveConfig() {
		saving = true;
		error = '';
		success = '';
		try {
			await setUserConfig({ userId, configJson: JSON.stringify(config) });
			success = 'Configuration saved successfully!';
			// Clear success message after 3 seconds
			setTimeout(() => {
				success = '';
			}, 3000);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save configuration.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="bg-white rounded-lg shadow-sm border p-6 max-w-2xl">
	{#if loading}
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
			<span class="ml-2 text-sm text-gray-600">Loading configuration...</span>
		</div>
	{:else}
		<form on:submit|preventDefault={saveConfig} class="space-y-4">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">User Configuration</h2>

			<!-- Success Message -->
			{#if success}
				<div
					class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4"
					role="alert"
					aria-live="polite"
				>
					<div class="flex items-center">
						<svg class="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<span class="text-sm text-green-800">{success}</span>
					</div>
				</div>
			{/if}

			<!-- Error Message -->
			{#if error}
				<div
					class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
					role="alert"
					aria-live="polite"
				>
					<div class="flex items-center">
						<svg class="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
						<span class="text-sm text-red-800">{error}</span>
					</div>
				</div>
			{/if}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Smart Set Nudges -->
				<div class="flex items-center space-x-3">
					<input
						id="smartSetNudges"
						type="checkbox"
						bind:checked={config.smartSetNudges}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<label for="smartSetNudges" class="text-sm font-medium text-gray-700"
						>Enable Smart Set Nudges</label
					>
				</div>

				<!-- Dynamic Deload -->
				<div class="flex items-center space-x-3">
					<input
						id="dynamicDeload"
						type="checkbox"
						bind:checked={config.dynamicDeload}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<label for="dynamicDeload" class="text-sm font-medium text-gray-700"
						>Enable Dynamic Deload</label
					>
				</div>

				<!-- Default Deload -->
				<div class="space-y-1">
					<label for="defaultDeload" class="block text-sm font-medium text-gray-700"
						>Default Deload (weeks)</label
					>
					<input
						id="defaultDeload"
						type="number"
						bind:value={config.defaultDeload}
						min="1"
						max="12"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Mesocycle Length -->
				<div class="space-y-1">
					<label for="cycleLengthWeeks" class="block text-sm font-medium text-gray-700"
						>Mesocycle Length (weeks)</label
					>
					<input
						id="cycleLengthWeeks"
						type="number"
						bind:value={config.cycleLengthWeeks}
						min="3"
						max="8"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Deload Options -->
				<div class="space-y-1">
					<label for="deloadOptions" class="block text-sm font-medium text-gray-700"
						>Deload Options (comma separated)</label
					>
					<input
						id="deloadOptions"
						type="text"
						bind:value={config.deloadOptions}
						on:input={(e: Event) => {
							const target = e.target as HTMLInputElement;
							config.deloadOptions = target.value.split(',').map(Number);
						}}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Max Rest Time -->
				<div class="space-y-1">
					<label for="maxRestTimeSec" class="block text-sm font-medium text-gray-700"
						>Max Rest Time (seconds)</label
					>
					<input
						id="maxRestTimeSec"
						type="number"
						bind:value={config.maxRestTimeSec}
						min="30"
						max="600"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Weight Increment -->
				<div class="space-y-1">
					<label for="weightIncrementLbs" class="block text-sm font-medium text-gray-700"
						>Weight Increment (lbs)</label
					>
					<input
						id="weightIncrementLbs"
						type="number"
						bind:value={config.weightIncrementLbs}
						min="0.5"
						max="10"
						step="0.5"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Auto Purge Days -->
				<div class="space-y-1">
					<label for="autoPurgeDays" class="block text-sm font-medium text-gray-700"
						>Auto Purge Days</label
					>
					<input
						id="autoPurgeDays"
						type="number"
						bind:value={config.autoPurgeDays}
						min="1"
						max="365"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Summary Frequency -->
				<div class="space-y-1">
					<label for="summarizeOn" class="block text-sm font-medium text-gray-700"
						>Summary Frequency</label
					>
					<select
						id="summarizeOn"
						bind:value={config.summarizeOn}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="monthly">Monthly</option>
						<option value="yearly">Yearly</option>
					</select>
				</div>

				<!-- Max Monthly Summaries -->
				<div class="space-y-1">
					<label for="maxMonthlySummaries" class="block text-sm font-medium text-gray-700"
						>Max Monthly Summaries</label
					>
					<input
						id="maxMonthlySummaries"
						type="number"
						bind:value={config.maxMonthlySummaries}
						min="1"
						max="24"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Max Yearly Summaries -->
				<div class="space-y-1">
					<label for="maxYearlySummaries" class="block text-sm font-medium text-gray-700"
						>Max Yearly Summaries</label
					>
					<input
						id="maxYearlySummaries"
						type="number"
						bind:value={config.maxYearlySummaries}
						min="1"
						max="5"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>
			</div>

			<!-- Save Button -->
			<div class="pt-4 border-t border-gray-200">
				<button
					type="submit"
					disabled={saving}
					class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-colors"
				>
					{#if saving}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
						Saving...
					{:else}
						Save Configuration
					{/if}
				</button>
			</div>
		</form>
	{/if}
</div>
