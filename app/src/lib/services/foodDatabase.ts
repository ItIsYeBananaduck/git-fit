/**
 * Food Database Service
 * Integrates with Open Food Facts and USDA FoodData Central APIs
 */

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  category?: string;
  // Nutrition per 100g
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  sodiumPer100g?: number;
  // Common serving sizes
  commonServings: Array<{
    name: string;
    grams: number;
  }>;
  source: 'open_food_facts' | 'usda' | 'custom';
  sourceId?: string;
  qualityScore: number; // 0-1 score for data completeness
}

export interface FoodSearchResult {
  items: FoodItem[];
  totalResults: number;
  hasMore: boolean;
  searchTime: number;
  sources: string[];
}

export interface BarcodeResult {
  found: boolean;
  food?: FoodItem;
  source?: string;
  confidence: number;
}

export class FoodDatabaseService {
  private openFoodFactsBaseUrl = 'https://world.openfoodfacts.org/api/v0';
  private usdaBaseUrl = 'https://api.nal.usda.gov/fdc/v1';
  private usdaApiKey: string;

  constructor(usdaApiKey: string) {
    this.usdaApiKey = usdaApiKey;
  }

  /**
   * Search for foods across multiple databases
   */
  async searchFoods(query: string, limit: number = 20): Promise<FoodSearchResult> {
    const startTime = Date.now();
    const results: FoodItem[] = [];
    const sources: string[] = [];

    try {
      // Search Open Food Facts first (free, more consumer products)
      const offResults = await this.searchOpenFoodFacts(query, limit);
      results.push(...offResults);
      if (offResults.length > 0) sources.push('Open Food Facts');

      // Search USDA if we need more results
      if (results.length < limit && this.usdaApiKey) {
        const usdaResults = await this.searchUSDA(query, limit - results.length);
        results.push(...usdaResults);
        if (usdaResults.length > 0) sources.push('USDA FoodData Central');
      }

      // Sort by quality score and relevance
      results.sort((a, b) => {
        // Prioritize exact name matches
        const aExactMatch = a.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
        const bExactMatch = b.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
        if (aExactMatch !== bExactMatch) return bExactMatch - aExactMatch;
        
        // Then by quality score
        return b.qualityScore - a.qualityScore;
      });

      return {
        items: results.slice(0, limit),
        totalResults: results.length,
        hasMore: false, // Could implement pagination
        searchTime: Date.now() - startTime,
        sources
      };
    } catch (error) {
      console.error('Food search error:', error);
      return {
        items: [],
        totalResults: 0,
        hasMore: false,
        searchTime: Date.now() - startTime,
        sources: []
      };
    }
  }

  /**
   * Search for food by barcode
   */
  async searchByBarcode(barcode: string): Promise<BarcodeResult> {
    try {
      // Try Open Food Facts first (better barcode database)
      const offResult = await this.searchOpenFoodFactsByBarcode(barcode);
      if (offResult.found) {
        return offResult;
      }

      // Fallback to USDA if available
      if (this.usdaApiKey) {
        const usdaResult = await this.searchUSDAByBarcode(barcode);
        return usdaResult;
      }

      return { found: false, confidence: 0 };
    } catch (error) {
      console.error('Barcode search error:', error);
      return { found: false, confidence: 0 };
    }
  }

  /**
   * Get detailed nutrition information for a specific food
   */
  async getFoodDetails(foodId: string, source: 'open_food_facts' | 'usda'): Promise<FoodItem | null> {
    try {
      if (source === 'open_food_facts') {
        return await this.getOpenFoodFactsDetails(foodId);
      } else if (source === 'usda') {
        return await this.getUSDADetails(foodId);
      }
      return null;
    } catch (error) {
      console.error('Get food details error:', error);
      return null;
    }
  }

  /**
   * Search Open Food Facts database
   */
  private async searchOpenFoodFacts(query: string, limit: number): Promise<FoodItem[]> {
    const searchUrl = `${this.openFoodFactsBaseUrl}/cgi/search.pl`;
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: limit.toString(),
      fields: 'product_name,brands,code,categories,nutriments,serving_size,image_url'
    });

    const response = await fetch(`${searchUrl}?${params}`);
    if (!response.ok) throw new Error('Open Food Facts API error');

    const data = await response.json();
    return this.parseOpenFoodFactsResults(data.products || []);
  }

  /**
   * Search Open Food Facts by barcode
   */
  private async searchOpenFoodFactsByBarcode(barcode: string): Promise<BarcodeResult> {
    const url = `${this.openFoodFactsBaseUrl}/product/${barcode}.json`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) return { found: false, confidence: 0 };

      const data = await response.json();
      if (data.status !== 1 || !data.product) {
        return { found: false, confidence: 0 };
      }

      const foods = this.parseOpenFoodFactsResults([data.product]);
      if (foods.length === 0) {
        return { found: false, confidence: 0 };
      }

      return {
        found: true,
        food: foods[0],
        source: 'open_food_facts',
        confidence: foods[0].qualityScore
      };
    } catch (error) {
      return { found: false, confidence: 0 };
    }
  }

  /**
   * Parse Open Food Facts API results
   */
  private parseOpenFoodFactsResults(products: any[]): FoodItem[] {
    return products
      .filter(product => product.nutriments && product.product_name)
      .map(product => {
        const nutriments = product.nutriments;
        
        // Calculate quality score based on available data
        let qualityScore = 0.5; // base score
        if (nutriments.energy_100g || nutriments['energy-kcal_100g']) qualityScore += 0.2;
        if (nutriments.proteins_100g) qualityScore += 0.1;
        if (nutriments.carbohydrates_100g) qualityScore += 0.1;
        if (nutriments.fat_100g) qualityScore += 0.1;
        if (product.brands) qualityScore += 0.05;
        if (product.code) qualityScore += 0.05;

        // Extract serving sizes
        const commonServings = [];
        if (product.serving_size) {
          // Try to parse serving size (e.g., "30g", "1 cup (240ml)")
          const match = product.serving_size.match(/(\d+)\s*g/);
          if (match) {
            commonServings.push({
              name: `1 serving (${product.serving_size})`,
              grams: parseInt(match[1])
            });
          }
        }
        
        // Add common standard servings
        commonServings.push(
          { name: '100g', grams: 100 },
          { name: '1 oz (28g)', grams: 28 }
        );

        return {
          id: `off_${product.code || Date.now()}`,
          name: product.product_name.trim(),
          brand: product.brands?.split(',')[0]?.trim(),
          barcode: product.code,
          category: product.categories?.split(',')[0]?.trim(),
          caloriesPer100g: nutriments['energy-kcal_100g'] || nutriments.energy_100g / 4.184 || 0,
          proteinPer100g: nutriments.proteins_100g || 0,
          carbsPer100g: nutriments.carbohydrates_100g || 0,
          fatPer100g: nutriments.fat_100g || 0,
          fiberPer100g: nutriments.fiber_100g,
          sugarPer100g: nutriments.sugars_100g,
          sodiumPer100g: nutriments.sodium_100g ? nutriments.sodium_100g * 1000 : undefined, // convert to mg
          commonServings,
          source: 'open_food_facts' as const,
          sourceId: product.code,
          qualityScore: Math.min(1, qualityScore)
        };
      });
  }

  /**
   * Search USDA FoodData Central
   */
  private async searchUSDA(query: string, limit: number): Promise<FoodItem[]> {
    if (!this.usdaApiKey) return [];

    const searchUrl = `${this.usdaBaseUrl}/foods/search`;
    const params = new URLSearchParams({
      api_key: this.usdaApiKey,
      query: query,
      pageSize: limit.toString(),
      dataType: 'Foundation,SR Legacy', // Use high-quality datasets
      sortBy: 'relevance'
    });

    const response = await fetch(`${searchUrl}?${params}`);
    if (!response.ok) throw new Error('USDA API error');

    const data = await response.json();
    return this.parseUSDAResults(data.foods || []);
  }

  /**
   * Search USDA by barcode (limited support)
   */
  private async searchUSDAByBarcode(barcode: string): Promise<BarcodeResult> {
    // USDA doesn't have great barcode support, but we can try searching by GTIN
    try {
      const results = await this.searchUSDA(barcode, 5);
      
      // Look for exact barcode match in results
      const exactMatch = results.find(food => 
        food.sourceId === barcode || food.barcode === barcode
      );

      if (exactMatch) {
        return {
          found: true,
          food: exactMatch,
          source: 'usda',
          confidence: exactMatch.qualityScore
        };
      }

      return { found: false, confidence: 0 };
    } catch (error) {
      return { found: false, confidence: 0 };
    }
  }

  /**
   * Parse USDA API results
   */
  private parseUSDAResults(foods: any[]): FoodItem[] {
    return foods.map(food => {
      // Calculate quality score
      let qualityScore = 0.8; // USDA generally has high quality data
      if (food.foodNutrients?.length > 10) qualityScore += 0.1;
      if (food.brandOwner) qualityScore += 0.05;
      if (food.ingredients) qualityScore += 0.05;

      // Extract nutrients
      const nutrients = food.foodNutrients || [];
      const getNutrient = (nutrientId: number) => {
        const nutrient = nutrients.find((n: any) => n.nutrientId === nutrientId);
        return nutrient?.value || 0;
      };

      // Standard USDA nutrient IDs
      const calories = getNutrient(1008); // Energy
      const protein = getNutrient(1003); // Protein
      const carbs = getNutrient(1005); // Carbohydrates
      const fat = getNutrient(1004); // Total lipid (fat)
      const fiber = getNutrient(1079); // Fiber
      const sugar = getNutrient(2000); // Sugars
      const sodium = getNutrient(1093); // Sodium

      // Common servings
      const commonServings = [
        { name: '100g', grams: 100 },
        { name: '1 oz (28g)', grams: 28 }
      ];

      if (food.servingSize && food.servingSizeUnit === 'g') {
        commonServings.unshift({
          name: `1 serving (${food.servingSize}g)`,
          grams: food.servingSize
        });
      }

      return {
        id: `usda_${food.fdcId}`,
        name: food.description?.trim() || 'Unknown food',
        brand: food.brandOwner?.trim(),
        barcode: food.gtinUpc,
        category: food.foodCategory?.trim(),
        caloriesPer100g: calories,
        proteinPer100g: protein,
        carbsPer100g: carbs,
        fatPer100g: fat,
        fiberPer100g: fiber > 0 ? fiber : undefined,
        sugarPer100g: sugar > 0 ? sugar : undefined,
        sodiumPer100g: sodium > 0 ? sodium : undefined, // USDA already in mg
        commonServings,
        source: 'usda' as const,
        sourceId: food.fdcId.toString(),
        qualityScore: Math.min(1, qualityScore)
      };
    });
  }

  /**
   * Get detailed Open Food Facts information
   */
  private async getOpenFoodFactsDetails(productId: string): Promise<FoodItem | null> {
    const url = `${this.openFoodFactsBaseUrl}/product/${productId}.json`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();
      if (data.status !== 1 || !data.product) return null;

      const results = this.parseOpenFoodFactsResults([data.product]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get detailed USDA information
   */
  private async getUSDADetails(fdcId: string): Promise<FoodItem | null> {
    if (!this.usdaApiKey) return null;

    const url = `${this.usdaBaseUrl}/food/${fdcId}`;
    const params = new URLSearchParams({
      api_key: this.usdaApiKey,
      format: 'abridged'
    });

    try {
      const response = await fetch(`${url}?${params}`);
      if (!response.ok) return null;

      const data = await response.json();
      const results = this.parseUSDAResults([data]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate nutrition for a specific serving
   */
  calculateNutritionForServing(food: FoodItem, servingGrams: number): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  } {
    const factor = servingGrams / 100;

    return {
      calories: Math.round(food.caloriesPer100g * factor),
      protein: Math.round(food.proteinPer100g * factor * 10) / 10,
      carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
      fat: Math.round(food.fatPer100g * factor * 10) / 10,
      fiber: food.fiberPer100g ? Math.round(food.fiberPer100g * factor * 10) / 10 : undefined,
      sugar: food.sugarPer100g ? Math.round(food.sugarPer100g * factor * 10) / 10 : undefined,
      sodium: food.sodiumPer100g ? Math.round(food.sodiumPer100g * factor) : undefined
    };
  }

  /**
   * Suggest similar foods based on name and category
   */
  async getSimilarFoods(food: FoodItem, limit: number = 5): Promise<FoodItem[]> {
    // Extract keywords from food name
    const keywords = food.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 3); // Use top 3 keywords

    const searchQueries = [
      ...keywords,
      ...(food.category ? [food.category] : [])
    ];

    const allResults: FoodItem[] = [];
    
    for (const query of searchQueries) {
      const results = await this.searchFoods(query, 3);
      // Filter out the original food and duplicates
      const filtered = results.items.filter(item => 
        item.id !== food.id && 
        !allResults.some(existing => existing.id === item.id)
      );
      allResults.push(...filtered);
      
      if (allResults.length >= limit) break;
    }

    return allResults.slice(0, limit);
  }
}