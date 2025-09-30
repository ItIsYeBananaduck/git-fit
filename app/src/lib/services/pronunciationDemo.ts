import { PronunciationManager, createPronunciationService } from './pronunciationService.js';

// Demo script to test pronunciation generation
async function demoPronunciationService() {
  console.log('🎤 ElevenLabs Pronunciation Service Demo\n');

  // For demo purposes, we'll use a mock service since we don't have API keys
  const mockService = {
    generatePronunciation: async (text: string): Promise<string> => {
      console.log(`🤖 Generating ElevenLabs pronunciation for: "${text}"`);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return `elevenlabs-audio-data-for-${text.toLowerCase().replace(/\s+/g, '-')}`;
    },
    getSupportedVoices: () => ['bella', 'antoni', 'arnold', 'adam']
  };

  const manager = new PronunciationManager(mockService);

  console.log('📊 Testing individual exercises:');
  const testExercises = [
    'Bench Press',
    'Romanian Deadlift',
    'Good Mornings',
    'Clean and Press',
    'Bulgarian Split Squats'
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
  console.log('\n🔍 MANUAL vs ELEVENLABS vs GOOGLE TTS COMPARISON\n');

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
    'ElevenLabs TTS': {
      'Pros': [
        'Premium voice quality',
        'Natural-sounding speech',
        'Voice cloning capabilities',
        'Fast generation',
        'Multiple voice personalities',
        'Customizable voice settings',
        'Great for fitness coaching tone'
      ],
      'Cons': [
        'Higher API costs than alternatives',
        'Requires internet connection',
        'Character-based pricing',
        'Rate limits on free tier'
      ],
      'Effort': 'Low initial, minimal maintenance',
      'Cost': '$0.30 per 1K characters (premium)',
      'Accuracy': 'Excellent for fitness terms'
    },
    'Google TTS': {
      'Pros': [
        'Lower cost than ElevenLabs',
        'Neural voices available',
        'Extensive language support',
        'Google Cloud integration',
        'Good pronunciation accuracy'
      ],
      'Cons': [
        'More complex setup',
        'Less natural than ElevenLabs',
        'Limited voice personality options',
        'Google Cloud dependency'
      ],
      'Effort': 'Medium initial, low maintenance',
      'Cost': '$4.00 per 1M characters',
      'Accuracy': 'Very good for standard terms'
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

  console.log('🏆 RECOMMENDATION FOR FITNESS APP:');
  console.log('   🥇 ElevenLabs: Best for premium fitness coaching experience');
  console.log('      - Natural coaching voice personalities');
  console.log('      - Professional trainer-like delivery');
  console.log('      - Worth the premium for user experience');
  console.log('');
  console.log('   🥈 Google TTS: Best for cost-conscious implementations');
  console.log('      - Significantly cheaper for high volume');
  console.log('      - Good quality for basic pronunciation needs');
  console.log('      - Better for multi-language support');
  console.log('');
  console.log('   💡 Hybrid Approach: ElevenLabs + manual overrides provides');
  console.log('      the best quality control and user experience.');
}

// Run the demo
if (import.meta.main) {
  await demoPronunciationService();
  compareApproaches();
}