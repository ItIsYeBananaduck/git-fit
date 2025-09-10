// Auth Guards Tests

import { describe, it, expect, vi } from 'vitest';
import { 
  requireAuth, 
  requireRole, 
  redirectIfAuthenticated,
  requireAdmin,
  requireTrainer,
  requireClient
} from '../auth-guards';
import type { User } from '$lib/types/auth';

// Mock SvelteKit redirect
vi.mock('@sveltejs/kit', () => ({
  redirect: vi.fn((status: number, location: string) => {
    throw new Error(`Redirect: ${status} -> ${location}`);
  })
}));

describe('Auth Guards', () => {
  const mockUser: User = {
    _id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'client',
    profile: {
      fitnessLevel: 'beginner',
      goals: ['weight_loss'],
      preferences: {
        units: 'metric',
        notifications: true,
        dataSharing: false
      }
    },
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    emailVerified: true
  };

  const mockTrainer: User = {
    ...mockUser,
    role: 'trainer',
    profile: {
      bio: 'Experienced trainer',
      specialties: ['strength'],
      certifications: ['NASM'],
      hourlyRate: 50,
      experience: 5,
      availability: {
        timezone: 'UTC',
        schedule: {}
      },
      preferences: {
        notifications: true,
        clientCommunication: true
      }
    }
  };

  const mockAdmin: User = {
    ...mockUser,
    role: 'admin',
    profile: {
      department: 'IT',
      permissions: ['all']
    }
  };

  describe('requireAuth', () => {
    it('should return user when authenticated', () => {
      const result = requireAuth(mockUser, '/dashboard');
      expect(result).toBe(mockUser);
    });

    it('should redirect when not authenticated', () => {
      expect(() => {
        requireAuth(null, '/dashboard');
      }).toThrow('Redirect: 302 -> /auth/login?redirect=%2Fdashboard');
    });
  });

  describe('requireRole', () => {
    it('should return user when role matches', () => {
      const result = requireRole(mockUser, 'client', '/dashboard');
      expect(result).toBe(mockUser);
    });

    it('should return user when role is in array', () => {
      const result = requireRole(mockUser, ['client', 'trainer'], '/dashboard');
      expect(result).toBe(mockUser);
    });

    it('should redirect when role does not match', () => {
      expect(() => {
        requireRole(mockUser, 'admin', '/admin');
      }).toThrow('Redirect: 302 -> /unauthorized');
    });

    it('should redirect when not authenticated', () => {
      expect(() => {
        requireRole(null, 'client', '/dashboard');
      }).toThrow('Redirect: 302 -> /auth/login?redirect=%2Fdashboard');
    });
  });

  describe('redirectIfAuthenticated', () => {
    it('should redirect when authenticated', () => {
      expect(() => {
        redirectIfAuthenticated(mockUser);
      }).toThrow('Redirect: 302 -> /');
    });

    it('should redirect to custom location when authenticated', () => {
      expect(() => {
        redirectIfAuthenticated(mockUser, '/dashboard');
      }).toThrow('Redirect: 302 -> /dashboard');
    });

    it('should not redirect when not authenticated', () => {
      expect(() => {
        redirectIfAuthenticated(null);
      }).not.toThrow();
    });
  });

  describe('requireAdmin', () => {
    it('should return admin user', () => {
      const result = requireAdmin(mockAdmin, '/admin');
      expect(result).toBe(mockAdmin);
    });

    it('should reject non-admin users', () => {
      expect(() => {
        requireAdmin(mockUser, '/admin');
      }).toThrow('Redirect: 302 -> /unauthorized');
    });

    it('should redirect when not authenticated', () => {
      expect(() => {
        requireAdmin(null, '/admin');
      }).toThrow('Redirect: 302 -> /auth/login?redirect=%2Fadmin');
    });
  });

  describe('requireTrainer', () => {
    it('should return trainer user', () => {
      const result = requireTrainer(mockTrainer, '/trainer-dashboard');
      expect(result).toBe(mockTrainer);
    });

    it('should return admin user', () => {
      const result = requireTrainer(mockAdmin, '/trainer-dashboard');
      expect(result).toBe(mockAdmin);
    });

    it('should reject client users', () => {
      expect(() => {
        requireTrainer(mockUser, '/trainer-dashboard');
      }).toThrow('Redirect: 302 -> /unauthorized');
    });
  });

  describe('requireClient', () => {
    it('should return client user', () => {
      const result = requireClient(mockUser, '/client-dashboard');
      expect(result).toBe(mockUser);
    });

    it('should return admin user', () => {
      const result = requireClient(mockAdmin, '/client-dashboard');
      expect(result).toBe(mockAdmin);
    });

    it('should reject trainer users', () => {
      expect(() => {
        requireClient(mockTrainer, '/client-dashboard');
      }).toThrow('Redirect: 302 -> /unauthorized');
    });
  });
});