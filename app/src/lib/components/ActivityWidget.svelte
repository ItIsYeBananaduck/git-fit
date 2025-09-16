<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '../convex';

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
</script>

<div
	class="bg-white rounded-xl shadow p-6 min-h-[120px]"
	role="region"
	aria-labelledby="activity-title"
>
	<div class="font-semibold text-primary mb-2" id="activity-title">Recent Activity</div>
	{#if loading}
		<div class="text-gray-400" aria-live="polite">Loading activity data...</div>
	{:else}
		<ul class="text-sm text-gray-700 space-y-1" role="list" aria-label="Recent user activity items">
			{#each activity as item, index}
				<li role="listitem" aria-label="Activity item {index + 1}: {item}">{item}</li>
			{/each}
		</ul>
	{/if}
</div>
