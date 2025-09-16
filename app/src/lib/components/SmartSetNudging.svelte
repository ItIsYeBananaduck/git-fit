<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/convex';
	import { useMutation } from 'convex-svelte';
	import { getUserId } from '$lib/auth';

	export let avgRestSec: number = 90; // Default, can be passed in
	export let getCurrentStrain: () => Promise<number>; // Function to get real-time strain from wearable
	export let nudgesEnabled: boolean = false;

	let restTimer: any = null;
	let resting = false;
	let strainStart = 0;
	let strainNow = 0;
	let nudgeTriggered = false;
	let userId: string = '';

	const updateSmartSetNudgeSettings = useMutation(api.users.updateSmartSetNudgeSettings);

	onMount(async () => {
		userId = await getUserId();
	});

	function startRest() {
		if (!nudgesEnabled) return;
		resting = true;
		nudgeTriggered = false;
		getCurrentStrain().then((s) => (strainStart = s));
		restTimer = setTimeout(async () => {
			strainNow = await getCurrentStrain();
			if (strainNow < strainStart * 0.97) {
				nudgeTriggered = true;
				// Optionally, trigger a voice prompt or UI nudge here
				speakNudge();
			}
			resting = false;
		}, avgRestSec * 1000);
	}

	function cancelRest() {
		if (restTimer) clearTimeout(restTimer);
		resting = false;
	}

	function speakNudge() {
		if ('speechSynthesis' in window) {
			const utter = new SpeechSynthesisUtterance("Let's go! Start your next set.");
			window.speechSynthesis.speak(utter);
		}
	}
</script>

<div>
	<button on:click={startRest} disabled={resting || !nudgesEnabled}>Start Rest Timer</button>
	<button on:click={cancelRest} disabled={!resting}>Cancel Rest</button>
	{#if resting}
		<div>Resting... (waiting {avgRestSec} seconds)</div>
	{/if}
	{#if nudgeTriggered}
		<div class="nudge">Let's go! Start your next set.</div>
	{/if}
</div>

<style>
	.nudge {
		color: #007bff;
		font-weight: bold;
		margin-top: 1rem;
	}
</style>
