import { PronunciationManager } from './pronunciationService.js';

// Demo script to test pronunciation generation
async function demoPronunciationService() {
  console.log('🎤 Pronunciation Service Demo\n');

  // For demo purposes, we'll use a mock service since we don't have API keys
  const mockService = {
    generatePronunciation: async (text: string): Promise<string> => {
      console.log(`🤖 Generating pronunciation for: "${text}"`);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return `mock-audio-data-for-${text.toLowerCase().replace(/\s+/g, '-')}`;
    },
    getSupportedVoices: () => ['alloy', 'echo', 'fable']
  };

  const manager = new PronunciationManager(mockService);

  console.log('📊 Testing individual exercises:');
  const testExercises = [
    'Bench Press',
    'Romanian Deadlift',
    'Good Mornings',
    'Clean and Press'
  ];

  for (const exercise of testExercises) {
    try {
      const pronunciation = await manager.getPronunciation(exercise);
      console.log(`✅ ${exercise}: ${pronunciation}`);
    } catch (error) {
      console.log(`❌ ${exercise}: Failed - ${error}`);
    }
  }

  console.log('\n📈 Cache stats:', manager.getCacheStats());

  console.log('\n🚀 Preloading all exercises...');
  await manager.preloadExercisePronunciations();

  console.log('📈 Final cache stats:', manager.getCacheStats());
}

// Comparison analysis
function compareApproaches() {
  console.log('\n🔍 MANUAL vs AI APPROACH COMPARISON\n');

  const comparison = {
    'Manual Approach': {
      'Pros': [
        'No API costs',
        'Works offline',
        'Predictable pronunciations',
        'Full control over output'
      ],
      'Cons': [
        'Time-consuming to create',
        'Requires phonetic knowledge',
        'Limited to creator\'s knowledge',
        'Hard to maintain/update',
        'Inconsistent quality'
      ],
      'Effort': 'High initial, low maintenance',
      'Cost': '$0',
      'Accuracy': 'Depends on creator expertise'
    },
    'AI Approach': {
      'Pros': [
        'Fast generation',
        'High quality pronunciations',
        'Handles complex terms well',
        'Easy to scale',
        'Consistent quality',
        'Can learn from corrections'
      ],
      'Cons': [
        'API costs (per request)',
        'Requires internet connection',
        'Dependent on service availability',
        'May need manual overrides for edge cases',
        'Less control over specific pronunciations'
      ],
      'Effort': 'Low initial, some maintenance',
      'Cost': '$0.015-0.030 per 1K characters',
      'Accuracy': 'Very high for standard terms'
    }
  };

  for (const [approach, details] of Object.entries(comparison)) {
    console.log(`📋 ${approach}:`);
    console.log(`   💰 Cost: ${details.Cost}`);
    console.log(`   ⏱️  Effort: ${details.Effort}`);
    console.log(`   🎯 Accuracy: ${details.Accuracy}`);
    console.log(`   ✅ Pros: ${details.Pros.join(', ')}`);
    console.log(`   ❌ Cons: ${details.Cons.join(', ')}\n`);
  }

  console.log('🏆 RECOMMENDATION:');
  console.log('   For a fitness app with 50+ exercises, AI approach is significantly easier');
  console.log('   and more accurate. The hybrid approach (AI + manual overrides) provides');
  console.log('   the best of both worlds: fast generation + quality control.');
}

// Run the demo
if (import.meta.main) {
  await demoPronunciationService();
  compareApproaches();
}