# GitHub Copilot Instructions: Adaptive Fit Codebase Audit

**Feature**: 020-adaptive-fit-codebase  
**Context**: Comprehensive audit and refactor of Adaptive Fit application  
**Priority**: Constitution v2.0.0 compliance and feature completeness

## Core Mission

You are conducting a comprehensive audit of the Adaptive Fit fitness application codebase. Your primary objectives are:

1. **Identify Implementation Status**: Determine which of the 18 identified tasks are implemented, need refinement, or are missing
2. **Ensure Constitution Compliance**: Verify all implementations align with the 7 core constitution principles
3. **Resolve Conflicts**: Address conflicts between existing code and constitution requirements
4. **Generate Actionable Report**: Create detailed audit report with specific recommendations

## Constitution Framework (Version 2.0.0)

All decisions and recommendations must align with these 7 core principles:

### I. User-Centric Design

- WCAG 2.1 AA accessibility
- Injury-aware coaching (stop if pain >3/10)
- Intuitive UI for all user levels
- Real-time wearable integration

### II. Adaptability & Learning

- Llama 3.1 8B (4-bit) local AI only
- ~80% accuracy target by week 3
- Rule-based fallbacks
- PubMed guideline integration

### III. Cost-Effectiveness

- Fly.io free tier + Tigris storage
- $10-15/month budget for 1,000-10,000 users
- 1-2GB image size optimization

### IV. Scalability & Performance

- 1-10,000 concurrent users
- <200ms API, <500ms client response
- 30 FPS animations, 100% uptime

### V. Safety & Privacy

- HIPAA/GDPR/CCPA compliance
- bcrypt, JWT, 2FA, AES-256/TLS 1.3
- User-controlled data management

### VI. Engagement & Gamification

- Achievements, XP, milestones
- 3D Alice/Aiden avatars
- Llama-driven animations

### VII. Data Ethics & Transparency

- Transparent AI decisions
- User consent and audit trails
- Clear data preferences

## 18 Feature Tasks Audit Framework

### Core Fitness Features (1-4)

1. **Workout Tracking**: Session management, exercise logging, performance analytics
2. **Nutrition Management**: Meal planning, macro tracking, AI recommendations
3. **Recovery Monitoring**: HRV, sleep, stress via wearables
4. **Progress Analytics**: Trends, goals, achievement system

### AI & Personalization (5-8)

5. **Adaptive Workouts**: Llama-powered exercise adjustments
6. **Nutrition AI**: Recovery-aware meal planning
7. **Voice Coaching**: ElevenLabs Alice/Aiden avatars
8. **Music Integration**: Spotify/Apple Music workout playlists

### Platform Features (9-12)

9. **Trainer Marketplace**: Program creation, commission system
10. **User Marketplace**: Template sharing, premium content
11. **Wearable Integration**: Apple Watch, Whoop, Fitbit, Garmin, Oura
12. **Cross-Platform Sync**: iOS/Android/Web data synchronization

### Advanced Features (13-18)

13. **OAuth Ecosystem**: Multi-provider authentication
14. **Security & Privacy**: HIPAA compliance, data controls
15. **Gamification**: Achievements, adaptive UI
16. **Offline Capability**: Local storage and sync
17. **Real-time Collaboration**: Trainer-client interactions
18. **AI Learning System**: User preference adaptation

## Audit Methodology

### Implementation Status Criteria

- **✅ Implemented**: Code exists, runs without errors, meets requirements, constitution-aligned
- **🔄 Needs Refinement**: Partial implementation or misaligned
- **❌ Missing**: Not implemented

### Constitution Alignment Check

For each feature, verify compliance with all applicable principles:

- Cross-reference against constitution requirements
- Identify specific violations with evidence
- Prioritize by safety/privacy > scalability > other principles

### Conflict Resolution Priority

1. **Safety/Privacy First**: HIPAA, data security, injury prevention
2. **Scalability Second**: Performance, cost, user limits
3. **Other Principles**: User experience, adaptability, engagement

## Evidence Collection Requirements

### Code Evidence

- File paths and line numbers
- Function/class names
- Import statements
- Configuration settings

### Test Evidence

- Unit test results
- Integration test coverage
- Performance benchmarks
- Security audit results

### Constitution Evidence

- Specific principle references
- Requirement citations
- Compliance verification methods

## Report Structure Requirements

### Executive Summary

- Total features: 18
- Implementation status breakdown
- Constitution violation count
- Critical issues summary

### Detailed Findings

- **Implemented Features**: Verification evidence, constitution alignment
- **Needs Refinement**: Specific issues, required changes
- **Missing Features**: Requirements, dependencies, effort estimates

### Constitution Compliance

- **Violations by Principle**: Detailed findings with evidence
- **Remediation Plans**: Actionable steps with timelines
- **Risk Assessment**: Impact of non-compliance

### Recommendations

- **Priority Actions**: Safety/privacy fixes first
- **Implementation Plan**: Dependencies and sequencing
- **Success Metrics**: Measurable completion criteria

## Critical Focus Areas

### 🚨 Immediate Action Required

- **AI Migration**: Replace ALL DistilGPT-2 with Llama 3.1 8B
- **HIPAA Compliance**: Implement missing security controls
- **Performance Optimization**: Reduce bundle size, optimize queries
- **Cost Management**: Ensure free tier compliance

### 🔍 Investigation Required

- **Mixed AI Usage**: Scan for inconsistent model implementations
- **Bundle Size**: Verify <2GB Capacitor app size
- **Real-time Usage**: Check Convex free tier compliance
- **Security Gaps**: Audit data handling and privacy controls

## Communication Guidelines

### Issue Reporting

- **Specific Evidence**: Always include file paths, code references
- **Constitution Links**: Reference specific principles and requirements
- **Impact Assessment**: Explain user/business impact of issues
- **Actionable Solutions**: Provide specific, implementable fixes

### Priority Classification

- **Critical**: Safety risks, legal compliance, system-breaking issues
- **High**: Performance degradation, user experience blockers
- **Medium**: Feature gaps, optimization opportunities
- **Low**: Code quality, documentation improvements

## Success Criteria

### Audit Completion

- All 18 features assessed against criteria
- Constitution compliance verified for each principle
- Conflicts identified with resolution strategies
- Actionable recommendations with priorities

### Quality Standards

- Evidence-based findings only
- Constitution-driven recommendations
- Testable acceptance criteria
- Measurable success metrics

---

**Remember**: Constitution v2.0.0 supersedes all other requirements. Safety and privacy first, then scalability, then all other considerations.
