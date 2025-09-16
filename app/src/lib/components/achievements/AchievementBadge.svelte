<script>
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';

	/**
	 * @typedef {Object} Achievement
	 * @property {string} id
	 * @property {string} name
	 * @property {string} description
	 * @property {string} icon
	 * @property {string} category
	 * @property {number} points
	 * @property {'common'|'uncommon'|'rare'|'epic'} rarity
	 * @property {Object} requirements
	 */

	/** @type {Achievement} */
	export let achievement;
	export let earned = false;
	export let progress = 0;
	export let showProgress = true;

	const dispatch = createEventDispatcher();

	function handleClick() {
		dispatch('click', { achievement, earned, progress });
	}

	$: rarityColors = {
		common: 'bg-gray-100 border-gray-300 text-gray-700',
		uncommon: 'bg-green-100 border-green-300 text-green-700',
		rare: 'bg-blue-100 border-blue-300 text-blue-700',
		epic: 'bg-purple-100 border-purple-300 text-purple-700'
	};

	$: progressColor = earned ? 'bg-green-500' : 'bg-blue-500';
</script>

<div
	class="achievement-badge relative group cursor-pointer transform transition-all duration-200 hover:scale-105"
	on:click={handleClick}
	role="button"
	tabindex="0"
	aria-label="{achievement.name} - {earned ? 'Earned' : 'In progress'}"
	on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleClick())}
	style="outline: none;"
>
	<!-- Badge Container -->
	<div
		class="relative p-4 bg-white rounded-lg shadow-md border-2 {rarityColors[
			achievement.rarity
		]} transition-all duration-200 hover:shadow-lg"
	>
		<!-- Icon -->
		<div class="text-3xl mb-2 text-center" aria-hidden="true">
			{achievement.icon}
		</div>

		<!-- Title -->
		<h3 class="font-semibold text-sm text-center mb-1">
			{achievement.name}
		</h3>

		<!-- Description -->
		<p class="text-xs text-center text-gray-600 mb-2 line-clamp-2">
			{achievement.description}
		</p>

		<!-- Points -->
		<div class="text-xs text-center font-medium text-yellow-600 mb-2">
			+{achievement.points} points
		</div>

		<!-- Progress Bar -->
		{#if showProgress && !earned}
			<div class="w-full bg-gray-200 rounded-full h-2 mb-2">
				<div
					class="h-2 rounded-full transition-all duration-500 {progressColor}"
					style="width: {Math.min(progress, 100)}%"
				></div>
			</div>
			<div class="text-xs text-center text-gray-500">
				{Math.round(progress)}% complete
			</div>
		{/if}

		<!-- Earned Badge -->
		{#if earned}
			<div
				class="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
				aria-label="Achievement earned"
			>
				✓
			</div>
		{/if}
	</div>

	<!-- Tooltip on hover -->
	<div
		class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap"
	>
		{achievement.name}
		<div
			class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"
		></div>
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	div[role='button']:focus {
		box-shadow: 0 0 0 3px #2563eb55;
	}
</style>
