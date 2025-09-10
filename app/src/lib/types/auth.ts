// Authentication Types

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'client' | 'trainer' | 'admin';
  profile: ClientProfile | TrainerProfile | AdminProfile;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  emailVerified: boolean;
}

export interface ClientProfile {
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  height?: number; // cm
  weight?: number; // kg
  dateOfBirth?: string;
  profileImage?: string;
  preferences: {
    units: 'metric' | 'imperial';
    notifications: boolean;
    dataSharing: boolean;
  };
}

export interface TrainerProfile {
  bio: string;
  specialties: string[];
  certifications: string[];
  hourlyRate: number;
  profileImage?: string;
  experience: number; // years
  availability: {
    timezone: string;
    schedule: Record<string, { start: string; end: string }>;
  };
  preferences: {
    notifications: boolean;
    clientCommunication: boolean;
  };
}

export interface AdminProfile {
  department: string;
  permissions: string[];
  profileImage?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'client' | 'trainer';
  profile: Partial<ClientProfile> | Partial<TrainerProfile>;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  requiresVerification?: boolean;
}

export interface Session {
  _id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  lastActivity: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PasswordResetRequest {
  email: string;
  token: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'SESSION_EXPIRED'
  | 'EMAIL_NOT_VERIFIED'
  | 'ACCOUNT_DISABLED'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
}