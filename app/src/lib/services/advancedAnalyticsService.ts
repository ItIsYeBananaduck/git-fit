// Advanced Analytics and Reporting Service

import { ConvexError } from "convex/values";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { convex } from "$lib/convex";
import { adminAuthService } from "./adminAuth";

export interface UserBehaviorAnalytics {
  totalUsers: number;
  totalSessions: number;
  averageSessionsPerUser: number;
  segments: Record<string, {
    userCount: number;
    sessions: number;
    avgSessionDuration: number;
  }>;
  cohorts: Record<string, {
    size: number;
    retention: Record<string, number>;
  }>;
  userJourneys: any[];
  behaviorPatterns: {
    mostActiveHours: any[];
    commonWorkoutTypes: any[];
    dropoffPoints: any[];
  };
}

export interface ConversionFunnel {
  funnelType: string;
  steps: Array<{
    name: string;
    users: number;
    conversionRate: number;
  }>;
  overallConversion: number;
  dropoffAnalysis: Array<{
    step: string;
    dropoffRate: number;
    usersLost: number;
    commonReasons: string[];
    recommendations: string[];
  }>;
  totalUsers: number;
}

export interface CustomReport {
  reportId: string;
  name: string;
  type: string;
  data: any;
  generatedAt: string;
  generatedBy: Id<"adminUsers">;
  format: "json" | "csv" | "pdf";
  downloadUrl: string;
}

export interface ReportSchedule {
  scheduleId: string;
  reportConfig: any;
  schedule: {
    frequency: "daily" | "weekly" | "monthly";
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  recipients: string[];
  status: "active" | "paused" | "cancelled";
  nextRun: string;
  createdAt: string;
  createdBy: Id<"adminUsers">;
}

export class AdvancedAnalyticsService {
  /**
   * Get detailed user behavior analytics with segmentation
   */
  async getUserBehaviorAnalytics(
    dateRange: { start: string; end: string },
    segmentBy?: "role" | "fitnessLevel" | "age" | "location",
    adminId?: Id<"adminUsers">
  ): Promise<UserBehaviorAnalytics> {
    // Use the enhanced method for now
    return this.getUserBehaviorAnalyticsEnhanced(dateRange, segmentBy, adminId);
  }

  /**
   * Get conversion funnel analytics
   */
  async getConversionFunnelAnalytics(
    funnelType: "signup" | "purchase" | "engagement",
    dateRange: { start: string; end: string },
    adminId?: Id<"adminUsers">
  ): Promise<ConversionFunnel> {
    try {
      if (adminId) {
        const canViewAnalytics = await adminAuthService.validateAdminPermissions(adminId, "read", "conversion_analytics");
        if (!canViewAnalytics) {
          throw new ConvexError("Insufficient permissions to view conversion analytics");
        }
      }

      // Enhanced mock funnel data based on funnel type
      let funnelData: ConversionFunnel;

      switch (funnelType) {
        case 'signup':
          funnelData = {
            funnelType: 'signup',
            steps: [
              { name: 'Landing Page Visit', users: 5000, conversionRate: 100, averageTime: 45 },
              { name: 'Sign Up Form', users: 2500, conversionRate: 50, averageTime: 120 },
              { name: 'Email Verification', users: 2000, conversionRate: 80, averageTime: 300 },
              { name: 'Profile Setup', users: 1600, conversionRate: 80, averageTime: 180 },
              { name: 'First Workout', users: 1200, conversionRate: 75, averageTime: 900 }
            ],
            totalUsers: 5000,
            overallConversion: 24,
            dropoffAnalysis: [
              {
                step: 'Landing Page to Sign Up',
                dropoffRate: 50,
                usersLost: 2500,
                commonReasons: ['Complex form', 'No clear value proposition', 'Loading issues'],
                recommendations: ['Simplify sign-up form', 'Add social login', 'Improve page speed']
              },
              {
                step: 'Sign Up to Verification',
                dropoffRate: 20,
                usersLost: 500,
                commonReasons: ['Email not received', 'Verification link expired'],
                recommendations: ['Improve email delivery', 'Add resend option', 'SMS verification']
              }
            ]
          };
          break;

        case 'purchase':
          funnelData = {
            funnelType: 'purchase',
            steps: [
              { name: 'Browse Programs', users: 3000, conversionRate: 100, averageTime: 180 },
              { name: 'View Program Details', users: 1800, conversionRate: 60, averageTime: 240 },
              { name: 'Add to Cart', users: 900, conversionRate: 50, averageTime: 60 },
              { name: 'Checkout', users: 720, conversionRate: 80, averageTime: 300 },
              { name: 'Payment Complete', users: 540, conversionRate: 75, averageTime: 120 }
            ],
            totalUsers: 3000,
            overallConversion: 18,
            dropoffAnalysis: [
              {
                step: 'Browse to Details',
                dropoffRate: 40,
                usersLost: 1200,
                commonReasons: ['Price concerns', 'Unclear program benefits', 'Too many options'],
                recommendations: ['Clearer pricing', 'Better program descriptions', 'Guided selection']
              }
            ]
          };
          break;

        case 'engagement':
          funnelData = {
            funnelType: 'engagement',
            steps: [
              { name: 'App Open', users: 4000, conversionRate: 100, averageTime: 30 },
              { name: 'View Dashboard', users: 3200, conversionRate: 80, averageTime: 90 },
              { name: 'Start Workout', users: 2400, conversionRate: 75, averageTime: 60 },
              { name: 'Complete Exercise', users: 1920, conversionRate: 80, averageTime: 1200 },
              { name: 'Log Progress', users: 1440, conversionRate: 75, averageTime: 180 }
            ],
            totalUsers: 4000,
            overallConversion: 36,
            dropoffAnalysis: [
              {
                step: 'Dashboard to Workout',
                dropoffRate: 25,
                usersLost: 800,
                commonReasons: ['Overwhelming interface', 'No clear next step', 'Technical issues'],
                recommendations: ['Simplify dashboard', 'Add guided onboarding', 'Fix technical bugs']
              }
            ]
          };
          break;

        default:
          throw new ConvexError("Invalid funnel type");
      }

      if (adminId) {
        await adminAuthService.logAdminAction(adminId, {
          action: "conversion_funnel_viewed",
          resource: "analytics",
          details: { funnelType, dateRange },
          ipAddress: "system",
          userAgent: "system"
        });
      }

      return funnelData;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get conversion funnel analytics");
    }
  }

  /**
   * Generate custom report
   */
  async generateCustomReport(
    reportConfig: {
      name: string;
      type: "users" | "revenue" | "engagement" | "custom";
      dateRange: { start: string; end: string };
      metrics: string[];
      filters?: any;
      groupBy?: string;
      format: "json" | "csv" | "pdf";
    },
    adminId: Id<"adminUsers">
  ): Promise<CustomReport> {
    try {
      const canGenerateReports = await adminAuthService.validateAdminPermissions(adminId, "create", "reports");
      if (!canGenerateReports) {
        throw new ConvexError("Insufficient permissions to generate reports");
      }

      // Generate mock report data
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const report: CustomReport = {
        reportId,
        name: reportConfig.name,
        type: reportConfig.type,
        data: this.generateMockReportData(reportConfig),
        generatedAt: new Date().toISOString(),
        generatedBy: adminId,
        format: reportConfig.format,
        downloadUrl: `/api/reports/${reportId}/download`
      };

      await adminAuthService.logAdminAction(adminId, {
        action: "custom_report_generated",
        resource: "reports",
        resourceId: report.reportId,
        details: { 
          reportName: reportConfig.name,
          reportType: reportConfig.type,
          format: reportConfig.format,
          metricsCount: reportConfig.metrics.length
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return report;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to generate custom report");
    }
  }

  /**
   * Generate mock report data based on configuration
   */
  private generateMockReportData(reportConfig: any): any {
    const mockData: any = {};

    reportConfig.metrics.forEach((metric: string) => {
      switch (metric) {
        case 'total_users':
          mockData[metric] = 1250;
          break;
        case 'active_users':
          mockData[metric] = 890;
          break;
        case 'new_users':
          mockData[metric] = 156;
          break;
        case 'total_revenue':
          mockData[metric] = 45600;
          break;
        case 'recurring_revenue':
          mockData[metric] = 38200;
          break;
        case 'daily_active_users':
          mockData[metric] = 420;
          break;
        default:
          mockData[metric] = Math.floor(Math.random() * 1000);
      }
    });

    return {
      summary: mockData,
      period: reportConfig.dateRange,
      generatedAt: new Date().toISOString(),
      totalRecords: Object.keys(mockData).length
    };
  }

  /**
   * Schedule automated report
   */
  async scheduleReport(
    reportConfig: any,
    schedule: {
      frequency: "daily" | "weekly" | "monthly";
      time: string;
      dayOfWeek?: number;
      dayOfMonth?: number;
    },
    recipients: string[],
    adminId: Id<"adminUsers">
  ): Promise<ReportSchedule> {
    try {
      const canScheduleReports = await adminAuthService.validateAdminPermissions(adminId, "schedule", "reports");
      if (!canScheduleReports) {
        throw new ConvexError("Insufficient permissions to schedule reports");
      }

      const scheduledReport = await convex.mutation(api.functions.admin.analytics.scheduleReport, {
        reportConfig,
        schedule,
        recipients,
        adminId
      }) as ReportSchedule;

      await adminAuthService.logAdminAction(adminId, {
        action: "report_scheduled",
        resource: "reports",
        resourceId: scheduledReport.scheduleId,
        details: { 
          frequency: schedule.frequency,
          recipientCount: recipients.length
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return scheduledReport;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to schedule report");
    }
  }

  /**
   * Get report history
   */
  async getReportHistory(
    filters?: {
      adminId?: Id<"adminUsers">;
      reportType?: string;
    },
    adminId?: Id<"adminUsers">,
    limit: number = 50
  ): Promise<CustomReport[]> {
    try {
      if (adminId) {
        const canViewReports = await adminAuthService.validateAdminPermissions(adminId, "read", "reports");
        if (!canViewReports) {
          throw new ConvexError("Insufficient permissions to view report history");
        }
      }

      const reports = await convex.query(api.functions.admin.analytics.getReportHistory, {
        adminId: filters?.adminId,
        reportType: filters?.reportType,
        limit
      }) as CustomReport[];

      if (adminId) {
        await adminAuthService.logAdminAction(adminId, {
          action: "report_history_viewed",
          resource: "reports",
          details: { filters, resultCount: reports.length },
          ipAddress: "system",
          userAgent: "system"
        });
      }

      return reports;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get report history");
    }
  }

  /**
   * Analyze cohort retention
   */
  async analyzeCohortRetention(
    cohortPeriod: "weekly" | "monthly",
    startDate: string,
    endDate: string,
    adminId?: Id<"adminUsers">
  ): Promise<any> {
    try {
      if (adminId) {
        const canViewAnalytics = await adminAuthService.validateAdminPermissions(adminId, "read", "cohort_analytics");
        if (!canViewAnalytics) {
          throw new ConvexError("Insufficient permissions to view cohort analytics");
        }
      }

      // This would be implemented with more sophisticated cohort analysis
      // For now, return mock data structure
      const cohortData = {
        cohortPeriod,
        cohorts: [
          {
            cohort: "2024-01",
            size: 150,
            retention: {
              "week_1": 85,
              "week_2": 72,
              "week_4": 58,
              "week_8": 45
            }
          }
        ],
        averageRetention: {
          "week_1": 85,
          "week_2": 72,
          "week_4": 58,
          "week_8": 45
        }
      };

      if (adminId) {
        await adminAuthService.logAdminAction(adminId, {
          action: "cohort_analysis_performed",
          resource: "analytics",
          details: { cohortPeriod, startDate, endDate },
          ipAddress: "system",
          userAgent: "system"
        });
      }

      return cohortData;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to analyze cohort retention");
    }
  }

  /**
   * Get user segmentation analysis
   */
  async getUserSegmentation(
    segmentationType: "demographic" | "behavioral" | "subscription" | "engagement",
    criteria: Record<string, any>,
    adminId?: Id<"adminUsers">
  ): Promise<any> {
    try {
      if (adminId) {
        const canViewAnalytics = await adminAuthService.validateAdminPermissions(adminId, "read", "segmentation_analytics");
        if (!canViewAnalytics) {
          throw new ConvexError("Insufficient permissions to view segmentation analytics");
        }
      }

      // This would implement sophisticated user segmentation
      // For now, return mock segmentation data
      const segmentationData = {
        segmentationType,
        criteria,
        segments: [
          {
            name: "High Value Users",
            size: 250,
            characteristics: ["High engagement", "Multiple purchases", "Long session duration"],
            metrics: {
              averageRevenue: 150,
              retentionRate: 85,
              engagementScore: 9.2
            }
          },
          {
            name: "At Risk Users",
            size: 180,
            characteristics: ["Declining engagement", "No recent activity", "Low session completion"],
            metrics: {
              averageRevenue: 25,
              retentionRate: 35,
              engagementScore: 3.1
            }
          }
        ],
        totalUsers: 1000,
        generatedAt: new Date().toISOString()
      };

      if (adminId) {
        await adminAuthService.logAdminAction(adminId, {
          action: "user_segmentation_performed",
          resource: "analytics",
          details: { segmentationType, criteria },
          ipAddress: "system",
          userAgent: "system"
        });
      }

      return segmentationData;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get user segmentation");
    }
  }

  /**
   * Update user behavior analytics with enhanced mock data
   */
  async getUserBehaviorAnalyticsEnhanced(
    dateRange: { start: string; end: string },
    segmentBy?: "role" | "fitnessLevel" | "age" | "location",
    adminId?: Id<"adminUsers">
  ): Promise<UserBehaviorAnalytics> {
    try {
      if (adminId) {
        const canViewAnalytics = await adminAuthService.validateAdminPermissions(adminId, "read", "user_analytics");
        if (!canViewAnalytics) {
          throw new ConvexError("Insufficient permissions to view user behavior analytics");
        }
      }

      // Enhanced mock data for user behavior analytics
      const analytics: UserBehaviorAnalytics = {
        totalUsers: 1250,
        totalSessions: 8500,
        averageSessionsPerUser: 6.8,
        segments: {
          "Premium Users": {
            userCount: 450,
            sessions: 3200,
            avgSessionDuration: 1800
          },
          "Free Users": {
            userCount: 800,
            sessions: 5300,
            avgSessionDuration: 900
          }
        },
        cohorts: {
          "2024-01": {
            size: 150,
            retention: {
              week_1: 85,
              week_2: 72,
              week_4: 58,
              week_8: 45,
              week_12: 38,
              week_24: 28
            }
          },
          "2024-02": {
            size: 180,
            retention: {
              week_1: 88,
              week_2: 75,
              week_4: 62,
              week_8: 48,
              week_12: 40,
              week_24: 30
            }
          }
        },
        userJourneys: [
          {
            path: ["signup", "onboarding", "first_workout", "subscription"],
            users: 120,
            conversionRate: 15.5,
            averageTime: 7200
          }
        ],
        behaviorPatterns: {
          mostActiveHours: [
            { hour: 6, sessions: 850 },
            { hour: 18, sessions: 1200 },
            { hour: 19, sessions: 980 },
            { hour: 7, sessions: 720 }
          ],
          commonWorkoutTypes: [
            { type: "Strength Training", count: 650 },
            { type: "Cardio", count: 480 },
            { type: "Yoga", count: 320 },
            { type: "HIIT", count: 290 }
          ],
          dropoffPoints: [
            { point: "Exercise Selection", rate: 25 },
            { point: "Workout Completion", rate: 18 },
            { point: "Progress Tracking", rate: 12 }
          ]
        }
      };

      if (adminId) {
        await adminAuthService.logAdminAction(adminId, {
          action: "user_behavior_analytics_viewed",
          resource: "analytics",
          details: { dateRange, segmentBy },
          ipAddress: "system",
          userAgent: "system"
        });
      }

      return analytics;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get user behavior analytics");
    }
  }
}

// Export singleton instance
export const advancedAnalyticsService = new AdvancedAnalyticsService();