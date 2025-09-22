/**
 * Example usage of RSS Feed Integration for AI Training Data
 *
 * This demonstrates how to connect Coda RSS feeds with the AI coaching system
 */

import { getRSSIntegration } from '../services/rssFeedIntegration.js';

// Example configuration - replace with your actual Coda credentials
const CODA_API_KEY = 'your-coda-api-key-here';
const CODA_DOC_ID = 'your-coda-doc-id-here';

export async function setupRSSIntegration() {
  try {
    // Initialize RSS integration
    const rssIntegration = getRSSIntegration(CODA_API_KEY, CODA_DOC_ID);
    await rssIntegration.initialize();

    console.log('RSS Integration initialized successfully');

    // Setup automatic fetching every 6 hours
    rssIntegration.setupAutoFetch(6);

    return rssIntegration;
  } catch (error) {
    console.error('Failed to setup RSS integration:', error);
    return null;
  }
}

export async function refreshAndExportTrainingData() {
  try {
    const rssIntegration = getRSSIntegration();

    if (!rssIntegration) {
      throw new Error('RSS integration not initialized');
    }

    // Refresh all RSS feeds
    await rssIntegration.refreshAllFeeds();

    // Get training insights
    const trainingData = await rssIntegration.getTrainingData();
    console.log(`Found ${trainingData.length} training insights`);

    // Export for AI training
    const exportedData = await rssIntegration.exportForTraining();
    console.log('Training data exported successfully');

    return {
      insights: trainingData,
      exportedData: exportedData
    };
  } catch (error) {
    console.error('Failed to refresh and export training data:', error);
    return null;
  }
}

export async function searchFitnessContent(query: string) {
  try {
    const rssIntegration = getRSSIntegration();

    if (!rssIntegration) {
      throw new Error('RSS integration not initialized');
    }

    // Search for fitness-related content
    const results = rssIntegration.searchContent(query, 'fitness');
    console.log(`Found ${results.length} results for "${query}"`);

    return results;
  } catch (error) {
    console.error('Failed to search content:', error);
    return [];
  }
}

// Example: Integrate with AI training pipeline
export async function integrateWithAITraining() {
  try {
    const rssIntegration = getRSSIntegration();

    if (!rssIntegration) {
      await setupRSSIntegration();
    }

    // Get fresh training data
    const trainingData = await refreshAndExportTrainingData();

    if (trainingData) {
      // This data can now be fed into your AI training pipeline
      console.log('Training data ready for AI model:');
      console.log('- Insights:', trainingData.insights.length);
      console.log('- Exported data size:', trainingData.exportedData.length, 'characters');

      // Example: Send to AI training service
      // await sendToAITraining(trainingData.exportedData);

      return trainingData;
    }
  } catch (error) {
    console.error('Failed to integrate with AI training:', error);
  }
}

/**
 * Coda Document Setup Instructions:
 *
 * 1. Create a new Coda document for RSS feeds
 * 2. Create a table called "RSS Feeds" with columns:
 *    - Name (text)
 *    - URL (text)
 *    - Category (select: fitness, nutrition, training, research, health)
 *    - IsActive (checkbox, default: true)
 *    - Tags (multi-select or text)
 *    - LastFetched (date/time)
 *
 * 3. Add your RSS feed URLs to the table
 * 4. Get your Coda API key from https://coda.io/account
 * 5. Get your document ID from the Coda URL
 *
 * Example RSS feeds to add:
 * - https://www.bodybuilding.com/rss/articles/training
 * - https://www.muscleandfitness.com/rss/articles
 * - https://www.t-nation.com/rss
 * - https://www.strongerbyscience.com/feed/
 * - https://bayesianbodybuilding.com/feed/
 */