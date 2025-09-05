<script lang="ts">
	export let source: any;

	function getSourceIcon(name: string) {
		switch (name.toLowerCase()) {
			case 'apple health': return '🍎';
			case 'fitbit': return '⌚';
			case 'garmin': return '🏃';
			case 'google fit': return '🔵';
			default: return '📱';
		}
	}

	function handleConnect() {
		// In real app, this would trigger OAuth flow
		console.log(`Connecting to ${source.name}...`);
	}

	function handleDisconnect() {
		// In real app, this would disconnect the service
		console.log(`Disconnecting from ${source.name}...`);
	}
</script>

<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center">
			<span class="text-2xl mr-3">{getSourceIcon(source.name)}</span>
			<div>
				<h3 class="font-semibold text-gray-900">{source.name}</h3>
				<div class="flex items-center mt-1">
					<div class="w-2 h-2 rounded-full {source.connected ? 'bg-green-500' : 'bg-gray-300'} mr-2"></div>
					<span class="text-sm text-gray-600">
						{source.connected ? 'Connected' : 'Not connected'}
					</span>
				</div>
			</div>
		</div>
	</div>

	{#if source.connected && source.lastSync}
		<div class="mb-4">
			<div class="text-sm text-gray-600">Last sync:</div>
			<div class="text-sm font-medium text-gray-900">
				{new Date(source.lastSync).toLocaleString()}
			</div>
		</div>
	{/if}

	<!-- Data Types -->
	<div class="mb-4">
		<div class="text-sm text-gray-600 mb-2">Data types:</div>
		<div class="flex flex-wrap gap-1">
			{#each source.dataTypes as dataType}
				<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
					{dataType.replace('_', ' ')}
				</span>
			{/each}
		</div>
	</div>

	<!-- Action Button -->
	{#if source.connected}
		<div class="space-y-2">
			<button 
				class="w-full bg-green-100 text-green-800 py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
			>
				Sync Now
			</button>
			<button 
				on:click={handleDisconnect}
				class="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
			>
				Disconnect
			</button>
		</div>
	{:else}
		<button 
			on:click={handleConnect}
			class="w-full bg-primary text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
		>
			Connect
		</button>
	{/if}
</div>