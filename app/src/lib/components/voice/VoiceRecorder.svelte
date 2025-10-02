<!--
Voice Recording Component
Real-time audio recording with visualization and controls
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import { toast } from '$lib/components/ui/toast';
  import type { VoiceRecordingConfig, VoiceRecordingState } from '$lib/types/voice';

  export let config: VoiceRecordingConfig = {
    maxDuration: 120000, // 2 minutes
    sampleRate: 44100,
    channels: 1,
    mimeType: 'audio/webm;codecs=opus',
    visualizerColor: '#3b82f6',
    showTimer: true,
    autoStop: true,
  };

  export let onRecordingComplete: (audioBlob: Blob, duration: number) => void = () => {};
  export let onRecordingError: (error: string) => void = () => {};

  // State management
  const recordingState = writable<VoiceRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    volume: 0,
    error: null,
  });

  let mediaRecorder: MediaRecorder | null = null;
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let microphone: MediaStreamAudioSourceNode | null = null;
  let animationFrame: number | null = null;
  let recordingStartTime = 0;
  let audioChunks: Blob[] = [];

  // Canvas for visualization
  let canvas: HTMLCanvasElement;
  let canvasContext: CanvasRenderingContext2D | null = null;

  // Timer
  let timerInterval: number | null = null;

  onMount(() => {
    if (canvas) {
      canvasContext = canvas.getContext('2d');
      resizeCanvas();
    }
    window.addEventListener('resize', resizeCanvas);
  });

  onDestroy(() => {
    stopRecording();
    cleanupAudioContext();
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    window.removeEventListener('resize', resizeCanvas);
  });

  function resizeCanvas() {
    if (canvas && canvasContext) {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvasContext.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  async function startRecording() {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: config.sampleRate,
          channelCount: config.channels,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Initialize audio context for visualization
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      // Initialize media recorder
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: config.mimeType || 'audio/webm;codecs=opus',
      });

      audioChunks = [];
      recordingStartTime = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: config.mimeType });
        const duration = Date.now() - recordingStartTime;
        onRecordingComplete(audioBlob, duration);
        cleanupRecording();
      };

      mediaRecorder.onerror = (event) => {
        const error = `Recording error: ${(event as any).error?.message || 'Unknown error'}`;
        recordingState.update(state => ({ ...state, error }));
        onRecordingError(error);
        cleanupRecording();
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      recordingState.update(state => ({ 
        ...state, 
        isRecording: true, 
        error: null,
        duration: 0 
      }));

      // Start timer
      if (config.showTimer) {
        timerInterval = setInterval(updateTimer, 100);
      }

      // Start visualization
      visualize();

      // Auto-stop after max duration
      if (config.autoStop && config.maxDuration) {
        setTimeout(() => {
          if ($recordingState.isRecording) {
            stopRecording();
            toast.warning(`Recording automatically stopped after ${config.maxDuration / 1000} seconds`);
          }
        }, config.maxDuration);
      }

    } catch (error) {
      const errorMessage = `Failed to start recording: ${error}`;
      recordingState.update(state => ({ ...state, error: errorMessage }));
      onRecordingError(errorMessage);
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    recordingState.update(state => ({ 
      ...state, 
      isRecording: false, 
      isPaused: false 
    }));
    
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function pauseRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      recordingState.update(state => ({ ...state, isPaused: true }));
    }
  }

  function resumeRecording() {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      recordingState.update(state => ({ ...state, isPaused: false }));
    }
  }

  function cleanupRecording() {
    if (microphone?.mediaStream) {
      microphone.mediaStream.getTracks().forEach(track => track.stop());
    }
    cleanupAudioContext();
  }

  function cleanupAudioContext() {
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }
    audioContext = null;
    analyser = null;
    microphone = null;
  }

  function updateTimer() {
    if ($recordingState.isRecording && !$recordingState.isPaused) {
      const duration = Date.now() - recordingStartTime;
      recordingState.update(state => ({ ...state, duration }));
    }
  }

  function visualize() {
    if (!analyser || !canvasContext || !canvas) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      if (!analyser || !canvasContext || !canvas) return;

      animationFrame = requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);

      // Calculate average volume
      const volume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      recordingState.update(state => ({ ...state, volume: volume / 255 }));

      // Clear canvas
      canvasContext.fillStyle = 'rgba(0, 0, 0, 0.1)';
      canvasContext.fillRect(0, 0, canvas.width, canvas.height);

      // Draw frequency bars
      const barWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        const hue = (i / bufferLength) * 360;
        canvasContext.fillStyle = config.visualizerColor || `hsl(${hue}, 70%, 60%)`;
        
        canvasContext.fillRect(
          x, 
          canvas.height - barHeight, 
          barWidth - 1, 
          barHeight
        );
        
        x += barWidth;
      }
    }

    draw();
  }

  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function handleRecordingToggle() {
    if ($recordingState.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  // Reactive declarations
  $: canRecord = !$recordingState.isRecording;
  $: isActive = $recordingState.isRecording || $recordingState.isPaused;
  $: volumePercentage = Math.round($recordingState.volume * 100);
</script>

<div class="voice-recorder">
  <!-- Recording Controls -->
  <div class="recorder-controls">
    <button
      class="record-button {$recordingState.isRecording ? 'recording' : ''}"
      class:disabled={!canRecord && !$recordingState.isRecording}
      on:click={handleRecordingToggle}
      aria-label={$recordingState.isRecording ? 'Stop recording' : 'Start recording'}
    >
      {#if $recordingState.isRecording}
        <svg class="stop-icon" viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="2"/>
        </svg>
      {:else}
        <svg class="mic-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <path d="M12 19v4"/>
          <path d="M8 23h8"/>
        </svg>
      {/if}
    </button>

    {#if $recordingState.isRecording}
      <div class="recording-actions">
        {#if $recordingState.isPaused}
          <button class="action-button resume" on:click={resumeRecording}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            Resume
          </button>
        {:else}
          <button class="action-button pause" on:click={pauseRecording}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="3" width="4" height="18"/>
              <rect x="16" y="3" width="4" height="18"/>
            </svg>
            Pause
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Status Display -->
  {#if isActive}
    <div class="recording-status">
      {#if config.showTimer}
        <div class="timer">
          <span class="time">{formatTime($recordingState.duration)}</span>
          {#if config.maxDuration}
            <span class="max-time">/ {formatTime(config.maxDuration)}</span>
          {/if}
        </div>
      {/if}

      <div class="volume-indicator">
        <span class="volume-label">Volume:</span>
        <div class="volume-bar">
          <div 
            class="volume-fill" 
            style="width: {volumePercentage}%"
          ></div>
        </div>
        <span class="volume-text">{volumePercentage}%</span>
      </div>

      {#if $recordingState.isPaused}
        <div class="status-badge paused">Paused</div>
      {:else}
        <div class="status-badge recording">
          <div class="pulse"></div>
          Recording
        </div>
      {/if}
    </div>
  {/if}

  <!-- Audio Visualization -->
  <div class="visualizer-container">
    <canvas
      bind:this={canvas}
      class="audio-visualizer"
      width="400"
      height="100"
    ></canvas>
    {#if !isActive}
      <div class="visualizer-placeholder">
        <svg viewBox="0 0 24 24" fill="currentColor" class="soundwave-icon">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
        <p>Audio visualization will appear here during recording</p>
      </div>
    {/if}
  </div>

  <!-- Error Display -->
  {#if $recordingState.error}
    <div class="error-message">
      <svg viewBox="0 0 24 24" fill="currentColor" class="error-icon">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      {$recordingState.error}
    </div>
  {/if}
</div>

<style>
  .voice-recorder {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 24px;
    color: white;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .recorder-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 20px;
  }

  .record-button {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4);
  }

  .record-button:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
  }

  .record-button.recording {
    background: linear-gradient(135deg, #e74c3c, #c0392b);
    animation: pulse 2s infinite;
  }

  .record-button.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .mic-icon, .stop-icon {
    width: 32px;
    height: 32px;
  }

  .recording-actions {
    display: flex;
    gap: 12px;
  }

  .action-button {
    padding: 8px 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
  }

  .action-button:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }

  .action-button svg {
    width: 16px;
    height: 16px;
  }

  .recording-status {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .timer {
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    font-family: 'Courier New', monospace;
  }

  .max-time {
    opacity: 0.7;
    font-size: 18px;
  }

  .volume-indicator {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
  }

  .volume-bar {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    overflow: hidden;
  }

  .volume-fill {
    height: 100%;
    background: linear-gradient(90deg, #27ae60, #f39c12, #e74c3c);
    transition: width 0.1s ease;
  }

  .status-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
  }

  .status-badge.recording {
    background: rgba(231, 76, 60, 0.2);
    border: 2px solid #e74c3c;
  }

  .status-badge.paused {
    background: rgba(241, 196, 15, 0.2);
    border: 2px solid #f1c40f;
  }

  .pulse {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #e74c3c;
    animation: pulse 1.5s infinite;
  }

  .visualizer-container {
    position: relative;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    padding: 16px;
    min-height: 120px;
  }

  .audio-visualizer {
    width: 100%;
    height: 100px;
    border-radius: 8px;
  }

  .visualizer-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
  }

  .soundwave-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: rgba(231, 76, 60, 0.2);
    border: 1px solid #e74c3c;
    border-radius: 8px;
    margin-top: 16px;
    font-size: 14px;
  }

  .error-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.7;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    .voice-recorder {
      padding: 16px;
    }

    .record-button {
      width: 60px;
      height: 60px;
    }

    .mic-icon, .stop-icon {
      width: 24px;
      height: 24px;
    }

    .timer {
      font-size: 20px;
    }

    .recording-actions {
      flex-direction: column;
      gap: 8px;
    }
  }
</style>