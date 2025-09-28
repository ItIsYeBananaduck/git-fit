<script lang="ts">
	import { adminAuthService } from '../../services/adminAuth';
	import type { AdminCredentials } from '../../types/admin';

	let credentials: AdminCredentials = {
		email: '',
		password: '',
		mfaToken: ''
	};

	let loading = false;
	let error = '';
	let showMFA = false;
	let loginSuccess = false;

	async function handleLogin() {
		if (!credentials.email || !credentials.password) {
			error = 'Email and password are required';
			return;
		}

		loading = true;
		error = '';

		try {
			// Get client IP (in real app, this would come from server)
			const ipAddress = '127.0.0.1'; // Placeholder
			const userAgent = navigator.userAgent;

			const session = await adminAuthService.authenticateAdmin(credentials, ipAddress, userAgent);

			if (session) {
				loginSuccess = true;
				// Store session token securely
				localStorage.setItem('admin_session_token', session.sessionToken);
				// Redirect to admin dashboard
				window.location.href = '/admin/dashboard';
			}
		} catch (err: any) {
			if (err.message === 'MFA token required') {
				showMFA = true;
				error = '';
			} else {
				error = err.message || 'Login failed';
				showMFA = false;
			}
		} finally {
			loading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleLogin();
		}
	}
</script>

<div class="admin-login">
	<div class="login-container">
		<div class="login-header">
			<h1>Admin Login</h1>
			<p>Adaptive fIt Platform Administration</p>
		</div>

		{#if loginSuccess}
			<div class="success-message">
				<p>✅ Login successful! Redirecting...</p>
			</div>
		{:else}
			<form on:submit|preventDefault={handleLogin} class="login-form">
				<div class="form-group">
					<label for="email">Email</label>
					<input
						id="email"
						type="email"
						bind:value={credentials.email}
						on:keypress={handleKeyPress}
						placeholder="admin@adaptivefit.com"
						required
						disabled={loading}
					/>
				</div>

				<div class="form-group">
					<label for="password">Password</label>
					<input
						id="password"
						type="password"
						bind:value={credentials.password}
						on:keypress={handleKeyPress}
						placeholder="Enter your password"
						required
						disabled={loading}
					/>
				</div>

				{#if showMFA}
					<div class="form-group">
						<label for="mfa">MFA Token</label>
						<input
							id="mfa"
							type="text"
							bind:value={credentials.mfaToken}
							on:keypress={handleKeyPress}
							placeholder="Enter 6-digit MFA code"
							maxlength="6"
							required
							disabled={loading}
						/>
						<small>Enter the 6-digit code from your authenticator app</small>
					</div>
				{/if}

				{#if error}
					<div class="error-message">
						<p>❌ {error}</p>
					</div>
				{/if}

				<button type="submit" disabled={loading} class="login-button">
					{#if loading}
						<span class="spinner"></span>
						Authenticating...
					{:else}
						Login
					{/if}
				</button>
			</form>

			<div class="login-footer">
				<p>Secure admin access with role-based permissions</p>
				<small>All admin actions are logged for security and compliance</small>
			</div>
		{/if}
	</div>
</div>

<style>
	.admin-login {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 20px;
	}

	.login-container {
		background: white;
		border-radius: 12px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
		padding: 40px;
		width: 100%;
		max-width: 400px;
	}

	.login-header {
		text-align: center;
		margin-bottom: 30px;
	}

	.login-header h1 {
		color: #333;
		margin: 0 0 8px 0;
		font-size: 28px;
		font-weight: 600;
	}

	.login-header p {
		color: #666;
		margin: 0;
		font-size: 14px;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-group label {
		font-weight: 500;
		color: #333;
		font-size: 14px;
	}

	.form-group input {
		padding: 12px 16px;
		border: 2px solid #e1e5e9;
		border-radius: 8px;
		font-size: 16px;
		transition: border-color 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: #667eea;
	}

	.form-group input:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
	}

	.form-group small {
		color: #666;
		font-size: 12px;
	}

	.login-button {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 14px 20px;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 500;
		cursor: pointer;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.login-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
	}

	.login-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-message {
		background: #fee;
		border: 1px solid #fcc;
		border-radius: 6px;
		padding: 12px;
		text-align: center;
	}

	.error-message p {
		margin: 0;
		color: #c33;
		font-size: 14px;
	}

	.success-message {
		background: #efe;
		border: 1px solid #cfc;
		border-radius: 6px;
		padding: 12px;
		text-align: center;
	}

	.success-message p {
		margin: 0;
		color: #3c3;
		font-size: 14px;
	}

	.login-footer {
		text-align: center;
		margin-top: 30px;
		padding-top: 20px;
		border-top: 1px solid #eee;
	}

	.login-footer p {
		margin: 0 0 4px 0;
		color: #666;
		font-size: 13px;
	}

	.login-footer small {
		color: #999;
		font-size: 11px;
	}
</style>
