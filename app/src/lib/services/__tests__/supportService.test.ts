import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies before importing
vi.mock('../../../../convex/_generated/api', () => ({
  api: {
    admin: {
      support: {
        getSupportTickets: vi.fn(),
        createSupportTicket: vi.fn(),
        updateSupportTicket: vi.fn(),
        addTicketMessage: vi.fn(),
        getSupportTicketDetails: vi.fn()
      },
      communication: {
        sendPlatformAnnouncement: vi.fn(),
        sendTargetedMessage: vi.fn(),
        getAnalytics: vi.fn()
      },
      privacy: {
        handleGDPRRequest: vi.fn(),
        exportUserData: vi.fn()
      },
      users: {
        performBulkAction: vi.fn()
      }
    }
  }
}));

vi.mock('../../convex', () => ({
  convex: {
    query: vi.fn(),
    mutation: vi.fn()
  }
}));

vi.mock('../adminAuth', () => ({
  adminAuthService: {
    validateAdminPermissions: vi.fn(),
    logAdminAction: vi.fn()
  }
}));

// Now import after mocking
import { supportService } from '../supportService';
import { adminAuthService } from '../adminAuth';
import { convex } from '../../convex';

describe('SupportService', () => {
  const mockAdminId = 'admin123' as any;
  const mockUserId = 'user123' as any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock admin permissions validation
    vi.mocked(adminAuthService.validateAdminPermissions).mockResolvedValue(true);
    vi.mocked(adminAuthService.logAdminAction).mockResolvedValue();
  });

  describe('getSupportTickets', () => {
    it('should get support tickets with filters', async () => {
      const mockTickets = [
        {
          id: 'ticket1',
          userId: mockUserId,
          subject: 'Test Ticket',
          status: 'open',
          priority: 'high',
          createdAt: '2024-01-01T00:00:00Z',
          user: { name: 'Test User', email: 'test@example.com' },
          assignedAdmin: null,
          messages: []
        }
      ];

      vi.mocked(convex.query).mockResolvedValue({
        tickets: mockTickets,
        total: 1,
        hasMore: false
      });

      const result = await supportService.getSupportTickets(
        { status: 'open', priority: 'high' },
        mockAdminId,
        50,
        0
      );

      expect(result.tickets).toEqual(mockTickets);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(adminAuthService.validateAdminPermissions).toHaveBeenCalledWith(
        mockAdminId,
        'read',
        'support_tickets'
      );
    });

    it('should throw error if admin lacks permissions', async () => {
      vi.mocked(adminAuthService.validateAdminPermissions).mockResolvedValue(false);

      await expect(
        supportService.getSupportTickets({}, mockAdminId, 50, 0)
      ).rejects.toThrow('Insufficient permissions to view support tickets');
    });
  });

  describe('createSupportTicket', () => {
    it('should create a new support ticket', async () => {
      const mockTicket = {
        id: 'ticket1',
        userId: mockUserId,
        subject: 'Test Ticket',
        status: 'open' as const,
        priority: 'medium' as const,
        createdAt: '2024-01-01T00:00:00Z',
        messages: []
      };

      vi.mocked(convex.mutation).mockResolvedValue(mockTicket);

      const result = await supportService.createSupportTicket(
        {
          userId: mockUserId,
          subject: 'Test Ticket',
          description: 'Test Description',
          priority: 'medium',
          category: 'general'
        },
        mockAdminId
      );

      expect(result).toEqual(mockTicket);
      expect(convex.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          userId: mockUserId,
          subject: 'Test Ticket',
          description: 'Test Description',
          priority: 'medium',
          category: 'general',
          createdBy: mockAdminId
        })
      );
    });
  });

  describe('updateSupportTicket', () => {
    it('should update ticket status and assignment', async () => {
      vi.mocked(convex.mutation).mockResolvedValue(undefined);

      await supportService.updateSupportTicket(
        'ticket1',
        { status: 'in_progress', assignedTo: mockAdminId },
        mockAdminId
      );

      expect(convex.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          ticketId: 'ticket1',
          status: 'in_progress',
          assignedTo: mockAdminId,
          updatedBy: mockAdminId
        })
      );
      expect(adminAuthService.logAdminAction).toHaveBeenCalled();
    });
  });

  describe('addTicketMessage', () => {
    it('should add message to support ticket', async () => {
      const mockMessage = {
        id: 'message1',
        senderId: mockAdminId,
        senderType: 'admin' as const,
        content: 'Test message',
        timestamp: '2024-01-01T00:00:00Z',
        attachments: []
      };

      vi.mocked(convex.mutation).mockResolvedValue(mockMessage);

      const result = await supportService.addTicketMessage(
        'ticket1',
        { content: 'Test message', isInternal: false },
        mockAdminId,
        'admin'
      );

      expect(result).toEqual(mockMessage);
      expect(convex.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          ticketId: 'ticket1',
          senderId: mockAdminId,
          senderType: 'admin',
          content: 'Test message',
          isInternal: false
        })
      );
    });
  });

  describe('sendPlatformAnnouncement', () => {
    it('should send platform-wide announcement', async () => {
      const mockResult = {
        announcementId: 'announcement1',
        recipientCount: 100
      };

      vi.mocked(convex.mutation).mockResolvedValue(mockResult);

      const result = await supportService.sendPlatformAnnouncement(
        {
          title: 'Test Announcement',
          content: 'Test Content',
          type: 'info',
          targetAudience: 'all'
        },
        mockAdminId
      );

      expect(result).toEqual(mockResult);
      expect(adminAuthService.validateAdminPermissions).toHaveBeenCalledWith(
        mockAdminId,
        'send',
        'announcements'
      );
    });
  });

  describe('sendTargetedMessage', () => {
    it('should send targeted message to specific users', async () => {
      const mockResult = {
        messageId: 'message1',
        recipientCount: 10
      };

      vi.mocked(convex.mutation).mockResolvedValue(mockResult);

      const result = await supportService.sendTargetedMessage(
        {
          subject: 'Test Message',
          content: 'Test Content',
          type: 'email',
          userIds: [mockUserId]
        },
        mockAdminId
      );

      expect(result).toEqual(mockResult);
      expect(adminAuthService.validateAdminPermissions).toHaveBeenCalledWith(
        mockAdminId,
        'send',
        'user_messages'
      );
    });
  });

  describe('handleGDPRDeletionRequest', () => {
    it('should handle GDPR deletion request', async () => {
      const mockResult = {
        requestId: 'request1',
        status: 'pending',
        estimatedCompletion: '2024-02-01T00:00:00Z'
      };

      vi.mocked(convex.mutation).mockResolvedValue(mockResult);

      const result = await supportService.handleGDPRDeletionRequest(
        mockUserId,
        'deletion',
        mockAdminId,
        'User requested deletion'
      );

      expect(result).toEqual(mockResult);
      expect(adminAuthService.validateAdminPermissions).toHaveBeenCalledWith(
        mockAdminId,
        'handle',
        'gdpr_requests'
      );
    });
  });

  describe('exportUserData', () => {
    it('should export user data for GDPR compliance', async () => {
      const mockResult = {
        exportId: 'export1',
        downloadUrl: 'https://example.com/download',
        expiresAt: '2024-01-08T00:00:00Z'
      };

      vi.mocked(convex.mutation).mockResolvedValue(mockResult);

      const result = await supportService.exportUserData(
        mockUserId,
        mockAdminId,
        false
      );

      expect(result).toEqual(mockResult);
      expect(adminAuthService.validateAdminPermissions).toHaveBeenCalledWith(
        mockAdminId,
        'export',
        'user_data'
      );
    });
  });

  describe('performBulkUserAction', () => {
    it('should perform bulk action on multiple users', async () => {
      const mockResult = {
        successful: 2,
        failed: 0,
        errors: []
      };

      vi.mocked(convex.mutation).mockResolvedValue(mockResult);

      const action = {
        action: 'send_message' as const,
        message: 'Test message'
      };

      const result = await supportService.performBulkUserAction(
        action,
        [mockUserId, 'user2' as any],
        mockAdminId
      );

      expect(result).toEqual(mockResult);
      expect(adminAuthService.validateAdminPermissions).toHaveBeenCalledWith(
        mockAdminId,
        'communicate',
        'users'
      );
    });
  });

  describe('getCommunicationAnalytics', () => {
    it('should get communication analytics', async () => {
      const mockAnalytics = {
        announcementsSent: 5,
        messagesSent: 20,
        ticketsCreated: 15,
        ticketsResolved: 10,
        averageResponseTime: 2.5,
        userEngagement: {
          totalRecipients: 100,
          delivered: 95,
          read: 80
        }
      };

      vi.mocked(convex.query).mockResolvedValue(mockAnalytics);

      const result = await supportService.getCommunicationAnalytics(
        { start: '2024-01-01T00:00:00Z', end: '2024-01-02T00:00:00Z' },
        mockAdminId
      );

      expect(result).toEqual(mockAnalytics);
      expect(adminAuthService.validateAdminPermissions).toHaveBeenCalledWith(
        mockAdminId,
        'read',
        'communication_analytics'
      );
    });
  });

  describe('getSupportTicketStatistics', () => {
    it('should get support ticket statistics', async () => {
      const mockTickets = [
        { status: 'open', priority: 'high', category: 'technical', createdAt: '2024-01-01T00:00:00Z', resolvedAt: null },
        { status: 'resolved', priority: 'medium', category: 'billing', createdAt: '2024-01-01T00:00:00Z', resolvedAt: '2024-01-01T02:00:00Z' }
      ];

      vi.mocked(convex.query).mockResolvedValue({
        tickets: mockTickets,
        total: 2,
        hasMore: false
      });

      const result = await supportService.getSupportTicketStatistics(
        { start: '2024-01-01T00:00:00Z', end: '2024-01-02T00:00:00Z' },
        mockAdminId
      );

      expect(result.totalTickets).toBe(2);
      expect(result.openTickets).toBe(1);
      expect(result.resolvedTickets).toBe(1);
      expect(result.ticketsByPriority.high).toBe(1);
      expect(result.ticketsByPriority.medium).toBe(1);
      expect(result.ticketsByCategory.technical).toBe(1);
      expect(result.ticketsByCategory.billing).toBe(1);
      expect(result.averageResolutionTime).toBe(2); // 2 hours
    });
  });
});