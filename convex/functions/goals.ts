import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';

// Create a primary goal
export const createPrimaryGoal = mutation({
  args: {
    userId: v.string(),
    goalType: v.string(),
    details: v.object({}),
    priority: v.number(),
  },
  handler: async ({ db }, { userId, goalType, details, priority }) => {
    const now = Date.now();

    // First, deactivate any existing primary goals for this user
    const existingPrimaryGoals = await db
      .query('goals')
      .filter(q => q.eq(q.field('userId'), userId))
      .filter(q => q.eq(q.field('goalType'), 'primary'))
      .collect();

    for (const goal of existingPrimaryGoals) {
      await db.patch(goal._id, { isActive: false, updatedAt: now });
    }

    // Create the new primary goal
    const id = await db.insert('goals', {
      userId,
      goalType: 'primary',
      primaryGoalType: goalType,
      secondaryGoalType: '',
      details,
      priority,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id };
  },
});

// Create a secondary goal
export const createSecondaryGoal = mutation({
  args: {
    userId: v.string(),
    goalType: v.string(),
    priority: v.number(),
  },
  handler: async ({ db }, { userId, goalType, priority }) => {
    const now = Date.now();

    // First, deactivate any existing secondary goal of the same type for this user
    const existingSecondaryGoals = await db
      .query('goals')
      .filter(q => q.eq(q.field('userId'), userId))
      .filter(q => q.eq(q.field('goalType'), 'secondary'))
      .filter(q => q.eq(q.field('secondaryGoalType'), goalType))
      .collect();

    for (const goal of existingSecondaryGoals) {
      await db.patch(goal._id, { isActive: false, updatedAt: now });
    }

    // Create the new secondary goal
    const id = await db.insert('goals', {
      userId,
      goalType: 'secondary',
      primaryGoalType: '',
      secondaryGoalType: goalType,
      details: {},
      priority,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id };
  },
});

// Get user's active goals
export const getUserGoals = query({
  args: {
    userId: v.string(),
  },
  handler: async ({ db }, { userId }) => {
    const goals = await db
      .query('goals')
      .filter(q => q.eq(q.field('userId'), userId))
      .filter(q => q.eq(q.field('isActive'), true))
      .collect();

    const primaryGoals = goals.filter(g => g.goalType === 'primary');
    const secondaryGoals = goals.filter(g => g.goalType === 'secondary');

    return {
      primary: primaryGoals[0] || null,
      secondary: secondaryGoals,
    };
  },
});

// Update goal details
export const updateGoal = mutation({
  args: {
    goalId: v.string(),
    updates: v.object({
      details: v.optional(v.object({})),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async ({ db }, { goalId, updates }) => {
    const now = Date.now();
    const goalIdTyped = goalId as Id<'goals'>;

    await db.patch(goalIdTyped, {
      ...updates,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Delete a goal
export const deleteGoal = mutation({
  args: {
    goalId: v.string(),
  },
  handler: async ({ db }, { goalId }) => {
    const goalIdTyped = goalId as Id<'goals'>;
    await db.delete(goalIdTyped);
    return { success: true };
  },
});

// Get goal history for a user
export const getGoalHistory = query({
  args: {
    userId: v.string(),
  },
  handler: async ({ db }, { userId }) => {
    return await db
      .query('goals')
      .filter(q => q.eq(q.field('userId'), userId))
      .order('desc')
      .collect();
  },
});