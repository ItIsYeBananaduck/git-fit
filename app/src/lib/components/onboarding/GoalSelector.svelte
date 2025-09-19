<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Id } from '$lib/convex/_generated/dataModel.js';

	const dispatch = createEventDispatcher();

	const primaryGoals = [
		{
			id: 'weight_loss',
			title: 'Weight Loss',
			description: 'Lose body fat and improve body composition',
			icon: '⚖️',
			details: {
				targetWeight: '',
				timeline: '',
				weeklyRate: '0.5-1 lb/week'
			}
		},
		{
			id: 'muscle_gain',
			title: 'Muscle Gain',
			description: 'Build muscle mass and strength',
			icon: '💪',
			details: {
				targetWeight: '',
				timeline: '',
				weeklyRate: '0.25-0.5 lb/week'
			}
		},
		{
			id: 'strength_training',
			title: 'Strength Training',
			description: 'Increase overall strength and power',
			icon: '🏋️',
			details: {
				focusAreas: [],
				experience: 'beginner'
			}
		},
		{
			id: 'endurance',
			title: 'Endurance',
			description: 'Improve cardiovascular fitness and stamina',
			icon: '🏃',
			details: {
				activities: [],
				targetDistance: '',
				targetTime: ''
			}
		},
		{
			id: 'general_fitness',
			title: 'General Fitness',
			description: 'Overall health and fitness improvement',
			icon: '🏃‍♀️',
			details: {
				focusAreas: ['cardio', 'strength', 'flexibility']
			}
		},
		{
			id: 'sports_performance',
			title: 'Sports Performance',
			description: 'Enhance performance in specific sports',
			icon: '⚽',
			details: {
				sport: '',
				position: '',
				season: ''
			}
		}
	];

	let selectedGoal: string = '';
	let goalDetails: any = {};

	function selectGoal(goalId: string) {
		selectedGoal = goalId;
		const goal = primaryGoals.find((g) => g.id === goalId);
		if (goal) {
			goalDetails = { ...goal.details };
		}
	}

	function updateDetails(event: Event, field: string) {
		const target = event.target as HTMLInputElement;
		goalDetails[field] = target.value;
	}

	function updateArrayDetails(event: Event, field: string) {
		const target = event.target as HTMLInputElement;
		if (target.checked) {
			if (!goalDetails[field]) goalDetails[field] = [];
			goalDetails[field].push(target.value);
		} else {
			goalDetails[field] =
				goalDetails[field]?.filter((item: string) => item !== target.value) || [];
		}
	}

	function confirmGoal() {
		if (!selectedGoal) return;

		dispatch('goalSelected', {
			goal: selectedGoal,
			details: goalDetails
		});
	}
</script>

<div class="space-y-6">
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each primaryGoals as goal}
			<button
				type="button"
				class="border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg text-left w-full {selectedGoal ===
				goal.id
					? 'border-blue-500 bg-blue-50'
					: 'border-gray-200 hover:border-gray-300'}"
				on:click={() => selectGoal(goal.id)}
			>
				<div class="text-3xl mb-3">{goal.icon}</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">{goal.title}</h3>
				<p class="text-gray-600 text-sm">{goal.description}</p>
			</button>
		{/each}
	</div>

	{#if selectedGoal}
		<div class="bg-gray-50 rounded-lg p-6">
			<h4 class="text-lg font-semibold text-gray-900 mb-4">Goal Details</h4>

			{#if selectedGoal === 'weight_loss' || selectedGoal === 'muscle_gain'}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="target-weight" class="block text-sm font-medium text-gray-700 mb-2"
							>Target Weight (lbs)</label
						>
						<input
							id="target-weight"
							type="number"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Enter target weight"
							bind:value={goalDetails.targetWeight}
						/>
					</div>
					<div>
						<label for="timeline" class="block text-sm font-medium text-gray-700 mb-2"
							>Timeline (weeks)</label
						>
						<input
							id="timeline"
							type="number"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Enter timeline"
							bind:value={goalDetails.timeline}
						/>
					</div>
				</div>
				<p class="text-sm text-gray-500 mt-2">Recommended rate: {goalDetails.weeklyRate}</p>
			{/if}

			{#if selectedGoal === 'strength_training'}
				<div class="space-y-4">
					<div>
						<label for="experience-level" class="block text-sm font-medium text-gray-700 mb-2"
							>Experience Level</label
						>
						<select
							id="experience-level"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							bind:value={goalDetails.experience}
						>
							<option value="beginner">Beginner (0-6 months)</option>
							<option value="intermediate">Intermediate (6-18 months)</option>
							<option value="advanced">Advanced (18+ months)</option>
						</select>
					</div>
					<div>
						<h4 class="block text-sm font-medium text-gray-700 mb-2">Focus Areas</h4>
						<div class="grid grid-cols-2 gap-2">
							{#each ['upper_body', 'lower_body', 'core', 'full_body'] as area}
								<label class="flex items-center">
									<input
										type="checkbox"
										class="mr-2"
										value={area}
										on:change={(e) => updateArrayDetails(e, 'focusAreas')}
									/>
									{area.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
								</label>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			{#if selectedGoal === 'endurance'}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="target-distance" class="block text-sm font-medium text-gray-700 mb-2"
							>Target Distance</label
						>
						<input
							id="target-distance"
							type="text"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="e.g., 5K, 10K, Half Marathon"
							bind:value={goalDetails.targetDistance}
						/>
					</div>
					<div>
						<label for="target-time" class="block text-sm font-medium text-gray-700 mb-2"
							>Target Time</label
						>
						<input
							id="target-time"
							type="text"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="e.g., 30 minutes, 1 hour"
							bind:value={goalDetails.targetTime}
						/>
					</div>
				</div>
			{/if}

			{#if selectedGoal === 'sports_performance'}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="sport" class="block text-sm font-medium text-gray-700 mb-2">Sport</label>
						<input
							id="sport"
							type="text"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="e.g., Basketball, Soccer, Tennis"
							bind:value={goalDetails.sport}
						/>
					</div>
					<div>
						<label for="position" class="block text-sm font-medium text-gray-700 mb-2"
							>Position/Role</label
						>
						<input
							id="position"
							type="text"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="e.g., Point Guard, Forward, Midfielder"
							bind:value={goalDetails.position}
						/>
					</div>
				</div>
			{/if}

			<div class="mt-6">
				<button
					on:click={confirmGoal}
					class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
				>
					Continue with {primaryGoals.find((g) => g.id === selectedGoal)?.title}
				</button>
			</div>
		</div>
	{/if}
</div>
