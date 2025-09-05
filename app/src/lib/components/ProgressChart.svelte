<script lang="ts">
	// Mock chart data - in real app this would come from fitness data
	let chartData = [
		{ date: '2025-01-26', steps: 7200, calories: 2100 },
		{ date: '2025-01-27', steps: 8900, calories: 2350 },
		{ date: '2025-01-28', steps: 6500, calories: 1900 },
		{ date: '2025-01-29', steps: 9200, calories: 2400 },
		{ date: '2025-01-30', steps: 8100, calories: 2200 },
		{ date: '2025-01-31', steps: 7800, calories: 2150 },
		{ date: '2025-02-01', steps: 8432, calories: 2180 }
	];

	let activeTab = 'steps';
	
	$: maxValue = activeTab === 'steps' 
		? Math.max(...chartData.map(d => d.steps))
		: Math.max(...chartData.map(d => d.calories));
</script>

<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
	<div class="flex items-center justify-between mb-6">
		<h3 class="text-lg font-semibold text-gray-900">7-Day Progress</h3>
		<div class="flex bg-gray-100 rounded-lg p-1">
			<button 
				class="px-3 py-1 text-sm font-medium rounded-md transition-colors
					{activeTab === 'steps' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
				on:click={() => activeTab = 'steps'}
			>
				Steps
			</button>
			<button 
				class="px-3 py-1 text-sm font-medium rounded-md transition-colors
					{activeTab === 'calories' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
				on:click={() => activeTab = 'calories'}
			>
				Calories
			</button>
		</div>
	</div>

	<!-- Simple Bar Chart -->
	<div class="flex items-end justify-between h-40 space-x-2">
		{#each chartData as day}
			{@const value = activeTab === 'steps' ? day.steps : day.calories}
			{@const height = (value / maxValue) * 100}
			<div class="flex-1 flex flex-col items-center">
				<div 
					class="w-full rounded-t-md transition-all duration-300 {activeTab === 'steps' ? 'bg-primary' : 'bg-secondary'}"
					style="height: {height}%"
				></div>
				<div class="text-xs text-gray-500 mt-2">
					{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
				</div>
			</div>
		{/each}
	</div>

	<!-- Current Value -->
	<div class="mt-4 text-center">
		<div class="text-2xl font-bold text-gray-900">
			{activeTab === 'steps' 
				? chartData[chartData.length - 1].steps.toLocaleString()
				: chartData[chartData.length - 1].calories.toLocaleString()}
		</div>
		<div class="text-sm text-gray-500 capitalize">{activeTab} Today</div>
	</div>
</div>