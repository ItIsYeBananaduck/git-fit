import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Audit Report operations
export const createAuditReport = mutation({
  args: {
    // Contract-required fields
    featureId: v.string(), // Must equal "020-adaptive-fit-codebase"
    auditor: v.string(), // Non-empty string
    auditCriteria: v.object({
      scope: v.array(v.string()),
      depth: v.string(),
      includeConstitutionCheck: v.boolean(),
      includeImplementationGaps: v.boolean(),
    }),

    // Optional initial data
    initialData: v.optional(v.object({
      status: v.optional(v.union(v.literal("in_progress"), v.literal("completed"), v.literal("failed"))),
      summary: v.optional(v.object({
        totalFeatures: v.number(),
        implemented: v.number(),
        needsRefinement: v.number(),
        missing: v.number(),
        constitutionViolations: v.number(),
        criticalIssues: v.array(v.string())
      })),
      constitutionCompliance: v.optional(v.object({
        overallScore: v.number(),
        principleBreakdown: v.any()
      })),
      metadata: v.optional(v.object({
        auditDuration: v.number(),
        codebaseSize: v.number(),
        aiModelsFound: v.array(v.string()),
        technologiesUsed: v.array(v.string())
      }))
    }))
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Contract validation
    if (args.featureId !== "020-adaptive-fit-codebase") {
      throw new Error("featureId must equal '020-adaptive-fit-codebase'");
    }
    if (!args.auditor || args.auditor.trim().length === 0) {
      throw new Error("auditor must be a non-empty string");
    }

    const reportId = await ctx.db.insert("auditReports", {
      // Contract-required fields
      featureId: args.featureId,
      startDate: now,
      totalTasks: 18, // Contract requirement
      constitutionVersion: "2.0.0", // Contract requirement
      status: args.initialData?.status || "in_progress",
      progress: {
        completedTasks: 0,
        totalTasks: 18,
        percentageComplete: 0,
      },
      auditor: args.auditor,
      auditCriteria: args.auditCriteria,

      // Optional fields with defaults
      summary: args.initialData?.summary || {
        totalFeatures: 18,
        implemented: 0,
        needsRefinement: 0,
        missing: 0,
        constitutionViolations: 0,
        criticalIssues: []
      },
      constitutionCompliance: args.initialData?.constitutionCompliance || {
        overallScore: 0,
        principleBreakdown: {}
      },
      metadata: args.initialData?.metadata || {
        auditDuration: 0,
        codebaseSize: 0,
        aiModelsFound: [],
        technologiesUsed: []
      },

      createdAt: now,
      updatedAt: now,
    });
    return reportId;
  }
});

export const updateAuditReport = mutation({
  args: {
    reportId: v.id("auditReports"),
    updates: v.object({
      status: v.optional(v.union(v.literal("in_progress"), v.literal("completed"), v.literal("failed"))),
      completionDate: v.optional(v.number()), // Must be >= startDate if provided
      progress: v.optional(v.object({
        completedTasks: v.number(),
        totalTasks: v.number(), // Must equal 18
        currentTask: v.optional(v.string()),
        percentageComplete: v.number(),
      })),
      summary: v.optional(v.object({
        totalFeatures: v.number(),
        implemented: v.number(),
        needsRefinement: v.number(),
        missing: v.number(),
        constitutionViolations: v.number(),
        criticalIssues: v.array(v.string())
      })),
      constitutionCompliance: v.optional(v.object({
        overallScore: v.number(),
        principleBreakdown: v.any()
      })),
      metadata: v.optional(v.object({
        auditDuration: v.number(),
        codebaseSize: v.number(),
        aiModelsFound: v.array(v.string()),
        technologiesUsed: v.array(v.string())
      }))
    })
  },
  handler: async (ctx, args) => {
    // Contract validation
    if (args.updates.completionDate) {
      const report = await ctx.db.get(args.reportId);
      if (report && args.updates.completionDate < report.startDate) {
        throw new Error("completionDate must be >= startDate");
      }
    }
    if (args.updates.progress?.totalTasks && args.updates.progress.totalTasks !== 18) {
      throw new Error("totalTasks must equal 18");
    }

    await ctx.db.patch(args.reportId, {
      ...args.updates,
      updatedAt: Date.now()
    });
    return args.reportId;
  }
});

export const getAuditReport = query({
  args: { reportId: v.id("auditReports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.reportId);
  }
});

// Feature Task operations
export const createFeatureTask = mutation({
  args: {
    featureId: v.string(),
    category: v.union(
      v.literal("core_feature"),
      v.literal("adaptive_engine"),
      v.literal("ai_integration"),
      v.literal("user_experience"),
      v.literal("data_management"),
      v.literal("security_privacy"),
      v.literal("performance_optimization")
    ),
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("blocked"),
      v.literal("cancelled")
    ),
    assignedTo: v.optional(v.string()),
    estimatedHours: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    dependencies: v.optional(v.array(v.string())),
    acceptanceCriteria: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("featureTasks", args);
  }
});

export const getFeatureTasksByCategory = query({
  args: {
    category: v.union(
      v.literal("core_feature"),
      v.literal("adaptive_engine"),
      v.literal("ai_integration"),
      v.literal("user_experience"),
      v.literal("data_management"),
      v.literal("security_privacy"),
      v.literal("performance_optimization")
    )
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("featureTasks").filter(q => q.eq(q.field("category"), args.category)).collect();
  }
});

export const getFeatureTask = query({
  args: { taskId: v.id("featureTasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  }
});

// Constitution Violation operations
export const createConstitutionViolation = mutation({
  args: {
    auditReportId: v.id("auditReports"),
    featureTaskId: v.optional(v.id("featureTasks")),

    // Contract-required fields
    principle: v.string(), // Must be one of 7 constitution principles
    severity: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    description: v.string(), // Max 500 characters
    evidence: v.string(),

    // Contract-required remediation object
    remediation: v.object({
      action: v.string(),
      effort: v.string(),
      timeline: v.string(),
      responsible: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Contract validation
    const constitutionPrinciples = [
      "constitution_driven_development",
      "ai_safety_first",
      "user_centric_design",
      "data_privacy_security",
      "performance_excellence",
      "continuous_improvement",
      "ethical_ai_practice"
    ];
    if (!constitutionPrinciples.includes(args.principle)) {
      throw new Error(`principle must be one of: ${constitutionPrinciples.join(", ")}`);
    }
    if (args.description.length > 500) {
      throw new Error("description must be <= 500 characters");
    }

    return await ctx.db.insert("constitutionViolations", {
      ...args,
      status: "identified",
      createdAt: Date.now(),
    });
  }
});

export const getViolationsByPrinciple = query({
  args: { principle: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("constitutionViolations").filter(q => q.eq(q.field("principle"), args.principle)).collect();
  }
});

export const getConstitutionViolation = query({
  args: { violationId: v.id("constitutionViolations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.violationId);
  }
});

export const getViolationsBySeverity = query({
  args: { severity: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")) },
  handler: async (ctx, args) => {
    return await ctx.db.query("constitutionViolations").filter(q => q.eq(q.field("severity"), args.severity)).collect();
  }
});

// Implementation Gap operations
export const createImplementationGap = mutation({
  args: {
    auditReportId: v.id("auditReports"),
    featureTaskId: v.optional(v.id("featureTasks")),

    // Contract-required fields
    featureName: v.string(), // Must be one of 18 recognized tasks
    gapType: v.union(
      v.literal("missing_code"),
      v.literal("incomplete_feature"),
      v.literal("broken_integration")
    ),
    description: v.string(), // Max 300 characters
    impact: v.union(
      v.literal("blocks_beta"),
      v.literal("affects_user_experience"),
      v.literal("performance_issue"),
      v.literal("security_risk")
    ),

    // Contract-required constitution principles and acceptance criteria
    constitutionPrinciples: v.array(v.string()), // Non-empty array
    acceptanceCriteria: v.array(v.string()), // Non-empty array of testable criteria

    // Additional fields
    estimatedEffort: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
    dependencies: v.array(v.string()), // Array of task IDs
  },
  handler: async (ctx, args) => {
    // Contract validation
    const recognizedTasks = [
      "001-core-fitness-tracking",
      "002-adaptive-workout-engine",
      "003-ai-personalization",
      "004-cross-platform-sync",
      "005-nutrition-integration",
      "006-social-features",
      "007-progress-analytics",
      "008-wearable-integration",
      "009-offline-capability",
      "010-security-privacy",
      "011-performance-optimization",
      "012-mobile-ui-ux",
      "013-web-dashboard",
      "014-ai-coaching",
      "015-voice-interaction",
      "016-multi-modal-input",
      "017-real-time-sync",
      "018-constitution-compliance"
    ];
    if (!recognizedTasks.includes(args.featureName)) {
      throw new Error(`featureName must be one of: ${recognizedTasks.join(", ")}`);
    }

    if (args.constitutionPrinciples.length === 0) {
      throw new Error("constitutionPrinciples must be a non-empty array");
    }

    if (args.acceptanceCriteria.length === 0) {
      throw new Error("acceptanceCriteria must be a non-empty array");
    }

    if (args.description.length > 300) {
      throw new Error("description must be <= 300 characters");
    }

    return await ctx.db.insert("implementationGaps", {
      ...args,
      createdAt: Date.now(),
    });
  }
});

export const getImplementationGap = query({
  args: { gapId: v.id("implementationGaps") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gapId);
  }
});

// Conflict operations
export const createConflict = mutation({
  args: {
    conflictType: v.union(
      v.literal("design_conflict"),
      v.literal("requirement_conflict"),
      v.literal("implementation_conflict"),
      v.literal("architectural_conflict")
    ),
    description: v.string(),
    affectedFeatures: v.array(v.string()),
    severity: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    resolution: v.optional(v.string()),
    auditReportId: v.optional(v.id("auditReports"))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conflicts", {
      ...args,
      status: "open"
    });
  }
});

export const resolveConflict = mutation({
  args: {
    conflictId: v.id("conflicts"),
    resolution: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conflictId, {
      resolution: args.resolution,
      status: "resolved"
    });
    return args.conflictId;
  }
});

// Recommendation operations
export const createRecommendation = mutation({
  args: {
    featureId: v.optional(v.string()),
    recommendationType: v.union(
      v.literal("implementation"),
      v.literal("design"),
      v.literal("architecture"),
      v.literal("performance"),
      v.literal("security"),
      v.literal("usability")
    ),
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    effort: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("very_high")),
    impact: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("very_high")),
    rationale: v.string(),
    implementationSteps: v.array(v.string()),
    auditReportId: v.optional(v.id("auditReports"))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recommendations", {
      ...args,
      status: "pending"
    });
  }
});

export const updateRecommendationStatus = mutation({
  args: {
    recommendationId: v.id("recommendations"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("rejected")
    )
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recommendationId, { status: args.status });
    return args.recommendationId;
  }
});

export const getRecommendationsByFeature = query({
  args: { featureId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("recommendations").filter(q => q.eq(q.field("featureId"), args.featureId)).collect();
  }
});

// Audit Session operations
export const createAuditSession = mutation({
  args: {
    sessionName: v.string(),
    description: v.optional(v.string()),
    scope: v.array(v.string()),
    configuration: v.optional(v.object({
      includePerformanceMetrics: v.boolean(),
      includeSecurityAudit: v.boolean(),
      includeConstitutionCompliance: v.boolean(),
      maxAuditDuration: v.number()
    }))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditSessions", {
      sessionName: args.sessionName,
      description: args.description,
      scope: args.scope,
      status: "initialized",
      startTime: Date.now(),
      configuration: args.configuration || {
        includePerformanceMetrics: true,
        includeSecurityAudit: true,
        includeConstitutionCompliance: true,
        maxAuditDuration: 900000 // 15 minutes
      }
    });
  }
});

export const updateAuditSession = mutation({
  args: {
    sessionId: v.id("auditSessions"),
    updates: v.object({
      status: v.optional(v.union(
        v.literal("initialized"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("failed")
      )),
      endTime: v.optional(v.number()),
      results: v.optional(v.object({
        totalReports: v.number(),
        totalViolations: v.number(),
        totalGaps: v.number(),
        totalConflicts: v.number(),
        totalRecommendations: v.number(),
        complianceScore: v.number()
      }))
    })
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, args.updates);
    return args.sessionId;
  }
});

export const getAuditSession = query({
  args: { sessionId: v.id("auditSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  }
});