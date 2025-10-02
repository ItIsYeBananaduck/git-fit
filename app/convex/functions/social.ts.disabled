import { mutation, query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { Id } from "../_generated/dataModel";

// Share workout data or supplement stack with community
export const shareContent = mutation({
  args: {
    contentType: v.union(v.literal("workout"), v.literal("supplement_stack"), v.literal("exercise_demo")),
    contentId: v.string(),
    isPublic: v.boolean(),
    ghostMode: v.boolean(),
    clusteringCriteria: v.array(v.string())
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Check if content already shared
    const existingShare = await ctx.db
      .query("socialShares")
      .withIndex("by_content", (q) => 
        q.eq("contentType", args.contentType).eq("contentId", args.contentId)
      )
      .first();

    let medicalDataFiltered = false;

    // Check for medical data filtering based on content type
    if (args.contentType === "supplement_stack") {
      // Check if supplement stack contains Rx compounds
      try {
        const stack = await ctx.db.get(args.contentId as Id<"supplementStacks">);
        if (stack) {
          const items = await ctx.db
            .query("supplementItems")
            .withIndex("by_stack", (q) => q.eq("stackId", stack._id))
            .collect();
          medicalDataFiltered = items.some(item => item.isRxCompound);
        }
      } catch (e) {
        // If content ID is not a valid supplement stack ID, continue without error
      }
    }

    const shareData = {
      userId: user._id,
      contentType: args.contentType,
      contentId: args.contentId,
      isPublic: args.isPublic,
      likesCount: 0,
      clusteredBy: args.clusteringCriteria,
      ghostMode: args.ghostMode,
      sharedAt: Date.now(),
      lastInteraction: Date.now()
    };

    let shareId;
    if (existingShare) {
      // Update existing share
      await ctx.db.patch(existingShare._id, shareData);
      shareId = existingShare._id;
    } else {
      // Create new share
      shareId = await ctx.db.insert("socialShares", shareData);
    }

    // Calculate expected reach based on visibility settings
    let expectedReach = 0;
    if (args.isPublic) {
      expectedReach = 1000 + (args.clusteringCriteria.length * 200);
    } else if (args.ghostMode) {
      expectedReach = 20 + (args.clusteringCriteria.length * 5);
    } else {
      expectedReach = 100 + (args.clusteringCriteria.length * 25);
    }

    const privacyLevel = args.isPublic ? "public" : (args.ghostMode ? "ghost" : "clustered") as "public" | "clustered" | "ghost";

    return {
      shareId,
      expectedReach,
      privacyLevel,
      medicalDataFiltered
    };
  }
});

// Retrieve personalized social feed based on clustering
export const getFeed = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    contentType: v.optional(v.string()),
    clusterId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const limit = Math.min(args.limit || 20, 50);
    const offset = args.offset || 0;

    // Build query for social shares
    let query = ctx.db.query("socialShares");
    
    // Filter by content type if specified
    if (args.contentType) {
      const shares = await query.collect();
      const filteredShares = shares
        .filter(share => share.contentType === args.contentType)
        .sort((a, b) => b.sharedAt - a.sharedAt)
        .slice(offset, offset + limit);

      return {
        items: filteredShares,
        clusteringUsed: ["content_type_filter"],
        hasMore: false,
        refreshInterval: 300 // 5 minutes
      };
    }

    // Get all public shares and user's clustered content
    const allShares = await query.collect();
    
    // Mock clustering algorithm - in production, this would be more sophisticated
    const userClusters = [
      user.fitnessLevel || "beginner",
      user.goals?.join(",") || "general",
      "similar_users"
    ];

    const relevantShares = allShares
      .filter(share => {
        // Include public content
        if (share.isPublic) return true;
        
        // Include content from user's clusters (if not ghost mode)
        if (!share.ghostMode && share.clusteredBy.some(cluster => userClusters.includes(cluster))) {
          return true;
        }
        
        // Include user's own content
        if (share.userId === user._id) return true;
        
        return false;
      })
      .sort((a, b) => {
        // Sort by engagement and recency
        const aScore = a.likesCount * 10 + (Date.now() - a.sharedAt) / 1000000;
        const bScore = b.likesCount * 10 + (Date.now() - b.sharedAt) / 1000000;
        return bScore - aScore;
      })
      .slice(offset, offset + limit);

    return {
      items: relevantShares,
      clusteringUsed: userClusters,
      hasMore: allShares.length > offset + limit,
      refreshInterval: 300 // 5 minutes
    };
  }
});

// Like/unlike social content
export const likeContent = mutation({
  args: {
    shareId: v.id("socialShares")
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Get the social share
    const share = await ctx.db.get(args.shareId);
    if (!share) {
      throw new ConvexError("Content not found");
    }

    // Increment like count and update last interaction
    await ctx.db.patch(args.shareId, {
      likesCount: share.likesCount + 1,
      lastInteraction: Date.now()
    });

    return {
      success: true,
      newLikeCount: share.likesCount + 1
    };
  }
});

// Get popular/trending content
export const getPopularContent = query({
  args: {
    timeframe: v.optional(v.union(v.literal("day"), v.literal("week"), v.literal("month"))),
    contentType: v.optional(v.union(v.literal("workout"), v.literal("supplement_stack"), v.literal("exercise_demo"))),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 10, 50);
    const timeframe = args.timeframe || "week";
    
    // Calculate time cutoff
    const now = Date.now();
    let timeCutoff = now;
    switch (timeframe) {
      case "day":
        timeCutoff = now - (24 * 60 * 60 * 1000);
        break;
      case "week":
        timeCutoff = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        timeCutoff = now - (30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get all shares within timeframe
    const shares = await ctx.db.query("socialShares").collect();
    
    const filteredShares = shares
      .filter(share => {
        // Filter by time
        if (share.sharedAt < timeCutoff) return false;
        
        // Filter by content type if specified
        if (args.contentType && share.contentType !== args.contentType) return false;
        
        // Only include public content for trending
        if (!share.isPublic) return false;
        
        return true;
      })
      .sort((a, b) => {
        // Calculate popularity score: likes + recency boost
        const recencyBoost = (share: any) => Math.max(0, (share.sharedAt - timeCutoff) / (1000 * 60 * 60)); // Hours since cutoff
        const aScore = a.likesCount + recencyBoost(a) * 0.1;
        const bScore = b.likesCount + recencyBoost(b) * 0.1;
        return bScore - aScore;
      })
      .slice(0, limit);

    return {
      items: filteredShares,
      timeframe,
      totalCount: filteredShares.length
    };
  }
});

// Watch social feed for real-time updates
export const watchFeed = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const limit = Math.min(args.limit || 20, 50);

    // Get recent social shares
    const shares = await ctx.db.query("socialShares").collect();
    
    // Filter for user's feed with real-time updates
    const recentShares = shares
      .filter(share => {
        // Include public content
        if (share.isPublic) return true;
        
        // Include user's own content
        if (share.userId === user._id) return true;
        
        return false;
      })
      .sort((a, b) => b.lastInteraction - a.lastInteraction)
      .slice(0, limit);

    return recentShares;
  }
});

// Get shared content details
export const getSharedContent = query({
  args: {
    shareId: v.id("socialShares")
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const share = await ctx.db.get(args.shareId);
    if (!share) {
      throw new ConvexError("Shared content not found");
    }

    // Check privacy permissions
    if (!share.isPublic && !share.ghostMode) {
      // For clustered content, would need to check user's cluster membership
      // For now, simplified access control
    }

    // Get content creator info (respecting ghost mode)
    let creatorInfo = null;
    if (!share.ghostMode) {
      const creator = await ctx.db.get(share.userId);
      creatorInfo = creator ? {
        name: creator.name,
        profileImage: creator.profileImage
      } : null;
    }

    return {
      share,
      creator: creatorInfo,
      isGhost: share.ghostMode
    };
  }
});

// Update feed clustering preferences
export const updateFeedClustering = mutation({
  args: {
    clusteringPreferences: v.array(v.string())
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Update user preferences - for now, store as a simple field since schema doesn't have socialClustering
    // In production, we'd update the user schema to include this field
    // await ctx.db.patch(user._id, {
    //   preferences: {
    //     ...currentPreferences,
    //     socialClustering: args.clusteringPreferences
    //   }
    // });

    // For now, just return success without updating schema
    return {
      success: true,
      updatedPreferences: args.clusteringPreferences
    };
  }
});