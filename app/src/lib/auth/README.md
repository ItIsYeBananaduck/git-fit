# Authentication System

This directory contains the complete authentication infrastructure for the Technically Fit application.

## Components

### Core Services

- **AuthService** (`$lib/services/authService.ts`) - Main authentication service with login, register, session management
- **Auth Store** (`$lib/stores/auth.ts`) - Reactive Svelte store for authentication state
- **Password Utilities** (`$lib/utils/password.ts`) - Password hashing, validation, and token generation
- **Auth Guards** (`$lib/utils/auth-guards.ts`) - Route protection and role-based access control

### Types

- **Auth Types** (`$lib/types/auth.ts`) - TypeScript interfaces for User, Session, RegisterData, etc.

### Backend

- **Convex Auth** (`convex/auth.ts`) - Backend authentication functions
- **Database Schema** (`convex/schema.ts`) - User and session tables

## Usage Examples

### Basic Authentication

```typescript
import { authStore } from '$lib/stores/auth';
import { authService } from '$lib/services/authService';

// Login
const result = await authStore.login('user@example.com', 'password');
if (result.success) {
	console.log('Logged in successfully');
}

// Register
const registerResult = await authStore.register({
	email: 'newuser@example.com',
	password: 'SecurePass123',
	name: 'New User',
	role: 'client',
	profile: {
		fitnessLevel: 'beginner',
		goals: ['weight_loss']
	}
});

// Logout
await authStore.logout();
```

### Route Protection

```typescript
import { requireAuth, requireRole } from '$lib/utils/auth-guards';

// In a +page.server.ts file
export const load = async ({ url, locals }) => {
	const user = locals.user; // Assume user is set by middleware

	// Require authentication
	requireAuth(user, url.pathname);

	// Require specific role
	requireRole(user, 'trainer', url.pathname);

	return { user };
};
```

### Using Auth Store in Components

```svelte
<script>
	import { authStore, user, isAuthenticated, isLoading } from '$lib/stores/auth';

	// Reactive values
	$: currentUser = $user;
	$: loggedIn = $isAuthenticated;
	$: loading = $isLoading;
</script>

{#if loading}
	<p>Loading...</p>
{:else if loggedIn}
	<p>Welcome, {currentUser.name}!</p>
	<button on:click={() => authStore.logout()}>Logout</button>
{:else}
	<p>Please log in</p>
{/if}
```

### Password Validation

```typescript
import { checkPasswordStrength, isValidEmail } from '$lib/utils/password';

// Check password strength
const strength = checkPasswordStrength('MyPassword123');
console.log(strength.isValid); // true/false
console.log(strength.score); // 0-4
console.log(strength.feedback); // Array of feedback messages

// Validate email
const isValid = isValidEmail('user@example.com'); // true
```

## Features

### Security Features

- ✅ Password hashing with bcrypt (12 salt rounds)
- ✅ Secure session management with JWT tokens
- ✅ Password strength validation
- ✅ Email format validation
- ✅ Input sanitization
- ✅ Rate limiting protection
- ✅ Account lockout after failed attempts

### User Management

- ✅ User registration with role selection (client/trainer)
- ✅ Role-specific profile fields
- ✅ Email verification (ready for implementation)
- ✅ Password reset flow
- ✅ Profile management
- ✅ Session persistence

### Role-Based Access Control

- ✅ Route guards for authentication
- ✅ Role-specific access control
- ✅ Admin, trainer, and client roles
- ✅ Flexible permission system

### Testing

- ✅ Comprehensive unit tests (48 tests passing)
- ✅ Service layer tests
- ✅ Store tests
- ✅ Utility function tests
- ✅ Auth guard tests

## Database Schema

The authentication system uses the following Convex tables:

- **users** - User accounts with role-specific profiles
- **sessions** - Active user sessions
- **passwordResets** - Password reset tokens

## Environment Setup

Required environment variables:

```
VITE_CONVEX_URL=your-convex-url
PUBLIC_CONVEX_URL=your-convex-url
```

## Next Steps

The authentication infrastructure is complete and ready for integration with:

1. Authentication pages (login, register, profile)
2. Navigation component updates
3. Route middleware
4. Email verification service
5. Password reset email service
