import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Types
export interface RealTimeVitals {
	heartRate: number;
	spo2: number;
	timestamp: number;
	source: 'healthkit' | 'health-connect' | 'whoop' | 'fitbit' | 'mock';
}

export interface WearableConnection {
	connected: boolean;
	source: RealTimeVitals['source'];
	lastSync: number;
}

type VitalsCallback = (vitals: RealTimeVitals) => void;

export class RealTimeWearableService {
	private userId: string;
	private isMonitoring = false;
	private vitalsCallbacks: VitalsCallback[] = [];
	private monitoringInterval: ReturnType<typeof setInterval> | null = null;
	private lastVitals: RealTimeVitals | null = null;

	constructor(userId: string) {
		this.userId = userId;
	}

	// Start real-time monitoring
	async startMonitoring(): Promise<void> {
		if (this.isMonitoring) return;

		this.isMonitoring = true;
		console.log('🩺 Starting real-time wearable monitoring for user:', this.userId);

		// Check available wearable integrations
		const availableSources = await this.getAvailableSources();

		if (availableSources.length === 0) {
			console.warn('No wearable sources available, using mock data');
			this.startMockMonitoring();
		} else {
			// Use the first available source (in production, user preference)
			const primarySource = availableSources[0];
			await this.connectToSource(primarySource);
		}

		// Haptic feedback for starting monitoring
		if (Capacitor.isNativePlatform()) {
			Haptics.impact({ style: ImpactStyle.Light });
		}
	}

	// Stop monitoring
	async stopMonitoring(): Promise<void> {
		if (!this.isMonitoring) return;

		this.isMonitoring = false;
		console.log('🛑 Stopping wearable monitoring');

		// Clear monitoring interval
		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
			this.monitoringInterval = null;
		}

		// Disconnect from sources
		await this.disconnectFromSources();

		// Clear callbacks
		this.vitalsCallbacks = [];
	}

	// Subscribe to vitals updates
	onVitalsUpdate(callback: VitalsCallback): () => void {
		this.vitalsCallbacks.push(callback);

		// Return unsubscribe function
		return () => {
			const index = this.vitalsCallbacks.indexOf(callback);
			if (index > -1) {
				this.vitalsCallbacks.splice(index, 1);
			}
		};
	}

	// Get current vitals
	getCurrentVitals(): RealTimeVitals | null {
		return this.lastVitals;
	}

	// Check available wearable sources
	private async getAvailableSources(): Promise<RealTimeVitals['source'][]> {
		const sources: RealTimeVitals['source'][] = [];

		// Check HealthKit (iOS)
		if (Capacitor.getPlatform() === 'ios') {
			try {
				// In production: check HealthKit availability
				sources.push('healthkit');
			} catch (error) {
				console.log('HealthKit not available:', error);
			}
		}

		// Check Health Connect (Android)
		if (Capacitor.getPlatform() === 'android') {
			try {
				// In production: check Health Connect availability
				sources.push('health-connect');
			} catch (error) {
				console.log('Health Connect not available:', error);
			}
		}

		// Check Whoop API
		try {
			const whoopConnected = await this.checkWhoopConnection();
			if (whoopConnected) sources.push('whoop');
		} catch (error) {
			console.log('Whoop not available:', error);
		}

		// Check Fitbit API
		try {
			const fitbitConnected = await this.checkFitbitConnection();
			if (fitbitConnected) sources.push('fitbit');
		} catch (error) {
			console.log('Fitbit not available:', error);
		}

		// Always include mock as fallback
		sources.push('mock');

		return sources;
	}

	// Connect to a specific source
	private async connectToSource(source: RealTimeVitals['source']): Promise<void> {
		console.log(`🔗 Connecting to ${source}`);

		switch (source) {
			case 'healthkit':
				await this.connectHealthKit();
				break;
			case 'health-connect':
				await this.connectHealthConnect();
				break;
			case 'whoop':
				await this.connectWhoop();
				break;
			case 'fitbit':
				await this.connectFitbit();
				break;
			case 'mock':
				this.startMockMonitoring();
				break;
		}
	}

	// Disconnect from all sources
	private async disconnectFromSources(): Promise<void> {
		// In production: disconnect from actual APIs
		console.log('🔌 Disconnecting from wearable sources');
	}

	// HealthKit integration (iOS)
	private async connectHealthKit(): Promise<void> {
		try {
			// In production: use @felix-health/capacitor-health-data or similar
			console.log('Connecting to HealthKit...');

			// Start monitoring with 5-second intervals
			this.monitoringInterval = setInterval(async () => {
				const vitals = await this.getHealthKitVitals();
				this.emitVitalsUpdate(vitals);
			}, 5000);

		} catch (error) {
			console.error('HealthKit connection failed:', error);
			// Fallback to mock
			this.startMockMonitoring();
		}
	}

	// Health Connect integration (Android)
	private async connectHealthConnect(): Promise<void> {
		try {
			console.log('Connecting to Health Connect...');

			// Start monitoring
			this.monitoringInterval = setInterval(async () => {
				const vitals = await this.getHealthConnectVitals();
				this.emitVitalsUpdate(vitals);
			}, 5000);

		} catch (error) {
			console.error('Health Connect connection failed:', error);
			this.startMockMonitoring();
		}
	}

	// Whoop API integration
	private async connectWhoop(): Promise<void> {
		try {
			console.log('Connecting to Whoop API...');

			this.monitoringInterval = setInterval(async () => {
				const vitals = await this.getWhoopVitals();
				this.emitVitalsUpdate(vitals);
			}, 10000); // Whoop updates less frequently

		} catch (error) {
			console.error('Whoop connection failed:', error);
			this.startMockMonitoring();
		}
	}

	// Fitbit API integration
	private async connectFitbit(): Promise<void> {
		try {
			console.log('Connecting to Fitbit API...');

			this.monitoringInterval = setInterval(async () => {
				const vitals = await this.getFitbitVitals();
				this.emitVitalsUpdate(vitals);
			}, 10000);

		} catch (error) {
			console.error('Fitbit connection failed:', error);
			this.startMockMonitoring();
		}
	}

	// Mock monitoring for development/demo
	private startMockMonitoring(): void {
		console.log('🎭 Starting mock wearable monitoring');

		this.monitoringInterval = setInterval(() => {
			// Generate realistic mock data
			const baseHR = 70 + Math.random() * 40; // 70-110 bpm base
			const activityVariation = Math.random() * 30; // 0-30 bpm activity variation
			const heartRate = Math.round(baseHR + activityVariation);

			const baseSpO2 = 97 + Math.random() * 3; // 97-100% base
			const spo2 = Math.round(baseSpO2 - Math.random() * 2); // Sometimes dip slightly

			const vitals: RealTimeVitals = {
				heartRate,
				spo2: Math.max(95, spo2), // Never below 95%
				timestamp: Date.now(),
				source: 'mock'
			};

			this.emitVitalsUpdate(vitals);
		}, 3000); // Update every 3 seconds for demo
	}

	// Get vitals from different sources
	private async getHealthKitVitals(): Promise<RealTimeVitals> {
		// In production: use actual HealthKit API
		return {
			heartRate: 75 + Math.random() * 20,
			spo2: 97 + Math.random() * 2,
			timestamp: Date.now(),
			source: 'healthkit'
		};
	}

	private async getHealthConnectVitals(): Promise<RealTimeVitals> {
		// In production: use actual Health Connect API
		return {
			heartRate: 75 + Math.random() * 20,
			spo2: 97 + Math.random() * 2,
			timestamp: Date.now(),
			source: 'health-connect'
		};
	}

	private async getWhoopVitals(): Promise<RealTimeVitals> {
		// In production: use Whoop API
		return {
			heartRate: 75 + Math.random() * 20,
			spo2: 97 + Math.random() * 2,
			timestamp: Date.now(),
			source: 'whoop'
		};
	}

	private async getFitbitVitals(): Promise<RealTimeVitals> {
		// In production: use Fitbit API
		return {
			heartRate: 75 + Math.random() * 20,
			spo2: 97 + Math.random() * 2,
			timestamp: Date.now(),
			source: 'fitbit'
		};
	}

	// Check API connections
	private async checkWhoopConnection(): Promise<boolean> {
		// In production: check Whoop API authentication
		return false; // Mock: not connected
	}

	private async checkFitbitConnection(): Promise<boolean> {
		// In production: check Fitbit API authentication
		return false; // Mock: not connected
	}

	// Emit vitals update to all subscribers
	private emitVitalsUpdate(vitals: RealTimeVitals): void {
		this.lastVitals = vitals;

		this.vitalsCallbacks.forEach(callback => {
			try {
				callback(vitals);
			} catch (error) {
				console.error('Error in vitals callback:', error);
			}
		});
	}

	// Get connection status
	getConnectionStatus(): WearableConnection {
		return {
			connected: this.isMonitoring,
			source: this.lastVitals?.source || 'mock',
			lastSync: this.lastVitals?.timestamp || 0
		};
	}
}