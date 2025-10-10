/**
 * Data Export Functions
 * Handles GDPR-compliant user data export and privacy controls
 */

import { v } from 'convex/values';
import { mutation, query } from '../_generated/server.js';

/**
 * Export user data for GDPR compliance
 * Generates comprehensive data export including all user information
 */
export const exportUserData = query({
  args: {
    userId: v.string(),
    format: v.optional(v.union(v.literal('json'), v.literal('csv'))),
    includePersonalData: v.optional(v.boolean()),
    includeWorkoutData: v.optional(v.boolean()),
    includeAliceData: v.optional(v.boolean()),
    includeCommunityData: v.optional(v.boolean()),
    includeMarketplaceData: v.optional(v.boolean()),
    dateRange: v.optional(v.object({
      startDate: v.number(),
      endDate: v.number()
    }))
  },
  handler: async (ctx: any, args: any) => {
    const format = args.format || 'json';
    const includeAll = !args.includePersonalData && !args.includeWorkoutData && 
                      !args.includeAliceData && !args.includeCommunityData && 
                      !args.includeMarketplaceData;

    const exportData: any = {
      exportInfo: {
        userId: args.userId,
        exportDate: new Date().toISOString(),
        format: format,
        gdprCompliant: true,
        dataRetentionPolicy: "User data is retained until account deletion or explicit request for deletion",
        privacyPolicyUrl: "https://gitfit.app/privacy"
      },
      userData: {}
    };

    // Personal Profile Data
    if (includeAll || args.includePersonalData) {
      const userProfile = await ctx.db
        .query('adaptive_user_profiles')
        .withIndex('by_user_id', (q: any) => q.eq('userId', args.userId))
        .first();

      if (userProfile) {
        exportData.userData.personalProfile = {
          userId: userProfile.userId,
          displayName: userProfile.displayName,
          email: userProfile.email,
          subscriptionTier: userProfile.subscriptionTier,
          fitnessLevel: userProfile.fitnessLevel,
          fitnessGoals: userProfile.fitnessGoals,
          preferredWorkoutTypes: userProfile.preferredWorkoutTypes,
          availableEquipment: userProfile.availableEquipment,
          workoutSchedule: userProfile.workoutSchedule,
          isTrainer: userProfile.isTrainer,
          createdAt: new Date(userProfile.createdAt).toISOString(),
          lastActiveAt: userProfile.lastActiveAt ? new Date(userProfile.lastActiveAt).toISOString() : null
        };
      }
    }

    // Alice AI Data
    if (includeAll || args.includeAliceData) {
      // Alice enhanced states
      const aliceStates = await ctx.db
        .query('alice_enhanced_states')
        .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
        .collect();

      // Alice regular states
      const aliceBasicStates = await ctx.db
        .query('alice_states')
        .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
        .collect();

      exportData.userData.aliceData = {
        enhancedStates: aliceStates.map((state: any) => ({
          morphShape: state.morphShape,
          customization: state.customization,
          personalityTraits: state.personalityTraits,
          voiceSettings: state.voiceSettings,
          interactionHistory: state.interactionHistory,
          lastUpdated: new Date(state.lastUpdated).toISOString()
        })),
        basicStates: aliceBasicStates.map((state: any) => ({
          currentShape: state.currentShape,
          morphProgress: state.morphProgress,
          interactionMode: state.interactionMode,
          visibilityState: state.visibilityState,
          lastUpdated: new Date(state.lastUpdated).toISOString()
        }))
      };
    }

    // Workout and Performance Data
    if (includeAll || args.includeWorkoutData) {
      // Workout sessions
      let workoutSessions = await ctx.db
        .query('adaptive_workout_sessions')
        .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
        .collect();

      // Performance data
      let performanceData = await ctx.db
        .query('adaptive_performance_data')
        .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
        .collect();

      // Heart rate monitoring data
      let heartRateData = await ctx.db
        .query('heart_rate_monitoring')
        .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
        .collect();

      // Apply date range filter if specified
      if (args.dateRange) {
        workoutSessions = workoutSessions.filter((session: any) => 
          session.createdAt >= args.dateRange!.startDate && 
          session.createdAt <= args.dateRange!.endDate
        );
        performanceData = performanceData.filter((data: any) => 
          data.timestamp >= args.dateRange!.startDate && 
          data.timestamp <= args.dateRange!.endDate
        );
        heartRateData = heartRateData.filter((data: any) => 
          data.startTime >= args.dateRange!.startDate && 
          data.startTime <= args.dateRange!.endDate
        );
      }

      exportData.userData.workoutData = {
        workoutSessions: workoutSessions.map((session: any) => ({
          sessionId: session.sessionId,
          workoutType: session.workoutType,
          exerciseList: session.exerciseList,
          adaptiveAdjustments: session.adaptiveAdjustments,
          difficultyLevel: session.difficultyLevel,
          estimatedDuration: session.estimatedDuration,
          completionStatus: session.completionStatus,
          performanceMetrics: session.performanceMetrics,
          userFeedback: session.userFeedback,
          createdAt: new Date(session.createdAt).toISOString(),
          completedAt: session.completedAt ? new Date(session.completedAt).toISOString() : null
        })),
        performanceData: performanceData.map((data: any) => ({
          sessionId: data.sessionId,
          workoutType: data.workoutType,
          performanceMetrics: data.performanceMetrics,
          adaptiveRecommendations: data.adaptiveRecommendations,
          timestamp: new Date(data.timestamp).toISOString()
        })),
        heartRateMonitoring: heartRateData.map((data: any) => ({
          sessionId: data.sessionId,
          monitoringType: data.monitoringType,
          averageHeartRate: data.averageHeartRate,
          maxHeartRate: data.maxHeartRate,
          minHeartRate: data.minHeartRate,
          timeInZones: data.timeInZones,
          startTime: new Date(data.startTime).toISOString(),
          endTime: data.endTime ? new Date(data.endTime).toISOString() : null,
          isActive: data.isActive
        }))
      };

      // Calculate summary statistics
      exportData.userData.workoutSummary = {
        totalWorkouts: workoutSessions.length,
        totalWorkoutTime: workoutSessions.reduce((sum: any, session: any) => 
          sum + (session.performanceMetrics?.actualDuration || 0), 0),
        averageHeartRate: heartRateData.length > 0 ? 
          Math.round(heartRateData.reduce((sum: any, data: any) => sum + data.averageHeartRate, 0) / heartRateData.length) : 0,
        workoutTypeBreakdown: getWorkoutTypeBreakdown(workoutSessions),
        monthlyActivity: getMonthlyActivityBreakdown(workoutSessions)
      };
    }

    // Community Data
    if (includeAll || args.includeCommunityData) {
      // User's posts
      const userPosts = await ctx.db
        .query('team_posts')
        .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
        .collect();

      // User's exercise submissions
      const userExercises = await ctx.db
        .query('adaptive_exercises')
        .withIndex('by_creator', (q: any) => q.eq('createdBy', args.userId))
        .collect();

      // User's streaks
      const userStreaks = await ctx.db
        .query('active_streaks')
        .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
        .collect();

      exportData.userData.communityData = {
        posts: userPosts.map((post: any) => ({
          content: post.content,
          postType: post.postType,
          mediaUrls: post.mediaUrls,
          workoutData: post.workoutData,
          likes: post.likes,
          comments: post.comments,
          isPublic: post.isPublic,
          createdAt: new Date(post.createdAt).toISOString()
        })),
        exerciseSubmissions: userExercises.map((exercise: any) => ({
          name: exercise.name,
          description: exercise.description,
          difficulty: exercise.difficulty,
          muscleGroups: exercise.muscleGroups,
          equipment: exercise.equipment,
          instructions: exercise.instructions,
          videoUrl: exercise.videoUrl,
          isApproved: exercise.isApproved,
          approvalStatus: exercise.approvalStatus,
          submittedAt: new Date(exercise.createdAt).toISOString()
        })),
        streaks: userStreaks.map((streak: any) => ({
          streakType: streak.streakType,
          currentCount: streak.currentCount,
          longestStreak: streak.longestStreak,
          lastActivityDate: new Date(streak.lastActivityDate).toISOString(),
          isActive: streak.isActive
        }))
      };
    }

    // Marketplace Data
    if (includeAll || args.includeMarketplaceData) {
      // User's video purchases
      const videoPurchases = await ctx.db
        .query('video_purchases')
        .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
        .collect();

      // If user is a trainer, get their marketplace videos
      const trainerVideos = await ctx.db
        .query('marketplace_videos')
        .withIndex('by_trainer', (q: any) => q.eq('trainerId', args.userId))
        .collect();

      exportData.userData.marketplaceData = {
        purchases: videoPurchases.map((purchase: any) => ({
          videoId: purchase.videoId,
          purchasePrice: purchase.purchasePrice,
          originalPrice: purchase.originalPrice,
          discount: purchase.discount,
          paymentMethod: purchase.paymentMethod,
          purchaseDate: new Date(purchase.purchaseDate).toISOString(),
          accessGranted: purchase.accessGranted,
          downloadCount: purchase.downloadCount,
          lastAccessedAt: purchase.lastAccessedAt ? new Date(purchase.lastAccessedAt).toISOString() : null
        })),
        trainerContent: trainerVideos.map((video: any) => ({
          title: video.title,
          description: video.description,
          category: video.category,
          difficulty: video.difficulty,
          price: video.price,
          status: video.status,
          views: video.views,
          purchaseCount: video.purchaseCount,
          revenue: video.revenue,
          averageRating: video.averageRating,
          createdAt: new Date(video.createdAt).toISOString()
        })),
        totalSpent: videoPurchases.reduce((sum: any, p: any) => sum + p.purchasePrice, 0),
        totalEarnings: trainerVideos.reduce((sum: any, v: any) => sum + (v.revenue || 0), 0) * 0.8 // 80% to trainer
      };
    }

    // Privacy and Consent Information
    exportData.privacyInfo = {
      dataProcessingBasis: "User consent and legitimate interest for service provision",
      dataRetentionPeriod: "Data retained until account deletion or explicit deletion request",
      dataProcessingPurposes: [
        "Providing personalized fitness recommendations",
        "Alice AI companion functionality",
        "Community features and social interaction",
        "Marketplace transactions and content delivery",
        "Performance tracking and analytics"
      ],
      yourRights: [
        "Right to access your data (this export)",
        "Right to rectify incorrect data",
        "Right to erase your data",
        "Right to restrict processing",
        "Right to data portability",
        "Right to object to processing"
      ],
      contactInfo: {
        dataController: "GitFit Technologies",
        email: "privacy@gitfit.app",
        address: "Data Protection Office, GitFit Technologies"
      }
    };

    // Generate download metadata
    exportData.downloadInfo = {
      exportId: `export_${args.userId}_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      format: format,
      totalRecords: calculateTotalRecords(exportData),
      fileSizeEstimate: estimateFileSize(exportData, format),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    return {
      success: true,
      exportData: exportData,
      downloadUrl: await generateExportDownloadUrl(exportData, format),
      message: "Data export completed successfully. Download link expires in 7 days."
    };
  }
});

/**
 * Request data deletion (GDPR Right to be Forgotten)
 */
export const requestDataDeletion = mutation({
  args: {
    userId: v.string(),
    deletionType: v.union(v.literal('partial'), v.literal('complete')),
    dataCategories: v.optional(v.array(v.string())),
    reason: v.optional(v.string())
  },
  handler: async (ctx: any, args: any) => {
    // Create deletion request record
    const deletionRequestId = await ctx.db.insert('data_deletion_requests', {
      userId: args.userId,
      deletionType: args.deletionType,
      dataCategories: args.dataCategories || [],
      reason: args.reason || '',
      requestDate: Date.now(),
      status: 'pending',
      reviewedBy: null,
      reviewDate: null,
      completionDate: null,
      notes: ''
    });

    return {
      success: true,
      requestId: deletionRequestId,
      status: 'pending',
      estimatedCompletionTime: '30 days',
      message: 'Data deletion request submitted successfully. You will receive confirmation within 30 days.'
    };
  }
});

// Helper functions
function getWorkoutTypeBreakdown(sessions: any[]): any {
  const breakdown: any = {};
  sessions.forEach((session: any) => {
    const type = session.workoutType || 'unknown';
    breakdown[type] = (breakdown[type] || 0) + 1;
  });
  return breakdown;
}

function getMonthlyActivityBreakdown(sessions: any[]): any {
  const breakdown: any = {};
  sessions.forEach((session: any) => {
    const date = new Date(session.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    breakdown[monthKey] = (breakdown[monthKey] || 0) + 1;
  });
  return breakdown;
}

function calculateTotalRecords(exportData: any): number {
  let total = 0;
  
  // Count all arrays in the export data
  function countRecords(obj: any): void {
    for (const key in obj) {
      if (Array.isArray(obj[key])) {
        total += obj[key].length;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        countRecords(obj[key]);
      }
    }
  }
  
  countRecords(exportData);
  return total;
}

function estimateFileSize(exportData: any, format: string): string {
  const jsonString = JSON.stringify(exportData);
  const sizeBytes = new Blob([jsonString]).size;
  
  if (format === 'csv') {
    // CSV is typically smaller than JSON
    return `${Math.round(sizeBytes * 0.7 / 1024)} KB`;
  }
  
  return `${Math.round(sizeBytes / 1024)} KB`;
}

async function generateExportDownloadUrl(exportData: any, format: string): Promise<string> {
  // In a real implementation, this would upload the file to cloud storage 
  // and return a secure, time-limited download URL
  const exportId = exportData.downloadInfo.exportId;
  return `https://exports.gitfit.app/download/${exportId}.${format}?expires=${Date.now() + 7 * 24 * 60 * 60 * 1000}`;
}