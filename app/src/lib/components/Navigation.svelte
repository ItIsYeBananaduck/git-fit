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
		Apple,
		Search,
		Bell,
		Menu,
		X,
		ChevronDown,
		Heart,
		TrendingUp,
		Sparkles,
		Lightbulb
	} from 'lucide-svelte';

	let mobileMenuOpen = false;
	let searchQuery = '';
	let showUserMenu = false;
	let showNotifications = false;
	let activeSection = 'main';

	// Close menus when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.user-menu')) {
			showUserMenu = false;
		}
		if (!target.closest('.notifications-menu')) {
			showNotifications = false;
		}
	}

	async function handleLogout() {
		await authStore.logout();
		goto('/auth/login');
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
		if (mobileMenuOpen) {
			showUserMenu = false;
			showNotifications = false;
		}
	}

	function handleSearch(event: KeyboardEvent) {
		if (event.key === 'Enter' && searchQuery.trim()) {
			goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
			searchQuery = '';
		}
	}

	// Organized navigation sections for better UX
	const navigationSections = {
		main: [
			{
				href: '/',
				label: 'Dashboard',
				icon: Home,
				description: 'Overview & quick stats',
				badge: null
			},
			{
				href: '/workouts',
				label: 'Workouts',
				icon: Dumbbell,
				description: 'Track & plan workouts',
				badge: null
			},
			{
				href: '/programs',
				label: 'Programs',
				icon: Target,
				description: 'Training programs',
				badge: null
			},
			{
				href: '/nutrition',
				label: 'Nutrition',
				icon: Apple,
				description: 'Meal planning & tracking',
				badge: null
			}
		],
		ai: [
			{
				href: '/adaptive-training',
				label: 'AI Training',
				icon: Brain,
				description: 'Smart recommendations',
				badge: 'NEW'
			},
			{
				href: '/recommendations',
				label: 'Recommendations',
				icon: Lightbulb,
				description: 'Personalized suggestions',
				badge: null
			},
			{
				href: '/achievements',
				label: 'Achievements',
				icon: Sparkles,
				description: 'Milestones & badges',
				badge: null
			}
		],
		tools: [
			{
				href: '/fitness-data',
				label: 'Analytics',
				icon: BarChart3,
				description: 'Progress & insights',
				badge: null
			},
			{
				href: '/marketplace',
				label: 'Marketplace',
				icon: ShoppingBag,
				description: 'Programs & services',
				badge: null
			}
		],
		management: [
			{
				href: '/create-program',
				label: 'Create Program',
				icon: Plus,
				roles: ['trainer'],
				badge: null
			},
			{ href: '/clients', label: 'My Clients', icon: Users, roles: ['trainer'], badge: null },
			{ href: '/admin', label: 'Admin Panel', icon: Shield, roles: ['admin'], badge: null }
		],
		utility: [
			{ href: '/exercise-demo', label: 'Equipment Demo', icon: Settings, badge: null },
			{ href: '/equipment-clean', label: 'Equipment', icon: Dumbbell, badge: null },
			{ href: '/profile', label: 'Profile', icon: User, badge: null }
		]
	};

	// Flatten all nav items for filtering
	$: allNavItems = Object.values(navigationSections).flat();
	$: filteredNavItems = $user
		? allNavItems.filter((item) => !item.roles || item.roles.includes($user.role))
		: navigationSections.main.concat(navigationSections.utility);

	// Get current section based on active route
	$: currentSection =
		Object.entries(navigationSections).find(([_, items]) =>
			items.some((item) => $page.url.pathname === item.href)
		)?.[0] || 'main';
</script>

<svelte:window on:click={handleClickOutside} />

<!-- Modern Navigation Bar -->
<nav
	class="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-50"
	aria-label="Main navigation"
>
	<div class="container mx-auto px-4">
		<div class="flex justify-between items-center h-16">
			<!-- Logo & Brand -->
			<div class="flex items-center space-x-3">
				<a href="/" aria-label="Technically Fit - Home" class="flex items-center space-x-3">
					<div
						class="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-sm"
					>
						<Dumbbell class="w-6 h-6 text-white" aria-hidden="true" />
					</div>
					<div class="hidden sm:block">
						<div
							class="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"
						>
							Technically Fit
						</div>
						<div class="text-xs text-gray-500 -mt-1">AI-Powered Fitness</div>
					</div>
				</a>
			</div>

			<!-- Desktop Navigation -->
			<div class="hidden lg:flex items-center space-x-1">
				<!-- Main Navigation -->
				{#each navigationSections.main as item}
					<a
						href={item.href}
						class="relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 group
							{$page.url.pathname === item.href
							? 'bg-primary text-white shadow-sm'
							: 'text-gray-700 hover:bg-gray-100 hover:text-primary'}"
						title={item.description}
						aria-current={$page.url.pathname === item.href ? 'page' : undefined}
					>
						<svelte:component this={item.icon} size={18} aria-hidden="true" />
						<span>{item.label}</span>
						{#if item.badge}
							<span
								class="absolute -top-1 -right-1 bg-accent text-white text-xs px-1.5 py-0.5 rounded-full font-medium"
								aria-label="New feature"
							>
								{item.badge}
							</span>
						{/if}
					</a>
				{/each}

				<!-- AI Section -->
				<div class="h-6 w-px bg-gray-300 mx-2" aria-hidden="true"></div>
				{#each navigationSections.ai as item}
					<a
						href={item.href}
						class="relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 group
							{$page.url.pathname === item.href
							? 'bg-secondary text-white shadow-sm'
							: 'text-gray-700 hover:bg-gray-100 hover:text-secondary'}"
						title={item.description}
						aria-current={$page.url.pathname === item.href ? 'page' : undefined}
					>
						<svelte:component this={item.icon} size={18} aria-hidden="true" />
						<span>{item.label}</span>
						{#if item.badge}
							<span
								class="absolute -top-1 -right-1 bg-accent text-white text-xs px-1.5 py-0.5 rounded-full font-medium"
								aria-label="New feature"
							>
								{item.badge}
							</span>
						{/if}
					</a>
				{/each}

				<!-- Tools Section -->
				<div class="h-6 w-px bg-gray-300 mx-2" aria-hidden="true"></div>
				{#each navigationSections.tools as item}
					<a
						href={item.href}
						class="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
							{$page.url.pathname === item.href
							? 'bg-accent text-white shadow-sm'
							: 'text-gray-700 hover:bg-gray-100 hover:text-accent'}"
						title={item.description}
						aria-current={$page.url.pathname === item.href ? 'page' : undefined}
					>
						<svelte:component this={item.icon} size={18} aria-hidden="true" />
						<span>{item.label}</span>
					</a>
				{/each}
			</div>

			<!-- Right Side Actions -->
			<div class="flex items-center space-x-3">
				<!-- Search Bar (Desktop) -->
				<div class="hidden md:flex items-center">
					<div class="relative">
						<input
							bind:value={searchQuery}
							on:keydown={handleSearch}
							placeholder="Search workouts, programs..."
							class="w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
							aria-label="Search workouts and programs"
							role="searchbox"
						/>
						<Search class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" aria-hidden="true" />
					</div>
				</div>

				<!-- User Menu -->
				{#if $isAuthenticated && $user}
					<!-- Notifications -->
					<button
						class="relative p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-xl transition-colors"
						title="Notifications"
						aria-label="View notifications"
						aria-expanded="false"
					>
						<Bell size={20} aria-hidden="true" />
						<span
							class="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"
							aria-label="New notification"
						></span>
					</button>

					<!-- User Avatar & Menu -->
					<div class="relative user-menu">
						<button
							on:click={() => (showUserMenu = !showUserMenu)}
							class="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
							title="User menu"
							aria-label="Open user menu"
							aria-expanded={showUserMenu}
							aria-haspopup="menu"
							aria-controls="user-menu"
						>
							<div
								class="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center shadow-sm"
							>
								<span class="text-white text-sm font-semibold" aria-hidden="true">
									{$user.name.charAt(0)}
								</span>
							</div>
							<ChevronDown size={16} class="text-gray-500" aria-hidden="true" />
						</button>

						<!-- User Dropdown Menu -->
						{#if showUserMenu}
							<div
								class="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
								role="menu"
								aria-labelledby="user-menu-button"
								id="user-menu"
							>
								<div class="px-4 py-3 border-b border-gray-100">
									<div class="font-medium text-gray-900">{$user.name}</div>
									<div class="text-sm text-gray-500 capitalize">{$user.role}</div>
								</div>
								<div class="py-2">
									<a
										href="/profile"
										class="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
										role="menuitem"
									>
										<User size={16} aria-hidden="true" />
										<span>Profile Settings</span>
									</a>
									<a
										href="/achievements"
										class="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
										role="menuitem"
									>
										<Sparkles size={16} aria-hidden="true" />
										<span>Achievements</span>
									</a>
									<a
										href="/recommendations"
										class="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
										role="menuitem"
									>
										<Lightbulb size={16} aria-hidden="true" />
										<span>Recommendations</span>
									</a>
								</div>
								<div class="border-t border-gray-100 pt-2">
									<button
										on:click={handleLogout}
										class="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
										role="menuitem"
									>
										<LogOut size={16} aria-hidden="true" />
										<span>Sign out</span>
									</button>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<!-- Auth Buttons -->
					<div class="hidden sm:flex items-center space-x-2">
						<a
							href="/auth/login"
							class="px-4 py-2 text-sm text-gray-700 hover:text-primary transition-colors"
							aria-label="Sign in to your account"
						>
							Sign in
						</a>
						<a
							href="/auth/register"
							class="px-4 py-2 text-sm text-white bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-medium shadow-sm transition-all"
							aria-label="Create a new account"
						>
							Get Started
						</a>
					</div>
				{/if}

				<!-- Mobile Menu Button -->
				<button
					on:click={toggleMobileMenu}
					class="lg:hidden p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-xl transition-colors"
					aria-label="Toggle mobile menu"
				>
					<Menu size={20} class={mobileMenuOpen ? 'hidden' : 'block'} />
					<X size={20} class={mobileMenuOpen ? 'block' : 'hidden'} />
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
								aria-current={$page.url.pathname === item.href ? 'page' : undefined}
							>
								<svelte:component this={item.icon} size={20} aria-hidden="true" />
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
							aria-label="Sign out of your account"
						>
							<LogOut size={20} aria-hidden="true" />
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
							aria-label="Sign in to your account"
						>
							<LogIn size={20} aria-hidden="true" />
							<span>Sign in</span>
						</a>
						<a
							href="/auth/register"
							class="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-white bg-primary hover:bg-blue-700"
							on:click={() => (mobileMenuOpen = false)}
							aria-label="Create a new account"
						>
							<User size={20} aria-hidden="true" />
							<span>Sign up</span>
						</a>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</nav>
