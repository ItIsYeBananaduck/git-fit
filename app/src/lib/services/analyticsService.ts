// Analytics Service for Admin Dashboard

import { ConvexError } from "convex/values";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { convex } from "../convex";
import { adminAuthService } from "./adminAuth";

export interface DashboardMetrics {
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    churnRate: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    recurringRevenue: number;
    averageRevenuePerUser: number;
    revenueGrowthRate: number;
  };
  engagementMetrics: {
    dailyActiveUsers: number;
    sessionDuration: number;
    featureAdoption: Record<string, number>;
    retentionRate: number;
  };
  systemMetrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    resourceUtilization: number;
  };
}

export interface DataPoint {
  date: string;
  value: number;
}

export interface GrowthAnalytics {
  period: string;
  userGrowth: DataPoint[];
  acquisitionChannels: Record<string, number>;
  totalNewUsers: number;
}

export interface RevenueAnalytics {
  period: string;
  totalRevenue: number;
  revenueBySource: Record<string, number>;
  revenueGrowth: DataPoint[];
  averageRevenuePerUser: DataPoint[];
  subscriptionMetrics: {
    newSubscriptions: number;
    cancellations: number;
    upgrades: number;
    downgrades: number;
    churnRate: number;
  };
}

export interface EngagementMetrics {
  period: string;
  dailyActiveUsers: DataPoint[];
  sessionMetrics: {
    averageDuration: number;
    bounceRate: number;
    returnVisitorRate: number;
  };
  featureUsage: Record<string, number>;
  userJourneys: any[];
}

export interface CustomDashboard {
  dashboardId: string;
  name: string;
  layout: any;
  widgets: any[];
  isDefault: boolean;
  createdAt: string;
}

export class AnalyticsService {
  private subscriptions = new Map<string, any>();

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(
    timeframe?: { start: string; end: string },
    adminId?: Id<"adminUsers">
  ): Promise<DashboardMetrics> {
    try {
      if (adminId) {
        // Validate admin permissions
        const canViewAnalytics = await adminAuthService.validateAdminPermissions(adminId, "read", "analytics");
        if (!canViewAnalytics) {
          throw new ConvexError("Insufficient permissions to view analytics");
        }
      }

      const metrics = await convex.query(api.admin.analytics.getDashboardMetrics, {
        timeframe
      });

      if (adminId) {
        // Log analytics access
        await adminAuthService.logAdminAction(adminId, {
          action: "dashboard_metrics_viewed",
          resource: "analytics",
          details: { timeframe },
          ipAddress: "system",
          userAgent: "system"
        });
      }

      return metrics;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get dashboard metrics");
    }
  }

  /**
   * Get user growth analytics
   */
  async getUserGrowthAnalytics(
    period: "1d" | "7d" | "30d" | "90d" | "1y",
    startDate?: string,
    endDate?: string,
    adminId?: Id<"adminUsers">
  ): Promise<GrowthAnalytics> {
    try {
      if (adminId) {
        const canViewAnalytics = await adminAuthService.validateAdminPermissions(adminId, "read", "analytics");
        if (!canViewAnalytics) {
          throw new ConvexError("Insufficient permissions to view user analytics");
        }
      }

      const analytics = await convex.query(api.admin.analytics.getUserGrowthAnalytics, {
        period,
        startDate,
        endDate
      });

      if (adminId) {
        await adminAuthService.logAdminAction(adminId, {
          action: "user_growth_analytics_viewed",
          resource: "analytics",
          details: { period, startDate, endDate },
          ipAddress: "system",
          userAgent: "system"
        });
      }

      return analytics;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get user growth analytics");
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(
    period: "1d" | "7d" | "30d" | "90d" | "1y",
    startDate?: string,
    endDate?: string,
    adminId?: Id<"adminUsers">
  ): Promise<RevenueAnalytics> {
    try {
      if (adminId) {
        const canViewAnalytics = await adminAuthService.validateAdminPermissions(adminId, "read", "revenue_analytics");
        if (!canViewAnalytics) {
          throw new ConvexError("Insufficient permissions to view revenue analytics");
        }
      }

      const analytics = await convex.query(api.admin.analytics.getRevenueAnalytics, {
        period,
        startDate,
        endDate
      });

      if (adminId) {
        await adminAuthService.logAdminAction(adminId, {
          action: "revenue_analytics_viewed",
          resource: "analytics",
          details: { period, startDate, endDate },
          ipAddress: "system",
          userAgent: "system"
        });
      }

      return analytics;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get revenue analytics");
    }
  }

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics(
    period: "1d" | "7d" | "30d" | "90d" | "1y",
    startDate?: string,
    endDate?: string,
    adminId?: Id<"adminUsers">
  ): Promise<EngagementMetrics> {
    try {
      if (adminId) {
        const canViewAnalytics = await adminAuthService.validateAdminPermissions(adminId, "read", "engagement_analytics");
        if (!canViewAnalytics) {
          throw new ConvexError("Insufficient permissions to view engagement analytics");
        }
      }

      const metrics = await convex.query(api.admin.analytics.getEngagementMetrics, {
        period,
        startDate,
        endDate
      });

      if (adminId) {
        await adminAuthService.logAdminAction(adminId, {
          action: "engagement_metrics_viewed",
          resource: "analytics",
          details: { period, startDate, endDate },
          ipAddress: "system",
          userAgent: "system"
        });
      }

      return metrics;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get engagement metrics");
    }
  }

  /**
   * Subscribe to real-time metrics updates
   */
  async subscribeToMetrics(
    subscriptionType: "dashboard" | "users" | "revenue" | "engagement",
    adminId: Id<"adminUsers">,
    callback: (data: any) => void
  ): Promise<string> {
    try {
      const canViewAnalytics = await adminAuthService.validateAdminPermissions(adminId, "read", "analytics");
      if (!canViewAnalytics) {
        throw new ConvexError("Insufficient permissions to subscribe to metrics");
      }

      // Import real-time service dynamically to avoid circular dependencies
      const { realTimeServiceInstance } = await import('./realTimeService');
      
      // Connect to real-time service if not already connected
      if (realTimeServiceInstance.getConnectionStatus() !== 'connected') {
        await realTimeServiceInstance.connect(adminId);
      }

      // Subscribe to real-time updates
      const subscriptionId = realTimeServiceInstance.subscribe(subscriptionType, adminId, callback);

      // Store subscription info
      this.subscriptions.set(subscriptionId, {
        callback,
        type: subscriptionType,
        adminId,
        realTime: true
      });

      await adminAuthService.logAdminAction(adminId, {
        action: "metrics_subscription_created",
        resource: "analytics",
        details: { subscriptionType, subscriptionId },
        ipAddress: "system",
        userAgent: "system"
      });

      return subscriptionId;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to subscribe to metrics");
    }
  }

  /**
   * Unsubscribe from metrics updates
   */
  async unsubscribeFromMetrics(subscriptionId: string): Promise<void> {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription) {
        // Handle real-time subscriptions
        if (subscription.realTime) {
          const { realTimeServiceInstance } = await import('./realTimeService');
          realTimeServiceInstance.unsubscribe(subscriptionId);
        } else {
          // Clear interval for legacy subscriptions
          if (subscription.interval) {
            clearInterval(subscription.interval);
          }
        }

        // Remove from subscriptions
        this.subscriptions.delete(subscriptionId);

        if (subscription.adminId) {
          await adminAuthService.logAdminAction(subscription.adminId, {
            action: "metrics_subscription_cancelled",
            resource: "analytics",
            details: { subscriptionId },
            ipAddress: "system",
            userAgent: "system"
          });
        }
      }
    } catch (error) {
      console.error("Failed to unsubscribe from metrics:", error);
    }
  }

  /**
   * Save custom dashboard configuration
   */
  async saveCustomDashboard(
    dashboardName: string,
    layout: any,
    widgets: any[],
    adminId: Id<"adminUsers">,
    isDefault: boolean = false
  ): Promise<{ dashboardId: string }> {
    try {
      const canManageDashboards = await adminAuthService.validateAdminPermissions(adminId, "write", "dashboards");
      if (!canManageDashboards) {
        throw new ConvexError("Insufficient permissions to manage dashboards");
      }

      const dashboard = await convex.mutation(api.admin.analytics.saveCustomDashboard, {
        adminId,
        dashboardName,
        layout,
        widgets,
        isDefault
      });

      await adminAuthService.logAdminAction(adminId, {
        action: "custom_dashboard_saved",
        resource: "dashboards",
        resourceId: dashboard.dashboardId,
        details: { 
          dashboardName,
          widgetCount: widgets.length,
          isDefault
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return { dashboardId: dashboard.dashboardId };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to save custom dashboard");
    }
  }

  /**
   * Get custom dashboards for admin
   */
  async getCustomDashboards(adminId: Id<"adminUsers">): Promise<CustomDashboard[]> {
    try {
      const canViewDashboards = await adminAuthService.validateAdminPermissions(adminId, "read", "dashboards");
      if (!canViewDashboards) {
        throw new ConvexError("Insufficient permissions to view dashboards");
      }

      const dashboards = await convex.query(api.admin.analytics.getCustomDashboards, {
        adminId
      });

      await adminAuthService.logAdminAction(adminId, {
        action: "custom_dashboards_viewed",
        resource: "dashboards",
        details: { dashboardCount: dashboards.length },
        ipAddress: "system",
        userAgent: "system"
      });

      return dashboards;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get custom dashboards");
    }
  }

  /**
   * Compare metrics between time periods
   */
  async compareMetrics(
    metricType: "users" | "revenue" | "engagement",
    currentPeriod: { start: string; end: string },
    previousPeriod: { start: string; end: string },
    adminId: Id<"adminUsers">
  ): Promise<{ current: any; previous: any; change: number; changePercent: number }> {
    try {
      const canViewAnalytics = await adminAuthService.validateAdminPermissions(adminId, "read", "analytics");
      if (!canViewAnalytics) {
        throw new ConvexError("Insufficient permissions to compare metrics");
      }

      let currentData, previousData;

      switch (metricType) {
        case "users":
          currentData = await this.getUserGrowthAnalytics("30d", currentPeriod.start, currentPeriod.end, adminId);
          previousData = await this.getUserGrowthAnalytics("30d", previousPeriod.start, previousPeriod.end, adminId);
          break;
        case "revenue":
          currentData = await this.getRevenueAnalytics("30d", currentPeriod.start, currentPeriod.end, adminId);
          previousData = await this.getRevenueAnalytics("30d", previousPeriod.start, previousPeriod.end, adminId);
          break;
        case "engagement":
          currentData = await this.getEngagementMetrics("30d", currentPeriod.start, currentPeriod.end, adminId);
          previousData = await this.getEngagementMetrics("30d", previousPeriod.start, previousPeriod.end, adminId);
          break;
      }

      // Calculate change (simplified - would need specific metric extraction)
      const currentValue = metricType === "users" ? currentData.totalNewUsers :
                          metricType === "revenue" ? currentData.totalRevenue :
                          currentData.dailyActiveUsers.reduce((sum, d) => sum + d.value, 0);

      const previousValue = metricType === "users" ? previousData.totalNewUsers :
                           metricType === "revenue" ? previousData.totalRevenue :
                           previousData.dailyActiveUsers.reduce((sum, d) => sum + d.value, 0);

      const change = currentValue - previousValue;
      const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;

      await adminAuthService.logAdminAction(adminId, {
        action: "metrics_comparison_performed",
        resource: "analytics",
        details: { 
          metricType,
          currentPeriod,
          previousPeriod,
          change,
          changePercent
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return {
        current: currentData,
        previous: previousData,
        change,
        changePercent
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to compare metrics");
    }
  }

  /**
   * Cleanup all subscriptions (call on service destruction)
   */
  async cleanup(): Promise<void> {
    // Clean up real-time service
    try {
      const { realTimeServiceInstance } = await import('./realTimeService');
      realTimeServiceInstance.disconnect();
    } catch (error) {
      console.error("Failed to disconnect real-time service:", error);
    }

    // Clean up legacy subscriptions
    this.subscriptions.forEach((subscription, subscriptionId) => {
      if (subscription.interval) {
        clearInterval(subscription.interval);
      }
    });
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();