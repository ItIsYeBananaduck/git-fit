/**
 * Convex Functions: AI Coaching Personas Management
 * Task: T029 - Implement personas CRUD operations
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Create a new AI coaching persona
 */
export const createPersona = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        voice_id: v.string(),
        personality_traits: v.array(v.string()),
        coaching_style: v.string(),
        expertise_areas: v.array(v.string()),
        sample_phrases: v.array(v.string()),
        response_templates: v.object({
            motivation: v.string(),
            correction: v.string(),
            encouragement: v.string(),
            instruction: v.string(),
        }),
        voice_settings: v.object({
            stability: v.number(),
            similarity_boost: v.number(),
            style: v.optional(v.number()),
            speaker_boost: v.optional(v.boolean()),
        }),
        active: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // Check if persona name already exists
        const existingPersona = await ctx.db
            .query("aiCoachingPersonas")
            .filter((q) => q.eq(q.field("name"), args.name))
            .first();

        if (existingPersona) {
            throw new Error(`Persona with name "${args.name}" already exists`);
        }

        // Create persona with timestamps
        const personaId = await ctx.db.insert("aiCoachingPersonas", {
            ...args,
            active: args.active ?? true,
            created_at: Date.now(),
            updated_at: Date.now(),
        });

        return personaId;
    },
});

/**
 * Get all active AI coaching personas
 */
export const getActivePersonas = query({
    handler: async (ctx) => {
        const personas = await ctx.db
            .query("aiCoachingPersonas")
            .filter((q) => q.eq(q.field("active"), true))
            .collect();

        return personas.map((persona) => ({
            _id: persona._id,
            name: persona.name,
            description: persona.description,
            voice_id: persona.voice_id,
            personality_traits: persona.personality_traits,
            coaching_style: persona.coaching_style,
            expertise_areas: persona.expertise_areas,
            voice_settings: persona.voice_settings,
        }));
    },
});

/**
 * Get a specific persona by ID
 */
export const getPersona = query({
    args: { personaId: v.id("aiCoachingPersonas") },
    handler: async (ctx, args) => {
        const persona = await ctx.db.get(args.personaId);

        if (!persona) {
            throw new Error("Persona not found");
        }

        return persona;
    },
});

/**
 * Update an existing persona
 */
export const updatePersona = mutation({
    args: {
        personaId: v.id("aiCoachingPersonas"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        voice_id: v.optional(v.string()),
        personality_traits: v.optional(v.array(v.string())),
        coaching_style: v.optional(v.string()),
        expertise_areas: v.optional(v.array(v.string())),
        sample_phrases: v.optional(v.array(v.string())),
        response_templates: v.optional(v.object({
            motivation: v.string(),
            correction: v.string(),
            encouragement: v.string(),
            instruction: v.string(),
        })),
        voice_settings: v.optional(v.object({
            stability: v.number(),
            similarity_boost: v.number(),
            style: v.optional(v.number()),
            speaker_boost: v.optional(v.boolean()),
        })),
        active: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { personaId, ...updates } = args;

        // Check if persona exists
        const existingPersona = await ctx.db.get(personaId);
        if (!existingPersona) {
            throw new Error("Persona not found");
        }

        // If updating name, check for duplicates
        if (updates.name && updates.name !== existingPersona.name) {
            const duplicatePersona = await ctx.db
                .query("aiCoachingPersonas")
                .filter((q) => q.eq(q.field("name"), updates.name))
                .first();

            if (duplicatePersona) {
                throw new Error(`Persona with name "${updates.name}" already exists`);
            }
        }

        // Update persona with timestamp
        await ctx.db.patch(personaId, {
            ...updates,
            updated_at: Date.now(),
        });

        return personaId;
    },
});

/**
 * Delete a persona (soft delete by setting active to false)
 */
export const deletePersona = mutation({
    args: { personaId: v.id("aiCoachingPersonas") },
    handler: async (ctx, args) => {
        const persona = await ctx.db.get(args.personaId);

        if (!persona) {
            throw new Error("Persona not found");
        }

        await ctx.db.patch(args.personaId, {
            active: false,
            updated_at: Date.now(),
        });

        return args.personaId;
    },
});

/**
 * Get persona statistics (usage counts, popular phrases, etc.)
 */
export const getPersonaStats = query({
    args: { personaId: v.id("aiCoachingPersonas") },
    handler: async (ctx, args) => {
        const persona = await ctx.db.get(args.personaId);

        if (!persona) {
            throw new Error("Persona not found");
        }

        // Count voice responses for this persona
        const responseCount = await ctx.db
            .query("voiceResponses")
            .filter((q) => q.eq(q.field("persona_id"), args.personaId))
            .collect()
            .then((responses) => responses.length);

        // Count active subscriptions for this persona
        const subscriptionCount = await ctx.db
            .query("userSubscriptions")
            .filter((q) =>
                q.and(
                    q.eq(q.field("persona_id"), args.personaId),
                    q.eq(q.field("status"), "active")
                )
            )
            .collect()
            .then((subs) => subs.length);

        return {
            persona_id: args.personaId,
            total_responses: responseCount,
            active_subscriptions: subscriptionCount,
            created_at: persona.created_at,
            last_updated: persona.updated_at,
        };
    },
});

/**
 * Search personas by expertise area or coaching style
 */
export const searchPersonas = query({
    args: {
        query: v.string(),
        expertise_area: v.optional(v.string()),
        coaching_style: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let personas = await ctx.db
            .query("aiCoachingPersonas")
            .filter((q) => q.eq(q.field("active"), true))
            .collect();

        // Filter by expertise area if provided
        if (args.expertise_area) {
            personas = personas.filter((persona) =>
                persona.expertise_areas.includes(args.expertise_area!)
            );
        }

        // Filter by coaching style if provided
        if (args.coaching_style) {
            personas = personas.filter((persona) =>
                persona.coaching_style === args.coaching_style
            );
        }

        // Search in name, description, and personality traits
        if (args.query) {
            const searchTerm = args.query.toLowerCase();
            personas = personas.filter((persona) =>
                persona.name.toLowerCase().includes(searchTerm) ||
                persona.description.toLowerCase().includes(searchTerm) ||
                persona.personality_traits.some(trait =>
                    trait.toLowerCase().includes(searchTerm)
                )
            );
        }

        return personas.map((persona) => ({
            _id: persona._id,
            name: persona.name,
            description: persona.description,
            coaching_style: persona.coaching_style,
            expertise_areas: persona.expertise_areas,
            personality_traits: persona.personality_traits,
        }));
    },
});