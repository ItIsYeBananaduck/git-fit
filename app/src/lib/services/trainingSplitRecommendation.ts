import type { SplitOption } from '../components/SplitComparisonPanel.svelte';

export interface RecommendationInput {
  primaryGoal: string;
  secondaryGoals: string[];
  equipment: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  availableDays: number;
}

// The same splits as in SplitComparisonPanel
const SPLITS: SplitOption[] = [
  {
    name: 'Full Body 3x',
    days: 3,
    description: 'Full body workouts 3x/week. Great for beginners and busy schedules.',
    pros: ['Efficient for limited time', 'Frequent muscle stimulation', 'Simple structure'],
    cons: ['Limited volume per muscle group', 'Can be fatiguing if not managed'],
    recommendedFor: 'Beginners, general fitness, time-constrained',
  },
  {
    name: 'Upper/Lower',
    days: 4,
    description: 'Upper and lower body split, 4x/week. Balanced for most goals.',
    pros: ['Good balance of frequency and volume', 'Easier recovery management'],
    cons: ['Requires 4 days/week', 'Less specialization'],
    recommendedFor: 'All levels, balanced goals',
  },
  {
    name: 'Push/Pull/Legs (PPL)',
    days: 6,
    description: 'Classic PPL split, 6x/week. High frequency and volume.',
    pros: ['High training frequency', 'Customizable', 'Popular for hypertrophy'],
    cons: ['Requires 5-6 days/week', 'Can be hard to recover for some'],
    recommendedFor: 'Intermediate/advanced, muscle gain',
  },
  {
    name: 'Body Part Split',
    days: 5,
    description: '"Bro split" with one muscle group per day. 5x/week.',
    pros: ['High volume per muscle group', 'Simple to follow'],
    cons: ['Low frequency per muscle group', 'Not optimal for all goals'],
    recommendedFor: 'Advanced, bodybuilding',
  },
  {
    name: 'Custom',
    days: 0,
    description: 'Your own split (e.g., PPL + arms/core + cardio). Tailored to your needs.',
    pros: ['Fully personalized', 'Can address specific goals'],
    cons: ['Requires planning', 'May lack structure if not careful'],
    recommendedFor: 'Experienced, specific needs',
  },
];

export function recommendTrainingSplit(input: RecommendationInput): SplitOption {
  // 1. If beginner or time-constrained, recommend Full Body or Upper/Lower
  if (input.experienceLevel === 'beginner' || input.availableDays <= 3) {
    return SPLITS[0]; // Full Body 3x
  }
  // 2. If muscle gain is primary and 5+ days, recommend PPL or Body Part
  if (
    input.primaryGoal.toLowerCase().includes('muscle') &&
    input.availableDays >= 5 &&
    input.experienceLevel !== 'beginner'
  ) {
    return input.availableDays >= 6 ? SPLITS[2] : SPLITS[3];
  }
  // 3. If weight loss/endurance and 4+ days, recommend Upper/Lower
  if (
    (input.primaryGoal.toLowerCase().includes('weight') ||
      input.primaryGoal.toLowerCase().includes('endurance')) &&
    input.availableDays >= 4
  ) {
    return SPLITS[1]; // Upper/Lower
  }
  // 4. If user has unique equipment or preferences, recommend Custom
  if (
    input.secondaryGoals.includes('specific equipment') ||
    input.equipment.includes('unusual')
  ) {
    return SPLITS[4]; // Custom
  }
  // 5. Default: Upper/Lower
  return SPLITS[1];
}
