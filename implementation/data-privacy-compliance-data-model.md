# Data Privacy Compliance (008) - Data Models & Architecture

**Schema Design**: Privacy-first data architecture with field-level encryption  
**Performance Target**: <100ms encryption overhead for core operations  
**Compliance**: GDPR, HIPAA, and CCPA compliant data structures  

## 🏗️ Core Privacy Data Models

### Privacy Preferences Schema

```typescript
// convex/schema.ts - Privacy Preferences
interface PrivacyPreferences {
  // Core identification
  _id: Id<"privacyPreferences">;
  userId: Id<"users">;
  
  // Consent management
  consentVersion: string;           // Current privacy policy version
  consentDate: number;             // Unix timestamp of consent
  consentIP: string;               // Legal evidence - IP address
  consentUserAgent: string;        // Legal evidence - browser/device
  
  // Granular consent categories
  consentCategories: ConsentCategory[];
  
  // Global privacy settings
  marketingOptIn: boolean;
  analyticsOptIn: boolean;
  researchParticipation: boolean;
  
  // Third-party integrations
  thirdPartyConsents: ThirdPartyConsent[];
  
  // Audit trail
  lastUpdated: number;
  updateHistory: ConsentUpdate[];
  
  // Data retention preferences
  customRetentionPreferences?: RetentionPreference[];
}

interface ConsentCategory {
  category: 'fitness' | 'health' | 'location' | 'usage' | 'marketing' | 'analytics' | 'research';
  consented: boolean;
  purpose: string;                 // Clear explanation of data use
  dataTypes: string[];            // Specific data types collected
  retentionPeriod: string;        // How long data is kept
  thirdPartySharing: boolean;     // Whether shared with partners
  consentDate: number;            // When this category was consented to
  withdrawalDate?: number;        // When consent was withdrawn
  legalBasis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
}

interface ThirdPartyConsent {
  service: 'apple-health' | 'google-fit' | 'fitbit' | 'whoop' | 'stripe' | 'sendgrid' | 'mixpanel';
  consented: boolean;
  purpose: string;
  dataShared: string[];           // Specific data types shared
  privacyPolicyUrl: string;       // Partner's privacy policy
  consentDate: number;
  sharingLevel: 'minimal' | 'standard' | 'full';
  dataProcessingLocation: string;  // Geographic data processing location
}

interface ConsentUpdate {
  updateDate: number;
  previousConsent: ConsentCategory;
  newConsent: ConsentCategory;
  updateReason: 'user_request' | 'policy_update' | 'legal_requirement';
  updateMethod: 'user_action' | 'automatic' | 'admin_action';
}
```

### Data Export & Deletion Schema

```typescript
// Data Export Request Management
interface DataExportRequest {
  _id: Id<"dataExportRequests">;
  userId: Id<"users">;
  
  // Request details
  requestDate: number;
  requestType: 'full' | 'selective' | 'backup';
  status: 'pending' | 'processing' | 'ready' | 'downloaded' | 'expired' | 'failed';
  
  // Export configuration
  dataCategories: string[];        // Specific data types to export
  dateRange?: {
    start: number;
    end: number;
  };
  formatPreference: 'json' | 'csv' | 'both';
  includeHumanReadable: boolean;
  deliveryMethod: 'download' | 'email';
  
  // Processing information
  estimatedSize: number;           // Estimated export size in bytes
  actualSize?: number;             // Actual export size
  processingStarted?: number;      // When processing began
  processingCompleted?: number;    // When processing finished
  
  // Download management
  downloadUrl?: string;            // Secure download URL
  downloadToken?: string;          // Secure access token
  expiryDate?: number;            // When download expires (30 days)
  downloadCount: number;           // How many times downloaded
  
  // Error handling
  errorMessage?: string;
  retryCount: number;
  lastRetryDate?: number;
}

interface ExportManifest {
  exportId: Id<"dataExportRequests">;
  userId: Id<"users">;
  generatedDate: number;
  exportVersion: string;          // Export format version
  
  // Content summary
  dataCategories: ExportCategory[];
  totalRecords: number;
  totalSizeBytes: number;
  
  // Integrity verification
  checksums: FileChecksum[];
  
  // Compliance information
  legalBasis: string;
  retentionNotice: string;
  contactInformation: string;
}

interface ExportCategory {
  category: string;               // Data category name
  fileName: string;               // Export file name
  recordCount: number;           // Number of records
  sizeBytes: number;             // File size
  dateRange: {
    earliest: number;
    latest: number;
  };
  schema: string;                // Data schema version
  encryptionUsed: boolean;       // Whether data was encrypted
}

interface FileChecksum {
  fileName: string;
  algorithm: 'SHA-256';
  checksum: string;
  fileSize: number;
}
```

### Data Deletion Schema

```typescript
// Account and Data Deletion Management
interface DataDeletionRequest {
  _id: Id<"dataDeletionRequests">;
  userId: Id<"users">;
  
  // Request details
  requestDate: number;
  deletionType: 'account' | 'selective' | 'expired-data' | 'right-to-be-forgotten';
  status: 'pending' | 'grace-period' | 'processing' | 'completed' | 'cancelled' | 'failed';
  
  // Deletion scope
  dataCategories: string[];       // Categories to delete
  reason: string;                 // User-provided reason
  legalBasis: 'user_request' | 'expired_retention' | 'consent_withdrawal' | 'legal_obligation';
  
  // Timeline management
  scheduledDate: number;          // When deletion will occur
  gracePeriodEnd?: number;        // End of 30-day grace period
  completionDate?: number;        // When deletion was completed
  
  // Processing verification
  verification: DeletionVerification;
  
  // Data preservation
  retainedData: RetainedDataSummary[];
  
  // Cancellation management
  cancellationAllowed: boolean;
  cancellationDeadline?: number;
  cancellationReason?: string;
}

interface DeletionVerification {
  systemsProcessed: string[];     // All systems where data was deleted
  recordsDeleted: Record<string, number>; // Count per data type
  backupsProcessed: boolean;      // Whether backups were cleaned
  anonymizationApplied: boolean;  // Whether data was anonymized instead
  
  // Verification checks
  verificationChecks: VerificationCheck[];
  
  // Legal compliance
  certificateGenerated: boolean;
  deletionCertificateId?: string;
  
  // Audit trail
  verificationDate: number;
  verificationMethod: 'automated' | 'manual' | 'hybrid';
}

interface VerificationCheck {
  system: string;                 // System or database checked
  checkType: 'existence' | 'backup' | 'cache' | 'log';
  result: 'verified_deleted' | 'not_found' | 'error';
  details: string;
  timestamp: number;
}

interface RetainedDataSummary {
  dataType: string;
  reason: 'legal_requirement' | 'anonymized_analytics' | 'business_necessity' | 'security_logs';
  retentionPeriod: string;        // How long it will be retained
  anonymizationLevel: 'none' | 'pseudonymized' | 'fully_anonymized';
  legalJustification: string;     // Legal basis for retention
  reviewDate: number;             // When retention will be reviewed
}
```

### Compliance Audit Schema

```typescript
// Comprehensive Audit Logging for Compliance
interface ComplianceAuditLog {
  _id: Id<"complianceAuditLogs">;
  
  // Event identification
  timestamp: number;
  eventType: 'data_access' | 'data_modify' | 'data_delete' | 'consent_change' | 'export_request' | 'policy_update';
  
  // Actor information
  userId?: Id<"users">;           // User who performed action
  adminId?: Id<"admins">;         // Admin who performed action
  systemId?: string;              // Automated system identifier
  
  // Action details
  action: string;                 // Specific action performed
  resourceType: string;           // Type of resource affected
  resourceId: string;             // ID of affected resource
  
  // Data classification
  dataCategories: string[];       // Categories of data involved
  sensitivityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  
  // Network and session information
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
  
  // Result and compliance
  result: 'success' | 'failure' | 'partial' | 'blocked';
  errorCode?: string;
  businessJustification?: string;
  
  // Compliance flags
  complianceFlags: ComplianceFlag[];
  
  // Additional context
  beforeState?: string;           // State before action (hashed)
  afterState?: string;           // State after action (hashed)
  metadata: Record<string, any>;  // Additional event-specific data
}

interface ComplianceFlag {
  regulation: 'GDPR' | 'HIPAA' | 'CCPA' | 'COPPA' | 'SOX' | 'PCI_DSS';
  requirement: string;            // Specific regulatory requirement
  status: 'compliant' | 'violation' | 'warning' | 'review_required';
  details: string;                // Explanation of compliance status
  resolution?: string;            // How violation was resolved
  resolutionDate?: number;        // When resolution was completed
  severity: 'low' | 'medium' | 'high' | 'critical';
}
```

### Data Retention Policy Schema

```typescript
// Automated Data Retention Management
interface DataRetentionPolicy {
  _id: Id<"dataRetentionPolicies">;
  
  // Policy identification
  name: string;
  description: string;
  version: string;                // Policy version for tracking changes
  
  // Scope definition
  dataCategory: string;           // Category of data this applies to
  dataSubtypes: string[];         // Specific data subtypes
  
  // Retention rules
  retentionPeriod: string;        // ISO 8601 duration (e.g., "P7Y" for 7 years)
  retentionStart: 'creation' | 'last_access' | 'user_action' | 'contract_end';
  
  // Policy triggers
  triggers: RetentionTrigger[];
  
  // Actions to take
  actions: RetentionAction[];
  
  // Exceptions and overrides
  exceptions: RetentionException[];
  
  // Compliance requirements
  complianceRequirement: string;  // Legal basis for retention period
  regulatoryReferences: string[]; // Specific law/regulation references
  
  // Policy management
  isActive: boolean;
  priority: number;               // Higher number = higher priority
  lastReviewed: number;
  nextReview: number;
  reviewedBy: Id<"admins">;
  
  // Application scope
  applicableRegions: string[];    // Geographic scope
  applicableUserTypes: string[];  // User types this applies to
}

interface RetentionTrigger {
  type: 'time_based' | 'event_based' | 'user_action' | 'system_event';
  condition: string;              // Specific trigger condition
  parameters: Record<string, any>; // Trigger-specific parameters
  gracePeriod?: string;           // Grace period before action
}

interface RetentionAction {
  type: 'delete' | 'anonymize' | 'archive' | 'notify' | 'review';
  priority: number;               // Order of execution
  parameters: Record<string, any>; // Action-specific parameters
  requiresApproval: boolean;      // Whether manual approval needed
  notificationRequired: boolean;   // Whether to notify users
}

interface RetentionException {
  condition: string;              // When exception applies
  alternativeAction: string;      // What to do instead
  justification: string;          // Legal/business justification
  approvedBy: Id<"admins">;
  approvalDate: number;
  expiryDate?: number;           // When exception expires
}
```

## 🔐 Encryption Architecture

### Field-Level Encryption Design

```typescript
// Encryption Configuration per Data Type
interface EncryptionConfig {
  // Health data - highest security
  healthData: {
    algorithm: 'AES-256-GCM';
    keyDerivation: 'per-user';      // Separate key per user
    keyRotation: '90-days';         // Quarterly rotation
    additionalSecurity: 'HSM-backed';
  };
  
  // Personal information
  personalInfo: {
    algorithm: 'AES-256-GCM';
    keyDerivation: 'category-based'; // Shared key per category
    keyRotation: '30-days';         // Monthly rotation
    additionalSecurity: 'standard';
  };
  
  // Workout data
  workoutData: {
    algorithm: 'AES-256-GCM';
    keyDerivation: 'category-based';
    keyRotation: '90-days';
    additionalSecurity: 'standard';
  };
  
  // Financial data
  financialData: {
    algorithm: 'AES-256-GCM';
    keyDerivation: 'per-transaction';
    keyRotation: '30-days';
    additionalSecurity: 'HSM-backed';
  };
}

// Encrypted Field Schema
interface EncryptedField {
  value: string;                  // Base64 encoded encrypted data
  keyId: string;                  // Key used for encryption
  algorithm: string;              // Encryption algorithm used
  iv: string;                     // Initialization vector
  authTag?: string;              // Authentication tag for GCM
  metadata?: {
    encryptedAt: number;
    keyVersion: string;
    compressionUsed?: boolean;
  };
}
```

### Key Management Architecture

```typescript
// Key Management Service Integration
interface KeyManagementConfig {
  provider: 'AWS_KMS' | 'AZURE_KEY_VAULT' | 'GOOGLE_CLOUD_KMS';
  
  // Master key configuration
  masterKey: {
    keyId: string;
    region: string;
    keyUsage: 'ENCRYPT_DECRYPT';
    keySpec: 'SYMMETRIC_DEFAULT';
  };
  
  // Derived key configuration
  dataKeys: {
    algorithm: 'AES_256';
    cacheSize: 1000;               // Number of keys to cache
    cacheTTL: 3600;               // Cache time-to-live in seconds
    refreshThreshold: 300;         // Refresh before TTL expires
  };
  
  // Rotation policy
  rotation: {
    automaticRotation: true;
    rotationInterval: '90d';       // 90 days
    notificationBeforeRotation: '7d'; // 7 days notice
    maxKeyAge: '1y';              // Maximum key age
  };
}

// Key derivation for user-specific encryption
interface UserKeyDerivation {
  userId: Id<"users">;
  saltSource: 'user-created' | 'system-generated';
  derivationFunction: 'PBKDF2' | 'Argon2id';
  iterations: number;             // PBKDF2 iterations or Argon2 parameters
  keyLength: 32;                  // 256-bit keys
  
  // Key versioning
  keyVersion: string;
  derivedAt: number;
  lastUsed: number;
  rotationDue: number;
}
```

## 📊 Privacy Analytics Schema

### Privacy Metrics and Monitoring

```typescript
// Privacy Operations Metrics
interface PrivacyMetrics {
  _id: Id<"privacyMetrics">;
  
  // Time period
  periodStart: number;
  periodEnd: number;
  granularity: 'hour' | 'day' | 'week' | 'month';
  
  // User engagement with privacy
  consentMetrics: {
    totalConsentUpdates: number;
    consentWithdrawals: number;
    granularConsentChanges: Record<string, number>;
    averageConsentDuration: number; // How long before changes
  };
  
  // Data export metrics
  exportMetrics: {
    totalRequests: number;
    completedExports: number;
    averageProcessingTime: number;
    totalDataExported: number;      // Bytes
    formatPreferences: Record<string, number>;
  };
  
  // Data deletion metrics
  deletionMetrics: {
    totalRequests: number;
    completedDeletions: number;
    averageDeletionTime: number;
    deletionReasons: Record<string, number>;
    gracePeriodCancellations: number;
  };
  
  // Compliance metrics
  complianceMetrics: {
    policyViolations: number;
    violationsByType: Record<string, number>;
    averageResolutionTime: number;
    automatedPolicyExecutions: number;
  };
  
  // Performance metrics
  performanceMetrics: {
    encryptionOverhead: number;     // Average ms
    decryptionOverhead: number;     // Average ms
    auditLogVolume: number;        // Records per period
    systemAvailability: number;    // Percentage uptime
  };
}

// Privacy violation tracking
interface PrivacyViolation {
  _id: Id<"privacyViolations">;
  
  // Violation details
  detectedAt: number;
  violationType: 'unauthorized_access' | 'retention_exceeded' | 'consent_violation' | 'encryption_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Affected data
  affectedUsers: number;          // Count, not specific users
  dataCategories: string[];
  estimatedRecords: number;
  
  // Detection and resolution
  detectionMethod: 'automated' | 'manual' | 'external_report';
  resolutionStatus: 'open' | 'investigating' | 'resolved' | 'false_positive';
  resolutionTime?: number;
  
  // Compliance impact
  regulatoryNotificationRequired: boolean;
  regulatoryNotificationSent?: number;
  complianceRisk: 'low' | 'medium' | 'high' | 'critical';
  
  // Additional details
  description: string;
  remediationSteps: string[];
  preventiveMeasures: string[];
}
```

## 🔄 Data Lifecycle Management

### Automated Retention Workflow

```typescript
// Data lifecycle state tracking
interface DataLifecycle {
  _id: Id<"dataLifecycle">;
  
  // Data identification
  dataId: string;                 // Reference to actual data record
  dataType: string;              // Type of data (workout, health, etc.)
  dataCategory: string;          // Privacy category
  userId: Id<"users">;
  
  // Lifecycle timestamps
  createdAt: number;
  lastAccessedAt: number;
  lastModifiedAt: number;
  retentionPolicyAppliedAt: number;
  
  // Retention management
  retentionPolicyId: Id<"dataRetentionPolicies">;
  retentionDeadline: number;      // When data should be processed
  gracePeriodEnd?: number;        // End of any grace period
  
  // Current state
  currentState: 'active' | 'scheduled_deletion' | 'grace_period' | 'anonymized' | 'archived' | 'deleted';
  nextAction: 'none' | 'anonymize' | 'delete' | 'archive' | 'review';
  nextActionDate: number;
  
  // Processing history
  processedActions: ProcessedAction[];
  
  // User preferences
  userRetentionPreference?: 'delete_early' | 'keep_maximum' | 'default';
  userNotificationPreference: boolean;
}

interface ProcessedAction {
  action: 'anonymize' | 'delete' | 'archive' | 'notify' | 'review';
  processedAt: number;
  result: 'success' | 'failure' | 'partial';
  details: string;
  triggeredBy: 'policy' | 'user_request' | 'manual' | 'compliance_scan';
}
```

## 🛡️ Security Schema Extensions

### Enhanced Security Monitoring

```typescript
// Security event tracking for privacy
interface PrivacySecurityEvent {
  _id: Id<"privacySecurityEvents">;
  
  // Event identification
  timestamp: number;
  eventType: 'unauthorized_access_attempt' | 'encryption_failure' | 'key_compromise' | 'data_breach_detected';
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  // Source information
  sourceIP: string;
  userAgent?: string;
  userId?: Id<"users">;
  sessionId?: string;
  
  // Affected resources
  affectedDataTypes: string[];
  affectedUserCount: number;
  potentialDataExposure: boolean;
  
  // Detection and response
  detectionMethod: string;
  automaticResponse: string[];
  manualResponseRequired: boolean;
  incidentId?: string;
  
  // Compliance implications
  regulatoryNotificationRequired: boolean;
  affectedRegulations: string[];
  notificationDeadline?: number;
  
  // Resolution tracking
  status: 'detected' | 'investigating' | 'contained' | 'resolved';
  resolutionSteps: string[];
  lessonsLearned?: string;
}
```

## 📋 API Data Contracts

### Request/Response Schemas

```typescript
// Privacy preferences API contracts
interface UpdatePrivacyPreferencesRequest {
  consentCategories: ConsentCategory[];
  marketingOptIn: boolean;
  analyticsOptIn: boolean;
  thirdPartySharing: ThirdPartyConsent[];
  customRetentionPreferences?: RetentionPreference[];
}

interface PrivacyPreferencesResponse {
  preferences: PrivacyPreferences;
  availableCategories: ConsentCategoryDefinition[];
  complianceInfo: {
    applicableRegulations: string[];
    userRights: string[];
    contactInformation: string;
    lastPolicyUpdate: number;
  };
}

// Data export API contracts
interface DataExportResponse {
  requestId: Id<"dataExportRequests">;
  estimatedSize: number;
  estimatedCompletionTime: number;
  status: string;
  trackingUrl: string;
  legalNotice: string;
  expectedFormats: string[];
}

// Compliance reporting API contracts
interface ComplianceReportRequest {
  regulation: 'GDPR' | 'HIPAA' | 'CCPA';
  startDate: number;
  endDate: number;
  includeViolations: boolean;
  includeMetrics: boolean;
  format: 'json' | 'pdf' | 'csv';
}

interface ComplianceReportResponse {
  reportId: string;
  generatedAt: number;
  period: { start: number; end: number; };
  summary: ComplianceReportSummary;
  violations: PrivacyViolation[];
  metrics: PrivacyMetrics;
  recommendations: string[];
  downloadUrl?: string;
}
```

This data architecture provides comprehensive privacy compliance with performance optimization, legal compliance tracking, and user control over personal data while maintaining the functionality of the fitness application.