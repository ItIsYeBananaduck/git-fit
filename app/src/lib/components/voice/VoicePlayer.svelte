<!--
Voice Playback Component
Audio playback with waveform visualization and controls
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import type { VoicePlaybackState, VoicePlaybackConfig } from '$lib/types/voice';

  export let audioUrl: string | null = null;
  export let audioBlob: Blob | null = null;
  export let config: VoicePlaybackConfig = {
    showWaveform: true,
    showControls: true,
    autoPlay: false,
    loop: false,
    volume: 0.8,
    playbackRate: 1.0,
    waveformColor: '#3b82f6',
    progressColor: '#1d4ed8',
  };

  export let onPlaybackStart: () => void = () => {};
  export let onPlaybackEnd: () => void = () => {};
  export let onPlaybackError: (error: string) => void = () => {};

  // State management
  const playbackState = writable<VoicePlaybackState>({
    isPlaying: false,
    isPaused: false,
    duration: 0,
    currentTime: 0,
    progress: 0,
    volume: config.volume || 0.8,
    playbackRate: config.playbackRate || 1.0,
    error: null,
    isLoading: false,
  });

  let audio: HTMLAudioElement | null = null;
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let source: MediaElementAudioSourceNode | null = null;
  let animationFrame: number | null = null;

  // Canvas for waveform
  let canvas: HTMLCanvasElement;
  let canvasContext: CanvasRenderingContext2D | null = null;
  let waveformData: number[] = [];

  // Progress tracking
  let progressUpdateInterval: number | null = null;
  let isDragging = false;

  onMount(() => {
    if (canvas) {
      canvasContext = canvas.getContext('2d');
      resizeCanvas();
    }
    window.addEventListener('resize', resizeCanvas);
    
    if (audioUrl || audioBlob) {
      loadAudio();
    }
  });

  onDestroy(() => {
    cleanup();
    window.removeEventListener('resize', resizeCanvas);
  });

  function resizeCanvas() {
    if (canvas && canvasContext) {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvasContext.scale(window.devicePixelRatio, window.devicePixelRatio);
      drawWaveform();
    }
  }

  async function loadAudio() {
    try {
      playbackState.update(state => ({ ...state, isLoading: true, error: null }));

      if (audio) {
        cleanup();
      }

      audio = new Audio();
      
      if (audioBlob) {
        audio.src = URL.createObjectURL(audioBlob);
      } else if (audioUrl) {
        audio.src = audioUrl;
      } else {
        throw new Error('No audio source provided');
      }

      // Set audio properties
      audio.volume = config.volume || 0.8;
      audio.playbackRate = config.playbackRate || 1.0;
      audio.loop = config.loop || false;

      // Audio event listeners
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('canplaythrough', handleCanPlayThrough);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('error', handleError);
      audio.addEventListener('volumechange', handleVolumeChange);
      audio.addEventListener('ratechange', handleRateChange);

      // Initialize audio context for visualization
      if (config.showWaveform && !audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
      }

      // Load the audio
      await audio.load();

      if (config.autoPlay) {
        await play();
      }

    } catch (error) {
      const errorMessage = `Failed to load audio: ${error}`;
      playbackState.update(state => ({ 
        ...state, 
        error: errorMessage, 
        isLoading: false 
      }));
      onPlaybackError(errorMessage);
    }
  }

  function handleLoadedMetadata() {
    if (audio) {
      playbackState.update(state => ({ 
        ...state, 
        duration: audio!.duration,
        isLoading: false 
      }));
      generateWaveform();
    }
  }

  function handleCanPlayThrough() {
    playbackState.update(state => ({ ...state, isLoading: false }));
  }

  function handlePlay() {
    playbackState.update(state => ({ 
      ...state, 
      isPlaying: true, 
      isPaused: false 
    }));
    
    if (config.showWaveform) {
      startVisualization();
    }
    
    startProgressTracking();
    onPlaybackStart();
  }

  function handlePause() {
    playbackState.update(state => ({ 
      ...state, 
      isPlaying: false, 
      isPaused: true 
    }));
    
    stopVisualization();
    stopProgressTracking();
  }

  function handleEnded() {
    playbackState.update(state => ({ 
      ...state, 
      isPlaying: false, 
      isPaused: false,
      currentTime: 0,
      progress: 0
    }));
    
    stopVisualization();
    stopProgressTracking();
    onPlaybackEnd();
  }

  function handleTimeUpdate() {
    if (audio && !isDragging) {
      const currentTime = audio.currentTime;
      const progress = audio.duration > 0 ? (currentTime / audio.duration) * 100 : 0;
      
      playbackState.update(state => ({ 
        ...state, 
        currentTime, 
        progress 
      }));
    }
  }

  function handleError(event: Event) {
    const error = (event.target as HTMLAudioElement)?.error;
    const errorMessage = `Audio error: ${error?.message || 'Unknown error'}`;
    
    playbackState.update(state => ({ 
      ...state, 
      error: errorMessage,
      isLoading: false 
    }));
    
    onPlaybackError(errorMessage);
  }

  function handleVolumeChange() {
    if (audio) {
      playbackState.update(state => ({ ...state, volume: audio!.volume }));
    }
  }

  function handleRateChange() {
    if (audio) {
      playbackState.update(state => ({ ...state, playbackRate: audio!.playbackRate }));
    }
  }

  async function play() {
    if (audio && audioContext?.state === 'suspended') {
      await audioContext.resume();
    }
    
    if (audio) {
      try {
        await audio.play();
      } catch (error) {
        const errorMessage = `Playback failed: ${error}`;
        playbackState.update(state => ({ ...state, error: errorMessage }));
        onPlaybackError(errorMessage);
      }
    }
  }

  function pause() {
    if (audio) {
      audio.pause();
    }
  }

  function stop() {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  function seek(progress: number) {
    if (audio) {
      const time = (progress / 100) * audio.duration;
      audio.currentTime = time;
    }
  }

  function setVolume(volume: number) {
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  function setPlaybackRate(rate: number) {
    if (audio) {
      audio.playbackRate = Math.max(0.25, Math.min(4, rate));
    }
  }

  function generateWaveform() {
    // Simplified waveform generation for demo
    // In a real implementation, you'd analyze the actual audio data
    const samples = 100;
    waveformData = Array.from({ length: samples }, () => Math.random() * 0.8 + 0.1);
    drawWaveform();
  }

  function drawWaveform() {
    if (!canvasContext || !canvas || waveformData.length === 0) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvasContext.clearRect(0, 0, width, height);

    const barWidth = width / waveformData.length;
    const progressWidth = width * ($playbackState.progress / 100);

    waveformData.forEach((amplitude, index) => {
      const x = index * barWidth;
      const barHeight = amplitude * height * 0.8;
      const y = (height - barHeight) / 2;

      // Determine color based on progress
      const isPlayed = x < progressWidth;
      canvasContext.fillStyle = isPlayed 
        ? (config.progressColor || '#1d4ed8')
        : (config.waveformColor || '#3b82f6');

      canvasContext.fillRect(x, y, barWidth - 1, barHeight);
    });
  }

  function startVisualization() {
    if (!config.showWaveform || !analyser) return;

    function animate() {
      if ($playbackState.isPlaying) {
        drawWaveform();
        animationFrame = requestAnimationFrame(animate);
      }
    }
    animate();
  }

  function stopVisualization() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  function startProgressTracking() {
    progressUpdateInterval = setInterval(() => {
      if (audio && $playbackState.isPlaying) {
        handleTimeUpdate();
      }
    }, 100);
  }

  function stopProgressTracking() {
    if (progressUpdateInterval) {
      clearInterval(progressUpdateInterval);
      progressUpdateInterval = null;
    }
  }

  function cleanup() {
    if (audio) {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('volumechange', handleVolumeChange);
      audio.removeEventListener('ratechange', handleRateChange);
      
      if (audioBlob && audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src);
      }
    }

    stopVisualization();
    stopProgressTracking();

    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }

    audio = null;
    audioContext = null;
    analyser = null;
    source = null;
  }

  function handleProgressClick(event: MouseEvent) {
    if (!canvas || !audio) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const progress = (x / rect.width) * 100;
    seek(progress);
  }

  function handleProgressDragStart(event: MouseEvent) {
    isDragging = true;
    handleProgressClick(event);
  }

  function handleProgressDrag(event: MouseEvent) {
    if (isDragging) {
      handleProgressClick(event);
    }
  }

  function handleProgressDragEnd() {
    isDragging = false;
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function handlePlayPause() {
    if ($playbackState.isPlaying) {
      pause();
    } else {
      play();
    }
  }

  // Reactive statements
  $: if (audioUrl || audioBlob) {
    loadAudio();
  }

  $: drawWaveform(); // Redraw when progress changes
</script>

<svelte:window
  on:mousemove={handleProgressDrag}
  on:mouseup={handleProgressDragEnd}
/>

<div class="voice-playback">
  {#if config.showWaveform}
    <!-- Waveform Visualization -->
    <div class="waveform-container">
      <canvas
        bind:this={canvas}
        class="waveform-canvas"
        width="400"
        height="80"
        on:click={handleProgressClick}
        on:mousedown={handleProgressDragStart}
        style="cursor: pointer;"
      ></canvas>
      
      {#if $playbackState.isLoading}
        <div class="loading-overlay">
          <div class="loading-spinner"></div>
          <span>Loading audio...</span>
        </div>
      {/if}
    </div>
  {/if}

  {#if config.showControls}
    <!-- Playback Controls -->
    <div class="controls-container">
      <div class="main-controls">
        <button
          class="control-button play-pause"
          class:disabled={$playbackState.isLoading}
          on:click={handlePlayPause}
          aria-label={$playbackState.isPlaying ? 'Pause' : 'Play'}
        >
          {#if $playbackState.isLoading}
            <div class="loading-spinner small"></div>
          {:else if $playbackState.isPlaying}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="3" width="4" height="18"/>
              <rect x="16" y="3" width="4" height="18"/>
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          {/if}
        </button>

        <button
          class="control-button stop"
          class:disabled={!$playbackState.isPlaying && !$playbackState.isPaused}
          on:click={stop}
          aria-label="Stop"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
          </svg>
        </button>
      </div>

      <!-- Time Display -->
      <div class="time-display">
        <span class="current-time">{formatTime($playbackState.currentTime)}</span>
        <span class="separator">/</span>
        <span class="total-time">{formatTime($playbackState.duration)}</span>
      </div>

      <!-- Progress Bar (fallback if waveform is disabled) -->
      {#if !config.showWaveform}
        <div class="progress-container">
          <input
            type="range"
            class="progress-slider"
            min="0"
            max="100"
            value={$playbackState.progress}
            on:input={(e) => seek(Number(e.target.value))}
          />
        </div>
      {/if}

      <!-- Volume Control -->
      <div class="volume-control">
        <svg class="volume-icon" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
        <input
          type="range"
          class="volume-slider"
          min="0"
          max="1"
          step="0.1"
          value={$playbackState.volume}
          on:input={(e) => setVolume(Number(e.target.value))}
        />
      </div>

      <!-- Playback Rate Control -->
      <div class="rate-control">
        <label for="playback-rate">Speed:</label>
        <select
          id="playback-rate"
          value={$playbackState.playbackRate}
          on:change={(e) => setPlaybackRate(Number(e.target.value))}
        >
          <option value="0.25">0.25x</option>
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
      </div>
    </div>
  {/if}

  <!-- Error Display -->
  {#if $playbackState.error}
    <div class="error-message">
      <svg viewBox="0 0 24 24" fill="currentColor" class="error-icon">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      {$playbackState.error}
    </div>
  {/if}
</div>

<style>
  .voice-playback {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
  }

  .waveform-container {
    position: relative;
    background: #ffffff;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid #e2e8f0;
  }

  .waveform-canvas {
    width: 100%;
    height: 80px;
    border-radius: 4px;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 8px;
    font-size: 14px;
    color: #64748b;
  }

  .controls-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
  }

  .main-controls {
    display: flex;
    gap: 8px;
  }

  .control-button {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }

  .control-button:hover:not(.disabled) {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  .control-button.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .control-button svg {
    width: 20px;
    height: 20px;
  }

  .play-pause {
    width: 52px;
    height: 52px;
  }

  .play-pause svg {
    width: 24px;
    height: 24px;
  }

  .time-display {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    color: #374151;
    margin-left: auto;
  }

  .separator {
    opacity: 0.6;
  }

  .progress-container {
    flex: 1;
    margin: 0 16px;
  }

  .progress-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #e2e8f0;
    outline: none;
    cursor: pointer;
  }

  .progress-slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .progress-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .volume-control, .rate-control {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #374151;
  }

  .volume-icon {
    width: 20px;
    height: 20px;
  }

  .volume-slider {
    width: 80px;
    height: 4px;
    border-radius: 2px;
    background: #e2e8f0;
    outline: none;
    cursor: pointer;
  }

  .volume-slider::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
  }

  .volume-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
  }

  .rate-control select {
    padding: 4px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: white;
    font-size: 12px;
    cursor: pointer;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e2e8f0;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-spinner.small {
    width: 20px;
    height: 20px;
    border-width: 2px;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    margin-top: 16px;
    font-size: 14px;
    color: #b91c1c;
  }

  .error-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .voice-playback {
      padding: 16px;
    }

    .controls-container {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .main-controls {
      justify-content: center;
    }

    .time-display {
      justify-content: center;
      margin: 0;
    }

    .volume-control, .rate-control {
      justify-content: center;
    }
  }
</style>