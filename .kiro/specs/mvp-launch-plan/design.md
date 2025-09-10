# MVP Launch Plan - Design Document

## Overview

This design document outlines the technical architecture for launching the Technically Fit MVP within 1 month. The design prioritizes simplicity, reliability, and rapid development while maintaining a solid foundation for future growth.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SvelteKit     │    │     Convex      │    │   External      │
│   Frontend      │◄──►│    Backend      │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Auth Pages    │    │ • User Storage  │    │ • Email Service │
│ • Profile Mgmt  │    │ • Auth Logic    │    │ • File Storage  │
│ • Admin Panel   │    │ • Session Mgmt  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: SvelteKit (existing)
- **Backend**: Convex (existing)
- **Authentication**: Custom JWT-based system
- **Database**: Convex built-in database
- **File Storage**: Convex file storage
- **Email**: Simple email service (Resend or similar)
- **Deployment**: Vercel (frontend) + Convex (backend)

## Components and Interfaces

### Authentication Service

```typescript
interface AuthService {
  // Core authentication methods
  login(email: string, password: string): Promise<AuthResult>;
  register(userData: RegisterData): Promise<AuthResult>;
  logout(): Promise<void>;

  // Session management
  getCurrentUser(): Promise<User | null>;
  refreshSession(): Promise<boolean>;

  // Password management
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
}

interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}
```

### User Management

```typescript
interface User {
  _id: Id<"users">;
  email: string;
  name: string;
  role: "client" | "trainer" | "admin";
  profile: ClientProfile | TrainerProfile;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface ClientProfile {
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  goals: string[];
  height?: number;
  weight?: number;
  dateOfBirth?: string;
  profileImage?: string;
}

interface TrainerProfile {
  bio: string;
  specialties: string[];
  certifications: string[];
  hourlyRate: number;
  profileImage?: string;
}
```

### Admin Interface

```typescript
interface AdminService {
  // User management
  getUsers(filters?: UserFilters): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  updateUserStatus(id: string, isActive: boolean): Promise<void>;

  // Dashboard metrics
  getDashboardStats(): Promise<DashboardStats>;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  clientCount: number;
  trainerCount: number;
}
```

## Data Models

### Database Schema

```javascript
// Convex schema
export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("client"),
      v.literal("trainer"),
      v.literal("admin")
    ),
    isActive: v.boolean(),
    createdAt: v.string(),
    lastLogin: v.optional(v.string()),

    // Profile data (flexible object)
    profile: v.object({
      // Common fields
      profileImage: v.optional(v.string()),

      // Client-specific fields
      fitnessLevel: v.optional(v.string()),
      goals: v.optional(v.array(v.string())),
      height: v.optional(v.number()),
      weight: v.optional(v.number()),
      dateOfBirth: v.optional(v.string()),

      // Trainer-specific fields
      bio: v.optional(v.string()),
      specialties: v.optional(v.array(v.string())),
      certifications: v.optional(v.array(v.string())),
      hourlyRate: v.optional(v.number()),
    }),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.string(),
    createdAt: v.string(),
    lastActivity: v.string(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  passwordResets: defineTable({
    email: v.string(),
    token: v.string(),
    expiresAt: v.string(),
    used: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),
});
```

## Error Handling

### Error Types

```typescript
enum AuthErrorType {
  INVALID_CREDENTIALS = "invalid_credentials",
  EMAIL_ALREADY_EXISTS = "email_already_exists",
  WEAK_PASSWORD = "weak_password",
  SESSION_EXPIRED = "session_expired",
  NETWORK_ERROR = "network_error",
  VALIDATION_ERROR = "validation_error",
}

interface AuthError {
  type: AuthErrorType;
  message: string;
  field?: string;
}
```

### Error Handling Strategy

1. **Client-side validation** for immediate feedback
2. **Server-side validation** for security
3. **Graceful degradation** for network issues
4. **User-friendly messages** for all error states
5. **Retry mechanisms** for transient failures

## Testing Strategy

### Testing Approach

1. **Unit Tests** (Vitest)

   - Authentication service methods
   - Form validation logic
   - Utility functions

2. **Integration Tests** (Playwright)

   - Complete registration flow
   - Login/logout functionality
   - Profile management
   - Admin panel operations

3. **Manual Testing**
   - Mobile responsiveness
   - Cross-browser compatibility
   - User experience flows

### Test Coverage Goals

- **Authentication Service**: 90%+ coverage
- **Critical User Flows**: 100% integration test coverage
- **Error Scenarios**: All major error paths tested

## Security Considerations

### Authentication Security

1. **Password Security**

   - bcrypt hashing with salt rounds ≥ 12
   - Minimum password requirements enforced
   - No password storage in localStorage

2. **Session Management**

   - JWT tokens with reasonable expiration (24 hours)
   - Secure httpOnly cookies where possible
   - Session invalidation on logout

3. **Input Validation**

   - Client and server-side validation
   - SQL injection prevention (Convex handles this)
   - XSS prevention through proper escaping

4. **Rate Limiting**
   - Login attempt limiting (5 attempts per 15 minutes)
   - Registration rate limiting
   - Password reset rate limiting

### Data Protection

1. **Personal Data**

   - Minimal data collection
   - Secure data transmission (HTTPS)
   - No sensitive data in client-side storage

2. **File Uploads**
   - File type validation
   - Size limits (2MB for profile images)
   - Secure file storage through Convex

## Performance Optimization

### Frontend Performance

1. **Code Splitting**

   - Lazy load admin panel
   - Separate auth bundle
   - Route-based splitting

2. **Caching Strategy**

   - User profile caching
   - Static asset caching
   - API response caching

3. **Image Optimization**
   - Profile image compression
   - Responsive image loading
   - WebP format support

### Backend Performance

1. **Database Optimization**

   - Proper indexing on email and userId
   - Efficient query patterns
   - Connection pooling (handled by Convex)

2. **API Optimization**
   - Minimal data transfer
   - Batch operations where possible
   - Response compression

## Deployment Strategy

### Environment Setup

1. **Development**

   - Local Convex development
   - Hot reload for rapid iteration
   - Mock email service

2. **Production**
   - Vercel deployment for frontend
   - Convex production deployment
   - Real email service integration
   - Environment variable management

### Deployment Pipeline

1. **Automated Testing**

   - Run all tests on PR
   - Block deployment on test failures

2. **Staging Environment**

   - Deploy to staging first
   - Manual QA testing
   - Performance validation

3. **Production Deployment**
   - Zero-downtime deployment
   - Database migration handling
   - Rollback capability

## Monitoring and Maintenance

### Basic Monitoring

1. **Error Tracking**

   - Client-side error logging
   - Server-side error alerts
   - User feedback collection

2. **Performance Monitoring**

   - Page load times
   - API response times
   - User engagement metrics

3. **Security Monitoring**
   - Failed login attempts
   - Suspicious activity patterns
   - Security vulnerability scanning

### Maintenance Tasks

1. **Regular Updates**

   - Dependency updates
   - Security patches
   - Performance optimizations

2. **Data Maintenance**
   - Session cleanup
   - Expired token removal
   - User activity analysis

This design provides a solid foundation for the MVP while maintaining simplicity and focusing on core functionality needed for launch.
