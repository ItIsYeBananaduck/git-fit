// Service classes for the Adaptive Fit Codebase Audit System
// These services provide CRUD operations and business logic for audit entities

import type {
  AuditReport,
  FeatureTask,
  ConstitutionViolation,
  ImplementationGap,
  Conflict,
  Recommendation
} from '../models/auditModels';
import {
  isAuditReport,
  isFeatureTask,
  isConstitutionViolation,
  isImplementationGap,
  isConflict,
  isRecommendation
} from '../models/auditModels';
import { api } from '../../../convex/_generated/api_workaround';
import { useMutation, useQuery } from 'convex/react';

// Import Convex client
import { ConvexReactClient } from 'convex/react';
import { convexClient } from '../../convexClient';

export class AuditReportService {
  async createAuditReport(featureId: string, auditor: string, auditCriteria: AuditReport['auditCriteria'], initialData?: Partial<AuditReport>): Promise<AuditReport> {
    try {
      const reportId = await convexClient.mutation(api.audit.createAuditReport, {
        featureId,
        auditor,
        auditCriteria,
        initialData: initialData ? {
          status: initialData.status,
          summary: initialData.summary,
          constitutionCompliance: initialData.constitutionCompliance,
          metadata: initialData.metadata
        } : undefined
      });

      // Fetch the created report to return it
      const report = await convexClient.query(api.audit.getAuditReport, { reportId: reportId as any });
      if (!report) {
        throw new Error('Failed to create audit report');
      }

      // Convert timestamps back to Date objects
      return {
        ...report,
        startDate: new Date(report.startDate),
        completionDate: report.completionDate ? new Date(report.completionDate) : undefined,
        createdAt: new Date(report.createdAt),
        updatedAt: new Date(report.updatedAt)
      } as AuditReport;
    } catch (error) {
      console.error('Error creating audit report:', error);
      throw new Error('Failed to create audit report');
    }
  }

  async updateAuditReport(reportId: string, updates: Partial<AuditReport>): Promise<AuditReport> {
    try {
      await convexClient.mutation(api.audit.updateAuditReport, {
        reportId: reportId as any, // Type assertion needed for Convex ID
        updates: {
          status: updates.status,
          completionDate: updates.completionDate?.getTime(),
          progress: updates.progress,
          summary: updates.summary,
          constitutionCompliance: updates.constitutionCompliance,
          metadata: updates.metadata
        }
      });

      // Fetch the updated report
      const report = await convexClient.query(api.audit.getAuditReport, { reportId: reportId as any });
      if (!report) {
        throw new Error('Audit report not found after update');
      }

      return {
        ...report,
        startDate: new Date(report.startDate),
        completionDate: report.completionDate ? new Date(report.completionDate) : undefined,
        createdAt: new Date(report.createdAt),
        updatedAt: new Date(report.updatedAt)
      } as AuditReport;
    } catch (error) {
      console.error('Error updating audit report:', error);
      throw new Error('Failed to update audit report');
    }
  }

  async getAuditReport(reportId: string): Promise<AuditReport | null> {
    try {
      const report = await convexClient.query(api.audit.getAuditReport, { reportId: reportId as any });
      if (!report) {
        return null;
      }

      return {
        ...report,
        startDate: new Date(report.startDate),
        completionDate: report.completionDate ? new Date(report.completionDate) : undefined,
        createdAt: new Date(report.createdAt),
        updatedAt: new Date(report.updatedAt)
      } as AuditReport;
    } catch (error) {
      console.error('Error fetching audit report:', error);
      return null;
    }
  }

  async finalizeAuditReport(reportId: string): Promise<AuditReport> {
    try {
      const report = await this.getAuditReport(reportId);
      if (!report) {
        throw new Error('Audit report not found');
      }

      const auditDuration = Date.now() - report.startDate.getTime();

      return this.updateAuditReport(reportId, {
        status: 'completed',
        completionDate: new Date(),
        metadata: {
          ...report.metadata,
          auditDuration
        }
      });
    } catch (error) {
      console.error('Error finalizing audit report:', error);
      throw new Error('Failed to finalize audit report');
    }
  }
}

export class FeatureTaskService {
  async createFeatureTask(featureData: Omit<FeatureTask, 'id'>): Promise<FeatureTask> {
    try {
      const taskId = await convexClient.mutation(api.audit.createFeatureTask, {
        name: featureData.name,
        category: featureData.category,
        description: featureData.description,
        implementationStatus: featureData.implementationStatus,
        constitutionPrinciples: featureData.constitutionPrinciples,
        evidence: featureData.evidence,
        priority: featureData.priority
      });

      // Fetch the created task to return it
      const task = await convexClient.query(api.audit.getFeatureTask, { taskId: taskId as any });
      if (!task) {
        throw new Error('Failed to create feature task');
      }

      return task as FeatureTask;
    } catch (error) {
      console.error('Error creating feature task:', error);
      throw new Error('Failed to create feature task');
    }
  }

  async getFeatureTasksByCategory(category: FeatureTask['category']): Promise<FeatureTask[]> {
    try {
      const tasks = await convexClient.query(api.audit.getFeatureTasksByCategory, { category });
      return tasks as FeatureTask[];
    } catch (error) {
      console.error('Error fetching feature tasks by category:', error);
      return [];
    }
  }

  async updateFeatureTask(taskId: string, updates: Partial<FeatureTask>): Promise<FeatureTask> {
    try {
      await convexClient.mutation(api.audit.updateFeatureTask, {
        taskId: taskId as any,
        updates: {
          implementationStatus: updates.implementationStatus,
          constitutionPrinciples: updates.constitutionPrinciples,
          evidence: updates.evidence,
          priority: updates.priority
        }
      });

      // Fetch the updated task
      const task = await convexClient.query(api.audit.getFeatureTask, { taskId: taskId as any });
      if (!task) {
        throw new Error('Feature task not found after update');
      }

      return task as FeatureTask;
    } catch (error) {
      console.error('Error updating feature task:', error);
      throw new Error('Failed to update feature task');
    }
  }

  async assessFeatureImplementation(featureId: string): Promise<'implemented' | 'needs_refinement' | 'missing'> {
    // Mock assessment logic - in real implementation would analyze the feature
    console.log(`Assessing feature: ${featureId}`);
    return 'missing';
  }
}

export class ConstitutionViolationService {
  async createViolation(violationData: Omit<ConstitutionViolation, 'id' | 'createdAt' | 'resolvedAt'>): Promise<ConstitutionViolation> {
    try {
      const violationId = await convexClient.mutation(api.audit.createConstitutionViolation, {
        auditReportId: violationData.auditReportId,
        featureTaskId: violationData.featureTaskId,
        principle: violationData.principle,
        severity: violationData.severity,
        description: violationData.description,
        evidence: violationData.evidence,
        remediation: violationData.remediation,
      });

      // Fetch the created violation to return it
      const violation = await convexClient.query(api.audit.getConstitutionViolation, { violationId: violationId as any });
      if (!violation) {
        throw new Error('Failed to create constitution violation');
      }

      return {
        ...violation,
        createdAt: new Date(violation.createdAt),
        resolvedAt: violation.resolvedAt ? new Date(violation.resolvedAt) : undefined
      } as ConstitutionViolation;
    } catch (error) {
      console.error('Error creating constitution violation:', error);
      throw new Error('Failed to create constitution violation');
    }
  }

  async getViolationsByPrinciple(principle: string): Promise<ConstitutionViolation[]> {
    try {
      const violations = await convexClient.query(api.audit.getViolationsByPrinciple, { principle });
      return violations.map(v => ({
        ...v,
        createdAt: new Date(v.createdAt)
      })) as ConstitutionViolation[];
    } catch (error) {
      console.error('Error fetching violations by principle:', error);
      return [];
    }
  }

  async getViolationsBySeverity(severity: ConstitutionViolation['severity']): Promise<ConstitutionViolation[]> {
    try {
      const violations = await convexClient.query(api.audit.getViolationsBySeverity, { severity });
      return violations.map(v => ({
        ...v,
        createdAt: new Date(v.createdAt)
      })) as ConstitutionViolation[];
    } catch (error) {
      console.error('Error fetching violations by severity:', error);
      return [];
    }
  }

  async resolveViolation(violationId: string, resolution: string): Promise<ConstitutionViolation> {
    try {
      await convexClient.mutation(api.audit.resolveConstitutionViolation, {
        violationId: violationId as any,
        resolution
      });

      // Fetch the updated violation
      const violation = await convexClient.query(api.audit.getConstitutionViolation, { violationId: violationId as any });
      if (!violation) {
        throw new Error('Constitution violation not found after resolution');
      }

      return {
        ...violation,
        createdAt: new Date(violation.createdAt),
        resolvedAt: violation.resolvedAt ? new Date(violation.resolvedAt) : undefined
      } as ConstitutionViolation;
    } catch (error) {
      console.error('Error resolving constitution violation:', error);
      throw new Error('Failed to resolve constitution violation');
    }
  }
}

export class ImplementationGapService {
  async identifyGaps(featureId: string): Promise<ImplementationGap[]> {
    try {
      const gaps = await convexClient.query(api.audit.getGapsByFeature, { featureId });
      return gaps as ImplementationGap[];
    } catch (error) {
      console.error('Error identifying gaps for feature:', error);
      return [];
    }
  }

  async createGap(gapData: Omit<ImplementationGap, 'id' | 'createdAt'>): Promise<ImplementationGap> {
    try {
      const gapId = await convexClient.mutation(api.audit.createImplementationGap, {
        auditReportId: gapData.auditReportId,
        featureTaskId: gapData.featureTaskId,
        featureName: gapData.featureName,
        gapType: gapData.gapType,
        description: gapData.description,
        impact: gapData.impact,
        acceptanceCriteria: gapData.acceptanceCriteria,
        constitutionPrinciples: gapData.constitutionPrinciples,
        estimatedEffort: gapData.estimatedEffort,
        dependencies: gapData.dependencies,
      });

      // Fetch the created gap to return it
      const gap = await convexClient.query(api.audit.getImplementationGap, { gapId: gapId as any });
      if (!gap) {
        throw new Error('Failed to create implementation gap');
      }

      return {
        ...gap,
        createdAt: new Date(gap.createdAt)
      } as ImplementationGap;
    } catch (error) {
      console.error('Error creating implementation gap:', error);
      throw new Error('Failed to create implementation gap');
    }
  }

  async prioritizeGaps(gaps: ImplementationGap[]): Promise<ImplementationGap[]> {
    // Sort by impact severity (blocks_beta is most critical)
    const impactOrder = {
      blocks_beta: 4,
      affects_user_experience: 3,
      performance_issue: 2,
      security_risk: 1
    };

    return gaps.sort((a, b) => {
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }
}

export class ConflictService {
  async detectConflicts(): Promise<Conflict[]> {
    try {
      // In a real implementation, this would analyze the codebase for conflicts
      // For now, return empty array as conflicts are created explicitly
      return [];
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      return [];
    }
  }

  async createConflict(conflictData: Omit<Conflict, 'id' | 'status'>, auditReportId: string): Promise<Conflict> {
    try {
      const conflictId = await convexClient.mutation(api.audit.createConflict, {
        auditReportId: auditReportId as any,
        type: conflictData.type,
        description: conflictData.description,
        affectedFeatures: conflictData.affectedFeatures,
        severity: conflictData.severity,
        resolution: conflictData.resolution
      });

      // Fetch the created conflict to return it
      const conflict = await convexClient.query(api.audit.getConflict, { conflictId: conflictId as any });
      if (!conflict) {
        throw new Error('Failed to create conflict');
      }

      return conflict as Conflict;
    } catch (error) {
      console.error('Error creating conflict:', error);
      throw new Error('Failed to create conflict');
    }
  }

  async resolveConflict(conflictId: string, resolution: string): Promise<Conflict> {
    try {
      await convexClient.mutation(api.audit.resolveConflict, {
        conflictId: conflictId as any,
        resolution
      });

      // Fetch the updated conflict
      const conflict = await convexClient.query(api.audit.getConflict, { conflictId: conflictId as any });
      if (!conflict) {
        throw new Error('Conflict not found after resolution');
      }

      return conflict as Conflict;
    } catch (error) {
      console.error('Error resolving conflict:', error);
      throw new Error('Failed to resolve conflict');
    }
  }
}

export class RecommendationService {
  async generateRecommendations(featureId?: string): Promise<Recommendation[]> {
    try {
      // In a real implementation, this would analyze audit findings and generate recommendations
      // For now, return empty array as recommendations are created explicitly
      if (featureId) {
        console.log(`Generating recommendations for feature: ${featureId}`);
      }
      return [];
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  async createRecommendation(recData: Omit<Recommendation, 'id' | 'status'>, auditReportId: string, featureTaskId?: string): Promise<Recommendation> {
    try {
      const recommendationId = await convexClient.mutation(api.audit.createRecommendation, {
        auditReportId: auditReportId as any,
        featureTaskId: featureTaskId as any,
        type: recData.type,
        title: recData.title,
        description: recData.description,
        priority: recData.priority,
        effort: recData.effort,
        benefits: recData.benefits,
        risks: recData.risks,
        dependencies: recData.dependencies
      });

      // Fetch the created recommendation to return it
      const recommendation = await convexClient.query(api.audit.getRecommendation, { recommendationId: recommendationId as any });
      if (!recommendation) {
        throw new Error('Failed to create recommendation');
      }

      return recommendation as Recommendation;
    } catch (error) {
      console.error('Error creating recommendation:', error);
      throw new Error('Failed to create recommendation');
    }
  }

  async prioritizeRecommendations(recommendations: Recommendation[]): Promise<Recommendation[]> {
    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async updateRecommendationStatus(recId: string, status: Recommendation['status']): Promise<Recommendation> {
    try {
      const updated = await convexClient.mutation(api.audit.updateRecommendationStatus, {
        recommendationId: recId as any,
        status
      });

      return updated as Recommendation;
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      throw new Error('Failed to update recommendation status');
    }
  }
}