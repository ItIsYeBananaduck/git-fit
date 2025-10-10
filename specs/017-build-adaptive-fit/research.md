# Research: Build Adaptive Fit

**Date**: October 3, 2025  
**Feature**: 017-build-adaptive-fit

## Research Summary

All technical choices are based on existing git-fit infrastructure and proven implementations. No unknowns requiring external research - leveraging established stack.

## Technology Decisions

### Alice Interface Animation Engine

**Decision**: Continue with SVG + anime.js approach  
**Rationale**: Current implementation already working with clean SVG animations, breathing effects, and 60fps performance. anime.js provides precise animation control needed for Alice's morphing and eye movements.  
**Alternatives considered**: Canvas 2D (rejected - more complex, harder to maintain), CSS-only animations (rejected - insufficient control for adaptive behaviors)

### Real-time Data Architecture

**Decision**: Convex real-time subscriptions + reactive Svelte stores  
**Rationale**: Existing Convex backend provides real-time updates perfect for Alice's adaptive responses. Svelte's reactivity naturally handles Alice state changes.  
**Alternatives considered**: WebSocket polling (rejected - Convex handles this better), Server-sent events (rejected - less robust than Convex subscriptions)

### Subscription Tier Management

**Decision**: Convex schema with user subscription fields + client-side feature gating  
**Rationale**: Extends existing user system. Simple field-based checks for Alice customization and feature access.  
**Alternatives considered**: External subscription service (rejected - unnecessary complexity for beta), JWT claims (rejected - Convex auth sufficient)

### Mobile Cross-platform Strategy

**Decision**: Capacitor 7.4+ with existing SvelteKit PWA  
**Rationale**: Already configured in project. Provides native mobile access for background heart rate monitoring and notifications.  
**Alternatives considered**: Native iOS/Android (rejected - development overhead), React Native (rejected - different tech stack)

### Performance Optimization

**Decision**: SVG animation throttling + Convex query optimization + localStorage caching  
**Rationale**: Target 10,000 concurrent users requires efficient Alice rendering and data management. localStorage handles user preferences, Convex optimizes real-time queries.  
**Alternatives considered**: Redis caching (rejected - adds infrastructure), WebGL rendering (rejected - overkill for 2D Alice)

### Community Features Backend

**Decision**: Extend existing Convex schema with voting, exercise libraries, and marketplace tables  
**Rationale**: Leverages existing database and auth system. Natural fit for real-time voting and team features.  
**Alternatives considered**: Separate microservice (rejected - unnecessary complexity), Firebase (rejected - already on Convex)

## Integration Patterns

### Alice State Management

- Global Svelte store for Alice appearance/behavior
- Convex subscription for user performance data
- Local state for animation timing and visual effects

### Background Monitoring

- Capacitor's background plugins for heart rate tracking
- Service worker for 5-minute interval checks
- Local notification API for workout/play/ignore prompts

### Marketplace Architecture

- Convex tables for seller/buyer relationships
- File download handling via existing static asset patterns
- Revenue tracking through Convex computed fields

## Implementation Approach

### Phase 1: Alice Interface Enhancement

Extend existing alice-demo with subscription tiers, mode blooming, and customization options.

### Phase 2: Adaptive Engine Integration

Connect Alice to existing workout tracking with calibration triggers and intensity monitoring.

### Phase 3: Community Features

Build voting, team posts, and exercise approval workflows on Convex backend.

### Phase 4: Marketplace Integration

Add video marketplace with download management and revenue tracking.

### Phase 5: Background Monitoring

Implement heart rate tracking and activity classification via Capacitor.

## Risk Mitigation

### Performance Risks

- SVG animation performance at scale → throttling and animation pooling
- Convex query limits → optimize subscriptions and use computed fields
- Mobile battery usage → efficient background monitoring intervals

### User Experience Risks

- Alice customization complexity → start with 10 simple patterns
- Subscription tier confusion → clear visual indicators and progressive disclosure
- Community moderation overhead → automated trainer approval workflows

## No External Dependencies Required

All research confirmed existing technology stack sufficient for requirements. No additional external APIs, services, or major dependencies needed beyond current git-fit architecture.
