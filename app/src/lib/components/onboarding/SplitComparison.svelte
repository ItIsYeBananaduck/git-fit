<script lang="ts">
	export let recommendations: any[];

	function getTypeColor(type: string) {
		switch (type) {
			case 'strength':
				return 'bg-red-100 text-red-800';
			case 'cardio':
				return 'bg-blue-100 text-blue-800';
			case 'rest':
				return 'bg-gray-100 text-gray-800';
			case 'sport_specific':
				return 'bg-green-100 text-green-800';
			case 'conditioning':
				return 'bg-purple-100 text-purple-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getTypeIcon(type: string) {
		switch (type) {
			case 'strength':
				return '💪';
			case 'cardio':
				return '🏃';
			case 'rest':
				return '😴';
			case 'sport_specific':
				return '⚽';
			case 'conditioning':
				return '🔥';
			default:
				return '📅';
		}
	}
</script>

<div class="overflow-x-auto">
	<table class="min-w-full bg-white border border-gray-200 rounded-lg">
		<thead>
			<tr class="bg-gray-50">
				<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
					Day
				</th>
				{#each recommendations as recommendation}
					<th
						class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
					>
						{recommendation.name}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200">
			{#each Array.from({ length: 7 }, (_, i) => i + 1) as day}
				<tr class="hover:bg-gray-50">
					<td class="px-4 py-3 text-sm font-medium text-gray-900">
						Day {day}
					</td>
					{#each recommendations as recommendation}
						{@const dayData = recommendation.split.find((d: any) => d.day === day)}
						<td class="px-4 py-3">
							{#if dayData}
								<div class="flex items-center space-x-2">
									<span class="text-sm">{getTypeIcon(dayData.type)}</span>
									<div>
										<div class="text-sm font-medium text-gray-900">
											{dayData.focus}
										</div>
										<span
											class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {getTypeColor(
												dayData.type
											)}"
										>
											{dayData.type.replace('_', ' ')}
										</span>
									</div>
								</div>
							{:else}
								<span class="text-sm text-gray-400">Rest</span>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<!-- Summary Comparison -->
<div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
	{#each recommendations as recommendation}
		<div class="bg-gray-50 rounded-lg p-4">
			<h4 class="font-medium text-gray-900 mb-2">{recommendation.name}</h4>
			<div class="space-y-1 text-sm">
				{#each Object.entries(recommendation.weeklyStructure) as [type, count]}
					<div class="flex justify-between">
						<span class="capitalize text-gray-600">{type.replace('_', ' ')}:</span>
						<span class="font-medium">{count} days</span>
					</div>
				{/each}
			</div>
			<div class="mt-2 pt-2 border-t border-gray-200">
				<div class="flex justify-between text-sm">
					<span class="text-gray-600">Match Score:</span>
					<span class="font-medium text-blue-600">{recommendation.score}%</span>
				</div>
			</div>
		</div>
	{/each}
</div>

<!-- Educational Content -->
<div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
	<h4 class="font-medium text-blue-900 mb-2">Understanding Training Splits</h4>
	<div class="text-sm text-blue-800 space-y-2">
		<p>
			<strong>Strength Days:</strong> Focus on building muscle and increasing power through compound
			movements.
		</p>
		<p>
			<strong>Cardio Days:</strong> Improve cardiovascular fitness and burn calories through aerobic
			exercise.
		</p>
		<p>
			<strong>Rest Days:</strong> Allow recovery and prevent overtraining. Light activity or complete
			rest.
		</p>
		<p>
			<strong>Sport-Specific Days:</strong> Practice skills and movements specific to your chosen sport.
		</p>
		<p>
			<strong>Conditioning Days:</strong> Build work capacity and improve overall athletic performance.
		</p>
	</div>
</div>
