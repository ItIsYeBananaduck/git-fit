import { polarDataService } from '../services/polarDataService.js';

// Re-export stores for easy access
export const polarAuthState = polarDataService.authState;
export const polarData = polarDataService.data;
export const polarLoading = polarDataService.loading;
export const polarError = polarDataService.error;

// Re-export service methods
export const connectToPolar = polarDataService.connect.bind(polarDataService);
export const handlePolarCallback = polarDataService.handleCallback.bind(polarDataService);
export const refreshPolarData = polarDataService.refreshData.bind(polarDataService);
export const disconnectFromPolar = polarDataService.disconnect.bind(polarDataService);