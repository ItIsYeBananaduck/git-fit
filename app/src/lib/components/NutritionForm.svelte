<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import {
		nutritionService,
		type HealthProfile,
		type NutritionIntake
	} from '$lib/services/nutritionAI';

	const dispatch = createEventDispatcher();

	export let userId: string;
	export let currentProfile: HealthProfile | null = null;
	export let currentIntake: NutritionIntake | null = null;

	// Health Profile Form Data
	let healthProfile: HealthProfile = {
		medical_conditions: currentProfile?.medical_conditions || [],
		allergies: currentProfile?.allergies || [],
		medications: currentProfile?.medications || [],
		safety_flags: currentProfile?.safety_flags || {
			diabetesFlag: false,
			heartConditionFlag: false,
			kidneyIssueFlag: false,
			digestiveIssueFlag: false,
			eatingDisorderHistory: false
		},
		metabolic_data: currentProfile?.metabolic_data || {},
		body_weight_kg: currentProfile?.body_weight_kg || 70
	};

	// Nutrition Intake Form Data
	let nutritionIntake: NutritionIntake = {
		calories: currentIntake?.calories || 0,
		protein: currentIntake?.protein || 0,
		carbs: currentIntake?.carbs || 0,
		fat: currentIntake?.fat || 0,
		hydration: currentIntake?.hydration || 0
	};

	// Form state
	let activeTab: 'profile' | 'intake' = 'profile';
	let loading = false;
	let message = '';
	let messageType: 'success' | 'error' | 'info' = 'info';

	// Health conditions and allergies lists
	const commonConditions = [
		'diabetes',
		'heart_disease',
		'high_blood_pressure',
		'kidney_disease',
		'digestive_issues',
		'eating_disorder_history',
		'thyroid_issues',
		'celiac_disease',
		'food_allergies',
		'lactose_intolerance'
	];

	const commonAllergies = [
		'peanuts',
		'tree_nuts',
		'shellfish',
		'fish',
		'eggs',
		'milk',
		'soy',
		'wheat',
		'sesame',
		'sulfites'
	];

	// New condition/allergy inputs
	let newCondition = '';
	let newAllergy = '';
	let newMedication = '';

	function addCondition() {
		if (newCondition.trim() && !healthProfile.medical_conditions.includes(newCondition.trim())) {
			healthProfile.medical_conditions = [...healthProfile.medical_conditions, newCondition.trim()];
			newCondition = '';
		}
	}

	function removeCondition(condition: string) {
		healthProfile.medical_conditions = healthProfile.medical_conditions.filter(
			(c) => c !== condition
		);
	}

	function addAllergy() {
		if (newAllergy.trim() && !healthProfile.allergies.includes(newAllergy.trim())) {
			healthProfile.allergies = [...healthProfile.allergies, newAllergy.trim()];
			newAllergy = '';
		}
	}

	function removeAllergy(allergy: string) {
		healthProfile.allergies = healthProfile.allergies.filter((a) => a !== allergy);
	}

	function addMedication() {
		if (newMedication.trim() && !healthProfile.medications.includes(newMedication.trim())) {
			healthProfile.medications = [...healthProfile.medications, newMedication.trim()];
			newMedication = '';
		}
	}

	function removeMedication(medication: string) {
		healthProfile.medications = healthProfile.medications.filter((m) => m !== medication);
	}

	function toggleCondition(condition: string) {
		if (healthProfile.medical_conditions.includes(condition)) {
			removeCondition(condition);
		} else {
			healthProfile.medical_conditions = [...healthProfile.medical_conditions, condition];
		}

		// Update safety flags based on conditions
		updateSafetyFlags();
	}

	function toggleAllergy(allergy: string) {
		if (healthProfile.allergies.includes(allergy)) {
			removeAllergy(allergy);
		} else {
			healthProfile.allergies = [...healthProfile.allergies, allergy];
		}
	}

	function updateSafetyFlags() {
		healthProfile.safety_flags.diabetesFlag = healthProfile.medical_conditions.includes('diabetes');
		healthProfile.safety_flags.heartConditionFlag =
			healthProfile.medical_conditions.includes('heart_disease') ||
			healthProfile.medical_conditions.includes('high_blood_pressure');
		healthProfile.safety_flags.kidneyIssueFlag =
			healthProfile.medical_conditions.includes('kidney_disease');
		healthProfile.safety_flags.digestiveIssueFlag =
			healthProfile.medical_conditions.includes('digestive_issues') ||
			healthProfile.medical_conditions.includes('celiac_disease');
		healthProfile.safety_flags.eatingDisorderHistory =
			healthProfile.medical_conditions.includes('eating_disorder_history');
	}

	async function saveHealthProfile() {
		if (!userId) {
			message = 'User ID is required';
			messageType = 'error';
			return;
		}

		loading = true;
		message = '';

		try {
			// Here you would typically save to your backend/database
			// For now, we'll just dispatch the event
			dispatch('profileSaved', healthProfile);

			message = 'Health profile saved successfully!';
			messageType = 'success';

			setTimeout(() => {
				message = '';
			}, 3000);
		} catch (err) {
			message = err instanceof Error ? err.message : 'Failed to save profile';
			messageType = 'error';
		} finally {
			loading = false;
		}
	}

	async function saveNutritionIntake() {
		if (!userId) {
			message = 'User ID is required';
			messageType = 'error';
			return;
		}

		loading = true;
		message = '';

		try {
			// Here you would typically save to your backend/database
			// For now, we'll just dispatch the event
			dispatch('intakeSaved', nutritionIntake);

			message = 'Nutrition intake saved successfully!';
			messageType = 'success';

			setTimeout(() => {
				message = '';
			}, 3000);
		} catch (err) {
			message = err instanceof Error ? err.message : 'Failed to save intake';
			messageType = 'error';
		} finally {
			loading = false;
		}
	}

	function calculateBMR() {
		// Simple BMR calculation (Mifflin-St Jeor equation)
		// Note: This is a basic implementation, a full version would need height, age, gender
		const estimatedBMR = healthProfile.body_weight_kg * 24; // Very simplified
		healthProfile.metabolic_data.bmr = estimatedBMR;
		healthProfile.metabolic_data.tdee = estimatedBMR * 1.5; // Moderate activity assumption
	}

	// Update safety flags when medical conditions change
	$: if (healthProfile.medical_conditions) {
		updateSafetyFlags();
	}
</script>

<div class="bg-white rounded-lg shadow-lg border border-gray-200">
	<!-- Tab Navigation -->
	<div class="border-b border-gray-200">
		<nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
			<button
				on:click={() => (activeTab = 'profile')}
				class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'profile'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Health Profile
			</button>
			<button
				on:click={() => (activeTab = 'intake')}
				class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'intake'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Nutrition Intake
			</button>
		</nav>
	</div>

	<div class="p-6">
		{#if message}
			<div
				class="mb-4 p-4 rounded-md {messageType === 'success'
					? 'bg-green-50 border border-green-200 text-green-800'
					: messageType === 'error'
						? 'bg-red-50 border border-red-200 text-red-800'
						: 'bg-blue-50 border border-blue-200 text-blue-800'}"
			>
				{message}
			</div>
		{/if}

		{#if activeTab === 'profile'}
			<!-- Health Profile Tab -->
			<div class="space-y-6">
				<div>
					<h2 class="text-lg font-semibold text-gray-900 mb-4">Health Profile</h2>
					<p class="text-sm text-gray-600 mb-6">
						This information helps our AI provide safe and personalized nutrition recommendations.
					</p>
				</div>

				<!-- Basic Information -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="weight" class="block text-sm font-medium text-gray-700 mb-2">
							Body Weight (kg)
						</label>
						<input
							id="weight"
							type="number"
							bind:value={healthProfile.body_weight_kg}
							on:input={calculateBMR}
							min="30"
							max="300"
							step="0.1"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					{#if healthProfile.metabolic_data.bmr}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2"> Estimated BMR </label>
							<div class="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
								{Math.round(healthProfile.metabolic_data.bmr)} calories/day
							</div>
						</div>
					{/if}
				</div>

				<!-- Medical Conditions -->
				<div>
					<h3 class="text-md font-medium text-gray-900 mb-3">Medical Conditions</h3>

					<!-- Common conditions checkboxes -->
					<div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
						{#each commonConditions as condition}
							<label class="flex items-center">
								<input
									type="checkbox"
									checked={healthProfile.medical_conditions.includes(condition)}
									on:change={() => toggleCondition(condition)}
									class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<span class="ml-2 text-sm text-gray-700 capitalize">
									{condition.replace('_', ' ')}
								</span>
							</label>
						{/each}
					</div>

					<!-- Add custom condition -->
					<div class="flex space-x-2">
						<input
							type="text"
							bind:value={newCondition}
							placeholder="Add other condition..."
							class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
						<button
							on:click={addCondition}
							disabled={!newCondition.trim()}
							class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
						>
							Add
						</button>
					</div>

					<!-- Current conditions list -->
					{#if healthProfile.medical_conditions.length > 0}
						<div class="mt-3 flex flex-wrap gap-2">
							{#each healthProfile.medical_conditions as condition}
								<span
									class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800"
								>
									{condition.replace('_', ' ')}
									<button
										on:click={() => removeCondition(condition)}
										class="ml-2 text-yellow-600 hover:text-yellow-800"
									>
										×
									</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Allergies -->
				<div>
					<h3 class="text-md font-medium text-gray-900 mb-3">Food Allergies & Intolerances</h3>

					<!-- Common allergies checkboxes -->
					<div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
						{#each commonAllergies as allergy}
							<label class="flex items-center">
								<input
									type="checkbox"
									checked={healthProfile.allergies.includes(allergy)}
									on:change={() => toggleAllergy(allergy)}
									class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<span class="ml-2 text-sm text-gray-700 capitalize">
									{allergy.replace('_', ' ')}
								</span>
							</label>
						{/each}
					</div>

					<!-- Add custom allergy -->
					<div class="flex space-x-2">
						<input
							type="text"
							bind:value={newAllergy}
							placeholder="Add other allergy..."
							class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
						<button
							on:click={addAllergy}
							disabled={!newAllergy.trim()}
							class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
						>
							Add
						</button>
					</div>

					<!-- Current allergies list -->
					{#if healthProfile.allergies.length > 0}
						<div class="mt-3 flex flex-wrap gap-2">
							{#each healthProfile.allergies as allergy}
								<span
									class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
								>
									{allergy}
									<button
										on:click={() => removeAllergy(allergy)}
										class="ml-2 text-red-600 hover:text-red-800"
									>
										×
									</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Medications -->
				<div>
					<h3 class="text-md font-medium text-gray-900 mb-3">Current Medications</h3>

					<div class="flex space-x-2">
						<input
							type="text"
							bind:value={newMedication}
							placeholder="Add medication..."
							class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
						<button
							on:click={addMedication}
							disabled={!newMedication.trim()}
							class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
						>
							Add
						</button>
					</div>

					{#if healthProfile.medications.length > 0}
						<div class="mt-3 flex flex-wrap gap-2">
							{#each healthProfile.medications as medication}
								<span
									class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
								>
									{medication}
									<button
										on:click={() => removeMedication(medication)}
										class="ml-2 text-blue-600 hover:text-blue-800"
									>
										×
									</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Safety Flags Summary -->
				{#if Object.values(healthProfile.safety_flags).some((flag) => flag)}
					<div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
						<h4 class="text-sm font-medium text-yellow-800 mb-2">Safety Monitoring Active</h4>
						<div class="text-sm text-yellow-700 space-y-1">
							{#if healthProfile.safety_flags.diabetesFlag}
								<div>• Diabetes management protocols enabled</div>
							{/if}
							{#if healthProfile.safety_flags.heartConditionFlag}
								<div>• Heart health monitoring active</div>
							{/if}
							{#if healthProfile.safety_flags.kidneyIssueFlag}
								<div>• Kidney function considerations active</div>
							{/if}
							{#if healthProfile.safety_flags.digestiveIssueFlag}
								<div>• Digestive health protocols enabled</div>
							{/if}
							{#if healthProfile.safety_flags.eatingDisorderHistory}
								<div>• Eating disorder sensitivity mode active</div>
							{/if}
						</div>
					</div>
				{/if}

				<button
					on:click={saveHealthProfile}
					disabled={loading}
					class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
				>
					{#if loading}
						<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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
						Saving...
					{:else}
						Save Health Profile
					{/if}
				</button>
			</div>
		{:else}
			<!-- Nutrition Intake Tab -->
			<div class="space-y-6">
				<div>
					<h2 class="text-lg font-semibold text-gray-900 mb-4">Today's Nutrition Intake</h2>
					<p class="text-sm text-gray-600 mb-6">
						Track your daily nutrition to get personalized AI recommendations.
					</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="calories" class="block text-sm font-medium text-gray-700 mb-2">
							Calories (kcal)
						</label>
						<input
							id="calories"
							type="number"
							bind:value={nutritionIntake.calories}
							min="0"
							max="10000"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div>
						<label for="protein" class="block text-sm font-medium text-gray-700 mb-2">
							Protein (g)
						</label>
						<input
							id="protein"
							type="number"
							bind:value={nutritionIntake.protein}
							min="0"
							max="500"
							step="0.1"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div>
						<label for="carbs" class="block text-sm font-medium text-gray-700 mb-2">
							Carbohydrates (g)
						</label>
						<input
							id="carbs"
							type="number"
							bind:value={nutritionIntake.carbs}
							min="0"
							max="1000"
							step="0.1"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div>
						<label for="fat" class="block text-sm font-medium text-gray-700 mb-2"> Fat (g) </label>
						<input
							id="fat"
							type="number"
							bind:value={nutritionIntake.fat}
							min="0"
							max="300"
							step="0.1"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div class="md:col-span-2">
						<label for="hydration" class="block text-sm font-medium text-gray-700 mb-2">
							Water Intake (liters)
						</label>
						<input
							id="hydration"
							type="number"
							bind:value={nutritionIntake.hydration}
							min="0"
							max="10"
							step="0.1"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
				</div>

				<button
					on:click={saveNutritionIntake}
					disabled={loading}
					class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
				>
					{#if loading}
						<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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
						Saving...
					{:else}
						Save Nutrition Intake
					{/if}
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.animate-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
