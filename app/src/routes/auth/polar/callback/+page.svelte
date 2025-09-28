<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { handlePolarCallback } from '$lib/stores/polar.js';
	import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-svelte';

	let status: 'loading' | 'success' | 'error' = 'loading';
	let message = '';
	let countdown = 5;

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const state = urlParams.get('state');
		const error = urlParams.get('error');
		const errorDescription = urlParams.get('error_description');

		if (error) {
			status = 'error';
			message = errorDescription || error;
			startRedirectCountdown();
			return;
		}

		if (!code || !state) {
			status = 'error';
			message = 'Missing authorization code or state parameter';
			startRedirectCountdown();
			return;
		}

		// Get member ID from session
		const memberId = sessionStorage.getItem('polar_member_id');
		if (!memberId) {
			status = 'error';
			message = 'Missing member ID. Please try connecting again.';
			startRedirectCountdown();
			return;
		}

		try {
			await handlePolarCallback(code, state, memberId);
			sessionStorage.removeItem('polar_member_id');

			status = 'success';
			message = 'Successfully connected to Polar!';
			startRedirectCountdown();
		} catch (err) {
			status = 'error';
			message = err instanceof Error ? err.message : 'Failed to connect to Polar';
			startRedirectCountdown();
		}
	});

	function startRedirectCountdown() {
		const interval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				clearInterval(interval);
				goto('/');
			}
		}, 1000);
	}
</script>

<svelte:head>
	<title>Polar Authentication - Adaptive fIt</title>
</svelte:head>

<div class="callback-container">
	<div class="callback-card">
		<div class="status-section">
			{#if status === 'loading'}
				<Loader2 class="status-icon loading" />
				<h2>Connecting to Polar...</h2>
				<p>Please wait while we complete your authentication.</p>
			{:else if status === 'success'}
				<CheckCircle class="status-icon success" />
				<h2>Connection Successful!</h2>
				<p>{message}</p>
			{:else}
				<AlertTriangle class="status-icon error" />
				<h2>Connection Failed</h2>
				<p>{message}</p>
			{/if}
		</div>

		{#if status !== 'loading'}
			<div class="redirect-section">
				<p class="redirect-text">
					Redirecting to home page in <span class="countdown">{countdown}</span> seconds...
				</p>
				<button class="redirect-button" on:click={() => goto('/')}> Go to Home Page </button>
			</div>
		{/if}
	</div>
</div>

<style>
	.callback-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 20px;
	}

	.callback-card {
		background: white;
		border-radius: 16px;
		padding: 48px 32px;
		max-width: 400px;
		width: 100%;
		text-align: center;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.status-section {
		margin-bottom: 32px;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	h2 {
		margin: 0 0 16px 0;
		font-size: 24px;
		font-weight: 700;
		color: #1f2937;
	}

	p {
		margin: 0;
		color: #6b7280;
		line-height: 1.5;
	}

	.redirect-section {
		border-top: 1px solid #e5e7eb;
		padding-top: 24px;
	}

	.redirect-text {
		font-size: 14px;
		margin-bottom: 16px;
	}

	.countdown {
		font-weight: 600;
		color: #3b82f6;
	}

	.redirect-button {
		background: linear-gradient(135deg, #ff6b00 0%, #e85d00 100%);
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.redirect-button:hover {
		transform: translateY(-1px);
	}

	.redirect-button:active {
		transform: translateY(0);
	}
</style>
