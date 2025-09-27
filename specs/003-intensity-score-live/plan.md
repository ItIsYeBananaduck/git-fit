
# Implementation Plan: Intensity Score (Live)

**Branch**: `003-intensity-score-live` | **Date**: September 27, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/003-intensity-score-live/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Real-time workout intensity scoring system combining wearable sensor data (heart rate, SpO₂, accelerometer) with multi-factor algorithm to provide live performance feedback. Includes AI coaching (Alice/Aiden), strain-based recovery management, supplement tracking, and social sharing features for personalized fitness optimization.

## Technical Context
**Language/Version**: TypeScript 5.0+, JavaScript ES2022  
**Primary Dependencies**: SvelteKit 2.22+, Convex 1.27+, Capacitor 7.4+, @felix-health/capacitor-health-data 1.0.9  
**Storage**: Convex database with real-time queries  
**Testing**: Vitest with Playwright browser testing  
**Target Platform**: Web (SvelteKit), Mobile (Capacitor with iOS/Android)  
**Project Type**: Mobile + Web application (hybrid PWA/native)  
**Performance Goals**: <1 second real-time intensity updates, <200ms API response, 1,000-10,000 concurrent users  
**Constraints**: On-device strain calculation (never stored), 99.5% uptime during 5AM-11PM, $0-$10/month budget  
**Scale/Scope**: Real-time workout tracking for 100-1,000 beta users scaling to 10,000, multi-platform health data integration

**Additional Context**: One unified calculation for strain (live/device-only) and one for intensity (backend/stored). Strain uses (0.4 × HR rise) + (0.3 × SpO₂ drop) + (0.3 × recovery delay) formula and stays on device. Intensity uses (tempo × 0.30) + (motionSmoothness × 0.25) + (repConsistency × 0.20) + (userFeedback × 0.15) + (strainModifier × 0.10) and integrates with existing workout data backend.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**✅ I. User-Centric Design**: Real-time intensity feedback with wearable integration prioritizes user safety (strain thresholds) and performance optimization across all skill levels.

**✅ II. Adaptability and Learning**: AI coaching (Alice/Aiden) learns from user feedback and calibrates intensity scoring per individual, targeting accuracy improvements through iterative feedback loops.

**✅ III. Cost-Effectiveness**: Leverages existing SvelteKit/Convex infrastructure, on-device strain calculation eliminates backend storage costs, fits within $0-$10/month budget.

**✅ IV. Scalability and Performance**: <1 second real-time updates meet performance requirements, strain calculation on-device reduces backend load, designed for 1K-10K concurrent users.

**✅ V. Safety and Privacy**: Health data hashed/discarded immediately after calculations, on-device strain processing, supplement tracking with medical data redaction ensures privacy compliance.

**✅ VI. Engagement and Gamification**: Social sharing features, supplement stack comparison, AI coaching personalities provide gamified experience with progress tracking.

**✅ VII. Data Ethics & Transparency**: Clear disclaimers for supplement tracking, user control over sharing settings, transparent AI decision-making with strain-based recommendations.

**✅ VIII. Existing Code Analysis**: Integrates with existing Monday workout intensity system, health data services, and AI coaching infrastructure rather than creating parallel implementations.

**CONSTITUTIONAL COMPLIANCE: PASS** - All principles satisfied with existing infrastructure integration.

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 3 - Mobile + API (Capacitor-based mobile app with SvelteKit web interface, Convex backend)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Implementation Strategy**:

### 1. Convex Backend Foundation (Tasks 1-8)
- **Schema Extension**: Add intensityScores, aiCoachingContext, supplementStacks, supplementItems, socialShares tables
- **Core Functions**: intensity.ts (mutations/queries), coaching.ts, supplements.ts, social.ts  
- **External Actions**: OpenFoodFacts API integration, AI voice generation service calls
- **Scheduled Tasks**: Supplement cleanup, weekly trend calculation, social clustering

### 2. Device-Side Strain Calculation (Tasks 9-12) 
- **Health Data Service**: Integration with @felix-health/capacitor-health-data plugin
- **Strain Calculator**: Real-time calculation engine (never stored, device-only)
- **Mock Data Provider**: Fallback for beta testing without wearables
- **Permission Management**: iOS/Android health data access handling

### 3. Real-Time Intensity Scoring (Tasks 13-18)
- **Scoring Engine**: Component score calculation with strain modifier application
- **Real-Time Updates**: Convex subscription patterns for live score updates  
- **User Feedback Integration**: Easy-killer/challenge post-set feedback system
- **Trainer Overrides**: Uncapped scoring for trainer accounts

### 4. AI Coaching Integration (Tasks 19-24)
- **Coaching Context Manager**: Real-time strain status and calibration phase tracking
- **Voice Output System**: Alice/Aiden personality with earbud-only constraints
- **Calibration Engine**: Week 1 full calibration, ongoing micro-adjustments
- **Zen Mode Implementation**: Minimal audio with haptic feedback only

### 5. Dynamic Rest & Recovery (Tasks 25-28)
- **Rest Period Calculator**: 30-90 second range with strain-based auto-extension  
- **Forgotten Set Detection**: Accelerometer + strain drop pattern recognition
- **Life Pause Filtering**: Gyro-based detection of non-exercise pauses
- **Manual Override System**: User can override auto-extended rest periods

### 6. Supplement Stack Tracking (Tasks 29-34)
- **Barcode Scanner Integration**: OpenFoodFacts API with offline fallback
- **Stack Management**: 28-day lock periods, Week 4 modification windows
- **Medical Compound Detection**: Auto-redaction of Rx items from sharing
- **Performance Correlation**: Track intensity/strain changes vs supplement changes

### 7. Social & Sharing Features (Tasks 35-38)
- **Algorithmic Feed**: Clustering by goals, body feel, training age
- **Content Sharing**: Workout cards, supplement stacks (filtered), exercise demos  
- **Ghost Mode**: Anonymous participation with privacy preservation
- **Like System**: Community engagement without revealing medical data

### 8. Frontend UI Components (Tasks 39-45)
- **Live Intensity Meter**: Real-time scoring display during workouts
- **Strain Indicator**: Green/yellow/red status with trend visualization
- **AI Coaching Panel**: Voice controls, personality selection, coaching history
- **Supplement Management**: Barcode scanning UI, stack editing, sharing controls
- **Social Feed**: Clustered content display, like/interaction system
- **Settings Integration**: Voice intensity slider, Zen mode toggle, privacy controls

### 9. Integration & Testing (Tasks 46-50)
- **End-to-End Tests**: Full workout flow with intensity scoring
- **Real-Time Testing**: WebSocket connection stability and update latency
- **Health Data Testing**: Mock sensor data validation and edge cases  
- **Performance Testing**: 1K-10K concurrent user load simulation
- **Privacy Compliance**: Medical data filtering and retention policy validation

**Task Execution Priorities**:
- **[P] Parallel**: Independent file creation (schema, functions, components)
- **Sequential**: Integration tasks requiring multiple system components
- **Critical Path**: Convex schema → Core functions → Real-time subscriptions → UI components

**Testing Strategy**:
- **TDD Approach**: Write failing tests first, then implement to make them pass
- **Integration Focus**: Test real-time data flow from device sensors to UI updates
- **Mock Data**: Comprehensive fake sensor data for consistent testing
- **Performance Benchmarks**: <1 second intensity updates, <3 second AI coaching responses

**Estimated Scope**: 50 numbered, prioritized tasks in tasks.md with clear dependencies

**Quality Gates**:
- All tests must pass before marking tasks complete
- Real-time performance requirements must be met
- Privacy compliance validated for all data handling paths
- Constitutional principles verified in implementation choices

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command) 
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS (Corrected to use existing Convex backend)
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
