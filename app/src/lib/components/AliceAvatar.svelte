<script>
	import { onMount } from 'svelte';
	import { Capacitor } from '@capacitor/core';
	import { Haptics, ImpactStyle } from '@capacitor/haptics';
	import { animate as animeAnimate } from 'animejs';

	let canvas;
	let ctx;
	let animationFrame;
	let alice = {
		x: 0,
		y: 0,
		size: 100,
		color: '#4b0082',
		glowIntensity: 0.3,
		expression: 'calm',
		floatingOffset: 0
	};

	// AI expression logic using Llama 3.1
	async function getExpressionFromStrain(strainLevel) {
		// In production, this would query Llama 3.1 API
		// For demo, we'll use simple logic
		if (strainLevel > 8) return 'energetic';
		if (strainLevel > 5) return 'focused';
		return 'calm';
	}

	// Health data integration
	async function getHealthData() {
		if (!Capacitor.isNativePlatform()) {
			// Mock data for web demo
			return {
				heartRate: 75 + Math.random() * 20,
				activeMinutes: Math.floor(Math.random() * 60),
				caloriesBurned: Math.floor(Math.random() * 500)
			};
		}

		try {
			// Real HealthKit/Whoop integration would go here
			const healthData = await fetch('/api/health-data');
			return await healthData.json();
		} catch (error) {
			console.error('Health data fetch failed:', error);
			return null;
		}
	}

	function drawAlice() {
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2 + alice.floatingOffset;

		// Glow effect
		const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, alice.size * 1.5);
		gradient.addColorStop(0, alice.color + Math.floor(alice.glowIntensity * 255).toString(16).padStart(2, '0'));
		gradient.addColorStop(1, 'transparent');

		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(centerX, centerY, alice.size * 1.5, 0, Math.PI * 2);
		ctx.fill();

		// Main avatar circle
		ctx.fillStyle = alice.color;
		ctx.beginPath();
		ctx.arc(centerX, centerY, alice.size, 0, Math.PI * 2);
		ctx.fill();

		// Expression-based features
		ctx.fillStyle = 'white';
		ctx.font = `${alice.size * 0.4}px Arial`;
		ctx.textAlign = 'center';

		let emoji = '😌';
		if (alice.expression === 'focused') emoji = '🎯';
		if (alice.expression === 'energetic') emoji = '⚡';

		ctx.fillText(emoji, centerX, centerY + alice.size * 0.15);

		// Simple eyes
		ctx.fillStyle = 'black';
		const eyeSize = alice.size * 0.08;
		const eyeY = centerY - alice.size * 0.2;

		ctx.beginPath();
		ctx.arc(centerX - alice.size * 0.2, eyeY, eyeSize, 0, Math.PI * 2);
		ctx.fill();

		ctx.beginPath();
		ctx.arc(centerX + alice.size * 0.2, eyeY, eyeSize, 0, Math.PI * 2);
		ctx.fill();
	}

	function animate() {
		alice.floatingOffset = Math.sin(Date.now() * 0.002) * 10;
		drawAlice();
		animationFrame = requestAnimationFrame(animate);
	}

	function updateExpression(strainLevel) {
		getExpressionFromStrain(strainLevel).then(expression => {
			alice.expression = expression;

			// Update glow based on expression
			if (expression === 'energetic') alice.glowIntensity = 0.8;
			else if (expression === 'focused') alice.glowIntensity = 0.5;
			else alice.glowIntensity = 0.3;

			// Haptic feedback for expression changes
			if (Capacitor.isNativePlatform()) {
				Haptics.impact({ style: ImpactStyle.Light });
			}
		});
	}

	function updateColor(newColor) {
		alice.color = newColor;

		// Animate color transition
		animeAnimate(alice, {
			glowIntensity: [alice.glowIntensity, alice.glowIntensity + 0.2],
			duration: 500,
			easing: 'easeOutQuad',
			direction: 'alternate'
		});
	}

	onMount(async () => {
		// Initialize canvas
		ctx = canvas.getContext('2d');
		canvas.width = 300;
		canvas.height = 300;

		// Start animation
		animate();

		// Get initial health data and set expression
		const healthData = await getHealthData();
		if (healthData) {
			// Use active minutes as strain proxy
			const strainLevel = Math.min(10, healthData.activeMinutes / 10);
			updateExpression(strainLevel);
		}

		// Listen for strain updates from parent component
		// This would be implemented with Svelte stores in production
	});

	// Expose methods for parent component
	export { updateExpression, updateColor };
</script>

<canvas bind:this={canvas} class="alice-avatar"></canvas>

<style>
	.alice-avatar {
		width: 300px;
		height: 300px;
		border-radius: 50%;
		box-shadow: 0 0 30px rgba(75, 0, 130, 0.3);
		background: transparent;
		transition: box-shadow 0.5s ease;
	}

	.alice-avatar:hover {
		box-shadow: 0 0 50px rgba(75, 0, 130, 0.5);
	}
</style>