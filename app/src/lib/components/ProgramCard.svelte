<script lang="ts">
	export let program: any;

	function getDifficultyColor(difficulty: string) {
		switch (difficulty) {
			case 'beginner': return 'bg-green-100 text-green-800';
			case 'intermediate': return 'bg-yellow-100 text-yellow-800';
			case 'advanced': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
	<!-- Program Image Placeholder -->
	<div class="h-48 bg-gradient-to-br from-primary to-blue-600 relative">
		<div class="absolute top-4 left-4">
			<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getDifficultyColor(program.difficulty)}">
				{program.difficulty}
			</span>
		</div>
		<div class="absolute top-4 right-4">
			<div class="bg-white bg-opacity-90 rounded-lg px-2 py-1">
				<div class="flex items-center space-x-1">
					<span class="text-yellow-400">⭐</span>
					<span class="text-sm font-medium">{program.rating}</span>
				</div>
			</div>
		</div>
		<div class="absolute bottom-4 left-4 text-white">
			<div class="text-sm opacity-80">{program.duration} weeks</div>
		</div>
	</div>

	<div class="p-6">
		<!-- Program Title and Description -->
		<h3 class="text-lg font-semibold text-gray-900 mb-2">{program.name}</h3>
		<p class="text-gray-600 text-sm mb-4 line-clamp-2">{program.description}</p>

		<!-- Trainer Info -->
		<div class="flex items-center mb-4">
			<div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
				<span class="text-sm font-medium text-gray-600">
					{program.trainer.name.charAt(0)}
				</span>
			</div>
			<div class="ml-3">
				<div class="flex items-center">
					<span class="text-sm font-medium text-gray-900">{program.trainer.name}</span>
					{#if program.trainer.verified}
						<span class="ml-1 text-blue-500">✓</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Categories -->
		<div class="flex flex-wrap gap-2 mb-4">
			{#each program.category as cat}
				<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
					{cat}
				</span>
			{/each}
		</div>

		<!-- Equipment -->
		{#if program.equipment.length > 0}
			<div class="mb-4">
				<div class="text-xs text-gray-500 mb-1">Equipment needed:</div>
				<div class="text-sm text-gray-700">
					{program.equipment.join(', ')}
				</div>
			</div>
		{:else}
			<div class="mb-4">
				<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
					No equipment needed
				</span>
			</div>
		{/if}

		<!-- Footer -->
		<div class="flex items-center justify-between pt-4 border-t border-gray-200">
			<div>
				<div class="text-2xl font-bold text-gray-900">${program.price}</div>
				<div class="text-xs text-gray-500">{program.totalPurchases} purchases</div>
			</div>
			<button class="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
				View Details
			</button>
		</div>
	</div>
</div>