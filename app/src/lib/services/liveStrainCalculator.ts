/**
 * Live Strain Calculator (Device-Only)
 * 
 * Calculates real-time strain using the formula from the spec:
 * (0.4 × HR rise) + (0.3 × SpO₂ drop) + (0.3 × recovery delay)
 * 
 * IMPORTANT: This data stays on-device only and is never stored permanently
 */

export interface StrainData {
  currentHR: number;
  baselineHR: number;
  currentSpO2: number;
  baselineSpO2: number;
  recoveryDelayMs: number;
  timestamp: number;
}

export interface LiveStrainResult {
  strainScore: number; // 0-100
  hrRise: number;
  spo2Drop: number;
  recoveryDelayFactor: number;
  status: 'green' | 'yellow' | 'red'; // ≤85%, 86-95%, >95%
  timestamp: number;
}

/**
 * Real-time strain calculator following spec formula
 * Data remains on-device only, never stored permanently
 */
export class LiveStrainCalculator {
  private static readonly STRAIN_THRESHOLDS = {
    GREEN_MAX: 85,
    YELLOW_MAX: 95
  };

  private static readonly RECOVERY_DELAY_BASELINE = 30000; // 30 seconds baseline

  /**
   * Calculate live strain using spec formula
   * (0.4 × HR rise) + (0.3 × SpO₂ drop) + (0.3 × recovery delay)
   */
  static calculateLiveStrain(data: StrainData): LiveStrainResult {
    // Calculate HR rise (normalized 0-100)
    const hrRise = Math.max(0, data.currentHR - data.baselineHR);
    const hrRiseNormalized = Math.min(100, (hrRise / 60) * 100); // Cap at 60 bpm rise = 100

    // Calculate SpO2 drop (normalized 0-100)
    const spo2Drop = Math.max(0, data.baselineSpO2 - data.currentSpO2);
    const spo2DropNormalized = Math.min(100, (spo2Drop / 10) * 100); // Cap at 10% drop = 100

    // Calculate recovery delay factor (normalized 0-100)
    const recoveryDelayFactor = Math.min(100, 
      (data.recoveryDelayMs / this.RECOVERY_DELAY_BASELINE) * 100
    );

    // Apply spec formula: (0.4 × HR rise) + (0.3 × SpO₂ drop) + (0.3 × recovery delay)
    const strainScore = Math.round(
      (0.4 * hrRiseNormalized) + 
      (0.3 * spo2DropNormalized) + 
      (0.3 * recoveryDelayFactor)
    );

    // Determine status based on thresholds
    let status: 'green' | 'yellow' | 'red';
    if (strainScore <= this.STRAIN_THRESHOLDS.GREEN_MAX) {
      status = 'green';
    } else if (strainScore <= this.STRAIN_THRESHOLDS.YELLOW_MAX) {
      status = 'yellow';
    } else {
      status = 'red';
    }

    return {
      strainScore: Math.min(100, Math.max(0, strainScore)),
      hrRise: hrRiseNormalized,
      spo2Drop: spo2DropNormalized,
      recoveryDelayFactor,
      status,
      timestamp: data.timestamp
    };
  }

  /**
   * Get strain modifier for intensity calculations
   * 1.0 (≤85%), 0.95 (86–95%), 0.85 (>95%)
   */
  static getStrainModifier(strainScore: number): number {
    if (strainScore <= 85) return 1.0;
    if (strainScore <= 95) return 0.95;
    return 0.85;
  }

  /**
   * Check if auto-extend rest is needed (strain > 85%)
   */
  static shouldAutoExtendRest(strainScore: number): boolean {
    return strainScore > 85;
  }

  /**
   * Detect if this is a "life pause" (phone flat + strain drop)
   * Used to ignore strain drops when user pauses workout
   */
  static isLifePause(
    strainDrop: number, 
    isPhoneFlat: boolean, 
    dropDurationMs: number
  ): boolean {
    return isPhoneFlat && strainDrop > 10 && dropDurationMs < 3000;
  }

  /**
   * Detect forgotten set (erratic acceleration + strain drop >10% in 3s)
   */
  static isSetForgotten(
    accelerationVariance: number,
    strainDrop: number,
    dropDurationMs: number
  ): boolean {
    const isErraticAcceleration = accelerationVariance > 2.0; // threshold for "erratic"
    const isRapidStrainDrop = strainDrop > 10 && dropDurationMs < 3000;
    
    return isErraticAcceleration && isRapidStrainDrop;
  }
}

// Export for wearable use
export const liveStrainCalculator = LiveStrainCalculator;