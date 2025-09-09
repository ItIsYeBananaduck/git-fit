<script lang="ts">
	import { equipmentData, equipmentCategories, getEquipmentByCategory } from '$lib/data/equipment';

	let selectedCategory = 'all';
	let searchQuery = '';

	// Filter equipment based on category and search
	$: filteredEquipment = equipmentData.filter((equipment) => {
		const matchesCategory = selectedCategory === 'all' || equipment.category === selectedCategory;
		const matchesSearch = equipment.name.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesCategory && matchesSearch;
	});

	// Group equipment by category for better display
	$: groupedEquipment = equipmentCategories.reduce(
		(acc, category) => {
			if (selectedCategory === 'all' || selectedCategory === category.slug) {
				acc[category.slug] = filteredEquipment.filter((eq) => eq.category === category.slug);
			}
			return acc;
		},
		{} as Record<string, typeof equipmentData>
	);

	function getCategoryBadgeColor(category: string): string {
		const colors = {
			'free-weights': 'bg-blue-50 text-blue-700 border border-blue-200',
			bodyweight: 'bg-green-50 text-green-700 border border-green-200',
			functional: 'bg-purple-50 text-purple-700 border border-purple-200',
			machines: 'bg-orange-50 text-orange-700 border border-orange-200',
			cardio: 'bg-red-50 text-red-700 border border-red-200'
		};
		return colors[category] || 'bg-gray-50 text-gray-700 border border-gray-200';
	}
</script>

<svelte:head>
	<title>Equipment Database - Technically Fit</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<h1 class="text-2xl font-bold text-gray-900 mb-2">Equipment Database</h1>
		<p class="text-gray-600">
			Browse our comprehensive database of gym equipment for workout planning
		</p>
	</div>

	<!-- Search and Filters -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<div class="flex flex-col lg:flex-row gap-4">
			<!-- Search -->
			<div class="flex-1">
				<input
					type="text"
					placeholder="Search equipment..."
					bind:value={searchQuery}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
				/>
			</div>

			<!-- Category Filter -->
			<div class="flex flex-wrap gap-2">
				<button
					on:click={() => (selectedCategory = 'all')}
					class="px-4 py-2 rounded-lg font-medium transition-all {selectedCategory === 'all'
						? 'bg-primary text-white'
						: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
				>
					All Equipment
				</button>
				{#each equipmentCategories as category}
					<button
						on:click={() => (selectedCategory = category.slug)}
						class="px-4 py-2 rounded-lg font-medium transition-all {selectedCategory ===
						category.slug
							? 'bg-primary text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
					>
						{category.name}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Results Count -->
	<div class="flex items-center justify-between">
		<p class="text-gray-600">
			{filteredEquipment.length} equipment item{filteredEquipment.length !== 1 ? 's' : ''} found
		</p>
	</div>

	<!-- Equipment Grid -->
	{#if selectedCategory === 'all'}
		{#each equipmentCategories as category}
			{@const categoryEquipment = groupedEquipment[category.slug] || []}
			{#if categoryEquipment.length > 0}
				<div class="space-y-4">
					<h2 class="text-xl font-semibold text-gray-900">
						{category.name}
						<span class="text-sm font-normal text-gray-500 ml-2">({categoryEquipment.length})</span>
					</h2>
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{#each categoryEquipment as equipment}
							<div
								class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
							>
								<div class="flex justify-end mb-3">
									<span
										class="px-2 py-1 rounded-full text-xs font-medium {getCategoryBadgeColor(
											equipment.category
										)}"
									>
										{equipment.category.replace('-', ' ')}
									</span>
								</div>
								<h3 class="font-medium text-gray-900">{equipment.name}</h3>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each filteredEquipment as equipment}
				<div
					class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
				>
					<div class="flex justify-end mb-3">
						<span
							class="px-2 py-1 rounded-full text-xs font-medium {getCategoryBadgeColor(
								equipment.category
							)}"
						>
							{equipment.category.replace('-', ' ')}
						</span>
					</div>
					<h3 class="font-medium text-gray-900">{equipment.name}</h3>
				</div>
			{/each}
		</div>
	{/if}

	{#if filteredEquipment.length === 0}
		<div class="text-center py-12">
			<h3 class="text-lg font-medium text-gray-900 mb-2">No equipment found</h3>
			<p class="text-gray-600">Try adjusting your search criteria or category filter</p>
		</div>
	{/if}

	<!-- Equipment Categories Overview -->
	<div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
		<h2 class="text-xl font-semibold text-gray-900 mb-4">Equipment Categories</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each equipmentCategories as category}
				{@const categoryCount = getEquipmentByCategory(category.slug).length}
				<div class="bg-white rounded-lg p-4 shadow-sm">
					<div class="mb-2">
						<h3 class="font-medium text-gray-900">{category.name}</h3>
						<p class="text-sm text-gray-600">{categoryCount} items</p>
					</div>
					<div class="text-xs text-gray-500">
						{#if category.slug === 'free-weights'}
							Build strength with traditional weights
						{:else if category.slug === 'bodyweight'}
							Use your body as resistance
						{:else if category.slug === 'functional'}
							Versatile tools for functional movement
						{:else if category.slug === 'machines'}
							Guided movements for safety and isolation
						{:else if category.slug === 'cardio'}
							Cardiovascular conditioning equipment
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
