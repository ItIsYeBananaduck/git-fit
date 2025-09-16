import { query } from '../_generated/server';
import { v } from 'convex/values';

// Training split recommendations based on goals
const TRAINING_SPLITS = {
  weight_loss: {
    name: 'Fat Loss Focus',
    description: 'High-intensity cardio with strength training to maximize calorie burn',
    weeklyStructure: {
      cardio: 4,
      strength: 3,
      rest: 0
    },
    split: [
      { day: 1, focus: 'Full Body Strength', type: 'strength' },
      { day: 2, focus: 'HIIT Cardio', type: 'cardio' },
      { day: 3, focus: 'Rest or Light Activity', type: 'rest' },
      { day: 4, focus: 'Upper Body Strength', type: 'strength' },
      { day: 5, focus: 'Steady State Cardio', type: 'cardio' },
      { day: 6, focus: 'Lower Body Strength', type: 'strength' },
      { day: 7, focus: 'Active Recovery', type: 'rest' }
    ]
  },
  muscle_gain: {
    name: 'Muscle Building',
    description: 'Progressive overload with adequate recovery for muscle growth',
    weeklyStructure: {
      strength: 5,
      cardio: 1,
      rest: 1
    },
    split: [
      { day: 1, focus: 'Chest & Triceps', type: 'strength' },
      { day: 2, focus: 'Back & Biceps', type: 'strength' },
      { day: 3, focus: 'Rest', type: 'rest' },
      { day: 4, focus: 'Legs', type: 'strength' },
      { day: 5, focus: 'Shoulders & Abs', type: 'strength' },
      { day: 6, focus: 'Full Body', type: 'strength' },
      { day: 7, focus: 'Light Cardio', type: 'cardio' }
    ]
  },
  strength_training: {
    name: 'Power & Strength',
    description: 'Heavy compound lifts with longer recovery periods',
    weeklyStructure: {
      strength: 4,
      cardio: 1,
      rest: 2
    },
    split: [
      { day: 1, focus: 'Squat Focus', type: 'strength' },
      { day: 2, focus: 'Bench Press Focus', type: 'strength' },
      { day: 3, focus: 'Rest', type: 'rest' },
      { day: 4, focus: 'Deadlift Focus', type: 'strength' },
      { day: 5, focus: 'Overhead Press Focus', type: 'strength' },
      { day: 6, focus: 'Rest', type: 'rest' },
      { day: 7, focus: 'Light Conditioning', type: 'cardio' }
    ]
  },
  endurance: {
    name: 'Endurance Builder',
    description: 'Long-duration cardio with strength maintenance',
    weeklyStructure: {
      cardio: 5,
      strength: 2,
      rest: 0
    },
    split: [
      { day: 1, focus: 'Long Run/Bike', type: 'cardio' },
      { day: 2, focus: 'Strength Maintenance', type: 'strength' },
      { day: 3, focus: 'Tempo Training', type: 'cardio' },
      { day: 4, focus: 'Rest or Cross-Training', type: 'rest' },
      { day: 5, focus: 'Intervals', type: 'cardio' },
      { day: 6, focus: 'Strength Maintenance', type: 'strength' },
      { day: 7, focus: 'Recovery Run', type: 'cardio' }
    ]
  },
  general_fitness: {
    name: 'Wellness Balance',
    description: 'Balanced approach to overall fitness and health',
    weeklyStructure: {
      strength: 3,
      cardio: 3,
      rest: 1
    },
    split: [
      { day: 1, focus: 'Full Body Strength', type: 'strength' },
      { day: 2, focus: 'Cardio Session', type: 'cardio' },
      { day: 3, focus: 'Rest', type: 'rest' },
      { day: 4, focus: 'Upper Body Strength', type: 'strength' },
      { day: 5, focus: 'Cardio Session', type: 'cardio' },
      { day: 6, focus: 'Lower Body Strength', type: 'strength' },
      { day: 7, focus: 'Active Recovery', type: 'cardio' }
    ]
  },
  sports_performance: {
    name: 'Athletic Performance',
    description: 'Sport-specific training with strength and conditioning',
    weeklyStructure: {
      sport_specific: 3,
      strength: 2,
      conditioning: 2
    },
    split: [
      { day: 1, focus: 'Sport Skills & Drills', type: 'sport_specific' },
      { day: 2, focus: 'Strength Training', type: 'strength' },
      { day: 3, focus: 'Conditioning', type: 'conditioning' },
      { day: 4, focus: 'Sport Skills', type: 'sport_specific' },
      { day: 5, focus: 'Strength Training', type: 'strength' },
      { day: 6, focus: 'Conditioning', type: 'conditioning' },
      { day: 7, focus: 'Active Recovery', type: 'rest' }
    ]
  }
};

// Get training split recommendations based on user goals
export const getTrainingSplitRecommendations = query({
  args: {
    userId: v.string(),
  },
  handler: async ({ db }, { userId }) => {
    // Get user's active goals
    const goals = await db
      .query('goals')
      .filter(q => q.eq(q.field('userId'), userId))
      .filter(q => q.eq(q.field('isActive'), true))
      .collect();

    const primaryGoal = goals.find(g => g.goalType === 'primary');
    const secondaryGoals = goals.filter(g => g.goalType === 'secondary');

    if (!primaryGoal) {
      return {
        recommendations: [],
        message: 'No primary goal found. Please set your goals first.'
      };
    }

    const primarySplit = TRAINING_SPLITS[primaryGoal.primaryGoalType as keyof typeof TRAINING_SPLITS];

    if (!primarySplit) {
      return {
        recommendations: [],
        message: 'No training split available for your primary goal.'
      };
    }

    // Generate recommendations based on primary goal and secondary goals
    const recommendations = [{
      ...primarySplit,
      score: 100,
      reasoning: `Primary recommendation based on your ${primaryGoal.primaryGoalType.replace('_', ' ')} goal`
    }];

    // Add secondary recommendations based on secondary goals
    const secondaryRecommendations = generateSecondaryRecommendations(
      primaryGoal.primaryGoalType,
      secondaryGoals
    );

    recommendations.push(...secondaryRecommendations);

    return {
      recommendations: recommendations.slice(0, 3), // Return top 3 recommendations
      primaryGoal: primaryGoal.primaryGoalType,
      secondaryGoals: secondaryGoals.map(g => g.secondaryGoalType)
    };
  },
});

// Generate secondary recommendations based on secondary goals
function generateSecondaryRecommendations(primaryGoalType: string, secondaryGoals: any[]) {
  const recommendations = [];

  for (const secondaryGoal of secondaryGoals) {
    const goalType = secondaryGoal.secondaryGoalType;

    // Adjust recommendations based on secondary goals
    if (goalType === 'lose_fat' && primaryGoalType !== 'weight_loss') {
      recommendations.push({
        ...TRAINING_SPLITS.weight_loss,
        score: 80,
        reasoning: 'Secondary goal: fat loss - increased cardio focus'
      });
    }

    if (goalType === 'muscle_gain' && primaryGoalType !== 'muscle_gain') {
      recommendations.push({
        ...TRAINING_SPLITS.muscle_gain,
        score: 75,
        reasoning: 'Secondary goal: muscle gain - strength training emphasis'
      });
    }

    if (goalType === 'improve_endurance' && primaryGoalType !== 'endurance') {
      recommendations.push({
        ...TRAINING_SPLITS.endurance,
        score: 70,
        reasoning: 'Secondary goal: endurance - cardio training focus'
      });
    }

    if (goalType === 'increase_strength' && primaryGoalType !== 'strength_training') {
      recommendations.push({
        ...TRAINING_SPLITS.strength_training,
        score: 85,
        reasoning: 'Secondary goal: strength - compound lift focus'
      });
    }
  }

  return recommendations;
}

// Get detailed training split for a specific recommendation
export const getDetailedTrainingSplit = query({
  args: {
    splitType: v.string(),
  },
  handler: async ({ db }, { splitType }) => {
    const split = TRAINING_SPLITS[splitType as keyof typeof TRAINING_SPLITS];

    if (!split) {
      return null;
    }

    return {
      ...split,
      exercises: getExercisesForSplit(splitType),
      nutrition: getNutritionForSplit(splitType),
      progression: getProgressionForSplit(splitType)
    };
  },
});

// Get exercises for a specific training split
function getExercisesForSplit(splitType: string) {
  const exerciseMap = {
    weight_loss: [
      { day: 1, exercises: ['Squats', 'Push-ups', 'Rows', 'Planks'] },
      { day: 2, exercises: ['Burpees', 'Mountain Climbers', 'Jump Rope', 'Sprint Intervals'] },
      { day: 4, exercises: ['Bench Press', 'Shoulder Press', 'Bicep Curls', 'Tricep Dips'] },
      { day: 5, exercises: ['Brisk Walking', 'Cycling', 'Elliptical', 'Swimming'] },
      { day: 6, exercises: ['Lunges', 'Leg Press', 'Calf Raises', 'Leg Curls'] }
    ],
    muscle_gain: [
      { day: 1, exercises: ['Bench Press', 'Incline Press', 'Tricep Pushdowns', 'Overhead Tricep Extension'] },
      { day: 2, exercises: ['Pull-ups', 'Bent-over Rows', 'Face Pulls', 'Bicep Curls'] },
      { day: 4, exercises: ['Squats', 'Leg Press', 'Romanian Deadlifts', 'Calf Raises'] },
      { day: 5, exercises: ['Shoulder Press', 'Lateral Raises', 'Rear Delt Flyes', 'Planks'] },
      { day: 6, exercises: ['Deadlifts', 'Squats', 'Bench Press', 'Rows'] }
    ],
    strength_training: [
      { day: 1, exercises: ['Back Squat', 'Front Squat', 'Pause Squat', 'Box Squat'] },
      { day: 2, exercises: ['Bench Press', 'Close-grip Bench', 'Floor Press', 'Push-ups'] },
      { day: 4, exercises: ['Deadlift', 'Romanian Deadlift', 'Good Mornings', 'Hip Thrusts'] },
      { day: 5, exercises: ['Overhead Press', 'Push Press', 'Lateral Raises', 'Face Pulls'] }
    ],
    endurance: [
      { day: 1, exercises: ['Long Distance Run', 'Cycling', 'Swimming', 'Rowing'] },
      { day: 2, exercises: ['Bodyweight Squats', 'Push-ups', 'Pull-ups', 'Planks'] },
      { day: 3, exercises: ['Tempo Run', 'Hill Repeats', 'Fartlek Training'] },
      { day: 5, exercises: ['Sprint Intervals', 'Tabata', 'Circuit Training'] },
      { day: 6, exercises: ['Lunges', 'Step-ups', 'Deadlifts', 'Overhead Press'] },
      { day: 7, exercises: ['Light Jog', 'Walking', 'Yoga', 'Stretching'] }
    ],
    general_fitness: [
      { day: 1, exercises: ['Squats', 'Push-ups', 'Bent-over Rows', 'Planks'] },
      { day: 2, exercises: ['Brisk Walking', 'Jogging', 'Cycling', 'Swimming'] },
      { day: 4, exercises: ['Bench Press', 'Shoulder Press', 'Bicep Curls', 'Tricep Dips'] },
      { day: 5, exercises: ['Yoga', 'Pilates', 'Stretching', 'Light Cardio'] },
      { day: 6, exercises: ['Lunges', 'Deadlifts', 'Pull-ups', 'Russian Twists'] },
      { day: 7, exercises: ['Walking', 'Light Stretching', 'Foam Rolling'] }
    ],
    sports_performance: [
      { day: 1, exercises: ['Sport-specific Drills', 'Agility Ladder', 'Reaction Ball', 'Footwork'] },
      { day: 2, exercises: ['Squats', 'Deadlifts', 'Bench Press', 'Pull-ups'] },
      { day: 3, exercises: ['Sprint Intervals', 'Plyometrics', 'Agility Drills', 'Sport Conditioning'] },
      { day: 4, exercises: ['Sport Skills Practice', 'Position Drills', 'Team Tactics'] },
      { day: 5, exercises: ['Overhead Press', 'Rows', 'Lunges', 'Core Work'] },
      { day: 6, exercises: ['Endurance Training', 'Sport-specific Conditioning', 'Recovery Work'] }
    ]
  };

  return exerciseMap[splitType as keyof typeof exerciseMap] || [];
}

// Get nutrition recommendations for a training split
function getNutritionForSplit(splitType: string) {
  const nutritionMap = {
    weight_loss: {
      calories: '500 calorie deficit',
      protein: '1.6-2.2g per kg bodyweight',
      carbs: '2-3g per kg bodyweight',
      fat: '0.8-1g per kg bodyweight',
      focus: 'High protein, moderate carbs, controlled calories'
    },
    muscle_gain: {
      calories: '300-500 calorie surplus',
      protein: '1.6-2.2g per kg bodyweight',
      carbs: '3-4g per kg bodyweight',
      fat: '1-1.5g per kg bodyweight',
      focus: 'High protein and carbs for muscle building'
    },
    strength_training: {
      calories: 'Maintenance or slight surplus',
      protein: '1.8-2.5g per kg bodyweight',
      carbs: '3-4g per kg bodyweight',
      fat: '1-1.5g per kg bodyweight',
      focus: 'High protein for recovery, carbs for performance'
    },
    endurance: {
      calories: 'Maintenance or slight deficit',
      protein: '1.2-1.6g per kg bodyweight',
      carbs: '6-8g per kg bodyweight',
      fat: '1-1.5g per kg bodyweight',
      focus: 'High carbs for energy, adequate protein for recovery'
    },
    general_fitness: {
      calories: 'Maintenance',
      protein: '1.2-1.6g per kg bodyweight',
      carbs: '3-5g per kg bodyweight',
      fat: '0.8-1.2g per kg bodyweight',
      focus: 'Balanced macronutrients for overall health'
    },
    sports_performance: {
      calories: 'Maintenance or sport-specific',
      protein: '1.6-2.2g per kg bodyweight',
      carbs: '4-6g per kg bodyweight',
      fat: '1-1.5g per kg bodyweight',
      focus: 'Periodized nutrition based on training phases'
    }
  };

  return nutritionMap[splitType as keyof typeof nutritionMap] || nutritionMap.general_fitness;
}

// Get progression guidelines for a training split
function getProgressionForSplit(splitType: string) {
  const progressionMap = {
    weight_loss: [
      'Week 1-4: Focus on form and consistency',
      'Week 5-8: Increase cardio intensity and duration',
      'Week 9-12: Add more strength training volume',
      'Ongoing: Track body measurements and adjust calories as needed'
    ],
    muscle_gain: [
      'Week 1-4: Learn proper form and find working weights',
      'Week 5-8: Increase weight by 5-10% every 1-2 weeks',
      'Week 9-12: Add accessory exercises and increase volume',
      'Ongoing: Progressive overload with compound movements'
    ],
    strength_training: [
      'Week 1-4: Focus on technique with lighter weights',
      'Week 5-8: Build strength with 3-5 rep ranges',
      'Week 9-12: Increase intensity and reduce rest times',
      'Ongoing: Track strength gains and adjust programming'
    ],
    endurance: [
      'Week 1-4: Build base aerobic fitness',
      'Week 5-8: Increase duration and add tempo work',
      'Week 9-12: Incorporate interval training',
      'Ongoing: Track race times and adjust training volume'
    ],
    general_fitness: [
      'Week 1-4: Establish consistent routine',
      'Week 5-8: Increase intensity and duration',
      'Week 9-12: Add variety and challenge',
      'Ongoing: Mix different activities to prevent boredom'
    ],
    sports_performance: [
      'Week 1-4: Focus on fundamental skills and conditioning',
      'Week 5-8: Increase sport-specific training volume',
      'Week 9-12: Incorporate competition preparation',
      'Ongoing: Periodize training based on competition schedule'
    ]
  };

  return progressionMap[splitType as keyof typeof progressionMap] || progressionMap.general_fitness;
}