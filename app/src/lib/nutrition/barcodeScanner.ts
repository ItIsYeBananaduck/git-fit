// File: barcodeScanner.ts

/**
 * Barcode Scanner for Nutrition Logging
 * Purpose: Scan food barcodes and log nutrition data using device camera
 */

import type { FoodItem } from './nutritionCalculator';
import type { BarcodeResult, FoodDatabaseService } from './foodDatabaseService';

export interface BarcodeScannerResult {
  success: boolean;
  barcode?: string;
  food?: FoodItem;
  error?: string;
  source?: 'camera' | 'manual';
}

export interface ScannerConfig {
  enableFlashlight: boolean;
  enableManualEntry: boolean;
  scanTimeout: number; // milliseconds
  enableVibration: boolean;
  enableSound: boolean;
}

/**
 * Enhanced Barcode Scanner with camera integration
 */
export class BarcodeScanner {
  private isInitialized = false;
  private isScanning = false;
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private config: ScannerConfig;
  private scanHistory: string[] = [];

  constructor(
    private foodService: FoodDatabaseService,
    config: Partial<ScannerConfig> = {}
  ) {
    this.config = {
      enableFlashlight: true,
      enableManualEntry: true,
      scanTimeout: 10000, // 10 seconds
      enableVibration: true,
      enableSound: true,
      ...config
    };
  }

  /**
   * Initialize the barcode scanner with camera access
   */
  async initializeScanner(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request camera permissions
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize camera:', error);
      throw new Error('Camera access denied or not available');
    }
  }

  /**
   * Start barcode scanning with camera preview
   */
  async startScanning(videoElement: HTMLVideoElement): Promise<BarcodeScannerResult> {
    if (!this.isInitialized) {
      await this.initializeScanner();
    }

    if (this.isScanning) {
      throw new Error('Scanner is already active');
    }

    this.video = videoElement;
    this.isScanning = true;

    // Set up video stream
    this.video.srcObject = this.stream;
    this.video.play();

    // Create canvas for image capture
    this.canvas = document.createElement('canvas');

    return new Promise((resolve) => {
      const scanInterval = setInterval(async () => {
        if (!this.isScanning) {
          clearInterval(scanInterval);
          return;
        }

        try {
          const barcode = await this.detectBarcode();
          if (barcode) {
            this.stopScanning();
            const result = await this.processBarcode(barcode);
            resolve(result);
          }
        } catch (error) {
          console.error('Barcode detection error:', error);
        }
      }, 500); // Scan every 500ms

      // Timeout after configured time
      setTimeout(() => {
        if (this.isScanning) {
          this.stopScanning();
          resolve({
            success: false,
            error: 'Scan timeout - no barcode detected',
            source: 'camera'
          });
        }
      }, this.config.scanTimeout);
    });
  }

  /**
   * Stop barcode scanning
   */
  stopScanning(): void {
    this.isScanning = false;
    
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
    }
  }

  /**
   * Process a manually entered barcode
   */
  async scanManualBarcode(barcode: string): Promise<BarcodeScannerResult> {
    if (!this.validateBarcode(barcode)) {
      return {
        success: false,
        error: 'Invalid barcode format',
        source: 'manual'
      };
    }

    return await this.processBarcode(barcode);
  }

  /**
   * Validate barcode format
   */
  validateBarcode(barcode: string): boolean {
    // Remove any non-digit characters
    const cleanBarcode = barcode.replace(/\D/g, '');
    
    // Check common barcode lengths
    const validLengths = [8, 12, 13, 14]; // EAN-8, UPC-A, EAN-13, ITF-14
    
    if (!validLengths.includes(cleanBarcode.length)) {
      return false;
    }

    // Validate check digit for EAN/UPC codes
    if (cleanBarcode.length === 13 || cleanBarcode.length === 12) {
      return this.validateEANCheckDigit(cleanBarcode);
    }

    return true;
  }

  /**
   * Toggle flashlight (if supported)
   */
  async toggleFlashlight(): Promise<boolean> {
    if (!this.stream || !this.config.enableFlashlight) {
      return false;
    }

    try {
      const track = this.stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if (capabilities.torch) {
        const settings = track.getSettings();
        await track.applyConstraints({
          advanced: [{ torch: !settings.torch }]
        });
        return !settings.torch;
      }
    } catch (error) {
      console.error('Flashlight toggle error:', error);
    }

    return false;
  }

  /**
   * Get scan history
   */
  getScanHistory(): string[] {
    return [...this.scanHistory];
  }

  /**
   * Clear scan history
   */
  clearScanHistory(): void {
    this.scanHistory = [];
  }

  /**
   * Release camera resources
   */
  dispose(): void {
    this.stopScanning();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.isInitialized = false;
  }

  // Private methods

  private async detectBarcode(): Promise<string | null> {
    if (!this.video || !this.canvas) return null;

    const context = this.canvas.getContext('2d');
    if (!context) return null;

    // Capture current video frame
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    context.drawImage(this.video, 0, 0);

    // Get image data
    const imageData = context.getImageData(0, 0, this.canvas.width, this.canvas.height);

    // Use BarcodeDetector API if available
    if ('BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector();
        const barcodes = await detector.detect(imageData);
        
        if (barcodes.length > 0) {
          return barcodes[0].rawValue;
        }
      } catch (error) {
        console.error('BarcodeDetector error:', error);
      }
    }

    // Fallback: Use simple pattern detection
    return this.fallbackBarcodeDetection(imageData);
  }

  private fallbackBarcodeDetection(imageData: ImageData): string | null {
    // This is a simplified barcode detection
    // In a real implementation, you'd use a library like QuaggaJS or ZXing
    
    // For now, return null to indicate no barcode found
    // This would need a proper barcode detection algorithm
    return null;
  }

  private async processBarcode(barcode: string): Promise<BarcodeScannerResult> {
    try {
      // Add to scan history
      this.addToScanHistory(barcode);

      // Lookup food data
      const result: BarcodeResult = await this.foodService.lookupByBarcode(barcode);

      if (result.found && result.food) {
        // Provide haptic feedback
        if (this.config.enableVibration && 'vibrate' in navigator) {
          navigator.vibrate(100);
        }

        // Provide audio feedback
        if (this.config.enableSound) {
          this.playSuccessSound();
        }

        return {
          success: true,
          barcode,
          food: result.food,
          source: 'camera'
        };
      } else {
        return {
          success: false,
          barcode,
          error: 'Food not found in database',
          source: 'camera'
        };
      }
    } catch (error) {
      console.error('Barcode processing error:', error);
      return {
        success: false,
        barcode,
        error: 'Failed to process barcode',
        source: 'camera'
      };
    }
  }

  private validateEANCheckDigit(barcode: string): boolean {
    const digits = barcode.split('').map(Number);
    const checkDigit = digits.pop()!;
    
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }
    
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    return calculatedCheckDigit === checkDigit;
  }

  private addToScanHistory(barcode: string): void {
    // Remove if already exists
    const index = this.scanHistory.indexOf(barcode);
    if (index > -1) {
      this.scanHistory.splice(index, 1);
    }

    // Add to beginning
    this.scanHistory.unshift(barcode);

    // Keep only last 20 scans
    this.scanHistory = this.scanHistory.slice(0, 20);
  }

  private playSuccessSound(): void {
    try {
      // Create a simple success beep
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }
}

// Compatibility interfaces for legacy code
export interface BarcodeScanner_Legacy {
  initializeScanner(): Promise<void>;
  scanBarcode(barcode: string): Promise<FoodData>;
  validateBarcode(barcode: string): boolean;
  logFoodData(foodData: FoodData): Promise<void>;
}

export interface FoodData {
  name: string;
  calories: number;
  macronutrients: Macronutrients;
  servingSize: string;
}

export interface Macronutrients {
  protein: number; // in grams
  carbs: number; // in grams
  fats: number; // in grams
}
