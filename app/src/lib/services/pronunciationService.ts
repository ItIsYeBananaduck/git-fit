import { availableExercises } from '../data/exercises.js';

// AI Pronunciation Service Interface
export interface PronunciationService {
  generatePronunciation(text: string): Promise<string>;
  getSupportedVoices(): string[];
}

// OpenAI TTS Implementation
export class OpenAIPronunciationService implements PronunciationService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generatePronunciation(text: string): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'alloy', // Can be alloy, echo, fable, onyx, nova, shimmer
          response_format: 'mp3'
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      // Return audio data as base64 for storage
      const audioBuffer = await response.arrayBuffer();
      return Buffer.from(audioBuffer).toString('base64');
    } catch (error) {
      console.error('Error generating pronunciation with OpenAI:', error);
      throw error;
    }
  }

  getSupportedVoices(): string[] {
    return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  }
}

// Google TTS Implementation
export class GooglePronunciationService implements PronunciationService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generatePronunciation(text: string): Promise<string> {
    try {
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text: text },
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Neural2-D',
            ssmlGender: 'NEUTRAL'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Google TTS API error: ${response.status}`);
      }

      const data = await response.json();
      return data.audioContent; // Base64 encoded audio
    } catch (error) {
      console.error('Error generating pronunciation with Google:', error);
      throw error;
    }
  }

  getSupportedVoices(): string[] {
    return ['en-US-Neural2-D', 'en-US-Neural2-F', 'en-US-Neural2-C', 'en-GB-Neural2-D'];
  }
}

// Pronunciation Manager with caching and fallback
export class PronunciationManager {
  private service: PronunciationService;
  private cache: Map<string, string> = new Map();
  private manualOverrides: Map<string, string> = new Map();

  constructor(service: PronunciationService) {
    this.service = service;
    this.initializeManualOverrides();
  }

  private initializeManualOverrides() {
    // Add manual pronunciations for complex fitness terms
    this.manualOverrides.set('Romanian Deadlift', 'roh-MAY-nee-an ded-lift');
    this.manualOverrides.set('Good Mornings', 'good MOR-nings');
    this.manualOverrides.set('Clean and Press', 'kleen and press');
    this.manualOverrides.set('Snatches', 'snach-es');
    this.manualOverrides.set('Thrusters', 'thrus-ters');
  }

  async getPronunciation(text: string): Promise<string> {
    // Check cache first
    if (this.cache.has(text)) {
      return this.cache.get(text)!;
    }

    // Check manual overrides
    if (this.manualOverrides.has(text)) {
      const pronunciation = this.manualOverrides.get(text)!;
      this.cache.set(text, pronunciation);
      return pronunciation;
    }

    try {
      // Generate with AI service
      const audioData = await this.service.generatePronunciation(text);
      this.cache.set(text, audioData);
      return audioData;
    } catch (error) {
      console.error(`Failed to generate pronunciation for "${text}":`, error);
      // Fallback to simple phonetic approximation
      return this.generateSimplePhonetic(text);
    }
  }

  private generateSimplePhonetic(text: string): string {
    // Simple fallback phonetic generator
    return text.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  }

  async preloadExercisePronunciations(): Promise<void> {
    console.log('Preloading exercise pronunciations...');
    const promises = availableExercises.map((exercise: string) =>
      this.getPronunciation(exercise)
    );

    try {
      await Promise.all(promises);
      console.log(`Preloaded pronunciations for ${availableExercises.length} exercises`);
    } catch (error) {
      console.error('Error preloading pronunciations:', error);
    }
  }

  getCacheStats(): { cached: number, manual: number } {
    return {
      cached: this.cache.size,
      manual: this.manualOverrides.size
    };
  }
}

// Factory function to create pronunciation service
export function createPronunciationService(type: 'openai' | 'google', apiKey: string): PronunciationService {
  switch (type) {
    case 'openai':
      return new OpenAIPronunciationService(apiKey);
    case 'google':
      return new GooglePronunciationService(apiKey);
    default:
      throw new Error(`Unsupported service type: ${type}`);
  }
}

// Usage example:
/*
// Initialize with OpenAI
const service = createPronunciationService('openai', process.env.OPENAI_API_KEY!);
const manager = new PronunciationManager(service);

// Preload all exercise pronunciations
await manager.preloadExercisePronunciations();

// Get pronunciation for a specific exercise
const benchPressAudio = await manager.getPronunciation('Bench Press');
*/