import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';

// T058: Anonymize user data
export const anonymizeUserData = mutation({
  args: {
    userId: v.string(),
    dataTypes: v.array(v.string()),
    retentionDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const validDataTypes = ['workout', 'nutrition', 'recovery', 'voice_interaction'];
    const invalidTypes = args.dataTypes.filter(type => !validDataTypes.includes(type));
    
    if (invalidTypes.length > 0) {
      throw new Error(`Invalid data types: ${invalidTypes.join(', ')}`);
    }

    const retentionPeriod = args.retentionDays || 30;
    const cutoffDate = Date.now() - (retentionPeriod * 24 * 60 * 60 * 1000);
    
    let anonymizedCount = 0;

    // Anonymize AI training data
    for (const dataType of args.dataTypes) {
      const trainingDataToAnonymize = await ctx.db
        .query('aiTrainingData')
        .filter((q) => q.eq(q.field('userId'), args.userId))
        .filter((q) => q.eq(q.field('dataType'), dataType))
        .filter((q) => q.lt(q.field('createdAt'), cutoffDate))
        .filter((q) => q.eq(q.field('privacy.anonymized'), false))
        .collect();

      for (const data of trainingDataToAnonymize) {
        // Create anonymized version
        const anonymizedContent = anonymizeContent(data.content, dataType);
        
        await ctx.db.patch(data._id, {
          userId: 'anonymous',
          content: anonymizedContent,
          privacy: {
            ...data.privacy,
            anonymized: true,
            retentionDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year retention
          },
          updatedAt: Date.now(),
        });
        
        anonymizedCount++;
      }
    }

    // Anonymize voice interactions
    if (args.dataTypes.includes('voice_interaction')) {
      const voiceInteractions = await ctx.db
        .query('voiceInteractions')
        .filter((q) => q.eq(q.field('userId'), args.userId))
        .filter((q) => q.lt(q.field('createdAt'), cutoffDate))
        .collect();

      for (const interaction of voiceInteractions) {
        await ctx.db.patch(interaction._id, {
          userId: 'anonymous',
          input: {
            ...interaction.input,
            transcript: interaction.input.transcript ? anonymizeText(interaction.input.transcript) : undefined,
          },
          response: {
            ...interaction.response,
            text: anonymizeText(interaction.response.text),
          },
        });
        
        anonymizedCount++;
      }
    }

    // Log anonymization event
    await ctx.db.insert('securityAuditLog', {
      userId: args.userId,
      eventType: 'data_anonymization',
      riskLevel: 1,
      description: `Anonymized ${anonymizedCount} records for data types: ${args.dataTypes.join(', ')}`,
      metadata: {
        dataTypes: args.dataTypes,
        retentionDays: retentionPeriod,
        recordsAnonymized: anonymizedCount,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      resolved: true,
      expiresAt: Date.now() + (2 * 365 * 24 * 60 * 60 * 1000), // 2 years
    });

    return {
      success: true,
      anonymizedRecords: anonymizedCount,
      dataTypes: args.dataTypes,
      retentionDays: retentionPeriod,
    };
  },
});

// T059: Manage voice cache
export const manageVoiceCache = mutation({
  args: {
    action: v.string(), // 'cleanup', 'extend', 'prioritize'
    maxCacheSize: v.optional(v.number()),
    forceCleanup: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const validActions = ['cleanup', 'extend', 'prioritize'];
    if (!validActions.includes(args.action)) {
      throw new Error(`Invalid action. Must be one of: ${validActions.join(', ')}`);
    }

    let processedCount = 0;

    if (args.action === 'cleanup') {
      // Clean up expired cache entries
      const expiredEntries = await ctx.db
        .query('voiceCache')
        .filter((q) => q.lt(q.field('expiry.expiresAt'), Date.now()))
        .collect();

      for (const entry of expiredEntries) {
        await ctx.db.delete(entry._id);
        processedCount++;
      }

      // If maxCacheSize specified, clean up least used entries
      if (args.maxCacheSize) {
        const allEntries = await ctx.db
          .query('voiceCache')
          .collect();

        if (allEntries.length > args.maxCacheSize) {
          // Sort by popularity and hit count (ascending)
          const sortedEntries = allEntries.sort((a, b) => {
            const scoreA = a.usage.popularity + (a.usage.hitCount * 0.1);
            const scoreB = b.usage.popularity + (b.usage.hitCount * 0.1);
            return scoreA - scoreB;
          });

          const entriesToDelete = sortedEntries.slice(0, allEntries.length - args.maxCacheSize);
          
          for (const entry of entriesToDelete) {
            await ctx.db.delete(entry._id);
            processedCount++;
          }
        }
      }
    } else if (args.action === 'extend') {
      // Extend expiry for popular entries
      const popularEntries = await ctx.db
        .query('voiceCache')
        .filter((q) => q.gt(q.field('usage.hitCount'), 5))
        .filter((q) => q.eq(q.field('expiry.canExtend'), true))
        .collect();

      for (const entry of popularEntries) {
        const newExpiryTime = Date.now() + (14 * 24 * 60 * 60 * 1000); // Extend by 14 days
        
        await ctx.db.patch(entry._id, {
          expiry: {
            ...entry.expiry,
            expiresAt: newExpiryTime,
          },
        });
        
        processedCount++;
      }
    } else if (args.action === 'prioritize') {
      // Update popularity scores based on recent usage
      const allEntries = await ctx.db
        .query('voiceCache')
        .collect();

      for (const entry of allEntries) {
        const daysSinceLastAccess = (Date.now() - entry.usage.lastAccessed) / (24 * 60 * 60 * 1000);
        const hitCountScore = Math.min(entry.usage.hitCount / 10, 1); // Max 1.0
        const recencyScore = Math.max(0, 1 - (daysSinceLastAccess / 30)); // Decay over 30 days
        
        const newPopularity = (hitCountScore * 0.7) + (recencyScore * 0.3);
        
        if (Math.abs(newPopularity - entry.usage.popularity) > 0.05) {
          await ctx.db.patch(entry._id, {
            usage: {
              ...entry.usage,
              popularity: newPopularity,
            },
          });
          
          processedCount++;
        }
      }
    }

    return {
      success: true,
      action: args.action,
      processedEntries: processedCount,
    };
  },
});

// T060: Check constitutional compliance
export const checkConstitutionalCompliance = query({
  args: {
    userId: v.optional(v.string()),
    checkType: v.string(), // 'user_data', 'ai_training', 'voice_interactions', 'all'
    timeRange: v.optional(v.string()), // '24h', '7d', '30d'
  },
  handler: async (ctx, args) => {
    const validCheckTypes = ['user_data', 'ai_training', 'voice_interactions', 'all'];
    if (!validCheckTypes.includes(args.checkType)) {
      throw new Error(`Invalid check type. Must be one of: ${validCheckTypes.join(', ')}`);
    }

    const timeRangeMs = getTimeRangeInMs(args.timeRange || '7d');
    const cutoffDate = Date.now() - timeRangeMs;
    
    const complianceResults = {
      userId: args.userId || 'all',
      checkType: args.checkType,
      timeRange: args.timeRange || '7d',
      timestamp: Date.now(),
      issues: [] as any[],
      summary: {
        totalChecks: 0,
        issuesFound: 0,
        criticalIssues: 0,
        warnings: 0,
      },
    };

    // Check AI training data compliance
    if (args.checkType === 'ai_training' || args.checkType === 'all') {
      let query = ctx.db
        .query('aiTrainingData')
        .filter((q) => q.gt(q.field('createdAt'), cutoffDate));

      if (args.userId) {
        query = query.filter((q) => q.eq(q.field('userId'), args.userId));
      }

      const trainingData = await query.collect();
      complianceResults.summary.totalChecks += trainingData.length;

      for (const data of trainingData) {
        // Check consent compliance
        if (!data.privacy.sharePermission && data.privacy.consentLevel === 'none') {
          complianceResults.issues.push({
            type: 'consent_violation',
            severity: 'critical',
            description: 'Training data without proper consent',
            recordId: data._id,
            userId: data.userId,
            timestamp: data.createdAt,
          });
          complianceResults.summary.criticalIssues++;
        }

        // Check retention period
        if (data.privacy.retentionDate < Date.now()) {
          complianceResults.issues.push({
            type: 'retention_violation',
            severity: 'warning',
            description: 'Data past retention period',
            recordId: data._id,
            userId: data.userId,
            retentionDate: data.privacy.retentionDate,
          });
          complianceResults.summary.warnings++;
        }

        // Check anonymization for old data
        const dataAge = Date.now() - data.createdAt;
        const shouldBeAnonymized = dataAge > (90 * 24 * 60 * 60 * 1000); // 90 days
        
        if (shouldBeAnonymized && !data.privacy.anonymized && data.userId !== 'anonymous') {
          complianceResults.issues.push({
            type: 'anonymization_required',
            severity: 'warning',
            description: 'Data should be anonymized due to age',
            recordId: data._id,
            userId: data.userId,
            dataAge: dataAge,
          });
          complianceResults.summary.warnings++;
        }
      }
    }

    // Check voice interactions compliance
    if (args.checkType === 'voice_interactions' || args.checkType === 'all') {
      let query = ctx.db
        .query('voiceInteractions')
        .filter((q) => q.gt(q.field('createdAt'), cutoffDate));

      if (args.userId) {
        query = query.filter((q) => q.eq(q.field('userId'), args.userId));
      }

      const voiceInteractions = await query.collect();
      complianceResults.summary.totalChecks += voiceInteractions.length;

      for (const interaction of voiceInteractions) {
        // Check for PII in transcripts
        if (interaction.input.transcript && containsPII(interaction.input.transcript)) {
          complianceResults.issues.push({
            type: 'pii_exposure',
            severity: 'critical',
            description: 'Potential PII found in voice transcript',
            recordId: interaction._id,
            userId: interaction.userId,
            timestamp: interaction.createdAt,
          });
          complianceResults.summary.criticalIssues++;
        }

        // Check retention for voice data
        const voiceDataAge = Date.now() - interaction.createdAt;
        const voiceRetentionLimit = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        if (voiceDataAge > voiceRetentionLimit) {
          complianceResults.issues.push({
            type: 'voice_retention_violation',
            severity: 'warning',
            description: 'Voice interaction data past retention limit',
            recordId: interaction._id,
            userId: interaction.userId,
            dataAge: voiceDataAge,
          });
          complianceResults.summary.warnings++;
        }
      }
    }

    complianceResults.summary.issuesFound = complianceResults.issues.length;

    return complianceResults;
  },
});

// Helper functions
function anonymizeContent(content: any, dataType: string): any {
  // Create anonymized version of content
  const anonymized = JSON.parse(JSON.stringify(content));
  
  if (dataType === 'workout' && anonymized.workout) {
    // Remove specific weights, just keep relative patterns
    if (anonymized.workout.weights) {
      anonymized.workout.weights = anonymized.workout.weights.map((_: number, index: number) => index + 1);
    }
    // Remove specific exercise names, use categories
    if (anonymized.workout.exercises) {
      anonymized.workout.exercises = anonymized.workout.exercises.map(() => 'exercise');
    }
  }
  
  if (dataType === 'voice_interaction' && anonymized.voiceInteraction) {
    if (anonymized.voiceInteraction.transcript) {
      anonymized.voiceInteraction.transcript = anonymizeText(anonymized.voiceInteraction.transcript);
    }
  }
  
  return anonymized;
}

function anonymizeText(text: string): string {
  // Simple anonymization - replace potential names and personal info
  return text
    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]') // Names
    .replace(/\b\d{3}-?\d{3}-?\d{4}\b/g, '[PHONE]') // Phone numbers
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Emails
    .replace(/\b\d{1,5}\s[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi, '[ADDRESS]'); // Addresses
}

function containsPII(text: string): boolean {
  // Check for potential PII patterns
  const piiPatterns = [
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/, // Names
    /\b\d{3}-?\d{3}-?\d{4}\b/, // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Emails
    /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN patterns
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card patterns
  ];
  
  return piiPatterns.some(pattern => pattern.test(text));
}

function getTimeRangeInMs(timeRange: string): number {
  switch (timeRange) {
    case '24h':
      return 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}