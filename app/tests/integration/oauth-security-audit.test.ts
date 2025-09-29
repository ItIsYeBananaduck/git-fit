import { describe, test, expect, beforeEach } from 'vitest';
import { ConvexTestingHelper } from 'convex/testing';
import { api } from '../../../convex/_generated/api.js';
import { Id } from '../../../convex/_generated/dataModel.js';

describe('OAuth Security Audit Integration Tests', () => {
  let t: ConvexTestingHelper;
  let userId: Id<"users">;
  
  beforeEach(async () => {
    t = new ConvexTestingHelper();
    
    // Create test user
    userId = await t.mutation(api.users.create, {
      email: "test@example.com",
      name: "Test User"
    });
  });

  describe('Security Event Logging', () => {
    test('should log security events with proper risk assessment', async () => {
      const eventId = await t.mutation(api.oauthSecurityAudit.logSecurityEvent, {
        userId,
        eventType: "login_attempt",
        riskLevel: 2,
        description: "Multiple login attempts from new IP",
        metadata: {
          ip: "192.168.1.1",
          userAgent: "Mozilla/5.0...",
          provider: "spotify",
          endpoint: "/auth/callback"
        }
      });

      expect(eventId).toBeDefined();

      // Verify event was logged correctly
      const userLog = await t.query(api.oauthSecurityAudit.getUserSecurityLog, {
        userId,
        limit: 5
      });

      expect(userLog).toHaveLength(1);
      expect(userLog[0].eventType).toBe("login_attempt");
      expect(userLog[0].riskLevel).toBe(2);
      expect(userLog[0].metadata.ip).toBe("192.168.1.1");
    });

    test('should trigger security alerts for high-risk events', async () => {
      const eventId = await t.mutation(api.oauthSecurityAudit.logSecurityEvent, {
        userId,
        eventType: "security_violation",
        riskLevel: 4, // Critical
        description: "Attempted token manipulation detected",
        metadata: {
          ip: "10.0.0.1",
          provider: "spotify",
          errorCode: "INVALID_TOKEN_SIGNATURE"
        }
      });

      expect(eventId).toBeDefined();

      // Verify alert was created
      const alerts = await t.query(api.securityAlerts.getUnacknowledgedAlerts);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertLevel).toBe("critical");
      expect(alerts[0].eventId).toBe(eventId);
    });

    test('should detect rate limiting violations', async () => {
      // Generate multiple events rapidly to trigger rate limiting
      const promises = Array.from({ length: 12 }, () =>
        t.mutation(api.oauthSecurityAudit.logSecurityEvent, {
          userId,
          eventType: "login_attempt",
          riskLevel: 1,
          description: "Rapid login attempt",
          metadata: { ip: "192.168.1.1" }
        })
      );

      await Promise.all(promises);

      // Check for rate limit violation event
      const userLog = await t.query(api.oauthSecurityAudit.getUserSecurityLog, {
        userId,
        riskLevelFilter: 2 // Medium risk
      });

      const rateLimitEvents = userLog.filter(event => 
        event.eventType === "rate_limit_exceeded"
      );
      expect(rateLimitEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Anomaly Detection', () => {
    test('should detect multiple IP addresses', async () => {
      const ipAddresses = ["192.168.1.1", "10.0.0.1", "172.16.0.1", "203.0.113.1"];
      
      // Log events from different IPs within short time window
      const promises = ipAddresses.map(ip =>
        t.mutation(api.oauthSecurityAudit.logSecurityEvent, {
          userId,
          eventType: "login_attempt",
          riskLevel: 1,
          description: "Login from different IP",
          metadata: { ip }
        })
      );

      await Promise.all(promises);

      // Should detect suspicious activity
      const userLog = await t.query(api.oauthSecurityAudit.getUserSecurityLog, {
        userId,
        riskLevelFilter: 3 // High risk
      });

      const suspiciousEvents = userLog.filter(event => 
        event.eventType === "suspicious_activity" &&
        event.metadata.pattern === "multiple_ips"
      );
      expect(suspiciousEvents.length).toBeGreaterThan(0);
    });

    test('should detect rapid sequence of events', async () => {
      // Create rapid sequence of events
      for (let i = 0; i < 5; i++) {
        await t.mutation(api.oauthSecurityAudit.logSecurityEvent, {
          userId,
          eventType: "token_refresh",
          riskLevel: 1,
          description: "Rapid token refresh",
          metadata: { ip: "192.168.1.1" }
        });
        // Small delay to simulate rapid but not instant events
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Check for rapid sequence detection
      const userLog = await t.query(api.oauthSecurityAudit.getUserSecurityLog, {
        userId,
        riskLevelFilter: 2 // Medium risk
      });

      const rapidSequenceEvents = userLog.filter(event => 
        event.eventType === "suspicious_activity" &&
        event.metadata.pattern === "rapid_sequence"
      );
      expect(rapidSequenceEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Token Security Validation', () => {
    test('should validate token security properties', async () => {
      const now = Date.now();
      const validationResult = await t.mutation(api.oauthSecurityAudit.validateTokenSecurity, {
        userId,
        provider: "spotify",
        tokenData: {
          accessToken: "valid_long_access_token_123456789",
          refreshToken: "valid_refresh_token_987654321",
          expiresAt: now + (60 * 60 * 1000) // 1 hour from now
        }
      });

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.riskLevel).toBeLessThan(3);
      expect(validationResult.securityChecks).toBeInstanceOf(Array);
    });

    test('should detect token security issues', async () => {
      const now = Date.now();
      const validationResult = await t.mutation(api.oauthSecurityAudit.validateTokenSecurity, {
        userId,
        provider: "spotify",
        tokenData: {
          accessToken: "short", // Suspiciously short token
          expiresAt: now + (2 * 60 * 1000) // Expires in 2 minutes
        }
      });

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.riskLevel).toBeGreaterThanOrEqual(3);
      expect(validationResult.securityChecks.some(check => 
        check.check === "token_length"
      )).toBe(true);
    });
  });

  describe('Security Metrics and Reporting', () => {
    test('should generate comprehensive security metrics', async () => {
      // Generate various security events
      await t.mutation(api.oauthSecurityAudit.logSecurityEvent, {
        userId,
        eventType: "login_attempt",
        riskLevel: 1,
        description: "Successful login"
      });

      await t.mutation(api.oauthSecurityAudit.logSecurityEvent, {
        userId,
        eventType: "invalid_token",
        riskLevel: 2,
        description: "Invalid token used"
      });

      await t.mutation(api.oauthSecurityAudit.logSecurityEvent, {
        userId,
        eventType: "security_violation",
        riskLevel: 4,
        description: "Critical security violation"
      });

      const metrics = await t.query(api.oauthSecurityAudit.getSecurityMetrics, {
        timeRange: "24h"
      });

      expect(metrics.totalEvents).toBe(3);
      expect(metrics.riskDistribution.low).toBe(1);
      expect(metrics.riskDistribution.medium).toBe(1);
      expect(metrics.riskDistribution.critical).toBe(1);
      expect(metrics.uniqueUsers).toBe(1);
      expect(metrics.eventTypes).toHaveProperty("login_attempt");
      expect(metrics.eventTypes).toHaveProperty("invalid_token");
      expect(metrics.eventTypes).toHaveProperty("security_violation");
    });

    test('should generate detailed security report', async () => {
      // Generate test events for reporting
      const eventTypes = ["login_attempt", "token_refresh", "suspicious_activity"];
      const riskLevels = [1, 2, 3];

      for (const eventType of eventTypes) {
        for (const riskLevel of riskLevels) {
          await t.mutation(api.oauthSecurityAudit.logSecurityEvent, {
            userId,
            eventType,
            riskLevel,
            description: `Test ${eventType} with risk ${riskLevel}`
          });
        }
      }

      const report = await t.query(api.oauthSecurityAudit.generateSecurityReport, {
        reportType: "daily",
        includeDetails: true
      });

      expect(report.summary.totalEvents).toBe(9);
      expect(report.summary.criticalEvents).toBe(3);
      expect(report.summary.highRiskEvents).toBe(3);
      expect(report.topRisks).toBeInstanceOf(Array);
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.details).toBeDefined();
      expect(report.details.eventBreakdown).toHaveProperty("login_attempt");
      expect(report.details.riskTrends).toBeInstanceOf(Array);
      expect(report.details.userRisks).toBeInstanceOf(Array);
    });
  });

  describe('Security Alert Management', () => {
    test('should create and manage security alerts', async () => {
      // Generate high-risk event that should trigger alert
      const eventId = await t.mutation(api.oauthSecurityAudit.logSecurityEvent, {
        userId,
        eventType: "unauthorized_access",
        riskLevel: 4,
        description: "Unauthorized access attempt detected",
        metadata: {
          ip: "malicious.ip.address",
          userAgent: "suspicious-bot/1.0"
        }
      });

      // Verify alert was created
      const alerts = await t.query(api.securityAlerts.getUnacknowledgedAlerts);
      expect(alerts.length).toBeGreaterThan(0);

      const alert = alerts.find(a => a.eventId === eventId);
      expect(alert).toBeDefined();
      expect(alert.alertLevel).toBe("critical");
      expect(alert.acknowledged).toBe(false);
    });

    test('should track alert resolution workflow', async () => {
      // Create high-risk event
      const eventId = await t.mutation(api.oauthSecurityAudit.logSecurityEvent, {
        userId,
        eventType: "security_violation",
        riskLevel: 4,
        description: "Critical security violation"
      });

      // Get the alert
      const alerts = await t.query(api.securityAlerts.getUnacknowledgedAlerts);
      const alert = alerts.find(a => a.eventId === eventId);
      expect(alert).toBeDefined();

      // Acknowledge alert
      await t.mutation(api.securityAlerts.acknowledgeAlert, {
        alertId: alert._id,
        acknowledgedBy: "security_admin",
        resolution: "Investigated and resolved - false positive"
      });

      // Verify alert is acknowledged
      const acknowledgedAlerts = await t.query(api.securityAlerts.getAcknowledgedAlerts);
      const acknowledgedAlert = acknowledgedAlerts.find(a => a._id === alert._id);
      expect(acknowledgedAlert.acknowledged).toBe(true);
      expect(acknowledgedAlert.acknowledgedBy).toBe("security_admin");
      expect(acknowledgedAlert.resolution).toBe("Investigated and resolved - false positive");
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle high volume of security events efficiently', async () => {
      const startTime = Date.now();
      const eventCount = 100;

      // Generate large number of events
      const promises = Array.from({ length: eventCount }, (_, i) =>
        t.mutation(api.oauthSecurityAudit.logSecurityEvent, {
          userId,
          eventType: "api_call",
          riskLevel: 1,
          description: `API call ${i}`,
          metadata: { endpoint: `/api/endpoint/${i}` }
        })
      );

      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (< 5 seconds for 100 events)
      expect(duration).toBeLessThan(5000);

      // Verify all events were logged
      const userLog = await t.query(api.oauthSecurityAudit.getUserSecurityLog, {
        userId,
        limit: 150 // More than eventCount to ensure we get all
      });

      expect(userLog.length).toBeGreaterThanOrEqual(eventCount);
    });

    test('should maintain query performance with large dataset', async () => {
      // Generate varied security events
      const eventTypes = ["login_attempt", "token_refresh", "api_call", "sync", "error"];
      
      for (let i = 0; i < 200; i++) {
        await t.mutation(api.oauthSecurityAudit.logSecurityEvent, {
          userId,
          eventType: eventTypes[i % eventTypes.length],
          riskLevel: (i % 4) + 1,
          description: `Performance test event ${i}`,
          metadata: { 
            ip: `192.168.1.${(i % 254) + 1}`,
            endpoint: `/api/endpoint/${i % 10}`
          }
        });
      }

      const startTime = Date.now();
      
      // Query metrics (should be fast even with 200+ events)
      const metrics = await t.query(api.oauthSecurityAudit.getSecurityMetrics, {
        timeRange: "24h"
      });
      
      // Query filtered events
      const highRiskEvents = await t.query(api.oauthSecurityAudit.getUserSecurityLog, {
        userId,
        riskLevelFilter: 3,
        limit: 50
      });

      const endTime = Date.now();
      const queryDuration = endTime - startTime;

      // Queries should complete quickly (< 1 second)
      expect(queryDuration).toBeLessThan(1000);
      expect(metrics.totalEvents).toBeGreaterThanOrEqual(200);
      expect(highRiskEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Data Retention and Cleanup', () => {
    test('should respect data retention policies', async () => {
      const now = Date.now();
      const twoYearsAgo = now - (2 * 365 * 24 * 60 * 60 * 1000);

      // Create event that should expire
      const expiredEventId = await t.mutation(api.oauthSecurityAudit.logSecurityEvent, {
        userId,
        eventType: "expired_test_event",
        riskLevel: 1,
        description: "Event that should expire",
        metadata: { timestamp: twoYearsAgo }
      });

      // Simulate retention cleanup (would be automated in production)
      await t.mutation(api.oauthSecurityAudit.cleanupExpiredEvents);

      // Verify expired events are cleaned up
      const allEvents = await t.query(api.oauthSecurityAudit.getUserSecurityLog, {
        userId,
        limit: 1000
      });

      const expiredEvents = allEvents.filter(event => 
        event.eventType === "expired_test_event"
      );
      
      // Expired events should be removed
      expect(expiredEvents.length).toBe(0);
    });
  });
});