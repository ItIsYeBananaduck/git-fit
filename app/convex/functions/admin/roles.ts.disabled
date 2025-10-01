// Admin Roles and Permissions Convex Functions

import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { ConvexError } from "convex/values";

// Query to get role permissions
export const getRolePermissions = query({
  args: { role: v.string() },
  handler: async (ctx, args) => {
    const roleData = await ctx.db
      .query("adminRoles")
      .withIndex("by_name", (q) => q.eq("name", args.role))
      .first();
    
    return roleData;
  },
});

// Query to get all admin roles
export const getAllAdminRoles = query({
  args: {},
  handler: async (ctx, args) => {
    const roles = await ctx.db.query("adminRoles").collect();
    return roles;
  },
});

// Query to get all admin permissions
export const getAllAdminPermissions = query({
  args: {},
  handler: async (ctx, args) => {
    const permissions = await ctx.db.query("adminPermissions").collect();
    return permissions;
  },
});

// Query to get permissions by resource
export const getPermissionsByResource = query({
  args: { resource: v.string() },
  handler: async (ctx, args) => {
    const permissions = await ctx.db
      .query("adminPermissions")
      .withIndex("by_resource", (q) => q.eq("resource", args.resource))
      .collect();
    
    return permissions;
  },
});

// Mutation to create admin permission
export const createAdminPermission = mutation({
  args: {
    name: v.string(),
    resource: v.string(),
    action: v.string(),
    description: v.string(),
    isSystemPermission: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if permission already exists
    const existingPermission = await ctx.db
      .query("adminPermissions")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existingPermission) {
      throw new ConvexError("Permission with this name already exists");
    }

    const permissionId = await ctx.db.insert("adminPermissions", {
      name: args.name,
      resource: args.resource,
      action: args.action,
      description: args.description,
      isSystemPermission: args.isSystemPermission,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return await ctx.db.get(permissionId);
  },
});

// Mutation to create admin role
export const createAdminRole = mutation({
  args: {
    name: v.string(),
    displayName: v.string(),
    description: v.string(),
    permissions: v.array(v.string()),
    isSystemRole: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if role already exists
    const existingRole = await ctx.db
      .query("adminRoles")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existingRole) {
      throw new ConvexError("Role with this name already exists");
    }

    const roleId = await ctx.db.insert("adminRoles", {
      name: args.name,
      displayName: args.displayName,
      description: args.description,
      permissions: args.permissions,
      isSystemRole: args.isSystemRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return await ctx.db.get(roleId);
  },
});

// Mutation to update admin role permissions
export const updateAdminRolePermissions = mutation({
  args: {
    roleId: v.id("adminRoles"),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new ConvexError("Role not found");
    }

    if (role.isSystemRole) {
      throw new ConvexError("Cannot modify system role permissions");
    }

    await ctx.db.patch(args.roleId, {
      permissions: args.permissions,
      updatedAt: new Date().toISOString(),
    });

    return await ctx.db.get(args.roleId);
  },
});

// Mutation to initialize default admin roles and permissions
export const initializeDefaultRolesAndPermissions = mutation({
  args: {},
  handler: async (ctx, args) => {
    // Check if already initialized
    const existingRoles = await ctx.db.query("adminRoles").collect();
    if (existingRoles.length > 0) {
      return { message: "Roles and permissions already initialized" };
    }

    // Define default permissions
    const defaultPermissions = [
      // User management permissions
      { name: "users.read", resource: "users", action: "read", description: "View user profiles and data" },
      { name: "users.write", resource: "users", action: "write", description: "Edit user profiles and data" },
      { name: "users.delete", resource: "users", action: "delete", description: "Delete user accounts" },
      { name: "users.suspend", resource: "users", action: "suspend", description: "Suspend user accounts" },
      { name: "users.impersonate", resource: "users", action: "impersonate", description: "Impersonate users for support" },
      
      // Content moderation permissions
      { name: "content.read", resource: "content", action: "read", description: "View content moderation queue" },
      { name: "content.moderate", resource: "content", action: "moderate", description: "Approve/reject content" },
      { name: "content.delete", resource: "content", action: "delete", description: "Delete inappropriate content" },
      
      // Analytics permissions
      { name: "analytics.read", resource: "analytics", action: "read", description: "View analytics and reports" },
      { name: "analytics.export", resource: "analytics", action: "export", description: "Export analytics data" },
      
      // Financial permissions
      { name: "financial.read", resource: "financial", action: "read", description: "View financial data and reports" },
      { name: "financial.write", resource: "financial", action: "write", description: "Process payments and payouts" },
      { name: "financial.reconcile", resource: "financial", action: "reconcile", description: "Reconcile financial transactions" },
      
      // System permissions
      { name: "system.read", resource: "system", action: "read", description: "View system health and monitoring" },
      { name: "system.write", resource: "system", action: "write", description: "Modify system configuration" },
      { name: "system.restart", resource: "system", action: "restart", description: "Restart system services" },
      
      // Admin management permissions
      { name: "admin_users.read", resource: "admin_users", action: "read", description: "View admin users" },
      { name: "admin_users.create", resource: "admin_users", action: "create", description: "Create admin users" },
      { name: "admin_users.update", resource: "admin_users", action: "update", description: "Update admin users" },
      { name: "admin_users.delete", resource: "admin_users", action: "delete", description: "Delete admin users" },
      
      // Audit permissions
      { name: "audit.read", resource: "audit", action: "read", description: "View audit logs" },
      { name: "audit.export", resource: "audit", action: "export", description: "Export audit logs" },
    ];

    // Create default permissions
    for (const permission of defaultPermissions) {
      await ctx.db.insert("adminPermissions", {
        ...permission,
        isSystemPermission: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Define default roles
    const defaultRoles = [
      {
        name: "super_admin",
        displayName: "Super Administrator",
        description: "Full access to all platform features and settings",
        permissions: defaultPermissions.map(p => p.name), // All permissions
      },
      {
        name: "platform_admin",
        displayName: "Platform Administrator",
        description: "Administrative access excluding financial operations",
        permissions: defaultPermissions
          .filter(p => !p.resource.includes("financial") && !p.name.includes("admin_users.delete"))
          .map(p => p.name),
      },
      {
        name: "user_support",
        displayName: "User Support",
        description: "User management and support capabilities",
        permissions: [
          "users.read", "users.write", "users.suspend", "users.impersonate",
          "content.read", "analytics.read", "audit.read"
        ],
      },
      {
        name: "content_moderator",
        displayName: "Content Moderator",
        description: "Content moderation and safety management",
        permissions: [
          "content.read", "content.moderate", "content.delete",
          "users.read", "analytics.read", "audit.read"
        ],
      },
      {
        name: "financial_admin",
        displayName: "Financial Administrator",
        description: "Financial operations and reporting",
        permissions: [
          "financial.read", "financial.write", "financial.reconcile",
          "analytics.read", "analytics.export", "audit.read"
        ],
      },
      {
        name: "analytics_viewer",
        displayName: "Analytics Viewer",
        description: "Read-only access to analytics and reports",
        permissions: [
          "analytics.read", "analytics.export", "users.read", "audit.read"
        ],
      },
    ];

    // Create default roles
    for (const role of defaultRoles) {
      await ctx.db.insert("adminRoles", {
        ...role,
        isSystemRole: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return { 
      message: "Default roles and permissions initialized successfully",
      permissionsCreated: defaultPermissions.length,
      rolesCreated: defaultRoles.length
    };
  },
});

// Query to check if user has specific permission
export const checkUserPermission = query({
  args: {
    adminId: v.id("adminUsers"),
    permission: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || !admin.isActive) {
      return false;
    }

    // Super admin has all permissions
    if (admin.role === "super_admin") {
      return true;
    }

    // Check direct permissions
    if (admin.permissions.includes(args.permission)) {
      return true;
    }

    // Check role-based permissions
    const role = await ctx.db
      .query("adminRoles")
      .withIndex("by_name", (q) => q.eq("name", admin.role))
      .first();

    if (role && role.permissions.includes(args.permission)) {
      return true;
    }

    // Check wildcard permissions
    const [resource] = args.permission.split('.');
    const wildcardPermission = `${resource}.*`;
    
    if (admin.permissions.includes(wildcardPermission)) {
      return true;
    }

    if (role && role.permissions.includes(wildcardPermission)) {
      return true;
    }

    return false;
  },
});

// Query to get effective permissions for admin user
export const getEffectivePermissions = query({
  args: { adminId: v.id("adminUsers") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || !admin.isActive) {
      return [];
    }

    // Super admin has all permissions
    if (admin.role === "super_admin") {
      const allPermissions = await ctx.db.query("adminPermissions").collect();
      return allPermissions.map(p => p.name);
    }

    // Combine direct permissions and role permissions
    const effectivePermissions = new Set(admin.permissions);

    // Add role-based permissions
    const role = await ctx.db
      .query("adminRoles")
      .withIndex("by_name", (q) => q.eq("name", admin.role))
      .first();

    if (role) {
      role.permissions.forEach(permission => effectivePermissions.add(permission));
    }

    return Array.from(effectivePermissions);
  },
});