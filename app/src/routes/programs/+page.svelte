<script lang="ts">
        import ProgramCard from '$lib/components/ProgramCard.svelte';

        // Mock programs data
        let programs = [
                {
                        id: 1,
                        name: 'Full Body Transformation',
                        description: 'Complete 12-week program for building muscle and losing fat',
                        price: 79.99,
                        difficulty: 'intermediate',
                        duration: 12,
                        rating: 4.8,
                        totalPurchases: 1247,
                        trainer: {
                                name: 'Sarah Johnson',
                                verified: true,
                                avatar: null
                        },
                        category: ['strength', 'fat-loss'],
                        equipment: ['dumbbells', 'barbell', 'bench']
                },
                {
                        id: 2,
                        name: 'Beginner Home Workouts',
                        description: 'Perfect for fitness newcomers - no equipment needed!',
                        price: 29.99,
                        difficulty: 'beginner',
                        duration: 8,
                        rating: 4.9,
                        totalPurchases: 2103,
                        trainer: {
                                name: 'Mike Chen',
                                verified: true,
                                avatar: null
                        },
                        category: ['bodyweight', 'cardio'],
                        equipment: []
                },
                {
                        id: 3,
                        name: 'Elite Powerlifting',
                        description: 'Advanced strength training for serious lifters',
                        price: 149.99,
                        difficulty: 'advanced',
                        duration: 16,
                        rating: 4.7,
                        totalPurchases: 456,
                        trainer: {
                                name: 'David Rodriguez',
                                verified: true,
                                avatar: null
                        },
                        category: ['strength', 'powerlifting'],
                        equipment: ['barbell', 'plates', 'rack']
                },
                {
                        id: 4,
                        name: 'HIIT Fat Burner',
                        description: 'High-intensity workouts for maximum calorie burn',
                        price: 39.99,
                        difficulty: 'intermediate',
                        duration: 6,
                        rating: 4.6,
                        totalPurchases: 892,
                        trainer: {
                                name: 'Emma Williams',
                                verified: false,
                                avatar: null
                        },
                        category: ['cardio', 'fat-loss'],
                        equipment: ['kettlebell', 'mat']
                }
        ];

        let filteredPrograms = programs;
        let searchQuery = '';
        let selectedDifficulty = '';
        let selectedCategory = '';
        let sortBy = 'popularity';

        // Filter and search logic
        $: {
                filteredPrograms = programs.filter(program => {
                        const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                program.description.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchesDifficulty = !selectedDifficulty || program.difficulty === selectedDifficulty;
                        const matchesCategory = !selectedCategory || program.category.includes(selectedCategory);
                        
                        return matchesSearch && matchesDifficulty && matchesCategory;
                });

                // Sort programs
                if (sortBy === 'price-low') {
                        filteredPrograms = filteredPrograms.sort((a, b) => a.price - b.price);
                } else if (sortBy === 'price-high') {
                        filteredPrograms = filteredPrograms.sort((a, b) => b.price - a.price);
                } else if (sortBy === 'rating') {
                        filteredPrograms = filteredPrograms.sort((a, b) => b.rating - a.rating);
                } else {
                        filteredPrograms = filteredPrograms.sort((a, b) => b.totalPurchases - a.totalPurchases);
                }
        }
</script>

<svelte:head>
        <title>Training Programs - GitFit</title>
</svelte:head>

<div class="space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h1 class="text-2xl font-bold text-gray-900 mb-2">Training Programs</h1>
                <p class="text-gray-600">Discover expert-designed fitness programs tailored to your goals</p>
        </div>

        <!-- Search and Filters -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div class="flex flex-col lg:flex-row gap-4">
                        <!-- Search -->
                        <div class="flex-1">
                                <input
                                        type="text"
                                        placeholder="Search programs..."
                                        bind:value={searchQuery}
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                        </div>

                        <!-- Filters -->
                        <div class="flex flex-col sm:flex-row gap-4">
                                <select 
                                        bind:value={selectedDifficulty}
                                        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                        <option value="">All Levels</option>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                </select>

                                <select 
                                        bind:value={selectedCategory}
                                        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                        <option value="">All Categories</option>
                                        <option value="strength">Strength</option>
                                        <option value="cardio">Cardio</option>
                                        <option value="fat-loss">Fat Loss</option>
                                        <option value="bodyweight">Bodyweight</option>
                                        <option value="powerlifting">Powerlifting</option>
                                </select>

                                <select 
                                        bind:value={sortBy}
                                        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                        <option value="popularity">Most Popular</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                </select>
                        </div>
                </div>
        </div>

        <!-- Results Count -->
        <div class="flex items-center justify-between">
                <p class="text-gray-600">
                        {filteredPrograms.length} program{filteredPrograms.length !== 1 ? 's' : ''} found
                </p>
        </div>

        <!-- Programs Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each filteredPrograms as program (program.id)}
                        <ProgramCard {program} />
                {/each}
        </div>

        {#if filteredPrograms.length === 0}
                <div class="text-center py-12">
                        <div class="text-gray-400 text-lg font-medium mb-4">No Results</div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No programs found</h3>
                        <p class="text-gray-600">Try adjusting your search criteria or filters</p>
                </div>
        {/if}
</div>