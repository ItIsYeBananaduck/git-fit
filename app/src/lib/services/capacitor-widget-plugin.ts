// Placeholder Capacitor plugin for widget functionality
// This will be replaced by the actual native plugin when built for mobile

export interface CapacitorWidgetPlugin {
  updateStrainWidget(options: {
    status: 'ready' | 'moderate' | 'compromised' | 'high_risk';
    compositeScore: number;
    nextWorkout?: string;
    intensity: string;
  }): Promise<{ success: boolean; message: string }>;

  clearWidgetData(): Promise<{ success: boolean; message: string }>;
}

// Web fallback implementation
const WebCapacitorWidget: CapacitorWidgetPlugin = {
  async updateStrainWidget(options) {
    console.log('Widget update (web mode):', options);
    return {
      success: false,
      message: 'Widget functionality only available on iOS/Android'
    };
  },

  async clearWidgetData() {
    console.log('Widget clear (web mode)');
    return {
      success: false,
      message: 'Widget functionality only available on iOS/Android'
    };
  }
};

export { WebCapacitorWidget as CapacitorWidget };