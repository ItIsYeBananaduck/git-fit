import { describe, it, expect, vi, beforeEach } from 'vitest';
import { advancedAnalyticsService } from '../advancedAnalyticsService';

// Mock the dependencies
vi.mock('../adminAuth', () => ({
  adminAuthService: {
    validateAdminPermissions: vi.fn().mockResolvedValue(true),
    logAdminAction: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../../convex', () => ({
  convex: {
    query: vi.fn(),
    mutation: vi.fn()
  }
}));

describe('AdvancedAnalyticsService', () => {
  const mockAdminId = 'admin123' as any;
  const mockDateRange = {
    start: '2024-01-01',
    end: '2024-01-31'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserBehaviorAnalytics', () => {
    it('should return user behavior analytics data', async () => {
      const result = await advancedAnalyticsService.getUserBehaviorAnalytics(
        mockDateRange,
        'role',
        mockAdminId
      );

      expect(result).toBeDefined();
      expect(result.totalUsers).toBeGreaterThan(0);
      expect(result.totalSessions).toBeGreaterThan(0);
      expect(result.segments).toBeDefined();
      expect(result.cohorts).toBeDefined();
      expect(result.behaviorPatterns).toBeDefined();
    });

    it('should include behavior patterns', async () => {
      const result = await advancedAnalyticsService.getUserBehaviorAnalytics(
        mockDateRange,
        'role',
        mockAdminId
      );

      expect(result.behaviorPatterns.mostActiveHours).toHaveLength(4);
      expect(result.behaviorPatterns.commonWorkoutTypes).toHaveLength(4);
      expect(result.behaviorPatterns.dropoffPoints).toHaveLength(3);
    });
  });

  describe('getConversionFunnelAnalytics', () => {
    it('should return signup funnel data', async () => {
      const result = await advancedAnalyticsService.getConversionFunnelAnalytics(
        'signup',
        mockDateRange,
        mockAdminId
      );

      expect(result.funnelType).toBe('signup');
      expect(result.steps).toHaveLength(5);
      expect(result.totalUsers).toBeGreaterThan(0);
      expect(result.overallConversion).toBeGreaterThan(0);
      expect(result.dropoffAnalysis).toHaveLength(2);
    });

    it('should return purchase funnel data', async () => {
      const result = await advancedAnalyticsService.getConversionFunnelAnalytics(
        'purchase',
        mockDateRange,
        mockAdminId
      );

      expect(result.funnelType).toBe('purchase');
      expect(result.steps).toHaveLength(5);
      expect(result.overallConversion).toBeLessThan(100);
    });

    it('should return engagement funnel data', async () => {
      const result = await advancedAnalyticsService.getConversionFunnelAnalytics(
        'engagement',
        mockDateRange,
        mockAdminId
      );

      expect(result.funnelType).toBe('engagement');
      expect(result.steps).toHaveLength(5);
      expect(result.totalUsers).toBeGreaterThan(0);
    });
  });

  describe('analyzeCohortRetention', () => {
    it('should return cohort retention data', async () => {
      const result = await advancedAnalyticsService.analyzeCohortRetention(
        'monthly',
        mockDateRange.start,
        mockDateRange.end,
        mockAdminId
      );

      expect(result.cohortPeriod).toBe('monthly');
      expect(result.cohorts).toBeDefined();
      expect(result.averageRetention).toBeDefined();
    });
  });

  describe('generateCustomReport', () => {
    it('should generate a custom report', async () => {
      const reportConfig = {
        name: 'Test Report',
        type: 'users' as const,
        dateRange: mockDateRange,
        metrics: ['total_users', 'active_users'],
        format: 'json' as const
      };

      const result = await advancedAnalyticsService.generateCustomReport(
        reportConfig,
        mockAdminId
      );

      expect(result.reportId).toBeDefined();
      expect(result.name).toBe('Test Report');
      expect(result.format).toBe('json');
    });
  });

  describe('getUserSegmentation', () => {
    it('should return user segmentation data', async () => {
      const result = await advancedAnalyticsService.getUserSegmentation(
        'behavioral',
        { segmentBy: 'engagement' },
        mockAdminId
      );

      expect(result.segmentationType).toBe('behavioral');
      expect(result.segments).toHaveLength(2);
      expect(result.totalUsers).toBeGreaterThan(0);
    });
  });
});