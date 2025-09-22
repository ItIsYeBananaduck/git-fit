/**
 * RSS Feed Integration Component for AI Training Data
 * Connects Coda RSS feeds with the AI coaching system
 */

import { RSSIntegrationService } from '../services/rssIntegrationService.js';
import { rssActions } from '../stores/rssFeeds.js';
import { SimpleCodaAPI } from '../api/codaAPI.js';

interface TrainingInsight {
  id: string;
  source: 'rss' | 'research' | 'study';
  title: string;
  content: string;
  category: string;
  tags: string[];
  confidence: number;
  publishedDate: Date;
  url?: string;
  keyTakeaways: string[];
  applicability: 'general' | 'beginner' | 'intermediate' | 'advanced';
}

export class RSSFeedIntegration {
  private rssService: RSSIntegrationService;
  private isInitialized = false;

  constructor(codaApiKey: string, codaDocId: string) {
    const codaAPI = new SimpleCodaAPI(codaApiKey, codaDocId);
    this.rssService = new RSSIntegrationService(codaAPI);
  }

  /**
   * Initialize the RSS integration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // The service initializes feeds automatically in constructor
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize RSS integration:', error);
    }
  }

  /**
   * Refresh all RSS feeds and update training data
   */
  async refreshAllFeeds(): Promise<void> {
    try {
      rssActions.setLoading(true);

      // Fetch all RSS content
      await this.rssService.fetchAllFeeds();

    } catch (error) {
      console.error('Failed to refresh RSS feeds:', error);
      rssActions.setError('Failed to refresh RSS feeds');
    } finally {
      rssActions.setLoading(false);
    }
  }

  /**
   * Get training insights for AI model
   */
  async getTrainingData(): Promise<TrainingInsight[]> {
    try {
      const items = this.rssService.getHighRelevanceItems(75);
      return await this.rssService.processContentForInsights(items);
    } catch (error) {
      console.error('Failed to get training data:', error);
      return [];
    }
  }

  /**
   * Export RSS data for AI training
   */
  async exportForTraining(): Promise<string> {
    try {
      return await this.rssService.exportForTraining();
    } catch (error) {
      console.error('Failed to export training data:', error);
      return '[]';
    }
  }

  /**
   * Get RSS service instance for direct access
   */
  getService(): RSSIntegrationService {
    return this.rssService;
  }

  /**
   * Search RSS content
   */
  searchContent(query: string, category?: string) {
    return this.rssService.searchContent(query, category);
  }

  /**
   * Setup automatic fetching
   */
  setupAutoFetch(intervalHours: number = 6): void {
    this.rssService.setupAutoFetch(intervalHours);
  }

  /**
   * Stop automatic fetching
   */
  stopAutoFetch(): void {
    this.rssService.stopAutoFetch();
  }
}

// Singleton instance for app-wide use
let rssIntegrationInstance: RSSFeedIntegration | null = null;

export function getRSSIntegration(codaApiKey?: string, codaDocId?: string): RSSFeedIntegration {
  if (!rssIntegrationInstance && codaApiKey && codaDocId) {
    rssIntegrationInstance = new RSSFeedIntegration(codaApiKey, codaDocId);
  }
  return rssIntegrationInstance!;
}