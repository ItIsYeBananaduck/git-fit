/**
 * Mock ConvexTestingHelper for contract tests
 * Since Convex 1.27.0 doesn't export testing utilities, this provides a simple mock
 */

export class ConvexTestingHelper {
  private mockData: Record<string, unknown> = {};

  // Mock database state
  withMockDb(data: Record<string, unknown>) {
    this.mockData = data;
    return this;
  }

  // Mock running mutations  
  async runMutation(name: string, args: Record<string, unknown>) {
    console.log(`Mock mutation: ${name}`, args);
    
    // Return mock data based on function name
    if (name.includes('calculateScore')) {
      return {
        _id: 'mock_intensity_score_id',
        overallScore: 75.5,
        breakdown: {
          tempo: 80,
          motionSmoothness: 70,
          repConsistency: 75,
          userFeedback: 85,
          strainModifier: 65
        }
      };
    }
    
    if (name.includes('updateContext')) {
      return {
        _id: 'mock_coaching_context_id',
        userId: args.userId,
        context: args.context,
        updatedAt: Date.now()
      };
    }
    
    if (name.includes('scanItem')) {
      return {
        _id: 'mock_supplement_item_id',
        barcode: args.barcode,
        name: 'Mock Supplement',
        brand: 'Mock Brand',
        scannedAt: Date.now()
      };
    }
    
    if (name.includes('shareContent')) {
      return {
        _id: 'mock_social_share_id',
        userId: args.userId,
        content: args.content,
        privacy: args.privacy,
        sharedAt: Date.now()
      };
    }
    
    // Default return
    return {
      _id: 'mock_result_id',
      success: true,
      timestamp: Date.now()
    };
  }

  // Mock running queries
  async runQuery(name: string, args: Record<string, unknown>) {
    console.log(`Mock query: ${name}`, args);
    
    if (name.includes('getLatestScore')) {
      return {
        _id: 'mock_score_id',
        overallScore: 75.5,
        timestamp: Date.now()
      };
    }
    
    if (name.includes('getStack')) {
      return {
        _id: 'mock_stack_id',
        name: 'Mock Stack',
        items: [],
        createdAt: Date.now()
      };
    }
    
    if (name.includes('getFeed')) {
      return {
        items: [],
        hasMore: false,
        nextCursor: null
      };
    }
    
    // Default return
    return {
      data: [],
      count: 0
    };
  }

  // Mock running actions
  async runAction(name: string, args: Record<string, unknown>) {
    console.log(`Mock action: ${name}`, args);
    return {
      success: true,
      result: 'Mock action completed',
      timestamp: Date.now()
    };
  }
}

// Export for use in tests
export default ConvexTestingHelper;