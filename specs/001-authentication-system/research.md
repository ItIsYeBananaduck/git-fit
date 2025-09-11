# Research: Authentication System

## Decisions
- OAuth Providers: Google, Apple (phase 1)
- Email Provider: Resend (transactional email)
- Password Policy: ≥ 7 chars, at least 1 letter and 1 digit
- Breach Check: Have I Been Pwned (k-anonymity API) on server; combine with local strength checks for UX
- Sessions: Cookie-based, httpOnly, `Secure` in production
  - Idle timeout: 30 minutes
  - Absolute max age: 7 days
  - Rotate session on privilege changes and sensitive actions
- Lockout Policy: 5 failed attempts in a sliding window (e.g., 10–15 minutes) → temporary lockout (15 min)
- Roles: user, trainer, admin (+ optional subscriber derived from subscription status)
- Storage: Convex for users, sessions, tokens, and role assignments

## Rationale
- Google/Apple cover majority of consumer auth cases; can add providers later.
- Resend offers simple API, templates, and good deliverability.
- HIBP k-anonymity allows checking against breached passwords without sending full hashes or plaintext.
- Cookie sessions align with SvelteKit; simplifies CSRF handling (same-site cookies) vs. localStorage tokens.
- Lockout throttles credential-stuffing while keeping UX acceptable.
- Roles match product needs (admin/trainer/user); subscriber is derived, reducing manual role management.

## Alternatives Considered
- JWT access/refresh tokens: adds complexity and rotation logic; cookies simpler for web app scenario.
- Email providers: SES/SendGrid—viable, but Resend account already available.
- Breach check offline lists: heavy to maintain and update; HIBP is lightweight and privacy-preserving.

## Open Questions (to be refined)
- Exact lockout window length: using 15 minutes by default.
- Email verification link expiry: recommend 24 hours.
- Password reset link expiry: recommend 1 hour.
- Session cookie name and domain configuration for production.

## Implementation Notes (non-binding)
- Use Convex functions for: `register`, `verifyEmail`, `login`, `loginOAuthCallback`, `requestPasswordReset`, `resetPassword`, `createSession`, `revokeSession`, `recordFailedAttempt`.
- Store counters/timestamps for failed attempts per user (and optionally per IP) to enforce lockouts.
- Store `oauthProvider` + `oauthSubject` to link OAuth identities to a single `User`.
- Use Resend templates for verification and reset emails; include token links.
