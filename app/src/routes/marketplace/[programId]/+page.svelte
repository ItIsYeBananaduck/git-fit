<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { api } from '../../../lib/api/convex';
	import { user } from '../../../lib/stores/auth';
	import { get } from 'svelte/store';

	let program: any = null;
	let trainer: any = null;
	let loading = true;
	let error = '';

	onMount(async () => {
		loading = true;
		error = '';
		try {
			const programId = $page.params.programId;
			program = await api.query('functions/programs:getProgramById', { programId });
			if (program && program.trainerId) {
				trainer = await api.query('functions/users:getUserById', { userId: program.trainerId });
			}
		} catch (e: any) {
			error = e.message || 'Failed to load program.';
		}
		loading = false;
	});

	async function handlePurchase() {
		const currentUser = get(user);
		if (!currentUser) {
			alert('You must be logged in to purchase.');
			return;
		}
		try {
			const successUrl = window.location.origin + '/marketplace/success';
			const cancelUrl = window.location.href;
			const result = await api.mutation('functions/payments:createOneTimeCheckoutSession', {
				programId: program._id,
				userId: currentUser._id,
				successUrl,
				cancelUrl
			});
			if (result?.url) {
				window.location.href = result.url;
			} else {
				alert('Failed to start checkout.');
			}
		} catch (e) {
			alert(e.message || 'Failed to start checkout.');
		}
	}
</script>

<div class="max-w-3xl mx-auto py-12 px-4">
	{#if loading}
		<div>Loading...</div>
	{:else if error}
		<div class="text-red-600">{error}</div>
	{:else if program}
		<h1 class="text-3xl font-bold mb-4">{program.title}</h1>
		<div class="mb-2 text-lg text-slate-700">{program.goal} • {program.durationWeeks} weeks</div>
		<div class="mb-4 text-slate-600">{program.description}</div>
		<div class="mb-4">
			<span class="font-semibold">Equipment:</span>
			{program.equipment?.join(', ') || 'None'}
		</div>
		<div class="mb-4">
			<span class="font-semibold">Price:</span> ${program.price} ({program.priceType})
		</div>
		{#if trainer}
			<div class="mb-6 p-4 bg-slate-50 rounded border">
				<div class="font-semibold mb-1">Trainer: {trainer.name}</div>
				<div class="text-slate-600">{trainer.bio}</div>
			</div>
		{/if}
		<button class="bg-blue-600 text-white px-6 py-2 rounded" on:click={handlePurchase}>
			Purchase Program
		</button>
	{:else}
		<div>Program not found.</div>
	{/if}
</div>
