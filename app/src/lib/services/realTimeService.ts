// Real-Time WebSocket Service for Dashboard Updates

import type { Id } from "../../../convex/_generated/dataModel";

export interface RealTimeSubscription {
  id: string;
  type: 'dashboard' | 'users' | 'revenue' | 'engagement' | 'system';
  callback: (data: Record<string, unknown>) => void;
  adminId: Id<'adminUsers'>;
}

export class RealTimeService {
  protected ws: WebSocket | null = null;
  protected subscriptions = new Map<string, RealTimeSubscription>();
  protected reconnectAttempts = 0;
  protected maxReconnectAttempts = 5;
  protected reconnectDelay = 1000;
  protected isConnected = false;
  protected heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private wsUrl: string = 'ws://localhost:3001/ws') {}

  /**
   * Connect to WebSocket server
   */
  async connect(adminId: Id<'adminUsers'>): Promise<void> {
    try {
      this.ws = new WebSocket(`${this.wsUrl}?adminId=${adminId}`);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        
        // Re-subscribe to all existing subscriptions
        this.subscriptions.forEach(sub => {
          this.sendMessage({
            type: 'subscribe',
            subscriptionType: sub.type,
            subscriptionId: sub.id
          });
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.stopHeartbeat();
        this.attemptReconnect(adminId);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
    this.subscriptions.clear();
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(
    type: RealTimeSubscription['type'],
    adminId: Id<'adminUsers'>,
    callback: (data: any) => void
  ): string {
    const subscriptionId = `${type}_${adminId}_${Date.now()}_${Math.random()}`;
    
    const subscription: RealTimeSubscription = {
      id: subscriptionId,
      type,
      callback,
      adminId
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription message if connected
    if (this.isConnected && this.ws) {
      this.sendMessage({
        type: 'subscribe',
        subscriptionType: type,
        subscriptionId
      });
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.subscriptions.delete(subscriptionId);

      // Send unsubscribe message if connected
      if (this.isConnected && this.ws) {
        this.sendMessage({
          type: 'unsubscribe',
          subscriptionId
        });
      }
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.isConnected) return 'connected';
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) return 'connecting';
    return 'disconnected';
  }

  /**
   * Send message to WebSocket server
   */
  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'data_update':
        this.handleDataUpdate(message);
        break;
      case 'subscription_confirmed':
        console.log('Subscription confirmed:', message.subscriptionId);
        break;
      case 'error':
        console.error('WebSocket error:', message.error);
        break;
      case 'pong':
        // Heartbeat response
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Handle data update messages
   */
  private handleDataUpdate(message: any): void {
    const { subscriptionId, data } = message;
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (subscription) {
      try {
        subscription.callback(data);
      } catch (error) {
        console.error('Error in subscription callback:', error);
      }
    }
  }

  /**
   * Attempt to reconnect to WebSocket server
   */
  private attemptReconnect(adminId: Id<'adminUsers'>): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect(adminId).catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.sendMessage({ type: 'ping' });
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Singleton instance
export const realTimeService = new RealTimeService();

// Mock WebSocket server for development
export class MockRealTimeService extends RealTimeService {
  private mockIntervals = new Map<string, NodeJS.Timeout>();

  constructor() {
    super();
  }

  async connect(adminId: Id<'adminUsers'>): Promise<void> {
    console.log('Mock WebSocket connected');
    this.isConnected = true;
  }

  disconnect(): void {
    console.log('Mock WebSocket disconnected');
    this.isConnected = false;
    this.mockIntervals.forEach(interval => clearInterval(interval));
    this.mockIntervals.clear();
    this.subscriptions.clear();
  }

  subscribe(
    type: RealTimeSubscription['type'],
    adminId: Id<'adminUsers'>,
    callback: (data: any) => void
  ): string {
    const subscriptionId = `mock_${type}_${adminId}_${Date.now()}`;
    
    const subscription: RealTimeSubscription = {
      id: subscriptionId,
      type,
      callback,
      adminId
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Start mock data updates
    const interval = setInterval(() => {
      const mockData = this.generateMockData(type);
      callback(mockData);
    }, 5000 + Math.random() * 10000); // Random interval between 5-15 seconds

    this.mockIntervals.set(subscriptionId, interval);

    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    const interval = this.mockIntervals.get(subscriptionId);
    if (interval) {
      clearInterval(interval);
      this.mockIntervals.delete(subscriptionId);
    }
    this.subscriptions.delete(subscriptionId);
  }

  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    return this.isConnected ? 'connected' : 'disconnected';
  }

  private generateMockData(type: RealTimeSubscription['type']): any {
    const now = new Date();
    
    switch (type) {
      case 'dashboard':
        return {
          userMetrics: {
            totalUsers: 1250 + Math.floor(Math.random() * 50),
            activeUsers: 890 + Math.floor(Math.random() * 30),
            newUsers: 15 + Math.floor(Math.random() * 10),
            churnRate: 2.5 + Math.random() * 2
          },
          revenueMetrics: {
            totalRevenue: 45000 + Math.random() * 5000,
            recurringRevenue: 38000 + Math.random() * 3000,
            averageRevenuePerUser: 36 + Math.random() * 8,
            revenueGrowthRate: 12 + Math.random() * 5
          },
          engagementMetrics: {
            dailyActiveUsers: 650 + Math.floor(Math.random() * 50),
            sessionDuration: 25 + Math.random() * 10,
            featureAdoption: {
              workouts: 450 + Math.floor(Math.random() * 30),
              programs: 280 + Math.floor(Math.random() * 20)
            },
            retentionRate: 78 + Math.random() * 10
          },
          systemMetrics: {
            uptime: 99.5 + Math.random() * 0.5,
            responseTime: 120 + Math.random() * 80,
            errorRate: Math.random() * 2,
            resourceUtilization: 60 + Math.random() * 20
          }
        };

      case 'users':
        return {
          period: '1d',
          userGrowth: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
            value: Math.floor(Math.random() * 20) + 5
          })),
          acquisitionChannels: {
            organic: Math.floor(Math.random() * 50) + 20,
            social: Math.floor(Math.random() * 30) + 10,
            referral: Math.floor(Math.random() * 20) + 5,
            paid: Math.floor(Math.random() * 15) + 3
          },
          totalNewUsers: Math.floor(Math.random() * 100) + 50
        };

      case 'revenue':
        return {
          period: '1d',
          totalRevenue: Math.random() * 10000 + 5000,
          revenueBySource: {
            program_purchase: Math.random() * 6000 + 3000,
            coaching_service: Math.random() * 4000 + 2000
          },
          revenueGrowth: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
            value: Math.random() * 2000 + 500
          })),
          averageRevenuePerUser: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
            value: Math.random() * 20 + 30
          })),
          subscriptionMetrics: {
            newSubscriptions: Math.floor(Math.random() * 20) + 5,
            cancellations: Math.floor(Math.random() * 5),
            upgrades: Math.floor(Math.random() * 8) + 2,
            downgrades: Math.floor(Math.random() * 3),
            churnRate: Math.random() * 5 + 2
          }
        };

      case 'engagement':
        return {
          period: '1d',
          dailyActiveUsers: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
            value: Math.floor(Math.random() * 100) + 500
          })),
          sessionMetrics: {
            averageDuration: Math.random() * 15 + 20,
            bounceRate: Math.random() * 20 + 10,
            returnVisitorRate: Math.random() * 30 + 40
          },
          featureUsage: {
            workouts: Math.floor(Math.random() * 200) + 300,
            programs: Math.floor(Math.random() * 100) + 150,
            exercises: Math.floor(Math.random() * 500) + 800
          },
          userJourneys: []
        };

      case 'system':
        return {
          overall: Math.random() > 0.1 ? 'healthy' : 'degraded',
          services: [
            {
              name: 'API Server',
              status: Math.random() > 0.05 ? 'up' : 'degraded',
              responseTime: Math.random() * 100 + 50,
              uptime: 99 + Math.random(),
              lastCheck: now.toISOString(),
              dependencies: ['Database', 'Cache']
            },
            {
              name: 'Database',
              status: Math.random() > 0.02 ? 'up' : 'degraded',
              responseTime: Math.random() * 50 + 10,
              uptime: 99.5 + Math.random() * 0.5,
              lastCheck: now.toISOString(),
              dependencies: []
            }
          ],
          alerts: [],
          lastUpdated: now.toISOString()
        };

      default:
        return {};
    }
  }
}

// Use mock service in development
export const realTimeServiceInstance = process.env.NODE_ENV === 'development' 
  ? new MockRealTimeService() 
  : realTimeService;