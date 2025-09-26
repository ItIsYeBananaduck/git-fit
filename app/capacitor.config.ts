import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.technicallyfit',
  appName: 'Technically Fit',
  webDir: 'dist',
  plugins: {
    HealthData: {
      // iOS HealthKit configuration
      ios: {
        healthKitUsageDescription: 'This app uses HealthKit to track your fitness data and provide personalized workout recommendations.',
        healthKitReadTypes: [
          'HKQuantityTypeIdentifierHeartRate',
          'HKQuantityTypeIdentifierOxygenSaturation',
          'HKCategoryTypeIdentifierSleepAnalysis',
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          'HKQuantityTypeIdentifierStepCount',
        ],
      },
      // Android Health Connect configuration
      android: {
        healthConnectPermissions: [
          'android.permission.health.READ_HEART_RATE',
          'android.permission.health.READ_OXYGEN_SATURATION',
          'android.permission.health.READ_SLEEP',
          'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
          'android.permission.health.READ_STEPS',
        ],
      },
    },
  },
};

export default config;
