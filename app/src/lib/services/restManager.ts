import type { Id } from '$lib/convex/_generated/dataModel.js';
import { ttsEngine, narrationQueueManager, type NarrationSegment } from './ttsEngine.js';

// Local type definitions (previously from hrAwareRestCalculator)
export interface RestRecommendation {
	duration: number;
	reason: string;
	confidence: number;
	priority: 'low' | 'medium' | 'high';
	adjustments: {
		minDuration: number;
		maxDuration: number;
		optimalDuration: number;
	};
}

export interface RestContext {
	userId: Id<'users'>;
	workoutId: Id<'workouts'>;
	exerciseId: string;
	currentSet: number;
	totalSets: number;
	previousHeartRate: number;
	currentHeartRate: number;
	perceivedEffort: number;
	restStartTime: number;
	lastSetEndTime: number;
	exerciseIntensity: 'low' | 'moderate' | 'high' | 'maximum';
	userFitnessLevel: 'beginner' | 'intermediate' | 'advanced';
}

// Rest Manager Configuration
export interface RestManagerConfig {
	enabled: boolean;
	hrBasedRest: boolean;
	strainBasedNudging: boolean;
	ttsIntegration: boolean;
	minRestTime: number; // seconds
	maxRestTime: number; // seconds
	defaultRestTime: number; // seconds
	autoAdjustThreshold: number; // HR recovery threshold for auto-adjust
	strainRecoveryThreshold: number; // Strain drop threshold for nudging
}

export interface RestSession {
	id: string;
	exerciseId: string;
	setNumber: number;
	startTime: number;
	endTime?: number;
	targetRestDuration: number;
	actualRestDuration?: number;
	heartRateStart?: number;
	heartRateEnd?: number;
	strainStart?: number;
	strainEnd?: number;
	recommendation?: RestRecommendation;
	status: 'active' | 'completed' | 'cancelled';
}

export interface RestEventHandlers {
	onRestStart?: (session: RestSession) => void;
	onRestProgress?: (session: RestSession, progress: number) => void;
	onRestComplete?: (session: RestSession) => void;
	onRestCancel?: (session: RestSession) => void;
	onRestRecommendation?: (recommendation: RestRecommendation) => void;
	onNarrationTrigger?: (segment: NarrationSegment) => void;
}

// Unified Rest Manager
export class RestManager {
	private config: RestManagerConfig;
	private activeSession: RestSession | null = null;
	private restTimer: NodeJS.Timeout | null = null;
	private eventHandlers: RestEventHandlers = {};
	private strainMonitor: (() => Promise<number>) | null = null;
	private hrMonitor: (() => Promise<number>) | null = null;

	constructor(config: Partial<RestManagerConfig> = {}) {
		this.config = {
			enabled: true,
			hrBasedRest: true,
			strainBasedNudging: true,
			ttsIntegration: true,
			minRestTime: 30,
			maxRestTime: 600,
			defaultRestTime: 90,
			autoAdjustThreshold: 0.7, // 70% HR recovery
			strainRecoveryThreshold: 0.97, // 97% of start strain
			...config
		};
	}

	// Configuration management
	updateConfig(newConfig: Partial<RestManagerConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	getConfig(): RestManagerConfig {
		return { ...this.config };
	}

	// Monitor setup
	setStrainMonitor(monitor: () => Promise<number>): void {
		this.strainMonitor = monitor;
	}

	setHRMonitor(monitor: () => Promise<number>): void {
		this.hrMonitor = monitor;
	}

	// Event handlers
	setEventHandlers(handlers: RestEventHandlers): void {
		this.eventHandlers = { ...this.eventHandlers, ...handlers };
	}

	// Start rest session
	async startRest(
		exerciseId: string,
		setNumber: number,
		context: Partial<RestContext> = {}
	): Promise<RestSession> {
		if (!this.config.enabled) {
			throw new Error('RestManager is disabled');
		}

		// Cancel any existing session
		if (this.activeSession) {
			await this.cancelRest();
		}

		const sessionId = `rest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const startTime = Date.now();

		// Get current HR and strain
		let heartRateStart: number | undefined;
		let strainStart: number | undefined;

		try {
			if (this.config.hrBasedRest && this.hrMonitor) {
				heartRateStart = await this.hrMonitor();
			}
			if (this.config.strainBasedNudging && this.strainMonitor) {
				strainStart = await this.strainMonitor();
			}
		} catch (error) {
			console.warn('Failed to get initial readings:', error);
		}

		// Create rest context for HR-aware calculation
		const restContext: RestContext = {
			userId: context.userId || 'current-user' as Id<'users'>,
			workoutId: context.workoutId || 'current-workout' as Id<'workouts'>,
			exerciseId,
			currentSet: setNumber,
			totalSets: context.totalSets || 3,
			previousHeartRate: heartRateStart || 70, // Default resting HR
			currentHeartRate: heartRateStart || 70,
			perceivedEffort: context.perceivedEffort || 7,
			restStartTime: startTime,
			lastSetEndTime: startTime,
			exerciseIntensity: context.exerciseIntensity || 'moderate',
			userFitnessLevel: context.userFitnessLevel || 'intermediate'
		};

		// Get rest recommendation (simplified without HR calculator)
		let recommendation: RestRecommendation | undefined;
		if (this.config.hrBasedRest) {
			try {
				// Simple recommendation based on perceived effort
				const baseDuration = this.getBaseRestDuration(restContext.exerciseIntensity);
				const adjustedDuration = this.adjustDurationByEffort(baseDuration, restContext.perceivedEffort);

				recommendation = {
					duration: adjustedDuration,
					reason: `Rest period adjusted for ${restContext.exerciseIntensity} intensity and effort level ${restContext.perceivedEffort}`,
					confidence: 0.7,
					priority: 'medium',
					adjustments: {
						minDuration: Math.max(30, adjustedDuration - 30),
						maxDuration: Math.min(600, adjustedDuration + 60),
						optimalDuration: adjustedDuration
					}
				};
				this.eventHandlers.onRestRecommendation?.(recommendation);
			} catch (error) {
				console.warn('Failed to generate rest recommendation:', error);
			}
		}

		// Determine target duration
		const targetDuration = recommendation?.duration ||
			(context as Partial<RestContext & { restTime?: number }>).restTime ||
			this.config.defaultRestTime;

		const clampedDuration = Math.max(
			this.config.minRestTime,
			Math.min(targetDuration, this.config.maxRestTime)
		);

		// Create session
		this.activeSession = {
			id: sessionId,
			exerciseId,
			setNumber,
			startTime,
			targetRestDuration: clampedDuration,
			heartRateStart,
			strainStart,
			recommendation,
			status: 'active'
		};

		// Trigger start event
		this.eventHandlers.onRestStart?.(this.activeSession);

		// Start TTS narration if enabled
		if (this.config.ttsIntegration && recommendation) {
			this.triggerRestNarration(recommendation, setNumber);
		}

		// Start monitoring
		this.startMonitoring();

		return this.activeSession;
	}

	// Start monitoring rest progress
	private startMonitoring(): void {
		if (!this.activeSession) return;

		const checkInterval = 2000; // Check every 2 seconds
		let elapsed = 0;

		const monitor = async () => {
			if (!this.activeSession || this.activeSession.status !== 'active') {
				return;
			}

			elapsed = Date.now() - this.activeSession.startTime;
			const progress = Math.min(elapsed / (this.activeSession.targetRestDuration * 1000), 1);

			// Update progress
			this.eventHandlers.onRestProgress?.(this.activeSession, progress);

			// Check for early completion conditions
			if (await this.shouldCompleteEarly()) {
				await this.completeRest();
				return;
			}

			// Check for extension conditions
			if (await this.shouldExtendRest()) {
				this.extendRest();
			}

			// Continue monitoring if not complete
			if (elapsed < this.activeSession.targetRestDuration * 1000) {
				this.restTimer = setTimeout(monitor, checkInterval);
			} else {
				await this.completeRest();
			}
		};

		// Start monitoring
		this.restTimer = setTimeout(monitor, checkInterval);
	}

	// Check if rest should complete early
	private async shouldCompleteEarly(): Promise<boolean> {
		if (!this.activeSession || !this.config.strainBasedNudging) return false;

		try {
			const currentStrain = await this.strainMonitor?.() || 0;
			const startStrain = this.activeSession.strainStart || 0;

			if (startStrain > 0) {
				const strainRatio = currentStrain / startStrain;
				return strainRatio <= this.config.strainRecoveryThreshold;
			}
		} catch (error) {
			console.warn('Failed to check strain for early completion:', error);
		}

		return false;
	}

	// Check if rest should be extended
	private async shouldExtendRest(): Promise<boolean> {
		if (!this.activeSession || !this.config.hrBasedRest) return false;

		try {
			const currentHR = await this.hrMonitor?.() || 0;
			const startHR = this.activeSession.heartRateStart || 0;

			if (startHR > 0) {
				const hrRecovery = (startHR - currentHR) / startHR;
				return hrRecovery < this.config.autoAdjustThreshold;
			}
		} catch (error) {
			console.warn('Failed to check HR for extension:', error);
		}

		return false;
	}

	// Extend rest period
	private extendRest(): void {
		if (!this.activeSession) return;

		const extension = 30; // 30 seconds
		this.activeSession.targetRestDuration += extension;

		// Trigger TTS notification
		if (this.config.ttsIntegration) {
			this.triggerExtensionNarration(extension);
		}
	}

	// Complete rest session
	async completeRest(): Promise<RestSession | null> {
		if (!this.activeSession) return null;

		// Clear timer
		if (this.restTimer) {
			clearTimeout(this.restTimer);
			this.restTimer = null;
		}

		const endTime = Date.now();
		const actualDuration = Math.round((endTime - this.activeSession.startTime) / 1000);

		// Get final readings
		try {
			if (this.config.hrBasedRest && this.hrMonitor) {
				this.activeSession.heartRateEnd = await this.hrMonitor();
			}
			if (this.config.strainBasedNudging && this.strainMonitor) {
				this.activeSession.strainEnd = await this.strainMonitor();
			}
		} catch (error) {
			console.warn('Failed to get final readings:', error);
		}

		// Update session
		this.activeSession.endTime = endTime;
		this.activeSession.actualRestDuration = actualDuration;
		this.activeSession.status = 'completed';

	// Record outcome for learning (simplified)
		if (this.activeSession.recommendation) {
			try {
				// Simplified outcome recording - could be enhanced later
				console.log('Rest outcome recorded:', {
					actualDuration,
					targetDuration: this.activeSession.recommendation.duration,
					heartRateStart: this.activeSession.heartRateStart,
					heartRateEnd: this.activeSession.heartRateEnd
				});
			} catch (error) {
				console.warn('Failed to record rest outcome:', error);
			}
		}

		// Trigger completion event
		this.eventHandlers.onRestComplete?.(this.activeSession);

		// Trigger completion narration
		if (this.config.ttsIntegration) {
			this.triggerCompletionNarration();
		}

		const completedSession = { ...this.activeSession };
		this.activeSession = null;

		return completedSession;
	}

	// Cancel rest session
	async cancelRest(): Promise<RestSession | null> {
		if (!this.activeSession) return null;

		// Clear timer
		if (this.restTimer) {
			clearTimeout(this.restTimer);
			this.restTimer = null;
		}

		this.activeSession.status = 'cancelled';
		this.activeSession.endTime = Date.now();
		this.activeSession.actualRestDuration = Math.round(
			(this.activeSession.endTime - this.activeSession.startTime) / 1000
		);

		// Trigger cancel event
		this.eventHandlers.onRestCancel?.(this.activeSession);

		const cancelledSession = { ...this.activeSession };
		this.activeSession = null;

		return cancelledSession;
	}

	// Get current rest session
	getCurrentSession(): RestSession | null {
		return this.activeSession ? { ...this.activeSession } : null;
	}

	// Get rest status
	getRestStatus(): {
		isActive: boolean;
		progress: number;
		timeRemaining: number;
		recommendation?: RestRecommendation;
	} {
		if (!this.activeSession) {
			return {
				isActive: false,
				progress: 0,
				timeRemaining: 0
			};
		}

		const elapsed = Date.now() - this.activeSession.startTime;
		const progress = Math.min(elapsed / (this.activeSession.targetRestDuration * 1000), 1);
		const timeRemaining = Math.max(0, this.activeSession.targetRestDuration - Math.round(elapsed / 1000));

		return {
			isActive: true,
			progress,
			timeRemaining,
			recommendation: this.activeSession.recommendation
		};
	}

	// TTS Integration Methods
	private async triggerRestNarration(recommendation: RestRecommendation, setNumber: number): Promise<void> {
		try {
			const text = `Rest for ${Math.floor(recommendation.duration / 60)} minutes and ${recommendation.duration % 60} seconds. Set ${setNumber} coming up. ${recommendation.reason}`;
			const segment = await ttsEngine.generateNarration(text, {}, 'alice', 'rest', 'medium');
			narrationQueueManager.addToQueue(segment);
			this.eventHandlers.onNarrationTrigger?.(segment);
		} catch (error) {
			console.warn('Failed to trigger rest narration:', error);
		}
	}

	private async triggerExtensionNarration(extension: number): Promise<void> {
		try {
			const text = `Extending rest by ${extension} seconds due to insufficient recovery.`;
			const segment = await ttsEngine.generateNarration(text, {}, 'alice', 'rest', 'high');
			narrationQueueManager.addToQueue(segment);
			this.eventHandlers.onNarrationTrigger?.(segment);
		} catch (error) {
			console.warn('Failed to trigger extension narration:', error);
		}
	}

	private async triggerCompletionNarration(): Promise<void> {
		try {
			const text = "Rest complete! Let's get back to it.";
			const segment = await ttsEngine.generateNarration(text, {}, 'alice', 'transition', 'high');
			narrationQueueManager.addToQueue(segment);
			this.eventHandlers.onNarrationTrigger?.(segment);
		} catch (error) {
			console.warn('Failed to trigger completion narration:', error);
		}
	}

	// Helper methods for rest duration calculation
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

	private adjustDurationByEffort(baseDuration: number, perceivedEffort: number): number {
		let adjustment = 1.0;

		if (perceivedEffort >= 8) {
			adjustment = 1.3; // Increase for high effort
		} else if (perceivedEffort <= 4) {
			adjustment = 0.8; // Decrease for low effort
		}

		return Math.round(baseDuration * adjustment);
	}

	// Helper method to create RestContext from session
	private createRestContextFromSession(session: RestSession): RestContext {
		return {
			userId: 'current-user' as Id<'users'>,
			workoutId: 'current-workout' as Id<'workouts'>,
			exerciseId: session.exerciseId,
			currentSet: session.setNumber,
			totalSets: 3, // Default, could be made configurable
			previousHeartRate: session.heartRateStart || 70,
			currentHeartRate: session.heartRateEnd || session.heartRateStart || 70,
			perceivedEffort: 7, // Default, could be made configurable
			restStartTime: session.startTime,
			lastSetEndTime: session.startTime,
			exerciseIntensity: 'moderate', // Default, could be made configurable
			userFitnessLevel: 'intermediate' // Default, could be made configurable
		};
	}

	// Cleanup
	destroy(): void {
		if (this.restTimer) {
			clearTimeout(this.restTimer);
			this.restTimer = null;
		}
		this.activeSession = null;
	}
}

// Singleton instance
export const restManager = new RestManager();

// Helper functions
export function startRestSession(
	exerciseId: string,
	setNumber: number,
	context?: Partial<RestContext>
): Promise<RestSession> {
	return restManager.startRest(exerciseId, setNumber, context);
}

export function completeRestSession(): Promise<RestSession | null> {
	return restManager.completeRest();
}

export function cancelRestSession(): Promise<RestSession | null> {
	return restManager.cancelRest();
}

export function getRestStatus() {
	return restManager.getRestStatus();
}

export function configureRestManager(config: Partial<RestManagerConfig>): void {
	restManager.updateConfig(config);
}

export function setRestEventHandlers(handlers: RestEventHandlers): void {
	restManager.setEventHandlers(handlers);
}

export function setRestMonitors(
	strainMonitor?: () => Promise<number>,
	hrMonitor?: () => Promise<number>
): void {
	if (strainMonitor) restManager.setStrainMonitor(strainMonitor);
	if (hrMonitor) restManager.setHRMonitor(hrMonitor);
}