<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let primaryGoal: string;

	const dispatch = createEventDispatcher();

	const secondaryGoalsMap = {
		weight_loss: [
			{ id: 'improve_energy', title: 'Improve Energy Levels', icon: '⚡' },
			{ id: 'build_muscle', title: 'Build Muscle While Losing Fat', icon: '💪' },
			{ id: 'increase_flexibility', title: 'Increase Flexibility', icon: '🧘' },
			{ id: 'improve_sleep', title: 'Improve Sleep Quality', icon: '😴' },
			{ id: 'reduce_stress', title: 'Reduce Stress', icon: '🧘‍♀️' },
			{ id: 'increase_strength', title: 'Increase Overall Strength', icon: '🏋️' }
		],
		muscle_gain: [
			{ id: 'lose_fat', title: 'Lose Body Fat', icon: '⚖️' },
			{ id: 'increase_strength', title: 'Increase Strength', icon: '💪' },
			{ id: 'improve_endurance', title: 'Improve Muscular Endurance', icon: '🏃' },
			{ id: 'enhance_recovery', title: 'Enhance Recovery', icon: '🛌' },
			{ id: 'improve_form', title: 'Improve Exercise Form', icon: '📐' },
			{ id: 'track_progress', title: 'Track Progress Accurately', icon: '📊' }
		],
		strength_training: [
			{ id: 'muscle_gain', title: 'Muscle Gain', icon: '💪' },
			{ id: 'improve_endurance', title: 'Improve Muscular Endurance', icon: '🏃' },
			{ id: 'enhance_power', title: 'Enhance Power Output', icon: '⚡' },
			{ id: 'improve_technique', title: 'Improve Technique', icon: '📐' },
			{ id: 'increase_flexibility', title: 'Increase Flexibility', icon: '🧘' },
			{ id: 'weight_loss', title: 'Weight Loss', icon: '⚖️' }
		],
		endurance: [
			{ id: 'weight_loss', title: 'Weight Loss', icon: '⚖️' },
			{ id: 'build_muscle', title: 'Build Muscle', icon: '💪' },
			{ id: 'improve_speed', title: 'Improve Speed', icon: '🏃‍♀️' },
			{ id: 'enhance_recovery', title: 'Enhance Recovery', icon: '🛌' },
			{ id: 'increase_strength', title: 'Increase Strength', icon: '🏋️' },
			{ id: 'improve_heart_health', title: 'Improve Heart Health', icon: '❤️' }
		],
		general_fitness: [
			{ id: 'weight_loss', title: 'Weight Loss', icon: '⚖️' },
			{ id: 'muscle_gain', title: 'Muscle Gain', icon: '💪' },
			{ id: 'improve_endurance', title: 'Improve Endurance', icon: '🏃' },
			{ id: 'increase_strength', title: 'Increase Strength', icon: '🏋️' },
			{ id: 'enhance_flexibility', title: 'Enhance Flexibility', icon: '🧘' },
			{ id: 'improve_balance', title: 'Improve Balance', icon: '⚖️' }
		],
		sports_performance: [
			{ id: 'increase_strength', title: 'Increase Strength', icon: '💪' },
			{ id: 'improve_endurance', title: 'Improve Endurance', icon: '🏃' },
			{ id: 'enhance_speed', title: 'Enhance Speed', icon: '⚡' },
			{ id: 'improve_agility', title: 'Improve Agility', icon: '🤸' },
			{ id: 'build_power', title: 'Build Power', icon: '💥' },
			{ id: 'enhance_recovery', title: 'Enhance Recovery', icon: '🛌' }
		]
	};

	let selectedGoals: string[] = [];
	const maxGoals = 3;

	$: availableGoals = secondaryGoalsMap[primaryGoal] || secondaryGoalsMap.general_fitness;

	function toggleGoal(goalId: string) {
		if (selectedGoals.includes(goalId)) {
			selectedGoals = selectedGoals.filter((id) => id !== goalId);
		} else if (selectedGoals.length < maxGoals) {
			selectedGoals = [...selectedGoals, goalId];
		}
	}

	function confirmGoals() {
		dispatch('goalsSelected', {
			goals: selectedGoals
		});
	}
</script>

<div class="space-y-6">
	<div class="text-center">
		<h3 class="text-lg font-semibold text-gray-900 mb-2">Select Secondary Goals</h3>
		<p class="text-gray-600">Choose up to {maxGoals} goals that support your primary objective</p>
		<p class="text-sm text-gray-500 mt-1">Selected: {selectedGoals.length}/{maxGoals}</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#each availableGoals as goal}
			<button
				type="button"
				class="border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md text-left w-full {selectedGoals.includes(
					goal.id
				)
					? 'border-blue-500 bg-blue-50'
					: 'border-gray-200 hover:border-gray-300'}"
				on:click={() => toggleGoal(goal.id)}
			>
				<div class="flex items-center">
					<div class="text-2xl mr-3">{goal.icon}</div>
					<div>
						<h4 class="font-medium text-gray-900">{goal.title}</h4>
					</div>
					{#if selectedGoals.includes(goal.id)}
						<div class="ml-auto">
							<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
								<svg
									class="w-4 h-4 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									></path>
								</svg>
							</div>
						</div>
					{/if}
				</div>
			</button>
		{/each}
	</div>

	{#if selectedGoals.length > 0}
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
			<h4 class="font-medium text-blue-900 mb-2">Selected Goals:</h4>
			<div class="flex flex-wrap gap-2">
				{#each selectedGoals as goalId}
					{@const goal = availableGoals.find((g: any) => g.id === goalId)}
					{#if goal}
						<span
							class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
						>
							{goal.icon}
							{goal.title}
						</span>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	<div class="flex justify-end">
		<button
			on:click={confirmGoals}
			disabled={selectedGoals.length === 0}
			class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
		>
			Continue ({selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''} selected)
		</button>
	</div>
</div>
