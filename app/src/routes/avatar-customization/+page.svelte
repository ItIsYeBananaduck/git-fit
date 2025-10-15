<!-- Customizable Svelte 5 Avatar Demo -->
<script lang="ts">
console.log("Customizable Avatar Demo: Script starting");
import { onMount } from "svelte";
import Avatar from "$lib/components/Avatar.svelte";
import AliceAvatar from "$lib/components/AliceAvatar.svelte";

onMount(() => {
console.log("Customizable Avatar Demo: Page mounted");
});
</script>

<main>
  <h1>🎨 Customizable Svelte 5 Avatar</h1>

  <Avatar />

  <Avatar bodyColor="#ffb6c1" glowColor="#ff69b4" eyeColor="#f0e68c" />

  <Avatar bodyColor="#add8e6" glowColor="#87cefa" eyeColor="#ffffff">
    {#snippet accessories()}
      <div class="hat"></div>
    {/snippet}
  </Avatar>

  <!-- Alice with health integration enabled -->
  <AliceAvatar
    bodyColor="#8b5cf6"
    enableHealthIntegration={true}
    strain={75}
    expression="energetic"
  />

  <!-- Static avatar without animations -->
  <Avatar
    bodyColor="#10b981"
    enableAnimations={false}
  />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5rem;
    padding: 2rem;
    background: radial-gradient(circle, #2c3e50, #1a237e);
    min-height: 100vh;
    color: white;
  }

  h1 {
    color: white;
    text-align: center;
    margin-bottom: 2rem;
  }

  /* Example accessory styling */
  .hat {
    position: absolute;
    width: 100px;
    height: 50px;
    background: linear-gradient(to right, #e74c3c, #c0392b);
    border-radius: 100px 100px 0 0;
    top: -120px;
    transform: scale(0.8);
    z-index: 10;
  }
</style>