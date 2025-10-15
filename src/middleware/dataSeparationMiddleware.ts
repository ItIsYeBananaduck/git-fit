// dataSeparationMiddleware.ts
// Middleware to handle data separation for Teams social data

import LocalStorageService from '../services/localStorageService';

export class DataSeparationMiddleware {
  private excludedKeys: string[];

  constructor(excludedKeys: string[] = ['teamsSocialData']) {
    this.excludedKeys = excludedKeys;
  }

  async filterData(userId: string, data: any): Promise<any> {
    const filteredData = { ...data };
    this.excludedKeys.forEach((key) => {
      if (key in filteredData) {
        delete filteredData[key];
      }
    });

    // Save filtered data to local storage
    await LocalStorageService.saveData(userId, filteredData);
    return filteredData;
  }

  async handleTeamsData(userId: string, data: any): Promise<void> {
    if ('teamsSocialData' in data) {
      // Handle Teams social data separately (e.g., send to server)
      console.log('Handling Teams social data for user:', userId);
      // Add server handling logic here
    }
  }
}

export default new DataSeparationMiddleware();