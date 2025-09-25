<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { Sun, Moon } from 'lucide-svelte';

	$: currentTheme = $theme;
</script>

<button
	class="btn-professional btn-secondary p-2"
	on:click={theme.toggle}
	aria-label="Toggle theme"
	title="Toggle between light and dark theme"
>
	{#if currentTheme === 'light'}
		<Moon size={20} />
	{:else}
		<Sun size={20} />
	{/if}
</button>
