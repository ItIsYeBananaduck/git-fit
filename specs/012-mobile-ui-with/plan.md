
# Implementation Plan: Mobile UI with Dark Mode, Liquid Glass Effects, and Complete App Flow

**Branch**: `012-mobile-ui-with` | **Date**: September 30, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-mobile-ui-with/spec.md`

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
Primary requirement: Complete mobile UI redesign with dark theme, liquid glass effects, haptic feedback, and responsive design supporting both phone and tablet layouts for fitness tracking, nutrition logging, and trainer-client interactions. Technical approach involves extending existing SvelteKit + Convex + Capacitor stack with enhanced styling, biometric authentication, and comprehensive unit system support.

## Technical Context
**Language/Version**: TypeScript 5.0+, JavaScript ES2022 + SvelteKit 2.22+, Convex 1.27+, Capacitor 7.4+  
**Primary Dependencies**: Svelte, Capacitor, Tailwind CSS 4.1+, @capacitor/haptics, @capacitor/biometric-auth, @capacitor/camera  
**Storage**: Convex real-time database with localStorage fallback for offline capability  
**Testing**: Vitest for unit tests, Playwright for integration, Capacitor test suite for mobile  
**Target Platform**: iOS 15+, Android 8+ via Capacitor, responsive web via SvelteKit  
**Project Type**: mobile - Capacitor hybrid app with API backend  
**Performance Goals**: 60fps animations, <500ms UI response, <2s data loading, <10s barcode scans  
**Constraints**: Dark theme only, liquid glass styling, haptic feedback required, offline capability, biometric auth  
**Scale/Scope**: Complete app redesign covering 10+ screens, 37 functional requirements, 5 fitness goals, Imperial/Metric units

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**User-Centric Design**: ✅ PASS - Comprehensive mobile UI prioritizes user experience with intuitive dark theme, haptic feedback, and responsive design for all user types (novice to advanced, trainers)

**Adaptability and Learning**: ✅ PASS - Integrates with existing AI system, maintains workout feedback logging, supports macro adjustments based on user preferences

**Cost-Effectiveness**: ✅ PASS - Extends existing SvelteKit/Convex stack without new infrastructure costs, leverages Capacitor for cross-platform mobile deployment within budget constraints

**Scalability and Performance**: ✅ PASS - Targets 60fps performance, <500ms UI response times, maintains existing architecture scalability, offline capability with sync

**Safety and Privacy**: ✅ PASS - Implements biometric authentication, maintains existing security model, adds 30-day data deletion option, user-controlled data collection toggles

**Engagement and Gamification**: ✅ PASS - Enhanced UI with liquid glass effects, haptic feedback, central orb interactions, maintains existing gamification elements

**Data Ethics & Transparency**: ✅ PASS - Maintains transparent AI decision-making, adds explicit user consent for trainer access, preserves data control mechanisms

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

**Structure Decision**: Option 3: Mobile + API (Capacitor hybrid app with existing Convex backend)

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

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base structure
- Generate tasks from Phase 1 design artifacts (contracts, data model, quickstart scenarios)
- Each API contract endpoint → contract test task [P] (can run in parallel)
- Each entity in data model → model creation task [P] (independent files)
- Each quickstart scenario → integration test task (validates user stories)
- Implementation tasks derived from failing tests (TDD approach)

**Mobile-Specific Task Categories**:
1. **Capacitor Setup Tasks**: Plugin installation, native configuration, platform setup
2. **Dark Theme Tasks**: CSS custom properties, Tailwind configuration, component styling
3. **Liquid Glass Effects**: CSS backdrop-filter implementation, animation optimization
4. **Haptic Integration**: @capacitor/haptics setup, gesture mapping, fallback handling
5. **Biometric Auth**: @capacitor/biometric-auth integration, security flow implementation
6. **Unit System**: Conversion service, real-time updates, preference storage
7. **Responsive Design**: Breakpoint implementation, iPad trainer mode, touch optimization
8. **Offline Sync**: LocalStorage fallback, conflict resolution UI, sync queue management

**Ordering Strategy**:
- **Foundation First**: Capacitor setup, basic styling, theme configuration
- **TDD Order**: Contract tests → failing tests → implementation to make tests pass
- **Dependency Order**: Models → services → UI components → integration
- **Parallel Execution**: Mark independent tasks with [P] for concurrent development
- **Critical Path**: Biometric auth → user profile → core workout/nutrition flows

**Performance Integration**:
- Each implementation task includes performance validation against targets
- Animation tasks require 60fps verification
- API tasks include response time validation (<500ms UI, <2s data, <10s scans)
- Mobile-specific tasks include device testing requirements

**Estimated Task Breakdown**:
- **Setup & Configuration**: 8-10 tasks (Capacitor, plugins, theme setup)
- **Authentication & Security**: 6-8 tasks (biometric flow, session management)
- **Core UI Components**: 12-15 tasks (orb, navigation, liquid glass effects)
- **Workout Features**: 10-12 tasks (session tracking, feedback, vitals integration)
- **Nutrition Features**: 8-10 tasks (barcode scanning, timeline, custom foods)
- **Trainer Mode**: 6-8 tasks (client management, iPad layout, calendar integration)
- **Offline & Sync**: 8-10 tasks (conflict resolution, queue management, storage)
- **Testing & Validation**: 15-20 tasks (unit tests, integration tests, performance tests)

**Total Estimated Output**: 75-95 numbered, prioritized tasks in tasks.md

**Quality Gates per Task**:
- Each task includes acceptance criteria from functional requirements
- Performance targets embedded in task descriptions
- Mobile-specific validation steps (device testing, haptic verification)
- Constitution compliance checks (security, privacy, cost-effectiveness)

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
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
