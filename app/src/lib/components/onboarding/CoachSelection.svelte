<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Heart, Zap, User, CheckCircle } from 'lucide-svelte';

	export let selectedCoach: 'alice' | 'aiden' | null = null;

	const dispatch = createEventDispatcher();

	const coaches = {
		alice: {
			name: 'Alice',
			tagline: 'Your Encouraging Guide',
			description:
				'Alice brings warmth and motivation to every workout. She celebrates your progress, adapts to your energy levels, and helps you build confidence through consistent encouragement.',
			tones: ['Encouraging', 'Firmer'],
			avatar: '👩‍💼',
			color: 'from-pink-400 to-rose-500',
			highlights: [
				'Personalized motivation based on your progress',
				'Adapts encouragement to match your current energy',
				'Celebrates milestones and builds workout confidence',
				'Gentle guidance with room for your natural pace'
			]
		},
		aiden: {
			name: 'Aiden',
			tagline: 'Your Steady Coach',
			description:
				'Aiden provides structured, no-nonsense coaching with clear expectations. He focuses on consistency, technique fundamentals, and pushing you to reach your potential.',
			tones: ['Steady', 'Pushy'],
			avatar: '👨‍💼',
			color: 'from-blue-400 to-indigo-500',
			highlights: [
				'Structured approach with clear workout expectations',
				'Focus on consistency and fundamental techniques',
				'Direct feedback to help you reach your potential',
				'Accountability-driven coaching style'
			]
		}
	};

	function selectCoach(coach: 'alice' | 'aiden') {
		selectedCoach = coach;
		dispatch('select', { coach });
	}

	function confirmSelection() {
		if (selectedCoach) {
			dispatch('confirm', { coach: selectedCoach });
		}
	}
</script>

<div class="coach-selection">
	<div class="header">
		<h2 class="title">Choose Your AI Coach</h2>
		<p class="subtitle">
			Select the coach whose style resonates with you. You can change this later in settings.
		</p>
	</div>

	<div class="coaches-grid">
		{#each Object.entries(coaches) as [key, coach]}
			<div
				class="coach-card"
				class:selected={selectedCoach === key}
				class:bg-gradient-to-br={true}
				class:from-pink-400={key === 'alice'}
				class:to-rose-500={key === 'alice'}
				class:from-blue-400={key === 'aiden'}
				class:to-indigo-500={key === 'aiden'}
				on:click={() => selectCoach(key)}
				role="button"
				tabindex="0"
				on:keydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						selectCoach(key);
					}
				}}
			>
				<div class="coach-header">
					<div class="avatar">
						{coach.avatar}
					</div>
					<div class="coach-info">
						<h3 class="coach-name">{coach.name}</h3>
						<p class="coach-tagline">{coach.tagline}</p>
					</div>
					{#if selectedCoach === key}
						<div class="selected-indicator">
							<CheckCircle size={24} />
						</div>
					{/if}
				</div>

				<div class="coach-description">
					<p>{coach.description}</p>
				</div>

				<div class="coach-tones">
					<h4>Available Tones:</h4>
					<div class="tones-list">
						{#each coach.tones as tone}
							<span class="tone-badge">{tone}</span>
						{/each}
					</div>
				</div>

				<div class="coach-highlights">
					<h4>What to expect:</h4>
					<ul>
						{#each coach.highlights as highlight}
							<li>{highlight}</li>
						{/each}
					</ul>
				</div>
			</div>
		{/each}
	</div>

	{#if selectedCoach}
		<div class="confirmation-section">
			<div class="selected-summary">
				<h3>You've selected {coaches[selectedCoach].name}</h3>
				<p>Ready to begin your personalized coaching journey?</p>
			</div>
			<button class="confirm-button" on:click={confirmSelection}>
				Start with {coaches[selectedCoach].name}
			</button>
		</div>
	{/if}
</div>

<style>
	.coach-selection {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.subtitle {
		font-size: 1.1rem;
		color: #6b7280;
		max-width: 600px;
		margin: 0 auto;
		line-height: 1.6;
	}

	.coaches-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.coach-card {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.coach-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.coach-card:hover {
		transform: translateY(-4px);
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.coach-card:hover::before {
		opacity: 1;
	}

	.coach-card.selected {
		border-color: currentColor;
		box-shadow:
			0 0 0 3px rgba(59, 130, 246, 0.1),
			0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.coach-card.selected::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, #3b82f6, #8b5cf6);
	}

	.coach-header {
		display: flex;
		align-items: center;
		margin-bottom: 1.5rem;
		position: relative;
	}

	.avatar {
		font-size: 3rem;
		margin-right: 1rem;
		flex-shrink: 0;
	}

	.coach-info {
		flex: 1;
	}

	.coach-name {
		font-size: 1.5rem;
		font-weight: 700;
		color: white;
		margin: 0;
		margin-bottom: 0.25rem;
	}

	.coach-tagline {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.9);
		margin: 0;
		font-weight: 500;
	}

	.selected-indicator {
		color: #10b981;
		flex-shrink: 0;
	}

	.coach-description {
		margin-bottom: 1.5rem;
	}

	.coach-description p {
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.6;
		margin: 0;
		font-size: 0.95rem;
	}

	.coach-tones {
		margin-bottom: 1.5rem;
	}

	.coach-tones h4 {
		color: white;
		font-size: 0.9rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.tones-list {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.tone-badge {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 500;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.coach-highlights {
		margin-top: auto;
	}

	.coach-highlights h4 {
		color: white;
		font-size: 0.9rem;
		font-weight: 600;
		margin: 0 0 0.75rem 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.coach-highlights ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.coach-highlights li {
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
		line-height: 1.5;
		margin-bottom: 0.5rem;
		padding-left: 1.25rem;
		position: relative;
	}

	.coach-highlights li::before {
		content: '✓';
		position: absolute;
		left: 0;
		color: rgba(255, 255, 255, 0.7);
		font-weight: bold;
	}

	.confirmation-section {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.selected-summary {
		margin-bottom: 2rem;
	}

	.selected-summary h3 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.selected-summary p {
		color: #6b7280;
		margin: 0;
		font-size: 1rem;
	}

	.confirm-button {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: 8px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.3);
	}

	.confirm-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 12px -1px rgba(102, 126, 234, 0.4);
	}

	.confirm-button:active {
		transform: translateY(0);
	}

	/* Focus states for accessibility */
	.coach-card:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	.confirm-button:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.coach-selection {
			padding: 1rem;
		}

		.title {
			font-size: 2rem;
		}

		.coaches-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.coach-card {
			padding: 1.5rem;
		}

		.confirmation-section {
			padding: 1.5rem;
		}
	}
</style>
