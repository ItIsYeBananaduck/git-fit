import { describe, test, expect, beforeEach } from 'vitest';
import { ConvexTestingHelper } from 'convex/testing';
import { api } from '../../../convex/_generated/api.js';
import { Id } from '../../../convex/_generated/dataModel.js';

describe('OAuth Analytics Integration Tests', () => {
  let t: ConvexTestingHelper;
  let userId: Id<"users">;
  let userId2: Id<"users">;

  beforeEach(async () => {
    t = new ConvexTestingHelper();
    
    // Create test users
    userId = await t.mutation(api.users.create, {
      email: "user1@example.com",
      name: "Test User 1"
    });

    userId2 = await t.mutation(api.users.create, {
      email: "user2@example.com",
      name: "Test User 2"
    });
  });

  describe('OAuth Event Tracking', () => {
    test('should track OAuth events with comprehensive metadata', async () => {
      const eventId = await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "spotify",
        eventType: "connection",
        action: "oauth_callback",
        success: true,
        duration: 1500, // 1.5 seconds
        metadata: {
          platform: "ios",
          userAgent: "GitFit/1.0 iOS/16.0",
          ipAddress: "192.168.1.100",
          dataSize: 2048,
          responseTime: 850
        }
      });

      expect(eventId).toBeDefined();

      // Verify event was stored in analytics
      const dashboard = await t.query(api.oauthAnalytics.getAnalyticsDashboard, {
        timeRange: "1h"
      });

      expect(dashboard.overview.totalEvents).toBe(1);
      expect(dashboard.overview.successfulEvents).toBe(1);
      expect(dashboard.overview.failedEvents).toBe(0);
      expect(dashboard.overview.errorRate).toBe(0);
      expect(dashboard.providerStats).toHaveLength(1);
      expect(dashboard.providerStats[0].providerId).toBe("spotify");
      expect(dashboard.providerStats[0].totalEvents).toBe(1);
      expect(dashboard.eventTypeStats).toHaveProperty("connection", 1);
    });

    test('should track failed OAuth events with error details', async () => {
      const eventId = await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "apple_music",
        eventType: "token_refresh",
        action: "refresh_access_token",
        success: false,
        duration: 3000,
        errorCode: "401",
        errorMessage: "Invalid refresh token",
        metadata: {
          platform: "android",
          responseTime: 2800
        }
      });

      expect(eventId).toBeDefined();

      const dashboard = await t.query(api.oauthAnalytics.getAnalyticsDashboard, {
        timeRange: "1h"
      });

      expect(dashboard.overview.totalEvents).toBe(1);
      expect(dashboard.overview.successfulEvents).toBe(0);
      expect(dashboard.overview.failedEvents).toBe(1);
      expect(dashboard.overview.errorRate).toBe(1);
      expect(dashboard.errorBreakdown).toHaveProperty("401", 1);
      expect(dashboard.topErrors[0][0]).toBe("401");
    });

    test('should automatically update provider performance metrics', async () => {
      // Track successful event
      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "spotify",
        eventType: "api_call",
        action: "get_user_profile",
        success: true,
        duration: 500,
        metadata: { responseTime: 450 }
      });

      // Track failed event
      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "spotify",
        eventType: "api_call",
        action: "get_playlists",
        success: false,
        duration: 2000,
        errorCode: "500",
        metadata: { responseTime: 1950 }
      });

      // Check provider performance
      const performance = await t.query(api.oauthAnalytics.getProviderPerformance, {
        providerId: "spotify",
        timeWindow: "1h"
      });

      expect(performance).toHaveLength(1);
      const perf = performance[0];
      
      expect(perf.metrics.totalRequests).toBe(2);
      expect(perf.metrics.successfulRequests).toBe(1);
      expect(perf.metrics.failedRequests).toBe(1);
      expect(perf.metrics.errorRate).toBe(0.5);
      expect(perf.metrics.averageResponseTime).toBeGreaterThan(0);
      expect(perf.errors.serverError).toBe(1);
      expect(perf.health.status).toBe("degraded"); // Error rate > 10%
    });

    test('should track time-based dimensions correctly', async () => {
      const now = new Date();
      const expectedHour = now.getHours();
      const expectedDay = now.getDay();
      const expectedMonth = now.getMonth() + 1;
      const expectedYear = now.getFullYear();

      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "youtube_music",
        eventType: "sync",
        action: "sync_playlists",
        success: true
      });

      const dashboard = await t.query(api.oauthAnalytics.getAnalyticsDashboard, {
        timeRange: "24h"
      });

      // Should have time series data
      expect(dashboard.timeSeriesData).toBeInstanceOf(Array);
      expect(dashboard.timeSeriesData.length).toBeGreaterThan(0);
      
      const dataPoint = dashboard.timeSeriesData[0];
      expect(dataPoint).toHaveProperty("timestamp");
      expect(dataPoint).toHaveProperty("count");
      expect(dataPoint.count).toBeGreaterThan(0);
    });
  });

  describe('Analytics Dashboard', () => {
    test('should provide comprehensive dashboard data', async () => {
      // Generate various events
      const events = [
        { providerId: "spotify", eventType: "connection", success: true },
        { providerId: "spotify", eventType: "api_call", success: true },
        { providerId: "spotify", eventType: "api_call", success: false, errorCode: "429" },
        { providerId: "apple_music", eventType: "connection", success: true },
        { providerId: "apple_music", eventType: "sync", success: false, errorCode: "401" },
        { providerId: "youtube_music", eventType: "token_refresh", success: true }
      ];

      for (const event of events) {
        await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
          userId,
          providerId: event.providerId,
          eventType: event.eventType,
          action: "test_action",
          success: event.success,
          errorCode: event.errorCode,
          metadata: { platform: "web" }
        });
      }

      const dashboard = await t.query(api.oauthAnalytics.getAnalyticsDashboard, {
        timeRange: "24h"
      });

      // Verify overview metrics
      expect(dashboard.overview.totalEvents).toBe(6);
      expect(dashboard.overview.successfulEvents).toBe(4);
      expect(dashboard.overview.failedEvents).toBe(2);
      expect(dashboard.overview.errorRate).toBeCloseTo(0.333, 2);

      // Verify provider stats
      expect(dashboard.providerStats).toHaveLength(3);
      const spotifyStats = dashboard.providerStats.find(p => p.providerId === "spotify");
      expect(spotifyStats.totalEvents).toBe(3);
      expect(spotifyStats.successfulEvents).toBe(2);
      expect(spotifyStats.failedEvents).toBe(1);

      // Verify event type breakdown
      expect(dashboard.eventTypeStats.connection).toBe(2);
      expect(dashboard.eventTypeStats.api_call).toBe(2);
      expect(dashboard.eventTypeStats.sync).toBe(1);
      expect(dashboard.eventTypeStats.token_refresh).toBe(1);

      // Verify error breakdown
      expect(dashboard.errorBreakdown["429"]).toBe(1);
      expect(dashboard.errorBreakdown["401"]).toBe(1);
      expect(dashboard.topErrors).toHaveLength(2);
    });

    test('should filter dashboard data by provider', async () => {
      // Generate events for multiple providers
      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "spotify",
        eventType: "connection",
        action: "connect",
        success: true
      });

      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "apple_music",
        eventType: "connection",
        action: "connect",
        success: true
      });

      // Get dashboard filtered by Spotify
      const spotifyDashboard = await t.query(api.oauthAnalytics.getAnalyticsDashboard, {
        timeRange: "24h",
        providerId: "spotify"
      });

      expect(spotifyDashboard.overview.totalEvents).toBe(1);
      expect(spotifyDashboard.providerStats).toHaveLength(1);
      expect(spotifyDashboard.providerStats[0].providerId).toBe("spotify");

      // Get unfiltered dashboard
      const allDashboard = await t.query(api.oauthAnalytics.getAnalyticsDashboard, {
        timeRange: "24h"
      });

      expect(allDashboard.overview.totalEvents).toBe(2);
      expect(allDashboard.providerStats).toHaveLength(2);
    });

    test('should respect time range filters', async () => {
      // Generate event
      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "spotify",
        eventType: "connection",
        action: "connect",
        success: true
      });

      // Should appear in 24h dashboard
      const dashboard24h = await t.query(api.oauthAnalytics.getAnalyticsDashboard, {
        timeRange: "24h"
      });
      expect(dashboard24h.overview.totalEvents).toBe(1);

      // Should appear in 1h dashboard
      const dashboard1h = await t.query(api.oauthAnalytics.getAnalyticsDashboard, {
        timeRange: "1h"
      });
      expect(dashboard1h.overview.totalEvents).toBe(1);
    });
  });

  describe('Provider Performance Tracking', () => {
    test('should track detailed performance metrics', async () => {
      // Generate events with varying response times
      const responseTimes = [100, 200, 500, 1000, 1500];
      
      for (const responseTime of responseTimes) {
        await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
          userId,
          providerId: "spotify",
          eventType: "api_call",
          action: "get_data",
          success: true,
          duration: responseTime,
          metadata: { responseTime }
        });
      }

      const performance = await t.query(api.oauthAnalytics.getProviderPerformance, {
        providerId: "spotify",
        timeWindow: "1h"
      });

      expect(performance).toHaveLength(1);
      const perf = performance[0];
      
      expect(perf.metrics.totalRequests).toBe(5);
      expect(perf.metrics.successfulRequests).toBe(5);
      expect(perf.metrics.failedRequests).toBe(0);
      expect(perf.metrics.errorRate).toBe(0);
      expect(perf.metrics.averageResponseTime).toBe(660); // (100+200+500+1000+1500)/5
      expect(perf.health.status).toBe("healthy");
      expect(perf.health.availability).toBe(1);
      expect(perf.healthScore).toBe(100); // Perfect health
    });

    test('should categorize errors correctly', async () => {
      const errorTests = [
        { errorCode: "401", expectedCategory: "authentication" },
        { errorCode: "403", expectedCategory: "authentication" },
        { errorCode: "429", expectedCategory: "rateLimit" },
        { errorCode: "500", expectedCategory: "serverError" },
        { errorCode: "503", expectedCategory: "serverError" },
        { errorCode: "timeout", expectedCategory: "timeout" },
        { errorCode: "network", expectedCategory: "network" },
        { errorCode: "unknown", expectedCategory: "other" }
      ];

      for (const { errorCode } of errorTests) {
        await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
          userId,
          providerId: "spotify",
          eventType: "api_call",
          action: "test",
          success: false,
          errorCode
        });
      }

      const performance = await t.query(api.oauthAnalytics.getProviderPerformance, {
        providerId: "spotify",
        timeWindow: "1h"
      });

      const perf = performance[0];
      expect(perf.errors.authentication).toBe(2); // 401, 403
      expect(perf.errors.rateLimit).toBe(1); // 429
      expect(perf.errors.serverError).toBe(2); // 500, 503
      expect(perf.errors.timeout).toBe(1); // timeout
      expect(perf.errors.network).toBe(1); // network
      expect(perf.errors.other).toBe(1); // unknown
    });

    test('should update health status based on error rates', async () => {
      // Generate events with high error rate
      for (let i = 0; i < 10; i++) {
        await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
          userId,
          providerId: "spotify",
          eventType: "api_call",
          action: "test",
          success: i < 3, // 30% success rate = 70% error rate
          errorCode: i >= 3 ? "500" : undefined
        });
      }

      const performance = await t.query(api.oauthAnalytics.getProviderPerformance, {
        providerId: "spotify",
        timeWindow: "1h"
      });

      const perf = performance[0];
      expect(perf.metrics.errorRate).toBe(0.7);
      expect(perf.health.status).toBe("down"); // Error rate > 25%
      expect(perf.healthScore).toBeLessThan(50);
    });

    test('should provide performance trends', async () => {
      // Generate performance data
      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "spotify",
        eventType: "api_call",
        action: "test",
        success: true,
        metadata: { responseTime: 200 }
      });

      const performance = await t.query(api.oauthAnalytics.getProviderPerformance, {
        providerId: "spotify",
        timeWindow: "1h"
      });

      expect(performance[0].trend).toBeDefined();
      expect(performance[0].trend).toMatch(/improving|stable|declining/);
    });
  });

  describe('User Engagement Analytics', () => {
    test('should track user engagement metrics', async () => {
      // Generate events for multiple users
      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "spotify",
        eventType: "connection",
        action: "connect",
        success: true,
        metadata: { platform: "ios" }
      });

      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId2,
        providerId: "spotify",
        eventType: "connection",
        action: "connect",
        success: true,
        metadata: { platform: "android" }
      });

      // Multiple sessions for user1
      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "spotify",
        eventType: "connection",
        action: "reconnect",
        success: true,
        metadata: { platform: "ios" }
      });

      const engagement = await t.query(api.oauthAnalytics.getUserEngagementAnalytics, {
        timeRange: "24h"
      });

      expect(engagement.summary.uniqueUsers).toBe(2);
      expect(engagement.summary.totalSessions).toBe(3);
      expect(engagement.summary.avgSessionsPerUser).toBe(1.5);

      expect(engagement.platformDistribution.ios).toBe(2);
      expect(engagement.platformDistribution.android).toBe(1);

      expect(engagement.peakHours).toBeInstanceOf(Array);
      expect(engagement.peakHours.length).toBeGreaterThan(0);
      expect(engagement.peakHours[0]).toHaveProperty("hour");
      expect(engagement.peakHours[0]).toHaveProperty("count");

      expect(engagement.engagementTrends).toBeInstanceOf(Array);
    });

    test('should filter engagement analytics by user', async () => {
      // Generate events for specific user
      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "spotify",
        eventType: "connection",
        action: "connect",
        success: true
      });

      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId2,
        providerId: "apple_music",
        eventType: "connection",
        action: "connect",
        success: true
      });

      const userEngagement = await t.query(api.oauthAnalytics.getUserEngagementAnalytics, {
        userId,
        timeRange: "24h"
      });

      expect(userEngagement.summary.uniqueUsers).toBe(1);
      expect(userEngagement.summary.totalSessions).toBe(1);
    });

    test('should track peak usage times', async () => {
      const currentHour = new Date().getHours();
      
      // Generate multiple events in current hour
      for (let i = 0; i < 5; i++) {
        await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
          userId,
          providerId: "spotify",
          eventType: "api_call",
          action: `call_${i}`,
          success: true
        });
      }

      const engagement = await t.query(api.oauthAnalytics.getUserEngagementAnalytics, {
        timeRange: "24h"
      });

      expect(engagement.peakHours[0].hour).toBe(currentHour);
      expect(engagement.peakHours[0].count).toBe(5);
    });
  });

  describe('Custom Analytics Reports', () => {
    test('should generate performance report', async () => {
      // Generate test data
      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "spotify",
        eventType: "api_call",
        action: "test",
        success: true,
        metadata: { responseTime: 500 }
      });

      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "spotify",
        eventType: "api_call",
        action: "test",
        success: false,
        errorCode: "500"
      });

      const report = await t.mutation(api.oauthAnalytics.generateAnalyticsReport, {
        reportType: "performance",
        timeRange: "24h",
        filters: { providerId: "spotify" }
      });

      expect(report.reportId).toBeDefined();
      expect(report.type).toBe("performance");
      expect(report.timeRange).toBe("24h");
      expect(report.dataPoints).toBe(2);
      expect(report.summary.totalRequests).toBe(2);
      expect(report.summary.successfulRequests).toBe(1);
      expect(report.summary.successRate).toBe(0.5);
      expect(report.summary.avgResponseTime).toBe(500);
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    test('should generate usage report', async () => {
      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "spotify",
        eventType: "connection",
        action: "connect",
        success: true
      });

      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId2,
        providerId: "apple_music",
        eventType: "sync",
        action: "sync",
        success: true
      });

      const report = await t.mutation(api.oauthAnalytics.generateAnalyticsReport, {
        reportType: "usage",
        timeRange: "24h"
      });

      expect(report.summary.totalEvents).toBe(2);
      expect(report.summary.uniqueUsers).toBe(2);
      expect(report.summary.avgEventsPerUser).toBe(1);
      expect(report.providerUsage.spotify).toBe(1);
      expect(report.providerUsage.apple_music).toBe(1);
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    test('should generate error report', async () => {
      // Generate various errors
      const errors = [
        { errorCode: "401", count: 3 },
        { errorCode: "429", count: 2 },
        { errorCode: "500", count: 1 }
      ];

      for (const { errorCode, count } of errors) {
        for (let i = 0; i < count; i++) {
          await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
            userId,
            providerId: "spotify",
            eventType: "api_call",
            action: "test",
            success: false,
            errorCode
          });
        }
      }

      const report = await t.mutation(api.oauthAnalytics.generateAnalyticsReport, {
        reportType: "errors",
        timeRange: "24h"
      });

      expect(report.summary.totalErrors).toBe(6);
      expect(report.summary.errorRate).toBe(1); // All events were errors
      expect(report.summary.uniqueErrorTypes).toBe(3);
      expect(report.errorTypes["401"]).toBe(3);
      expect(report.errorTypes["429"]).toBe(2);
      expect(report.errorTypes["500"]).toBe(1);
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    test('should generate custom report with specific metrics', async () => {
      // Generate data for custom metrics
      const responseTimes = [100, 200, 500, 1000, 2000];
      
      for (const responseTime of responseTimes) {
        await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
          userId,
          providerId: "spotify",
          eventType: "api_call",
          action: "test",
          success: true,
          metadata: { responseTime }
        });
      }

      const report = await t.mutation(api.oauthAnalytics.generateAnalyticsReport, {
        reportType: "custom",
        timeRange: "24h",
        metrics: ["response_time_percentiles", "geographic_distribution"]
      });

      expect(report.customMetrics).toBeDefined();
      expect(report.customMetrics.response_time_percentiles).toBeDefined();
      expect(report.customMetrics.response_time_percentiles.p50).toBe(500);
      expect(report.customMetrics.response_time_percentiles.p90).toBe(2000);
      expect(report.customMetrics.response_time_percentiles.p95).toBe(2000);
      expect(report.customMetrics.response_time_percentiles.p99).toBe(2000);
      expect(report.customMetrics.geographic_distribution).toBeDefined();
    });

    test('should apply filters correctly in reports', async () => {
      // Generate data for different providers
      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "spotify",
        eventType: "api_call",
        action: "test",
        success: true
      });

      await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
        userId,
        providerId: "apple_music",
        eventType: "api_call",
        action: "test",
        success: true
      });

      // Generate filtered report
      const report = await t.mutation(api.oauthAnalytics.generateAnalyticsReport, {
        reportType: "usage",
        timeRange: "24h",
        filters: {
          providerId: "spotify",
          eventType: "api_call"
        }
      });

      expect(report.dataPoints).toBe(1); // Only Spotify event should be included
      expect(report.filters.providerId).toBe("spotify");
      expect(report.filters.eventType).toBe("api_call");
    });
  });

  describe('Analytics Performance and Scalability', () => {
    test('should handle high volume of analytics events', async () => {
      const startTime = Date.now();
      const eventCount = 100;

      // Generate large number of events
      const promises = Array.from({ length: eventCount }, (_, i) =>
        t.mutation(api.oauthAnalytics.trackOAuthEvent, {
          userId: i % 2 === 0 ? userId : userId2,
          providerId: "spotify",
          eventType: "api_call",
          action: `api_call_${i}`,
          success: Math.random() > 0.1, // 90% success rate
          metadata: { 
            responseTime: Math.floor(Math.random() * 1000) + 100,
            platform: i % 3 === 0 ? "ios" : i % 3 === 1 ? "android" : "web"
          }
        })
      );

      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds

      // Verify all events were tracked
      const dashboard = await t.query(api.oauthAnalytics.getAnalyticsDashboard, {
        timeRange: "24h"
      });

      expect(dashboard.overview.totalEvents).toBe(eventCount);
    });

    test('should maintain query performance with large dataset', async () => {
      // Generate varied analytics data
      const providers = ["spotify", "apple_music", "youtube_music"];
      const eventTypes = ["connection", "api_call", "sync", "token_refresh"];
      
      for (let i = 0; i < 50; i++) {
        await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
          userId: i % 2 === 0 ? userId : userId2,
          providerId: providers[i % providers.length],
          eventType: eventTypes[i % eventTypes.length],
          action: `action_${i}`,
          success: Math.random() > 0.2,
          errorCode: Math.random() < 0.2 ? "500" : undefined
        });
      }

      const startTime = Date.now();
      
      // Run multiple complex queries
      const [dashboard, performance, engagement] = await Promise.all([
        t.query(api.oauthAnalytics.getAnalyticsDashboard, { timeRange: "24h" }),
        t.query(api.oauthAnalytics.getProviderPerformance, { timeWindow: "24h" }),
        t.query(api.oauthAnalytics.getUserEngagementAnalytics, { timeRange: "24h" })
      ]);
      
      const endTime = Date.now();
      const queryDuration = endTime - startTime;

      // Queries should complete quickly
      expect(queryDuration).toBeLessThan(2000); // 2 seconds
      expect(dashboard.overview.totalEvents).toBe(50);
      expect(performance.length).toBeGreaterThan(0);
      expect(engagement.summary.uniqueUsers).toBe(2);
    });
  });

  describe('Analytics Data Integrity', () => {
    test('should maintain accurate counts across all aggregations', async () => {
      // Generate controlled dataset
      const testEvents = [
        { userId, providerId: "spotify", success: true, eventType: "connection" },
        { userId, providerId: "spotify", success: false, eventType: "api_call", errorCode: "401" },
        { userId2, providerId: "apple_music", success: true, eventType: "sync" },
        { userId2, providerId: "apple_music", success: false, eventType: "token_refresh", errorCode: "500" }
      ];

      for (const event of testEvents) {
        await t.mutation(api.oauthAnalytics.trackOAuthEvent, {
          userId: event.userId,
          providerId: event.providerId,
          eventType: event.eventType,
          action: "test",
          success: event.success,
          errorCode: event.errorCode
        });
      }

      // Verify dashboard aggregations
      const dashboard = await t.query(api.oauthAnalytics.getAnalyticsDashboard, {
        timeRange: "24h"
      });

      expect(dashboard.overview.totalEvents).toBe(4);
      expect(dashboard.overview.successfulEvents).toBe(2);
      expect(dashboard.overview.failedEvents).toBe(2);
      expect(dashboard.overview.errorRate).toBe(0.5);

      // Verify provider breakdown matches
      const spotifyStats = dashboard.providerStats.find(p => p.providerId === "spotify");
      const appleMusicStats = dashboard.providerStats.find(p => p.providerId === "apple_music");
      
      expect(spotifyStats.totalEvents).toBe(2);
      expect(spotifyStats.successfulEvents).toBe(1);
      expect(spotifyStats.failedEvents).toBe(1);
      
      expect(appleMusicStats.totalEvents).toBe(2);
      expect(appleMusicStats.successfulEvents).toBe(1);
      expect(appleMusicStats.failedEvents).toBe(1);

      // Verify event type breakdown
      const totalEventTypes = Object.values(dashboard.eventTypeStats).reduce((sum: number, count) => sum + (count as number), 0);
      expect(totalEventTypes).toBe(4);
    });

    test('should handle concurrent analytics updates correctly', async () => {
      // Generate concurrent events for same provider
      const concurrentPromises = Array.from({ length: 10 }, () =>
        t.mutation(api.oauthAnalytics.trackOAuthEvent, {
          userId,
          providerId: "spotify",
          eventType: "api_call",
          action: "concurrent_test",
          success: true,
          metadata: { responseTime: 100 }
        })
      );

      await Promise.all(concurrentPromises);

      // Verify all events were counted
      const performance = await t.query(api.oauthAnalytics.getProviderPerformance, {
        providerId: "spotify",
        timeWindow: "1h"
      });

      expect(performance[0].metrics.totalRequests).toBe(10);
      expect(performance[0].metrics.successfulRequests).toBe(10);
      expect(performance[0].metrics.failedRequests).toBe(0);
    });
  });
});