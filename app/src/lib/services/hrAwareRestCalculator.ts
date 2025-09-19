import type { Id } from '$lib/convex/_generated/dataModel.js';

// Rest period recommendation interfaces
export interface RestRecommendation {
	duration: number; // in seconds
	reason: string;
	confidence: number; // 0-1 scale
	priority: 'low' | 'medium' | 'high';
	adjustments: {
		minDuration: number;
		maxDuration: number;
		optimalDuration: number;
	};
}

export interface HeartRateRecovery {
	recoveryRate: number; // percentage (0-100)
	timeToRecovery: number; // in seconds
	recoveryQuality: 'poor' | 'fair' | 'good' | 'excellent';
	recoveryTrend: 'improving' | 'stable' | 'declining';
}

export interface RestContext {
	userId: Id<'users'>;
	workoutId: Id<'workouts'>;
	exerciseId: string;
	currentSet: number;
	totalSets: number;
	previousHeartRate: number;
	currentHeartRate: number;
	perceivedEffort: number; // 1-10 scale
	restStartTime: number;
	lastSetEndTime: number;
	exerciseIntensity: 'low' | 'moderate' | 'high' | 'maximum';
	userFitnessLevel: 'beginner' | 'intermediate' | 'advanced';
}

// HR-Aware Rest Calculator Class
export class HRAwareRestCalculator {
	private recoveryHistory: Array<{
		timestamp: number;
		heartRate: number;
		recoveryRate: number;
		restDuration: number;
		exerciseIntensity: string;
	}> = [];

	private userProfile = {
		restingHeartRate: 60,
		maxHeartRate: 190,
		vo2Max: 40, // ml/kg/min
		fitnessLevel: 'intermediate' as const,
		recoveryRate: 0.8, // baseline recovery efficiency
	};

	// Calculate optimal rest period based on current context
	calculateRestPeriod(context: RestContext): RestRecommendation {
		const heartRateRecovery = this.analyzeHeartRateRecovery(context);
		const intensityFactor = this.calculateIntensityFactor(context);
		const fitnessAdjustment = this.calculateFitnessAdjustment(context);
		const historicalAdjustment = this.calculateHistoricalAdjustment(context);

		// Base rest duration calculation
		const baseDuration = this.getBaseRestDuration(context.exerciseIntensity);

		// Apply adjustments
		const adjustedDuration = Math.round(
			baseDuration *
			intensityFactor *
			fitnessAdjustment *
			historicalAdjustment
		);

		// Apply heart rate recovery adjustment
		const hrAdjustment = this.applyHeartRateAdjustment(adjustedDuration, heartRateRecovery);

		// Ensure duration is within reasonable bounds
		const finalDuration = Math.max(30, Math.min(hrAdjustment, 600)); // 30 seconds to 10 minutes

		// Calculate confidence based on data quality
		const confidence = this.calculateConfidence(context, heartRateRecovery);

		return {
			duration: finalDuration,
			reason: this.generateRestReason(context, heartRateRecovery, finalDuration),
			confidence,
			priority: this.determinePriority(context, heartRateRecovery),
			adjustments: {
				minDuration: Math.max(30, finalDuration - 30),
				maxDuration: Math.min(600, finalDuration + 60),
				optimalDuration: finalDuration
			}
		};
	}

	// Analyze heart rate recovery
	private analyzeHeartRateRecovery(context: RestContext): HeartRateRecovery {
		const { previousHeartRate, currentHeartRate, restStartTime, lastSetEndTime } = context;

		if (!previousHeartRate || !currentHeartRate) {
			return {
				recoveryRate: 50,
				timeToRecovery: 120,
				recoveryQuality: 'fair',
				recoveryTrend: 'stable'
			};
		}

		// Calculate recovery rate (how much HR has dropped)
		const hrDrop = previousHeartRate - currentHeartRate;
		const recoveryRate = Math.min(100, (hrDrop / previousHeartRate) * 100);

		// Estimate time to full recovery
		const timeElapsed = restStartTime - lastSetEndTime;
		const estimatedRecoveryTime = this.estimateRecoveryTime(currentHeartRate, recoveryRate, timeElapsed);

		// Determine recovery quality
		let recoveryQuality: HeartRateRecovery['recoveryQuality'];
		if (recoveryRate >= 80) recoveryQuality = 'excellent';
		else if (recoveryRate >= 60) recoveryQuality = 'good';
		else if (recoveryRate >= 40) recoveryQuality = 'fair';
		else recoveryQuality = 'poor';

		// Analyze recovery trend
		const recentRecoveries = this.recoveryHistory.slice(-5);
		let recoveryTrend: HeartRateRecovery['recoveryTrend'] = 'stable';

		if (recentRecoveries.length >= 3) {
			const avgRecentRecovery = recentRecoveries.reduce((sum, r) => sum + r.recoveryRate, 0) / recentRecoveries.length;
			const currentVsAverage = recoveryRate - avgRecentRecovery;

			if (currentVsAverage > 10) recoveryTrend = 'improving';
			else if (currentVsAverage < -10) recoveryTrend = 'declining';
		}

		return {
			recoveryRate,
			timeToRecovery: estimatedRecoveryTime,
			recoveryQuality,
			recoveryTrend
		};
	}

	// Calculate intensity factor based on exercise and perceived effort
	private calculateIntensityFactor(context: RestContext): number {
		const { exerciseIntensity, perceivedEffort } = context;

		let baseFactor = 1.0;

		// Base factor by exercise intensity
		switch (exerciseIntensity) {
			case 'low':
				baseFactor = 0.8;
				break;
			case 'moderate':
				baseFactor = 1.0;
				break;
			case 'high':
				baseFactor = 1.3;
				break;
			case 'maximum':
				baseFactor = 1.6;
				break;
		}

		// Adjust by perceived effort
		const effortAdjustment = 0.8 + (perceivedEffort / 10) * 0.4; // 0.8 to 1.2

		return baseFactor * effortAdjustment;
	}

	// Calculate fitness level adjustment
	private calculateFitnessAdjustment(context: RestContext): number {
		const { userFitnessLevel } = context;

		switch (userFitnessLevel) {
			case 'beginner':
				return 1.2; // Beginners need more rest
			case 'intermediate':
				return 1.0; // Baseline
			case 'advanced':
				return 0.8; // Advanced can handle shorter rests
			default:
				return 1.0;
		}
	}

	// Calculate historical adjustment based on past performance
	private calculateHistoricalAdjustment(context: RestContext): number {
		const relevantHistory = this.recoveryHistory
			.filter(h => h.exerciseIntensity === context.exerciseIntensity)
			.slice(-10);

		if (relevantHistory.length < 3) return 1.0;

		// Calculate average recovery rate for similar exercises
		const avgRecoveryRate = relevantHistory.reduce((sum, h) => sum + h.recoveryRate, 0) / relevantHistory.length;

		// Adjust based on how current recovery compares to historical average
		if (avgRecoveryRate > 70) {
			return 0.9; // Good historical recovery, can reduce rest slightly
		} else if (avgRecoveryRate < 50) {
			return 1.1; // Poor historical recovery, increase rest
		}

		return 1.0;
	}

	// Apply heart rate-based adjustment
	private applyHeartRateAdjustment(baseDuration: number, recovery: HeartRateRecovery): number {
		const { recoveryQuality, recoveryRate } = recovery;

		let adjustmentFactor = 1.0;

		switch (recoveryQuality) {
			case 'excellent':
				adjustmentFactor = 0.8;
				break;
			case 'good':
				adjustmentFactor = 0.9;
				break;
			case 'fair':
				adjustmentFactor = 1.0;
				break;
			case 'poor':
				adjustmentFactor = 1.2;
				break;
		}

		// Additional adjustment based on recovery rate
		if (recoveryRate < 30) {
			adjustmentFactor *= 1.3;
		} else if (recoveryRate > 80) {
			adjustmentFactor *= 0.8;
		}

		return Math.round(baseDuration * adjustmentFactor);
	}

	// Get base rest duration for exercise intensity
	private getBaseRestDuration(intensity: RestContext['exerciseIntensity']): number {
		switch (intensity) {
			case 'low':
				return 60; // 1 minute
			case 'moderate':
				return 90; // 1.5 minutes
			case 'high':
				return 150; // 2.5 minutes
			case 'maximum':
				return 240; // 4 minutes
			default:
				return 120; // 2 minutes
		}
	}

	// Estimate time to full recovery
	private estimateRecoveryTime(currentHR: number, recoveryRate: number, timeElapsed?: number): number {
		const restingHR = this.userProfile.restingHeartRate;
		const hrDeficit = currentHR - restingHR;

		if (hrDeficit <= 0) return 0;

		// Estimate based on recovery rate and heart rate deficit
		const baseRecoveryTime = (hrDeficit / 10) * 60; // Rough estimate: 1 minute per 10 bpm
		const adjustedTime = baseRecoveryTime / (recoveryRate / 100);

		// If we have time elapsed, adjust the estimate
		if (timeElapsed !== undefined) {
			const remainingTime = Math.max(0, adjustedTime - timeElapsed);
			return Math.round(Math.max(30, Math.min(remainingTime, 600)));
		}

		return Math.round(Math.max(30, Math.min(adjustedTime, 600)));
	}

	// Calculate confidence in recommendation
	private calculateConfidence(context: RestContext, recovery: HeartRateRecovery): number {
		let confidence = 0.5; // Base confidence

		// Increase confidence with more data
		if (this.recoveryHistory.length > 10) confidence += 0.2;
		if (this.recoveryHistory.length > 50) confidence += 0.1;

		// Increase confidence with good HR data
		if (context.previousHeartRate && context.currentHeartRate) confidence += 0.2;

		// Adjust based on recovery quality
		if (recovery.recoveryQuality === 'excellent' || recovery.recoveryQuality === 'good') {
			confidence += 0.1;
		}

		return Math.min(1.0, confidence);
	}

	// Generate human-readable reason for rest recommendation
	private generateRestReason(
		context: RestContext,
		recovery: HeartRateRecovery,
		duration: number
	): string {
		const minutes = Math.floor(duration / 60);
		const seconds = duration % 60;
		const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

		let reason = `Rest for ${timeString} to optimize recovery. `;

		if (recovery.recoveryQuality === 'poor') {
			reason += 'Your heart rate recovery is slower than optimal - take the full rest period.';
		} else if (recovery.recoveryQuality === 'excellent') {
			reason += 'Your recovery is excellent - you could potentially shorten this if needed.';
		} else {
			reason += 'This rest period balances recovery with maintaining workout intensity.';
		}

		if (context.currentSet < context.totalSets) {
			reason += ` ${context.totalSets - context.currentSet} sets remaining.`;
		}

		return reason;
	}

	// Determine priority of rest recommendation
	private determinePriority(
		context: RestContext,
		recovery: HeartRateRecovery
	): 'low' | 'medium' | 'high' {
		if (recovery.recoveryQuality === 'poor' || context.perceivedEffort >= 8) {
			return 'high';
		} else if (recovery.recoveryQuality === 'fair' || context.currentSet === 1) {
			return 'medium';
		}

		return 'low';
	}

	// Record rest period outcome for learning
	recordRestOutcome(
		context: RestContext,
		actualRestDuration: number,
		postRestHeartRate: number,
		perceivedReadiness: number // 1-10 scale
	): void {
		// TODO: Use perceivedReadiness for learning and improving recommendations
		console.log('Recording rest outcome with perceived readiness:', perceivedReadiness);
		const recoveryRate = context.previousHeartRate ?
			((context.previousHeartRate - postRestHeartRate) / context.previousHeartRate) * 100 : 50;

		this.recoveryHistory.push({
			timestamp: Date.now(),
			heartRate: postRestHeartRate,
			recoveryRate,
			restDuration: actualRestDuration,
			exerciseIntensity: context.exerciseIntensity
		});

		// Keep only recent history
		if (this.recoveryHistory.length > 100) {
			this.recoveryHistory = this.recoveryHistory.slice(-100);
		}
	}

	// Update user profile with new data
	updateUserProfile(updates: Partial<typeof this.userProfile>): void {
		this.userProfile = { ...this.userProfile, ...updates };
	}

	// Get rest period statistics
	getRestStatistics(): {
		averageRestDuration: number;
		averageRecoveryRate: number;
		restEfficiency: number;
		recommendationAccuracy: number;
	} {
		if (this.recoveryHistory.length === 0) {
			return {
				averageRestDuration: 120,
				averageRecoveryRate: 60,
				restEfficiency: 0.7,
				recommendationAccuracy: 0.5
			};
		}

		const avgRestDuration = this.recoveryHistory.reduce((sum, h) => sum + h.restDuration, 0) / this.recoveryHistory.length;
		const avgRecoveryRate = this.recoveryHistory.reduce((sum, h) => sum + h.recoveryRate, 0) / this.recoveryHistory.length;

		// Calculate rest efficiency (recovery rate per minute of rest)
		const restEfficiency = avgRecoveryRate / (avgRestDuration / 60);

		// Estimate recommendation accuracy (simplified)
		const recommendationAccuracy = Math.min(0.9, 0.5 + (this.recoveryHistory.length / 200));

		return {
			averageRestDuration: Math.round(avgRestDuration),
			averageRecoveryRate: Math.round(avgRecoveryRate),
			restEfficiency: Math.round(restEfficiency * 100) / 100,
			recommendationAccuracy: Math.round(recommendationAccuracy * 100) / 100
		};
	}

	// Get real-time rest guidance
	getRealTimeGuidance(
		currentHeartRate: number,
		targetHeartRate: number,
		timeElapsed: number
	): {
		status: 'resting' | 'ready' | 'extend_rest';
		message: string;
		timeRemaining: number;
	} {
		const hrDifference = currentHeartRate - targetHeartRate;
		const restingHR = this.userProfile.restingHeartRate;

		if (currentHeartRate <= targetHeartRate) {
			return {
				status: 'ready',
				message: `Heart rate recovered to ${currentHeartRate} bpm! Ready for next set.`,
				timeRemaining: 0
			};
		}

		// Check if heart rate is too close to resting (might indicate fatigue)
		if (currentHeartRate - restingHR < 10) {
			return {
				status: 'extend_rest',
				message: 'Heart rate is very close to resting - you may be fatigued. Consider longer rest.',
				timeRemaining: 120
			};
		}

		// Estimate time remaining based on recovery rate
		const estimatedTimeRemaining = Math.round((hrDifference / 10) * 60); // Rough estimate

		if (timeElapsed > 300 && hrDifference > 20) { // 5 minutes elapsed, still high HR
			return {
				status: 'extend_rest',
				message: 'Heart rate still elevated. Consider extending rest or reducing intensity.',
				timeRemaining: estimatedTimeRemaining
			};
		}

		return {
			status: 'resting',
			message: `Recovering... ${estimatedTimeRemaining}s estimated remaining.`,
			timeRemaining: estimatedTimeRemaining
		};
	}
}

// Singleton instance
export const hrAwareRestCalculator = new HRAwareRestCalculator();

// Helper functions
export function calculateRestPeriod(context: RestContext): RestRecommendation {
	return hrAwareRestCalculator.calculateRestPeriod(context);
}

export function getRestStatistics() {
	return hrAwareRestCalculator.getRestStatistics();
}

export function getRealTimeRestGuidance(
	currentHeartRate: number,
	targetHeartRate: number,
	timeElapsed: number
) {
	return hrAwareRestCalculator.getRealTimeGuidance(currentHeartRate, targetHeartRate, timeElapsed);
}

export function recordRestOutcome(
	context: RestContext,
	actualRestDuration: number,
	postRestHeartRate: number,
	perceivedReadiness: number
): void {
	hrAwareRestCalculator.recordRestOutcome(context, actualRestDuration, postRestHeartRate, perceivedReadiness);
}

// Preset rest periods for different scenarios
export const REST_PRESETS = {
	'strength_training': {
		'beginner': { low: 120, moderate: 150, high: 180, maximum: 240 },
		'intermediate': { low: 90, moderate: 120, high: 150, maximum: 180 },
		'advanced': { low: 60, moderate: 90, high: 120, maximum: 150 }
	},
	'cardio': {
		'beginner': { low: 60, moderate: 90, high: 120, maximum: 180 },
		'intermediate': { low: 45, moderate: 60, high: 90, maximum: 120 },
		'advanced': { low: 30, moderate: 45, high: 60, maximum: 90 }
	},
	'hiit': {
		'beginner': { low: 90, moderate: 120, high: 180, maximum: 240 },
		'intermediate': { low: 60, moderate: 90, high: 120, maximum: 180 },
		'advanced': { low: 45, moderate: 60, high: 90, maximum: 120 }
	}
} as const;