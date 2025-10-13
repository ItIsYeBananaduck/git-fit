// Audit report generation utilities
// These functions create comprehensive audit reports from analysis data

import type {
  AuditReport,
  FeatureTask,
  ConstitutionViolation,
  ImplementationGap,
  Conflict,
  Recommendation
} from '../models/auditModels';
import { generateConstitutionComplianceReport } from './constitutionChecker';

export function generateAuditReport(
  sessionId: string,
  features: FeatureTask[],
  additionalViolations: ConstitutionViolation[] = [],
  gaps: ImplementationGap[] = [],
  conflicts: Conflict[] = [],
  recommendations: Recommendation[] = []
): AuditReport {
  const constitutionAnalysis = generateConstitutionComplianceReport(features);

  // Combine all violations
  const allViolations = [
    ...constitutionAnalysis.criticalViolations.violations,
    ...additionalViolations
  ];

  // Categorize features
  const implementedFeatures = features.filter(f => f.implementationStatus === 'implemented');
  const needsRefinement = features.filter(f => f.implementationStatus === 'needs_refinement');
  const missingFeatures = features.filter(f => f.implementationStatus === 'missing');

  // Calculate summary
  const summary = {
    totalFeatures: features.length,
    implemented: implementedFeatures.length,
    needsRefinement: needsRefinement.length,
    missing: missingFeatures.length,
    constitutionViolations: allViolations.length,
    criticalIssues: allViolations
      .filter(v => v.severity === 'critical')
      .map(v => v.description)
      .slice(0, 5) // Limit to top 5 critical issues
  };

  // Generate recommendations based on findings
  const generatedRecommendations = generateRecommendationsFromFindings(
    features,
    allViolations,
    gaps,
    conflicts
  );

  const report: AuditReport = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    timestamp: new Date(),
    version: '1.0.0',
    status: 'completed',
    summary,
    findings: {
      implementedFeatures,
      needsRefinement,
      missingFeatures,
      constitutionViolations: allViolations,
      implementationGaps: gaps,
      conflicts,
      recommendations: [...generatedRecommendations, ...recommendations]
    },
    constitutionCompliance: constitutionAnalysis.report.constitutionCompliance,
    metadata: {
      auditDuration: 0, // Will be set when audit completes
      codebaseSize: 0, // Will be calculated from actual codebase
      aiModelsFound: [], // Will be detected from codebase scan
      technologiesUsed: [] // Will be detected from codebase scan
    }
  };

  return report;
}

function generateRecommendationsFromFindings(
  features: FeatureTask[],
  violations: ConstitutionViolation[],
  gaps: ImplementationGap[],
  conflicts: Conflict[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Generate recommendations from constitution violations
  const criticalViolations = violations.filter(v => v.severity === 'critical');
  if (criticalViolations.length > 0) {
    recommendations.push({
      id: `rec_critical_violations_${Date.now()}`,
      type: 'compliance',
      title: 'Address Critical Constitution Violations',
      description: `Fix ${criticalViolations.length} critical violations of constitution principles, prioritizing safety/privacy issues`,
      priority: 'critical',
      effort: '2-4 weeks',
      benefits: [
        'Ensure constitution compliance',
        'Reduce legal and security risks',
        'Align with project principles'
      ],
      risks: ['Potential delays in development'],
      dependencies: ['Constitution v2.0.0 review'],
      status: 'pending'
    });
  }

  // Generate recommendations from conflicts
  if (conflicts.length > 0) {
    const highSeverityConflicts = conflicts.filter(c => c.severity === 'high' || c.severity === 'critical');
    if (highSeverityConflicts.length > 0) {
      recommendations.push({
        id: `rec_conflicts_resolution_${Date.now()}`,
        type: 'architecture',
        title: 'Resolve High-Severity Architecture Conflicts',
        description: `Address ${highSeverityConflicts.length} critical architecture conflicts that may impact system stability`,
        priority: 'high',
        effort: '1-3 weeks',
        benefits: [
          'Improved system stability',
          'Reduced technical debt',
          'Better maintainability'
        ],
        risks: ['Architecture changes', 'Breaking changes'],
        dependencies: highSeverityConflicts.map(c => c.description),
        status: 'pending'
      });
    }
  }

  // Generate recommendations for missing features
  const missingFeatures = features.filter(f => f.implementationStatus === 'missing');
  if (missingFeatures.length > 0) {
    recommendations.push({
      id: `rec_missing_features_${Date.now()}`,
      type: 'implementation',
      title: 'Implement Missing Core Features',
      description: `Complete implementation of ${missingFeatures.length} missing features to reach full functionality`,
      priority: 'high',
      effort: '4-8 weeks',
      benefits: [
        'Complete feature set',
        'Improved user experience',
        'Competitive product offering'
      ],
      risks: ['Scope creep', 'Resource constraints'],
      dependencies: missingFeatures.map(f => f.name),
      status: 'pending'
    });
  }

  // Generate recommendations for AI migration
  const aiViolations = violations.filter(v =>
    v.principle === 'adaptabilityLearning' &&
    v.description.includes('Llama')
  );
  if (aiViolations.length > 0) {
    recommendations.push({
      id: `rec_ai_migration_${Date.now()}`,
      type: 'architecture',
      title: 'Migrate to Local Llama 3.1 AI Model',
      description: 'Replace external AI APIs with local Llama 3.1 8B (4-bit) model for constitution compliance',
      priority: 'critical',
      effort: '2-3 weeks',
      benefits: [
        'Constitution compliance',
        'Reduced external dependencies',
        'Better privacy and control',
        'Cost optimization'
      ],
      risks: ['Technical complexity', 'Performance considerations'],
      dependencies: ['Llama 3.1 model files', 'API integration'],
      status: 'pending'
    });
  }

  // Generate recommendations for bundle size optimization
  const costViolations = violations.filter(v =>
    v.principle === 'costEffectiveness' &&
    v.description.includes('bundle')
  );
  if (costViolations.length > 0) {
    recommendations.push({
      id: `rec_bundle_optimization_${Date.now()}`,
      type: 'optimization',
      title: 'Optimize Bundle Size for Fly.io Compliance',
      description: 'Reduce application bundle size from current estimate to under 2GB for Fly.io free tier',
      priority: 'high',
      effort: '1-2 weeks',
      benefits: [
        'Cost compliance',
        'Faster deployment',
        'Better performance'
      ],
      risks: ['Feature limitations', 'Code restructuring'],
      dependencies: ['Build optimization tools', 'Asset analysis'],
      status: 'pending'
    });
  }

  // Generate recommendations from implementation gaps
  if (gaps.length > 0) {
    const highPriorityGaps = gaps.filter(g => g.priority === 'high' || g.priority === 'critical');
    if (highPriorityGaps.length > 0) {
      recommendations.push({
        id: `rec_implementation_gaps_${Date.now()}`,
        type: 'implementation',
        title: 'Address High-Priority Implementation Gaps',
        description: `Resolve ${highPriorityGaps.length} critical implementation gaps affecting core functionality`,
        priority: 'high',
        effort: '2-4 weeks',
        benefits: [
          'Improved system reliability',
          'Better user experience',
          'Reduced technical debt'
        ],
        risks: ['Architecture changes', 'Testing requirements'],
        dependencies: highPriorityGaps.map(g => g.description),
        status: 'pending'
      });
    }
  }

  return recommendations;
}

export function generateExecutiveSummary(report: AuditReport): string {
  const { summary, constitutionCompliance } = report;

  let summaryText = `# Executive Summary\n\n`;
  summaryText += `**Audit Date:** ${report.timestamp.toISOString().split('T')[0]}\n`;
  summaryText += `**Constitution Version:** v${report.version}\n\n`;

  summaryText += `## Overall Status\n\n`;
  summaryText += `- **Total Features:** ${summary.totalFeatures}\n`;
  summaryText += `- **Implemented:** ${summary.implemented} (${Math.round((summary.implemented / summary.totalFeatures) * 100)}%)\n`;
  summaryText += `- **Needs Refinement:** ${summary.needsRefinement} (${Math.round((summary.needsRefinement / summary.totalFeatures) * 100)}%)\n`;
  summaryText += `- **Missing:** ${summary.missing} (${Math.round((summary.missing / summary.totalFeatures) * 100)}%)\n`;
  summaryText += `- **Constitution Compliance:** ${constitutionCompliance.overallScore}%\n`;
  summaryText += `- **Critical Issues:** ${summary.criticalIssues.length}\n\n`;

  if (summary.criticalIssues.length > 0) {
    summaryText += `## Critical Issues\n\n`;
    summary.criticalIssues.forEach((issue, index) => {
      summaryText += `${index + 1}. ${issue}\n`;
    });
    summaryText += `\n`;
  }

  summaryText += `## Constitution Compliance by Principle\n\n`;
  Object.entries(constitutionCompliance.principleBreakdown).forEach(([principle, breakdown]) => {
    const violations = breakdown.violations?.length || 0;
    summaryText += `- **${principle}:** ${breakdown.percentage}% (${breakdown.score}/${breakdown.total})`;
    if (violations > 0) {
      summaryText += ` - ${violations} violation${violations > 1 ? 's' : ''}`;
    }
    summaryText += `\n`;
  });

  return summaryText;
}

export function generateDetailedFindings(report: AuditReport): string {
  let findingsText = `# Detailed Findings\n\n`;

  // Implemented Features
  if (report.findings.implementedFeatures.length > 0) {
    findingsText += `## ✅ Implemented Features (${report.findings.implementedFeatures.length})\n\n`;
    report.findings.implementedFeatures.forEach(feature => {
      findingsText += `### ${feature.name}\n`;
      findingsText += `- **Category:** ${feature.category}\n`;
      findingsText += `- **Description:** ${feature.description}\n`;
      if (feature.evidence.length > 0) {
        findingsText += `- **Evidence:** ${feature.evidence.join(', ')}\n`;
      }
      findingsText += `\n`;
    });
  }

  // Features Needing Refinement
  if (report.findings.needsRefinement.length > 0) {
    findingsText += `## ⚠️ Features Needing Refinement (${report.findings.needsRefinement.length})\n\n`;
    report.findings.needsRefinement.forEach(feature => {
      findingsText += `### ${feature.name}\n`;
      findingsText += `- **Category:** ${feature.category}\n`;
      findingsText += `- **Description:** ${feature.description}\n`;
      if (feature.violations.length > 0) {
        findingsText += `- **Issues:** ${feature.violations.map(v => v.description).join(', ')}\n`;
      }
      findingsText += `\n`;
    });
  }

  // Missing Features
  if (report.findings.missingFeatures.length > 0) {
    findingsText += `## ❌ Missing Features (${report.findings.missingFeatures.length})\n\n`;
    report.findings.missingFeatures.forEach(feature => {
      findingsText += `### ${feature.name}\n`;
      findingsText += `- **Category:** ${feature.category}\n`;
      findingsText += `- **Description:** ${feature.description}\n`;
      findingsText += `- **Priority:** ${feature.priority}\n`;
      findingsText += `\n`;
    });
  }

  // Constitution Violations
  if (report.findings.constitutionViolations.length > 0) {
    findingsText += `## 🚨 Constitution Violations (${report.findings.constitutionViolations.length})\n\n`;
    const violationsByPrinciple = report.findings.constitutionViolations.reduce((acc, violation) => {
      if (!acc[violation.principle]) {
        acc[violation.principle] = [];
      }
      acc[violation.principle].push(violation);
      return acc;
    }, {} as Record<string, ConstitutionViolation[]>);

    Object.entries(violationsByPrinciple).forEach(([principle, violations]) => {
      findingsText += `### ${principle} (${violations.length} violations)\n\n`;
      violations.forEach(violation => {
        findingsText += `- **${violation.severity.toUpperCase()}:** ${violation.description}\n`;
        findingsText += `  - **Feature:** ${violation.featureId}\n`;
        findingsText += `  - **Evidence:** ${violation.evidence}\n`;
        findingsText += `  - **Recommendation:** ${violation.recommendation}\n\n`;
      });
    });
  }

  return findingsText;
}

export function generateRecommendationsSection(report: AuditReport): string {
  if (report.findings.recommendations.length === 0) {
    return '# Recommendations\n\nNo specific recommendations generated from this audit.\n\n';
  }

  let recommendationsText = `# Recommendations (${report.findings.recommendations.length})\n\n`;

  // Group recommendations by priority
  const byPriority = {
    critical: report.findings.recommendations.filter(r => r.priority === 'critical'),
    high: report.findings.recommendations.filter(r => r.priority === 'high'),
    medium: report.findings.recommendations.filter(r => r.priority === 'medium'),
    low: report.findings.recommendations.filter(r => r.priority === 'low')
  };

  ['critical', 'high', 'medium', 'low'].forEach(priority => {
    const recs = byPriority[priority as keyof typeof byPriority];
    if (recs.length > 0) {
      recommendationsText += `## ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority (${recs.length})\n\n`;
      recs.forEach(rec => {
        recommendationsText += `### ${rec.title}\n`;
        recommendationsText += `${rec.description}\n\n`;
        recommendationsText += `- **Type:** ${rec.type}\n`;
        recommendationsText += `- **Effort:** ${rec.effort}\n`;
        if (rec.benefits.length > 0) {
          recommendationsText += `- **Benefits:**\n`;
          rec.benefits.forEach(benefit => {
            recommendationsText += `  - ${benefit}\n`;
          });
        }
        if (rec.risks.length > 0) {
          recommendationsText += `- **Risks:**\n`;
          rec.risks.forEach(risk => {
            recommendationsText += `  - ${risk}\n`;
          });
        }
        if (rec.dependencies.length > 0) {
          recommendationsText += `- **Dependencies:** ${rec.dependencies.join(', ')}\n`;
        }
        recommendationsText += `\n`;
      });
    }
  });

  return recommendationsText;
}

export function generateFullAuditReport(report: AuditReport): string {
  const executiveSummary = generateExecutiveSummary(report);
  const detailedFindings = generateDetailedFindings(report);
  const recommendations = generateRecommendationsSection(report);

  let fullReport = executiveSummary;
  fullReport += '---\n\n';
  fullReport += detailedFindings;
  fullReport += '---\n\n';
  fullReport += recommendations;

  // Add metadata footer
  fullReport += '---\n\n';
  fullReport += `## Audit Metadata\n\n`;
  fullReport += `- **Report ID:** ${report.id}\n`;
  fullReport += `- **Session ID:** ${report.sessionId}\n`;
  fullReport += `- **Generated:** ${report.timestamp.toISOString()}\n`;
  fullReport += `- **Audit Duration:** ${report.metadata.auditDuration} minutes\n`;
  fullReport += `- **Codebase Size:** ${report.metadata.codebaseSize} files\n`;
  if (report.metadata.aiModelsFound.length > 0) {
    fullReport += `- **AI Models Found:** ${report.metadata.aiModelsFound.join(', ')}\n`;
  }
  if (report.metadata.technologiesUsed.length > 0) {
    fullReport += `- **Technologies Used:** ${report.metadata.technologiesUsed.join(', ')}\n`;
  }

  return fullReport;
}