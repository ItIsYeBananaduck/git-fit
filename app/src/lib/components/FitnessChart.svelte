<script lang="ts">
	export let data: any[];
	export let metric: string;

	$: maxValue = Math.max(...data.map(d => d.value));
	$: minValue = Math.min(...data.map(d => d.value));
	
	function getMetricInfo(metric: string) {
		switch (metric) {
			case 'steps':
				return { unit: 'steps', color: 'text-blue-600', bgColor: 'bg-blue-500' };
			case 'heartRate':
				return { unit: 'bpm', color: 'text-red-600', bgColor: 'bg-red-500' };
			case 'calories':
				return { unit: 'cal', color: 'text-orange-600', bgColor: 'bg-orange-500' };
			case 'sleep':
				return { unit: 'hours', color: 'text-purple-600', bgColor: 'bg-purple-500' };
			default:
				return { unit: '', color: 'text-gray-600', bgColor: 'bg-gray-500' };
		}
	}
	
	$: metricInfo = getMetricInfo(metric);
</script>

<div class="space-y-4">
	<!-- Chart -->
	<div class="flex items-end justify-between h-64 bg-gray-50 rounded-lg p-4 space-x-2">
		{#each data as point, index}
			{@const height = ((point.value - minValue) / (maxValue - minValue)) * 100}
			<div class="flex-1 flex flex-col items-center">
				<div 
					class="w-full {metricInfo.bgColor} rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer"
					style="height: {Math.max(height, 5)}%"
					title="{point.value} {metricInfo.unit} on {new Date(point.date).toLocaleDateString()}"
				></div>
				<div class="text-xs text-gray-500 mt-2 text-center">
					{new Date(point.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
				</div>
			</div>
		{/each}
	</div>

	<!-- Summary Stats -->
	<div class="grid grid-cols-3 gap-4 text-center">
		<div>
			<div class="text-lg font-semibold {metricInfo.color}">
				{Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length).toLocaleString()}
			</div>
			<div class="text-sm text-gray-500">Average</div>
		</div>
		<div>
			<div class="text-lg font-semibold {metricInfo.color}">
				{maxValue.toLocaleString()}
			</div>
			<div class="text-sm text-gray-500">Highest</div>
		</div>
		<div>
			<div class="text-lg font-semibold {metricInfo.color}">
				{minValue.toLocaleString()}
			</div>
			<div class="text-sm text-gray-500">Lowest</div>
		</div>
	</div>
</div>