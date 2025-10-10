/**
 * Marketplace Purchase API Route
 * POST /api/marketplace/purchase - Purchase a video from marketplace
 */

import { json } from '@sveltejs/kit';
import { api } from '$lib/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const CONVEX_URL = process.env.CONVEX_URL || 'https://your-convex-deployment.convex.cloud';
const convex = new ConvexHttpClient(CONVEX_URL);

export const POST = async ({ request }: any) => {
  try {
    const { userId, videoId, paymentMethod } = await request.json();

    // Validate required fields
    if (!userId || !videoId || !paymentMethod) {
      return json({
        success: false,
        error: 'Missing required fields: userId, videoId, paymentMethod'
      }, { status: 400 });
    }

    const result = await convex.mutation(api.functions.marketplace.purchaseVideo, {
      userId,
      videoId, 
      paymentMethod
    });

    return json(result);
  } catch (error: unknown) {
    console.error('Purchase video error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to purchase video';
    
    return json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
};

export const GET = async ({ url }: any) => {
  try {
    const userId = url.searchParams.get('userId');
    const includeDetails = url.searchParams.get('includeDetails') === 'true';

    if (!userId) {
      return json({
        success: false,
        error: 'Missing required parameter: userId'
      }, { status: 400 });
    }

    const result = await convex.query(api.functions.marketplace.getUserPurchases, {
      userId,
      includeDetails
    });

    return json({
      success: true,
      data: result
    });
  } catch (error: unknown) {
    console.error('Get user purchases error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to get purchases';
    
    return json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
};