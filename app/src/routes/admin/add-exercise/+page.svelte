<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { api } from '$lib/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	const dispatch = createEventDispatcher();
	const client = useConvexClient();
	const addExercise = async (data: any) => {
		return await client.mutation(api.exercises.importExercises, data);
	};

	let name = '';
	let force = '';
	let level = '';
	let mechanic = '';
	let equipment = '';
	let primaryMuscles = '';
	let secondaryMuscles = '';
	let instructions = '';
	let category = '';
	let imageUrl = '';
	let error = '';
	let success = false;

	onMount(async () => {
		const user = get(authStore).user;
		if (!user) {
			goto('/auth/login?redirect=' + encodeURIComponent(get(page).url.pathname));
			return;
		}
		if (user.role === 'trainer' || user.role === 'admin') return;
		// Check for active paid subscription using Convex query
		const purchases = await api.functions.purchases.getPurchasesByUser({ userId: user._id });
		const hasActive = purchases.some(
			(p: any) => p.status === 'active' && p.type === 'subscription'
		);
		if (!hasActive) {
			goto('/unauthorized');
		}
	});

	async function submit() {
		error = '';
		success = false;
		try {
			const exercise = {
				id: `${name}-${Date.now()}`,
				name,
				force,
				level,
				mechanic,
				equipment,
				primaryMuscles: primaryMuscles.split(',').map((s) => s.trim()),
				secondaryMuscles: secondaryMuscles.split(',').map((s) => s.trim()),
				instructions: instructions.split('\n').map((s) => s.trim()),
				category,
				images: imageUrl ? [imageUrl] : []
			};
			const result = await addExercise({ exercises: [exercise] });
			if (result.success) {
				success = true;
				name =
					force =
					level =
					mechanic =
					equipment =
					primaryMuscles =
					secondaryMuscles =
					instructions =
					category =
					imageUrl =
						'';
				dispatch('added', { exercise });
			} else {
				error = result.error || 'Unknown error';
			}
		} catch (e) {
			error = e.message || 'Unknown error';
		}
	}
</script>

<h1>Add Custom Exercise</h1>
<form on:submit|preventDefault={submit}>
	<label>Name <input bind:value={name} required /></label>
	<label>Force <input bind:value={force} /></label>
	<label>Level <input bind:value={level} /></label>
	<label>Mechanic <input bind:value={mechanic} /></label>
	<label>Equipment <input bind:value={equipment} /></label>
	<label>Primary Muscles (comma separated) <input bind:value={primaryMuscles} /></label>
	<label>Secondary Muscles (comma separated) <input bind:value={secondaryMuscles} /></label>
	<label>Instructions (one per line) <textarea bind:value={instructions}></textarea></label>
	<label>Category <input bind:value={category} /></label>
	<label>Image URL <input bind:value={imageUrl} /></label>
	<button type="submit">Add Exercise</button>
</form>
{#if error}
	<div class="error">{error}</div>
{/if}
{#if success}
	<div class="success">Exercise added!</div>
{/if}

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 400px;
	}
	label {
		display: flex;
		flex-direction: column;
		font-weight: bold;
	}
	.error {
		color: red;
	}
	.success {
		color: green;
	}
</style>
