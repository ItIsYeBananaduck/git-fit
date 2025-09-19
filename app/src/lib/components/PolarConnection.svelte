<script lang="ts">
  import { onMount } from 'svelte';
  import { polarAuthState, polarLoading, polarError, connectToPolar, disconnectFromPolar, refreshPolarData } from '../stores/polar.js';
  import { AlertTriangle, CheckCircle, Zap, RefreshCw } from 'lucide-svelte';

  let clientId = '';
  let clientSecret = '';
  let memberId = '';
  let showCredentials = false;

  onMount(() => {
    // Check for saved credentials (for development)
    if (typeof window !== 'undefined') {
      const savedClientId = localStorage.getItem('polar_client_id');
      const savedClientSecret = localStorage.getItem('polar_client_secret');
      if (savedClientId && savedClientSecret) {
        clientId = savedClientId;
        clientSecret = savedClientSecret;
      }
    }
  });

  async function handleConnect() {
    if (!clientId || !clientSecret || !memberId) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // Save credentials for development
      localStorage.setItem('polar_client_id', clientId);
      localStorage.setItem('polar_client_secret', clientSecret);
      
      const authUrl = await connectToPolar(clientId, clientSecret);
      
      // Store member ID for callback
      sessionStorage.setItem('polar_member_id', memberId);
      
      // Redirect to Polar authorization
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to connect to Polar:', error);
    }
  }

  async function handleDisconnect() {
    if (confirm('Are you sure you want to disconnect from Polar? This will remove all saved data.')) {
      try {
        await disconnectFromPolar();
      } catch (error) {
        console.error('Failed to disconnect from Polar:', error);
      }
    }
  }

  async function handleRefresh() {
    try {
      await refreshPolarData();
    } catch (error) {
      console.error('Failed to refresh Polar data:', error);
    }
  }

  function formatDate(date: Date | null): string {
    if (!date) return 'Never';
    return date.toLocaleString();
  }
</script>

<div class="polar-connection">
  <div class="header">
    <div class="title-section">
      <Zap class="icon" />
      <h3>Polar AccessLink</h3>
    </div>
    
    <div class="status-badge" class:connected={$polarAuthState.isConnected}>
      {#if $polarAuthState.isConnected}
        <CheckCircle class="status-icon" />
        Connected
      {:else}
        <AlertTriangle class="status-icon" />
        Disconnected
      {/if}
    </div>
  </div>

  {#if $polarError}
    <div class="error-message">
      <AlertTriangle class="error-icon" />
      {$polarError}
    </div>
  {/if}

  {#if !$polarAuthState.isConnected}
    <div class="connection-form">
      <p class="description">
        Connect your Polar device to access heart rate, HRV, sleep, and training data.
        You'll need to register for a free Polar AccessLink developer account.
      </p>
      
      <button 
        class="toggle-credentials"
        on:click={() => showCredentials = !showCredentials}
      >
        {showCredentials ? 'Hide' : 'Show'} API Credentials
      </button>

      {#if showCredentials}
        <div class="credentials-form">
          <div class="form-group">
            <label for="polar-client-id">Client ID</label>
            <input
              id="polar-client-id"
              type="text"
              bind:value={clientId}
              placeholder="Your Polar Client ID"
              disabled={$polarLoading}
            />
          </div>

          <div class="form-group">
            <label for="polar-client-secret">Client Secret</label>
            <input
              id="polar-client-secret"
              type="password"
              bind:value={clientSecret}
              placeholder="Your Polar Client Secret"
              disabled={$polarLoading}
            />
          </div>

          <div class="form-group">
            <label for="polar-member-id">Member ID</label>
            <input
              id="polar-member-id"
              type="text"
              bind:value={memberId}
              placeholder="Your unique member ID"
              disabled={$polarLoading}
            />
            <small>This should be a unique identifier for your account</small>
          </div>

          <div class="setup-instructions">
            <h4>Setup Instructions:</h4>
            <ol>
              <li>Create a free account at <a href="https://polar.com" target="_blank" rel="noopener">polar.com</a></li>
              <li>Register at <a href="https://admin.polaraccesslink.com" target="_blank" rel="noopener">admin.polaraccesslink.com</a></li>
              <li>Create a new application and get your Client ID and Secret</li>
              <li>Set redirect URL to: <code>{window?.location?.origin}/auth/polar/callback</code></li>
              <li>Enter your credentials above and connect</li>
            </ol>
          </div>
        </div>
      {/if}

      <button 
        class="connect-button"
        on:click={handleConnect}
        disabled={$polarLoading || !clientId || !clientSecret || !memberId}
      >
        {#if $polarLoading}
          Connecting...
        {:else}
          Connect to Polar
        {/if}
      </button>
    </div>
  {:else}
    <div class="connected-info">
      <div class="info-grid">
        <div class="info-item">
          <strong>Member ID:</strong>
          <span>{$polarAuthState.memberId}</span>
        </div>
        
        <div class="info-item">
          <strong>Last Sync:</strong>
          <span>{formatDate($polarAuthState.lastSync)}</span>
        </div>
      </div>

      <div class="action-buttons">
        <button 
          class="refresh-button"
          on:click={handleRefresh}
          disabled={$polarLoading}
        >
          <RefreshCw class="button-icon {$polarLoading ? 'spinning' : ''}" />
          {$polarLoading ? 'Syncing...' : 'Sync Data'}
        </button>

        <button 
          class="disconnect-button"
          on:click={handleDisconnect}
          disabled={$polarLoading}
        >
          Disconnect
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .polar-connection {
    background: linear-gradient(135deg, #ff6b00 0%, #e85d00 100%);
    border-radius: 12px;
    padding: 24px;
    color: white;
    position: relative;
    overflow: hidden;
  }

  .polar-connection::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .title-section h3 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.2);
    font-weight: 600;
    font-size: 14px;
  }

  .status-badge.connected {
    background: rgba(34, 197, 94, 0.3);
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(220, 38, 38, 0.2);
    border: 1px solid rgba(220, 38, 38, 0.3);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
    font-size: 14px;
  }

  .connection-form {
    position: relative;
    z-index: 1;
  }

  .description {
    margin-bottom: 20px;
    opacity: 0.9;
    line-height: 1.5;
  }

  .toggle-credentials {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 16px;
    font-weight: 500;
  }

  .toggle-credentials:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .credentials-form {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    font-size: 14px;
  }

  .form-group input {
    width: 100%;
    padding: 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 14px;
  }

  .form-group input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  .form-group input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.15);
  }

  .form-group small {
    display: block;
    margin-top: 4px;
    opacity: 0.7;
    font-size: 12px;
  }

  .setup-instructions {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .setup-instructions h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
  }

  .setup-instructions ol {
    margin: 0;
    padding-left: 20px;
  }

  .setup-instructions li {
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .setup-instructions a {
    color: #fbbf24;
    text-decoration: none;
  }

  .setup-instructions a:hover {
    text-decoration: underline;
  }

  .setup-instructions code {
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
  }

  .connect-button {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  }

  .connect-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }

  .connect-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .connected-info {
    position: relative;
    z-index: 1;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .info-item strong {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.8;
  }

  .info-item span {
    font-size: 14px;
    font-weight: 500;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .refresh-button,
  .disconnect-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
  }

  .refresh-button {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    flex: 1;
  }

  .refresh-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
  }

  .disconnect-button {
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .disconnect-button:hover:not(:disabled) {
    background: rgba(220, 38, 38, 0.2);
    border-color: rgba(220, 38, 38, 0.4);
    color: white;
  }

  .refresh-button:disabled,
  .disconnect-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>