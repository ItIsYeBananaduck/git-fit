<script>
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '../../convex/_generated/api.js';

	const client = useConvexClient();
	// Cast generated api to any to avoid TypeScript index type errors in the template
	/** @type {any} */
	const apiAny = api;

	// Query the list of training programs using the generated function reference
	const result = useQuery(apiAny.functions['functions/trainingPrograms'].getTrainingPrograms, {});

	async function handleAddProgram() {
		try {
			await client.mutation(apiAny.functions['functions/trainingPrograms'].addTrainingProgram, {
				name: 'Sample Program',
				description: 'A great training program',
				price: 99.99
			});
		} catch (e) {
			console.error('Failed to add program:', e);
		}
	}
</script>

<h1>Training Programs</h1>
<button on:click={handleAddProgram}>Add Program</button>

{#if result.data}
	<ul>
		{#each result.data as program}
			<li>{program.name} - ${program.price}</li>
		{/each}
	</ul>
{:else}
	<p>Loading...</p>
{/if}
