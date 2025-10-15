/* eslint-disable */
/**
 * Temporary API workaround for audit functions
 * This manually exposes the audit functions until Convex bundling is fixed
 */

import { anyApi } from "convex/server";

// Create a manual API structure for audit functions
const auditApi = {
  createAuditReport: anyApi,
  updateAuditReport: anyApi,
  getAuditReport: anyApi,
  getAuditReports: anyApi,
  deleteAuditReport: anyApi,

  createFeatureTask: anyApi,
  updateFeatureTask: anyApi,
  getFeatureTask: anyApi,
  getFeatureTasks: anyApi,
  deleteFeatureTask: anyApi,

  createConstitutionViolation: anyApi,
  updateConstitutionViolation: anyApi,
  getConstitutionViolation: anyApi,
  getConstitutionViolations: anyApi,
  deleteConstitutionViolation: anyApi,

  createImplementationGap: anyApi,
  updateImplementationGap: anyApi,
  getImplementationGap: anyApi,
  getImplementationGaps: anyApi,
  deleteImplementationGap: anyApi,

  createConflict: anyApi,
  updateConflict: anyApi,
  getConflict: anyApi,
  getConflicts: anyApi,
  deleteConflict: anyApi,

  createRecommendation: anyApi,
  updateRecommendation: anyApi,
  getRecommendation: anyApi,
  getRecommendations: anyApi,
  deleteRecommendation: anyApi,

  createAuditSession: anyApi,
  updateAuditSession: anyApi,
  getAuditSession: anyApi,
  getAuditSessions: anyApi,
  deleteAuditSession: anyApi,
};

/**
 * A utility for referencing Convex functions in your app's API.
 */
export const api = {
  audit: auditApi,
};

export const internal = api;