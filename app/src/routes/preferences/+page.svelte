<script lang="ts">
	import { onMount } from 'svelte';
	import { availableExercises } from '$lib/data/exercises';
	import { user } from '$lib/stores/auth';
	import api from '$lib/api/convex';

	let includeList: string[] = [];
	let avoidList: string[] = [];
	let search = '';

	$: filteredExercises = availableExercises.filter((e) =>
		e.toLowerCase().includes(search.toLowerCase())
	);

	function toggleInclude(exercise: string) {
		if (includeList.includes(exercise)) {
			includeList = includeList.filter((e) => e !== exercise);
		} else {
			includeList = [...includeList, exercise];
			avoidList = avoidList.filter((e) => e !== exercise);
		}
	}

	function toggleAvoid(exercise: string) {
		if (avoidList.includes(exercise)) {
			avoidList = avoidList.filter((e) => e !== exercise);
		} else {
			avoidList = [...avoidList, exercise];
			includeList = includeList.filter((e) => e !== exercise);
		}
	}

	async function savePreferences() {
		if (!$user || !$user._id) {
			alert('You must be logged in to save preferences.');
			return;
		}
		const config = {
			includeList,
			avoidList
		};
		try {
			await api.mutation('functions/userConfigs:setUserConfig', {
				userId: $user._id,
				configJson: JSON.stringify(config)
			});
			alert('Preferences saved!');
		} catch (e) {
			alert('Failed to save preferences.');
			console.error(e);
		}
	}
</script>

<div class="space-y-6">
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<h1 class="text-2xl font-bold mb-2">Exercise Preferences</h1>
		<p class="text-gray-600 mb-4">
			Select exercises you want to include or avoid in your training program.
		</p>
		<input
			type="text"
			placeholder="Search exercises..."
			bind:value={search}
			class="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
		/>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each filteredExercises as exercise}
				<div class="flex items-center gap-2 p-2 border rounded-lg">
					<span class="flex-1">{exercise}</span>
					<button
						class="px-2 py-1 rounded bg-green-100 text-green-800"
						on:click={() => toggleInclude(exercise)}
						disabled={includeList.includes(exercise)}>Include</button
					>
					<button
						class="px-2 py-1 rounded bg-red-100 text-red-800"
						on:click={() => toggleAvoid(exercise)}
						disabled={avoidList.includes(exercise)}>Avoid</button
					>
				</div>
			{/each}
		</div>
		<div class="mt-6 flex gap-4">
			<button class="px-4 py-2 bg-primary text-white rounded" on:click={savePreferences}
				>Save Preferences</button
			>
		</div>
		<div class="mt-4">
			<h2 class="font-semibold">Included:</h2>
			<ul>
				{#each includeList as ex}<li>{ex}</li>{/each}
			</ul>
			<h2 class="font-semibold mt-2">Avoided:</h2>
			<ul>
				{#each avoidList as ex}<li>{ex}</li>{/each}
			</ul>
		</div>
	</div>
</div>
