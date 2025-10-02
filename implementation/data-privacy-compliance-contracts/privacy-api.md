# Privacy Management API Contracts

**Version**: 1.0  
**Compliance**: GDPR, HIPAA, CCPA compliant API specifications  
**Security**: Field-level validation and audit logging for all operations  

## 🔐 Privacy Preferences API

### Get User Privacy Preferences

```typescript
GET /api/privacy/preferences
Authorization: Bearer {user-token}

// Response Schema
interface PrivacyPreferencesResponse {
  preferences: {
    userId: string;
    consentVersion: string;
    consentDate: string; // ISO 8601
    consentCategories: ConsentCategory[];
    marketingOptIn: boolean;
    analyticsOptIn: boolean;
    researchParticipation: boolean;
    thirdPartyConsents: ThirdPartyConsent[];
    lastUpdated: string; // ISO 8601
    customRetentionPreferences?: RetentionPreference[];
  };
  availableCategories: ConsentCategoryDefinition[];
  complianceInfo: {
    applicableRegulations: ('GDPR' | 'HIPAA' | 'CCPA')[];
    userRights: string[];
    contactInformation: string;
    lastPolicyUpdate: string; // ISO 8601
    privacyPolicyUrl: string;
    dataProcessingAddendum?: string;
  };
}

interface ConsentCategory {
  category: 'fitness' | 'health' | 'location' | 'usage' | 'marketing' | 'analytics' | 'research';
  consented: boolean;
  purpose: string;
  dataTypes: string[];
  retentionPeriod: string;
  thirdPartySharing: boolean;
  consentDate: string; // ISO 8601
  withdrawalDate?: string; // ISO 8601
  legalBasis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
}

interface ThirdPartyConsent {
  service: 'apple-health' | 'google-fit' | 'fitbit' | 'whoop' | 'stripe' | 'sendgrid' | 'mixpanel';
  consented: boolean;
  purpose: string;
  dataShared: string[];
  privacyPolicyUrl: string;
  consentDate: string; // ISO 8601
  sharingLevel: 'minimal' | 'standard' | 'full';
  dataProcessingLocation: string;
}

// Example Response
{
  "preferences": {
    "userId": "user_2a3b4c5d",
    "consentVersion": "1.0",
    "consentDate": "2025-01-15T10:30:00Z",
    "consentCategories": [
      {
        "category": "fitness",
        "consented": true,
        "purpose": "Provide personalized workout recommendations and track fitness progress",
        "dataTypes": ["workout_data", "exercise_preferences", "performance_metrics"],
        "retentionPeriod": "5 years",
        "thirdPartySharing": false,
        "consentDate": "2025-01-15T10:30:00Z",
        "legalBasis": "consent"
      },
      {
        "category": "health",
        "consented": true,
        "purpose": "Monitor health metrics and provide safety recommendations",
        "dataTypes": ["heart_rate", "blood_pressure", "medical_conditions", "medications"],
        "retentionPeriod": "7 years",
        "thirdPartySharing": false,
        "consentDate": "2025-01-15T10:30:00Z",
        "legalBasis": "consent"
      }
    ],
    "marketingOptIn": false,
    "analyticsOptIn": true,
    "researchParticipation": true
  },
  "complianceInfo": {
    "applicableRegulations": ["GDPR", "HIPAA", "CCPA"],
    "userRights": [
      "Right to access your personal data",
      "Right to rectify inaccurate data",
      "Right to erasure (right to be forgotten)",
      "Right to restrict processing",
      "Right to data portability",
      "Right to object to processing"
    ],
    "contactInformation": "privacy@git-fit.app",
    "lastPolicyUpdate": "2025-01-01T00:00:00Z",
    "privacyPolicyUrl": "https://git-fit.app/privacy"
  }
}
```

### Update Privacy Preferences

```typescript
PUT /api/privacy/preferences
Authorization: Bearer {user-token}
Content-Type: application/json

// Request Schema
interface UpdatePrivacyPreferencesRequest {
  consentCategories: ConsentCategoryUpdate[];
  marketingOptIn?: boolean;
  analyticsOptIn?: boolean;
  researchParticipation?: boolean;
  thirdPartySharing?: ThirdPartyConsentUpdate[];
  customRetentionPreferences?: RetentionPreferenceUpdate[];
  consentMethod: 'explicit' | 'pre_checked' | 'inferred';
  browserInfo: {
    userAgent: string;
    ipAddress: string;
    timestamp: string; // ISO 8601
  };
}

interface ConsentCategoryUpdate {
  category: string;
  consented: boolean;
  reason?: string; // For withdrawal
  effectiveDate?: string; // ISO 8601, defaults to now
}

// Example Request
{
  "consentCategories": [
    {
      "category": "marketing",
      "consented": false,
      "reason": "No longer interested in promotional emails",
      "effectiveDate": "2025-01-15T15:00:00Z"
    }
  ],
  "analyticsOptIn": false,
  "consentMethod": "explicit",
  "browserInfo": {
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "ipAddress": "192.168.1.100",
    "timestamp": "2025-01-15T15:00:00Z"
  }
}

// Response Schema
interface UpdatePrivacyPreferencesResponse {
  success: boolean;
  preferences: PrivacyPreferences;
  changesApplied: ConsentChange[];
  effectiveDate: string; // ISO 8601
  impactAssessment: {
    featuresAffected: string[];
    dataProcessingChanges: string[];
    retentionPolicyChanges: string[];
  };
}

// Example Response
{
  "success": true,
  "preferences": { /* updated preferences */ },
  "changesApplied": [
    {
      "category": "marketing",
      "previousConsent": true,
      "newConsent": false,
      "changeDate": "2025-01-15T15:00:00Z",
      "reason": "No longer interested in promotional emails"
    }
  ],
  "effectiveDate": "2025-01-15T15:00:00Z",
  "impactAssessment": {
    "featuresAffected": ["Email newsletters", "Promotional notifications"],
    "dataProcessingChanges": ["Marketing data processing will cease within 24 hours"],
    "retentionPolicyChanges": ["Marketing data will be deleted within 30 days"]
  }
}
```

### Withdraw Consent

```typescript
POST /api/privacy/consent/withdraw
Authorization: Bearer {user-token}
Content-Type: application/json

// Request Schema
interface WithdrawConsentRequest {
  categories: string[];
  reason?: string;
  effectiveDate?: string; // ISO 8601, defaults to immediate
  confirmationCode?: string; // Required for sensitive categories
  keepAnonymizedData?: boolean; // For research/analytics
}

// Example Request
{
  "categories": ["health", "location"],
  "reason": "Privacy concerns after data breach news",
  "effectiveDate": "2025-01-15T16:00:00Z",
  "confirmationCode": "WITHDRAW123",
  "keepAnonymizedData": false
}

// Response Schema
interface WithdrawConsentResponse {
  success: boolean;
  withdrawalId: string;
  categoriesWithdrawn: string[];
  effectiveDate: string; // ISO 8601
  gracePeriod?: {
    endDate: string; // ISO 8601
    cancellationDeadline: string; // ISO 8601
  };
  dataImpact: {
    dataToBeDeleted: DataDeletionSummary[];
    dataToBeAnonymized: DataAnonymizationSummary[];
    featuresDisabled: string[];
  };
  nextSteps: string[];
}
```

## 📤 Data Export API

### Request Data Export

```typescript
POST /api/privacy/data-export
Authorization: Bearer {user-token}
Content-Type: application/json

// Request Schema
interface DataExportRequest {
  requestType: 'full' | 'selective' | 'backup';
  dataCategories?: string[]; // Required for selective export
  dateRange?: {
    start: string; // ISO 8601
    end: string; // ISO 8601
  };
  formatPreference: 'json' | 'csv' | 'both';
  includeHumanReadable: boolean;
  deliveryMethod: 'download' | 'email' | 'both';
  encryption?: {
    enabled: boolean;
    publicKey?: string; // User-provided public key
  };
  purpose?: string; // Legal basis for export
}

// Example Request
{
  "requestType": "selective",
  "dataCategories": ["fitness", "health"],
  "dateRange": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2025-01-15T23:59:59Z"
  },
  "formatPreference": "both",
  "includeHumanReadable": true,
  "deliveryMethod": "download",
  "encryption": {
    "enabled": true,
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBg..."
  },
  "purpose": "Data portability request under GDPR Article 20"
}

// Response Schema
interface DataExportResponse {
  requestId: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  estimatedSize: number; // bytes
  estimatedCompletionTime: string; // ISO 8601
  trackingUrl: string;
  legalNotice: string;
  expectedFormats: string[];
  expiryDate: string; // ISO 8601 (30 days from completion)
  complianceInfo: {
    regulation: string;
    article: string;
    timeframe: string;
  };
}

// Example Response
{
  "requestId": "export_2a3b4c5d_20250115",
  "status": "pending",
  "estimatedSize": 15728640,
  "estimatedCompletionTime": "2025-01-16T10:30:00Z",
  "trackingUrl": "/api/privacy/data-export/export_2a3b4c5d_20250115/status",
  "legalNotice": "This export is provided under GDPR Article 20. Data will be available for 30 days after generation.",
  "expectedFormats": ["JSON", "CSV", "Human-readable PDF"],
  "expiryDate": "2025-02-15T10:30:00Z",
  "complianceInfo": {
    "regulation": "GDPR",
    "article": "Article 20 - Right to data portability",
    "timeframe": "30 days maximum"
  }
}
```

### Check Export Status

```typescript
GET /api/privacy/data-export/{requestId}/status
Authorization: Bearer {user-token}

// Response Schema
interface ExportStatusResponse {
  requestId: string;
  status: 'pending' | 'processing' | 'ready' | 'downloaded' | 'expired' | 'failed';
  progress?: {
    currentStep: string;
    percentage: number;
    estimatedTimeRemaining: number; // seconds
  };
  completionDate?: string; // ISO 8601
  downloadInfo?: {
    downloadUrl: string;
    downloadToken: string;
    expiryDate: string; // ISO 8601
    fileSize: number; // bytes
    checksums: {
      sha256: string;
      md5: string;
    };
  };
  errorInfo?: {
    errorCode: string;
    errorMessage: string;
    retryAllowed: boolean;
    supportContact: string;
  };
}
```

### Download Export

```typescript
GET /api/privacy/data-export/{requestId}/download
Authorization: Bearer {user-token}
Query Parameters:
  - token: string (download token)
  - format?: 'json' | 'csv' | 'readable' (default: all)

// Response: File download or redirect
// Headers:
Content-Type: application/zip
Content-Disposition: attachment; filename="user-data-export-{requestId}.zip"
X-Export-Manifest: {base64-encoded-manifest}
X-Compliance-Info: {base64-encoded-compliance-details}

// Export ZIP Contents:
// - manifest.json (export metadata and verification)
// - data/
//   - fitness-data.json
//   - health-data.json
//   - user-profile.json
// - readable/
//   - data-summary.pdf
//   - privacy-report.pdf
// - verification/
//   - checksums.txt
//   - compliance-certificate.pdf
```

## 🗑️ Data Deletion API

### Request Data Deletion

```typescript
POST /api/privacy/data-deletion
Authorization: Bearer {user-token}
Content-Type: application/json

// Request Schema
interface DataDeletionRequest {
  deletionType: 'account' | 'selective' | 'expired-data' | 'right-to-be-forgotten';
  dataCategories?: string[]; // Required for selective deletion
  reason: string;
  confirmationCode: string;
  scheduledDate?: string; // ISO 8601, defaults to 30 days grace period
  retentionExceptions?: {
    legalRequirement?: boolean;
    ongoingInvestigation?: boolean;
    contractualObligation?: boolean;
  };
  anonymizationPreference?: 'delete' | 'anonymize' | 'pseudonymize';
}

// Example Request
{
  "deletionType": "selective",
  "dataCategories": ["location", "marketing"],
  "reason": "Privacy preference change",
  "confirmationCode": "DELETE789",
  "scheduledDate": "2025-02-15T00:00:00Z",
  "anonymizationPreference": "anonymize"
}

// Response Schema
interface DataDeletionResponse {
  requestId: string;
  deletionType: string;
  scheduledDate: string; // ISO 8601
  gracePeriod?: {
    endDate: string; // ISO 8601
    cancellationDeadline: string; // ISO 8601
  };
  affectedData: DataDeletionSummary[];
  retainedData: RetainedDataSummary[];
  impactAssessment: {
    featuresAffected: string[];
    accountStatus: 'active' | 'restricted' | 'suspended' | 'deleted';
    recoveryOptions: string[];
  };
  legalNotices: string[];
  cancellationUrl?: string;
}

interface DataDeletionSummary {
  dataType: string;
  category: string;
  estimatedRecords: number;
  retentionPeriod: string;
  deletionMethod: 'secure_deletion' | 'cryptographic_erasure' | 'anonymization';
}

interface RetainedDataSummary {
  dataType: string;
  reason: 'legal_requirement' | 'anonymized_analytics' | 'business_necessity' | 'security_logs';
  retentionPeriod: string;
  anonymizationLevel: 'none' | 'pseudonymized' | 'fully_anonymized';
  legalJustification: string;
  reviewDate: string; // ISO 8601
}
```

### Check Deletion Status

```typescript
GET /api/privacy/data-deletion/{requestId}/status
Authorization: Bearer {user-token}

// Response Schema
interface DeletionStatusResponse {
  requestId: string;
  status: 'pending' | 'grace-period' | 'processing' | 'completed' | 'cancelled' | 'failed';
  scheduledDate: string; // ISO 8601
  gracePeriodEnd?: string; // ISO 8601
  cancellationAllowed: boolean;
  progress?: {
    currentPhase: string;
    systemsProcessed: number;
    totalSystems: number;
    estimatedCompletion: string; // ISO 8601
  };
  completionDetails?: {
    completionDate: string; // ISO 8601
    verification: DeletionVerificationSummary;
    certificate: {
      certificateId: string;
      downloadUrl: string;
      expiryDate: string; // ISO 8601
    };
  };
}

interface DeletionVerificationSummary {
  systemsProcessed: string[];
  recordsDeleted: Record<string, number>;
  backupsProcessed: boolean;
  anonymizationApplied: boolean;
  verificationDate: string; // ISO 8601
  complianceConfirmed: boolean;
}
```

### Cancel Deletion Request

```typescript
POST /api/privacy/data-deletion/{requestId}/cancel
Authorization: Bearer {user-token}
Content-Type: application/json

// Request Schema
interface CancelDeletionRequest {
  reason: string;
  confirmationCode: string;
}

// Response Schema
interface CancelDeletionResponse {
  success: boolean;
  requestId: string;
  cancellationDate: string; // ISO 8601
  restoredData?: string[];
  message: string;
}
```

## 📊 Compliance Reporting API

### Generate Compliance Report

```typescript
POST /api/admin/compliance/report
Authorization: Bearer {admin-token}
Content-Type: application/json

// Request Schema
interface ComplianceReportRequest {
  regulation: 'GDPR' | 'HIPAA' | 'CCPA' | 'ALL';
  reportType: 'summary' | 'detailed' | 'violations' | 'metrics';
  period: {
    start: string; // ISO 8601
    end: string; // ISO 8601
  };
  scope?: {
    userTypes?: string[];
    dataCategories?: string[];
    regions?: string[];
  };
  format: 'json' | 'pdf' | 'csv' | 'excel';
  includePersonalData: boolean;
}

// Response Schema
interface ComplianceReportResponse {
  reportId: string;
  generatedAt: string; // ISO 8601
  regulation: string;
  period: { start: string; end: string; };
  summary: ComplianceReportSummary;
  metrics: ComplianceMetrics;
  violations?: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
  downloadUrl?: string;
  expiryDate: string; // ISO 8601
}

interface ComplianceReportSummary {
  totalUsers: number;
  activeConsents: number;
  dataExportRequests: number;
  dataDeletionRequests: number;
  policyViolations: number;
  complianceScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
```

### Audit Log Query API

```typescript
GET /api/admin/compliance/audit-log
Authorization: Bearer {admin-token}
Query Parameters:
  - userId?: string
  - startDate: string (ISO 8601)
  - endDate: string (ISO 8601)
  - eventTypes?: string[] (comma-separated)
  - resourceTypes?: string[] (comma-separated)
  - regulations?: string[] (comma-separated)
  - page: number (default: 1)
  - limit: number (default: 50, max: 1000)

// Response Schema
interface AuditLogResponse {
  logs: ComplianceAuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalEvents: number;
    eventTypeBreakdown: Record<string, number>;
    violationCount: number;
    complianceFlags: Record<string, number>;
  };
}

interface ComplianceAuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601
  eventType: string;
  userId?: string;
  adminId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  dataCategories: string[];
  result: 'success' | 'failure' | 'partial' | 'blocked';
  complianceFlags: ComplianceFlag[];
  ipAddress: string;
  userAgent?: string;
  metadata: Record<string, any>;
}
```

## 🔒 Security & Validation

### API Security Headers

```typescript
// Required headers for all privacy API requests
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json",
  "X-CSRF-Token": "{csrf-token}",
  "X-Request-ID": "{unique-request-id}",
  "User-Agent": "{client-user-agent}"
}

// Response security headers
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'",
  "X-Privacy-Compliance": "GDPR,HIPAA,CCPA",
  "X-Data-Classification": "restricted"
}
```

### Input Validation Rules

```typescript
// Privacy preferences validation
interface ValidationRules {
  consentCategories: {
    required: true;
    type: 'array';
    items: {
      category: { type: 'string'; enum: ['fitness', 'health', 'location', 'usage', 'marketing', 'analytics']; };
      consented: { type: 'boolean'; required: true; };
      reason: { type: 'string'; maxLength: 500; required: false; };
    };
  };
  
  dataExportRequest: {
    requestType: { type: 'string'; enum: ['full', 'selective', 'backup']; required: true; };
    dataCategories: { type: 'array'; items: { type: 'string'; }; requiredIf: 'requestType === selective'; };
    formatPreference: { type: 'string'; enum: ['json', 'csv', 'both']; default: 'json'; };
  };
  
  dataDeletionRequest: {
    deletionType: { type: 'string'; enum: ['account', 'selective', 'expired-data']; required: true; };
    confirmationCode: { type: 'string'; pattern: '^[A-Z0-9]{6,12}$'; required: true; };
    reason: { type: 'string'; minLength: 10; maxLength: 1000; required: true; };
  };
}
```

### Error Response Format

```typescript
interface PrivacyAPIError {
  error: {
    code: string;
    message: string;
    details?: any;
    complianceImpact?: {
      regulation: string;
      violation: boolean;
      remediation: string[];
    };
    supportContact: string;
    requestId: string;
    timestamp: string; // ISO 8601
  };
}

// Example error responses
{
  "error": {
    "code": "INVALID_CONSENT_WITHDRAWAL",
    "message": "Cannot withdraw consent for required data categories",
    "details": {
      "invalidCategories": ["fitness"],
      "reason": "Required for core service functionality"
    },
    "complianceImpact": {
      "regulation": "GDPR",
      "violation": false,
      "remediation": ["Consider account deletion instead", "Contact support for alternatives"]
    },
    "supportContact": "privacy@git-fit.app",
    "requestId": "req_2a3b4c5d",
    "timestamp": "2025-01-15T16:30:00Z"
  }
}
```

These API contracts provide comprehensive privacy management capabilities while ensuring full regulatory compliance and maintaining detailed audit trails for all privacy-related operations.