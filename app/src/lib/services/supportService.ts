// Support Ticket System Service

import { ConvexError } from "convex/values";
import type {
  SupportTicket,
  SupportMessage,
  BulkUserAction,
  BulkActionResult,
  UserSearchCriteria
} from "../types/admin";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { convex } from "$lib/convex";
import { adminAuthService } from "./adminAuth";

export class SupportService {
  /**
   * Get all support tickets with filtering and pagination
   */
  async getSupportTickets(
    filters: {
      status?: "open" | "in_progress" | "resolved" | "closed";
      priority?: "low" | "medium" | "high" | "urgent";
      assignedTo?: Id<"adminUsers">;
      userId?: Id<"users">;
      dateRange?: { start: string; end: string };
    },
    adminId: Id<"adminUsers">,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ tickets: SupportTicket[]; total: number; hasMore: boolean }> {
    try {
      // Validate admin permissions
      const canViewTickets = await adminAuthService.validateAdminPermissions(adminId, "read", "support_tickets");
      if (!canViewTickets) {
        throw new ConvexError("Insufficient permissions to view support tickets");
      }

      const result = await convex.query(api.functions.admin.support.getSupportTickets, {
        status: filters.status,
        priority: filters.priority,
        assignedTo: filters.assignedTo,
        userId: filters.userId,
        dateRange: filters.dateRange,
        limit,
        offset
      }) as { tickets: SupportTicket[]; total: number; hasMore: boolean };

      // Log ticket access
      await adminAuthService.logAdminAction(adminId, {
        action: "support_tickets_viewed",
        resource: "support_tickets",
        details: { 
          filters,
          resultCount: result.tickets.length 
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return result;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get support tickets");
    }
  }

  /**
   * Create a new support ticket
   */
  async createSupportTicket(
    ticketData: {
      userId: Id<"users">;
      subject: string;
      description: string;
      priority: "low" | "medium" | "high" | "urgent";
      category?: string;
    },
    adminId?: Id<"adminUsers">
  ): Promise<SupportTicket> {
    try {
      const ticket = await convex.mutation(api.functions.admin.support.createSupportTicket, {
        userId: ticketData.userId,
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority,
        category: ticketData.category,
        createdBy: adminId,
        createdAt: new Date().toISOString()
      }) as SupportTicket;

      // Log ticket creation
      if (adminId) {
        await adminAuthService.logAdminAction(adminId, {
          action: "support_ticket_created",
          resource: "support_tickets",
          resourceId: ticket.id,
          details: { 
            userId: ticketData.userId,
            subject: ticketData.subject,
            priority: ticketData.priority
          },
          ipAddress: "system",
          userAgent: "system"
        });
      }

      return ticket;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to create support ticket");
    }
  }

  /**
   * Update support ticket status and assignment
   */
  async updateSupportTicket(
    ticketId: string,
    updates: {
      status?: "open" | "in_progress" | "resolved" | "closed";
      priority?: "low" | "medium" | "high" | "urgent";
      assignedTo?: Id<"adminUsers">;
    },
    adminId: Id<"adminUsers">
  ): Promise<void> {
    try {
      // Validate admin permissions
      const canUpdateTickets = await adminAuthService.validateAdminPermissions(adminId, "write", "support_tickets");
      if (!canUpdateTickets) {
        throw new ConvexError("Insufficient permissions to update support tickets");
      }

      await convex.mutation(api.functions.admin.support.updateSupportTicket, {
        ticketId,
        status: updates.status,
        priority: updates.priority,
        assignedTo: updates.assignedTo,
        updatedBy: adminId,
        updatedAt: new Date().toISOString()
      });

      // Log ticket update
      await adminAuthService.logAdminAction(adminId, {
        action: "support_ticket_updated",
        resource: "support_tickets",
        resourceId: ticketId,
        details: { updates },
        ipAddress: "system",
        userAgent: "system"
      });

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to update support ticket");
    }
  }

  /**
   * Add message to support ticket
   */
  async addTicketMessage(
    ticketId: string,
    message: {
      content: string;
      attachments?: string[];
      isInternal?: boolean;
    },
    senderId: Id<"users"> | Id<"adminUsers">,
    senderType: "user" | "admin"
  ): Promise<SupportMessage> {
    try {
      // Validate permissions if admin
      if (senderType === "admin") {
        const canReplyToTickets = await adminAuthService.validateAdminPermissions(senderId as Id<"adminUsers">, "write", "support_tickets");
        if (!canReplyToTickets) {
          throw new ConvexError("Insufficient permissions to reply to support tickets");
        }
      }

      const ticketMessage = await convex.mutation(api.functions.admin.support.addTicketMessage, {
        ticketId,
        senderId,
        senderType,
        content: message.content,
        attachments: message.attachments,
        isInternal: message.isInternal || false,
        timestamp: new Date().toISOString()
      }) as SupportMessage;

      // Log message addition
      if (senderType === "admin") {
        await adminAuthService.logAdminAction(senderId as Id<"adminUsers">, {
          action: "support_ticket_message_added",
          resource: "support_tickets",
          resourceId: ticketId,
          details: { 
            messageLength: message.content.length,
            hasAttachments: !!message.attachments?.length,
            isInternal: message.isInternal
          },
          ipAddress: "system",
          userAgent: "system"
        });
      }

      return ticketMessage;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to add ticket message");
    }
  }

  /**
   * Get support ticket details with messages
   */
  async getSupportTicketDetails(
    ticketId: string,
    adminId: Id<"adminUsers">
  ): Promise<SupportTicket> {
    try {
      // Validate admin permissions
      const canViewTickets = await adminAuthService.validateAdminPermissions(adminId, "read", "support_tickets");
      if (!canViewTickets) {
        throw new ConvexError("Insufficient permissions to view support ticket details");
      }

      const ticket = await convex.query(api.functions.admin.support.getSupportTicketDetails, { ticketId }) as SupportTicket | null;
      if (!ticket) {
        throw new ConvexError("Support ticket not found");
      }

      // Log ticket detail access
      await adminAuthService.logAdminAction(adminId, {
        action: "support_ticket_details_viewed",
        resource: "support_tickets",
        resourceId: ticketId,
        details: { 
          ticketStatus: ticket.status,
          messageCount: ticket.messages.length
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return ticket;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get support ticket details");
    }
  }

  /**
   * Send platform-wide announcement
   */
  async sendPlatformAnnouncement(
    announcement: {
      title: string;
      content: string;
      type: "info" | "warning" | "maintenance" | "feature";
      targetAudience: "all" | "clients" | "trainers" | "premium";
      scheduledFor?: string;
      expiresAt?: string;
    },
    adminId: Id<"adminUsers">
  ): Promise<{ announcementId: string; recipientCount: number }> {
    try {
      // Validate admin permissions
      const canSendAnnouncements = await adminAuthService.validateAdminPermissions(adminId, "send", "announcements");
      if (!canSendAnnouncements) {
        throw new ConvexError("Insufficient permissions to send platform announcements");
      }

      const result = await convex.mutation(api.functions.admin.communication.sendPlatformAnnouncement, {
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        targetAudience: announcement.targetAudience,
        scheduledFor: announcement.scheduledFor || new Date().toISOString(),
        expiresAt: announcement.expiresAt,
        sentBy: adminId,
        createdAt: new Date().toISOString()
      }) as { announcementId: string; recipientCount: number };

      // Log announcement
      await adminAuthService.logAdminAction(adminId, {
        action: "platform_announcement_sent",
        resource: "announcements",
        resourceId: result.announcementId,
        details: { 
          title: announcement.title,
          type: announcement.type,
          targetAudience: announcement.targetAudience,
          recipientCount: result.recipientCount
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return result;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to send platform announcement");
    }
  }

  /**
   * Send targeted message to specific users
   */
  async sendTargetedMessage(
    message: {
      subject: string;
      content: string;
      type: "email" | "push" | "in_app";
      userIds?: Id<"users">[];
      userCriteria?: UserSearchCriteria;
    },
    adminId: Id<"adminUsers">
  ): Promise<{ messageId: string; recipientCount: number }> {
    try {
      // Validate admin permissions
      const canSendMessages = await adminAuthService.validateAdminPermissions(adminId, "send", "user_messages");
      if (!canSendMessages) {
        throw new ConvexError("Insufficient permissions to send user messages");
      }

      const result = await convex.mutation(api.functions.admin.communication.sendTargetedMessage, {
        subject: message.subject,
        content: message.content,
        type: message.type,
        userIds: message.userIds,
        userCriteria: message.userCriteria,
        sentBy: adminId,
        sentAt: new Date().toISOString()
      }) as { messageId: string; recipientCount: number };

      // Log targeted message
      await adminAuthService.logAdminAction(adminId, {
        action: "targeted_message_sent",
        resource: "user_messages",
        resourceId: result.messageId,
        details: { 
          subject: message.subject,
          type: message.type,
          recipientCount: result.recipientCount,
          hasUserCriteria: !!message.userCriteria
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return result;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to send targeted message");
    }
  }

  /**
   * Handle GDPR data deletion request
   */
  async handleGDPRDeletionRequest(
    userId: Id<"users">,
    requestType: "access" | "portability" | "deletion" | "rectification",
    adminId: Id<"adminUsers">,
    notes?: string
  ): Promise<{ requestId: string; status: string; estimatedCompletion?: string }> {
    try {
      // Validate admin permissions
      const canHandleGDPR = await adminAuthService.validateAdminPermissions(adminId, "handle", "gdpr_requests");
      if (!canHandleGDPR) {
        throw new ConvexError("Insufficient permissions to handle GDPR requests");
      }

      const result = await convex.mutation(api.functions.admin.privacy.handleGDPRRequest, {
        userId,
        requestType,
        handledBy: adminId,
        notes,
        requestedAt: new Date().toISOString()
      }) as { requestId: string; status: string; estimatedCompletion?: string };

      // Log GDPR request handling
      await adminAuthService.logAdminAction(adminId, {
        action: "gdpr_request_handled",
        resource: "privacy_requests",
        resourceId: result.requestId,
        details: { 
          userId,
          requestType,
          notes
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return result;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to handle GDPR request");
    }
  }

  /**
   * Process user data export for GDPR compliance
   */
  async exportUserData(
    userId: Id<"users">,
    adminId: Id<"adminUsers">,
    includeDeleted: boolean = false
  ): Promise<{ exportId: string; downloadUrl: string; expiresAt: string }> {
    try {
      // Validate admin permissions
      const canExportData = await adminAuthService.validateAdminPermissions(adminId, "export", "user_data");
      if (!canExportData) {
        throw new ConvexError("Insufficient permissions to export user data");
      }

      const result = await convex.mutation(api.functions.admin.privacy.exportUserData, {
        userId,
        requestedBy: adminId,
        includeDeleted,
        requestedAt: new Date().toISOString()
      }) as { exportId: string; downloadUrl: string; expiresAt: string };

      // Log data export
      await adminAuthService.logAdminAction(adminId, {
        action: "user_data_exported",
        resource: "user_data",
        resourceId: userId,
        details: { 
          exportId: result.exportId,
          includeDeleted
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return result;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to export user data");
    }
  }

  /**
   * Perform bulk user actions
   */
  async performBulkUserAction(
    action: BulkUserAction,
    userIds: Id<"users">[],
    adminId: Id<"adminUsers">
  ): Promise<BulkActionResult> {
    try {
      // Validate admin permissions based on action
      const permissionMap = {
        suspend: "suspend",
        activate: "activate",
        delete: "delete",
        send_message: "communicate"
      };

      const canPerformAction = await adminAuthService.validateAdminPermissions(
        adminId,
        permissionMap[action.action],
        "users"
      );

      if (!canPerformAction) {
        throw new ConvexError(`Insufficient permissions to ${action.action} users`);
      }

      const result = await convex.mutation(api.functions.admin.users.performBulkAction, {
        action,
        userIds,
        performedBy: adminId,
        performedAt: new Date().toISOString()
      }) as BulkActionResult;

      // Log bulk action
      await adminAuthService.logAdminAction(adminId, {
        action: `bulk_user_${action.action}`,
        resource: "users",
        details: { 
          userCount: userIds.length,
          successful: result.successful,
          failed: result.failed,
          action
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return result;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to perform bulk user action");
    }
  }

  /**
   * Get communication analytics
   */
  async getCommunicationAnalytics(
    timeframe: { start: string; end: string },
    adminId: Id<"adminUsers">
  ): Promise<{
    announcementsSent: number;
    messagesSent: number;
    ticketsCreated: number;
    ticketsResolved: number;
    averageResponseTime: number;
    userEngagement: Record<string, number>;
  }> {
    try {
      // Validate admin permissions
      const canViewAnalytics = await adminAuthService.validateAdminPermissions(adminId, "read", "communication_analytics");
      if (!canViewAnalytics) {
        throw new ConvexError("Insufficient permissions to view communication analytics");
      }

      const analytics = await convex.query(api.functions.admin.communication.getAnalytics, {
        startDate: timeframe.start,
        endDate: timeframe.end
      }) as {
        announcementsSent: number;
        messagesSent: number;
        ticketsCreated: number;
        ticketsResolved: number;
        averageResponseTime: number;
        userEngagement: Record<string, number>;
      };

      // Log analytics access
      await adminAuthService.logAdminAction(adminId, {
        action: "communication_analytics_viewed",
        resource: "analytics",
        details: { timeframe },
        ipAddress: "system",
        userAgent: "system"
      });

      return analytics;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get communication analytics");
    }
  }

  /**
   * Get support ticket statistics for dashboard
   */
  async getSupportTicketStatistics(
    timeframe: { start: string; end: string },
    adminId: Id<"adminUsers">
  ): Promise<{
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    averageResolutionTime: number;
    ticketsByPriority: Record<string, number>;
    ticketsByCategory: Record<string, number>;
  }> {
    try {
      // Validate admin permissions
      const canViewStats = await adminAuthService.validateAdminPermissions(adminId, "read", "support_tickets");
      if (!canViewStats) {
        throw new ConvexError("Insufficient permissions to view support statistics");
      }

      // Get all tickets in timeframe
      const allTickets = await convex.query(api.functions.admin.support.getSupportTickets, {
        dateRange: timeframe,
        limit: 1000,
        offset: 0
      }) as { tickets: SupportTicket[]; total: number; hasMore: boolean };

      const tickets = allTickets.tickets;

      // Calculate statistics
      const stats = {
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === "open").length,
        inProgressTickets: tickets.filter(t => t.status === "in_progress").length,
        resolvedTickets: tickets.filter(t => t.status === "resolved").length,
        closedTickets: tickets.filter(t => t.status === "closed").length,
        averageResolutionTime: 0,
        ticketsByPriority: {
          urgent: tickets.filter(t => t.priority === "urgent").length,
          high: tickets.filter(t => t.priority === "high").length,
          medium: tickets.filter(t => t.priority === "medium").length,
          low: tickets.filter(t => t.priority === "low").length
        },
        ticketsByCategory: tickets.reduce((acc, ticket) => {
          const category = ticket.category || "uncategorized";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      // Calculate average resolution time for resolved tickets
      const resolvedTickets = tickets.filter(t => t.resolvedAt);
      if (resolvedTickets.length > 0) {
        const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
          const created = new Date(ticket.createdAt).getTime();
          const resolved = new Date(ticket.resolvedAt!).getTime();
          return sum + (resolved - created);
        }, 0);
        stats.averageResolutionTime = totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60); // Convert to hours
      }

      // Log statistics access
      await adminAuthService.logAdminAction(adminId, {
        action: "support_statistics_viewed",
        resource: "support_tickets",
        details: { 
          timeframe,
          totalTickets: stats.totalTickets
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return stats;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get support ticket statistics");
    }
  }

  /**
   * Create support ticket template
   */
  async createTicketTemplate(
    template: {
      name: string;
      category: string;
      priority: "low" | "medium" | "high" | "urgent";
      subject: string;
      content: string;
      tags: string[];
    },
    adminId: Id<"adminUsers">
  ): Promise<{ templateId: string }> {
    try {
      // Validate admin permissions
      const canCreateTemplates = await adminAuthService.validateAdminPermissions(adminId, "write", "support_templates");
      if (!canCreateTemplates) {
        throw new ConvexError("Insufficient permissions to create support templates");
      }

      // In a real implementation, this would store the template in the database
      const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Log template creation
      await adminAuthService.logAdminAction(adminId, {
        action: "support_template_created",
        resource: "support_templates",
        resourceId: templateId,
        details: { 
          name: template.name,
          category: template.category,
          priority: template.priority
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return { templateId };

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to create support template");
    }
  }

  /**
   * Auto-assign tickets based on workload and expertise
   */
  async autoAssignTickets(
    criteria: {
      maxTicketsPerAdmin: number;
      categoryExpertise: Record<string, Id<"adminUsers">[]>;
      priorityWeights: Record<string, number>;
    },
    adminId: Id<"adminUsers">
  ): Promise<{ assignedTickets: number; assignments: Array<{ ticketId: string; assignedTo: Id<"adminUsers"> }> }> {
    try {
      // Validate admin permissions
      const canAutoAssign = await adminAuthService.validateAdminPermissions(adminId, "assign", "support_tickets");
      if (!canAutoAssign) {
        throw new ConvexError("Insufficient permissions to auto-assign tickets");
      }

      // Get unassigned tickets
      const unassignedTickets = await convex.query(api.functions.admin.support.getSupportTickets, {
        assignedTo: undefined,
        limit: 100,
        offset: 0
      }) as { tickets: SupportTicket[]; total: number; hasMore: boolean };

      const assignments: Array<{ ticketId: string; assignedTo: Id<"adminUsers"> }> = [];

      // Simple auto-assignment logic (in real implementation, this would be more sophisticated)
      for (const ticket of unassignedTickets.tickets) {
        // Find admins with expertise in this category
        const categoryExperts = criteria.categoryExpertise[ticket.category || "general"] || [];
        
        if (categoryExperts.length > 0) {
          // Assign to first available expert (in real implementation, check workload)
          const assignedTo = categoryExperts[0];
          
          await this.updateSupportTicket(
            ticket.id,
            { assignedTo },
            adminId
          );

          assignments.push({
            ticketId: ticket.id,
            assignedTo
          });
        }
      }

      // Log auto-assignment
      await adminAuthService.logAdminAction(adminId, {
        action: "tickets_auto_assigned",
        resource: "support_tickets",
        details: { 
          assignedCount: assignments.length,
          totalUnassigned: unassignedTickets.tickets.length
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return {
        assignedTickets: assignments.length,
        assignments
      };

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to auto-assign tickets");
    }
  }
}

// Export singleton instance
export const supportService = new SupportService();