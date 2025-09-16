<script lang="ts">
	// Device/Nudge Support Matrix UI
	export let connectedWearable: string | null = null;
	export let smartSetNudges: boolean | undefined;
	export let smartSetNudgesActive: boolean | undefined;

	const deviceMatrix = [
		{
			name: 'WHOOP',
			key: 'whoop',
			smartNudging: true,
			notes: 'Uses strain + recovery'
		},
		{
			name: 'Apple Watch',
			key: 'apple_watch',
			smartNudging: true,
			notes: 'Via HealthKit HR/HRV'
		},
		{
			name: 'Samsung Watch',
			key: 'samsung_watch',
			smartNudging: true,
			notes: 'Via Health Connect'
		},
		{
			name: 'Fitbit',
			key: 'fitbit',
			smartNudging: false,
			notes: 'No real-time strain access'
		},
		{
			name: 'Polar',
			key: 'polar',
			smartNudging: false,
			notes: 'API-based, not real-time'
		}
	];
</script>

<h2>Device & Nudge Support Matrix</h2>
<table class="matrix-table" aria-label="Device and Nudge Support Matrix">
	<thead>
		<tr>
			<th>Device</th>
			<th>Smart Nudging</th>
			<th>Status</th>
			<th>Notes</th>
		</tr>
	</thead>
	<tbody>
		{#each deviceMatrix as device}
			<tr class={connectedWearable === device.key ? 'active-row' : ''}>
				<td>{device.name}</td>
				<td class="device-status">
					{device.smartNudging ? '✅ Yes' : '❌ No'}
				</td>
				<td>
					{#if connectedWearable === device.key}
						<span title="Connected">🟢 Connected</span>
					{:else}
						<span title="Not Connected">⚪ Not Connected</span>
					{/if}
				</td>
				<td>{device.notes}</td>
			</tr>
		{/each}
	</tbody>
</table>

{#if connectedWearable}
	<p>
		<strong>Smart Set Nudges:</strong>
		{smartSetNudges ? 'Enabled' : 'Disabled'}<br />
		<strong>Smart Set Nudges Active:</strong>
		{smartSetNudgesActive ? 'Yes' : 'No'}
	</p>
{/if}

<style>
	.matrix-table {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
	}
	.matrix-table th,
	.matrix-table td {
		border: 1px solid #e0e0e0;
		padding: 0.5rem 1rem;
		text-align: center;
	}
	.matrix-table th {
		background: #f8f8f8;
	}
	.active-row {
		background: #e6f7ff;
	}
	.device-status {
		font-size: 1.2em;
	}
</style>
