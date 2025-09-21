<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let demographics = {
		height: '',
		weight: '',
		age: '',
		gender: '',
		activityLevel: '',
		experience: ''
	};

	const activityLevels = [
		{
			id: 'sedentary',
			title: 'Sedentary',
			description: 'Little to no exercise, desk job',
			examples: 'Office work, watching TV most of the day'
		},
		{
			id: 'lightly_active',
			title: 'Lightly Active',
			description: 'Light exercise 1-3 days/week',
			examples: 'Walking, light yoga, casual sports'
		},
		{
			id: 'moderately_active',
			title: 'Moderately Active',
			description: 'Moderate exercise 3-5 days/week',
			examples: 'Jogging, cycling, weight training 3x/week'
		},
		{
			id: 'very_active',
			title: 'Very Active',
			description: 'Hard exercise 6-7 days/week',
			examples: 'Intense training, professional athlete'
		},
		{
			id: 'extremely_active',
			title: 'Extremely Active',
			description: 'Very hard exercise & physical job',
			examples: 'Construction, competitive sports, 2x daily training'
		}
	];

	const experienceLevels = [
		{
			id: 'beginner',
			title: 'Beginner',
			description: 'New to fitness or returning after a long break',
			duration: '0-6 months experience'
		},
		{
			id: 'intermediate',
			title: 'Intermediate',
			description: 'Consistent training for 6-18 months',
			duration: '6-18 months experience'
		},
		{
			id: 'advanced',
			title: 'Advanced',
			description: 'Experienced lifter with solid foundation',
			duration: '18+ months experience'
		}
	];

	function validateAndContinue() {
		// Basic validation
		if (
			!demographics.height ||
			!demographics.weight ||
			!demographics.age ||
			!demographics.gender ||
			!demographics.activityLevel ||
			!demographics.experience
		) {
			return;
		}

		dispatch('submit', demographics);
	}
</script>

<div class="max-w-2xl mx-auto space-y-8">
	<div class="text-center">
		<h2 class="text-3xl font-bold text-gray-900 mb-4">Tell Us About Yourself</h2>
		<p class="text-gray-600 text-lg">
			This information helps us personalize your fitness recommendations and track your progress
			accurately.
		</p>
	</div>

	<!-- Basic Info -->
	<div class="bg-white rounded-lg shadow-lg p-8">
		<h3 class="text-xl font-semibold text-gray-900 mb-6">Basic Information</h3>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div>
				<label for="age" class="block text-sm font-medium text-gray-700 mb-2">Age</label>
				<input
					id="age"
					type="number"
					min="13"
					max="100"
					bind:value={demographics.age}
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="Enter your age"
				/>
			</div>

			<div>
				<label for="gender" class="block text-sm font-medium text-gray-700 mb-2">Gender</label>
				<select
					id="gender"
					bind:value={demographics.gender}
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option value="">Select gender</option>
					<option value="male">Male</option>
					<option value="female">Female</option>
					<option value="non_binary">Non-binary</option>
					<option value="prefer_not_to_say">Prefer not to say</option>
				</select>
			</div>

			<div>
				<label for="height" class="block text-sm font-medium text-gray-700 mb-2"
					>Height (inches)</label
				>
				<input
					id="height"
					type="number"
					min="36"
					max="96"
					bind:value={demographics.height}
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="e.g., 70"
				/>
			</div>

			<div>
				<label for="weight" class="block text-sm font-medium text-gray-700 mb-2">Weight (lbs)</label
				>
				<input
					id="weight"
					type="number"
					min="50"
					max="600"
					bind:value={demographics.weight}
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="e.g., 180"
				/>
			</div>
		</div>
	</div>

	<!-- Activity Level -->
	<div class="bg-white rounded-lg shadow-lg p-8">
		<h3 class="text-xl font-semibold text-gray-900 mb-6">Activity Level</h3>
		<p class="text-gray-600 mb-6">
			How active are you on a typical week? This helps us understand your current fitness baseline.
		</p>

		<div class="space-y-4">
			{#each activityLevels as level}
				<label class="block">
					<input
						type="radio"
						name="activity"
						value={level.id}
						bind:group={demographics.activityLevel}
						class="mr-4 text-blue-600 focus:ring-blue-500"
					/>
					<div class="inline-block">
						<div class="font-semibold text-gray-900">{level.title}</div>
						<div class="text-sm text-gray-600">{level.description}</div>
						<div class="text-xs text-gray-500 italic">{level.examples}</div>
					</div>
				</label>
			{/each}
		</div>
	</div>

	<!-- Experience Level -->
	<div class="bg-white rounded-lg shadow-lg p-8">
		<h3 class="text-xl font-semibold text-gray-900 mb-6">Training Experience</h3>
		<p class="text-gray-600 mb-6">
			How much resistance training experience do you have? This helps us set appropriate starting
			points.
		</p>

		<div class="space-y-4">
			{#each experienceLevels as level}
				<label class="block">
					<input
						type="radio"
						name="experience"
						value={level.id}
						bind:group={demographics.experience}
						class="mr-4 text-blue-600 focus:ring-blue-500"
					/>
					<div class="inline-block">
						<div class="font-semibold text-gray-900">{level.title}</div>
						<div class="text-sm text-gray-600">{level.description}</div>
						<div class="text-xs text-gray-500 italic">{level.duration}</div>
					</div>
				</label>
			{/each}
		</div>
	</div>

	<!-- Continue Button -->
	<div class="flex justify-end">
		<button
			on:click={validateAndContinue}
			disabled={!demographics.height ||
				!demographics.weight ||
				!demographics.age ||
				!demographics.gender ||
				!demographics.activityLevel ||
				!demographics.experience}
			class="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
		>
			Continue to Goals
		</button>
	</div>
</div>

<style>
	input[type='radio']:checked + div {
		color: #2563eb;
		font-weight: 600;
	}
</style>
