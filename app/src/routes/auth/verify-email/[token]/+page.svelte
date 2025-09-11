<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import { convex } from '$lib/convex';
  import { api } from '../../../../../../convex/_generated/api';

  let status: 'idle' | 'verifying' | 'success' | 'error' = 'idle';
  let message = '';

  onMount(async () => {
    const token = get(page).params.token as string;
    if (!token) {
      status = 'error';
      message = 'Missing verification token.';
      return;
    }

    status = 'verifying';
    try {
      const res = await convex.mutation(api.functions.users.verifyEmail, { token });
      if (res?.success) {
        status = 'success';
        message = 'Your email has been verified. You can now sign in.';
      } else {
        status = 'error';
        message = 'Verification failed. The link may be invalid or expired.';
      }
    } catch (e: any) {
      status = 'error';
      message = e?.message || 'Verification failed. The link may be invalid or expired.';
    }
  });
</script>

<svelte:head>
  <title>Verify Email</title>
</svelte:head>

<div class="container">
  {#if status === 'verifying'}
    <p>Verifying your email, please wait…</p>
  {:else if status === 'success'}
    <h1>✅ Email Verified</h1>
    <p>{message}</p>
    <a href="/auth/login" class="btn">Go to Login</a>
  {:else if status === 'error'}
    <h1>⚠️ Verification Error</h1>
    <p>{message}</p>
    <a href="/auth/login" class="btn">Back to Login</a>
  {/if}
</div>

<style>
  .container { max-width: 640px; margin: 4rem auto; padding: 1.25rem; }
  .btn { display: inline-block; margin-top: 1rem; background: #2563eb; color: #fff; padding: 0.6rem 1rem; border-radius: 6px; text-decoration: none; }
  h1 { margin-bottom: 0.5rem; }
</style>
