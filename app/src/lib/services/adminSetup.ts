// Admin Setup Service - Initialize admin system

import { ConvexError } from "convex/values";
import { api } from "../../../convex/_generated/api";
import { convex } from "$lib/convex";
import * as bcrypt from "bcryptjs";
import type { AdminUser } from "../types/admin";

export class AdminSetupService {
  /**
   * Initialize the admin system with default roles, permissions, and first super admin
   */
  async initializeAdminSystem(initialAdmin: {
    email: string;
    name: string;
    password: string;
  }): Promise<{ success: boolean; message: string; adminUser?: AdminUser }> {
    try {
      // Check if admin system is already initialized
      const existingAdmins = await convex.query(api.functions.admin.auth.getAllAdminUsers, { limit: 1 }) as { page: AdminUser[] };
      if (existingAdmins.page.length > 0) {
        return {
          success: false,
          message: "Admin system is already initialized"
        };
      }

      // Initialize default roles and permissions
      const rolesResult = await convex.mutation(api.functions.admin.roles.initializeDefaultRolesAndPermissions, {});
      console.log("Roles initialization result:", rolesResult);

      // Create the first super admin user
      const passwordHash = await bcrypt.hash(initialAdmin.password, 12);
      
      // For the first admin, we need to create without validation since no admin exists yet
      const firstAdminId = await convex.mutation(api.functions.admin.auth.createFirstSuperAdmin, {
        email: initialAdmin.email,
        name: initialAdmin.name,
        passwordHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const adminUser = await convex.query(api.functions.admin.auth.getAdminById, { adminId: firstAdminId }) as AdminUser | null;

      return {
        success: true,
        message: "Admin system initialized successfully",
        adminUser: adminUser || undefined
      };

    } catch (error) {
      console.error("Admin system initialization error:", error);
      return {
        success: false,
        message: error instanceof ConvexError ? error.message : "Failed to initialize admin system"
      };
    }
  }

  /**
   * Check if admin system is initialized
   */
  async isAdminSystemInitialized(): Promise<boolean> {
    try {
      const existingAdmins = await convex.query(api.functions.admin.auth.getAllAdminUsers, { limit: 1 }) as { page: AdminUser[] };
      return existingAdmins.page.length > 0;
    } catch (error) {
      console.error("Error checking admin system initialization:", error);
      return false;
    }
  }

  /**
   * Get system status and statistics
   */
  async getSystemStatus(): Promise<{
    initialized: boolean;
    adminCount: number;
    roleCount: number;
    permissionCount: number;
    recentActivity: number;
  }> {
    try {
      const [admins, roles, permissions] = await Promise.all([
        (await convex.query(api.functions.admin.auth.getAllAdminUsers, { limit: 100 })) as { page: AdminUser[] },
        (await convex.query(api.functions.admin.roles.getAllAdminRoles, {})) as unknown[],
        (await convex.query(api.functions.admin.roles.getAllAdminPermissions, {})) as unknown[]
      ]);

      // Get recent activity (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentActivity = (await convex.query(api.functions.admin.audit.getAuditLogByTimeRange, {
        startTime: yesterday,
        endTime: new Date().toISOString(),
        limit: 1000
      })) as unknown[];

      return {
        initialized: admins.page.length > 0,
        adminCount: admins.page.length,
        roleCount: roles.length,
        permissionCount: permissions.length,
        recentActivity: recentActivity.length
      };

    } catch (error) {
      console.error("Error getting system status:", error);
      return {
        initialized: false,
        adminCount: 0,
        roleCount: 0,
        permissionCount: 0,
        recentActivity: 0
      };
    }
  }

  /**
   * Create additional admin users after system initialization
   */
  async createAdminUser(
    adminData: {
      email: string;
      name: string;
      role: "super_admin" | "platform_admin" | "user_support" | "content_moderator" | "financial_admin" | "analytics_viewer";
      password: string;
      permissions?: string[];
      mfaEnabled?: boolean;
      ipWhitelist?: string[];
    },
    creatorId: string
  ): Promise<{ success: boolean; message: string; adminUser?: AdminUser }> {
    try {
      // Validate that system is initialized
      const isInitialized = await this.isAdminSystemInitialized();
      if (!isInitialized) {
        return {
          success: false,
          message: "Admin system must be initialized first"
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(adminData.password, 12);

      // Get default permissions for role if not specified
      let permissions = adminData.permissions || [];
      if (permissions.length === 0) {
        const roleData = await convex.query(api.functions.admin.roles.getRolePermissions, { role: adminData.role }) as { permissions: string[] };
        permissions = roleData?.permissions || [];
      }

      // Create admin user
      const newAdmin = await convex.mutation(api.functions.admin.auth.createAdminUser, {
        email: adminData.email,
        name: adminData.name,
        role: adminData.role,
        permissions,
        passwordHash,
        mfaSecret: undefined,
        mfaEnabled: adminData.mfaEnabled || false,
        isActive: true,
        createdBy: creatorId as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        failedLoginAttempts: 0,
        ipWhitelist: adminData.ipWhitelist,
        sessionTimeout: undefined,
      }) as AdminUser;

      return {
        success: true,
        message: "Admin user created successfully",
        adminUser: newAdmin
      };

    } catch (error) {
      console.error("Admin user creation error:", error);
      return {
        success: false,
        message: error instanceof ConvexError ? error.message : "Failed to create admin user"
      };
    }
  }

  /**
   * Reset admin system (for development/testing only)
   */
  async resetAdminSystem(): Promise<{ success: boolean; message: string }> {
    try {
      // This should only be available in development
      if (process.env.NODE_ENV === "production") {
        return {
          success: false,
          message: "System reset is not allowed in production"
        };
      }

      // Delete all admin data
      await convex.mutation(api.functions.admin.setup.resetAdminSystem, {});

      return {
        success: true,
        message: "Admin system reset successfully"
      };

    } catch (error) {
      console.error("Admin system reset error:", error);
      return {
        success: false,
        message: "Failed to reset admin system"
      };
    }
  }
}

// Export singleton instance
export const adminSetupService = new AdminSetupService();