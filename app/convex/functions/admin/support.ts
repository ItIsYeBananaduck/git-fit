// Admin Support Ticket System Functions

import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

// Support Tickets Table Schema (to be added to schema.ts)
// supportTickets: defineTable({
//   userId: v.id("users"),
//   subject: v.string(),
//   description: v.string(),
//   status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed")),
//   priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
//   category: v.optional(v.string()),
//   assignedTo: v.optional(v.id("adminUsers")),
//   createdBy: v.optional(v.id("adminUsers")),
//   createdAt: v.string(),
//   updatedAt: v.optional(v.string()),
//   resolvedAt: v.optional(v.string()),
//   tags: v.optional(v.array(v.string())),
// }).index("by_user", ["userId"])
//   .index("by_status", ["status"])
//   .index("by_priority", ["priority"])
//   .index("by_assigned", ["assignedTo"])
//   .index("by_created", ["createdAt"]),

// supportMessages: defineTable({
//   ticketId: v.id("supportTickets"),
//   senderId: v.union(v.id("users"), v.id("adminUsers")),
//   senderType: v.union(v.literal("user"), v.literal("admin")),
//   content: v.string(),
//   attachments: v.optional(v.array(v.string())),
//   isInternal: v.boolean(),
//   timestamp: v.string(),
// }).index("by_ticket", ["ticketId"])
//   .index("by_sender", ["senderId"])
//   .index("by_timestamp", ["timestamp"]),

/**
 * Get support tickets with filtering and pagination
 */
export const getSupportTickets = query({
  args: {
    status: v.optional(v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed"))),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    assignedTo: v.optional(v.id("adminUsers")),
    userId: v.optional(v.id("users")),
    dateRange: v.optional(v.object({
      start: v.string(),
      end: v.string()
    })),
    limit: v.number(),
    offset: v.number()
  },
  handler: async (ctx, args) => {
    // Build query filters
    let query = ctx.db.query("supportTickets");

    if (args.status) {
      query = query.filter(q => q.eq(q.field("status"), args.status));
    }

    if (args.priority) {
      query = query.filter(q => q.eq(q.field("priority"), args.priority));
    }

    if (args.assignedTo) {
      query = query.filter(q => q.eq(q.field("assignedTo"), args.assignedTo));
    }

    if (args.userId) {
      query = query.filter(q => q.eq(q.field("userId"), args.userId));
    }

    if (args.dateRange) {
      query = query.filter(q => 
        q.and(
          q.gte(q.field("createdAt"), args.dateRange!.start),
          q.lte(q.field("createdAt"), args.dateRange!.end)
        )
      );
    }

    // Get total count for pagination
    const allTickets = await query.collect();
    const total = allTickets.length;

    // Apply pagination
    const tickets = await query
      .order("desc")
      .take(args.limit + 1); // Take one extra to check if there are more

    const hasMore = tickets.length > args.limit;
    const paginatedTickets = tickets.slice(args.offset, args.offset + args.limit);

    // Enrich tickets with user information
    const enrichedTickets = await Promise.all(
      paginatedTickets.map(async (ticket) => {
        const user = await ctx.db.get(ticket.userId);
        const assignedAdmin = ticket.assignedTo ? await ctx.db.get(ticket.assignedTo) : null;
        
        return {
          ...ticket,
          user: user ? { name: user.name, email: user.email } : null,
          assignedAdmin: assignedAdmin ? { name: assignedAdmin.name, email: assignedAdmin.email } : null,
          messages: [] // Messages loaded separately for performance
        };
      })
    );

    return {
      tickets: enrichedTickets,
      total,
      hasMore
    };
  }
});

/**
 * Create a new support ticket
 */
export const createSupportTicket = mutation({
  args: {
    userId: v.id("users"),
    subject: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    category: v.optional(v.string()),
    createdBy: v.optional(v.id("adminUsers")),
    createdAt: v.string()
  },
  handler: async (ctx, args) => {
    const ticketId = await ctx.db.insert("supportTickets", {
      userId: args.userId,
      subject: args.subject,
      status: "open",
      priority: args.priority,
      category: args.category,
      createdBy: args.createdBy,
      createdAt: args.createdAt
    });

    // Create initial message with the description
    await ctx.db.insert("supportMessages", {
      ticketId,
      senderId: args.createdBy || args.userId,
      senderType: args.createdBy ? "admin" : "user",
      content: args.description,
      isInternal: false,
      timestamp: args.createdAt
    });

    return {
      id: ticketId,
      userId: args.userId,
      subject: args.subject,
      status: "open" as const,
      priority: args.priority,
      createdAt: args.createdAt,
      messages: []
    };
  }
});

/**
 * Update support ticket
 */
export const updateSupportTicket = mutation({
  args: {
    ticketId: v.string(),
    status: v.optional(v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed"))),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    assignedTo: v.optional(v.id("adminUsers")),
    updatedBy: v.id("adminUsers"),
    updatedAt: v.string()
  },
  handler: async (ctx, args) => {
    const ticketId = ctx.db.normalizeId("supportTickets", args.ticketId);
    if (!ticketId) {
      throw new Error("Invalid ticket ID");
    }

    const updates: any = {
      updatedAt: args.updatedAt
    };

    if (args.status !== undefined) {
      updates.status = args.status;
      if (args.status === "resolved" || args.status === "closed") {
        updates.resolvedAt = args.updatedAt;
      }
    }

    if (args.priority !== undefined) {
      updates.priority = args.priority;
    }

    if (args.assignedTo !== undefined) {
      updates.assignedTo = args.assignedTo;
    }

    await ctx.db.patch(ticketId, updates);

    // Add system message about the update
    const updateMessage = [];
    if (args.status) updateMessage.push(`Status changed to ${args.status}`);
    if (args.priority) updateMessage.push(`Priority changed to ${args.priority}`);
    if (args.assignedTo) {
      const admin = await ctx.db.get(args.assignedTo);
      updateMessage.push(`Assigned to ${admin?.name || 'admin'}`);
    }

    if (updateMessage.length > 0) {
      await ctx.db.insert("supportMessages", {
        ticketId,
        senderId: args.updatedBy,
        senderType: "admin",
        content: `System update: ${updateMessage.join(', ')}`,
        isInternal: true,
        timestamp: args.updatedAt
      });
    }
  }
});

/**
 * Add message to support ticket
 */
export const addTicketMessage = mutation({
  args: {
    ticketId: v.string(),
    senderId: v.union(v.id("users"), v.id("adminUsers")),
    senderType: v.union(v.literal("user"), v.literal("admin")),
    content: v.string(),
    attachments: v.optional(v.array(v.string())),
    isInternal: v.boolean(),
    timestamp: v.string()
  },
  handler: async (ctx, args) => {
    const ticketId = ctx.db.normalizeId("supportTickets", args.ticketId);
    if (!ticketId) {
      throw new Error("Invalid ticket ID");
    }

    const messageId = await ctx.db.insert("supportMessages", {
      ticketId,
      senderId: args.senderId,
      senderType: args.senderType,
      content: args.content,
      attachments: args.attachments,
      isInternal: args.isInternal,
      timestamp: args.timestamp
    });

    // Update ticket status if it was closed and user replied
    if (args.senderType === "user") {
      const ticket = await ctx.db.get(ticketId);
      if (ticket && (ticket.status === "resolved" || ticket.status === "closed")) {
        await ctx.db.patch(ticketId, {
          status: "open",
          updatedAt: args.timestamp
        });
      }
    }

    return {
      id: messageId,
      senderId: args.senderId,
      senderType: args.senderType,
      content: args.content,
      timestamp: args.timestamp,
      attachments: args.attachments
    };
  }
});

/**
 * Get support ticket details with messages
 */
export const getSupportTicketDetails = query({
  args: {
    ticketId: v.string()
  },
  handler: async (ctx, args) => {
    const ticketId = ctx.db.normalizeId("supportTickets", args.ticketId);
    if (!ticketId) {
      throw new Error("Invalid ticket ID");
    }

    const ticket = await ctx.db.get(ticketId);
    if (!ticket) {
      return null;
    }

    // Get user information
    const user = await ctx.db.get(ticket.userId);
    const assignedAdmin = ticket.assignedTo ? await ctx.db.get(ticket.assignedTo) : null;

    // Get all messages for this ticket
    const messages = await ctx.db
      .query("supportMessages")
      .withIndex("by_ticket", q => q.eq("ticketId", ticketId))
      .order("asc")
      .collect();

    // Enrich messages with sender information
    const enrichedMessages = await Promise.all(
      messages.map(async (message) => {
        let senderInfo = null;
        if (message.senderType === "user") {
          const sender = await ctx.db.get(message.senderId as Id<"users">);
          senderInfo = sender ? { name: sender.name, email: sender.email } : null;
        } else {
          const sender = await ctx.db.get(message.senderId as Id<"adminUsers">);
          senderInfo = sender ? { name: sender.name, email: sender.email } : null;
        }

        return {
          id: message._id,
          senderId: message.senderId,
          senderType: message.senderType,
          senderInfo,
          content: message.content,
          attachments: message.attachments,
          timestamp: message.timestamp
        };
      })
    );

    return {
      id: ticket._id,
      userId: ticket.userId,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assignedTo: ticket.assignedTo,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      resolvedAt: ticket.resolvedAt,
      user: user ? { name: user.name, email: user.email } : null,
      assignedAdmin: assignedAdmin ? { name: assignedAdmin.name, email: assignedAdmin.email } : null,
      messages: enrichedMessages
    };
  }
});

/**
 * Get support ticket statistics
 */
export const getSupportTicketStats = query({
  args: {
    timeframe: v.object({
      start: v.string(),
      end: v.string()
    })
  },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("supportTickets")
      .filter(q => 
        q.and(
          q.gte(q.field("createdAt"), args.timeframe.start),
          q.lte(q.field("createdAt"), args.timeframe.end)
        )
      )
      .collect();

    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === "open").length,
      inProgress: tickets.filter(t => t.status === "in_progress").length,
      resolved: tickets.filter(t => t.status === "resolved").length,
      closed: tickets.filter(t => t.status === "closed").length,
      byPriority: {
        low: tickets.filter(t => t.priority === "low").length,
        medium: tickets.filter(t => t.priority === "medium").length,
        high: tickets.filter(t => t.priority === "high").length,
        urgent: tickets.filter(t => t.priority === "urgent").length
      },
      averageResolutionTime: 0 // TODO: Calculate based on resolved tickets
    };

    // Calculate average resolution time
    const resolvedTickets = tickets.filter(t => t.resolvedAt);
    if (resolvedTickets.length > 0) {
      const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.createdAt).getTime();
        const resolved = new Date(ticket.resolvedAt!).getTime();
        return sum + (resolved - created);
      }, 0);
      stats.averageResolutionTime = totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60); // Convert to hours
    }

    return stats;
  }
});