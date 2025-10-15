# Tasks: your-feature-name

**Input**: Design documents from `/specs/feature/your-feature-name/`
**Prerequisites**: plan.md (required), research.md

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
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

## Phase 3.1: Setup

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize project with dependencies
- [ ] T003 [P] Configure linting and formatting tools

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [ ] T004 [P] Contract test for language and version in tests/contract/test_language_version.py
- [ ] T005 [P] Contract test for dependencies in tests/contract/test_dependencies.py
- [ ] T006 [P] Integration test for storage in tests/integration/test_storage.py
- [ ] T007 [P] Integration test for testing framework in tests/integration/test_testing_framework.py

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [ ] T008 [P] Implement language and version setup in src/setup/language_version.py
- [ ] T009 [P] Implement dependency management in src/setup/dependencies.py
- [ ] T010 [P] Implement storage configuration in src/setup/storage.py
- [ ] T011 Implement testing framework setup in src/setup/testing_framework.py

## Phase 3.4: Integration

- [ ] T012 Connect storage to project
- [ ] T013 Integrate testing framework
- [ ] T014 Finalize dependency injection

## Phase 3.5: Polish

- [ ] T015 [P] Unit tests for storage in tests/unit/test_storage.py
- [ ] T016 [P] Unit tests for dependencies in tests/unit/test_dependencies.py
- [ ] T017 [P] Update documentation in docs/setup.md
- [ ] T018 Run manual testing

## Dependencies

- Tests (T004-T007) before implementation (T008-T011)
- T008 blocks T012
- T009 blocks T014
- Implementation before polish (T015-T018)

## Parallel Example

```
# Launch T004-T007 together:
Task: "Contract test for language and version in tests/contract/test_language_version.py"
Task: "Contract test for dependencies in tests/contract/test_dependencies.py"
Task: "Integration test for storage in tests/integration/test_storage.py"
Task: "Integration test for testing framework in tests/integration/test_testing_framework.py"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Validation Checklist

_GATE: Checked by main() before returning_

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
