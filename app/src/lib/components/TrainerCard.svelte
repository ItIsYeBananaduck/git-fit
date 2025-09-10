<script lang="ts">
  import { Star, User, CheckCircle, DollarSign, Clock, MessageSquare } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  export let trainer: any;

  function formatHourlyRate(rate: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(rate);
  }

  function handleBookCoaching() {
    goto(`/marketplace/trainer/${trainer._id}`);
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-300">
  <!-- Trainer Header -->
  <div class="p-6 border-b border-slate-200 dark:border-slate-700">
    <div class="flex items-center">
      <div class="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mr-4">
        {#if trainer.profileImage}
          <img src={trainer.profileImage} alt={trainer.name} class="w-16 h-16 rounded-full object-cover" />
        {:else}
          <User class="w-8 h-8 text-slate-500" />
        {/if}
      </div>
      <div class="flex-1">
        <div class="flex items-center mb-1">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white mr-2">
            {trainer.name}
          </h3>
          {#if trainer.isVerified}
            <CheckCircle class="w-5 h-5 text-blue-600" />
          {/if}
        </div>
        {#if trainer.rating}
          <div class="flex items-center mb-2">
            <Star class="w-4 h-4 text-yellow-400 fill-current mr-1" />
            <span class="text-sm text-slate-600 dark:text-slate-300">
              {trainer.rating.toFixed(1)} ({trainer.totalClients || 0} clients)
            </span>
          </div>
        {/if}
        {#if trainer.hourlyRate}
          <div class="flex items-center">
            <DollarSign class="w-4 h-4 text-green-600 mr-1" />
            <span class="text-sm font-medium text-green-600">
              {formatHourlyRate(trainer.hourlyRate)}/hour
            </span>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="p-6">
    <!-- Bio -->
    {#if trainer.bio}
      <p class="text-slate-600 dark:text-slate-300 text-sm mb-4 line-clamp-3">
        {trainer.bio}
      </p>
    {/if}

    <!-- Specialties -->
    {#if trainer.specialties && trainer.specialties.length > 0}
      <div class="mb-4">
        <h4 class="text-sm font-medium text-slate-900 dark:text-white mb-2">Specialties</h4>
        <div class="flex flex-wrap gap-1">
          {#each trainer.specialties.slice(0, 4) as specialty}
            <span class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              {specialty}
            </span>
          {/each}
          {#if trainer.specialties.length > 4}
            <span class="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
              +{trainer.specialties.length - 4} more
            </span>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Certifications -->
    {#if trainer.certifications && trainer.certifications.length > 0}
      <div class="mb-4">
        <h4 class="text-sm font-medium text-slate-900 dark:text-white mb-2">Certifications</h4>
        <div class="flex flex-wrap gap-1">
          {#each trainer.certifications.slice(0, 3) as cert}
            <span class="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
              {cert}
            </span>
          {/each}
          {#if trainer.certifications.length > 3}
            <span class="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
              +{trainer.certifications.length - 3} more
            </span>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Stats -->
    {#if trainer.stats}
      <div class="grid grid-cols-2 gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
        <div class="text-center">
          <div class="text-lg font-bold text-slate-900 dark:text-white">
            {trainer.stats.totalPrograms}
          </div>
          <div class="text-xs text-slate-600 dark:text-slate-300">Programs</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-slate-900 dark:text-white">
            {trainer.stats.recentSales}
          </div>
          <div class="text-xs text-slate-600 dark:text-slate-300">Recent Sales</div>
        </div>
      </div>
    {/if}

    <!-- Action Buttons -->
    <div class="space-y-2">
      <button
        on:click={handleBookCoaching}
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg 
               transition-colors duration-200 flex items-center justify-center"
        data-testid="button-book-coaching"
      >
        <Clock class="w-4 h-4 mr-2" />
        Book Coaching
      </button>
      
      <button
        on:click={() => goto(`/marketplace/trainer/${trainer._id}/programs`)}
        class="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 
               text-slate-900 dark:text-white font-medium py-2 px-4 rounded-lg 
               transition-colors duration-200 flex items-center justify-center"
        data-testid="button-view-programs"
      >
        <MessageSquare class="w-4 h-4 mr-2" />
        View Programs
      </button>
    </div>
  </div>
</div>

<style>
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>