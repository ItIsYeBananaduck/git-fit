<script lang="ts">
	import FitnessChart from '$lib/components/FitnessChart.svelte';
	import DataSourceCard from '$lib/components/DataSourceCard.svelte';
	import WHOOPDataDisplay from '$lib/components/WHOOPDataDisplay.svelte';
	import { Activity, Heart, Moon } from 'lucide-svelte';
	import { whoopState } from '$lib/stores/whoop';

	// Mock fitness data
	let fitnessOverview = {
		todaySteps: 8432,
		weeklyAvgSteps: 7856,
		monthlyCalories: 67500,
		avgHeartRate: 72,
		sleepAverage: 7.2,
		activeMinutes: 45
	};

	let dataSources = [
		{
			name: 'Apple Health',
			connected: true,
			lastSync: '2025-02-01T10:30:00',
			dataTypes: ['steps', 'heart_rate', 'sleep', 'calories']
		},
		{
			name: 'WHOOP',
			connected: false,
			lastSync: null,
			dataTypes: ['heart_rate', 'strain', 'recovery', 'hrv', 'sleep', 'calories']
		},
		{
			name: 'Fitbit',
			connected: false,
			lastSync: null,
			dataTypes: ['steps', 'heart_rate', 'sleep', 'calories', 'distance']
		},
		{
			name: 'Garmin',
			connected: false,
			lastSync: null,
			dataTypes: ['steps', 'heart_rate', 'gps', 'training_load']
		}
	];

	let selectedMetric = 'steps';
	let timeRange = '7d';

	$: whoopConnected = $whoopState.isConnected;

	// Mock chart data
	let chartData: Record<string, { date: string; value: number }[]> = {
		steps: [
			{ date: '2025-01-26', value: 7200 },
			{ date: '2025-01-27', value: 8900 },
			{ date: '2025-01-28', value: 6500 },
			{ date: '2025-01-29', value: 9200 },
			{ date: '2025-01-30', value: 8100 },
			{ date: '2025-01-31', value: 7800 },
			{ date: '2025-02-01', value: 8432 }
		],
		heartRate: [
			{ date: '2025-01-26', value: 68 },
			{ date: '2025-01-27', value: 72 },
			{ date: '2025-01-28', value: 70 },
			{ date: '2025-01-29', value: 75 },
			{ date: '2025-01-30', value: 73 },
			{ date: '2025-01-31', value: 71 },
			{ date: '2025-02-01', value: 72 }
		],
		calories: [
			{ date: '2025-01-26', value: 2100 },
			{ date: '2025-01-27', value: 2300 },
			{ date: '2025-01-28', value: 1950 },
			{ date: '2025-01-29', value: 2400 },
			{ date: '2025-01-30', value: 2200 },
			{ date: '2025-01-31', value: 2150 },
			{ date: '2025-02-01', value: 2250 }
		],
		sleep: [
			{ date: '2025-01-26', value: 7.5 },
			{ date: '2025-01-27', value: 6.8 },
			{ date: '2025-01-28', value: 8.2 },
			{ date: '2025-01-29', value: 7.1 },
			{ date: '2025-01-30', value: 7.8 },
			{ date: '2025-01-31', value: 6.9 },
			{ date: '2025-02-01', value: 7.2 }
		]
	};
</script>

<svelte:head>
	<title>Fitness Data - Technically Fit</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<h1 class="text-2xl font-bold text-gray-900 mb-2">Fitness Data</h1>
		<p class="text-gray-600">Track your health metrics and sync data from your fitness devices</p>
	</div>

	<!-- Overview Stats -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
		<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
			<div class="flex items-center">
				<div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
					<svelte:component this={Activity} size={24} class="text-blue-600" />
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-600">Steps Today</p>
					<p class="text-2xl font-semibold text-blue-600">
						{fitnessOverview.todaySteps.toLocaleString()}
					</p>
					<p class="text-xs text-gray-500">
						Weekly avg: {fitnessOverview.weeklyAvgSteps.toLocaleString()}
					</p>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
			<div class="flex items-center">
				<div class="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
					<svelte:component this={Heart} size={24} class="text-red-600" />
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-600">Resting Heart Rate</p>
					<p class="text-2xl font-semibold text-red-600">{fitnessOverview.avgHeartRate} bpm</p>
					<p class="text-xs text-gray-500">Normal range</p>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
			<div class="flex items-center">
				<div class="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
					<svelte:component this={Moon} size={24} class="text-purple-600" />
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-600">Sleep Average</p>
					<p class="text-2xl font-semibold text-purple-600">{fitnessOverview.sleepAverage}h</p>
					<p class="text-xs text-gray-500">Last 7 days</p>
				</div>
			</div>
		</div>
	</div>

	<!-- WHOOP Data Section -->
	{#if whoopConnected}
		<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
			<WHOOPDataDisplay />
		</div>
	{/if}

	<!-- Data Chart -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
		<div class="flex items-center justify-between mb-6">
			<h3 class="text-lg font-semibold text-gray-900">Trends</h3>
			<div class="flex space-x-2">
				<select
					bind:value={selectedMetric}
					class="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
				>
					<option value="steps">Steps</option>
					<option value="heartRate">Heart Rate</option>
					<option value="calories">Calories</option>
					<option value="sleep">Sleep</option>
				</select>
				<select
					bind:value={timeRange}
					class="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
				>
					<option value="7d">7 Days</option>
					<option value="30d">30 Days</option>
					<option value="90d">90 Days</option>
				</select>
			</div>
		</div>

		<FitnessChart data={chartData[selectedMetric]} metric={selectedMetric} />
	</div>

	<!-- Data Sources -->
	<div class="space-y-4">
		<h2 class="text-xl font-semibold text-gray-900">Connected Devices</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each dataSources as source}
				<DataSourceCard {source} />
			{/each}
		</div>
	</div>
</div>
