// File: dataExportService.ts

/**
 * Data Export Service
 * Purpose: Handle GDPR-compliant data export and deletion requests
 */

export interface DataExportRequest {
  id: string;
  userId: string;
  requestType: 'export' | 'delete';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  expiresAt?: Date; // For export links
  downloadUrl?: string;
  fileSize?: number;
  error?: string;
  dataTypes: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportData {
  userId: string;
  exportDate: Date;
  dataTypes: string[];
  records: {
    [dataType: string]: any[];
  };
  metadata: {
    totalRecords: number;
    fileSize: number;
    processingTime: number;
  };
}

export interface DeletionResult {
  userId: string;
  dataTypes: string[];
  recordsDeleted: number;
  associatedDataDeleted: number;
  completedAt: Date;
  verificationCode: string;
}

export interface DataExportConfig {
  maxExportSize: number; // MB
  exportRetentionDays: number;
  supportedFormats: ('json' | 'csv' | 'xml')[];
  defaultFormat: 'json' | 'csv' | 'xml';
  includeMetadata: boolean;
  compressExports: boolean;
}

export class DataExportService {
  private config: DataExportConfig;
  private activeRequests: Map<string, DataExportRequest> = new Map();
  private readonly dataTypes = [
    'heart_rate',
    'hrv',
    'sleep',
    'activity',
    'recovery',
    'training_session',
    'nutrition_log',
    'user_profile',
    'preferences',
    'achievements'
  ];

  constructor(config?: Partial<DataExportConfig>) {
    this.config = {
      maxExportSize: 100, // 100MB
      exportRetentionDays: 30,
      supportedFormats: ['json', 'csv', 'xml'],
      defaultFormat: 'json',
      includeMetadata: true,
      compressExports: true,
      ...config
    };
  }

  /**
   * Request data export for a user
   */
  async requestDataExport(params: {
    userId: string;
    dataTypes?: string[];
    dateRange?: { start: Date; end: Date };
    format?: 'json' | 'csv' | 'xml';
  }): Promise<string> {
    const requestId = `export_${params.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const request: DataExportRequest = {
      id: requestId,
      userId: params.userId,
      requestType: 'export',
      status: 'pending',
      createdAt: new Date(),
      dataTypes: params.dataTypes || [...this.dataTypes],
      dateRange: params.dateRange
    };

    this.activeRequests.set(requestId, request);

    // Start processing asynchronously
    this.processExportRequest(request).catch(error => {
      console.error(`Export request ${requestId} failed:`, error);
      this.updateRequestStatus(requestId, 'failed', error.message);
    });

    return requestId;
  }

  /**
   * Request account deletion
   */
  async requestAccountDeletion(params: {
    userId: string;
    dataTypes?: string[];
    reason?: string;
    confirmationCode: string;
  }): Promise<string> {
    const requestId = `delete_${params.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const request: DataExportRequest = {
      id: requestId,
      userId: params.userId,
      requestType: 'delete',
      status: 'pending',
      createdAt: new Date(),
      dataTypes: params.dataTypes || [...this.dataTypes]
    };

    this.activeRequests.set(requestId, request);

    // Start processing asynchronously
    this.processDeletionRequest(request, params.confirmationCode).catch(error => {
      console.error(`Deletion request ${requestId} failed:`, error);
      this.updateRequestStatus(requestId, 'failed', error.message);
    });

    return requestId;
  }

  /**
   * Process export request
   */
  private async processExportRequest(request: DataExportRequest): Promise<void> {
    try {
      this.updateRequestStatus(request.id, 'processing');

      // Gather all user data
      const exportData = await this.gatherUserData(request);

      // Check size limits
      if (exportData.metadata.fileSize > this.config.maxExportSize * 1024 * 1024) {
        throw new Error(`Export size (${exportData.metadata.fileSize} bytes) exceeds maximum allowed size`);
      }

      // Format the data
      const formattedData = await this.formatExportData(exportData, 'json');

      // Generate download URL (would upload to cloud storage)
      const downloadUrl = await this.generateDownloadUrl(request.id, formattedData);

      // Update request with completion details
      const completedRequest: DataExportRequest = {
        ...request,
        status: 'completed',
        completedAt: new Date(),
        downloadUrl,
        fileSize: formattedData.length,
        expiresAt: new Date(Date.now() + this.config.exportRetentionDays * 24 * 60 * 60 * 1000)
      };

      this.activeRequests.set(request.id, completedRequest);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      this.updateRequestStatus(request.id, 'failed', errorMessage);
      throw error;
    }
  }

  /**
   * Process deletion request
   */
  private async processDeletionRequest(request: DataExportRequest, confirmationCode: string): Promise<void> {
    try {
      this.updateRequestStatus(request.id, 'processing');

      // Verify confirmation code
      if (!await this.verifyDeletionConfirmation(request.userId, confirmationCode)) {
        throw new Error('Invalid confirmation code');
      }

      // Perform the deletion
      const deletionResult = await this.performAccountDeletion(request);

      // Update request status
      const completedRequest: DataExportRequest = {
        ...request,
        status: 'completed',
        completedAt: new Date()
      };

      this.activeRequests.set(request.id, completedRequest);

      // Log the deletion for compliance
      await this.logDeletionEvent(deletionResult);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Deletion failed';
      this.updateRequestStatus(request.id, 'failed', errorMessage);
      throw error;
    }
  }

  /**
   * Gather all user data for export
   */
  private async gatherUserData(request: DataExportRequest): Promise<ExportData> {
    const startTime = Date.now();
    const records: { [dataType: string]: any[] } = {};
    let totalRecords = 0;

    for (const dataType of request.dataTypes) {
      try {
        const data = await this.getUserDataByType(request.userId, dataType, request.dateRange);
        records[dataType] = data;
        totalRecords += data.length;
      } catch (error) {
        console.warn(`Failed to gather ${dataType} data:`, error);
        records[dataType] = [];
      }
    }

    const processingTime = Date.now() - startTime;
    const estimatedSize = this.estimateDataSize(records);

    return {
      userId: request.userId,
      exportDate: new Date(),
      dataTypes: request.dataTypes,
      records,
      metadata: {
        totalRecords,
        fileSize: estimatedSize,
        processingTime
      }
    };
  }

  /**
   * Get user data by type
   */
  private async getUserDataByType(
    userId: string,
    dataType: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<any[]> {
    // This would query your database for the specific data type
    // For now, return mock data structure
    console.log(`Getting ${dataType} data for user ${userId}`);
    return [];
  }

  /**
   * Format export data
   */
  private async formatExportData(data: ExportData, format: 'json' | 'csv' | 'xml'): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);

      case 'csv':
        return this.convertToCSV(data);

      case 'xml':
        return this.convertToXML(data);

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: ExportData): string {
    let csv = 'Data Type,Timestamp,Value,Metadata\n';

    for (const [dataType, records] of Object.entries(data.records)) {
      for (const record of records) {
        const timestamp = record.timestamp || record.date || '';
        const value = record.value || JSON.stringify(record);
        const metadata = record.metadata ? JSON.stringify(record.metadata) : '';
        csv += `${dataType},${timestamp},${value},${metadata}\n`;
      }
    }

    return csv;
  }

  /**
   * Convert data to XML format
   */
  private convertToXML(data: ExportData): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<export>\n';
    xml += `  <userId>${data.userId}</userId>\n`;
    xml += `  <exportDate>${data.exportDate.toISOString()}</exportDate>\n`;

    for (const [dataType, records] of Object.entries(data.records)) {
      xml += `  <${dataType}>\n`;
      for (const record of records) {
        xml += '    <record>\n';
        for (const [key, value] of Object.entries(record)) {
          xml += `      <${key}>${value}</${key}>\n`;
        }
        xml += '    </record>\n';
      }
      xml += `  </${dataType}>\n`;
    }

    xml += '</export>\n';
    return xml;
  }

  /**
   * Generate download URL
   */
  private async generateDownloadUrl(requestId: string, data: string): Promise<string> {
    // In a real implementation, this would upload to cloud storage and return a signed URL
    // For now, return a mock URL
    return `https://api.git-fit.com/exports/${requestId}/download`;
  }

  /**
   * Perform account deletion
   */
  private async performAccountDeletion(request: DataExportRequest): Promise<DeletionResult> {
    let totalRecordsDeleted = 0;
    let associatedDataDeleted = 0;

    for (const dataType of request.dataTypes) {
      const deleted = await this.deleteUserDataByType(request.userId, dataType);
      totalRecordsDeleted += deleted.records;
      associatedDataDeleted += deleted.associated;
    }

    const result: DeletionResult = {
      userId: request.userId,
      dataTypes: request.dataTypes,
      recordsDeleted: totalRecordsDeleted,
      associatedDataDeleted,
      completedAt: new Date(),
      verificationCode: this.generateVerificationCode()
    };

    return result;
  }

  /**
   * Delete user data by type
   */
  private async deleteUserDataByType(userId: string, dataType: string): Promise<{ records: number; associated: number }> {
    // This would delete data from your database
    console.log(`Deleting ${dataType} data for user ${userId}`);
    return { records: 0, associated: 0 };
  }

  /**
   * Verify deletion confirmation code
   */
  private async verifyDeletionConfirmation(userId: string, code: string): Promise<boolean> {
    // This would verify the confirmation code sent to the user
    return code === 'CONFIRM_DELETE'; // Mock implementation
  }

  /**
   * Log deletion event for compliance
   */
  private async logDeletionEvent(result: DeletionResult): Promise<void> {
    // This would log the deletion event for GDPR compliance
    console.log(`Account deletion completed for user ${result.userId}:`, result);
  }

  /**
   * Estimate data size in bytes
   */
  private estimateDataSize(records: { [dataType: string]: any[] }): number {
    let totalSize = 0;

    for (const data of Object.values(records)) {
      for (const record of data) {
        totalSize += JSON.stringify(record).length;
      }
    }

    return totalSize;
  }

  /**
   * Generate verification code
   */
  private generateVerificationCode(): string {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  /**
   * Update request status
   */
  private updateRequestStatus(requestId: string, status: DataExportRequest['status'], error?: string): void {
    const request = this.activeRequests.get(requestId);
    if (request) {
      request.status = status;
      if (error) request.error = error;
      if (status === 'completed' || status === 'failed') {
        request.completedAt = new Date();
      }
      this.activeRequests.set(requestId, request);
    }
  }

  /**
   * Get request status
   */
  getRequestStatus(requestId: string): DataExportRequest | undefined {
    return this.activeRequests.get(requestId);
  }

  /**
   * Get all user requests
   */
  getUserRequests(userId: string): DataExportRequest[] {
    return Array.from(this.activeRequests.values())
      .filter(request => request.userId === userId);
  }

  /**
   * Cancel a request
   */
  cancelRequest(requestId: string): boolean {
    const request = this.activeRequests.get(requestId);
    if (request && (request.status === 'pending' || request.status === 'processing')) {
      this.updateRequestStatus(requestId, 'failed', 'Cancelled by user');
      return true;
    }
    return false;
  }

  /**
   * Clean up expired export files
   */
  async cleanupExpiredExports(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    Array.from(this.activeRequests.entries()).forEach(async ([requestId, request]) => {
      if (request.requestType === 'export' &&
          request.expiresAt &&
          request.expiresAt < now &&
          request.status === 'completed') {
        // Delete the export file
        await this.deleteExportFile(requestId);
        this.activeRequests.delete(requestId);
        cleanedCount++;
      }
    });

    return cleanedCount;
  }

  /**
   * Delete export file
   */
  private async deleteExportFile(requestId: string): Promise<void> {
    // This would delete the file from cloud storage
    console.log(`Deleting expired export file for request ${requestId}`);
  }

  /**
   * Get export statistics
   */
  async getExportStatistics(): Promise<Record<string, any>> {
    const allRequests = Array.from(this.activeRequests.values());
    const exportRequests = allRequests.filter(r => r.requestType === 'export');
    const deleteRequests = allRequests.filter(r => r.requestType === 'delete');

    return {
      totalRequests: allRequests.length,
      pendingRequests: allRequests.filter(r => r.status === 'pending').length,
      processingRequests: allRequests.filter(r => r.status === 'processing').length,
      completedExports: exportRequests.filter(r => r.status === 'completed').length,
      completedDeletions: deleteRequests.filter(r => r.status === 'completed').length,
      failedRequests: allRequests.filter(r => r.status === 'failed').length,
      totalDataExported: exportRequests
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + (r.fileSize || 0), 0)
    };
  }

  /**
   * Validate data types
   */
  validateDataTypes(dataTypes: string[]): string[] {
    return dataTypes.filter(type => this.dataTypes.includes(type));
  }

  /**
   * Check if user can request export/deletion
   */
  async canUserRequestAction(userId: string, action: 'export' | 'delete'): Promise<{ allowed: boolean; reason?: string }> {
    // Check for recent requests, rate limits, etc.
    const recentRequests = this.getUserRequests(userId)
      .filter(r => r.requestType === action && r.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000));

    if (recentRequests.length >= 2) {
      return { allowed: false, reason: 'Too many requests in the last 24 hours' };
    }

    return { allowed: true };
  }
}