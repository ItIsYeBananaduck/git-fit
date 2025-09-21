/**
 * RSS Feed Integration Service for Git-Fit
 *
 * Connects to Coda docs containing RSS feeds to gather training data
 * for AI model enhancement and personalized coaching recommendations
 */

import Parser from 'rss-parser';
import type { CodaAPI } from './codaAPI';
import { rssFeedStore, rssActions } from '$lib/stores/rssFeeds';
import { get } from 'svelte/store';

export interface RSSFeed {
  id: string;
  name: string;
  url: string;
  category: 'fitness' | 'nutrition' | 'training' | 'research' | 'health';
  lastFetched: Date | null;
  isActive: boolean;
  tags: string[];
}

export interface RSSItem {
  id: string;
  feedId: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  publishedDate: Date;
  link: string;
  categories: string[];
  tags: string[];
  relevanceScore: number;
  processed: boolean;
}

export interface TrainingInsight {
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

export class RSSIntegrationService {
  private parser: Parser;
  private codaAPI: CodaAPI;
  private feeds: Map<string, RSSFeed> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(codaAPI: CodaAPI) {
    this.parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'media:content'],
          ['media:thumbnail', 'media:thumbnail'],
          ['dc:creator', 'dc:creator'],
          ['content:encoded', 'content:encoded']
        ]
      }
    });
    this.codaAPI = codaAPI;
    this.initializeFeeds();
  }

  /**
   * Initialize RSS feeds from Coda doc
   */
  private async initializeFeeds(): Promise<void> {
    try {
      // Fetch RSS feed configuration from Coda
      const feedsData = await this.codaAPI.getTableData('RSS Feeds');

      for (const feedData of feedsData) {
        const feed: RSSFeed = {
          id: feedData.id,
          name: feedData.name,
          url: feedData.url,
          category: feedData.category || 'fitness',
          lastFetched: feedData.lastFetched ? new Date(feedData.lastFetched) : null,
          isActive: feedData.isActive !== false,
          tags: feedData.tags || []
        };

        this.feeds.set(feed.id, feed);
      }

      rssActions.setFeeds(Array.from(this.feeds.values()));
      console.log(`Initialized ${this.feeds.size} RSS feeds from Coda`);
    } catch (error) {
      console.error('Failed to initialize RSS feeds:', error);
    }
  }

  /**
   * Fetch content from all active RSS feeds
   */
  async fetchAllFeeds(): Promise<RSSItem[]> {
    const allItems: RSSItem[] = [];
    const activeFeeds = Array.from(this.feeds.values()).filter(feed => feed.isActive);

    rssActions.setLoading(true);

    try {
      const fetchPromises = activeFeeds.map(feed => this.fetchFeed(feed));
      const results = await Promise.allSettled(fetchPromises);

      for (const result of results) {
        if (result.status === 'fulfilled') {
          allItems.push(...result.value);
        } else {
          console.error('Failed to fetch feed:', result.reason);
        }
      }

      // Update last fetched timestamps
      await this.updateLastFetchedTimestamps(activeFeeds);

      // Store items in database
      await this.storeItemsInDatabase(allItems);

      rssActions.setItems(allItems);
      rssActions.setLoading(false);

      return allItems;
    } catch (error) {
      console.error('Error fetching RSS feeds:', error);
      rssActions.setError('Failed to fetch RSS feeds');
      rssActions.setLoading(false);
      return [];
    }
  }

  /**
   * Fetch content from a specific RSS feed
   */
  private async fetchFeed(feed: RSSFeed): Promise<RSSItem[]> {
    try {
      console.log(`Fetching RSS feed: ${feed.name}`);
      const feedData = await this.parser.parseURL(feed.url);

      const items: RSSItem[] = [];

      for (const item of feedData.items || []) {
        const rssItem: RSSItem = {
          id: this.generateItemId(feed.id, item),
          feedId: feed.id,
          title: item.title || '',
          content: item['content:encoded'] || item.content || item.summary || '',
          summary: item.summary || item.contentSnippet || '',
          author: item.creator || item['dc:creator'] || feedData.title || '',
          publishedDate: new Date(item.pubDate || item.isoDate || Date.now()),
          link: item.link || '',
          categories: item.categories || [],
          tags: [...feed.tags, ...this.extractTagsFromContent(item)],
          relevanceScore: this.calculateRelevanceScore(item, feed.category),
          processed: false
        };

        items.push(rssItem);
      }

      // Update feed's last fetched timestamp
      feed.lastFetched = new Date();

      return items;
    } catch (error) {
      console.error(`Failed to fetch RSS feed ${feed.name}:`, error);
      return [];
    }
  }

  /**
   * Generate unique ID for RSS item
   */
  private generateItemId(feedId: string, item: any): string {
    const content = item.title + item.link + (item.pubDate || '');
    return `rss_${feedId}_${btoa(content).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`;
  }

  /**
   * Extract relevant tags from content
   */
  private extractTagsFromContent(item: any): string[] {
    const content = (item.title + ' ' + (item.content || item.summary || '')).toLowerCase();
    const tags: string[] = [];

    // Training-related keywords
    const trainingKeywords = [
      'strength', 'cardio', 'hiit', 'endurance', 'flexibility', 'mobility',
      'recovery', 'protein', 'carbs', 'fat', 'calories', 'macros', 'supplements',
      'hypertrophy', 'powerlifting', 'olympic', 'crossfit', 'yoga', 'pilates'
    ];

    for (const keyword of trainingKeywords) {
      if (content.includes(keyword)) {
        tags.push(keyword);
      }
    }

    return tags;
  }

  /**
   * Calculate relevance score for training content
   */
  private calculateRelevanceScore(item: any, category: string): number {
    const content = (item.title + ' ' + (item.content || item.summary || '')).toLowerCase();
    let score = 0;

    // Base score by category
    const categoryScores = {
      fitness: 80,
      training: 90,
      nutrition: 85,
      research: 95,
      health: 75
    };
    score += categoryScores[category as keyof typeof categoryScores] || 50;

    // Boost score for evidence-based content
    if (content.includes('study') || content.includes('research') || content.includes('evidence')) {
      score += 15;
    }

    // Boost score for practical applications
    if (content.includes('how to') || content.includes('tips') || content.includes('guide')) {
      score += 10;
    }

    // Boost score for recent content (within 30 days)
    const publishedDate = new Date(item.pubDate || item.isoDate || Date.now());
    const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished <= 30) {
      score += Math.max(0, 15 - daysSincePublished);
    }

    return Math.min(100, score);
  }

  /**
   * Update last fetched timestamps in Coda
   */
  private async updateLastFetchedTimestamps(feeds: RSSFeed[]): Promise<void> {
    try {
      for (const feed of feeds) {
        if (feed.lastFetched) {
          await this.codaAPI.updateRow('RSS Feeds', feed.id, {
            lastFetched: feed.lastFetched.toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Failed to update last fetched timestamps:', error);
    }
  }

  /**
   * Store RSS items in database
   */
  private async storeItemsInDatabase(items: RSSItem[]): Promise<void> {
    try {
      // This would integrate with your Convex database
      console.log(`Storing ${items.length} RSS items in database`);

      // Example: await api.mutations.rss.storeItems({ items });

    } catch (error) {
      console.error('Failed to store RSS items in database:', error);
    }
  }

  /**
   * Process RSS content for training insights
   */
  async processContentForInsights(items: RSSItem[]): Promise<TrainingInsight[]> {
    const insights: TrainingInsight[] = [];

    for (const item of items) {
      if (item.processed || item.relevanceScore < 70) continue;

      const insight = await this.extractTrainingInsight(item);
      if (insight) {
        insights.push(insight);
        item.processed = true;
      }
    }

    return insights;
  }

  /**
   * Extract training insight from RSS item
   */
  private async extractTrainingInsight(item: RSSItem): Promise<TrainingInsight | null> {
    try {
      // Use AI to analyze content and extract insights
      const insight: TrainingInsight = {
        id: `insight_${item.id}`,
        source: 'rss',
        title: item.title,
        content: item.summary || item.content.substring(0, 500),
        category: this.mapTagsToCategory(item.tags),
        tags: item.tags,
        confidence: item.relevanceScore / 100,
        publishedDate: item.publishedDate,
        url: item.link,
        keyTakeaways: await this.extractKeyTakeaways(item),
        applicability: this.determineApplicability(item)
      };

      return insight;
    } catch (error) {
      console.error('Failed to extract training insight:', error);
      return null;
    }
  }

  /**
   * Map tags to training category
   */
  private mapTagsToCategory(tags: string[]): string {
    const categoryMap: Record<string, string> = {
      strength: 'strength_training',
      cardio: 'cardiovascular',
      hiit: 'high_intensity',
      endurance: 'endurance',
      flexibility: 'mobility',
      mobility: 'mobility',
      recovery: 'recovery',
      protein: 'nutrition',
      carbs: 'nutrition',
      fat: 'nutrition',
      calories: 'nutrition',
      macros: 'nutrition',
      supplements: 'nutrition'
    };

    for (const tag of tags) {
      if (categoryMap[tag]) {
        return categoryMap[tag];
      }
    }

    return 'general_fitness';
  }

  /**
   * Extract key takeaways from content
   */
  private async extractKeyTakeaways(item: RSSItem): Promise<string[]> {
    const takeaways: string[] = [];

    // Simple extraction based on content structure
    const content = item.content || item.summary;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);

    // Take first 3 meaningful sentences as takeaways
    for (let i = 0; i < Math.min(3, sentences.length); i++) {
      takeaways.push(sentences[i].trim());
    }

    return takeaways;
  }

  /**
   * Determine training applicability level
   */
  private determineApplicability(item: RSSItem): 'general' | 'beginner' | 'intermediate' | 'advanced' {
    const content = (item.title + ' ' + item.content).toLowerCase();

    if (content.includes('beginner') || content.includes('novice') || content.includes('starter')) {
      return 'beginner';
    }

    if (content.includes('advanced') || content.includes('expert') || content.includes('elite')) {
      return 'advanced';
    }

    if (content.includes('intermediate') || content.includes('moderate')) {
      return 'intermediate';
    }

    return 'general';
  }

  /**
   * Set up automatic RSS feed fetching
   */
  setupAutoFetch(intervalHours: number = 6): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    const intervalMs = intervalHours * 60 * 60 * 1000;
    this.processingInterval = setInterval(async () => {
      console.log('Auto-fetching RSS feeds...');
      await this.fetchAllFeeds();
    }, intervalMs);

    // Initial fetch
    this.fetchAllFeeds();
  }

  /**
   * Stop automatic fetching
   */
  stopAutoFetch(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Get RSS feeds by category
   */
  getFeedsByCategory(category: string): RSSFeed[] {
    return Array.from(this.feeds.values()).filter(feed =>
      feed.category === category && feed.isActive
    );
  }

  /**
   * Get high-relevance items
   */
  getHighRelevanceItems(minScore: number = 80): RSSItem[] {
    const items = get(rssFeedStore).items;
    return items.filter(item => item.relevanceScore >= minScore);
  }

  /**
   * Search RSS content
   */
  searchContent(query: string, category?: string): RSSItem[] {
    const items = get(rssFeedStore).items;
    const queryLower = query.toLowerCase();

    return items.filter(item => {
      if (category && !item.tags.includes(category)) return false;

      const searchableText = (item.title + ' ' + item.content + ' ' + item.tags.join(' ')).toLowerCase();
      return searchableText.includes(queryLower);
    });
  }

  /**
   * Export training insights for AI training
   */
  async exportForTraining(): Promise<string> {
    const items = this.getHighRelevanceItems(75);
    const insights = await this.processContentForInsights(items);

    // Format for AI training
    const trainingData = insights.map(insight => ({
      text: `${insight.title}\n\n${insight.content}\n\nKey takeaways: ${insight.keyTakeaways.join('. ')}\n\nCategory: ${insight.category}\nTags: ${insight.tags.join(', ')}`,
      category: insight.category,
      applicability: insight.applicability,
      confidence: insight.confidence
    }));

    return JSON.stringify(trainingData, null, 2);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopAutoFetch();
  }
}