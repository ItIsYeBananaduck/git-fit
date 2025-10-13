# Adaptive Fit Constitution (Version 2.0.0)

## Core Principles

### I. User-Centric Design

Prioritize intuitive workout tracking, nutrition logging, and recovery guidance for novice to advanced users. Deliver real-time adjustments based on wearable data (heart rate, SpO2, HRV, sleep, strain) and medical profiles (e.g., exclude high-impact for knee injuries). Ensure safe recommendations (stop if pain >3/10, low-intensity recovery like band clamshells) with WCAG 2.1 AA accessibility.

### II. Adaptability and Learning

Use Llama 3.1 8B (4-bit, local via Capacitor/llama.cpp) to adapt workouts/nutrition based on feedback, targeting ~80% accuracy by week 3. Maintain training intensity (no rep drops below 80%). Provide rule-based fallbacks if Llama is unavailable. Integrate PubMed guidelines for intensity, macros, and recovery.

### III. Cost-Effectiveness

Operate at $10–15/month for 1,000–10,000 users using Fly.io free tier and Tigris storage (~$0.01/month post-beta). Achieve profitability with 10 pro users at $15/month (web) or $20/month (iOS). Optimize deployment for ~1–2GB image size (current: 3.3GB).

### IV. Scalability and Performance

Support 1–10,000 users on 1–2GB RAM, shared CPU, with <200ms API response time (client-side <500ms), 30 FPS animations, 100% uptime via fallbacks. Ensure low-end compatibility (iPhone 7, Android API 19). Scale to 10,000 users with minimal cost increase.

### V. Safety and Privacy

Implement robust security: bcrypt, JWT, 2FA, AES-256/TLS 1.3, GDPR/HIPAA/CCPA compliance, audit logging. Ensure injury-aware coaching (e.g., stop if pain >3/10) and HIPAA-compliant medical data storage. Provide user-controlled data export/deletion and granular consent.

### VI. Engagement and Gamification

Deliver a delightful, gamified experience with achievements (badges, milestones, XP), customizable dashboards, adaptive navigation, and progressive disclosure. Include 3D-rendered avatars (Alice/Aiden) with Llama-driven animations (e.g., purple glow for high strain).

### VII. Data Ethics & Transparency

Ensure transparent Llama 3.1 decisions with user consent for data usage. Provide clear explanations for workout/nutrition adjustments and audit trails for AI recommendations. Allow users to view/modify data preferences and export data (JSON/CSV).

## Technical & Operational Constraints

**Budget**: $10–15/month for beta, using Fly.io free tier and Tigris storage.
**Timeline**: Beta-ready in 1–2 weeks with 10–50 users, focusing on wearable integration, recovery, onboarding, and privacy.
**Technology**: SvelteKit/Capacitor for frontend, Fly.io for backend, Llama 3.1 8B (4-bit, local via Capacitor/llama.cpp), Python 3.10, Node.js 18+. Support wearables (Apple Watch, Whoop, Fitbit, Garmin, Samsung, Polar, Oura, Health Connect) with mock data for beta.
**Data Sources**: PubMed API (weekly), YouTube API (~40 videos, rss_knowledge.jsonl ~0.01MB).
**Team**: Solo developer (Phil) with GitHub Copilot, addressing syntax challenges.

## User Experience & Business Model

**Free Users**: Basic tracking (workouts, nutrition, sleep), rule-based adjustments, 14-day raw data retention.
**Pro Users**: AI-driven tweaks, wearable integration, full data retention (7 years health, 5 years workouts), $15/month (web), $20/month (iOS), $120/year.
**Trainers**: Approve mesocycle shifts, create/sell programs (30% commission), Trainer Pro at $20/month (Stripe), vetting with background checks ($30–50, offset by 1–2 free months).
**Admins**: Moderate users, scrape YouTube/PubMed, analyze usage.
**Marketplace**: 30% commission on plans/videos (CSV/PDF, importable), Stripe Connect for payments.

## Development Philosophy

**Spec-Driven Development**: Executable specs drive implementation via /specify, /plan, /tasks.
**Iterative Refinement**: Clarify specs interactively, validate against checklists, avoid over-engineering.
**User Feedback**: Log tweaks to Fly.io for Llama learning and beta testing.
**Minimal Viable Product**: Focus on tracking, AI tweaks, wearables, recovery, onboarding, privacy for beta.
**Codebase Audit**: ALWAYS audit existing codebase before implementation to identify conflicts, leverage functionality, and prevent duplication.

## Governance

**Purpose**: Adaptive Fit is a fitness marketplace and AI-powered coaching platform for personalized, real-time workout/nutrition adjustments, recovery support, and trainer connections via a marketplace, offering a gamified experience for all lifters.
**Vision**: Lead AI-driven fitness with real-time adaptations, injury recovery, and preference learning, scaling from 100–1,000 beta users to 10,000, with a safe, delightful experience.
**Success Metrics**: Beta (1–2 weeks): 10–50 users onboarded, wearables tested, recovery validated. Performance: <200ms API, <500ms client, 30 FPS, 100% uptime. Cost: $10–15/month for 1,000–10,000 users. Satisfaction: Positive feedback on tweaks, recovery, onboarding. Profitability: Break-even with 10 pro users at $15–20/month.
**Authority**: This constitution supersedes all practices. Amendments require justification against metrics and user impact.
**Version**: 2.0.0 | **Ratified**: 2025-10-10 | **Last Amended**: 2025-10-10
