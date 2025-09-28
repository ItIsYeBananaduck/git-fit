<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { checkPasswordStrength } from '$lib/utils/password';
	import type { PasswordStrength } from '$lib/utils/password';

	let currentStep = 1;
	let loading = false;
	let error = '';

	// Form data
	let email = '';
	let password = '';
	let confirmPassword = '';
	let name = '';
	let role: 'client' | 'trainer' = 'client';

	// Client-specific fields
	let fitnessLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
	let goals: string[] = [];
	let height = '';
	let weight = '';
	let dateOfBirth = '';

	// Trainer-specific fields
	let bio = '';
	let specialties: string[] = [];
	let certifications: string[] = [];
	let hourlyRate = '';
	let experience = '';

	// Available certifications
	const availableCertifications = [
		'NASM-CPT',
		'ACE-CPT',
		'ACSM-CPT',
		'NSCA-CPT',
		'ISSA-CPT',
		'NCSF-CPT',
		'NFPT-CPT',
		'AFAA',
		'Yoga Alliance RYT-200',
		'Yoga Alliance RYT-500',
		'Pilates Certification',
		'CrossFit Level 1',
		'CrossFit Level 2',
		'Precision Nutrition',
		'FMS (Functional Movement Screen)',
		'TRX Certification',
		'Kettlebell Certification',
		'Other'
	];

	// Password strength
	let passwordStrength: PasswordStrength = { score: 0, feedback: [], isValid: false };
	let showPassword = false;

	// Available options
	const fitnessGoals = [
		'Weight Loss',
		'Muscle Gain',
		'Strength Building',
		'Endurance',
		'Flexibility',
		'General Fitness',
		'Sport Performance',
		'Rehabilitation'
	];

	const trainerSpecialties = [
		'Weight Training',
		'Cardio',
		'HIIT',
		'Yoga',
		'Pilates',
		'CrossFit',
		'Bodybuilding',
		'Powerlifting',
		'Olympic Lifting',
		'Functional Training',
		'Sports Conditioning',
		'Rehabilitation',
		'Senior Fitness',
		'Youth Training'
	];

	onMount(() => {
		// If already authenticated, redirect
		if ($authStore.isAuthenticated) {
			goto('/');
		}
	});

	$: {
		if (password) {
			passwordStrength = checkPasswordStrength(password);
		}
	}

	function toggleGoal(goal: string) {
		if (goals.includes(goal)) {
			goals = goals.filter((g) => g !== goal);
		} else {
			goals = [...goals, goal];
		}
	}

	function toggleSpecialty(specialty: string) {
		if (specialties.includes(specialty)) {
			specialties = specialties.filter((s) => s !== specialty);
		} else {
			specialties = [...specialties, specialty];
		}
	}

	function toggleCertification(certification: string) {
		if (certifications.includes(certification)) {
			certifications = certifications.filter((c) => c !== certification);
		} else {
			certifications = [...certifications, certification];
		}
	}

	function nextStep() {
		error = '';

		if (currentStep === 1) {
			// Validate basic info
			if (!email || !password || !confirmPassword || !name) {
				error = 'Please fill in all required fields';
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
		}

		if (currentStep === 2 && role === 'client') {
			// Validate client info
			if (goals.length === 0) {
				error = 'Please select at least one fitness goal';
				return;
			}
		}

		if (currentStep === 2 && role === 'trainer') {
			// Validate trainer info
			if (!bio.trim()) {
				error = 'Please provide a bio';
				return;
			}
			if (specialties.length === 0) {
				error = 'Please select at least one specialty';
				return;
			}
		}

		currentStep++;
	}

	function prevStep() {
		error = '';
		currentStep--;
	}

	async function handleRegister() {
		loading = true;
		error = '';

		try {
			const profileData =
				role === 'client'
					? {
							fitnessLevel,
							goals,
							height: height ? parseInt(height) : undefined,
							weight: weight ? parseInt(weight) : undefined,
							dateOfBirth: dateOfBirth || undefined,
							preferences: {
								units: 'metric',
								notifications: true,
								dataSharing: false
							}
						}
					: {
							bio: bio.trim(),
							specialties,
							certifications,
							hourlyRate: hourlyRate ? parseFloat(hourlyRate) : 0,
							experience: experience ? parseInt(experience) : 0,
							preferences: {
								notifications: true,
								clientCommunication: true
							}
						};

			const result = await authStore.register({
				email: email.toLowerCase().trim(),
				password,
				name: name.trim(),
				role,
				profile: profileData
			});

			if (result.success) {
				// Registration successful, redirect to dashboard
				goto('/');
			} else {
				error = result.error || 'Registration failed';
				currentStep = 1; // Go back to first step to show error
			}
		} catch (err) {
			error = 'An unexpected error occurred. Please try again.';
			currentStep = 1;
		} finally {
			loading = false;
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
	<title>Register - Adaptive fIt</title>
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
		<h2 class="mt-6 text-center text-3xl font-bold text-gray-900">Create your account</h2>
		<p class="mt-2 text-center text-sm text-gray-600">
			Already have an account?
			<a href="/auth/login" class="font-medium text-blue-600 hover:text-blue-500"> Sign in here </a>
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
			<!-- Progress Indicator -->
			<div class="mb-8">
				<div class="flex items-center">
					{#each [1, 2, 3] as step}
						<div class="flex items-center {step < 3 ? 'flex-1' : ''}">
							<div
								class="flex items-center justify-center w-8 h-8 rounded-full {currentStep >= step
									? 'bg-blue-600 text-white'
									: 'bg-gray-200 text-gray-600'} text-sm font-medium"
							>
								{step}
							</div>
							{#if step < 3}
								<div
									class="flex-1 h-1 mx-2 {currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}"
								></div>
							{/if}
						</div>
					{/each}
				</div>
				<div class="flex justify-between mt-2 text-xs text-gray-500">
					<span>Basic Info</span>
					<span>Profile</span>
					<span>Complete</span>
				</div>
			</div>

			<!-- Step 1: Basic Information -->
			{#if currentStep === 1}
				<div class="space-y-6">
					<!-- Role Selection -->
					<div>
						<fieldset>
							<legend class="block text-sm font-medium text-gray-700 mb-3">
								I want to join as a:
							</legend>
							<div class="grid grid-cols-2 gap-3">
								<button
									type="button"
									class="p-4 border-2 rounded-lg text-center {role === 'client'
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-200 hover:border-gray-300'}"
									on:click={() => (role = 'client')}
								>
									<div class="text-2xl mb-2">🏃‍♂️</div>
									<div class="font-medium">Client</div>
									<div class="text-xs text-gray-500">Find trainers & programs</div>
								</button>
								<button
									type="button"
									class="p-4 border-2 rounded-lg text-center {role === 'trainer'
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-200 hover:border-gray-300'}"
									on:click={() => (role = 'trainer')}
								>
									<div class="text-2xl mb-2">💪</div>
									<div class="font-medium">Trainer</div>
									<div class="text-xs text-gray-500">Offer services & programs</div>
								</button>
							</div>
						</fieldset>
					</div>

					<!-- Name -->
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700"> Full Name * </label>
						<input
							id="name"
							type="text"
							required
							bind:value={name}
							class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
							placeholder="Enter your full name"
						/>
					</div>

					<!-- Email -->
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700">
							Email Address *
						</label>
						<input
							id="email"
							type="email"
							required
							bind:value={email}
							class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
							placeholder="Enter your email"
						/>
					</div>

					<!-- Password -->
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700">
							Password *
						</label>
						<div class="mt-1 relative">
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								required
								bind:value={password}
								class="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
								placeholder="Create a strong password"
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
							Confirm Password *
						</label>
						<input
							id="confirmPassword"
							type="password"
							required
							bind:value={confirmPassword}
							class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
							placeholder="Confirm your password"
						/>
						{#if confirmPassword && password !== confirmPassword}
							<p class="mt-1 text-xs text-red-600">Passwords do not match</p>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Step 2: Profile Information -->
			{#if currentStep === 2}
				{#if role === 'client'}
					<div class="space-y-6">
						<h3 class="text-lg font-medium text-gray-900">Tell us about your fitness goals</h3>

						<!-- Fitness Level -->
						<div>
							<fieldset>
								<legend class="block text-sm font-medium text-gray-700 mb-3">
									Current Fitness Level
								</legend>
								<div class="grid grid-cols-3 gap-3">
									{#each ['beginner', 'intermediate', 'advanced'] as level}
										<button
											type="button"
											class="p-3 border-2 rounded-lg text-center {fitnessLevel === level
												? 'border-blue-500 bg-blue-50'
												: 'border-gray-200 hover:border-gray-300'}"
											on:click={() =>
												(fitnessLevel = level as 'beginner' | 'intermediate' | 'advanced')}
										>
											<div class="font-medium capitalize">{level}</div>
										</button>
									{/each}
								</div>
							</fieldset>
						</div>

						<!-- Goals -->
						<div>
							<fieldset>
								<legend class="block text-sm font-medium text-gray-700 mb-3">
									Fitness Goals (select all that apply) *
								</legend>
								<div class="grid grid-cols-2 gap-2">
									{#each fitnessGoals as goal}
										<button
											type="button"
											class="p-2 text-sm border-2 rounded-lg {goals.includes(goal)
												? 'border-blue-500 bg-blue-50 text-blue-700'
												: 'border-gray-200 hover:border-gray-300'}"
											on:click={() => toggleGoal(goal)}
										>
											{goal}
										</button>
									{/each}
								</div>
							</fieldset>
						</div>

						<!-- Optional Physical Stats -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label for="height" class="block text-sm font-medium text-gray-700">
									Height (cm)
								</label>
								<input
									id="height"
									type="number"
									bind:value={height}
									class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									placeholder="170"
								/>
							</div>
							<div>
								<label for="weight" class="block text-sm font-medium text-gray-700">
									Weight (kg)
								</label>
								<input
									id="weight"
									type="number"
									bind:value={weight}
									class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									placeholder="70"
								/>
							</div>
						</div>

						<!-- Date of Birth -->
						<div>
							<label for="dateOfBirth" class="block text-sm font-medium text-gray-700">
								Date of Birth (optional)
							</label>
							<input
								id="dateOfBirth"
								type="date"
								bind:value={dateOfBirth}
								class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
							/>
						</div>
					</div>
				{:else}
					<!-- Trainer Profile -->
					<div class="space-y-6">
						<h3 class="text-lg font-medium text-gray-900">Tell us about your training expertise</h3>

						<!-- Bio -->
						<div>
							<label for="bio" class="block text-sm font-medium text-gray-700">
								Professional Bio *
							</label>
							<textarea
								id="bio"
								rows="4"
								bind:value={bio}
								class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
								placeholder="Tell clients about your experience, approach, and what makes you unique..."
							></textarea>
						</div>

						<!-- Specialties -->
						<div>
							<fieldset>
								<legend class="block text-sm font-medium text-gray-700 mb-3">
									Specialties (select all that apply) *
								</legend>
								<div class="grid grid-cols-2 gap-2">
									{#each trainerSpecialties as specialty}
										<button
											type="button"
											class="p-2 text-sm border-2 rounded-lg {specialties.includes(specialty)
												? 'border-blue-500 bg-blue-50 text-blue-700'
												: 'border-gray-200 hover:border-gray-300'}"
											on:click={() => toggleSpecialty(specialty)}
										>
											{specialty}
										</button>
									{/each}
								</div>
							</fieldset>
						</div>

						<!-- Certifications -->
						<div>
							<fieldset>
								<legend class="block text-sm font-medium text-gray-700 mb-3">
									Certifications (select all that apply)
								</legend>
								<div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
									{#each availableCertifications as certification}
										<button
											type="button"
											class="p-2 text-sm border-2 rounded-lg text-left {certifications.includes(
												certification
											)
												? 'border-blue-500 bg-blue-50 text-blue-700'
												: 'border-gray-200 hover:border-gray-300'}"
											on:click={() => toggleCertification(certification)}
										>
											{certification}
										</button>
									{/each}
								</div>
							</fieldset>
						</div>

						<!-- Experience & Rate -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label for="experience" class="block text-sm font-medium text-gray-700">
									Years of Experience
								</label>
								<input
									id="experience"
									type="number"
									bind:value={experience}
									class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									placeholder="5"
								/>
							</div>
							<div>
								<label for="hourlyRate" class="block text-sm font-medium text-gray-700">
									Hourly Rate ($)
								</label>
								<input
									id="hourlyRate"
									type="number"
									bind:value={hourlyRate}
									class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
									placeholder="75"
								/>
							</div>
						</div>
					</div>
				{/if}
			{/if}

			<!-- Step 3: Confirmation -->
			{#if currentStep === 3}
				<div class="text-center space-y-6">
					<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
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
					<h3 class="text-lg font-medium text-gray-900">Ready to get started!</h3>
					<p class="text-gray-600">
						You're all set to join Adaptive fIt as a {role}.
						{#if role === 'client'}
							Start exploring programs and connecting with trainers.
						{:else}
							Begin creating programs and connecting with clients.
						{/if}
					</p>

					<div class="bg-gray-50 rounded-lg p-4 text-left">
						<h4 class="font-medium text-gray-900 mb-2">Account Summary:</h4>
						<div class="space-y-1 text-sm text-gray-600">
							<div><strong>Name:</strong> {name}</div>
							<div><strong>Email:</strong> {email}</div>
							<div><strong>Role:</strong> {role === 'client' ? 'Client' : 'Trainer'}</div>
							{#if role === 'client'}
								<div><strong>Fitness Level:</strong> {fitnessLevel}</div>
								<div><strong>Goals:</strong> {goals.join(', ')}</div>
							{:else}
								<div>
									<strong>Specialties:</strong>
									{specialties.slice(0, 3).join(', ')}{specialties.length > 3 ? '...' : ''}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- Error Message -->
			{#if error}
				<div class="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
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

			<!-- Navigation Buttons -->
			<div class="mt-6 flex justify-between">
				{#if currentStep > 1}
					<button
						type="button"
						on:click={prevStep}
						class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						Back
					</button>
				{:else}
					<div></div>
				{/if}

				{#if currentStep < 3}
					<button
						type="button"
						on:click={nextStep}
						class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						Continue
					</button>
				{:else}
					<button
						type="button"
						on:click={handleRegister}
						disabled={loading}
						class="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if loading}
							<svg
								class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
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
							Creating Account...
						{:else}
							Create Account
						{/if}
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
