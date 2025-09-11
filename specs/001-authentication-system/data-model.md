# Data Model: Authentication System

This document defines the logical (implementation-agnostic) data model to support the authentication feature.

## Entities

### User
- id: string (opaque)
- email: string (unique, normalized)
- emailVerifiedAt: datetime | null
- passwordHash: string | null (null for OAuth-only users)
- roles: string[] (subset of {"user","trainer","admin","subscriber"})
- oauthProvider: "google" | "apple" | null
- oauthSubject: string | null (provider user id)
- createdAt: datetime
- updatedAt: datetime

Constraints
- email is unique
- (oauthProvider, oauthSubject) unique when not null
- roles always contains at least "user"

### Session
- id: string (opaque, random)
- userId: string (FK → User.id)
- createdAt: datetime
- lastActivityAt: datetime
- expiresAt: datetime
- ip: string | null
- userAgent: string | null
- revokedAt: datetime | null

Constraints
- expiresAt > createdAt
- If revokedAt != null, session is invalid

### PasswordResetToken
- token: string (opaque, random)
- userId: string (FK → User.id)
- createdAt: datetime
- expiresAt: datetime
- usedAt: datetime | null

Constraints
- Single active token per user (optional simplification)
- expiresAt - createdAt ≈ 1 hour

### EmailVerificationToken
- token: string (opaque, random)
- userId: string (FK → User.id)
- createdAt: datetime
- expiresAt: datetime
- usedAt: datetime | null

Constraints
- expiresAt - createdAt ≈ 24 hours

## Derived Role: Subscriber
- Subscriber is treated as a role in `roles` for authorization checks.
- Assignment can be derived from an active subscription record (outside this feature).
- If a separate subscription model exists, ensure a sync step updates `roles` accordingly.

## Indexes (suggested)
- User: email (unique), oauthProvider+oauthSubject (unique), roles (array index if supported)
- Session: userId, expiresAt, lastActivityAt
- PasswordResetToken: userId, token (unique)
- EmailVerificationToken: userId, token (unique)

## Validation Rules
- Password policy: length ≥ 7; contains at least one letter and one digit; must pass breach check.
- Email must be RFC-compliant; send verification link on registration.
- Lockout after 5 failed attempts (track attempted logins per user within sliding window ~15 minutes).

## Events (for audit/logging)
- user.registered
- user.email_verified
- auth.login_succeeded / auth.login_failed
- auth.lockout_triggered / auth.lockout_cleared
- auth.password_reset_requested / auth.password_reset_completed
- session.created / session.revoked
