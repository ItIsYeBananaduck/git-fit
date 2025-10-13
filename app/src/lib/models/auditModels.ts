// Contract-compliant audit data structures
// Implementation of AUDIT-DATA-001 contract specification

// Core types from contract
export type ConstitutionPrinciple =
  | "constitution_driven_development"
  | "test_driven_development"
  | "service_oriented_architecture"
  | "database_agnostic_design"
  | "real_time_data_synchronization"
  | "adaptive_personalization_engine"
  | "constitution_compliance_validation";

export type AuditCriteria = {
  includeTests: boolean;
  includeDocumentation: boolean;
  deepAnalysis: boolean;
  parallelProcessing: boolean;
  constitutionVersion: string;
};

// Contract-compliant AuditReport interface
export interface AuditReport {
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

// Contract-compliant ConstitutionViolation interface
export interface ConstitutionViolation {
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

// Contract-compliant ImplementationGap interface
export interface ImplementationGap {
  id: string; // UUID format
  featureName: string; // Must match one of 18 tasks
  gapType: "missing_code" | "incomplete_feature" | "broken_integration"; // Enum
  description: string; // Non-empty, <300 chars
  impact: "blocks_beta" | "affects_user_experience" | "performance_issue" | "security_risk"; // Enum
  constitutionPrinciples: ConstitutionPrinciple[]; // Non-empty array
  estimatedEffort: "small" | "medium" | "large"; // Enum
  dependencies: string[]; // Array of task IDs
  acceptanceCriteria: string[]; // Non-empty array of testable criteria
}

// Additional entity interfaces (maintained for compatibility)
export interface Conflict {
  id: string;
  type: 'architecture_conflict' | 'principle_conflict' | 'implementation_conflict' | 'requirement_conflict';
  description: string;
  affectedFeatures: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution?: string;
  status: 'open' | 'resolved' | 'accepted';
}

export interface Recommendation {
  id: string;
  featureId?: string;
  type: 'implementation' | 'refinement' | 'architecture' | 'compliance' | 'optimization';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: string;
  benefits: string[];
  risks: string[];
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface AuditSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed';
  userId: string;
  workspacePath: string;
  constitutionVersion: string;
  progress: {
    currentPhase: string;
    completedTasks: number;
    totalTasks: number;
    currentTask?: string;
  };
  configuration: {
    includeTests: boolean;
    includeDocumentation: boolean;
    deepAnalysis: boolean;
    parallelProcessing: boolean;
  };
}

export interface Conflict {
  id: string;
  type: 'architecture_conflict' | 'principle_conflict' | 'implementation_conflict' | 'requirement_conflict';
  description: string;
  affectedFeatures: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution?: string;
  status: 'open' | 'resolved' | 'accepted';
}

export interface Recommendation {
  id: string;
  featureId?: string;
  type: 'implementation' | 'refinement' | 'architecture' | 'compliance' | 'optimization';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: string;
  benefits: string[];
  risks: string[];
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface AuditSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed';
  userId: string;
  workspacePath: string;
  constitutionVersion: string;
  progress: {
    currentPhase: string;
    completedTasks: number;
    totalTasks: number;
    currentTask?: string;
  };
  configuration: {
    includeTests: boolean;
    includeDocumentation: boolean;
    deepAnalysis: boolean;
    parallelProcessing: boolean;
  };
}

// Type guards for runtime validation
export function isAuditReport(obj: unknown): obj is AuditReport {
  const o = obj as Record<string, unknown>;
  return obj !== null && typeof obj === 'object' &&
         typeof o.id === 'string' &&
         o.featureId === '020-adaptive-fit-codebase' &&
         ['in_progress', 'completed', 'failed'].includes(o.status as string) &&
         Array.isArray(o.constitutionViolations) &&
         Array.isArray(o.implementationGaps);
}

export function isConstitutionViolation(obj: unknown): obj is ConstitutionViolation {
  const o = obj as Record<string, unknown>;
  return obj !== null && typeof obj === 'object' &&
         typeof o.id === 'string' &&
         typeof o.principle === 'string' &&
         ['critical', 'high', 'medium', 'low'].includes(o.severity as string) &&
         typeof o.description === 'string' &&
         (o.description as string).length <= 500 &&
         Array.isArray(o.affectedFeatures) &&
         typeof o.evidence === 'string' &&
         typeof o.remediation === 'object' &&
         o.remediation !== null &&
         ['identified', 'acknowledged', 'in_remediation', 'resolved'].includes(o.status as string);
}

export function isImplementationGap(obj: unknown): obj is ImplementationGap {
  const o = obj as Record<string, unknown>;
  return obj !== null && typeof obj === 'object' &&
         typeof o.id === 'string' &&
         typeof o.featureName === 'string' &&
         ['missing_code', 'incomplete_feature', 'broken_integration'].includes(o.gapType as string) &&
         typeof o.description === 'string' &&
         (o.description as string).length <= 300 &&
         ['blocks_beta', 'affects_user_experience', 'performance_issue', 'security_risk'].includes(o.impact as string) &&
         Array.isArray(o.constitutionPrinciples) &&
         (o.constitutionPrinciples as unknown[]).length > 0 &&
         ['small', 'medium', 'large'].includes(o.estimatedEffort as string) &&
         Array.isArray(o.acceptanceCriteria) &&
         (o.acceptanceCriteria as unknown[]).length > 0;
}

export function isConflict(obj: unknown): obj is Conflict {
  const o = obj as Record<string, unknown>;
  return obj !== null && typeof obj === 'object' &&
         typeof o.id === 'string' &&
         typeof o.description === 'string' &&
         ['low', 'medium', 'high', 'critical'].includes(o.severity as string);
}

export function isRecommendation(obj: unknown): obj is Recommendation {
  const o = obj as Record<string, unknown>;
  return obj !== null && typeof obj === 'object' &&
         typeof o.id === 'string' &&
         typeof o.title === 'string' &&
         ['low', 'medium', 'high', 'critical'].includes(o.priority as string);
}

export function isAuditSession(obj: unknown): obj is AuditSession {
  const o = obj as Record<string, unknown>;
  return obj !== null && typeof obj === 'object' &&
         typeof o.id === 'string' &&
         typeof o.userId === 'string' &&
         ['active', 'completed', 'failed'].includes(o.status as string);
}