# Feature Specification: OAuth Implementation & Platform-Specific UI for AdaptiveFit

**Feature Branch**: `006-oauth-implementation-for`  
**Created**: September 28, 2025  
**Status**: Draft  
**Input**: User description: "OAuth Implementation for AdaptiveFit via Convex + UI Separation with Capacitor - Implement OAuth authentication in AdaptiveFit, a fitness app with AI-driven coaching (Alice/Aiden, fine-tuned GPT-2), using Convex as the backend. Enable secure integration with Spotify/Apple Music for StrainSync Radio and external Stripe payments for trainer-client transactions. Additionally, implement platform-specific UI separation using Capacitor: restrict workout tracking to mobile (phone/tablet), place dashboard summaries and marketplace on web-only, ensure minimalist design with 3D avatars, and bypass Apple's in-app purchase fees. Support 10k concurrent users with real-time updates (1-5s) while maintaining privacy and user control over all features."

## Execution Flow (main)

```text
1. Parse user description from Input ✓
   → Comprehensive OAuth integration + platform-specific UI separation
2. Extract key concepts from description ✓
   → Identified: OAuth (Spotify/Apple Music), StrainSync Radio, trainer payments, encrypted chat, UI platform separation, 3D avatars, minimalist design
3. For each unclear aspect ✓
   → Marked unclear performance targets and specific compliance requirements
4. Fill User Scenarios & Testing section ✓
   → Clear user flows for music connection, trainer payments, and platform-specific features
5. Generate Functional Requirements ✓
   → 35+ testable requirements covering OAuth, payments, UI separation, privacy, and performance
6. Identify Key Entities ✓
   → OAuth tokens, music metadata, payment transactions, encrypted messages, platform-specific UI states
7. Run Review Checklist ✓
   → Few clarifications needed on compliance and infrastructure limits
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story

As a fitness app client, I want to securely connect my music streaming service to enhance my workouts with StrainSync Radio, access different features based on my device (mobile for workouts, web for summaries), and interact with minimalist 3D AI coaches (Alice/Aiden). As a trainer (determined by active subscription status), I want to monitor multiple clients simultaneously on tablet devices, accept payments from clients through encrypted chat, and sell training programs through the marketplace while maintaining privacy and bypassing app store fees.

### Acceptance Scenarios

1. **Given** a user wants music integration, **When** they tap "Connect Spotify/Apple Music" in settings, **Then** they are redirected to OAuth login and can successfully authorize the connection
2. **Given** a connected music service, **When** a user starts a workout on mobile, **Then** the system logs music metadata (BPM, genre) alongside their strain data for performance insights
3. **Given** a user on mobile phone, **When** they navigate the app, **Then** they see a minimalist 4-icon bottom navigation (Home, Track, Crew, Me) with swipe-up Quick Drawer for settings
4. **Given** a user on mobile phone, **When** they tap the bottom-right corner, **Then** a 3D avatar (Alice/Aiden) fades in and provides coaching guidance
5. **Given** a trainer on tablet, **When** they open the app, **Then** they see a clipboard-style dashboard with client list, strain bars, and can swipe-left for client selection
6. **Given** a trainer wants to sell a program, **When** they send a payment code via encrypted chat, **Then** the client can enter the code to unlock the program without triggering in-app purchase flows
7. **Given** a client reaches 85% strain during training, **When** the system detects this redline event, **Then** their trainer receives a real-time alert within 5 seconds via toast notification
8. **Given** a user wants to access marketplace, **When** they tap marketplace link on mobile, **Then** they are redirected to external web browser to avoid in-app purchase restrictions
9. **Given** a user accesses the web platform, **When** they view their dashboard, **Then** they see historical summaries (strain graphs, intensity scores, music mood analysis) but cannot log new workouts
10. **Given** a user wants privacy control, **When** they disable music integration, **Then** all stored music metadata is immediately deleted and no future data is collected

### Edge Cases

- What happens when OAuth tokens expire during an active workout session?
- How does the system handle payment disputes or failed Stripe transactions?
- What occurs when a user revokes OAuth permissions directly from Spotify/Apple Music?
- How does the system behave when real-time strain monitoring fails to deliver alerts within 5 seconds?
- What happens when encrypted chat messages fail to decrypt properly?
- How does the app detect and handle switching between phone and tablet modes?
- What occurs when 3D avatar models fail to load on mobile devices?
- How does the system handle concurrent users exceeding 10,000 limit?
- What happens when external marketplace links fail to open in browser?

## Requirements

### Functional Requirements

#### OAuth Integration & Music Services
- **FR-001**: System MUST provide OAuth integration for Spotify and Apple Music services
- **FR-002**: System MUST store only access/refresh tokens and minimal music metadata (BPM, genre)
- **FR-002a**: System MUST automatically refresh expired OAuth tokens silently without interrupting user sessions
- **FR-003**: System MUST allow users to toggle music integration on/off at any time
- **FR-004**: System MUST delete all music metadata within 24 hours when user disables integration
- **FR-005**: System MUST automatically delete music correlation data after 6 months unless user opts out

#### StrainSync Radio & Performance Tracking
- **FR-006**: System MUST log music metadata (BPM, genre) during workout sessions
- **FR-007**: System MUST correlate music data with strain/performance metrics anonymously
- **FR-008**: System MUST provide users control over music data retention policies
- **FR-009**: System MUST not store lyrics, personal playlists, or listening history

#### Trainer-Client Payment System
- **FR-010**: System MUST support encrypted chat communication between trainers and clients
- **FR-011**: System MUST allow trainers to send payment codes/links through encrypted chat
- **FR-012**: System MUST process external Stripe payments without triggering Apple's in-app purchase flows
- **FR-013**: System MUST take 30% commission on trainer earnings (10% for pro users)
- **FR-014**: System MUST unlock trainer programs when valid payment codes are entered
- **FR-015**: System MUST process payment splits via server-side webhooks invisible to app stores

#### Real-Time Safety & Monitoring

- **FR-016**: System MUST detect when users reach 85% strain threshold (redline)
- **FR-017**: System MUST send real-time alerts to trainers within 5 seconds of redline events
- **FR-018**: System MUST support concurrent monitoring for up to 10,000 active users
- **FR-018a**: System MUST automatically scale capacity when approaching concurrent user limits
- **FR-019**: System MUST automatically pause workouts when redline thresholds are exceeded
- **FR-020**: System MUST log all strain events for performance analysis

#### Platform-Specific UI & Navigation

- **FR-021**: System MUST restrict workout tracking functionality to mobile devices only (phone and tablet)
- **FR-022**: System MUST provide web-only access to dashboard summaries and marketplace features
- **FR-023**: System MUST display minimalist 4-icon bottom navigation on mobile phones (Home, Track, Crew, Me)
- **FR-024**: System MUST provide swipe-up Quick Drawer on mobile for settings access (music toggle, Labs mode)
- **FR-025**: System MUST display 3D avatars (Alice/Aiden) in bottom-right corner that fade-in on tap
- **FR-026**: System MUST detect tablet devices and switch to trainer mode with clipboard-style dashboard
- **FR-027**: System MUST provide swipe-left navigation for client selection on tablet trainer mode
- **FR-028**: System MUST display client strain bars and redline alerts via toast notifications on tablets
- **FR-029**: System MUST redirect marketplace links to external browser to bypass in-app purchase restrictions
- **FR-030**: System MUST prevent workout logging functionality when accessed via web platform

#### Web Dashboard & Marketplace

- **FR-031**: System MUST display historical summaries including strain graphs, intensity scores, and music mood analysis on web
- **FR-032**: System MUST provide tap-to-expand functionality for workout log details on web dashboard
- **FR-033**: System MUST enable trainers to sell generic plans (CSV/PDF format) through external Stripe integration
- **FR-034**: System MUST process one-time purchases via external payment system without app store involvement
- **FR-035**: System MUST display blog posts with data insights (e.g., injury correlation statistics)

#### User Role Management

- **FR-036**: System MUST automatically assign user roles based on subscription and payment status
- **FR-037**: System MUST grant trainer privileges to users who have active trainer subscriptions
- **FR-038**: System MUST default new users to client role until trainer status is activated

#### Security & Privacy

- **FR-039**: System MUST implement end-to-end encryption for all trainer-client communications
- **FR-040**: System MUST anonymize all performance and music correlation data
- **FR-041**: System MUST provide users granular control over data collection and retention
- **FR-042**: System MUST comply with GDPR (European Union) and CCPA (California) data protection regulations
- **FR-043**: System MUST allow complete data deletion upon user request within 30 days

### Key Entities

- **OAuth Token**: Represents authentication credentials for music services (access token, refresh token, expiration, provider type)
- **Music Metadata**: Anonymous correlation data linking music characteristics (BPM, genre) to workout performance metrics
- **Payment Transaction**: Record of trainer-client financial exchanges including amounts, commission splits, and program access grants
- **Encrypted Message**: End-to-end encrypted communication between trainers and clients containing payment links and program discussions
- **Strain Event**: Real-time monitoring data capturing user exertion levels and threshold breaches for safety alerts
- **Program Access**: User permissions and unlocked content based on successful payment verification
- **Privacy Preference**: User-controlled settings for data collection, retention periods, and integration toggles
- **Platform Context**: Device-specific interface state determining available features (mobile workout tracking vs web dashboard)
- **3D Avatar Model**: Interactive AI coaching representation (Alice/Aiden) with fade-in animations and contextual guidance
- **Trainer Dashboard State**: Tablet-specific interface showing client lists, strain monitoring, and real-time alert management
- **User Role**: Subscription-based role assignment determining access to trainer features (client by default, trainer with active subscription)

---

## Clarifications

### Session 2025-09-28
- Q: Which data protection regulations must the system comply with? → A: GDPR + CCPA (EU and California)
- Q: What is the maximum timeframe for complete data deletion upon user request? → A: 30 days (GDPR/CCPA standard)
- Q: What should happen when the system approaches the 10,000 concurrent user limit? → A: Auto-scaling - increase capacity automatically
- Q: How should the system handle OAuth token expiration during active workout sessions? → A: Auto-refresh tokens silently in background
- Q: How are user roles (trainer vs client) determined and managed? → A: Automatic based on subscription/payment status

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain (all clarifications resolved)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated (43 functional requirements)
- [x] Entities identified (11 key entities)
- [x] Review checklist passed

---
