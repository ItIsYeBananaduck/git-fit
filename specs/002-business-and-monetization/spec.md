# Technically Fit – Product Specification (Session Spec)

---

## Business and Monetization

### User Subscriptions
- Web/Stripe: $15/month.
- iOS App Store (IAP): $20/month.
- Annual Plan: $120/year ($10/month effective).

### Trainer Pro
- $20/month via Stripe only.
- Framed as B2B SaaS (Apple cannot claim IAP).
- Includes client management, workout adjustment, and marketplace access.

### Trainer Marketplace
- Commission: 30% per transaction (via Stripe Connect).
- Trainers set their own pricing.
- One-time plans:
  - Delivered as CSV/PDF file.
  - Usable outside the app → Apple exempt.
  - Importable into the app for tracking.
- Ongoing coaching:
  - Classified as trainer services.
  - Paid via Stripe Connect, not IAP.

### Trainer Vetting
- Mandatory background check.
- Paid directly by trainer (~$30–50).
- Offset with 1–2 free months of Trainer Pro access.

### Apple Tax Handling
- Web pricing ($15) vs iOS pricing ($20) balances out Apple’s 30% fee.
- Remains competitive due to feature set and promotional flexibility.

### Global Expansion (Future)
- EU and South Korea: Stripe in-app checkout allowed by regulation.
- U.S. and others: hybrid model (IAP + Stripe web).

---

## Apple Compliance and Payment Flows

- Consumer subscriptions:
  - iOS = $20/month IAP.
  - Web = $15/month Stripe checkout.
- Trainer Pro:
  - B2B SaaS subscription.
  - Stripe only, not Apple IAP.
- Marketplace:
  - Stripe Connect only.
  - Classified as services or downloadable digital goods.
- In-app navigation:
  - “View Trainers” button may open a web view or send automated email.
  - Payments occur on web/email via Stripe.
  - Trainers are the sellers, app is the facilitator.

---

## Trainer Economics

- Trainers set their own pricing.
- Platform commission: 30%.
- Passive income through plan sales (files).
- Ongoing coaching handled as trainer services through Stripe Connect.

---

## Device and AI Integration

- Supported devices:
  - Whoop, Apple Watch, Fitbit, Samsung Watch.
- Metrics used:
  - Heart rate, HRV, sleep, strain, steps, daily activity.
- Device fusion model:
  - Whoop: strain/recovery.
  - Apple Watch: steps, workout HR.
  - Fitbit/Samsung: activity and sleep.
  - Confidence-weighted fusion creates unified readiness/recovery score.

### AI Adjustments
- Training AI:
  - Adapts load, reps, rest based on recovery/fatigue markers.
  - Enforces automatic deloads when strain thresholds exceeded.
- Nutrition AI:
  - Adjusts macros in response to recovery data.
  - Low recovery → reduce training intensity, increase carbs.
  - High strain with low calories → increase protein/fuel.
  - Poor sleep → reduce training volume, rebalance macros.

---

## Data Handling

- Raw workout logs retained for 14 days.
- Free users:
  - Only summaries retained.
  - Summaries updated every 14 days to simulate continuous logs.
- Paid users:
  - Retain raw + summaries for AI-driven adjustments.

---

## Proprietary AI Fusion Algorithm (Trade Secret)

Technically Fit uses a proprietary AI-driven system that integrates biometric data from multiple wearable devices (Whoop, Apple Watch, Fitbit, Samsung Watch) with user workout logs.

Key protected methods (kept as trade secrets):
- Device fusion weighting: Each device is weighted based on accuracy for specific metrics (e.g., Whoop for strain/recovery, Apple Watch for HR/steps).
- Data summarization rules: Proprietary summarization and purge logic compress raw data into lightweight trends while preserving training accuracy.
- AI cross-adjustment: Unique algorithm links recovery data to both training and nutrition, automatically enforcing deloads, adjusting macros, and modifying intensity.
- Adaptive thresholding: Readiness and strain thresholds dynamically shift as the system learns individual baselines.

These methods are proprietary and confidential. They are not disclosed publicly and are managed as trade secrets to prevent replication by competitors.

---

## Real-Time Protection Strategy

Some adaptive logic must run in real time on the user’s device (e.g., workout set adjustments, rest timers, heart rate checks). To preserve trade secrets while enabling responsiveness, Technically Fit uses a hybrid execution model:

### On-Device (Execution Only)
- Heart rate checks during sets.
- Rest timer adjustments.
- Rep tempo pacing.
- Immediate adaptive tweaks (e.g., adding a set, extending rest).
- These functions execute locally to avoid latency.

### On-Server (Trade Secret Logic)
- Device fusion model weights (Whoop, Apple Watch, Fitbit, Samsung).
- Recovery → training → nutrition cross-adjustment rules.
- Strain and readiness thresholds.
- Summarization and purge logic.
- Algorithms that generate the thresholds and adaptive rules sent to clients.

### Protection Measures
- Rule Splitting: Server sends only decision thresholds, not the underlying models.
- Dynamic Configs: Thresholds update regularly from the server, so reverse-engineering one build does not expose the system.
- Code Obfuscation: Client-side logic is obfuscated/minified to slow reverse-engineering.
- Noise/Decoys: Extra non-critical branches included in the client build to obscure which logic paths are active.
- Feedback Loop: Client sends workout data back to server at the end of sessions, where new thresholds and rules are generated.

This ensures the app feels real-time responsive while the core proprietary methods remain protected as trade secrets.
