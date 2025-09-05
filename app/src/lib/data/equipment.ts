// Comprehensive gym equipment database
export const equipmentData = [
  // Free Weights
  { "name": "Barbell", "slug": "barbell", "category": "free-weights", "type": "barbell" },
  { "name": "Dumbbells", "slug": "dumbbells", "category": "free-weights", "type": "dumbbell" },
  { "name": "Weight Plates", "slug": "weight-plates", "category": "free-weights", "type": "plates" },
  { "name": "EZ Curl Bar", "slug": "ez-curl-bar", "category": "free-weights", "type": "e-z curl bar" },
  { "name": "Kettlebells", "slug": "kettlebells", "category": "free-weights", "type": "kettlebells" },

  // Bodyweight & Functional
  { "name": "Pull-up Bar", "slug": "pull-up-bar", "category": "bodyweight", "type": "body only" },
  { "name": "Dip Bars", "slug": "dip-bars", "category": "bodyweight", "type": "body only" },
  { "name": "Resistance Bands", "slug": "resistance-bands", "category": "functional", "type": "bands" },
  { "name": "Medicine Ball", "slug": "medicine-ball", "category": "functional", "type": "medicine ball" },
  { "name": "Stability Ball", "slug": "stability-ball", "category": "functional", "type": "exercise ball" },
  { "name": "Ab Wheel", "slug": "ab-wheel", "category": "functional", "type": "other" },

  // Machines
  { "name": "Smith Machine", "slug": "smith-machine", "category": "machines", "type": "machine" },
  { "name": "Cable Crossover", "slug": "cable-crossover", "category": "machines", "type": "cable" },
  { "name": "Lat Pulldown Machine", "slug": "lat-pulldown-machine", "category": "machines", "type": "machine" },
  { "name": "Seated Row Machine", "slug": "seated-row-machine", "category": "machines", "type": "machine" },
  { "name": "Chest Press Machine", "slug": "chest-press-machine", "category": "machines", "type": "machine" },
  { "name": "Pec Deck Machine", "slug": "pec-deck-machine", "category": "machines", "type": "machine" },
  { "name": "Shoulder Press Machine", "slug": "shoulder-press-machine", "category": "machines", "type": "machine" },
  { "name": "Leg Press Machine", "slug": "leg-press-machine", "category": "machines", "type": "machine" },
  { "name": "Leg Extension Machine", "slug": "leg-extension-machine", "category": "machines", "type": "machine" },
  { "name": "Leg Curl Machine", "slug": "leg-curl-machine", "category": "machines", "type": "machine" },
  { "name": "Calf Raise Machine", "slug": "calf-raise-machine", "category": "machines", "type": "machine" },

  // Cardio
  { "name": "Treadmill", "slug": "treadmill", "category": "cardio", "type": "machine" },
  { "name": "Stationary Bike", "slug": "stationary-bike", "category": "cardio", "type": "machine" },
  { "name": "Elliptical", "slug": "elliptical", "category": "cardio", "type": "machine" },
  { "name": "Rowing Machine", "slug": "rowing-machine", "category": "cardio", "type": "machine" },
  { "name": "Stair Climber", "slug": "stair-climber", "category": "cardio", "type": "machine" }
];

// Equipment categories for filtering
export const equipmentCategories = [
  { name: "Free Weights", slug: "free-weights", icon: "🏋️" },
  { name: "Bodyweight", slug: "bodyweight", icon: "🤸" },
  { name: "Functional", slug: "functional", icon: "⚽" },
  { name: "Machines", slug: "machines", icon: "⚙️" },
  { name: "Cardio", slug: "cardio", icon: "🏃" }
];

// Enhanced equipment mapping for better recommendations
export const equipmentMapping = {
  "dumbbell": {
    primary: ["Dumbbells"],
    alternatives: ["Resistance Bands", "Kettlebells", "Cable Crossover"],
    homeAlternatives: ["Resistance Bands", "Water Bottles", "Backpack with Books"]
  },
  "barbell": {
    primary: ["Barbell", "EZ Curl Bar"],
    alternatives: ["Dumbbells", "Smith Machine", "Cable Crossover"],
    homeAlternatives: ["Resistance Bands", "Heavy Dumbbells"]
  },
  "machine": {
    primary: ["Chest Press Machine", "Lat Pulldown Machine", "Leg Press Machine"],
    alternatives: ["Cable Crossover", "Smith Machine", "Free Weights"],
    homeAlternatives: ["Resistance Bands", "Dumbbells", "Bodyweight"]
  },
  "cable": {
    primary: ["Cable Crossover", "Lat Pulldown Machine", "Seated Row Machine"],
    alternatives: ["Resistance Bands", "Dumbbells", "Smith Machine"],
    homeAlternatives: ["Resistance Bands", "Door Anchor", "Suspension Trainer"]
  },
  "kettlebells": {
    primary: ["Kettlebells"],
    alternatives: ["Dumbbells", "Medicine Ball", "Resistance Bands"],
    homeAlternatives: ["Heavy Dumbbells", "Gallon Water Jugs"]
  },
  "body only": {
    primary: ["Pull-up Bar", "Dip Bars"],
    alternatives: ["Resistance Bands", "Light Weights", "Stability Ball"],
    homeAlternatives: ["Playground Equipment", "Stairs", "Wall"]
  },
  "exercise ball": {
    primary: ["Stability Ball"],
    alternatives: ["Medicine Ball", "Balance Pad"],
    homeAlternatives: ["Pillow", "Couch Cushion"]
  },
  "bands": {
    primary: ["Resistance Bands"],
    alternatives: ["Cable Crossover", "Light Dumbbells"],
    homeAlternatives: ["Towel", "Elastic Tubing"]
  },
  "medicine ball": {
    primary: ["Medicine Ball"],
    alternatives: ["Kettlebells", "Dumbbells", "Stability Ball"],
    homeAlternatives: ["Basketball", "Heavy Book"]
  }
};

// Get equipment recommendations for a specific exercise equipment type
export function getEquipmentRecommendations(equipmentType: string) {
  const mapping = equipmentMapping[equipmentType];
  if (!mapping) {
    return {
      primary: [],
      alternatives: [],
      homeAlternatives: []
    };
  }
  return mapping;
}

// Get equipment by category
export function getEquipmentByCategory(category: string) {
  return equipmentData.filter(equipment => equipment.category === category);
}

// Find equipment by name or slug
export function findEquipment(nameOrSlug: string) {
  return equipmentData.find(equipment => 
    equipment.name.toLowerCase() === nameOrSlug.toLowerCase() ||
    equipment.slug === nameOrSlug
  );
}