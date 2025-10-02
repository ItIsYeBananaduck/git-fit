import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper function to check data sharing permissions
async function checkNutritionDataAccess(ctx, clientId, trainerId) {
  // Check if trainer has active data sharing permission for nutrition data
  const sharingPermission = await ctx.db
    .query("healthDataSharing")
    .withIndex("by_client", (q) => q.eq("clientId", clientId))
    .filter((q) =>
      q.and(
        q.eq(q.field("trainerId"), trainerId),
        q.eq(q.field("isActive"), true),
        q.neq(q.field("revokedAt"), undefined)
      )
    )
    .first();

  if (!sharingPermission) {
    throw new Error("No active data sharing permission for nutrition data");
  }

  // Check if nutrition data is included in shared data types
  if (!sharingPermission.sharedDataTypes.includes("nutrition")) {
    throw new Error("Nutrition data sharing not permitted");
  }

  return sharingPermission;
}

// Get user's nutrition goals
export const getNutritionGoals = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const { userId } = args;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Users can view their own goals, trainers can view client goals if permission granted
    const currentUserId = identity.subject;

    if (currentUserId !== userId) {
      // Check if current user is a trainer with access to this client's data
      await checkNutritionDataAccess(ctx, userId, currentUserId);
    }

    return await ctx.db
      .query("nutritionGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Get active nutrition goal for user
export const getActiveNutritionGoal = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const { userId } = args;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUserId = identity.subject;

    if (currentUserId !== userId) {
      await checkNutritionDataAccess(ctx, userId, currentUserId);
    }

    return await ctx.db
      .query("nutritionGoals")
      .withIndex("by_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .first();
  },
});

// Create nutrition goal
export const createNutritionGoal = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    fiber: v.number(),
    sugar: v.number(),
    sodium: v.number(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUserId = identity.subject;
    const { userId, ...goalData } = args;

    // Users can create their own goals, trainers can create goals for clients if permission granted
    if (currentUserId !== userId) {
      await checkNutritionDataAccess(ctx, userId, currentUserId);
    }

    // Deactivate existing active goals for this user
    const existingActiveGoals = await ctx.db
      .query("nutritionGoals")
      .withIndex("by_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .collect();

    for (const goal of existingActiveGoals) {
      await ctx.db.patch(goal._id, { isActive: false, updatedAt: new Date().toISOString() });
    }

    // Create new goal
    return await ctx.db.insert("nutritionGoals", {
      ...goalData,
      userId,
      isActive: true,
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

// Get food entries for user and date
export const getFoodEntries = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, date } = args;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUserId = identity.subject;

    if (currentUserId !== userId) {
      await checkNutritionDataAccess(ctx, userId, currentUserId);
    }

    const entries = await ctx.db
      .query("foodEntries")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", date))
      .collect();

    // Get food details for each entry
    const entriesWithFood = await Promise.all(
      entries.map(async (entry) => {
        const food = await ctx.db.get(entry.foodId);
        return {
          ...entry,
          food: food ? {
            id: food._id,
            name: food.name,
            brand: food.brand,
            category: food.category,
          } : null,
        };
      })
    );

    return entriesWithFood;
  },
});

// Add food entry
export const addFoodEntry = mutation({
  args: {
    userId: v.id("users"),
    foodId: v.id("foodDatabase"),
    servingSize: v.number(),
    mealType: v.union(v.literal("breakfast"), v.literal("lunch"), v.literal("dinner"), v.literal("snack")),
    date: v.string(),
    time: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUserId = identity.subject;
    const { userId, foodId, ...entryData } = args;

    // Users can add their own entries, trainers can add entries for clients if permission granted
    if (currentUserId !== userId) {
      await checkNutritionDataAccess(ctx, userId, currentUserId);
    }

    // Get food nutrition data
    const food = await ctx.db.get(foodId);
    if (!food) {
      throw new Error("Food not found");
    }

    // Calculate nutrition for serving size
    const multiplier = entryData.servingSize / 100;
    const nutrition = {
      calories: Math.round(food.nutritionPer100g.calories * multiplier),
      protein: Math.round(food.nutritionPer100g.protein * multiplier * 10) / 10,
      carbs: Math.round(food.nutritionPer100g.carbs * multiplier * 10) / 10,
      fat: Math.round(food.nutritionPer100g.fat * multiplier * 10) / 10,
      fiber: Math.round(food.nutritionPer100g.fiber * multiplier * 10) / 10,
      sugar: Math.round(food.nutritionPer100g.sugar * multiplier * 10) / 10,
      sodium: Math.round(food.nutritionPer100g.sodium * multiplier),
    };

    return await ctx.db.insert("foodEntries", {
      ...entryData,
      userId,
      foodId,
      nutrition,
      loggedBy: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

// Delete food entry
export const deleteFoodEntry = mutation({
  args: { entryId: v.id("foodEntries") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUserId = identity.subject;

    // Get the entry to check ownership
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Food entry not found");
    }

    // Users can delete their own entries, trainers can delete entries they logged for clients
    if (currentUserId !== entry.userId && currentUserId !== entry.loggedBy) {
      await checkNutritionDataAccess(ctx, entry.userId, currentUserId);
    }

    await ctx.db.delete(args.entryId);
  },
});

// Get daily nutrition totals
export const getDailyNutritionTotals = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, date } = args;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUserId = identity.subject;

    if (currentUserId !== userId) {
      await checkNutritionDataAccess(ctx, userId, currentUserId);
    }

    const entries = await ctx.db
      .query("foodEntries")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", date))
      .collect();

    // Calculate totals
    const totals = entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.nutrition.calories,
        protein: acc.protein + entry.nutrition.protein,
        carbs: acc.carbs + entry.nutrition.carbs,
        fat: acc.fat + entry.nutrition.fat,
        fiber: acc.fiber + entry.nutrition.fiber,
        sugar: acc.sugar + entry.nutrition.sugar,
        sodium: acc.sodium + entry.nutrition.sodium,
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      }
    );

    return totals;
  },
});

// Search food database
export const searchFoods = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query, limit = 20 } = args;

    if (!query.trim()) {
      return [];
    }

    // Search by name (case-insensitive)
    const foods = await ctx.db
      .query("foodDatabase")
      .filter((q) =>
        q.or(
          q.eq(q.field("name"), query),
          q.gte(q.field("name"), query.toLowerCase()),
          q.lt(q.field("name"), query.toLowerCase() + "\uffff")
        )
      )
      .take(limit);

    return foods.map(food => ({
      id: food._id,
      name: food.name,
      brand: food.brand,
      category: food.category,
      nutritionPer100g: food.nutritionPer100g,
      verified: food.verified,
    }));
  },
});

// Get food by barcode
export const getFoodByBarcode = query({
  args: { barcode: v.string() },
  handler: async (ctx, args) => {
    const food = await ctx.db
      .query("foodDatabase")
      .withIndex("by_barcode", (q) => q.eq("barcode", args.barcode))
      .first();

    if (!food) {
      return null;
    }

    return {
      id: food._id,
      name: food.name,
      brand: food.brand,
      category: food.category,
      nutritionPer100g: food.nutritionPer100g,
      servingSizes: food.servingSizes,
      verified: food.verified,
    };
  },
});

// Create custom food
export const createCustomFood = mutation({
  args: {
    name: v.string(),
    brand: v.optional(v.string()),
    category: v.string(),
    nutritionPer100g: v.object({
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      fiber: v.number(),
      sugar: v.number(),
      sodium: v.number(),
    }),
    servingSizes: v.array(v.object({
      name: v.string(),
      grams: v.number(),
      description: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("foodDatabase", {
      ...args,
      verified: false,
      source: "manual",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

// Get meal plans for client
export const getMealPlans = query({
  args: { clientId: v.id("users") },
  handler: async (ctx, args) => {
    const { clientId } = args;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUserId = identity.subject;

    // Check if current user has access to this client's nutrition data
    if (currentUserId !== clientId) {
      await checkNutritionDataAccess(ctx, clientId, currentUserId);
    }

    return await ctx.db
      .query("mealPlans")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .collect();
  },
});

// Create meal plan
export const createMealPlan = mutation({
  args: {
    clientId: v.id("users"),
    name: v.string(),
    description: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    goals: v.array(v.string()),
    preferences: v.optional(v.object({
      dietaryRestrictions: v.array(v.string()),
      allergies: v.array(v.string()),
      cuisinePreferences: v.array(v.string()),
      budget: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUserId = identity.subject;
    const { clientId, ...planData } = args;

    // Only trainers can create meal plans for clients
    await checkNutritionDataAccess(ctx, clientId, currentUserId);

    return await ctx.db.insert("mealPlans", {
      ...planData,
      clientId,
      trainerId: currentUserId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

// Get nutrition progress
export const getNutritionProgress = query({
  args: {
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, startDate, endDate } = args;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUserId = identity.subject;

    if (currentUserId !== userId) {
      await checkNutritionDataAccess(ctx, userId, currentUserId);
    }

    return await ctx.db
      .query("nutritionProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        )
      )
      .collect();
  },
});