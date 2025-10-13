// Validation utilities for the Adaptive Fit Codebase Audit System
// These functions validate audit data structures and constitution compliance

import type {
  AuditReport,
  FeatureTask,
  ConstitutionViolation,
  ImplementationGap,
  Conflict,
  Recommendation,
  AuditSession
} from '../models/auditModels';

// Constitution v2.0.0 principles definition
export const CONSTITUTION_PRINCIPLES = {
  userCentricDesign: {
    name: 'User-Centric Design',
    requirements: [
      'Intuitive UI/UX with accessibility standards',
      'Personalization options for all users',
      'Progressive enhancement approach',
      'Mobile-first responsive design'
    ]
  },
  adaptabilityLearning: {
    name: 'Adaptability & Learning',
    requirements: [
      'Local Llama 3.1 8B (4-bit) AI model only',
      'Continuous learning from user interactions',
      'Adaptive algorithms that improve over time',
      'No external API dependencies for core features'
    ]
  },
  costEffectiveness: {
    name: 'Cost-Effectiveness',
    requirements: [
      'Fly.io free tier compliance ($10-15/month budget)',
      'Efficient resource utilization',
      'Scalable architecture without vendor lock-in',
      'Open source dependencies where possible'
    ]
  },
  scalabilityPerformance: {
    name: 'Scalability & Performance',
    requirements: [
      '<200ms API response times',
      '<500ms client-side response times',
      'Efficient algorithms and data structures',
      'Real-time capabilities within free tier limits'
    ]
  },
  safetyPrivacy: {
    name: 'Safety & Privacy',
    requirements: [
      'HIPAA/GDPR compliance standards',
      'End-to-end encryption for sensitive data',
      'User data control and export capabilities',
      'Regular security audits and penetration testing'
    ]
  },
  engagementGamification: {
    name: 'Engagement & Gamification',
    requirements: [
      'Motivational design patterns',
      'Progressive achievement systems',
      'Social features and community building',
      'Retention-focused user experience'
    ]
  },
  dataEthicsTransparency: {
    name: 'Data Ethics & Transparency',
    requirements: [
      'Clear data usage policies',
      'Transparent AI decision-making',
      'Ethical data collection practices',
      'User consent and control mechanisms'
    ]
  }
} as const;

export type ConstitutionPrinciple = keyof typeof CONSTITUTION_PRINCIPLES;

// Validation functions
export function validateAuditReport(report: unknown): report is AuditReport {
  if (!report || typeof report !== 'object') return false;

  const r = report as Record<string, unknown>;

  // Required fields
  if (!r.id || typeof r.id !== 'string') return false;
  if (!r.sessionId || typeof r.sessionId !== 'string') return false;
  if (!r.timestamp || !(r.timestamp instanceof Date)) return false;
  if (!r.version || typeof r.version !== 'string') return false;
  if (!['in_progress', 'completed', 'failed'].includes(r.status as string)) return false;

  // Summary validation
  if (!r.summary || typeof r.summary !== 'object') return false;
  const summary = r.summary as Record<string, unknown>;
  if (typeof summary.totalFeatures !== 'number') return false;
  if (typeof summary.implemented !== 'number') return false;
  if (typeof summary.needsRefinement !== 'number') return false;
  if (typeof summary.missing !== 'number') return false;
  if (typeof summary.constitutionViolations !== 'number') return false;
  if (!Array.isArray(summary.criticalIssues)) return false;

  // Findings validation
  if (!r.findings || typeof r.findings !== 'object') return false;
  const findings = r.findings as Record<string, unknown>;
  if (!Array.isArray(findings.implementedFeatures)) return false;
  if (!Array.isArray(findings.needsRefinement)) return false;
  if (!Array.isArray(findings.missingFeatures)) return false;
  if (!Array.isArray(findings.constitutionViolations)) return false;
  if (!Array.isArray(findings.implementationGaps)) return false;
  if (!Array.isArray(findings.conflicts)) return false;
  if (!Array.isArray(findings.recommendations)) return false;

  return true;
}

export function validateFeatureTask(task: unknown): task is FeatureTask {
  if (!task || typeof task !== 'object') return false;

  const t = task as Record<string, unknown>;

  if (!t.id || typeof t.id !== 'string') return false;
  if (!t.name || typeof t.name !== 'string') return false;
  if (!['core_fitness', 'ai_personalization', 'platform_features', 'advanced_features'].includes(t.category as string)) return false;
  if (!t.description || typeof t.description !== 'string') return false;
  if (!['implemented', 'needs_refinement', 'missing'].includes(t.implementationStatus as string)) return false;
  if (!Array.isArray(t.constitutionPrinciples)) return false;
  if (!Array.isArray(t.evidence)) return false;
  if (!Array.isArray(t.violations)) return false;
  if (!Array.isArray(t.recommendations)) return false;
  if (!['low', 'medium', 'high', 'critical'].includes(t.priority as string)) return false;

  return true;
}

export function validateConstitutionViolation(violation: unknown): violation is ConstitutionViolation {
  if (!violation || typeof violation !== 'object') return false;

  const v = violation as Record<string, unknown>;

  if (!v.id || typeof v.id !== 'string') return false;
  if (!v.featureId || typeof v.featureId !== 'string') return false;
  if (!v.principle || typeof v.principle !== 'string') return false;
  if (!['low', 'medium', 'high', 'critical'].includes(v.severity as string)) return false;
  if (!v.description || typeof v.description !== 'string') return false;
  if (!v.evidence || typeof v.evidence !== 'string') return false;
  if (!v.recommendation || typeof v.recommendation !== 'string') return false;
  if (!['open', 'addressed', 'dismissed'].includes(v.status as string)) return false;
  if (!(v.createdAt instanceof Date)) return false;

  return true;
}

export function validateImplementationGap(gap: unknown): gap is ImplementationGap {
  if (!gap || typeof gap !== 'object') return false;

  const g = gap as Record<string, unknown>;

  if (!g.id || typeof g.id !== 'string') return false;
  if (!g.featureId || typeof g.featureId !== 'string') return false;
  if (!['missing_functionality', 'incomplete_implementation', 'architecture_issue', 'performance_issue'].includes(g.gapType as string)) return false;
  if (!g.description || typeof g.description !== 'string') return false;
  if (!['low', 'medium', 'high', 'critical'].includes(g.impact as string)) return false;
  if (!g.estimatedEffort || typeof g.estimatedEffort !== 'string') return false;
  if (!Array.isArray(g.dependencies)) return false;
  if (!['low', 'medium', 'high', 'critical'].includes(g.priority as string)) return false;

  return true;
}

export function validateConflict(conflict: unknown): conflict is Conflict {
  if (!conflict || typeof conflict !== 'object') return false;

  const c = conflict as Record<string, unknown>;

  if (!c.id || typeof c.id !== 'string') return false;
  if (!['architecture_conflict', 'principle_conflict', 'implementation_conflict', 'requirement_conflict'].includes(c.type as string)) return false;
  if (!c.description || typeof c.description !== 'string') return false;
  if (!Array.isArray(c.affectedFeatures)) return false;
  if (!['low', 'medium', 'high', 'critical'].includes(c.severity as string)) return false;
  if (!['open', 'resolved', 'accepted'].includes(c.status as string)) return false;

  return true;
}

export function validateRecommendation(rec: unknown): rec is Recommendation {
  if (!rec || typeof rec !== 'object') return false;

  const r = rec as Record<string, unknown>;

  if (!r.id || typeof r.id !== 'string') return false;
  if (!['implementation', 'refinement', 'architecture', 'compliance', 'optimization'].includes(r.type as string)) return false;
  if (!r.title || typeof r.title !== 'string') return false;
  if (!r.description || typeof r.description !== 'string') return false;
  if (!['low', 'medium', 'high', 'critical'].includes(r.priority as string)) return false;
  if (!r.effort || typeof r.effort !== 'string') return false;
  if (!Array.isArray(r.benefits)) return false;
  if (!Array.isArray(r.risks)) return false;
  if (!Array.isArray(r.dependencies)) return false;
  if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(r.status as string)) return false;

  return true;
}

export function validateAuditSession(session: unknown): session is AuditSession {
  if (!session || typeof session !== 'object') return false;

  const s = session as Record<string, unknown>;

  if (!s.id || typeof s.id !== 'string') return false;
  if (!(s.startTime instanceof Date)) return false;
  if (!s.userId || typeof s.userId !== 'string') return false;
  if (!['active', 'completed', 'failed'].includes(s.status as string)) return false;
  if (!s.workspacePath || typeof s.workspacePath !== 'string') return false;
  if (!s.constitutionVersion || typeof s.constitutionVersion !== 'string') return false;

  return true;
}

// Constitution compliance checking functions
export function checkPrincipleCompliance(
  feature: FeatureTask,
  principle: ConstitutionPrinciple
): { compliant: boolean; violations: string[]; evidence: string[] } {
  const result = {
    compliant: true,
    violations: [] as string[],
    evidence: [] as string[]
  };

  const principleReqs = CONSTITUTION_PRINCIPLES[principle].requirements;

  // Check each requirement against feature evidence
  for (const requirement of principleReqs) {
    let requirementMet = false;

    for (const evidence of feature.evidence) {
      if (evidence.toLowerCase().includes(requirement.toLowerCase().split(' ')[0])) {
        requirementMet = true;
        result.evidence.push(evidence);
        break;
      }
    }

    if (!requirementMet) {
      result.compliant = false;
      result.violations.push(`Missing: ${requirement}`);
    }
  }

  return result;
}

export function calculateConstitutionScore(features: FeatureTask[]): {
  overallScore: number;
  principleBreakdown: Record<ConstitutionPrinciple, { score: number; total: number; percentage: number }>;
} {
  const principleBreakdown: Record<ConstitutionPrinciple, { score: number; total: number; percentage: number }> = {} as Record<ConstitutionPrinciple, { score: number; total: number; percentage: number }>;

  let totalScore = 0;
  let totalPossible = 0;

  for (const principle of Object.keys(CONSTITUTION_PRINCIPLES) as ConstitutionPrinciple[]) {
    let principleScore = 0;
    let principleTotal = 0;

    for (const feature of features) {
      if (feature.constitutionPrinciples.includes(principle)) {
        const compliance = checkPrincipleCompliance(feature, principle);
        principleScore += compliance.compliant ? 1 : 0;
        principleTotal += 1;
      }
    }

    const percentage = principleTotal > 0 ? (principleScore / principleTotal) * 100 : 0;
    principleBreakdown[principle] = {
      score: principleScore,
      total: principleTotal,
      percentage: Math.round(percentage)
    };

    totalScore += principleScore;
    totalPossible += principleTotal;
  }

  const overallScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

  return { overallScore, principleBreakdown };
}

// UUID validation utility
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Enum validation utilities
export function isValidFeatureCategory(category: string): category is FeatureTask['category'] {
  return ['core_fitness', 'ai_personalization', 'platform_features', 'advanced_features'].includes(category);
}

export function isValidImplementationStatus(status: string): status is FeatureTask['implementationStatus'] {
  return ['implemented', 'needs_refinement', 'missing'].includes(status);
}

export function isValidPriority(priority: string): priority is FeatureTask['priority'] {
  return ['low', 'medium', 'high', 'critical'].includes(priority);
}

export function isValidSeverity(severity: string): severity is ConstitutionViolation['severity'] {
  return ['low', 'medium', 'high', 'critical'].includes(severity);
}