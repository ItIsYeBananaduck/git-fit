// Import the Id type
import type { Id } from "../types/admin";

// Simple API interface for Convex functions
// Note: This is a simplified approach for the demo
// In production, you'd use the official Convex React client

// Resolve Convex URL from various env locations (Vite vs Node vs runtime).
const CONVEX_URL =
  import.meta.env.VITE_CONVEX_URL ||
  // Vite exposes public env vars as import.meta.env.PUBLIC_* during build/dev
  (import.meta.env as Record<string, string>).PUBLIC_CONVEX_URL ||
  // Node runtime fallback (used by some dev setups)
  process.env.PUBLIC_CONVEX_URL ||
  process.env.CONVEX_URL ||
  undefined;

if (!CONVEX_URL) {
  // Don't throw during SSR/dev — log a warning and continue with a dummy URL.
  // This allows the dev server to start while env files are validated separately.
  // Frontend code should guard against missing/invalid Convex config in production.
  // eslint-disable-next-line no-console
  console.warn("Warning: Missing CONVEX_URL environment variable. Convex calls will be mocked in dev.");
}

interface QueryArgs {
  category?: string;
  level?: string;
  equipment?: string;
  muscleGroup?: string;
  limit?: number;
  search?: string;
}

interface ExerciseWithRecommendations {
  exerciseId: string;
}

interface AdminUser {
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

interface AdminSession {
  _id: string;
  adminId: string;
  sessionToken: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  isActive: boolean;
}

interface ImportExercisesArgs {
  exercises: Array<{
    name: string;
    category: string;
    level: string;
    equipment: string[];
    muscleGroup: string[];
  }>;
}

// Simplified API object for demo purposes
export const api = {
  users: {
    // Add user functions here when needed
  },
  exercises: {
    importExercises: async (args: ImportExercisesArgs) => {
      // This would connect to your Convex backend
      console.log('Mock: Importing exercises', args);
      return { success: true, imported: args.exercises.length, total: args.exercises.length, errors: [] };
    },
    getExercises: async (args: QueryArgs) => {
      // This would connect to your Convex backend  
      console.log('Mock: Getting exercises', args);
      return [];
    },
    getExerciseWithRecommendations: async (args: ExerciseWithRecommendations) => {
      // This would connect to your Convex backend
      console.log('Mock: Getting exercise with recommendations', args);
      return null;
    },
    initializeEquipmentRecommendations: async () => {
      // This would connect to your Convex backend
      console.log('Mock: Initializing equipment recommendations');
      return { success: true, initialized: 6 };
    },
  },
  trainingPrograms: {
    // Add training program functions here when needed
  },
  workouts: {
    // Add workout functions here when needed
  },
  admin: {
    auth: {
      getAdminByEmail: async (args: { email: string }): Promise<AdminUser> => {
        console.log('Mock: Getting admin by email', args);
        return {
          _id: { __tableName: "adminUsers" } as Id<"adminUsers">, // Use Id<"adminUsers"> type
          email: args.email,
          name: 'Admin User',
          role: 'super_admin',
          permissions: ['*'],
          isActive: true,
          lockedUntil: null,
          passwordHash: 'mockHash',
          mfaEnabled: false,
          mfaSecret: null,
          ipWhitelist: [],
          sessionTimeout: 28800000, // 8 hours
          failedLoginAttempts: 0,
        };
      },
      createAdminSession: async (args: { adminId: Id<"adminUsers">; sessionToken: string; ipAddress: string; userAgent: string; expiresAt: string }): Promise<AdminSession> => {
        console.log('Mock: Creating admin session', args);
        return {
          _id: { __tableName: "adminSessions" } as Id<"adminSessions">, // Use Id<"adminSessions"> type
          adminId: args.adminId,
          sessionToken: args.sessionToken,
          ipAddress: args.ipAddress,
          userAgent: args.userAgent,
          expiresAt: args.expiresAt,
          isActive: true,
        };
      },
      updateAdminLoginSuccess: async (args: { adminId: string; lastLogin: string }) => {
        console.log('Mock: Updating admin login success', args);
      },
      getAdminSession: async (args: { sessionToken: string }) => {
        console.log('Mock: Getting admin session', args);
        return null; // Replace with actual implementation
      },
      revokeAdminSession: async (args: { sessionId: string; reason: string }) => {
        console.log('Mock: Revoking admin session', args);
      },
      deactivateAdminUser: async (args: { adminId: string; updatedAt: string }) => {
        console.log('Mock: Deactivating admin user', args);
      },
      revokeAllAdminSessions: async (args: { adminId: string; reason: string }) => {
        console.log('Mock: Revoking all admin sessions', args);
      },
      enableMFA: async (args: { adminId: string; updatedAt: string }) => {
        console.log('Mock: Enabling MFA', args);
      },
      storeMFASecret: async (args: { adminId: string; mfaSecret: string }) => {
        console.log('Mock: Storing MFA secret', args);
      },
      getAdminById: async (args: { adminId: string }): Promise<AdminUser> => {
        console.log('Mock: Getting admin by ID', args);
        return {
          _id: args.adminId,
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'super_admin',
          permissions: ['*'],
          isActive: true,
          lockedUntil: null,
          passwordHash: 'mockHash',
          mfaEnabled: false,
          mfaSecret: null,
          ipWhitelist: [],
          sessionTimeout: 28800000, // 8 hours
          failedLoginAttempts: 0,
        };
      },
      updateSessionActivity: async (args: { sessionId: string; lastActivity: string }) => {
        console.log('Mock: Updating session activity', args);
      },
      updateFailedLoginAttempts: async (args: { adminId: string; failedLoginAttempts: number; lockedUntil?: string }) => {
        console.log('Mock: Updating failed login attempts', args);
      },
      updateAdminPermissions: async (args: { adminId: string; permissions: string[]; updatedAt: string }) => {
        console.log('Mock: Updating admin permissions', args);
      },
      createAdminUser: async (args: { email: string; name: string; role: string; permissions: string[]; passwordHash: string; }): Promise<AdminUser> => {
        console.log('Mock: Creating admin user', args);
        return {
          _id: { __tableName: "adminUsers" } as Id<"adminUsers">,
          email: args.email,
          name: args.name,
          role: args.role,
          permissions: args.permissions,
          isActive: true,
          lockedUntil: null,
          passwordHash: args.passwordHash,
          mfaEnabled: false,
          mfaSecret: null,
          ipWhitelist: [],
          sessionTimeout: 28800000, // 8 hours
          failedLoginAttempts: 0,
        };
      },
      revokeAdminSessionByToken: async (args: { sessionToken: string; reason: string }) => {
        console.log('Mock: Revoking admin session by token', args);
      },
    },
    audit: {
      logAdminAction: async (args: { adminId: string; action: string; resource: string; resourceId: string; details: object; ipAddress: string; userAgent: string; timestamp: string; severity: string; category: string; outcome: string }) => {
        console.log('Mock: Logging admin action', args);
      },
      logFailedLogin: async (args: { email: string; reason: string; ipAddress: string; timestamp: string }) => {
        console.log('Mock: Logging failed login', args);
      },
      getAdminAuditLog: async (args: { adminId: string; startTime: string; endTime: string; limit: number }) => {
        console.log('Mock: Getting admin audit log', args);
        return []; // Replace with actual implementation
      },
    },
    roles: {
      getRolePermissions: async (args: { role: string }) => {
        console.log('Mock: Getting role permissions', args);
        return { permissions: [] }; // Replace with actual implementation
      },
    },
  },
};

export const convex = api;
