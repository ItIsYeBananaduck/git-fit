<script lang="ts">
	// This component displays the privacy policy from PRIVACY.md
	import { onMount } from 'svelte';
	let policy = '';

	onMount(async () => {
		const res = await fetch('/PRIVACY.md');
		policy = await res.text();
	});
</script>

<svelte:head>
	<title>Privacy Policy | Technically Fit</title>
</svelte:head>

<main>
	<h1>Privacy Policy</h1>
	{#if policy}
		<article class="privacy-policy" bind:this={policyContainer}>
			{@html policy.replace(/\n/g, '<br>')}
		</article>
	{:else}
		<p>Loading privacy policy...</p>
	{/if}
</main>

<style>
	.privacy-policy {
		max-width: 800px;
		margin: 2rem auto;
		padding: 2rem;
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		font-size: 1.1rem;
		line-height: 1.7;
	}
</style>
