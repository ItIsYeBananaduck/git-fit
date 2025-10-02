import { availableExercises } from '../data/exercises.js';

// AI Pronunciation Service Interface
export interface PronunciationService {
  generatePronunciation(text: string): Promise<string>;
  getSupportedVoices(): string[];
}

// ElevenLabs TTS Implementation
export class ElevenLabsPronunciationService implements PronunciationService {
  private apiKey: string;
  private voiceId: string;

  constructor(apiKey: string, voiceId: string = 'EXAVITQu4vr4xnSDxMaL') { // Default to Bella voice
    this.apiKey = apiKey;
    this.voiceId = voiceId;
  }

  async generatePronunciation(text: string): Promise<string> {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      // Return audio data as base64 for storage
      const audioBuffer = await response.arrayBuffer();
      return Buffer.from(audioBuffer).toString('base64');
    } catch (error) {
      console.error('Error generating pronunciation with ElevenLabs:', error);
      throw error;
    }
  }

  getSupportedVoices(): string[] {
    return [
      'EXAVITQu4vr4xnSDxMaL', // Bella
      'ErXwobaYiN019PkySvjV', // Antoni
      'VR6AewLTigWG4xSOukaG', // Arnold
      'pNInz6obpgDQGcFmaJgB', // Adam
      'yoZ06aMxZJJ28mfd3POQ', // Sam
      'AZnzlk1XvdvUeBnXmlld', // Domi
      'CYw3kZ02Hs0563khs1Fj', // Dave
      'D38z5RcWu1voky8WS1ja', // Fin
      'JBFqnCBsd6RMkjVDRZzb', // George
    ];
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
export function createPronunciationService(
  type: 'elevenlabs' | 'google', 
  apiKey: string, 
  voiceId?: string
): PronunciationService {
  switch (type) {
    case 'elevenlabs':
      return new ElevenLabsPronunciationService(apiKey, voiceId);
    case 'google':
      return new GooglePronunciationService(apiKey);
    default:
      throw new Error(`Unsupported service type: ${type}`);
  }
}

// Usage example:
/*
// Initialize with ElevenLabs
const service = createPronunciationService('elevenlabs', process.env.ELEVENLABS_API_KEY!, 'EXAVITQu4vr4xnSDxMaL');
const manager = new PronunciationManager(service);

// Preload all exercise pronunciations
await manager.preloadExercisePronunciations();

// Get pronunciation for a specific exercise
const benchPressAudio = await manager.getPronunciation('Bench Press');
*/

// Available ElevenLabs voices for fitness coaching:
/*
- EXAVITQu4vr4xnSDxMaL (Bella) - Clear, professional female voice
- ErXwobaYiN019PkySvjV (Antoni) - Energetic male voice
- VR6AewLTigWG4xSOukaG (Arnold) - Strong, motivational male voice
- pNInz6obpgDQGcFmaJgB (Adam) - Calm, instructional male voice
*/