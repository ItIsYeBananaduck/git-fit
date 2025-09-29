/**
 * Convex Functions: Audio Cache Management
 * Task: T034 - Implement audio cache CRUD operations
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Create a new audio cache entry
 */
export const createAudioCache = mutation({
    args: {
        cache_key: v.string(),
        audio_url: v.string(),
        file_size: v.number(),
        audio_length: v.number(),
        metadata: v.object({
            text_content: v.string(),
            persona_id: v.string(),
            voice_settings: v.optional(v.object({
                stability: v.number(),
                similarity_boost: v.number(),
                style: v.optional(v.number()),
                speaker_boost: v.optional(v.boolean()),
            })),
            generation_cost: v.optional(v.number()),
            file_format: v.optional(v.string()),
        }),
        expires_at: v.number(),
    },
    handler: async (ctx, args) => {
        // Check if cache entry already exists
        const existingEntry = await ctx.db
            .query("audioCache")
            .filter((q) => q.eq(q.field("cache_key"), args.cache_key))
            .first();

        if (existingEntry) {
            // Update existing entry
            await ctx.db.patch(existingEntry._id, {
                audio_url: args.audio_url,
                file_size: args.file_size,
                audio_length: args.audio_length,
                metadata: args.metadata,
                expires_at: args.expires_at,
                last_accessed: Date.now(),
                access_count: (existingEntry.access_count || 0) + 1,
                updated_at: Date.now(),
            });
            return existingEntry._id;
        }

        // Create new cache entry
        const cacheId = await ctx.db.insert("audioCache", {
            ...args,
            access_count: 0,
            last_accessed: Date.now(),
            created_at: Date.now(),
            updated_at: Date.now(),
        });

        return cacheId;
    },
});

/**
 * Get audio cache entry by cache key
 */
export const getAudioCache = query({
    args: { cache_key: v.string() },
    handler: async (ctx, args) => {
        const cacheEntry = await ctx.db
            .query("audioCache")
            .filter((q) => q.eq(q.field("cache_key"), args.cache_key))
            .first();

        if (!cacheEntry) {
            return null;
        }

        // Check if cache entry has expired
        if (cacheEntry.expires_at < Date.now()) {
            return null;
        }

        return {
            _id: cacheEntry._id,
            cache_key: cacheEntry.cache_key,
            audio_url: cacheEntry.audio_url,
            file_size: cacheEntry.file_size,
            audio_length: cacheEntry.audio_length,
            metadata: cacheEntry.metadata,
            access_count: cacheEntry.access_count,
            last_accessed: cacheEntry.last_accessed,
            created_at: cacheEntry.created_at,
        };
    },
});

/**
 * Update cache access (increment access count and update last accessed time)
 */
export const updateCacheAccess = mutation({
    args: { cache_key: v.string() },
    handler: async (ctx, args) => {
        const cacheEntry = await ctx.db
            .query("audioCache")
            .filter((q) => q.eq(q.field("cache_key"), args.cache_key))
            .first();

        if (!cacheEntry) {
            throw new Error("Cache entry not found");
        }

        await ctx.db.patch(cacheEntry._id, {
            access_count: (cacheEntry.access_count || 0) + 1,
            last_accessed: Date.now(),
            updated_at: Date.now(),
        });

        return cacheEntry._id;
    },
});

/**
 * Get all cache entries (for admin/debugging)
 */
export const getAllCacheEntries = query({
    args: {
        limit: v.optional(v.number()),
        include_expired: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        let cacheEntries = await ctx.db
            .query("audioCache")
            .order("desc")
            .collect();

        // Filter out expired entries unless specifically requested
        if (!args.include_expired) {
            const currentTime = Date.now();
            cacheEntries = cacheEntries.filter((entry) => entry.expires_at > currentTime);
        }

        // Apply limit
        if (args.limit) {
            cacheEntries = cacheEntries.slice(0, args.limit);
        }

        return cacheEntries.map((entry) => ({
            _id: entry._id,
            cache_key: entry.cache_key,
            file_size: entry.file_size,
            audio_length: entry.audio_length,
            access_count: entry.access_count,
            last_accessed: entry.last_accessed,
            expires_at: entry.expires_at,
            created_at: entry.created_at,
            is_expired: entry.expires_at < Date.now(),
        }));
    },
});

/**
 * Delete expired cache entries
 */
export const cleanupExpiredCache = mutation({
    handler: async (ctx) => {
        const currentTime = Date.now();

        const expiredEntries = await ctx.db
            .query("audioCache")
            .filter((q) => q.lt(q.field("expires_at"), currentTime))
            .collect();

        let deletedCount = 0;
        for (const entry of expiredEntries) {
            await ctx.db.delete(entry._id);
            deletedCount++;
        }

        return {
            deleted_count: deletedCount,
            cleanup_time: currentTime,
        };
    },
});

/**
 * Delete least recently used cache entries to free space
 */
export const cleanupLRUCache = mutation({
    args: { target_count: v.number() },
    handler: async (ctx, args) => {
        const allEntries = await ctx.db
            .query("audioCache")
            .collect();

        if (allEntries.length <= args.target_count) {
            return { deleted_count: 0, message: "No cleanup needed" };
        }

        // Sort by last accessed time (oldest first)
        const sortedEntries = allEntries.sort((a, b) => a.last_accessed - b.last_accessed);
        const entriesToDelete = sortedEntries.slice(0, allEntries.length - args.target_count);

        let deletedCount = 0;
        for (const entry of entriesToDelete) {
            await ctx.db.delete(entry._id);
            deletedCount++;
        }

        return {
            deleted_count: deletedCount,
            remaining_count: args.target_count,
            cleanup_time: Date.now(),
        };
    },
});

/**
 * Get cache statistics
 */
export const getCacheStats = query({
    handler: async (ctx) => {
        const allEntries = await ctx.db.query("audioCache").collect();
        const currentTime = Date.now();

        const activeEntries = allEntries.filter((entry) => entry.expires_at > currentTime);
        const expiredEntries = allEntries.filter((entry) => entry.expires_at <= currentTime);

        // Calculate total storage usage
        const totalStorage = allEntries.reduce((sum, entry) => sum + entry.file_size, 0);
        const activeStorage = activeEntries.reduce((sum, entry) => sum + entry.file_size, 0);

        // Calculate total audio duration
        const totalDuration = allEntries.reduce((sum, entry) => sum + entry.audio_length, 0);
        const activeDuration = activeEntries.reduce((sum, entry) => sum + entry.audio_length, 0);

        // Access statistics
        const totalAccesses = allEntries.reduce((sum, entry) => sum + (entry.access_count || 0), 0);
        const avgAccessesPerEntry = allEntries.length > 0 ? totalAccesses / allEntries.length : 0;

        // Find most accessed entries
        const topAccessed = allEntries
            .sort((a, b) => (b.access_count || 0) - (a.access_count || 0))
            .slice(0, 5)
            .map((entry) => ({
                cache_key: entry.cache_key,
                access_count: entry.access_count || 0,
                persona_id: entry.metadata.persona_id,
            }));

        // Cache hit rate estimation (based on access patterns)
        const recentAccesses = allEntries.filter((entry) =>
            entry.last_accessed > currentTime - (7 * 24 * 60 * 60 * 1000) // Last 7 days
        );

        return {
            total_entries: allEntries.length,
            active_entries: activeEntries.length,
            expired_entries: expiredEntries.length,
            total_storage_bytes: totalStorage,
            active_storage_bytes: activeStorage,
            total_duration_seconds: Math.round(totalDuration),
            active_duration_seconds: Math.round(activeDuration),
            total_accesses: totalAccesses,
            avg_accesses_per_entry: Math.round(avgAccessesPerEntry * 100) / 100,
            recent_active_entries: recentAccesses.length,
            top_accessed_entries: topAccessed,
            storage_efficiency: allEntries.length > 0 ? (activeEntries.length / allEntries.length) * 100 : 0,
        };
    },
});

/**
 * Search cache entries by persona or text content
 */
export const searchCacheEntries = query({
    args: {
        persona_id: v.optional(v.string()),
        text_query: v.optional(v.string()),
        min_access_count: v.optional(v.number()),
        active_only: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        let entries = await ctx.db.query("audioCache").collect();

        // Filter by active status
        if (args.active_only) {
            const currentTime = Date.now();
            entries = entries.filter((entry) => entry.expires_at > currentTime);
        }

        // Filter by persona
        if (args.persona_id) {
            entries = entries.filter((entry) =>
                entry.metadata.persona_id === args.persona_id
            );
        }

        // Filter by text content
        if (args.text_query) {
            const query = args.text_query.toLowerCase();
            entries = entries.filter((entry) =>
                entry.metadata.text_content.toLowerCase().includes(query)
            );
        }

        // Filter by minimum access count
        if (args.min_access_count) {
            entries = entries.filter((entry) =>
                (entry.access_count || 0) >= args.min_access_count
            );
        }

        // Sort by access count (most accessed first)
        entries.sort((a, b) => (b.access_count || 0) - (a.access_count || 0));

        return entries.map((entry) => ({
            _id: entry._id,
            cache_key: entry.cache_key,
            text_content: entry.metadata.text_content,
            persona_id: entry.metadata.persona_id,
            file_size: entry.file_size,
            audio_length: entry.audio_length,
            access_count: entry.access_count || 0,
            last_accessed: entry.last_accessed,
            created_at: entry.created_at,
            is_expired: entry.expires_at < Date.now(),
        }));
    },
});

/**
 * Delete specific cache entry
 */
export const deleteCacheEntry = mutation({
    args: { cache_key: v.string() },
    handler: async (ctx, args) => {
        const cacheEntry = await ctx.db
            .query("audioCache")
            .filter((q) => q.eq(q.field("cache_key"), args.cache_key))
            .first();

        if (!cacheEntry) {
            throw new Error("Cache entry not found");
        }

        await ctx.db.delete(cacheEntry._id);
        return cacheEntry._id;
    },
});

/**
 * Update cache entry TTL (extend expiration)
 */
export const extendCacheTTL = mutation({
    args: {
        cache_key: v.string(),
        additional_hours: v.number(),
    },
    handler: async (ctx, args) => {
        const cacheEntry = await ctx.db
            .query("audioCache")
            .filter((q) => q.eq(q.field("cache_key"), args.cache_key))
            .first();

        if (!cacheEntry) {
            throw new Error("Cache entry not found");
        }

        const additionalMs = args.additional_hours * 60 * 60 * 1000;
        const newExpirationTime = cacheEntry.expires_at + additionalMs;

        await ctx.db.patch(cacheEntry._id, {
            expires_at: newExpirationTime,
            updated_at: Date.now(),
        });

        return {
            cache_key: args.cache_key,
            old_expiration: cacheEntry.expires_at,
            new_expiration: newExpirationTime,
        };
    },
});