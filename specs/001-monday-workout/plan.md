
# Implementation Plan: Monday Workout Intensity Analysis Enhancement

**Branch**: `001-monday-workout` | **Date**: 2025-09-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-monday-workout/spec.md`

## 🚨 **CRITICAL DISCOVERY: EXISTING IMPLEMENTATION FOUND**

**Constitutional Compliance**: Following Constitution v1.2.0 - "Existing Code Analysis" principle, we discovered substantial Monday workout functionality already exists. This plan has been revised from greenfield implementation to enhancement and gap analysis.

## Execution Flow (Audit-First Approach)
```
1. AUDIT existing Monday workout infrastructure ✓
2. Compare existing functionality with specification requirements
3. Identify gaps and enhancement opportunities
4. Plan minimal changes to meet specification compliance
5. Preserve existing user data and workflows
6. Extend rather than replace existing systems
```

## Summary
**EXISTING SYSTEM DISCOVERED**: Substantial Monday workout functionality already implemented in `app/src/lib/stores/mondayWorkoutData.ts` with intensity calculation, SHA-256 hashing, volume adjustments, and user feedback. This plan shifts from greenfield development to **enhancement and gap analysis** to meet specification requirements while preserving existing functionality and user data.

## Existing Infrastructure Audit

### ✅ **Already Implemented (90% Complete)**

**Core Monday Service** (`mondayWorkoutData.ts`):
- ✅ Intensity calculation algorithm (base 50% + components)
- ✅ SHA-256 hashing for secure data transmission
- ✅ Volume adjustment rules (5-10% reductions for intensity >100%)
- ✅ User feedback system (5 standardized options)
- ✅ Weekly processing with localStorage management
- ✅ Health data integration patterns (HR, SpO2, sleep)
- ✅ Automatic Monday detection and processing trigger
- ✅ Calorie estimation using MET calculations

**UI Integration** (`routes/workouts/+page.svelte`):
- ✅ Monday data logging connected to workout completion
- ✅ User feedback collection implemented
- ✅ Monday notification system in place

**Advanced Features**:
- ✅ Mental stress detection (HR spike + SpO2 drop + no reps)
- ✅ Health data mismatch detection for review flags
- ✅ Display message generation for user updates
- ✅ Strain score calculations

### 🔍 **Gap Analysis - Specification vs Implementation**

| Specification Requirement | Current Status | Gap |
|---------------------------|---------------|-----|
| FR-001: Collect workout data (reps, sets, weight, time, calories) | ✅ **COMPLETE** | None |
| FR-002: User feedback (5 standardized options) | ✅ **COMPLETE** | None |
| FR-003: HealthKit/Health Connect integration | ⚠️ **PARTIAL** | Need Capacitor health plugins |
| FR-004: Intensity calculation (0-100%, base 50% + components) | ✅ **COMPLETE** | None |
| FR-005: Monday processing | ✅ **COMPLETE** | None |
| FR-006: Volume adjustments (5-10% for intensity >100% or easy killer + strain >95%) | ✅ **COMPLETE** | None |
| FR-007: SHA-256 hashing | ✅ **COMPLETE** | None |
| FR-008: Secure backend storage, wipe local cache | ⚠️ **PARTIAL** | Need Convex integration |
| FR-009: Display Monday updates to users | ✅ **COMPLETE** | None |
| FR-010: Flag workouts for review (mismatch patterns) | ✅ **COMPLETE** | None |
| FR-011: Hard-coded progression drops (HR spike + SpO2 drop) | ✅ **COMPLETE** | None |
| FR-012: Handle missing workout data (drop progression, 50% intensity) | ✅ **COMPLETE** | None |

### 🎯 **Enhancement Needed (10% Remaining)**

**Priority 1: Backend Integration**
- Connect existing hash generation to Convex storage
- Implement Monday scheduled action in Convex
- Add backend endpoints for intensity data retrieval

**Priority 2: Mobile Health Integration** 
- Add Capacitor health plugins for HealthKit/Health Connect
- Update health data collection to use native APIs instead of mock data

**Priority 3: UI Enhancements**
- Create dedicated Monday updates display component
- Integrate with existing workout pages for feedback collection

## Technical Context
**Language/Version**: TypeScript 5.0+, JavaScript ES2022 (existing codebase)  
**Primary Dependencies**: SvelteKit 2.22+, Convex 1.27+, Capacitor 7.4+, Web Crypto API  
**Storage**: Convex database (existing), localStorage (current implementation)  
**Testing**: Vitest 3.2+, existing test infrastructure  
**Target Platform**: iOS/Android via Capacitor, Web browsers  
**Project Type**: mobile - existing SvelteKit app with Capacitor deployment  
**Performance Goals**: <200ms API response time, <1GB memory usage  
**Constraints**: Extend existing Monday workout system, preserve user data, maintain compatibility  
**Scale/Scope**: **90% already implemented** - focus on 3 enhancement areas: Convex integration, health plugins, UI components

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **User-Centric Design**: Existing system already prioritizes user needs with automatic analysis and fallbacks  
✅ **Adaptability**: Current implementation includes learning from feedback patterns and mismatch detection  
✅ **Cost-Effectiveness**: Minimal enhancements needed (90% complete), leverages existing infrastructure  
✅ **Scalability**: Existing weekly processing architecture scales efficiently  
✅ **Safety & Privacy**: SHA-256 hashing and volume reduction already implemented  
✅ **Engagement**: Display message generation and user feedback system already in place  
✅ **Data Ethics**: Transparent calculations and user control already implemented  
✅ **Existing Code Analysis**: **CRITICAL** - Discovered substantial existing implementation, shifted to enhancement approach

**Constitutional Compliance**: All principles satisfied. **Major constitutional compliance win** - avoiding duplication and leveraging existing investments.

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

**Structure Decision**: [DEFAULT to Option 1 unless Technical Context indicates web/mobile app]

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

## Phase 2: Enhancement Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**REVISED APPROACH**: Focus on **enhancement** rather than greenfield development

**Task Generation Strategy**:
- Load existing `mondayWorkoutData.ts` as foundation
- Generate enhancement tasks for 3 gap areas identified in audit
- Prioritize backend integration and health plugins over UI (existing works)
- Preserve all existing functionality and user data

**Specific Enhancement Categories**:

1. **Backend Integration Tasks** (Priority 1):
   - Create Convex mutation for storing hashed Monday data [P]
   - Create Convex scheduled action for Monday processing [P]
   - Create Convex query for intensity score retrieval [P]
   - Migrate existing localStorage data to Convex
   - Update existing service to call Convex instead of mock backend

2. **Health Plugin Integration Tasks** (Priority 2):
   - Install and configure @capacitor-community/health plugin [P]
   - Create native health data service for HealthKit/Health Connect [P]
   - Update existing health data collection to use native APIs
   - Add permission handling for health data access
   - Test health data integration on iOS/Android

3. **UI Enhancement Tasks** (Priority 3):
   - Create MondayUpdates component based on existing display logic [P]
   - Integrate MondayUpdates with existing workout pages
   - Test existing user feedback collection UI
   - Validate existing Monday notification system

4. **Testing and Validation Tasks**:
   - Test existing intensity calculation against specification [P]
   - Validate existing SHA-256 hashing implementation [P]
   - Test existing volume adjustment rules [P]
   - Create integration tests for Convex backend calls
   - Test health plugin integration end-to-end

**Ordering Strategy**:
- **Enhancement order**: Backend → Health → UI → Testing
- **Preserve existing**: All current functionality must remain working
- **Data migration**: Careful handling of existing localStorage data
- **Mark [P] for parallel execution** where systems don't conflict

**Estimated Task Count**: **12-15 tasks** (vs 28-32 for greenfield) - **50% effort reduction**

**Critical Dependencies**:
- Convex backend must handle existing data formats
- Health plugins must integrate with existing health data structure
- New UI components must not break existing workflows
- All enhancements must be backward compatible

**IMPORTANT**: This approach **extends** rather than **replaces** existing functionality

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
- [x] Phase 0: Existing system audit complete (/plan command)
- [x] Phase 1: Gap analysis and enhancement design complete (/plan command)
- [x] Phase 2: Enhancement task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Enhancement tasks generated (/tasks command)
- [ ] Phase 4: Enhancement implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Audit Constitution Check: PASS  
- [x] Existing Code Analysis: **MAJOR WIN** - 90% functionality already exists
- [x] Enhancement approach validated
- [x] Backward compatibility requirements documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
