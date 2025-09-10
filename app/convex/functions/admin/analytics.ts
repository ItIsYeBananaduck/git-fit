// Admin Analytics Functions

import { v } from "convex/values";
import { query, mutation } from "../../_generated/server";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";

// ============================================================================
// Dashboard Metrics
// ============================================================================

export const getDashboardMetrics = query({
  args: {
    timeframe: v.optional(v.object({
      start: v.string(),
      end: v.string()
    }))
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const timeframe = args.timeframe || {
      start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      end: now.toISOString()
    };

    // Get user metrics
    const allUsers = await ctx.db.query("users").collect();
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(user => {
      // Consider users active if they've been created in the last 30 days or have recent activity
      const createdAt = new Date(user.createdAt);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return createdAt > thirtyDaysAgo;
    }).length;

    const newUsers = allUsers.filter(user => {
      const createdAt = new Date(user.createdAt);
      const startDate = new Date(timeframe.start);
      const endDate = new Date(timeframe.end);
      return createdAt >= startDate && createdAt <= endDate;
    }).length;

    // Get revenue metrics
    const revenueTransactions = await ctx.db.query("revenueTransactions")
      .filter(q => 
        q.and(
          q.gte(q.field("transactionDate"), timeframe.start),
          q.lte(q.field("transactionDate"), timeframe.end)
        )
      )
      .collect();

    const totalRevenue = revenueTransactions.reduce((sum, transaction) => sum + transaction.grossAmount, 0);
    const recurringRevenue = revenueTransactions
      .filter(t => t.type === "program_purchase")
      .reduce((sum, transaction) => sum + transaction.grossAmount, 0);

    const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

    // Get engagement metrics
    const workoutSessions = await ctx.db.query("workoutSessions")
      .filter(q => 
        q.and(
          q.gte(q.field("createdAt"), timeframe.start),
          q.lte(q.field("createdAt"), timeframe.end)
        )
      )
      .collect();

    const dailyActiveUsers = new Set(workoutSessions.map(session => session.userId)).size;
    const averageSessionDuration = workoutSessions.length > 0 
      ? workoutSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / workoutSessions.length
      : 0;

    // Calculate churn rate (simplified)
    const churnRate = totalUsers > 0 ? ((totalUsers - activeUsers) / totalUsers) * 100 : 0;

    return {
      userMetrics: {
        totalUsers,
        activeUsers,
        newUsers,
        churnRate
      },
      revenueMetrics: {
        totalRevenue,
        recurringRevenue,
        averageRevenuePerUser,
        revenueGrowthRate: 0 // Would need historical data to calculate
      },
      engagementMetrics: {
        dailyActiveUsers,
        sessionDuration: averageSessionDuration,
        featureAdoption: {
          workouts: workoutSessions.length,
          programs: revenueTransactions.filter(t => t.type === "program_purchase").length
        },
        retentionRate: activeUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
      },
      systemMetrics: {
        uptime: 99.9, // Mock data
        responseTime: 150, // Mock data in ms
        errorRate: 0.1, // Mock data as percentage
        resourceUtilization: 65 // Mock data as percentage
      }
    };
  }
});

export const getUserGrowthAnalytics = query({
  args: {
    period: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const now = new Date();
    let startDate: Date;
    let endDate = args.endDate ? new Date(args.endDate) : now;

    // Calculate start date based on period
    switch (args.period) {
      case "1d":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = args.startDate ? new Date(args.startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get all users in the time range
    const users = await ctx.db.query("users")
      .filter(q => 
        q.and(
          q.gte(q.field("createdAt"), startDate.toISOString()),
          q.lte(q.field("createdAt"), endDate.toISOString())
        )
      )
      .collect();

    // Group users by date
    const userGrowthData: Array<{ date: string; value: number }> = [];
    const dateMap = new Map<string, number>();

    users.forEach(user => {
      const date = new Date(user.createdAt).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    // Fill in missing dates with 0
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      userGrowthData.push({
        date: dateStr,
        value: dateMap.get(dateStr) || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate acquisition channels (mock data for now)
    const acquisitionChannels = {
      organic: Math.floor(users.length * 0.4),
      social: Math.floor(users.length * 0.3),
      referral: Math.floor(users.length * 0.2),
      paid: Math.floor(users.length * 0.1)
    };

    return {
      period: args.period,
      userGrowth: userGrowthData,
      acquisitionChannels,
      totalNewUsers: users.length
    };
  }
});

export const getRevenueAnalytics = query({
  args: {
    period: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const now = new Date();
    let startDate: Date;
    let endDate = args.endDate ? new Date(args.endDate) : now;

    // Calculate start date based on period
    switch (args.period) {
      case "1d":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = args.startDate ? new Date(args.startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get revenue transactions in the time range
    const transactions = await ctx.db.query("revenueTransactions")
      .filter(q => 
        q.and(
          q.gte(q.field("transactionDate"), startDate.toISOString()),
          q.lte(q.field("transactionDate"), endDate.toISOString())
        )
      )
      .collect();

    const totalRevenue = transactions.reduce((sum, t) => sum + t.grossAmount, 0);

    // Group revenue by source
    const revenueBySource = {
      program_purchase: transactions.filter(t => t.type === "program_purchase").reduce((sum, t) => sum + t.grossAmount, 0),
      coaching_service: transactions.filter(t => t.type === "coaching_service").reduce((sum, t) => sum + t.grossAmount, 0)
    };

    // Group revenue by date
    const revenueGrowth: Array<{ date: string; value: number }> = [];
    const dateMap = new Map<string, number>();

    transactions.forEach(transaction => {
      const date = new Date(transaction.transactionDate).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + transaction.grossAmount);
    });

    // Fill in missing dates with 0
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      revenueGrowth.push({
        date: dateStr,
        value: dateMap.get(dateStr) || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate ARPU over time
    const users = await ctx.db.query("users").collect();
    const averageRevenuePerUser: Array<{ date: string; value: number }> = revenueGrowth.map(item => ({
      date: item.date,
      value: users.length > 0 ? item.value / users.length : 0
    }));

    return {
      period: args.period,
      totalRevenue,
      revenueBySource,
      revenueGrowth,
      averageRevenuePerUser,
      subscriptionMetrics: {
        newSubscriptions: transactions.filter(t => t.type === "program_purchase").length,
        cancellations: 0, // Would need subscription status tracking
        upgrades: 0,
        downgrades: 0,
        churnRate: 0
      }
    };
  }
});

export const getEngagementMetrics = query({
  args: {
    period: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const now = new Date();
    let startDate: Date;
    let endDate = args.endDate ? new Date(args.endDate) : now;

    // Calculate start date based on period
    switch (args.period) {
      case "1d":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = args.startDate ? new Date(args.startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get workout sessions for engagement metrics
    const workoutSessions = await ctx.db.query("workoutSessions")
      .filter(q => 
        q.and(
          q.gte(q.field("createdAt"), startDate.toISOString()),
          q.lte(q.field("createdAt"), endDate.toISOString())
        )
      )
      .collect();

    // Calculate daily active users
    const dailyActiveUsers: Array<{ date: string; value: number }> = [];
    const dateMap = new Map<string, Set<string>>();

    workoutSessions.forEach(session => {
      const date = new Date(session.createdAt).toISOString().split('T')[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, new Set());
      }
      dateMap.get(date)!.add(session.userId);
    });

    // Fill in missing dates
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyActiveUsers.push({
        date: dateStr,
        value: dateMap.get(dateStr)?.size || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate session metrics
    const completedSessions = workoutSessions.filter(s => s.isCompleted);
    const sessionMetrics = {
      averageDuration: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSessions.length
        : 0,
      bounceRate: workoutSessions.length > 0 
        ? ((workoutSessions.length - completedSessions.length) / workoutSessions.length) * 100
        : 0,
      returnVisitorRate: 0 // Would need session tracking
    };

    // Feature usage
    const featureUsage = {
      workouts: workoutSessions.length,
      programs: new Set(workoutSessions.map(s => s.userProgramId)).size,
      exercises: await ctx.db.query("exercisePerformance").collect().then(ep => ep.length)
    };

    return {
      period: args.period,
      dailyActiveUsers,
      sessionMetrics,
      featureUsage,
      userJourneys: [] // Would need detailed tracking
    };
  }
});

// ============================================================================
// Real-time Updates
// ============================================================================

export const subscribeToMetrics = mutation({
  args: {
    adminId: v.id("adminUsers"),
    subscriptionType: v.union(v.literal("dashboard"), v.literal("users"), v.literal("revenue"), v.literal("engagement"))
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would set up WebSocket subscriptions
    // For now, we'll just return a subscription ID
    return {
      subscriptionId: `${args.subscriptionType}_${args.adminId}_${Date.now()}`,
      status: "active"
    };
  }
});

export const unsubscribeFromMetrics = mutation({
  args: {
    subscriptionId: v.string()
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would clean up WebSocket subscriptions
    return {
      subscriptionId: args.subscriptionId,
      status: "inactive"
    };
  }
});

// ============================================================================
// Custom Widgets and Layouts
// ============================================================================

export const saveCustomDashboard = mutation({
  args: {
    adminId: v.id("adminUsers"),
    dashboardName: v.string(),
    layout: v.any(), // Widget layout configuration
    widgets: v.array(v.any()), // Widget configurations
    isDefault: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would save to a customDashboards table
    // For now, we'll return a mock dashboard ID
    return {
      dashboardId: `dashboard_${args.adminId}_${Date.now()}`,
      name: args.dashboardName,
      createdAt: new Date().toISOString()
    };
  }
});

export const getCustomDashboards = query({
  args: {
    adminId: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would query a customDashboards table
    // For now, we'll return mock data
    return [
      {
        dashboardId: `dashboard_${args.adminId}_default`,
        name: "Default Dashboard",
        layout: {
          columns: 3,
          rows: 4
        },
        widgets: [
          { type: "user_metrics", position: { x: 0, y: 0, w: 1, h: 1 } },
          { type: "revenue_metrics", position: { x: 1, y: 0, w: 1, h: 1 } },
          { type: "engagement_metrics", position: { x: 2, y: 0, w: 1, h: 1 } }
        ],
        isDefault: true,
        createdAt: new Date().toISOString()
      }
    ];
  }
});// ====
========================================================================
// Advanced Analytics and Reporting
// ============================================================================

export const getUserBehaviorAnalytics = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    segmentBy: v.optional(v.union(v.literal("role"), v.literal("fitnessLevel"), v.literal("age"), v.literal("location")))
  },
  handler: async (ctx, args) => {
    // Get users in the time range
    const users = await ctx.db.query("users")
      .filter(q => 
        q.and(
          q.gte(q.field("createdAt"), args.startDate),
          q.lte(q.field("createdAt"), args.endDate)
        )
      )
      .collect();

    // Get workout sessions for behavior analysis
    const workoutSessions = await ctx.db.query("workoutSessions")
      .filter(q => 
        q.and(
          q.gte(q.field("createdAt"), args.startDate),
          q.lte(q.field("createdAt"), args.endDate)
        )
      )
      .collect();

    // Segment users if requested
    let segments: Record<string, any> = {};
    if (args.segmentBy) {
      users.forEach(user => {
        let segmentKey = 'unknown';
        switch (args.segmentBy) {
          case 'role':
            segmentKey = user.role;
            break;
          case 'fitnessLevel':
            segmentKey = user.fitnessLevel || 'unknown';
            break;
          case 'age':
            if (user.dateOfBirth) {
              const age = new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear();
              segmentKey = age < 25 ? '18-24' : age < 35 ? '25-34' : age < 45 ? '35-44' : age < 55 ? '45-54' : '55+';
            }
            break;
        }
        
        if (!segments[segmentKey]) {
          segments[segmentKey] = {
            userCount: 0,
            sessions: 0,
            avgSessionDuration: 0
          };
        }
        segments[segmentKey].userCount++;
      });

      // Add session data to segments
      workoutSessions.forEach(session => {
        const user = users.find(u => u._id === session.userId);
        if (user) {
          let segmentKey = 'unknown';
          switch (args.segmentBy) {
            case 'role':
              segmentKey = user.role;
              break;
            case 'fitnessLevel':
              segmentKey = user.fitnessLevel || 'unknown';
              break;
          }
          
          if (segments[segmentKey]) {
            segments[segmentKey].sessions++;
            segments[segmentKey].avgSessionDuration += session.duration || 0;
          }
        }
      });

      // Calculate averages
      Object.keys(segments).forEach(key => {
        if (segments[key].sessions > 0) {
          segments[key].avgSessionDuration = segments[key].avgSessionDuration / segments[key].sessions;
        }
      });
    }

    // Calculate cohort analysis (simplified)
    const cohorts: Record<string, any> = {};
    users.forEach(user => {
      const cohortMonth = new Date(user.createdAt).toISOString().substring(0, 7); // YYYY-MM
      if (!cohorts[cohortMonth]) {
        cohorts[cohortMonth] = {
          size: 0,
          retention: {}
        };
      }
      cohorts[cohortMonth].size++;
    });

    return {
      totalUsers: users.length,
      totalSessions: workoutSessions.length,
      averageSessionsPerUser: users.length > 0 ? workoutSessions.length / users.length : 0,
      segments,
      cohorts,
      userJourneys: [], // Would need detailed event tracking
      behaviorPatterns: {
        mostActiveHours: [], // Would need timestamp analysis
        commonWorkoutTypes: [], // Would need workout type analysis
        dropoffPoints: [] // Would need funnel analysis
      }
    };
  }
});

export const getConversionFunnelAnalytics = query({
  args: {
    funnelType: v.union(v.literal("signup"), v.literal("purchase"), v.literal("engagement")),
    startDate: v.string(),
    endDate: v.string()
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users")
      .filter(q => 
        q.and(
          q.gte(q.field("createdAt"), args.startDate),
          q.lte(q.field("createdAt"), args.endDate)
        )
      )
      .collect();

    let funnelSteps: Array<{ name: string; users: number; conversionRate: number }> = [];

    switch (args.funnelType) {
      case "signup":
        // Simplified signup funnel
        const totalVisitors = users.length * 2; // Mock data - would need actual visitor tracking
        const signups = users.length;
        const emailVerified = Math.floor(users.length * 0.8); // Mock data
        const profileCompleted = Math.floor(users.length * 0.6); // Mock data

        funnelSteps = [
          { name: "Visitors", users: totalVisitors, conversionRate: 100 },
          { name: "Signups", users: signups, conversionRate: (signups / totalVisitors) * 100 },
          { name: "Email Verified", users: emailVerified, conversionRate: (emailVerified / signups) * 100 },
          { name: "Profile Completed", users: profileCompleted, conversionRate: (profileCompleted / emailVerified) * 100 }
        ];
        break;

      case "purchase":
        const programPurchases = await ctx.db.query("programPurchases")
          .filter(q => 
            q.and(
              q.gte(q.field("purchaseDate"), args.startDate),
              q.lte(q.field("purchaseDate"), args.endDate)
            )
          )
          .collect();

        const browsedPrograms = users.length; // Mock data
        const addedToCart = Math.floor(users.length * 0.3); // Mock data
        const startedCheckout = Math.floor(addedToCart * 0.7); // Mock data
        const completedPurchase = programPurchases.length;

        funnelSteps = [
          { name: "Browsed Programs", users: browsedPrograms, conversionRate: 100 },
          { name: "Added to Cart", users: addedToCart, conversionRate: (addedToCart / browsedPrograms) * 100 },
          { name: "Started Checkout", users: startedCheckout, conversionRate: (startedCheckout / addedToCart) * 100 },
          { name: "Completed Purchase", users: completedPurchase, conversionRate: (completedPurchase / startedCheckout) * 100 }
        ];
        break;

      case "engagement":
        const workoutSessions = await ctx.db.query("workoutSessions")
          .filter(q => 
            q.and(
              q.gte(q.field("createdAt"), args.startDate),
              q.lte(q.field("createdAt"), args.endDate)
            )
          )
          .collect();

        const registeredUsers = users.length;
        const firstWorkout = new Set(workoutSessions.map(s => s.userId)).size;
        const completedWorkout = workoutSessions.filter(s => s.isCompleted).length;
        const returnedUsers = Math.floor(firstWorkout * 0.4); // Mock data

        funnelSteps = [
          { name: "Registered", users: registeredUsers, conversionRate: 100 },
          { name: "Started First Workout", users: firstWorkout, conversionRate: (firstWorkout / registeredUsers) * 100 },
          { name: "Completed Workout", users: completedWorkout, conversionRate: (completedWorkout / firstWorkout) * 100 },
          { name: "Returned for More", users: returnedUsers, conversionRate: (returnedUsers / completedWorkout) * 100 }
        ];
        break;
    }

    // Calculate overall conversion rate
    const overallConversion = funnelSteps.length > 0 
      ? (funnelSteps[funnelSteps.length - 1].users / funnelSteps[0].users) * 100 
      : 0;

    // Identify dropoff points
    const dropoffAnalysis = funnelSteps.slice(1).map((step, index) => {
      const previousStep = funnelSteps[index];
      const dropoffRate = ((previousStep.users - step.users) / previousStep.users) * 100;
      
      return {
        step: step.name,
        dropoffRate,
        usersLost: previousStep.users - step.users,
        commonReasons: [], // Would need user feedback data
        recommendations: [] // Would need analysis logic
      };
    });

    return {
      funnelType: args.funnelType,
      steps: funnelSteps,
      overallConversion,
      dropoffAnalysis,
      totalUsers: funnelSteps[0]?.users || 0
    };
  }
});

export const generateCustomReport = mutation({
  args: {
    reportName: v.string(),
    reportType: v.union(v.literal("users"), v.literal("revenue"), v.literal("engagement"), v.literal("custom")),
    dateRange: v.object({
      start: v.string(),
      end: v.string()
    }),
    metrics: v.array(v.string()),
    filters: v.optional(v.any()),
    groupBy: v.optional(v.string()),
    format: v.union(v.literal("json"), v.literal("csv"), v.literal("pdf")),
    adminId: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    // Generate report data based on type and metrics
    let reportData: any = {};

    switch (args.reportType) {
      case "users":
        const users = await ctx.db.query("users")
          .filter(q => 
            q.and(
              q.gte(q.field("createdAt"), args.dateRange.start),
              q.lte(q.field("createdAt"), args.dateRange.end)
            )
          )
          .collect();

        reportData = {
          totalUsers: users.length,
          usersByRole: users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          usersByFitnessLevel: users.reduce((acc, user) => {
            const level = user.fitnessLevel || 'unknown';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        };
        break;

      case "revenue":
        const transactions = await ctx.db.query("revenueTransactions")
          .filter(q => 
            q.and(
              q.gte(q.field("transactionDate"), args.dateRange.start),
              q.lte(q.field("transactionDate"), args.dateRange.end)
            )
          )
          .collect();

        reportData = {
          totalRevenue: transactions.reduce((sum, t) => sum + t.grossAmount, 0),
          transactionCount: transactions.length,
          averageTransactionValue: transactions.length > 0 
            ? transactions.reduce((sum, t) => sum + t.grossAmount, 0) / transactions.length 
            : 0,
          revenueByType: transactions.reduce((acc, t) => {
            acc[t.type] = (acc[t.type] || 0) + t.grossAmount;
            return acc;
          }, {} as Record<string, number>)
        };
        break;

      case "engagement":
        const sessions = await ctx.db.query("workoutSessions")
          .filter(q => 
            q.and(
              q.gte(q.field("createdAt"), args.dateRange.start),
              q.lte(q.field("createdAt"), args.dateRange.end)
            )
          )
          .collect();

        reportData = {
          totalSessions: sessions.length,
          completedSessions: sessions.filter(s => s.isCompleted).length,
          averageSessionDuration: sessions.length > 0 
            ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length 
            : 0,
          uniqueUsers: new Set(sessions.map(s => s.userId)).size
        };
        break;
    }

    // Create report record
    const reportId = `report_${args.adminId}_${Date.now()}`;
    
    return {
      reportId,
      name: args.reportName,
      type: args.reportType,
      data: reportData,
      generatedAt: new Date().toISOString(),
      generatedBy: args.adminId,
      format: args.format,
      downloadUrl: `${reportId}.${args.format}` // Mock URL
    };
  }
});

export const scheduleReport = mutation({
  args: {
    reportConfig: v.any(),
    schedule: v.object({
      frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
      time: v.string(), // HH:MM format
      dayOfWeek: v.optional(v.number()), // 0-6 for weekly
      dayOfMonth: v.optional(v.number()) // 1-31 for monthly
    }),
    recipients: v.array(v.string()), // email addresses
    adminId: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would set up a scheduled job
    const scheduleId = `schedule_${args.adminId}_${Date.now()}`;
    
    return {
      scheduleId,
      reportConfig: args.reportConfig,
      schedule: args.schedule,
      recipients: args.recipients,
      status: "active",
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mock next run
      createdAt: new Date().toISOString(),
      createdBy: args.adminId
    };
  }
});

export const getReportHistory = query({
  args: {
    adminId: v.optional(v.id("adminUsers")),
    reportType: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would query a reports table
    // For now, return mock data
    return [
      {
        reportId: `report_${args.adminId}_1`,
        name: "Monthly User Report",
        type: "users",
        generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        generatedBy: args.adminId,
        format: "pdf",
        downloadUrl: "report_1.pdf",
        status: "completed"
      },
      {
        reportId: `report_${args.adminId}_2`,
        name: "Revenue Analysis",
        type: "revenue",
        generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        generatedBy: args.adminId,
        format: "csv",
        downloadUrl: "report_2.csv",
        status: "completed"
      }
    ];
  }
});