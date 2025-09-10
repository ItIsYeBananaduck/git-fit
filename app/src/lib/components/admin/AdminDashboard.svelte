<script lang="ts">
	import { onMount } from 'svelte';
	import { adminAuthService } from '../../services/adminAuth';
	import { auditLoggingService } from '../../services/auditLoggingService';
	import type { AdminUser, AuditLogEntry, AuditStatistics, SecurityAlert } from '../../types/admin';

	// Authentication state
	let currentAdmin: AdminUser | null = null;
	let isAuthenticated = false;
	let sessionToken = '';

	// Dashboard data
	let auditStats: AuditStatistics | null = null;
	let recentCriticalActions: AuditLogEntry[] = [];
	let suspiciousActivities: SecurityAlert[] = [];
	let loading = true;
	let error = '';

	// Login form
	let loginForm = {
		email: '',
		password: '',
		mfaToken: ''
	};
	let loginLoading = false;
	let loginError = '';
	let showMfaInput = false;

	onMount(async () => {
		await checkAuthStatus();
		if (isAuthenticated) {
			await loadDashboardData();
		}
		loading = false;
	});

	async function checkAuthStatus() {
		try {
			const token = localStorage.getItem('admin_session_token');
			if (!token) return;

			const admin = await adminAuthService.validateAdminSession(token, getClientIP());
			if (admin) {
				currentAdmin = admin;
				isAuthenticated = true;
				sessionToken = token;
			} else {
				localStorage.removeItem('admin_session_token');
			}
		} catch (err) {
			console.error('Auth check failed:', err);
			localStorage.removeItem('admin_session_token');
		}
	}

	async function handleLogin() {
		if (!loginForm.email || !loginForm.password) {
			loginError = 'Email and password are required';
			return;
		}

		loginLoading = true;
		loginError = '';

		try {
			const session = await adminAuthService.authenticateAdmin(
				{
					email: loginForm.email,
					password: loginForm.password,
					mfaToken: loginForm.mfaToken || undefined
				},
				getClientIP(),
				navigator.userAgent
			);

			localStorage.setItem('admin_session_token', session.sessionToken);
			sessionToken = session.sessionToken;

			// Get admin user details
			currentAdmin = await adminAuthService.validateAdminSession(
				session.sessionToken,
				getClientIP()
			);
			isAuthenticated = true;

			// Load dashboard data
			await loadDashboardData();

			// Clear form
			loginForm = { email: '', password: '', mfaToken: '' };
			showMfaInput = false;
		} catch (err: any) {
			console.error('Login failed:', err);

			if (err.message?.includes('MFA token required')) {
				showMfaInput = true;
				loginError = 'Please enter your MFA token';
			} else {
				loginError = err.message || 'Login failed';
				showMfaInput = false;
			}
		} finally {
			loginLoading = false;
		}
	}

	async function handleLogout() {
		try {
			if (currentAdmin && sessionToken) {
				await adminAuthService.logoutAdmin(sessionToken, currentAdmin._id);
			}
		} catch (err) {
			console.error('Logout error:', err);
		} finally {
			localStorage.removeItem('admin_session_token');
			currentAdmin = null;
			isAuthenticated = false;
			sessionToken = '';
			auditStats = null;
			recentCriticalActions = [];
			suspiciousActivities = [];
		}
	}

	async function loadDashboardData() {
		if (!isAuthenticated || !currentAdmin) return;

		try {
			// Load audit statistics
			auditStats = await auditLoggingService.getAuditStatistics({
				start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
				end: new Date().toISOString()
			});

			// Load recent critical actions
			recentCriticalActions = await auditLoggingService.getRecentCriticalActions(24, 10);

			// Load suspicious activities (mock data for demo)
			suspiciousActivities = [
				{
					id: '1',
					type: 'failed_logins',
					severity: 'high',
					description: 'Multiple failed login attempts from IP 192.168.1.100',
					details: { ip: '192.168.1.100', attempts: 7 },
					timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
					acknowledged: false
				}
			];
		} catch (err) {
			console.error('Failed to load dashboard data:', err);
			error = 'Failed to load dashboard data';
		}
	}

	function getClientIP(): string {
		// In a real implementation, this would get the actual client IP
		return '127.0.0.1';
	}

	function formatTimestamp(timestamp: string): string {
		return new Date(timestamp).toLocaleString();
	}

	function getSeverityColor(severity: string): string {
		switch (severity) {
			case 'critical':
				return 'text-red-600 bg-red-100';
			case 'high':
				return 'text-orange-600 bg-orange-100';
			case 'medium':
				return 'text-yellow-600 bg-yellow-100';
			case 'low':
				return 'text-green-600 bg-green-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}

	function getCategoryColor(category: string): string {
		switch (category) {
			case 'authentication':
				return 'text-blue-600 bg-blue-100';
			case 'user_management':
				return 'text-purple-600 bg-purple-100';
			case 'content_moderation':
				return 'text-indigo-600 bg-indigo-100';
			case 'financial':
				return 'text-green-600 bg-green-100';
			case 'system_config':
				return 'text-red-600 bg-red-100';
			case 'data_access':
				return 'text-gray-600 bg-gray-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	{#if loading}
		<div class="flex items-center justify-center min-h-screen">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
		</div>
	{:else if !isAuthenticated}
		<!-- Login Form -->
		<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div class="max-w-md w-full space-y-8">
				<div>
					<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Admin Dashboard</h2>
					<p class="mt-2 text-center text-sm text-gray-600">Sign in to your admin account</p>
				</div>

				<form class="mt-8 space-y-6" on:submit|preventDefault={handleLogin}>
					<div class="rounded-md shadow-sm -space-y-px">
						<div>
							<label for="email" class="sr-only">Email address</label>
							<input
								id="email"
								name="email"
								type="email"
								required
								bind:value={loginForm.email}
								class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
								placeholder="Email address"
							/>
						</div>
						<div>
							<label for="password" class="sr-only">Password</label>
							<input
								id="password"
								name="password"
								type="password"
								required
								bind:value={loginForm.password}
								class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 {showMfaInput
									? ''
									: 'rounded-b-md'} focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
								placeholder="Password"
							/>
						</div>
						{#if showMfaInput}
							<div>
								<label for="mfaToken" class="sr-only">MFA Token</label>
								<input
									id="mfaToken"
									name="mfaToken"
									type="text"
									bind:value={loginForm.mfaToken}
									class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
									placeholder="MFA Token (6 digits)"
								/>
							</div>
						{/if}
					</div>

					{#if loginError}
						<div class="text-red-600 text-sm text-center">{loginError}</div>
					{/if}

					<div>
						<button
							type="submit"
							disabled={loginLoading}
							class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
						>
							{#if loginLoading}
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							{/if}
							Sign in
						</button>
					</div>
				</form>
			</div>
		</div>
	{:else}
		<!-- Admin Dashboard -->
		<div class="bg-white shadow">
			<div class="px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between items-center py-6">
					<div>
						<h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
						<p class="text-sm text-gray-500">
							Welcome back, {currentAdmin?.name} ({currentAdmin?.role})
						</p>
					</div>
					<button
						on:click={handleLogout}
						class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
					>
						Logout
					</button>
				</div>
			</div>
		</div>

		<div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
			{#if error}
				<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
					{error}
				</div>
			{/if}

			<!-- Statistics Cards -->
			{#if auditStats}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<div class="bg-white overflow-hidden shadow rounded-lg">
						<div class="p-5">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
										<span class="text-white text-sm font-medium">A</span>
									</div>
								</div>
								<div class="ml-5 w-0 flex-1">
									<dl>
										<dt class="text-sm font-medium text-gray-500 truncate">Total Actions</dt>
										<dd class="text-lg font-medium text-gray-900">{auditStats.totalActions}</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					<div class="bg-white overflow-hidden shadow rounded-lg">
						<div class="p-5">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
										<span class="text-white text-sm font-medium">C</span>
									</div>
								</div>
								<div class="ml-5 w-0 flex-1">
									<dl>
										<dt class="text-sm font-medium text-gray-500 truncate">Critical Actions</dt>
										<dd class="text-lg font-medium text-gray-900">
											{auditStats.criticalActionsCount}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					<div class="bg-white overflow-hidden shadow rounded-lg">
						<div class="p-5">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
										<span class="text-white text-sm font-medium">F</span>
									</div>
								</div>
								<div class="ml-5 w-0 flex-1">
									<dl>
										<dt class="text-sm font-medium text-gray-500 truncate">Failure Rate</dt>
										<dd class="text-lg font-medium text-gray-900">
											{auditStats.failureRate.toFixed(1)}%
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					<div class="bg-white overflow-hidden shadow rounded-lg">
						<div class="p-5">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
										<span class="text-white text-sm font-medium">U</span>
									</div>
								</div>
								<div class="ml-5 w-0 flex-1">
									<dl>
										<dt class="text-sm font-medium text-gray-500 truncate">Active Admins</dt>
										<dd class="text-lg font-medium text-gray-900">{auditStats.uniqueAdmins}</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<!-- Recent Critical Actions -->
				<div class="bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
							Recent Critical Actions
						</h3>
						<div class="space-y-3">
							{#each recentCriticalActions as action}
								<div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
									<div class="flex-shrink-0">
										<span
											class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getSeverityColor(
												action.severity
											)}"
										>
											{action.severity}
										</span>
									</div>
									<div class="flex-1 min-w-0">
										<p class="text-sm font-medium text-gray-900">{action.action}</p>
										<p class="text-sm text-gray-500">{action.resource}</p>
										<p class="text-xs text-gray-400">{formatTimestamp(action.timestamp)}</p>
									</div>
									<div class="flex-shrink-0">
										<span
											class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getCategoryColor(
												action.category
											)}"
										>
											{action.category}
										</span>
									</div>
								</div>
							{:else}
								<p class="text-sm text-gray-500">No critical actions in the last 24 hours</p>
							{/each}
						</div>
					</div>
				</div>

				<!-- Security Alerts -->
				<div class="bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Security Alerts</h3>
						<div class="space-y-3">
							{#each suspiciousActivities as alert}
								<div
									class="flex items-start space-x-3 p-3 bg-red-50 rounded-md border border-red-200"
								>
									<div class="flex-shrink-0">
										<span
											class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getSeverityColor(
												alert.severity
											)}"
										>
											{alert.severity}
										</span>
									</div>
									<div class="flex-1 min-w-0">
										<p class="text-sm font-medium text-gray-900">{alert.description}</p>
										<p class="text-sm text-gray-500">{alert.type}</p>
										<p class="text-xs text-gray-400">{formatTimestamp(alert.timestamp)}</p>
									</div>
									{#if !alert.acknowledged}
										<div class="flex-shrink-0">
											<button
												class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
											>
												Acknowledge
											</button>
										</div>
									{/if}
								</div>
							{:else}
								<p class="text-sm text-gray-500">No security alerts</p>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Actions by Category Chart -->
			{#if auditStats && Object.keys(auditStats.actionsByCategory).length > 0}
				<div class="mt-8 bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
							Actions by Category (Last 24 Hours)
						</h3>
						<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
							{#each Object.entries(auditStats.actionsByCategory) as [category, count]}
								<div class="text-center">
									<div class="text-2xl font-bold text-gray-900">{count}</div>
									<div class="text-sm text-gray-500 capitalize">{category.replace('_', ' ')}</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
