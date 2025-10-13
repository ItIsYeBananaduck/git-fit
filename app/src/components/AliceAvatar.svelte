<script>
  import { onMount } from 'svelte';
  import { Capacitor } from '@capacitor/core';
  import { Health } from '@capawesome/capacitor-health'; // Assuming plugin for HealthKit/Whoop

  let metrics = { strain: 0, calories: 0 };
  let color = '#4b0082'; // Default, user customizable
  let glowIntensity = 50;
  let expression = 'neutral';

  // Mock Llama 3.1 query - replace with actual local Llama integration
  async function llamaQuery(input) {
    // Simulate Llama 3.1 response based on strain
    if (input.strain > 8) return 'energetic';
    if (input.strain > 5) return 'focused';
    return 'calm';
  }

  onMount(async () => {
    // Fetch metrics from Fly.io or local
    try {
      metrics = await fetch('https://adaptive-fit-api.fly.dev/metrics').then(res => res.json());
    } catch (e) {
      // Fallback to Capacitor Health plugin
      if (Capacitor.isNativePlatform()) {
        const result = await Health.query({
          readPermissions: ['STEPS', 'CALORIES', 'HEART_RATE'],
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          endDate: new Date()
        });
        metrics = {
          strain: result.value.find(v => v.type === 'HEART_RATE')?.value || 0,
          calories: result.value.find(v => v.type === 'CALORIES')?.value || 0
        };
      }
    }

    // Get expression from Llama
    expression = await llamaQuery({ strain: metrics.strain });
    glowIntensity = expression === 'energetic' ? 75 : expression === 'focused' ? 60 : 50;
  });

  // Function to update color (from settings)
  function updateColor(newColor) {
    color = newColor;
    // Save to Fly.io
    fetch('https://adaptive-fit-api.fly.dev/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color, glowIntensity })
    });
  }
</script>

<div class="avatar-container" style="--body-color: {color}; --glow-intensity: {glowIntensity}px;">
  <div class="avatar-body">
    <div class="avatar-head">
      <div class="avatar-eye left"></div>
      <div class="avatar-eye right"></div>
    </div>
    <div class="avatar-limb arm-left"></div>
    <div class="avatar-limb arm-right"></div>
    <div class="avatar-limb leg-left"></div>
    <div class="avatar-limb leg-right"></div>
    <div class="accessories">
      <!-- Future accessories like headbands -->
    </div>
  </div>
</div>

<style>
  :root {
    --body-color: #4b0082;
    --glow-color: #8b00ff;
    --eye-color: #ffffff;
    --body-blur: blur(2px);
  }

  .avatar-container {
    position: relative;
    width: 120px;
    height: 180px;
    animation: float 2s ease-in-out infinite;
  }

  .avatar-body {
    position: absolute;
    bottom: 0;
    width: 100px;
    height: 150px;
    background: var(--body-color);
    border-radius: 50px;
    box-shadow:
      0 0 var(--glow-intensity) var(--glow-color),
      inset 0 0 20px rgba(0, 0, 0, 0.2);
    filter: var(--body-blur);
    left: 10px;
  }

  .avatar-head {
    position: absolute;
    top: -30px;
    width: 50px;
    height: 50px;
    background: var(--body-color);
    border-radius: 50%;
    left: 35px;
    box-shadow:
      inset 0 0 10px rgba(0, 0, 0, 0.3),
      0 0 calc(var(--glow-intensity) * 0.5) var(--glow-color);
  }

  .avatar-eye {
    position: absolute;
    width: 10px;
    height: 10px;
    background: var(--eye-color);
    border-radius: 50%;
    box-shadow: 0 0 15px var(--eye-color);
    top: 15px;
  }

  .avatar-eye.left { left: 10px; }
  .avatar-eye.right { right: 10px; }

  .avatar-limb {
    position: absolute;
    background: var(--body-color);
    border-radius: 25px;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
  }

  .arm-left {
    width: 20px;
    height: 60px;
    top: 20px;
    left: -10px;
    transform: rotate(-10deg);
  }

  .arm-right {
    width: 20px;
    height: 60px;
    top: 20px;
    right: -10px;
    transform: rotate(10deg);
  }

  .leg-left {
    width: 25px;
    height: 70px;
    bottom: -20px;
    left: 20px;
  }

  .leg-right {
    width: 25px;
    height: 70px;
    bottom: -20px;
    right: 20px;
  }

  .accessories {
    position: absolute;
    top: -35px;
    left: 30px;
    width: 60px;
    height: 60px;
    /* Placeholder for future accessories */
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 var(--glow-intensity) var(--glow-color); }
    50% { box-shadow: 0 0 calc(var(--glow-intensity) * 1.2) var(--glow-color); }
  }

  /* Canvas fallback for low-end devices */
  @media (max-width: 480px) {
    .avatar-container {
      /* Use canvas rendering if needed */
    }
  }
</style>