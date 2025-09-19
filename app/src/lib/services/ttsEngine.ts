// TTS Interfaces
export interface TTSConfig {
	voice: 'alice' | 'aiden';
	tone: 'encouraging' | 'firm' | 'steady' | 'pushy';
	rate: number; // 0.1 to 10.0
	pitch: number; // 0.0 to 2.0
	volume: number; // 0.0 to 1.0
	language: string;
}

export interface NarrationSegment {
	id: string;
	text: string;
	timing: 'pre_set' | 'mid_set' | 'post_set' | 'rest' | 'transition';
	priority: 'low' | 'medium' | 'high' | 'urgent';
	coach: 'alice' | 'aiden';
	context: {
		exercise?: string;
		setNumber?: number;
		repCount?: number;
		heartRate?: number;
		restTime?: number;
	};
	audioUrl?: string;
	duration?: number;
	generatedAt: number;
}

export interface PronunciationRule {
	word: string;
	phonetic: string;
	context?: string;
}

export interface VoiceProfile {
	name: 'alice' | 'aiden';
	displayName: string;
	gender: 'female' | 'male';
	accent: string;
	personality: string[];
	baseConfig: Partial<TTSConfig>;
}

// TTS Engine
export class TTSEngine {
	private config: TTSConfig;
	private voiceProfiles: Map<string, VoiceProfile> = new Map();
	private pronunciationRules: PronunciationRule[] = [];
	private audioCache: Map<string, { url: string; duration: number }> = new Map();
	private speechSynthesis: SpeechSynthesis | null = null;

	constructor(config: Partial<TTSConfig> = {}) {
		this.config = {
			voice: 'alice',
			tone: 'encouraging',
			rate: 1.0,
			pitch: 1.0,
			volume: 0.8,
			language: 'en-US',
			...config
		};

		this.initializeVoiceProfiles();
		this.initializePronunciationRules();
		this.initializeSpeechSynthesis();
	}

	private initializeVoiceProfiles() {
		this.voiceProfiles.set('alice', {
			name: 'alice',
			displayName: 'Alice',
			gender: 'female',
			accent: 'American',
			personality: ['encouraging', 'warm', 'supportive', 'motivational'],
			baseConfig: {
				rate: 1.1,
				pitch: 1.2,
				volume: 0.85
			}
		});

		this.voiceProfiles.set('aiden', {
			name: 'aiden',
			displayName: 'Aiden',
			gender: 'male',
			accent: 'American',
			personality: ['structured', 'disciplined', 'direct', 'analytical'],
			baseConfig: {
				rate: 0.95,
				pitch: 0.9,
				volume: 0.8
			}
		});
	}

	private initializePronunciationRules() {
		this.pronunciationRules = [
			{ word: 'squat', phonetic: 'skwat' },
			{ word: 'bench press', phonetic: 'bench pres' },
			{ word: 'deadlift', phonetic: 'ded-lift' },
			{ word: 'pull-up', phonetic: 'pool-up' },
			{ word: 'kettlebell', phonetic: 'ket-l-bel' },
			{ word: 'dumbbell', phonetic: 'dum-bel' },
			{ word: 'barbell', phonetic: 'bar-bel' },
			{ word: 'hypertrophy', phonetic: 'hi-PUR-truh-fee' },
			{ word: 'RPE', phonetic: 'R-P-E' },
			{ word: 'HRV', phonetic: 'H-R-V' },
			{ word: 'SpO2', phonetic: 'S-P-O-two' },
			{ word: 'mesocycle', phonetic: 'meh-zoh-sy-kul' },
			{ word: 'deload', phonetic: 'dee-load' },
			{ word: 'progressive overload', phonetic: 'pruh-GREH-siv OH-ver-load' }
		];
	}

	private initializeSpeechSynthesis() {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			this.speechSynthesis = window.speechSynthesis;
		}
	}

	// Update configuration
	updateConfig(newConfig: Partial<TTSConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	// Get current configuration
	getConfig(): TTSConfig {
		return { ...this.config };
	}

	// Generate narration segment
	async generateNarration(
		text: string,
		context: NarrationSegment['context'] = {},
		coach: 'alice' | 'aiden' = this.config.voice,
		timing: NarrationSegment['timing'] = 'pre_set',
		priority: NarrationSegment['priority'] = 'medium'
	): Promise<NarrationSegment> {
		const processedText = this.processText(text, context);
		const segmentId = `narration_${Date.now()}_${Math.random()}`;

		const segment: NarrationSegment = {
			id: segmentId,
			text: processedText,
			timing,
			priority,
			coach,
			context,
			generatedAt: Date.now()
		};

		// Generate audio if speech synthesis is available
		if (this.speechSynthesis) {
			try {
				const audioData = await this.generateAudio(processedText, coach);
				segment.audioUrl = audioData.url;
				segment.duration = audioData.duration;
			} catch (error) {
				console.warn('Failed to generate audio:', error);
			}
		}

		return segment;
	}

	// Process text with pronunciation rules and context
	private processText(text: string, context: NarrationSegment['context']): string {
		let processedText = text;

		// Apply pronunciation rules
		for (const rule of this.pronunciationRules) {
			const regex = new RegExp(`\\b${rule.word}\\b`, 'gi');
			processedText = processedText.replace(regex, rule.phonetic);
		}

		// Replace context placeholders
		if (context.exercise) {
			processedText = processedText.replace(/{exercise}/g, context.exercise);
		}
		if (context.setNumber) {
			processedText = processedText.replace(/{set}/g, context.setNumber.toString());
		}
		if (context.repCount) {
			processedText = processedText.replace(/{reps}/g, context.repCount.toString());
		}
		if (context.heartRate) {
			processedText = processedText.replace(/{hr}/g, context.heartRate.toString());
		}
		if (context.restTime) {
			const restSeconds = Math.floor(context.restTime / 1000);
			processedText = processedText.replace(/{rest}/g, restSeconds.toString());
		}

		return processedText;
	}

	// Generate audio using Web Speech API
	private async generateAudio(text: string, coach: 'alice' | 'aiden'): Promise<{ url: string; duration: number }> {
		return new Promise((resolve, reject) => {
			if (!this.speechSynthesis) {
				reject(new Error('Speech synthesis not available'));
				return;
			}

			const utterance = new SpeechSynthesisUtterance(text);
			const voiceProfile = this.voiceProfiles.get(coach);

			if (voiceProfile) {
				utterance.rate = voiceProfile.baseConfig.rate || this.config.rate;
				utterance.pitch = voiceProfile.baseConfig.pitch || this.config.pitch;
				utterance.volume = voiceProfile.baseConfig.volume || this.config.volume;
			} else {
				utterance.rate = this.config.rate;
				utterance.pitch = this.config.pitch;
				utterance.volume = this.config.volume;
			}

			utterance.lang = this.config.language;

			// Try to find a suitable voice
			const voices = this.speechSynthesis.getVoices();
			const preferredVoice = this.findPreferredVoice(voices, coach);

			if (preferredVoice) {
				utterance.voice = preferredVoice;
			}

			utterance.onend = () => {
				// Estimate duration (rough calculation)
				const wordsPerMinute = 150; // Average speaking rate
				const wordCount = text.split(' ').length;
				const estimatedDuration = (wordCount / wordsPerMinute) * 60 * 1000; // in milliseconds

				resolve({
					url: '', // Web Speech API doesn't provide audio URLs
					duration: estimatedDuration
				});
			};

			utterance.onerror = (error) => {
				reject(error);
			};

			this.speechSynthesis.speak(utterance);
		});
	}

	// Find preferred voice based on coach
	private findPreferredVoice(voices: SpeechSynthesisVoice[], coach: 'alice' | 'aiden'): SpeechSynthesisVoice | null {
		const voiceProfile = this.voiceProfiles.get(coach);
		if (!voiceProfile) return null;

		// Try to find a voice that matches the coach's characteristics
		const preferredVoices = voices.filter(voice => {
			const matchesGender = voice.name.toLowerCase().includes(voiceProfile.gender);
			const matchesLanguage = voice.lang.startsWith(this.config.language.split('-')[0]);
			return matchesGender && matchesLanguage;
		});

		// Return the first matching voice, or any English voice as fallback
		return preferredVoices[0] || voices.find(voice => voice.lang.startsWith('en')) || null;
	}

	// Speak narration segment
	async speakNarration(segment: NarrationSegment): Promise<void> {
		if (!this.speechSynthesis) {
			throw new Error('Speech synthesis not available');
		}

		return new Promise((resolve, reject) => {
			const utterance = new SpeechSynthesisUtterance(segment.text);

			// Apply voice profile settings
			const voiceProfile = this.voiceProfiles.get(segment.coach);
			if (voiceProfile) {
				utterance.rate = voiceProfile.baseConfig.rate || this.config.rate;
				utterance.pitch = voiceProfile.baseConfig.pitch || this.config.pitch;
				utterance.volume = voiceProfile.baseConfig.volume || this.config.volume;
			}

			utterance.lang = this.config.language;

			// Find and set voice
			if (this.speechSynthesis) {
				const voices = this.speechSynthesis.getVoices();
				const preferredVoice = this.findPreferredVoice(voices, segment.coach);
				if (preferredVoice) {
					utterance.voice = preferredVoice;
				}
			}

			utterance.onend = () => resolve();
			utterance.onerror = (error) => reject(error);

			if (this.speechSynthesis) {
				this.speechSynthesis.speak(utterance);
			} else {
				reject(new Error('Speech synthesis became unavailable'));
			}
		});
	}

	// Stop current speech
	stopSpeech(): void {
		if (this.speechSynthesis) {
			this.speechSynthesis.cancel();
		}
	}

	// Check if speech synthesis is available
	isAvailable(): boolean {
		return this.speechSynthesis !== null;
	}

	// Get available voices
	getAvailableVoices(): SpeechSynthesisVoice[] {
		if (!this.speechSynthesis) return [];
		return this.speechSynthesis.getVoices();
	}

	// Add custom pronunciation rule
	addPronunciationRule(rule: PronunciationRule): void {
		this.pronunciationRules.push(rule);
	}

	// Get voice profiles
	getVoiceProfiles(): VoiceProfile[] {
		return Array.from(this.voiceProfiles.values());
	}

	// Pre-generate common narration segments
	async pregenerateCommonNarrations(): Promise<NarrationSegment[]> {
		const commonTexts = [
			"Let's start with {exercise}. Get ready for set {set}.",
			"Great work! Take {rest} seconds to recover.",
			"Your heart rate is at {hr} bpm. Perfect effort!",
			"Time to move on to {exercise}. You've got this!",
			"Excellent form! Keep that intensity up.",
			"Recovery complete. Let's crush this next set!",
			"You're doing amazing! Stay focused.",
			"Listen to your body. Adjust as needed.",
			"New personal record! Celebrate that win!",
			"Stay consistent. Every rep counts."
		];

		const segments: NarrationSegment[] = [];

		for (const text of commonTexts) {
			const aliceSegment = await this.generateNarration(text, {}, 'alice', 'pre_set', 'medium');
			const aidenSegment = await this.generateNarration(text, {}, 'aiden', 'pre_set', 'medium');

			segments.push(aliceSegment, aidenSegment);
		}

		return segments;
	}
}

// Narration Queue Manager
export class NarrationQueueManager {
	private queue: NarrationSegment[] = [];
	private isPlaying = false;
	private ttsEngine: TTSEngine;
	private onNarrationStart?: (segment: NarrationSegment) => void;
	private onNarrationEnd?: (segment: NarrationSegment) => void;

	constructor(ttsEngine: TTSEngine) {
		this.ttsEngine = ttsEngine;
	}

	// Add narration to queue
	addToQueue(segment: NarrationSegment): void {
		// Insert based on priority
		const insertIndex = this.getInsertIndex(segment.priority);
		this.queue.splice(insertIndex, 0, segment);
	}

	// Get insertion index based on priority
	private getInsertIndex(priority: NarrationSegment['priority']): number {
		const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
		const targetPriority = priorityOrder[priority];

		for (let i = 0; i < this.queue.length; i++) {
			const currentPriority = priorityOrder[this.queue[i].priority];
			if (currentPriority > targetPriority) {
				return i;
			}
		}

		return this.queue.length;
	}

	// Start processing queue
	async startProcessing(): Promise<void> {
		if (this.isPlaying || this.queue.length === 0) return;

		this.isPlaying = true;

		while (this.queue.length > 0 && this.isPlaying) {
			const segment = this.queue.shift()!;
			this.onNarrationStart?.(segment);

			try {
				await this.ttsEngine.speakNarration(segment);
			} catch (error) {
				console.error('Failed to speak narration:', error);
			}

			this.onNarrationEnd?.(segment);

			// Small delay between narrations
			await new Promise(resolve => setTimeout(resolve, 500));
		}

		this.isPlaying = false;
	}

	// Stop processing
	stopProcessing(): void {
		this.isPlaying = false;
		this.ttsEngine.stopSpeech();
	}

	// Clear queue
	clearQueue(): void {
		this.queue = [];
	}

	// Get queue status
	getQueueStatus(): { length: number; isPlaying: boolean; nextSegment?: NarrationSegment } {
		return {
			length: this.queue.length,
			isPlaying: this.isPlaying,
			nextSegment: this.queue[0]
		};
	}

	// Set event handlers
	setEventHandlers(handlers: {
		onNarrationStart?: (segment: NarrationSegment) => void;
		onNarrationEnd?: (segment: NarrationSegment) => void;
	}): void {
		this.onNarrationStart = handlers.onNarrationStart;
		this.onNarrationEnd = handlers.onNarrationEnd;
	}
}

// Singleton instances
export const ttsEngine = new TTSEngine();
export const narrationQueueManager = new NarrationQueueManager(ttsEngine);

// Helper functions
export function createNarrationSegment(
	text: string,
	context?: NarrationSegment['context'],
	coach?: 'alice' | 'aiden',
	timing?: NarrationSegment['timing'],
	priority?: NarrationSegment['priority']
): Promise<NarrationSegment> {
	return ttsEngine.generateNarration(text, context, coach, timing, priority);
}

export function speakNarrationImmediately(segment: NarrationSegment): Promise<void> {
	return ttsEngine.speakNarration(segment);
}

export function queueNarration(segment: NarrationSegment): void {
	narrationQueueManager.addToQueue(segment);
}

export function startNarrationQueue(): Promise<void> {
	return narrationQueueManager.startProcessing();
}

export function stopNarrationQueue(): void {
	narrationQueueManager.stopProcessing();
}

export function getTTSStatus(): { available: boolean; voices: SpeechSynthesisVoice[] } {
	return {
		available: ttsEngine.isAvailable(),
		voices: ttsEngine.getAvailableVoices()
	};
}

// Pre-defined narration templates
export const NARRATION_TEMPLATES = {
	alice: {
		set_start: [
			"Let's crush this {exercise} set! You've got {reps} reps to go.",
			"Ready for {exercise}? Let's make this set count!",
			"Time to shine on {exercise}. Show me what you've got!",
			"Let's build that strength with {exercise}. Ready, set, go!"
		],
		set_end: [
			"Amazing work on that set! Take a well-deserved break.",
			"You're crushing it! Rest up and get ready for more.",
			"Excellent effort! Your body is getting stronger every day.",
			"Great job! Listen to your body during this recovery."
		],
		rest_reminder: [
			"Your rest period is almost up. Get ready to move!",
			"30 seconds left! You've got this next set.",
			"Rest complete! Let's keep that momentum going.",
			"Time to get back at it! Show me that fire!"
		],
		encouragement: [
			"You're doing fantastic! Keep pushing through.",
			"I believe in you! Every rep brings you closer to your goals.",
			"You're stronger than you think! Keep going!",
			"This is your workout! Own every moment of it."
		]
	},
	aiden: {
		set_start: [
			"Execute {exercise} with precision. {reps} reps, perfect form.",
			"Focus on {exercise}. Quality over quantity.",
			"Discipline drives results. Begin {exercise}.",
			"Control the weight, control your destiny. Start {exercise}."
		],
		set_end: [
			"Set complete. Analyze your performance during rest.",
			"Well executed. Use this rest period wisely.",
			"Form was solid. Rest and prepare for the next challenge.",
			"Completed. Rest strategically for maximum recovery."
		],
		rest_reminder: [
			"Rest period ending in 30 seconds. Prepare mentally.",
			"Recovery time almost complete. Focus on the next set.",
			"Rest ending. Get in position for {exercise}.",
			"Time to resume. Execute with precision."
		],
		encouragement: [
			"Consistency creates champions. Stay disciplined.",
			"Progress requires patience. Trust the process.",
			"Every set builds your foundation. Stay focused.",
			"Results come from effort. Keep pushing boundaries."
		]
	}
} as const;