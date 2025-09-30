import { z } from 'zod';

/**
 * Trainer verification status type
 */
export type TrainerVerificationStatus = 'pending' | 'in_review' | 'verified' | 'rejected' | 'suspended';

/**
 * Trainer certification interface
 */
export interface TrainerCertification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  documentUrl?: string;
}

/**
 * Basic trainer profile interface
 */
export interface TrainerProfile {
  _id?: string;
  userId: string;
  isVerified: boolean;
  verificationStatus: TrainerVerificationStatus;
  certifications: TrainerCertification[];
  specializations: string[];
  experience: number; // years
  bio: string;
  hourlyRate: number;
  currency: string;
  languages: string[];
  availableForNewClients: boolean;
  maxClients: number;
}

/**
 * Client access permissions for trainer
 */
interface ClientAccess {
  clientId: string;
  permissions: {
    viewWorkouts: boolean;
    modifyWorkouts: boolean;
    viewNutrition: boolean;
    modifyNutrition: boolean;
    viewProgress: boolean;
    sendMessages: boolean;
    scheduleAppointments: boolean;
  };
  accessLevel: 'view' | 'modify' | 'full';
  grantedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

/**
 * Trainer platform metrics and analytics
 */
interface TrainerMetrics {
  totalClients: number;
  activeClients: number;
  avgClientRetention: number; // in days
  completedSessions: number;
  cancelledSessions: number;
  clientSatisfactionAvg: number; // 1-5 scale
  responseTimeAvg: number; // in hours
  earningsThisMonth: number;
  earningsTotal: number;
  lastUpdated: string;
}

/**
 * Trainer availability and scheduling
 */
interface TrainerAvailability {
  timezone: string;
  weeklySchedule: {
    [key: string]: { // day of week
      available: boolean;
      timeSlots: Array<{
        startTime: string; // HH:mm format
        endTime: string;
        maxClients: number;
        isBlocked?: boolean;
        blockReason?: string;
      }>;
    };
  };
  exceptions: Array<{
    date: string; // ISO date
    reason: string;
    isBlocked: boolean;
    customSlots?: Array<{
      startTime: string;
      endTime: string;
      maxClients: number;
    }>;
  }>;
}

/**
 * Data interface for creating/updating trainer entities
 */
interface TrainerData extends TrainerProfile {
  // Additional internal fields not exposed via API
  internalNotes?: string;
  riskProfile: 'low' | 'medium' | 'high';
  performanceScore: number;
  clientSatisfactionScore: number;
  complianceScore: number;
  lastActivityAt: string;
  platformJoinedAt: string;
  clientAccess?: ClientAccess[];
  metrics?: TrainerMetrics;
  availability?: TrainerAvailability;
}

/**
 * Validation schemas for trainer data
 */
const CertificationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Certification name is required'),
  issuingOrganization: z.string().min(1, 'Issuing organization is required'),
  issueDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  credentialId: z.string().optional(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected', 'expired']),
  documentUrl: z.string().url().optional()
});

const ClientAccessSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  permissions: z.object({
    viewWorkouts: z.boolean(),
    modifyWorkouts: z.boolean(),
    viewNutrition: z.boolean(),
    modifyNutrition: z.boolean(),
    viewProgress: z.boolean(),
    sendMessages: z.boolean(),
    scheduleAppointments: z.boolean()
  }),
  accessLevel: z.enum(['view', 'modify', 'full']),
  grantedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean()
});

const TrainerDataSchema = z.object({
  _id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  isVerified: z.boolean(),
  verificationStatus: z.enum(['pending', 'in_review', 'verified', 'rejected', 'suspended']),
  certifications: z.array(CertificationSchema),
  specializations: z.array(z.string()).min(1, 'At least one specialization required'),
  experience: z.number().min(0, 'Experience cannot be negative'),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters'),
  hourlyRate: z.number().min(0, 'Hourly rate cannot be negative'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  languages: z.array(z.string()).min(1, 'At least one language required'),
  availableForNewClients: z.boolean(),
  maxClients: z.number().min(1, 'Must accept at least 1 client'),
  platformJoinedAt: z.string().datetime(),
  lastActivityAt: z.string().datetime(),
  riskProfile: z.enum(['low', 'medium', 'high']),
  performanceScore: z.number().min(0).max(100),
  clientSatisfactionScore: z.number().min(0).max(5),
  complianceScore: z.number().min(0).max(100),
  internalNotes: z.string().optional(),
  clientAccess: z.array(ClientAccessSchema).optional(),
  metrics: z.object({
    totalClients: z.number().min(0),
    activeClients: z.number().min(0),
    avgClientRetention: z.number().min(0),
    completedSessions: z.number().min(0),
    cancelledSessions: z.number().min(0),
    clientSatisfactionAvg: z.number().min(0).max(5),
    responseTimeAvg: z.number().min(0),
    earningsThisMonth: z.number().min(0),
    earningsTotal: z.number().min(0),
    lastUpdated: z.string().datetime()
  }).optional(),
  availability: z.object({
    timezone: z.string(),
    weeklySchedule: z.record(z.object({
      available: z.boolean(),
      timeSlots: z.array(z.object({
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
        maxClients: z.number().min(1),
        isBlocked: z.boolean().optional(),
        blockReason: z.string().optional()
      }))
    })),
    exceptions: z.array(z.object({
      date: z.string().datetime(),
      reason: z.string(),
      isBlocked: z.boolean(),
      customSlots: z.array(z.object({
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
        maxClients: z.number().min(1)
      })).optional()
    }))
  }).optional()
});

/**
 * TrainerEntity class with comprehensive client relationship management and platform integration
 */
export class TrainerEntity {
  private data: TrainerData;

  constructor(data: TrainerData) {
    // Validate input data
    const validationResult = TrainerDataSchema.safeParse(data);
    if (!validationResult.success) {
      throw new Error(`Invalid trainer data: ${validationResult.error.message}`);
    }

    this.data = {
      ...data,
      clientAccess: data.clientAccess || [],
      metrics: data.metrics || this.initializeMetrics(),
      availability: data.availability || this.initializeAvailability()
    };
  }

  // Getters for basic profile data
  get id(): string | undefined { return this.data._id; }
  get userId(): string { return this.data.userId; }
  get isVerified(): boolean { return this.data.isVerified; }
  get verificationStatus(): TrainerVerificationStatus { return this.data.verificationStatus; }
  get certifications(): TrainerCertification[] { return this.data.certifications; }
  get specializations(): string[] { return this.data.specializations; }
  get experience(): number { return this.data.experience; }
  get bio(): string { return this.data.bio; }
  get hourlyRate(): number { return this.data.hourlyRate; }
  get currency(): string { return this.data.currency; }
  get languages(): string[] { return this.data.languages; }
  get availableForNewClients(): boolean { return this.data.availableForNewClients; }
  get maxClients(): number { return this.data.maxClients; }
  get riskProfile(): 'low' | 'medium' | 'high' { return this.data.riskProfile; }
  get performanceScore(): number { return this.data.performanceScore; }
  get clientSatisfactionScore(): number { return this.data.clientSatisfactionScore; }
  get complianceScore(): number { return this.data.complianceScore; }
  get platformJoinedAt(): string { return this.data.platformJoinedAt; }
  get lastActivityAt(): string { return this.data.lastActivityAt; }
  get clientAccess(): ClientAccess[] { return this.data.clientAccess || []; }
  get metrics(): TrainerMetrics { return this.data.metrics!; }
  get availability(): TrainerAvailability { return this.data.availability!; }

  /**
   * Initialize default metrics for new trainers
   */
  private initializeMetrics(): TrainerMetrics {
    const now = new Date().toISOString();
    return {
      totalClients: 0,
      activeClients: 0,
      avgClientRetention: 0,
      completedSessions: 0,
      cancelledSessions: 0,
      clientSatisfactionAvg: 0,
      responseTimeAvg: 0,
      earningsThisMonth: 0,
      earningsTotal: 0,
      lastUpdated: now
    };
  }

  /**
   * Initialize default availability for new trainers
   */
  private initializeAvailability(): TrainerAvailability {
    return {
      timezone: 'UTC',
      weeklySchedule: {
        'monday': { available: false, timeSlots: [] },
        'tuesday': { available: false, timeSlots: [] },
        'wednesday': { available: false, timeSlots: [] },
        'thursday': { available: false, timeSlots: [] },
        'friday': { available: false, timeSlots: [] },
        'saturday': { available: false, timeSlots: [] },
        'sunday': { available: false, timeSlots: [] }
      },
      exceptions: []
    };
  }

  /**
   * Check if trainer is verified and can accept clients
   */
  isEligibleForClients(): boolean {
    return this.data.isVerified && 
           this.data.verificationStatus === 'verified' &&
           this.data.availableForNewClients &&
           this.data.metrics!.activeClients < this.data.maxClients;
  }

  /**
   * Check if trainer has valid certifications
   */
  hasValidCertifications(): boolean {
    const now = new Date();
    return this.data.certifications.some(cert => {
      if (cert.verificationStatus !== 'verified') return false;
      if (!cert.expiryDate) return true;
      return new Date(cert.expiryDate) > now;
    });
  }

  /**
   * Get client access permissions for specific client
   */
  getClientAccess(clientId: string): ClientAccess | null {
    const access = this.data.clientAccess?.find(a => a.clientId === clientId);
    if (!access || !access.isActive) return null;
    
    // Check if access has expired
    if (access.expiresAt && new Date(access.expiresAt) < new Date()) {
      return null;
    }
    
    return access;
  }

  /**
   * Grant access to a client
   */
  grantClientAccess(clientId: string, accessLevel: 'view' | 'modify' | 'full', expiresAt?: string): void {
    if (!clientId) throw new Error('Client ID is required');

    // Remove existing access if any
    this.revokeClientAccess(clientId);

    const permissions = this.getPermissionsForLevel(accessLevel);
    const access: ClientAccess = {
      clientId,
      permissions,
      accessLevel,
      grantedAt: new Date().toISOString(),
      expiresAt,
      isActive: true
    };

    if (!this.data.clientAccess) this.data.clientAccess = [];
    this.data.clientAccess.push(access);
  }

  /**
   * Revoke client access
   */
  revokeClientAccess(clientId: string): void {
    if (!this.data.clientAccess) return;
    this.data.clientAccess = this.data.clientAccess.filter(a => a.clientId !== clientId);
  }

  /**
   * Update client access permissions
   */
  updateClientAccess(clientId: string, updates: Partial<ClientAccess>): void {
    const access = this.data.clientAccess?.find(a => a.clientId === clientId);
    if (!access) throw new Error('Client access not found');

    Object.assign(access, updates);
  }

  /**
   * Get permissions based on access level
   */
  private getPermissionsForLevel(level: 'view' | 'modify' | 'full') {
    switch (level) {
      case 'view':
        return {
          viewWorkouts: true,
          modifyWorkouts: false,
          viewNutrition: true,
          modifyNutrition: false,
          viewProgress: true,
          sendMessages: true,
          scheduleAppointments: false
        };
      case 'modify':
        return {
          viewWorkouts: true,
          modifyWorkouts: true,
          viewNutrition: true,
          modifyNutrition: true,
          viewProgress: true,
          sendMessages: true,
          scheduleAppointments: true
        };
      case 'full':
        return {
          viewWorkouts: true,
          modifyWorkouts: true,
          viewNutrition: true,
          modifyNutrition: true,
          viewProgress: true,
          sendMessages: true,
          scheduleAppointments: true
        };
      default:
        throw new Error(`Invalid access level: ${level}`);
    }
  }

  /**
   * Update trainer verification status
   */
  updateVerificationStatus(status: TrainerVerificationStatus, notes?: string): void {
    this.data.verificationStatus = status;
    this.data.isVerified = status === 'verified';
    
    if (notes && this.data.internalNotes) {
      this.data.internalNotes += `\n[${new Date().toISOString()}] ${notes}`;
    } else if (notes) {
      this.data.internalNotes = `[${new Date().toISOString()}] ${notes}`;
    }
  }

  /**
   * Add or update certification
   */
  addCertification(certification: TrainerCertification): void {
    // Remove existing certification with same ID if present
    this.data.certifications = this.data.certifications.filter(c => c.id !== certification.id);
    this.data.certifications.push(certification);
  }

  /**
   * Remove certification
   */
  removeCertification(certificationId: string): void {
    this.data.certifications = this.data.certifications.filter(c => c.id !== certificationId);
  }

  /**
   * Update trainer metrics
   */
  updateMetrics(updates: Partial<TrainerMetrics>): void {
    this.data.metrics = {
      ...this.data.metrics!,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Update availability schedule
   */
  updateAvailability(availability: Partial<TrainerAvailability>): void {
    this.data.availability = {
      ...this.data.availability!,
      ...availability
    };
  }

  /**
   * Add schedule exception (vacation, sick day, etc.)
   */
  addScheduleException(date: string, reason: string, isBlocked: boolean, customSlots?: Array<{startTime: string; endTime: string; maxClients: number}>): void {
    if (!this.data.availability) this.data.availability = this.initializeAvailability();
    
    // Remove existing exception for the same date
    this.data.availability.exceptions = this.data.availability.exceptions.filter(e => e.date !== date);
    
    this.data.availability.exceptions.push({
      date,
      reason,
      isBlocked,
      customSlots
    });
  }

  /**
   * Remove schedule exception
   */
  removeScheduleException(date: string): void {
    if (!this.data.availability) return;
    this.data.availability.exceptions = this.data.availability.exceptions.filter(e => e.date !== date);
  }

  /**
   * Calculate trainer score based on multiple factors
   */
  calculateOverallScore(): number {
    const weights = {
      performance: 0.3,
      satisfaction: 0.3,
      compliance: 0.2,
      experience: 0.1,
      certifications: 0.1
    };

    const experienceScore = Math.min(this.data.experience / 10 * 100, 100); // Max score at 10+ years
    const certificationScore = this.hasValidCertifications() ? 100 : 0;

    return (
      this.data.performanceScore * weights.performance +
      this.data.clientSatisfactionScore * 20 * weights.satisfaction + // Convert 1-5 to 0-100 scale
      this.data.complianceScore * weights.compliance +
      experienceScore * weights.experience +
      certificationScore * weights.certifications
    );
  }

  /**
   * Check if trainer needs attention (performance issues, compliance problems, etc.)
   */
  needsAttention(): { needsAttention: boolean; reasons: string[] } {
    const reasons: string[] = [];

    if (this.data.performanceScore < 70) {
      reasons.push('Low performance score');
    }

    if (this.data.clientSatisfactionScore < 3.5) {
      reasons.push('Low client satisfaction');
    }

    if (this.data.complianceScore < 80) {
      reasons.push('Compliance issues');
    }

    if (!this.hasValidCertifications()) {
      reasons.push('No valid certifications');
    }

    if (this.data.riskProfile === 'high') {
      reasons.push('High risk profile');
    }

    const lastActivity = new Date(this.data.lastActivityAt);
    const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity > 7) {
      reasons.push('Inactive for over 7 days');
    }

    return {
      needsAttention: reasons.length > 0,
      reasons
    };
  }

  /**
   * Get trainer summary for dashboard display
   */
  getSummary() {
    const overallScore = this.calculateOverallScore();
    const attention = this.needsAttention();
    
    return {
      id: this.data._id,
      userId: this.data.userId,
      isVerified: this.data.isVerified,
      verificationStatus: this.data.verificationStatus,
      specializations: this.data.specializations,
      experience: this.data.experience,
      hourlyRate: this.data.hourlyRate,
      currency: this.data.currency,
      availableForNewClients: this.data.availableForNewClients,
      activeClients: this.data.metrics!.activeClients,
      maxClients: this.data.maxClients,
      overallScore: Math.round(overallScore),
      clientSatisfactionScore: this.data.clientSatisfactionScore,
      performanceScore: this.data.performanceScore,
      needsAttention: attention.needsAttention,
      attentionReasons: attention.reasons,
      hasValidCertifications: this.hasValidCertifications()
    };
  }

  /**
   * Convert to API contract format
   */
  toApiProfile(): TrainerProfile {
    return {
      _id: this.data._id,
      userId: this.data.userId,
      isVerified: this.data.isVerified,
      verificationStatus: this.data.verificationStatus,
      certifications: this.data.certifications,
      specializations: this.data.specializations,
      experience: this.data.experience,
      bio: this.data.bio,
      hourlyRate: this.data.hourlyRate,
      currency: this.data.currency,
      languages: this.data.languages,
      availableForNewClients: this.data.availableForNewClients,
      maxClients: this.data.maxClients
    };
  }

  /**
   * Convert to JSON for storage
   */
  toJSON(): TrainerData {
    return { ...this.data };
  }

  /**
   * Update internal performance metrics
   */
  updatePerformanceMetrics(metrics: {
    performanceScore?: number;
    clientSatisfactionScore?: number;
    complianceScore?: number;
    riskProfile?: 'low' | 'medium' | 'high';
  }): void {
    if (metrics.performanceScore !== undefined) {
      this.data.performanceScore = Math.max(0, Math.min(100, metrics.performanceScore));
    }
    if (metrics.clientSatisfactionScore !== undefined) {
      this.data.clientSatisfactionScore = Math.max(0, Math.min(5, metrics.clientSatisfactionScore));
    }
    if (metrics.complianceScore !== undefined) {
      this.data.complianceScore = Math.max(0, Math.min(100, metrics.complianceScore));
    }
    if (metrics.riskProfile) {
      this.data.riskProfile = metrics.riskProfile;
    }

    this.data.lastActivityAt = new Date().toISOString();
  }

  /**
   * Static factory methods
   */

  /**
   * Create TrainerEntity from JSON data
   */
  static fromJSON(data: TrainerData): TrainerEntity {
    return new TrainerEntity(data);
  }

  /**
   * Create TrainerEntity from API contract
   */
  static fromApiProfile(apiProfile: TrainerProfile): TrainerEntity {
    const data: TrainerData = {
      ...apiProfile,
      riskProfile: 'low',
      performanceScore: 85,
      clientSatisfactionScore: 4.5,
      complianceScore: 95,
      lastActivityAt: new Date().toISOString(),
      platformJoinedAt: new Date().toISOString()
    };

    return new TrainerEntity(data);
  }

  /**
   * Validate trainer data without creating instance
   */
  static validate(data: TrainerData): { valid: boolean; errors: string[] } {
    try {
      new TrainerEntity(data);
      return { valid: true, errors: [] };
    } catch (error) {
      return { 
        valid: false, 
        errors: [error instanceof Error ? error.message : 'Unknown validation error'] 
      };
    }
  }
}

export default TrainerEntity;