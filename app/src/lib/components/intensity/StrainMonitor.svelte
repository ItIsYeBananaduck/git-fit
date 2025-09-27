<!--
  StrainMonitor.svelte
  Phase 3.5 - Frontend Components
  
  Real-time strain monitoring display with heart rate zones, recovery metrics,
  and physiological indicators for workout optimization.
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { strainCalculator } from '$lib/services/strainCalculator';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		strainAlert: { level: 'warning' | 'danger'; message: string };
		recoveryNeeded: { strain: number; recommendedRest: number };
		zoneChange: { newZone: string; heartRate: number };
	}>();

	interface StrainData {
		currentStrain: number;
		dailyStrain: number;
		weeklyStrain: number;
		recoveryScore: number;
		heartRate: number;
		hrv: number; // Heart Rate Variability
		zone: 'recovery' | 'moderate' | 'vigorous' | 'maximum';
		timeInZone: { [key: string]: number };
		strainHistory: Array<{ timestamp: Date; strain: number }>;
	}

	interface HeartRateZones {
		recovery: { min: number; max: number; color: string };
		moderate: { min: number; max: number; color: string };
		vigorous: { min: number; max: number; color: string };
		maximum: { min: number; max: number; color: string };
	}

	// Props
	export let userId: string;
	export let restingHR: number = 60;
	export let maxHR: number = 190;
	export let isVisible: boolean = true;
	export let showDetailedView: boolean = false;

	// State
	let strainData: StrainData = {
		currentStrain: 0,
		dailyStrain: 0,
		weeklyStrain: 0,
		recoveryScore: 100,
		heartRate: restingHR,
		hrv: 50,
		zone: 'recovery',
		timeInZone: { recovery: 0, moderate: 0, vigorous: 0, maximum: 0 },
		strainHistory: []
	};

	let isMonitoring = false;
	let monitoringInterval: number | null = null;
	let lastHeartRateUpdate = 0;
	let zoneStartTime: Date | null = null;
	let currentZoneDuration = 0;

	// Calculate heart rate zones
	$: heartRateZones: HeartRateZones = {
		recovery: {
			min: restingHR,
			max: Math.round(maxHR * 0.6),
			color: 'bg-blue-500'
		},
		moderate: {
			min: Math.round(maxHR * 0.6),
			max: Math.round(maxHR * 0.7),
			color: 'bg-green-500'
		},
		vigorous: {
			min: Math.round(maxHR * 0.7),
			max: Math.round(maxHR * 0.85),
			color: 'bg-yellow-500'
		},
		maximum: {
			min: Math.round(maxHR * 0.85),
			max: maxHR,
			color: 'bg-red-500'
		}
	};

	// Reactive zone calculation
	$: currentZone = getCurrentZone(strainData.heartRate);
	$: strainLevel = getStrainLevel(strainData.currentStrain);
	$: recoveryStatus = getRecoveryStatus(strainData.recoveryScore);

	onMount(() => {
		startMonitoring();
		loadStrainHistory();
	});

	onDestroy(() => {
		stopMonitoring();
	});

	function startMonitoring() {
		if (isMonitoring) return;

		isMonitoring = true;
		zoneStartTime = new Date();

		monitoringInterval = setInterval(() => {
			updateStrainData();
			trackTimeInZone();
		}, 1000) as any;
	}

	function stopMonitoring() {
		if (!isMonitoring) return;

		isMonitoring = false;
		if (monitoringInterval) {
			clearInterval(monitoringInterval);
			monitoringInterval = null;
		}

		// Save final time in zone
		if (zoneStartTime) {
			const duration = (Date.now() - zoneStartTime.getTime()) / 1000;
			strainData.timeInZone[currentZone] += duration;
			zoneStartTime = null;
		}
	}

	async function updateStrainData() {
		try {
			// Simulate heart rate data (in real app, this would come from device)
			const simulatedHR = generateSimulatedHeartRate();
			const simulatedHRV = generateSimulatedHRV();

			// Calculate strain using the strain calculator service
			const strainResult = await strainCalculator.calculateStrain({
				heartRate: simulatedHR,
				heartRateVariability: simulatedHRV,
				workoutIntensity: 70, // This would come from intensity scoring
				duration: 1, // 1 second update
				previousStrain: strainData.currentStrain
			});

			const previousZone = strainData.zone;
			const newZone = getCurrentZone(simulatedHR);

			// Check for zone changes
			if (previousZone !== newZone) {
				dispatch('zoneChange', { newZone, heartRate: simulatedHR });

				// Reset zone timer
				if (zoneStartTime) {
					const duration = (Date.now() - zoneStartTime.getTime()) / 1000;
					strainData.timeInZone[previousZone] += duration;
				}
				zoneStartTime = new Date();
			}

			// Update strain data
			strainData = {
				...strainData,
				currentStrain: strainResult.currentStrain,
				dailyStrain: strainResult.dailyStrain,
				weeklyStrain: strainResult.weeklyStrain,
				recoveryScore: strainResult.recoveryScore,
				heartRate: simulatedHR,
				hrv: simulatedHRV,
				zone: newZone,
				strainHistory: [
					{ timestamp: new Date(), strain: strainResult.currentStrain },
					...strainData.strainHistory.slice(0, 299) // Keep last 300 points
				]
			};

			// Check for strain alerts
			checkStrainAlerts();
		} catch (error) {
			console.error('Error updating strain data:', error);
		}
	}

	function generateSimulatedHeartRate(): number {
		// Simulate realistic heart rate changes during exercise
		const baseVariation = (Math.random() - 0.5) * 10;
		const trend = Math.sin(Date.now() / 30000) * 20; // 30-second cycles
		const newHR = Math.max(
			restingHR,
			Math.min(maxHR, strainData.heartRate + baseVariation + trend * 0.1)
		);
		return Math.round(newHR);
	}

	function generateSimulatedHRV(): number {
		// Simulate HRV (typically decreases with fatigue)
		const fatigueEffect = strainData.currentStrain / 100;
		const baseHRV = 50;
		const variation = (Math.random() - 0.5) * 10;
		return Math.max(10, Math.min(100, baseHRV - fatigueEffect * 20 + variation));
	}

	function getCurrentZone(heartRate: number): 'recovery' | 'moderate' | 'vigorous' | 'maximum' {
		if (heartRate >= heartRateZones.maximum.min) return 'maximum';
		if (heartRate >= heartRateZones.vigorous.min) return 'vigorous';
		if (heartRate >= heartRateZones.moderate.min) return 'moderate';
		return 'recovery';
	}

	function getStrainLevel(strain: number): { level: string; color: string } {
		if (strain >= 18) return { level: 'Overreaching', color: 'text-red-500' };
		if (strain >= 14) return { level: 'High', color: 'text-orange-500' };
		if (strain >= 10) return { level: 'Moderate', color: 'text-yellow-500' };
		if (strain >= 6) return { level: 'Low', color: 'text-green-500' };
		return { level: 'Minimal', color: 'text-blue-500' };
	}

	function getRecoveryStatus(score: number): {
		status: string;
		color: string;
		recommendation: string;
	} {
		if (score >= 90)
			return {
				status: 'Excellent',
				color: 'text-green-500',
				recommendation: 'Ready for high intensity training'
			};
		if (score >= 70)
			return {
				status: 'Good',
				color: 'text-blue-500',
				recommendation: 'Ready for moderate to high intensity'
			};
		if (score >= 50)
			return {
				status: 'Fair',
				color: 'text-yellow-500',
				recommendation: 'Light to moderate intensity recommended'
			};
		if (score >= 30)
			return {
				status: 'Poor',
				color: 'text-orange-500',
				recommendation: 'Consider active recovery or rest'
			};
		return {
			status: 'Very Poor',
			color: 'text-red-500',
			recommendation: 'Rest day strongly recommended'
		};
	}

	function trackTimeInZone() {
		if (!zoneStartTime) return;

		currentZoneDuration = (Date.now() - zoneStartTime.getTime()) / 1000;
	}

	function checkStrainAlerts() {
		// High strain alert
		if (strainData.currentStrain >= 16) {
			dispatch('strainAlert', {
				level: 'danger',
				message: 'Very high strain detected. Consider reducing intensity.'
			});
		} else if (strainData.currentStrain >= 14) {
			dispatch('strainAlert', {
				level: 'warning',
				message: 'High strain level. Monitor closely.'
			});
		}

		// Recovery alert
		if (strainData.recoveryScore <= 30) {
			dispatch('recoveryNeeded', {
				strain: strainData.currentStrain,
				recommendedRest: Math.ceil(strainData.currentStrain * 2)
			});
		}
	}

	async function loadStrainHistory() {
		// In real app, load from backend
		try {
			// Simulate loading strain history
			const history = Array.from({ length: 24 }, (_, i) => ({
				timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000), // Last 24 hours
				strain: Math.random() * 15 + 2
			}));

			strainData.strainHistory = history;
		} catch (error) {
			console.error('Error loading strain history:', error);
		}
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function getZonePercentage(zone: string): number {
		const totalTime = Object.values(strainData.timeInZone).reduce((sum, time) => sum + time, 0);
		if (totalTime === 0) return 0;
		return (strainData.timeInZone[zone] / totalTime) * 100;
	}

	function resetSession() {
		strainData.timeInZone = { recovery: 0, moderate: 0, vigorous: 0, maximum: 0 };
		strainData.currentStrain = 0;
		zoneStartTime = new Date();
		currentZoneDuration = 0;
	}
</script>

{#if isVisible}
	<div class="bg-gray-900 text-white rounded-xl p-6 space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="text-2xl">❤️</div>
				<div>
					<h2 class="text-xl font-bold">Strain Monitor</h2>
					<p class="text-sm text-gray-400">Real-time physiological tracking</p>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<div
						class="w-3 h-3 rounded-full"
						class:bg-green-400={isMonitoring}
						class:bg-gray-500={!isMonitoring}
					></div>
					<span class="text-sm">{isMonitoring ? 'Monitoring' : 'Stopped'}</span>
				</div>

				<button
					on:click={isMonitoring ? stopMonitoring : startMonitoring}
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
					class:bg-green-600={!isMonitoring}
					class:hover:bg-green-500={!isMonitoring}
					class:bg-red-600={isMonitoring}
					class:hover:bg-red-500={isMonitoring}
				>
					{isMonitoring ? 'Stop' : 'Start'}
				</button>
			</div>
		</div>

		<!-- Key Metrics -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<!-- Current Strain -->
			<div class="p-4 bg-gray-800 rounded-lg">
				<div class="text-2xl font-bold {strainLevel.color}">
					{strainData.currentStrain.toFixed(1)}
				</div>
				<div class="text-sm text-gray-400">Current Strain</div>
				<div class="text-xs {strainLevel.color}">{strainLevel.level}</div>
			</div>

			<!-- Heart Rate -->
			<div class="p-4 bg-gray-800 rounded-lg">
				<div class="text-2xl font-bold text-red-400">{strainData.heartRate}</div>
				<div class="text-sm text-gray-400">Heart Rate</div>
				<div class="text-xs text-gray-400">bpm</div>
			</div>

			<!-- Recovery Score -->
			<div class="p-4 bg-gray-800 rounded-lg">
				<div class="text-2xl font-bold {recoveryStatus.color}">{strainData.recoveryScore}%</div>
				<div class="text-sm text-gray-400">Recovery</div>
				<div class="text-xs {recoveryStatus.color}">{recoveryStatus.status}</div>
			</div>

			<!-- HRV -->
			<div class="p-4 bg-gray-800 rounded-lg">
				<div class="text-2xl font-bold text-purple-400">{strainData.hrv.toFixed(1)}</div>
				<div class="text-sm text-gray-400">HRV</div>
				<div class="text-xs text-gray-400">ms</div>
			</div>
		</div>

		<!-- Heart Rate Zone Display -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold">Heart Rate Zone</h3>
				<div class="flex items-center gap-2">
					<span class="text-sm text-gray-400">Current:</span>
					<span
						class="capitalize font-medium"
						class:text-blue-400={currentZone === 'recovery'}
						class:text-green-400={currentZone === 'moderate'}
						class:text-yellow-400={currentZone === 'vigorous'}
						class:text-red-400={currentZone === 'maximum'}
					>
						{currentZone}
					</span>
					<span class="text-sm text-gray-400">({formatTime(currentZoneDuration)})</span>
				</div>
			</div>

			<!-- Zone Indicator -->
			<div class="relative">
				<div class="flex h-8 rounded-lg overflow-hidden">
					<div class="flex-1 bg-blue-500 flex items-center justify-center text-xs font-medium">
						Recovery<br />{heartRateZones.recovery.min}-{heartRateZones.recovery.max}
					</div>
					<div class="flex-1 bg-green-500 flex items-center justify-center text-xs font-medium">
						Moderate<br />{heartRateZones.moderate.min}-{heartRateZones.moderate.max}
					</div>
					<div class="flex-1 bg-yellow-500 flex items-center justify-center text-xs font-medium">
						Vigorous<br />{heartRateZones.vigorous.min}-{heartRateZones.vigorous.max}
					</div>
					<div class="flex-1 bg-red-500 flex items-center justify-center text-xs font-medium">
						Maximum<br />{heartRateZones.maximum.min}-{heartRateZones.maximum.max}
					</div>
				</div>

				<!-- Current HR Indicator -->
				<div
					class="absolute top-0 w-1 h-8 bg-white border-2 border-black"
					style="left: {Math.min(
						100,
						Math.max(0, ((strainData.heartRate - restingHR) / (maxHR - restingHR)) * 100)
					)}%; transform: translateX(-50%)"
				></div>
			</div>
		</div>

		<!-- Time in Zone -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold">Time in Zone</h3>

			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				{#each Object.entries(strainData.timeInZone) as [zone, time]}
					<div class="p-3 bg-gray-800 rounded-lg">
						<div class="flex items-center gap-2 mb-2">
							<div
								class="w-3 h-3 rounded-full"
								class:bg-blue-400={zone === 'recovery'}
								class:bg-green-400={zone === 'moderate'}
								class:bg-yellow-400={zone === 'vigorous'}
								class:bg-red-400={zone === 'maximum'}
							></div>
							<span class="text-sm capitalize font-medium">{zone}</span>
						</div>
						<div class="text-lg font-bold">
							{formatTime(time + (currentZone === zone ? currentZoneDuration : 0))}
						</div>
						<div class="text-xs text-gray-400">{getZonePercentage(zone).toFixed(1)}%</div>
					</div>
				{/each}
			</div>
		</div>

		{#if showDetailedView}
			<!-- Detailed Analytics -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Strain Trend -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold">Strain Trend</h3>

					<div class="bg-gray-800 rounded-lg p-4">
						<div class="h-32 relative">
							<!-- Simple strain chart -->
							<div class="absolute inset-0 flex items-end justify-between">
								{#each strainData.strainHistory.slice(-20) as point, i}
									<div
										class="w-2 bg-blue-500 rounded-t"
										style="height: {(point.strain / 20) * 100}%"
										title="{point.timestamp.toLocaleTimeString()}: {point.strain.toFixed(1)}"
									></div>
								{/each}
							</div>
						</div>

						<div class="mt-2 text-xs text-gray-400 text-center">Last 20 measurements</div>
					</div>
				</div>

				<!-- Recovery Metrics -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold">Recovery Insights</h3>

					<div class="space-y-3">
						<div class="p-4 bg-gray-800 rounded-lg">
							<div class="flex justify-between items-center mb-2">
								<span class="text-sm">Daily Strain</span>
								<span class="font-bold text-orange-400">{strainData.dailyStrain.toFixed(1)}</span>
							</div>
							<div class="w-full bg-gray-700 rounded-full h-2">
								<div
									class="bg-orange-400 h-2 rounded-full"
									style="width: {Math.min(100, (strainData.dailyStrain / 20) * 100)}%"
								></div>
							</div>
						</div>

						<div class="p-4 bg-gray-800 rounded-lg">
							<div class="flex justify-between items-center mb-2">
								<span class="text-sm">Weekly Strain</span>
								<span class="font-bold text-purple-400">{strainData.weeklyStrain.toFixed(1)}</span>
							</div>
							<div class="w-full bg-gray-700 rounded-full h-2">
								<div
									class="bg-purple-400 h-2 rounded-full"
									style="width: {Math.min(100, (strainData.weeklyStrain / 100) * 100)}%"
								></div>
							</div>
						</div>

						<div class="p-4 bg-gray-800 rounded-lg">
							<div class="text-sm text-gray-400 mb-1">Recovery Recommendation</div>
							<div class="text-sm {recoveryStatus.color}">{recoveryStatus.recommendation}</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="flex gap-3">
			<button
				on:click={() => (showDetailedView = !showDetailedView)}
				class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
			>
				{showDetailedView ? 'Simple View' : 'Detailed View'}
			</button>

			<button
				on:click={resetSession}
				class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
			>
				Reset Session
			</button>

			<button
				on:click={loadStrainHistory}
				class="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm transition-colors"
			>
				Refresh Data
			</button>
		</div>

		<!-- Alerts -->
		{#if strainData.currentStrain >= 16}
			<div class="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
				<div class="flex items-center gap-3">
					<div class="text-2xl">⚠️</div>
					<div>
						<div class="font-medium text-red-400">High Strain Alert</div>
						<div class="text-sm text-gray-300">
							Your current strain level is very high. Consider reducing intensity or taking a break.
						</div>
					</div>
				</div>
			</div>
		{:else if strainData.recoveryScore <= 30}
			<div class="p-4 bg-orange-900/20 border border-orange-500/20 rounded-lg">
				<div class="flex items-center gap-3">
					<div class="text-2xl">🛌</div>
					<div>
						<div class="font-medium text-orange-400">Recovery Needed</div>
						<div class="text-sm text-gray-300">
							Your recovery score is low. Consider a rest day or light activity.
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
