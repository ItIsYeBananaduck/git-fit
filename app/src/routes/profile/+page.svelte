<script lang="ts">
	// Mock user profile data
	let user = {
		name: 'Demo User',
		email: 'demo@example.com',
		role: 'client',
		profileImage: null,
		dateOfBirth: '1990-05-15',
		height: 175, // cm
		weight: 70, // kg
		fitnessLevel: 'intermediate',
		goals: ['weight-loss', 'muscle-gain', 'endurance'],
		joinDate: '2024-12-01'
	};

	let isEditing = false;
	let editedUser = { ...user };

	function toggleEdit() {
		if (isEditing) {
			// Save changes
			user = { ...editedUser };
		} else {
			// Start editing
			editedUser = { ...user };
		}
		isEditing = !isEditing;
	}

	function cancelEdit() {
		editedUser = { ...user };
		isEditing = false;
	}

	const fitnessLevels = ['beginner', 'intermediate', 'advanced'];
	const availableGoals = [
		{ id: 'weight-loss', label: 'Weight Loss' },
		{ id: 'muscle-gain', label: 'Muscle Gain' },
		{ id: 'endurance', label: 'Endurance' },
		{ id: 'strength', label: 'Strength' },
		{ id: 'flexibility', label: 'Flexibility' },
		{ id: 'general-fitness', label: 'General Fitness' }
	];

	function toggleGoal(goalId: string) {
		if (editedUser.goals.includes(goalId)) {
			editedUser.goals = editedUser.goals.filter((g) => g !== goalId);
		} else {
			editedUser.goals = [...editedUser.goals, goalId];
		}
	}
</script>

<svelte:head>
	<title>Profile - Technically Fit</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<div class="flex items-center justify-between">
			<div class="flex items-center">
				<div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
					<span class="text-white text-xl font-semibold">
						{user.name.charAt(0)}
					</span>
				</div>
				<div class="ml-4">
					<h1 class="text-2xl font-bold text-gray-900">{user.name}</h1>
					<p class="text-gray-600 capitalize">{user.role}</p>
					<p class="text-sm text-gray-500">
						Member since {new Date(user.joinDate).toLocaleDateString()}
					</p>
				</div>
			</div>
			<button
				on:click={toggleEdit}
				class="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
			>
				{isEditing ? 'Save Changes' : 'Edit Profile'}
			</button>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Personal Information -->
		<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>

			{#if isEditing}
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
						<input
							type="text"
							bind:value={editedUser.name}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
						<input
							type="email"
							bind:value={editedUser.email}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
						<input
							type="date"
							bind:value={editedUser.dateOfBirth}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
						/>
					</div>
				</div>
			{:else}
				<div class="space-y-4">
					<div class="flex justify-between">
						<span class="text-gray-600">Name:</span>
						<span class="font-medium">{user.name}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">Email:</span>
						<span class="font-medium">{user.email}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">Date of Birth:</span>
						<span class="font-medium">{new Date(user.dateOfBirth).toLocaleDateString()}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">Age:</span>
						<span class="font-medium"
							>{new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()}</span
						>
					</div>
				</div>
			{/if}
		</div>

		<!-- Fitness Information -->
		<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Fitness Information</h2>

			{#if isEditing}
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
							<input
								type="number"
								bind:value={editedUser.height}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
							<input
								type="number"
								bind:value={editedUser.weight}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
							/>
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Fitness Level</label>
						<select
							bind:value={editedUser.fitnessLevel}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
						>
							{#each fitnessLevels as level}
								<option value={level} class="capitalize">{level}</option>
							{/each}
						</select>
					</div>
				</div>
			{:else}
				<div class="space-y-4">
					<div class="flex justify-between">
						<span class="text-gray-600">Height:</span>
						<span class="font-medium">{user.height} cm</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">Weight:</span>
						<span class="font-medium">{user.weight} kg</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">BMI:</span>
						<span class="font-medium">{(user.weight / (user.height / 100) ** 2).toFixed(1)}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">Fitness Level:</span>
						<span class="font-medium capitalize">{user.fitnessLevel}</span>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Fitness Goals -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Fitness Goals</h2>

		{#if isEditing}
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
				{#each availableGoals as goal}
					<button
						on:click={() => toggleGoal(goal.id)}
						class="p-3 rounded-lg border-2 transition-colors text-sm font-medium
							{editedUser.goals.includes(goal.id)
							? 'border-primary bg-primary text-white'
							: 'border-gray-300 text-gray-700 hover:border-gray-400'}"
					>
						{goal.label}
					</button>
				{/each}
			</div>
		{:else}
			<div class="flex flex-wrap gap-2">
				{#each user.goals as goalId}
					{@const goal = availableGoals.find((g) => g.id === goalId)}
					{#if goal}
						<span
							class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-white"
						>
							{goal.label}
						</span>
					{/if}
				{/each}
			</div>
		{/if}
	</div>

	{#if isEditing}
		<div class="flex justify-end space-x-3">
			<button
				on:click={cancelEdit}
				class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
			>
				Cancel
			</button>
			<button
				on:click={toggleEdit}
				class="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
			>
				Save Changes
			</button>
		</div>
	{/if}
</div>
