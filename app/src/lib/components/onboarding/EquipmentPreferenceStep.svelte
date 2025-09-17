<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	const equipmentOptions = [
		'Dumbbell',
		'Barbell',
		'Cable',
		'Machine',
		'Kettlebell',
		'Bands',
		'Bodyweight',
		'Other'
	];
	let selectedEquipment: string[] = [];
	let includeList: string[] = [];
	let avoidList: string[] = [];
	let customInclude = '';
	let customAvoid = '';

	function toggleEquipment(equip: string) {
		if (selectedEquipment.includes(equip)) {
			selectedEquipment = selectedEquipment.filter((e) => e !== equip);
		} else {
			selectedEquipment = [...selectedEquipment, equip];
		}
	}

	function addInclude() {
		if (customInclude.trim() && !includeList.includes(customInclude.trim())) {
			includeList = [...includeList, customInclude.trim()];
			customInclude = '';
		}
	}
	function addAvoid() {
		if (customAvoid.trim() && !avoidList.includes(customAvoid.trim())) {
			avoidList = [...avoidList, customAvoid.trim()];
			customAvoid = '';
		}
	}
	function removeInclude(item: string) {
		includeList = includeList.filter((i) => i !== item);
	}
	function removeAvoid(item: string) {
		avoidList = avoidList.filter((i) => i !== item);
	}
	function submit() {
		dispatch('submit', {
			equipment: selectedEquipment,
			preferences: { include: includeList, avoid: avoidList }
		});
	}
</script>

<div class="max-w-xl mx-auto bg-white rounded-lg shadow p-8 mt-8">
	<h2 class="text-2xl font-bold mb-4 text-gray-900">Equipment & Exercise Preferences</h2>
	<p class="mb-6 text-gray-700">
		Select the equipment you have available and let us know your exercise preferences. This will
		help us personalize your program.
	</p>

	<div class="mb-6">
		<h3 class="font-semibold mb-2">Available Equipment</h3>
		<div class="flex flex-wrap gap-2">
			{#each equipmentOptions as equip}
				<button
					type="button"
					class="px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 {selectedEquipment.includes(
						equip
					)
						? 'bg-blue-600 text-white border-blue-600'
						: 'bg-gray-100 text-gray-800 border-gray-300'}"
					on:click={() => toggleEquipment(equip)}
					aria-pressed={selectedEquipment.includes(equip)}
				>
					{equip}
				</button>
			{/each}
		</div>
	</div>

	<div class="mb-6">
		<h3 class="font-semibold mb-2">Include Exercises</h3>
		<div class="flex gap-2 mb-2">
			<input
				type="text"
				bind:value={customInclude}
				placeholder="e.g. Pull-up"
				class="flex-1 border rounded px-2 py-1"
			/>
			<button type="button" class="bg-blue-600 text-white px-3 py-1 rounded" on:click={addInclude}
				>Add</button
			>
		</div>
		<div class="flex flex-wrap gap-2">
			{#each includeList as item}
				<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
					{item}
					<button
						type="button"
						class="ml-2 text-blue-600 hover:text-blue-800"
						on:click={() => removeInclude(item)}
						aria-label="Remove {item}">&times;</button
					>
				</span>
			{/each}
		</div>
	</div>

	<div class="mb-6">
		<h3 class="font-semibold mb-2">Avoid Exercises</h3>
		<div class="flex gap-2 mb-2">
			<input
				type="text"
				bind:value={customAvoid}
				placeholder="e.g. Deadlift"
				class="flex-1 border rounded px-2 py-1"
			/>
			<button type="button" class="bg-blue-600 text-white px-3 py-1 rounded" on:click={addAvoid}
				>Add</button
			>
		</div>
		<div class="flex flex-wrap gap-2">
			{#each avoidList as item}
				<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full flex items-center">
					{item}
					<button
						type="button"
						class="ml-2 text-red-600 hover:text-red-800"
						on:click={() => removeAvoid(item)}
						aria-label="Remove {item}">&times;</button
					>
				</span>
			{/each}
		</div>
	</div>

	<button
		class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold mt-4 hover:bg-blue-700 transition-colors"
		on:click={submit}
		aria-label="Save equipment and preferences"
	>
		Save & Continue
	</button>
</div>
