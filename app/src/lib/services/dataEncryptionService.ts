// File: dataEncryptionService.ts

/**
 * Data Encryption Service
 * Purpose: Provide end-to-end encryption for sensitive health data and GDPR compliance
 */

import * as crypto from 'crypto';

export interface EncryptionKey {
  id: string;
  userId: string;
  key: string; // Base64 encoded
  algorithm: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  keyVersion: number;
}

export interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  keyId: string;
  algorithm: string;
  iv: string; // Base64 encoded initialization vector
  authTag?: string; // For GCM mode
  timestamp: Date;
}

export interface PrivacySettings {
  userId: string;
  dataEncryptionEnabled: boolean;
  analyticsOptOut: boolean;
  marketingOptOut: boolean;
  dataRetentionOverride?: number; // days
  allowedDataSharing: string[]; // List of allowed third parties
  consentGiven: boolean;
  consentDate?: Date;
  lastUpdated: Date;
}

export interface GDPRConsent {
  userId: string;
  consentType: 'data_processing' | 'analytics' | 'marketing' | 'third_party_sharing';
  consented: boolean;
  consentDate: Date;
  expiryDate?: Date;
  consentVersion: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DataAnonymizationResult {
  originalId: string;
  anonymizedId: string;
  mappingToken: string; // For re-identification if needed
  anonymizedData: any;
}

export class DataEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private userKeys: Map<string, EncryptionKey[]> = new Map();
  private privacySettings: Map<string, PrivacySettings> = new Map();
  private consentRecords: Map<string, GDPRConsent[]> = new Map();

  /**
   * Generate a new encryption key for a user
   */
  async generateUserKey(userId: string): Promise<EncryptionKey> {
    const key = crypto.randomBytes(this.keyLength);
    const keyId = `key_${userId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const encryptionKey: EncryptionKey = {
      id: keyId,
      userId,
      key: key.toString('base64'),
      algorithm: this.algorithm,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      isActive: true,
      keyVersion: await this.getNextKeyVersion(userId)
    };

    // Store the key securely (in a real implementation, this would be in a secure key store)
    const userKeys = this.userKeys.get(userId) || [];
    userKeys.push(encryptionKey);
    this.userKeys.set(userId, userKeys);

    return encryptionKey;
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(userId: string, data: any): Promise<EncryptedData> {
    const key = await this.getActiveKey(userId);
    if (!key) {
      throw new Error('No active encryption key found for user');
    }

    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(key.key, 'base64'), iv);

    cipher.setAAD(Buffer.from(userId)); // Additional authenticated data

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      data: encrypted,
      keyId: key.id,
      algorithm: this.algorithm,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      timestamp: new Date()
    };
  }

  /**
   * Decrypt data
   */
  async decryptData(userId: string, encryptedData: EncryptedData): Promise<any> {
    const key = await this.getKeyById(encryptedData.keyId);
    if (!key || key.userId !== userId) {
      throw new Error('Invalid or unauthorized encryption key');
    }

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(key.key, 'base64'),
      Buffer.from(encryptedData.iv, 'base64')
    );
    decipher.setAAD(Buffer.from(userId));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag!, 'base64'));

    let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /**
   * Get active encryption key for user
   */
  private async getActiveKey(userId: string): Promise<EncryptionKey | null> {
    const userKeys = this.userKeys.get(userId) || [];
    const activeKey = userKeys.find(key => key.isActive && (!key.expiresAt || key.expiresAt > new Date()));

    if (!activeKey) {
      // Generate a new key if none exists
      return await this.generateUserKey(userId);
    }

    return activeKey;
  }

  /**
   * Get key by ID
   */
  private async getKeyById(keyId: string): Promise<EncryptionKey | null> {
    for (const userKeys of Array.from(this.userKeys.values())) {
      const key = userKeys.find((k: EncryptionKey) => k.id === keyId);
      if (key) return key;
    }
    return null;
  }

  /**
   * Get next key version for user
   */
  private async getNextKeyVersion(userId: string): Promise<number> {
    const userKeys = this.userKeys.get(userId) || [];
    const maxVersion = userKeys.length > 0 ? Math.max(...userKeys.map(k => k.keyVersion)) : 0;
    return maxVersion + 1;
  }

  /**
   * Rotate encryption keys for a user
   */
  async rotateUserKeys(userId: string): Promise<EncryptionKey> {
    // Deactivate current key
    const currentKey = await this.getActiveKey(userId);
    if (currentKey) {
      currentKey.isActive = false;
      currentKey.expiresAt = new Date();
    }

    // Generate new key
    return await this.generateUserKey(userId);
  }

  /**
   * Update privacy settings for a user
   */
  async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const existingSettings = this.privacySettings.get(userId) || this.createDefaultPrivacySettings(userId);

    const updatedSettings: PrivacySettings = {
      ...existingSettings,
      ...settings,
      lastUpdated: new Date()
    };

    this.privacySettings.set(userId, updatedSettings);
    return updatedSettings;
  }

  /**
   * Get privacy settings for a user
   */
  getPrivacySettings(userId: string): PrivacySettings | null {
    return this.privacySettings.get(userId) || null;
  }

  /**
   * Create default privacy settings
   */
  private createDefaultPrivacySettings(userId: string): PrivacySettings {
    return {
      userId,
      dataEncryptionEnabled: true,
      analyticsOptOut: false,
      marketingOptOut: true,
      allowedDataSharing: [],
      consentGiven: false,
      lastUpdated: new Date()
    };
  }

  /**
   * Record GDPR consent
   */
  async recordConsent(consent: Omit<GDPRConsent, 'consentDate'>): Promise<GDPRConsent> {
    const fullConsent: GDPRConsent = {
      ...consent,
      consentDate: new Date()
    };

    const userConsents = this.consentRecords.get(consent.userId) || [];
    userConsents.push(fullConsent);
    this.consentRecords.set(consent.userId, userConsents);

    // Update privacy settings if this is data processing consent
    if (consent.consentType === 'data_processing') {
      await this.updatePrivacySettings(consent.userId, {
        consentGiven: consent.consented,
        consentDate: fullConsent.consentDate
      });
    }

    return fullConsent;
  }

  /**
   * Get user consents
   */
  getUserConsents(userId: string): GDPRConsent[] {
    return this.consentRecords.get(userId) || [];
  }

  /**
   * Check if user has valid consent for a specific type
   */
  hasValidConsent(userId: string, consentType: GDPRConsent['consentType']): boolean {
    const consents = this.getUserConsents(userId);
    const relevantConsent = consents
      .filter(c => c.consentType === consentType)
      .sort((a, b) => b.consentDate.getTime() - a.consentDate.getTime())[0];

    if (!relevantConsent) return false;

    // Check if consent is still valid
    if (relevantConsent.expiryDate && relevantConsent.expiryDate < new Date()) {
      return false;
    }

    return relevantConsent.consented;
  }

  /**
   * Anonymize data for analytics or sharing
   */
  async anonymizeData(data: any, userId: string): Promise<DataAnonymizationResult> {
    const anonymizedId = crypto.randomBytes(16).toString('hex');
    const mappingToken = crypto.randomBytes(32).toString('base64');

    // Create anonymized version of the data
    const anonymizedData = { ...data };

    // Remove or hash personally identifiable information
    const piiFields = ['email', 'name', 'phone', 'address', 'socialSecurity', 'ipAddress'];

    for (const field of piiFields) {
      if (anonymizedData[field]) {
        anonymizedData[field] = crypto.createHash('sha256')
          .update(anonymizedData[field])
          .digest('hex');
      }
    }

    // Add anonymized ID
    anonymizedData.anonymizedId = anonymizedId;

    return {
      originalId: userId,
      anonymizedId,
      mappingToken,
      anonymizedData
    };
  }

  /**
   * Re-identify anonymized data (for compliance purposes)
   */
  async reidentifyData(anonymizedId: string, mappingToken: string): Promise<string | null> {
    // In a real implementation, this would securely store and retrieve the mapping
    // For now, return null (not implemented)
    return null;
  }

  /**
   * Check if data can be processed based on privacy settings
   */
  canProcessData(userId: string, dataType: string, purpose: 'analytics' | 'marketing' | 'storage' | 'sharing'): boolean {
    const settings = this.getPrivacySettings(userId);
    if (!settings) return false;

    // Check data encryption requirement
    if (this.isSensitiveDataType(dataType) && !settings.dataEncryptionEnabled) {
      return false;
    }

    // Check consent requirements
    switch (purpose) {
      case 'analytics':
        if (settings.analyticsOptOut) return false;
        return this.hasValidConsent(userId, 'analytics');
      case 'marketing':
        if (settings.marketingOptOut) return false;
        return this.hasValidConsent(userId, 'marketing');
      case 'sharing':
        return settings.allowedDataSharing.length > 0 && this.hasValidConsent(userId, 'third_party_sharing');
      case 'storage':
        return this.hasValidConsent(userId, 'data_processing');
      default:
        return false;
    }
  }

  /**
   * Check if data type is sensitive
   */
  private isSensitiveDataType(dataType: string): boolean {
    const sensitiveTypes = ['heart_rate', 'hrv', 'recovery', 'medical_history', 'personal_info'];
    return sensitiveTypes.includes(dataType);
  }

  /**
   * Generate data processing audit log
   */
  async logDataProcessing(userId: string, action: string, dataType: string, purpose: string): Promise<void> {
    const logEntry = {
      userId,
      action,
      dataType,
      purpose,
      timestamp: new Date(),
      ipAddress: 'unknown', // Would be populated from request
      userAgent: 'unknown'  // Would be populated from request
    };

    // In a real implementation, this would be stored in an audit log
    console.log('Data processing audit:', logEntry);
  }

  /**
   * Clean up expired keys and consents
   */
  async cleanupExpiredData(): Promise<{ keysCleaned: number; consentsCleaned: number }> {
    let keysCleaned = 0;
    let consentsCleaned = 0;

    // Clean up expired keys
    Array.from(this.userKeys.entries()).forEach(([userId, keys]) => {
      const activeKeys = keys.filter(key => {
        if (key.expiresAt && key.expiresAt < new Date() && !key.isActive) {
          keysCleaned++;
          return false;
        }
        return true;
      });
      this.userKeys.set(userId, activeKeys);
    });

    // Clean up expired consents
    Array.from(this.consentRecords.entries()).forEach(([userId, consents]) => {
      const activeConsents = consents.filter(consent => {
        if (consent.expiryDate && consent.expiryDate < new Date()) {
          consentsCleaned++;
          return false;
        }
        return true;
      });
      this.consentRecords.set(userId, activeConsents);
    });

    return { keysCleaned, consentsCleaned };
  }

  /**
   * Get encryption statistics
   */
  async getEncryptionStats(): Promise<Record<string, any>> {
    const allKeys = Array.from(this.userKeys.values()).flat();
    const allConsents = Array.from(this.consentRecords.values()).flat();

    return {
      totalKeys: allKeys.length,
      activeKeys: allKeys.filter(k => k.isActive).length,
      expiredKeys: allKeys.filter(k => k.expiresAt && k.expiresAt < new Date()).length,
      totalConsents: allConsents.length,
      validConsents: allConsents.filter(c => !c.expiryDate || c.expiryDate > new Date()).length,
      usersWithEncryption: this.userKeys.size,
      usersWithPrivacySettings: this.privacySettings.size
    };
  }

  /**
   * Export encryption keys for backup (encrypted)
   */
  async exportKeys(userId: string, masterPassword: string): Promise<string> {
    const userKeys = this.userKeys.get(userId) || [];

    // Encrypt the keys with master password
    const masterKey = crypto.scryptSync(masterPassword, 'salt', this.keyLength);
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipheriv('aes-256-cbc', masterKey, iv);
    let encrypted = cipher.update(JSON.stringify(userKeys), 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return JSON.stringify({
      data: encrypted,
      iv: iv.toString('base64'),
      salt: 'salt',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Import encryption keys from backup
   */
  async importKeys(userId: string, encryptedData: string, masterPassword: string): Promise<void> {
    const backup = JSON.parse(encryptedData);

    const masterKey = crypto.scryptSync(masterPassword, backup.salt, this.keyLength);
    const iv = Buffer.from(backup.iv, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', masterKey, iv);

    let decrypted = decipher.update(backup.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    const keys: EncryptionKey[] = JSON.parse(decrypted);
    this.userKeys.set(userId, keys);
  }
}