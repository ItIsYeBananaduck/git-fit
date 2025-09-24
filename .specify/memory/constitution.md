# Technically Fit Constitution

## Core Principles

### I. User-Centric Design

Prioritize user needs, from novice lifters to advanced athletes, ensuring intuitive workout tracking, nutrition logging, and recovery guidance. Deliver real-time adjustments based on wearable data (e.g., heart rate, SpO2) to optimize performance and safety. Support active recovery for injuries (e.g., band clamshells for stiff leg) with clear, safe recommendations (stop if pain > 3/10).

### II. Adaptability and Learning

Adapt workouts to user preferences (e.g., prefer rack-pull over deadlift) via AI learning from logged feedback, targeting ~80% accuracy by week 3. Ensure no rep drops below 80% to maintain training intensity. Provide fallback rule-based tweaks if AI is unavailable.

### III. Cost-Effectiveness

Operate within $0-$10/month for 100-1,000 users, scaling to ~$200/month for 10,000. Achieve profitability with 10 pro users at $5/month. Use cost-efficient storage (e.g., Tigris at ~$0.01/month post-beta) and deployment (Fly.io free tier).

### IV. Scalability and Performance

Support 100-1,000 users on 1GB RAM, shared CPU, with <200ms API response time and 100% uptime via fallbacks. Scale to 10,000 users with minimal cost increase. Optimize deployment for ~1-2GB image size (current: 3.3GB).

### V. Safety and Privacy

Implement robust security: bcrypt, JWT, 2FA, GDPR compliance, Stripe PCI compliance. Ensure injury-aware coaching (e.g., stop if pain > 3/10, low-intensity recovery for stiff leg).

### VI. Engagement and Gamification

Provide a delightful, gamified experience with progress tracking and visual feedback. Include post-beta 3D-rendered avatars (Alice/Aiden) for a lively user interface.

### VII. Data Ethics & Transparency

Ensure transparent AI decision-making with user consent for data usage. Provide clear explanations for workout adjustments and maintain user control over personal data. Implement audit trails for AI recommendations and allow users to view/modify their data preferences.

## Technical & Operational Constraints

**Budget**: $0-$10/month for beta, leveraging Fly.io free tier and Tigris storage post-beta.
**Timeline**: Beta-ready in 1-2 weeks with 10-50 lifters, focusing on wearable integration and recovery.
**Technology**: Use existing tools: SvelteKit, Convex, FastAPI, distilgpt2 (~475MB), Python 3.10, Node.js 18+. Support wearables (Apple Watch, Fitbit, Whoop, Samsung/Android Watch) with mock data for beta.
**Data Sources**: PubMed API (weekly), YouTube API (~40 videos, rss_knowledge.jsonl ~0.01MB).
**Team**: Solo developer (Phil) with coding AI (GitHub Copilot), limited by syntax challenges.

## User Experience & Business Model

**Free Users**: Access basic tracking (workouts, nutrition, sleep) without AI.
**Pro Users**: Receive AI-driven real-time tweaks, wearable integration, and preference learning.
**Trainers**: Approve mesocycle shifts, create/sell programs in the marketplace.
**Admins**: Moderate users, analyze usage, manage content.

## Development Philosophy

**Spec-Driven Development**: Specifications are executable, driving implementation via /specify, /plan, /tasks.
**Iterative Refinement**: Clarify specs interactively, validate against checklists, avoid over-engineering.
**User Feedback**: Log all tweaks to Convex for AI learning and beta testing.
**Minimal Viable Product**: Focus on core features (tracking, AI tweaks, wearables, recovery) for beta.

## Governance

**Purpose**: Technically Fit is a fitness marketplace and AI-powered coaching platform that empowers users to achieve their fitness goals through personalized, real-time workout adjustments, nutrition tracking, and recovery support. It connects users with verified trainers via a program marketplace, offering a seamless, gamified experience for lifters, from beginners to advanced.

**Vision**: To become the leading AI-driven fitness platform that adapts workouts in real time, supports injury recovery, and learns user preferences, making personalized training accessible and affordable for 100-1,000 users in beta, scaling to 10,000, with a delightful and safe user experience.

**Success Metrics**: Beta (1-2 Weeks): 10-50 lifters onboarded, wearable integration tested, recovery prompts validated. Performance: API response <200ms, memory <1GB, 100% uptime. Cost: <$10/month for 100-1,000 users. User Satisfaction: Positive feedback on real-time tweaks and recovery suggestions. Profitability: Break-even with 10 pro users at $5/month.

**Constitution Authority**: This constitution supersedes all other practices. All development decisions must align with these principles. Amendments require justification against success metrics and user impact.

**Version**: 1.1.0 | **Ratified**: 2025-09-24 | **Last Amended**: 2025-09-24
