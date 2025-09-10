# Admin Dashboard & Platform Management System

## Overview

The Technically Fit Admin Dashboard provides comprehensive platform management capabilities with secure authentication, role-based access control, and detailed audit logging. This system enables administrators to manage users, moderate content, monitor system health, and oversee financial operations.

## Features Implemented

### ✅ Task 1: Admin Dashboard Infrastructure and Authentication

#### 1. Extended Convex Schema
- **Admin Users Table**: Secure admin user management with MFA support
- **Admin Sessions Table**: Session tracking with IP validation and expiration
- **Audit Logs Table**: Comprehensive action logging for compliance
- **Moderation Queue Table**: Content review and safety management
- **Admin Permissions Table**: Granular permission definitions
- **Admin Roles Table**: Role-based access control system

#### 2. TypeScript Interfaces
- Complete type definitions for all admin models
- Comprehensive interfaces for authentication, user management, content moderation
- Analytics, financial management, and system monitoring types
- Audit logging and permission system types

#### 3. Secure Admin Authentication System
- **Multi-Factor Authentication (MFA)**: TOTP-based 2FA using Speakeasy
- **Password Security**: bcrypt hashing with salt rounds
- **Session Management**: Secure token-based sessions with expiration
- **IP Whitelisting**: Optional IP address restrictions
- **Account Lockout**: Failed login attempt protection
- **Audit Logging**: All authentication events logged

#### 4. Role-Based Access Control (RBAC)
- **Six Admin Roles**:
  - `super_admin`: Full platform access
  - `platform_admin`: Administrative access (excluding financial)
  - `user_support`: User management and support
  - `content_moderator`: Content moderation and safety
  - `financial_admin`: Financial operations and reporting
  - `analytics_viewer`: Read-only analytics access

- **Granular Permissions**: Resource.action format (e.g., `users.read`, `content.moderate`)
- **Wildcard Permissions**: Resource-level access (e.g., `users.*`)
- **Permission Validation**: Real-time permission checking for all actions

## Architecture

### Database Schema

```typescript
// Admin Users
adminUsers: {
  email: string;
  name: string;
  role: AdminRole;
  permissions: string[];
  passwordHash: string;
  mfaSecret?: string;
  mfaEnabled: boolean;
  isActive: boolean;
  lastLogin?: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
  createdAt: string;
  createdBy: Id<"adminUsers">;
  updatedAt: string;
  ipWhitelist?: string[];
  sessionTimeout?: number;
}

// Admin Sessions
adminSessions: {
  adminId: Id<"adminUsers">;
  sessionToken: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
  isActive: boolean;
  revokedAt?: string;
  revokedReason?: string;
}

// Audit Logs
auditLogs: {
  adminId: Id<"adminUsers">;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "authentication" | "user_management" | "content_moderation" | "financial" | "system_config" | "data_access";
  outcome: "success" | "failure" | "partial";
  errorMessage?: string;
}
```

### Service Architecture

```typescript
// Admin Authentication Service
class AdminAuthService {
  authenticateAdmin(credentials, ipAddress, userAgent): Promise<AdminSession>
  validateAdminSession(sessionToken, ipAddress): Promise<AdminUser | null>
  validateAdminPermissions(adminId, action, resource): Promise<boolean>
  createAdminUser(adminData, password, creatorId): Promise<AdminUser>
  updateAdminPermissions(adminId, permissions, updatedBy): Promise<void>
  revokeAdminAccess(adminId, reason, revokedBy): Promise<void>
  logAdminAction(adminId, action): Promise<void>
  setupMFA(adminId): Promise<{secret: string, qrCode: string}>
  verifyAndEnableMFA(adminId, token): Promise<void>
}

// Admin Setup Service
class AdminSetupService {
  initializeAdminSystem(initialAdmin): Promise<{success: boolean, message: string}>
  isAdminSystemInitialized(): Promise<boolean>
  getSystemStatus(): Promise<SystemStatus>
  createAdminUser(adminData, creatorId): Promise<{success: boolean, adminUser?: AdminUser}>
}
```

## Security Features

### Authentication Security
- **Password Hashing**: bcrypt with 12 salt rounds
- **MFA Support**: TOTP-based two-factor authentication
- **Session Security**: Cryptographically secure session tokens
- **IP Validation**: Optional IP address whitelisting
- **Account Lockout**: Automatic lockout after failed attempts
- **Session Expiration**: Configurable session timeouts

### Access Control
- **Role-Based Permissions**: Hierarchical role system
- **Granular Permissions**: Fine-grained access control
- **Permission Inheritance**: Role-based permission inheritance
- **Real-time Validation**: Permission checks on every action
- **Audit Trail**: Complete action logging for compliance

### Data Protection
- **Encrypted Storage**: Sensitive data encryption at rest
- **Secure Transmission**: HTTPS-only communication
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Output encoding and CSP headers

## Setup Instructions

### 1. Install Dependencies

```bash
cd app
npm install
```

### 2. Initialize Admin System

```bash
# Check system status
npm run admin:status

# Initialize admin system (first time only)
npm run admin:setup
```

### 3. Create Additional Admin Users

```typescript
import { adminSetupService } from './src/lib/services/adminSetup';

const result = await adminSetupService.createAdminUser({
  email: 'moderator@technicallyfit.com',
  name: 'Content Moderator',
  role: 'content_moderator',
  password: 'secure_password_123',
  mfaEnabled: true
}, creatorAdminId);
```

## Usage Examples

### Authentication Flow

```typescript
// Login
const session = await adminAuthService.authenticateAdmin({
  email: 'admin@technicallyfit.com',
  password: 'password123',
  mfaToken: '123456'
}, ipAddress, userAgent);

// Validate session
const admin = await adminAuthService.validateAdminSession(
  sessionToken, 
  ipAddress
);

// Check permissions
const canModerate = await adminAuthService.validateAdminPermissions(
  adminId, 
  'moderate', 
  'content'
);
```

### Audit Logging

```typescript
// Log admin action
await adminAuthService.logAdminAction(adminId, {
  action: 'user_suspended',
  resource: 'users',
  resourceId: 'user_123',
  details: { reason: 'policy violation', duration: '7 days' },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

// Get audit logs
const logs = await adminAuthService.getAdminAuditLog(
  adminId,
  { start: '2024-01-01', end: '2024-01-31' },
  100
);
```

## API Reference

### Convex Functions

#### Authentication Functions (`/admin/auth`)
- `getAdminByEmail(email)`: Get admin user by email
- `getAdminById(adminId)`: Get admin user by ID
- `createAdminUser(adminData)`: Create new admin user
- `createAdminSession(sessionData)`: Create admin session
- `revokeAdminSession(sessionId, reason)`: Revoke session
- `updateAdminPermissions(adminId, permissions)`: Update permissions

#### Audit Functions (`/admin/audit`)
- `logAdminAction(auditData)`: Log admin action
- `getAdminAuditLog(filters)`: Get filtered audit logs
- `getAuditStatistics(timeRange)`: Get audit statistics

#### Role Functions (`/admin/roles`)
- `getRolePermissions(role)`: Get role permissions
- `getAllAdminRoles()`: Get all admin roles
- `createAdminRole(roleData)`: Create new role
- `updateAdminRolePermissions(roleId, permissions)`: Update role

#### Setup Functions (`/admin/setup`)
- `createFirstSuperAdmin(adminData)`: Create initial super admin
- `initializeDefaultRolesAndPermissions()`: Setup default RBAC
- `resetAdminSystem()`: Reset system (dev only)

## Testing

### Run Tests

```bash
# Run admin auth tests
npm run test -- adminAuth.test.ts

# Run all tests
npm test
```

### Test Coverage
- Authentication flow validation
- Permission system testing
- Session management verification
- MFA token validation
- Audit logging structure
- Role hierarchy validation

## Security Considerations

### Production Deployment
1. **Environment Variables**: Store secrets in environment variables
2. **HTTPS Only**: Enforce HTTPS for all admin endpoints
3. **Rate Limiting**: Implement rate limiting for login attempts
4. **IP Whitelisting**: Configure IP restrictions for admin access
5. **Regular Audits**: Monitor audit logs for suspicious activity
6. **MFA Enforcement**: Require MFA for all admin accounts
7. **Session Security**: Use secure, httpOnly cookies for sessions
8. **Regular Updates**: Keep dependencies updated for security patches

### Compliance
- **GDPR Compliance**: Audit logs support data protection requirements
- **SOX Compliance**: Financial admin actions are fully logged
- **HIPAA Considerations**: Secure handling of user health data
- **Industry Standards**: Follows OWASP security guidelines

## Next Steps

The admin infrastructure is now ready for implementing the remaining tasks:

1. **User Management Tools** (Task 2.1)
2. **Content Moderation System** (Task 4.1)
3. **Analytics Dashboard** (Task 5.1)
4. **System Monitoring** (Task 6.1)
5. **Financial Management** (Task 7.1)

Each subsequent task will build upon this secure foundation with proper authentication, authorization, and audit logging.