<script>
	import { onMount } from 'svelte';
	import { animate as animeAnimate } from 'animejs';

	// Props for customizable Alice avatar
	export let bodyColor = '#8b5cf6';
	export let glowColor = '#8b5cf6aa';
	export let eyeColor = '#ffffff';
	export let size = 200;
	export let enableAnimations = true;

	// Internal state
	let floatingOffset = 0;
	let swayOffset = 0;

	function startFloating() {
		if (!enableAnimations) return;

		function animate() {
			const time = Date.now() * 0.001;
			floatingOffset = Math.sin(time * 0.5) * 8;
			swayOffset = Math.sin(time * 0.3) * 3;
			requestAnimationFrame(animate);
		}
		animate();
	}

	onMount(() => {
		startFloating();
	});
</script>

<div
	class="avatar-container"
	style="
		--body-color: {bodyColor};
		--glow-color: {glowColor};
		--eye-color: {eyeColor};
		--avatar-size: {size}px;
		--floating-offset: {floatingOffset}px;
		--sway-offset: {swayOffset}px;
	"
>
	<div class="avatar-body">
		<div class="avatar-head">
			<div class="avatar-eye left"></div>
			<div class="avatar-eye right"></div>
		</div>
		<div class="avatar-limb arm-left"></div>
		<div class="avatar-limb arm-right"></div>
		<div class="avatar-limb leg-left"></div>
		<div class="avatar-limb leg-right"></div>
	</div>
</div>

<style>
	.avatar-container {
		width: var(--avatar-size);
		height: calc(var(--avatar-size) * 1.4);
		display: flex;
		align-items: center;
		justify-content: center;
		transform: translateY(var(--floating-offset)) translateX(var(--sway-offset));
		transition: transform 0.1s ease-out;
		position: relative;
	}

	.avatar-body {
		width: calc(var(--avatar-size) * 0.6);
		height: calc(var(--avatar-size) * 0.8);
		background: radial-gradient(circle, var(--body-color) 60%, #4a4a8b);
		border-radius: 50%;
		box-shadow: 0 0 20px var(--glow-color);
		position: relative;
	}

	.avatar-head {
		position: absolute;
		top: calc(var(--avatar-size) * -0.15);
		left: 50%;
		transform: translateX(-50%);
		width: calc(var(--avatar-size) * 0.35);
		height: calc(var(--avatar-size) * 0.35);
		background: radial-gradient(circle, var(--body-color) 60%, #4a4a8b);
		border-radius: 50%;
		box-shadow: 0 0 15px var(--glow-color);
	}

	.avatar-eye {
		position: absolute;
		top: 35%;
		width: calc(var(--avatar-size) * 0.05);
		height: calc(var(--avatar-size) * 0.05);
		background: radial-gradient(circle, var(--eye-color) 60%, #ffffff);
		border-radius: 50%;
		box-shadow: 0 0 10px var(--eye-color);
	}

	.avatar-eye.left {
		left: 25%;
	}

	.avatar-eye.right {
		right: 25%;
	}

	.avatar-limb {
		position: absolute;
		background: radial-gradient(circle, var(--body-color) 60%, #4a4a8b);
		border-radius: calc(var(--avatar-size) * 0.15);
	}

	.arm-left,
	.arm-right {
		width: calc(var(--avatar-size) * 0.15);
		height: calc(var(--avatar-size) * 0.35);
		top: calc(var(--avatar-size) * 0.15);
	}

	.arm-left {
		left: calc(var(--avatar-size) * -0.1);
	}

	.arm-right {
		right: calc(var(--avatar-size) * -0.1);
	}

	.leg-left,
	.leg-right {
		width: calc(var(--avatar-size) * 0.18);
		height: calc(var(--avatar-size) * 0.35);
		bottom: calc(var(--avatar-size) * -0.15);
	}

	.leg-left {
		left: calc(var(--avatar-size) * 0.1);
	}

	.leg-right {
		right: calc(var(--avatar-size) * 0.1);
	}
</style>
