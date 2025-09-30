# Quickstart Guide: Advanced Wearable Integration

**Branch**: `010-advanced-wearable-integration` | **Generated**: 2025-09-29 | **Based on**: [plan.md](./plan.md)

**🚨 EXISTING INFRASTRUCTURE**: This feature builds on substantial existing wearable integration. Follow this guide to extend current Fitbit/WHOOP support with comprehensive multi-device capabilities.

## Quick Integration Overview

**Estimated Time**: 20-30 minutes to understand and extend existing system  
**Prerequisites**: Existing wearable infrastructure (Fitbit, WHOOP)  
**Output**: Multi-device wearable system with advanced health metrics

## Step 1: Understand Existing Infrastructure (5 minutes)

### Explore Current Implementation

```bash
# Navigate to existing wearable services
cd app/src/lib/services

# Examine current Fitbit integration
code FitbitDataService.ts

# Check existing WHOOP integration
find . -name "*whoop*" -o -name "*WHOOP*"

# Review existing workout controller
code ../components/WearableWorkoutController.svelte
```

### Key Existing Components

```typescript
// 1. Existing FitbitDataService.ts - OAuth and data collection
class FitbitDataService {
  // ✅ OAuth authentication flow
  // ✅ Heart rate data collection  
  // ✅ Step and activity tracking
  // ✅ Sleep data import
  // ✅ Real-time workout monitoring
}

// 2. Existing WearableWorkoutController.svelte - Real-time UI
// ✅ Workout session management
// ✅ Real-time heart rate display
// ✅ Device connection status
// ✅ Basic health metric visualization

// 3. Existing WHOOP integration
// ✅ HRV data collection
// ✅ Recovery score integration
// ✅ Training load monitoring
// ✅ Sleep analysis capabilities
```

## Step 2: Set Up Multi-Device Architecture (10 minutes)

### Create Device Manager Foundation

```typescript
// app/src/lib/services/wearables/DeviceManager.ts
import { FitbitDataService } from './FitbitDataService';
import { WHOOPClient } from './WHOOPClient';

export class DeviceManager {
  private devices: Map<string, WearableService> = new Map();
  private primaryDevice: string | null = null;
  
  constructor() {
    // Initialize existing services
    this.devices.set('fitbit', new FitbitDataService());
    this.devices.set('whoop', new WHOOPClient());
  }
  
  // Add new device support
  async addDevice(type: WearableDeviceType, config: DeviceConfig) {
    switch (type) {
      case 'apple_watch':
        const appleWatch = new AppleWatchService(config);
        this.devices.set('apple_watch', appleWatch);
        break;
      case 'garmin':
        const garmin = new GarminService(config);
        this.devices.set('garmin', garmin);
        break;
      // ... other devices
    }
  }
  
  // Multi-device data collection
  async collectRealTimeData(): Promise<HealthMetric[]> {
    const allMetrics: HealthMetric[] = [];
    
    for (const [deviceId, service] of this.devices) {
      if (service.isConnected()) {
        const metrics = await service.getRealtimeData();
        allMetrics.push(...metrics);
      }
    }
    
    // Resolve conflicts and return quality data
    return this.resolveConflicts(allMetrics);
  }
}
```

### Extend Existing UI Components

```svelte
<!-- app/src/lib/components/wearables/MultiDeviceController.svelte -->
<script lang="ts">
  import WearableWorkoutController from './WearableWorkoutController.svelte';
  import { deviceManager } from '$lib/stores/deviceManager';
  import { connectedDevices } from '$lib/stores/wearableDevices';
  
  // Build on existing workout controller
  export let workoutSession;
  
  $: devices = $connectedDevices;
  $: primaryDevice = devices.find(d => d.priority === 1);
</script>

<div class="multi-device-controller">
  <!-- Existing workout controller as primary -->
  <WearableWorkoutController 
    {workoutSession} 
    device={primaryDevice}
    class="primary-controller"
  />
  
  <!-- Additional device status displays -->
  {#each devices.slice(1) as device}
    <div class="secondary-device">
      <DeviceStatusIndicator {device} />
      <HealthMetricDisplay deviceId={device.id} />
    </div>
  {/each}
  
  <!-- New multi-device controls -->
  <DeviceManager />
  <DataQualityIndicator />
</div>
```

## Step 3: Add Your First New Device (8 minutes)

### Example: Apple Watch Integration

```typescript
// app/src/lib/services/wearables/AppleWatchService.ts
import { BaseWearableService } from './BaseWearableService';
import { HealthKit } from '@capacitor-community/health';

export class AppleWatchService extends BaseWearableService {
  deviceType = 'apple_watch' as const;
  
  async initialize(): Promise<void> {
    // Request HealthKit permissions
    await HealthKit.requestAuthorization({
      read: [
        'HKQuantityTypeIdentifierHeartRate',
        'HKQuantityTypeIdentifierStepCount',
        'HKCategoryTypeIdentifierSleepAnalysis',
        'HKQuantityTypeIdentifierHeartRateVariabilitySDNN'
      ]
    });
  }
  
  async getRealtimeHeartRate(): Promise<HealthMetric> {
    const result = await HealthKit.queryHKitSampleType({
      sampleType: 'HKQuantityTypeIdentifierHeartRate',
      startDate: new Date(Date.now() - 30000), // Last 30 seconds
      endDate: new Date(),
      limit: 1
    });
    
    return {
      metricType: 'heart_rate',
      value: result.samples[0]?.value || 0,
      timestamp: Date.now(),
      deviceId: this.deviceId,
      quality: this.assessDataQuality(result),
      confidence: 95 // HealthKit typically high confidence
    };
  }
  
  // Implement required methods from BaseWearableService
  async connect(): Promise<void> { /* ... */ }
  async disconnect(): Promise<void> { /* ... */ }
  async syncData(): Promise<HealthMetric[]> { /* ... */ }
}
```

### Register New Device

```typescript
// app/src/lib/stores/deviceManager.ts
import { writable } from 'svelte/store';
import { DeviceManager } from '$lib/services/wearables/DeviceManager';

const manager = new DeviceManager();

// Register Apple Watch
manager.addDevice('apple_watch', {
  name: 'Apple Watch',
  capabilities: {
    heartRate: true,
    hrv: true,
    spo2: true,
    sleep: true,
    workouts: true,
    realTimeUpdates: true
  }
});

export const deviceManager = writable(manager);
```

## Step 4: Enhance Data Quality System (5 minutes)

### Add Data Validation

```typescript
// app/src/lib/services/health/DataValidator.ts
export class DataValidator {
  static validateHeartRate(metric: HealthMetric): DataQuality {
    const value = metric.value as number;
    const quality: DataQuality = {
      accuracy: 100,
      completeness: 100,
      consistency: 100,
      timeliness: 100,
      deviceReliability: 90,
      validationsPassed: [],
      validationsFailed: []
    };
    
    // Heart rate validation rules
    if (value < 30 || value > 220) {
      quality.accuracy = 0;
      quality.validationsFailed.push('heart_rate_out_of_range');
    } else {
      quality.validationsPassed.push('heart_rate_range_valid');
    }
    
    // Temporal consistency check
    const timeSinceLastReading = Date.now() - metric.timestamp;
    if (timeSinceLastReading > 60000) { // > 1 minute old
      quality.timeliness = Math.max(0, 100 - (timeSinceLastReading / 1000));
    }
    
    return quality;
  }
  
  static validateMetric(metric: HealthMetric): DataQuality {
    switch (metric.metricType) {
      case 'heart_rate':
        return this.validateHeartRate(metric);
      case 'spo2':
        return this.validateSpO2(metric);
      case 'hrv_rmssd':
        return this.validateHRV(metric);
      default:
        return this.validateGeneric(metric);
    }
  }
}
```

### Add Conflict Resolution

```typescript
// app/src/lib/services/health/ConflictResolver.ts
export class ConflictResolver {
  static resolveHeartRateConflict(conflicts: ConflictingValue[]): number {
    // Strategy: Use highest quality device
    const sortedByQuality = conflicts.sort((a, b) => b.quality - a.quality);
    const bestQuality = sortedByQuality[0];
    
    // If quality difference is small, average the values
    const qualityDiff = bestQuality.quality - sortedByQuality[1]?.quality || 0;
    if (qualityDiff < 10) {
      const avg = conflicts.reduce((sum, c) => sum + (c.value as number), 0) / conflicts.length;
      return Math.round(avg);
    }
    
    return bestQuality.value as number;
  }
  
  static async resolveConflict(conflict: DataConflict): Promise<ConflictResolution> {
    let resolvedValue: number | HealthMetricValue;
    
    switch (conflict.metricType) {
      case 'heart_rate':
        resolvedValue = this.resolveHeartRateConflict(conflict.values);
        break;
      default:
        resolvedValue = this.resolveGenericConflict(conflict.values);
    }
    
    return {
      conflictId: conflict.id,
      strategy: 'highest_quality',
      resolvedValue,
      confidence: 85,
      timestamp: Date.now()
    };
  }
}
```

## Step 5: Test Integration (2 minutes)

### Quick Test Script

```typescript
// test-multi-device.ts
import { DeviceManager } from '$lib/services/wearables/DeviceManager';

async function testMultiDevice() {
  const manager = new DeviceManager();
  
  // Test existing Fitbit
  console.log('Testing Fitbit connection...');
  const fitbitConnected = await manager.testConnection('fitbit');
  console.log('Fitbit:', fitbitConnected ? '✅ Connected' : '❌ Failed');
  
  // Test new Apple Watch
  console.log('Testing Apple Watch connection...');
  const appleWatchConnected = await manager.testConnection('apple_watch');
  console.log('Apple Watch:', appleWatchConnected ? '✅ Connected' : '❌ Failed');
  
  // Test real-time data collection
  console.log('Collecting real-time data...');
  const metrics = await manager.collectRealTimeData();
  console.log(`Collected ${metrics.length} metrics from ${manager.connectedDeviceCount} devices`);
  
  // Test conflict resolution
  const conflicts = manager.detectConflicts(metrics);
  console.log(`Detected ${conflicts.length} conflicts`);
  
  if (conflicts.length > 0) {
    const resolutions = await manager.resolveConflicts(conflicts);
    console.log(`Resolved ${resolutions.length} conflicts`);
  }
}

// Run test
testMultiDevice().catch(console.error);
```

### Validate Integration

```bash
# Test the integration
npm run test:wearables

# Check for TypeScript errors
npm run type-check

# Validate real-time performance
npm run test:performance:wearables
```

## Integration Checklist

### ✅ Preparation (Complete)
- [x] Existing Fitbit integration reviewed
- [x] Existing WHOOP integration reviewed  
- [x] Current UI components identified
- [x] Data flow architecture understood

### 🔄 Enhancement Tasks (In Progress)
- [ ] DeviceManager service created
- [ ] First new device integration (Apple Watch) added
- [ ] Multi-device UI components enhanced
- [ ] Data validation system implemented
- [ ] Conflict resolution system added
- [ ] Real-time performance validated

### ⏭️ Next Steps
- [ ] Add remaining devices (Garmin, Samsung, Polar, Oura)
- [ ] Implement advanced health metrics (SpO2, HRV, stress)
- [ ] Add comprehensive offline synchronization
- [ ] Create device management interface
- [ ] Implement privacy and security controls

## Performance Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Real-time latency | <5s | ~3s (Fitbit) | ✅ Meeting |
| Device connection | <30s | ~15s (Fitbit) | ✅ Meeting |
| Data quality score | >90% | ~85% (current) | 🔄 Improving |
| Conflict resolution | <2s | TBD | 🔄 Implementing |
| Offline sync | <2min | TBD | 🔄 Implementing |

## Troubleshooting

### Common Issues

**Q: Existing Fitbit integration stops working**  
**A**: Check DeviceManager initialization order. Ensure existing FitbitDataService is properly wrapped, not replaced.

**Q: Real-time data latency increases**  
**A**: Verify device priority settings. High-priority devices should be polled first. Check network conditions.

**Q: Data conflicts not resolving**  
**A**: Verify ConflictResolver has rules for specific metric types. Check device quality scores are properly calculated.

**Q: New device not connecting**  
**A**: Verify device-specific SDK integration. Check platform permissions (iOS HealthKit, Android Health Connect).

### Debug Commands

```bash
# Check device connection status
npm run debug:device-status

# Monitor real-time data flow
npm run debug:realtime-data

# Validate data quality
npm run debug:data-quality

# Test conflict resolution
npm run debug:conflicts
```

## Next Development Phase

After completing this quickstart:

1. **Expand Device Support**: Add Garmin, Samsung, Polar, Oura Ring
2. **Advanced Health Metrics**: Implement SpO2, stress, comprehensive sleep analysis
3. **Data Quality Enhancement**: Add machine learning-based outlier detection
4. **Privacy Controls**: Implement granular health data permissions
5. **Performance Optimization**: Optimize for battery life and data bandwidth

---

**🚀 Quick Win**: Building on existing 60% infrastructure means faster development and reliable foundation  
**📈 Performance**: Real-time multi-device data with <5s latency and 90%+ quality scores  
**🔒 Privacy**: HIPAA-ready health data encryption and granular permission controls  
**🎯 Goal**: Transform existing wearable integration into comprehensive multi-device health monitoring system