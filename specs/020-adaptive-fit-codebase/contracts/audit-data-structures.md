# Contract: Audit Data Structures

**Contract ID**: AUDIT-DATA-001  
**Version**: 1.0.0  
**Date**: October 10, 2025  
**Purpose**: Define data structure contracts for audit system reliability

## AuditReport Contract

### Interface Definition

```typescript
interface AuditReport {
  // Primary identifiers
  id: string; // UUID format
  featureId: string; // Must match "020-adaptive-fit-codebase"
  status: "in_progress" | "completed" | "failed"; // Enum validation

  // Timing
  startDate: Date; // ISO 8601 format
  completionDate?: Date; // Must be >= startDate when present

  // Task tracking
  totalTasks: number; // Must equal 18
  completedTasks: number; // Must be <= totalTasks

  // Analysis results
  constitutionViolations: ConstitutionViolation[];
  implementationGaps: ImplementationGap[];
  conflicts: Conflict[];
  recommendations: Recommendation[];

  // Metadata
  metadata: {
    auditor: string; // Non-empty string
    constitutionVersion: string; // Must match "2.0.0"
    codebaseVersion: string; // Git commit hash or version
    auditCriteria: AuditCriteria;
  };
}
```

### Validation Rules

1. **ID Format**: Must be valid UUID v4
2. **Feature ID**: Must exactly match "020-adaptive-fit-codebase"
3. **Status Enum**: Only allowed values: "in_progress", "completed", "failed"
4. **Date Logic**: completionDate must be >= startDate if present
5. **Task Count**: totalTasks must equal 18, completedTasks <= totalTasks
6. **Constitution Version**: Must match "2.0.0"
7. **Array Types**: All arrays must contain valid contract objects

### Error Conditions

- **INVALID_ID**: ID not in UUID format
- **INVALID_FEATURE_ID**: featureId doesn't match expected value
- **INVALID_STATUS**: status not in allowed enum
- **INVALID_DATES**: completionDate < startDate
- **INVALID_TASK_COUNT**: totalTasks != 18 or completedTasks > totalTasks
- **INVALID_CONSTITUTION_VERSION**: constitutionVersion != "2.0.0"

## ConstitutionViolation Contract

### Interface Definition

```typescript
interface ConstitutionViolation {
  id: string; // UUID format
  principle: ConstitutionPrinciple; // Must be valid principle
  severity: "critical" | "high" | "medium" | "low"; // Enum validation
  description: string; // Non-empty, <500 chars
  affectedFeatures: string[]; // Array of feature names
  evidence: string; // Non-empty, specific evidence
  remediation: {
    action: string; // Non-empty, specific action
    effort: "small" | "medium" | "large"; // Enum validation
    timeline: string; // Non-empty, time estimate
    responsible: string; // Non-empty, role/person
  };
  status: "identified" | "acknowledged" | "in_remediation" | "resolved"; // Enum validation
}
```

### Validation Rules

1. **Principle Validity**: Must be one of the 7 core constitution principles
2. **Severity Levels**: Only "critical", "high", "medium", "low" allowed
3. **Description Length**: 10-500 characters
4. **Affected Features**: Non-empty array, each item non-empty string
5. **Evidence**: Must contain specific, verifiable evidence
6. **Remediation Completeness**: All fields required and non-empty
7. **Status Progression**: Valid state transitions only

### Business Rules

1. **Critical violations** must have remediation timeline < 1 week
2. **High violations** must have remediation timeline < 2 weeks
3. **Evidence** must reference specific code locations or test results
4. **Affected features** must map to the 18 identified tasks

## ImplementationGap Contract

### Interface Definition

```typescript
interface ImplementationGap {
  id: string; // UUID format
  featureName: string; // Must match one of 18 tasks
  gapType: "missing_code" | "incomplete_feature" | "broken_integration"; // Enum
  description: string; // Non-empty, <300 chars
  impact:
    | "blocks_beta"
    | "affects_user_experience"
    | "performance_issue"
    | "security_risk"; // Enum
  constitutionPrinciples: ConstitutionPrinciple[]; // Non-empty array
  estimatedEffort: "small" | "medium" | "large"; // Enum
  dependencies: string[]; // Array of task IDs
  acceptanceCriteria: string[]; // Non-empty array of testable criteria
}
```

### Validation Rules

1. **Feature Name**: Must exactly match one of the 18 task names
2. **Gap Type**: Only allowed enum values
3. **Impact Assessment**: Must be valid impact level
4. **Constitution Link**: At least one principle must be affected
5. **Acceptance Criteria**: Each criterion must be testable and specific
6. **Dependencies**: Valid task IDs only

### Error Conditions

- **UNKNOWN_FEATURE**: featureName not in the 18 recognized tasks
- **INVALID_GAP_TYPE**: gapType not in allowed values
- **EMPTY_ACCEPTANCE_CRITERIA**: No testable acceptance criteria provided
- **INVALID_DEPENDENCY**: Dependency references non-existent task

## Contract Testing

### Unit Tests Required

```typescript
// Example test structure
describe("AuditReport Contract", () => {
  test("validates UUID format for id field", () => {
    const invalid = { ...validReport, id: "not-a-uuid" };
    expect(validateAuditReport(invalid)).toBe(false);
  });

  test("enforces totalTasks equals 18", () => {
    const invalid = { ...validReport, totalTasks: 17 };
    expect(validateAuditReport(invalid)).toBe(false);
  });

  test("requires constitution version 2.0.0", () => {
    const invalid = {
      ...validReport,
      metadata: { ...validReport.metadata, constitutionVersion: "1.0.0" },
    };
    expect(validateAuditReport(invalid)).toBe(false);
  });
});
```

### Integration Tests Required

- **Cross-reference validation**: Ensure all referenced tasks exist
- **Constitution alignment**: Verify principle references are valid
- **Data consistency**: Check all arrays contain valid objects
- **State transitions**: Validate status change logic

## Contract Evolution

### Version Compatibility

- **Breaking Changes**: Require new contract version
- **Additive Changes**: Backward compatible, same version
- **Deprecation**: Mark old fields as deprecated with migration path

### Migration Strategy

1. **Version Detection**: Include contract version in all data structures
2. **Migration Functions**: Provide upgrade/downgrade functions
3. **Validation Gates**: Prevent invalid data from entering the system
4. **Audit Trail**: Log all contract-related changes

---

**Contract Status**: ✅ Ready for implementation
