/**
 * Voice Service - Text-to-Speech and Voice Feedback for Coaching
 * Part of Phase 3.4 - Services Layer Implementation
 */

import { api } from "$lib/convex/_generated/api.js";
import { convex } from "$lib/convex";
import type { Id } from "$lib/convex/_generated/dataModel.js";

export interface VoiceSettings {
  enabled: boolean;
  voice?: SpeechSynthesisVoice;
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
}

export interface VoiceMessage {
  text: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  context: 'coaching' | 'warning' | 'encouragement' | 'instruction';
}

export class VoiceService {
  private synthesis: SpeechSynthesis;
  private settings: VoiceSettings;
  private messageQueue: VoiceMessage[] = [];
  private isPlaying = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.settings = {
      enabled: true,
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8
    };
  }

  /**
   * Initialize voice service with user preferences
   */
  async initialize(userId: Id<"users">): Promise<void> {
    try {
      // Get user voice preferences from backend
      const status = await convex.query(api.functions.coaching.getVoiceStatus, { userId });
      
      if (status) {
        this.settings = {
          enabled: status.enabled,
          rate: status.settings?.rate || 1.0,
          pitch: status.settings?.pitch || 1.0,
          volume: status.settings?.volume || 0.8
        };
      }
    } catch (error) {
      console.warn('Failed to load voice settings:', error);
    }
  }

  /**
   * Get available system voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  /**
   * Update voice settings
   */
  updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Generate and speak coaching message
   */
  async generateVoiceMessage(userId: Id<"users">, context: Record<string, unknown>): Promise<void> {
    if (!this.settings.enabled) return;

    try {
      // Generate AI voice message via backend
      const message = await convex.action(api.functions.coaching.generateVoiceMessage, {
        userId,
        context
      });

      if (message) {
        await this.speak({
          text: message.text,
          priority: message.priority || 'medium',
          context: message.context || 'coaching'
        });
      }
    } catch (error) {
      console.error('Failed to generate voice message:', error);
    }
  }

  /**
   * Speak text immediately
   */
  async speak(message: VoiceMessage): Promise<void> {
    if (!this.settings.enabled) return;

    if (message.priority === 'urgent') {
      // Clear queue and speak immediately for urgent messages
      this.clearQueue();
      await this.speakText(message.text);
    } else {
      // Add to queue
      this.messageQueue.push(message);
      this.processQueue();
    }
  }

  /**
   * Process message queue
   */
  private async processQueue(): Promise<void> {
    if (this.isPlaying || this.messageQueue.length === 0) return;

    this.isPlaying = true;
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      await this.speakText(message.text);
    }
    
    this.isPlaying = false;
  }

  /**
   * Speak raw text using Web Speech API
   */
  private async speakText(text: string): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;
      utterance.volume = this.settings.volume;
      
      if (this.settings.voice) {
        utterance.voice = this.settings.voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve(); // Continue on error
      
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Clear message queue
   */
  clearQueue(): void {
    this.messageQueue = [];
    this.synthesis.cancel();
  }

  /**
   * Stop current speech
   */
  stop(): void {
    this.synthesis.cancel();
    this.isPlaying = false;
  }

  /**
   * Check if voice is currently playing
   */
  isVoicePlaying(): boolean {
    return this.synthesis.speaking;
  }

  /**
   * Test voice functionality
   */
  async testVoice(): Promise<void> {
    await this.speak({
      text: "Voice coaching is ready to help with your workout!",
      priority: 'medium',
      context: 'instruction'
    });
  }

  /**
   * Quick coaching messages
   */
  async speakEncouragement(): Promise<void> {
    const messages = [
      "Great form! Keep it up!",
      "You're doing amazing!",
      "Push through, you've got this!",
      "Excellent technique!",
      "Stay focused, almost there!"
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    await this.speak({
      text: randomMessage,
      priority: 'low',
      context: 'encouragement'
    });
  }

  async speakWarning(text: string): Promise<void> {
    await this.speak({
      text,
      priority: 'high',
      context: 'warning'
    });
  }

  async speakInstruction(text: string): Promise<void> {
    await this.speak({
      text,
      priority: 'medium',
      context: 'instruction'
    });
  }
}

// Export singleton instance
export const voiceService = new VoiceService();
export default voiceService;