// File: foodDatabaseService.ts

/**
 * Food Database Service
 * Purpose: Unified interface for food search across multiple APIs (Open Food Facts, USDA)
 */

import type { FoodItem, NutritionInfo, ServingSize } from './nutritionCalculator';

export interface FoodSearchResult {
  items: FoodItem[];
  totalResults: number;
  page: number;
  hasMore: boolean;
}

export interface BarcodeResult {
  found: boolean;
  food?: FoodItem;
  source: 'cache' | 'openfoodfacts' | 'usda' | 'manual';
}

/**
 * Unified Food Database Service
 * Integrates with Open Food Facts and USDA FoodData Central APIs
 */
export class FoodDatabaseService {
  private cache: Map<string, FoodItem> = new Map();
  private barcodeCache: Map<string, FoodItem> = new Map();
  private recentSearches: string[] = [];
  private favorites: Set<string> = new Set();

  private readonly OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v0';
  private readonly USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1';
  private readonly USDA_API_KEY = process.env.USDA_API_KEY || '';

  /**
   * Search for foods across multiple databases
   */
  async searchFoods(
    query: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<FoodSearchResult> {
    // Add to recent searches
    this.addToRecentSearches(query);

    try {
      // Search both APIs in parallel
      const [openFoodResults, usdaResults] = await Promise.allSettled([
        this.searchOpenFoodFacts(query, limit / 2),
        this.searchUSDA(query, limit / 2)
      ]);

      const combinedResults: FoodItem[] = [];

      // Process Open Food Facts results
      if (openFoodResults.status === 'fulfilled') {
        combinedResults.push(...openFoodResults.value);
      }

      // Process USDA results
      if (usdaResults.status === 'fulfilled') {
        combinedResults.push(...usdaResults.value);
      }

      // Remove duplicates and sort by relevance
      const uniqueResults = this.deduplicateResults(combinedResults, query);
      const sortedResults = this.sortByRelevance(uniqueResults, query);

      // Paginate results
      const startIndex = (page - 1) * limit;
      const paginatedResults = sortedResults.slice(startIndex, startIndex + limit);

      return {
        items: paginatedResults,
        totalResults: sortedResults.length,
        page,
        hasMore: startIndex + limit < sortedResults.length
      };
    } catch (error) {
      console.error('Food search error:', error);
      return {
        items: [],
        totalResults: 0,
        page,
        hasMore: false
      };
    }
  }

  /**
   * Lookup food by barcode
   */
  async lookupByBarcode(barcode: string): Promise<BarcodeResult> {
    // Check cache first
    if (this.barcodeCache.has(barcode)) {
      return {
        found: true,
        food: this.barcodeCache.get(barcode),
        source: 'cache'
      };
    }

    try {
      // Try Open Food Facts first (has good barcode coverage)
      const openFoodResult = await this.lookupOpenFoodFactsBarcode(barcode);
      if (openFoodResult) {
        this.barcodeCache.set(barcode, openFoodResult);
        return {
          found: true,
          food: openFoodResult,
          source: 'openfoodfacts'
        };
      }

      // Fallback to manual entry
      return {
        found: false,
        source: 'manual'
      };
    } catch (error) {
      console.error('Barcode lookup error:', error);
      return {
        found: false,
        source: 'manual'
      };
    }
  }

  /**
   * Get food details by ID
   */
  async getFoodDetails(foodId: string): Promise<FoodItem | null> {
    // Check cache
    if (this.cache.has(foodId)) {
      return this.cache.get(foodId) || null;
    }

    try {
      // Determine source from ID format
      if (foodId.startsWith('off_')) {
        return await this.getOpenFoodFactsDetails(foodId.replace('off_', ''));
      } else if (foodId.startsWith('usda_')) {
        return await this.getUSDADetails(foodId.replace('usda_', ''));
      }
      
      return null;
    } catch (error) {
      console.error('Get food details error:', error);
      return null;
    }
  }

  /**
   * Add food to favorites
   */
  addToFavorites(foodId: string): void {
    this.favorites.add(foodId);
    // TODO: Persist to backend
  }

  /**
   * Remove food from favorites
   */
  removeFromFavorites(foodId: string): void {
    this.favorites.delete(foodId);
    // TODO: Persist to backend
  }

  /**
   * Get user's favorite foods
   */
  async getFavorites(): Promise<FoodItem[]> {
    const favoriteItems: FoodItem[] = [];
    
    for (const foodId of this.favorites) {
      const food = await this.getFoodDetails(foodId);
      if (food) {
        favoriteItems.push(food);
      }
    }
    
    return favoriteItems;
  }

  /**
   * Get recent searches
   */
  getRecentSearches(): string[] {
    return [...this.recentSearches];
  }

  /**
   * Create custom food item
   */
  async createCustomFood(
    name: string,
    nutrition: NutritionInfo,
    servingSizes: ServingSize[],
    category: string = 'custom'
  ): Promise<FoodItem> {
    const customFood: FoodItem = {
      id: `custom_${Date.now()}`,
      name,
      nutritionPer100g: nutrition,
      servingSizes,
      category,
      verified: false
    };

    // Cache the custom food
    this.cache.set(customFood.id, customFood);
    
    // TODO: Save to backend
    
    return customFood;
  }

  // Private methods for API integrations

  private async searchOpenFoodFacts(query: string, limit: number): Promise<FoodItem[]> {
    const url = `${this.OPEN_FOOD_FACTS_URL}/cgi/search.pl`;
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: limit.toString()
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    return (data.products || []).map((product: any) => this.parseOpenFoodFactsProduct(product));
  }

  private async lookupOpenFoodFactsBarcode(barcode: string): Promise<FoodItem | null> {
    const url = `${this.OPEN_FOOD_FACTS_URL}/product/${barcode}.json`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 1 && data.product) {
      return this.parseOpenFoodFactsProduct(data.product);
    }

    return null;
  }

  private async getOpenFoodFactsDetails(productId: string): Promise<FoodItem | null> {
    const url = `${this.OPEN_FOOD_FACTS_URL}/product/${productId}.json`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 1 && data.product) {
      const food = this.parseOpenFoodFactsProduct(data.product);
      this.cache.set(food.id, food);
      return food;
    }

    return null;
  }

  private parseOpenFoodFactsProduct(product: any): FoodItem {
    const nutriments = product.nutriments || {};
    
    return {
      id: `off_${product.code || product.id}`,
      name: product.product_name || product.product_name_en || 'Unknown Product',
      brand: product.brands,
      barcode: product.code,
      nutritionPer100g: {
        calories: nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0,
        protein: nutriments['proteins_100g'] || nutriments.proteins || 0,
        carbs: nutriments['carbohydrates_100g'] || nutriments.carbohydrates || 0,
        fat: nutriments['fat_100g'] || nutriments.fat || 0,
        fiber: nutriments['fiber_100g'] || nutriments.fiber || 0,
        sugar: nutriments['sugars_100g'] || nutriments.sugars || 0,
        sodium: (nutriments['sodium_100g'] || nutriments.sodium || 0) * 1000 // Convert to mg
      },
      servingSizes: this.generateStandardServingSizes(),
      category: product.categories_hierarchy?.[0] || 'general',
      verified: true
    };
  }

  private async searchUSDA(query: string, limit: number): Promise<FoodItem[]> {
    if (!this.USDA_API_KEY) {
      return []; // No API key available
    }

    const url = `${this.USDA_API_URL}/foods/search`;
    const params = {
      query,
      pageSize: limit,
      api_key: this.USDA_API_KEY
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();
    
    return (data.foods || []).map((food: any) => this.parseUSDAFood(food));
  }

  private async getUSDADetails(fdcId: string): Promise<FoodItem | null> {
    if (!this.USDA_API_KEY) {
      return null;
    }

    const url = `${this.USDA_API_URL}/food/${fdcId}?api_key=${this.USDA_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.fdcId) {
      const food = this.parseUSDAFood(data);
      this.cache.set(food.id, food);
      return food;
    }

    return null;
  }

  private parseUSDAFood(food: any): FoodItem {
    const nutrients = food.foodNutrients || [];
    
    const getNutrientValue = (nutrientId: number): number => {
      const nutrient = nutrients.find((n: any) => n.nutrient?.id === nutrientId);
      return nutrient?.amount || 0;
    };

    return {
      id: `usda_${food.fdcId}`,
      name: food.description || 'Unknown Food',
      nutritionPer100g: {
        calories: getNutrientValue(1008), // Energy
        protein: getNutrientValue(1003), // Protein
        carbs: getNutrientValue(1005), // Carbohydrates
        fat: getNutrientValue(1004), // Total lipid (fat)
        fiber: getNutrientValue(1079), // Fiber, total dietary
        sugar: getNutrientValue(2000), // Sugars, total
        sodium: getNutrientValue(1093) // Sodium
      },
      servingSizes: this.generateStandardServingSizes(),
      category: food.foodCategory?.description || 'general',
      verified: true
    };
  }

  private generateStandardServingSizes(): ServingSize[] {
    return [
      { name: '100g', grams: 100, description: '100 grams' },
      { name: '1 cup', grams: 150, description: '1 cup (approx)' },
      { name: '1 serving', grams: 200, description: '1 standard serving' },
      { name: '1 small', grams: 100, description: '1 small portion' },
      { name: '1 medium', grams: 150, description: '1 medium portion' },
      { name: '1 large', grams: 200, description: '1 large portion' }
    ];
  }

  private deduplicateResults(results: FoodItem[], query: string): FoodItem[] {
    const seen = new Set<string>();
    const unique: FoodItem[] = [];

    for (const item of results) {
      const key = `${item.name.toLowerCase()}_${item.brand?.toLowerCase() || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }

    return unique;
  }

  private sortByRelevance(results: FoodItem[], query: string): FoodItem[] {
    const queryLower = query.toLowerCase();
    
    return results.sort((a, b) => {
      // Exact name match gets highest priority
      const aExact = a.name.toLowerCase() === queryLower ? 1 : 0;
      const bExact = b.name.toLowerCase() === queryLower ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;

      // Name starts with query gets second priority
      const aStarts = a.name.toLowerCase().startsWith(queryLower) ? 1 : 0;
      const bStarts = b.name.toLowerCase().startsWith(queryLower) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;

      // Name contains query gets third priority
      const aContains = a.name.toLowerCase().includes(queryLower) ? 1 : 0;
      const bContains = b.name.toLowerCase().includes(queryLower) ? 1 : 0;
      if (aContains !== bContains) return bContains - aContains;

      // Verified foods get priority over unverified
      const aVerified = a.verified ? 1 : 0;
      const bVerified = b.verified ? 1 : 0;
      if (aVerified !== bVerified) return bVerified - aVerified;

      // Finally sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }

  private addToRecentSearches(query: string): void {
    // Remove if already exists
    const index = this.recentSearches.indexOf(query);
    if (index > -1) {
      this.recentSearches.splice(index, 1);
    }

    // Add to beginning
    this.recentSearches.unshift(query);

    // Keep only last 10 searches
    this.recentSearches = this.recentSearches.slice(0, 10);
  }
}