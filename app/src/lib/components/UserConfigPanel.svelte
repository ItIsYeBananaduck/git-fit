<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/convex';
	import { useMutation, useQuery } from 'convex-svelte';
	import { getUserId } from '$lib/auth'; // Assumes you have a helper for userId

	let userId: string = '';
	let config: any = null;
	let loading = true;
	let error = '';

	const getUserConfig = useQuery(api.userConfigs.getUserConfig);
	const setUserConfig = useMutation(api.userConfigs.setUserConfig);

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
		smartSetNudges: false, // Add default for toggle
		dynamicDeload: true, // New: dynamic deload logic toggle
		cycleLengthWeeks: 4 // New: mesocycle length (weeks)
	};
		<div>
			<label for="dynamicDeload">Enable Dynamic Deload:</label>
			<input id="dynamicDeload" type="checkbox" bind:checked={config.dynamicDeload} />
		</div>
		<div>
			<label for="cycleLengthWeeks">Mesocycle Length (weeks):</label>
			<input id="cycleLengthWeeks" type="number" bind:value={config.cycleLengthWeeks} min="3" max="8" />
		</div>

	onMount(async () => {
		userId = await getUserId();
		try {
			config = await getUserConfig({ userId });
			if (!config) config = defaultConfig;
		} catch (e) {
			error = 'Failed to load config.';
		} finally {
			loading = false;
		}
	});

	async function saveConfig() {
		loading = true;
		error = '';
		try {
			await setUserConfig({ userId, configJson: JSON.stringify(config) });
		} catch (e) {
			error = 'Failed to save config.';
		} finally {
			loading = false;
		}
	}
</script>

{#if loading}
	<div>Loading...</div>
{:else}
	<form on:submit|preventDefault={saveConfig}>
		<h2>User Config Options</h2>
		<div>
			<label for="smartSetNudges">Enable Smart Set Nudges:</label>
			<input id="smartSetNudges" type="checkbox" bind:checked={config.smartSetNudges} />
		</div>
		<div>
			<label for="defaultDeload">Default Deload:</label>
			<input id="defaultDeload" type="number" bind:value={config.defaultDeload} min="1" max="12" />
		</div>
		<div>
			<label for="deloadOptions">Deload Options (comma separated):</label>
			<input
				id="deloadOptions"
				type="text"
				bind:value={config.deloadOptions}
				on:input={(e: Event) => {
					const target = e.target as HTMLInputElement;
					config.deloadOptions = target.value.split(',').map(Number);
				}}
			/>
		</div>
		<div>
			<label for="maxRestTimeSec">Max Rest Time (sec):</label>
			<input
				id="maxRestTimeSec"
				type="number"
				bind:value={config.maxRestTimeSec}
				min="30"
				max="600"
			/>
		</div>
		<div>
			<label for="weightIncrementLbs">Weight Increment (lbs):</label>
			<input
				id="weightIncrementLbs"
				type="number"
				bind:value={config.weightIncrementLbs}
				min="0.5"
				max="10"
				step="0.5"
			/>
		</div>
		<div>
			<label for="autoPurgeDays">Auto Purge Days:</label>
			<input id="autoPurgeDays" type="number" bind:value={config.autoPurgeDays} min="1" max="365" />
		</div>
		<div>
			<label for="summarizeOn">Summarize On:</label>
			<select id="summarizeOn" bind:value={config.summarizeOn}>
				<option value="monthly">Monthly</option>
				<option value="yearly">Yearly</option>
			</select>
		</div>
		<div>
			<label for="maxMonthlySummaries">Max Monthly Summaries:</label>
			<input
				id="maxMonthlySummaries"
				type="number"
				bind:value={config.maxMonthlySummaries}
				min="1"
				max="24"
			/>
		</div>
		<div>
			<label for="maxYearlySummaries">Max Yearly Summaries:</label>
			<input
				id="maxYearlySummaries"
				type="number"
				bind:value={config.maxYearlySummaries}
				min="1"
				max="5"
			/>
		</div>
		<div>
			<label for="dynamicDeload">Enable Dynamic Deload:</label>
			<input id="dynamicDeload" type="checkbox" bind:checked={config.dynamicDeload} />
		</div>
		<div>
			<label for="cycleLengthWeeks">Mesocycle Length (weeks):</label>
			<input
				id="cycleLengthWeeks"
				type="number"
				bind:value={config.cycleLengthWeeks}
				min="3"
				max="8"
			/>
		</div>
		<button type="submit">Save</button>
		{#if error}
			<div class="error">{error}</div>
		{/if}
	</form>
{/if}

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 400px;
	}
	label {
		font-weight: bold;
	}
	.error {
		color: red;
	}
</style>
