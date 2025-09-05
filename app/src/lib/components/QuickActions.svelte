<script lang="ts">
        import { Play, BookOpen, TrendingUp, Plus, Users, BarChart3 } from 'lucide-svelte';
        
        export let userRole: string;

        const clientActions = [
                { label: 'Start Workout', href: '/workouts/start', icon: Play, color: 'bg-primary hover:bg-blue-700' },
                { label: 'Browse Programs', href: '/programs', icon: BookOpen, color: 'bg-secondary hover:bg-green-700' },
                { label: 'Track Progress', href: '/fitness-data', icon: TrendingUp, color: 'bg-accent hover:bg-yellow-600' }
        ];

        const trainerActions = [
                { label: 'Create Program', href: '/create-program', icon: Plus, color: 'bg-primary hover:bg-blue-700' },
                { label: 'View Clients', href: '/clients', icon: Users, color: 'bg-secondary hover:bg-green-700' },
                { label: 'Program Analytics', href: '/analytics', icon: BarChart3, color: 'bg-accent hover:bg-yellow-600' }
        ];

        $: actions = userRole === 'trainer' ? trainerActions : clientActions;
</script>

<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div class="space-y-3">
                {#each actions as action}
                        <a 
                                href={action.href}
                                class="flex items-center p-3 rounded-lg {action.color} text-white transition-colors duration-200 group"
                        >
                                <svelte:component this={action.icon} size={18} class="mr-3" />
                                <span class="font-medium">{action.label}</span>
                                <svg class="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                </svg>
                        </a>
                {/each}
        </div>
</div>