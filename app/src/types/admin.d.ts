// Minimal admin-related type declarations used across the app.
// These are intentionally permissive placeholder types to unblock development.

// Prefer Convex-generated Id type where available. This maps our local Id to Convex's generic Id.
export type Id<TableName extends string = string> = import('../../convex/_generated/dataModel').Id<TableName>;

export interface AdminUser {
  id: Id;
  email: string;
  name?: string;
  role?: 'admin' | 'moderator' | 'superadmin' | string;
  createdAt?: string;
  disabled?: boolean;
}

export interface AdminCredentials {
  email: string;
  password: string;
}

export type AdminAction = string;

export interface AuditLogEntry {
  id: Id;
  adminId: Id;
  action: AdminAction;
  targetId?: Id;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditSearchCriteria {
  adminId?: Id;
  action?: AdminAction;
  from?: string;
  to?: string;
}

export type BulkUserAction = 'disable' | 'enable' | 'delete' | 'export' | string;

export interface UserSearchCriteria {
  email?: string;
  name?: string;
  page?: number;
  pageSize?: number;
}

export interface SupportMessage {
  id: Id;
  from: Id | string;
  body: string;
  createdAt: string;
}

export interface SupportTicket {
  id: Id;
  subject: string;
  status: 'open' | 'closed' | 'pending' | string;
  messages: SupportMessage[];
  createdAt: string;
  createdBy: Id | string;
}

export interface PolicyRule {
  id: Id;
  name: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high' | string;
}

export interface ContentAnalytics {
  contentId: Id;
  views?: number;
  reports?: number;
  flags?: number;
}

export interface ModerationItem {
  id: Id;
  contentId?: Id;
  userId?: Id;
  type?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export type ModerationDecision = 'approve' | 'remove' | 'warn' | 'suspend' | string;

export interface ModerationResult {
  itemId: Id;
  decision: ModerationDecision;
  notes?: string;
}

export interface ContentPolicy {
  id: Id;
  name: string;
  rules: PolicyRule[];
}

export interface AuditStatistics {
  totalActions: number;
  byAction: Record<string, number>;
}

export interface SecurityAlert {
  id: Id;
  message: string;
  level?: 'info' | 'warning' | 'critical' | string;
  createdAt?: string;
}

// Generic helpers
export type Pagination = { page?: number; pageSize?: number };
