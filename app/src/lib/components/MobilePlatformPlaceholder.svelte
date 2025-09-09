<script lang="ts">
	import { Smartphone, Download, ExternalLink } from 'lucide-svelte';

	export let platform: 'apple_watch' | 'samsung_health' | 'google_fit';
	export let title: string;
	export let description: string;
	export let requirements: string[];
	export let comingSoon = false;

	const platformInfo = {
		apple_watch: {
			color: '#000000',
			bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			icon: '🍎',
			downloadLinks: {
				ios: 'https://apps.apple.com/app/health/id1242545199'
			}
		},
		samsung_health: {
			color: '#1428a0',
			bgGradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
			icon: '📱',
			downloadLinks: {
				android: 'https://play.google.com/store/apps/details?id=com.sec.android.app.shealth'
			}
		},
		google_fit: {
			color: '#4285f4',
			bgGradient: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
			icon: '🎯',
			downloadLinks: {
				android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.fitness',
				ios: 'https://apps.apple.com/app/google-fit/id1433864494'
			}
		}
	};

	const info = platformInfo[platform];
</script>

<div class="mobile-placeholder" style="background: {info.bgGradient}">
	<div class="content">
		<div class="platform-header">
			<div class="platform-icon">
				<span class="icon-emoji">{info.icon}</span>
				<Smartphone class="device-icon" />
			</div>
			<h3>{title}</h3>
			<p class="description">{description}</p>
		</div>

		{#if comingSoon}
			<div class="coming-soon-badge">
				<span>🚀 Coming Soon</span>
			</div>
		{/if}

		<div class="requirements-section">
			<h4>Requirements:</h4>
			<ul class="requirements-list">
				{#each requirements as requirement}
					<li>{requirement}</li>
				{/each}
			</ul>
		</div>

		{#if !comingSoon}
			<div class="integration-note">
				<div class="note-icon">ℹ️</div>
				<div class="note-content">
					<strong>Mobile App Required</strong>
					<p>
						This platform requires a companion mobile app for data access. Web-only integration is
						not currently available.
					</p>
				</div>
			</div>
		{/if}

		<div class="action-section">
			{#if comingSoon}
				<div class="roadmap-info">
					<p>
						We're working on bringing this integration to Technically Fit. Stay tuned for updates!
					</p>
				</div>
			{:else}
				<div class="app-links">
					<h5>Download the app:</h5>
					<div class="download-buttons">
						{#each Object.entries(info.downloadLinks) as [store, url]}
							<a
								href={url}
								target="_blank"
								rel="noopener noreferrer"
								class="download-button {store}"
							>
								<Download class="download-icon" />
								{store === 'ios' ? 'App Store' : 'Google Play'}
								<ExternalLink class="external-icon" />
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.mobile-placeholder {
		border-radius: 12px;
		padding: 24px;
		color: white;
		position: relative;
		overflow: hidden;
	}

	.mobile-placeholder::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
		pointer-events: none;
	}

	.content {
		position: relative;
		z-index: 1;
	}

	.platform-header {
		text-align: center;
		margin-bottom: 24px;
	}

	.platform-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-bottom: 16px;
	}

	.icon-emoji {
		font-size: 32px;
	}

	.device-icon {
		width: 28px;
		height: 28px;
	}

	.platform-header h3 {
		margin: 0 0 8px 0;
		font-size: 24px;
		font-weight: 700;
	}

	.description {
		margin: 0;
		opacity: 0.9;
		line-height: 1.5;
		font-size: 14px;
	}

	.coming-soon-badge {
		background: rgba(34, 197, 94, 0.2);
		border: 1px solid rgba(34, 197, 94, 0.3);
		border-radius: 20px;
		padding: 8px 16px;
		text-align: center;
		margin-bottom: 20px;
		font-weight: 600;
		font-size: 14px;
	}

	.requirements-section {
		margin-bottom: 20px;
	}

	.requirements-section h4 {
		margin: 0 0 12px 0;
		font-size: 16px;
		font-weight: 600;
	}

	.requirements-list {
		margin: 0;
		padding-left: 20px;
		font-size: 14px;
		opacity: 0.9;
	}

	.requirements-list li {
		margin-bottom: 6px;
		line-height: 1.4;
	}

	.integration-note {
		display: flex;
		gap: 12px;
		background: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 20px;
	}

	.note-icon {
		font-size: 20px;
		flex-shrink: 0;
	}

	.note-content {
		flex: 1;
	}

	.note-content strong {
		display: block;
		margin-bottom: 4px;
		font-size: 14px;
		font-weight: 600;
	}

	.note-content p {
		margin: 0;
		font-size: 12px;
		opacity: 0.9;
		line-height: 1.4;
	}

	.action-section {
		text-align: center;
	}

	.roadmap-info p {
		margin: 0;
		font-size: 14px;
		opacity: 0.9;
		font-style: italic;
	}

	.app-links h5 {
		margin: 0 0 12px 0;
		font-size: 14px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.download-buttons {
		display: flex;
		gap: 12px;
		justify-content: center;
		flex-wrap: wrap;
	}

	.download-button {
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		text-decoration: none;
		padding: 10px 16px;
		border-radius: 8px;
		font-size: 12px;
		font-weight: 500;
		transition: all 0.2s;
	}

	.download-button:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
	}

	.download-icon,
	.external-icon {
		width: 14px;
		height: 14px;
	}

	.download-button.ios {
		background: rgba(0, 0, 0, 0.2);
	}

	.download-button.android {
		background: rgba(34, 197, 94, 0.2);
	}
</style>
