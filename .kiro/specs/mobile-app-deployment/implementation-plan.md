# Mobile App Deployment — Implementation Plan

This document converts the `mobile-app-deployment` requirements into a practical implementation plan with milestones, deliverables, contracts, testing strategy, and risks.

## Goal
Deliver native iOS and Android applications that match the web feature set, integrate device capabilities (camera, health data, WHOOP), work offline, and meet App Store / Play Store requirements.

## Scope (first release)
- Core user flows: onboarding, workouts, nutrition logging (barcode), training programs, trainer marketplace messaging
- Device integrations: Camera barcode scanning, Apple HealthKit (iOS), Google Fit (Android), WHOOP OAuth + data ingestion
- Offline logging + sync for workouts and nutrition
- Push notifications and basic background sync
- Basic analytics and crash reporting

## High-level milestones
1. Project setup & CI (2 days)
   - Capacitor scaffolding verified for iOS/Android
   - Repo CI: build, lint, unit tests, and a fast E2E smoke for dev branch
2. Core web-to-native wrappers (4 days)
   - Camera/barcode plugin wrapper
   - File storage and preferences wrapper
   - Background sync wrapper (workbox / background fetch shim)
3. Device integrations (6 days)
   - Apple HealthKit integration (iOS native module)
   - Google Fit integration (Android native module)
   - WHOOP OAuth via Convex server functions + mobile-friendly flow
4. Offline-first storage + sync (4 days)
   - Local store (IndexedDB / Capacitor Storage) + sync queue
   - Conflict resolution UX patterns
5. Push notifications & engagement (3 days)
   - FCM + APNs setup, topic/subscription model for reminders and trainer messages
6. App store preparation (3 days)
   - Privacy policy, screenshots, localization, build signing, store metadata

Estimated time for MVP: 3–4 weeks for a small team (1–3 engineers) depending on existing backend coverage.

## Deliverables
- Native scaffolding with CI integration and reproducible build scripts
- Working barcode scanner component and UI pattern
- HealthKit + Google Fit connectors with permission flows and sample data ingestion
- Convex server endpoints for WHOOP OAuth exchange and periodic data fetch
- Offline sync engine with queued writes and conflict resolution UI
- Push notifications integration and demo reminder flows
- App store submission checklist and required assets

## Contracts & APIs

- Mobile → Convex
  - POST /convex/functions/whoop.exchangeWhoopCode (existing server mutation)
  - Query endpoints for trainingPrograms, workout logging, nutrition entries

- Native plugin interfaces (JS contract)
  - camera.scanBarcode(): Promise<{ code: string; format?: string }>
  - health.connect(provider: 'apple'|'google', options): Promise<{ granted: boolean }>
  - health.readMetrics(metrics[], timeframe): Promise<MetricSample[]>
  - notifications.schedule(reminder): Promise<string>
  - storage.syncQueue.enqueue(item): Promise<void>

Data shapes (minimal)
- MetricSample { metric: string; value: number | object; ts: string; source: string }
- BarcodeFood { barcode: string; name?: string; nutrients?: object; ts: string }

## Edge cases & mitigations
- Missing/denied permissions: provide clear fallback flows and manual entry UI
- Multiple device sources: merge using timestamp precedence and allow manual override
- Offline conflicts: last-writer-wins by default + user-facing conflict resolution for critical records
- WHOOP API rate limits / token expiry: refresh tokens server-side and backoff on failure

## Testing & QA
- Unit tests: wrappers and converters (JS/TS)
- Integration tests: Convex endpoints (local dev) + mocked native plugins
- E2E: Playwright for web flows, small smoke test harness for native flows (local device/emulator)
- Manual: test app store builds on device, HealthKit/Google Fit real device tests

## Quality gates
- CI must run lint, typecheck, unit tests and a fast build for each PR
- Deploy a staged app (internal testing track) before production
- Convex dev must pass function compile and codegen; keep `_generated` in sync during development

## Security & privacy
- Do not embed client secrets in-app; use Convex mutations to handle OAuth exchanges
- Use secure storage for tokens (Keychain/EncryptedSharedPreferences via Capacitor plugins)
- TLS everywhere; certificate pinning recommended for extra security

## Rollout plan
1. Internal alpha (team + testers) — device integrations mocked where needed
2. Closed beta — invite trainers and power users; collect feedback and crash logs
3. Public release — submit to App Store & Play Store; monitor issues and roll patches

## Risks
- Native health integrations have platform-specific quirks that require device testing
- WHOOP or third-party APIs rate limits and policy changes can delay features
- App store review delays — prepare privacy docs and expected behavior notes

## Next steps (pick one)
1. Implement `camera.scanBarcode()` plugin and UI (high-priority and low risk). I can scaffold the Svelte UI and Capacitor plugin wrapper now.
2. Wire WHOOP OAuth end-to-end: verify Convex server mutation + mobile redirect URI + token storage.
3. Implement HealthKit connector (iOS) and a minimal Google Fit flow (Android) for strain/recovery samples.

Choose a next step and I'll implement the first piece (scaffold + tests) in this workspace.
