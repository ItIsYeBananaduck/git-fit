import type { Id } from '$lib/convex/_generated/dataModel.js';

// Performance data interfaces
export interface PerformanceData {
	userId: Id<'users'>;
	workoutId: Id<'workouts'>;
	exerciseId: string;
	setNumber: number;
	reps: number;
	weight: number;
	heartRate: number;
	restTime: number;
	perceivedEffort: number; // 1-10 scale
	timestamp: number;
}

export interface HeartRateZone {
	zone: 'recovery' | 'fat-burn' | 'cardio' | 'threshold' | 'maximum';
	minHR: number;
	maxHR: number;
	targetEffort: number;
	description: string;
}

export interface WorkoutAdjustment {
	type: 'intensity' | 'volume' | 'rest' | 'exercise' | 'form';
	reason: string;
	originalValue: number | string | object;
	suggestedValue: number | string | object;
	confidence: number; // 0-1 scale
	priority: 'low' | 'medium' | 'high';
}

// Adaptive adjustment engine
export class AdaptiveWorkoutEngine {
	private performanceHistory: PerformanceData[] = [];
	private heartRateZones: HeartRateZone[] = [];
	private userBaseline: {
		maxHeartRate: number;
		restingHeartRate: number;
		vo2Max?: number;
		strengthLevels: Record<string, number>;
	} = {
		maxHeartRate: 190, // Default, should be calculated
		restingHeartRate: 60,
		strengthLevels: {}
	};

	constructor() {
		this.initializeHeartRateZones();
	}

	// Initialize heart rate zones based on user's max HR
	private initializeHeartRateZones(): void {
		const maxHR = this.userBaseline.maxHeartRate;

		this.heartRateZones = [
			{
				zone: 'recovery',
				minHR: Math.round(maxHR * 0.5),
				maxHR: Math.round(maxHR * 0.6),
				targetEffort: 3,
				description: 'Light recovery and warm-up'
			},
			{
				zone: 'fat-burn',
				minHR: Math.round(maxHR * 0.6),
				maxHR: Math.round(maxHR * 0.7),
				targetEffort: 5,
				description: 'Optimal fat burning zone'
			},
			{
				zone: 'cardio',
				minHR: Math.round(maxHR * 0.7),
				maxHR: Math.round(maxHR * 0.8),
				targetEffort: 7,
				description: 'Cardiovascular endurance building'
			},
			{
				zone: 'threshold',
				minHR: Math.round(maxHR * 0.8),
				maxHR: Math.round(maxHR * 0.9),
				targetEffort: 8,
				description: 'Lactate threshold training'
			},
			{
				zone: 'maximum',
				minHR: Math.round(maxHR * 0.9),
				maxHR: maxHR,
				targetEffort: 9,
				description: 'Maximum effort, anaerobic training'
			}
		];
	}

	// Analyze current performance and generate adjustments
	analyzeAndAdjust(currentData: PerformanceData): WorkoutAdjustment[] {
		const adjustments: WorkoutAdjustment[] = [];

		// Add to performance history
		this.performanceHistory.push(currentData);

		// Keep only recent history (last 50 data points)
		if (this.performanceHistory.length > 50) {
			this.performanceHistory = this.performanceHistory.slice(-50);
		}

		// Analyze different aspects
		const hrAdjustment = this.analyzeHeartRate(currentData);
		const intensityAdjustment = this.analyzeIntensity(currentData);
		const restAdjustment = this.analyzeRestTime(currentData);
		const volumeAdjustment = this.analyzeVolume(currentData);

		// Collect valid adjustments
		[hrAdjustment, intensityAdjustment, restAdjustment, volumeAdjustment]
			.filter(adj => adj !== null)
			.forEach(adj => adjustments.push(adj!));

		return adjustments.sort((a, b) => {
			const priorityOrder = { high: 3, medium: 2, low: 1 };
			return priorityOrder[b.priority] - priorityOrder[a.priority];
		});
	}

	// Heart rate analysis and adjustment
	private analyzeHeartRate(data: PerformanceData): WorkoutAdjustment | null {
		const currentZone = this.getCurrentHeartRateZone(data.heartRate);
		const targetZone = this.determineTargetZone(data);

		if (currentZone !== targetZone) {
			const targetZoneData = this.heartRateZones.find(z => z.zone === targetZone)!;

			return {
				type: 'intensity',
				reason: `Heart rate is in ${currentZone} zone, adjusting to ${targetZone} zone for optimal training effect`,
				originalValue: data.heartRate,
				suggestedValue: {
					targetZone,
					minHR: targetZoneData.minHR,
					maxHR: targetZoneData.maxHR,
					description: targetZoneData.description
				},
				confidence: 0.8,
				priority: 'high'
			};
		}

		return null;
	}

	// Intensity analysis based on performance trends
	private analyzeIntensity(data: PerformanceData): WorkoutAdjustment | null {
		const recentPerformance = this.getRecentPerformance(data.exerciseId, 5);
		const avgPerformance = this.calculateAveragePerformance(recentPerformance);

		if (recentPerformance.length < 3) return null;

		const performanceTrend = this.calculatePerformanceTrend(recentPerformance);
		const currentStrength = this.userBaseline.strengthLevels[data.exerciseId] || data.weight;

		// Log for debugging
		console.log(`Performance analysis for ${data.exerciseId}: trend=${performanceTrend.toFixed(3)}, avg=${avgPerformance.toFixed(1)}`);

		// If performance is declining, reduce intensity
		if (performanceTrend < -0.1) {
			const suggestedWeight = Math.max(data.weight * 0.9, currentStrength * 0.8);

			return {
				type: 'intensity',
				reason: 'Performance declining - reducing weight to maintain form and prevent injury',
				originalValue: data.weight,
				suggestedValue: Math.round(suggestedWeight),
				confidence: 0.7,
				priority: 'medium'
			};
		}

		// If performance is improving consistently, consider increasing intensity
		if (performanceTrend > 0.15 && recentPerformance.length >= 5) {
			const suggestedWeight = data.weight * 1.05;

			return {
				type: 'intensity',
				reason: 'Consistent improvement detected - ready for intensity increase',
				originalValue: data.weight,
				suggestedValue: Math.round(suggestedWeight),
				confidence: 0.6,
				priority: 'low'
			};
		}

		return null;
	}

	// Rest time analysis
	private analyzeRestTime(data: PerformanceData): WorkoutAdjustment | null {
		const heartRateRecovery = this.analyzeHeartRateRecovery(data);
		const perceivedEffort = data.perceivedEffort;

		// If heart rate recovery is slow, suggest longer rest
		if (heartRateRecovery < 0.7 && data.restTime < 180) {
			return {
				type: 'rest',
				reason: 'Heart rate recovery is slower than optimal - increasing rest time',
				originalValue: data.restTime,
				suggestedValue: Math.min(data.restTime + 30, 300), // Max 5 minutes
				confidence: 0.75,
				priority: 'medium'
			};
		}

		// If recovery is fast and effort is low, suggest shorter rest
		if (heartRateRecovery > 0.9 && perceivedEffort < 6 && data.restTime > 60) {
			return {
				type: 'rest',
				reason: 'Good recovery detected - can reduce rest time to maintain intensity',
				originalValue: data.restTime,
				suggestedValue: Math.max(data.restTime - 15, 45), // Min 45 seconds
				confidence: 0.65,
				priority: 'low'
			};
		}

		return null;
	}

	// Volume analysis for workout progression
	private analyzeVolume(data: PerformanceData): WorkoutAdjustment | null {
		const workoutVolume = this.calculateWorkoutVolume(data.workoutId);
		const recentWorkouts = this.getRecentWorkouts(7); // Last 7 days

		if (recentWorkouts.length < 3) return null;

		const avgVolume = recentWorkouts.reduce((sum, w) => sum + w.volume, 0) / recentWorkouts.length;
		const volumeVariance = recentWorkouts.reduce((sum, w) => sum + Math.pow(w.volume - avgVolume, 2), 0) / recentWorkouts.length;
		const consistency = Math.max(0, 100 - (Math.sqrt(volumeVariance) / avgVolume) * 100);
		const volumeTrend = this.calculateVolumeTrend(recentWorkouts);

		// If volume is increasing too quickly, suggest reduction
		if (volumeTrend > 0.2) {
			return {
				type: 'volume',
				reason: `Volume increasing too rapidly - risk of overtraining (consistency: ${Math.round(consistency)}%)`,
				originalValue: workoutVolume,
				suggestedValue: Math.round(workoutVolume * 0.9),
				confidence: 0.8,
				priority: 'high'
			};
		}

		// If volume has plateaued, suggest progression
		if (Math.abs(volumeTrend) < 0.05 && recentWorkouts.length >= 5) {
			return {
				type: 'volume',
				reason: 'Volume has plateaued - consider increasing for progression',
				originalValue: workoutVolume,
				suggestedValue: Math.round(workoutVolume * 1.1),
				confidence: 0.6,
				priority: 'medium'
			};
		}

		return null;
	}

	// Helper methods
	private getCurrentHeartRateZone(heartRate: number): string {
		const zone = this.heartRateZones.find(z => heartRate >= z.minHR && heartRate <= z.maxHR);
		return zone?.zone || 'recovery';
	}

	private determineTargetZone(data: PerformanceData): string {
		// Simple logic - can be enhanced with ML
		const perceivedEffort = data.perceivedEffort;

		if (perceivedEffort <= 4) return 'recovery';
		if (perceivedEffort <= 6) return 'fat-burn';
		if (perceivedEffort <= 8) return 'cardio';
		return 'threshold';
	}

	private getRecentPerformance(exerciseId: string, count: number): PerformanceData[] {
		return this.performanceHistory
			.filter(p => p.exerciseId === exerciseId)
			.slice(-count);
	}

	private calculateAveragePerformance(performance: PerformanceData[]): number {
		if (performance.length === 0) return 0;
		return performance.reduce((sum, p) => sum + (p.weight * p.reps), 0) / performance.length;
	}

	private calculatePerformanceTrend(performance: PerformanceData[]): number {
		if (performance.length < 2) return 0;

		const weights = performance.map(p => p.weight);
		const times = performance.map((p, i) => i);

		// Simple linear regression to calculate trend
		const n = weights.length;
		const sumX = times.reduce((a, b) => a + b, 0);
		const sumY = weights.reduce((a, b) => a + b, 0);
		const sumXY = times.reduce((sum, x, i) => sum + x * weights[i], 0);
		const sumXX = times.reduce((sum, x) => sum + x * x, 0);

		const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
		return slope / (sumY / n); // Normalize by average weight
	}

	private analyzeHeartRateRecovery(data: PerformanceData): number {
		// Simplified HR recovery calculation
		const restingHR = this.userBaseline.restingHeartRate;
		const peakHR = data.heartRate;
		const recoveryRate = (peakHR - restingHR) / (220 - restingHR); // Normalized recovery

		return Math.max(0, Math.min(1, recoveryRate));
	}

	private calculateWorkoutVolume(workoutId: Id<'workouts'>): number {
		const workoutData = this.performanceHistory.filter(p => p.workoutId === workoutId);
		return workoutData.reduce((sum, p) => sum + (p.weight * p.reps), 0);
	}

	private getRecentWorkouts(days: number): Array<{ date: number; volume: number }> {
		const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
		const workoutVolumes: Record<string, number> = {};

		this.performanceHistory
			.filter(p => p.timestamp >= cutoff)
			.forEach(p => {
				const workoutId = p.workoutId as string;
				if (!workoutVolumes[workoutId]) {
					workoutVolumes[workoutId] = 0;
				}
				workoutVolumes[workoutId] += p.weight * p.reps;
			});

		return Object.entries(workoutVolumes).map(([workoutId, volume]) => ({
			date: this.performanceHistory.find(p => p.workoutId as string === workoutId)?.timestamp || 0,
			volume
		}));
	}

	private calculateVolumeTrend(workouts: Array<{ date: number; volume: number }>): number {
		if (workouts.length < 2) return 0;

		const sortedWorkouts = workouts.sort((a, b) => a.date - b.date);
		const volumes = sortedWorkouts.map(w => w.volume);
		const times = sortedWorkouts.map((w, i) => i);

		// Linear regression for volume trend
		const n = volumes.length;
		const sumX = times.reduce((a, b) => a + b, 0);
		const sumY = volumes.reduce((a, b) => a + b, 0);
		const sumXY = times.reduce((sum, x, i) => sum + x * volumes[i], 0);
		const sumXX = times.reduce((sum, x) => sum + x * x, 0);

		const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
		return slope / (sumY / n); // Normalize by average volume
	}

	// Update user baseline data
	updateBaseline(updates: Partial<typeof this.userBaseline>): void {
		this.userBaseline = { ...this.userBaseline, ...updates };
		this.initializeHeartRateZones(); // Recalculate zones with new max HR
	}

	// Get current heart rate zones
	getHeartRateZones(): HeartRateZone[] {
		return [...this.heartRateZones];
	}

	// Get performance insights
	getPerformanceInsights(): {
		strengthGains: Record<string, number>;
		consistencyScore: number;
		improvementAreas: string[];
	} {
		const insights = {
			strengthGains: {} as Record<string, number>,
			consistencyScore: 0,
			improvementAreas: [] as string[]
		};

		// Calculate strength gains per exercise
		const exercises = [...new Set(this.performanceHistory.map(p => p.exerciseId))];

		exercises.forEach(exerciseId => {
			const exerciseData = this.performanceHistory.filter(p => p.exerciseId === exerciseId);
			if (exerciseData.length >= 2) {
				const firstWeight = exerciseData[0].weight;
				const lastWeight = exerciseData[exerciseData.length - 1].weight;
				const gain = ((lastWeight - firstWeight) / firstWeight) * 100;
				insights.strengthGains[exerciseId] = gain;
			}
		});

		// Calculate consistency score (0-100)
		const recentWorkouts = this.getRecentWorkouts(14);
		if (recentWorkouts.length >= 7) {
			const volumes = recentWorkouts.map(w => w.volume);
			const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
			const variance = volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumes.length;
			const consistency = Math.max(0, 100 - (Math.sqrt(variance) / avgVolume) * 100);
			insights.consistencyScore = Math.round(consistency);
		}

		// Identify improvement areas
		const avgHR = this.performanceHistory.reduce((sum, p) => sum + p.heartRate, 0) / this.performanceHistory.length;
		const targetZone = this.heartRateZones.find(z => z.zone === 'cardio');

		if (targetZone && avgHR < targetZone.minHR) {
			insights.improvementAreas.push('Cardiovascular endurance could be improved');
		}

		if (insights.consistencyScore < 70) {
			insights.improvementAreas.push('Workout consistency needs improvement');
		}

		return insights;
	}
}

// Singleton instance
export const adaptiveWorkoutEngine = new AdaptiveWorkoutEngine();

// Helper functions
export function getHeartRateZone(heartRate: number): HeartRateZone | null {
	return adaptiveWorkoutEngine.getHeartRateZones().find(zone =>
		heartRate >= zone.minHR && heartRate <= zone.maxHR
	) || null;
}

export function calculateOptimalRestTime(heartRate: number, perceivedEffort: number): number {
	const zone = getHeartRateZone(heartRate);
	if (!zone) return 90; // Default 90 seconds

	// Base rest time on heart rate zone and perceived effort
	let baseRest = 60; // Base 60 seconds

	switch (zone.zone) {
		case 'recovery':
			baseRest = 45;
			break;
		case 'fat-burn':
			baseRest = 60;
			break;
		case 'cardio':
			baseRest = 90;
			break;
		case 'threshold':
			baseRest = 120;
			break;
		case 'maximum':
			baseRest = 180;
			break;
	}

	// Adjust based on perceived effort
	if (perceivedEffort >= 8) baseRest += 30;
	if (perceivedEffort <= 4) baseRest -= 15;

	return Math.max(30, Math.min(baseRest, 300)); // Between 30 seconds and 5 minutes
}

export function generateWorkoutModifications(
	currentWorkout: { exercises: Array<{ id: string; name: string }> },
	userPerformance: PerformanceData[]
): Array<{
	exerciseId: string;
	modification: string;
	reason: string;
}> {
	const modifications: Array<{
		exerciseId: string;
		modification: string;
		reason: string;
	}> = [];

	// Analyze each exercise in the workout
	const exercises = [...new Set(userPerformance.map(p => p.exerciseId))];

	exercises.forEach(exerciseId => {
		const exercisePerformance = userPerformance.filter(p => p.exerciseId === exerciseId);
		const recentPerformance = exercisePerformance.slice(-3);

		if (recentPerformance.length >= 2) {
			const avgWeight = recentPerformance.reduce((sum, p) => sum + p.weight, 0) / recentPerformance.length;
			const trend = adaptiveWorkoutEngine['calculatePerformanceTrend'](recentPerformance);

			if (trend < -0.1) {
				modifications.push({
					exerciseId,
					modification: `Reduce weight by 10% (${Math.round(avgWeight * 0.9)} lbs)`,
					reason: 'Performance declining - focus on form'
				});
			} else if (trend > 0.15) {
				modifications.push({
					exerciseId,
					modification: `Increase weight by 5% (${Math.round(avgWeight * 1.05)} lbs)`,
					reason: 'Ready for progression'
				});
			}
		}
	});

	return modifications;
}