<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/convex';
	import { useQuery } from 'convex-svelte';
	import { getUserId } from '$lib/auth'; // Assumes you have a helper for userId

	let userId: string = '';
	let monthKey: string = '';
	let summary: any = null;
	let loading = true;
	let error = '';

	const getUserMonthlySummary = useQuery(api.userMonthlySummaries.getUserMonthlySummary);

	onMount(async () => {
		userId = await getUserId();
		// Default to current month
		const now = new Date();
		monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
		try {
			summary = await getUserMonthlySummary({ userId, monthKey });
			if (summary && summary.monthlySummaryJson) {
				summary = JSON.parse(summary.monthlySummaryJson);
			}
		} catch (e) {
			error = 'Failed to load monthly summary.';
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<div>Loading...</div>
{:else if error}
	<div class="error">{error}</div>
{:else if summary}
	<div>
		<h2>Monthly Exercise Summary ({monthKey})</h2>
		{#each Object.entries(summary.exercises || {}) as [exercise, stats]}
			<div class="exercise-summary">
				<h3>{exercise.replace('_', ' ')}</h3>
				<ul>
					<li>Avg Sets: {stats.avgSets}</li>
					<li>Max Sets: {stats.maxSets}</li>
					<li>Avg Reps: {stats.avgReps}</li>
					<li>Max Reps: {stats.maxReps}</li>
					<li>Avg Load: {stats.avgLoad}</li>
					<li>Max Load: {stats.maxLoad}</li>
					<li>Avg Rest (sec): {stats.avgRestSec}</li>
					<li>Total Volume: {stats.totalVolume}</li>
					<li>Max Session Volume: {stats.maxSessionVolume}</li>
					<li>Last Performed: {stats.lastPerformed}</li>
				</ul>
			</div>
		{/each}
	</div>
{:else}
	<div>No summary data for this month.</div>
{/if}

<style>
	.exercise-summary {
		border: 1px solid #ccc;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
		background: #fafafa;
	}
	h3 {
		margin: 0 0 0.5rem 0;
	}
	.error {
		color: red;
	}
</style>
