<!--
  OfflineSync Component
  
  Purpose: Offline data synchronization management for workout data
  Features:
  - Offline queue management for workout data
  - Background sync with retry logic
  - Conflict resolution for data synchronization
  - Storage usage monitoring and cleanup
  - Network status detection and handling
-->

<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';

	// Props
	export let autoSync: boolean = true;
	export let syncInterval: number = 30000; // 30 seconds
	export let maxRetries: number = 5;
	export let maxQueueSize: number = 1000;
	export let compressionEnabled: boolean = true;
	export let showDetailedStatus: boolean = false;
	export let disabled: boolean = false;

	// Component state
	let isOnline: boolean = true;
	let isSyncing: boolean = false;
	let syncQueue: SyncItem[] = [];
	let syncStats: SyncStats = {
		totalItems: 0,
		pendingItems: 0,
		failedItems: 0,
		lastSyncTime: null,
		lastSyncDuration: 0,
		storageUsed: 0,
		storageLimit: 0
	};
	let networkStatus: 'online' | 'offline' | 'limited' = 'online';
	let syncProgress: number = 0;
	let currentSyncItem: SyncItem | null = null;
	let retryTimeout: number;
	let syncIntervalId: number;
	let storageQuotaSupported: boolean = false;

	interface SyncItem {
		id: string;
		type: 'workout' | 'strain' | 'preferences' | 'orb-settings';
		data: any;
		timestamp: number;
		retryCount: number;
		priority: 'low' | 'medium' | 'high';
		operation: 'create' | 'update' | 'delete';
		size: number; // bytes
	}

	interface SyncStats {
		totalItems: number;
		pendingItems: number;
		failedItems: number;
		lastSyncTime: Date | null;
		lastSyncDuration: number;
		storageUsed: number;
		storageLimit: number;
	}

	const dispatch = createEventDispatcher<{
		syncStart: { itemCount: number };
		syncComplete: { synced: number; failed: number; duration: number };
		syncProgress: { completed: number; total: number; currentItem: SyncItem };
		itemSynced: { item: SyncItem };
		itemFailed: { item: SyncItem; error: string };
		networkChange: { status: typeof networkStatus };
		storageWarning: { used: number; limit: number; percentage: number };
		queueFull: { size: number; limit: number };
	}>();

	// Reactive computations
	$: syncStats.pendingItems = syncQueue.filter((item) => item.retryCount < maxRetries).length;
	$: syncStats.failedItems = syncQueue.filter((item) => item.retryCount >= maxRetries).length;
	$: syncStats.totalItems = syncQueue.length;
	$: queueByPriority = groupQueueByPriority(syncQueue);
	$: storagePercentage =
		syncStats.storageLimit > 0 ? (syncStats.storageUsed / syncStats.storageLimit) * 100 : 0;
	$: canSync = isOnline && !isSyncing && syncQueue.length > 0 && !disabled;

	/**
	 * Group sync queue by priority
	 */
	function groupQueueByPriority(queue: SyncItem[]) {
		return {
			high: queue.filter((item) => item.priority === 'high'),
			medium: queue.filter((item) => item.priority === 'medium'),
			low: queue.filter((item) => item.priority === 'low')
		};
	}

	/**
	 * Add item to sync queue
	 */
	export function addToQueue(
		item: Omit<SyncItem, 'id' | 'timestamp' | 'retryCount' | 'size'>
	): string {
		if (syncQueue.length >= maxQueueSize) {
			dispatch('queueFull', { size: syncQueue.length, limit: maxQueueSize });
			// Remove oldest low-priority items to make space
			const lowPriorityItems = syncQueue.filter((i) => i.priority === 'low');
			if (lowPriorityItems.length > 0) {
				const oldestIndex = syncQueue.indexOf(lowPriorityItems[0]);
				syncQueue.splice(oldestIndex, 1);
			}
		}

		const syncItem: SyncItem = {
			...item,
			id: generateId(),
			timestamp: Date.now(),
			retryCount: 0,
			size: estimateItemSize(item.data)
		};

		syncQueue.push(syncItem);
		saveQueueToStorage();

		if (autoSync && isOnline) {
			scheduleSync();
		}

		return syncItem.id;
	}

	/**
	 * Remove item from sync queue
	 */
	export function removeFromQueue(itemId: string): boolean {
		const index = syncQueue.findIndex((item) => item.id === itemId);
		if (index >= 0) {
			syncQueue.splice(index, 1);
			saveQueueToStorage();
			return true;
		}
		return false;
	}

	/**
	 * Clear all items from sync queue
	 */
	export function clearQueue(): void {
		syncQueue = [];
		saveQueueToStorage();
	}

	/**
	 * Force manual sync
	 */
	export async function forceSync(): Promise<void> {
		if (isSyncing || syncQueue.length === 0) return;
		await performSync();
	}

	/**
	 * Generate unique ID
	 */
	function generateId(): string {
		return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Estimate item size in bytes
	 */
	function estimateItemSize(data: any): number {
		try {
			const jsonString = JSON.stringify(data);
			return new Blob([jsonString]).size;
		} catch {
			return 0;
		}
	}

	/**
	 * Schedule sync with debouncing
	 */
	function scheduleSync() {
		if (retryTimeout) {
			clearTimeout(retryTimeout);
		}

		retryTimeout = setTimeout(() => {
			if (canSync) {
				performSync();
			}
		}, 1000); // 1 second debounce
	}

	/**
	 * Perform synchronization
	 */
	async function performSync(): Promise<void> {
		if (isSyncing || syncQueue.length === 0 || !isOnline) return;

		isSyncing = true;
		syncProgress = 0;
		const startTime = Date.now();
		const itemsToSync = [...syncQueue].sort(sortByPriority);
		let syncedCount = 0;
		let failedCount = 0;

		dispatch('syncStart', { itemCount: itemsToSync.length });

		try {
			for (let i = 0; i < itemsToSync.length; i++) {
				const item = itemsToSync[i];
				currentSyncItem = item;
				syncProgress = ((i + 1) / itemsToSync.length) * 100;

				dispatch('syncProgress', {
					completed: i + 1,
					total: itemsToSync.length,
					currentItem: item
				});

				try {
					await syncItem(item);
					removeFromQueue(item.id);
					syncedCount++;

					dispatch('itemSynced', { item });
				} catch (error) {
					console.error('Sync item failed:', error);
					item.retryCount++;

					if (item.retryCount >= maxRetries) {
						failedCount++;
					}

					dispatch('itemFailed', {
						item,
						error: error instanceof Error ? error.message : 'Unknown error'
					});
				}

				// Small delay to prevent overwhelming the server
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		} finally {
			const duration = Date.now() - startTime;
			syncStats.lastSyncTime = new Date();
			syncStats.lastSyncDuration = duration;

			isSyncing = false;
			currentSyncItem = null;
			syncProgress = 0;

			saveQueueToStorage();

			dispatch('syncComplete', {
				synced: syncedCount,
				failed: failedCount,
				duration
			});
		}
	}

	/**
	 * Sort items by priority and timestamp
	 */
	function sortByPriority(a: SyncItem, b: SyncItem): number {
		const priorityOrder = { high: 3, medium: 2, low: 1 };
		const aPriority = priorityOrder[a.priority];
		const bPriority = priorityOrder[b.priority];

		if (aPriority !== bPriority) {
			return bPriority - aPriority; // Higher priority first
		}

		return a.timestamp - b.timestamp; // Older items first within same priority
	}

	/**
	 * Sync individual item
	 */
	async function syncItem(item: SyncItem): Promise<void> {
		const endpoint = getEndpointForType(item.type);
		const method = getMethodForOperation(item.operation);

		const response = await fetch(endpoint, {
			method,
			headers: {
				'Content-Type': 'application/json'
			},
			body: item.operation !== 'delete' ? JSON.stringify(item.data) : undefined
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
	}

	/**
	 * Get API endpoint for data type
	 */
	function getEndpointForType(type: SyncItem['type']): string {
		const endpoints = {
			workout: '/api/workouts',
			strain: '/api/strain-data',
			preferences: '/api/user-preferences',
			'orb-settings': '/api/orb-settings'
		};

		return endpoints[type] || '/api/sync';
	}

	/**
	 * Get HTTP method for operation
	 */
	function getMethodForOperation(operation: SyncItem['operation']): string {
		const methods = {
			create: 'POST',
			update: 'PUT',
			delete: 'DELETE'
		};

		return methods[operation] || 'POST';
	}

	/**
	 * Handle network status change
	 */
	function handleNetworkChange() {
		const wasOnline = isOnline;
		isOnline = navigator.onLine;

		if (isOnline && !wasOnline && autoSync && syncQueue.length > 0) {
			// Came back online, schedule sync
			scheduleSync();
		}

		networkStatus = isOnline ? 'online' : 'offline';
		dispatch('networkChange', { status: networkStatus });
	}

	/**
	 * Save sync queue to local storage
	 */
	function saveQueueToStorage() {
		if (!browser || !localStorage) return;

		try {
			const compressed = compressionEnabled ? compressQueue(syncQueue) : syncQueue;
			localStorage.setItem('offline-sync-queue', JSON.stringify(compressed));
			updateStorageStats();
		} catch (error) {
			console.error('Failed to save sync queue:', error);
		}
	}

	/**
	 * Load sync queue from local storage
	 */
	function loadQueueFromStorage() {
		if (!browser || !localStorage) return;

		try {
			const saved = localStorage.getItem('offline-sync-queue');
			if (saved) {
				const parsed = JSON.parse(saved);
				syncQueue = compressionEnabled ? decompressQueue(parsed) : parsed;
			}
		} catch (error) {
			console.error('Failed to load sync queue:', error);
			syncQueue = [];
		}
	}

	/**
	 * Compress sync queue (simplified)
	 */
	function compressQueue(queue: SyncItem[]): any {
		// In a real implementation, you might use a compression library
		return queue.map((item) => ({
			...item,
			data: typeof item.data === 'object' ? JSON.stringify(item.data) : item.data
		}));
	}

	/**
	 * Decompress sync queue (simplified)
	 */
	function decompressQueue(compressed: any[]): SyncItem[] {
		return compressed.map((item) => ({
			...item,
			data: typeof item.data === 'string' ? JSON.parse(item.data) : item.data
		}));
	}

	/**
	 * Update storage statistics
	 */
	async function updateStorageStats() {
		if (!browser) return;

		try {
			if ('storage' in navigator && 'estimate' in navigator.storage) {
				const estimate = await navigator.storage.estimate();
				syncStats.storageUsed = estimate.usage || 0;
				syncStats.storageLimit = estimate.quota || 0;
				storageQuotaSupported = true;

				const percentage = (syncStats.storageUsed / syncStats.storageLimit) * 100;
				if (percentage > 85) {
					dispatch('storageWarning', {
						used: syncStats.storageUsed,
						limit: syncStats.storageLimit,
						percentage
					});
				}
			}
		} catch (error) {
			console.error('Failed to update storage stats:', error);
		}
	}

	/**
	 * Format file size
	 */
	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';

		const units = ['B', 'KB', 'MB', 'GB'];
		const k = 1024;
		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
	}

	/**
	 * Format duration
	 */
	function formatDuration(ms: number): string {
		if (ms < 1000) return `${ms}ms`;
		if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
		return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
	}

	/**
	 * Format relative time
	 */
	function formatRelativeTime(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;

		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;

		const diffDays = Math.floor(diffHours / 24);
		return `${diffDays}d ago`;
	}

	// Initialize on mount
	onMount(() => {
		if (browser) {
			// Load existing queue
			loadQueueFromStorage();

			// Set up network monitoring
			isOnline = navigator.onLine;
			window.addEventListener('online', handleNetworkChange);
			window.addEventListener('offline', handleNetworkChange);

			// Set up auto-sync interval
			if (autoSync) {
				syncIntervalId = setInterval(() => {
					if (canSync) {
						performSync();
					}
				}, syncInterval);
			}

			// Initial storage stats update
			updateStorageStats();
		}

		return () => {
			if (syncIntervalId) {
				clearInterval(syncIntervalId);
			}
			if (retryTimeout) {
				clearTimeout(retryTimeout);
			}
			if (browser) {
				window.removeEventListener('online', handleNetworkChange);
				window.removeEventListener('offline', handleNetworkChange);
			}
		};
	});

	onDestroy(() => {
		if (syncIntervalId) {
			clearInterval(syncIntervalId);
		}
		if (retryTimeout) {
			clearTimeout(retryTimeout);
		}
	});
</script>

<div class="offline-sync" class:disabled class:offline={!isOnline}>
	<!-- Header -->
	<div class="sync-header">
		<div class="header-info">
			<h3>Offline Sync</h3>
			<div class="network-status" class:online={isOnline} class:offline={!isOnline}>
				<div class="status-indicator"></div>
				<span class="status-text">
					{networkStatus === 'online' ? 'Online' : 'Offline'}
				</span>
			</div>
		</div>

		<div class="header-controls">
			<button
				class="sync-button"
				class:syncing={isSyncing}
				on:click={forceSync}
				disabled={disabled || !canSync}
				aria-label="Force manual synchronization"
			>
				{#if isSyncing}
					Syncing...
				{:else}
					Sync Now
				{/if}
			</button>
		</div>
	</div>

	<!-- Sync Progress -->
	{#if isSyncing}
		<div class="sync-progress">
			<div class="progress-header">
				<span class="progress-text">Syncing data...</span>
				<span class="progress-percentage">{Math.round(syncProgress)}%</span>
			</div>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {syncProgress}%"></div>
			</div>
			{#if currentSyncItem}
				<div class="current-item">
					Syncing: {currentSyncItem.type} ({formatFileSize(currentSyncItem.size)})
				</div>
			{/if}
		</div>
	{/if}

	<!-- Queue Summary -->
	<div class="queue-summary">
		<h4>Sync Queue</h4>

		<div class="summary-stats">
			<div class="stat-item">
				<span class="stat-label">Total Items</span>
				<span class="stat-value">{syncStats.totalItems}</span>
			</div>
			<div class="stat-item">
				<span class="stat-label">Pending</span>
				<span class="stat-value pending">{syncStats.pendingItems}</span>
			</div>
			<div class="stat-item">
				<span class="stat-label">Failed</span>
				<span class="stat-value failed">{syncStats.failedItems}</span>
			</div>
		</div>

		{#if syncStats.lastSyncTime}
			<div class="last-sync">
				Last sync: {formatRelativeTime(syncStats.lastSyncTime)}
				({formatDuration(syncStats.lastSyncDuration)})
			</div>
		{/if}
	</div>

	<!-- Queue Details -->
	{#if showDetailedStatus && syncQueue.length > 0}
		<div class="queue-details">
			<h4>Queue Details</h4>

			<!-- High Priority Items -->
			{#if queueByPriority.high.length > 0}
				<div class="priority-section">
					<h5 class="priority-header high">High Priority ({queueByPriority.high.length})</h5>
					<div class="queue-items">
						{#each queueByPriority.high.slice(0, 5) as item}
							<div class="queue-item high">
								<div class="item-info">
									<span class="item-type">{item.type}</span>
									<span class="item-operation">{item.operation}</span>
									{#if item.retryCount > 0}
										<span class="retry-count">Retry {item.retryCount}/{maxRetries}</span>
									{/if}
								</div>
								<div class="item-meta">
									<span class="item-size">{formatFileSize(item.size)}</span>
									<span class="item-time">{formatRelativeTime(new Date(item.timestamp))}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Medium Priority Items -->
			{#if queueByPriority.medium.length > 0}
				<div class="priority-section">
					<h5 class="priority-header medium">Medium Priority ({queueByPriority.medium.length})</h5>
					<div class="queue-items">
						{#each queueByPriority.medium.slice(0, 3) as item}
							<div class="queue-item medium">
								<div class="item-info">
									<span class="item-type">{item.type}</span>
									<span class="item-operation">{item.operation}</span>
									{#if item.retryCount > 0}
										<span class="retry-count">Retry {item.retryCount}/{maxRetries}</span>
									{/if}
								</div>
								<div class="item-meta">
									<span class="item-size">{formatFileSize(item.size)}</span>
									<span class="item-time">{formatRelativeTime(new Date(item.timestamp))}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Low Priority Items -->
			{#if queueByPriority.low.length > 0}
				<div class="priority-section">
					<h5 class="priority-header low">Low Priority ({queueByPriority.low.length})</h5>
					<div class="queue-items">
						{#each queueByPriority.low.slice(0, 2) as item}
							<div class="queue-item low">
								<div class="item-info">
									<span class="item-type">{item.type}</span>
									<span class="item-operation">{item.operation}</span>
									{#if item.retryCount > 0}
										<span class="retry-count">Retry {item.retryCount}/{maxRetries}</span>
									{/if}
								</div>
								<div class="item-meta">
									<span class="item-size">{formatFileSize(item.size)}</span>
									<span class="item-time">{formatRelativeTime(new Date(item.timestamp))}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Storage Status -->
	{#if storageQuotaSupported}
		<div class="storage-status">
			<h4>Storage Usage</h4>
			<div class="storage-info">
				<div class="storage-bar">
					<div class="storage-fill" style="width: {storagePercentage}%"></div>
				</div>
				<div class="storage-text">
					{formatFileSize(syncStats.storageUsed)} / {formatFileSize(syncStats.storageLimit)}
					({storagePercentage.toFixed(1)}%)
				</div>
			</div>

			{#if storagePercentage > 85}
				<div class="storage-warning">
					⚠️ Storage space is running low. Consider clearing old data.
				</div>
			{/if}
		</div>
	{/if}

	<!-- Controls -->
	<div class="sync-controls">
		<button
			class="control-button clear"
			on:click={clearQueue}
			disabled={disabled || syncQueue.length === 0}
			aria-label="Clear sync queue"
		>
			Clear Queue
		</button>

		<label class="auto-sync-toggle">
			<input type="checkbox" bind:checked={autoSync} {disabled} />
			<span class="toggle-slider"></span>
			<span class="toggle-label">Auto-Sync</span>
		</label>
	</div>

	<!-- Offline Notice -->
	{#if !isOnline}
		<div class="offline-notice">
			<span class="offline-icon">📱</span>
			<div class="offline-text">
				<strong>You're offline</strong>
				<p>Data will be synchronized automatically when connection is restored.</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.offline-sync {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 24px;
		max-width: 580px;
		margin: 0 auto;
	}

	.offline-sync.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.offline-sync.offline {
		border-color: rgba(255, 165, 0, 0.3);
	}

	/* Header */
	.sync-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.header-info h3 {
		margin: 0;
		color: rgba(255, 255, 255, 0.9);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.network-status {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
	}

	.status-indicator {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		transition: background-color 0.3s ease;
	}

	.network-status.online .status-indicator {
		background: #00ff00;
		box-shadow: 0 0 6px rgba(0, 255, 0, 0.4);
	}

	.network-status.offline .status-indicator {
		background: #ff4444;
	}

	.status-text {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.85rem;
	}

	.sync-button {
		padding: 8px 16px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.sync-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.5);
	}

	.sync-button.syncing {
		animation: pulse 1s ease-in-out infinite;
	}

	/* Sync Progress */
	.sync-progress {
		margin-bottom: 24px;
		padding: 16px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.progress-text {
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
	}

	.progress-percentage {
		color: rgba(255, 255, 255, 0.9);
		font-weight: 600;
	}

	.progress-bar {
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		overflow: hidden;
		margin-bottom: 8px;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(to right, #0066ff, #00ccff);
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.current-item {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.8rem;
		font-style: italic;
	}

	/* Queue Summary */
	.queue-summary {
		margin-bottom: 24px;
	}

	.queue-summary h4 {
		margin: 0 0 16px 0;
		color: rgba(255, 255, 255, 0.8);
		font-size: 1rem;
		font-weight: 500;
	}

	.summary-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		margin-bottom: 16px;
	}

	.stat-item {
		text-align: center;
		padding: 12px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 6px;
	}

	.stat-label {
		display: block;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.8rem;
		margin-bottom: 4px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-value {
		color: rgba(255, 255, 255, 0.9);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.stat-value.pending {
		color: #ffaa00;
	}

	.stat-value.failed {
		color: #ff4444;
	}

	.last-sync {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.85rem;
		text-align: center;
	}

	/* Queue Details */
	.queue-details {
		margin-bottom: 24px;
	}

	.queue-details h4 {
		margin: 0 0 16px 0;
		color: rgba(255, 255, 255, 0.8);
		font-size: 1rem;
		font-weight: 500;
	}

	.priority-section {
		margin-bottom: 20px;
	}

	.priority-header {
		margin: 0 0 8px 0;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.priority-header.high {
		color: #ff4444;
	}

	.priority-header.medium {
		color: #ffaa00;
	}

	.priority-header.low {
		color: rgba(255, 255, 255, 0.6);
	}

	.queue-items {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.queue-item {
		padding: 12px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 6px;
		border-left: 3px solid transparent;
	}

	.queue-item.high {
		border-left-color: #ff4444;
	}

	.queue-item.medium {
		border-left-color: #ffaa00;
	}

	.queue-item.low {
		border-left-color: rgba(255, 255, 255, 0.3);
	}

	.item-info {
		display: flex;
		gap: 12px;
		margin-bottom: 4px;
	}

	.item-type {
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
	}

	.item-operation {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.retry-count {
		color: #ffaa00;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.item-meta {
		display: flex;
		justify-content: space-between;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.8rem;
	}

	/* Storage Status */
	.storage-status {
		margin-bottom: 24px;
	}

	.storage-status h4 {
		margin: 0 0 12px 0;
		color: rgba(255, 255, 255, 0.8);
		font-size: 1rem;
		font-weight: 500;
	}

	.storage-bar {
		height: 8px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 8px;
	}

	.storage-fill {
		height: 100%;
		background: linear-gradient(to right, #00ff00, #ffaa00, #ff4444);
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.storage-text {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.85rem;
		text-align: center;
	}

	.storage-warning {
		margin-top: 12px;
		padding: 8px 12px;
		background: rgba(255, 165, 0, 0.1);
		border: 1px solid rgba(255, 165, 0, 0.3);
		border-radius: 6px;
		color: rgba(255, 165, 0, 0.9);
		font-size: 0.85rem;
	}

	/* Controls */
	.sync-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.control-button {
		padding: 8px 16px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		background: transparent;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.control-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.5);
	}

	.control-button.clear {
		border-color: rgba(255, 68, 68, 0.5);
		color: rgba(255, 68, 68, 0.9);
	}

	.control-button.clear:hover:not(:disabled) {
		background: rgba(255, 68, 68, 0.1);
	}

	.auto-sync-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		user-select: none;
	}

	.auto-sync-toggle input {
		display: none;
	}

	.toggle-slider {
		position: relative;
		width: 40px;
		height: 20px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 10px;
		transition: background-color 0.3s ease;
	}

	.toggle-slider::before {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		background: white;
		border-radius: 50%;
		transition: transform 0.3s ease;
	}

	.auto-sync-toggle input:checked + .toggle-slider {
		background: var(--primary-color, #0066ff);
	}

	.auto-sync-toggle input:checked + .toggle-slider::before {
		transform: translateX(20px);
	}

	.toggle-label {
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
	}

	/* Offline Notice */
	.offline-notice {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 16px;
		background: rgba(255, 165, 0, 0.1);
		border: 1px solid rgba(255, 165, 0, 0.3);
		border-radius: 8px;
		color: rgba(255, 165, 0, 0.9);
	}

	.offline-icon {
		font-size: 1.5rem;
	}

	.offline-text strong {
		display: block;
		margin-bottom: 4px;
	}

	.offline-text p {
		margin: 0;
		font-size: 0.9rem;
		color: rgba(255, 165, 0, 0.8);
	}

	/* Animations */
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	/* Responsive Design */
	@media (max-width: 580px) {
		.offline-sync {
			padding: 16px;
			margin: 0 8px;
		}

		.sync-header {
			flex-direction: column;
			gap: 16px;
			align-items: flex-start;
		}

		.summary-stats {
			grid-template-columns: 1fr;
			gap: 8px;
		}

		.sync-controls {
			flex-direction: column;
			gap: 16px;
			align-items: stretch;
		}

		.offline-notice {
			flex-direction: column;
			text-align: center;
		}
	}

	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		* {
			animation: none;
			transition: none;
		}
	}

	@media (prefers-contrast: high) {
		.offline-sync {
			border-color: currentColor;
		}
	}
</style>
