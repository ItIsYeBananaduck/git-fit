<script>
	import { onMount } from 'svelte';
	import { ConvexClient } from 'convex/browser';
	// Import the generated api JS file (include extension so tooling finds it)
	import { api } from '$lib/convex/_generated/api';

	const client = new ConvexClient(import.meta.env.PUBLIC_CONVEX_URL);

	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		console.log('Auth code:', code);
		console.log('Generated api object keys:', Object.keys(api || {}));

		if (code) {
			try {
				// Prefer the generated function reference if present
				const whoopModule = api?.functions?.trainingPrograms?.['whoop'];
				if (whoopModule && whoopModule.exchangeWhoopCode) {
					client
						.mutation(whoopModule.exchangeWhoopCode, { code })
						.then((data) => {
							console.log('Access Token:', data.access_token);
						})
						.catch((error) => {
							console.error('Error exchanging code:', error);
						});
				} else {
					console.error(
						'Whoop function reference not found in generated api. Run `npx convex dev` to regenerate.'
					);
				}
			} catch (e) {
				console.error('Error calling Convex mutation:', e);
			}
		}
	});
</script>

<main>
	<h1>Authenticating...</h1>
</main>
