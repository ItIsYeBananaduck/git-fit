<script lang="ts">
// Trainer Dashboard: CRUD for programs, purchase/subscription tracking, revenue summary (Stripe)
import { onMount } from 'svelte';
import { api } from '$lib/convex/_generated/api';
import { user } from '$lib/stores/auth';
import { get } from 'svelte/store';

let programs = [];
let purchases = [];
let revenue = 0;
let error = '';
let loading = true;
let showCreateForm = false;
let newProgram = {
  title: '',
  goal: '',
  description: '',
  durationWeeks: 4,
  equipment: '',
  priceType: 'subscription',
  price: 0,
  jsonData: ''
};

async function fetchDashboard() {
  loading = true;
  error = '';
  try {
    const currentUser = get(user);
    if (!currentUser || currentUser.role !== 'trainer') {
      error = 'You must be logged in as a trainer to view this page.';
      loading = false;
      return;
    }
    const trainerId = currentUser._id;
    programs = await api.programs.getProgramsByTrainer({ trainerId });
    purchases = await api.purchases.getPurchasesByTrainer({ trainerId });
    revenue = await api.purchases.getTrainerRevenue({ trainerId });
  } catch (e: any) {
    error = e.message || 'Failed to load dashboard.';
  }
  loading = false;
}

onMount(fetchDashboard);

async function createProgram() {
  const currentUser = get(user);
  if (!currentUser) return;
  try {
    await api.programs.createProgram({
      programId: crypto.randomUUID(),
      trainerId: currentUser._id,
      title: newProgram.title,
      goal: newProgram.goal,
      description: newProgram.description,
      durationWeeks: Number(newProgram.durationWeeks),
      equipment: newProgram.equipment.split(',').map(e => e.trim()).filter(Boolean),
      priceType: newProgram.priceType,
      price: Number(newProgram.price),
      jsonData: newProgram.jsonData
    });
    showCreateForm = false;
    newProgram = { title: '', goal: '', description: '', durationWeeks: 4, equipment: '', priceType: 'subscription', price: 0, jsonData: '' };
    await fetchDashboard();
  } catch (e: any) {
    error = e.message || 'Failed to create program.';
  }
}

async function deleteProgram(programId: string) {
  try {
    await api.programs.deleteProgram({ programId });
    await fetchDashboard();
  } catch (e: any) {
    error = e.message || 'Failed to delete program.';
  }
}
</script>

<div class="space-y-8">
  <h1 class="text-2xl font-bold">Trainer Dashboard</h1>
  {#if loading}
    <div>Loading...</div>
  {:else}
    {#if error}
      <div class="text-red-600">{error}</div>
    {/if}
    <section>
      <h2 class="text-lg font-semibold mb-2">Your Programs</h2>
      <button class="bg-primary text-white px-4 py-2 rounded mb-4" on:click={showCreateForm = !showCreateForm}>
        {showCreateForm ? 'Cancel' : 'Add New Program'}
      </button>
      {#if showCreateForm}
        <form on:submit|preventDefault={createProgram} class="space-y-2 mb-4">
          <input class="border px-2 py-1 rounded w-full" placeholder="Title" bind:value={newProgram.title} required />
          <input class="border px-2 py-1 rounded w-full" placeholder="Goal" bind:value={newProgram.goal} required />
          <textarea class="border px-2 py-1 rounded w-full" placeholder="Description" bind:value={newProgram.description} required></textarea>
          <input class="border px-2 py-1 rounded w-full" type="number" placeholder="Duration (weeks)" bind:value={newProgram.durationWeeks} required />
          <input class="border px-2 py-1 rounded w-full" placeholder="Equipment (comma separated)" bind:value={newProgram.equipment} />
          <select class="border px-2 py-1 rounded w-full" bind:value={newProgram.priceType} required>
            <option value="subscription">Subscription</option>
            <option value="oneTime">One Time</option>
          </select>
          <input class="border px-2 py-1 rounded w-full" type="number" placeholder="Price (USD)" bind:value={newProgram.price} required />
          <textarea class="border px-2 py-1 rounded w-full" placeholder="Program JSON Data" bind:value={newProgram.jsonData}></textarea>
          <button class="bg-green-600 text-white px-4 py-2 rounded" type="submit">Create Program</button>
        </form>
      {/if}
      {#if programs.length === 0}
        <div>No programs found.</div>
      {:else}
        <ul>
          {#each programs as program}
            <li class="flex items-center justify-between mb-2">
              <span>{program.title} ({program.durationWeeks} weeks) - {program.price} USD</span>
              <button class="bg-red-600 text-white px-2 py-1 rounded ml-2" on:click={() => deleteProgram(program.programId)}>Delete</button>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
    <section>
      <h2 class="text-lg font-semibold mb-2 mt-6">Purchases & Subscriptions</h2>
      <!-- Purchases/subscriptions table -->
      {#if purchases.length === 0}
        <div>No purchases yet.</div>
      {:else}
        <ul>
          {#each purchases as purchase}
            <li>{purchase.programId} - {purchase.status} ({purchase.type})</li>
          {/each}
        </ul>
      {/if}
    </section>
    <section>
      <h2 class="text-lg font-semibold mb-2 mt-6">Revenue Summary</h2>
      <div>Total Revenue: <span class="font-bold">${revenue}</span></div>
    </section>
  {/if}
</div>
