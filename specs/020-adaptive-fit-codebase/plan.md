# Implementation Plan: Adaptive Fit Codebase Audit and Refactor

**Branch**: `020-adaptive-fit-codebase` | **Date**: October 10, 2025 | **Spec**: specs/020-adaptive-fit-codebase/spec.md
**Input**: Feature specification from `/specs/020-adaptive-fit-codebase/spec.md`

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

Comprehensive audit and refactor of the Adaptive Fit codebase to ensure all 18 identified tasks are properly implemented and aligned with Constitution v2.0.0. The audit will identify implemented features, missing functionality, and conflicts between existing implementations and constitutional requirements, with priority given to safety/privacy and scalability concerns.

## Technical Context

**Language/Version**: TypeScript 5.0+, JavaScript ES2022, Python 3.10+
**Primary Dependencies**: SvelteKit 2.22+, Convex 1.27+, Capacitor 7.4+, Llama 3.1 8B (4-bit), FastAPI, Fly.io
**Storage**: Convex (real-time), IndexedDB (offline), localStorage (preferences), Tigris (files)
**Testing**: Vitest, Playwright, Python testing frameworks
**Target Platform**: Web (SvelteKit), Mobile (Capacitor iOS/Android), Backend (Fly.io)
**Project Type**: Web application with mobile support (SvelteKit frontend + Capacitor mobile + Fly.io backend)
**Performance Goals**: <200ms API response, <500ms client response, 30 FPS animations, 100% uptime
**Constraints**: $10-15/month budget, 1-2GB bundle size, HIPAA/GDPR compliance, Llama 3.1 local AI only
**Scale/Scope**: 1-10,000 users, 18 feature tasks, constitution-driven development

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### ✅ Compliance Confirmed

- **User-Centric Design**: Audit framework includes accessibility and injury-aware requirements
- **Adaptability & Learning**: Llama 3.1 8B migration and local AI enforcement
- **Cost-Effectiveness**: Fly.io free tier and budget constraints validation
- **Scalability & Performance**: Performance targets and user scale requirements
- **Safety & Privacy**: HIPAA compliance and data security focus
- **Engagement & Gamification**: Achievement and avatar system requirements
- **Data Ethics & Transparency**: Consent and audit trail requirements

### Constitution-Driven Approach

This audit feature is designed to ENFORCE constitution compliance across all 18 tasks, making it inherently aligned with all 7 core principles. No violations detected - this is a governance and compliance feature that will strengthen overall constitution adherence.

## Project Structure

### Documentation (this feature)

```bash
specs/020-adaptive-fit-codebase/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── audit-data-structures.md
│   ├── constitution-compliance.md
│   └── copilot-instructions.md
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```bash
# Web application with mobile support (detected: SvelteKit + Capacitor + Fly.io)
app/                    # SvelteKit frontend + Capacitor mobile
├── src/               # Frontend source
├── convex/            # Real-time database
├── android/           # Android mobile
├── ios/               # iOS mobile
└── tests/             # Frontend tests

api/                   # FastAPI backend (if needed)
├── server.js          # Node.js API
└── tests/

app/                   # Python AI services
├── ai_*.py           # AI processing modules
└── tests/
```

**Structure Decision**: Web application with mobile support (Option 2) - SvelteKit frontend with Capacitor mobile wrapper and Fly.io backend services detected.

## Phase 0: Outline & Research

**Status**: ✅ COMPLETE - research.md created with comprehensive codebase analysis

1. **Extract unknowns from Technical Context**:
   - ✅ Constitution v2.0.0 principles researched and documented
   - ✅ Technology stack (SvelteKit, Convex, Capacitor, Llama 3.1) analyzed
   - ✅ 18 feature tasks identified and categorized
   - ✅ Implementation criteria defined (implemented/needs refinement/missing)

2. **Generate and dispatch research agents**:
   - ✅ Codebase scan completed - identified 2331-line schema, mixed AI usage
   - ✅ Constitution alignment analysis - critical gaps in Llama migration, HIPAA compliance
   - ✅ Performance assessment - bundle size concerns, real-time usage analysis

3. **Consolidate findings** in `research.md`:
   - ✅ Advanced architecture confirmed (modern tech stack, sophisticated features)
   - ✅ Constitution drift identified (AI migration required, security gaps)
   - ✅ Audit priorities established (safety first, then scalability)

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

**Status**: ✅ COMPLETE - All Phase 1 artifacts created

1. **Extract entities from feature spec** → `data-model.md`:
   - ✅ AuditReport, FeatureTask, ConstitutionViolation entities defined
   - ✅ Validation rules and business logic specified
   - ✅ Data flow and relationships documented

2. **Generate API contracts** from functional requirements:
   - ✅ audit-data-structures.md: Data validation contracts
   - ✅ constitution-compliance.md: Constitution validation contracts
   - ✅ Contract interfaces with TypeScript definitions

3. **Generate contract tests** from contracts:
   - ✅ Validation rules specified for all data structures
   - ✅ Error conditions documented
   - ✅ Business rule constraints defined

4. **Extract test scenarios** from user stories:
   - ✅ 15-minute quickstart guide created
   - ✅ Step-by-step audit process documented
   - ✅ Common issues and solutions provided

5. **Update agent file incrementally**:
   - ✅ copilot-instructions.md created for GitHub Copilot
   - ✅ Constitution framework and audit methodology documented
   - ✅ 18 feature tasks and success criteria specified

**Output**: data-model.md, /contracts/\*, quickstart.md, copilot-instructions.md

## Phase 2: Task Planning Approach

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract validation task [P]
- Each entity → audit implementation task [P]
- Each constitution principle → compliance verification task
- Implementation tasks to address identified gaps

**Ordering Strategy**:

- Constitution-first order: Safety/privacy tasks before others
- Evidence-based order: Code scanning before detailed analysis
- Parallel execution: Independent feature audits can run concurrently [P]

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

No violations detected - this audit feature strengthens constitution compliance

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented---
      _Based on Constitution v2.0.0 - See `.specify/memory/constitution.md`_
