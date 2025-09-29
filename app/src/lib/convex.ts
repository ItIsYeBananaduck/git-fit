// Simple API interface for Convex functions
// Note: This is a simplified approach for the demo
// In production, you'd use the official Convex React client

// Resolve Convex URL from various env locations (Vite vs Node vs browser)
const CONVEX_URL =
  process.env.VITE_CONVEX_URL ||
  process.env.PUBLIC_CONVEX_URL ||
  process.env.CONVEX_URL ||
  undefined;

if (!CONVEX_URL) {
  // Don't throw during SSR/dev — log a warning and continue with a dummy URL.
  // This allows the dev server to start while env files are validated separately.
  // Frontend code should guard against missing/invalid Convex config in production.
  console.warn('Warning: Missing CONVEX_URL environment variable. Convex calls will be mocked in dev.');
}

// Mock implementations for admin functions
export const mockAdminFunctions = {
  moderation: {
    getModerationQueue: async () => ({
      items: [],
      total: 0,
      hasMore: false
    }),
    getModerationItem: async () => null,
    assignModerationItem: async () => ({ success: true }),
    reviewContent: async () => ({ success: true }),
    reviewModerationItem: async () => ({ success: true }),
    createModerationItem: async () => 'mock_id',
    escalateModerationItem: async () => ({ success: true }),
    getContentPolicies: async () => [],
    updateContentPolicy: async () => ({ success: true }),
    flagContent: async () => ({ success: true, moderationItemId: 'mock_id', priority: 'medium' }),
    setContentPolicy: async () => 'mock_policy_id',
    getContentAnalytics: async () => ({
      totalItems: 0,
      pendingReview: 0,
      approvedToday: 0,
      rejectedToday: 0,
      averageReviewTime: 0,
      flaggedByAI: 0,
      escalatedItems: 0
    }),
    automateContentFiltering: async () => ({
      rulesApplied: 0,
      itemsFlagged: 0
    }),
    updateUserReport: async () => ({ success: true }),
    getModerationStats: async () => ({
      totalItems: 0,
      pendingReview: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      escalated: 0,
      autoFlagged: 0,
      averageReviewTime: 0,
      flaggedByAI: 0
    }),
    approveCustomExercise: async () => ({ success: true }),
    rejectCustomExercise: async () => ({ success: true }),
    modifyCustomExercise: async () => ({ success: true }),
    approveMessage: async () => ({ success: true }),
    rejectMessage: async () => ({ success: true }),
    modifyMessage: async () => ({ success: true }),
    approveProfile: async () => ({ success: true }),
    rejectProfile: async () => ({ success: true }),
    modifyProfile: async () => ({ success: true }),
    createUserReport: async () => 'mock_report_id',
    getUserReports: async () => ({
      reports: [],
      total: 0,
      hasMore: false
    }),
    investigateUserReport: async () => ({ success: true }),
    flagInappropriateContentAuto: async () => ({
      success: true,
      moderationItemId: 'mock_id',
      priority: 'medium'
    }),
    getModerationActions: async () => [],
    createModerationAppeal: async () => 'mock_appeal_id',
    getContentAnalyticsDetailed: async () => ({
      totalItems: 0,
      byType: {},
      byStatus: {},
      byPriority: {},
      autoFlagged: 0,
      manualReports: 0,
      averageResolutionTime: 0,
      topFlags: {},
      escalationRate: 0,
      appealRate: 0
    }),
    createModerationAction: async (args: { action: string; reason: string; duration?: number; performedBy: string; timestamp: string; details: Record<string, unknown> }) => ({
      id: 'mock_action_id',
      action: args.action,
      reason: args.reason,
      duration: args.duration,
      performedBy: args.performedBy,
      timestamp: args.timestamp,
      details: args.details
    }),
    getModerationHistory: async () => []
  },
  audit: {
    logAdminAction: async () => ({ success: true }),
    getAuditLog: async () => ({
      entries: [],
      total: 0,
      hasMore: false
    }),
    getAuditStats: async () => ({
      totalActions: 0,
      actionsByType: {},
      actionsByUser: {},
      recentActivity: []
    }),
    logFailedLogin: async () => ({ success: true }),
    getAdminAuditLog: async () => ({
      entries: [],
      total: 0,
      hasMore: false
    }),
    getAuditLogByTimeRange: async () => []
  },
  analytics: {
    getDashboardMetrics: async () => ({
      userMetrics: {
        totalUsers: 1000,
        activeUsers: 500
      },
      revenueMetrics: {
        totalRevenue: 50000,
        monthlyRevenue: 5000
      },
      engagementMetrics: {
        averageSessionDuration: 30,
        dailyActiveUsers: 200
      }
    }),
    getUserGrowthAnalytics: async () => ({
      totalNewUsers: 100,
      userRetention: 85,
      growthRate: 15,
      dailyActiveUsers: [
        { date: '2024-01-01', value: 200 },
        { date: '2024-01-02', value: 220 }
      ]
    }),
    getRevenueAnalytics: async () => ({
      totalRevenue: 50000,
      monthlyRevenue: 5000,
      revenueBySource: {},
      growthRate: 10
    }),
    getEngagementMetrics: async () => ({
      averageSessionDuration: 30,
      dailyActiveUsers: [
        { date: '2024-01-01', value: 200 },
        { date: '2024-01-02', value: 220 }
      ],
      featureUsage: {},
      userRetention: 85
    }),
    saveCustomDashboard: async () => ({
      success: true,
      dashboardId: 'mock_dashboard_id'
    }),
    getCustomDashboards: async () => ({
      dashboards: [],
      total: 0,
      hasMore: false
    }),
    scheduleReport: async () => ({
      success: true,
      scheduleId: 'mock_schedule_id'
    }),
    getReportHistory: async () => ({
      reports: [],
      total: 0,
      hasMore: false
    })
  },
  auth: {
    authenticateAdmin: async () => ({
      success: true,
      adminUser: {
        id: 'mock_admin',
        email: 'admin@example.com',
        role: 'super_admin'
      }
    }),
    getAdminUsers: async () => ({
      users: [],
      total: 0,
      hasMore: false
    }),
    createAdminUser: async () => ({
      success: true,
      adminUserId: 'mock_admin_id'
    }),
    updateAdminUser: async () => ({ success: true }),
    deactivateAdminUser: async () => ({ success: true }),
    getAdminByEmail: async (args: { email: string }) => ({
      _id: 'mock_admin_id',
      email: args.email,
      name: 'Mock Admin',
      role: 'super_admin',
      passwordHash: 'mock_hash',
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mfaEnabled: false,
      mfaSecret: null,
      permissions: ['all'],
      createdBy: 'system',
      ipWhitelist: [],
      sessionTimeout: 28800000
    }),
    getAdminById: async (args: { adminId: string }) => ({
      _id: args.adminId,
      email: 'admin@example.com',
      name: 'Mock Admin',
      role: 'super_admin',
      passwordHash: 'mock_hash',
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mfaEnabled: false,
      mfaSecret: null,
      permissions: ['all'],
      createdBy: 'system',
      ipWhitelist: [],
      sessionTimeout: 28800000
    }),
    getAllAdminUsers: async () => ({
      page: [],
      total: 0,
      hasMore: false
    }),
    createFirstSuperAdmin: async () => 'mock_first_admin_id',
    createAdminSession: async () => ({
      _id: 'mock_session_id',
      adminId: 'mock_admin_id',
      token: 'mock_session_token',
      ipAddress: '127.0.0.1',
      userAgent: 'Mock Browser',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      lastActivity: new Date().toISOString()
    }),
    updateAdminLoginSuccess: async () => ({ success: true }),
    getAdminSession: async () => ({
      _id: 'mock_session_id',
      adminId: 'mock_admin_id',
      token: 'mock_session_token',
      ipAddress: '127.0.0.1',
      userAgent: 'Mock Browser',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      lastActivity: new Date().toISOString()
    }),
    revokeAdminSession: async () => ({ success: true }),
    updateSessionActivity: async () => ({ success: true }),
    updateFailedLoginAttempts: async () => ({ success: true }),
    updateAdminPermissions: async () => ({ success: true }),
    revokeAllAdminSessions: async () => ({ success: true }),
    storeMFASecret: async () => ({ success: true }),
    enableMFA: async () => ({ success: true })
  },
  communication: {
    sendNotification: async () => ({ success: true }),
    getNotificationHistory: async () => ({
      notifications: [],
      total: 0,
      hasMore: false
    }),
    createAnnouncement: async () => ({
      success: true,
      announcementId: 'mock_announcement_id'
    }),
    getAnnouncements: async () => ({
      announcements: [],
      total: 0,
      hasMore: false
    }),
    updateAnnouncement: async () => ({ success: true }),
    deleteAnnouncement: async () => ({ success: true }),
    sendPlatformAnnouncement: async () => ({
      announcementId: 'mock_announcement_id',
      recipientCount: 0
    }),
    sendTargetedMessage: async () => ({
      messageId: 'mock_message_id',
      recipientCount: 0
    }),
    getAnalytics: async () => ({
      announcementsSent: 0,
      messagesSent: 0,
      ticketsCreated: 0,
      ticketsResolved: 0,
      averageResponseTime: 0,
      userEngagement: {}
    })
  },
  privacy: {
    getDataRequests: async () => ({
      requests: [],
      total: 0,
      hasMore: false
    }),
    processDataRequest: async () => ({ success: true }),
    getPrivacySettings: async () => ({
      dataRetention: '1_year',
      exportFormat: 'json',
      anonymizeData: true
    }),
    updatePrivacySettings: async () => ({ success: true }),
    exportUserData: async () => ({
      success: true,
      exportId: 'mock_export_id',
      downloadUrl: 'mock_url',
      expiresAt: new Date().toISOString()
    }),
    deleteUserData: async () => ({ success: true }),
    handleGDPRRequest: async () => ({
      requestId: 'mock_request_id',
      status: 'processing',
      estimatedCompletion: new Date().toISOString()
    })
  },
  roles: {
    getRoles: async () => ({
      roles: [],
      total: 0,
      hasMore: false
    }),
    getAllAdminRoles: async () => [],
    getAllAdminPermissions: async () => [],
    createRole: async () => ({
      success: true,
      roleId: 'mock_role_id'
    }),
    updateRole: async () => ({ success: true }),
    deleteRole: async () => ({ success: true }),
    assignRole: async () => ({ success: true }),
    revokeRole: async () => ({ success: true }),
    getRolePermissions: async () => ({
      permissions: ['read', 'write', 'admin']
    }),
    initializeDefaultRolesAndPermissions: async () => ({ success: true })
  },
  setup: {
    initializeAdminSystem: async () => ({ success: true }),
    getSystemStatus: async () => ({
      initialized: true,
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    }),
    updateSystemSettings: async () => ({ success: true }),
    getSystemSettings: async () => ({
      maintenanceMode: false,
      debugMode: false,
      maxUsers: 1000
    }),
    resetAdminSystem: async () => ({ success: true })
  },
  support: {
    getSupportTickets: async () => ({
      tickets: [],
      total: 0,
      hasMore: false
    }),
    createSupportTicket: async () => ({
      id: 'mock_ticket_id',
      userId: 'mock_user',
      subject: 'Mock ticket',
      status: 'open',
      priority: 'medium',
      category: 'general',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    }),
    updateSupportTicket: async () => ({ success: true }),
    assignSupportTicket: async () => ({ success: true }),
    resolveSupportTicket: async () => ({ success: true }),
    getSupportStats: async () => ({
      totalTickets: 0,
      openTickets: 0,
      resolvedToday: 0,
      averageResolutionTime: 0
    }),
    addTicketMessage: async () => ({
      id: 'mock_message_id',
      ticketId: 'mock_ticket',
      senderId: 'mock_sender',
      message: 'Mock message',
      timestamp: new Date().toISOString(),
      isInternal: false
    }),
    getSupportTicketDetails: async () => ({
      id: 'mock_ticket_id',
      userId: 'mock_user',
      subject: 'Mock ticket',
      status: 'open',
      priority: 'medium',
      category: 'general',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    })
  },
  users: {
    getUsers: async () => ({
      users: [],
      total: 0,
      hasMore: false
    }),
    getUser: async () => null,
    updateUser: async () => ({ success: true }),
    deactivateUser: async () => ({ success: true }),
    getUserStats: async () => ({
      totalUsers: 0,
      activeUsers: 0,
      newUsersToday: 0,
      userRetention: 0
    }),
    searchUsers: async () => ({
      users: [],
      total: 0,
      hasMore: false
    }),
    performBulkAction: async () => ({
      successful: 0,
      failed: 0,
      results: []
    }),
    getUserBasicInfo: async () => ({
      id: 'mock_user',
      email: 'user@example.com',
      name: 'Mock User',
      role: 'client',
      createdAt: new Date().toISOString(),
      isActive: true,
      profile: {
        avatar: null,
        bio: null,
        location: null,
        fitnessGoals: [],
        experienceLevel: 'beginner'
      }
    }),
    getUserSubscriptionInfo: async () => ({
      status: 'active',
      tier: 'premium',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      paymentMethod: 'card'
    }),
    getUserActivityMetrics: async () => ({
      lastLogin: new Date().toISOString(),
      sessionCount: 10,
      averageSessionDuration: 30,
      featureUsage: {},
      engagementScore: 0.8,
      retentionCohort: 'active'
    }),
    getUserSupportHistory: async () => [],
    getUserModerationHistory: async () => [],
    getUserFinancialSummary: async () => ({
      totalSpent: 99.99,
      totalRefunds: 0,
      averageOrderValue: 99.99,
      paymentMethods: ['card'],
      lastPayment: new Date().toISOString(),
      outstandingBalance: 0
    }),
    getUserDeviceConnections: async () => [],
    suspendUser: async () => ({ success: true }),
    deleteUserData: async () => ({
      success: true,
      deletedRecords: 5
    }),
    createImpersonationSession: async () => ({ success: true }),
    getImpersonationSession: async () => ({
      sessionId: 'mock_session',
      adminId: 'mock_admin',
      userId: 'mock_user',
      startTime: new Date().toISOString(),
      reason: 'Support'
    }),
    endImpersonationSession: async () => ({ success: true }),
    getUserActivityTimeline: async () => [],
    activateUser: async () => ({ success: true }),
    sendUserMessage: async () => ({ success: true }),
    terminateUser: async () => ({ success: true })
  }
};

// Create a simple mock API that doesn't import the generated API
const mockApi = {
  functions: {
    admin: mockAdminFunctions,
    users: {
      login: async () => ({
        success: true,
        user: {
          _id: 'mock_user_id',
          email: 'user@example.com',
          name: 'Mock User',
          role: 'client',
          emailVerified: true,
          lastLogin: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          profile: {
            avatar: null,
            bio: null,
            location: null,
            fitnessGoals: [],
            experienceLevel: 'beginner'
          }
        },
        token: 'mock_jwt_token'
      }),
      logout: async () => ({ success: true }),
      validateSession: async () => ({
        valid: true,
        user: {
          _id: 'mock_user_id',
          email: 'user@example.com',
          name: 'Mock User',
          role: 'client',
          emailVerified: true,
          lastLogin: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          profile: {
            avatar: null,
            bio: null,
            location: null,
            fitnessGoals: [],
            experienceLevel: 'beginner'
          }
        }
      }),
      requestPasswordReset: async () => ({ success: true, token: 'mock_reset_token' }),
      resetPassword: async () => ({ success: true }),
      updateUserProfile: async () => ({ success: true }),
      changePassword: async () => ({ success: true })
    }
  },
  // Also expose admin functions at top level for backward compatibility
  admin: mockAdminFunctions
};

// Export the API structure
export const api = {
  ...mockApi,
  // Override with admin functions at top level
  admin: mockAdminFunctions
};

// Mock convex client with proper typing - includes admin functions
export const convex = {
  query: async (fn: unknown, ...args: unknown[]) => {
    // Mock query implementation - just call the function directly
    if (typeof fn === 'function') {
      return await (fn as (...args: unknown[]) => Promise<unknown>)(...args);
    }
    // If it's a FunctionReference, try to call it as a function
    return await (fn as (...args: unknown[]) => Promise<unknown>)(...args);
  },
  mutation: async (fn: unknown, ...args: unknown[]) => {
    // Mock mutation implementation - just call the function directly
    if (typeof fn === 'function') {
      return await (fn as (...args: unknown[]) => Promise<unknown>)(...args);
    }
    // If it's a FunctionReference, try to call it as a function
    return await (fn as (...args: unknown[]) => Promise<unknown>)(...args);
  },
  admin: mockAdminFunctions,
  functions: mockApi.functions
};
