# Tasks: Business & Monetization (002)

## Phase 1 — Subscriptions & Data Model
- [ ] T001 Add Convex `subscriptions` table: userId, type (consumer|trainer_pro), provider (stripe|iap), status, startedAt, currentPeriodEnd, cancelAt
- [ ] T002 Add user feature flags/roles for `subscriber` and `trainer_pro`
- [ ] T003 Create `config/pricing.ts` with Web ($15/mo, $120/yr), iOS ($20/mo), and Trainer Pro ($20/mo)
- [ ] T004 Gate subscriber-only features via guards and UI toggles

## Phase 2 — Stripe Web (Consumer & Trainer Pro)
- [ ] T010 Backend: create checkout sessions for consumer monthly, annual; Trainer Pro monthly
- [ ] T011 Backend: Stripe webhook handler (customer.subscription.created/updated/deleted)
- [ ] T012 Backend: link Stripe customer/sub to user, update `subscriptions` in Convex
- [ ] T013 Frontend: pricing page with Web prices and disabled buttons until env configured
- [ ] T014 Frontend: success/cancel pages
- [ ] T015 Frontend: Trainer Pro billing portal link

## Phase 3 — iOS IAP (Consumer)
- [ ] T020 Capacitor IAP product config and flow
- [ ] T021 Client: send receipt to server; Server: validate with App Store and update `subscriptions`
- [ ] T022 UI: show $20/mo in-app and explain price difference

## Phase 4 — Marketplace (Stripe Connect)
- [ ] T030 Onboard trainers (Express) and persist connect account status
- [ ] T031 Implement destination charges with 30% platform fee
- [ ] T032 Payouts dashboard (summary, history)

## Phase 5 — One-time Plan Delivery & Import
- [ ] T040 Generate downloadable CSV/PDF plan deliverables; email link via Resend
- [ ] T041 Import CSV → app workouts with validation flow

## Phase 6 — Background Checks
- [ ] T050 Background check vendor abstraction and payment by trainer
- [ ] T051 Credit 1–2 months of Trainer Pro on completion

## Phase 7 — Device & AI Integration
- [ ] T060 Define device connector contracts (Whoop/Apple/Fitbit/Samsung) and ingestion schedules
- [ ] T061 Implement fusion function for readiness/recovery with config-driven weights

## Phase 8 — Data Retention & Protection Strategy
- [ ] T070 Implement free vs paid retention policy with scheduled cleanup jobs
- [ ] T071 Server thresholds/config endpoint; client execution-only logic; build obfuscation/minification

## Phase 9 — Legal/UX & Telemetry
- [ ] T080 Add legal copy for pricing differences, marketplace terms, trainer vetting consent
- [ ] T081 Add telemetry/audit logs for payments, subs, transactions
