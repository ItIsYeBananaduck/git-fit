import { z } from 'zod';

/**
 * Conflict resolution strategy type
 */
export type ConflictResolutionStrategy = 
  | 'prefer_remote' 
  | 'prefer_local' 
  | 'prefer_latest' 
  | 'merge_data' 
  | 'manual_review' 
  | 'user_decision';

/**
 * Data source type
 */
export type DataSource = 'local' | 'remote' | 'sync' | 'import';

/**
 * Conflict severity level
 */
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Data type that can have conflicts
 */
export type ConflictableDataType = 
  | 'workout_entry' 
  | 'macro_profile' 
  | 'custom_food' 
  | 'training_relationship' 
  | 'user_profile' 
  | 'exercise_data';

/**
 * Field-level conflict information
 */
export interface FieldConflict {
  fieldName: string;
  localValue: unknown;
  remoteValue: unknown;
  valueType: string; // 'string', 'number', 'object', etc.
  lastLocalUpdate: string;
  lastRemoteUpdate: string;
  conflictScore: number; // 0-1, how different the values are
  suggested_resolution: unknown; // AI or rule-based suggestion
}

/**
 * Conflict resolution result
 */
export interface ConflictResolution {
  strategy: ConflictResolutionStrategy;
  resolvedValue: unknown;
  resolvedAt: string;
  resolvedBy: string; // 'system', 'user', 'ai'
  confidence: number; // 0-1 for AI resolutions
  humanVerified: boolean;
  notes?: string;
}

/**
 * Data conflict interface
 */
export interface DataConflict {
  _id?: string;
  userId: string;
  dataType: ConflictableDataType;
  entityId: string; // ID of the conflicting entity
  severity: ConflictSeverity;
  
  // Version information
  localVersion: number;
  remoteVersion: number;
  baseVersion?: number; // Common ancestor version
  
  // Data snapshots
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  baseData?: Record<string, unknown>; // Common ancestor data
  
  // Field-level conflict details
  fieldConflicts: FieldConflict[];
  
  // Resolution information
  isResolved: boolean;
  resolution?: ConflictResolution;
  autoResolvable: boolean;
  requiresUserInput: boolean;
  
  // Timestamps
  detectedAt: string;
  lastAttemptAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Metadata
  syncSessionId?: string;
  deviceId?: string;
  conflictHash: string; // Unique identifier for this specific conflict
  retryCount: number;
  maxRetries: number;
}

/**
 * Data interface for creating/updating data conflicts
 */
interface DataConflictData extends DataConflict {
  // Additional internal fields
  resolutionHistory?: ConflictResolution[];
  escalationLevel?: number; // How many times this has been escalated
  userNotified?: boolean;
  aiRecommendation?: {
    strategy: ConflictResolutionStrategy;
    confidence: number;
    reasoning: string;
  };
}

/**
 * Validation schemas
 */
const FieldConflictSchema = z.object({
  fieldName: z.string().min(1),
  localValue: z.unknown(),
  remoteValue: z.unknown(),
  valueType: z.string(),
  lastLocalUpdate: z.string().datetime(),
  lastRemoteUpdate: z.string().datetime(),
  conflictScore: z.number().min(0).max(1),
  suggested_resolution: z.unknown()
});

const ConflictResolutionSchema = z.object({
  strategy: z.enum(['prefer_remote', 'prefer_local', 'prefer_latest', 'merge_data', 'manual_review', 'user_decision']),
  resolvedValue: z.unknown(),
  resolvedAt: z.string().datetime(),
  resolvedBy: z.string(),
  confidence: z.number().min(0).max(1),
  humanVerified: z.boolean(),
  notes: z.string().optional()
});

const DataConflictDataSchema = z.object({
  _id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  dataType: z.enum(['workout_entry', 'macro_profile', 'custom_food', 'training_relationship', 'user_profile', 'exercise_data']),
  entityId: z.string().min(1, 'Entity ID is required'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  
  localVersion: z.number().min(0),
  remoteVersion: z.number().min(0),
  baseVersion: z.number().min(0).optional(),
  
  localData: z.record(z.unknown()),
  remoteData: z.record(z.unknown()),
  baseData: z.record(z.unknown()).optional(),
  
  fieldConflicts: z.array(FieldConflictSchema),
  
  isResolved: z.boolean(),
  resolution: ConflictResolutionSchema.optional(),
  autoResolvable: z.boolean(),
  requiresUserInput: z.boolean(),
  
  detectedAt: z.string().datetime(),
  lastAttemptAt: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  
  syncSessionId: z.string().optional(),
  deviceId: z.string().optional(),
  conflictHash: z.string().min(1),
  retryCount: z.number().min(0),
  maxRetries: z.number().min(1),
  
  // Internal fields
  resolutionHistory: z.array(ConflictResolutionSchema).optional(),
  escalationLevel: z.number().min(0).optional(),
  userNotified: z.boolean().optional(),
  aiRecommendation: z.object({
    strategy: z.enum(['prefer_remote', 'prefer_local', 'prefer_latest', 'merge_data', 'manual_review', 'user_decision']),
    confidence: z.number().min(0).max(1),
    reasoning: z.string()
  }).optional()
});

/**
 * DataConflictEntity class for handling data synchronization conflicts
 */
export class DataConflictEntity {
  private data: DataConflictData;

  constructor(data: DataConflictData) {
    // Validate input data
    const validationResult = DataConflictDataSchema.safeParse(data);
    if (!validationResult.success) {
      throw new Error(`Invalid data conflict data: ${JSON.stringify((validationResult as { error: { issues: unknown[] } }).error.issues)}`);
    }

    this.data = {
      ...data,
      retryCount: data.retryCount || 0,
      maxRetries: data.maxRetries || 3,
      resolutionHistory: data.resolutionHistory || [],
      escalationLevel: data.escalationLevel || 0,
      userNotified: data.userNotified || false
    };
  }

  // Getters for basic properties
  get id(): string | undefined { return this.data._id; }
  get userId(): string { return this.data.userId; }
  get dataType(): ConflictableDataType { return this.data.dataType; }
  get entityId(): string { return this.data.entityId; }
  get severity(): ConflictSeverity { return this.data.severity; }
  get localVersion(): number { return this.data.localVersion; }
  get remoteVersion(): number { return this.data.remoteVersion; }
  get baseVersion(): number | undefined { return this.data.baseVersion; }
  get localData(): Record<string, unknown> { return this.data.localData; }
  get remoteData(): Record<string, unknown> { return this.data.remoteData; }
  get baseData(): Record<string, unknown> | undefined { return this.data.baseData; }
  get fieldConflicts(): FieldConflict[] { return this.data.fieldConflicts; }
  get isResolved(): boolean { return this.data.isResolved; }
  get resolution(): ConflictResolution | undefined { return this.data.resolution; }
  get autoResolvable(): boolean { return this.data.autoResolvable; }
  get requiresUserInput(): boolean { return this.data.requiresUserInput; }
  get detectedAt(): string { return this.data.detectedAt; }
  get lastAttemptAt(): string | undefined { return this.data.lastAttemptAt; }
  get resolvedAt(): string | undefined { return this.data.resolvedAt; }
  get createdAt(): string { return this.data.createdAt; }
  get updatedAt(): string { return this.data.updatedAt; }
  get conflictHash(): string { return this.data.conflictHash; }
  get retryCount(): number { return this.data.retryCount; }
  get maxRetries(): number { return this.data.maxRetries; }
  get escalationLevel(): number { return this.data.escalationLevel || 0; }
  get aiRecommendation(): DataConflictData['aiRecommendation'] { return this.data.aiRecommendation; }

  /**
   * Check if conflict can be automatically resolved
   */
  canAutoResolve(): boolean {
    if (this.data.isResolved) return false;
    if (!this.data.autoResolvable) return false;
    if (this.data.retryCount >= this.data.maxRetries) return false;
    if (this.data.severity === 'critical') return false;
    
    return true;
  }

  /**
   * Check if conflict needs user intervention
   */
  needsUserIntervention(): boolean {
    return this.data.requiresUserInput || 
           this.data.severity === 'critical' ||
           this.data.retryCount >= this.data.maxRetries ||
           (this.data.aiRecommendation?.confidence || 0) < 0.7;
  }

  /**
   * Calculate conflict complexity score
   */
  getComplexityScore(): number {
    let score = 0;
    
    // Base score based on number of conflicting fields
    score += this.data.fieldConflicts.length * 0.2;
    
    // Severity multiplier
    const severityMultiplier = {
      low: 1,
      medium: 1.5,
      high: 2,
      critical: 3
    };
    score *= severityMultiplier[this.data.severity];
    
    // Version distance factor
    const versionDistance = Math.abs(this.data.localVersion - this.data.remoteVersion);
    score += versionDistance * 0.1;
    
    // Field conflict scores
    const avgFieldConflictScore = this.data.fieldConflicts.reduce(
      (sum, conflict) => sum + conflict.conflictScore, 0
    ) / Math.max(this.data.fieldConflicts.length, 1);
    score += avgFieldConflictScore;
    
    return Math.min(score, 10); // Cap at 10
  }

  /**
   * Attempt automatic resolution using various strategies
   */
  async attemptAutoResolution(): Promise<boolean> {
    if (!this.canAutoResolve()) {
      return false;
    }

    this.data.retryCount += 1;
    this.data.lastAttemptAt = new Date().toISOString();
    this.data.updatedAt = new Date().toISOString();

    try {
      let resolution: ConflictResolution | null = null;

      // Try different resolution strategies based on conflict characteristics
      if (this.data.severity === 'low' && this.data.fieldConflicts.length === 1) {
        resolution = await this.tryPreferLatestStrategy();
      } else if (this.data.aiRecommendation && this.data.aiRecommendation.confidence > 0.8) {
        resolution = await this.tryAIRecommendedStrategy();
      } else if (this.hasTimeBasedResolution()) {
        resolution = await this.tryPreferLatestStrategy();
      } else if (this.canMergeNonConflictingFields()) {
        resolution = await this.tryMergeStrategy();
      }

      if (resolution) {
        this.applyResolution(resolution);
        return true;
      }

      return false;
    } catch {
      // Auto-resolution failed, may need manual intervention
      if (this.data.retryCount >= this.data.maxRetries) {
        this.data.requiresUserInput = true;
        this.escalate();
      }
      return false;
    }
  }

  /**
   * Apply a manual resolution
   */
  applyManualResolution(
    strategy: ConflictResolutionStrategy, 
    resolvedValue: unknown, 
    userId: string,
    notes?: string
  ): void {
    const resolution: ConflictResolution = {
      strategy,
      resolvedValue,
      resolvedAt: new Date().toISOString(),
      resolvedBy: userId,
      confidence: 1.0, // Human resolution has full confidence
      humanVerified: true,
      notes
    };

    this.applyResolution(resolution);
  }

  /**
   * Apply resolution to the conflict
   */
  private applyResolution(resolution: ConflictResolution): void {
    this.data.resolution = resolution;
    this.data.isResolved = true;
    this.data.resolvedAt = resolution.resolvedAt;
    this.data.updatedAt = new Date().toISOString();

    // Add to resolution history
    if (!this.data.resolutionHistory) {
      this.data.resolutionHistory = [];
    }
    this.data.resolutionHistory.push(resolution);
  }

  /**
   * Escalate conflict for manual review
   */
  escalate(): void {
    this.data.escalationLevel = (this.data.escalationLevel || 0) + 1;
    this.data.requiresUserInput = true;
    this.data.userNotified = false; // Reset to trigger new notification
    this.data.updatedAt = new Date().toISOString();

    // Increase severity if escalated multiple times
    if (this.data.escalationLevel >= 2 && this.data.severity !== 'critical') {
      if (this.data.severity === 'low') this.data.severity = 'medium';
      else if (this.data.severity === 'medium') this.data.severity = 'high';
      else if (this.data.severity === 'high') this.data.severity = 'critical';
    }
  }

  /**
   * Mark user as notified about this conflict
   */
  markUserNotified(): void {
    this.data.userNotified = true;
    this.data.updatedAt = new Date().toISOString();
  }

  /**
   * Add AI recommendation for resolution
   */
  addAIRecommendation(
    strategy: ConflictResolutionStrategy,
    confidence: number,
    reasoning: string
  ): void {
    this.data.aiRecommendation = {
      strategy,
      confidence,
      reasoning
    };
    
    // Update auto-resolvable status based on AI confidence
    if (confidence > 0.8 && this.data.severity !== 'critical') {
      this.data.autoResolvable = true;
    }
    
    this.data.updatedAt = new Date().toISOString();
  }

  /**
   * Strategy implementations
   */
  private async tryPreferLatestStrategy(): Promise<ConflictResolution | null> {
    // Compare timestamps to determine which data is more recent
    const localUpdateTime = this.getLatestUpdateTime(this.data.localData);
    const remoteUpdateTime = this.getLatestUpdateTime(this.data.remoteData);
    
    const strategy: ConflictResolutionStrategy = localUpdateTime > remoteUpdateTime 
      ? 'prefer_local' 
      : 'prefer_remote';
    
    const resolvedValue = strategy === 'prefer_local' 
      ? this.data.localData 
      : this.data.remoteData;

    return {
      strategy: 'prefer_latest',
      resolvedValue,
      resolvedAt: new Date().toISOString(),
      resolvedBy: 'system',
      confidence: 0.8,
      humanVerified: false
    };
  }

  private async tryAIRecommendedStrategy(): Promise<ConflictResolution | null> {
    if (!this.data.aiRecommendation) return null;

    const { strategy, confidence } = this.data.aiRecommendation;
    let resolvedValue: unknown;

    switch (strategy) {
      case 'prefer_local':
        resolvedValue = this.data.localData;
        break;
      case 'prefer_remote':
        resolvedValue = this.data.remoteData;
        break;
      case 'merge_data':
        resolvedValue = await this.mergeDataIntelligently();
        break;
      default:
        return null;
    }

    return {
      strategy,
      resolvedValue,
      resolvedAt: new Date().toISOString(),
      resolvedBy: 'ai',
      confidence,
      humanVerified: false
    };
  }

  private async tryMergeStrategy(): Promise<ConflictResolution | null> {
    const mergedData = await this.mergeDataIntelligently();
    
    return {
      strategy: 'merge_data',
      resolvedValue: mergedData,
      resolvedAt: new Date().toISOString(),
      resolvedBy: 'system',
      confidence: 0.7,
      humanVerified: false
    };
  }

  /**
   * Utility methods
   */
  private hasTimeBasedResolution(): boolean {
    return this.data.fieldConflicts.every(conflict => {
      const localTime = new Date(conflict.lastLocalUpdate).getTime();
      const remoteTime = new Date(conflict.lastRemoteUpdate).getTime();
      return Math.abs(localTime - remoteTime) > 60000; // More than 1 minute difference
    });
  }

  private canMergeNonConflictingFields(): boolean {
    // Can merge if there are non-conflicting fields that can be combined
    const localKeys = Object.keys(this.data.localData);
    const remoteKeys = Object.keys(this.data.remoteData);
    const conflictingFields = new Set(this.data.fieldConflicts.map(c => c.fieldName));
    
    const nonConflictingLocalFields = localKeys.filter(key => !conflictingFields.has(key));
    const nonConflictingRemoteFields = remoteKeys.filter(key => !conflictingFields.has(key));
    
    return nonConflictingLocalFields.length > 0 || nonConflictingRemoteFields.length > 0;
  }

  private getLatestUpdateTime(data: Record<string, unknown>): number {
    const timestamps = ['updatedAt', 'lastModified', 'modifiedAt']
      .map(field => data[field])
      .filter(value => typeof value === 'string')
      .map(timestamp => new Date(timestamp as string).getTime())
      .filter(time => !isNaN(time));
    
    return timestamps.length > 0 ? Math.max(...timestamps) : 0;
  }

  private async mergeDataIntelligently(): Promise<Record<string, unknown>> {
    const merged = { ...this.data.baseData || {} };
    
    // Add non-conflicting fields from both sources
    const conflictingFields = new Set(this.data.fieldConflicts.map(c => c.fieldName));
    
    Object.keys(this.data.localData).forEach(key => {
      if (!conflictingFields.has(key)) {
        merged[key] = this.data.localData[key];
      }
    });
    
    Object.keys(this.data.remoteData).forEach(key => {
      if (!conflictingFields.has(key)) {
        merged[key] = this.data.remoteData[key];
      }
    });
    
    // For conflicting fields, use suggested resolution or prefer newer
    this.data.fieldConflicts.forEach(conflict => {
      if (conflict.suggested_resolution !== undefined) {
        merged[conflict.fieldName] = conflict.suggested_resolution;
      } else {
        // Prefer the value with more recent timestamp
        const localTime = new Date(conflict.lastLocalUpdate).getTime();
        const remoteTime = new Date(conflict.lastRemoteUpdate).getTime();
        merged[conflict.fieldName] = localTime > remoteTime 
          ? conflict.localValue 
          : conflict.remoteValue;
      }
    });
    
    return merged;
  }

  /**
   * Generate summary for display
   */
  getSummary() {
    const complexityScore = this.getComplexityScore();
    
    return {
      id: this.data._id,
      dataType: this.data.dataType,
      entityId: this.data.entityId,
      severity: this.data.severity,
      isResolved: this.data.isResolved,
      autoResolvable: this.data.autoResolvable,
      requiresUserInput: this.data.requiresUserInput,
      fieldConflictCount: this.data.fieldConflicts.length,
      complexityScore,
      retryCount: this.data.retryCount,
      escalationLevel: this.data.escalationLevel,
      detectedAt: this.data.detectedAt,
      resolvedAt: this.data.resolvedAt,
      aiRecommendation: this.data.aiRecommendation,
      conflictHash: this.data.conflictHash
    };
  }

  /**
   * Convert to JSON for storage
   */
  toJSON(): DataConflictData {
    return { ...this.data };
  }

  /**
   * Convert to API contract format
   */
  toApiFormat(): DataConflict {
    const apiData = { ...this.data };
    // Remove internal fields
    delete apiData.resolutionHistory;
    delete apiData.escalationLevel;
    delete apiData.userNotified;
    delete apiData.aiRecommendation;
    return apiData;
  }

  /**
   * Static factory methods
   */

  /**
   * Create DataConflictEntity from JSON data
   */
  static fromJSON(data: DataConflictData): DataConflictEntity {
    return new DataConflictEntity(data);
  }

  /**
   * Create new data conflict
   */
  static createNew(
    userId: string,
    dataType: ConflictableDataType,
    entityId: string,
    localData: Record<string, unknown>,
    remoteData: Record<string, unknown>,
    options: {
      localVersion: number;
      remoteVersion: number;
      baseData?: Record<string, unknown>;
      baseVersion?: number;
      syncSessionId?: string;
      deviceId?: string;
    }
  ): DataConflictEntity {
    const now = new Date().toISOString();
    
    // Analyze field conflicts
    const fieldConflicts = DataConflictEntity.analyzeFieldConflicts(localData, remoteData);
    
    // Calculate severity based on conflict analysis
    const severity = DataConflictEntity.calculateSeverity(fieldConflicts, dataType);
    
    // Generate conflict hash
    const conflictHash = DataConflictEntity.generateConflictHash(
      entityId, 
      options.localVersion, 
      options.remoteVersion, 
      fieldConflicts
    );

    const data: DataConflictData = {
      userId,
      dataType,
      entityId,
      severity,
      localVersion: options.localVersion,
      remoteVersion: options.remoteVersion,
      baseVersion: options.baseVersion,
      localData,
      remoteData,
      baseData: options.baseData,
      fieldConflicts,
      isResolved: false,
      autoResolvable: severity === 'low' && fieldConflicts.length <= 2,
      requiresUserInput: severity === 'critical' || fieldConflicts.length > 5,
      detectedAt: now,
      createdAt: now,
      updatedAt: now,
      syncSessionId: options.syncSessionId,
      deviceId: options.deviceId,
      conflictHash,
      retryCount: 0,
      maxRetries: 3
    };

    return new DataConflictEntity(data);
  }

  /**
   * Analyze differences between local and remote data
   */
  static analyzeFieldConflicts(
    localData: Record<string, unknown>, 
    remoteData: Record<string, unknown>
  ): FieldConflict[] {
    const conflicts: FieldConflict[] = [];
    const allKeys = new Set([...Object.keys(localData), ...Object.keys(remoteData)]);
    
    allKeys.forEach(key => {
      const localValue = localData[key];
      const remoteValue = remoteData[key];
      
      if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
        const conflictScore = DataConflictEntity.calculateFieldConflictScore(localValue, remoteValue);
        
        conflicts.push({
          fieldName: key,
          localValue,
          remoteValue,
          valueType: typeof localValue,
          lastLocalUpdate: localData.updatedAt as string || new Date().toISOString(),
          lastRemoteUpdate: remoteData.updatedAt as string || new Date().toISOString(),
          conflictScore,
          suggested_resolution: DataConflictEntity.suggestFieldResolution(localValue, remoteValue)
        });
      }
    });
    
    return conflicts;
  }

  /**
   * Calculate severity based on conflict analysis
   */
  static calculateSeverity(conflicts: FieldConflict[], dataType: ConflictableDataType): ConflictSeverity {
    if (conflicts.length === 0) return 'low';
    
    const avgConflictScore = conflicts.reduce((sum, c) => sum + c.conflictScore, 0) / conflicts.length;
    const criticalFields = ['id', '_id', 'userId', 'type'];
    const hasCriticalFieldConflict = conflicts.some(c => criticalFields.includes(c.fieldName));
    
    if (hasCriticalFieldConflict || (dataType === 'training_relationship' && conflicts.length > 3)) {
      return 'critical';
    } else if (avgConflictScore > 0.7 || conflicts.length > 5) {
      return 'high';
    } else if (avgConflictScore > 0.4 || conflicts.length > 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Calculate how different two field values are
   */
  static calculateFieldConflictScore(localValue: unknown, remoteValue: unknown): number {
    if (localValue === remoteValue) return 0;
    if (localValue === null || localValue === undefined || 
        remoteValue === null || remoteValue === undefined) return 1;
    
    const localType = typeof localValue;
    const remoteType = typeof remoteValue;
    
    if (localType !== remoteType) return 1;
    
    if (localType === 'string') {
      const local = localValue as string;
      const remote = remoteValue as string;
      const longer = Math.max(local.length, remote.length);
      if (longer === 0) return 0;
      
      // Simple string similarity (could use more sophisticated algorithms)
      let matches = 0;
      const minLength = Math.min(local.length, remote.length);
      for (let i = 0; i < minLength; i++) {
        if (local[i] === remote[i]) matches++;
      }
      return 1 - (matches / longer);
    }
    
    if (localType === 'number') {
      const local = localValue as number;
      const remote = remoteValue as number;
      const maxValue = Math.max(Math.abs(local), Math.abs(remote));
      if (maxValue === 0) return 0;
      return Math.min(1, Math.abs(local - remote) / maxValue);
    }
    
    // For objects and other types, return moderate conflict score
    return 0.5;
  }

  /**
   * Suggest resolution for a field conflict
   */
  static suggestFieldResolution(localValue: unknown, remoteValue: unknown): unknown {
    // Simple heuristics for automatic resolution
    if (localValue === null || localValue === undefined) return remoteValue;
    if (remoteValue === null || remoteValue === undefined) return localValue;
    
    if (typeof localValue === 'number' && typeof remoteValue === 'number') {
      // For numbers, could average them or pick the larger/smaller based on context
      return Math.max(localValue, remoteValue);
    }
    
    if (typeof localValue === 'string' && typeof remoteValue === 'string') {
      // For strings, pick the longer one or the one with more information
      return localValue.length >= remoteValue.length ? localValue : remoteValue;
    }
    
    // Default: no automatic suggestion
    return undefined;
  }

  /**
   * Generate unique hash for conflict identification
   */
  static generateConflictHash(
    entityId: string, 
    localVersion: number, 
    remoteVersion: number, 
    conflicts: FieldConflict[]
  ): string {
    const conflictSummary = conflicts.map(c => `${c.fieldName}:${c.conflictScore}`).join('|');
    const hashInput = `${entityId}:${localVersion}:${remoteVersion}:${conflictSummary}`;
    
    // Simple hash function (in production, use a proper hash library)
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Validate data conflict data without creating instance
   */
  static validate(data: DataConflictData): { valid: boolean; errors: string[] } {
    try {
      new DataConflictEntity(data);
      return { valid: true, errors: [] };
    } catch (error) {
      return { 
        valid: false, 
        errors: [error instanceof Error ? error.message : 'Unknown validation error'] 
      };
    }
  }
}

export default DataConflictEntity;