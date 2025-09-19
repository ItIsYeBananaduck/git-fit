import { ConvexHttpClient } from "convex/browser";

// Create Convex client - using a placeholder URL for now
// In production, this would come from environment variables
const convexUrl = import.meta.env.VITE_CONVEX_URL;

let convexClient: ConvexHttpClient | null = null;

// Only initialize if we have a proper Convex URL
if (convexUrl && convexUrl !== "https://convex-cloud.com") {
  try {
    convexClient = new ConvexHttpClient(convexUrl);
    console.log("Convex client initialized successfully");
  } catch (error) {
    console.warn("Convex client initialization failed, using mock data:", error);
    convexClient = null;
  }
} else {
  console.log("No Convex deployment URL configured, using mock data for development");
}

export const api = {
  query: async (functionName: string, args: Record<string, unknown> = {}) => {
    // If Convex client is available, use it
    if (convexClient) {
      try {
        // Use the function name directly until API is properly deployed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await convexClient.query(functionName as any, args);
      } catch (error) {
        console.warn(`Convex query failed for ${functionName}, using mock data:`, error);
      }
    }
    
    // Fallback to mock data for development
    console.log(`Using mock data for query: ${functionName}`, args);
    
    if (functionName === 'functions/marketplace:getMarketplacePrograms') {
      return [
        {
          _id: '1',
          name: 'Ultimate Strength Training',
          description: 'A comprehensive 12-week strength training program designed to build muscle and increase power.',
          price: 89.99,
          difficulty: 'intermediate',
          duration: 12,
          category: ['Strength Training', 'Muscle Building'],
          rating: 4.8,
          totalPurchases: 156,
          trainer: {
            _id: 't1',
            name: 'Mike Johnson',
            profileImage: null,
            rating: 4.9,
            totalClients: 45,
            isVerified: true,
            specialties: ['Strength Training', 'Powerlifting']
          }
        },
        {
          _id: '2',
          name: 'HIIT Fat Burn Challenge',
          description: 'High-intensity interval training program to burn fat and improve cardiovascular health.',
          price: 59.99,
          difficulty: 'beginner',
          duration: 8,
          category: ['HIIT', 'Weight Loss', 'Cardio'],
          rating: 4.6,
          totalPurchases: 234,
          trainer: {
            _id: 't2',
            name: 'Sarah Williams',
            profileImage: null,
            rating: 4.7,
            totalClients: 67,
            isVerified: true,
            specialties: ['HIIT', 'Weight Loss']
          }
        }
      ];
    }
    
    if (functionName === 'functions/marketplace:getAvailableTrainers') {
      return [
        {
          _id: 't1',
          name: 'Mike Johnson',
          email: 'mike@example.com',
          role: 'trainer',
          bio: 'Certified personal trainer with 8 years of experience in strength training and powerlifting.',
          hourlyRate: 75,
          rating: 4.9,
          totalClients: 45,
          isVerified: true,
          specialties: ['Strength Training', 'Powerlifting', 'Nutrition'],
          certifications: ['NASM-CPT', 'USA Powerlifting'],
          stats: {
            totalPrograms: 12,
            recentSales: 25,
            avgRating: 4.9
          }
        },
        {
          _id: 't2',
          name: 'Sarah Williams',
          email: 'sarah@example.com',
          role: 'trainer',
          bio: 'Fitness enthusiast specializing in HIIT and weight loss programs for busy professionals.',
          hourlyRate: 65,
          rating: 4.7,
          totalClients: 67,
          isVerified: true,
          specialties: ['HIIT', 'Weight Loss', 'Cardio'],
          certifications: ['ACE-CPT', 'HIIT Certified'],
          stats: {
            totalPrograms: 8,
            recentSales: 18,
            avgRating: 4.7
          }
        }
      ];
    }
    
    return [];
  },
  
  mutation: async (functionName: string, args: Record<string, unknown> = {}) => {
    // If Convex client is available, use it
    if (convexClient) {
      try {
        // Use the function name directly until API is properly deployed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await convexClient.mutation(functionName as any, args);
      } catch (error) {
        console.warn(`Convex mutation failed for ${functionName}, using mock response:`, error);
      }
    }
    
    console.log(`Using mock mutation: ${functionName}`, args);
    return { success: true, id: 'mock_id_' + Date.now() };
  }
};

export default api;