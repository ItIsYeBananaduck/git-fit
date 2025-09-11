# Implementation Plan: Business & Monetization (002)

## Summary
Implement hybrid monetization that complies with Apple rules:
- Consumer subs: Web Stripe ($15/mo, $120/yr) and iOS IAP ($20/mo)
- Trainer Pro (B2B): Stripe-only $20/mo (no IAP)
- Marketplace: Stripe Connect (30% platform fee), trainers set pricing
- One-time plan delivery (CSV/PDF) with import for tracking
- Background checks for trainers with credit comp
- Device/AI integration and retention/protection strategy

## Phases

### Phase 1: Subscriptions & Data Model
- Add Convex `subscriptions` table (type: consumer|trainer_pro, status, provider, period dates)
- Add feature flags/roles to enforce subscriber access (ties into auth)
- Centralize pricing config (Web, iOS) with feature flags and copy strings

### Phase 2: Stripe Web (Consumer & Trainer Pro)
- Create checkout sessions & webhooks
- Billing portal for Trainer Pro
- Attach subs to users, update status via webhooks
- Pricing page (Web) with $15/mo, $120/yr; Trainer Pro $20/mo

### Phase 3: iOS IAP (Consumer)
- Capacitor products
- Client purchase → server receipt validation
- Activate/cancel subscription status from receipt events
- Show $20/mo in-app UI

### Phase 4: Marketplace (Stripe Connect)
- Onboard trainers (Express)
- Destination charges with 30% platform fee
- Payouts dashboard

### Phase 5: One-time Plan Delivery & Import
- Generate CSV/PDF (download + email)
- Import CSV → workouts

### Phase 6: Background Checks
- Vendor abstraction, trainer pays
- Credit 1–2 months of Trainer Pro upon completion

### Phase 7: Device & AI Integration
- Device connectors contracts & ingestion schedule
- Fusion function for readiness/recovery (config-driven)

### Phase 8: Data Retention & Protection Strategy
- Free summaries-only (periodic summarization)
- Paid raw+summaries
- Cleanup jobs + server thresholds endpoint + client execution-only

### Phase 9: Legal/UX & Telemetry
- Legal copy for pricing differences, marketplace terms, vetting consent
- Audit/logging for payments and transactions

## Environment
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs for products
- Apple IAP: shared secret/keys for receipt validation
- Resend already scaffolded for emails

## Deliverables
- Convex schema updates, pricing config, pricing page scaffold, webhooks handlers (stubs)
- Specs/002: tasks.md with actionable items
