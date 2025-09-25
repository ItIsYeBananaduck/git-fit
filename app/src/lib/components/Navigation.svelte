<script lang="ts">
	import { page } from '$app/stores';
	import { authStore, user, isAuthenticated } from '../stores/auth.js';
	import { goto } from '$app/navigation';
	import ThemeToggle from './ThemeToggle.svelte';

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

	// Get SVG icon for navigation items
	function getIcon(iconName: string): string {
		const icons: Record<string, string> = {
			'🏠': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>`,
			'🎯': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>`,
			'📋': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>`,
			'🍎': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path></svg>`,
			'🧠': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>`,
			'💡': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>`,
			'✨': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>`,
			'📊': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>`,
			'🛒': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13a2 2 0 110 4 2 2 0 010-4zM9 19a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>`,
			'➕': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>`,
			'👥': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`,
			'🛡️': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>`,
			'⚙️': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`,
			'🏋️': `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2 12h4l3 8h6l3-8h4v-2h-4l-3-8H9l-3 8H2v2zm7-6h2l2.5 6h-7L9 6z"/></svg>`,
			'👤': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`,
			'🔔': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>`
		};
		return icons[iconName] || icons['⚙️']; // fallback to settings icon
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
						<svg class="text-white w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
							<path d="M2 12h4l3 8h6l3-8h4v-2h-4l-3-8H9l-3 8H2v2zm7-6h2l2.5 6h-7L9 6z"/>
						</svg>
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
						<div class="text-lg" aria-hidden="true">{@html getIcon(item.icon)}</div>
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
						<div class="text-lg" aria-hidden="true">{@html getIcon(item.icon)}</div>
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
						<div class="text-lg" aria-hidden="true">{@html getIcon(item.icon)}</div>
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
							class="w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
							aria-label="Search workouts and programs"
							role="searchbox"
						/>
						<svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
						</svg>
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
						<div class="text-lg" aria-hidden="true">{@html getIcon('🔔')}</div>
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
							class="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
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
							<span class="text-sm text-gray-500" aria-hidden="true">▼</span>
						</button>

						<!-- User Dropdown Menu -->
						{#if showUserMenu}
							<div
								class="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
								role="menu"
								aria-labelledby="user-menu-button"
								id="user-menu"
								on:keydown={handleUserMenuKeydown}
								tabindex="-1"
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
										<div class="text-sm" aria-hidden="true">{@html getIcon('👤')}</div>
										<span>Profile Settings</span>
									</a>
									<a
										href="/achievements"
										class="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
										role="menuitem"
									>
										<div class="text-sm" aria-hidden="true">{@html getIcon('✨')}</div>
										<span>Achievements</span>
									</a>
									<a
										href="/recommendations"
										class="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
										role="menuitem"
									>
										<div class="text-sm" aria-hidden="true">{@html getIcon('💡')}</div>
										<span>Recommendations</span>
									</a>
								</div>
								<div class="border-t border-gray-100 pt-2">
									<button
										on:click={handleLogout}
										class="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
										role="menuitem"
									>
										<span class="text-sm" aria-hidden="true">🚪</span>
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
					<span class="text-lg" class:hidden={mobileMenuOpen}>☰</span>
					<span class="text-lg" class:hidden={!mobileMenuOpen}>✕</span>
				</button>
			</div>
		</div>

		<!-- Mobile Navigation -->
		{#if mobileMenuOpen}
			<div
				class="md:hidden py-4 border-t border-gray-200"
				role="navigation"
				aria-label="Mobile navigation menu"
			>
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
								<div class="text-lg" aria-hidden="true">{@html getIcon(item.icon)}</div>
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
							<span class="text-lg" aria-hidden="true">🚪</span>
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
							<span class="text-lg" aria-hidden="true">🔑</span>
							<span>Sign in</span>
						</a>
						<a
							href="/auth/register"
							class="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-white bg-primary hover:bg-blue-700"
							on:click={() => (mobileMenuOpen = false)}
							aria-label="Create a new account"
						>
							<div class="text-lg" aria-hidden="true">{@html getIcon('👤')}</div>
							<span>Sign up</span>
						</a>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</nav>
