/**
 * Integration test for Alice voice coaching triggers
 * 
 * This test MUST FAIL initially as the voice coaching functionality doesn't exist yet.
 * Tests the complete voice coaching workflow with ElevenLabs integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { 
  StrainMorphContext, 
  VoiceCoachingResponse,
  AliceInteractionMode 
} from '$types/alice.js';
import { elevenLabsService } from '$lib/services/elevenlabs.js';

// Mock ElevenLabs service
vi.mock('$lib/services/elevenlabs.js', () => ({
  elevenLabsService: {
    generateSpeech: vi.fn()
  }
}));

// Mock Capacitor haptics
vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    vibrate: vi.fn()
  }
}));

describe('Alice voice coaching triggers integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger voice coaching when strain increases significantly', async () => {
    const strainContext: StrainMorphContext = {
      currentStrain: 80,
      previousStrain: 40,
      strainDelta: 40, // >15% threshold
      timestamp: Date.now()
    };

    const mockResponse: VoiceCoachingResponse = {
      text: "Great intensity! Keep pushing!",
      audioUrl: "data:audio/mpeg;base64,mock_audio_data",
      duration: 2.5,
      emotion: 'encouraging'
    };

    (elevenLabsService.generateSpeech as any).mockResolvedValue({
      audio_base64: 'mock_audio_data',
      characters: mockResponse.text.length,
      request_id: 'test_request_123'
    });

    // This will fail until voice coaching service exists
    const result = await triggerVoiceCoaching(strainContext);

    expect(elevenLabsService.generateSpeech).toHaveBeenCalledWith({
      text: expect.stringContaining('intensity'),
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    });

    expect(result).toBeDefined();
    expect(result.emotion).toBe('encouraging');
  });

  it('should not trigger coaching for small strain changes', async () => {
    const smallChangeContext: StrainMorphContext = {
      currentStrain: 45,
      previousStrain: 40,
      strainDelta: 5, // <15% threshold
      timestamp: Date.now()
    };

    const result = await triggerVoiceCoaching(smallChangeContext);

    expect(elevenLabsService.generateSpeech).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should provide different messages based on strain context', async () => {
    const contexts = [
      {
        context: { currentStrain: 85, previousStrain: 40, strainDelta: 45, timestamp: Date.now() },
        expectedEmotion: 'encouraging' as const
      },
      {
        context: { currentStrain: 30, previousStrain: 70, strainDelta: -40, timestamp: Date.now() },
        expectedEmotion: 'gentle' as const
      },
      {
        context: { currentStrain: 95, previousStrain: 75, strainDelta: 20, timestamp: Date.now() },
        expectedEmotion: 'motivating' as const
      }
    ];

    for (const { context, expectedEmotion } of contexts) {
      (elevenLabsService.generateSpeech as any).mockResolvedValue({
        audio_base64: 'mock_audio_data',
        characters: 20,
        request_id: 'test_request'
      });

      const result = await triggerVoiceCoaching(context);
      
      expect(result?.emotion).toBe(expectedEmotion);
    }
  });

  it('should handle voice coaching with haptic feedback', async () => {
    const strainContext: StrainMorphContext = {
      currentStrain: 75,
      previousStrain: 45,
      strainDelta: 30,
      timestamp: Date.now()
    };

    (elevenLabsService.generateSpeech as any).mockResolvedValue({
      audio_base64: 'mock_audio_data',
      characters: 25,
      request_id: 'test_request'
    });

    const result = await triggerVoiceCoaching(strainContext, { 
      hapticsEnabled: true 
    });

    expect(result).toBeDefined();
    // Haptics should be triggered alongside voice coaching
  });

  it('should respect user voice preferences', async () => {
    const strainContext: StrainMorphContext = {
      currentStrain: 80,
      previousStrain: 50,
      strainDelta: 30,
      timestamp: Date.now()
    };

    // User has voice disabled
    const result = await triggerVoiceCoaching(strainContext, { 
      voiceEnabled: false 
    });

    expect(elevenLabsService.generateSpeech).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should handle ElevenLabs API errors gracefully', async () => {
    const strainContext: StrainMorphContext = {
      currentStrain: 70,
      previousStrain: 40,
      strainDelta: 30,
      timestamp: Date.now()
    };

    (elevenLabsService.generateSpeech as any).mockRejectedValue(
      new Error('ElevenLabs API error')
    );

    const result = await triggerVoiceCoaching(strainContext);

    // Should handle error and fallback gracefully
    expect(result).toBeNull();
  });
});

// Mock function that will be implemented
async function triggerVoiceCoaching(
  context: StrainMorphContext, 
  options?: { voiceEnabled?: boolean; hapticsEnabled?: boolean }
): Promise<VoiceCoachingResponse | null> {
  // This function doesn't exist yet - test will fail
  throw new Error('triggerVoiceCoaching not implemented yet');
}