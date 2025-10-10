/**
 * Marketplace Functions
 * Handles video marketplace features including search, purchases, and trainer revenue sharing
 */

import { v } from 'convex/values';
import { mutation, query } from '../_generated/server.js';

/**
 * Search marketplace videos
 * Allows users to discover workout videos with filtering and search capabilities
 */
export const searchMarketplaceVideos = query({
  args: {
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    difficulty: v.optional(v.union(v.literal('beginner'), v.literal('intermediate'), v.literal('advanced'))),
    duration: v.optional(v.object({
      min: v.number(),
      max: v.number()
    })),
    priceRange: v.optional(v.object({
      min: v.number(),
      max: v.number()
    })),
    trainerId: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal('popularity'),
      v.literal('price_low'),
      v.literal('price_high'),
      v.literal('newest'),
      v.literal('rating')
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  handler: async (ctx: any, args: any) => {
    let query = ctx.db.query('marketplace_videos');

    // Apply filters
    if (args.category) {
      query = query.filter((q: any) => q.eq(q.field('category'), args.category));
    }

    if (args.difficulty) {
      query = query.filter((q: any) => q.eq(q.field('difficulty'), args.difficulty));
    }

    if (args.trainerId) {
      query = query.filter((q: any) => q.eq(q.field('trainerId'), args.trainerId));
    }

    if (args.duration) {
      query = query.filter((q: any) => 
        q.and(
          q.gte(q.field('durationMinutes'), args.duration!.min),
          q.lte(q.field('durationMinutes'), args.duration!.max)
        )
      );
    }

    if (args.priceRange) {
      query = query.filter((q: any) => 
        q.and(
          q.gte(q.field('price'), args.priceRange!.min),
          q.lte(q.field('price'), args.priceRange!.max)
        )
      );
    }

    // Only show published videos
    query = query.filter((q: any) => q.eq(q.field('status'), 'published'));

    let videos = await query.collect();

    // Text search in title and description
    if (args.query) {
      const searchTerms = args.query.toLowerCase().split(' ');
      videos = videos.filter((video: any) => {
        const searchableText = `${video.title} ${video.description}`.toLowerCase();
        return searchTerms.some((term: any) => searchableText.includes(term));
      });
    }

    // Sort results
    if (args.sortBy) {
      switch (args.sortBy) {
        case 'popularity':
          videos.sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
          break;
        case 'price_low':
          videos.sort((a: any, b: any) => a.price - b.price);
          break;
        case 'price_high':
          videos.sort((a: any, b: any) => b.price - a.price);
          break;
        case 'newest':
          videos.sort((a: any, b: any) => b.createdAt - a.createdAt);
          break;
        case 'rating':
          videos.sort((a: any, b: any) => (b.averageRating || 0) - (a.averageRating || 0));
          break;
        default:
          videos.sort((a: any, b: any) => b.createdAt - a.createdAt);
      }
    }

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 20;
    const paginatedVideos = videos.slice(offset, offset + limit);

    // Format response
    const formattedVideos = paginatedVideos.map((video: any) => ({
      videoId: video._id,
      title: video.title,
      description: video.description,
      trainerId: video.trainerId,
      trainerName: video.trainerName,
      category: video.category,
      difficulty: video.difficulty,
      durationMinutes: video.durationMinutes,
      price: video.price,
      thumbnailUrl: video.thumbnailUrl,
      previewUrl: video.previewUrl,
      averageRating: video.averageRating || 0,
      reviewCount: video.reviewCount || 0,
      views: video.views || 0,
      tags: video.tags || [],
      createdAt: video.createdAt,
      equipment: video.equipment || []
    }));

    return {
      videos: formattedVideos,
      totalCount: videos.length,
      hasMore: offset + limit < videos.length,
      filters: {
        categories: await getAvailableCategories(ctx),
        priceRange: await getPriceRange(ctx),
        trainers: await getAvailableTrainers(ctx)
      }
    };
  }
});

/**
 * Purchase marketplace video
 * Handles video purchases, payment processing, and access control
 */
export const purchaseVideo = mutation({
  args: {
    userId: v.string(),
    videoId: v.string(),
    paymentMethod: v.object({
      type: v.union(v.literal('credit_card'), v.literal('paypal'), v.literal('apple_pay'), v.literal('google_pay')),
      token: v.string() // Payment processor token
    })
  },
  handler: async (ctx: any, args: any) => {
    // Get video details
    const video = await ctx.db.get(args.videoId as any);
    if (!video) {
      throw new Error('Video not found');
    }

    if (video.status !== 'published') {
      throw new Error('Video is not available for purchase');
    }

    // Check if user already owns this video
    const existingPurchase = await ctx.db
      .query('video_purchases')
      .withIndex('by_user_video', (q: any) => 
        q.eq('userId', args.userId).eq('videoId', args.videoId)
      )
      .first();

    if (existingPurchase) {
      throw new Error('Video already purchased');
    }

    // Get user's subscription tier for discounts
    const userProfile = await ctx.db
      .query('adaptive_user_profiles')
      .withIndex('by_user_id', (q: any) => q.eq('userId', args.userId))
      .first();

    // Calculate final price with subscription discounts
    let finalPrice = video.price;
    let discount = 0;

    if (userProfile?.subscriptionTier === 'pro') {
      discount = 0.1; // 10% discount for Pro users
      finalPrice = video.price * 0.9;
    } else if (userProfile?.subscriptionTier === 'elite') {
      discount = 0.2; // 20% discount for Elite users
      finalPrice = video.price * 0.8;
    }

    // Simulate payment processing
    const paymentResult = await processPayment({
      amount: finalPrice,
      currency: 'USD',
      paymentMethod: args.paymentMethod,
      description: `GitFit Marketplace: ${video.title}`
    });

    if (!paymentResult.success) {
      throw new Error(`Payment failed: ${paymentResult.error}`);
    }

    // Create purchase record
    const purchaseId = await ctx.db.insert('video_purchases', {
      userId: args.userId,
      videoId: args.videoId,
      purchasePrice: finalPrice,
      originalPrice: video.price,
      discount: discount,
      paymentId: paymentResult.paymentId,
      paymentMethod: args.paymentMethod.type,
      purchaseDate: Date.now(),
      accessGranted: true,
      downloadCount: 0,
      lastAccessedAt: null,
      refunded: false
    });

    // Update video statistics
    await ctx.db.patch(video._id, {
      purchaseCount: (video.purchaseCount || 0) + 1,
      revenue: (video.revenue || 0) + finalPrice
    });

    // Calculate trainer revenue (80% to trainer, 20% platform fee)
    const trainerRevenue = finalPrice * 0.8;

    return {
      success: true,
      purchaseId: purchaseId,
      finalPrice: finalPrice,
      discount: discount * 100, // Return as percentage
      paymentId: paymentResult.paymentId,
      accessGranted: true,
      trainerRevenue: trainerRevenue,
      downloadUrl: await generateDownloadUrl(args.videoId),
      message: 'Video purchased successfully'
    };
  }
});

/**
 * Get user's purchased videos
 */
export const getUserPurchases = query({
  args: {
    userId: v.string(),
    includeDetails: v.optional(v.boolean())
  },
  handler: async (ctx: any, args: any) => {
    const purchases = await ctx.db
      .query('video_purchases')
      .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
      .order('desc')
      .collect();

    if (!args.includeDetails) {
      return {
        purchases: purchases.map((p: any) => ({
          purchaseId: p._id,
          videoId: p.videoId,
          purchaseDate: p.purchaseDate,
          purchasePrice: p.purchasePrice,
          accessGranted: p.accessGranted
        })),
        totalSpent: purchases.reduce((sum: any, p: any) => sum + p.purchasePrice, 0),
        totalPurchases: purchases.length
      };
    }

    // Get video details for each purchase
    const purchasesWithDetails = await Promise.all(
      purchases.map(async (purchase: any) => {
        const video = await ctx.db.get(purchase.videoId as any);
        return {
          purchaseId: purchase._id,
          purchaseDate: purchase.purchaseDate,
          purchasePrice: purchase.purchasePrice,
          originalPrice: purchase.originalPrice,
          discount: purchase.discount,
          paymentMethod: purchase.paymentMethod,
          accessGranted: purchase.accessGranted,
          downloadCount: purchase.downloadCount,
          lastAccessedAt: purchase.lastAccessedAt,
          refunded: purchase.refunded,
          video: video ? {
            videoId: video._id,
            title: video.title,
            description: video.description,
            trainerId: video.trainerId,
            trainerName: video.trainerName,
            category: video.category,
            difficulty: video.difficulty,
            durationMinutes: video.durationMinutes,
            thumbnailUrl: video.thumbnailUrl,
            averageRating: video.averageRating || 0,
            reviewCount: video.reviewCount || 0
          } : null,
          downloadUrl: purchase.accessGranted ? await generateDownloadUrl(purchase.videoId) : null
        };
      })
    );

    return {
      purchases: purchasesWithDetails,
      totalSpent: purchases.reduce((sum: any, p: any) => sum + p.purchasePrice, 0),
      totalPurchases: purchases.length,
      totalDownloads: purchases.reduce((sum: any, p: any) => sum + p.downloadCount, 0)
    };
  }
});

// Helper functions
async function getAvailableCategories(ctx: any): Promise<string[]> {
  const videos = await ctx.db.query('marketplace_videos')
    .filter((q: any) => q.eq(q.field('status'), 'published'))
    .collect();
  
  const categories = [...new Set(videos.map((v: any) => v.category))];
  return categories.sort();
}

async function getPriceRange(ctx: any): Promise<{min: number, max: number}> {
  const videos = await ctx.db.query('marketplace_videos')
    .filter((q: any) => q.eq(q.field('status'), 'published'))
    .collect();
  
  if (videos.length === 0) {
    return { min: 0, max: 0 };
  }
  
  const prices = videos.map((v: any) => v.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}

async function getAvailableTrainers(ctx: any): Promise<Array<{id: string, name: string}>> {
  const videos = await ctx.db.query('marketplace_videos')
    .filter((q: any) => q.eq(q.field('status'), 'published'))
    .collect();
  
  const trainers = videos.reduce((acc: any, video: any) => {
    if (!acc.find((t: any) => t.id === video.trainerId)) {
      acc.push({
        id: video.trainerId,
        name: video.trainerName
      });
    }
    return acc;
  }, []);
  
  return trainers.sort((a: any, b: any) => a.name.localeCompare(b.name));
}

async function processPayment(paymentData: any): Promise<{success: boolean, paymentId?: string, error?: string}> {
  // Simulate payment processing
  // In a real implementation, this would integrate with Stripe, PayPal, etc.
  
  if (paymentData.amount <= 0) {
    return { success: false, error: 'Invalid payment amount' };
  }
  
  if (!paymentData.paymentMethod?.token) {
    return { success: false, error: 'Invalid payment method' };
  }
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Generate mock payment ID
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return { success: true, paymentId };
}

async function generateDownloadUrl(videoId: string): Promise<string> {
  // In a real implementation, this would generate a secure, time-limited download URL
  return `https://marketplace.gitfit.app/download/${videoId}?token=${Date.now()}`;
}