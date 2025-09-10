<script lang="ts">
  import { Star, Clock, Target, DollarSign, User, CheckCircle } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  export let program: any;

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  function handlePurchase() {
    goto(`/marketplace/program/${program._id}`);
  }

  function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-300">
  <!-- Program Image/Header -->
  <div class="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative">
    <div class="absolute inset-0 bg-black bg-opacity-20"></div>
    <div class="absolute top-4 left-4">
      <span class="px-3 py-1 rounded-full text-xs font-medium {getDifficultyColor(program.difficulty)}">
        {program.difficulty}
      </span>
    </div>
    <div class="absolute top-4 right-4">
      <span class="bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-sm font-bold text-slate-900 dark:text-white">
        {formatPrice(program.price)}
      </span>
    </div>
    <div class="absolute bottom-4 left-4 right-4">
      <h3 class="text-xl font-bold text-white mb-1 line-clamp-2">
        {program.name}
      </h3>
    </div>
  </div>

  <div class="p-6">
    <!-- Trainer Info -->
    {#if program.trainer}
      <div class="flex items-center mb-4">
        <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mr-3">
          {#if program.trainer.profileImage}
            <img src={program.trainer.profileImage} alt={program.trainer.name} class="w-10 h-10 rounded-full object-cover" />
          {:else}
            <User class="w-5 h-5 text-slate-500" />
          {/if}
        </div>
        <div class="flex-1">
          <div class="flex items-center">
            <span class="font-medium text-slate-900 dark:text-white mr-2">
              {program.trainer.name}
            </span>
            {#if program.trainer.isVerified}
              <CheckCircle class="w-4 h-4 text-blue-600" />
            {/if}
          </div>
          {#if program.trainer.rating}
            <div class="flex items-center">
              <Star class="w-4 h-4 text-yellow-400 fill-current mr-1" />
              <span class="text-sm text-slate-600 dark:text-slate-300">
                {program.trainer.rating.toFixed(1)} ({program.trainer.totalClients || 0} clients)
              </span>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Program Details -->
    <p class="text-slate-600 dark:text-slate-300 text-sm mb-4 line-clamp-3">
      {program.description}
    </p>

    <!-- Program Stats -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="flex items-center">
        <Clock class="w-4 h-4 text-slate-400 mr-2" />
        <span class="text-sm text-slate-600 dark:text-slate-300">
          {program.duration} weeks
        </span>
      </div>
      <div class="flex items-center">
        <Target class="w-4 h-4 text-slate-400 mr-2" />
        <span class="text-sm text-slate-600 dark:text-slate-300">
          {program.totalPurchases || 0} sold
        </span>
      </div>
    </div>

    <!-- Categories -->
    {#if program.category && program.category.length > 0}
      <div class="flex flex-wrap gap-1 mb-4">
        {#each program.category.slice(0, 3) as cat}
          <span class="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
            {cat}
          </span>
        {/each}
        {#if program.category.length > 3}
          <span class="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
            +{program.category.length - 3} more
          </span>
        {/if}
      </div>
    {/if}

    <!-- Rating -->
    {#if program.rating}
      <div class="flex items-center mb-4">
        <div class="flex items-center mr-2">
          {#each Array(5) as _, i}
            <Star 
              class="w-4 h-4 {i < Math.floor(program.rating) ? 'text-yellow-400 fill-current' : 'text-slate-300'}" 
            />
          {/each}
        </div>
        <span class="text-sm text-slate-600 dark:text-slate-300">
          {program.rating.toFixed(1)}
        </span>
      </div>
    {/if}

    <!-- Purchase Button -->
    <button
      on:click={handlePurchase}
      class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg 
             transition-colors duration-200 flex items-center justify-center"
      data-testid="button-purchase-program"
    >
      <DollarSign class="w-4 h-4 mr-2" />
      Purchase Program
    </button>
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>