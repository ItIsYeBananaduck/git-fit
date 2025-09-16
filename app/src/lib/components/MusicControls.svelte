<script lang="ts">
	export let playing: boolean = false;
	export let trackName: string = '';
	export let artistName: string = '';
	export let onPlayPause: () => void;
	export let onSkip: () => void;
	export let onVolumeUp: () => void;
	export let onVolumeDown: () => void;

	// Optionally, expose more events as needed
</script>

<div
	class="music-controls flex items-center gap-4 p-4 bg-gray-50 rounded-xl shadow border border-gray-200"
>
	<button
		class="p-2 rounded-full bg-primary text-white hover:bg-blue-700 transition-colors"
		aria-label={playing ? 'Pause' : 'Play'}
		on:click={onPlayPause}
	>
		{#if playing}
			<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
				><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg
			>
		{:else}
			<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
				><polygon points="5,3 19,12 5,21 5,3" /></svg
			>
		{/if}
	</button>
	<button
		class="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
		aria-label="Skip Track"
		on:click={onSkip}
	>
		<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
			><polygon points="5,4 15,12 5,20 5,4" /><rect x="17" y="4" width="2" height="16" /></svg
		>
	</button>
	<div class="flex flex-col flex-1 min-w-0">
		<span class="truncate font-medium text-gray-900">{trackName || 'No Track Playing'}</span>
		<span class="truncate text-xs text-gray-500">{artistName}</span>
	</div>
	<button
		class="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
		aria-label="Volume Down"
		on:click={onVolumeDown}
	>
		<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
			><polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" /></svg
		>
	</button>
	<button
		class="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
		aria-label="Volume Up"
		on:click={onVolumeUp}
	>
		<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
			><polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" /><path
				d="M15 9v6a3 3 0 0 0 0-6z"
			/></svg
		>
	</button>
</div>

<style>
	.music-controls svg {
		display: block;
	}
</style>
