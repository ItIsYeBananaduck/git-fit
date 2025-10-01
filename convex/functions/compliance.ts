/**
 * Constitutional Compliance Functions
 * Enforces constitutional requirements for AI training and data handling
 */

import { query, mutation } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Validates data retention compliance (6-month limit)
 */
export const validateDataRetention = query({
  args: {
    data: v.object({
      workoutId: v.string(),
      createdAt: v.any(), // Date object
      anonymizedData: v.any()
    })
  },
  handler: async (ctx, args) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const dataDate = new Date(args.data.createdAt);
    const isCompliant = dataDate >= sixMonthsAgo;
    
    return {
      isCompliant,
      reason: isCompliant ? 'within retention limit' : 'exceeds 6-month retention limit',
      shouldBeDeleted: !isCompliant,
      dataAge: Math.floor((Date.now() - dataDate.getTime()) / (1000 * 60 * 60 * 24)), // days
    };
  }
});

/**
 * Anonymizes data and validates anonymization integrity
 */
export const anonymizeAndValidate = mutation({
  args: {
    rawData: v.object({
      userId: v.string(),
      email: v.optional(v.string()),
      location: v.optional(v.string()),
      workoutData: v.any()
    })
  },
  handler: async (ctx, args) => {
    // Anonymize sensitive fields
    const anonymizedData = {
      ...args.rawData.workoutData,
      userId: `anon_${args.rawData.userId.slice(-4)}`, // Keep last 4 chars
      // Remove PII fields
      email: undefined,
      location: undefined,
      personalNotes: args.rawData.workoutData.personalNotes ? '[REDACTED]' : undefined
    };
    
    // Generate hash for integrity verification
    const dataString = JSON.stringify(anonymizedData);
    const hashIntegrity = dataString.includes(args.rawData.userId) || 
                         dataString.includes(args.rawData.email || '') ||
                         dataString.includes(args.rawData.location || '') ? 'failed' : 'verified';
    
    return {
      isAnonymized: hashIntegrity === 'verified',
      anonymizedData,
      hashIntegrity
    };
  }
});

/**
 * Validates user consent for data usage
 */
export const validateUserConsent = query({
  args: {
    data: v.object({
      workoutId: v.string(),
      userConsent: v.boolean(),
      anonymizedData: v.any()
    })
  },
  handler: async (ctx, args) => {
    const isValid = args.data.userConsent === true;
    
    return {
      isValid,
      reason: isValid ? 'valid consent provided' : 'user consent required',
      dataRejected: !isValid
    };
  }
});

/**
 * Constitutional compliance check for general data processing
 * Validates PII detection, retention limits, and consent requirements
 */
export const checkConstitutionalCompliance = query({
  args: {
    data: v.any(),
    operation: v.string()
  },
  handler: async (ctx, args) => {
    const violations = [];
    
    // Check for PII patterns
    const dataString = JSON.stringify(args.data);
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phonePattern = /\b\d{3}-?\d{3}-?\d{4}\b/;
    const ssnPattern = /\b\d{3}-?\d{2}-?\d{4}\b/;
    
    if (emailPattern.test(dataString)) violations.push('email_detected');
    if (phonePattern.test(dataString)) violations.push('phone_detected');
    if (ssnPattern.test(dataString)) violations.push('ssn_detected');
    
    // Check operation compliance
    const isCompliant = violations.length === 0;
    
    return {
      isCompliant,
      violations,
      operation: args.operation,
      recommendation: isCompliant ? 'approved' : 'requires_anonymization'
    };
  }
});