// localStorageService.ts
// Service to handle local storage using IndexedDB

export class LocalStorageService {
  private dbName: string;
  private storeName: string;

  constructor(dbName: string = 'AdaptiveFitDB', storeName: string = 'UserData') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'userId' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async saveData(userId: string, data: any): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction(this.storeName, 'readwrite');
    const store = transaction.objectStore(this.storeName);
    store.put({ userId, ...data });
  }

  async getData(userId: string): Promise<any> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(userId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async deleteData(userId: string): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction(this.storeName, 'readwrite');
    const store = transaction.objectStore(this.storeName);
    store.delete(userId);
  }
}

export default new LocalStorageService();