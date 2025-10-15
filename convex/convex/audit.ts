// Audit System Functions
// Convex mutations and queries for audit operations

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Audit Reports
export const createAuditReport = mutation({
  args: {
    sessionId: v.string(),
    initialData: v.optional(v.object({
      version: v.string(),
      summary: v.object({
        totalFeatures: v.number(),
        implemented: v.number(),
        needsRefinement: v.number(),
        missing: v.number(),
        constitutionViolations: v.number(),
        criticalIssues: v.array(v.string()),
      }),
      constitutionCompliance: v.object({
        overallScore: v.number(),
        principleBreakdown: v.any(), // Using v.any() for flexible record structure
      }),
      metadata: v.object({
        auditDuration: v.number(),
        codebaseSize: v.number(),
        aiModelsFound: v.array(v.string()),
        technologiesUsed: v.array(v.string()),
      }),
    })),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    const reportData = {
      sessionId: args.sessionId,
      timestamp,
      version: args.initialData?.version || '1.0.0',
      status: 'in_progress' as const,
      summary: args.initialData?.summary || {
        totalFeatures: 18,
        implemented: 0,
        needsRefinement: 0,
        missing: 0,
        constitutionViolations: 0,
        criticalIssues: [],
      },
      constitutionCompliance: args.initialData?.constitutionCompliance || {
        overallScore: 0,
        principleBreakdown: {},
      },
      metadata: args.initialData?.metadata || {
        auditDuration: 0,
        codebaseSize: 0,
        aiModelsFound: [],
        technologiesUsed: [],
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const reportId = await ctx.db.insert('auditReports', reportData);
    return { reportId, ...reportData };
  },
});

export const updateAuditReport = mutation({
  args: {
    reportId: v.id('auditReports'),
    updates: v.object({
      status: v.optional(v.union(v.literal('in_progress'), v.literal('completed'), v.literal('failed'))),
      summary: v.optional(v.object({
        totalFeatures: v.number(),
        implemented: v.number(),
        needsRefinement: v.number(),
        missing: v.number(),
        constitutionViolations: v.number(),
        criticalIssues: v.array(v.string()),
      })),
      constitutionCompliance: v.optional(v.object({
        overallScore: v.number(),
        principleBreakdown: v.any(), // Using v.any() for flexible record structure
      })),
      metadata: v.optional(v.object({
        auditDuration: v.number(),
        codebaseSize: v.number(),
        aiModelsFound: v.array(v.string()),
        technologiesUsed: v.array(v.string()),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.reportId);
    if (!existing) {
      throw new Error('Audit report not found');
    }

    const updates = {
      ...args.updates,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.reportId, updates);
    const updated = await ctx.db.get(args.reportId);
    return updated;
  },
});

export const getAuditReport = query({
  args: { reportId: v.id('auditReports') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.reportId);
  },
});

export const getAuditReportsBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('auditReports')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect();
  },
});

// Feature Tasks
export const createFeatureTask = mutation({
  args: {
    auditReportId: v.id('auditReports'),
    name: v.string(),
    category: v.union(v.literal('core_fitness'), v.literal('ai_personalization'), v.literal('platform_features'), v.literal('advanced_features')),
    description: v.string(),
    implementationStatus: v.union(v.literal('implemented'), v.literal('needs_refinement'), v.literal('missing')),
    constitutionPrinciples: v.array(v.string()),
    evidence: v.array(v.string()),
    priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical')),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    const taskData = {
      ...args,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const taskId = await ctx.db.insert('featureTasks', taskData);
    return { taskId, ...taskData };
  },
});

export const getFeatureTasksByAuditReport = query({
  args: { auditReportId: v.id('auditReports') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('featureTasks')
      .withIndex('by_audit_report', (q) => q.eq('auditReportId', args.auditReportId))
      .collect();
  },
});

export const getFeatureTasksByCategory = query({
  args: {
    category: v.union(v.literal('core_fitness'), v.literal('ai_personalization'), v.literal('platform_features'), v.literal('advanced_features'))
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('featureTasks')
      .withIndex('by_category', (q) => q.eq('category', args.category))
      .collect();
  },
});

export const updateFeatureTask = mutation({
  args: {
    taskId: v.id('featureTasks'),
    updates: v.object({
      name: v.optional(v.string()),
      category: v.optional(v.union(v.literal('core_fitness'), v.literal('ai_personalization'), v.literal('platform_features'), v.literal('advanced_features'))),
      description: v.optional(v.string()),
      implementationStatus: v.optional(v.union(v.literal('implemented'), v.literal('needs_refinement'), v.literal('missing'))),
      constitutionPrinciples: v.optional(v.array(v.string())),
      evidence: v.optional(v.array(v.string())),
      priority: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical'))),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.taskId);
    if (!existing) {
      throw new Error('Feature task not found');
    }

    const updates = {
      ...args.updates,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.taskId, updates);
    const updated = await ctx.db.get(args.taskId);
    return updated;
  },
});

// Constitution Violations
export const createConstitutionViolation = mutation({
  args: {
    auditReportId: v.id('auditReports'),
    featureTaskId: v.optional(v.id('featureTasks')),
    principle: v.string(),
    severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical')),
    description: v.string(),
    evidence: v.string(),
    recommendation: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    const violationData = {
      ...args,
      status: 'open' as const,
      createdAt: timestamp,
    };

    const violationId = await ctx.db.insert('constitutionViolations', violationData);
    return { violationId, ...violationData };
  },
});

export const getConstitutionViolationsByAuditReport = query({
  args: { auditReportId: v.id('auditReports') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('constitutionViolations')
      .withIndex('by_audit_report', (q) => q.eq('auditReportId', args.auditReportId))
      .collect();
  },
});

export const resolveConstitutionViolation = mutation({
  args: {
    violationId: v.id('constitutionViolations'),
    resolution: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.violationId);
    if (!existing) {
      throw new Error('Constitution violation not found');
    }

    const updates = {
      status: 'addressed' as const,
      resolvedAt: Date.now(),
    };

    await ctx.db.patch(args.violationId, updates);
    const updated = await ctx.db.get(args.violationId);
    return updated;
  },
});

// Implementation Gaps
export const createImplementationGap = mutation({
  args: {
    auditReportId: v.id('auditReports'),
    featureTaskId: v.optional(v.id('featureTasks')),
    gapType: v.union(v.literal('missing_functionality'), v.literal('incomplete_implementation'), v.literal('architecture_issue'), v.literal('performance_issue')),
    description: v.string(),
    impact: v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical')),
    estimatedEffort: v.string(),
    dependencies: v.array(v.string()),
    priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical')),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    const gapData = {
      ...args,
      createdAt: timestamp,
    };

    const gapId = await ctx.db.insert('implementationGaps', gapData);
    return { gapId, ...gapData };
  },
});

export const getImplementationGapsByAuditReport = query({
  args: { auditReportId: v.id('auditReports') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('implementationGaps')
      .withIndex('by_audit_report', (q) => q.eq('auditReportId', args.auditReportId))
      .collect();
  },
});

// Conflicts
export const createConflict = mutation({
  args: {
    auditReportId: v.id('auditReports'),
    type: v.union(v.literal('architecture_conflict'), v.literal('principle_conflict'), v.literal('implementation_conflict'), v.literal('requirement_conflict')),
    description: v.string(),
    affectedFeatures: v.array(v.string()),
    severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical')),
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    const conflictData = {
      ...args,
      status: 'open' as const,
      createdAt: timestamp,
    };

    const conflictId = await ctx.db.insert('conflicts', conflictData);
    return { conflictId, ...conflictData };
  },
});

export const getConflictsByAuditReport = query({
  args: { auditReportId: v.id('auditReports') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('conflicts')
      .withIndex('by_audit_report', (q) => q.eq('auditReportId', args.auditReportId))
      .collect();
  },
});

export const resolveConflict = mutation({
  args: {
    conflictId: v.id('conflicts'),
    resolution: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.conflictId);
    if (!existing) {
      throw new Error('Conflict not found');
    }

    const updates = {
      resolution: args.resolution,
      status: 'resolved' as const,
    };

    await ctx.db.patch(args.conflictId, updates);
    const updated = await ctx.db.get(args.conflictId);
    return updated;
  },
});

// Recommendations
export const createRecommendation = mutation({
  args: {
    auditReportId: v.id('auditReports'),
    featureTaskId: v.optional(v.id('featureTasks')),
    type: v.union(v.literal('implementation'), v.literal('refinement'), v.literal('architecture'), v.literal('compliance'), v.literal('optimization')),
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical')),
    effort: v.string(),
    benefits: v.array(v.string()),
    risks: v.array(v.string()),
    dependencies: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    const recommendationData = {
      ...args,
      status: 'pending' as const,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const recommendationId = await ctx.db.insert('recommendations', recommendationData);
    return { recommendationId, ...recommendationData };
  },
});

export const getRecommendationsByAuditReport = query({
  args: { auditReportId: v.id('auditReports') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('recommendations')
      .withIndex('by_audit_report', (q) => q.eq('auditReportId', args.auditReportId))
      .collect();
  },
});

export const updateRecommendationStatus = mutation({
  args: {
    recommendationId: v.id('recommendations'),
    status: v.union(v.literal('pending'), v.literal('in_progress'), v.literal('completed'), v.literal('cancelled')),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.recommendationId);
    if (!existing) {
      throw new Error('Recommendation not found');
    }

    const updates = {
      status: args.status,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.recommendationId, updates);
    const updated = await ctx.db.get(args.recommendationId);
    return updated;
  },
});

export const getRecommendation = query({
  args: { recommendationId: v.id('recommendations') },
  handler: async (ctx, args) => {
    const recommendation = await ctx.db.get(args.recommendationId);
    return recommendation;
  },
});

// Audit Sessions
export const createAuditSession = mutation({
  args: {
    userId: v.string(),
    workspacePath: v.string(),
    constitutionVersion: v.string(),
    configuration: v.optional(v.object({
      includeTests: v.boolean(),
      includeDocumentation: v.boolean(),
      deepAnalysis: v.boolean(),
      parallelProcessing: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    const sessionData = {
      userId: args.userId,
      startTime: timestamp,
      status: 'active' as const,
      workspacePath: args.workspacePath,
      constitutionVersion: args.constitutionVersion,
      progress: {
        currentPhase: 'initialization',
        completedTasks: 0,
        totalTasks: 18,
        currentTask: undefined,
      },
      configuration: args.configuration || {
        includeTests: true,
        includeDocumentation: true,
        deepAnalysis: false,
        parallelProcessing: true,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const sessionId = await ctx.db.insert('auditSessions', sessionData);
    return { sessionId, ...sessionData };
  },
});

export const updateAuditSession = mutation({
  args: {
    sessionId: v.id('auditSessions'),
    updates: v.object({
      endTime: v.optional(v.number()),
      status: v.optional(v.union(v.literal('active'), v.literal('completed'), v.literal('failed'))),
      progress: v.optional(v.object({
        currentPhase: v.string(),
        completedTasks: v.number(),
        totalTasks: v.number(),
        currentTask: v.optional(v.string()),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.sessionId);
    if (!existing) {
      throw new Error('Audit session not found');
    }

    const updates = {
      ...args.updates,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(args.sessionId, updates);
    const updated = await ctx.db.get(args.sessionId);
    return updated;
  },
});

export const getAuditSession = query({
  args: { sessionId: v.id('auditSessions') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const getActiveAuditSessions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('auditSessions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();
  },
});