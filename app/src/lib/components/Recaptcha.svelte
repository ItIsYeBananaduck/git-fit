<script lang="ts">
	import { onMount } from 'svelte';
	export let siteKey: string;
	let widgetId: number | null = null;
	let token: string = '';

	onMount(() => {
		if (window.grecaptcha) {
			widgetId = window.grecaptcha.render('recaptcha-container', {
				sitekey: siteKey,
				callback: (t: string) => (token = t)
			});
		}
	});

	export function getToken() {
		return token;
	}
</script>

<div id="recaptcha-container"></div>

<!-- Add this to your index.html or layout: -->
<!-- <script src="https://www.google.com/recaptcha/api.js" async defer></script> -->
