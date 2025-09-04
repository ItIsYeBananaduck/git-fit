<script>
	import { useAction } from 'convex-svelte';

	const convex = useConvexClient(client);

	const urlParams = new URLSearchParams(window.location.search);
	const code = urlParams.get('code');

	if (code) {
		useAction('exchangeWhoopCode')({ code }).then((data) => {
			console.log('Access Token:', data.access_token);
		});
	}
</script>

<main>
	<h1>Authenticating...</h1>
</main>
