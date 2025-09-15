<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Common injuries and conditions (can be expanded)
	const commonInjuries = [
		'Knee',
		'Shoulder',
		'Back',
		'Ankle',
		'Wrist',
		'Elbow',
		'Neck',
		'Hip',
		'Other'
	];
	const commonConditions = [
		'Asthma',
		'Diabetes',
		'Heart Condition',
		'Hypertension',
		'Arthritis',
		'Epilepsy',
		'None',
		'Other'
	];

	export let initial: { injuries: string[]; conditions: string[]; notes: string } = {
		injuries: [],
		conditions: [],
		notes: ''
	};

	let injuries: string[] = initial.injuries.slice();
	let conditions: string[] = initial.conditions.slice();
	let notes: string = initial.notes;

	const dispatch = createEventDispatcher();

	let validationError = '';

	function toggleItem(list: string[], item: string): string[] {
		if (list.includes(item)) {
			return list.filter((i: string) => i !== item);
		} else {
			return [...list, item];
		}
	}

	function handleInjuryClick(injury: string) {
		injuries = toggleItem(injuries, injury);
	}

	function handleConditionClick(condition: string) {
		conditions = toggleItem(conditions, condition);
	}

	function handleSubmit() {
		// Require at least one injury, condition, or note
		if (
			injuries.length === 0 &&
			(conditions.length === 0 || (conditions.length === 1 && conditions[0] === 'None')) &&
			notes.trim() === ''
		) {
			validationError = 'Please select at least one injury, condition, or provide a note.';
			return;
		}
		validationError = '';
		dispatch('submit', { injuries, conditions, notes });
	}
</script>

<div class="medical-screening-step">
	<h2>Medical Screening</h2>
	<p>
		Select any injuries or medical conditions you have. This helps us personalize your training and
		keep you safe.
	</p>

	<div class="section">
		<h3>Injuries</h3>
		<div class="options">
			{#each commonInjuries as injury}
				<button
					class:selected={injuries.includes(injury)}
					on:click={() => handleInjuryClick(injury)}>{injury}</button
				>
			{/each}
		</div>
	</div>

	<div class="section">
		<h3>Medical Conditions</h3>
		<div class="options">
			{#each commonConditions as condition}
				<button
					class:selected={conditions.includes(condition)}
					on:click={() => handleConditionClick(condition)}>{condition}</button
				>
			{/each}
		</div>
	</div>

	<div class="section">
		<h3>Additional Notes</h3>
		<textarea
			placeholder="Describe any other relevant injuries, surgeries, or conditions..."
			bind:value={notes}
			rows={3}
		></textarea>
	</div>

	{#if validationError}
		<div class="validation-error">{validationError}</div>
	{/if}
	<button class="submit-btn" on:click={handleSubmit}>Continue</button>
</div>

<style>
	.validation-error {
		color: #d32f2f;
		margin-bottom: 1rem;
		text-align: center;
	}
	.medical-screening-step {
		max-width: 420px;
		margin: 0 auto;
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
		padding: 2rem 1.5rem 1.5rem 1.5rem;
	}
	.section {
		margin-bottom: 1.5rem;
	}
	.options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	button {
		background: #f3f4f6;
		border: none;
		border-radius: 6px;
		padding: 0.5rem 1rem;
		font-size: 1rem;
		cursor: pointer;
		transition: background 0.2s;
	}
	button.selected {
		background: #007aff;
		color: #fff;
	}
	.submit-btn {
		width: 100%;
		background: #007aff;
		color: #fff;
		font-weight: 600;
		padding: 0.75rem;
		border-radius: 8px;
		font-size: 1.1rem;
		margin-top: 1rem;
		border: none;
		cursor: pointer;
		transition: background 0.2s;
	}
	.submit-btn:hover {
		background: #005bb5;
	}
	textarea {
		width: 100%;
		border-radius: 6px;
		border: 1px solid #e5e7eb;
		padding: 0.5rem;
		font-size: 1rem;
		margin-top: 0.5rem;
		resize: vertical;
	}
</style>
