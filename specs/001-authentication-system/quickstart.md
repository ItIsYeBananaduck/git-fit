# Quickstart: Authentication System

This quickstart describes how to run and manually validate the authentication feature locally.

## Prerequisites
- Node.js and pnpm/npm installed
- Convex configured (env + dev instance)
- Resend account and API key
- OAuth credentials for Google and Apple (dev)

## Environment Variables (.env.local)
```
# Sessions
SESSION_SECRET=replace-with-strong-random
COOKIE_NAME=gitfit_session

# Resend
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=Auth <no-reply@example.com>

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
APPLE_CLIENT_ID=...
APPLE_TEAM_ID=...
APPLE_KEY_ID=...
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Convex
# (Convex env settings as per your convex/ setup)
```

## Install & Run
```
pnpm install
pnpm dev
```

## Flows to Validate
- Registration
  - Submit email/password (≥7, letter+digit). Check verification email in Resend.
- Email Verification
  - Click verification link. Confirm you can sign in afterwards.
- Sign In / Lockout
  - Sign in with correct creds → session cookie set.
  - Fail 5 times → lockout messaging and cooldown.
- OAuth
  - Sign in with Google and Apple → first-time user is created and logged in.
- Password Reset
  - Request reset; follow link; set new password; sign in.
- Roles & Access
  - Admin and trainer pages accessible by respective roles. Unauthorized redirects for others.

## Notes
- Use a separate test account/email.
- In production, set cookies `Secure` and SameSite appropriately.
- Rotate `SESSION_SECRET` periodically.
