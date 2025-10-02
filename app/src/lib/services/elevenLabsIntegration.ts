// ElevenLabs Integration Example for Git-Fit
import { createPronunciationService, PronunciationManager } from './pronunciationService.js';

// ElevenLabs Voice IDs for fitness coaching
export const FITNESS_VOICES = {
  // Professional Female Coaches
  BELLA: 'EXAVITQu4vr4xnSDxMaL',     // Clear, professional female
  ELLI: 'MF3mGyEYCl7XYWbV9V6O',     // Friendly female trainer
  
  // Energetic Male Coaches  
  ANTONI: 'ErXwobaYiN019PkySvjV',    // Energetic male trainer
  ARNOLD: 'VR6AewLTigWG4xSOukaG',    // Strong, motivational
  
  // Calm Instructors
  ADAM: 'pNInz6obpgDQGcFmaJgB',      // Calm, instructional
  SAM: 'yoZ06aMxZJJ28mfd3POQ',       // Neutral, clear
} as const;

// Voice settings optimized for fitness coaching
export const FITNESS_VOICE_SETTINGS = {
  // For exercise names and instructions
  INSTRUCTIONAL: {
    stability: 0.6,        // More stable for clarity
    similarity_boost: 0.7, // Consistent voice character
    style: 0.0,           // Neutral tone
    use_speaker_boost: true
  },
  
  // For motivational coaching
  MOTIVATIONAL: {
    stability: 0.4,        // More variation for energy
    similarity_boost: 0.6,
    style: 0.3,           // More expressive
    use_speaker_boost: true
  },
  
  // For calm recovery/cooldown guidance
  CALM: {
    stability: 0.8,        // Very stable
    similarity_boost: 0.8,
    style: 0.0,           // Neutral
    use_speaker_boost: true
  }
} as const;

// Initialize ElevenLabs pronunciation service
export async function initializeFitnessTTS(apiKey: string, voiceId: string = FITNESS_VOICES.BELLA) {
  try {
    const service = createPronunciationService('elevenlabs', apiKey, voiceId);
    const manager = new PronunciationManager(service);
    
    // Test connection
    await manager.getPronunciation('Test');
    console.log('✅ ElevenLabs TTS initialized successfully');
    
    return manager;
  } catch (error) {
    console.error('❌ Failed to initialize ElevenLabs TTS:', error);
    throw error;
  }
}

// Preload common fitness pronunciations
export async function preloadFitnessVocabulary(manager: PronunciationManager) {
  const commonExercises = [
    // Core exercises
    'Bench Press', 'Deadlift', 'Squat', 'Pull-up', 'Push-up',
    
    // Complex pronunciations
    'Romanian Deadlift', 'Bulgarian Split Squats', 'Clean and Press',
    'Snatches', 'Thrusters', 'Burpees',
    
    // Equipment
    'Kettlebell', 'Dumbbell', 'Barbell', 'Resistance Band',
    
    // Body parts
    'Quadriceps', 'Hamstrings', 'Latissimus Dorsi', 'Deltoids',
    'Rhomboids', 'Trapezius'
  ];
  
  console.log('🔄 Preloading fitness vocabulary...');
  
  for (const exercise of commonExercises) {
    try {
      await manager.getPronunciation(exercise);
      console.log(`✅ Loaded: ${exercise}`);
    } catch (error) {
      console.log(`❌ Failed: ${exercise} - ${error}`);
    }
  }
  
  console.log('🎯 Fitness vocabulary preloading complete!');
  return manager.getCacheStats();
}

// Usage example with environment variables
export async function setupProductionTTS() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || FITNESS_VOICES.BELLA;
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is required');
  }
  
  const manager = await initializeFitnessTTS(apiKey, voiceId);
  await preloadFitnessVocabulary(manager);
  
  return manager;
}

// Cost estimation helper
export function estimateTTSCosts(totalCharacters: number): { elevenlabs: number, google: number } {
  return {
    elevenlabs: (totalCharacters / 1000) * 0.30,  // $0.30 per 1K chars
    google: (totalCharacters / 1000000) * 4.00    // $4.00 per 1M chars
  };
}

// Example: Generate pronunciation for workout session
export async function generateWorkoutPronunciations(
  manager: PronunciationManager, 
  exercises: string[]
): Promise<Map<string, string>> {
  const pronunciations = new Map<string, string>();
  
  for (const exercise of exercises) {
    try {
      const audio = await manager.getPronunciation(exercise);
      pronunciations.set(exercise, audio);
    } catch (error) {
      console.error(`Failed to generate pronunciation for ${exercise}:`, error);
    }
  }
  
  return pronunciations;
}