<script lang="ts">
	import {
		recommendTrainingSplit,
		type RecommendationInput
	} from '../services/trainingSplitRecommendation';

	// New: User profile input for recommendation (replace with real data in production)
	export let userProfile: RecommendationInput = {
		primaryGoal: 'Build Muscle',
		secondaryGoals: [],
		equipment: ['dumbbell', 'barbell'],
		experienceLevel: 'intermediate',
		availableDays: 5
	};

	let recommendedSplit: SplitOption | null = null;
	onMount(() => {
		recommendedSplit = recommendTrainingSplit(userProfile);
	});

	let showCustomPanel = false;
	let selectedSplit: SplitOption | null = null;
	let savedMessage = '';

	function handleSelect(split: SplitOption) {
		selectedSplit = split;
		showCustomPanel = split.name === 'Custom';
		savedMessage = '';
		if (!showCustomPanel) {
			// Save the selected split to config
			saveCustomSplit(userId, [
				{ name: split.name, focus: split.name, notes: split.description }
			]).then(() => {
				savedMessage = 'Split saved!';
			});
		}
	}

	function handleCustomSave(split: CustomSplitDay[]) {
		saveCustomSplit(userId, split).then(() => {
			savedMessage = 'Custom split saved!';
			showCustomPanel = false;
		});
	}
</script>

{#if recommendedSplit}
	<div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
		<strong>Recommended Split:</strong> <span class="font-semibold">{recommendedSplit.name}</span>
		<div class="text-sm text-gray-700 mt-1">{recommendedSplit.description}</div>
	</div>
{/if}

<SplitComparisonPanel {splits} onSelect={handleSelect} />

{#if showCustomPanel}
	<CustomSplitPanel {initialSplit} onSave={handleCustomSave} />
{/if}

{#if savedMessage}
	<div class="saved-message">{savedMessage}</div>
{/if}

<style>
	.saved-message {
		margin: 1rem auto;
		background: #e6ffe6;
		color: #1a7f37;
		border-radius: 4px;
		padding: 0.75rem 1.5rem;
		max-width: 400px;
		text-align: center;
		font-weight: 500;
	}
</style>
