/**
 * Simple Coda API interface for RSS feed management
 */

export interface RSSFeedData {
  url: string;
  name: string;
  category: string;
  lastFetched?: string;
  isActive: boolean;
  tags?: string[];
}

export interface CodaRow {
  id: string;
  values: RSSFeedData | Record<string, string | number | boolean | string[]>;
}

export interface CodaTableData {
  items: CodaRow[];
}

export interface CodaAPI {
  getTableData(tableName: string): Promise<CodaRow[]>;
  updateRow(tableName: string, rowId: string, data: RSSFeedData): Promise<void>;
  addRow(tableName: string, data: RSSFeedData): Promise<string>;
}

export class SimpleCodaAPI implements CodaAPI {
  private apiKey: string;
  private docId: string;
  private baseUrl = 'https://coda.io/apis/v1';

  constructor(apiKey: string, docId: string) {
    this.apiKey = apiKey;
    this.docId = docId;
  }

  async getTableData(tableName: string): Promise<CodaRow[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/docs/${this.docId}/tables/${tableName}/rows`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Coda API error: ${response.status}`);
      }

      const data: CodaTableData = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Failed to fetch from Coda:', error);
      return [];
    }
  }

  async updateRow(tableName: string, rowId: string, data: RSSFeedData): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/docs/${this.docId}/tables/${tableName}/rows/${rowId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        throw new Error(`Coda API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to update Coda row:', error);
      throw error;
    }
  }

  async addRow(tableName: string, data: RSSFeedData): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/docs/${this.docId}/tables/${tableName}/rows`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ rows: [data] })
        }
      );

      if (!response.ok) {
        throw new Error(`Coda API error: ${response.status}`);
      }

      const result = await response.json();
      return result.rows?.[0]?.id || '';
    } catch (error) {
      console.error('Failed to add Coda row:', error);
      throw error;
    }
  }
}