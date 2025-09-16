<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	export type CustomSplitDay = {
		name: string;
		focus: string;
		notes?: string;
	};

	export let initialSplit: CustomSplitDay[] = [];
	export let onSave: (split: CustomSplitDay[]) => void;

	const split = writable<CustomSplitDay[]>([...initialSplit]);

	function addDay() {
		split.update((s) => [...s, { name: '', focus: '', notes: '' }]);
	}

	function removeDay(idx: number) {
		split.update((s) => s.filter((_, i) => i !== idx));
	}

	function updateDay(idx: number, field: keyof CustomSplitDay, value: string) {
		split.update((s) => {
			const copy = [...s];
			copy[idx][field] = value;
			return copy;
		});
	}

	function save() {
		split.subscribe((val) => onSave(val))();
	}
</script>

<div class="custom-split-panel" role="region" aria-labelledby="custom-split-heading">
	<h2 id="custom-split-heading">Custom Training Split</h2>
	<table>
		<thead>
			<tr>
				<th>Day</th>
				<th>Focus</th>
				<th>Notes</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each $split as day, idx}
				<tr>
					<td>
						<input
							type="text"
							placeholder="e.g. Day 1"
							bind:value={day.name}
							on:input={(e) => updateDay(idx, 'name', (e.target as HTMLInputElement)?.value)}
							aria-label={`Day ${idx + 1} name`}
						/>
					</td>
					<td>
						<input
							type="text"
							placeholder="e.g. Push, Pull, Legs, Arms/Core, Cardio"
							bind:value={day.focus}
							on:input={(e) => updateDay(idx, 'focus', (e.target as HTMLInputElement)?.value)}
							aria-label={`Day ${idx + 1} focus`}
						/>
					</td>
					<td>
						<input
							type="text"
							placeholder="Optional notes"
							bind:value={day.notes}
							on:input={(e) => updateDay(idx, 'notes', (e.target as HTMLInputElement)?.value)}
							aria-label={`Day ${idx + 1} notes`}
						/>
					</td>
					<td>
						<button
							type="button"
							on:click={() => removeDay(idx)}
							aria-label={`Remove day ${idx + 1}`}
							tabindex="0"
							on:keydown={(e) =>
								(e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), removeDay(idx))}
						>
							🗑️
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<div class="button-row">
		<button
			type="button"
			on:click={addDay}
			aria-label="Add day"
			tabindex="0"
			on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), addDay())}
		>
			Add Day
		</button>
		<button
			type="button"
			on:click={save}
			aria-label="Save split"
			tabindex="0"
			on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), save())}
		>
			Save Split
		</button>
	</div>
</div>

<style>
	.custom-split-panel {
		max-width: 600px;
		margin: 2rem auto;
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		padding: 2rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
	}
	th,
	td {
		border: 1px solid #e0e0e0;
		padding: 0.5rem;
		text-align: left;
	}
	input[type='text'] {
		width: 100%;
		padding: 0.3rem;
		border-radius: 4px;
		border: 1px solid #ccc;
	}
	.button-row {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	button {
		margin: 0.5rem 0.5rem 0 0;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		background: #0070f3;
		color: #fff;
		cursor: pointer;
		outline: none;
		transition: box-shadow 0.2s;
	}
	button:focus {
		box-shadow: 0 0 0 3px #2563eb55;
	}
	button[aria-label^='Remove day'] {
		background: #e74c3c;
	}
</style>
