import { Capacitor } from '@capacitor/core';

// Types for AI service warming
export interface AIWarmupConfig {
	model: string;
	endpoint: string;
	concurrency: number;
	warmupDuration: number; // in milliseconds
}

export interface WarmupStatus {
	isWarming: boolean;
	startTime: number;
	completedRequests: number;
	totalRequests: number;
	averageResponseTime: number;
}

export class AIServiceWarmer {
	private config: AIWarmupConfig;
	private isWarming = false;
	private warmupStartTime = 0;
	private completedRequests = 0;
	private totalRequests = 0;
	private responseTimes: number[] = [];
	private warmupTimeout: ReturnType<typeof setTimeout> | null = null;

	constructor(config: Partial<AIWarmupConfig> = {}) {
		this.config = {
			model: 'llama-3.1-8b',
			endpoint: '/api/ai/warmup',
			concurrency: 2,
			warmupDuration: 30000, // 30 seconds
			...config
		};
	}

	// Check if currently warming
	isCurrentlyWarming(): boolean {
		return this.isWarming;
	}

	// Start the warmup process
	async startWarming(): Promise<void> {
		if (this.isWarming) {
			console.log('AI warmer already running');
			return;
		}

		this.isWarming = true;
		this.warmupStartTime = Date.now();
		this.completedRequests = 0;
		this.totalRequests = 0;
		this.responseTimes = [];

		console.log('🔥 Starting AI service warmup for', this.config.warmupDuration / 1000, 'seconds');

		// Start concurrent warmup requests
		const warmupPromises: Promise<void>[] = [];

		for (let i = 0; i < this.config.concurrency; i++) {
			warmupPromises.push(this.runWarmupCycle());
		}

		// Set timeout to stop warming after configured duration
		this.warmupTimeout = setTimeout(() => {
			this.stopWarming();
		}, this.config.warmupDuration);

		try {
			await Promise.allSettled(warmupPromises);
		} catch (error) {
			console.error('AI warmup encountered errors:', error);
		} finally {
			this.stopWarming();
		}
	}

	// Stop the warmup process
	stopWarming(): void {
		if (!this.isWarming) return;

		this.isWarming = false;

		if (this.warmupTimeout) {
			clearTimeout(this.warmupTimeout);
			this.warmupTimeout = null;
		}

		const duration = Date.now() - this.warmupStartTime;
		const avgResponseTime = this.responseTimes.length > 0
			? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
			: 0;

		console.log('🛑 AI warmup completed:', {
			duration: `${duration}ms`,
			completedRequests: this.completedRequests,
			averageResponseTime: `${avgResponseTime.toFixed(2)}ms`,
			successRate: this.totalRequests > 0 ? (this.completedRequests / this.totalRequests * 100).toFixed(1) + '%' : '0%'
		});
	}

	// Run a single warmup cycle
	private async runWarmupCycle(): Promise<void> {
		const warmupPrompts = [
			"Analyze this workout: 3 sets of 10 squats at 135lbs. Heart rate: 145 bpm. What adjustments would you recommend?",
			"User is doing bench press. Current set: 8 reps at 185lbs. Heart rate: 160 bpm. Should they increase weight?",
			"Workout intensity analysis: strain level 7/10, SpO2 96%. Is this workout too intense?",
			"Rest period recommendation: after heavy deadlifts, heart rate 155 bpm. How long should they rest?",
			"Progressive overload suggestion: user completed 4 sets of 12 bicep curls at 35lbs. Ready for increase?"
		];

		while (this.isWarming) {
			try {
				const prompt = warmupPrompts[Math.floor(Math.random() * warmupPrompts.length)];
				const startTime = Date.now();

				await this.makeWarmupRequest(prompt);

				const responseTime = Date.now() - startTime;
				this.responseTimes.push(responseTime);
				this.completedRequests++;
				this.totalRequests++;

				// Small delay between requests to avoid overwhelming
				await new Promise(resolve => setTimeout(resolve, 500));

			} catch (error) {
				this.totalRequests++;
				console.warn('Warmup request failed:', error);

				// Longer delay on error
				await new Promise(resolve => setTimeout(resolve, 2000));
			}
		}
	}

	// Make a warmup request to the AI service
	private async makeWarmupRequest(prompt: string): Promise<void> {
		if (Capacitor.isNativePlatform()) {
			// On mobile, use local Llama model
			await this.warmupLocalModel(prompt);
		} else {
			// On web, use API endpoint
			await this.warmupAPIEndpoint(prompt);
		}
	}

	// Warmup local Llama model (mobile)
	private async warmupLocalModel(prompt: string): Promise<void> {
		// In production, this would interact with the local Llama 3.1 model
		// For now, simulate the warmup with a delay
		await new Promise(resolve => {
			setTimeout(() => {
				console.log('🔥 Warmed local Llama model with prompt:', prompt.substring(0, 50) + '...');
				resolve(void 0);
			}, 100 + Math.random() * 200); // 100-300ms simulated response
		});
	}

	// Warmup API endpoint (web)
	private async warmupAPIEndpoint(prompt: string): Promise<void> {
		try {
			const response = await fetch(this.config.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					prompt,
					model: this.config.model,
					maxTokens: 50, // Short responses for warmup
					temperature: 0.1, // Low creativity for consistent responses
					isWarmup: true
				})
			});

			if (!response.ok) {
				throw new Error(`Warmup request failed: ${response.status}`);
			}

			const result = await response.json();
			console.log('🔥 Warmed API endpoint, response length:', result.response?.length || 0);

		} catch {
			// If API is not available, fall back to mock warmup
			console.log('🔥 Mock warmup (API unavailable):', prompt.substring(0, 30) + '...');
			await new Promise(resolve => setTimeout(resolve, 50));
		}
	}

	// Get current warmup status
	getStatus(): WarmupStatus {
		const avgResponseTime = this.responseTimes.length > 0
			? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
			: 0;

		return {
			isWarming: this.isWarming,
			startTime: this.warmupStartTime,
			completedRequests: this.completedRequests,
			totalRequests: this.totalRequests,
			averageResponseTime: avgResponseTime
		};
	}

	// Configure warmup settings
	updateConfig(newConfig: Partial<AIWarmupConfig>): void {
		this.config = { ...this.config, ...newConfig };
		console.log('🔧 Updated AI warmer config:', this.config);
	}
}

// Global instance for app-wide AI warming
export const globalAIWarmer = new AIServiceWarmer({
	model: 'llama-3.1-8b',
	concurrency: 2,
	warmupDuration: 30000
});