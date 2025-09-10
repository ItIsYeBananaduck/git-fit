<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Filter, X } from 'lucide-svelte';

  export let activeTab: 'programs' | 'trainers';
  export let filters: any;

  const dispatch = createEventDispatcher();

  let showFilters = false;

  const categories = [
    'Strength Training',
    'Cardio',
    'Flexibility',
    'Weight Loss',
    'Muscle Building',
    'Endurance',
    'Yoga',
    'HIIT',
    'Powerlifting',
    'Bodybuilding'
  ];

  const specialties = [
    'Weight Loss',
    'Muscle Building',
    'Strength Training',
    'Cardio',
    'Nutrition',
    'Rehabilitation',
    'Sports Performance',
    'Yoga',
    'Pilates',
    'CrossFit',
    'Powerlifting',
    'Bodybuilding'
  ];

  const difficulties = ['beginner', 'intermediate', 'advanced'];

  function updateFilter(key: string, value: any) {
    const newFilters = { ...filters, [key]: value };
    dispatch('filterChange', newFilters);
  }

  function clearFilters() {
    const clearedFilters = {
      category: '',
      difficulty: '',
      maxPrice: 0,
      specialty: '',
      maxHourlyRate: 0
    };
    dispatch('filterChange', clearedFilters);
  }

  function hasActiveFilters(): boolean {
    if (activeTab === 'programs') {
      return !!(filters.category || filters.difficulty || filters.maxPrice);
    } else {
      return !!(filters.specialty || filters.maxHourlyRate);
    }
  }
</script>

<div class="max-w-4xl mx-auto">
  <!-- Filter Toggle Button -->
  <div class="flex justify-center mb-4">
    <button
      on:click={() => showFilters = !showFilters}
      class="flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
             bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700
             transition-colors duration-200 {hasActiveFilters() ? 'border-blue-500 text-blue-600' : ''}"
      data-testid="button-toggle-filters"
    >
      <Filter class="w-4 h-4 mr-2" />
      Filters
      {#if hasActiveFilters()}
        <span class="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
          Active
        </span>
      {/if}
    </button>
  </div>

  <!-- Filter Panel -->
  {#if showFilters}
    <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-slate-900 dark:text-white">
          Filter {activeTab === 'programs' ? 'Programs' : 'Trainers'}
        </h3>
        <button
          on:click={() => showFilters = false}
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          data-testid="button-close-filters"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      {#if activeTab === 'programs'}
        <!-- Program Filters -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Category -->
          <div>
            <label for="category-select" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Category
            </label>
            <select
              id="category-select"
              bind:value={filters.category}
              on:change={(e) => updateFilter('category', e.target.value)}
              class="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 
                     bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="select-category"
            >
              <option value="">All Categories</option>
              {#each categories as category}
                <option value={category}>{category}</option>
              {/each}
            </select>
          </div>

          <!-- Difficulty -->
          <div>
            <label for="difficulty-select" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Difficulty
            </label>
            <select
              id="difficulty-select"
              bind:value={filters.difficulty}
              on:change={(e) => updateFilter('difficulty', e.target.value)}
              class="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 
                     bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="select-difficulty"
            >
              <option value="">All Levels</option>
              {#each difficulties as difficulty}
                <option value={difficulty}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</option>
              {/each}
            </select>
          </div>

          <!-- Max Price -->
          <div>
            <label for="max-price-range" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Max Price: ${filters.maxPrice || 'Any'}
            </label>
            <input
              id="max-price-range"
              type="range"
              min="0"
              max="500"
              step="25"
              bind:value={filters.maxPrice}
              on:input={(e) => updateFilter('maxPrice', parseInt(e.target.value))}
              class="w-full"
              data-testid="range-max-price"
            />
            <div class="flex justify-between text-xs text-slate-500 mt-1">
              <span>$0</span>
              <span>$500+</span>
            </div>
          </div>
        </div>
      {:else}
        <!-- Trainer Filters -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Specialty -->
          <div>
            <label for="specialty-select" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Specialty
            </label>
            <select
              id="specialty-select"
              bind:value={filters.specialty}
              on:change={(e) => updateFilter('specialty', e.target.value)}
              class="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 
                     bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="select-specialty"
            >
              <option value="">All Specialties</option>
              {#each specialties as specialty}
                <option value={specialty}>{specialty}</option>
              {/each}
            </select>
          </div>

          <!-- Max Hourly Rate -->
          <div>
            <label for="max-hourly-rate-range" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Max Hourly Rate: ${filters.maxHourlyRate || 'Any'}
            </label>
            <input
              id="max-hourly-rate-range"
              type="range"
              min="0"
              max="200"
              step="10"
              bind:value={filters.maxHourlyRate}
              on:input={(e) => updateFilter('maxHourlyRate', parseInt(e.target.value))}
              class="w-full"
              data-testid="range-max-hourly-rate"
            />
            <div class="flex justify-between text-xs text-slate-500 mt-1">
              <span>$0</span>
              <span>$200+</span>
            </div>
          </div>
        </div>
      {/if}

      <!-- Clear Filters -->
      {#if hasActiveFilters()}
        <div class="mt-6 flex justify-end">
          <button
            on:click={clearFilters}
            class="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            data-testid="button-clear-filters"
          >
            Clear All Filters
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>