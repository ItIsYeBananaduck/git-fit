/**
 * Marketplace Videos API Route
 * POST /api/marketplace/videos - Upload video to marketplace
 * GET /api/marketplace/videos - Search marketplace videos
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { api } from '$lib/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const CONVEX_URL = process.env.CONVEX_URL || 'https://your-convex-deployment.convex.cloud';
const convex = new ConvexHttpClient(CONVEX_URL);

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    // For video upload, we would typically handle file upload here first
    // This is a simplified implementation focusing on the marketplace metadata
    
    const result = await convex.mutation(api.functions.marketplace.uploadMarketplaceVideo, data);
    
    return json(result);
  } catch (error: any) {
    console.error('Upload marketplace video error:', error);
    
    return json({
      success: false,
      error: error.message || 'Failed to upload video'
    }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = {
      query: url.searchParams.get('query') || undefined,
      category: url.searchParams.get('category') || undefined,
      difficulty: url.searchParams.get('difficulty') as any || undefined,
      duration: url.searchParams.get('duration') ? JSON.parse(url.searchParams.get('duration')!) : undefined,
      priceRange: url.searchParams.get('priceRange') ? JSON.parse(url.searchParams.get('priceRange')!) : undefined,
      trainerId: url.searchParams.get('trainerId') || undefined,
      sortBy: url.searchParams.get('sortBy') as any || undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
      offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined
    };

    const result = await convex.query(api.functions.marketplace.searchMarketplaceVideos, searchParams);
    
    return json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Search marketplace videos error:', error);
    
    return json({
      success: false,
      error: error.message || 'Failed to search videos'
    }, { status: 500 });
  }
};