import { mutation, query, action } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { Id } from "../_generated/dataModel";

// Process barcode scan and create supplement item
export const scanItem = mutation({
  args: {
    barcode: v.string(),
    dosage: v.optional(v.string()),
    timing: v.optional(v.string())
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

    // Get or create user's supplement stack
    let stack = await ctx.db
      .query("supplementStacks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!stack) {
      // Create new stack
      const now = Date.now();
      const stackId = await ctx.db.insert("supplementStacks", {
        userId: user._id,
        scanDate: now,
        lockUntilDate: now + (28 * 24 * 60 * 60 * 1000), // 28 days in milliseconds
        isLocked: false,
        lastModification: now,
        isShared: false,
        autoWipeDate: now + (52 * 7 * 24 * 60 * 60 * 1000) // 52 weeks in milliseconds
      });
      
      stack = await ctx.db.get(stackId);
    } else if (stack.isLocked) {
      throw new ConvexError("Supplement stack is locked. Cannot add new items.");
    }

    // Mock data - in real implementation, this would query OpenFoodFacts API
    const mockSupplementData = {
      name: `Supplement ${args.barcode.slice(-4)}`, // Mock name based on barcode
      isRxCompound: args.barcode.startsWith("Rx") || args.barcode.includes("prescription"),
      nutritionFacts: {
        servingSize: "1 capsule",
        calories: 5,
        ingredients: ["Vitamin D3", "Magnesium", "Zinc"]
      }
    };

    // Create supplement item
    const itemId = await ctx.db.insert("supplementItems", {
      stackId: stack!._id,
      barcode: args.barcode,
      name: mockSupplementData.name,
      dosage: args.dosage || "As directed",
      timing: args.timing || "With meals",
      isRxCompound: mockSupplementData.isRxCompound,
      publicHash: mockSupplementData.isRxCompound ? undefined : `hash_${args.barcode}`,
      categoryType: "supplement"
    });

    // Update stack modification time
    await ctx.db.patch(stack!._id, {
      lastModification: Date.now()
    });

    // Generate warning flags
    const warningFlags: string[] = [];
    if (mockSupplementData.isRxCompound) {
      warningFlags.push("prescription_compound");
    }
    if (args.barcode.includes("caffeine")) {
      warningFlags.push("contains_stimulants");
    }

    return {
      item: {
        itemId,
        name: mockSupplementData.name,
        isRxCompound: mockSupplementData.isRxCompound,
        publicHash: mockSupplementData.isRxCompound ? undefined : `hash_${args.barcode}`
      },
      nutritionFacts: mockSupplementData.nutritionFacts,
      warningFlags
    };
  }
});

// Create or update user's supplement stack
export const createStack = mutation({
  args: {
    supplementItems: v.array(v.id("supplementItems")),
    performanceBaseline: v.optional(v.object({
      avgIntensityScore: v.number(),
      avgRecoveryTime: v.number(),
      workoutFrequency: v.number()
    })),
    replaceExisting: v.boolean()
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

    // Check for existing stack
    let stack = await ctx.db
      .query("supplementStacks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const now = Date.now();
    const lockUntilDate = now + (28 * 24 * 60 * 60 * 1000); // 28 days
    const autoWipeDate = now + (52 * 7 * 24 * 60 * 60 * 1000); // 52 weeks

    if (stack && args.replaceExisting) {
      // Update existing stack
      await ctx.db.patch(stack._id, {
        scanDate: now,
        lockUntilDate,
        isLocked: false,
        performanceBaseline: args.performanceBaseline,
        lastModification: now,
        autoWipeDate
      });
    } else if (!stack) {
      // Create new stack
      const stackId = await ctx.db.insert("supplementStacks", {
        userId: user._id,
        scanDate: now,
        lockUntilDate,
        isLocked: false,
        performanceBaseline: args.performanceBaseline,
        lastModification: now,
        isShared: false,
        autoWipeDate
      });
      
      stack = await ctx.db.get(stackId);
    } else if (stack.isLocked) {
      throw new ConvexError("Cannot modify locked supplement stack");
    }

    return {
      stackId: stack!._id,
      isLocked: false,
      lockUntilDate,
      supplementCount: args.supplementItems.length,
      autoWipeDate
    };
  }
});

// Retrieve user's current supplement stack
export const getStack = query({
  args: {
    userId: v.optional(v.id("users")),
    includeRx: v.optional(v.boolean()),
    format: v.optional(v.union(v.literal("full"), v.literal("public")))
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    // Use provided userId or current user
    const targetUserId = args.userId || currentUser._id;
    const isOwner = targetUserId === currentUser._id;
    
    // Privacy checks
    const includeRx = (args.includeRx && isOwner) || false;
    const format = args.format || (isOwner ? "full" : "public");

    // Get supplement stack
    const stack = await ctx.db
      .query("supplementStacks")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .first();

    if (!stack) {
      return {
        stack: null,
        privacyNote: "No supplement stack found"
      };
    }

    // Get supplement items
    let items = await ctx.db
      .query("supplementItems")
      .withIndex("by_stack", (q) => q.eq("stackId", stack._id))
      .collect();

    // Filter out Rx items if not owner or not requested
    if (!includeRx) {
      items = items.filter(item => !item.isRxCompound);
    }

    // Calculate mock performance correlation
    const performanceCorrelation = stack.performanceBaseline ? {
      workoutImprovements: Math.round(Math.random() * 15 + 5), // Mock 5-20% improvement
      recoveryImprovements: Math.round(Math.random() * 10 + 5), // Mock 5-15% improvement
      confidenceScore: Math.round(Math.random() * 30 + 70) // Mock 70-100% confidence
    } : undefined;

    const result = {
      stack: {
        stackId: stack._id,
        items: items,
        scanDate: stack.scanDate,
        isLocked: stack.isLocked,
        lockUntilDate: stack.isLocked ? stack.lockUntilDate : undefined,
        performanceCorrelation: isOwner ? performanceCorrelation : undefined
      },
      privacyNote: !isOwner ? "Prescription items hidden for privacy" : undefined
    };

    return result;
  }
});

// Lock supplement stack (28-day lock after completion)
export const lockStack = mutation({
  args: {
    stackId: v.id("supplementStacks")
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

    // Get stack and verify ownership
    const stack = await ctx.db.get(args.stackId);
    if (!stack) {
      throw new ConvexError("Supplement stack not found");
    }

    if (stack.userId !== user._id) {
      throw new ConvexError("Access denied");
    }

    if (stack.isLocked) {
      throw new ConvexError("Stack is already locked");
    }

    // Lock the stack
    const lockUntilDate = Date.now() + (28 * 24 * 60 * 60 * 1000); // 28 days
    await ctx.db.patch(args.stackId, {
      isLocked: true,
      lockUntilDate
    });

    return {
      success: true,
      lockUntilDate,
      message: "Stack locked for 28 days to establish performance baseline"
    };
  }
});

// Share supplement stack with community
export const shareStack = mutation({
  args: {
    stackId: v.id("supplementStacks"),
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

    // Get stack and verify ownership
    const stack = await ctx.db.get(args.stackId);
    if (!stack) {
      throw new ConvexError("Supplement stack not found");
    }

    if (stack.userId !== user._id) {
      throw new ConvexError("Access denied");
    }

    // Check for Rx compounds
    const items = await ctx.db
      .query("supplementItems")
      .withIndex("by_stack", (q) => q.eq("stackId", args.stackId))
      .collect();

    const hasRxCompounds = items.some(item => item.isRxCompound);

    // Create or update social share
    const existingShare = await ctx.db
      .query("socialShares")
      .withIndex("by_content", (q) => 
        q.eq("contentType", "supplement_stack").eq("contentId", args.stackId)
      )
      .first();

    const shareData = {
      userId: user._id,
      contentType: "supplement_stack" as const,
      contentId: args.stackId,
      isPublic: args.isPublic,
      likesCount: 0,
      clusteredBy: args.clusteringCriteria,
      ghostMode: args.ghostMode,
      sharedAt: Date.now(),
      lastInteraction: Date.now()
    };

    let shareId;
    if (existingShare) {
      await ctx.db.patch(existingShare._id, shareData);
      shareId = existingShare._id;
    } else {
      shareId = await ctx.db.insert("socialShares", shareData);
    }

    // Update stack sharing status
    await ctx.db.patch(args.stackId, {
      isShared: true
    });

    // Calculate expected reach (mock calculation)
    const baseReach = args.isPublic ? 1000 : 50;
    const clusterMultiplier = args.clusteringCriteria.length * 1.5;
    const expectedReach = Math.round(baseReach * clusterMultiplier);

    return {
      shareId,
      expectedReach,
      privacyLevel: args.isPublic ? "public" : (args.ghostMode ? "ghost" : "clustered") as "public" | "clustered" | "ghost",
      medicalDataFiltered: hasRxCompounds
    };
  }
});

// Get supplement information by barcode (action for external API calls)
export const getSupplementInfo = action({
  args: {
    barcode: v.string()
  },
  handler: async (ctx, args) => {
    // Validate authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // In a real implementation, this would call OpenFoodFacts API
    // For now, return mock data
    try {
      // Mock external API call
      // const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${args.barcode}.json`);
      // const data = await response.json();
      
      // Mock response
      const mockData = {
        name: `Product ${args.barcode.slice(-4)}`,
        categoryType: "supplement",
        nutritionFacts: {
          servingSize: "1 serving",
          calories: 0,
          ingredients: ["Mock Ingredient 1", "Mock Ingredient 2"]
        },
        isRxCompound: args.barcode.startsWith("Rx"),
        ingredients: ["Mock Ingredient 1", "Mock Ingredient 2"]
      };

      return mockData;
      
    } catch (error) {
      throw new ConvexError("Failed to fetch supplement information");
    }
  }
});