<!-- Simple Alice Demo Test -->
<script lang="ts">
console.log("Alice Demo: Script starting");
import { onMount } from "svelte";
import AliceAvatar from "$lib/components/AliceAvatar.svelte";

// Simple state for testing
let customColor = "#8b5cf6"; // Alice body color
let intensity = 65;

onMount(() => {
console.log("Alice Demo: Page mounted");
});
</script>

<div style="padding: 2rem; background: #1a1a2e; min-height: 100vh; color: white;">
<h1>🎨 Alice AI Enhanced Demo</h1>
<p style="color: white; font-size: 24px;">Page loaded successfully!</p>

<div style="border: 2px solid #00bfff; padding: 20px; margin: 20px; background: rgba(0,191,255,0.1);">
<h2>🤖 Alice Avatar Test</h2>
<div style="width: 200px; height: 200px; border: 2px solid #8b5cf6; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
<AliceAvatar
bodyColor={customColor}
strain={intensity}
heartRate={75}
expression="calm"
size={180}
/>
</div>
<p>Alice should appear above in a purple glowing avatar.</p>
</div>
</div>
