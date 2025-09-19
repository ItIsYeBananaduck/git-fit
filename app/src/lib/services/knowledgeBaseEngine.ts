import type { Id } from '$lib/convex/_generated/dataModel.js';

// Knowledge base interfaces
export interface WorkoutInsight {
	id: string;
	userId: Id<'users'>;
	workoutId: Id<'workouts'>;
	exerciseId: string;
	insightType: 'performance' | 'pattern' | 'improvement' | 'risk' | 'opportunity';
	title: string;
	description: string;
	confidence: number; // 0-1 scale
	impact: 'low' | 'medium' | 'high';
	recommendations: string[];
	data: Record<string, unknown>;
	timestamp: number;
	expiresAt?: number; // For time-sensitive insights
}

export interface WorkoutSet {
	reps: number;
	weight: number;
	heartRate: number;
	restTime: number;
}

export interface WorkoutExercise {
	exerciseId: string;
	sets: WorkoutSet[];
}

export interface WorkoutAnalysisData {
	workoutId: Id<'workouts'>;
	exercises: WorkoutExercise[];
	duration: number;
	averageHeartRate: number;
}

export interface UserProfile {
	userId: Id<'users'>;
	fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
	strengthProfile: Record<string, {
		oneRepMax: number;
		weaknesses: string[];
		improvementRate: number;
	}>;
	workoutPatterns: {
		preferredTimes: string[];
		consistency: number;
		averageDuration: number;
		commonExercises: string[];
	};
	performanceTrends: {
		strength: number; // percentage change over time
		endurance: number;
		consistency: number;
	};
	goals: {
		primary: string;
		secondary: string[];
		timeframe: string;
	};
}

export interface CoachingRecommendation {
	id: string;
	userId: Id<'users'>;
	type: 'exercise' | 'program' | 'technique' | 'recovery' | 'nutrition';
	title: string;
	description: string;
	rationale: string;
	expectedOutcome: string;
	difficulty: 'easy' | 'medium' | 'hard';
	timeCommitment: number; // in minutes
	prerequisites: string[];
	alternatives: string[];
	confidence: number;
	generatedAt: number;
}

// Knowledge Base Engine
export class KnowledgeBaseEngine {
	private insights: Map<string, WorkoutInsight[]> = new Map();
	private userProfiles: Map<string, UserProfile> = new Map();
	private recommendations: Map<string, CoachingRecommendation[]> = new Map();
	private learningData: Map<string, Record<string, unknown>> = new Map();

	// Store workout insight
	storeInsight(insight: WorkoutInsight): void {
		const userKey = insight.userId as string;
		if (!this.insights.has(userKey)) {
			this.insights.set(userKey, []);
		}

		const userInsights = this.insights.get(userKey)!;
		userInsights.push(insight);

		// Keep only recent insights (last 100 per user)
		if (userInsights.length > 100) {
			userInsights.sort((a, b) => b.timestamp - a.timestamp);
			this.insights.set(userKey, userInsights.slice(0, 100));
		}

		// Update user profile based on new insight
		this.updateUserProfile(userKey, insight);
	}

	// Retrieve insights for user
	getInsights(
		userId: Id<'users'>,
		filters?: {
			type?: WorkoutInsight['insightType'];
			exerciseId?: string;
			minConfidence?: number;
			limit?: number;
		}
	): WorkoutInsight[] {
		const userKey = userId as string;
		const userInsights = this.insights.get(userKey) || [];

		let filtered = userInsights;

		if (filters) {
			if (filters.type) {
				filtered = filtered.filter(i => i.insightType === filters.type);
			}
			if (filters.exerciseId) {
				filtered = filtered.filter(i => i.exerciseId === filters.exerciseId);
			}
			if (filters.minConfidence !== undefined) {
				filtered = filtered.filter(i => i.confidence >= (filters.minConfidence ?? 0));
			}
		}

		// Sort by confidence and recency
		filtered.sort((a, b) => {
			const confidenceDiff = b.confidence - a.confidence;
			if (confidenceDiff !== 0) return confidenceDiff;
			return b.timestamp - a.timestamp;
		});

		return filters?.limit ? filtered.slice(0, filters.limit) : filtered;
	}

	// Generate insights from workout data
	generateInsights(
		userId: Id<'users'>,
		workoutData: {
			workoutId: Id<'workouts'>;
			exercises: Array<{
				exerciseId: string;
				sets: Array<{
					reps: number;
					weight: number;
					heartRate: number;
					restTime: number;
				}>;
			}>;
			duration: number;
			averageHeartRate: number;
		}
	): WorkoutInsight[] {
		const insights: WorkoutInsight[] = [];
		const userKey = userId as string;

		// Performance insights
		const performanceInsights = this.analyzePerformance(workoutData);
		insights.push(...performanceInsights.map(insight => ({
			...insight,
			id: `perf_${Date.now()}_${Math.random()}`,
			userId,
			workoutId: workoutData.workoutId,
			timestamp: Date.now()
		})));

		// Pattern insights
		const patternInsights = this.analyzePatterns(userKey, workoutData);
		insights.push(...patternInsights.map(insight => ({
			...insight,
			id: `pattern_${Date.now()}_${Math.random()}`,
			userId,
			workoutId: workoutData.workoutId,
			timestamp: Date.now()
		})));

		// Improvement insights
		const improvementInsights = this.analyzeImprovements(userKey, workoutData);
		insights.push(...improvementInsights.map(insight => ({
			...insight,
			id: `improve_${Date.now()}_${Math.random()}`,
			userId,
			workoutId: workoutData.workoutId,
			timestamp: Date.now()
		})));

		// Risk insights
		const riskInsights = this.analyzeRisks(workoutData);
		insights.push(...riskInsights.map(insight => ({
			...insight,
			id: `risk_${Date.now()}_${Math.random()}`,
			userId,
			workoutId: workoutData.workoutId,
			timestamp: Date.now()
		})));

		return insights;
	}

	// Analyze performance patterns
	private analyzePerformance(workoutData: WorkoutAnalysisData): Omit<WorkoutInsight, 'id' | 'userId' | 'workoutId' | 'timestamp'>[] {
		const insights: Omit<WorkoutInsight, 'id' | 'userId' | 'workoutId' | 'timestamp'>[] = [];

		workoutData.exercises.forEach((exercise: WorkoutExercise) => {
			const avgWeight = exercise.sets.reduce((sum: number, set: WorkoutSet) => sum + set.weight, 0) / exercise.sets.length;
			const totalVolume = exercise.sets.reduce((sum: number, set: WorkoutSet) => sum + (set.weight * set.reps), 0);
			const avgHeartRate = exercise.sets.reduce((sum: number, set: WorkoutSet) => sum + set.heartRate, 0) / exercise.sets.length;

			// Volume analysis
			if (totalVolume > 10000) { // High volume workout
				insights.push({
					exerciseId: exercise.exerciseId,
					insightType: 'performance',
					title: 'High Volume Session',
					description: `Completed ${totalVolume} lbs total volume in ${exercise.exerciseId}`,
					confidence: 0.9,
					impact: 'high',
					recommendations: [
						'Consider increasing protein intake for recovery',
						'Schedule adequate rest before next similar session',
						'Monitor for signs of overtraining'
					],
					data: { totalVolume, avgWeight, exerciseCount: exercise.sets.length }
				});
			}

			// Heart rate analysis
			if (avgHeartRate > 160) {
				insights.push({
					exerciseId: exercise.exerciseId,
					insightType: 'performance',
					title: 'High Intensity Exercise',
					description: `Average heart rate of ${Math.round(avgHeartRate)} bpm indicates high intensity effort`,
					confidence: 0.8,
					impact: 'medium',
					recommendations: [
						'Ensure adequate warm-up and cool-down',
						'Consider longer rest periods between sets',
						'Monitor recovery closely'
					],
					data: { avgHeartRate, exerciseId: exercise.exerciseId }
				});
			}
		});

		return insights;
	}

	// Analyze workout patterns
	private analyzePatterns(userKey: string, workoutData: WorkoutAnalysisData): Omit<WorkoutInsight, 'id' | 'userId' | 'workoutId' | 'timestamp'>[] {
		const insights: Omit<WorkoutInsight, 'id' | 'userId' | 'workoutId' | 'timestamp'>[] = [];
		const userInsights = this.insights.get(userKey) || [];

		// Analyze exercise frequency
		const exerciseFrequency: Record<string, number> = {};
		userInsights.forEach(insight => {
			exerciseFrequency[insight.exerciseId] = (exerciseFrequency[insight.exerciseId] || 0) + 1;
		});

		// Find most and least frequent exercises
		const sortedExercises = Object.entries(exerciseFrequency)
			.sort(([, a], [, b]) => b - a);

		if (sortedExercises.length > 0) {
			const [mostFrequent, freq] = sortedExercises[0];
			if (freq > 5) {
				insights.push({
					exerciseId: mostFrequent,
					insightType: 'pattern',
					title: 'Frequently Trained Exercise',
					description: `You've trained ${mostFrequent} ${freq} times recently`,
					confidence: 0.7,
					impact: 'medium',
					recommendations: [
						'Consider varying your training stimulus',
						'Ensure balanced muscle group development',
						'Monitor for overuse injuries'
					],
					data: { frequency: freq, exercise: mostFrequent }
				});
			}
		}

		// Analyze workout duration patterns
		const recentDurations = userInsights
			.filter(i => i.data?.duration && typeof i.data.duration === 'number')
			.slice(-10)
			.map(i => i.data.duration as number);

		if (recentDurations.length >= 5) {
			const avgDuration = recentDurations.reduce((a: number, b: number) => a + b, 0) / recentDurations.length;
			const currentDuration = workoutData.duration;

			if (currentDuration > avgDuration * 1.5) {
				insights.push({
					exerciseId: workoutData.exercises[0]?.exerciseId || 'general',
					insightType: 'pattern',
					title: 'Extended Workout Session',
					description: `This workout was ${Math.round((currentDuration / avgDuration - 1) * 100)}% longer than your recent average`,
					confidence: 0.8,
					impact: 'medium',
					recommendations: [
						'Ensure adequate nutrition for longer sessions',
						'Consider splitting intense workouts',
						'Monitor fatigue levels closely'
					],
					data: { currentDuration, avgDuration }
				});
			}
		}

		return insights;
	}

	// Analyze improvement trends
	private analyzeImprovements(userKey: string, workoutData: WorkoutAnalysisData): Omit<WorkoutInsight, 'id' | 'userId' | 'workoutId' | 'timestamp'>[] {
		const insights: Omit<WorkoutInsight, 'id' | 'userId' | 'workoutId' | 'timestamp'>[] = [];
		const userInsights = this.insights.get(userKey) || [];

		workoutData.exercises.forEach((exercise: WorkoutExercise) => {
			const exerciseInsights = userInsights.filter(i => i.exerciseId === exercise.exerciseId);
			const recentPerformance = exerciseInsights
				.filter(i => i.insightType === 'performance')
				.slice(-5);

			if (recentPerformance.length >= 3) {
				const weights = recentPerformance
					.map((i) => {
						const avgWeight = i.data?.avgWeight;
						return typeof avgWeight === 'number' ? avgWeight : 0;
					})
					.filter(w => w > 0);

				if (weights.length >= 2) {
					const trend = this.calculateTrend(weights);
					const improvementRate = (trend / weights[0]) * 100;

					if (improvementRate > 5) {
						insights.push({
							exerciseId: exercise.exerciseId,
							insightType: 'improvement',
							title: 'Strength Improvement',
							description: `${Math.round(improvementRate)}% improvement in ${exercise.exerciseId} over recent sessions`,
							confidence: 0.85,
							impact: 'high',
							recommendations: [
								'Continue current training approach',
								'Consider progressive overload',
								'Track nutrition and recovery'
							],
							data: { improvementRate, trend, exercise: exercise.exerciseId }
						});
					}
				}
			}
		});

		return insights;
	}

	// Analyze potential risks
	private analyzeRisks(workoutData: WorkoutAnalysisData): Omit<WorkoutInsight, 'id' | 'userId' | 'workoutId' | 'timestamp'>[] {
		const insights: Omit<WorkoutInsight, 'id' | 'userId' | 'workoutId' | 'timestamp'>[] = [];

		// Check for overtraining indicators
		const highIntensitySets = workoutData.exercises.flatMap((ex: WorkoutExercise) =>
			ex.sets.filter((set: WorkoutSet) => set.heartRate > 170)
		);

		if (highIntensitySets.length > 5) {
			insights.push({
				exerciseId: 'general',
				insightType: 'risk',
				title: 'High Intensity Warning',
				description: `${highIntensitySets.length} sets completed at very high heart rate`,
				confidence: 0.9,
				impact: 'high',
				recommendations: [
					'Reduce training intensity for next session',
					'Prioritize recovery and sleep',
					'Consider deload week if fatigue persists'
				],
				data: { highIntensitySets: highIntensitySets.length }
			});
		}

		// Check for inadequate rest
		const shortRestSets = workoutData.exercises.flatMap((ex: WorkoutExercise) =>
			ex.sets.filter((set: WorkoutSet) => set.restTime < 60)
		);

		if (shortRestSets.length > workoutData.exercises.length * 2) {
			insights.push({
				exerciseId: 'general',
				insightType: 'risk',
				title: 'Inadequate Recovery',
				description: 'Multiple sets completed with insufficient rest time',
				confidence: 0.8,
				impact: 'medium',
				recommendations: [
					'Increase rest periods between sets',
					'Focus on quality over quantity',
					'Monitor for performance decline'
				],
				data: { shortRestSets: shortRestSets.length }
			});
		}

		return insights;
	}

	// Calculate linear trend
	private calculateTrend(values: number[]): number {
		if (values.length < 2) return 0;

		const n = values.length;
		const indices = Array.from({ length: n }, (_, i) => i);

		const sumX = indices.reduce((a, b) => a + b, 0);
		const sumY = values.reduce((a, b) => a + b, 0);
		const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
		const sumXX = indices.reduce((sum, x) => sum + x * x, 0);

		const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
		return slope;
	}

	// Update user profile based on insights
	private updateUserProfile(userKey: string, insight: WorkoutInsight): void {
		if (!this.userProfiles.has(userKey)) {
			this.userProfiles.set(userKey, {
				userId: insight.userId,
				fitnessLevel: 'intermediate',
				strengthProfile: {},
				workoutPatterns: {
					preferredTimes: [],
					consistency: 0,
					averageDuration: 0,
					commonExercises: []
				},
				performanceTrends: {
					strength: 0,
					endurance: 0,
					consistency: 0
				},
				goals: {
					primary: '',
					secondary: [],
					timeframe: ''
				}
			});
		}

		const profile = this.userProfiles.get(userKey)!;

		// Update strength profile
		if (typeof insight.data?.avgWeight === 'number') {
			profile.strengthProfile[insight.exerciseId] = {
				oneRepMax: insight.data.avgWeight * 1.2, // Rough estimate
				weaknesses: [],
				improvementRate: typeof insight.data?.improvementRate === 'number' ? insight.data.improvementRate : 0
			};
		}

		// Update workout patterns
		if (typeof insight.data?.duration === 'number') {
			const recentInsights = this.insights.get(userKey) || [];
			const durations = recentInsights
				.filter(i => typeof i.data?.duration === 'number')
				.slice(-10)
				.map(i => i.data.duration as number);

			if (durations.length > 0) {
				profile.workoutPatterns.averageDuration = durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
			}
		}
	}

	// Generate personalized recommendations
	generateRecommendations(userId: Id<'users'>): CoachingRecommendation[] {
		const userKey = userId as string;
		const insights = this.getInsights(userId, { minConfidence: 0.7 });
		const recommendations: CoachingRecommendation[] = [];

		// Generate recommendations based on insights
		insights.forEach(insight => {
			switch (insight.insightType) {
				case 'improvement':
					recommendations.push({
						id: `rec_${Date.now()}_${Math.random()}`,
						userId,
						type: 'exercise',
						title: 'Progressive Overload Opportunity',
						description: `Based on your improvement in ${insight.exerciseId}, consider increasing weight or reps`,
						rationale: insight.description,
						expectedOutcome: 'Continued strength gains and muscle development',
						difficulty: 'medium',
						timeCommitment: 5,
						prerequisites: ['Consistent training history'],
						alternatives: ['Maintain current intensity', 'Focus on form improvement'],
						confidence: insight.confidence,
						generatedAt: Date.now()
					});
					break;

				case 'risk':
					recommendations.push({
						id: `rec_${Date.now()}_${Math.random()}`,
						userId,
						type: 'recovery',
						title: 'Recovery Focus Needed',
						description: 'Your recent sessions indicate potential overtraining risk',
						rationale: insight.description,
						expectedOutcome: 'Improved recovery and sustained performance',
						difficulty: 'easy',
						timeCommitment: 15,
						prerequisites: [],
						alternatives: ['Active recovery', 'Light training', 'Complete rest'],
						confidence: insight.confidence,
						generatedAt: Date.now()
					});
					break;
			}
		});

		// Store recommendations
		this.recommendations.set(userKey, recommendations);

		return recommendations;
	}

	// Get user profile
	getUserProfile(userId: Id<'users'>): UserProfile | null {
		return this.userProfiles.get(userId as string) || null;
	}

	// Get knowledge base statistics
	getStatistics(): {
		totalUsers: number;
		totalInsights: number;
		averageInsightsPerUser: number;
		insightTypeDistribution: Record<string, number>;
		averageConfidence: number;
	} {
		const allInsights = Array.from(this.insights.values()).flat();
		const insightTypes: Record<string, number> = {};

		allInsights.forEach(insight => {
			insightTypes[insight.insightType] = (insightTypes[insight.insightType] || 0) + 1;
		});

		return {
			totalUsers: this.insights.size,
			totalInsights: allInsights.length,
			averageInsightsPerUser: allInsights.length / Math.max(1, this.insights.size),
			insightTypeDistribution: insightTypes,
			averageConfidence: allInsights.length > 0 ?
				allInsights.reduce((sum, i) => sum + i.confidence, 0) / allInsights.length : 0
		};
	}

	// Clear old insights (cleanup)
	clearExpiredInsights(): void {
		const now = Date.now();
		this.insights.forEach((userInsights, userKey) => {
			const validInsights = userInsights.filter(insight =>
				!insight.expiresAt || insight.expiresAt > now
			);
			this.insights.set(userKey, validInsights);
		});
	}
}

// Singleton instance
export const knowledgeBaseEngine = new KnowledgeBaseEngine();

// Helper functions
export function storeWorkoutInsight(insight: WorkoutInsight): void {
	knowledgeBaseEngine.storeInsight(insight);
}

export function getUserInsights(
	userId: Id<'users'>,
	filters?: Parameters<typeof knowledgeBaseEngine.getInsights>[1]
): WorkoutInsight[] {
	return knowledgeBaseEngine.getInsights(userId, filters);
}

export function generateWorkoutInsights(
	userId: Id<'users'>,
	workoutData: Parameters<typeof knowledgeBaseEngine.generateInsights>[1]
): WorkoutInsight[] {
	return knowledgeBaseEngine.generateInsights(userId, workoutData);
}

export function getPersonalizedRecommendations(userId: Id<'users'>): CoachingRecommendation[] {
	return knowledgeBaseEngine.generateRecommendations(userId);
}

export function getKnowledgeBaseStats() {
	return knowledgeBaseEngine.getStatistics();
}

// Pre-defined insight templates
export const INSIGHT_TEMPLATES = {
	performance: {
		personal_record: {
			title: 'New Personal Record!',
			description: 'You achieved a new personal record in {exercise}',
			recommendations: [
				'Celebrate this achievement!',
				'Consider progressive overload for continued gains',
				'Log this milestone in your training journal'
			]
		},
		high_intensity: {
			title: 'High Intensity Session',
			description: 'Your heart rate indicates a very intense workout',
			recommendations: [
				'Prioritize recovery for the next 48 hours',
				'Ensure adequate protein and micronutrient intake',
				'Consider lighter training or active recovery'
			]
		}
	},
	risk: {
		overtraining: {
			title: 'Overtraining Risk Detected',
			description: 'Your recent sessions show signs of potential overtraining',
			recommendations: [
				'Take a deload week with reduced volume',
				'Focus on sleep and stress management',
				'Consider consulting a coach or trainer'
			]
		},
		form_breakdown: {
			title: 'Form Quality Declining',
			description: 'Recent sets show reduced form quality',
			recommendations: [
				'Reduce weight and focus on perfect form',
				'Consider filming your lifts for analysis',
				'Work with a trainer on technique'
			]
		}
	},
	opportunity: {
		plateau_breakthrough: {
			title: 'Plateau Breakthrough Opportunity',
			description: 'You may be ready to break through your current plateau',
			recommendations: [
				'Try a new training stimulus or variation',
				'Consider a deload followed by increased intensity',
				'Review your nutrition and recovery strategies'
			]
		}
	}
} as const;