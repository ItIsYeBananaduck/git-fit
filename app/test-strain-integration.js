// Simple integration test for strain assessment service
console.log('🧪 Testing Strain Assessment Integration');

// Mock data for testing
const mockWearableData = {
  restingHeartRate: 65,
  spo2: 96,
  hrv: 45,
  sleepScore: 85
};

const mockUserProfile = {
  age: 30,
  fitnessLevel: 'intermediate',
  baselineHR: 60,
  baselineSpO2: 98
};

const mockRecentSessions = [
  {
    id: 'session1',
    userId: 'test-user',
    date: '2024-01-15',
    exerciseId: 'squat',
    plannedParams: {
      load: 80,
      reps: 8,
      sets: 3,
      restBetweenSets: 120,
      restBetweenExercises: 180,
      intensity: 'moderate',
      isDeloadWeek: false
    },
    actualParams: {
      load: 80,
      reps: 8,
      sets: 3,
      restBetweenSets: 120,
      restBetweenExercises: 180,
      intensity: 'moderate',
      isDeloadWeek: false
    },
    completedReps: [8, 8, 7],
    perceivedEffort: 7,
    recoveryBefore: 65,
    strainAfter: 14,
    adaptationScore: 0.8,
    targetStrain: 15,
    actualStrain: 14
  }
];

console.log('✅ Mock data created');
console.log('📊 Test data:', {
  hr: mockWearableData.restingHeartRate,
  spo2: mockWearableData.spo2,
  sessions: mockRecentSessions.length
});

console.log('🎯 Integration test setup complete - ready for TypeScript compilation and execution');