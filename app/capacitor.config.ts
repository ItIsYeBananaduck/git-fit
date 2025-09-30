import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.adaptivefit',
  appName: 'Adaptive fIt',
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
    Haptics: {
      // Haptic feedback configuration
    },
    Camera: {
      // Camera permissions and configuration
      ios: {
        cameraUsageDescription: 'This app uses the camera to scan QR codes for quick workout tracking.'
      },
      android: {
        requestPermissions: true
      }
    },
    BiometricAuth: {
      // Biometric authentication configuration
      allowDeviceCredential: true,
      ios: {
        biometryUsageDescription: 'Use biometric authentication for secure app access.'
      }
    }
  },
};

export default config;
