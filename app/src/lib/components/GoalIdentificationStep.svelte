<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	// Preset goals for selection
	const presetGoals = [
		'Lose Weight',
		'Build Muscle',
		'Improve Endurance',
		'Increase Flexibility',
		'Improve Energy',
		'Other'
	];

	export let initial = {
		primaryGoal: '',
		secondaryGoals: [],
		customGoal: ''
	};

	let primaryGoal: string = initial.primaryGoal;
	let secondaryGoals: string[] = initial.secondaryGoals.slice();
	let customGoal: string = initial.customGoal;
	let error = '';

	const dispatch = createEventDispatcher();

	function toggleSecondary(goal: string) {
		if (secondaryGoals.includes(goal)) {
			secondaryGoals = secondaryGoals.filter((g) => g !== goal);
		} else {
			secondaryGoals = [...secondaryGoals, goal];
		}
	}

	function handleSubmit() {
		if (!primaryGoal) {
			error = 'Please select a primary goal.';
			return;
		}
		if (primaryGoal === 'Other' && !customGoal.trim()) {
			error = 'Please specify your custom goal.';
			return;
		}
		error = '';
		dispatch('submit', {
			primaryGoal: primaryGoal === 'Other' ? customGoal : primaryGoal,
			secondaryGoals: secondaryGoals.filter((g) => g !== primaryGoal),
			customGoal: primaryGoal === 'Other' ? customGoal : ''
		});
	}
</script>

<div class="goal-step">
	<h2>What is your primary fitness goal?</h2>
	<div class="goals">
		{#each presetGoals as goal}
			<button class:selected={primaryGoal === goal} on:click={() => (primaryGoal = goal)}
				>{goal}</button
			>
		{/each}
	</div>
	{#if primaryGoal === 'Other'}
		<input
			type="text"
			placeholder="Enter your custom goal"
			bind:value={customGoal}
			class="custom-goal-input"
		/>
	{/if}

	<h3>Select any secondary goals (optional):</h3>
	<div class="goals">
		{#each presetGoals as goal}
			{#if goal !== primaryGoal}
				<button
					class:selected={secondaryGoals.includes(goal)}
					on:click={() => toggleSecondary(goal)}>{goal}</button
				>
			{/if}
		{/each}
	</div>

	{#if error}
		<div class="error">{error}</div>
	{/if}
	<button class="submit-btn" on:click={handleSubmit}>Continue</button>
</div>

<style>
	.goal-step {
		max-width: 420px;
		margin: 0 auto;
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
		padding: 2rem 1.5rem 1.5rem 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.goals {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
		justify-content: center;
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
	.custom-goal-input {
		width: 100%;
		margin: 0.5rem 0 1rem 0;
		padding: 0.5rem;
		border-radius: 6px;
		border: 1px solid #e5e7eb;
		font-size: 1rem;
	}
	.error {
		color: #d32f2f;
		margin-bottom: 1rem;
		text-align: center;
	}
</style>
