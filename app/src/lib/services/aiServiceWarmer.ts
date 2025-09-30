/**
 * AI Service Warming - Prevents cold starts during workouts
 * Pings the AI service periodically to keep it warm
 */

export class AIServiceWarmer {
  private warmupInterval: NodeJS.Timeout | null = null;
  private readonly AI_SERVICE_URL: string;
  private isWarming: boolean = false;

  constructor(aiServiceUrl?: string) {
    this.AI_SERVICE_URL = aiServiceUrl || import.meta.env.VITE_AI_API_URL || 'https://technically-fit-ai.fly.dev';
  }

  /**
   * Start warming the AI service
   */
  startWarming(): void {
    if (this.isWarming) return;

    console.log('🔥 Starting AI service warming...');
    this.isWarming = true;

    // Ping immediately
    this.pingService();

    // Set up periodic warming (every 4 minutes)
    this.warmupInterval = setInterval(() => {
      this.pingService();
    }, 4 * 60 * 1000);
  }

  /**
   * Stop warming the AI service
   */
  stopWarming(): void {
    if (this.warmupInterval) {
      clearInterval(this.warmupInterval);
      this.warmupInterval = null;
    }
    this.isWarming = false;
    console.log('❄️ Stopped AI service warming');
  }

  /**
   * Ping the AI service to keep it warm
   */
  private async pingService(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(`${this.AI_SERVICE_URL}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        console.log(`🔥 AI service warmed: ${result.status} (model: ${result.model_available ? 'loaded' : 'loading'})`);
      } else {
        console.warn(`⚠️ AI service warmup failed: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('⚠️ AI service warmup timeout');
      } else {
        console.warn('⚠️ AI service warmup error:', error);
      }
    }
  }

  /**
   * Warm up the AI service with a lightweight request
   */
  async warmupWithRequest(): Promise<boolean> {
    try {
      console.log('🔥 Warming AI service with test request...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for model loading

      const response = await fetch(`${this.AI_SERVICE_URL}/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: 'complete_workout',
          user_id: 'warmup_test',
          context: {
            exercise: 'warmup',
            set_number: 1
          },
          user_data: {
            fitness_level: 'intermediate',
            current_program: { planned_reps: 1 },
            goals: ['warmup']
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ AI service fully warmed and ready');
        return true;
      } else {
        console.warn(`⚠️ AI service warmup request failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('⚠️ AI service warmup request timeout (normal for initial load)');
      } else {
        console.warn('⚠️ AI service warmup request error:', error);
      }
      return false;
    }
  }

  /**
   * Check if the service is currently warming
   */
  isCurrentlyWarming(): boolean {
    return this.isWarming;
  }
}

// Global instance for app-wide use
export const globalAIWarmer = new AIServiceWarmer();

// Auto-start warming when app loads (in browser environment)
if (typeof window !== 'undefined') {
  // Start warming after a short delay
  setTimeout(() => {
    globalAIWarmer.startWarming();
  }, 2000);

  // Stop warming when page unloads
  window.addEventListener('beforeunload', () => {
    globalAIWarmer.stopWarming();
  });
}