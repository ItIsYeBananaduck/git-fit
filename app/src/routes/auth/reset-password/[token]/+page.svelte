<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authService } from '$lib/services/authService';
	import { checkPasswordStrength } from '$lib/utils/password';
	import type { PasswordStrength } from '$lib/utils/password';
	import { convex } from '$lib/convex';
	import { api } from '$lib/convex/_generated/api';

	let password = '';
	let confirmPassword = '';
	let loading = false;
	let success = false;
	let error = '';
	let showPassword = false;
	let tokenValidating = true;
	let tokenValid = false;
	let tokenError = '';

	// Password strength
	let passwordStrength: PasswordStrength = { score: 0, feedback: [], isValid: false };

	$: token = $page.params.token;

	$: {
		if (password) {
			passwordStrength = checkPasswordStrength(password);
		}
	}

	// Validate token on mount
	onMount(async () => {
		if (!token) {
			tokenError = 'No reset token provided';
			tokenValidating = false;
			return;
		}

		try {
			const result = await convex.query(api.functions.users.validatePasswordResetToken, {
				token
			});

			if (result.valid) {
				tokenValid = true;
			} else {
				tokenError = result.message || 'Invalid reset token';
			}
		} catch (err) {
			tokenError = 'Failed to validate reset token';
		} finally {
			tokenValidating = false;
		}
	});

	async function handleSubmit() {
		if (!password || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}

		if (!passwordStrength.isValid) {
			error = 'Please choose a stronger password';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		loading = true;
		error = '';

		try {
			if (!token) {
				error = 'No reset token provided';
				return;
			}

			const result = await authService.resetPassword(token, password);

			if (result.success) {
				success = true;
				// Redirect to login after 3 seconds
				setTimeout(() => {
					goto('/auth/login');
				}, 3000);
			} else {
				error = result.error || 'Failed to reset password';
			}
		} catch (err) {
			error = 'An unexpected error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSubmit();
		}
	}

	function getPasswordStrengthColor(score: number): string {
		if (score <= 1) return 'bg-red-500';
		if (score === 2) return 'bg-yellow-500';
		if (score === 3) return 'bg-blue-500';
		return 'bg-green-500';
	}

	function getPasswordStrengthText(score: number): string {
		if (score <= 1) return 'Weak';
		if (score === 2) return 'Fair';
		if (score === 3) return 'Good';
		return 'Strong';
	}
</script>

<svelte:head>
	<title>Reset Password - Adaptive fIt</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="flex justify-center">
			<div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
				<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 10V3L4 14h7v7l9-11h-7z"
					/>
				</svg>
			</div>
		</div>
		<h2 class="mt-6 text-center text-3xl font-bold text-gray-900">Reset your password</h2>
		<p class="mt-2 text-center text-sm text-gray-600">Enter your new password below</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
			{#if tokenValidating}
				<!-- Token Validation Loading State -->
				<div class="text-center">
					<div
						class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
					></div>
					<p class="text-gray-600">Validating reset token...</p>
				</div>
			{:else if !tokenValid}
				<!-- Invalid Token State -->
				<div class="text-center">
					<div
						class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
					>
						<svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">Invalid Reset Link</h3>
					<p class="text-gray-600 mb-6">{tokenError}</p>
					<div class="space-y-3">
						<a
							href="/auth/reset-password"
							class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							Request New Reset Link
						</a>
						<a
							href="/auth/login"
							class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							Back to Sign In
						</a>
					</div>
				</div>
			{:else if success}
				<!-- Success State -->
				<div class="text-center">
					<div
						class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
					>
						<svg
							class="w-8 h-8 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">Password reset successful!</h3>
					<p class="text-gray-600 mb-6">Your password has been updated successfully.</p>
					<p class="text-sm text-gray-500 mb-6">
						You will be redirected to the sign in page in a few seconds...
					</p>
					<a
						href="/auth/login"
						class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						Sign in now
					</a>
				</div>
			{:else}
				<!-- Form State -->
				<form class="space-y-6" on:submit|preventDefault={handleSubmit}>
					<!-- New Password -->
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700">
							New Password
						</label>
						<div class="mt-1 relative">
							<input
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								required
								bind:value={password}
								on:keypress={handleKeyPress}
								class="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
								placeholder="Enter your new password"
								disabled={loading}
							/>
							<button
								type="button"
								class="absolute inset-y-0 right-0 pr-3 flex items-center"
								on:click={() => (showPassword = !showPassword)}
							>
								{#if showPassword}
									<svg
										class="h-5 w-5 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
										/>
									</svg>
								{:else}
									<svg
										class="h-5 w-5 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									</svg>
								{/if}
							</button>
						</div>

						<!-- Password Strength Indicator -->
						{#if password}
							<div class="mt-2">
								<div class="flex items-center space-x-2">
									<div class="flex-1 bg-gray-200 rounded-full h-2">
										<div
											class="h-2 rounded-full transition-all duration-300 {getPasswordStrengthColor(
												passwordStrength.score
											)}"
											style="width: {(passwordStrength.score / 4) * 100}%"
										></div>
									</div>
									<span
										class="text-xs font-medium {passwordStrength.isValid
											? 'text-green-600'
											: 'text-red-600'}"
									>
										{getPasswordStrengthText(passwordStrength.score)}
									</span>
								</div>
								{#if passwordStrength.feedback.length > 0}
									<ul class="mt-1 text-xs text-gray-600">
										{#each passwordStrength.feedback as feedback}
											<li>• {feedback}</li>
										{/each}
									</ul>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Confirm Password -->
					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-700">
							Confirm New Password
						</label>
						<div class="mt-1">
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								required
								bind:value={confirmPassword}
								on:keypress={handleKeyPress}
								class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
								placeholder="Confirm your new password"
								disabled={loading}
							/>
						</div>
						{#if confirmPassword && password !== confirmPassword}
							<p class="mt-1 text-xs text-red-600">Passwords do not match</p>
						{/if}
					</div>

					<!-- Error Message -->
					{#if error}
						<div class="bg-red-50 border border-red-200 rounded-md p-4">
							<div class="flex">
								<svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd"
									/>
								</svg>
								<div class="ml-3">
									<p class="text-sm text-red-800">{error}</p>
								</div>
							</div>
						</div>
					{/if}

					<div>
						<button
							type="submit"
							disabled={loading}
							class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if loading}
								<svg
									class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Updating password...
							{:else}
								Update password
							{/if}
						</button>
					</div>

					<div class="text-center">
						<a href="/auth/login" class="text-sm text-blue-600 hover:text-blue-500">
							← Back to sign in
						</a>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
