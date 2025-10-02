/**
 * ElevenLabs API Integration Service
 * Handles voice synthesis, voice cloning, and voice management
 */

import { ConvexError } from 'convex/values';

export interface ElevenLabsConfig {
  apiKey: string;
  baseUrl: string;
}

export interface VoiceSynthesisRequest {
  text: string;
  voiceId: string;
  settings: {
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
}

export interface VoiceSynthesisResponse {
  audioBuffer: ArrayBuffer;
  audioUrl?: string;
  characterCount: number;
  cost: number;
}

export interface VoiceCloneRequest {
  name: string;
  description?: string;
  files: File[];
  labels?: Record<string, string>;
}

export interface VoiceCloneResponse {
  voiceId: string;
  name: string;
  status: 'processing' | 'ready' | 'failed';
}

export class ElevenLabsService {
  private config: ElevenLabsConfig;

  constructor(config: ElevenLabsConfig) {
    this.config = config;
  }

  /**
   * Synthesize text to speech using ElevenLabs API
   */
  async synthesizeText(request: VoiceSynthesisRequest): Promise<VoiceSynthesisResponse> {
    const url = `${this.config.baseUrl}/v1/text-to-speech/${request.voiceId}`;
    
    const body = {
      text: request.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: request.settings.stability ?? 0.8,
        similarity_boost: request.settings.similarityBoost ?? 0.8,
        style: request.settings.style ?? 0.0,
        use_speaker_boost: request.settings.useSpeakerBoost ?? true,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ConvexError(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const characterCount = request.text.length;
      const cost = this.calculateCost(characterCount);

      return {
        audioBuffer,
        characterCount,
        cost,
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to synthesize text: ${error}`);
    }
  }

  /**
   * Create a voice clone from audio samples
   */
  async createVoiceClone(request: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    const url = `${this.config.baseUrl}/v1/voices/add`;

    const formData = new FormData();
    formData.append('name', request.name);
    if (request.description) {
      formData.append('description', request.description);
    }
    if (request.labels) {
      formData.append('labels', JSON.stringify(request.labels));
    }

    // Add audio files
    request.files.forEach((file, index) => {
      formData.append('files', file, `sample_${index}.wav`);
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': this.config.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ConvexError(`ElevenLabs voice clone error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      return {
        voiceId: result.voice_id,
        name: result.name,
        status: 'processing',
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to create voice clone: ${error}`);
    }
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getAvailableVoices(): Promise<any[]> {
    const url = `${this.config.baseUrl}/v1/voices`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ConvexError(`ElevenLabs voices error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result.voices;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to get available voices: ${error}`);
    }
  }

  /**
   * Get voice clone status
   */
  async getVoiceCloneStatus(voiceId: string): Promise<VoiceCloneResponse> {
    const url = `${this.config.baseUrl}/v1/voices/${voiceId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ConvexError(`ElevenLabs voice status error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      return {
        voiceId: result.voice_id,
        name: result.name,
        status: 'ready', // ElevenLabs doesn't return status, assume ready if accessible
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to get voice clone status: ${error}`);
    }
  }

  /**
   * Delete a voice clone
   */
  async deleteVoiceClone(voiceId: string): Promise<boolean> {
    const url = `${this.config.baseUrl}/v1/voices/${voiceId}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });

      return response.ok;
    } catch (error) {
      throw new ConvexError(`Failed to delete voice clone: ${error}`);
    }
  }

  /**
   * Get current usage and subscription info
   */
  async getUsageInfo(): Promise<any> {
    const url = `${this.config.baseUrl}/v1/user/subscription`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ConvexError(`ElevenLabs usage error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to get usage info: ${error}`);
    }
  }

  /**
   * Calculate cost based on character count
   * Based on ElevenLabs pricing: $0.3 per 1000 characters
   */
  private calculateCost(characterCount: number): number {
    const costPerThousandChars = 0.3;
    return (characterCount / 1000) * costPerThousandChars;
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.getUsageInfo();
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Factory function to create ElevenLabs service instance
 */
export function createElevenLabsService(): ElevenLabsService {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const baseUrl = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io';

  if (!apiKey) {
    throw new ConvexError('ELEVENLABS_API_KEY environment variable is required');
  }

  return new ElevenLabsService({
    apiKey,
    baseUrl,
  });
}