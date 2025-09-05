<script lang="ts">
        import { page } from '$app/stores';
        
        // Mock user state - in real app this would come from auth
        let currentUser = {
                name: 'Demo User',
                role: 'client', // 'client', 'trainer', 'admin'
                avatar: null
        };

        let mobileMenuOpen = false;

        const navItems = [
                { href: '/', label: 'Dashboard', icon: '🏠', roles: ['client', 'trainer', 'admin'] },
                { href: '/programs', label: 'Programs', icon: '💪', roles: ['client', 'trainer', 'admin'] },
                { href: '/workouts', label: 'Workouts', icon: '🏋️', roles: ['client', 'trainer'] },
                { href: '/fitness-data', label: 'Fitness Data', icon: '📊', roles: ['client'] },
                { href: '/exercise-demo', label: 'Equipment Demo', icon: '⚙️', roles: ['client', 'trainer', 'admin'] },
                { href: '/equipment', label: 'Equipment', icon: '🏋️', roles: ['client', 'trainer', 'admin'] },
                { href: '/create-program', label: 'Create Program', icon: '➕', roles: ['trainer'] },
                { href: '/clients', label: 'My Clients', icon: '👥', roles: ['trainer'] },
                { href: '/admin', label: 'Admin', icon: '🔧', roles: ['admin'] },
                { href: '/profile', label: 'Profile', icon: '👤', roles: ['client', 'trainer', 'admin'] }
        ];

        $: filteredNavItems = navItems.filter(item => item.roles.includes(currentUser.role));
</script>

<nav class="bg-white shadow-lg border-b border-gray-200">
        <div class="container mx-auto px-4">
                <div class="flex justify-between items-center h-16">
                        <!-- Logo -->
                        <div class="flex items-center space-x-2">
                                <div class="text-2xl font-bold text-primary">GitFit</div>
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
                                                <span>{item.icon}</span>
                                                <span>{item.label}</span>
                                        </a>
                                {/each}
                        </div>

                        <!-- User Menu -->
                        <div class="flex items-center space-x-4">
                                <div class="hidden sm:flex items-center space-x-2">
                                        <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                                <span class="text-white text-sm font-semibold">
                                                        {currentUser.name.charAt(0)}
                                                </span>
                                        </div>
                                        <div class="text-sm">
                                                <div class="font-medium text-gray-900">{currentUser.name}</div>
                                                <div class="text-gray-500 capitalize">{currentUser.role}</div>
                                        </div>
                                </div>

                                <!-- Mobile menu button -->
                                <button 
                                        on:click={() => mobileMenuOpen = !mobileMenuOpen}
                                        class="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                >
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                        d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                                        </svg>
                                </button>
                        </div>
                </div>

                <!-- Mobile Navigation -->
                {#if mobileMenuOpen}
                        <div class="md:hidden py-4 border-t border-gray-200">
                                <div class="space-y-2">
                                        {#each filteredNavItems as item}
                                                <a 
                                                        href={item.href}
                                                        class="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                                                {$page.url.pathname === item.href 
                                                                        ? 'bg-primary text-white' 
                                                                        : 'text-gray-700 hover:bg-gray-100'}"
                                                        on:click={() => mobileMenuOpen = false}
                                                >
                                                        <span class="text-lg">{item.icon}</span>
                                                        <span>{item.label}</span>
                                                </a>
                                        {/each}
                                </div>
                                
                                <!-- Mobile User Info -->
                                <div class="mt-4 pt-4 border-t border-gray-200">
                                        <div class="flex items-center space-x-3 px-4">
                                                <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                                        <span class="text-white font-semibold">
                                                                {currentUser.name.charAt(0)}
                                                        </span>
                                                </div>
                                                <div>
                                                        <div class="font-medium text-gray-900">{currentUser.name}</div>
                                                        <div class="text-gray-500 capitalize text-sm">{currentUser.role}</div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                {/if}
        </div>
</nav>