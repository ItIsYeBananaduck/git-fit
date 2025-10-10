/**
 * Marketplace Functions
 * Handles video marketplace features including search, purchases, and trainer revenue sharing
 */

import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';

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
  handler: async (ctx, args) => {
    let query = ctx.db.query('marketplace_videos');

    // Apply filters
    if (args.category) {
      query = query.filter((q) => q.eq(q.field('category'), args.category));
    }

    if (args.difficulty) {
      query = query.filter((q) => q.eq(q.field('difficulty'), args.difficulty));
    }

    if (args.trainerId) {
      query = query.filter((q) => q.eq(q.field('trainerId'), args.trainerId));
    }

    if (args.duration) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field('durationMinutes'), args.duration!.min),
          q.lte(q.field('durationMinutes'), args.duration!.max)
        )
      );
    }

    if (args.priceRange) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field('price'), args.priceRange!.min),
          q.lte(q.field('price'), args.priceRange!.max)
        )
      );
    }

    // Only show published videos
    query = query.filter((q) => q.eq(q.field('status'), 'published'));

    let videos = await query.collect();

    // Text search in title and description
    if (args.query) {
      const searchTerms = args.query.toLowerCase().split(' ');
      videos = videos.filter(video => {
        const searchableText = `${video.title} ${video.description}`.toLowerCase();
        return searchTerms.some(term => searchableText.includes(term));
      });
    }

    // Sort results
    if (args.sortBy) {
      switch (args.sortBy) {
        case 'popularity':
          videos.sort((a, b) => (b.views || 0) - (a.views || 0));
          break;
        case 'price_low':
          videos.sort((a, b) => a.price - b.price);
          break;
        case 'price_high':
          videos.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          videos.sort((a, b) => b.createdAt - a.createdAt);
          break;
        case 'rating':
          videos.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
          break;
        default:
          videos.sort((a, b) => b.createdAt - a.createdAt);
      }
    }

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 20;
    const paginatedVideos = videos.slice(offset, offset + limit);

    // Format response
    const formattedVideos = paginatedVideos.map(video => ({
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
  handler: async (ctx, args) => {
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
      .withIndex('by_user_video', (q) => 
        q.eq('userId', args.userId).eq('videoId', args.videoId)
      )
      .first();

    if (existingPurchase) {
      throw new Error('Video already purchased');
    }

    // Get user's subscription tier for discounts
    const userProfile = await ctx.db
      .query('adaptive_user_profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
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
    const platformFee = finalPrice * 0.2;

    // Update trainer earnings
    await updateTrainerEarnings(ctx, video.trainerId, trainerRevenue, args.videoId);

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
 * Returns all videos purchased by a user with access information
 */
export const getUserPurchases = query({
  args: {
    userId: v.string(),
    includeDetails: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query('video_purchases')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();

    if (!args.includeDetails) {
      return {
        purchases: purchases.map(p => ({
          purchaseId: p._id,
          videoId: p.videoId,
          purchaseDate: p.purchaseDate,
          purchasePrice: p.purchasePrice,
          accessGranted: p.accessGranted
        })),
        totalSpent: purchases.reduce((sum, p) => sum + p.purchasePrice, 0),
        totalPurchases: purchases.length
      };
    }

    // Get video details for each purchase
    const purchasesWithDetails = await Promise.all(
      purchases.map(async (purchase) => {
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
      totalSpent: purchases.reduce((sum, p) => sum + p.purchasePrice, 0),
      totalPurchases: purchases.length,
      totalDownloads: purchases.reduce((sum, p) => sum + p.downloadCount, 0)
    };
  }
});

/**
 * Upload marketplace video (for trainers)
 * Allows trainers to upload and list videos for sale
 */
export const uploadMarketplaceVideo = mutation({
  args: {
    trainerId: v.string(),
    videoData: v.object({
      title: v.string(),
      description: v.string(),
      category: v.string(),
      difficulty: v.union(v.literal('beginner'), v.literal('intermediate'), v.literal('advanced')),
      durationMinutes: v.number(),
      price: v.number(),
      videoUrl: v.string(),
      thumbnailUrl: v.string(),
      previewUrl: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      equipment: v.optional(v.array(v.string()))
    })
  },
  handler: async (ctx, args) => {
    // Validate trainer permissions
    const userProfile = await ctx.db
      .query('adaptive_user_profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', args.trainerId))
      .first();

    if (!userProfile || !userProfile.isTrainer) {
      throw new Error('Only verified trainers can upload marketplace videos');
    }

    // Validate video data
    if (args.videoData.price < 0.99) {
      throw new Error('Minimum video price is $0.99');
    }

    if (args.videoData.price > 99.99) {
      throw new Error('Maximum video price is $99.99');
    }

    if (args.videoData.durationMinutes < 1) {
      throw new Error('Minimum video duration is 1 minute');
    }

    // Create video record
    const videoId = await ctx.db.insert('marketplace_videos', {
      trainerId: args.trainerId,
      trainerName: userProfile.displayName || 'Unknown Trainer',
      title: args.videoData.title,
      description: args.videoData.description,
      category: args.videoData.category,
      difficulty: args.videoData.difficulty,
      durationMinutes: args.videoData.durationMinutes,
      price: args.videoData.price,
      videoUrl: args.videoData.videoUrl,
      thumbnailUrl: args.videoData.thumbnailUrl,
      previewUrl: args.videoData.previewUrl || null,
      tags: args.videoData.tags || [],
      equipment: args.videoData.equipment || [],
      status: 'pending_review', // Videos need approval before publishing
      createdAt: Date.now(),
      updatedAt: Date.now(),
      views: 0,
      purchaseCount: 0,
      revenue: 0,
      averageRating: 0,
      reviewCount: 0,
      isActive: true
    });

    return {
      success: true,
      videoId: videoId,
      status: 'pending_review',
      message: 'Video uploaded successfully and is pending review'
    };
  }
});

/**
 * Get trainer earnings and statistics
 */
export const getTrainerEarnings = query({
  args: {
    trainerId: v.string(),
    timeRange: v.optional(v.object({
      startDate: v.number(),
      endDate: v.number()
    }))
  },
  handler: async (ctx, args) => {
    // Get trainer's videos
    const trainerVideos = await ctx.db
      .query('marketplace_videos')
      .withIndex('by_trainer', (q) => q.eq('trainerId', args.trainerId))
      .collect();

    // Get purchases for trainer's videos
    let purchases = await ctx.db
      .query('video_purchases')
      .collect();

    // Filter purchases for trainer's videos
    const trainerVideoIds = trainerVideos.map(v => v._id);
    purchases = purchases.filter(p => trainerVideoIds.includes(p.videoId as any));

    // Apply time range filter if provided
    if (args.timeRange) {
      purchases = purchases.filter(p => 
        p.purchaseDate >= args.timeRange!.startDate && 
        p.purchaseDate <= args.timeRange!.endDate
      );
    }

    // Calculate earnings (80% of purchase price goes to trainer)
    const totalRevenue = purchases.reduce((sum, p) => sum + p.purchasePrice, 0);
    const trainerEarnings = totalRevenue * 0.8;
    const platformFees = totalRevenue * 0.2;

    // Group earnings by video
    const videoEarnings = trainerVideos.map(video => {
      const videoPurchases = purchases.filter(p => p.videoId === video._id);
      const videoRevenue = videoPurchases.reduce((sum, p) => sum + p.purchasePrice, 0);
      
      return {
        videoId: video._id,
        title: video.title,
        price: video.price,
        purchaseCount: videoPurchases.length,
        revenue: videoRevenue,
        trainerEarning: videoRevenue * 0.8,
        views: video.views || 0,
        averageRating: video.averageRating || 0
      };
    });

    return {
      totalEarnings: trainerEarnings,
      totalRevenue: totalRevenue,
      platformFees: platformFees,
      totalPurchases: purchases.length,
      totalVideos: trainerVideos.length,
      publishedVideos: trainerVideos.filter(v => v.status === 'published').length,
      videoEarnings: videoEarnings,
      earningsBreakdown: {
        thisMonth: calculatePeriodEarnings(purchases, 'month') * 0.8,
        thisWeek: calculatePeriodEarnings(purchases, 'week') * 0.8,
        today: calculatePeriodEarnings(purchases, 'day') * 0.8
      }
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

async function updateTrainerEarnings(ctx: any, trainerId: string, earnings: number, videoId: string): Promise<void> {
  // In a real implementation, this would update trainer earnings records
  // For now, we'll just track it in the video purchase record
  console.log(`Trainer ${trainerId} earned $${earnings} from video ${videoId}`);
}

async function generateDownloadUrl(videoId: string): Promise<string> {
  // In a real implementation, this would generate a secure, time-limited download URL
  return `https://marketplace.gitfit.app/download/${videoId}?token=${Date.now()}`;
}

function calculatePeriodEarnings(purchases: any[], period: 'day' | 'week' | 'month'): number {
  const now = Date.now();
  let cutoff: number;
  
  switch (period) {
    case 'day':
      cutoff = now - (24 * 60 * 60 * 1000);
      break;
    case 'week':
      cutoff = now - (7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      cutoff = now - (30 * 24 * 60 * 60 * 1000);
      break;
  }
  
  return purchases
    .filter(p => p.purchaseDate >= cutoff)
    .reduce((sum, p) => sum + p.purchasePrice, 0);
}