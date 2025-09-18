import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

// Get all published training programs for the marketplace
export const getMarketplacePrograms = query({
  args: {
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    maxPrice: v.optional(v.number()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("trainingPrograms")
      .filter(q => q.eq(q.field("isPublished"), true));

    // We'll apply category filtering after fetching since `category` is an array field

    if (args.difficulty) {
      query = query.filter(q => q.eq(q.field("difficulty"), args.difficulty));
    }

    const maxPrice = args.maxPrice;
    if (maxPrice !== undefined && maxPrice !== null) {
      query = query.filter(q => q.lte(q.field("price"), maxPrice));
    }

    const programs = await query
      .order("desc")
      .take(args.limit || 20);

    // Get trainer info for each program
    const programsWithTrainer = await Promise.all(
      programs.map(async (program) => {
        const trainer = program.trainerId ? await ctx.db.get(program.trainerId) : null;
        return {
          ...program,
          trainer: trainer ? {
            _id: trainer._id,
            name: trainer.name,
            profileImage: trainer.profileImage,
            rating: trainer.rating,
            totalClients: trainer.totalClients,
            isVerified: trainer.isVerified,
            specialties: trainer.specialties,
          } : null,
        };
      })
    );

    // Apply category filter client-side if requested
    let filteredPrograms = programsWithTrainer;
    if (args.category) {
      filteredPrograms = filteredPrograms.filter(p => Array.isArray(p.category) && p.category.includes(args.category as string));
    }

    // Filter by search term if provided
    if (args.search) {
      const searchTerm = args.search.toLowerCase();
      return filteredPrograms.filter(program =>
        program.name.toLowerCase().includes(searchTerm) ||
        program.description.toLowerCase().includes(searchTerm) ||
        program.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        program.trainer?.name.toLowerCase().includes(searchTerm)
      );
    }

    return filteredPrograms;
  },
});

// Get trainers available for custom coaching
export const getAvailableTrainers = query({
  args: {
    specialty: v.optional(v.string()),
    maxHourlyRate: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db.query("users")
      .filter(q => q.eq(q.field("role"), "trainer"))
      .filter(q => q.eq(q.field("isVerified"), true));

    const trainers = await query.collect();

    let filteredTrainers = trainers;

    if (args.specialty) {
      filteredTrainers = filteredTrainers.filter(trainer =>
        !!trainer.specialties && trainer.specialties.includes(args.specialty as string)
      );
    }

    const maxHourlyRate = args.maxHourlyRate;
    if (maxHourlyRate !== undefined && maxHourlyRate !== null) {
      filteredTrainers = filteredTrainers.filter(trainer =>
        typeof trainer.hourlyRate === 'number' && trainer.hourlyRate <= maxHourlyRate
      );
    }

    if (args.search) {
      const searchTerm = args.search.toLowerCase();
      filteredTrainers = filteredTrainers.filter(trainer =>
        trainer.name.toLowerCase().includes(searchTerm) ||
        trainer.bio?.toLowerCase().includes(searchTerm) ||
        trainer.specialties?.some(specialty => specialty.toLowerCase().includes(searchTerm))
      );
    }

    // Get recent program stats for each trainer
    const trainersWithStats = await Promise.all(
      filteredTrainers.map(async (trainer) => {
        const programs = await ctx.db.query("trainingPrograms")
          .filter(q => q.eq(q.field("trainerId"), trainer._id))
          .filter(q => q.eq(q.field("isPublished"), true))
          .collect();

        const recentPurchases = await ctx.db.query("programPurchases")
          .filter(q => q.eq(q.field("trainerId"), trainer._id))
          .filter(q => q.eq(q.field("paymentStatus"), "completed"))
          .order("desc")
          .take(30);

        return {
          ...trainer,
          stats: {
            totalPrograms: programs.length,
            recentSales: recentPurchases.length,
            avgRating: trainer.rating || 0,
          },
        };
      })
    );

    return trainersWithStats.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  },
});

// Purchase a training program
export const purchaseProgram = mutation({
  args: {
    programId: v.id("trainingPrograms"),
    paymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const program = await ctx.db.get(args.programId);
    if (!program) {
      throw new Error("Program not found");
    }

    if (!program.isPublished) {
      throw new Error("Program is not available for purchase");
    }

    // Check if user already owns this program
    const existingPurchase = await ctx.db.query("programPurchases")
      .filter(q => q.eq(q.field("userId"), user._id))
      .filter(q => q.eq(q.field("programId"), args.programId))
      .filter(q => q.eq(q.field("paymentStatus"), "completed"))
      .first();

    if (existingPurchase) {
      throw new Error("You already own this program");
    }


    // Commission logic: 20% after Apple/Google tax markup for one-time purchases
    const platformFee = Math.round(program.price * 0.20 * 100) / 100;
    const trainerEarnings = program.price - platformFee;

    // Store the JSON of the purchased plan for mobile app
    let planJson = "{}";
    if (typeof program.jsonData === "string" && program.jsonData.length > 0) {
      planJson = program.jsonData;
    }

    // Create purchase record
    const purchaseId = await ctx.db.insert("programPurchases", {
      userId: user._id,
      programId: args.programId,
      trainerId: program.trainerId!,
      purchaseType: "program",
      amount: program.price,
      planJson,
      platformFee,
      trainerEarnings,
      paymentStatus: "completed",
      paymentIntentId: args.paymentIntentId,
      purchaseDate: new Date().toISOString(),
    });

    // Create user program instance
    await ctx.db.insert("userPrograms", {
      userId: user._id,
      programId: args.programId,
      startDate: new Date().toISOString(),
      currentDay: 1,
      currentWeek: 1,
      isCompleted: false,
      progress: 0,
      purchaseDate: new Date().toISOString(),
    });

    // Create revenue transaction
    await ctx.db.insert("revenueTransactions", {
      type: "program_purchase",
      referenceId: purchaseId,
      trainerId: program.trainerId!,
      clientId: user._id,
      grossAmount: program.price,
      platformFee,
      trainerEarnings,
      netPlatformEarnings: platformFee, // Assuming no processing fees for now
      payoutStatus: "pending",
      transactionDate: new Date().toISOString(),
      metadata: {
        programName: program.name,
        paymentMethod: "stripe",
      },
    });

    // Update program purchase count
    await ctx.db.patch(args.programId, {
      totalPurchases: (program.totalPurchases || 0) + 1,
    });

    return purchaseId;
  },
});

// Request custom coaching service
export const requestCustomCoaching = mutation({
  args: {
    trainerId: v.id("users"),
    serviceType: v.union(v.literal("custom_program"), v.literal("ongoing_coaching"), v.literal("consultation")),
    title: v.string(),
    description: v.string(),
    duration: v.optional(v.number()),
    clientNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const trainer = await ctx.db.get(args.trainerId);
    if (!trainer || trainer.role !== "trainer") {
      throw new Error("Trainer not found");
    }

    if (!trainer.hourlyRate) {
      throw new Error("Trainer has not set hourly rate");
    }

    // Calculate price based on service type and trainer's hourly rate
    let basePrice = trainer.hourlyRate;
    if (args.serviceType === "custom_program") {
      basePrice *= 4; // Assume 4 hours for custom program creation
    } else if (args.serviceType === "ongoing_coaching" && args.duration) {
      basePrice *= args.duration; // Duration in weeks, 1 hour per week
    }

    // Calculate commission (20% for custom services)
    const platformFee = basePrice * 0.20;
    const trainerEarnings = basePrice * 0.80;

    const serviceId = await ctx.db.insert("coachingServices", {
      trainerId: args.trainerId,
      clientId: user._id,
      serviceType: args.serviceType,
      title: args.title,
      description: args.description,
      price: basePrice,
      duration: args.duration,
      status: "pending",
      paymentStatus: "pending",
      platformFee,
      trainerEarnings,
      requestedAt: new Date().toISOString(),
      clientNotes: args.clientNotes,
    });

    // Send notification message to trainer
    await ctx.db.insert("trainerClientMessages", {
      senderId: user._id,
      receiverId: args.trainerId,
      serviceId,
      messageType: "system",
      subject: `New ${args.serviceType.replace('_', ' ')} request`,
      content: `${user.name} has requested ${args.title}. Price: $${basePrice.toFixed(2)}`,
      isRead: false,
      sentAt: new Date().toISOString(),
    });

    return serviceId;
  },
});

// Trainer accepts/rejects coaching request
export const handleCoachingRequest = mutation({
  args: {
    serviceId: v.id("coachingServices"),
    action: v.union(v.literal("accept"), v.literal("reject")),
    trainerNotes: v.optional(v.string()),
    adjustedPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || user.role !== "trainer") {
      throw new Error("Only trainers can handle coaching requests");
    }

    const service = await ctx.db.get(args.serviceId);
    if (!service || service.trainerId !== user._id) {
      throw new Error("Service not found or unauthorized");
    }

    if (service.status !== "pending") {
      throw new Error("Service request is no longer pending");
    }

    if (args.action === "accept") {
      let finalPrice = service.price;
      let finalPlatformFee = service.platformFee;
      let finalTrainerEarnings = service.trainerEarnings;

      // If trainer adjusted the price
      if (args.adjustedPrice && args.adjustedPrice !== service.price) {
        finalPrice = args.adjustedPrice;
        finalPlatformFee = finalPrice * 0.20;
        finalTrainerEarnings = finalPrice * 0.80;
      }

      await ctx.db.patch(args.serviceId, {
        status: "active",
        acceptedAt: new Date().toISOString(),
        trainerNotes: args.trainerNotes,
        price: finalPrice,
        platformFee: finalPlatformFee,
        trainerEarnings: finalTrainerEarnings,
      });

      // Notify client
      await ctx.db.insert("trainerClientMessages", {
        senderId: user._id,
        receiverId: service.clientId,
        serviceId: args.serviceId,
        messageType: "system",
        subject: "Coaching request accepted",
        content: `Your request for "${service.title}" has been accepted. Price: $${finalPrice.toFixed(2)}`,
        isRead: false,
        sentAt: new Date().toISOString(),
      });
    } else {
      await ctx.db.patch(args.serviceId, {
        status: "cancelled",
        trainerNotes: args.trainerNotes,
      });

      // Notify client
      await ctx.db.insert("trainerClientMessages", {
        senderId: user._id,
        receiverId: service.clientId,
        serviceId: args.serviceId,
        messageType: "system",
        subject: "Coaching request declined",
        content: `Your request for "${service.title}" has been declined. ${args.trainerNotes || ''}`,
        isRead: false,
        sentAt: new Date().toISOString(),
      });
    }

    return args.serviceId;
  },
});

// Get user's purchased programs
export const getUserPurchases = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const purchases = await ctx.db.query("programPurchases")
      .filter(q => q.eq(q.field("userId"), user._id))
      .filter(q => q.eq(q.field("paymentStatus"), "completed"))
      .order("desc")
      .collect();

    const purchasesWithPrograms = await Promise.all(
      purchases.map(async (purchase) => {
        const program = await ctx.db.get(purchase.programId);
        const trainer = await ctx.db.get(purchase.trainerId);
        const userProgram = await ctx.db.query("userPrograms")
          .filter(q => q.eq(q.field("userId"), user._id))
          .filter(q => q.eq(q.field("programId"), purchase.programId))
          .first();

        return {
          ...purchase,
          program,
          trainer: trainer ? {
            name: trainer.name,
            profileImage: trainer.profileImage,
          } : null,
          userProgress: userProgram,
        };
      })
    );

    return purchasesWithPrograms;
  },
});

// Get trainer's coaching services
export const getTrainerServices = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || user.role !== "trainer") {
      throw new Error("Only trainers can view coaching services");
    }

    let query = ctx.db.query("coachingServices")
      .filter(q => q.eq(q.field("trainerId"), user._id));

    if (args.status) {
      query = query.filter(q => q.eq(q.field("status"), args.status));
    }

    const services = await query.order("desc").collect();

    const servicesWithClients = await Promise.all(
      services.map(async (service) => {
        const client = await ctx.db.get(service.clientId);
        return {
          ...service,
          client: client ? {
            name: client.name,
            profileImage: client.profileImage,
            email: client.email,
          } : null,
        };
      })
    );

    return servicesWithClients;
  },
});

// Get trainer revenue dashboard
export const getTrainerRevenue = query({
  args: {
    period: v.optional(v.string()), // "week", "month", "year"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || user.role !== "trainer") {
      throw new Error("Only trainers can view revenue");
    }

    // Get all revenue transactions for this trainer
    const transactions = await ctx.db.query("revenueTransactions")
      .filter(q => q.eq(q.field("trainerId"), user._id))
      .order("desc")
      .collect();

    // Calculate totals
    const totalEarnings = transactions.reduce((sum, t) => sum + t.trainerEarnings, 0);
    const pendingPayouts = transactions
      .filter(t => t.payoutStatus === "pending")
      .reduce((sum, t) => sum + t.trainerEarnings, 0);

    // Get recent payouts
    const payouts = await ctx.db.query("trainerPayouts")
      .filter(q => q.eq(q.field("trainerId"), user._id))
      .order("desc")
      .take(10);

    return {
      totalEarnings,
      pendingPayouts,
      recentTransactions: transactions.slice(0, 20),
      recentPayouts: payouts,
      stats: {
        totalTransactions: transactions.length,
        avgTransactionValue: transactions.length > 0 ? totalEarnings / transactions.length : 0,
      },
    };
  },
});