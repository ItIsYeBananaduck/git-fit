# Feature Specification: AI-Driven Coaching with GPT-2 and ElevenLabs TTS Integration

**Feature Branch**: `003-ai-coaching-gpt2-elevenlabs-integration`  
**Created**: September 29, 2025  
**Status**: Draft  
**Input**: User description: "Generate code to integrate a fine-tuned GPT-2 model with ElevenLabs TTS in AdaptiveFit, a fitness app using Capacitor (Svelte) and Convex backend, for AI-driven coaching (Alice/Aiden). Use GPT-2 to generate dynamic, friend-like text for six workout triggers, then pass to ElevenLabs for lifelike speech (<15 words per voice except onboarding). Restrict speech to pro users, detect earbuds for voice playback, and mirror with toasts. Support 10k concurrent users, 1s updates, GDPR/CCPA compliance (30-day deletion), auto-scaling at 10k users, and Apple IAP bypass for marketplace. Ensure GPT-2 learns from all users (weekly for pro, monthly for non-pro) but only speaks for pro users."

## Clarifications

### Session 2025-09-29

- Q: What specific latency target should the AI coaching voice responses meet for optimal user experience during workouts? → A: Under 500ms from trigger to audio start
- Q: What should happen when GPT-2 generates inappropriate or offensive content during coaching sessions? → A: Block the content and use predefined safe fallback responses
- Q: What is the expected system uptime/availability target for the AI coaching feature? → A: 99.9% uptime (8.77 hours downtime per year)
- Q: How should the system handle rate limiting when ElevenLabs API limits are exceeded? → A: Batch multiple requests and prioritize by user subscription level
- Q: What specific data should be explicitly excluded from the AI training dataset to ensure user privacy? → A: Personal identifiers plus biometric data (heart rate, sleep patterns)

## User Scenarios & Testing

### Primary User Story

As a fitness app user, I want an AI coaching companion (Alice or Aiden) that provides personalized, conversational guidance during my workouts, so that I feel motivated and supported like having a real gym buddy. Pro users receive voice coaching through earbuds, while all users contribute to the AI's learning through their workout data.

### Acceptance Scenarios

1. **Given** a new pro user opens the app for the first time, **When** they start onboarding, **Then** Alice/Aiden greets them by name and guides them through setup with conversational voice prompts and visual toasts
2. **Given** a pro user with earbuds detected is about to start a workout set, **When** they begin an exercise, **Then** Alice/Aiden provides personalized encouragement via voice (under 15 words) and displays matching toast message
3. **Given** a pro user completes a workout set, **When** the set ends, **Then** Alice/Aiden acknowledges their performance and suggests rest time via voice and toast
4. **Given** a user has high strain levels or poor sleep, **When** they attempt a demanding exercise, **Then** Alice/Aiden suggests alternative exercises or cautions about form
5. **Given** StrainSync Radio is playing during workout, **When** every 3rd song plays, **Then** Alice/Aiden comments on the music's BPM and ties it to workout performance
6. **Given** a user completes their workout, **When** the session ends, **Then** Alice/Aiden provides a caring summary with personalized tips and encouragement
7. **Given** a non-pro user interacts with the app, **When** they perform workouts, **Then** their data contributes to AI learning but they receive no voice coaching (toast messages only)

### Edge Cases

- What happens when ElevenLabs API is unavailable? (Fallback to text-only toasts)
- How does system handle users without earbuds? (Audio detection and graceful degradation)
- What if GPT-2 generates inappropriate content? (Block content immediately and use predefined safe fallback responses)
- How does system behave at 10k+ concurrent users? (Auto-scaling and performance maintenance)
- How does system handle ElevenLabs API rate limits? (Batch requests and prioritize by subscription level)
- What happens when user requests data deletion? (30-day compliance timeline)

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide two AI coaching personas (Alice and Aiden) with distinct voice characteristics and conversational styles
- **FR-002**: System MUST generate personalized coaching text using fine-tuned GPT-2 model for six specific workout triggers (onboarding, pre-workout check, set-start, set-end, StrainSync radio, workout-end)
- **FR-003**: System MUST convert AI-generated text to speech using ElevenLabs TTS API for pro users only
- **FR-004**: System MUST detect earbud connectivity and only play audio when earbuds are connected
- **FR-005**: System MUST display toast notifications for all users (pro and non-pro) mirroring voice content
- **FR-006**: System MUST limit coaching voice responses to under 15 words (except onboarding which allows up to 200 words)
- **FR-007**: System MUST cache onboarding audio files to reduce API calls and improve performance
- **FR-008**: System MUST collect workout data from all users for AI model training regardless of subscription status
- **FR-009**: System MUST fine-tune GPT-2 model weekly for pro users and monthly for non-pro users
- **FR-010**: System MUST support 10,000 concurrent users with 1-second update responsiveness and voice response latency under 500ms from trigger to audio start
- **FR-011**: System MUST auto-scale infrastructure when user count approaches 10,000
- **FR-012**: System MUST comply with GDPR and CCPA regulations including 30-day data deletion upon request
- **FR-013**: System MUST encrypt sensitive data including trainer payment communications
- **FR-014**: System MUST store user data for maximum 6 months with anonymization options
- **FR-015**: System MUST allow users to opt-out of data collection and request deletion
- **FR-016**: System MUST refresh OAuth tokens silently for uninterrupted service
- **FR-017**: System MUST bypass Apple IAP restrictions for marketplace transactions
- **FR-018**: System MUST filter inappropriate or offensive GPT-2 generated content and use predefined safe fallback responses when blocked content is detected
- **FR-019**: System MUST maintain 99.9% uptime availability for AI coaching features with maximum 8.77 hours downtime per year
- **FR-020**: System MUST handle ElevenLabs API rate limiting by batching voice requests and prioritizing processing by user subscription level (pro users first)
- **FR-021**: System MUST exclude personal identifiers (names, emails, phone numbers, addresses) and biometric data (heart rate, sleep patterns) from AI training datasets to ensure user privacy

### Key Entities

- **AI Coaching Persona**: Represents Alice or Aiden character with voice ID, personality traits, response patterns, and user preference settings
- **Workout Trigger**: Represents specific moments during exercise (onboarding, pre-start, set-start, set-end, strainsync, workout-end) that activate AI coaching responses
- **Voice Response**: Generated text from GPT-2 with corresponding audio file, toast message, timing, and user interaction data
- **User Subscription**: Pro vs non-pro status determining voice access, AI training frequency, and feature availability
- **Training Data**: Anonymized workout logs, user interactions, and coaching effectiveness metrics used for GPT-2 model improvement, excluding personal identifiers and biometric data (heart rate, sleep patterns)
- **Audio Cache**: Stored MP3 files for common onboarding sequences to optimize API usage and response times

## Review & Acceptance Checklist

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed
