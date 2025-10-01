// Admin Communication System Functions

import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";

// Communication Tables Schema (to be added to schema.ts)
// platformAnnouncements: defineTable({
//   title: v.string(),
//   content: v.string(),
//   type: v.union(v.literal("info"), v.literal("warning"), v.literal("maintenance"), v.literal("feature")),
//   targetAudience: v.union(v.literal("all"), v.literal("clients"), v.literal("trainers"), v.literal("premium")),
//   sentBy: v.id("adminUsers"),
//   createdAt: v.string(),
//   scheduledFor: v.string(),
//   expiresAt: v.optional(v.string()),
//   isActive: v.boolean(),
//   recipientCount: v.number(),
// }).index("by_type", ["type"])
//   .index("by_audience", ["targetAudience"])
//   .index("by_active", ["isActive"])
//   .index("by_scheduled", ["scheduledFor"]),

// userMessages: defineTable({
//   subject: v.string(),
//   content: v.string(),
//   type: v.union(v.literal("email"), v.literal("push"), v.literal("in_app")),
//   sentBy: v.id("adminUsers"),
//   sentAt: v.string(),
//   recipientCount: v.number(),
//   deliveryStatus: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
//   targetCriteria: v.optional(v.any()),
// }).index("by_type", ["type"])
//   .index("by_sent_by", ["sentBy"])
//   .index("by_sent_at", ["sentAt"])
//   .index("by_status", ["deliveryStatus"]),

// messageRecipients: defineTable({
//   messageId: v.union(v.id("platformAnnouncements"), v.id("userMessages")),
//   messageType: v.union(v.literal("announcement"), v.literal("message")),
//   userId: v.id("users"),
//   deliveryStatus: v.union(v.literal("pending"), v.literal("delivered"), v.literal("failed"), v.literal("read")),
//   deliveredAt: v.optional(v.string()),
//   readAt: v.optional(v.string()),
//   failureReason: v.optional(v.string()),
// }).index("by_message", ["messageId"])
//   .index("by_user", ["userId"])
//   .index("by_status", ["deliveryStatus"]),

/**
 * Send platform-wide announcement
 */
export const sendPlatformAnnouncement = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.union(v.literal("info"), v.literal("warning"), v.literal("maintenance"), v.literal("feature")),
    targetAudience: v.union(v.literal("all"), v.literal("clients"), v.literal("trainers"), v.literal("premium")),
    scheduledFor: v.string(),
    expiresAt: v.optional(v.string()),
    sentBy: v.id("adminUsers"),
    createdAt: v.string()
  },
  handler: async (ctx, args) => {
    // Get target users based on audience criteria
    let targetUsers = await ctx.db.query("users").collect();

    switch (args.targetAudience) {
      case "clients":
        targetUsers = targetUsers.filter(user => user.role === "client");
        break;
      case "trainers":
        targetUsers = targetUsers.filter(user => user.role === "trainer");
        break;
      case "premium":
        // TODO: Filter by subscription status when implemented
        targetUsers = targetUsers.filter(user => user.role === "client" || user.role === "trainer");
        break;
      case "all":
      default:
        // Include all users
        break;
    }

    // Create announcement record
    const announcementId = await ctx.db.insert("platformAnnouncements", {
      title: args.title,
      content: args.content,
      type: args.type,
      targetAudience: args.targetAudience,
      sentBy: args.sentBy,
      createdAt: args.createdAt,
      scheduledFor: args.scheduledFor,
      expiresAt: args.expiresAt,
      isActive: true,
      recipientCount: targetUsers.length
    });

    // Create recipient records for tracking delivery
    const recipientPromises = targetUsers.map(user =>
      ctx.db.insert("messageRecipients", {
        messageId: announcementId,
        messageType: "announcement",
        userId: user._id,
        deliveryStatus: "pending"
      })
    );

    await Promise.all(recipientPromises);

    // TODO: Trigger actual delivery (email, push notifications, etc.)
    // This would typically be handled by a background job or external service

    return {
      announcementId: announcementId,
      recipientCount: targetUsers.length
    };
  }
});

/**
 * Send targeted message to specific users
 */
export const sendTargetedMessage = mutation({
  args: {
    subject: v.string(),
    content: v.string(),
    type: v.union(v.literal("email"), v.literal("push"), v.literal("in_app")),
    userIds: v.optional(v.array(v.id("users"))),
    userCriteria: v.optional(v.any()),
    sentBy: v.id("adminUsers"),
    sentAt: v.string()
  },
  handler: async (ctx, args) => {
    let targetUsers: any[] = [];

    if (args.userIds && args.userIds.length > 0) {
      // Get specific users by ID
      const userPromises = args.userIds.map(id => ctx.db.get(id));
      const users = await Promise.all(userPromises);
      targetUsers = users.filter(user => user !== null);
    } else if (args.userCriteria) {
      // Get users based on criteria
      let query = ctx.db.query("users");

      if (args.userCriteria.role) {
        query = query.filter(q => q.eq(q.field("role"), args.userCriteria.role));
      }

      if (args.userCriteria.dateRange) {
        query = query.filter(q => 
          q.and(
            q.gte(q.field("createdAt"), args.userCriteria.dateRange.start),
            q.lte(q.field("createdAt"), args.userCriteria.dateRange.end)
          )
        );
      }

      targetUsers = await query.collect();
    }

    if (targetUsers.length === 0) {
      throw new Error("No target users found");
    }

    // Create message record
    const messageId = await ctx.db.insert("userMessages", {
      subject: args.subject,
      content: args.content,
      type: args.type,
      sentBy: args.sentBy,
      sentAt: args.sentAt,
      recipientCount: targetUsers.length,
      deliveryStatus: "pending",
      targetCriteria: args.userCriteria
    });

    // Create recipient records for tracking delivery
    const recipientPromises = targetUsers.map(user =>
      ctx.db.insert("messageRecipients", {
        messageId: messageId,
        messageType: "message",
        userId: user._id,
        deliveryStatus: "pending"
      })
    );

    await Promise.all(recipientPromises);

    // TODO: Trigger actual delivery based on message type
    // This would typically be handled by a background job or external service

    return {
      messageId: messageId,
      recipientCount: targetUsers.length
    };
  }
});

/**
 * Get communication analytics
 */
export const getAnalytics = query({
  args: {
    startDate: v.string(),
    endDate: v.string()
  },
  handler: async (ctx, args) => {
    // Get announcements in date range
    const announcements = await ctx.db
      .query("platformAnnouncements")
      .filter(q => 
        q.and(
          q.gte(q.field("createdAt"), args.startDate),
          q.lte(q.field("createdAt"), args.endDate)
        )
      )
      .collect();

    // Get messages in date range
    const messages = await ctx.db
      .query("userMessages")
      .filter(q => 
        q.and(
          q.gte(q.field("sentAt"), args.startDate),
          q.lte(q.field("sentAt"), args.endDate)
        )
      )
      .collect();

    // Get support tickets in date range
    const tickets = await ctx.db
      .query("supportTickets")
      .filter(q => 
        q.and(
          q.gte(q.field("createdAt"), args.startDate),
          q.lte(q.field("createdAt"), args.endDate)
        )
      )
      .collect();

    const resolvedTickets = tickets.filter(t => t.status === "resolved" || t.status === "closed");

    // Calculate average response time for resolved tickets
    let averageResponseTime = 0;
    if (resolvedTickets.length > 0) {
      const totalResponseTime = resolvedTickets.reduce((sum, ticket) => {
        if (ticket.resolvedAt) {
          const created = new Date(ticket.createdAt).getTime();
          const resolved = new Date(ticket.resolvedAt).getTime();
          return sum + (resolved - created);
        }
        return sum;
      }, 0);
      averageResponseTime = totalResponseTime / resolvedTickets.length / (1000 * 60 * 60); // Convert to hours
    }

    // Get message recipients for engagement metrics
    const messageIds = [...announcements.map(a => a._id), ...messages.map(m => m._id)];
    const recipients = await Promise.all(
      messageIds.map(async (id) => {
        return await ctx.db
          .query("messageRecipients")
          .withIndex("by_message", q => q.eq("messageId", id))
          .collect();
      })
    );

    const allRecipients = recipients.flat();
    const deliveredCount = allRecipients.filter(r => r.deliveryStatus === "delivered").length;
    const readCount = allRecipients.filter(r => r.deliveryStatus === "read").length;

    return {
      announcementsSent: announcements.length,
      messagesSent: messages.length,
      ticketsCreated: tickets.length,
      ticketsResolved: resolvedTickets.length,
      averageResponseTime,
      userEngagement: {
        totalRecipients: allRecipients.length,
        delivered: deliveredCount,
        read: readCount,
        deliveryRate: allRecipients.length > 0 ? (deliveredCount / allRecipients.length) * 100 : 0,
        readRate: deliveredCount > 0 ? (readCount / deliveredCount) * 100 : 0
      }
    };
  }
});

/**
 * Get platform announcements
 */
export const getPlatformAnnouncements = query({
  args: {
    isActive: v.optional(v.boolean()),
    type: v.optional(v.union(v.literal("info"), v.literal("warning"), v.literal("maintenance"), v.literal("feature"))),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("platformAnnouncements");

    if (args.isActive !== undefined) {
      query = query.filter(q => q.eq(q.field("isActive"), args.isActive));
    }

    if (args.type) {
      query = query.filter(q => q.eq(q.field("type"), args.type));
    }

    const announcements = await query
      .order("desc")
      .take(args.limit || 50);

    // Enrich with sender information
    const enrichedAnnouncements = await Promise.all(
      announcements.map(async (announcement) => {
        const sender = await ctx.db.get(announcement.sentBy);
        return {
          ...announcement,
          sender: sender ? { name: sender.name, email: sender.email } : null
        };
      })
    );

    return enrichedAnnouncements;
  }
});

/**
 * Update announcement status
 */
export const updateAnnouncementStatus = mutation({
  args: {
    announcementId: v.id("platformAnnouncements"),
    isActive: v.boolean(),
    updatedBy: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.announcementId, {
      isActive: args.isActive
    });

    // TODO: Log this action in audit logs
  }
});

/**
 * Mark message as read for a user
 */
export const markMessageAsRead = mutation({
  args: {
    messageId: v.union(v.id("platformAnnouncements"), v.id("userMessages")),
    userId: v.id("users"),
    messageType: v.union(v.literal("announcement"), v.literal("message"))
  },
  handler: async (ctx, args) => {
    // Find the recipient record
    const messageIdVal = args.messageId;
    const recipient = await ctx.db
      .query("messageRecipients")
      .withIndex("by_message", q => q.eq("messageId", messageIdVal))
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    if (recipient) {
      await ctx.db.patch(recipient._id, {
        deliveryStatus: "read",
        readAt: new Date().toISOString()
      });
    }
  }
});

/**
 * Get user's unread messages and announcements
 */
export const getUserUnreadMessages = query({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Get unread message recipients for this user
    const userIdVal = args.userId;
    const unreadRecipients = await ctx.db
      .query("messageRecipients")
      .withIndex("by_user", q => q.eq("userId", userIdVal))
      .filter(q => q.neq(q.field("deliveryStatus"), "read"))
      .collect();

    // Separate announcements and messages
    const announcementIds = unreadRecipients
      .filter(r => r.messageType === "announcement")
      .map(r => r.messageId);
    
    const messageIds = unreadRecipients
      .filter(r => r.messageType === "message")
      .map(r => r.messageId);

    // Get announcement details
    const announcements = await Promise.all(
      announcementIds.map(id => ctx.db.get(id as any))
    );

    // Get message details
    const messages = await Promise.all(
      messageIds.map(id => ctx.db.get(id as any))
    );

    return {
      announcements: announcements.filter(a => a !== null),
      messages: messages.filter(m => m !== null),
      totalUnread: unreadRecipients.length
    };
  }
});