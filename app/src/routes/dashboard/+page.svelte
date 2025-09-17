<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api/convex';
	import { user } from '$lib/stores/auth';
	import { get } from 'svelte/store';
	import { exportProgramToCsv } from '$lib/utils/exportProgramToCsv';

	let purchasedPrograms: any[] = [];
	let loading = true;
	let error = '';

	onMount(async () => {
		loading = true;
		error = '';
		try {
			const currentUser = get(user);
			if (!currentUser) {
				error = 'You must be logged in to view your dashboard.';
				loading = false;
				return;
			}
			purchasedPrograms = await api.query('functions/marketplace:getPurchasedPrograms', {
				userId: currentUser._id
			});
		} catch (e: any) {
			error = e.message || 'Failed to load purchased programs.';
		}
		loading = false;
	});

	function downloadJSON(program: any) {
		const blob = new Blob([JSON.stringify(program.jsonData, null, 2)], {
			type: 'application/json'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${program.title || 'program'}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function downloadCSV(program: any) {
		// If program.jsonData is the canonical data, use it; else use program directly
		const data = program.jsonData || program;
		const csv = exportProgramToCsv(data);
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${program.title || 'program'}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="max-w-3xl mx-auto py-12 px-4">
	<h1 class="text-3xl font-bold mb-6">Your Programs</h1>
	{#if loading}
		<div>Loading...</div>
	{:else if error}
		<div class="text-red-600">{error}</div>
	{:else if purchasedPrograms.length === 0}
		<div>You have not purchased any programs yet.</div>
	{:else}
		<div class="space-y-6">
			{#each purchasedPrograms as program}
				<div class="p-4 border rounded bg-white">
					<div class="flex justify-between items-center mb-2">
						<div>
							<div class="font-semibold text-lg">{program.title}</div>
							<div class="text-slate-600 text-sm">
								{program.durationWeeks} weeks • {program.goal}
							</div>
							<div class="text-slate-500 text-xs">Trainer: {program.trainerName}</div>
							<div class="text-slate-500 text-xs">
								Type: {program.priceType} | Status: {program.status}
							</div>
						</div>
						<div class="flex flex-col gap-2 items-end">
							<button
								class="bg-blue-600 text-white px-4 py-2 rounded"
								on:click={() => downloadJSON(program)}
							>
								Download JSON
							</button>
							<button
								class="bg-green-600 text-white px-4 py-2 rounded"
								on:click={() => downloadCSV(program)}
							>
								Download CSV
							</button>
						</div>
					</div>
					<div class="text-slate-700 mb-2">{program.description}</div>
					{#if program.subscriptionEnd}
						<div class="text-xs text-green-700">Active until {program.subscriptionEnd}</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
