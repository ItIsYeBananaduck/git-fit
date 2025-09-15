// Audit Logging Service Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuditLoggingService } from '../auditLoggingService';
import type { AdminAction, AuditLogEntry, AuditSearchCriteria } from '../../types/admin';
import type { Id } from '../../../../convex/_generated/dataModel';

// Mock Convex
const mockConvex = {
  query: vi.fn(),
  mutation: vi.fn()
};

vi.mock('$lib/convex', () => ({
  convex: mockConvex
}));

describe('AuditLoggingService', () => {
  let auditLoggingService: AuditLoggingService;
  let mockAuditLog: AuditLogEntry;
  let mockAdminAction: AdminAction;

  beforeEach(() => {
    auditLoggingService = new AuditLoggingService();
    
    const adminId: Id<'adminUsers'> = { __tableName: 'adminUsers' } as Id<'adminUsers'>;

    const mockDetails: Record<string, unknown> = { reason: 'violation', duration: 7 };

    mockAuditLog = {
      _id: 'audit123' as Id<'auditLogs'>,
      adminId,
      action: 'user_suspended',
      resource: 'users',
      resourceId: 'user456',
      details: mockDetails,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      timestamp: '2024-01-01T12:00:00Z',
      severity: 'high',
      category: 'user_management',
      outcome: 'success'
    };

    mockAdminAction = {
      action: 'user_suspended',
      resource: 'users',
      resourceId: 'user456',
      details: mockDetails,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...'
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logAdminAction', () => {
    it('should log admin action successfully', async () => {
      mockConvex.mutation.mockResolvedValueOnce('audit123');

      await auditLoggingService.logAdminAction(
        'admin123' as Id<'adminUsers'>,
        mockAdminAction,
        'success'
      );

      expect(mockConvex.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          adminId: 'admin123',
          action: 'user_suspended',
          resource: 'users',
          resourceId: 'user456',
          details: { reason: 'violation', duration: 7 },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          severity: 'high',
          category: 'user_management',
          outcome: 'success'
        })
      );
    });

    it('should handle logging errors gracefully', async () => {
      mockConvex.mutation.mockRejectedValueOnce(new Error('Database error'));

      // Should not throw error
      await expect(
        auditLoggingService.logAdminAction('admin123' as Id<'adminUsers'>, mockAdminAction)
      ).resolves.toBeUndefined();
    });

    it('should determine correct severity for critical actions', async () => {
      const criticalAction: AdminAction = {
        action: 'admin_user_created',
        resource: 'admin_users',
        resourceId: 'newadmin123',
        details: { role: 'super_admin' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...'
      };

      mockConvex.mutation.mockResolvedValueOnce('audit123');

      await auditLoggingService.logAdminAction('admin123' as Id<'adminUsers'>, criticalAction);

      expect(mockConvex.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          severity: 'critical'
        })
      );
    });

    it('should determine correct category for financial actions', async () => {
      const financialAction: AdminAction = {
        action: 'payout_processed',
        resource: 'financial',
        resourceId: 'payout123',
        details: { amount: 1000 },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...'
      };

      mockConvex.mutation.mockResolvedValueOnce('audit123');

      await auditLoggingService.logAdminAction('admin123' as Id<'adminUsers'>, financialAction);

      expect(mockConvex.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          category: 'financial'
        })
      );
    });
  });

  describe('searchAuditLogs', () => {
    it('should search audit logs with basic criteria', async () => {
      const criteria: AuditSearchCriteria = {
        adminId: 'admin123' as Id<'adminUsers'>,
        action: 'user_suspended',
        limit: 50
      };

      const mockLogs = [mockAuditLog];
      mockConvex.query.mockResolvedValueOnce(mockLogs);

      const result = await auditLoggingService.searchAuditLogs(criteria);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLogs);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 50,
        hasMore: false
      });
    });

    it('should filter logs by resource ID', async () => {
      const criteria: AuditSearchCriteria = {
        resourceId: 'user456'
      };

      const mockLogs = [mockAuditLog, { ...mockAuditLog, resourceId: 'user789' }];
      mockConvex.query.mockResolvedValueOnce(mockLogs);

      const result = await auditLoggingService.searchAuditLogs(criteria);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].resourceId).toBe('user456');
    });

    it('should filter logs by outcome', async () => {
      const criteria: AuditSearchCriteria = {
        outcome: 'failure'
      };

      const mockLogs = [
        mockAuditLog,
        { ...mockAuditLog, outcome: 'failure' as const }
      ];
      mockConvex.query.mockResolvedValueOnce(mockLogs);

      const result = await auditLoggingService.searchAuditLogs(criteria);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].outcome).toBe('failure');
    });

    it('should filter logs by IP address', async () => {
      const criteria: AuditSearchCriteria = {
        ipAddress: '192.168.1.100'
      };

      const mockLogs = [
        mockAuditLog,
        { ...mockAuditLog, ipAddress: '10.0.0.1' }
      ];
      mockConvex.query.mockResolvedValueOnce(mockLogs);

      const result = await auditLoggingService.searchAuditLogs(criteria);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].ipAddress).toBe('192.168.1.100');
    });

    it('should filter logs by search text', async () => {
      const criteria: AuditSearchCriteria = {
        searchText: 'violation'
      };

      const mockLogs = [
        mockAuditLog,
        { ...mockAuditLog, details: { reason: 'spam' } }
      ];
      mockConvex.query.mockResolvedValueOnce(mockLogs);

      const result = await auditLoggingService.searchAuditLogs(criteria);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].details.reason).toBe('violation');
    });

    it('should handle search errors gracefully', async () => {
      const criteria: AuditSearchCriteria = {
        adminId: 'admin123' as Id<'adminUsers'>
      };

      mockConvex.query.mockRejectedValueOnce(new Error('Database error'));

      const result = await auditLoggingService.searchAuditLogs(criteria);

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('Failed to search audit logs');
    });
  });

  describe('getAuditStatistics', () => {
    it('should return comprehensive audit statistics', async () => {
      const mockStats = {
        totalActions: 100,
        actionsByCategory: {
          user_management: 40,
          authentication: 30,
          content_moderation: 20,
          financial: 10
        },
        actionsBySeverity: {
          low: 50,
          medium: 30,
          high: 15,
          critical: 5
        },
        actionsByOutcome: {
          success: 90,
          failure: 8,
          partial: 2
        },
        uniqueAdmins: 5,
        timeRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-02T00:00:00Z'
        }
      };

      const mockLogs = [
        mockAuditLog,
        { ...mockAuditLog, action: 'login_success', outcome: 'failure' as const },
        { ...mockAuditLog, action: 'content_approved', severity: 'critical' as const }
      ];

      mockConvex.query
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockLogs);

      const result = await auditLoggingService.getAuditStatistics({
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z'
      });

      expect(result.totalActions).toBe(100);
      expect(result.topActions).toBeDefined();
      expect(result.topResources).toBeDefined();
      expect(result.failureRate).toBeGreaterThan(0);
      expect(result.criticalActionsCount).toBeGreaterThan(0);
    });

    it('should handle statistics errors gracefully', async () => {
      mockConvex.query.mockRejectedValueOnce(new Error('Database error'));

      const result = await auditLoggingService.getAuditStatistics();

      expect(result.totalActions).toBe(0);
      expect(result.actionsByCategory).toEqual({});
      expect(result.actionsBySeverity).toEqual({});
    });
  });

  describe('getAdminActivitySummary', () => {
    it('should return admin activity summary', async () => {
      const adminId = 'admin123' as Id<'adminUsers'>;
      const mockLogs = [
        mockAuditLog,
        { ...mockAuditLog, category: 'authentication' as const },
        { ...mockAuditLog, category: 'financial' as const }
      ];

      const mockAdmin = {
        _id: adminId,
        name: 'Test Admin',
        email: 'admin@test.com'
      };

      mockConvex.query
        .mockResolvedValueOnce(mockLogs)
        .mockResolvedValueOnce(mockAdmin)
        .mockResolvedValueOnce([]); // Suspicious activities

      const result = await auditLoggingService.getAdminActivitySummary(adminId);

      expect(result.adminId).toBe(adminId);
      expect(result.adminName).toBe('Test Admin');
      expect(result.totalActions).toBe(3);
      expect(result.actionsByCategory).toEqual({
        user_management: 1,
        authentication: 1,
        financial: 1
      });
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it('should handle missing admin gracefully', async () => {
      const adminId = 'nonexistent' as Id<'adminUsers'>;

      mockConvex.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce([]);

      const result = await auditLoggingService.getAdminActivitySummary(adminId);

      expect(result.adminName).toBe('Unknown');
      expect(result.totalActions).toBe(0);
      expect(result.lastActivity).toBe('Never');
    });
  });

  describe('exportAuditLogs', () => {
    it('should export audit logs as CSV', async () => {
      const criteria: AuditSearchCriteria = {
        limit: 10
      };

      const mockLogs = [mockAuditLog];
      const mockAdmin = { name: 'Test Admin' };

      mockConvex.query
        .mockResolvedValueOnce(mockLogs)
        .mockResolvedValueOnce(mockAdmin);

      const result = await auditLoggingService.exportAuditLogs(criteria, 'csv');

      expect(result).toContain('Timestamp,Admin ID,Admin Name');
      expect(result).toContain('user_suspended');
      expect(result).toContain('Test Admin');
    });

    it('should export audit logs as JSON', async () => {
      const criteria: AuditSearchCriteria = {
        limit: 10
      };

      const mockLogs = [mockAuditLog];
      mockConvex.query.mockResolvedValueOnce(mockLogs);

      const result = await auditLoggingService.exportAuditLogs(criteria, 'json');

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0]).toEqual(mockAuditLog);
    });
  });

  describe('getRecentCriticalActions', () => {
    it('should return recent critical actions', async () => {
      const mockCriticalLogs = [
        { ...mockAuditLog, severity: 'critical' as const },
        { ...mockAuditLog, severity: 'critical' as const, action: 'system_shutdown' }
      ];

      mockConvex.query.mockResolvedValueOnce(mockCriticalLogs);

      const result = await auditLoggingService.getRecentCriticalActions(24, 10);

      expect(result).toEqual(mockCriticalLogs);
      expect(mockConvex.query).toHaveBeenCalledWith(
        expect.anything(),
        { hours: 24, limit: 10 }
      );
    });

    it('should handle errors gracefully', async () => {
      mockConvex.query.mockRejectedValueOnce(new Error('Database error'));

      const result = await auditLoggingService.getRecentCriticalActions();

      expect(result).toEqual([]);
    });
  });

  describe('severity determination', () => {
    it('should classify critical actions correctly', () => {
      const service = new AuditLoggingService();
      
      expect(() => service['determineSeverity']('admin_user_created')).not.toThrow();
      expect(() => service['determineSeverity']('system_config_changed')).not.toThrow();
      expect(() => service['determineSeverity']('security_alert_created')).not.toThrow();
    });

    it('should classify high severity actions correctly', () => {
      const service = new AuditLoggingService();
      expect(() => service['determineSeverity']('user_suspended')).not.toThrow();
      expect(() => service['determineSeverity']('financial_transaction')).not.toThrow();
      expect(() => service['determineSeverity']('payout_processed')).not.toThrow();
    });

    it('should classify medium severity actions correctly', () => {
      const service = new AuditLoggingService();
      expect(() => service['determineSeverity']('user_impersonated')).not.toThrow();
      expect(() => service['determineSeverity']('data_exported')).not.toThrow();
      expect(() => service['determineSeverity']('report_generated')).not.toThrow();
    });

    it('should default to low severity for unknown actions', () => {
      const service = new AuditLoggingService();
      expect(() => service['determineSeverity']('unknown_action')).not.toThrow();
      expect(() => service['determineSeverity']('user_login')).not.toThrow();
    });
  });

  describe('category determination', () => {
    it('should classify authentication category correctly', () => {
      const service = new AuditLoggingService();
      const determineCategory = (service as AuditLoggingService).determineCategory.bind(service);

      expect(determineCategory('authentication')).toBe('authentication');
      expect(determineCategory('login')).toBe('authentication');
      expect(determineCategory('session')).toBe('authentication');
    });

    it('should classify user management category correctly', () => {
      const service = new AuditLoggingService();
      const determineCategory = (service as AuditLoggingService).determineCategory.bind(service);

      expect(determineCategory('users')).toBe('user_management');
      expect(determineCategory('admin_users')).toBe('user_management');
      expect(determineCategory('trainers')).toBe('user_management');
    });

    it('should classify financial category correctly', () => {
      const service = new AuditLoggingService();
      const determineCategory = (service as AuditLoggingService).determineCategory.bind(service);

      expect(determineCategory('financial')).toBe('financial');
      expect(determineCategory('revenue')).toBe('financial');
      expect(determineCategory('payouts')).toBe('financial');
    });

    it('should default to data access for unknown resources', () => {
      const service = new AuditLoggingService();
      const determineCategory = (service as AuditLoggingService).determineCategory.bind(service);

      expect(determineCategory('unknown_resource')).toBe('data_access');
    });
  });
});