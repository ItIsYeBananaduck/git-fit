<script lang="ts">
  import { polarData, polarAuthState, polarLoading } from '../stores/polar.js';
  import { Heart, Moon, Footprints, Flame, Activity, TrendingUp } from 'lucide-svelte';

  function formatValue(value: number | undefined, suffix: string = '', decimals: number = 0): string {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(decimals) + suffix;
  }

  function formatTime(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  function getRecoveryColor(recovery: number | undefined): string {
    if (!recovery) return '#64748b';
    if (recovery >= 75) return '#22c55e';
    if (recovery >= 50) return '#eab308';
    if (recovery >= 25) return '#f97316';
    return '#ef4444';
  }

  function getRecoveryLabel(recovery: number | undefined): string {
    if (!recovery) return 'Unknown';
    if (recovery >= 75) return 'Excellent';
    if (recovery >= 50) return 'Good';
    if (recovery >= 25) return 'Fair';
    return 'Poor';
  }
</script>

{#if $polarAuthState.isConnected}
  <div class="polar-data">
    <div class="header">
      <h3>Polar Data</h3>
      {#if $polarLoading}
        <div class="loading-spinner"></div>
      {/if}
    </div>

    {#if $polarData}
      <div class="metrics-grid">
        <!-- Recovery Score -->
        {#if $polarData.recovery !== undefined}
          <div class="metric-card recovery">
            <div class="metric-header">
              <TrendingUp class="metric-icon" />
              <span class="metric-title">Recovery</span>
            </div>
            <div class="metric-value">
              <span 
                class="value-large" 
                style="color: {getRecoveryColor($polarData.recovery)}"
              >
                {formatValue($polarData.recovery, '%', 0)}
              </span>
              <span class="value-label">{getRecoveryLabel($polarData.recovery)}</span>
            </div>
          </div>
        {/if}

        <!-- HRV -->
        {#if $polarData.hrv !== undefined}
          <div class="metric-card hrv">
            <div class="metric-header">
              <Activity class="metric-icon" />
              <span class="metric-title">HRV</span>
            </div>
            <div class="metric-value">
              <span class="value-large">{formatValue($polarData.hrv, ' ms', 1)}</span>
              <span class="value-label">Heart Rate Variability</span>
            </div>
          </div>
        {/if}

        <!-- Heart Rate -->
        {#if $polarData.heartRate !== undefined || $polarData.restingHeartRate !== undefined}
          <div class="metric-card heart-rate">
            <div class="metric-header">
              <Heart class="metric-icon" />
              <span class="metric-title">Heart Rate</span>
            </div>
            <div class="metric-value">
              {#if $polarData.heartRate}
                <span class="value-large">{formatValue($polarData.heartRate, ' bpm')}</span>
                <span class="value-label">Current</span>
              {:else if $polarData.restingHeartRate}
                <span class="value-large">{formatValue($polarData.restingHeartRate, ' bpm')}</span>
                <span class="value-label">Resting</span>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Sleep -->
        {#if $polarData.sleep}
          <div class="metric-card sleep">
            <div class="metric-header">
              <Moon class="metric-icon" />
              <span class="metric-title">Sleep</span>
            </div>
            <div class="metric-value">
              <span class="value-large">{formatTime($polarData.sleep.duration)}</span>
              <div class="sleep-details">
                <span class="sleep-detail">Quality: {formatValue($polarData.sleep.quality, '%')}</span>
                <span class="sleep-detail">Efficiency: {formatValue($polarData.sleep.efficiency, '%')}</span>
              </div>
            </div>
          </div>
        {/if}

        <!-- Steps -->
        {#if $polarData.steps !== undefined}
          <div class="metric-card steps">
            <div class="metric-header">
              <Footprints class="metric-icon" />
              <span class="metric-title">Steps</span>
            </div>
            <div class="metric-value">
              <span class="value-large">{$polarData.steps.toLocaleString()}</span>
              <span class="value-label">Today</span>
            </div>
          </div>
        {/if}

        <!-- Calories -->
        {#if $polarData.calories !== undefined}
          <div class="metric-card calories">
            <div class="metric-header">
              <Flame class="metric-icon" />
              <span class="metric-title">Calories</span>
            </div>
            <div class="metric-value">
              <span class="value-large">{formatValue($polarData.calories, ' cal')}</span>
              <span class="value-label">Total</span>
            </div>
          </div>
        {/if}
      </div>

      <div class="data-timestamp">
        Last updated: {$polarData.timestamp.toLocaleString()}
      </div>
    {:else}
      <div class="no-data">
        <Activity class="no-data-icon" />
        <p>No data available</p>
        <small>Try syncing your data or check your Polar device connection</small>
      </div>
    {/if}
  </div>
{/if}

<style>
  .polar-data {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    margin-top: 16px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #ff6b00;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .metric-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
    transition: all 0.2s;
  }

  .metric-card:hover {
    border-color: #ff6b00;
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.1);
  }

  .metric-card.recovery:hover {
    border-color: #22c55e;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.1);
  }

  .metric-card.hrv:hover {
    border-color: #8b5cf6;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
  }

  .metric-card.heart-rate:hover {
    border-color: #ef4444;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
  }

  .metric-card.sleep:hover {
    border-color: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
  }

  .metric-card.steps:hover {
    border-color: #10b981;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
  }

  .metric-card.calories:hover {
    border-color: #f59e0b;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
  }

  .metric-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .metric-title {
    font-weight: 600;
    color: #374151;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .metric-value {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .value-large {
    font-size: 32px;
    font-weight: 700;
    color: #1e293b;
    line-height: 1;
  }

  .value-label {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }

  .sleep-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 8px;
  }

  .sleep-detail {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }

  .data-timestamp {
    text-align: center;
    font-size: 12px;
    color: #64748b;
    font-style: italic;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }

  .no-data {
    text-align: center;
    padding: 40px 20px;
    color: #64748b;
  }

  .no-data p {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 500;
  }

  .no-data small {
    font-size: 14px;
    opacity: 0.8;
  }
</style>