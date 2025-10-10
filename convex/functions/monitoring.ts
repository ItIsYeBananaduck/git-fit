/**
 * Heart Rate Monitoring Functions
 * Handles background heart rate monitoring, zone tracking, and workout correlation
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Start background heart rate monitoring session
 */
export const startHeartRateMonitoring = mutation({
  args: {
    userId: v.string(),
    sessionId: v.string(),
    monitoringType: v.union(v.literal('workout'), v.literal('recovery'), v.literal('sleep')),
    targetZones: v.optional(v.object({
      zone1: v.object({ min: v.number(), max: v.number() }),
      zone2: v.object({ min: v.number(), max: v.number() }),
      zone3: v.object({ min: v.number(), max: v.number() }),
      zone4: v.object({ min: v.number(), max: v.number() }),
      zone5: v.object({ min: v.number(), max: v.number() })
    }))
  },
  handler: async (ctx: any, args: any) => {
    // Check if user has background monitoring subscription
    const userProfile = await ctx.db
      .query('adaptive_user_profiles')
      .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
      .first();

    if (!userProfile || userProfile.subscriptionTier === 'free') {
      throw new Error('Background monitoring requires Pro or Elite subscription');
    }

    // Check for existing active session
    const existingSession = await ctx.db
      .query('heart_rate_monitoring')
      .withIndex('by_user_active', (q: any) => q.eq('userId', args.userId).eq('isActive', true))
      .first();

    if (existingSession) {
      throw new Error('Heart rate monitoring session already active');
    }

    // Create monitoring session
    const sessionId = await ctx.db.insert('heart_rate_monitoring', {
      userId: args.userId,
      sessionId: args.sessionId,
      monitoringType: args.monitoringType,
      startTime: Date.now(),
      isActive: true,
      targetZones: args.targetZones || null,
      heartRateData: [],
      averageHeartRate: 0,
      maxHeartRate: 0,
      minHeartRate: 0,
      timeInZones: {
        zone1: 0,
        zone2: 0,
        zone3: 0,
        zone4: 0,
        zone5: 0
      },
      endTime: null
    });

    return { 
      success: true, 
      sessionId: sessionId,
      message: 'Heart rate monitoring started successfully'
    };
  }
});

/**
 * Record heart rate data point during monitoring
 */
export const recordHeartRateData = mutation({
  args: {
    userId: v.string(),
    sessionId: v.string(),
    heartRate: v.number(),
    timestamp: v.number(),
    activity: v.optional(v.string())
  },
  handler: async (ctx: any, args: any) => {
    // Find active monitoring session
    const session = await ctx.db
      .query('heart_rate_monitoring')
      .withIndex('by_user_active', (q: any) => q.eq('userId', args.userId).eq('isActive', true))
      .first();

    if (!session || session.sessionId !== args.sessionId) {
      throw new Error('No active monitoring session found');
    }

    // Validate heart rate range
    if (args.heartRate < 30 || args.heartRate > 250) {
      throw new Error('Heart rate value out of valid range (30-250 bpm)');
    }

    // Update heart rate data
    const updatedData = [...session.heartRateData, {
      heartRate: args.heartRate,
      timestamp: args.timestamp,
      activity: args.activity || null
    }];

    // Calculate updated statistics
    const heartRates = updatedData.map((d: any) => d.heartRate);
    const averageHeartRate = Math.round(heartRates.reduce((a: number, b: number) => a + b, 0) / heartRates.length);
    const maxHeartRate = Math.max(...heartRates);
    const minHeartRate = Math.min(...heartRates);

    // Calculate time in zones if zones are defined
    let timeInZones = session.timeInZones;
    if (session.targetZones) {
      const zones = session.targetZones;
      let currentZone = 'zone1';
      
      if (args.heartRate >= zones.zone5.min) currentZone = 'zone5';
      else if (args.heartRate >= zones.zone4.min) currentZone = 'zone4';
      else if (args.heartRate >= zones.zone3.min) currentZone = 'zone3';
      else if (args.heartRate >= zones.zone2.min) currentZone = 'zone2';
      
      timeInZones = {
        ...timeInZones,
        [currentZone]: timeInZones[currentZone as keyof typeof timeInZones] + 1
      };
    }

    // Update session
    await ctx.db.patch(session._id, {
      heartRateData: updatedData,
      averageHeartRate,
      maxHeartRate,
      minHeartRate,
      timeInZones
    });

    return {
      success: true,
      currentHeartRate: args.heartRate,
      averageHeartRate,
      currentZone: session.targetZones ? getCurrentZone(args.heartRate, session.targetZones) : null
    };
  }
});

/**
 * Stop heart rate monitoring session
 */
export const stopHeartRateMonitoring = mutation({
  args: {
    userId: v.string(),
    sessionId: v.string()
  },
  handler: async (ctx: any, args: any) => {
    // Find active session
    const session = await ctx.db
      .query('heart_rate_monitoring')
      .withIndex('by_user_active', (q: any) => q.eq('userId', args.userId).eq('isActive', true))
      .first();

    if (!session || session.sessionId !== args.sessionId) {
      throw new Error('No active monitoring session found');
    }

    // Calculate session duration
    const duration = Date.now() - session.startTime;

    // Stop monitoring
    await ctx.db.patch(session._id, {
      isActive: false,
      endTime: Date.now()
    });

    // Update adaptive performance data
    if (session.heartRateData.length > 0) {
      await ctx.db.insert('adaptive_performance_data', {
        userId: args.userId,
        sessionId: args.sessionId,
        workoutType: session.monitoringType,
        performanceMetrics: {
          averageHeartRate: session.averageHeartRate,
          maxHeartRate: session.maxHeartRate,
          duration: duration,
          timeInZones: session.timeInZones
        },
        timestamp: Date.now(),
        adaptiveRecommendations: generateHeartRateRecommendations(session)
      });
    }

    return {
      success: true,
      sessionSummary: {
        duration,
        averageHeartRate: session.averageHeartRate,
        maxHeartRate: session.maxHeartRate,
        dataPoints: session.heartRateData.length,
        timeInZones: session.timeInZones
      }
    };
  }
});

/**
 * Get heart rate monitoring data
 */
export const getHeartRateData = query({
  args: {
    userId: v.string(),
    sessionId: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx: any, args: any) => {
    let query = ctx.db
      .query('heart_rate_monitoring')
      .withIndex('by_user', (q: any) => q.eq('userId', args.userId));

    if (args.sessionId) {
      const sessions = await query.collect();
      const session = sessions.find((s: any) => s.sessionId === args.sessionId);
      return session ? [session] : [];
    }

    const sessions = await query
      .order('desc')
      .take(args.limit || 10);

    return sessions.map((session: any) => ({
      sessionId: session.sessionId,
      monitoringType: session.monitoringType,
      startTime: session.startTime,
      endTime: session.endTime,
      isActive: session.isActive,
      averageHeartRate: session.averageHeartRate,
      maxHeartRate: session.maxHeartRate,
      minHeartRate: session.minHeartRate,
      dataPoints: session.heartRateData.length,
      timeInZones: session.timeInZones,
      duration: session.endTime ? session.endTime - session.startTime : Date.now() - session.startTime
    }));
  }
});

/**
 * Get current active monitoring session
 */
export const getActiveMonitoringSession = query({
  args: {
    userId: v.string()
  },
  handler: async (ctx: any, args: any) => {
    const session = await ctx.db
      .query('heart_rate_monitoring')
      .withIndex('by_user_active', (q: any) => q.eq('userId', args.userId).eq('isActive', true))
      .first();

    if (!session) {
      return null;
    }

    return {
      sessionId: session.sessionId,
      monitoringType: session.monitoringType,
      startTime: session.startTime,
      currentHeartRate: session.heartRateData.length > 0 ? 
        session.heartRateData[session.heartRateData.length - 1].heartRate : 0,
      averageHeartRate: session.averageHeartRate,
      duration: Date.now() - session.startTime,
      targetZones: session.targetZones,
      timeInZones: session.timeInZones
    };
  }
});

// Helper functions
function getCurrentZone(heartRate: number, zones: any): string {
  if (heartRate >= zones.zone5.min) return 'zone5';
  if (heartRate >= zones.zone4.min) return 'zone4';
  if (heartRate >= zones.zone3.min) return 'zone3';
  if (heartRate >= zones.zone2.min) return 'zone2';
  return 'zone1';
}

function generateHeartRateRecommendations(session: any): string[] {
  const recommendations = [];
  
  // Analyze heart rate variability
  if (session.averageHeartRate > session.maxHeartRate * 0.9) {
    recommendations.push('Consider longer warm-up periods to gradually increase heart rate');
  }
  
  // Zone analysis
  const totalTime = Object.values(session.timeInZones).reduce((a: any, b: any) => a + b, 0) as number;
  const zone4Time = session.timeInZones.zone4 / totalTime;
  const zone5Time = session.timeInZones.zone5 / totalTime;
  
  if (zone5Time > 0.3) {
    recommendations.push('High intensity detected - ensure adequate recovery between sessions');
  }
  
  if (zone4Time > 0.5) {
    recommendations.push('Great anaerobic training zone work - consider adding some recovery intervals');
  }
  
  if (session.heartRateData.length < 10) {
    recommendations.push('Longer monitoring sessions provide better adaptive insights');
  }
  
  return recommendations;
}