<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/convex';
	import { useQuery } from 'convex-svelte';
	import { getUserId } from '$lib/auth'; // Assumes you have a helper for userId

	let userId: string = '';
	let summary: any = null;
	let loading = true;
	let error = '';

	const getUserYearlySummary = useQuery(api.userYearlySummaries.getUserYearlySummary);

	onMount(async () => {
		userId = await getUserId();
		try {
			summary = await getUserYearlySummary({ userId });
			if (summary && summary.yearlySummaryJson) {
				summary = JSON.parse(summary.yearlySummaryJson);
			}
		} catch (e) {
			error = 'Failed to load yearly summary.';
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
		<h2>Yearly Exercise Summary</h2>
		{#each Object.entries(summary || {}) as [year, yearData]}
			<div class="year-summary">
				<h3>{year}</h3>
				{#each Object.entries(yearData.exercises || {}) as [exercise, exData]}
					<div class="exercise-summary">
						<h4>{exercise.replace('_', ' ')}</h4>
						<ul>
							{#each Object.entries(exData.monthlyBreakdown || {}) as [month, stats]}
								<li>
									<strong>{month}:</strong>
									Avg Sets: {stats.avgSets}, Max Sets: {stats.maxSets}, Avg Reps: {stats.avgReps},
									Max Reps: {stats.maxReps}, Avg Load: {stats.avgLoad}, Max Load: {stats.maxLoad},
									Avg Rest (sec): {stats.avgRestSec}, Total Volume: {stats.totalVolume}, Max Session
									Volume: {stats.maxSessionVolume}, Last Performed: {stats.lastPerformed}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		{/each}
	</div>
{:else}
	<div>No yearly summary data available.</div>
{/if}

<style>
	.year-summary {
		border: 2px solid #bbb;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 2rem;
		background: #f5f5f5;
	}
	.exercise-summary {
		border: 1px solid #ccc;
		border-radius: 6px;
		padding: 0.75rem;
		margin-bottom: 1rem;
		background: #fafafa;
	}
	h3,
	h4 {
		margin: 0 0 0.5rem 0;
	}
	.error {
		color: red;
	}
</style>
