import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';

// T043: Synthesize voice
export const synthesizeVoice = mutation({
  args: {
    userId: v.string(),
    text: v.string(),
    voiceId: v.optional(v.string()),
    settings: v.optional(v.object({
      stability: v.optional(v.number()),
      similarityBoost: v.optional(v.number()),
      style: v.optional(v.string()),
      pace: v.optional(v.number()),
      volume: v.optional(v.number()),
    })),
    context: v.optional(v.object({
      workoutPhase: v.optional(v.string()),
      userMood: v.optional(v.string()),
      timeOfDay: v.string(),
      location: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Get user and validate voice enabled
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('_id'), args.userId))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.voiceEnabled) {
      throw new Error('Voice synthesis not enabled for user');
    }

    // Get voice preferences or use default
    let voiceId = args.voiceId;
    let voiceSettings = args.settings;

    if (!voiceId || !voiceSettings) {
      const defaultVoicePrefs = await ctx.db
        .query('voicePreferences')
        .filter((q) => q.eq(q.field('userId'), args.userId))
        .filter((q) => q.eq(q.field('isDefault'), true))
        .first();

      voiceId = voiceId || defaultVoicePrefs?.voiceId || 'default';
      voiceSettings = voiceSettings || defaultVoicePrefs?.settings || {
        stability: 0.75,
        similarityBoost: 0.75,
        style: 'normal',
      };
    }

    // Create session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check cache first
    const textHash = await hashText(args.text + voiceId);
    const cachedAudio = await ctx.db
      .query('voiceCache')
      .filter((q) => q.eq(q.field('textHash'), textHash))
      .filter((q) => q.eq(q.field('voiceId'), voiceId))
      .first();

    let audioUrl: string;
    let cacheHit = false;
    let synthesisTime = 0;

    if (cachedAudio && cachedAudio.expiry.expiresAt > Date.now()) {
      // Use cached audio
      audioUrl = cachedAudio.audioUrl;
      cacheHit = true;

      // Update cache hit count
      await ctx.db.patch(cachedAudio._id, {
        usage: {
          ...cachedAudio.usage,
          hitCount: cachedAudio.usage.hitCount + 1,
          lastAccessed: Date.now(),
        },
      });
    } else {
      // Synthesize new audio (placeholder - would call ElevenLabs API)
      const startTime = Date.now();
      audioUrl = await synthesizeWithElevenLabs(args.text, voiceId, voiceSettings);
      synthesisTime = Date.now() - startTime;

      // Cache the result
      await ctx.db.insert('voiceCache', {
        textHash,
        text: args.text,
        voiceId,
        audioUrl,
        metadata: {
          duration: estimateAudioDuration(args.text),
          fileSize: args.text.length * 50, // rough estimate
          format: 'mp3',
          sampleRate: 22050,
        },
        usage: {
          hitCount: 1,
          lastAccessed: Date.now(),
          popularity: 0,
          contexts: args.context ? [JSON.stringify(args.context)] : [],
        },
        expiry: {
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
          priority: 'medium',
          canExtend: true,
        },
        quality: {
          synthesisQuality: 0.8,
          compressionLevel: 'medium',
          verified: false,
        },
        createdAt: Date.now(),
      });
    }

    // Create voice interaction record
    const interactionId = await ctx.db.insert('voiceInteractions', {
      userId: args.userId,
      sessionId,
      interactionType: 'synthesis',
      input: {
        text: args.text,
      },
      response: {
        text: args.text,
        audioUrl,
        voiceId,
        length: args.text.length,
      },
      context: args.context || {
        timeOfDay: 'unknown',
      },
      quality: {
        audioQuality: 0.8,
        responseRelevance: 1.0,
        technicalIssues: [],
      },
      processing: {
        synthesisTime,
        cacheHit,
        modelVersion: 'elevenlabs-v1',
        apiCalls: cacheHit ? 0 : 1,
      },
      createdAt: Date.now(),
    });

    return {
      audioUrl,
      interactionId,
      cached: cacheHit,
      synthesisTime,
    };
  },
});

// T044: Get voice preferences
export const getVoicePreferences = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query('voicePreferences')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    return preferences.map((pref) => ({
      id: pref._id,
      voiceId: pref.voiceId,
      name: pref.name,
      provider: pref.provider,
      settings: pref.settings,
      isDefault: pref.isDefault,
      lastUsed: pref.usage.lastUsed,
      totalUsage: pref.usage.totalUsage,
    }));
  },
});

// T045: Update voice preferences
export const updateVoicePreferences = mutation({
  args: {
    userId: v.string(),
    voiceId: v.string(),
    settings: v.object({
      stability: v.optional(v.number()),
      similarityBoost: v.optional(v.number()),
      style: v.optional(v.string()),
      pace: v.optional(v.number()),
      volume: v.optional(v.number()),
    }),
    setAsDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Find existing preference
    const existingPref = await ctx.db
      .query('voicePreferences')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .filter((q) => q.eq(q.field('voiceId'), args.voiceId))
      .first();

    if (!existingPref) {
      throw new Error('Voice preference not found');
    }

    // If setting as default, remove default from others
    if (args.setAsDefault) {
      const otherPrefs = await ctx.db
        .query('voicePreferences')
        .filter((q) => q.eq(q.field('userId'), args.userId))
        .filter((q) => q.eq(q.field('isDefault'), true))
        .collect();

      for (const pref of otherPrefs) {
        if (pref._id !== existingPref._id) {
          await ctx.db.patch(pref._id, {
            isDefault: false,
            updatedAt: Date.now(),
          });
        }
      }
    }

    // Update the preference
    await ctx.db.patch(existingPref._id, {
      settings: {
        ...existingPref.settings,
        ...args.settings,
      },
      isDefault: args.setAsDefault || existingPref.isDefault,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// T046: Create voice preference
export const createVoicePreference = mutation({
  args: {
    userId: v.string(),
    voiceId: v.string(),
    name: v.string(),
    provider: v.string(),
    settings: v.object({
      stability: v.optional(v.number()),
      similarityBoost: v.optional(v.number()),
      style: v.optional(v.string()),
      pace: v.optional(v.number()),
      volume: v.optional(v.number()),
    }),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if voice preference already exists
    const existingPref = await ctx.db
      .query('voicePreferences')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .filter((q) => q.eq(q.field('voiceId'), args.voiceId))
      .first();

    if (existingPref) {
      throw new Error('Voice preference already exists for this voice ID');
    }

    // If setting as default, remove default from others
    if (args.isDefault) {
      const otherPrefs = await ctx.db
        .query('voicePreferences')
        .filter((q) => q.eq(q.field('userId'), args.userId))
        .filter((q) => q.eq(q.field('isDefault'), true))
        .collect();

      for (const pref of otherPrefs) {
        await ctx.db.patch(pref._id, {
          isDefault: false,
          updatedAt: Date.now(),
        });
      }
    }

    const now = Date.now();
    const preferenceId = await ctx.db.insert('voicePreferences', {
      userId: args.userId,
      voiceId: args.voiceId,
      name: args.name,
      provider: args.provider,
      settings: args.settings,
      usage: {
        totalUsage: 0,
        lastUsed: 0,
        averageLength: 0,
        contexts: [],
      },
      isActive: true,
      isDefault: args.isDefault || false,
      createdAt: now,
      updatedAt: now,
    });

    return { id: preferenceId };
  },
});

// T047: Get voice interactions
export const getVoiceInteractions = query({
  args: {
    userId: v.string(),
    sessionId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('voiceInteractions')
      .filter((q) => q.eq(q.field('userId'), args.userId));

    if (args.sessionId) {
      query = query.filter((q) => q.eq(q.field('sessionId'), args.sessionId));
    }

    const limit = args.limit || 50;
    const interactions = await query.order('desc').take(limit);

    return interactions.map((interaction) => ({
      id: interaction._id,
      sessionId: interaction.sessionId,
      interactionType: interaction.interactionType,
      inputText: interaction.input.text,
      responseText: interaction.response.text,
      audioUrl: interaction.response.audioUrl,
      voiceId: interaction.response.voiceId,
      quality: interaction.quality,
      cached: interaction.processing.cacheHit,
      synthesisTime: interaction.processing.synthesisTime,
      createdAt: interaction.createdAt,
    }));
  },
});

// Helper functions (these would be implemented with actual API calls)
async function hashText(text: string): Promise<string> {
  // Simple hash for now - in production would use crypto
  return Buffer.from(text).toString('base64').slice(0, 32);
}

async function synthesizeWithElevenLabs(
  text: string,
  voiceId: string,
  settings: any
): Promise<string> {
  // Placeholder - would make actual ElevenLabs API call
  // For now, return a mock URL
  return `https://example.com/audio/${Date.now()}.mp3`;
}

function estimateAudioDuration(text: string): number {
  // Rough estimate: 150 words per minute, average 5 chars per word
  const words = text.length / 5;
  const minutes = words / 150;
  return Math.ceil(minutes * 60); // seconds
}