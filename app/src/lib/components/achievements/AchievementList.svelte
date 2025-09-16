<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import AchievementBadge from './AchievementBadge.svelte';
	import { api } from '$lib/convex';

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

	/** @type {string} */
	export let userId;

	// Use userId for future API integration
	console.log('AchievementList initialized for user:', userId);

	/** @type {Achievement[]} */
	let achievements = [];
	/** @type {string[]} */
	let userAchievements = [];
	let loading = true;
	/** @type {string|null} */
	let error = null;
	let filter = 'all'; // all, earned, in-progress, available
	let categoryFilter = 'all';
	let sortBy = 'rarity'; // rarity, points, alphabetical

	// Load achievements data
	async function loadAchievements() {
		try {
			loading = true;
			error = null;

			// Load all achievements and user progress
			// Note: These API calls may need to be updated based on actual Convex schema
			const [allAchievements, userProgress] = await Promise.all([
				// Mock data for now - replace with actual API calls when available
				Promise.resolve([
					{
						id: 'first_workout',
						name: 'First Steps',
						description: 'Complete your first workout',
						icon: '🏃',
						category: 'workout',
						points: 10,
						rarity: 'common',
						requirements: { workouts_completed: 1 }
					},
					{
						id: 'workout_streak_7',
						name: 'Week Warrior',
						description: 'Complete workouts for 7 days in a row',
						icon: '🔥',
						category: 'workout',
						points: 50,
						rarity: 'uncommon',
						requirements: { workout_streak: 7 }
					}
				]),
				Promise.resolve({
					earned: [],
					inProgress: [],
					available: []
				})
			]);

			achievements = /** @type {Achievement[]} */ (allAchievements);
			userAchievements = userProgress.earned.map((/** @type {Achievement} */ a) => a.id);
		} catch (/** @type {any} */ err) {
			error = err.message || 'Failed to load achievements';
			console.error('Error loading achievements:', err);
		} finally {
			loading = false;
		}
	}

	// Filter and sort achievements
	$: filteredAchievements = achievements
		.map((/** @type {Achievement} */ achievement) => {
			const earned = userAchievements.includes(achievement.id);
			const progress = earned ? 100 : Math.random() * 100; // Mock progress for demo
			return { ...achievement, earned, progress };
		})
		.filter((/** @type {Achievement & {earned: boolean, progress: number}} */ achievement) => {
			// Status filter
			if (filter === 'earned' && !achievement.earned) return false;
			if (filter === 'in-progress' && (achievement.earned || achievement.progress === 0))
				return false;
			if (filter === 'available' && (achievement.earned || achievement.progress > 0)) return false;

			// Category filter
			if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false;

			return true;
		})
		.sort(
			(
				/** @type {Achievement & {earned: boolean, progress: number}} */ a,
				/** @type {Achievement & {earned: boolean, progress: number}} */ b
			) => {
				switch (sortBy) {
					case 'rarity':
						const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4 };
						return rarityOrder[b.rarity] - rarityOrder[a.rarity];
					case 'points':
						return b.points - a.points;
					case 'alphabetical':
						return a.name.localeCompare(b.name);
					default:
						return 0;
				}
			}
		);

	// Get unique categories
	$: categories = [
		'all',
		...new Set(achievements.map((/** @type {Achievement} */ a) => a.category))
	];

	// Statistics
	$: stats = {
		total: achievements.length,
		earned: userAchievements.length,
		inProgress: filteredAchievements.filter((/** @type {any} */ a) => !a.earned && a.progress > 0)
			.length,
		available: filteredAchievements.filter((/** @type {any} */ a) => !a.earned && a.progress === 0)
			.length,
		totalPoints: filteredAchievements
			.filter((/** @type {any} */ a) => a.earned)
			.reduce((/** @type {number} */ sum, /** @type {any} */ a) => sum + a.points, 0)
	};

	onMount(() => {
		loadAchievements();
	});

	function handleAchievementClick(/** @type {any} */ event) {
		const { achievement, earned, progress } = event.detail;
		// Handle achievement click - could show details modal
		console.log('Achievement clicked:', achievement, earned, progress);
	}
</script>

<div class="achievements-container">
	<!-- Header -->
	<div class="mb-6">
		<h2 class="text-2xl font-bold text-gray-900 mb-2">Achievements</h2>
		<p class="text-gray-600">Track your fitness journey and unlock rewards</p>
	</div>

	<!-- Statistics -->
	<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
		<div class="bg-white p-4 rounded-lg shadow-sm border">
			<div class="text-2xl font-bold text-gray-900">{stats.total}</div>
			<div class="text-sm text-gray-600">Total</div>
		</div>
		<div class="bg-white p-4 rounded-lg shadow-sm border">
			<div class="text-2xl font-bold text-green-600">{stats.earned}</div>
			<div class="text-sm text-gray-600">Earned</div>
		</div>
		<div class="bg-white p-4 rounded-lg shadow-sm border">
			<div class="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
			<div class="text-sm text-gray-600">In Progress</div>
		</div>
		<div class="bg-white p-4 rounded-lg shadow-sm border">
			<div class="text-2xl font-bold text-gray-600">{stats.available}</div>
			<div class="text-sm text-gray-600">Available</div>
		</div>
		<div class="bg-white p-4 rounded-lg shadow-sm border">
			<div class="text-2xl font-bold text-yellow-600">{stats.totalPoints}</div>
			<div class="text-sm text-gray-600">Points</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white p-4 rounded-lg shadow-sm border mb-6">
		<div class="flex flex-wrap gap-4">
			<!-- Status Filter -->
			<div>
				<label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1"
					>Status</label
				>
				<select
					id="status-filter"
					bind:value={filter}
					class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">All Achievements</option>
					<option value="earned">Earned</option>
					<option value="in-progress">In Progress</option>
					<option value="available">Available</option>
				</select>
			</div>

			<!-- Category Filter -->
			<div>
				<label for="category-filter" class="block text-sm font-medium text-gray-700 mb-1"
					>Category</label
				>
				<select
					id="category-filter"
					bind:value={categoryFilter}
					class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{#each categories as category}
						<option value={category}>
							{category === 'all'
								? 'All Categories'
								: category.charAt(0).toUpperCase() + category.slice(1)}
						</option>
					{/each}
				</select>
			</div>

			<!-- Sort By -->
			<div>
				<label for="sort-filter" class="block text-sm font-medium text-gray-700 mb-1">Sort By</label
				>
				<select
					id="sort-filter"
					bind:value={sortBy}
					class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="rarity">Rarity</option>
					<option value="points">Points</option>
					<option value="alphabetical">Alphabetical</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-2 text-gray-600">Loading achievements...</span>
		</div>
	{/if}

	<!-- Error State -->
	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">Error loading achievements</h3>
					<div class="mt-2 text-sm text-red-700">{error}</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Achievements Grid -->
	{#if !loading && !error}
		{#if filteredAchievements.length === 0}
			<div class="text-center py-12">
				<div class="text-6xl mb-4">🏆</div>
				<h3 class="text-lg font-medium text-gray-900 mb-2">No achievements found</h3>
				<p class="text-gray-600">Try adjusting your filters to see more achievements.</p>
			</div>
		{:else}
			<div
				class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
			>
				{#each filteredAchievements as achievement (achievement.id)}
					<div in:fade={{ duration: 300, delay: Math.random() * 200 }}>
						<AchievementBadge
							{achievement}
							earned={achievement.earned}
							progress={achievement.progress}
							on:click={handleAchievementClick}
						/>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
