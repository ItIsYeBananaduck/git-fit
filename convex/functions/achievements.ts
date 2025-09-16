import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';

// Achievement requirements type
type AchievementRequirements = {
  workouts_completed?: number;
  workout_streak?: number;
  meals_logged?: number;
  nutrition_streak?: number;
  calorie_goal_days?: number;
  bench_press_max?: number;
  squat_max?: number;
  deadlift_max?: number;
  followers?: number;
  certification_completed?: boolean;
  account_age_days?: number;
};

// Achievement definition type
type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  requirements: AchievementRequirements;
};

// Achievement definitions
const ACHIEVEMENTS: Record<string, Achievement> = {
  // Workout achievements
  first_workout: {
    id: 'first_workout',
    name: 'First Steps',
    description: 'Complete your first workout',
    icon: '🏃',
    category: 'workout',
    points: 10,
    rarity: 'common',
    requirements: { workouts_completed: 1 }
  },
  workout_streak_7: {
    id: 'workout_streak_7',
    name: 'Week Warrior',
    description: 'Complete workouts for 7 days in a row',
    icon: '🔥',
    category: 'workout',
    points: 50,
    rarity: 'uncommon',
    requirements: { workout_streak: 7 }
  },
  workout_streak_30: {
    id: 'workout_streak_30',
    name: 'Monthly Master',
    description: 'Complete workouts for 30 days in a row',
    icon: '👑',
    category: 'workout',
    points: 200,
    rarity: 'rare',
    requirements: { workout_streak: 30 }
  },
  workout_100: {
    id: 'workout_100',
    name: 'Century Club',
    description: 'Complete 100 workouts',
    icon: '💯',
    category: 'workout',
    points: 500,
    rarity: 'epic',
    requirements: { workouts_completed: 100 }
  },

  // Nutrition achievements
  first_meal: {
    id: 'first_meal',
    name: 'Foodie First',
    description: 'Log your first meal',
    icon: '🍎',
    category: 'nutrition',
    points: 10,
    rarity: 'common',
    requirements: { meals_logged: 1 }
  },
  nutrition_streak_7: {
    id: 'nutrition_streak_7',
    name: 'Meal Master',
    description: 'Log meals for 7 days in a row',
    icon: '🥗',
    category: 'nutrition',
    points: 40,
    rarity: 'uncommon',
    requirements: { nutrition_streak: 7 }
  },
  calorie_goal_30: {
    id: 'calorie_goal_30',
    name: 'Calorie Champion',
    description: 'Hit your calorie goal for 30 days',
    icon: '🎯',
    category: 'nutrition',
    points: 150,
    rarity: 'rare',
    requirements: { calorie_goal_days: 30 }
  },

  // Strength achievements
  bench_press_100: {
    id: 'bench_press_100',
    name: 'Bench Boss',
    description: 'Bench press 100 lbs',
    icon: '🏋️',
    category: 'strength',
    points: 75,
    rarity: 'uncommon',
    requirements: { bench_press_max: 100 }
  },
  squat_200: {
    id: 'squat_200',
    name: 'Squat King',
    description: 'Squat 200 lbs',
    icon: '💪',
    category: 'strength',
    points: 100,
    rarity: 'rare',
    requirements: { squat_max: 200 }
  },
  deadlift_300: {
    id: 'deadlift_300',
    name: 'Deadlift Dominator',
    description: 'Deadlift 300 lbs',
    icon: '⚡',
    category: 'strength',
    points: 150,
    rarity: 'epic',
    requirements: { deadlift_max: 300 }
  },

  // Social achievements
  first_follower: {
    id: 'first_follower',
    name: 'Social Butterfly',
    description: 'Get your first follower',
    icon: '🦋',
    category: 'social',
    points: 25,
    rarity: 'uncommon',
    requirements: { followers: 1 }
  },
  trainer_badge: {
    id: 'trainer_badge',
    name: 'Certified Trainer',
    description: 'Complete trainer certification',
    icon: '🎓',
    category: 'certification',
    points: 300,
    rarity: 'epic',
    requirements: { certification_completed: true }
  },

  // Special achievements
  early_adopter: {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Join Technically Fit in the first month',
    icon: '🚀',
    category: 'special',
    points: 100,
    rarity: 'rare',
    requirements: { account_age_days: 30 }
  }
};

// Get all available achievements
export const getAllAchievements = query({
  args: {},
  handler: async ({ db }) => {
    return Object.values(ACHIEVEMENTS);
  },
});

// Get user's earned achievements
export const getUserAchievements = query({
  args: {
    userId: v.string(),
  },
  handler: async ({ db }, { userId }) => {
    const userAchievements = await db
      .query('userAchievements')
      .filter(q => q.eq(q.field('userId'), userId))
      .collect();

    return userAchievements.map(ua => ({
      ...ACHIEVEMENTS[ua.achievementId as keyof typeof ACHIEVEMENTS],
      earnedAt: ua.earnedAt,
      progress: ua.progress
    }));
  },
});

// Get user's achievement progress
export const getUserAchievementProgress = query({
  args: {
    userId: v.string(),
  },
  handler: async ({ db }, { userId }) => {
    const userAchievements = await db
      .query('userAchievements')
      .filter(q => q.eq(q.field('userId'), userId))
      .collect();

    const earnedIds = userAchievements.map(ua => ua.achievementId);

    // Calculate progress for unearned achievements
    const progressPromises = Object.values(ACHIEVEMENTS)
      .filter(achievement => !earnedIds.includes(achievement.id))
      .map(async (achievement) => {
        const progress = await calculateAchievementProgress(userId, achievement.id);
        return {
          ...achievement,
          progress
        };
      });

    const progressResults = await Promise.all(progressPromises);

    return {
      earned: userAchievements.map(ua => ({
        ...ACHIEVEMENTS[ua.achievementId as keyof typeof ACHIEVEMENTS],
        earnedAt: ua.earnedAt,
        progress: 100
      })),
      inProgress: progressResults.filter(p => p.progress > 0),
      available: progressResults.filter(p => p.progress === 0)
    };
  },
});

// Award achievement to user
export const awardAchievement = mutation({
  args: {
    userId: v.string(),
    achievementId: v.string(),
  },
  handler: async ({ db }, { userId, achievementId }) => {
    const now = Date.now();

    // Check if user already has this achievement
    const existing = await db
      .query('userAchievements')
      .filter(q => q.eq(q.field('userId'), userId))
      .filter(q => q.eq(q.field('achievementId'), achievementId))
      .first();

    if (existing) {
      return { success: false, message: 'Achievement already earned' };
    }

    // Award the achievement
    const id = await db.insert('userAchievements', {
      userId,
      achievementId,
      earnedAt: now,
      progress: 100,
      createdAt: now,
      updatedAt: now
    });

    // Update user points
    const achievement = ACHIEVEMENTS[achievementId as keyof typeof ACHIEVEMENTS];
    if (achievement) {
      await updateUserPoints(userId, achievement.points);
    }

    return { success: true, id, points: achievement?.points || 0 };
  },
});

// Update achievement progress
export const updateAchievementProgress = mutation({
  args: {
    userId: v.string(),
    achievementId: v.string(),
    progress: v.number(),
  },
  handler: async ({ db }, { userId, achievementId, progress }) => {
    const now = Date.now();

    const existing = await db
      .query('userAchievements')
      .filter(q => q.eq(q.field('userId'), userId))
      .filter(q => q.eq(q.field('achievementId'), achievementId))
      .first();

    if (existing) {
      // Update progress
      await db.patch(existing._id, { progress, updatedAt: now });
    } else {
      // Create progress entry
      await db.insert('userAchievements', {
        userId,
        achievementId,
        earnedAt: undefined,
        progress,
        createdAt: now,
        updatedAt: now
      });
    }

    // Check if achievement should be awarded
    if (progress >= 100) {
      // Award the achievement directly
      const now = Date.now();
      const achievement = ACHIEVEMENTS[achievementId as keyof typeof ACHIEVEMENTS];
      if (achievement) {
        const id = await db.insert('userAchievements', {
          userId,
          achievementId,
          earnedAt: now,
          progress: 100,
          createdAt: now,
          updatedAt: now
        });
        await updateUserPoints(userId, achievement.points);
        return { success: true, id, points: achievement.points };
      }
    }

    return { success: true };
  },
});

// Calculate progress for a specific achievement
async function calculateAchievementProgress(userId: string, achievementId: string) {
  const achievement = ACHIEVEMENTS[achievementId as keyof typeof ACHIEVEMENTS];
  if (!achievement) return 0;

  // This would be implemented based on the specific requirements
  // For now, return a mock progress calculation
  const requirements = achievement.requirements;

  // Mock calculations - in real implementation, these would query actual user data
  if (requirements.workouts_completed) {
    // Query actual workout count
    return Math.min(100, Math.random() * 100); // Mock
  }

  if (requirements.workout_streak) {
    // Query actual streak
    return Math.min(100, Math.random() * 100); // Mock
  }

  return 0;
}

// Update user points
async function updateUserPoints(userId: string, points: number) {
  // This would update a user points field
  // Implementation depends on user schema
  console.log(`Awarding ${points} points to user ${userId}`);
}

// Get leaderboard
export const getLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async ({ db }, { limit = 10 }) => {
    // This would aggregate user points and achievements
    // For now, return mock data
    return [
      { userId: 'user1', name: 'John Doe', points: 1250, achievements: 15 },
      { userId: 'user2', name: 'Jane Smith', points: 1100, achievements: 12 },
      { userId: 'user3', name: 'Bob Johnson', points: 950, achievements: 10 },
    ].slice(0, limit);
  },
});

// Get achievement statistics
export const getAchievementStats = query({
  args: {},
  handler: async ({ db }) => {
    const totalAchievements = Object.keys(ACHIEVEMENTS).length;

    // Count earned achievements
    const earnedCount = await db.query('userAchievements').collect();

    return {
      totalAchievements,
      totalEarned: earnedCount.length,
      completionRate: (earnedCount.length / totalAchievements) * 100,
      categories: {
        workout: Object.values(ACHIEVEMENTS).filter(a => a.category === 'workout').length,
        nutrition: Object.values(ACHIEVEMENTS).filter(a => a.category === 'nutrition').length,
        strength: Object.values(ACHIEVEMENTS).filter(a => a.category === 'strength').length,
        social: Object.values(ACHIEVEMENTS).filter(a => a.category === 'social').length,
        certification: Object.values(ACHIEVEMENTS).filter(a => a.category === 'certification').length,
        special: Object.values(ACHIEVEMENTS).filter(a => a.category === 'special').length,
      }
    };
  },
});