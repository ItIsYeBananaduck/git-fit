import { v } from "convex/values";
import { mutation, query } from "../_generated/server.js";

// Import exercises from Free Exercise Database
export const importExercises = mutation({
  args: {
    exercises: v.array(v.object({
      id: v.string(),
      name: v.string(),
      force: v.optional(v.string()),
      level: v.string(),
      mechanic: v.optional(v.string()),
      equipment: v.optional(v.string()),
      primaryMuscles: v.array(v.string()),
      secondaryMuscles: v.array(v.string()),
      instructions: v.array(v.string()),
      category: v.string(),
      images: v.array(v.string()),
    }))
  },
  handler: async (ctx, args) => {
    const importedCount = 0;
    const errors = [];

    try {
      for (const exercise of args.exercises) {
        try {
          // Check if exercise already exists
          const existing = await ctx.db
            .query("exerciseDatabase")
            .withIndex("by_exercise_id", (q) => q.eq("exerciseId", exercise.id))
            .first();

          if (existing) {
            continue; // Skip if already imported
          }

          // Generate equipment recommendations
          const recommendations = getEquipmentRecommendations(exercise.equipment);

          await ctx.db.insert("exerciseDatabase", {
            exerciseId: exercise.id,
            name: exercise.name,
            instructions: exercise.instructions,
            category: exercise.category,
            level: exercise.level,
            force: exercise.force || null,
            mechanic: exercise.mechanic || null,
            primaryMuscles: exercise.primaryMuscles,
            secondaryMuscles: exercise.secondaryMuscles,
            equipment: exercise.equipment || null,
            alternativeEquipment: recommendations.alternatives,
            recommendedMachines: recommendations.machines,
            images: exercise.images,
            importedAt: new Date().toISOString(),
            source: "free-exercise-db",
          });

          importedCount++;
        } catch (error) {
          errors.push(`Error importing ${exercise.name}: ${error.message}`);
        }
      }

      return {
        success: true,
        imported: importedCount,
        total: args.exercises.length,
        errors: errors,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        imported: importedCount,
        total: args.exercises.length,
      };
    }
  },
});

// Get equipment recommendations based on primary equipment
function getEquipmentRecommendations(primaryEquipment) {
  const recommendations = {
    alternatives: [],
    machines: [],
  };

  switch (primaryEquipment) {
    case "dumbbell":
      recommendations.machines = [
        "Adjustable Dumbbells",
        "Fixed Weight Dumbbells",
        "Olympic Dumbbells"
      ];
      recommendations.alternatives = [
        "Resistance Bands",
        "Kettlebells",
        "Cable Machine",
        "Barbell"
      ];
      break;

    case "barbell":
      recommendations.machines = [
        "Olympic Barbell",
        "Standard Barbell",
        "EZ-Curl Bar",
        "Trap Bar"
      ];
      recommendations.alternatives = [
        "Dumbbells",
        "Cable Machine",
        "Smith Machine",
        "Resistance Bands"
      ];
      break;

    case "machine":
      recommendations.machines = [
        "Multi-Station Machine",
        "Functional Trainer",
        "Selectorized Machine"
      ];
      recommendations.alternatives = [
        "Cable Machine",
        "Free Weights",
        "Resistance Bands"
      ];
      break;

    case "cable":
      recommendations.machines = [
        "Cable Crossover Machine",
        "Functional Trainer",
        "Single Pulley Station",
        "Lat Pulldown Machine"
      ];
      recommendations.alternatives = [
        "Resistance Bands",
        "Dumbbells",
        "Suspension Trainer"
      ];
      break;

    case "kettlebells":
      recommendations.machines = [
        "Cast Iron Kettlebells",
        "Adjustable Kettlebells",
        "Competition Kettlebells"
      ];
      recommendations.alternatives = [
        "Dumbbells",
        "Medicine Ball",
        "Resistance Bands"
      ];
      break;

    case "body only":
      recommendations.machines = [
        "Pull-up Bar",
        "Dip Station",
        "Exercise Mat",
        "Suspension Trainer"
      ];
      recommendations.alternatives = [
        "Resistance Bands",
        "Light Weights",
        "Stability Ball"
      ];
      break;

    case "exercise ball":
      recommendations.machines = [
        "Stability Ball",
        "Swiss Ball",
        "Physio Ball"
      ];
      recommendations.alternatives = [
        "Bosu Ball",
        "Balance Pad",
        "Exercise Mat"
      ];
      break;

    case "foam roll":
      recommendations.machines = [
        "Foam Roller",
        "Massage Roller",
        "Textured Roller"
      ];
      recommendations.alternatives = [
        "Massage Ball",
        "Theracane",
        "Stretching Strap"
      ];
      break;

    default:
      recommendations.machines = ["Basic Gym Equipment"];
      recommendations.alternatives = ["Bodyweight Alternative"];
  }

  return recommendations;
}

// Get all exercises with filters
export const getExercises = query({
  args: {
    category: v.optional(v.string()),
    level: v.optional(v.string()),
    equipment: v.optional(v.string()),
    muscleGroup: v.optional(v.string()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("exerciseDatabase");

    // Apply filters
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }
    if (args.level) {
      query = query.filter((q) => q.eq(q.field("level"), args.level));
    }
    if (args.equipment) {
      query = query.filter((q) => q.eq(q.field("equipment"), args.equipment));
    }

    let exercises = await query.collect();

    // Filter by muscle group if specified
    if (args.muscleGroup) {
      exercises = exercises.filter(exercise => 
        exercise.primaryMuscles.includes(args.muscleGroup) ||
        exercise.secondaryMuscles.includes(args.muscleGroup)
      );
    }

    // Search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      exercises = exercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchLower) ||
        exercise.primaryMuscles.some(muscle => muscle.toLowerCase().includes(searchLower))
      );
    }

    // Limit results
    if (args.limit) {
      exercises = exercises.slice(0, args.limit);
    }

    return exercises;
  },
});

// Get exercise by ID with equipment recommendations
export const getExerciseWithRecommendations = query({
  args: { exerciseId: v.string() },
  handler: async (ctx, args) => {
    const exercise = await ctx.db
      .query("exerciseDatabase")
      .withIndex("by_exercise_id", (q) => q.eq("exerciseId", args.exerciseId))
      .first();

    if (!exercise) {
      return null;
    }

    // Get equipment recommendations
    let equipmentRec = null;
    if (exercise.equipment) {
      equipmentRec = await ctx.db
        .query("equipmentRecommendations")
        .withIndex("by_equipment_type", (q) => q.eq("equipmentType", exercise.equipment))
        .first();
    }

    return {
      ...exercise,
      equipmentRecommendation: equipmentRec,
    };
  },
});

// Initialize equipment recommendations
export const initializeEquipmentRecommendations = mutation({
  args: {},
  handler: async (ctx) => {
    const equipmentTypes = [
      {
        equipmentType: "dumbbell",
        primaryMachines: ["Adjustable Dumbbells", "Fixed Weight Dumbbells", "Olympic Dumbbells"],
        alternatives: ["Resistance Bands", "Kettlebells", "Cable Machine"],
        homeAlternatives: ["Resistance Bands", "Water Bottles", "Backpack with Books"],
        description: "Versatile free weights for unilateral training",
        priceRange: "$$",
        spaceRequired: "minimal"
      },
      {
        equipmentType: "barbell",
        primaryMachines: ["Olympic Barbell", "Standard Barbell", "EZ-Curl Bar"],
        alternatives: ["Dumbbells", "Cable Machine", "Smith Machine"],
        homeAlternatives: ["Resistance Bands", "Heavy Dumbbells", "Suspension Trainer"],
        description: "Essential for compound movements and heavy lifting",
        priceRange: "$$$",
        spaceRequired: "large"
      },
      {
        equipmentType: "machine",
        primaryMachines: ["Multi-Station Machine", "Functional Trainer", "Selectorized Machine"],
        alternatives: ["Cable Machine", "Free Weights", "Resistance Bands"],
        homeAlternatives: ["Resistance Bands", "Suspension Trainer", "Adjustable Dumbbells"],
        description: "Guided movement patterns for safety and isolation",
        priceRange: "$$$",
        spaceRequired: "large"
      },
      {
        equipmentType: "cable",
        primaryMachines: ["Cable Crossover", "Functional Trainer", "Lat Pulldown"],
        alternatives: ["Resistance Bands", "Dumbbells", "Suspension Trainer"],
        homeAlternatives: ["Resistance Bands", "Door Anchor System", "Suspension Trainer"],
        description: "Constant tension throughout full range of motion",
        priceRange: "$$$",
        spaceRequired: "moderate"
      },
      {
        equipmentType: "kettlebells",
        primaryMachines: ["Cast Iron Kettlebells", "Adjustable Kettlebells", "Competition Kettlebells"],
        alternatives: ["Dumbbells", "Medicine Ball", "Resistance Bands"],
        homeAlternatives: ["Heavy Dumbbells", "Gallon Water Jugs", "Backpack with Weight"],
        description: "Dynamic movements combining strength and cardio",
        priceRange: "$$",
        spaceRequired: "minimal"
      },
      {
        equipmentType: "body only",
        primaryMachines: ["Pull-up Bar", "Dip Station", "Exercise Mat"],
        alternatives: ["Resistance Bands", "Light Weights", "Suspension Trainer"],
        homeAlternatives: ["Playground Equipment", "Stairs", "Wall"],
        description: "No equipment needed - use your body weight",
        priceRange: "$",
        spaceRequired: "minimal"
      }
    ];

    for (const equipment of equipmentTypes) {
      const existing = await ctx.db
        .query("equipmentRecommendations")
        .withIndex("by_equipment_type", (q) => q.eq("equipmentType", equipment.equipmentType))
        .first();

      if (!existing) {
        await ctx.db.insert("equipmentRecommendations", equipment);
      }
    }

    return { success: true, initialized: equipmentTypes.length };
  },
});