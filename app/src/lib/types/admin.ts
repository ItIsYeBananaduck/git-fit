// Admin Dashboard & Platform Management Types

import type { Id } from "../../../../convex/_generated/dataModel";

// ============================================================================
// Admin User and Authentication Types
// ============================================================================

export type AdminRole = 
  | "super_admin"
  | "platform_admin" 
  | "user_support"
  | "content_moderator"
  | "financial_admin"
  | "analytics_viewer";

export interface AdminUser {
  _id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lockedUntil: string | null;
  passwordHash: string;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  ipWhitelist: string[];
  sessionTimeout: number;
  failedLoginAttempts: number;
}

export interface AdminCredentials {
  email: string;
  password: string;
  mfaToken?: string;
}

export interface AdminSession {
  _id: string;
  adminId: string;
  sessionToken: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  isActive: boolean;
}

export interface Permission {
  name: string;
  resource: string;
  action: string;
  description: string;
  isSystemPermission: boolean;
}

// Renamed to avoid conflict with the AdminRole union above
export interface AdminRoleDef {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
}

// ============================================================================
// User Management Types
// ============================================================================

export interface UserSearchCriteria {
  query?: string;
  role?: "client" | "trainer" | "admin";
  subscriptionStatus?: "active" | "inactive" | "cancelled";
  activityLevel?: "high" | "medium" | "low" | "inactive";
  dateRange?: {
    start: string;
    end: string;
  };
  limit?: number;
  offset?: number;
}

export interface UserSearchResult {
  _id: Id<"users">;
  email: string;
  name: string;
  role: "client" | "trainer" | "admin";
  createdAt: string;
  lastActivity?: string;
  subscriptionStatus?: string;
  riskScore?: number;
}

export interface DetailedUserProfile {
  basicInfo: UserBasicInfo;
  subscriptionInfo: SubscriptionInfo;
  activityMetrics: UserActivityMetrics;
  supportHistory: SupportTicket[];
  moderationHistory: ModerationAction[];
  financialSummary: UserFinancialSummary;
  deviceConnections: DeviceConnection[];
  riskScore: number;
}

export interface UserBasicInfo {
  _id: Id<"users">;
  email: string;
  name: string;
  role: "client" | "trainer" | "admin";
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface SubscriptionInfo {
  status: "active" | "inactive" | "cancelled" | "trial";
  tier?: string;
  startDate?: string;
  endDate?: string;
  autoRenew?: boolean;
  paymentMethod?: string;
}

export interface UserActivityMetrics {
  lastLogin?: string;
  sessionCount: number;
  averageSessionDuration: number;
  featureUsage: Record<string, number>;
  engagementScore: number;
  retentionCohort: string;
}

export interface SupportTicket {
  id: string;
  userId: Id<"users">;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: Id<"adminUsers">;
  createdAt: string;
  resolvedAt?: string;
  messages: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  senderId: Id<"users"> | Id<"adminUsers">;
  senderType: "user" | "admin";
  content: string;
  timestamp: string;
  attachments?: string[];
}

export interface ModerationAction {
  id: string;
  action: "warning" | "suspension" | "termination" | "content_removal";
  reason: string;
  duration?: number;
  performedBy: Id<"adminUsers">;
  timestamp: string;
  details?: string;
}

export interface UserFinancialSummary {
  totalSpent: number;
  totalRefunds: number;
  averageOrderValue: number;
  paymentMethods: string[];
  lastPayment?: string;
  outstandingBalance: number;
}

export interface DeviceConnection {
  deviceType: string;
  deviceId: string;
  connectedAt: string;
  lastSync?: string;
  isActive: boolean;
}

export interface ImpersonationSession {
  sessionId: string;
  adminId: Id<"adminUsers">;
  userId: Id<"users">;
  startTime: string;
  endTime?: string;
  reason: string;
}

export interface BulkUserAction {
  action: "suspend" | "activate" | "delete" | "send_message";
  reason?: string;
  duration?: number;
  message?: string;
}

export interface BulkActionResult {
  successful: number;
  failed: number;
  errors: Array<{
    userId: Id<"users">;
    error: string;
  }>;
}

// ============================================================================
// Content Moderation Types
// ============================================================================

export type ModerationItemType = 
  | "custom_exercise"
  | "trainer_message" 
  | "user_report"
  | "program_content"
  | "user_profile";

export interface ModerationItem {
  _id: Id<"moderationQueue">;
  id: string; // Add id property for compatibility
  itemType: ModerationItemType;
  itemId: string;
  reportedBy?: Id<"users">;
  reportReason?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "under_review" | "approved" | "rejected" | "escalated";
  assignedTo?: Id<"adminUsers">;
  content: string;
  flags: string[];
  reviewNotes?: string;
  decision?: string;
  decisionReason?: string;
  createdAt: string;
  assignedAt?: string;
  reviewedAt?: string;
  escalatedAt?: string;
  autoFlagged: boolean;
  confidenceScore?: number;
}

export interface ModerationDecision {
  decision: "approve" | "reject" | "modify" | "escalate";
  reason: string;
  modifications?: string;
  followUpActions?: string[];
  notifyUser: boolean;
}

export interface ContentPolicy {
  type: string;
  rules: PolicyRule[];
  autoEnforcement: boolean;
  severity: "warning" | "content_removal" | "account_suspension";
}

export interface PolicyRule {
  name: string;
  description: string;
  pattern?: string;
  keywords?: string[];
  threshold?: number;
  action: "flag" | "auto_reject" | "escalate";
}

export interface Investigation {
  findings: string;
  evidence: string[];
  recommendation: "dismiss" | "warn" | "suspend" | "terminate";
  followUpRequired: boolean;
}

export interface ContentAnalytics {
  totalItems: number;
  pendingReview: number;
  approvedToday: number;
  rejectedToday: number;
  averageReviewTime: number;
  flaggedByAI: number;
  escalatedItems: number;
}

// ============================================================================
// Analytics and Business Intelligence Types
// ============================================================================

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

export interface GrowthAnalytics {
  period: AnalyticsPeriod;
  userGrowth: DataPoint[];
  acquisitionChannels: Record<string, number>;
  cohortAnalysis: CohortData[];
  churnAnalysis: ChurnData;
}

export interface RevenueAnalytics {
  period: AnalyticsPeriod;
  totalRevenue: number;
  revenueBySource: Record<string, number>;
  revenueGrowth: DataPoint[];
  averageRevenuePerUser: DataPoint[];
  subscriptionMetrics: SubscriptionMetrics;
}

export interface EngagementMetrics {
  period: AnalyticsPeriod;
  dailyActiveUsers: DataPoint[];
  sessionMetrics: SessionMetrics;
  featureUsage: Record<string, number>;
  userJourneys: UserJourney[];
}

export interface ConversionFunnel {
  name: string;
  steps: FunnelStep[];
  totalUsers: number;
  conversionRate: number;
  dropoffAnalysis: DropoffAnalysis[];
}

export interface FunnelStep {
  name: string;
  users: number;
  conversionRate: number;
  averageTime: number;
}

export interface DropoffAnalysis {
  step: string;
  dropoffRate: number;
  commonReasons: string[];
  recommendations: string[];
}

export type AnalyticsPeriod = "1d" | "7d" | "30d" | "90d" | "1y" | "custom";

export interface DataPoint {
  date: string;
  value: number;
}

export interface CohortData {
  cohort: string;
  size: number;
  retention: Record<string, number>;
}

export interface ChurnData {
  rate: number;
  reasons: Record<string, number>;
  predictions: DataPoint[];
}

export interface SubscriptionMetrics {
  newSubscriptions: number;
  cancellations: number;
  upgrades: number;
  downgrades: number;
  churnRate: number;
}

export interface SessionMetrics {
  averageDuration: number;
  bounceRate: number;
  pagesPerSession: number;
  returnVisitorRate: number;
}

export interface UserJourney {
  path: string[];
  users: number;
  conversionRate: number;
  averageTime: number;
}

export interface UserSegmentation {
  type: "demographic" | "behavioral" | "subscription" | "engagement";
  criteria: Record<string, string | number | boolean>;
}

// ============================================================================
// System Monitoring Types
// ============================================================================

export interface SystemHealthStatus {
  overall: "healthy" | "degraded" | "critical";
  services: ServiceHealth[];
  alerts: ActiveAlert[];
  lastUpdated: string;
}

export interface ServiceHealth {
  name: string;
  status: "up" | "down" | "degraded";
  responseTime: number;
  uptime: number;
  lastCheck: string;
  dependencies: string[];
}

export interface ActiveAlert {
  id: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  service: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface PerformanceMetrics {
  apiResponseTimes: Record<string, number>;
  databasePerformance: DatabaseMetrics;
  cacheHitRates: Record<string, number>;
  errorRates: Record<string, number>;
  resourceUtilization: ResourceUtilization;
}

export interface DatabaseMetrics {
  connectionCount: number;
  queryTime: number;
  slowQueries: number;
  lockWaits: number;
}

export interface ResourceUtilization {
  cpu: number;
  memory: number;
  storage: number;
  bandwidth: number;
  databaseConnections: number;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  level: "error" | "warning" | "info";
  message: string;
  service: string;
  stackTrace?: string;
  userId?: Id<"users">;
  requestId?: string;
}

export type ErrorSeverity = "low" | "medium" | "high" | "critical";

export interface AlertConfiguration {
  name: string;
  condition: string;
  threshold: number;
  severity: ErrorSeverity;
  recipients: string[];
  cooldown: number;
}

export interface Alert {
  id: string;
  name: string;
  triggered: boolean;
  lastTriggered?: string;
  count: number;
}

export interface IncidentResponse {
  status: "investigating" | "identified" | "monitoring" | "resolved";
  updates: string[];
  assignedTo: Id<"adminUsers">;
  estimatedResolution?: string;
}

export interface UptimeMetrics {
  service: string;
  uptime: number;
  downtime: number;
  incidents: number;
  slaCompliance: number;
}

export interface OptimizationResult {
  target: string;
  recommendations: string[];
  estimatedImprovement: number;
  implementationEffort: "low" | "medium" | "high";
}

// ============================================================================
// Financial Management Types
// ============================================================================

export interface RevenueOverview {
  totalRevenue: number;
  subscriptionRevenue: number;
  transactionRevenue: number;
  platformCommissions: number;
  trainerEarnings: number;
  refunds: number;
  chargebacks: number;
  netRevenue: number;
  revenueByPeriod: RevenueDataPoint[];
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  subscriptions: number;
  transactions: number;
}

export interface TrainerPayout {
  _id: Id<"trainerPayouts">;
  trainerId: Id<"users">;
  amount: number;
  currency: string;
  payoutMethod: "stripe_transfer" | "bank_transfer" | "paypal";
  stripePayoutId?: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  scheduledDate: string;
  paidDate?: string;
  failureReason?: string;
  transactionIds: Id<"revenueTransactions">[];
  periodStart: string;
  periodEnd: string;
}

export type PayoutStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface BatchPayoutResult {
  successful: number;
  failed: number;
  totalAmount: number;
  errors: Array<{
    payoutId: Id<"trainerPayouts">;
    error: string;
  }>;
}

export interface DisputeResolution {
  decision: "approve_refund" | "deny_refund" | "partial_refund" | "escalate";
  amount?: number;
  reason: string;
  evidence?: string[];
}

export type FinancialReportType = "revenue" | "payouts" | "taxes" | "reconciliation" | "forecasting";

export interface FinancialReport {
  reportType: FinancialReportType;
  period: DateRange;
  summary: FinancialSummary;
  details: FinancialDetail[];
  charts: ChartData[];
  generatedAt: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  averageTransactionValue: number;
}

export interface FinancialDetail {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface ChartData {
  type: "line" | "bar" | "pie";
  title: string;
  data: string[];
  labels: string[];
}

export interface TransactionFilters {
  dateRange?: DateRange;
  type?: "program_purchase" | "coaching_service" | "refund";
  status?: "pending" | "completed" | "failed";
  trainerId?: Id<"users">;
  minAmount?: number;
  maxAmount?: number;
}

export interface TransactionLogEntry {
  _id: Id<"revenueTransactions">;
  type: "program_purchase" | "coaching_service" | "refund";
  trainerId: Id<"users">;
  clientId: Id<"users">;
  grossAmount: number;
  platformFee: number;
  trainerEarnings: number;
  transactionDate: string;
  payoutStatus: PayoutStatus;
}

export interface ReconciliationResult {
  period: DateRange;
  totalTransactions: number;
  reconciledTransactions: number;
  discrepancies: Discrepancy[];
  summary: ReconciliationSummary;
}

export interface Discrepancy {
  transactionId: Id<"revenueTransactions">;
  type: "missing_payout" | "amount_mismatch" | "duplicate_transaction";
  description: string;
  expectedAmount: number;
  actualAmount: number;
}

export interface ReconciliationSummary {
  totalRevenue: number;
  totalPayouts: number;
  platformFees: number;
  processingFees: number;
  netPlatformEarnings: number;
}

export interface RevenueForecast {
  period: number; // months
  projectedRevenue: DataPoint[];
  confidence: number;
  assumptions: string[];
  scenarios: ForecastScenario[];
}

export interface ForecastScenario {
  name: string;
  description: string;
  projectedRevenue: number;
  probability: number;
}

export type FinancialPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface DateRange {
  start: string;
  end: string;
}

// ============================================================================
// Trainer Management Types
// ============================================================================

export interface TrainerApplication {
  _id: Id<"users">;
  email: string;
  name: string;
  certifications: string[];
  specialties: string[];
  bio: string;
  hourlyRate: number;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: Id<"adminUsers">;
  verificationDocuments: string[];
}

export type ApplicationStatus = "pending" | "under_review" | "approved" | "rejected" | "requires_info";

export interface CredentialVerification {
  certificationType: string;
  issuingOrganization: string;
  verificationStatus: "verified" | "pending" | "rejected";
  expirationDate?: string;
  verificationNotes?: string;
}

export interface TrainerPerformanceMetrics {
  trainerId: Id<"users">;
  clientCount: number;
  averageRating: number;
  totalEarnings: number;
  programsSold: number;
  clientRetentionRate: number;
  responseTime: number;
  completionRate: number;
  clientSatisfactionScore: number;
}

export interface TrainerAnalytics {
  period: AnalyticsPeriod;
  topPerformers: TrainerPerformanceMetrics[];
  averageMetrics: TrainerPerformanceMetrics;
  growthTrends: DataPoint[];
  specialtyPerformance: Record<string, number>;
}

export interface PromotionCriteria {
  minRating: number;
  minClients: number;
  minEarnings: number;
  minRetentionRate: number;
}

export interface PromotionResult {
  eligibleTrainers: Id<"users">[];
  promoted: number;
  criteria: PromotionCriteria;
}

// ============================================================================
// Audit and Logging Types
// ============================================================================

export interface AuditLogEntry {
  _id: Id<"auditLogs">;
  adminId: Id<"adminUsers">;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "authentication" | "user_management" | "content_moderation" | "financial" | "system_config" | "data_access";
  outcome: "success" | "failure" | "partial";
  errorMessage?: string;
}

export interface AdminAction {
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
}

export interface TimeFrame {
  start: string;
  end: string;
  period?: "hour" | "day" | "week" | "month";
}

export interface UserSubscriptionInfo {
  status: "active" | "inactive" | "cancelled" | "trial";
  tier?: string;
  startDate?: string;
  endDate?: string;
  autoRenew?: boolean;
  paymentMethod?: string;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

export interface FilterOptions {
  [key: string]: unknown;
}

export interface SearchOptions extends PaginationOptions {
  sort?: SortOptions;
  filters?: FilterOptions;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Ensure Id type is exported correctly
// Use Convex-generated `Id` type from app/convex/_generated/dataModel instead of local re-definition.
export type { Id } from "../../../../convex/_generated/dataModel";