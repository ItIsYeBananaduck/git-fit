import { z } from 'zod';

/**
 * Relationship status type
 */
export type RelationshipStatus = 'pending' | 'active' | 'revoked' | 'expired' | 'suspended';

/**
 * QR code access permissions
 */
export interface AccessPermissions {
  viewWorkouts: boolean;
  modifyWorkouts: boolean;
  viewNutrition: boolean;
  modifyNutrition: boolean;
  viewProgress: boolean;
  sendMessages: boolean;
  scheduleAppointments: boolean;
}

/**
 * QR code token data structure
 */
export interface ConnectionToken {
  token: string;
  encryptedPayload: string;
  generatedAt: string;
  expiresAt: string;
  permissions: AccessPermissions;
  isUsed: boolean;
  usedAt?: string;
  clientId?: string; // Set when client scans and accepts
}

/**
 * Audit trail entry for relationship actions
 */
export interface AuditEntry {
  id: string;
  timestamp: string;
  action: 'created' | 'token_generated' | 'linked' | 'permissions_changed' | 'revoked' | 'suspended' | 'reactivated';
  actorId: string; // trainer or client ID
  actorType: 'trainer' | 'client' | 'system';
  details: string;
  metadata?: Record<string, unknown>;
}

/**
 * Training relationship interface
 */
export interface TrainingRelationship {
  _id?: string;
  trainerId: string;
  clientId?: string; // Undefined until client accepts
  status: RelationshipStatus;
  connectionToken?: ConnectionToken;
  permissions: AccessPermissions;
  createdAt: string;
  linkedAt?: string;
  revokedAt?: string;
  revokedBy?: 'trainer' | 'client' | 'system';
  revokeReason?: string;
  auditTrail: AuditEntry[];
  metadata: {
    trainerName: string;
    clientName?: string;
    initialPermissions: AccessPermissions;
    lastActivityAt: string;
    accessCount: number;
  };
}

/**
 * Data interface for creating/updating training relationships
 */
interface TrainingRelationshipData extends TrainingRelationship {
  // Additional internal fields
  securityHash?: string;
  ipWhitelist?: string[];
  deviceFingerprint?: string;
  lastAccessIp?: string;
  failedAccessAttempts?: number;
}

/**
 * Validation schemas
 */
const AccessPermissionsSchema = z.object({
  viewWorkouts: z.boolean(),
  modifyWorkouts: z.boolean(),
  viewNutrition: z.boolean(),
  modifyNutrition: z.boolean(),
  viewProgress: z.boolean(),
  sendMessages: z.boolean(),
  scheduleAppointments: z.boolean()
});

const ConnectionTokenSchema = z.object({
  token: z.string().min(32, 'Token must be at least 32 characters'),
  encryptedPayload: z.string().min(1, 'Encrypted payload is required'),
  generatedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  permissions: AccessPermissionsSchema,
  isUsed: z.boolean(),
  usedAt: z.string().datetime().optional(),
  clientId: z.string().optional()
});

const AuditEntrySchema = z.object({
  id: z.string().min(1, 'Audit entry ID is required'),
  timestamp: z.string().datetime(),
  action: z.enum(['created', 'token_generated', 'linked', 'permissions_changed', 'revoked', 'suspended', 'reactivated']),
  actorId: z.string().min(1, 'Actor ID is required'),
  actorType: z.enum(['trainer', 'client', 'system']),
  details: z.string().min(1, 'Action details are required'),
  metadata: z.record(z.unknown()).optional()
});

const TrainingRelationshipDataSchema = z.object({
  _id: z.string().optional(),
  trainerId: z.string().min(1, 'Trainer ID is required'),
  clientId: z.string().optional(),
  status: z.enum(['pending', 'active', 'revoked', 'expired', 'suspended']),
  connectionToken: ConnectionTokenSchema.optional(),
  permissions: AccessPermissionsSchema,
  createdAt: z.string().datetime(),
  linkedAt: z.string().datetime().optional(),
  revokedAt: z.string().datetime().optional(),
  revokedBy: z.enum(['trainer', 'client', 'system']).optional(),
  revokeReason: z.string().optional(),
  auditTrail: z.array(AuditEntrySchema),
  metadata: z.object({
    trainerName: z.string().min(1, 'Trainer name is required'),
    clientName: z.string().optional(),
    initialPermissions: AccessPermissionsSchema,
    lastActivityAt: z.string().datetime(),
    accessCount: z.number().min(0)
  }),
  securityHash: z.string().optional(),
  ipWhitelist: z.array(z.string()).optional(),
  deviceFingerprint: z.string().optional(),
  lastAccessIp: z.string().optional(),
  failedAccessAttempts: z.number().min(0).optional()
});

/**
 * TrainingRelationshipEntity class with secure token management and audit tracking
 */
export class TrainingRelationshipEntity {
  private data: TrainingRelationshipData;

  constructor(data: TrainingRelationshipData) {
    // Validate input data
    const validationResult = TrainingRelationshipDataSchema.safeParse(data);
    if (!validationResult.success) {
      throw new Error(`Invalid training relationship data: ${validationResult.error.message}`);
    }

    this.data = {
      ...data,
      auditTrail: data.auditTrail || [],
      failedAccessAttempts: data.failedAccessAttempts || 0
    };
  }

  // Getters for basic properties
  get id(): string | undefined { return this.data._id; }
  get trainerId(): string { return this.data.trainerId; }
  get clientId(): string | undefined { return this.data.clientId; }
  get status(): RelationshipStatus { return this.data.status; }
  get connectionToken(): ConnectionToken | undefined { return this.data.connectionToken; }
  get permissions(): AccessPermissions { return this.data.permissions; }
  get createdAt(): string { return this.data.createdAt; }
  get linkedAt(): string | undefined { return this.data.linkedAt; }
  get revokedAt(): string | undefined { return this.data.revokedAt; }
  get revokedBy(): 'trainer' | 'client' | 'system' | undefined { return this.data.revokedBy; }
  get revokeReason(): string | undefined { return this.data.revokeReason; }
  get auditTrail(): AuditEntry[] { return this.data.auditTrail; }
  get metadata(): TrainingRelationshipData['metadata'] { return this.data.metadata; }
  get failedAccessAttempts(): number { return this.data.failedAccessAttempts || 0; }

  /**
   * Check if relationship is active
   */
  isActive(): boolean {
    return this.data.status === 'active' && 
           this.data.clientId !== undefined;
  }

  /**
   * Check if connection token is valid
   */
  isTokenValid(): boolean {
    if (!this.data.connectionToken) return false;
    
    const now = new Date();
    const expiresAt = new Date(this.data.connectionToken.expiresAt);
    
    return !this.data.connectionToken.isUsed && 
           expiresAt > now && 
           this.data.status === 'pending';
  }

  /**
   * Generate a new connection token for QR code
   */
  generateConnectionToken(permissions: AccessPermissions, validityHours: number = 24): string {
    if (this.data.status !== 'pending') {
      throw new Error('Cannot generate token for non-pending relationship');
    }

    // Generate secure random token
    const token = this.generateSecureToken();
    
    // Create expiration timestamp
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (validityHours * 60 * 60 * 1000));
    
    // Create encrypted payload with relationship info
    const payload = {
      relationshipId: this.data._id,
      trainerId: this.data.trainerId,
      trainerName: this.data.metadata.trainerName,
      permissions,
      generatedAt: now.toISOString()
    };
    
    const encryptedPayload = this.encryptPayload(JSON.stringify(payload));
    
    // Create connection token
    this.data.connectionToken = {
      token,
      encryptedPayload,
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      permissions,
      isUsed: false
    };

    // Add audit entry
    this.addAuditEntry({
      action: 'token_generated',
      actorId: this.data.trainerId,
      actorType: 'trainer',
      details: `QR code token generated with ${validityHours}h validity`,
      metadata: { validityHours, permissions }
    });

    // Update last activity
    this.data.metadata.lastActivityAt = now.toISOString();

    return token;
  }

  /**
   * Generate QR code data string
   */
  generateQRCodeData(): string {
    if (!this.data.connectionToken || !this.isTokenValid()) {
      throw new Error('No valid connection token available');
    }

    // QR code contains the token and basic connection info
    const qrData = {
      token: this.data.connectionToken.token,
      type: 'trainer_connection',
      version: '1.0'
    };

    return JSON.stringify(qrData);
  }

  /**
   * Link client to the relationship using the connection token
   */
  linkClient(clientId: string, clientName: string, scannedToken: string): void {
    if (!this.data.connectionToken) {
      throw new Error('No connection token available');
    }

    if (this.data.connectionToken.token !== scannedToken) {
      this.data.failedAccessAttempts = (this.data.failedAccessAttempts || 0) + 1;
      throw new Error('Invalid connection token');
    }

    if (!this.isTokenValid()) {
      throw new Error('Connection token has expired or is already used');
    }

    // Mark token as used
    this.data.connectionToken.isUsed = true;
    this.data.connectionToken.usedAt = new Date().toISOString();
    this.data.connectionToken.clientId = clientId;

    // Update relationship
    this.data.clientId = clientId;
    this.data.status = 'active';
    this.data.linkedAt = new Date().toISOString();
    this.data.metadata.clientName = clientName;
    this.data.metadata.lastActivityAt = new Date().toISOString();

    // Reset failed attempts
    this.data.failedAccessAttempts = 0;

    // Add audit entry
    this.addAuditEntry({
      action: 'linked',
      actorId: clientId,
      actorType: 'client',
      details: `Client ${clientName} linked to trainer ${this.data.metadata.trainerName}`,
      metadata: { clientName, linkMethod: 'qr_code' }
    });
  }

  /**
   * Update access permissions
   */
  updatePermissions(newPermissions: AccessPermissions, actorId: string, actorType: 'trainer' | 'client'): void {
    if (!this.isActive()) {
      throw new Error('Cannot update permissions for inactive relationship');
    }

    const oldPermissions = { ...this.data.permissions };
    this.data.permissions = { ...newPermissions };
    this.data.metadata.lastActivityAt = new Date().toISOString();

    // Add audit entry
    this.addAuditEntry({
      action: 'permissions_changed',
      actorId,
      actorType,
      details: 'Access permissions updated',
      metadata: { oldPermissions, newPermissions }
    });
  }

  /**
   * Revoke the relationship
   */
  revoke(revokedBy: 'trainer' | 'client' | 'system', reason: string, actorId: string): void {
    if (this.data.status === 'revoked') {
      throw new Error('Relationship is already revoked');
    }

    this.data.status = 'revoked';
    this.data.revokedAt = new Date().toISOString();
    this.data.revokedBy = revokedBy;
    this.data.revokeReason = reason;
    this.data.metadata.lastActivityAt = new Date().toISOString();

    // Invalidate any existing token
    if (this.data.connectionToken && !this.data.connectionToken.isUsed) {
      this.data.connectionToken.isUsed = true;
      this.data.connectionToken.usedAt = new Date().toISOString();
    }

    // Add audit entry
    this.addAuditEntry({
      action: 'revoked',
      actorId,
      actorType: revokedBy === 'system' ? 'system' : (revokedBy === 'trainer' ? 'trainer' : 'client'),
      details: `Relationship revoked by ${revokedBy}: ${reason}`,
      metadata: { reason, revokedBy }
    });
  }

  /**
   * Suspend the relationship
   */
  suspend(reason: string, actorId: string): void {
    if (!this.isActive()) {
      throw new Error('Cannot suspend inactive relationship');
    }

    this.data.status = 'suspended';
    this.data.metadata.lastActivityAt = new Date().toISOString();

    // Add audit entry
    this.addAuditEntry({
      action: 'suspended',
      actorId,
      actorType: 'system',
      details: `Relationship suspended: ${reason}`,
      metadata: { reason }
    });
  }

  /**
   * Reactivate suspended relationship
   */
  reactivate(actorId: string): void {
    if (this.data.status !== 'suspended') {
      throw new Error('Can only reactivate suspended relationships');
    }

    this.data.status = 'active';
    this.data.metadata.lastActivityAt = new Date().toISOString();

    // Add audit entry
    this.addAuditEntry({
      action: 'reactivated',
      actorId,
      actorType: 'system',
      details: 'Relationship reactivated',
      metadata: {}
    });
  }

  /**
   * Record access activity
   */
  recordAccess(ipAddress: string): void {
    this.data.metadata.accessCount += 1;
    this.data.metadata.lastActivityAt = new Date().toISOString();
    this.data.lastAccessIp = ipAddress;
    this.data.failedAccessAttempts = 0; // Reset on successful access
  }

  /**
   * Check if relationship needs attention (suspicious activity, etc.)
   */
  needsAttention(): { needsAttention: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Check for excessive failed access attempts
    if (this.data.failedAccessAttempts && this.data.failedAccessAttempts > 5) {
      reasons.push(`${this.data.failedAccessAttempts} failed access attempts`);
    }

    // Check for inactivity
    const lastActivity = new Date(this.data.metadata.lastActivityAt);
    const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity > 30 && this.isActive()) {
      reasons.push(`No activity for ${Math.floor(daysSinceActivity)} days`);
    }

    // Check for expired but unused tokens
    if (this.data.connectionToken && !this.data.connectionToken.isUsed) {
      const expiresAt = new Date(this.data.connectionToken.expiresAt);
      if (expiresAt < new Date()) {
        reasons.push('Expired unused connection token');
      }
    }

    return {
      needsAttention: reasons.length > 0,
      reasons
    };
  }

  /**
   * Get relationship summary for dashboard display
   */
  getSummary() {
    const attention = this.needsAttention();
    
    return {
      id: this.data._id,
      trainerId: this.data.trainerId,
      clientId: this.data.clientId,
      status: this.data.status,
      trainerName: this.data.metadata.trainerName,
      clientName: this.data.metadata.clientName,
      createdAt: this.data.createdAt,
      linkedAt: this.data.linkedAt,
      lastActivityAt: this.data.metadata.lastActivityAt,
      accessCount: this.data.metadata.accessCount,
      hasValidToken: this.isTokenValid(),
      isActive: this.isActive(),
      needsAttention: attention.needsAttention,
      attentionReasons: attention.reasons,
      permissions: this.data.permissions
    };
  }

  /**
   * Add audit trail entry
   */
  private addAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
    const auditEntry: AuditEntry = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      ...entry
    };

    this.data.auditTrail.push(auditEntry);
  }

  /**
   * Generate secure token for connections
   */
  private generateSecureToken(): string {
    // In a real implementation, this would use crypto.randomBytes or similar
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Encrypt payload for secure token transmission
   */
  private encryptPayload(payload: string): string {
    // In a real implementation, this would use proper encryption (AES-256-GCM)
    // For now, using base64 encoding as placeholder
    return Buffer.from(payload).toString('base64');
  }

  /**
   * Generate unique audit ID
   */
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert to JSON for storage
   */
  toJSON(): TrainingRelationshipData {
    return { ...this.data };
  }

  /**
   * Convert to API contract format
   */
  toApiFormat(): TrainingRelationship {
    const apiData = { ...this.data };
    // Remove internal fields that shouldn't be exposed via API
    delete apiData.securityHash;
    delete apiData.ipWhitelist;
    delete apiData.deviceFingerprint;
    delete apiData.lastAccessIp;
    delete apiData.failedAccessAttempts;
    return apiData;
  }

  /**
   * Static factory methods
   */

  /**
   * Create TrainingRelationshipEntity from JSON data
   */
  static fromJSON(data: TrainingRelationshipData): TrainingRelationshipEntity {
    return new TrainingRelationshipEntity(data);
  }

  /**
   * Create new pending relationship for QR code generation
   */
  static createPending(trainerId: string, trainerName: string, permissions: AccessPermissions): TrainingRelationshipEntity {
    const now = new Date().toISOString();
    
    const data: TrainingRelationshipData = {
      trainerId,
      status: 'pending',
      permissions,
      createdAt: now,
      auditTrail: [],
      metadata: {
        trainerName,
        initialPermissions: permissions,
        lastActivityAt: now,
        accessCount: 0
      }
    };

    const relationship = new TrainingRelationshipEntity(data);
    
    // Add creation audit entry
    relationship.addAuditEntry({
      action: 'created',
      actorId: trainerId,
      actorType: 'trainer',
      details: `Training relationship created by ${trainerName}`,
      metadata: { permissions }
    });

    return relationship;
  }

  /**
   * Validate relationship data without creating instance
   */
  static validate(data: TrainingRelationshipData): { valid: boolean; errors: string[] } {
    try {
      new TrainingRelationshipEntity(data);
      return { valid: true, errors: [] };
    } catch (error) {
      return { 
        valid: false, 
        errors: [error instanceof Error ? error.message : 'Unknown validation error'] 
      };
    }
  }
}

export default TrainingRelationshipEntity;