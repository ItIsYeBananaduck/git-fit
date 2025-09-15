// Admin Authentication Service with MFA and RBAC

import { ConvexError } from "convex/values";
import type { 
  AdminUser, 
  AdminCredentials, 
  AdminSession, 
  AdminAction,
  AuditLogEntry,
  Permission,
  AdminRole as AdminRoleType
} from "../types/admin";
import type { Id } from "../../../convex/_generated/dataModel";
import { api, convex } from "../convex";
import * as crypto from "crypto";
import * as speakeasy from "speakeasy";
import * as bcrypt from "bcryptjs";

export class AdminAuthService {
  private static readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Authenticate admin user with email/password and optional MFA
   */
  async authenticateAdmin(credentials: AdminCredentials, ipAddress: string, userAgent: string): Promise<AdminSession> {
    try {
      // Find admin user by email
      const adminUser: AdminUser = await api.functions.admin.auth.getAdminByEmail({ 
        email: credentials.email 
      });

      if (!adminUser) {
        await this.logFailedLogin(credentials.email, "user_not_found", ipAddress);
        throw new ConvexError("Invalid credentials");
      }

      // Check if account is locked
      if (adminUser.lockedUntil && new Date(adminUser.lockedUntil) > new Date()) {
        await this.logFailedLogin(credentials.email, "account_locked", ipAddress);
        throw new ConvexError("Account is temporarily locked");
      }

      // Check if account is active
      if (!adminUser.isActive) {
        await this.logFailedLogin(credentials.email, "account_inactive", ipAddress);
        throw new ConvexError("Account is inactive");
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(credentials.password, adminUser.passwordHash);
      if (!isValidPassword) {
        await this.handleFailedLogin({ __tableName: "adminUsers" } as Id<"adminUsers">, ipAddress);
        throw new ConvexError("Invalid credentials");
      }

      // Verify MFA if enabled
      if (adminUser.mfaEnabled) {
        if (!credentials.mfaToken) {
          throw new ConvexError("MFA token required");
        }

        const isValidMFA = speakeasy.totp.verify({
          secret: adminUser.mfaSecret!,
          encoding: 'base32',
          token: credentials.mfaToken,
          window: 2 // Allow 2 time steps of variance
        });

        if (!isValidMFA) {
          await this.handleFailedLogin({ __tableName: "adminUsers" } as Id<"adminUsers">, ipAddress);
          throw new ConvexError("Invalid MFA token");
        }
      }

      // Check IP whitelist if configured
      if (adminUser.ipWhitelist && adminUser.ipWhitelist.length > 0) {
        if (!adminUser.ipWhitelist.includes(ipAddress)) {
          await this.logFailedLogin(credentials.email, "ip_not_whitelisted", ipAddress);
          throw new ConvexError("Access denied from this IP address");
        }
      }

      // Create session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + (adminUser.sessionTimeout || AdminAuthService.SESSION_DURATION));

      const session: AdminSession = await api.functions.admin.auth.createAdminSession({
        adminId: adminUser._id,
        sessionToken,
        ipAddress,
        userAgent,
        expiresAt: expiresAt.toISOString(),
        isActive: true
      });

      // Reset failed login attempts and update last login
      await api.functions.admin.auth.updateAdminLoginSuccess();

      // Log successful authentication
      await this.logAdminAction(adminUser._id, {
        action: "admin_login",
        resource: "authentication",
        resourceId: adminUser._id,
        details: { method: adminUser.mfaEnabled ? "password_mfa" : "password" },
        ipAddress,
        userAgent
      });

      return session;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Authentication failed");
    }
  }

  /**
   * Validate admin session and permissions
   */
  async validateAdminSession(sessionToken: string, ipAddress: string): Promise<AdminUser | null> {
    try {
      const session = await api.functions.admin.auth.getAdminSession({
        sessionToken
      });

      if (!session || !session.isActive) {
        return null;
      }

      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        await api.functions.admin.auth.revokeAdminSession();
        return null;
      }

      // Verify IP address matches (optional security check)
      if (session.ipAddress !== ipAddress) {
        await api.functions.admin.auth.revokeAdminSession();
        return null;
      }

      // Get admin user
      const adminUser: AdminUser = await api.functions.admin.auth.getAdminById({ 
        adminId: session.adminId 
      });

      if (!adminUser || !adminUser.isActive) {
        await api.functions.admin.auth.revokeAdminSession();
        return null;
      }

      // Update session activity
      await api.functions.admin.auth.updateSessionActivity();

      return adminUser;

    } catch (error) {
      console.error("Session validation error:", error);
      return null;
    }
  }

  /**
   * Validate admin permissions for specific action and resource
   */
  async validateAdminPermissions(
    adminId: Id<"adminUsers">, 
    action: string, 
    resource: string
  ): Promise<boolean> {
    try {
      const adminUser = await convex.query(api.functions.admin.auth.getAdminById, { adminId }) as AdminUser;
      
      if (!adminUser || !adminUser.isActive) {
        return false;
      }

      // Super admin has all permissions
      if (adminUser.role === "super_admin") {
        return true;
      }

      // Check specific permission
      const permissionName = `${resource}.${action}`;
      
      // Check direct permissions
      if (adminUser.permissions.includes(permissionName)) {
        return true;
      }

      // Check wildcard permissions
      const wildcardPermission = `${resource}.*`;
      if (adminUser.permissions.includes(wildcardPermission)) {
        return true;
      }

      // Check role-based permissions
      const rolePermissions = await this.getRolePermissions(adminUser.role);
      return rolePermissions.includes(permissionName) || rolePermissions.includes(wildcardPermission);

    } catch (error) {
      console.error("Permission validation error:", error);
      return false;
    }
  }

  /**
   * Create new admin user
   */
  async createAdminUser(
    adminData: Omit<AdminUser, "_id" | "createdAt" | "updatedAt" | "passwordHash">, 
    password: string,
    creatorId: Id<"adminUsers">
  ): Promise<AdminUser> {
    try {
      // Validate creator permissions
      const canCreateAdmin = await this.validateAdminPermissions(creatorId, "create", "admin_users");
      if (!canCreateAdmin) {
        throw new ConvexError("Insufficient permissions to create admin user");
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Generate MFA secret if MFA is enabled
      let mfaSecret: string | undefined;
      if (adminData.mfaEnabled) {
        mfaSecret = speakeasy.generateSecret({
          name: `TechnicallyFit Admin (${adminData.email})`,
          issuer: "TechnicallyFit"
        }).base32;
      }

      // Create admin user
      const newAdmin: AdminUser = await convex.mutation(api.functions.admin.auth.createAdminUser, {
        ...adminData,
        passwordHash,
        mfaSecret,
        createdBy: creatorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        failedLoginAttempts: 0
      }) as AdminUser;

      // Log admin creation
      await this.logAdminAction(creatorId, {
        action: "admin_user_created",
        resource: "admin_users",
        resourceId: newAdmin._id,
        details: { 
          email: adminData.email, 
          role: adminData.role,
          permissions: adminData.permissions 
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return newAdmin;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to create admin user");
    }
  }

  /**
   * Update admin permissions
   */
  async updateAdminPermissions(
    adminId: Id<"adminUsers">, 
    permissions: string[], 
    updatedBy: Id<"adminUsers">
  ): Promise<void> {
    try {
      // Validate updater permissions
      const canUpdatePermissions = await this.validateAdminPermissions(updatedBy, "update", "admin_users");
      if (!canUpdatePermissions) {
        throw new ConvexError("Insufficient permissions to update admin permissions");
      }

      // Get current admin data
      const currentAdmin = await convex.query(api.functions.admin.auth.getAdminById, { adminId }) as AdminUser;
      if (!currentAdmin) {
        throw new ConvexError("Admin user not found");
      }

      // Update permissions
      await convex.mutation(api.functions.admin.auth.updateAdminPermissions, {
        adminId,
        permissions,
        updatedAt: new Date().toISOString()
      });

      // Log permission update
      await this.logAdminAction(updatedBy, {
        action: "admin_permissions_updated",
        resource: "admin_users",
        resourceId: adminId,
        details: { 
          oldPermissions: currentAdmin.permissions,
          newPermissions: permissions 
        },
        ipAddress: "system",
        userAgent: "system"
      });

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to update admin permissions");
    }
  }

  /**
   * Revoke admin access
   */
  async revokeAdminAccess(
    adminId: Id<"adminUsers">, 
    reason: string, 
    revokedBy: Id<"adminUsers">
  ): Promise<void> {
    try {
      // Validate revoker permissions
      const canRevokeAccess = await this.validateAdminPermissions(revokedBy, "delete", "admin_users");
      if (!canRevokeAccess) {
        throw new ConvexError("Insufficient permissions to revoke admin access");
      }

      // Deactivate admin user
      await convex.mutation(api.functions.admin.auth.deactivateAdminUser, {
        adminId,
        updatedAt: new Date().toISOString()
      });

      // Revoke all active sessions
      await convex.mutation(api.functions.admin.auth.revokeAllAdminSessions, {
        adminId,
        reason: `Access revoked: ${reason}`
      });

      // Log access revocation
      await this.logAdminAction(revokedBy, {
        action: "admin_access_revoked",
        resource: "admin_users",
        resourceId: adminId,
        details: { reason },
        ipAddress: "system",
        userAgent: "system"
      });

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to revoke admin access");
    }
  }

  /**
   * Get admin audit log
   */
  async getAdminAuditLog(
    adminId: Id<"adminUsers">, 
    timeframe: { start: string; end: string },
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    try {
      return await convex.query(api.functions.admin.audit.getAdminAuditLog, {
        adminId,
        startTime: timeframe.start,
        endTime: timeframe.end,
        limit
      }) as AuditLogEntry[];
    } catch (error) {
      console.error("Failed to get audit log:", error);
      return [];
    }
  }

  /**
   * Log admin action for audit trail
   */
  async logAdminAction(adminId: Id<"adminUsers">, action: AdminAction): Promise<void> {
    try {
      await convex.mutation(api.functions.admin.audit.logAdminAction, {
        adminId,
        action: action.action,
        resource: action.resource,
        resourceId: action.resourceId,
        details: action.details,
        ipAddress: action.ipAddress,
        userAgent: action.userAgent,
        timestamp: new Date().toISOString(),
        severity: this.determineSeverity(action.action),
        category: this.determineCategory(action.resource),
        outcome: "success"
      });
    } catch (error) {
      console.error("Failed to log admin action:", error);
    }
  }

  /**
   * Setup MFA for admin user
   */
  async setupMFA(adminId: Id<"adminUsers">): Promise<{ secret: string; qrCode: string }> {
    try {
      const adminUser = await convex.query(api.functions.admin.auth.getAdminById, { adminId }) as AdminUser;
      if (!adminUser) {
        throw new ConvexError("Admin user not found");
      }

      const secret = speakeasy.generateSecret({
        name: `TechnicallyFit Admin (${adminUser.email})`,
        issuer: "TechnicallyFit"
      });

      // Store the secret (temporarily, until verified)
      await convex.mutation(api.functions.admin.auth.storeMFASecret, {
        adminId,
        mfaSecret: secret.base32
      });

      return {
        secret: secret.base32,
        qrCode: secret.otpauth_url!
      };

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to setup MFA");
    }
  }

  /**
   * Verify and enable MFA
   */
  async verifyAndEnableMFA(adminId: Id<"adminUsers">, token: string): Promise<void> {
    try {
      const adminUser = await convex.query(api.functions.admin.auth.getAdminById, { adminId }) as AdminUser;
      if (!adminUser || !adminUser.mfaSecret) {
        throw new ConvexError("MFA setup not found");
      }

      const isValid = speakeasy.totp.verify({
        secret: adminUser.mfaSecret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!isValid) {
        throw new ConvexError("Invalid MFA token");
      }

      // Enable MFA
      await convex.mutation(api.functions.admin.auth.enableMFA, {
        adminId,
        updatedAt: new Date().toISOString()
      });

      // Log MFA enablement
      await this.logAdminAction(adminId, {
        action: "mfa_enabled",
        resource: "authentication",
        resourceId: adminId,
        details: {},
        ipAddress: "system",
        userAgent: "system"
      });

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to verify MFA");
    }
  }

  /**
   * Logout admin user
   */
  async logoutAdmin(sessionToken: string, adminId: Id<"adminUsers">): Promise<void> {
    try {
      await convex.mutation(api.functions.admin.auth.revokeAdminSession, {
        sessionToken,
        reason: "user_logout"
      });

      // Log logout
      await this.logAdminAction(adminId, {
        action: "admin_logout",
        resource: "authentication",
        resourceId: adminId,
        details: {},
        ipAddress: "system",
        userAgent: "system"
      });

    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  // Private helper methods

  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async handleFailedLogin(adminId: Id<"adminUsers">, ipAddress: string): Promise<void> {
    try {
      const adminUser = await convex.query(api.functions.admin.auth.getAdminById, { adminId }) as AdminUser;
      if (!adminUser) return;

      const newFailedAttempts = adminUser.failedLoginAttempts + 1;
      let lockedUntil: string | undefined;

      if (newFailedAttempts >= AdminAuthService.MAX_FAILED_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + AdminAuthService.LOCKOUT_DURATION).toISOString();
      }

      await convex.mutation(api.functions.admin.auth.updateFailedLoginAttempts, {
        adminId,
        failedLoginAttempts: newFailedAttempts,
        lockedUntil
      });

      // Log failed login
      await this.logAdminAction(adminId, {
        action: "failed_login",
        resource: "authentication",
        resourceId: adminId,
        details: { 
          attempts: newFailedAttempts,
          locked: !!lockedUntil 
        },
        ipAddress,
        userAgent: "unknown"
      });

    } catch (error) {
      console.error("Failed to handle failed login:", error);
    }
  }

  private async logFailedLogin(email: string, reason: string, ipAddress: string): Promise<void> {
    try {
      // Log failed login attempt (without admin ID since user might not exist)
      await convex.mutation(api.functions.admin.audit.logFailedLogin, {
        email,
        reason,
        ipAddress,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to log failed login:", error);
    }
  }

  private async getRolePermissions(role: string): Promise<string[]> {
    try {
      const roleData = await convex.query(api.functions.admin.roles.getRolePermissions, { role }) as { permissions: string[] };
      return roleData?.permissions || [];
    } catch (error) {
      console.error("Failed to get role permissions:", error);
      return [];
    }
  }

  private determineSeverity(action: string): "low" | "medium" | "high" | "critical" {
    const criticalActions = ["admin_user_created", "admin_access_revoked", "system_config_changed"];
    const highActions = ["user_suspended", "content_rejected", "financial_transaction"];
    const mediumActions = ["user_impersonated", "content_approved", "data_exported"];

    if (criticalActions.includes(action)) return "critical";
    if (highActions.includes(action)) return "high";
    if (mediumActions.includes(action)) return "medium";
    return "low";
  }

  private determineCategory(resource: string): "authentication" | "user_management" | "content_moderation" | "financial" | "system_config" | "data_access" {
    const categoryMap: Record<string, "authentication" | "user_management" | "content_moderation" | "financial" | "system_config" | "data_access"> = {
      "authentication": "authentication",
      "users": "user_management",
      "admin_users": "user_management",
      "content": "content_moderation",
      "moderation": "content_moderation",
      "financial": "financial",
      "revenue": "financial",
      "payouts": "financial",
      "system": "system_config",
      "config": "system_config",
      "data": "data_access"
    };

    return categoryMap[resource] || "data_access";
  }
}

// Export singleton instance
export const adminAuthService = new AdminAuthService();