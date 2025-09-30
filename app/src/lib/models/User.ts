/**
 * User Entity Model
 * Core user management with authentication, profile data, and business logic
 * Implements comprehensive validation and security measures
 */

import { z } from 'zod';
import type { UserProfile } from '../types/api-contracts.js';

// Extended user data interfaces
export interface UserData {
  id: string;
  email: string;
  profile: ExtendedUserProfile;
  preferences: UserPreferences;
  biometricCredentials?: BiometricCredential[];
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  trainerConnections?: string[];
  subscriptionStatus?: 'free' | 'premium' | 'trainer';
  accountStatus?: 'active' | 'suspended' | 'pending_verification';
}

export interface ExtendedUserProfile extends UserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  height: number; // cm
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  fitnessGoals: string[];
  dietaryRestrictions?: string[];
  medicalConditions?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface UserPreferences {
  units: 'metric' | 'imperial';
  language: string;
  timezone: string;
  notifications: {
    workoutReminders: boolean;
    progressUpdates: boolean;
    nutritionTips: boolean;
    trainerMessages: boolean;
  };
  privacy: {
    shareProgressWithTrainer: boolean;
    allowDataAnalytics: boolean;
    publicProfile: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'auto';
    compactView: boolean;
    showAdvancedMetrics: boolean;
  };
}

export interface BiometricCredential {
  id: string;
  type: 'fingerprint' | 'face' | 'voice';
  publicKey: string;
  enrolledAt: string;
  lastUsed?: string;
  deviceInfo: {
    platform: string;
    browser: string;
    os: string;
  };
  isActive: boolean;
}

/**
 * User profile validation schema
 */
export const UserProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  dateOfBirth: z.string().datetime('Invalid date format'),
  height: z.number().min(50, 'Height too low').max(300, 'Height too high'), // cm
  weight: z.number().min(20, 'Weight too low').max(500, 'Weight too high'), // kg
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']),
  fitnessGoals: z.array(z.enum(['weight_loss', 'muscle_gain', 'endurance', 'strength', 'general_fitness'])),
  dietaryRestrictions: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  emergencyContact: z.object({
    name: z.string().min(1, 'Emergency contact name required'),
    phone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number'),
    relationship: z.string().min(1, 'Relationship required')
  }).optional()
});

/**
 * User preferences validation schema
 */
export const UserPreferencesSchema = z.object({
  units: z.enum(['metric', 'imperial']),
  language: z.string().min(2, 'Language code required'),
  timezone: z.string().min(1, 'Timezone required'),
  notifications: z.object({
    workoutReminders: z.boolean(),
    progressUpdates: z.boolean(),
    nutritionTips: z.boolean(),
    trainerMessages: z.boolean()
  }),
  privacy: z.object({
    shareProgressWithTrainer: z.boolean(),
    allowDataAnalytics: z.boolean(),
    publicProfile: z.boolean()
  }),
  display: z.object({
    theme: z.enum(['light', 'dark', 'auto']),
    compactView: z.boolean(),
    showAdvancedMetrics: z.boolean()
  })
});

/**
 * Biometric credential validation schema
 */
export const BiometricCredentialSchema = z.object({
  id: z.string().min(1, 'Credential ID required'),
  type: z.enum(['fingerprint', 'face', 'voice']),
  publicKey: z.string().min(1, 'Public key required'),
  enrolledAt: z.string().datetime('Invalid enrollment date'),
  lastUsed: z.string().datetime('Invalid last used date').optional(),
  deviceInfo: z.object({
    platform: z.string(),
    browser: z.string(),
    os: z.string()
  }),
  isActive: z.boolean()
});

/**
 * User class with comprehensive business logic and validation
 */
export class User {
  private _id: string;
  private _email: string;
  private _profile: ExtendedUserProfile;
  private _preferences: UserPreferences;
  private _biometricCredentials: BiometricCredential[];
  private _isEmailVerified: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _lastLoginAt: Date | null;
  private _trainerConnections: string[];
  private _subscriptionStatus: 'free' | 'premium' | 'trainer';
  private _accountStatus: 'active' | 'suspended' | 'pending_verification';

  constructor(userData: UserData) {
    this._id = userData.id;
    this._email = userData.email;
    this._profile = userData.profile;
    this._preferences = userData.preferences;
    this._biometricCredentials = userData.biometricCredentials || [];
    this._isEmailVerified = userData.isEmailVerified;
    this._createdAt = new Date(userData.createdAt);
    this._updatedAt = new Date(userData.updatedAt);
    this._lastLoginAt = userData.lastLoginAt ? new Date(userData.lastLoginAt) : null;
    this._trainerConnections = userData.trainerConnections || [];
    this._subscriptionStatus = userData.subscriptionStatus || 'free';
    this._accountStatus = userData.accountStatus || 'pending_verification';

    this.validate();
  }

  // Getters
  get id(): string { return this._id; }
  get email(): string { return this._email; }
  get profile(): ExtendedUserProfile { return { ...this._profile }; }
  get preferences(): UserPreferences { return { ...this._preferences }; }
  get biometricCredentials(): BiometricCredential[] { return [...this._biometricCredentials]; }
  get isEmailVerified(): boolean { return this._isEmailVerified; }
  get createdAt(): Date { return new Date(this._createdAt); }
  get updatedAt(): Date { return new Date(this._updatedAt); }
  get lastLoginAt(): Date | null { return this._lastLoginAt ? new Date(this._lastLoginAt) : null; }
  get trainerConnections(): string[] { return [...this._trainerConnections]; }
  get subscriptionStatus(): 'free' | 'premium' | 'trainer' { return this._subscriptionStatus; }
  get accountStatus(): 'active' | 'suspended' | 'pending_verification' { return this._accountStatus; }

  /**
   * Validate user data against schemas
   */
  private validate(): void {
    try {
      UserProfileSchema.parse(this._profile);
      UserPreferencesSchema.parse(this._preferences);
      
      this._biometricCredentials.forEach(credential => {
        BiometricCredentialSchema.parse(credential);
      });

      // Email validation
      if (!this.isValidEmail(this._email)) {
        throw new Error('Invalid email format');
      }

      // Business rule validations
      this.validateBusinessRules();

    } catch (error) {
      throw new Error(`User validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate business rules
   */
  private validateBusinessRules(): void {
    // Age validation (must be 13+ for COPPA compliance)
    const age = this.calculateAge();
    if (age < 13) {
      throw new Error('User must be at least 13 years old');
    }

    // Profile completeness for certain features
    if (this._subscriptionStatus !== 'free' && !this.isProfileComplete()) {
      throw new Error('Premium features require complete profile');
    }

    // Trainer connections limit for free users
    if (this._subscriptionStatus === 'free' && this._trainerConnections.length > 1) {
      throw new Error('Free users can only connect to one trainer');
    }
  }

  /**
   * Update user profile with validation
   */
  updateProfile(profileUpdates: Partial<ExtendedUserProfile>): void {
    const updatedProfile = { ...this._profile, ...profileUpdates };
    
    try {
      UserProfileSchema.parse(updatedProfile);
      this._profile = updatedProfile;
      this._updatedAt = new Date();
      this.validateBusinessRules();
    } catch (error) {
      throw new Error(`Profile update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user preferences with validation
   */
  updatePreferences(preferencesUpdates: Partial<UserPreferences>): void {
    const updatedPreferences = { ...this._preferences, ...preferencesUpdates };
    
    try {
      UserPreferencesSchema.parse(updatedPreferences);
      this._preferences = updatedPreferences;
      this._updatedAt = new Date();
    } catch (error) {
      throw new Error(`Preferences update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add biometric credential with validation
   */
  addBiometricCredential(credential: BiometricCredential): void {
    try {
      BiometricCredentialSchema.parse(credential);
      
      // Check for duplicate credentials
      const existingCredential = this._biometricCredentials.find(
        c => c.id === credential.id || (c.type === credential.type && c.publicKey === credential.publicKey)
      );
      
      if (existingCredential) {
        throw new Error('Biometric credential already exists');
      }

      // Limit number of credentials per type
      const credentialsOfType = this._biometricCredentials.filter(c => c.type === credential.type);
      if (credentialsOfType.length >= 3) {
        throw new Error(`Maximum 3 ${credential.type} credentials allowed`);
      }

      this._biometricCredentials.push(credential);
      this._updatedAt = new Date();
    } catch (error) {
      throw new Error(`Failed to add biometric credential: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove biometric credential
   */
  removeBiometricCredential(credentialId: string): void {
    const initialLength = this._biometricCredentials.length;
    this._biometricCredentials = this._biometricCredentials.filter(c => c.id !== credentialId);
    
    if (this._biometricCredentials.length === initialLength) {
      throw new Error('Biometric credential not found');
    }
    
    this._updatedAt = new Date();
  }

  /**
   * Connect to a trainer
   */
  connectToTrainer(trainerId: string): void {
    if (this._trainerConnections.includes(trainerId)) {
      throw new Error('Already connected to this trainer');
    }

    if (this._subscriptionStatus === 'free' && this._trainerConnections.length >= 1) {
      throw new Error('Free users can only connect to one trainer');
    }

    this._trainerConnections.push(trainerId);
    this._updatedAt = new Date();
  }

  /**
   * Disconnect from a trainer
   */
  disconnectFromTrainer(trainerId: string): void {
    const initialLength = this._trainerConnections.length;
    this._trainerConnections = this._trainerConnections.filter(id => id !== trainerId);
    
    if (this._trainerConnections.length === initialLength) {
      throw new Error('Not connected to this trainer');
    }
    
    this._updatedAt = new Date();
  }

  /**
   * Update subscription status with validation
   */
  updateSubscriptionStatus(status: 'free' | 'premium' | 'trainer'): void {
    const previousStatus = this._subscriptionStatus;
    this._subscriptionStatus = status;
    
    try {
      this.validateBusinessRules();
      this._updatedAt = new Date();
    } catch (error) {
      // Revert on validation failure
      this._subscriptionStatus = previousStatus;
      throw error;
    }
  }

  /**
   * Update account status
   */
  updateAccountStatus(status: 'active' | 'suspended' | 'pending_verification'): void {
    this._accountStatus = status;
    this._updatedAt = new Date();
  }

  /**
   * Mark email as verified
   */
  verifyEmail(): void {
    this._isEmailVerified = true;
    
    // Activate account if it was pending verification
    if (this._accountStatus === 'pending_verification') {
      this._accountStatus = 'active';
    }
    
    this._updatedAt = new Date();
  }

  /**
   * Record login activity
   */
  recordLogin(): void {
    this._lastLoginAt = new Date();
  }

  /**
   * Calculate user's age
   */
  calculateAge(): number {
    const birthDate = new Date(this._profile.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Calculate BMI (Body Mass Index)
   */
  calculateBMI(): number {
    if (!this._profile.height || !this._profile.weight) {
      throw new Error('Height and weight required for BMI calculation');
    }
    const heightInMeters = this._profile.height / 100;
    return this._profile.weight / (heightInMeters * heightInMeters);
  }

  /**
   * Get BMI category
   */
  getBMICategory(): 'underweight' | 'normal' | 'overweight' | 'obese' {
    const bmi = this.calculateBMI();
    
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  }

  /**
   * Check if profile is complete
   */
  isProfileComplete(): boolean {
    const requiredFields = [
      this._profile.firstName,
      this._profile.lastName,
      this._profile.dateOfBirth,
      this._profile.height,
      this._profile.weight,
      this._profile.activityLevel,
      this._profile.fitnessGoals && this._profile.fitnessGoals.length > 0
    ];
    
    return requiredFields.every(field => 
      field !== undefined && field !== null && field !== ''
    );
  }

  /**
   * Check if user can access premium features
   */
  canAccessPremiumFeatures(): boolean {
    return this._subscriptionStatus === 'premium' || this._subscriptionStatus === 'trainer';
  }

  /**
   * Check if user can access trainer features
   */
  canAccessTrainerFeatures(): boolean {
    return this._subscriptionStatus === 'trainer';
  }

  /**
   * Check if account is active and verified
   */
  isAccountActive(): boolean {
    return this._accountStatus === 'active' && this._isEmailVerified;
  }

  /**
   * Get active biometric credentials
   */
  getActiveBiometricCredentials(): BiometricCredential[] {
    return this._biometricCredentials.filter(c => c.isActive);
  }

  /**
   * Check if email format is valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Export user data for API responses
   */
  toJSON(): UserData {
    return {
      id: this._id,
      email: this._email,
      profile: this._profile,
      preferences: this._preferences,
      biometricCredentials: this._biometricCredentials,
      isEmailVerified: this._isEmailVerified,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      lastLoginAt: this._lastLoginAt?.toISOString() || null,
      trainerConnections: this._trainerConnections,
      subscriptionStatus: this._subscriptionStatus,
      accountStatus: this._accountStatus
    };
  }

  /**
   * Create a new User instance from JSON data
   */
  static fromJSON(data: UserData): User {
    return new User(data);
  }

  /**
   * Validate user data without creating instance
   */
  static validate(userData: UserData): { valid: boolean; errors: string[] } {
    try {
      new User(userData);
      return { valid: true, errors: [] };
    } catch (error) {
      return { 
        valid: false, 
        errors: [error instanceof Error ? error.message : 'Unknown validation error'] 
      };
    }
  }
}

export default User;