<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let youtubeUrl = '';
	let isProcessing = false;
	let message = '';
	let messageType: 'success' | 'error' | 'info' = 'info';

	/**
	 * Validate YouTube URL format
	 */
	function validateYouTubeUrl(url: string): boolean {
		// Valid formats:
		// https://youtu.be/[video_id]
		// https://www.youtube.com/watch?v=[video_id]
		const patterns = [
			/^https:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})$/,
			/^https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})$/
		];

		return patterns.some((pattern) => pattern.test(url));
	}

	/**
	 * Extract video ID from YouTube URL
	 */
	function extractVideoId(url: string): string {
		const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
		return match ? match[1] : '';
	}

	/**
	 * Check if URL is a playlist (reject these)
	 */
	function isPlaylist(url: string): boolean {
		return url.includes('playlist') || url.includes('list=');
	}

	/**
	 * Add YouTube URL for processing
	 */
	async function addYouTubeUrl() {
		if (!youtubeUrl.trim()) {
			showMessage('Please enter a YouTube URL', 'error');
			return;
		}

		// Check for playlist
		if (isPlaylist(youtubeUrl)) {
			showMessage('Playlists are not supported. Please use individual video URLs.', 'error');
			return;
		}

		// Validate URL format
		if (!validateYouTubeUrl(youtubeUrl)) {
			showMessage(
				'Invalid YouTube URL. Use: https://youtu.be/[video_id] or https://www.youtube.com/watch?v=[video_id]',
				'error'
			);
			return;
		}

		isProcessing = true;
		showMessage('Processing YouTube video...', 'info');

		try {
			const videoId = extractVideoId(youtubeUrl);

			// Convert to RSS knowledge format
			const result = await convertToRSSKnowledge(videoId, youtubeUrl);

			if (result.success) {
				showMessage(`Successfully processed: ${result.title}`, 'success');
				youtubeUrl = ''; // Clear input
				dispatch('urlAdded', { videoId, title: result.title, url: youtubeUrl });
			} else {
				showMessage(`Failed to process video: ${result.error}`, 'error');
			}
		} catch (error) {
			showMessage(`Error: ${error.message}`, 'error');
		} finally {
			isProcessing = false;
		}
	}

	/**
	 * Convert YouTube video to RSS knowledge format
	 */
	async function convertToRSSKnowledge(videoId: string, url: string) {
		// This would call your existing URL conversion system
		// For demo, simulating the process

		// Simulate API call delay
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Mock successful processing
		return {
			success: true,
			title: `Fitness Video ${videoId}`,
			knowledgeEntries: [
				{
					id: videoId,
					title: `Fitness Video ${videoId}`,
					content: `Exercise demonstration and tips from ${url}`,
					url: url,
					timestamp: Date.now()
				}
			]
		};

		// In real implementation:
		// return await fetch('/api/admin/process-youtube', {
		//   method: 'POST',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify({ videoId, url })
		// }).then(res => res.json());
	}

	/**
	 * Show message with auto-clear
	 */
	function showMessage(text: string, type: 'success' | 'error' | 'info') {
		message = text;
		messageType = type;

		// Auto-clear success messages after 3 seconds
		if (type === 'success') {
			setTimeout(() => {
				message = '';
			}, 3000);
		}
	}

	/**
	 * Handle Enter key in input
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !isProcessing) {
			addYouTubeUrl();
		}
	}
</script>

<div class="youtube-admin">
	<div class="admin-header">
		<h3>YouTube Video Integration</h3>
		<p>Add YouTube exercise videos to the knowledge base</p>
	</div>

	<div class="url-input-section">
		<div class="input-group">
			<label for="youtube-url">YouTube URL</label>
			<div class="input-wrapper">
				<input
					id="youtube-url"
					type="url"
					bind:value={youtubeUrl}
					on:keydown={handleKeydown}
					placeholder="https://youtu.be/[video_id] or https://www.youtube.com/watch?v=[video_id]"
					disabled={isProcessing}
					class="url-input"
				/>
				<button on:click={addYouTubeUrl} disabled={isProcessing} class="add-button">
					{#if isProcessing}
						<span class="spinner"></span>
						Processing...
					{:else}
						Add Video
					{/if}
				</button>
			</div>
		</div>

		{#if message}
			<div class="message {messageType}">
				{message}
			</div>
		{/if}
	</div>

	<div class="format-info">
		<h4>Supported Formats</h4>
		<ul>
			<li><code>https://youtu.be/[video_id]</code></li>
			<li><code>https://www.youtube.com/watch?v=[video_id]</code></li>
		</ul>
		<p class="note">⚠️ Playlists are not supported. Use individual video URLs only.</p>
	</div>
</div>

<style>
	.youtube-admin {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e5e5;
	}

	.admin-header {
		margin-bottom: 24px;
	}

	.admin-header h3 {
		margin: 0 0 8px 0;
		color: #1a1a1a;
		font-size: 20px;
		font-weight: 600;
	}

	.admin-header p {
		margin: 0;
		color: #666;
		font-size: 14px;
	}

	.url-input-section {
		margin-bottom: 24px;
	}

	.input-group label {
		display: block;
		margin-bottom: 8px;
		color: #333;
		font-weight: 500;
		font-size: 14px;
	}

	.input-wrapper {
		display: flex;
		gap: 12px;
		align-items: stretch;
	}

	.url-input {
		flex: 1;
		padding: 12px 16px;
		border: 2px solid #e5e5e5;
		border-radius: 8px;
		font-size: 14px;
		transition: border-color 0.2s ease;
	}

	.url-input:focus {
		outline: none;
		border-color: #007aff;
		box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
	}

	.url-input:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
	}

	.add-button {
		padding: 12px 24px;
		background: #007aff;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s ease;
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 120px;
		justify-content: center;
	}

	.add-button:hover:not(:disabled) {
		background: #0056cc;
	}

	.add-button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.spinner {
		width: 14px;
		height: 14px;
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

	.message {
		margin-top: 12px;
		padding: 12px 16px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
	}

	.message.success {
		background: #f0f9ff;
		color: #0369a1;
		border: 1px solid #7dd3fc;
	}

	.message.error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fca5a5;
	}

	.message.info {
		background: #f8fafc;
		color: #475569;
		border: 1px solid #cbd5e1;
	}

	.format-info {
		padding-top: 20px;
		border-top: 1px solid #e5e5e5;
	}

	.format-info h4 {
		margin: 0 0 12px 0;
		color: #333;
		font-size: 16px;
		font-weight: 600;
	}

	.format-info ul {
		margin: 0 0 16px 0;
		padding-left: 20px;
	}

	.format-info li {
		margin-bottom: 4px;
		font-size: 14px;
		color: #555;
	}

	.format-info code {
		background: #f1f5f9;
		padding: 2px 6px;
		border-radius: 4px;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
		font-size: 13px;
		color: #1e293b;
	}

	.note {
		margin: 0;
		font-size: 13px;
		color: #f59e0b;
		font-weight: 500;
	}
</style>
