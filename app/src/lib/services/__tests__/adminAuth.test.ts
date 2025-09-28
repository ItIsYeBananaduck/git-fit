// Admin Authentication Service Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdminAuthService } from '../adminAuth';
import type { AdminCredentials, AdminUser } from '../../types/admin';

// Mock Convex
const mockConvex = {
  query: vi.fn(),
  mutation: vi.fn()
};

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
  hash: vi.fn()
}));

// Mock speakeasy
vi.mock('speakeasy', () => ({
  generateSecret: vi.fn(),
  totp: {
    verify: vi.fn()
  }
}));

// Mock crypto
vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => ({
    toString: vi.fn(() => 'mock-session-token')
  }))
}));

describe('AdminAuthService', () => {
  let adminAuthService: AdminAuthService;
  let mockAdmin: AdminUser;

  beforeEach(() => {
    adminAuthService = new AdminAuthService();
    
    mockAdmin = {
      _id: 'admin123' as any,
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'platform_admin',
      permissions: ['users.read', 'users.write'],
      passwordHash: '$2a$12$hashedpassword',
      mfaEnabled: false,
      isActive: true,
      failedLoginAttempts: 0,
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin123' as any,
      updatedAt: '2024-01-01T00:00:00Z'
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authenticateAdmin', () => {
    it('should successfully authenticate admin with valid credentials', async () => {
      const credentials: AdminCredentials = {
        email: 'admin@test.com',
        password: 'password123'
      };

      // Mock successful authentication flow
      mockConvex.query
        .mockResolvedValueOnce(mockAdmin) // getAdminByEmail
        .mockResolvedValueOnce(mockAdmin); // getAdminById for session validation

      mockConvex.mutation
        .mockResolvedValueOnce({ // createAdminSession
          _id: 'session123',
          adminId: mockAdmin._id,
          sessionToken: 'mock-session-token',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: '2024-01-01T00:00:00Z',
          expiresAt: '2024-01-01T08:00:00Z',
          lastActivity: '2024-01-01T00:00:00Z',
          isActive: true
        })
        .mockResolvedValueOnce(undefined) // updateAdminLoginSuccess
        .mockResolvedValueOnce(undefined); // logAdminAction

      // Mock bcrypt.compare to return true
      const bcrypt = await import('bcryptjs');
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      const result = await adminAuthService.authenticateAdmin(
        credentials,
        '127.0.0.1',
        'test-agent'
      );

      expect(result).toBeDefined();
      expect(result.sessionToken).toBe('mock-session-token');
      expect(mockConvex.query).toHaveBeenCalledWith(
        expect.anything(),
        { email: credentials.email }
      );
    });

    it('should reject authentication with invalid password', async () => {
      const credentials: AdminCredentials = {
        email: 'admin@test.com',
        password: 'wrongpassword'
      };

      mockConvex.query.mockResolvedValueOnce(mockAdmin);
      
      // Mock bcrypt.compare to return false
      const bcrypt = await import('bcryptjs');
      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      await expect(
        adminAuthService.authenticateAdmin(credentials, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject authentication for non-existent user', async () => {
      const credentials: AdminCredentials = {
        email: 'nonexistent@test.com',
        password: 'password123'
      };

      mockConvex.query.mockResolvedValueOnce(null); // User not found

      await expect(
        adminAuthService.authenticateAdmin(credentials, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject authentication for inactive user', async () => {
      const credentials: AdminCredentials = {
        email: 'admin@test.com',
        password: 'password123'
      };

      const inactiveAdmin = { ...mockAdmin, isActive: false };
      mockConvex.query.mockResolvedValueOnce(inactiveAdmin);

      await expect(
        adminAuthService.authenticateAdmin(credentials, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('Account is inactive');
    });

    it('should reject authentication for locked account', async () => {
      const credentials: AdminCredentials = {
        email: 'admin@test.com',
        password: 'password123'
      };

      const lockedAdmin = {
        ...mockAdmin,
        lockedUntil: new Date(Date.now() + 60000).toISOString() // Locked for 1 minute
      };
      mockConvex.query.mockResolvedValueOnce(lockedAdmin);

      await expect(
        adminAuthService.authenticateAdmin(credentials, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('Account is temporarily locked');
    });

    it('should require MFA token when MFA is enabled', async () => {
      const credentials: AdminCredentials = {
        email: 'admin@test.com',
        password: 'password123'
      };

      const mfaAdmin = {
        ...mockAdmin,
        mfaEnabled: true,
        mfaSecret: 'JBSWY3DPEHPK3PXP'
      };

      mockConvex.query.mockResolvedValueOnce(mfaAdmin);
      
      const bcrypt = await import('bcryptjs');
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      await expect(
        adminAuthService.authenticateAdmin(credentials, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('MFA token required');
    });

    it('should authenticate successfully with valid MFA token', async () => {
      const credentials: AdminCredentials = {
        email: 'admin@test.com',
        password: 'password123',
        mfaToken: '123456'
      };

      const mfaAdmin = {
        ...mockAdmin,
        mfaEnabled: true,
        mfaSecret: 'JBSWY3DPEHPK3PXP'
      };

      mockConvex.query
        .mockResolvedValueOnce(mfaAdmin)
        .mockResolvedValueOnce(mfaAdmin);

      mockConvex.mutation
        .mockResolvedValueOnce({
          _id: 'session123',
          adminId: mfaAdmin._id,
          sessionToken: 'mock-session-token',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: '2024-01-01T00:00:00Z',
          expiresAt: '2024-01-01T08:00:00Z',
          lastActivity: '2024-01-01T00:00:00Z',
          isActive: true
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const bcrypt = await import('bcryptjs');
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      const speakeasy = await import('speakeasy');
      vi.mocked(speakeasy.totp.verify).mockReturnValue(true);

      const result = await adminAuthService.authenticateAdmin(
        credentials,
        '127.0.0.1',
        'test-agent'
      );

      expect(result).toBeDefined();
      expect(result.sessionToken).toBe('mock-session-token');
    });

    it('should reject authentication with invalid MFA token', async () => {
      const credentials: AdminCredentials = {
        email: 'admin@test.com',
        password: 'password123',
        mfaToken: '000000'
      };

      const mfaAdmin = {
        ...mockAdmin,
        mfaEnabled: true,
        mfaSecret: 'JBSWY3DPEHPK3PXP'
      };

      mockConvex.query.mockResolvedValueOnce(mfaAdmin);
      
      const bcrypt = await import('bcryptjs');
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      const speakeasy = await import('speakeasy');
      vi.mocked(speakeasy.totp.verify).mockReturnValue(false);

      await expect(
        adminAuthService.authenticateAdmin(credentials, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('Invalid MFA token');
    });
  });

  describe('validateAdminSession', () => {
    it('should validate active session successfully', async () => {
      const sessionToken = 'valid-session-token';
      const mockSession = {
        _id: 'session123',
        adminId: mockAdmin._id,
        sessionToken,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: '2024-01-01T00:00:00Z',
        expiresAt: new Date(Date.now() + 60000).toISOString(), // Expires in 1 minute
        lastActivity: '2024-01-01T00:00:00Z',
        isActive: true
      };

      mockConvex.query
        .mockResolvedValueOnce(mockSession) // getAdminSession
        .mockResolvedValueOnce(mockAdmin); // getAdminById

      mockConvex.mutation.mockResolvedValueOnce(undefined); // updateSessionActivity

      const result = await adminAuthService.validateAdminSession(sessionToken, '127.0.0.1');

      expect(result).toEqual(mockAdmin);
      expect(mockConvex.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sessionId: mockSession._id
        })
      );
    });

    it('should return null for expired session', async () => {
      const sessionToken = 'expired-session-token';
      const expiredSession = {
        _id: 'session123',
        adminId: mockAdmin._id,
        sessionToken,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: '2024-01-01T00:00:00Z',
        expiresAt: new Date(Date.now() - 60000).toISOString(), // Expired 1 minute ago
        lastActivity: '2024-01-01T00:00:00Z',
        isActive: true
      };

      mockConvex.query.mockResolvedValueOnce(expiredSession);
      mockConvex.mutation.mockResolvedValueOnce(undefined); // revokeAdminSession

      const result = await adminAuthService.validateAdminSession(sessionToken, '127.0.0.1');

      expect(result).toBeNull();
      expect(mockConvex.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sessionId: expiredSession._id,
          reason: 'expired'
        })
      );
    });

    it('should return null for non-existent session', async () => {
      const sessionToken = 'non-existent-token';

      mockConvex.query.mockResolvedValueOnce(null);

      const result = await adminAuthService.validateAdminSession(sessionToken, '127.0.0.1');

      expect(result).toBeNull();
    });

    it('should return null for inactive session', async () => {
      const sessionToken = 'inactive-session-token';
      const inactiveSession = {
        _id: 'session123',
        adminId: mockAdmin._id,
        sessionToken,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: '2024-01-01T00:00:00Z',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        lastActivity: '2024-01-01T00:00:00Z',
        isActive: false
      };

      mockConvex.query.mockResolvedValueOnce(inactiveSession);

      const result = await adminAuthService.validateAdminSession(sessionToken, '127.0.0.1');

      expect(result).toBeNull();
    });
  });

  describe('validateAdminPermissions', () => {
    it('should allow super admin all permissions', async () => {
      const superAdmin = { ...mockAdmin, role: 'super_admin' as const };
      mockConvex.query.mockResolvedValueOnce(superAdmin);

      const result = await adminAuthService.validateAdminPermissions(
        mockAdmin._id,
        'delete',
        'users'
      );

      expect(result).toBe(true);
    });

    it('should allow admin with direct permission', async () => {
      const adminWithPermission = {
        ...mockAdmin,
        permissions: ['users.delete', 'users.read']
      };
      mockConvex.query.mockResolvedValueOnce(adminWithPermission);

      const result = await adminAuthService.validateAdminPermissions(
        mockAdmin._id,
        'delete',
        'users'
      );

      expect(result).toBe(true);
    });

    it('should allow admin with wildcard permission', async () => {
      const adminWithWildcard = {
        ...mockAdmin,
        permissions: ['users.*']
      };
      mockConvex.query.mockResolvedValueOnce(adminWithWildcard);

      const result = await adminAuthService.validateAdminPermissions(
        mockAdmin._id,
        'delete',
        'users'
      );

      expect(result).toBe(true);
    });

    it('should deny admin without permission', async () => {
      const adminWithoutPermission = {
        ...mockAdmin,
        permissions: ['users.read']
      };
      mockConvex.query
        .mockResolvedValueOnce(adminWithoutPermission)
        .mockResolvedValueOnce({ permissions: [] }); // Role permissions

      const result = await adminAuthService.validateAdminPermissions(
        mockAdmin._id,
        'delete',
        'users'
      );

      expect(result).toBe(false);
    });

    it('should deny inactive admin', async () => {
      const inactiveAdmin = { ...mockAdmin, isActive: false };
      mockConvex.query.mockResolvedValueOnce(inactiveAdmin);

      const result = await adminAuthService.validateAdminPermissions(
        mockAdmin._id,
        'read',
        'users'
      );

      expect(result).toBe(false);
    });
  });

  describe('createAdminUser', () => {
    it('should create admin user successfully', async () => {
      const adminData = {
        email: 'newadmin@test.com',
        name: 'New Admin',
        role: 'user_support' as const,
        permissions: ['users.read'],
        mfaEnabled: false,
        isActive: true,
        failedLoginAttempts: 0
      };

      const creatorId = mockAdmin._id;
      const password = 'newpassword123';

      // Mock permission validation
      mockConvex.query
        .mockResolvedValueOnce(mockAdmin) // Permission check
        .mockResolvedValueOnce({ permissions: ['admin_users.create'] }); // Role permissions

      // Mock password hashing
      const bcrypt = await import('bcryptjs');
      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$12$hashedpassword');

      // Mock admin creation
      const newAdmin = { ...adminData, _id: 'newadmin123' as any, passwordHash: '$2a$12$hashedpassword' };
      mockConvex.mutation
        .mockResolvedValueOnce(newAdmin)
        .mockResolvedValueOnce(undefined); // Log action

      const result = await adminAuthService.createAdminUser(adminData, password, creatorId);

      expect(result).toEqual(newAdmin);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it('should reject creation without permission', async () => {
      const adminData = {
        email: 'newadmin@test.com',
        name: 'New Admin',
        role: 'user_support' as const,
        permissions: ['users.read'],
        mfaEnabled: false,
        isActive: true,
        failedLoginAttempts: 0
      };

      const creatorId = mockAdmin._id;
      const password = 'newpassword123';

      // Mock permission validation to fail
      mockConvex.query
        .mockResolvedValueOnce(mockAdmin)
        .mockResolvedValueOnce({ permissions: [] }); // No permissions

      await expect(
        adminAuthService.createAdminUser(adminData, password, creatorId)
      ).rejects.toThrow('Insufficient permissions to create admin user');
    });
  });

  describe('setupMFA', () => {
    it('should setup MFA successfully', async () => {
      mockConvex.query.mockResolvedValueOnce(mockAdmin);
      mockConvex.mutation.mockResolvedValueOnce(undefined);

      const speakeasy = await import('speakeasy');
      vi.mocked(speakeasy.generateSecret).mockReturnValue({
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url: 'otpauth://totp/AdaptiveFit%20Admin%20(admin@test.com)?secret=JBSWY3DPEHPK3PXP&issuer=AdaptiveFit'
      } as any);

      const result = await adminAuthService.setupMFA(mockAdmin._id);

      expect(result).toEqual({
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: 'otpauth://totp/AdaptiveFit%20Admin%20(admin@test.com)?secret=JBSWY3DPEHPK3PXP&issuer=AdaptiveFit'
      });
    });

    it('should reject MFA setup for non-existent admin', async () => {
      mockConvex.query.mockResolvedValueOnce(null);

      await expect(
        adminAuthService.setupMFA(mockAdmin._id)
      ).rejects.toThrow('Admin user not found');
    });
  });
});