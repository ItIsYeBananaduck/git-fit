# Tasks: Adaptive Fit Codebase Audit and Refactor

**Input**: Design documents from `/specs/020-adaptive-fit-codebase/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```bash
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Web app with mobile**: `app/src/` (SvelteKit), `api/` (FastAPI), `app/` (Python AI)
- **Documentation**: `specs/020-adaptive-fit-codebase/`
- Paths shown below follow the detected structure

## Phase 3.1: Setup

- [x] T001 Create audit workspace structure per implementation plan
- [x] T002 Initialize TypeScript/Python project dependencies (SvelteKit, Convex, FastAPI, Llama 3.1)
- [x] T003 [P] Configure linting and formatting tools for TypeScript/JavaScript/Python

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

### CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation

- [ ] T004 [P] Contract test for audit-data-structures.md in specs/020-adaptive-fit-codebase/tests/test_audit_data_contracts.ts
- [ ] T005 [P] Contract test for constitution-compliance.md in specs/020-adaptive-fit-codebase/tests/test_constitution_compliance_contracts.ts
- [ ] T006 [P] Contract test for copilot-instructions.md in specs/020-adaptive-fit-codebase/tests/test_copilot_instructions_contracts.ts
- [ ] T007 [P] Integration test for 15-minute audit process in specs/020-adaptive-fit-codebase/tests/test_quickstart_audit.ts
- [ ] T008 [P] Integration test for constitution alignment check in specs/020-adaptive-fit-codebase/tests/test_constitution_alignment.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [ ] T009 [P] AuditReport entity model in app/src/lib/models/AuditReport.ts
- [ ] T010 [P] FeatureTask entity model in app/src/lib/models/FeatureTask.ts
- [ ] T011 [P] ConstitutionViolation entity model in app/src/lib/models/ConstitutionViolation.ts
- [ ] T012 [P] ImplementationGap entity model in app/src/lib/models/ImplementationGap.ts
- [ ] T013 [P] Conflict entity model in app/src/lib/models/Conflict.ts
- [ ] T014 [P] AuditCriteria entity model in app/src/lib/models/AuditCriteria.ts
- [ ] T015 [P] Recommendation entity model in app/src/lib/models/Recommendation.ts
- [ ] T016 AuditReportService CRUD operations in app/src/lib/services/AuditReportService.ts
- [ ] T017 FeatureTaskService CRUD operations in app/src/lib/services/FeatureTaskService.ts
- [ ] T018 ConstitutionViolationService CRUD operations in app/src/lib/services/ConstitutionViolationService.ts
- [ ] T019 ImplementationGapService CRUD operations in app/src/lib/services/ImplementationGapService.ts
- [ ] T020 ConflictService CRUD operations in app/src/lib/services/ConflictService.ts
- [ ] T021 RecommendationService CRUD operations in app/src/lib/services/RecommendationService.ts
- [ ] T022 Audit data validation logic in app/src/lib/validation/auditValidators.ts
- [ ] T023 Constitution compliance validation logic in app/src/lib/validation/constitutionValidators.ts
- [ ] T024 Audit report generation logic in app/src/lib/utils/auditReportGenerator.ts
- [ ] T025 Constitution alignment checker in app/src/lib/utils/constitutionChecker.ts

## Phase 3.4: Integration

- [ ] T026 Connect audit services to Convex database schema
- [ ] T027 Implement audit data persistence layer
- [ ] T028 Add constitution compliance middleware
- [ ] T029 Implement audit trail logging for all operations
- [ ] T030 Add error handling and audit failure recovery

## Phase 3.5: Polish

- [ ] T031 [P] Unit tests for audit data validation in app/tests/unit/test_audit_validation.test.ts
- [ ] T032 [P] Unit tests for constitution validators in app/tests/unit/test_constitution_validation.test.ts
- [ ] T033 [P] Unit tests for audit report generator in app/tests/unit/test_audit_generator.test.ts
- [ ] T034 Performance tests for audit operations (<200ms target)
- [ ] T035 [P] Update audit documentation in specs/020-adaptive-fit-codebase/README.md
- [ ] T036 [P] Create audit API documentation in specs/020-adaptive-fit-codebase/api.md
- [ ] T037 Remove code duplication in audit utilities
- [ ] T038 Run manual audit validation checklist

## Dependencies

- Tests (T004-T008) before implementation (T009-T025)
- T009-T015 blocks T016-T021 (models before services)
- T016-T021 blocks T022-T025 (services before utilities)
- T022-T025 blocks T026-T030 (core before integration)
- Implementation before polish (T031-T038)

## Parallel Example

```bash
# Launch T004-T008 together (all contract and integration tests):
Task: "Contract test for audit-data-structures.md in specs/020-adaptive-fit-codebase/tests/test_audit_data_contracts.ts"
Task: "Contract test for constitution-compliance.md in specs/020-adaptive-fit-codebase/tests/test_constitution_compliance_contracts.ts"
Task: "Contract test for copilot-instructions.md in specs/020-adaptive-fit-codebase/tests/test_copilot_instructions_contracts.ts"
Task: "Integration test for 15-minute audit process in specs/020-adaptive-fit-codebase/tests/test_quickstart_audit.ts"
Task: "Integration test for constitution alignment check in specs/020-adaptive-fit-codebase/tests/test_constitution_alignment.ts"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Constitution v2.0.0 compliance required for all implementations
- Focus on safety/privacy and scalability principles first

## Task Generation Rules

### Applied during main() execution

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each validation contract → implementation task

2. **From Data Model**:
   - Each entity → model creation task [P]
   - Each entity → service CRUD task
   - Validation rules → validator implementation

3. **From User Stories**:
   - Each audit scenario → integration test [P]
   - Quickstart process → validation task

4. **Ordering**:
   - Setup → Tests → Models → Services → Utilities → Integration → Polish
   - Constitution compliance validation integrated throughout

## Validation Checklist

### GATE: Checked by main() before returning

- [ ] All contracts have corresponding tests (T004-T006)
- [ ] All entities have model tasks (T009-T015)
- [ ] All entities have service tasks (T016-T021)
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
- [ ] Constitution compliance validation integrated
