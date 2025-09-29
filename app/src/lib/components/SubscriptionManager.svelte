<!--
  Subscription Management Component
  Task: T043 - Subscription preferences and management
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import type { Id } from '../../../convex/_generated/dataModel.js';

	// Props
	export let userId: Id<'users'>; // Used in mock implementation for logging

	// State
	let subscription: any = null;
	let personas: any[] = [];
	let isLoading = false;
	let isSaving = false;
	let errorMessage = '';
	let successMessage = '';

	// Form state
	let preferences = {
		voice_enabled: true,
		frequency: 'medium' as 'high' | 'medium' | 'low',
		trigger_types: ['motivation', 'form_correction'] as string[],
		quiet_hours: {
			start_time: '22:00',
			end_time: '07:00',
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
		},
		exercise_focus: [] as string[]
	};

	let selectedPersonaId = '';
	let showUpgradeModal = false;

	const availableTriggerTypes = [
		{
			id: 'motivation',
			label: '💪 Motivation',
			description: 'Encouraging words during tough moments'
		},
		{
			id: 'form_correction',
			label: '🎯 Form Correction',
			description: 'Guidance for proper exercise form'
		},
		{
			id: 'rest_period',
			label: '⏰ Rest Period',
			description: 'Rest time management and reminders'
		},
		{ id: 'progression', label: '📈 Progression', description: 'Advice on increasing difficulty' },
		{ id: 'completion', label: '🎉 Completion', description: 'Celebration of achievements' }
	];

	const exerciseFocusOptions = [
		'Strength Training',
		'Cardio',
		'Yoga',
		'Pilates',
		'Crossfit',
		'Running',
		'Cycling',
		'Swimming',
		'Calisthenics',
		'Powerlifting'
	];

	onMount(async () => {
		await loadSubscription();
		await loadPersonas();
	});

	async function loadSubscription() {
		isLoading = true;
		try {
			// Mock subscription data
			subscription = {
				_id: 'mock-sub-1',
				persona_id: 'alice-persona',
				persona_name: 'Alice',
				subscription_type: 'premium',
				preferences: {
					voice_enabled: true,
					frequency: 'medium',
					trigger_types: ['motivation', 'form_correction', 'encouragement'],
					quiet_hours: {
						start_time: '22:00',
						end_time: '07:00',
						timezone: 'America/New_York'
					},
					exercise_focus: ['Strength Training', 'Cardio']
				},
				billing_cycle: 'monthly',
				trial_end_date: null,
				created_at: Date.now() - 86400000,
				is_trial: false
			};
			preferences = { ...subscription.preferences };
			selectedPersonaId = subscription.persona_id;
		} catch (error) {
			console.error('Failed to load subscription:', error);
			errorMessage = 'Failed to load subscription details';
		} finally {
			isLoading = false;
		}
	}

	async function loadPersonas() {
		try {
			// Mock personas data
			personas = [
				{
					_id: 'alice-persona',
					name: 'Alice',
					description:
						'Energetic and motivational fitness coach who specializes in strength training and high-intensity workouts.',
					voice_id: 'alice-voice',
					personality_traits: ['Energetic', 'Motivational', 'Encouraging'],
					coaching_style: 'High-energy motivational',
					expertise_areas: ['Strength Training', 'HIIT', 'Cardio'],
					voice_settings: {
						stability: 0.75,
						similarity_boost: 0.75
					}
				},
				{
					_id: 'aiden-persona',
					name: 'Aiden',
					description:
						'Technical and analytical fitness expert focused on form correction and progressive training methodologies.',
					voice_id: 'aiden-voice',
					personality_traits: ['Analytical', 'Technical', 'Patient'],
					coaching_style: 'Technical and form-focused',
					expertise_areas: ['Form Correction', 'Progressive Training', 'Injury Prevention'],
					voice_settings: {
						stability: 0.8,
						similarity_boost: 0.7
					}
				}
			];
		} catch (error) {
			console.error('Failed to load personas:', error);
		}
	}

	async function savePreferences() {
		isSaving = true;
		errorMessage = '';
		successMessage = '';

		try {
			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 800));

			// Mock implementation - update local subscription
			if (subscription) {
				subscription.preferences = { ...preferences };
				successMessage = 'Preferences saved successfully!';
				setTimeout(() => (successMessage = ''), 3000);
			}
		} catch (error) {
			console.error('Failed to save preferences:', error);
			errorMessage = 'Failed to save preferences';
		} finally {
			isSaving = false;
		}
	}

	async function changePersona() {
		if (!selectedPersonaId) return;

		isSaving = true;
		errorMessage = '';
		successMessage = '';

		try {
			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 800));

			// Mock implementation - update local subscription
			if (subscription) {
				subscription.persona_id = selectedPersonaId;
				const selectedPersona = personas.find((p) => p._id === selectedPersonaId);
				subscription.persona_name = selectedPersona?.name || 'Unknown';
				successMessage = 'Persona changed successfully!';
				setTimeout(() => (successMessage = ''), 3000);
			}
		} catch (error) {
			console.error('Failed to change persona:', error);
			errorMessage = 'Failed to change persona';
		} finally {
			isSaving = false;
		}
	}

	async function upgradeSubscription(newType: string) {
		isSaving = true;
		errorMessage = '';

		try {
			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Mock implementation - update local subscription
			if (subscription) {
				subscription.subscription_type = newType;
				successMessage = 'Subscription upgraded successfully!';
				showUpgradeModal = false;
				setTimeout(() => (successMessage = ''), 3000);
			}
		} catch (error) {
			console.error('Failed to upgrade subscription:', error);
			errorMessage = 'Failed to upgrade subscription';
		} finally {
			isSaving = false;
		}
	}

	function toggleTriggerType(triggerType: string) {
		if (preferences.trigger_types.includes(triggerType)) {
			preferences.trigger_types = preferences.trigger_types.filter((t) => t !== triggerType);
		} else {
			preferences.trigger_types = [...preferences.trigger_types, triggerType];
		}
	}

	function toggleExerciseFocus(exercise: string) {
		if (preferences.exercise_focus.includes(exercise)) {
			preferences.exercise_focus = preferences.exercise_focus.filter((e) => e !== exercise);
		} else {
			preferences.exercise_focus = [...preferences.exercise_focus, exercise];
		}
	}

	function getSubscriptionFeatures(type: string) {
		switch (type) {
			case 'basic':
				return ['Voice coaching', 'Basic triggers', '5 responses/day'];
			case 'premium':
				return [
					'All basic features',
					'All trigger types',
					'50 responses/day',
					'Persona customization'
				];
			case 'enterprise':
				return [
					'All premium features',
					'Unlimited responses',
					'Custom personas',
					'Priority support'
				];
			default:
				return [];
		}
	}
</script>

<div class="subscription-container">
	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading subscription details...</p>
		</div>
	{:else if !subscription}
		<div class="no-subscription">
			<h2>🚀 Start Your AI Coaching Journey</h2>
			<p>Get personalized coaching with our AI fitness assistant!</p>
			<button class="cta-button" on:click={() => (showUpgradeModal = true)}>
				Start Free Trial
			</button>
		</div>
	{:else}
		<!-- Current Subscription Info -->
		<div class="subscription-info">
			<div class="subscription-header">
				<h2>🤖 AI Coaching Subscription</h2>
				<div class="subscription-badge {subscription.subscription_type}">
					{subscription.subscription_type.toUpperCase()}
					{#if subscription.is_trial}
						<span class="trial-indicator">TRIAL</span>
					{/if}
				</div>
			</div>

			<div class="current-persona">
				<h3>Current AI Coach: {subscription.persona_name}</h3>
				{#if subscription.subscription_type !== 'basic'}
					<button class="change-persona-btn" on:click={() => {}}> Change Coach </button>
				{/if}
			</div>
		</div>

		<!-- Persona Selection -->
		{#if personas.length > 0 && subscription.subscription_type !== 'basic'}
			<div class="persona-selection">
				<h3>Choose Your AI Coach</h3>
				<div class="personas-grid">
					{#each personas as persona}
						<div
							class="persona-card {selectedPersonaId === persona._id ? 'selected' : ''}"
							on:click={() => (selectedPersonaId = persona._id)}
							role="button"
							tabindex="0"
						>
							<div class="persona-name">{persona.name}</div>
							<div class="persona-description">{persona.description}</div>
							<div class="persona-style">{persona.coaching_style}</div>
							<div class="persona-expertise">
								{#each persona.expertise_areas.slice(0, 2) as area}
									<span class="expertise-tag">{area}</span>
								{/each}
							</div>
						</div>
					{/each}
				</div>

				{#if selectedPersonaId !== subscription.persona_id}
					<button class="save-btn" on:click={changePersona} disabled={isSaving}>
						{isSaving ? 'Changing...' : 'Change Coach'}
					</button>
				{/if}
			</div>
		{/if}

		<!-- Preferences -->
		<div class="preferences-section">
			<h3>🎛️ Coaching Preferences</h3>

			<!-- Voice Coaching Toggle -->
			<div class="preference-item">
				<label class="toggle-label">
					<input type="checkbox" bind:checked={preferences.voice_enabled} />
					<span class="toggle-slider"></span>
					Voice Coaching
				</label>
				<p class="preference-description">Enable audio responses from your AI coach</p>
			</div>

			<!-- Coaching Frequency -->
			<div class="preference-item">
				<label for="frequency">Coaching Frequency</label>
				<select id="frequency" bind:value={preferences.frequency}>
					<option value="low">Low - Minimal interruptions</option>
					<option value="medium">Medium - Balanced approach</option>
					<option value="high">High - Maximum guidance</option>
				</select>
			</div>

			<!-- Trigger Types -->
			<div class="preference-item">
				<label>Coaching Triggers</label>
				<div class="trigger-types">
					{#each availableTriggerTypes as trigger}
						<div
							class="trigger-option {preferences.trigger_types.includes(trigger.id)
								? 'selected'
								: ''}"
							on:click={() => toggleTriggerType(trigger.id)}
							role="button"
							tabindex="0"
						>
							<div class="trigger-label">{trigger.label}</div>
							<div class="trigger-description">{trigger.description}</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Quiet Hours -->
			<div class="preference-item">
				<label>Quiet Hours</label>
				<div class="quiet-hours">
					<div class="time-input">
						<label for="start-time">From:</label>
						<input type="time" id="start-time" bind:value={preferences.quiet_hours.start_time} />
					</div>
					<div class="time-input">
						<label for="end-time">To:</label>
						<input type="time" id="end-time" bind:value={preferences.quiet_hours.end_time} />
					</div>
				</div>
				<p class="preference-description">No coaching during these hours</p>
			</div>

			<!-- Exercise Focus -->
			<div class="preference-item">
				<label>Exercise Focus Areas</label>
				<div class="exercise-focus">
					{#each exerciseFocusOptions as exercise}
						<button
							class="focus-tag {preferences.exercise_focus.includes(exercise) ? 'selected' : ''}"
							on:click={() => toggleExerciseFocus(exercise)}
						>
							{exercise}
						</button>
					{/each}
				</div>
			</div>

			<!-- Save Button -->
			<button class="save-preferences-btn" on:click={savePreferences} disabled={isSaving}>
				{isSaving ? 'Saving...' : 'Save Preferences'}
			</button>
		</div>

		<!-- Subscription Management -->
		<div class="subscription-management">
			<h3>📊 Subscription Management</h3>

			<div class="current-plan">
				<div class="plan-info">
					<h4>{subscription.subscription_type.toUpperCase()} Plan</h4>
					<ul class="plan-features">
						{#each getSubscriptionFeatures(subscription.subscription_type) as feature}
							<li>✓ {feature}</li>
						{/each}
					</ul>
				</div>

				{#if subscription.subscription_type !== 'enterprise'}
					<button class="upgrade-btn" on:click={() => (showUpgradeModal = true)}>
						Upgrade Plan
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Success/Error Messages -->
	{#if successMessage}
		<div class="success-message">
			✅ {successMessage}
		</div>
	{/if}

	{#if errorMessage}
		<div class="error-message">
			⚠️ {errorMessage}
			<button class="dismiss-btn" on:click={() => (errorMessage = '')}>×</button>
		</div>
	{/if}

	<!-- Upgrade Modal -->
	{#if showUpgradeModal}
		<div class="modal-overlay" on:click={() => (showUpgradeModal = false)}>
			<div class="modal-content" on:click|stopPropagation>
				<div class="modal-header">
					<h3>Choose Your Plan</h3>
					<button class="modal-close" on:click={() => (showUpgradeModal = false)}>×</button>
				</div>

				<div class="plans-comparison">
					{#each ['basic', 'premium', 'enterprise'] as planType}
						<div class="plan-card {subscription?.subscription_type === planType ? 'current' : ''}">
							<h4>{planType.toUpperCase()}</h4>
							<div class="plan-price">
								{#if planType === 'basic'}
									Free
								{:else if planType === 'premium'}
									$9.99/month
								{:else}
									$19.99/month
								{/if}
							</div>
							<ul class="plan-features">
								{#each getSubscriptionFeatures(planType) as feature}
									<li>✓ {feature}</li>
								{/each}
							</ul>
							{#if subscription?.subscription_type !== planType && planType !== 'basic'}
								<button
									class="select-plan-btn"
									on:click={() => upgradeSubscription(planType)}
									disabled={isSaving}
								>
									{isSaving ? 'Processing...' : 'Select Plan'}
								</button>
							{:else if subscription?.subscription_type === planType}
								<div class="current-plan-badge">Current Plan</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.subscription-container {
		padding: 1rem;
		max-width: 600px;
		margin: 0 auto;
	}

	.loading-state {
		text-align: center;
		padding: 2rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #f3f3f3;
		border-top: 3px solid #3498db;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	.subscription-info {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1.5rem;
		border-radius: 12px;
		margin-bottom: 1.5rem;
	}

	.subscription-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.subscription-badge {
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-weight: bold;
		font-size: 0.8rem;
	}

	.subscription-badge.basic {
		background: #4caf50;
	}

	.subscription-badge.premium {
		background: #ff9800;
	}

	.subscription-badge.enterprise {
		background: #9c27b0;
	}

	.trial-indicator {
		background: #f44336;
		padding: 0.2rem 0.5rem;
		border-radius: 10px;
		margin-left: 0.5rem;
	}

	.personas-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.persona-card {
		border: 2px solid #ddd;
		border-radius: 8px;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.persona-card:hover {
		border-color: #3498db;
		transform: translateY(-2px);
	}

	.persona-card.selected {
		border-color: #3498db;
		background: #e3f2fd;
	}

	.preference-item {
		margin-bottom: 1.5rem;
	}

	.preference-item label {
		display: block;
		font-weight: bold;
		margin-bottom: 0.5rem;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		cursor: pointer;
	}

	.toggle-slider {
		position: relative;
		width: 50px;
		height: 25px;
		background: #ccc;
		border-radius: 25px;
		margin-right: 0.5rem;
		transition: background 0.3s ease;
	}

	.toggle-slider::before {
		content: '';
		position: absolute;
		width: 21px;
		height: 21px;
		background: white;
		border-radius: 50%;
		top: 2px;
		left: 2px;
		transition: transform 0.3s ease;
	}

	input[type='checkbox']:checked + .toggle-slider {
		background: #3498db;
	}

	input[type='checkbox']:checked + .toggle-slider::before {
		transform: translateX(25px);
	}

	input[type='checkbox'] {
		display: none;
	}

	.trigger-types {
		display: grid;
		gap: 0.5rem;
	}

	.trigger-option {
		border: 1px solid #ddd;
		border-radius: 6px;
		padding: 0.8rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.trigger-option:hover {
		border-color: #3498db;
	}

	.trigger-option.selected {
		border-color: #3498db;
		background: #e3f2fd;
	}

	.quiet-hours {
		display: flex;
		gap: 1rem;
	}

	.time-input {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.exercise-focus {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.focus-tag {
		background: #f0f0f0;
		border: 1px solid #ddd;
		border-radius: 20px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.focus-tag:hover {
		background: #e0e0e0;
	}

	.focus-tag.selected {
		background: #3498db;
		color: white;
		border-color: #3498db;
	}

	.save-preferences-btn,
	.save-btn {
		background: #3498db;
		color: white;
		border: none;
		border-radius: 6px;
		padding: 0.8rem 1.5rem;
		cursor: pointer;
		font-weight: bold;
		transition: background 0.3s ease;
	}

	.save-preferences-btn:hover,
	.save-btn:hover {
		background: #2980b9;
	}

	.save-preferences-btn:disabled,
	.save-btn:disabled {
		background: #bdc3c7;
		cursor: not-allowed;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		max-width: 800px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
	}

	.plans-comparison {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.plan-card {
		border: 2px solid #ddd;
		border-radius: 8px;
		padding: 1.5rem;
		text-align: center;
	}

	.plan-card.current {
		border-color: #3498db;
		background: #e3f2fd;
	}

	.plan-price {
		font-size: 1.5rem;
		font-weight: bold;
		color: #3498db;
		margin: 1rem 0;
	}

	.success-message,
	.error-message {
		padding: 0.8rem;
		border-radius: 6px;
		margin-top: 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.success-message {
		background: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.error-message {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.dismiss-btn {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		color: inherit;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
