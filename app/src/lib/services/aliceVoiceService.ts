/**
 * Alice Voice Coaching Service
 * 
 * Handles text-to-speech generation and voice coaching triggers for Alice AI
 */

import type { 
  VoiceCoachingResponse, 
  StrainMorphContext,
  ElevenLabsVoiceRequest 
} from '$types/alice.js';
import { elevenLabsService } from '$lib/services/elevenlabs.js';
import { aliceActions } from '$lib/stores/aliceStore.js';

// Voice coaching trigger thresholds
const STRAIN_CHANGE_THRESHOLD = 15; // Minimum strain change to trigger coaching
const COACHING_COOLDOWN = 30000; // 30 seconds between coaching messages
const MAX_MESSAGE_LENGTH = 100; // Keep messages concise

// Coaching message templates
const COACHING_MESSAGES = {
  encouragement: [
    "Great intensity! Keep pushing!",
    "You're crushing it! Stay focused!",
    "Awesome effort! Push through!",
    "Keep that energy up!",
    "You've got this! Stay strong!"
  ],
  motivation: [
    "Time to dig deeper! You can do this!",
    "This is where champions are made!",
    "Every rep counts! Keep going!",
    "Feel that burn! That's growth!",
    "Show me what you're made of!"
  ],
  recovery: [
    "Nice recovery, maintain that rhythm.",
    "Perfect pacing, keep it steady.",
    "Good control, stay in your zone.",
    "Excellent form, breathe and flow.",
    "Smart pacing, listen to your body."
  ],
  celebration: [
    "Outstanding performance!",
    "You absolutely nailed that!",
    "Incredible work! Way to go!",
    "That was amazing! Keep it up!",
    "Perfect execution! You're on fire!"
  ]
};

// Voice coaching service class
export class AliceVoiceService {
  private lastCoachingTime: number = 0;
  private consecutiveHighIntensity: number = 0;
  private isEnabled: boolean = true;
  private audioContext: AudioContext | null = null;

  constructor() {
    // Initialize Web Audio API for audio playback
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Main trigger function for voice coaching
   */
  async triggerVoiceCoaching(
    context: StrainMorphContext,
    config?: { voiceEnabled?: boolean; hapticsEnabled?: boolean }
  ): Promise<VoiceCoachingResponse | null> {
    // Check if voice coaching is enabled
    if (!this.isEnabled || (config && !config.voiceEnabled)) {
      return null;
    }

    // Check strain threshold and cooldown
    if (!this.shouldTriggerCoaching(context)) {
      return null;
    }

    try {
      // Determine coaching type and message
      const coachingType = this.determineCoachingType(context);
      const message = this.selectMessage(coachingType);

      // Generate voice response
      const response = await this.generateVoiceResponse(message, coachingType);

      // Update Alice state to speaking
      aliceActions.startSpeaking(message);

      // Play audio if available
      if (response.audioUrl) {
        await this.playAudio(response.audioUrl);
      }

      // Trigger haptic feedback if enabled
      if (config?.hapticsEnabled) {
        this.triggerHapticFeedback(coachingType);
      }

      // Update last coaching time
      this.lastCoachingTime = Date.now();

      // Update Alice state back to idle after duration
      setTimeout(() => {
        aliceActions.stopSpeaking();
      }, (response.duration || 3) * 1000);

      return response;

    } catch (error) {
      console.error('Voice coaching error:', error);
      aliceActions.stopSpeaking();
      return null;
    }
  }

  /**
   * Check if strain change warrants voice coaching
   */
  private shouldTriggerCoaching(context: StrainMorphContext): boolean {
    const timeSinceLastCoaching = Date.now() - this.lastCoachingTime;
    
    return Math.abs(context.strainDelta) > STRAIN_CHANGE_THRESHOLD &&
           timeSinceLastCoaching > COACHING_COOLDOWN;
  }

  /**
   * Determine type of coaching based on strain context
   */
  private determineCoachingType(context: StrainMorphContext): keyof typeof COACHING_MESSAGES {
    const { currentStrain, previousStrain, strainDelta } = context;

    // High strain increase - encouragement
    if (strainDelta > 20 && currentStrain > 70) {
      this.consecutiveHighIntensity++;
      if (this.consecutiveHighIntensity >= 3) {
        return 'motivation';
      }
      return 'encouragement';
    }

    // Strain decrease - recovery guidance
    if (strainDelta < -15) {
      this.consecutiveHighIntensity = 0;
      return 'recovery';
    }

    // Peak performance
    if (currentStrain > 90) {
      return 'celebration';
    }

    // Default encouragement
    return 'encouragement';
  }

  /**
   * Select appropriate message for coaching type
   */
  private selectMessage(type: keyof typeof COACHING_MESSAGES): string {
    const messages = COACHING_MESSAGES[type];
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }

  /**
   * Generate voice response using ElevenLabs
   */
  private async generateVoiceResponse(
    text: string, 
    emotion: keyof typeof COACHING_MESSAGES
  ): Promise<VoiceCoachingResponse> {
    try {
      // Adjust voice settings based on emotion
      const voiceSettings = this.getVoiceSettings(emotion);
      
      const request: ElevenLabsVoiceRequest = {
        text: text.substring(0, MAX_MESSAGE_LENGTH),
        voice_settings: voiceSettings
      };

      const result = await elevenLabsService.generateSpeech(request);
      
      return {
        text,
        audioUrl: `data:audio/mpeg;base64,${result.audio_base64}`,
        duration: this.estimateAudioDuration(text),
        emotion: emotion as VoiceCoachingResponse['emotion']
      };

    } catch (error) {
      console.error('ElevenLabs generation error:', error);
      
      // Return text-only response as fallback
      return {
        text,
        duration: this.estimateAudioDuration(text),
        emotion: emotion as VoiceCoachingResponse['emotion']
      };
    }
  }

  /**
   * Get voice settings based on emotion
   */
  private getVoiceSettings(emotion: keyof typeof COACHING_MESSAGES) {
    switch (emotion) {
      case 'encouragement':
        return { stability: 0.6, similarity_boost: 0.7 };
      case 'motivation':
        return { stability: 0.8, similarity_boost: 0.8 };
      case 'recovery':
        return { stability: 0.4, similarity_boost: 0.6 };
      case 'celebration':
        return { stability: 0.7, similarity_boost: 0.9 };
      default:
        return { stability: 0.5, similarity_boost: 0.5 };
    }
  }

  /**
   * Estimate audio duration based on text length
   */
  private estimateAudioDuration(text: string): number {
    // Rough estimate: ~150 words per minute, ~5 characters per word
    const wordsPerMinute = 150;
    const charactersPerWord = 5;
    const words = text.length / charactersPerWord;
    const minutes = words / wordsPerMinute;
    
    return Math.max(1, Math.round(minutes * 60)); // At least 1 second
  }

  /**
   * Play audio using Web Audio API
   */
  private async playAudio(audioUrl: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Decode base64 audio data
      const audioData = audioUrl.split(',')[1];
      const binaryData = atob(audioData);
      const arrayBuffer = new ArrayBuffer(binaryData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }

      // Decode and play audio
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();

    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }

  /**
   * Trigger haptic feedback based on coaching type
   */
  private triggerHapticFeedback(type: keyof typeof COACHING_MESSAGES): void {
    if (!('vibrate' in navigator)) return;

    switch (type) {
      case 'encouragement':
        navigator.vibrate([50, 100, 50]); // Quick double tap
        break;
      case 'motivation':
        navigator.vibrate([100, 50, 100, 50, 100]); // Strong pattern
        break;
      case 'recovery':
        navigator.vibrate(100); // Single gentle vibration
        break;
      case 'celebration':
        navigator.vibrate([50, 50, 50, 50, 50, 50, 50]); // Celebration pattern
        break;
    }
  }

  /**
   * Enable/disable voice coaching
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Reset coaching state
   */
  reset(): void {
    this.lastCoachingTime = 0;
    this.consecutiveHighIntensity = 0;
    aliceActions.stopSpeaking();
  }

  /**
   * Get coaching statistics
   */
  getStats(): {
    lastCoachingTime: number;
    consecutiveHighIntensity: number;
    isEnabled: boolean;
  } {
    return {
      lastCoachingTime: this.lastCoachingTime,
      consecutiveHighIntensity: this.consecutiveHighIntensity,
      isEnabled: this.isEnabled
    };
  }
}

// Create singleton instance
export const aliceVoiceService = new AliceVoiceService();

// Export trigger function for easy access
export async function triggerVoiceCoaching(
  context: StrainMorphContext, 
  options?: { voiceEnabled?: boolean; hapticsEnabled?: boolean }
): Promise<VoiceCoachingResponse | null> {
  return aliceVoiceService.triggerVoiceCoaching(context, options);
}