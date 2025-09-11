<script lang="ts">
  import { PRICING } from '$lib/config/pricing';
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
        <button class="w-full bg-gray-300 text-gray-600 py-2 rounded cursor-not-allowed" disabled>
          Subscribe (configure Stripe to enable)
        </button>
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
        <button class="w-full bg-gray-300 text-gray-600 py-2 rounded cursor-not-allowed" disabled>
          Subscribe (configure Stripe to enable)
        </button>
      </div>
    </div>
  </div>
</div>
