<script lang="ts">
	import { aliceNavigationActions } from '$lib/stores/workoutStore';
	
	// Settings sections
	let activeSection = 'profile';
	
	const settingsSections = [
		{ id: 'profile', label: 'Profile', icon: 'user' },
		{ id: 'preferences', label: 'Preferences', icon: 'settings' },
		{ id: 'notifications', label: 'Notifications', icon: 'bell' },
		{ id: 'privacy', label: 'Privacy', icon: 'shield' },
		{ id: 'account', label: 'Account', icon: 'key' }
	];
	
	function selectSection(sectionId: string) {
		activeSection = sectionId;
	}
</script>

<svelte:head>
	<title>Settings - Adaptive fIt</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
	<div class="max-w-6xl mx-auto">
		<!-- Header -->
		<div class="flex items-center justify-between mb-8">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Settings</h1>
				<p class="text-gray-600 mt-2">Manage your account and app preferences</p>
			</div>
			<button
				class="btn-ghost"
				on:click={() => aliceNavigationActions.navigateTo('home')}
			>
				<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
				</svg>
				Home
			</button>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
			<!-- Settings Navigation -->
			<div class="lg:col-span-1">
				<div class="card">
					<div class="card-header">
						<h3 class="card-title">Settings</h3>
					</div>
					<nav class="space-y-1">
						{#each settingsSections as section}
							<button
								class="w-full text-left px-3 py-2 rounded-lg transition-colors {activeSection === section.id ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}"
								on:click={() => selectSection(section.id)}
							>
								<div class="flex items-center">
									<svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										{#if section.icon === 'user'}
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
										{:else if section.icon === 'settings'}
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										{:else if section.icon === 'bell'}
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
										{:else if section.icon === 'shield'}
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
										{:else if section.icon === 'key'}
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
										{/if}
									</svg>
									{section.label}
								</div>
							</button>
						{/each}
					</nav>
				</div>
			</div>

			<!-- Settings Content -->
			<div class="lg:col-span-3">
				<div class="card">
					<div class="card-header">
						<h3 class="card-title">
							{settingsSections.find(s => s.id === activeSection)?.label || 'Settings'}
						</h3>
						<p class="card-description">
							{#if activeSection === 'profile'}
								Manage your personal information and profile details
							{:else if activeSection === 'preferences'}
								Customize your app experience and workout preferences
							{:else if activeSection === 'notifications'}
								Control how and when you receive notifications
							{:else if activeSection === 'privacy'}
								Manage your privacy settings and data sharing preferences
							{:else if activeSection === 'account'}
								Account security, password, and subscription settings
							{/if}
						</p>
					</div>

					<div class="space-y-6">
						{#if activeSection === 'profile'}
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
									<input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Your full name">
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
									<input type="email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="your.email@example.com">
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">Age</label>
									<input type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="25">
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">Gender</label>
									<select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
										<option>Select gender</option>
										<option>Male</option>
										<option>Female</option>
										<option>Non-binary</option>
										<option>Prefer not to say</option>
									</select>
								</div>
							</div>
						{:else if activeSection === 'preferences'}
							<div class="space-y-4">
								<div class="flex items-center justify-between py-3">
									<div>
										<h4 class="font-medium text-gray-900">Dark Mode</h4>
										<p class="text-sm text-gray-600">Switch between light and dark themes</p>
									</div>
									<label class="relative inline-flex items-center cursor-pointer">
										<input type="checkbox" class="sr-only peer">
										<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
									</label>
								</div>
								<div class="flex items-center justify-between py-3">
									<div>
										<h4 class="font-medium text-gray-900">Metric Units</h4>
										<p class="text-sm text-gray-600">Use metric system for measurements</p>
									</div>
									<label class="relative inline-flex items-center cursor-pointer">
										<input type="checkbox" class="sr-only peer" checked>
										<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
									</label>
								</div>
							</div>
						{:else if activeSection === 'notifications'}
							<div class="space-y-4">
								<div class="flex items-center justify-between py-3">
									<div>
										<h4 class="font-medium text-gray-900">Workout Reminders</h4>
										<p class="text-sm text-gray-600">Get notified about scheduled workouts</p>
									</div>
									<label class="relative inline-flex items-center cursor-pointer">
										<input type="checkbox" class="sr-only peer" checked>
										<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
									</label>
								</div>
								<div class="flex items-center justify-between py-3">
									<div>
										<h4 class="font-medium text-gray-900">Progress Updates</h4>
										<p class="text-sm text-gray-600">Weekly progress summaries</p>
									</div>
									<label class="relative inline-flex items-center cursor-pointer">
										<input type="checkbox" class="sr-only peer" checked>
										<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
									</label>
								</div>
							</div>
						{:else if activeSection === 'privacy'}
							<div class="space-y-4">
								<div class="flex items-center justify-between py-3">
									<div>
										<h4 class="font-medium text-gray-900">Data Sharing</h4>
										<p class="text-sm text-gray-600">Share anonymous data to improve the app</p>
									</div>
									<label class="relative inline-flex items-center cursor-pointer">
										<input type="checkbox" class="sr-only peer">
										<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
									</label>
								</div>
								<div class="flex items-center justify-between py-3">
									<div>
										<h4 class="font-medium text-gray-900">Public Profile</h4>
										<p class="text-sm text-gray-600">Make your profile visible to other users</p>
									</div>
									<label class="relative inline-flex items-center cursor-pointer">
										<input type="checkbox" class="sr-only peer">
										<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
									</label>
								</div>
							</div>
						{:else if activeSection === 'account'}
							<div class="space-y-6">
								<div>
									<h4 class="font-medium text-gray-900 mb-4">Change Password</h4>
									<div class="space-y-4">
										<div>
											<label class="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
											<input type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
										</div>
										<div>
											<label class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
											<input type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
										</div>
										<div>
											<label class="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
											<input type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
										</div>
									</div>
								</div>
								<div class="border-t pt-6">
									<h4 class="font-medium text-gray-900 mb-4">Danger Zone</h4>
									<button class="btn-ghost text-red-600 hover:bg-red-50">
										Delete Account
									</button>
								</div>
							</div>
						{/if}

						<!-- Save Button -->
						<div class="flex justify-end pt-6 border-t">
							<button class="btn-primary">
								Save Changes
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>