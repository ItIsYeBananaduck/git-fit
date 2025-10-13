// Constitution compliance checking utilities
// These functions analyze codebase compliance with constitution v2.0.0

import type { FeatureTask, ConstitutionViolation, AuditReport } from '../models/auditModels';
import type { ConstitutionPrinciple } from './auditValidators';
import { CONSTITUTION_PRINCIPLES, checkPrincipleCompliance, calculateConstitutionScore } from './auditValidators';

// Constitution compliance analysis functions
export function analyzeFeatureCompliance(feature: FeatureTask): {
  overallCompliant: boolean;
  principleResults: Record<ConstitutionPrinciple, {
    compliant: boolean;
    violations: string[];
    evidence: string[];
  }>;
  criticalViolations: ConstitutionViolation[];
} {
  const principleResults: Record<ConstitutionPrinciple, {
    compliant: boolean;
    violations: string[];
    evidence: string[];
  }> = {} as Record<ConstitutionPrinciple, {
    compliant: boolean;
    violations: string[];
    evidence: string[];
  }>;

  let overallCompliant = true;
  const criticalViolations: ConstitutionViolation[] = [];

  for (const principle of Object.keys(CONSTITUTION_PRINCIPLES) as ConstitutionPrinciple[]) {
    if (feature.constitutionPrinciples.includes(principle)) {
      const result = checkPrincipleCompliance(feature, principle);
      principleResults[principle] = result;

      if (!result.compliant) {
        overallCompliant = false;

        // Create critical violations for safety/privacy and cost issues
        if (principle === 'safetyPrivacy' || principle === 'costEffectiveness') {
          const violation: ConstitutionViolation = {
            id: `violation_${feature.id}_${principle}_${Date.now()}`,
            featureId: feature.id,
            principle,
            severity: principle === 'safetyPrivacy' ? 'critical' : 'high',
            description: `Feature violates ${CONSTITUTION_PRINCIPLES[principle].name} principle`,
            evidence: result.violations.join('; '),
            recommendation: `Implement ${CONSTITUTION_PRINCIPLES[principle].requirements.join(', ')}`,
            status: 'open',
            createdAt: new Date()
          };
          criticalViolations.push(violation);
        }
      }
    }
  }

  return { overallCompliant, principleResults, criticalViolations };
}

export function generateComplianceMatrix(features: FeatureTask[]): {
  matrix: Record<string, Record<ConstitutionPrinciple, '✅' | '❌' | '⚠️'>>;
  summary: {
    totalFeatures: number;
    fullyCompliant: number;
    partiallyCompliant: number;
    nonCompliant: number;
  };
} {
  const matrix: Record<string, Record<ConstitutionPrinciple, '✅' | '❌' | '⚠️'>> = {};

  let fullyCompliant = 0;
  let partiallyCompliant = 0;
  let nonCompliant = 0;

  for (const feature of features) {
    const analysis = analyzeFeatureCompliance(feature);
    const featureMatrix: Record<ConstitutionPrinciple, '✅' | '❌' | '⚠️'> = {} as Record<ConstitutionPrinciple, '✅' | '❌' | '⚠️'>;

    let compliantCount = 0;
    let totalCount = 0;

    for (const principle of Object.keys(CONSTITUTION_PRINCIPLES) as ConstitutionPrinciple[]) {
      if (feature.constitutionPrinciples.includes(principle)) {
        const result = analysis.principleResults[principle];
        if (result.compliant) {
          featureMatrix[principle] = '✅';
          compliantCount++;
        } else {
          featureMatrix[principle] = '❌';
        }
        totalCount++;
      } else {
        featureMatrix[principle] = '⚠️'; // Not applicable
      }
    }

    matrix[feature.name] = featureMatrix;

    if (compliantCount === totalCount) {
      fullyCompliant++;
    } else if (compliantCount > 0) {
      partiallyCompliant++;
    } else {
      nonCompliant++;
    }
  }

  return {
    matrix,
    summary: {
      totalFeatures: features.length,
      fullyCompliant,
      partiallyCompliant,
      nonCompliant
    }
  };
}

export function identifyCriticalConstitutionViolations(features: FeatureTask[]): {
  violations: ConstitutionViolation[];
  byPrinciple: Record<ConstitutionPrinciple, ConstitutionViolation[]>;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
} {
  const violations: ConstitutionViolation[] = [];
  const byPrinciple: Record<ConstitutionPrinciple, ConstitutionViolation[]> = {} as Record<ConstitutionPrinciple, ConstitutionViolation[]>;

  // Initialize principle arrays
  for (const principle of Object.keys(CONSTITUTION_PRINCIPLES) as ConstitutionPrinciple[]) {
    byPrinciple[principle] = [];
  }

  for (const feature of features) {
    const analysis = analyzeFeatureCompliance(feature);
    violations.push(...analysis.criticalViolations);

    for (const violation of analysis.criticalViolations) {
      byPrinciple[violation.principle].push(violation);
    }
  }

  const summary = {
    total: violations.length,
    critical: violations.filter(v => v.severity === 'critical').length,
    high: violations.filter(v => v.severity === 'high').length,
    medium: violations.filter(v => v.severity === 'medium').length,
    low: violations.filter(v => v.severity === 'low').length
  };

  return { violations, byPrinciple, summary };
}

export function validateConstitutionAlignment(report: AuditReport): {
  isAligned: boolean;
  issues: string[];
  recommendations: string[];
  complianceScore: number;
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let isAligned = true;

  // Check overall compliance score
  const complianceScore = report.constitutionCompliance.overallScore;
  if (complianceScore < 80) {
    isAligned = false;
    issues.push(`Overall constitution compliance is only ${complianceScore}% (target: 80%+)`);
    recommendations.push('Prioritize constitution compliance fixes before further development');
  }

  // Check critical safety/privacy violations
  const safetyViolations = report.findings.constitutionViolations.filter(
    v => v.principle === 'safetyPrivacy' && v.severity === 'critical'
  );
  if (safetyViolations.length > 0) {
    isAligned = false;
    issues.push(`${safetyViolations.length} critical safety/privacy violations found`);
    recommendations.push('Address all safety/privacy violations immediately');
  }

  // Check cost effectiveness violations
  const costViolations = report.findings.constitutionViolations.filter(
    v => v.principle === 'costEffectiveness' && v.severity === 'high'
  );
  if (costViolations.length > 0) {
    isAligned = false;
    issues.push(`${costViolations.length} high-priority cost violations found`);
    recommendations.push('Review and optimize cost structure to meet Fly.io free tier requirements');
  }

  // Check AI implementation compliance
  const aiViolations = report.findings.constitutionViolations.filter(
    v => v.principle === 'adaptabilityLearning' && v.description.includes('Llama')
  );
  if (aiViolations.length > 0) {
    isAligned = false;
    issues.push('AI implementation does not comply with local Llama 3.1 requirement');
    recommendations.push('Migrate from external AI APIs to local Llama 3.1 8B (4-bit) model');
  }

  return { isAligned, issues, recommendations, complianceScore };
}

export function generateConstitutionComplianceReport(features: FeatureTask[]): {
  report: AuditReport;
  complianceMatrix: ReturnType<typeof generateComplianceMatrix>;
  criticalViolations: ReturnType<typeof identifyCriticalConstitutionViolations>;
  alignmentValidation: ReturnType<typeof validateConstitutionAlignment>;
} {
  const scoreCalculation = calculateConstitutionScore(features);
  const complianceMatrix = generateComplianceMatrix(features);
  const criticalViolations = identifyCriticalConstitutionViolations(features);

  // Create mock audit report for compliance analysis
  const report: AuditReport = {
    id: `constitution_audit_${Date.now()}`,
    sessionId: 'constitution_check',
    timestamp: new Date(),
    version: '2.0.0',
    status: 'completed',
    summary: {
      totalFeatures: features.length,
      implemented: features.filter(f => f.implementationStatus === 'implemented').length,
      needsRefinement: features.filter(f => f.implementationStatus === 'needs_refinement').length,
      missing: features.filter(f => f.implementationStatus === 'missing').length,
      constitutionViolations: criticalViolations.violations.length,
      criticalIssues: criticalViolations.violations.filter(v => v.severity === 'critical').map(v => v.description)
    },
    findings: {
      implementedFeatures: features.filter(f => f.implementationStatus === 'implemented'),
      needsRefinement: features.filter(f => f.implementationStatus === 'needs_refinement'),
      missingFeatures: features.filter(f => f.implementationStatus === 'missing'),
      constitutionViolations: criticalViolations.violations,
      implementationGaps: [],
      conflicts: [],
      recommendations: []
    },
    constitutionCompliance: {
      overallScore: scoreCalculation.overallScore,
      principleBreakdown: Object.fromEntries(
        Object.entries(scoreCalculation.principleBreakdown).map(([principle, breakdown]) => [
          principle,
          { ...breakdown, violations: criticalViolations.byPrinciple[principle as ConstitutionPrinciple] || [] }
        ])
      ) as Record<string, { score: number; total: number; percentage: number; violations: ConstitutionViolation[]; }>
    },
    metadata: {
      auditDuration: 0,
      codebaseSize: 0,
      aiModelsFound: [],
      technologiesUsed: []
    }
  };

  const alignmentValidation = validateConstitutionAlignment(report);

  return {
    report,
    complianceMatrix,
    criticalViolations,
    alignmentValidation
  };
}

// Quick constitution check for development workflow
export function quickConstitutionCheck(feature: FeatureTask): {
  compliant: boolean;
  blockingIssues: string[];
  warnings: string[];
  recommendations: string[];
} {
  const analysis = analyzeFeatureCompliance(feature);
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  for (const [principle, result] of Object.entries(analysis.principleResults)) {
    if (!result.compliant) {
      const principleName = CONSTITUTION_PRINCIPLES[principle as ConstitutionPrinciple].name;

      if (principle === 'safetyPrivacy') {
        blockingIssues.push(`${principleName}: ${result.violations.join(', ')}`);
      } else if (principle === 'costEffectiveness') {
        blockingIssues.push(`${principleName}: ${result.violations.join(', ')}`);
      } else {
        warnings.push(`${principleName}: ${result.violations.join(', ')}`);
      }

      recommendations.push(`Implement ${CONSTITUTION_PRINCIPLES[principle as ConstitutionPrinciple].requirements.join(', ')}`);
    }
  }

  return {
    compliant: analysis.overallCompliant && blockingIssues.length === 0,
    blockingIssues,
    warnings,
    recommendations
  };
}