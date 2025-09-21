<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/convex';
	import { useConvexClient } from 'convex-svelte';
	import { getUserId } from '$lib/auth';
	import { restManager, type RestSession, type RestEventHandlers } from '$lib/services/restManager';

	export let avgRestSec: number = 90; // Fallback, now managed by RestManager
	export let getCurrentStrain: () => Promise<number>; // Function to get real-time strain from wearable
	export let nudgesEnabled: boolean = false;

	let userId: string = '';
	let currentSession: RestSession | null = null;
	let restProgress = 0;
	let timeRemaining = 0;

	const client = useConvexClient();

	// Set up RestManager monitors and event handlers
	onMount(async () => {
		userId = await getUserId();

		// Set up monitors
		restManager.setStrainMonitor(getCurrentStrain);

		// Set up event handlers
		const eventHandlers: RestEventHandlers = {
			onRestStart: (session: RestSession) => {
				currentSession = session;
				console.log('Rest started:', session);
			},
			onRestProgress: (session: RestSession, progress: number) => {
				restProgress = progress;
				timeRemaining = Math.max(
					0,
					session.targetRestDuration - Math.round((Date.now() - session.startTime) / 1000)
				);
			},
			onRestComplete: (session: RestSession) => {
				currentSession = null;
				restProgress = 0;
				timeRemaining = 0;
				console.log('Rest completed:', session);
			},
			onRestCancel: (session: RestSession) => {
				currentSession = null;
				restProgress = 0;
				timeRemaining = 0;
				console.log('Rest cancelled:', session);
			}
		};

		restManager.setEventHandlers(eventHandlers);
	});

	// Start rest using RestManager
	async function startRest(exerciseId: string = 'current-exercise', setNumber: number = 1) {
		if (!nudgesEnabled) return;

		try {
			currentSession = await restManager.startRest(exerciseId, setNumber, {
				userId: userId as any,
				workoutId: 'current-workout' as any,
				totalSets: 3,
				perceivedEffort: 7,
				exerciseIntensity: 'moderate',
				userFitnessLevel: 'intermediate'
			});
		} catch (error) {
			console.error('Failed to start rest:', error);
		}
	}

	// Cancel rest using RestManager
	async function cancelRest() {
		try {
			await restManager.cancelRest();
		} catch (error) {
			console.error('Failed to cancel rest:', error);
		}
	}

	// Get current rest status
	function getRestStatus() {
		return restManager.getRestStatus();
	}
</script>

<div>
	<button on:click={() => startRest()} disabled={currentSession !== null || !nudgesEnabled}>
		Start Rest Timer
	</button>
	<button on:click={cancelRest} disabled={currentSession === null}> Cancel Rest </button>

	{#if currentSession}
		<div class="rest-status">
			<div>Resting... ({timeRemaining}s remaining)</div>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {restProgress * 100}%"></div>
			</div>
			<div class="rest-info">
				<div>Target: {currentSession.targetRestDuration}s</div>
				{#if currentSession.recommendation}
					<div>Reason: {currentSession.recommendation.reason}</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.rest-status {
		margin-top: 1rem;
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		background-color: #f9f9f9;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background-color: #e0e0e0;
		border-radius: 4px;
		margin: 0.5rem 0;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background-color: #4caf50;
		transition: width 0.3s ease;
	}

	.rest-info {
		font-size: 0.9rem;
		color: #666;
		margin-top: 0.5rem;
	}

	.rest-info div {
		margin-bottom: 0.25rem;
	}
</style>
