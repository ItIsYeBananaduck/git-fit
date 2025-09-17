<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '../../lib/api/convex';
	import ProgramCard from '../../lib/components/ProgramCard.svelte';
	import TrainerCard from '../../lib/components/TrainerCard.svelte';
	import SearchFilters from '../../lib/components/SearchFilters.svelte';
	import { Search, Filter, Star, DollarSign, Users } from 'lucide-svelte';

	let activeTab: 'programs' | 'trainers' = 'programs';
	let searchQuery = '';
	let programs: any[] = [];
	let trainers: any[] = [];
	let loading = true;
	let filters = {
		category: '',
		difficulty: '',
		maxPrice: 0,
		specialty: '',
		maxHourlyRate: 0
	};

	async function loadPrograms() {
		loading = true;
		try {
			programs = await api.query('functions/marketplace:getMarketplacePrograms', {
				search: searchQuery || undefined,
				category: filters.category || undefined,
				difficulty: filters.difficulty || undefined,
				maxPrice: filters.maxPrice || undefined,
				limit: 20
			});
		} catch (error) {
			console.error('Error loading programs:', error);
			programs = [];
		}
		loading = false;
	}

	async function loadTrainers() {
		loading = true;
		try {
			trainers = await api.query('functions/marketplace:getAvailableTrainers', {
				search: searchQuery || undefined,
				specialty: filters.specialty || undefined,
				maxHourlyRate: filters.maxHourlyRate || undefined
			});
		} catch (error) {
			console.error('Error loading trainers:', error);
			trainers = [];
		}
		loading = false;
	}

	function handleSearch() {
		if (activeTab === 'programs') {
			loadPrograms();
		} else {
			loadTrainers();
		}
	}

	function handleFilterChange(newFilters: any) {
		filters = { ...filters, ...newFilters };
		handleSearch();
	}

	function switchTab(tab: 'programs' | 'trainers') {
		activeTab = tab;
		searchQuery = '';
		filters = {
			category: '',
			difficulty: '',
			maxPrice: 0,
			specialty: '',
			maxHourlyRate: 0
		};

		if (tab === 'programs') {
			loadPrograms();
		} else {
			loadTrainers();
		}
	}

	onMount(() => {
		loadPrograms();
	});
</script>

<svelte:head>
	<title>Technically Fit Marketplace - Training Programs & Personal Trainers</title>
	<meta
		name="description"
		content="Discover training programs and connect with certified personal trainers. Browse hundreds of fitness programs or book custom coaching services."
	/>
</svelte:head>

<div
	class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
>
	<!-- Hero Section -->
	<div class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
		<div class="max-w-7xl mx-auto px-4 py-12">
			<div class="text-center">
				<h1 class="text-4xl font-bold text-slate-900 dark:text-white mb-4">Fitness Marketplace</h1>
				<p class="text-xl text-slate-600 dark:text-slate-300 mb-8">
					Transform your fitness journey with expert-designed programs and personalized coaching
				</p>

				<!-- Stats -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
					<div class="text-center">
						<div class="flex items-center justify-center mb-2">
							<DollarSign class="w-6 h-6 text-green-600 mr-2" />
							<span class="text-2xl font-bold text-slate-900 dark:text-white">10%</span>
						</div>
						<p class="text-sm text-slate-600 dark:text-slate-300">Commission on Programs</p>
					</div>
					<div class="text-center">
						<div class="flex items-center justify-center mb-2">
							<Users class="w-6 h-6 text-blue-600 mr-2" />
							<span class="text-2xl font-bold text-slate-900 dark:text-white">20%</span>
						</div>
						<p class="text-sm text-slate-600 dark:text-slate-300">Commission on Coaching</p>
					</div>
					<div class="text-center">
						<div class="flex items-center justify-center mb-2">
							<Star class="w-6 h-6 text-yellow-500 mr-2" />
							<span class="text-2xl font-bold text-slate-900 dark:text-white">4.8</span>
						</div>
						<p class="text-sm text-slate-600 dark:text-slate-300">Average Rating</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-4 py-8">
		<!-- Tab Navigation -->
		<div class="flex justify-center mb-8">
			<div
				class="bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700"
			>
				<button
					class="px-6 py-2 rounded-md font-medium transition-all duration-200 {activeTab ===
					'programs'
						? 'bg-blue-600 text-white shadow-sm'
						: 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}"
					on:click={() => switchTab('programs')}
					data-testid="tab-programs"
				>
					Training Programs
				</button>
				<button
					class="px-6 py-2 rounded-md font-medium transition-all duration-200 {activeTab ===
					'trainers'
						? 'bg-blue-600 text-white shadow-sm'
						: 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}"
					on:click={() => switchTab('trainers')}
					data-testid="tab-trainers"
				>
					Personal Trainers
				</button>
			</div>
		</div>

		<!-- Search Bar -->
		<div class="max-w-2xl mx-auto mb-8">
			<div class="relative">
				<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
				<input
					type="text"
					placeholder={activeTab === 'programs'
						? 'Search training programs...'
						: 'Search trainers by name or specialty...'}
					class="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg
                 bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					bind:value={searchQuery}
					on:input={handleSearch}
					data-testid="input-search"
				/>
			</div>
		</div>

		<!-- Filters -->
		<SearchFilters {activeTab} {filters} on:filterChange={(e) => handleFilterChange(e.detail)} />

		<!-- Content -->
		<div class="mt-8">
			{#if loading}
				<div class="flex justify-center items-center py-12">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
				</div>
			{:else if activeTab === 'programs'}
				{#if programs.length > 0}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each programs as program (program._id)}
							<a href={`/marketplace/${program._id}`} class="block">
								<ProgramCard {program} />
							</a>
						{/each}
					</div>
				{:else}
					<div class="text-center py-12">
						<div class="mb-4">
							<Search class="w-16 h-16 text-slate-300 mx-auto" />
						</div>
						<h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">
							No programs found
						</h3>
						<p class="text-slate-600 dark:text-slate-300">
							Try adjusting your search or filters to find what you're looking for.
						</p>
					</div>
				{/if}
			{:else if trainers.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each trainers as trainer (trainer._id)}
						<TrainerCard {trainer} />
					{/each}
				</div>
			{:else}
				<div class="text-center py-12">
					<div class="mb-4">
						<Users class="w-16 h-16 text-slate-300 mx-auto" />
					</div>
					<h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">No trainers found</h3>
					<p class="text-slate-600 dark:text-slate-300">
						Try adjusting your search or filters to find the perfect trainer.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
