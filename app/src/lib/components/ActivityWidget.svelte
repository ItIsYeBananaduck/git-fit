<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { api } from '../convex.js';

	const dispatch = createEventDispatcher();

	type UserActivityMetrics = {
		lastLogin: string;
		sessionCount: number;
		averageSessionDuration: number;
		featureUsage: Record<string, unknown>;
		engagementScore: number;
		retentionCohort: string;
	};

	let activity: string[] = [];
	let loading = true;

	onMount(async () => {
		loading = true;
		// This would be replaced with a real user ID/session
		const metrics: UserActivityMetrics = await api.admin.users.getUserActivityMetrics();
		activity = [
			`Last login: ${new Date(metrics.lastLogin).toLocaleString()}`,
			`Sessions: ${metrics.sessionCount}`,
			`Avg. session: ${metrics.averageSessionDuration} min`
		];
		loading = false;
	});

	function handleKeydown(event: KeyboardEvent) {
		if (
			event.key === 'ArrowRight' ||
			event.key === 'ArrowDown' ||
			event.key === 'ArrowLeft' ||
			event.key === 'ArrowUp'
		) {
			dispatch('navigate', {
				direction: event.key.toLowerCase().replace('arrow', ''),
				currentWidget: 'activity'
			});
			event.preventDefault();
		}
	}
</script>

<button
	class="bg-white rounded-xl shadow p-6 min-h-[120px] w-full text-left cursor-pointer hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
	aria-labelledby="activity-title"
	on:keydown={handleKeydown}
	on:focus={() => dispatch('focus', { widget: 'activity' })}
	on:click={() => dispatch('select', { widget: 'activity' })}
>
	<div class="font-semibold text-primary mb-2" id="activity-title">Recent Activity</div>
	{#if loading}
		<div class="text-gray-500" aria-live="polite">Loading activity data...</div>
	{:else}
		<ul class="text-sm text-gray-800 space-y-1" role="list" aria-label="Recent user activity items">
			{#each activity as item, index}
				<li role="listitem" aria-label="Activity item {index + 1}: {item}">{item}</li>
			{/each}
		</ul>
	{/if}
</button>
