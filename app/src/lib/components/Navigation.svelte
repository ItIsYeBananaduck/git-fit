<script lang="ts">
	import { page } from '$app/stores';
	import { authStore, user, isAuthenticated } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import {
		Home,
		Target,
		Dumbbell,
		BarChart3,
		Settings,
		Plus,
		Users,
		Shield,
		User,
		Brain,
		ShoppingBag,
		LogOut,
		LogIn,
		Apple
	} from 'lucide-svelte';

	let mobileMenuOpen = false;

	async function handleLogout() {
		await authStore.logout();
		goto('/auth/login');
	}

	const navItems = [
		{ href: '/', label: 'Dashboard', icon: Home, roles: ['client', 'trainer', 'admin'] },
		{
			href: '/marketplace',
			label: 'Marketplace',
			icon: ShoppingBag,
			roles: ['client', 'trainer', 'admin']
		},
		{ href: '/programs', label: 'Programs', icon: Target, roles: ['client', 'trainer', 'admin'] },
		{ href: '/workouts', label: 'Workouts', icon: Dumbbell, roles: ['client', 'trainer'] },
		{ href: '/nutrition', label: 'Nutrition', icon: Apple, roles: ['client', 'trainer'] },
		{ href: '/fitness-data', label: 'Fitness Data', icon: BarChart3, roles: ['client'] },
		{ href: '/adaptive-training', label: 'AI Training', icon: Brain, roles: ['client'] },
		{
			href: '/exercise-demo',
			label: 'Equipment Demo',
			icon: Settings,
			roles: ['client', 'trainer', 'admin']
		},
		{
			href: '/equipment-clean',
			label: 'Equipment',
			icon: Dumbbell,
			roles: ['client', 'trainer', 'admin']
		},
		{ href: '/create-program', label: 'Create Program', icon: Plus, roles: ['trainer'] },
		{ href: '/clients', label: 'My Clients', icon: Users, roles: ['trainer'] },
		{ href: '/admin', label: 'Admin', icon: Shield, roles: ['admin'] },
		{ href: '/profile', label: 'Profile', icon: User, roles: ['client', 'trainer', 'admin'] }
	];

	$: filteredNavItems = $user ? navItems.filter((item) => item.roles.includes($user.role)) : [];
</script>

<nav class="bg-white shadow-lg border-b border-gray-200">
	<div class="container mx-auto px-4">
		<div class="flex justify-between items-center h-16">
			<!-- Logo -->
			<div class="flex items-center space-x-2">
				<div class="text-2xl font-bold text-primary">Technically Fit</div>
				<div class="text-sm text-gray-500 hidden sm:block">Smart Fitness Training</div>
			</div>

			<!-- Desktop Navigation -->
			<div class="hidden md:flex items-center space-x-6">
				{#each filteredNavItems as item}
					<a
						href={item.href}
						class="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                                        {$page.url.pathname === item.href
							? 'bg-primary text-white'
							: 'text-gray-700 hover:bg-gray-100'}"
					>
						<svelte:component this={item.icon} size={18} />
						<span>{item.label}</span>
					</a>
				{/each}
			</div>

			<!-- User Menu -->
			<div class="flex items-center space-x-4">
				{#if $isAuthenticated && $user}
					<!-- Authenticated User -->
					<div class="hidden sm:flex items-center space-x-2">
						<div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
							<span class="text-white text-sm font-semibold">
								{$user.name.charAt(0)}
							</span>
						</div>
						<div class="text-sm">
							<div class="font-medium text-gray-900">{$user.name}</div>
							<div class="text-gray-500 capitalize">{$user.role}</div>
						</div>
					</div>

					<!-- Logout Button -->
					<button
						on:click={handleLogout}
						class="hidden sm:flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
						title="Sign out"
					>
						<LogOut size={16} />
						<span>Sign out</span>
					</button>
				{:else}
					<!-- Not Authenticated -->
					<div class="hidden sm:flex items-center space-x-2">
						<a
							href="/auth/login"
							class="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
						>
							<LogIn size={16} />
							<span>Sign in</span>
						</a>
						<a
							href="/auth/register"
							class="flex items-center space-x-1 px-3 py-2 text-sm text-white bg-primary hover:bg-blue-700 rounded-lg transition-colors"
						>
							<User size={16} />
							<span>Sign up</span>
						</a>
					</div>
				{/if}

				<!-- Mobile menu button -->
				<button
					on:click={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
					aria-label="Toggle mobile menu"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
						/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Mobile Navigation -->
		{#if mobileMenuOpen}
			<div class="md:hidden py-4 border-t border-gray-200">
				{#if $isAuthenticated && $user}
					<!-- Authenticated Mobile Menu -->
					<div class="space-y-2">
						{#each filteredNavItems as item}
							<a
								href={item.href}
								class="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                                                        {$page.url.pathname ===
								item.href
									? 'bg-primary text-white'
									: 'text-gray-700 hover:bg-gray-100'}"
								on:click={() => (mobileMenuOpen = false)}
							>
								<svelte:component this={item.icon} size={20} />
								<span>{item.label}</span>
							</a>
						{/each}

						<!-- Mobile Logout -->
						<button
							on:click={() => {
								handleLogout();
								mobileMenuOpen = false;
							}}
							class="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left"
						>
							<LogOut size={20} />
							<span>Sign out</span>
						</button>
					</div>

					<!-- Mobile User Info -->
					<div class="mt-4 pt-4 border-t border-gray-200">
						<div class="flex items-center space-x-3 px-4">
							<div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
								<span class="text-white font-semibold">
									{$user.name.charAt(0)}
								</span>
							</div>
							<div>
								<div class="font-medium text-gray-900">{$user.name}</div>
								<div class="text-gray-500 capitalize text-sm">{$user.role}</div>
							</div>
						</div>
					</div>
				{:else}
					<!-- Not Authenticated Mobile Menu -->
					<div class="space-y-2">
						<a
							href="/auth/login"
							class="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
							on:click={() => (mobileMenuOpen = false)}
						>
							<LogIn size={20} />
							<span>Sign in</span>
						</a>
						<a
							href="/auth/register"
							class="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-white bg-primary hover:bg-blue-700"
							on:click={() => (mobileMenuOpen = false)}
						>
							<User size={20} />
							<span>Sign up</span>
						</a>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</nav>
