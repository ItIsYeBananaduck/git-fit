<script lang="ts">
	import { page } from '$app/stores';
	import { authStore, user, isAuthenticated } from '../stores/auth.js';
	import { goto } from '$app/navigation';
	import ThemeToggle from './ThemeToggle.svelte';

	// Lucide icon imports
	import {
		Home,
		Target,
		ClipboardList,
		Apple,
		Brain,
		Lightbulb,
		Sparkles,
		BarChart3,
		ShoppingCart,
		Plus,
		Users,
		Shield,
		Settings,
		Dumbbell,
		User,
		Bell,
		Search,
		LogOut,
		Key,
		X,
		Menu
	} from 'lucide-svelte';

	let mobileMenuOpen = false;
	let searchQuery = '';
	let showUserMenu = false;
	let showNotifications = false;
	let activeSection = 'main';

	function handleClickOutside(event: MouseEvent): void {
		const target = event.target as HTMLElement;
		const userMenu = document.querySelector('.user-menu');
		const notifications = document.querySelector('[aria-label="View notifications"]');

		if (userMenu && !userMenu.contains(target)) {
			showUserMenu = false;
		}

		if (notifications && !notifications.contains(target)) {
			showNotifications = false;
		}

		if (mobileMenuOpen && !document.querySelector('nav')?.contains(target)) {
			mobileMenuOpen = false;
		}
	}

	// Keyboard navigation for user menu
	function handleUserMenuKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') {
			showUserMenu = false;
			const userMenuButton = document.querySelector('[aria-controls="user-menu"]') as HTMLElement;
			if (userMenuButton) userMenuButton.focus();
		} else if (event.key === 'ArrowDown' && !showUserMenu) {
			event.preventDefault();
			showUserMenu = true;
		}
	}

	// Keyboard navigation for mobile menu
	function handleMobileMenuKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') {
			mobileMenuOpen = false;
		}
	}

	// Enhanced search with keyboard shortcuts
	function handleSearchKeydown(event: KeyboardEvent): void {
		// Ctrl+K or Cmd+K to focus search
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			const searchInput = document.querySelector(
				'input[aria-label="Search workouts and programs"]'
			) as HTMLInputElement;
			if (searchInput) searchInput.focus();
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

	// Get Lucide icon component
	function getIconComponent(iconKey: string) {
		const iconMap: Record<string, any> = {
			'🏠': Home,
			'🎯': Target,
			'📋': ClipboardList,
			'🍎': Apple,
			'🧠': Brain,
			'💡': Lightbulb,
			'✨': Sparkles,
			'📊': BarChart3,
			'🛒': ShoppingCart,
			'➕': Plus,
			'👥': Users,
			'🛡️': Shield,
			'⚙️': Settings,
			'🏋️': Dumbbell,
			'👤': User,
			'🔔': Bell
		};
		return iconMap[iconKey] || Settings; // fallback to settings icon
	}

	// Organized navigation sections for better UX
	const navigationSections = {
		main: [
			{
				href: '/',
				label: 'Dashboard',
				icon: '🏠',
				description: 'Overview & quick stats',
				badge: null
			},
			{
				href: '/workouts',
				label: 'Workouts',
				icon: '🎯',
				description: 'Track & plan workouts',
				badge: null
			},
			{
				href: '/programs',
				label: 'Programs',
				icon: '📋',
				description: 'Training programs',
				badge: null
			},
			{
				href: '/nutrition',
				label: 'Nutrition',
				icon: '🍎',
				description: 'Meal planning & tracking',
				badge: null
			}
		],
		ai: [
			{
				href: '/adaptive-training',
				label: 'AI Training',
				icon: '🧠',
				description: 'Smart recommendations',
				badge: 'NEW'
			},
			{
				href: '/recommendations',
				label: 'Recommendations',
				icon: '💡',
				description: 'Personalized suggestions',
				badge: null
			},
			{
				href: '/achievements',
				label: 'Achievements',
				icon: '✨',
				description: 'Milestones & badges',
				badge: null
			}
		],
		tools: [
			{
				href: '/fitness-data',
				label: 'Analytics',
				icon: '📊',
				description: 'Progress & insights',
				badge: null
			},
			{
				href: '/marketplace',
				label: 'Marketplace',
				icon: '🛒',
				description: 'Programs & services',
				badge: null
			}
		],
		management: [
			{
				href: '/create-program',
				label: 'Create Program',
				icon: '➕',
				description: 'Create training programs',
				roles: ['trainer'],
				badge: null
			},
			{
				href: '/clients',
				label: 'My Clients',
				icon: '👥',
				description: 'Manage client relationships',
				roles: ['trainer'],
				badge: null
			},
			{
				href: '/admin',
				label: 'Admin Panel',
				icon: '🛡️',
				description: 'System administration',
				roles: ['admin'],
				badge: null
			}
		],
		utility: [
			{
				href: '/exercise-demo',
				label: 'Equipment Demo',
				icon: '⚙️',
				description: 'Demo equipment features',
				badge: null
			},
			{
				href: '/equipment-clean',
				label: 'Equipment',
				icon: '🏋️',
				description: 'Manage gym equipment',
				badge: null
			},
			{
				href: '/profile',
				label: 'Profile',
				icon: '👤',
				description: 'User profile settings',
				badge: null
			}
		]
	};

	// Flatten all nav items for filtering
	$: allNavItems = Object.values(navigationSections).flat();
	$: filteredNavItems = $user
		? allNavItems.filter((item) => !('roles' in item) || item.roles!.includes($user.role))
		: navigationSections.main.concat(navigationSections.utility);

	// Get current section based on active route
	$: currentSection =
		Object.entries(navigationSections).find(([_, items]) =>
			items.some((item) => $page.url.pathname === item.href)
		)?.[0] || 'main';
</script>

<svelte:window on:click={handleClickOutside} on:keydown={handleSearchKeydown} />

<!-- Modern Navigation Bar -->
<nav class="nav-bar" aria-label="Main navigation">
	<div class="container mx-auto px-safe">
		<div class="flex justify-between items-center h-16">
			<!-- Logo & Brand -->
			<div class="flex items-center space-x-3">
				<a href="/" aria-label="Adaptive fIt - Home" class="flex items-center space-x-3">
					<div
						class="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-sm"
					>
						<Dumbbell class="text-white w-6 h-6" />
					</div>
					<div class="hidden sm:block">
						<div
							class="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"
						>
							Adaptive fIt
						</div>
						<div class="text-xs text-muted -mt-1">AI-Powered Fitness</div>
					</div>
				</a>
			</div>

			<!-- Desktop Navigation -->
			<div class="hidden lg:flex items-center space-x-1">
				<!-- Main Navigation -->
				{#each navigationSections.main as item}
					{@const IconComponent = getIconComponent(item.icon)}
					<a
						href={item.href}
						class="nav-item
							{$page.url.pathname === item.href ? 'nav-item-active' : 'nav-item-inactive'}"
						title={item.description}
						aria-current={$page.url.pathname === item.href ? 'page' : undefined}
					>
						<IconComponent class="w-5 h-5" />
						<span>{item.label}</span>
						{#if item.badge}
							<span class="badge-accent" aria-label="New feature">
								{item.badge}
							</span>
						{/if}
					</a>
				{/each}

				<!-- AI Section -->
				<div class="h-6 w-px bg-border mx-2" aria-hidden="true"></div>
				{#each navigationSections.ai as item}
					{@const IconComponent = getIconComponent(item.icon)}
					<a
						href={item.href}
						class="nav-item
							{$page.url.pathname === item.href ? 'nav-item-secondary-active' : 'nav-item-secondary-inactive'}"
						title={item.description}
						aria-current={$page.url.pathname === item.href ? 'page' : undefined}
					>
						<IconComponent class="w-5 h-5" />
						<span>{item.label}</span>
						{#if item.badge}
							<span class="badge-accent" aria-label="New feature">
								{item.badge}
							</span>
						{/if}
					</a>
				{/each}

				<!-- Tools Section -->
				<div class="h-6 w-px bg-border mx-2" aria-hidden="true"></div>
				{#each navigationSections.tools as item}
					{@const IconComponent = getIconComponent(item.icon)}
					<a
						href={item.href}
						class="nav-item
							{$page.url.pathname === item.href ? 'nav-item-accent-active' : 'nav-item-accent-inactive'}"
						title={item.description}
						aria-current={$page.url.pathname === item.href ? 'page' : undefined}
					>
						<IconComponent class="w-5 h-5" />
						<span>{item.label}</span>
					</a>
				{/each}
			</div>

			<!-- Right Side Actions -->
			<div class="flex items-center space-x-3">
				<!-- Theme Toggle -->
				<ThemeToggle />

				<!-- Search Bar (Desktop) -->
				<div class="hidden md:flex items-center">
					<div class="relative">
						<input
							bind:value={searchQuery}
							on:keydown={handleSearch}
							placeholder="Search workouts, programs..."
							class="input pl-10 w-64"
							aria-label="Search workouts and programs"
							role="searchbox"
						/>
						<Search class="absolute left-3 top-2.5 w-4 h-4 text-muted" />
					</div>
				</div>

				<!-- User Menu -->
				{#if $isAuthenticated && $user}
					<!-- Notifications -->
					<button
						class="btn-icon relative"
						title="Notifications"
						aria-label="View notifications"
						aria-expanded="false"
					>
						<Bell class="w-5 h-5" />
						<span
							class="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"
							aria-label="New notification"
						></span>
					</button>

					<!-- User Avatar & Menu -->
					<div class="relative user-menu">
						<button
							on:click={() => (showUserMenu = !showUserMenu)}
							on:keydown={handleUserMenuKeydown}
							class="btn-icon"
							title="User menu"
							aria-label="Open user menu"
							aria-expanded={showUserMenu}
							aria-haspopup="menu"
							aria-controls="user-menu"
							id="user-menu-button"
						>
							<div
								class="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center shadow-sm"
							>
								<span class="text-white text-sm font-semibold" aria-hidden="true">
									{$user.name.charAt(0)}
								</span>
							</div>
						</button>

						<!-- User Dropdown Menu -->
						{#if showUserMenu}
							<div
								class="dropdown-menu"
								role="menu"
								aria-labelledby="user-menu-button"
								id="user-menu"
								on:keydown={handleUserMenuKeydown}
								tabindex="-1"
							>
								<div class="dropdown-header">
									<div class="font-medium text-foreground">{$user.name}</div>
									<div class="text-sm text-muted capitalize">{$user.role}</div>
								</div>
								<div class="dropdown-section">
									<a href="/profile" class="dropdown-item" role="menuitem">
										<User class="w-4 h-4" />
										<span>Profile Settings</span>
									</a>
									<a href="/achievements" class="dropdown-item" role="menuitem">
										<Sparkles class="w-4 h-4" />
										<span>Achievements</span>
									</a>
									<a href="/recommendations" class="dropdown-item" role="menuitem">
										<Lightbulb class="w-4 h-4" />
										<span>Recommendations</span>
									</a>
								</div>
								<div class="dropdown-section border-t border-border pt-2">
									<button
										on:click={handleLogout}
										class="dropdown-item text-destructive hover:bg-destructive/10 w-full text-left"
										role="menuitem"
									>
										<LogOut class="w-4 h-4" />
										<span>Sign out</span>
									</button>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<!-- Auth Buttons -->
					<div class="hidden sm:flex items-center space-x-2">
						<a href="/auth/login" class="btn-ghost" aria-label="Sign in to your account">
							Sign in
						</a>
						<a href="/auth/register" class="btn-primary" aria-label="Create a new account">
							Get Started
						</a>
					</div>
				{/if}

				<!-- Mobile Menu Button -->
				<button
					on:click={toggleMobileMenu}
					class="lg:hidden btn-icon"
					aria-label="Toggle mobile menu"
				>
					{#if mobileMenuOpen}
						<X class="w-6 h-6" />
					{:else}
						<Menu class="w-6 h-6" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile Navigation -->
		{#if mobileMenuOpen}
			<div
				class="md:hidden py-4 border-t border-border"
				role="navigation"
				aria-label="Mobile navigation menu"
			>
				{#if $isAuthenticated && $user}
					<!-- Authenticated Mobile Menu -->
					<div class="space-y-2">
						{#each filteredNavItems as item}
							{@const IconComponent = getIconComponent(item.icon)}
							<a
								href={item.href}
								class="mobile-nav-item
									{$page.url.pathname === item.href ? 'mobile-nav-item-active' : 'mobile-nav-item-inactive'}"
								on:click={() => (mobileMenuOpen = false)}
								aria-current={$page.url.pathname === item.href ? 'page' : undefined}
							>
								<IconComponent class="w-5 h-5" />
								<span>{item.label}</span>
							</a>
						{/each}

						<!-- Mobile Logout -->
						<button
							on:click={() => {
								handleLogout();
								mobileMenuOpen = false;
							}}
							class="mobile-nav-item mobile-nav-item-destructive"
							aria-label="Sign out of your account"
						>
							<LogOut class="w-5 h-5" />
							<span>Sign out</span>
						</button>
					</div>

					<!-- Mobile User Info -->
					<div class="mt-4 pt-4 border-t border-border">
						<div class="flex items-center space-x-3 px-4">
							<div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
								<span class="text-white font-semibold">
									{$user.name.charAt(0)}
								</span>
							</div>
							<div>
								<div class="font-medium text-foreground">{$user.name}</div>
								<div class="text-muted capitalize text-sm">{$user.role}</div>
							</div>
						</div>
					</div>
				{:else}
					<!-- Not Authenticated Mobile Menu -->
					<div class="space-y-2">
						<a
							href="/auth/login"
							class="mobile-nav-item mobile-nav-item-inactive"
							on:click={() => (mobileMenuOpen = false)}
							aria-label="Sign in to your account"
						>
							<Key class="w-5 h-5" />
							<span>Sign in</span>
						</a>
						<a
							href="/auth/register"
							class="mobile-nav-item mobile-nav-item-primary"
							on:click={() => (mobileMenuOpen = false)}
							aria-label="Create a new account"
						>
							<User class="w-5 h-5" />
							<span>Sign up</span>
						</a>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</nav>
