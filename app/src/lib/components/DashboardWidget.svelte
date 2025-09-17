<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
</script>

<button
	class="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center min-h-[120px] w-full text-left cursor-pointer hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
	aria-labelledby="widget-title"
	on:keydown={(event) => {
		if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) {
			dispatch('navigate', {
				direction: event.key.toLowerCase().replace('arrow', ''),
				currentWidget: 'dashboard'
			});
			event.preventDefault();
		}
	}}
	on:focus={() => dispatch('focus', { widget: 'dashboard' })}
	on:click={() => dispatch('select', { widget: 'dashboard' })}
>
	<div class="text-lg font-semibold text-primary" id="widget-title">Custom Widget</div>
	<div class="text-gray-600 text-sm mt-1" aria-label="Widget placeholder content">
		Widget content goes here
	</div>
</button>
