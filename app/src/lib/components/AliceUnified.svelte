<!--
  Alice Unified Component - Siri-inspired Layered Morphing Design
  Complete Build Adaptive Fit specification implementation with 3D effects
-->

<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { workoutActions, type AliceWorkoutData, type AliceWorkoutSet, type AliceExercise } from '$lib/stores/workoutStore';
	import type { MondayWorkoutData } from '$lib/stores/mondayWorkoutData';

	// Use consolidated types from workoutStore
	type WorkoutSet = AliceWorkoutSet;
	type Exercise = AliceExercise;
	type WorkoutData = AliceWorkoutData;

	// Props - only keep actually used exports following constitution
	export let subscriptionTier: 'free' | 'trial' | 'paid' | 'trainer' = 'free';
	export let customColor: string = '#1a1a2e';
	export let irisColor: string = '#00BFFF'; // Default bright blue iris
	export let irisPattern: string = 'solid'; // Pattern for the iris
	export let mode: 'idle' | 'workout' | 'nutrition' | 'analytics' | 'radio' = 'idle';
	export let heartRate: number = 75;
	export let intensity: number = 0;
	
	// Workout card props
	export let showWorkoutCard: boolean = false;
	export let workoutData: WorkoutData | null = null;
	
	// Interactive props
	export let size: number = 120;
	export let isInteractive: boolean = false;
	export let eyeState: 'normal' | 'wink' | 'droop' | 'excited' = 'normal';
	export let twoEyes = false;
	export let rogueEye = false; // New prop for rogue eye mode

	const dispatch = createEventDispatcher();

	// Animation state
	let time = 0;
	let animationFrame: number;
	let orbElement: SVGSVGElement;
	let eyeOpacity = 1;
	let eyeX = 0;
	let eyeY = 0;
	
	// Blinking state
	let nextBlinkTime = 0;
	let isBlinking = false;
	let blinkStartTime = 0;
	const BLINK_DURATION = 150; // Quick blink
	
	// Eye movement state
	let lastClickX = 0;
	let lastClickY = 0;
	let eyeMoveStartTime = 0;
	let eyeMoveTargetX = 0;
	let eyeMoveTargetY = 0;
	let eyeCurrentX = 0;
	let eyeCurrentY = 0;
	const EYE_MOVE_DURATION = 800; // Smooth eye movement duration
	const MAX_EYE_DISTANCE = 8; // Maximum eye movement from center
	
	// Winking state for two eyes mode
	let winkingEye: 'left' | 'right' = 'left'; // Which eye should wink
	
	// Rogue eye state - independent movement for one eye
	let rogueEyeX = 0;
	let rogueEyeY = 0;
	let rogueEyeMoveTime = 0;
	let rogueEyeTargetX = 0;
	let rogueEyeTargetY = 0;
	let nextRogueEyeMoveTime = 0;
	const ROGUE_EYE_MOVE_INTERVAL = 2000; // Move every 2 seconds
	const ROGUE_EYE_MOVE_DURATION = 1000; // Duration of rogue eye movement
	
	// Randomize winking eye when eyeState changes to wink
	$: if (eyeState === 'wink' && twoEyes) {
		winkingEye = Math.random() < 0.5 ? 'left' : 'right';
		console.log(`👁️ Alice winking with ${winkingEye} eye`);
	}
	
	// Bloom navigation state
	let isBloomOpen = false;
	let bloomStartTime = 0;
	const BLOOM_DURATION = 300; // Animation duration for bloom

	// Animation constants
	const BREATHE_CYCLE = 3000; // 3 seconds
	const BLINK_MIN = 3000; // Minimum time between blinks
	const BLINK_MAX = 10000; // Maximum time between blinks

	// Siri-like animations for main layer
	$: breatheScale = 0.98 + 0.04 * (Math.sin(time * Math.PI * 2 / BREATHE_CYCLE) * 0.5 + 0.5);
	$: floatY = Math.sin(time * 0.001) * 2 + Math.sin(time * 0.0017) * 1; // Subtle bob
	$: floatRotate = Math.sin(time * 0.0013) * 1 + Math.cos(time * 0.0021) * 0.5; // Gentle wobble
	
	// Natural breathing and floating animations only - no morphing
	// Eye parallax movement - follows mouse with gentle offset
	let mouseX = 0;
	let mouseY = 0;
	$: parallaxX = (mouseX - 60) * 0.1; // Subtle parallax effect
	$: parallaxY = (mouseY - 60) * 0.1;
	
	// Eye center with parallax
	$: eyeCenterX = 60 + parallaxX;
	$: eyeCenterY = 60 + parallaxY;
	
	// Workout card animation
	$: cardVisible = showWorkoutCard;
	$: cardSlideY = cardVisible ? 0 : -100; // Slides down from above
	$: aliceFlattening = cardVisible ? 0.85 : 1.0; // Flatten bottom when card shows
	
	// Secondary layer animations - very subtle differences for unified morphing effect
	$: breatheScale2 = 0.99 + 0.03 * (Math.sin(time * Math.PI * 2 / (BREATHE_CYCLE * 1.1)) * 0.5 + 0.5);
	$: floatY2 = Math.sin(time * 0.0009) * 1.5 + Math.cos(time * 0.0016) * 0.8; // Slightly different
	$: floatRotate2 = Math.cos(time * 0.0012) * 0.8 + Math.sin(time * 0.0019) * 0.4; // Subtle counter-rotation
	
	// Tertiary layer for subtle organic variation
	$: breatheScale3 = 1.0 + 0.02 * (Math.cos(time * Math.PI * 2 / (BREATHE_CYCLE * 0.9)) * 0.5 + 0.5);
	$: floatY3 = Math.cos(time * 0.0011) * 1 + Math.sin(time * 0.0014) * 0.6; // Minimal variation
	$: floatRotate3 = Math.sin(time * 0.0014) * 0.6 + Math.cos(time * 0.0017) * 0.3; // Very subtle wobble
	
	// Natural eye movement - subtle floating patterns when not tracking clicks
	$: naturalEyeX = Math.sin(time * 0.0008) * 3 + Math.cos(time * 0.0012) * 2; // Gentle horizontal drift
	$: naturalEyeY = Math.cos(time * 0.0006) * 2 + Math.sin(time * 0.0009) * 1.5; // Subtle vertical float

	// Brightness adjustment function for aggressive 3D effects
	function adjustBrightness(hex: string, percent: number): string {
		const color = hex.replace('#', '');
		const r = parseInt(color.substring(0, 2), 16);
		const g = parseInt(color.substring(2, 4), 16);
		const b = parseInt(color.substring(4, 6), 16);

		const newR = Math.max(0, Math.min(255, r + (r * percent) / 100));
		const newG = Math.max(0, Math.min(255, g + (g * percent) / 100));
		const newB = Math.max(0, Math.min(255, b + (b * percent) / 100));

		const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
		return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
	}

	// Calculate contrasting pupil color based on iris brightness
	function getContrastingPupilColor(irisColor: string): string {
		const color = irisColor.replace('#', '');
		const r = parseInt(color.substring(0, 2), 16);
		const g = parseInt(color.substring(2, 4), 16);
		const b = parseInt(color.substring(4, 6), 16);
		
		// Calculate luminance using standard formula
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		
		// Return dark pupil for bright iris, bright pupil for dark iris
		if (luminance > 0.5) {
			return '#000000'; // Black pupil for bright iris
		} else {
			return '#FFFFFF'; // White pupil for dark iris
		}
	}

	// Pre-calculate pattern colors for aggressive 3D effect (body)
	$: patternColors = (() => {
		const baseColor = customColor || '#1a1a2e';
		return {
			base: baseColor,
			dark1: adjustBrightness(baseColor, -45),
			dark2: adjustBrightness(baseColor, -60),
			dark3: adjustBrightness(baseColor, -75),
			dark4: adjustBrightness(baseColor, -85),
			light1: adjustBrightness(baseColor, 50),
			light2: adjustBrightness(baseColor, -15)
		};
	})();

	// Iris pattern colors - separate from body patterns, reactive to irisColor
	$: irisPatternColors = (() => {
		const baseIrisColor = irisColor || '#00BFFF';
		console.log('Calculating iris pattern colors for:', baseIrisColor);
		return {
			base: baseIrisColor,
			dark1: adjustBrightness(baseIrisColor, -30),
			dark2: adjustBrightness(baseIrisColor, -45),
			dark3: adjustBrightness(baseIrisColor, -60),
			dark4: adjustBrightness(baseIrisColor, -75),
			light1: adjustBrightness(baseIrisColor, 40),
			light2: adjustBrightness(baseIrisColor, 20)
		};
	})();

	// Automatic contrasting pupil color
	$: contrastingPupilColor = getContrastingPupilColor(irisColor);

	// Intensity-based glow
	$: glowIntensity = intensity / 100;
	$: glowSize = 2 + glowIntensity * 4;
	$: glowHue = 200 + intensity * 0.5; // Blue to cyan

	// Iris fill calculation with patterns - reactive to both color and pattern
	$: irisFill = (() => {
		console.log('Iris fill calculation - Pattern:', irisPattern, 'Color:', irisColor);
		
		// Force recalculation when irisColor or irisPattern changes
		const currentColor = irisColor;
		const currentPattern = irisPattern;
		
		if (currentPattern === 'solid') {
			return 'url(#irisGradient)';
		}
		
		// Iris pattern fills
		const irisPatterns = {
			stripes: 'url(#irisStripesPattern)',
			spots: 'url(#irisSpotsPattern)',
			leopard: 'url(#irisLeopardPattern)',
			chrome: 'url(#irisChromeGradient)',
			glitch: 'url(#irisGlitchPattern)'
		};
		
		return irisPatterns[currentPattern as keyof typeof irisPatterns] || 'url(#irisGradient)';
	})();
	
	// Pupil intensity glow - electric blue gets brighter with intensity
	$: pupilGlow = {
		brightness: Math.max(0.5, glowIntensity), // Minimum 50% brightness
		glowSize: 2 + glowIntensity * 6, // Larger glow at higher intensity
		color: `hsl(${195 + intensity * 0.3}, 100%, ${50 + intensity * 0.5}%)` // Shifts from blue to cyan-white
	};
	
	// Eye scaling - simplified without intensity text requirements
	$: smartSizing = (() => {
		return {
			eyeRadius: 15, // Standard eye size
			bodyScale: 1,
			fontSize: 12
		};
	})();
	
	// Eye state animations - separate for left and right eyes in two eyes mode
	$: leftEyeAnimations = (() => {
		if (twoEyes && eyeState === 'wink' && winkingEye === 'left') {
			return {
				eyeScaleX: 1,
				eyeScaleY: 0.1, // Wink left eye only
				pupilOpacity: 0.3,
				eyeRotation: 0
			};
		}
		// For all other states (including wink on right eye), use default animations
		return getDefaultEyeAnimations();
	})();

	$: rightEyeAnimations = (() => {
		if (twoEyes && eyeState === 'wink' && winkingEye === 'right') {
			return {
				eyeScaleX: 1,
				eyeScaleY: 0.1, // Wink right eye only
				pupilOpacity: 0.3,
				eyeRotation: 0
			};
		}
		// For all other states (including wink on left eye), use default animations
		return getDefaultEyeAnimations();
	})();

	// Single eye animations (used when twoEyes is false)
	$: eyeStateAnimations = getDefaultEyeAnimations();

	function getDefaultEyeAnimations() {
		switch (eyeState) {
			case 'wink':
				return {
					eyeScaleX: 1,
					eyeScaleY: 0.1,
					pupilOpacity: 0.3,
					eyeRotation: 0
				};
			case 'droop':
				return {
					eyeScaleX: 1,
					eyeScaleY: 0.4, // Both eyes droopy
					pupilOpacity: 0.7,
					eyeRotation: -5
				};
			case 'excited':
				return {
					eyeScaleX: 1.2,
					eyeScaleY: 1.2, // Both eyes wide open
					pupilOpacity: 1,
					eyeRotation: 0
				};
			default: // normal
				return {
					eyeScaleX: 1,
					eyeScaleY: 1,
					pupilOpacity: 1,
					eyeRotation: 0
				};
		}
	}

	// Bloom animation progress
	$: bloomProgress = (() => {
		if (!isBloomOpen && bloomStartTime === 0) return 0;
		const elapsed = time - bloomStartTime;
		const progress = Math.min(1, elapsed / BLOOM_DURATION);
		return isBloomOpen ? progress : 1 - progress;
	})();
	
	// Navigation modes and their positions
	const navigationModes = [
		{ mode: 'workout', icon: '💪', label: 'Workouts', angle: -45 },
		{ mode: 'nutrition', icon: '🍎', label: 'Nutrition', angle: 45 },
		{ mode: 'analytics', icon: '📊', label: 'Analytics', angle: 135 },
		{ mode: 'radio', icon: '🎵', label: 'Radio', angle: 225 }
	];

	// Alice body fill - always solid gradient since patterns go to iris
	$: aliceFill = (() => {
		console.log('Body fill calculation - always solid gradient');
		
		if (subscriptionTier === 'free') {
			console.log('Using matte black gradient');
			return 'url(#matteBlackGradient)';
		}
		
		// Always use solid gradient for body
		return 'url(#dynamicSolidGradient)';
	})();

	// Event handlers
	function handleOrbClick(event: MouseEvent) {
		event.stopPropagation(); // Prevent global click handler
		console.log('Alice orb clicked');
		
		// Toggle bloom navigation
		isBloomOpen = !isBloomOpen;
		bloomStartTime = time;
		
		// Close bloom after 3 seconds if no selection
		if (isBloomOpen) {
			setTimeout(() => {
				if (isBloomOpen) {
					isBloomOpen = false;
					bloomStartTime = time;
				}
			}, 3000);
		}
		
		dispatch('alice-tapped', { mode, intensity, heartRate, bloomOpen: isBloomOpen });
	}
	
	// Handle mode selection from bloom navigation
	function handleModeSelect(selectedMode: string, event: MouseEvent | KeyboardEvent) {
		event.stopPropagation();
		console.log('🚀 Mode selected in Alice:', selectedMode);
		
		// Close bloom
		isBloomOpen = false;
		bloomStartTime = time;
		
		// Dispatch mode selection
		console.log('📡 Dispatching modeSelected event with mode:', selectedMode);
		dispatch('modeSelected', { mode: selectedMode });
		
		// Additional debugging
		console.log('✅ Event dispatched successfully');
	}
	
	// Blinking logic
	function scheduleNextBlink() {
		const delay = BLINK_MIN + Math.random() * (BLINK_MAX - BLINK_MIN);
		nextBlinkTime = time + delay;
	}
	
	// Global click tracking for eye movement
	function handleGlobalClick(event: MouseEvent) {
	// Get Alice's position (center of her SVG on the page)
	if (!orbElement) return;
	const rect = orbElement.getBoundingClientRect();
	const aliceX = rect.left + rect.width / 2;
	const aliceY = rect.top + rect.height / 2;

	// Calculate direction from Alice to click point
	const deltaX = event.clientX - aliceX;
	const deltaY = event.clientY - aliceY;

	// Normalize and limit eye movement
	const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
	const normalizedX = distance > 0 ? deltaX / distance : 0;
	const normalizedY = distance > 0 ? deltaY / distance : 0;

	// Set eye movement target (limited range)
	eyeMoveTargetX = normalizedX * Math.min(MAX_EYE_DISTANCE, distance * 0.02);
	eyeMoveTargetY = normalizedY * Math.min(MAX_EYE_DISTANCE, distance * 0.02);

	// Start eye movement animation
	eyeMoveStartTime = time;
	}
	
	function updateEyeMovement() {
		const timeSinceMove = time - eyeMoveStartTime;
		
		if (timeSinceMove < EYE_MOVE_DURATION) {
			// Smooth interpolation to click target
			const progress = Math.min(1, timeSinceMove / EYE_MOVE_DURATION);
			const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
			
			eyeCurrentX = eyeCurrentX + (eyeMoveTargetX - eyeCurrentX) * easeProgress * 0.1;
			eyeCurrentY = eyeCurrentY + (eyeMoveTargetY - eyeCurrentY) * easeProgress * 0.1;
			
			// Use click-based movement
			eyeX = eyeCurrentX;
			eyeY = eyeCurrentY;
		} else {
			// Gradually return to natural movement
			const returnProgress = Math.min(1, (timeSinceMove - EYE_MOVE_DURATION) / 1000);
			const naturalWeight = returnProgress;
			const targetWeight = 1 - returnProgress;
			
			eyeX = (eyeCurrentX * targetWeight) + (naturalEyeX * naturalWeight);
			eyeY = (eyeCurrentY * targetWeight) + (naturalEyeY * naturalWeight);
			
			// Update current position for smooth transition
			eyeCurrentX = eyeX;
			eyeCurrentY = eyeY;
		}
	}
	
	function updateBlinking() {
		if (!isBlinking && time >= nextBlinkTime) {
			// Start blink
			isBlinking = true;
			blinkStartTime = time;
			scheduleNextBlink();
		} else if (isBlinking && time >= blinkStartTime + BLINK_DURATION) {
			// End blink
			isBlinking = false;
		}
		
		// Update eye opacity based on blink state
		if (isBlinking) {
			const blinkProgress = (time - blinkStartTime) / BLINK_DURATION;
			if (blinkProgress < 0.5) {
				// Closing
				eyeOpacity = 1 - (blinkProgress * 2);
			} else {
				// Opening
				eyeOpacity = (blinkProgress - 0.5) * 2;
			}
		} else {
			eyeOpacity = 1;
		}
	}
	
	function updateRogueEye() {
		if (!rogueEye || !twoEyes) return;
		
		// Schedule next random movement
		if (time >= nextRogueEyeMoveTime) {
			rogueEyeTargetX = (Math.random() - 0.5) * MAX_EYE_DISTANCE * 2;
			rogueEyeTargetY = (Math.random() - 0.5) * MAX_EYE_DISTANCE * 2;
			rogueEyeMoveTime = time;
			nextRogueEyeMoveTime = time + ROGUE_EYE_MOVE_INTERVAL + (Math.random() * 1000); // Add some randomness
			console.log(`👁️‍🗨️ Rogue eye moving to (${rogueEyeTargetX.toFixed(1)}, ${rogueEyeTargetY.toFixed(1)})`);
		}
		
		// Animate rogue eye movement
		if (time <= rogueEyeMoveTime + ROGUE_EYE_MOVE_DURATION) {
			const progress = Math.min((time - rogueEyeMoveTime) / ROGUE_EYE_MOVE_DURATION, 1);
			const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
			
			rogueEyeX = rogueEyeX + (rogueEyeTargetX - rogueEyeX) * easeProgress;
			rogueEyeY = rogueEyeY + (rogueEyeTargetY - rogueEyeY) * easeProgress;
		}
	}

	// Legacy compatibility handlers
	function handleClick() {
		if (isInteractive) {
			dispatch('alice-tapped', { intensity, eyeState });
		}
	}

	// Workout card interactive functions
	function adjustReps(exerciseIndex: number, setIndex: number, delta: number) {
		if (workoutData && workoutData.exercises) {
			const currentReps = workoutData.exercises[exerciseIndex].sets[setIndex].reps;
			if (currentReps !== null) {
				workoutData.exercises[exerciseIndex].sets[setIndex].reps = Math.max(1, currentReps + delta);
				// Trigger reactivity
				workoutData = workoutData;
			}
		}
	}
	
	function adjustWeight(exerciseIndex: number, setIndex: number, delta: number) {
		if (workoutData && workoutData.exercises) {
			const set = workoutData.exercises[exerciseIndex].sets[setIndex];
			if (set.weightNum !== undefined) {
				set.weightNum = Math.max(0, set.weightNum + delta);
				set.weight = `${set.weightNum} lbs`;
				// Trigger reactivity
				workoutData = workoutData;
			}
		}
	}
	
	function skipSet(exerciseIndex: number, setIndex: number) {
		if (workoutData && workoutData.exercises) {
			workoutData.exercises[exerciseIndex].sets[setIndex].skipped = true;
			workoutData.exercises[exerciseIndex].sets[setIndex].completed = false;
			// Trigger reactivity
			workoutData = workoutData;
			console.log(`Skipped set ${setIndex + 1} of exercise ${exerciseIndex + 1}`);
		}
	}
	
	function completeSet(exerciseIndex: number, setIndex: number) {
		if (workoutData && workoutData.exercises) {
			const set = workoutData.exercises[exerciseIndex].sets[setIndex];
			set.completed = !set.completed;
			set.skipped = false;
			// Trigger reactivity
			workoutData = workoutData;
			console.log(`${set.completed ? 'Completed' : 'Uncompleted'} set ${setIndex + 1} of exercise ${exerciseIndex + 1}`);
		}
	}
	
	function addSet(exerciseIndex: number) {
		if (workoutData && workoutData.exercises) {
			const exercise = workoutData.exercises[exerciseIndex];
			const lastSet = exercise.sets[exercise.sets.length - 1];
			
			// Create new set based on the last set
			const newSet = {
				reps: lastSet.reps,
				weight: lastSet.weight,
				weightNum: lastSet.weightNum,
				duration: lastSet.duration,
				completed: false,
				skipped: false
			};
			
			exercise.sets.push(newSet);
			// Trigger reactivity
			workoutData = workoutData;
			console.log(`Added new set to exercise ${exerciseIndex + 1}`);
		}
	}

	// End workout function with user feedback
	function endWorkout(feedback: MondayWorkoutData['userFeedback'], message: string) {
		console.log(`🏁 Ending workout with feedback: ${feedback} - "${message}"`);
		
		// Update workout data with user feedback before ending
		if (workoutData) {
			workoutActions.updateWorkout({
				...workoutData,
				userFeedback: feedback,
				userFeedbackMessage: message,
				completedAt: new Date().toISOString()
			});
		}
		
		// End the workout after a brief delay to show feedback
		setTimeout(() => {
			workoutActions.endWorkout();
		}, 1000);
	}

	// Animation loop
	onMount(() => {
		// Schedule first blink
		scheduleNextBlink();
		
		// Add global click listener for eye tracking
		const handleClick = (event: MouseEvent) => {
			handleGlobalClick(event);
		};
		document.addEventListener('click', handleClick);
		
		function animate() {
			time += 16; // Roughly 60fps
			updateBlinking(); // Update blink animation
			updateEyeMovement(); // Update eye tracking
			updateRogueEye(); // Update rogue eye movement
			animationFrame = requestAnimationFrame(animate);
		}
		animate();

		return () => {
			if (animationFrame) cancelAnimationFrame(animationFrame);
			document.removeEventListener('click', handleClick);
		};
	});
</script>

<!-- Alice Orb Container -->
<div class="alice-orb-container">
	<!-- Main Alice Orb SVG -->
	<svg
		bind:this={orbElement}
		width={size}
		height={size}
		viewBox="0 0 120 120"
		class="alice-orb"
		style="transform: translateY({floatY}px) rotate({floatRotate}deg) scale({breatheScale * smartSizing.bodyScale});"
		onclick={handleOrbClick}
		onkeydown={(e) => e.key === 'Enter' && handleOrbClick(new MouseEvent('click'))}
		onmousemove={(e) => {
			const rect = e.currentTarget.getBoundingClientRect();
			mouseX = ((e.clientX - rect.left) / rect.width) * 120;
			mouseY = ((e.clientY - rect.top) / rect.height) * 120;
		}}
		onmouseleave={() => {
			mouseX = 60;
			mouseY = 60;
		}}
		role="button"
		tabindex="0"
		aria-label="Alice AI Orb - Intensity {intensity}%"
	>
		<defs>
			<!-- Enhanced matte black gradient with aggressive 3D effect -->
			<radialGradient id="matteBlackGradient" cx="0.25" cy="0.25">
				<stop offset="0%" stop-color="#666666" />
				<stop offset="40%" stop-color="#333333" />
				<stop offset="80%" stop-color="#1a1a1a" />
				<stop offset="100%" stop-color="#000000" />
			</radialGradient>

			<!-- Dynamic gradient with aggressive 3D effect -->
			<radialGradient id="dynamicSolidGradient" cx="0.25" cy="0.25">
				<stop offset="0%" stop-color={patternColors.light1} />
				<stop offset="25%" stop-color={patternColors.base} />
				<stop offset="70%" stop-color={patternColors.dark2} />
				<stop offset="100%" stop-color={patternColors.dark4} />
			</radialGradient>

			<!-- Enhanced aligned gradients for layered morphing effect -->
			<radialGradient id="layerGradient1" cx="0.25" cy="0.25">
				<stop offset="0%" stop-color={patternColors.light1} />
				<stop offset="25%" stop-color={patternColors.base} />
				<stop offset="70%" stop-color={patternColors.dark2} />
				<stop offset="100%" stop-color={patternColors.dark4} />
			</radialGradient>

			<radialGradient id="layerGradient2" cx="0.25" cy="0.25">
				<stop offset="0%" stop-color={patternColors.light1} />
				<stop offset="25%" stop-color={patternColors.base} />
				<stop offset="70%" stop-color={patternColors.dark2} />
				<stop offset="100%" stop-color={patternColors.dark4} />
			</radialGradient>

			<radialGradient id="layerGradient3" cx="0.25" cy="0.25">
				<stop offset="0%" stop-color={patternColors.light1} />
				<stop offset="25%" stop-color={patternColors.base} />
				<stop offset="70%" stop-color={patternColors.dark2} />
				<stop offset="100%" stop-color={patternColors.dark4} />
			</radialGradient>

			<!-- Iris gradient -->
			<radialGradient id="irisGradient" cx="0.3" cy="0.3">
				<stop offset="0%" stop-color={irisPatternColors.light1} />
				<stop offset="30%" stop-color={irisPatternColors.base} />
				<stop offset="80%" stop-color={irisPatternColors.dark2} />
				<stop offset="100%" stop-color={irisPatternColors.dark4} />
			</radialGradient>

			<!-- Drop shadow filter -->
			<filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
				<feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.4" />
			</filter>

			<!-- Inset shadow for eye -->
			<filter id="insetShadow" x="-50%" y="-50%" width="200%" height="200%">
				<feOffset dx="0" dy="1" />
				<feGaussianBlur stdDeviation="2" result="offset-blur" />
				<feFlood flood-color="#000000" flood-opacity="0.3" />
				<feComposite in2="offset-blur" operator="in" />
				<feComposite in2="SourceGraphic" operator="over" />
			</filter>

			<!-- Intensity glow -->
			<filter id="intensityGlow" x="-100%" y="-100%" width="300%" height="300%">
				<feGaussianBlur stdDeviation={glowSize} result="coloredBlur" />
				<feMerge>
					<feMergeNode in="coloredBlur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>

			<!-- Pupil glow filter for intensity-based electric blue effect -->
			<filter id="pupilGlow" x="-100%" y="-100%" width="300%" height="300%">
				<feGaussianBlur stdDeviation={pupilGlow.glowSize} result="pupilBlur" />
				<feFlood flood-color={pupilGlow.color} flood-opacity={pupilGlow.brightness * 0.8} />
				<feComposite in2="pupilBlur" operator="in" result="glowEffect" />
				<feMerge>
					<feMergeNode in="glowEffect" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>

			<!-- Iris glow filter - creates outer ring glow that matches iris color -->
			<filter id="irisGlow" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur stdDeviation="6" result="irisBlur" />
				<feFlood flood-color={irisColor} flood-opacity="0.8" />
				<feComposite in2="irisBlur" operator="in" result="irisGlowEffect" />
				<feMerge>
					<feMergeNode in="irisGlowEffect" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>

			<!-- Iris radial gradient for glow effect -->
			<radialGradient id="irisGlowGradient" cx="50%" cy="50%" r="50%">
				<stop offset="0%" style="stop-color:{irisColor};stop-opacity:0" />
				<stop offset="70%" style="stop-color:{irisColor};stop-opacity:0.3" />
				<stop offset="100%" style="stop-color:{irisColor};stop-opacity:0.8" />
			</radialGradient>

			<!-- Unified orb radial gradient for 3D depth effect -->
			<radialGradient id="unifiedOrbGradient" cx="0.3" cy="0.2" r="1.2">
				<stop offset="0%" stop-color="white" stop-opacity="0.4" />
				<stop offset="20%" stop-color={customColor} stop-opacity="1.0" />
				<stop offset="70%" stop-color={customColor} stop-opacity="0.9" />
				<stop offset="100%" stop-color={customColor} stop-opacity="0.6" />
			</radialGradient>
			
			<!-- Blur filter for soft glow effect -->
			<filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur stdDeviation="8" result="coloredBlur"/>
				<feMerge> 
					<feMergeNode in="coloredBlur"/>
					<feMergeNode in="SourceGraphic"/>
				</feMerge>
			</filter>
			<radialGradient id="orbShadowGradient" cx="0.7" cy="0.8" r="0.5">
				<stop offset="0%" stop-color="black" stop-opacity="0" />
				<stop offset="60%" stop-color="black" stop-opacity="0.1" />
				<stop offset="100%" stop-color="black" stop-opacity="0.3" />
			</radialGradient>
			<radialGradient id="underglowGradient" cx="50%" cy="50%" r="120%">
				<stop offset="0%" style="stop-color:{irisColor};stop-opacity:0" />
				<stop offset="35%" style="stop-color:{irisColor};stop-opacity:0" />
				<stop offset="50%" style="stop-color:{irisColor};stop-opacity:0.2" />
				<stop offset="70%" style="stop-color:{irisColor};stop-opacity:0.6" />
				<stop offset="90%" style="stop-color:{irisColor};stop-opacity:0.3" />
				<stop offset="100%" style="stop-color:{irisColor};stop-opacity:0" />
			</radialGradient>

			<!-- Iris pattern definitions (scaled for smaller iris area) -->
			<pattern id="irisStripesPattern" patternUnits="userSpaceOnUse" width="4" height="4">
				<rect width="4" height="4" fill={irisPatternColors.base} />
				<rect x="0" y="0" width="2" height="4" fill={irisPatternColors.dark2} />
			</pattern>

			<pattern id="irisSpotsPattern" patternUnits="userSpaceOnUse" width="8" height="8">
				<rect width="8" height="8" fill={irisPatternColors.base} />
				<circle cx="4" cy="4" r="1.5" fill={irisPatternColors.dark2} />
				<circle cx="2" cy="2" r="0.8" fill={irisPatternColors.dark1} />
				<circle cx="6" cy="6" r="1" fill={irisPatternColors.dark3} />
			</pattern>

			<pattern id="irisLeopardPattern" patternUnits="userSpaceOnUse" width="10" height="10">
				<rect width="10" height="10" fill={irisPatternColors.base} />
				<circle cx="3" cy="3" r="1.5" fill={irisPatternColors.dark2} />
				<circle cx="8" cy="2" r="1" fill={irisPatternColors.dark1} />
				<circle cx="6" cy="7" r="1.2" fill={irisPatternColors.dark3} />
				<circle cx="2" cy="8" r="0.8" fill={irisPatternColors.dark1} />
			</pattern>

			<radialGradient id="irisChromeGradient">
				<stop offset="0%" stop-color="#ffffff" />
				<stop offset="40%" stop-color={irisPatternColors.base} />
				<stop offset="100%" stop-color={irisPatternColors.dark4} />
			</radialGradient>

			<pattern id="irisGlitchPattern" patternUnits="userSpaceOnUse" width="6" height="6">
				<rect width="6" height="6" fill={irisPatternColors.base} />
				<rect x="1" y="0" width="1" height="6" fill={irisPatternColors.dark3} />
				<rect x="4" y="0" width="0.5" height="6" fill={irisPatternColors.light1} />
				<rect x="2.5" y="0" width="0.3" height="6" fill={irisPatternColors.light2} />
			</pattern>

		</defs>

		<!-- Underglow effect (intensity-based) - soft blur glow -->
		{#if intensity > 0}
			<!-- Simple colored circle with blur filter for soft glow -->
			<circle
				cx="60"
				cy="60"
				r="45"
				fill={irisColor}
				opacity={glowIntensity * 0.7}
				filter="url(#softGlow)"
			/>
		{/if}

		<!-- Single unified orb with 3D gradient and shadow -->
		<g>
			<!-- Main orb with 3D gradient -->
			<ellipse
				cx="60"
				cy="60"
				rx="45"
				ry={45 * aliceFlattening}
				stroke="none"
				fill="url(#unifiedOrbGradient)"
				filter="url(#dropShadow)"
			/>
			
			<!-- 3D shadow overlay for depth -->
			<ellipse
				cx="60"
				cy="60"
				rx="45"
				ry={45 * aliceFlattening}
				stroke="none"
				fill="url(#orbShadowGradient)"
			/>
		</g>

		<!-- Eye(s) rendering - conditional for one or two eyes -->
		{#if twoEyes}
			<!-- Left Eye -->
			<g transform="translate({eyeCenterX - 15 + eyeX}, {eyeCenterY + eyeY}) rotate({leftEyeAnimations.eyeRotation}) scale({leftEyeAnimations.eyeScaleX}, {leftEyeAnimations.eyeScaleY}) translate({-(eyeCenterX - 15 + eyeX)}, {-(eyeCenterY + eyeY)})">
				<!-- White sclera (left eye white) -->
				<circle
					cx={eyeCenterX - 15 + eyeX}
					cy={eyeCenterY + eyeY}
					r={smartSizing.eyeRadius * 0.8}
					fill="white"
					filter="url(#insetShadow)"
					class="alice-eye"
					opacity={eyeOpacity}
				/>
				
				<!-- Colored iris with patterns (left eye) -->
				<circle
					cx={eyeCenterX - 15 + eyeX}
					cy={eyeCenterY + eyeY}
					r={smartSizing.eyeRadius * 0.56}
					fill={irisFill}
					class="alice-iris"
					opacity={eyeOpacity}
				/>
			</g>

			<!-- Left eye pupil -->
			<circle
				cx={eyeCenterX - 15 + eyeX}
				cy={eyeCenterY + eyeY}
				r="4.8"
				fill={contrastingPupilColor}
				class="alice-pupil"
				opacity={eyeOpacity * leftEyeAnimations.pupilOpacity}
			/>

			<!-- Right Eye -->
			<g transform="translate({eyeCenterX + 15 + (rogueEye ? rogueEyeX : eyeX)}, {eyeCenterY + (rogueEye ? rogueEyeY : eyeY)}) rotate({rightEyeAnimations.eyeRotation}) scale({rightEyeAnimations.eyeScaleX}, {rightEyeAnimations.eyeScaleY}) translate({-(eyeCenterX + 15 + (rogueEye ? rogueEyeX : eyeX))}, {-(eyeCenterY + (rogueEye ? rogueEyeY : eyeY))})">
				<!-- White sclera (right eye white) -->
				<circle
					cx={eyeCenterX + 15 + (rogueEye ? rogueEyeX : eyeX)}
					cy={eyeCenterY + (rogueEye ? rogueEyeY : eyeY)}
					r={smartSizing.eyeRadius * 0.8}
					fill="white"
					filter="url(#insetShadow)"
					class="alice-eye"
					opacity={eyeOpacity}
				/>
				
				<!-- Colored iris with patterns (right eye) -->
				<circle
					cx={eyeCenterX + 15 + (rogueEye ? rogueEyeX : eyeX)}
					cy={eyeCenterY + (rogueEye ? rogueEyeY : eyeY)}
					r={smartSizing.eyeRadius * 0.56}
					fill={irisFill}
					class="alice-iris"
					opacity={eyeOpacity}
				/>
			</g>

			<!-- Right eye pupil -->
			<circle
				cx={eyeCenterX + 15 + (rogueEye ? rogueEyeX : eyeX)}
				cy={eyeCenterY + (rogueEye ? rogueEyeY : eyeY)}
				r="4.8"
				fill={contrastingPupilColor}
				class="alice-pupil"
				opacity={eyeOpacity * rightEyeAnimations.pupilOpacity}
			/>
		{:else}
			<!-- Single Eye (original) -->
			<g transform="translate({eyeCenterX + eyeX}, {eyeCenterY + eyeY}) rotate({eyeStateAnimations.eyeRotation}) scale({eyeStateAnimations.eyeScaleX}, {eyeStateAnimations.eyeScaleY}) translate({-(eyeCenterX + eyeX)}, {-(eyeCenterY + eyeY)})">
				<!-- White sclera (eye white) -->
				<circle
					cx={eyeCenterX + eyeX}
					cy={eyeCenterY + eyeY}
					r={smartSizing.eyeRadius}
					fill="white"
					filter="url(#insetShadow)"
					class="alice-eye"
					opacity={eyeOpacity}
				/>
				
				<!-- Colored iris with patterns -->
				<circle
					cx={eyeCenterX + eyeX}
					cy={eyeCenterY + eyeY}
					r={smartSizing.eyeRadius * 0.7}
					fill={irisFill}
					class="alice-iris"
					opacity={eyeOpacity}
				/>
			</g>

			<!-- Normal contrasting pupil (no intensity display) -->
			<circle
				cx={eyeCenterX + eyeX}
				cy={eyeCenterY + eyeY}
				r="6"
				fill={contrastingPupilColor}
				class="alice-pupil"
				opacity={eyeOpacity * eyeStateAnimations.pupilOpacity}
			/>
		{/if}
	</svg>
	
	<!-- Workout Card - slides down from Alice -->
	{#if showWorkoutCard && workoutData}
		<div 
			class="workout-card"
			style="
				transform: translateY({cardSlideY}px);
				background: linear-gradient(145deg, {customColor}ee, {customColor}cc);
				border-top: 3px solid {customColor};
			"
		>
			<div class="card-content">
				<h3>{workoutData.name}</h3>
				
				<!-- Workout Overview Stats -->
				<div class="workout-overview">
					<div class="overview-stats">
						<span>⏱️ {workoutData.duration}</span>
						<span>🔥 {workoutData.calories}</span>
					</div>
					<div class="score-display">
						<div class="score-item intensity">
							<span class="score-label">Intensity</span>
							<span class="score-value">{workoutData.intensityScore || 0}</span>
						</div>
						<div class="score-item stress">
							<span class="score-label">Stress</span>
							<span class="score-value">{workoutData.stressScore || 0}</span>
						</div>
					</div>
				</div>
				
				<!-- Exercises List -->
				{#if workoutData.exercises && workoutData.exercises.length > 0}
					<div class="exercises-container">
						{#each workoutData.exercises as exercise, exerciseIndex}
							<div class="exercise-block">
								<div class="exercise-header">
									<h4>{exercise.name}</h4>
									{#if exercise.notes}
										<p class="exercise-notes">{exercise.notes}</p>
									{/if}
								</div>
								
								<!-- Sets for this exercise -->
								<div class="sets-list">
									{#each exercise.sets as set, setIndex}
										<div class="set-row" class:completed={set.completed}>
											<div class="set-info">
												<span class="set-number">Set {setIndex + 1}</span>
											</div>
											
											<!-- Reps Control -->
											{#if set.reps !== null}
												<div class="control-group">
													<label for="reps-{exerciseIndex}-{setIndex}">Reps</label>
													<div class="number-control">
														<button class="control-btn minus" 
															onclick={() => adjustReps(exerciseIndex, setIndex, -1)}
															aria-label="Decrease reps">−</button>
														<input type="number" 
															id="reps-{exerciseIndex}-{setIndex}"
															bind:value={set.reps} 
															class="number-input" 
															aria-label="Number of reps" />
														<button class="control-btn plus" 
															onclick={() => adjustReps(exerciseIndex, setIndex, 1)}
															aria-label="Increase reps">+</button>
													</div>
												</div>
											{/if}
											
											<!-- Weight Control -->
											{#if set.weight !== null}
												<div class="control-group">
													<label for="weight-{exerciseIndex}-{setIndex}">Weight</label>
													<div class="number-control">
														<button class="control-btn minus" 
															onclick={() => adjustWeight(exerciseIndex, setIndex, -5)}
															aria-label="Decrease weight">−</button>
														<input type="number" 
															id="weight-{exerciseIndex}-{setIndex}"
															bind:value={set.weightNum} 
															class="number-input" 
															aria-label="Weight in pounds" />
														<button class="control-btn plus" 
															onclick={() => adjustWeight(exerciseIndex, setIndex, 5)}
															aria-label="Increase weight">+</button>
														<span class="weight-unit">lbs</span>
													</div>
												</div>
											{/if}
											
											<!-- Duration Display -->
											{#if set.duration}
												<div class="duration-display">
													<span>⏱️ {set.duration}</span>
												</div>
											{/if}
											
											<!-- Set Actions -->
											<div class="set-actions">
												<button class="action-btn skip" 
													onclick={() => skipSet(exerciseIndex, setIndex)}>Skip</button>
												<button class="action-btn complete" 
													onclick={() => completeSet(exerciseIndex, setIndex)}
													class:completed={set.completed}>
													{set.completed ? '✓' : 'Done'}
												</button>
											</div>
										</div>
									{/each}
									
									<!-- Add Set Button -->
									<button class="add-set-btn" 
										onclick={() => addSet(exerciseIndex)}>+ Add Set</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			
			<!-- Workout Completion Buttons with User Feedback -->
			<div class="workout-feedback-section">
				<h4 class="feedback-title">How was that workout?</h4>
				<div class="feedback-buttons">
					<button class="feedback-btn too-easy" 
						onclick={() => endWorkout('easy_killer', 'What was that!!')}>
						😴 What was that!!
						<span class="feedback-subtitle">Too Easy</span>
					</button>
					<button class="feedback-btn moderate" 
						onclick={() => endWorkout('neutral', 'Not bad')}>
						👍 Not bad
						<span class="feedback-subtitle">Moderate</span>
					</button>
					<button class="feedback-btn challenging" 
						onclick={() => endWorkout('finally_challenge', 'Now that\'s a challenge')}>
						💪 Now that's a challenge
						<span class="feedback-subtitle">Challenging</span>
					</button>
					<button class="feedback-btn too-hard" 
						onclick={() => endWorkout('flag_review', 'Easy Killa')}>
						🔥 Easy Killa
						<span class="feedback-subtitle">Too Hard</span>
					</button>
				</div>
				<button class="control-btn hide-card" 
					onclick={() => workoutActions.toggleCard()}>
					👁️ Hide Card
				</button>
			</div>
		</div>
	{/if}
	
	<!-- Bloom navigation icons -->
	{#if bloomProgress > 0}
		{#each navigationModes as navMode}
			{@const distance = 80 * bloomProgress}
			{@const angleRad = (navMode.angle * Math.PI) / 180}
			{@const x = Math.cos(angleRad) * distance}
			{@const y = Math.sin(angleRad) * distance}
			
			<div 
				class="bloom-icon"
				style="
					transform: translate({x}px, {y}px) scale({bloomProgress});
					opacity: {bloomProgress};
				"
				onclick={(e) => {
					console.log('🎯 Bloom icon clicked:', navMode.mode);
					handleModeSelect(navMode.mode, e);
				}}
				onkeydown={(e) => e.key === 'Enter' && handleModeSelect(navMode.mode, e)}
				role="button"
				tabindex="0"
				aria-label="Navigate to {navMode.label}"
			>
				<div class="bloom-icon-content">
					<span class="bloom-emoji">{navMode.icon}</span>
					<span class="bloom-label">{navMode.label}</span>
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.alice-orb-container {
		position: relative;
		z-index: 1;
		pointer-events: auto;
		will-change: transform;
	}

	.alice-orb {
		cursor: pointer;
		transition: all 0.3s ease;
		filter: drop-shadow(0 0 20px rgba(0, 191, 255, 0.3));
	}

	.alice-orb:hover {
		transform: scale(1.05);
	}

	.alice-eye {
		transition: all 0.3s ease;
	}

	.alice-iris {
		transition: all 0.3s ease;
		filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.3));
	}

	.alice-pupil {
		transition: all 0.3s ease;
		filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
	}
	
	.bloom-icon {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 60px;
		height: 60px;
		margin: -30px 0 0 -30px;
		cursor: pointer;
		pointer-events: auto;
		z-index: 10;
		transition: all 0.3s ease;
	}
	
	.bloom-icon:hover {
		transform-origin: center;
		filter: brightness(1.3) drop-shadow(0 0 15px rgba(0, 191, 255, 0.8)) scale(1.1);
	}
	
	.bloom-icon:active {
		transform: scale(0.95);
		filter: brightness(1.5) drop-shadow(0 0 20px rgba(0, 191, 255, 1));
	}
	
	.bloom-icon-content {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, rgba(0, 191, 255, 0.9), rgba(0, 150, 255, 0.9));
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(10px);
		border: 2px solid rgba(255, 255, 255, 0.3);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
	}
	
	.bloom-emoji {
		font-size: 20px;
		margin-bottom: 2px;
	}
	
	.bloom-label {
		font-size: 8px;
		font-weight: 600;
		color: white;
		text-align: center;
		line-height: 1;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}
	
	/* Workout Card Styles */
	.workout-card {
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		width: 400px;
		min-height: 300px;
		padding: 20px;
		border-radius: 16px 16px 24px 24px;
		backdrop-filter: blur(10px);
		box-shadow: 
			0 12px 35px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 10;
		max-height: 80vh;
		overflow-y: auto;
	}
	
	.card-content {
		text-align: left;
		color: white;
	}
	
	.card-content h3 {
		margin: 0 0 16px 0;
		font-size: 18px;
		font-weight: 700;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
		text-align: center;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		padding-bottom: 12px;
	}

	/* Workout Overview Stats */
	.workout-overview {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding: 12px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.overview-stats {
		display: flex;
		gap: 16px;
	}

	.overview-stats span {
		font-size: 14px;
		font-weight: 600;
		padding: 6px 12px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.score-display {
		display: flex;
		gap: 12px;
	}

	.score-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 8px 12px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.score-label {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 2px;
		opacity: 0.8;
	}

	.score-value {
		font-size: 18px;
		font-weight: 700;
	}

	.score-item.intensity .score-value {
		color: #ff6b6b;
	}

	.score-item.stress .score-value {
		color: #feca57;
	}

	/* Exercises Container */
	.exercises-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.exercise-block {
		padding: 16px;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.exercise-header h4 {
		margin: 0 0 8px 0;
		font-size: 18px;
		font-weight: 600;
		color: white;
	}

	.exercise-notes {
		margin: 0 0 12px 0;
		font-size: 14px;
		opacity: 0.8;
		font-style: italic;
	}

	/* Sets List */
	.sets-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.set-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;
		flex-wrap: wrap;
	}

	.set-row.completed {
		background: rgba(46, 213, 115, 0.2);
		border-color: rgba(46, 213, 115, 0.4);
	}

	.set-info {
		flex-shrink: 0;
	}

	.set-number {
		font-size: 14px;
		font-weight: 600;
		color: white;
		min-width: 60px;
	}

	/* Control Groups */
	.control-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
		align-items: center;
	}

	.control-group label {
		font-size: 12px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.number-control {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.control-btn {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.control-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.4);
		transform: scale(1.05);
	}

	.control-btn:active {
		transform: scale(0.95);
	}

	.number-input {
		width: 60px;
		padding: 6px 8px;
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 14px;
		font-weight: 600;
		text-align: center;
	}

	.number-input:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.4);
		background: rgba(255, 255, 255, 0.15);
	}

	.weight-unit {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.7);
		margin-left: 4px;
	}

	/* Duration Display */
	.duration-display {
		display: flex;
		align-items: center;
		padding: 6px 10px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		font-size: 14px;
	}

	/* Set Actions */
	.set-actions {
		display: flex;
		gap: 8px;
		margin-left: auto;
		flex-shrink: 0;
	}

	.action-btn {
		padding: 8px 16px;
		border-radius: 6px;
		border: 1px solid;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn.skip {
		background: rgba(255, 107, 107, 0.2);
		border-color: rgba(255, 107, 107, 0.4);
		color: #ff6b6b;
	}

	.action-btn.skip:hover {
		background: rgba(255, 107, 107, 0.3);
		border-color: rgba(255, 107, 107, 0.6);
	}

	.action-btn.complete {
		background: rgba(46, 213, 115, 0.2);
		border-color: rgba(46, 213, 115, 0.4);
		color: #2ed573;
	}

	.action-btn.complete:hover {
		background: rgba(46, 213, 115, 0.3);
		border-color: rgba(46, 213, 115, 0.6);
	}

	.action-btn.complete.completed {
		background: rgba(46, 213, 115, 0.4);
		border-color: rgba(46, 213, 115, 0.8);
		color: white;
	}

	/* Add Set Button */
	.add-set-btn {
		width: 100%;
		padding: 12px;
		margin-top: 8px;
		border-radius: 8px;
		border: 2px dashed rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.8);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-set-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.5);
		color: white;
	}
</style>