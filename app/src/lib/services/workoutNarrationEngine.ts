import type { Id } from '$lib/convex/_generated/dataModel.js';
import { aiCoachingService } from './aiCoaching.js';

// Narration context interfaces
export interface WorkoutNarrationContext {
	userId: Id<'users'>;
	workoutId: Id<'workouts'>;
	exerciseId: string;
	exerciseName: string;
	setNumber: number;
	totalSets: number;
	repCount: number;
	targetReps: number;
	weight: number;
	heartRate: number;
	timeElapsed: number;
	workoutProgress: number; // 0-1 scale
	perceivedEffort: number;
	formQuality?: 'excellent' | 'good' | 'fair' | 'poor';
	previousPerformance?: {
		bestWeight: number;
		bestReps: number;
		personalRecord: boolean;
	};
}

export interface NarrationSegment {
	id: string;
	type: 'motivational' | 'instructional' | 'corrective' | 'celebratory' | 'encouragement' | 'rest_guidance';
	message: string;
	timing: 'pre_set' | 'during_set' | 'post_set' | 'rest_period' | 'workout_complete';
	priority: 'low' | 'medium' | 'high' | 'urgent';
	duration: number; // in seconds
	coachPersonality: 'alice' | 'aiden';
	context: WorkoutNarrationContext;
}

// Workout Narration Engine
export class WorkoutNarrationEngine {
	private narrationHistory: NarrationSegment[] = [];
	private currentWorkoutContext: WorkoutNarrationContext | null = null;
	private narrationQueue: NarrationSegment[] = [];
	private isNarrating = false;

	// Generate narration for current workout context
	generateNarration(context: WorkoutNarrationContext): NarrationSegment[] {
		this.currentWorkoutContext = context;
		const coach = aiCoachingService.getPersonality();
		const coachType = coach?.id || 'alice';

		const narrations: NarrationSegment[] = [];

		// Generate different types of narration based on context
		const motivationalNarration = this.generateMotivationalNarration(context, coachType);
		const instructionalNarration = this.generateInstructionalNarration(context, coachType);
		const performanceNarration = this.generatePerformanceNarration(context, coachType);
		const restNarration = this.generateRestNarration(context, coachType);

		// Add narrations to queue with appropriate timing
		if (motivationalNarration) narrations.push(motivationalNarration);
		if (instructionalNarration) narrations.push(instructionalNarration);
		if (performanceNarration) narrations.push(performanceNarration);
		if (restNarration) narrations.push(restNarration);

		// Sort by priority and timing
		return this.prioritizeNarrations(narrations);
	}

	// Generate motivational narration
	private generateMotivationalNarration(
		context: WorkoutNarrationContext,
		coachType: 'alice' | 'aiden'
	): NarrationSegment | null {
		const { setNumber, totalSets, workoutProgress, perceivedEffort } = context;

		// Log context for debugging
		console.log(`Generating motivation for set ${setNumber}/${totalSets}, progress: ${Math.round(workoutProgress * 100)}%`);

		// Alice's encouraging style
		if (coachType === 'alice') {
			const aliceMessages = {
				early: [
					"You're off to a fantastic start! Let's build that momentum.",
					"I believe in you! Every rep brings you closer to your goals.",
					"You're stronger than you think. Let's show what you're made of!"
				],
				mid: [
					"Look at you crushing this workout! You're doing amazing!",
					"Your dedication inspires me. Keep that fire burning!",
					"Halfway there and you're still going strong. I'm so proud!"
				],
				late: [
					"You're almost there! Give it everything you've got!",
					"This is where champions are made. You've got this!",
					"Finish strong! You're capable of more than you know!"
				]
			};

			let messagePool: string[];
			if (workoutProgress < 0.3) messagePool = aliceMessages.early;
			else if (workoutProgress < 0.7) messagePool = aliceMessages.mid;
			else messagePool = aliceMessages.late;

			const message = messagePool[Math.floor(Math.random() * messagePool.length)];

			return {
				id: `motivation_${Date.now()}`,
				type: 'motivational',
				message,
				timing: 'pre_set',
				priority: perceivedEffort > 7 ? 'high' : 'medium',
				duration: 8,
				coachPersonality: 'alice',
				context
			};
		}

		// Aiden's structured style
		if (coachType === 'aiden') {
			const aidenMessages = {
				early: [
					"Structure your mind. Focus on each rep with precision.",
					"Consistency builds champions. Maintain that focus.",
					"Every set is a step toward mastery. Execute with purpose."
				],
				mid: [
					"Your form is holding strong. Keep that discipline.",
					"Progress demands consistency. You're building something special.",
					"Stay focused on the fundamentals. That's how winners are made."
				],
				late: [
					"This is where mental toughness matters. Push through.",
					"Champions finish what they start. Complete this set with honor.",
					"End strong. Your future self will thank you for this effort."
				]
			};

			let messagePool: string[];
			if (workoutProgress < 0.3) messagePool = aidenMessages.early;
			else if (workoutProgress < 0.7) messagePool = aidenMessages.mid;
			else messagePool = aidenMessages.late;

			const message = messagePool[Math.floor(Math.random() * messagePool.length)];

			return {
				id: `motivation_${Date.now()}`,
				type: 'motivational',
				message,
				timing: 'pre_set',
				priority: 'medium',
				duration: 6,
				coachPersonality: 'aiden',
				context
			};
		}

		return null;
	}

	// Generate instructional narration
	private generateInstructionalNarration(
		context: WorkoutNarrationContext,
		coachType: 'alice' | 'aiden'
	): NarrationSegment | null {
		const { exerciseName, setNumber, repCount, targetReps } = context;

		if (setNumber === 1 && repCount === 0) {
			// First set instructions
			if (coachType === 'alice') {
				return {
					id: `instruction_${Date.now()}`,
					type: 'instructional',
					message: `Let's start with ${exerciseName}. Remember to breathe steadily and maintain good form. You've got this!`,
					timing: 'pre_set',
					priority: 'high',
					duration: 10,
					coachPersonality: 'alice',
					context
				};
			} else {
				return {
					id: `instruction_${Date.now()}`,
					type: 'instructional',
					message: `Beginning ${exerciseName}. Focus on controlled movement and proper form. Quality over quantity.`,
					timing: 'pre_set',
					priority: 'high',
					duration: 8,
					coachPersonality: 'aiden',
					context
				};
			}
		}

		// Rep counting guidance
		if (repCount > 0 && repCount < targetReps) {
			const remainingReps = targetReps - repCount;

			if (coachType === 'alice') {
				return {
					id: `instruction_${Date.now()}`,
					type: 'instructional',
					message: `${remainingReps} more reps to go! Keep that form perfect.`,
					timing: 'during_set',
					priority: 'medium',
					duration: 4,
					coachPersonality: 'alice',
					context
				};
			} else {
				return {
					id: `instruction_${Date.now()}`,
					type: 'instructional',
					message: `${remainingReps} reps remaining. Maintain precision.`,
					timing: 'during_set',
					priority: 'medium',
					duration: 3,
					coachPersonality: 'aiden',
					context
				};
			}
		}

		return null;
	}

	// Generate performance-based narration
	private generatePerformanceNarration(
		context: WorkoutNarrationContext,
		coachType: 'alice' | 'aiden'
	): NarrationSegment | null {
		const { previousPerformance, weight, repCount, formQuality } = context;

		// Log performance context
		console.log(`Performance check: weight=${weight}, reps=${repCount}, form=${formQuality}`);

		// Personal record celebration
		if (previousPerformance?.personalRecord) {
			if (coachType === 'alice') {
				return {
					id: `celebration_${Date.now()}`,
					type: 'celebratory',
					message: `🎉 Personal record! You're absolutely crushing it! This is what champions are made of!`,
					timing: 'post_set',
					priority: 'high',
					duration: 8,
					coachPersonality: 'alice',
					context
				};
			} else {
				return {
					id: `celebration_${Date.now()}`,
					type: 'celebratory',
					message: `Personal record achieved. Your dedication to consistent improvement is paying off.`,
					timing: 'post_set',
					priority: 'high',
					duration: 6,
					coachPersonality: 'aiden',
					context
				};
			}
		}

		// Form correction
		if (formQuality === 'poor') {
			if (coachType === 'alice') {
				return {
					id: `correction_${Date.now()}`,
					type: 'corrective',
					message: `Let's focus on form. Slow down and concentrate on proper technique. Quality matters!`,
					timing: 'during_set',
					priority: 'urgent',
					duration: 6,
					coachPersonality: 'alice',
					context
				};
			} else {
				return {
					id: `correction_${Date.now()}`,
					type: 'corrective',
					message: `Form needs attention. Reset and focus on proper technique. Precision prevents injury.`,
					timing: 'during_set',
					priority: 'urgent',
					duration: 5,
					coachPersonality: 'aiden',
					context
				};
			}
		}

		// Performance improvement
		if (previousPerformance && weight > previousPerformance.bestWeight) {
			if (coachType === 'alice') {
				return {
					id: `improvement_${Date.now()}`,
					type: 'encouragement',
					message: `Look at that strength gain! You're getting stronger every day. I'm so proud! 💪`,
					timing: 'post_set',
					priority: 'medium',
					duration: 7,
					coachPersonality: 'alice',
					context
				};
			} else {
				return {
					id: `improvement_${Date.now()}`,
					type: 'encouragement',
					message: `Strength improvement noted. Consistent training yields results.`,
					timing: 'post_set',
					priority: 'medium',
					duration: 5,
					coachPersonality: 'aiden',
					context
				};
			}
		}

		return null;
	}

	// Generate rest period narration
	private generateRestNarration(
		context: WorkoutNarrationContext,
		coachType: 'alice' | 'aiden'
	): NarrationSegment | null {
		const { setNumber, totalSets, heartRate } = context;

		if (setNumber >= totalSets) return null; // No rest needed for last set

		// Log heart rate context for potential future use
		console.log(`Rest narration for set ${setNumber}/${totalSets}, HR: ${heartRate}`);

		if (coachType === 'alice') {
			const messages = [
				`Great set! Take a moment to breathe and recover. You've earned this rest.`,
				`Nice work! Use this rest to recharge. I'm right here with you.`,
				`Well done! Breathe deeply and prepare for the next set. You're doing amazing!`
			];

			return {
				id: `rest_${Date.now()}`,
				type: 'rest_guidance',
				message: messages[Math.floor(Math.random() * messages.length)],
				timing: 'rest_period',
				priority: 'medium',
				duration: 6,
				coachPersonality: 'alice',
				context
			};
		} else {
			const messages = [
				`Set complete. Use this rest period strategically to maximize recovery.`,
				`Good execution. Rest efficiently and prepare mentally for the next set.`,
				`Set finished. Focus on recovery breathing to optimize performance.`
			];

			return {
				id: `rest_${Date.now()}`,
				type: 'rest_guidance',
				message: messages[Math.floor(Math.random() * messages.length)],
				timing: 'rest_period',
				priority: 'medium',
				duration: 5,
				coachPersonality: 'aiden',
				context
			};
		}
	}

	// Prioritize narrations based on context and timing
	private prioritizeNarrations(narrations: NarrationSegment[]): NarrationSegment[] {
		return narrations.sort((a, b) => {
			// Urgent corrections first
			if (a.priority === 'urgent') return -1;
			if (b.priority === 'urgent') return 1;

			// Then by priority
			const priorityOrder = { high: 3, medium: 2, low: 1 };
			const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
			if (priorityDiff !== 0) return priorityDiff;

			// Then by timing preference
			const timingOrder = {
				'pre_set': 1,
				'during_set': 2,
				'post_set': 3,
				'rest_period': 4,
				'workout_complete': 5
			};

			return timingOrder[a.timing] - timingOrder[b.timing];
		});
	}

	// Get next narration from queue
	getNextNarration(): NarrationSegment | null {
		if (this.narrationQueue.length === 0) return null;

		const nextNarration = this.narrationQueue.shift();
		this.narrationHistory.push(nextNarration!);

		return nextNarration || null;
	}

	// Add narrations to queue
	queueNarrations(narrations: NarrationSegment[]): void {
		this.narrationQueue.push(...narrations);
		this.narrationQueue.sort((a, b) => {
			const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
			return priorityOrder[b.priority] - priorityOrder[a.priority];
		});
	}

	// Generate workout completion narration
	generateWorkoutCompletionNarration(
		context: WorkoutNarrationContext,
		coachType: 'alice' | 'aiden'
	): NarrationSegment {
		if (coachType === 'alice') {
			const messages = [
				`🎉 Workout complete! You did absolutely amazing today! I'm so proud of your dedication and effort. Rest and recover well!`,
				`💪 Fantastic workout! You gave it your all and it shows. You're getting stronger every single day. Well done!`,
				`🌟 You crushed this workout! Your consistency and determination are inspiring. Take time to celebrate this victory!`
			];

			return {
				id: `completion_${Date.now()}`,
				type: 'celebratory',
				message: messages[Math.floor(Math.random() * messages.length)],
				timing: 'workout_complete',
				priority: 'high',
				duration: 12,
				coachPersonality: 'alice',
				context
			};
		} else {
			const messages = [
				`Workout completed successfully. Your discipline and consistency are building a stronger foundation.`,
				`Session finished. Review your performance and identify areas for continued improvement.`,
				`Training complete. Your commitment to structured improvement will yield long-term results.`
			];

			return {
				id: `completion_${Date.now()}`,
				type: 'celebratory',
				message: messages[Math.floor(Math.random() * messages.length)],
				timing: 'workout_complete',
				priority: 'high',
				duration: 10,
				coachPersonality: 'aiden',
				context
			};
		}
	}

	// Get narration statistics
	getNarrationStatistics(): {
		totalNarrations: number;
		narrationTypes: Record<string, number>;
		averageDuration: number;
		coachDistribution: Record<string, number>;
	} {
		const stats = {
			totalNarrations: this.narrationHistory.length,
			narrationTypes: {} as Record<string, number>,
			averageDuration: 0,
			coachDistribution: {} as Record<string, number>
		};

		if (stats.totalNarrations === 0) return stats;

		let totalDuration = 0;

		this.narrationHistory.forEach(narration => {
			// Count types
			stats.narrationTypes[narration.type] = (stats.narrationTypes[narration.type] || 0) + 1;

			// Count coaches
			stats.coachDistribution[narration.coachPersonality] =
				(stats.coachDistribution[narration.coachPersonality] || 0) + 1;

			// Sum durations
			totalDuration += narration.duration;
		});

		stats.averageDuration = Math.round(totalDuration / stats.totalNarrations);

		return stats;
	}

	// Clear narration history (useful for new workout sessions)
	clearHistory(): void {
		this.narrationHistory = [];
		this.narrationQueue = [];
		this.currentWorkoutContext = null;
		this.isNarrating = false;
	}

	// Get current narration status
	getStatus(): {
		isActive: boolean;
		queueLength: number;
		currentContext: WorkoutNarrationContext | null;
		lastNarration: NarrationSegment | null;
	} {
		return {
			isActive: this.isNarrating,
			queueLength: this.narrationQueue.length,
			currentContext: this.currentWorkoutContext,
			lastNarration: this.narrationHistory[this.narrationHistory.length - 1] || null
		};
	}
}

// Singleton instance
export const workoutNarrationEngine = new WorkoutNarrationEngine();

// Helper functions
export function generateWorkoutNarration(context: WorkoutNarrationContext): NarrationSegment[] {
	return workoutNarrationEngine.generateNarration(context);
}

export function getNextWorkoutNarration(): NarrationSegment | null {
	return workoutNarrationEngine.getNextNarration();
}

export function queueWorkoutNarrations(narrations: NarrationSegment[]): void {
	workoutNarrationEngine.queueNarrations(narrations);
}

export function generateCompletionNarration(
	context: WorkoutNarrationContext,
	coachType: 'alice' | 'aiden'
): NarrationSegment {
	return workoutNarrationEngine.generateWorkoutCompletionNarration(context, coachType);
}

export function getNarrationStatistics() {
	return workoutNarrationEngine.getNarrationStatistics();
}

// Pre-defined narration templates for common scenarios
export const NARRATION_TEMPLATES = {
	alice: {
		warmup: [
			"Let's start with a good warm-up. Get that blood flowing!",
			"Warm-up time! Prepare your body and mind for the work ahead.",
			"Begin with some light movement. Let's wake up those muscles!"
		],
		form_reminder: [
			"Remember to keep that form perfect. Quality over quantity!",
			"Focus on your technique. Good form prevents injury and builds strength.",
			"Check your posture. You're doing great, but let's keep that form pristine."
		],
		encouragement: [
			"You're doing fantastic! Keep pushing through!",
			"I can see your determination. You're absolutely crushing this!",
			"Your effort is inspiring! You've got so much strength in you!"
		],
		recovery: [
			"Take a deep breath. You've earned this recovery time.",
			"Rest now. Breathe deeply and prepare for the next challenge.",
			"Good job on that set! Use this time to recharge completely."
		]
	},
	aiden: {
		warmup: [
			"Begin with a structured warm-up. Prepare systematically.",
			"Warm-up phase: Activate your muscles with controlled movement.",
			"Start deliberately. A proper warm-up prevents injury and optimizes performance."
		],
		form_reminder: [
			"Maintain precise form. Technique is the foundation of progress.",
			"Focus on execution. Perfect form yields perfect results.",
			"Quality control: Ensure every movement is deliberate and correct."
		],
		encouragement: [
			"Your consistency is building strength. Continue with focus.",
			"Discipline drives results. You're demonstrating excellent control.",
			"Structured effort produces structured gains. Stay committed."
		],
		recovery: [
			"Rest strategically. Use this time to maximize recovery efficiency.",
			"Recovery phase: Breathe deeply and prepare mentally for the next set.",
			"Rest period: Focus on complete recovery before continuing."
		]
	}
} as const;