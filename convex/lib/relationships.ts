/**
 * Entity Relationship Management for OAuth & Platform-Specific UI
 * 
 * Since Convex doesn't have native foreign key constraints, this module provides
 * relationship validation, cascade operations, and referential integrity enforcement.
 */

import { ConvexError } from 'convex/values';

// ====================================================================================
// RELATIONSHIP DEFINITIONS
// ====================================================================================

export interface EntityRelationship {
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many';
  cascadeDelete: boolean;
  cascadeUpdate: boolean;
  required: boolean;
}

/**
 * Complete relationship map for all OAuth and Platform UI entities
 */
export const ENTITY_RELATIONSHIPS: EntityRelationship[] = [
  // OAuth Provider Relationships
  {
    fromTable: 'userOAuthConnections',
    fromField: 'providerId',
    toTable: 'oauthProviders',
    toField: 'id',
    relationshipType: 'many-to-many',
    cascadeDelete: false, // Don't delete providers when connections are removed
    cascadeUpdate: true,
    required: true
  },
  {
    fromTable: 'oauthSessions',
    fromField: 'providerId',
    toTable: 'oauthProviders',
    toField: 'id',
    relationshipType: 'many-to-many',
    cascadeDelete: false,
    cascadeUpdate: true,
    required: true
  },

  // User Relationships
  {
    fromTable: 'userOAuthConnections',
    fromField: 'userId',
    toTable: 'users',
    toField: '_id',
    relationshipType: 'one-to-many',
    cascadeDelete: true, // Delete connections when user is deleted
    cascadeUpdate: true,
    required: true
  },
  {
    fromTable: 'musicProfiles',
    fromField: 'userId',
    toTable: 'users',
    toField: '_id',
    relationshipType: 'one-to-one',
    cascadeDelete: true,
    cascadeUpdate: true,
    required: true
  },
  {
    fromTable: 'platformUIStates',
    fromField: 'userId',
    toTable: 'users',
    toField: '_id',
    relationshipType: 'one-to-many',
    cascadeDelete: true,
    cascadeUpdate: true,
    required: true
  },
  {
    fromTable: 'oauthSessions',
    fromField: 'userId',
    toTable: 'users',
    toField: '_id',
    relationshipType: 'one-to-many',
    cascadeDelete: true,
    cascadeUpdate: true,
    required: true
  },
  {
    fromTable: 'workoutMusicRecommendations',
    fromField: 'userId',
    toTable: 'users',
    toField: '_id',
    relationshipType: 'one-to-many',
    cascadeDelete: true,
    cascadeUpdate: true,
    required: true
  },

  // Music Profile Relationships
  {
    fromTable: 'workoutMusicRecommendations',
    fromField: 'userId',
    toTable: 'musicProfiles',
    toField: 'userId',
    relationshipType: 'many-to-many', // Via userId
    cascadeDelete: false, // Keep recommendations even if profile changes
    cascadeUpdate: true,
    required: false
  },
  {
    fromTable: 'musicProfiles',
    fromField: 'primaryProvider',
    toTable: 'oauthProviders',
    toField: 'id',
    relationshipType: 'many-to-many',
    cascadeDelete: false,
    cascadeUpdate: true,
    required: false
  },

  // Workout Relationships
  {
    fromTable: 'workoutMusicRecommendations',
    fromField: 'workoutId',
    toTable: 'fitnessData', // Assuming workout data is stored here
    toField: '_id',
    relationshipType: 'many-to-many',
    cascadeDelete: false, // Keep recommendations even if workout is deleted
    cascadeUpdate: true,
    required: false
  },

  // Cross-Entity Data Consistency
  {
    fromTable: 'userOAuthConnections',
    fromField: 'userId',
    toTable: 'musicProfiles',
    toField: 'userId',
    relationshipType: 'one-to-one', // Via userId
    cascadeDelete: false, // Managed separately
    cascadeUpdate: true,
    required: false
  }
];

// ====================================================================================
// VALIDATION UTILITIES
// ====================================================================================

/**
 * Validate entity relationships before insert/update operations
 * This should be called from Convex mutation functions
 */
export function validateEntityRelationships(entityType: string, entity: any): void {
  const relationships = ENTITY_RELATIONSHIPS.filter(rel => rel.fromTable === entityType);
  
  for (const relationship of relationships) {
    const foreignKeyValue = extractFieldValue(entity, relationship.fromField);
    
    if (!foreignKeyValue && relationship.required) {
      throw new ConvexError({
        message: `Required foreign key ${relationship.fromField} is missing`,
        relationship: relationship.fromTable + ' -> ' + relationship.toTable
      });
    }
    
    // Note: Actual reference validation would need to be done in the Convex function
    // with access to the database, this just validates the structure
  }
}

/**
 * Get cascade delete information for an entity
 */
export function getCascadeDeleteInfo(entityType: string): {
  tablesToCheck: string[];
  relationships: EntityRelationship[];
} {
  const relationships = ENTITY_RELATIONSHIPS.filter(
    rel => rel.toTable === entityType && rel.cascadeDelete
  );
  
  const tablesToCheck = [...new Set(relationships.map(rel => rel.fromTable))];
  
  return {
    tablesToCheck,
    relationships
  };
}

/**
 * Get foreign key constraints for an entity
 */
export function getForeignKeyConstraints(entityType: string): EntityRelationship[] {
  return ENTITY_RELATIONSHIPS.filter(rel => rel.fromTable === entityType);
}

/**
 * Check if deletion is allowed (no non-cascade references exist)
 */
export function getDeletionConstraints(entityType: string): {
  mustCheckTables: string[];
  relationships: EntityRelationship[];
} {
  const relationships = ENTITY_RELATIONSHIPS.filter(
    rel => rel.toTable === entityType && !rel.cascadeDelete
  );
  
  const mustCheckTables = [...new Set(relationships.map(rel => rel.fromTable))];
  
  return {
    mustCheckTables,
    relationships
  };
}

// ====================================================================================
// UTILITY FUNCTIONS
// ====================================================================================

/**
 * Extract field value, handling nested paths like 'tracks[].providerId'
 */
function extractFieldValue(entity: any, fieldPath: string): any {
  if (fieldPath.includes('[].')) {
    // Handle array field extraction
    const [arrayPath, fieldName] = fieldPath.split('[].');
    const arrayValue = getNestedValue(entity, arrayPath);
    
    if (Array.isArray(arrayValue)) {
      return arrayValue.map(item => getNestedValue(item, fieldName)).filter(Boolean);
    }
    return null;
  } else {
    return getNestedValue(entity, fieldPath);
  }
}

/**
 * Get nested object value by path (e.g., 'context.workoutType')
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// ====================================================================================
// RELATIONSHIP DOCUMENTATION
// ====================================================================================

/**
 * Entity Relationship Documentation
 * 
 * This section documents all the relationships between entities and provides
 * guidance for maintaining referential integrity in Convex functions.
 * 
 * USERS (Central Entity)
 * ├── userOAuthConnections (1:many, cascade delete)
 * ├── musicProfiles (1:1, cascade delete)
 * ├── platformUIStates (1:many, cascade delete)
 * ├── oauthSessions (1:many, cascade delete)
 * └── workoutMusicRecommendations (1:many, cascade delete)
 * 
 * OAUTH_PROVIDERS
 * ├── userOAuthConnections (many:many, no cascade)
 * ├── oauthSessions (many:many, no cascade)
 * └── musicProfiles.primaryProvider (many:many, no cascade)
 * 
 * MUSIC_PROFILES
 * ├── workoutMusicRecommendations (via userId, no cascade)
 * └── primaryProvider -> oauthProviders (many:many, no cascade)
 * 
 * WORKOUT_MUSIC_RECOMMENDATIONS
 * ├── userId -> users (many:1, cascade delete)
 * ├── workoutId -> fitnessData (many:many, no cascade, optional)
 * └── tracks[].providerId -> oauthProviders (many:many, no cascade)
 * 
 * Usage in Convex Functions:
 * 
 * 1. Before INSERT/UPDATE:
 *    ```typescript
 *    import { validateEntityRelationships } from './lib/relationships';
 *    validateEntityRelationships('userOAuthConnections', newConnection);
 *    // Then validate foreign keys exist in database
 *    ```
 * 
 * 2. Before DELETE:
 *    ```typescript
 *    import { getDeletionConstraints, getCascadeDeleteInfo } from './lib/relationships';
 *    
 *    const constraints = getDeletionConstraints('users');
 *    // Check that no non-cascade references exist
 *    
 *    const cascadeInfo = getCascadeDeleteInfo('users');
 *    // Delete all cascade-dependent entities first
 *    ```
 * 
 * 3. Data Consistency Checks:
 *    ```typescript
 *    import { getForeignKeyConstraints } from './lib/relationships';
 *    
 *    const constraints = getForeignKeyConstraints('userOAuthConnections');
 *    // Validate all foreign key references exist
 *    ```
 */

// Export relationship management utilities
export const relationshipUtils = {
  validateEntityRelationships,
  getCascadeDeleteInfo,
  getForeignKeyConstraints,
  getDeletionConstraints,
  extractFieldValue: extractFieldValue,
  getNestedValue: getNestedValue
};