<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let email = '';
	let password = '';
	let rememberMe = false;
	let loading = false;
	let error = '';
	let showPassword = false;

	// Form validation states
	let emailError = '';
	let passwordError = '';
	let emailTouched = false;
	let passwordTouched = false;

	// Get redirect URL from query params
	$: redirectTo = $page.url.searchParams.get('redirect') || '/';

	// Real-time validation
	$: if (emailTouched) {
		emailError = validateEmail(email);
	}

	$: if (passwordTouched) {
		passwordError = validatePassword(password);
	}

	// Form validity
	$: isFormValid = email && password && !emailError && !passwordError;

	onMount(() => {
		// If already authenticated, redirect
		if ($authStore.isAuthenticated) {
			goto(redirectTo);
		}
	});

	function validateEmail(email: string): string {
		if (!email) return 'Email is required';
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) return 'Please enter a valid email address';
		return '';
	}

	function validatePassword(password: string): string {
		if (!password) return 'Password is required';
		if (password.length < 8) return 'Password must be at least 8 characters';
		return '';
	}

	function handleEmailBlur() {
		emailTouched = true;
	}

	function handlePasswordBlur() {
		passwordTouched = true;
	}

	async function handleLogin() {
		// Mark all fields as touched for validation
		emailTouched = true;
		passwordTouched = true;

		// Validate form
		const emailValidationError = validateEmail(email);
		const passwordValidationError = validatePassword(password);

		if (emailValidationError || passwordValidationError) {
			emailError = emailValidationError;
			passwordError = passwordValidationError;
			return;
		}

		loading = true;
		error = '';

		try {
			const result = await authStore.login(email, password, rememberMe);

			if (result.success) {
				// Redirect to intended page or dashboard
				goto(redirectTo);
			} else {
				error = result.error || 'Login failed';
			}
		} catch (err) {
			error = 'An unexpected error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && isFormValid && !loading) {
			handleLogin();
		}
	}
</script>

<svelte:head>
	<title>Login - Adaptive fIt</title>
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
		<h2 class="mt-6 text-center text-3xl font-bold text-gray-900">Sign in to your account</h2>
		<p class="mt-2 text-center text-sm text-gray-600">
			Or
			<a href="/auth/register" class="font-medium text-blue-600 hover:text-blue-500">
				create a new account
			</a>
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
			<form class="space-y-6" on:submit|preventDefault={handleLogin}>
				<!-- Email Field -->
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700"> Email address </label>
					<div class="mt-1">
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={email}
							on:blur={handleEmailBlur}
							on:keypress={handleKeyPress}
							class="appearance-none block w-full px-3 py-2 border {emailError && emailTouched
								? 'border-red-300 focus:ring-red-500 focus:border-red-500'
								: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md placeholder-gray-400 focus:outline-none sm:text-sm"
							placeholder="Enter your email"
							disabled={loading}
							aria-invalid={emailError && emailTouched ? 'true' : 'false'}
							aria-describedby={emailError && emailTouched ? 'email-error' : undefined}
						/>
					</div>
					{#if emailError && emailTouched}
						<p id="email-error" class="mt-1 text-sm text-red-600">{emailError}</p>
					{/if}
				</div>

				<!-- Password Field -->
				<div>
					<label for="password" class="block text-sm font-medium text-gray-700"> Password </label>
					<div class="mt-1 relative">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							required
							bind:value={password}
							on:blur={handlePasswordBlur}
							on:keypress={handleKeyPress}
							class="appearance-none block w-full px-3 py-2 pr-10 border {passwordError &&
							passwordTouched
								? 'border-red-300 focus:ring-red-500 focus:border-red-500'
								: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md placeholder-gray-400 focus:outline-none sm:text-sm"
							placeholder="Enter your password"
							disabled={loading}
							aria-invalid={passwordError && passwordTouched ? 'true' : 'false'}
							aria-describedby={passwordError && passwordTouched ? 'password-error' : undefined}
						/>
						<button
							type="button"
							class="absolute inset-y-0 right-0 pr-3 flex items-center"
							on:click={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
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
					{#if passwordError && passwordTouched}
						<p id="password-error" class="mt-1 text-sm text-red-600">{passwordError}</p>
					{/if}
				</div>

				<!-- Remember Me & Forgot Password -->
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<input
							id="remember-me"
							name="remember-me"
							type="checkbox"
							bind:checked={rememberMe}
							class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							disabled={loading}
						/>
						<label for="remember-me" class="ml-2 block text-sm text-gray-900"> Remember me </label>
					</div>

					<div class="text-sm">
						<a href="/auth/forgot-password" class="font-medium text-blue-600 hover:text-blue-500">
							Forgot your password?
						</a>
					</div>
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

				<!-- Submit Button -->
				<div>
					<button
						type="submit"
						disabled={loading || !isFormValid}
						class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white {loading ||
						!isFormValid
							? 'bg-gray-400 cursor-not-allowed'
							: 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
							Signing in...
						{:else}
							Sign in
						{/if}
					</button>
				</div>
			</form>

			<!-- Social Login (Future Enhancement) -->
			<div class="mt-6">
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-300"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-2 bg-white text-gray-500">Or continue with</span>
					</div>
				</div>

				<div class="mt-6 grid grid-cols-2 gap-3">
					<button
						type="button"
						disabled
						class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								fill="#EA4335"
							/>
						</svg>
						<span class="ml-2">Google (Coming Soon)</span>
					</button>

					<button
						type="button"
						disabled
						class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
							<path
								d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"
							/>
						</svg>
						<span class="ml-2">Twitter (Coming Soon)</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
