/**
 * ElevenLabs API Service
 * 
 * Handles text-to-speech generation for Alice AI voice coaching
 */

import type { ElevenLabsConfig, ElevenLabsVoiceRequest, ElevenLabsVoiceResponse } from '$types/alice.js';

class ElevenLabsService {
  private config: ElevenLabsConfig;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(config: ElevenLabsConfig) {
    this.config = config;
  }

  /**
   * Generate speech audio from text
   */
  async generateSpeech(request: ElevenLabsVoiceRequest): Promise<ElevenLabsVoiceResponse> {
    const response = await fetch(`${this.baseUrl}/text-to-speech/${this.config.voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.config.apiKey
      },
      body: JSON.stringify({
        text: request.text,
        model_id: this.config.modelId,
        voice_settings: request.voice_settings || {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    // Convert audio blob to base64
    const audioBlob = await response.blob();
    const audioBase64 = await this.blobToBase64(audioBlob);

    return {
      audio_base64: audioBase64,
      characters: request.text.length,
      request_id: response.headers.get('request-id') || ''
    };
  }

  /**
   * Get available voices
   */
  async getVoices() {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        'xi-api-key': this.config.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Convert blob to base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:audio/mpeg;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Create singleton instance with environment config
export const elevenLabsService = new ElevenLabsService({
  apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
  voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID || '',
  modelId: import.meta.env.VITE_ELEVENLABS_MODEL_ID || 'eleven_monolingual_v1'
});

export { ElevenLabsService };