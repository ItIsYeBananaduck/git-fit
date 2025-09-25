<script lang="ts">
	import { onMount } from 'svelte';
	import Recaptcha from '$lib/components/Recaptcha.svelte';
	let platform: 'ios' | 'web' | 'pwa' = 'web';
	let loading = false;
	let recaptchaToken = '';
	let recaptchaRef: any;

	onMount(() => {
		if ((window.navigator as Navigator & { standalone?: boolean }).standalone) {
			platform = 'pwa';
		} else if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
			platform = 'ios';
		} else {
			platform = 'web';
		}
	});

	async function handlePayment() {
		if (platform === 'ios') {
			alert('Apple IAP flow will be triggered.');
			return;
		}
		loading = true;
		// Example priceId and userId, replace with real values
		const priceId = 'price_123';
		const userId = 'user_456';
		recaptchaToken = recaptchaRef.getToken();
		if (!recaptchaToken) {
			alert('Please complete the reCAPTCHA.');
			loading = false;
			return;
		}
		try {
			const res = await fetch('/api/create-stripe-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ priceId, userId, recaptchaToken })
			});
			const data = await res.json();
			if (data.url) {
				window.location.href = data.url;
			} else {
				alert('Failed to create Stripe session: ' + (data.error || 'Unknown error'));
			}
		} catch (err) {
			alert('Payment error: ' + err);
		} finally {
			loading = false;
		}
	}
</script>

<main>
	<h1>Nutrition AI Payment</h1>
	<p>Platform detected: {platform}</p>
	<Recaptcha bind:this={recaptchaRef} siteKey="YOUR_RECAPTCHA_SITE_KEY" />
	<button on:click={handlePayment} disabled={loading}>
		{loading ? 'Processing...' : 'Start Payment'}
	</button>
</main>
