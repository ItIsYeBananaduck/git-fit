<script lang="ts">
  import { PRICING } from '$lib/config/pricing';
  import { convex } from '$lib/convex';
  import { api } from '$lib/convex';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { get } from 'svelte/store';

  let msg = '';
  let loadingPlan: string | null = null;

  async function subscribe(plan: 'consumer_monthly' | 'consumer_annual' | 'trainer_pro_monthly') {
    msg = '';
    loadingPlan = plan;
    try {
      const current = get(authStore);
      const userEmail = current?.user?.email as string | undefined;
      const res = await convex.mutation(api.functions.payments.createCheckoutSession, {
        plan,
        successUrl: `${location.origin}/pricing/success`,
        cancelUrl: `${location.origin}/pricing/cancel`,
        userEmail,
      });
      if ((res as any)?.ok && (res as any)?.url) {
        // Navigate to Stripe Checkout
        location.href = (res as any).url as string;
      } else {
        msg = ((res as any)?.error as string) || 'Unable to start checkout right now.';
      }
    } catch (e: any) {
      msg = e?.message || 'Something went wrong starting checkout.';
    } finally {
      loadingPlan = null;
    }
  }
</script>

<svelte:head>
  <title>Pricing - Technically Fit</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12">
  <div class="max-w-5xl mx-auto px-4">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Pricing</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-2">Consumer (Web)</h2>
        <p class="text-gray-600 mb-4">Subscribe on the web to get the best price.</p>
        <ul class="space-y-2 text-gray-800 mb-4">
          <li>• {PRICING.web.consumerMonthly.label}</li>
          <li>• {PRICING.web.consumerAnnual.label}</li>
        </ul>
        <div class="grid grid-cols-1 gap-2">
          <button on:click={() => subscribe('consumer_monthly')} class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded disabled:opacity-50" disabled={loadingPlan !== null}>
            {loadingPlan === 'consumer_monthly' ? 'Starting…' : 'Subscribe Monthly'}
          </button>
          <button on:click={() => subscribe('consumer_annual')} class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded disabled:opacity-50" disabled={loadingPlan !== null}>
            {loadingPlan === 'consumer_annual' ? 'Starting…' : 'Subscribe Annual'}
          </button>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-2">Consumer (iOS)</h2>
        <p class="text-gray-600 mb-4">In-app purchase via Apple.</p>
        <ul class="space-y-2 text-gray-800 mb-4">
          <li>• {PRICING.ios.consumerMonthly.label}</li>
        </ul>
        <button class="w-full bg-gray-300 text-gray-600 py-2 rounded cursor-not-allowed" disabled>
          Subscribe in-app (coming soon)
        </button>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-2">Trainer Pro (B2B)</h2>
        <p class="text-gray-600 mb-4">Professional tools for trainers.</p>
        <ul class="space-y-2 text-gray-800 mb-4">
          <li>• {PRICING.trainerPro.monthly.label}</li>
          <li class="text-sm text-gray-500">{PRICING.trainerPro.notes}</li>
        </ul>
        <button on:click={() => subscribe('trainer_pro_monthly')} class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded disabled:opacity-50" disabled={loadingPlan !== null}>
          {loadingPlan === 'trainer_pro_monthly' ? 'Starting…' : 'Subscribe Trainer Pro'}
        </button>
      </div>
    </div>

    {#if msg}
      <div class="max-w-5xl mx-auto px-4 mt-6">
        <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-3">
          {msg}
        </div>
      </div>
    {/if}
  </div>
</div>
