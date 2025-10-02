# Data Encryption & Security API Contracts

**Version**: 1.0  
**Security Level**: Field-level encryption with HSM key management  
**Compliance**: NIST, FIPS 140-2, and regulatory encryption standards  

## 🔐 Key Management API

### Generate User Encryption Key

```typescript
POST /api/security/keys/generate
Authorization: Bearer {admin-token}
Content-Type: application/json

// Request Schema
interface GenerateKeyRequest {
  userId: string;
  keyType: 'user-data' | 'health-data' | 'financial-data' | 'backup';
  algorithm: 'AES-256-GCM' | 'AES-256-CBC' | 'ChaCha20-Poly1305';
  keyUsage: 'encrypt' | 'decrypt' | 'both';
  expirationDays?: number; // Default: 90 days
  metadata?: {
    purpose: string;
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    regulatoryRequirement?: string;
  };
}

// Example Request
{
  "userId": "user_2a3b4c5d",
  "keyType": "health-data",
  "algorithm": "AES-256-GCM",
  "keyUsage": "both",
  "expirationDays": 90,
  "metadata": {
    "purpose": "Encrypt user health metrics and medical information",
    "dataClassification": "restricted",
    "regulatoryRequirement": "HIPAA Security Rule"
  }
}

// Response Schema
interface GenerateKeyResponse {
  keyId: string;
  keyVersion: string;
  algorithm: string;
  keyUsage: string;
  createdAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  status: 'active' | 'pending' | 'expired' | 'revoked';
  kmsProvider: 'aws-kms' | 'azure-key-vault' | 'google-cloud-kms';
  keyArn?: string; // For AWS KMS
  compliance: {
    fipsValidated: boolean;
    nistCompliant: boolean;
    regulations: string[];
  };
}

// Example Response
{
  "keyId": "key_health_user_2a3b4c5d_20250115",
  "keyVersion": "1",
  "algorithm": "AES-256-GCM",
  "keyUsage": "both",
  "createdAt": "2025-01-15T10:30:00Z",
  "expiresAt": "2025-04-15T10:30:00Z",
  "status": "active",
  "kmsProvider": "aws-kms",
  "keyArn": "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
  "compliance": {
    "fipsValidated": true,
    "nistCompliant": true,
    "regulations": ["HIPAA", "GDPR"]
  }
}
```

### Rotate Encryption Key

```typescript
POST /api/security/keys/{keyId}/rotate
Authorization: Bearer {admin-token}
Content-Type: application/json

// Request Schema
interface RotateKeyRequest {
  reason: 'scheduled' | 'security_incident' | 'compliance_requirement' | 'manual';
  gracePeriodDays?: number; // Default: 30 days
  immediateRotation?: boolean; // Force immediate rotation
  notifyUsers?: boolean; // Notify affected users
}

// Response Schema
interface RotateKeyResponse {
  oldKeyId: string;
  newKeyId: string;
  rotationDate: string; // ISO 8601
  gracePeriodEnd: string; // ISO 8601
  affectedRecords: number;
  reencryptionStatus: 'pending' | 'in-progress' | 'completed' | 'failed';
  estimatedCompletionTime: string; // ISO 8601
}
```

### Revoke Encryption Key

```typescript
DELETE /api/security/keys/{keyId}
Authorization: Bearer {admin-token}
Content-Type: application/json

// Request Schema
interface RevokeKeyRequest {
  reason: 'compromise' | 'user_deletion' | 'policy_violation' | 'expiration';
  emergencyRevocation: boolean;
  dataAction: 'delete' | 'reencrypt' | 'archive';
  confirmationCode: string;
}

// Response Schema
interface RevokeKeyResponse {
  keyId: string;
  revocationDate: string; // ISO 8601
  reason: string;
  affectedData: {
    recordCount: number;
    dataTypes: string[];
    action: string;
    completionEstimate: string; // ISO 8601
  };
  complianceNotifications: string[];
}
```

## 🔒 Data Encryption API

### Encrypt Sensitive Data

```typescript
POST /api/security/encrypt
Authorization: Bearer {user-token}
Content-Type: application/json

// Request Schema
interface EncryptDataRequest {
  data: string | object;
  dataType: 'health' | 'personal' | 'financial' | 'location' | 'biometric';
  userId: string;
  context?: {
    purpose: string;
    retention: string;
    classification: 'confidential' | 'restricted';
  };
  compression?: boolean; // Default: false
  additionalAuthenticatedData?: string; // For GCM mode
}

// Example Request
{
  "data": {
    "heartRate": 72,
    "bloodPressure": "120/80",
    "medications": ["Lisinopril 10mg", "Metformin 500mg"]
  },
  "dataType": "health",
  "userId": "user_2a3b4c5d",
  "context": {
    "purpose": "Health monitoring and AI recommendations",
    "retention": "7 years",
    "classification": "restricted"
  },
  "compression": true,
  "additionalAuthenticatedData": "workout_session_12345"
}

// Response Schema
interface EncryptDataResponse {
  encryptedData: {
    value: string; // Base64 encoded encrypted data
    keyId: string;
    keyVersion: string;
    algorithm: string;
    iv: string; // Base64 encoded initialization vector
    authTag?: string; // Base64 encoded authentication tag
    compressionUsed: boolean;
    encryptionMetadata: {
      timestamp: string; // ISO 8601
      dataSize: number; // Original size in bytes
      encryptedSize: number; // Encrypted size in bytes
      checksumOriginal: string; // SHA-256 of original data
      checksumEncrypted: string; // SHA-256 of encrypted data
    };
  };
  compliance: {
    dataClassification: string;
    retentionPolicy: string;
    auditRequired: boolean;
    regulations: string[];
  };
}

// Example Response
{
  "encryptedData": {
    "value": "AQEDAHhY7Z8j9X2V...", // Base64 encrypted data
    "keyId": "key_health_user_2a3b4c5d_20250115",
    "keyVersion": "1",
    "algorithm": "AES-256-GCM",
    "iv": "randomIV12345678",
    "authTag": "authTag123456789",
    "compressionUsed": true,
    "encryptionMetadata": {
      "timestamp": "2025-01-15T14:30:00Z",
      "dataSize": 156,
      "encryptedSize": 248,
      "checksumOriginal": "a1b2c3d4e5f6...",
      "checksumEncrypted": "z9y8x7w6v5u4..."
    }
  },
  "compliance": {
    "dataClassification": "restricted",
    "retentionPolicy": "7 years HIPAA requirement",
    "auditRequired": true,
    "regulations": ["HIPAA", "GDPR"]
  }
}
```

### Decrypt Sensitive Data

```typescript
POST /api/security/decrypt
Authorization: Bearer {user-token}
Content-Type: application/json

// Request Schema
interface DecryptDataRequest {
  encryptedData: {
    value: string;
    keyId: string;
    keyVersion: string;
    algorithm: string;
    iv: string;
    authTag?: string;
    compressionUsed?: boolean;
  };
  userId: string;
  accessPurpose: string;
  additionalAuthenticatedData?: string;
}

// Response Schema
interface DecryptDataResponse {
  data: string | object;
  decryptionMetadata: {
    timestamp: string; // ISO 8601
    keyUsed: string;
    dataIntegrityVerified: boolean;
    decompressionApplied: boolean;
  };
  accessLogged: boolean;
  compliance: {
    auditRecordId: string;
    dataAccess: {
      purpose: string;
      authorized: boolean;
      consentVerified: boolean;
    };
  };
}
```

### Batch Encryption Operations

```typescript
POST /api/security/encrypt/batch
Authorization: Bearer {system-token}
Content-Type: application/json

// Request Schema
interface BatchEncryptRequest {
  operations: EncryptOperation[];
  batchId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  callback?: {
    url: string;
    authentication: string;
  };
}

interface EncryptOperation {
  operationId: string;
  data: string | object;
  dataType: string;
  userId: string;
  context?: any;
}

// Response Schema
interface BatchEncryptResponse {
  batchId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  operations: BatchOperationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    estimatedCompletion?: string; // ISO 8601
  };
}

interface BatchOperationResult {
  operationId: string;
  status: 'pending' | 'completed' | 'failed';
  result?: EncryptDataResponse;
  error?: {
    code: string;
    message: string;
  };
}
```

## 🔍 Audit & Monitoring API

### Query Encryption Audit Logs

```typescript
GET /api/security/audit/encryption
Authorization: Bearer {admin-token}
Query Parameters:
  - userId?: string
  - keyId?: string
  - operation?: 'encrypt' | 'decrypt' | 'rotate' | 'revoke'
  - startDate: string (ISO 8601)
  - endDate: string (ISO 8601)
  - dataType?: string
  - compliance?: 'HIPAA' | 'GDPR' | 'CCPA'
  - page: number (default: 1)
  - limit: number (default: 50)

// Response Schema
interface EncryptionAuditResponse {
  auditLogs: EncryptionAuditEntry[];
  pagination: PaginationInfo;
  summary: {
    totalOperations: number;
    operationBreakdown: Record<string, number>;
    complianceAlerts: number;
    securityIncidents: number;
  };
}

interface EncryptionAuditEntry {
  id: string;
  timestamp: string; // ISO 8601
  operation: 'encrypt' | 'decrypt' | 'key_generate' | 'key_rotate' | 'key_revoke';
  userId?: string;
  keyId: string;
  keyVersion: string;
  dataType: string;
  dataClassification: string;
  result: 'success' | 'failure' | 'partial';
  
  // Security context
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
  
  // Performance metrics
  operationDuration: number; // milliseconds
  dataSize: number; // bytes
  
  // Compliance information
  regulations: string[];
  auditRequired: boolean;
  retentionPeriod: string;
  
  // Error information (if applicable)
  errorCode?: string;
  errorMessage?: string;
  
  // Additional metadata
  metadata: Record<string, any>;
}
```

### Monitor Key Usage

```typescript
GET /api/security/keys/{keyId}/usage
Authorization: Bearer {admin-token}
Query Parameters:
  - period?: 'hour' | 'day' | 'week' | 'month'
  - startDate?: string (ISO 8601)
  - endDate?: string (ISO 8601)

// Response Schema
interface KeyUsageResponse {
  keyId: string;
  keyStatus: 'active' | 'expired' | 'revoked';
  usageStatistics: {
    period: string;
    totalOperations: number;
    encryptOperations: number;
    decryptOperations: number;
    uniqueUsers: number;
    dataVolume: number; // bytes
    averageOperationTime: number; // milliseconds
  };
  
  usageHistory: UsageDataPoint[];
  
  complianceMetrics: {
    unauthorizedAccess: number;
    failedOperations: number;
    auditViolations: number;
    regulatoryFlags: string[];
  };
  
  securityAlerts: SecurityAlert[];
}

interface UsageDataPoint {
  timestamp: string; // ISO 8601
  operations: number;
  dataVolume: number;
  averageLatency: number;
  errorRate: number;
}

interface SecurityAlert {
  id: string;
  timestamp: string; // ISO 8601
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'unusual_access' | 'high_volume' | 'multiple_failures' | 'suspicious_pattern';
  description: string;
  affectedOperations: number;
  resolved: boolean;
  resolutionDate?: string; // ISO 8601
}
```

### Generate Security Report

```typescript
POST /api/security/reports/generate
Authorization: Bearer {admin-token}
Content-Type: application/json

// Request Schema
interface SecurityReportRequest {
  reportType: 'encryption_summary' | 'key_lifecycle' | 'compliance_status' | 'security_incidents';
  period: {
    start: string; // ISO 8601
    end: string; // ISO 8601
  };
  scope?: {
    userIds?: string[];
    keyIds?: string[];
    dataTypes?: string[];
    regulations?: string[];
  };
  format: 'json' | 'pdf' | 'csv';
  includeMetrics: boolean;
  includeRecommendations: boolean;
}

// Response Schema
interface SecurityReportResponse {
  reportId: string;
  generatedAt: string; // ISO 8601
  reportType: string;
  period: { start: string; end: string; };
  
  executiveSummary: {
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    revokedKeys: number;
    encryptionOperations: number;
    decryptionOperations: number;
    securityIncidents: number;
    complianceScore: number; // 0-100
  };
  
  keyMetrics: {
    keyRotationCompliance: number; // percentage
    averageKeyAge: number; // days
    encryptionCoverage: number; // percentage of sensitive data encrypted
    performanceMetrics: {
      averageEncryptionTime: number; // milliseconds
      averageDecryptionTime: number; // milliseconds
      throughput: number; // operations per second
    };
  };
  
  complianceStatus: {
    fipsCompliance: boolean;
    nistCompliance: boolean;
    regulatoryCompliance: Record<string, boolean>;
    auditFindings: AuditFinding[];
  };
  
  securityIncidents: SecurityIncident[];
  recommendations: SecurityRecommendation[];
  
  downloadUrl?: string;
  expiryDate: string; // ISO 8601
}

interface AuditFinding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'key_management' | 'encryption' | 'access_control' | 'compliance';
  description: string;
  regulation?: string;
  remediation: string[];
  deadline?: string; // ISO 8601
}

interface SecurityIncident {
  id: string;
  timestamp: string; // ISO 8601
  type: 'unauthorized_access' | 'key_compromise' | 'encryption_failure' | 'compliance_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedKeys: string[];
  affectedUsers: number;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  resolutionDate?: string; // ISO 8601
}

interface SecurityRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'key_rotation' | 'algorithm_upgrade' | 'access_control' | 'monitoring';
  title: string;
  description: string;
  implementation: string[];
  estimatedEffort: string;
  complianceBenefit: string[];
  securityBenefit: string[];
}
```

## 🔧 Configuration & Administration

### Update Encryption Configuration

```typescript
PUT /api/security/config/encryption
Authorization: Bearer {admin-token}
Content-Type: application/json

// Request Schema
interface EncryptionConfigRequest {
  defaultAlgorithm: 'AES-256-GCM' | 'AES-256-CBC' | 'ChaCha20-Poly1305';
  keyRotationPolicy: {
    enabled: boolean;
    intervalDays: number;
    gracePeriodDays: number;
    automaticRotation: boolean;
  };
  keyManagement: {
    provider: 'aws-kms' | 'azure-key-vault' | 'google-cloud-kms';
    region: string;
    keySpec: string;
    keyUsage: string;
  };
  complianceSettings: {
    fipsMode: boolean;
    auditAllOperations: boolean;
    retainAuditLogs: number; // days
    regulations: string[];
  };
  performanceSettings: {
    batchSize: number;
    cacheSize: number;
    cacheTTL: number; // seconds
    maxConcurrentOperations: number;
  };
}

// Response Schema
interface EncryptionConfigResponse {
  configId: string;
  updatedAt: string; // ISO 8601
  appliedAt?: string; // ISO 8601
  status: 'pending' | 'applied' | 'failed';
  validationResults: ConfigValidationResult[];
  impactAssessment: {
    affectedKeys: number;
    affectedUsers: number;
    migrationRequired: boolean;
    estimatedDowntime?: number; // minutes
  };
}

interface ConfigValidationResult {
  setting: string;
  valid: boolean;
  warning?: string;
  error?: string;
  recommendation?: string;
}
```

### Health Check API

```typescript
GET /api/security/health
Authorization: Bearer {system-token}

// Response Schema
interface SecurityHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string; // ISO 8601
  
  keyManagement: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeKeys: number;
    expiredKeys: number;
    averageResponseTime: number; // milliseconds
    errorRate: number; // percentage
  };
  
  encryption: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    operationsPerSecond: number;
    averageLatency: number; // milliseconds
    errorRate: number; // percentage
    queueDepth: number;
  };
  
  compliance: {
    status: 'compliant' | 'warning' | 'violation';
    auditLogHealth: boolean;
    retentionCompliance: boolean;
    regulatoryFlags: string[];
  };
  
  alerts: SystemAlert[];
}

interface SystemAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  component: 'key_management' | 'encryption' | 'audit' | 'compliance';
  message: string;
  timestamp: string; // ISO 8601
  resolved: boolean;
}
```

These security API contracts provide comprehensive encryption and key management capabilities while maintaining strict compliance with security standards and regulatory requirements.