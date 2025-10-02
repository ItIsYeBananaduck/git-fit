# Performance Analytics & Monitoring (009) - Quickstart Guide

**Goal**: Get Performance Analytics platform operational in 2-3 hours  
**Prerequisites**: Convex database, SvelteKit frontend, basic TypeScript knowledge  
**Target**: Development environment with core analytics functionality  

## 🚀 Quick Setup (60 minutes)

### Step 1: Database Schema Setup (15 minutes)

1. **Add Analytics Schema to Convex**
   ```bash
   cd convex
   ```

2. **Update schema.ts with core analytics tables**
   ```typescript
   // convex/schema.ts - Add to existing schema
   import { defineSchema, defineTable } from "convex/server";
   import { v } from "convex/values";
   
   export default defineSchema({
     // ... existing tables
     
     // Analytics Events - Core data collection
     analyticsEvents: defineTable({
       eventId: v.string(),
       sessionId: v.string(),
       userId: v.optional(v.id("users")),
       eventType: v.union(v.literal("user_action"), v.literal("system_performance"), v.literal("ai_recommendation")),
       category: v.string(),
       action: v.string(),
       properties: v.any(),
       timestamp: v.number(),
       isAnonymized: v.boolean()
     })
     .index("by_user_timestamp", ["userId", "timestamp"])
     .index("by_event_type", ["eventType", "timestamp"]),
     
     // Business Metrics - Pre-computed KPIs
     businessMetrics: defineTable({
       metricName: v.string(),
       value: v.number(),
       category: v.string(),
       periodStart: v.number(),
       periodEnd: v.number(),
       timestamp: v.number()
     })
     .index("by_category_time", ["category", "periodStart"]),
     
     // Dashboard Configs - User dashboard settings
     dashboardConfigs: defineTable({
       dashboardId: v.string(),
       name: v.string(),
       type: v.string(),
       layout: v.any(),
       permissions: v.object({
         owner: v.id("users"),
         isPublic: v.boolean()
       }),
       createdAt: v.number()
     })
     .index("by_owner", ["permissions.owner"])
   });
   ```

3. **Deploy Schema**
   ```bash
   npx convex dev --run-tests-locally
   ```

### Step 2: Event Collection SDK (20 minutes)

4. **Create Analytics SDK**
   ```typescript
   // app/src/lib/analytics/analyticsSDK.ts
   import { api } from "$lib/convex/_generated/api";
   import { convexAuth } from "@convex-dev/auth/client";
   
   interface AnalyticsEvent {
     category: string;
     action: string;
     properties?: Record<string, any>;
   }
   
   class AnalyticsSDK {
     private sessionId: string = this.generateSessionId();
     private eventQueue: AnalyticsEvent[] = [];
     private flushInterval: number = 5000; // 5 seconds
     
     constructor() {
       this.startBatchFlush();
     }
     
     // Track user events
     track(event: AnalyticsEvent) {
       this.eventQueue.push({
         ...event,
         timestamp: Date.now(),
         sessionId: this.sessionId
       });
     }
     
     // Track page views
     trackPageView(page: string) {
       this.track({
         category: 'navigation',
         action: 'page_view',
         properties: { page }
       });
     }
     
     // Track feature usage
     trackFeature(feature: string, action: string, metadata?: any) {
       this.track({
         category: 'feature',
         action: action,
         properties: { feature, ...metadata }
       });
     }
     
     private async flushEvents() {
       if (this.eventQueue.length === 0) return;
       
       const events = [...this.eventQueue];
       this.eventQueue = [];
       
       try {
         await convexAuth.action(api.analytics.batchTrackEvents, { events });
       } catch (error) {
         console.error('Failed to send analytics events:', error);
         // Re-queue events for retry
         this.eventQueue.unshift(...events);
       }
     }
     
     private startBatchFlush() {
       setInterval(() => this.flushEvents(), this.flushInterval);
     }
     
     private generateSessionId(): string {
       return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
     }
   }
   
   export const analytics = new AnalyticsSDK();
   ```

5. **Create Convex Analytics Functions**
   ```typescript
   // convex/functions/analytics.ts
   import { mutation, query } from "./_generated/server";
   import { v } from "convex/values";
   
   // Batch event tracking
   export const batchTrackEvents = mutation({
     args: {
       events: v.array(v.object({
         category: v.string(),
         action: v.string(),
         properties: v.optional(v.any()),
         timestamp: v.number(),
         sessionId: v.string()
       }))
     },
     handler: async (ctx, { events }) => {
       const userId = (await ctx.auth.getUserIdentity())?.subject;
       
       for (const event of events) {
         await ctx.db.insert("analyticsEvents", {
           eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
           sessionId: event.sessionId,
           userId: userId ? ctx.db.normalizeId("users", userId) : undefined,
           eventType: "user_action",
           category: event.category,
           action: event.action,
           properties: event.properties || {},
           timestamp: event.timestamp,
           isAnonymized: !userId
         });
       }
     }
   });
   
   // Get analytics dashboard data
   export const getDashboardData = query({
     args: { timeRange: v.string() },
     handler: async (ctx, { timeRange }) => {
       const startTime = Date.now() - (timeRange === "24h" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);
       
       const events = await ctx.db
         .query("analyticsEvents")
         .withIndex("by_event_type")
         .filter(q => q.gte(q.field("timestamp"), startTime))
         .collect();
       
       // Calculate basic metrics
       const totalEvents = events.length;
       const uniqueSessions = new Set(events.map(e => e.sessionId)).size;
       const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId)).size;
       
       return {
         totalEvents,
         uniqueSessions,
         uniqueUsers,
         eventsByCategory: this.groupEventsByCategory(events),
         timeline: this.createEventTimeline(events)
       };
     }
   });
   ```

### Step 3: Basic Dashboard (15 minutes)

6. **Create Analytics Dashboard Page**
   ```svelte
   <!-- app/src/routes/analytics/+page.svelte -->
   <script lang="ts">
     import { onMount } from 'svelte';
     import { convexAuth } from "@convex-dev/auth/client";
     import { api } from "$lib/convex/_generated/api";
     
     let dashboardData: any = null;
     let loading = true;
     let timeRange = "24h";
     
     onMount(async () => {
       await loadDashboardData();
     });
     
     async function loadDashboardData() {
       loading = true;
       try {
         dashboardData = await convexAuth.query(api.analytics.getDashboardData, { timeRange });
       } catch (error) {
         console.error('Failed to load dashboard data:', error);
       } finally {
         loading = false;
       }
     }
     
     function handleTimeRangeChange() {
       loadDashboardData();
     }
   </script>
   
   <div class="analytics-dashboard p-6">
     <h1 class="text-3xl font-bold mb-6">Analytics Dashboard</h1>
     
     <!-- Time Range Selector -->
     <div class="mb-6">
       <select bind:value={timeRange} on:change={handleTimeRangeChange} 
               class="px-4 py-2 border rounded-lg">
         <option value="24h">Last 24 Hours</option>
         <option value="7d">Last 7 Days</option>
       </select>
     </div>
     
     {#if loading}
       <div class="text-center py-8">Loading analytics data...</div>
     {:else if dashboardData}
       <!-- Key Metrics Cards -->
       <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div class="bg-white p-6 rounded-lg shadow-md">
           <h3 class="text-lg font-semibold text-gray-700">Total Events</h3>
           <p class="text-3xl font-bold text-blue-600">{dashboardData.totalEvents.toLocaleString()}</p>
         </div>
         
         <div class="bg-white p-6 rounded-lg shadow-md">
           <h3 class="text-lg font-semibold text-gray-700">Active Sessions</h3>
           <p class="text-3xl font-bold text-green-600">{dashboardData.uniqueSessions.toLocaleString()}</p>
         </div>
         
         <div class="bg-white p-6 rounded-lg shadow-md">
           <h3 class="text-lg font-semibold text-gray-700">Unique Users</h3>
           <p class="text-3xl font-bold text-purple-600">{dashboardData.uniqueUsers.toLocaleString()}</p>
         </div>
       </div>
       
       <!-- Events by Category -->
       <div class="bg-white p-6 rounded-lg shadow-md mb-8">
         <h3 class="text-xl font-semibold mb-4">Events by Category</h3>
         <div class="space-y-2">
           {#each Object.entries(dashboardData.eventsByCategory || {}) as [category, count]}
             <div class="flex justify-between items-center py-2 border-b">
               <span class="font-medium">{category}</span>
               <span class="text-blue-600 font-bold">{count}</span>
             </div>
           {/each}
         </div>
       </div>
     {:else}
       <div class="text-center py-8 text-gray-500">No analytics data available</div>
     {/if}
   </div>
   ```

### Step 4: Enable Analytics Tracking (10 minutes)

7. **Add Analytics to App Layout**
   ```svelte
   <!-- app/src/app.html or layout -->
   <script lang="ts">
     import { analytics } from '$lib/analytics/analyticsSDK';
     import { page } from '$app/stores';
     
     // Track page views automatically
     $: if ($page.url.pathname) {
       analytics.trackPageView($page.url.pathname);
     }
   </script>
   ```

8. **Add Feature Tracking Examples**
   ```svelte
   <!-- Example: Track button clicks -->
   <button on:click={() => analytics.trackFeature('workout', 'start_workout', { workoutId: workout.id })}
           class="bg-blue-500 text-white px-4 py-2 rounded">
     Start Workout
   </button>
   
   <!-- Example: Track form submissions -->
   <form on:submit={() => analytics.trackFeature('profile', 'update_profile')}>
     <!-- form content -->
   </form>
   ```

---

## 📊 Advanced Setup (90 minutes)

### Step 5: Real-time Dashboards (30 minutes)

9. **Add Real-time Updates with WebSockets**
   ```typescript
   // app/src/lib/stores/realTimeAnalytics.ts
   import { writable } from 'svelte/store';
   import { convexAuth } from "@convex-dev/auth/client";
   import { api } from "$lib/convex/_generated/api";
   
   export const realTimeMetrics = writable({
     activeUsers: 0,
     eventsPerMinute: 0,
     topEvents: []
   });
   
   // Subscribe to real-time analytics
   export function initializeRealTimeAnalytics() {
     return convexAuth.subscribe(api.analytics.getRealTimeMetrics, {}, {
       onUpdate: (data) => {
         realTimeMetrics.set(data);
       },
       onError: (error) => {
         console.error('Real-time analytics error:', error);
       }
     });
   }
   ```

10. **Create Real-time Metrics Query**
    ```typescript
    // convex/functions/analytics.ts - Add to existing file
    export const getRealTimeMetrics = query({
      args: {},
      handler: async (ctx) => {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        const recentEvents = await ctx.db
          .query("analyticsEvents")
          .withIndex("by_event_type")
          .filter(q => q.gte(q.field("timestamp"), fiveMinutesAgo))
          .collect();
        
        const activeUsers = new Set(
          recentEvents.filter(e => e.userId).map(e => e.userId)
        ).size;
        
        const eventsPerMinute = recentEvents.length / 5;
        
        const topEvents = Object.entries(
          recentEvents.reduce((acc, event) => {
            const key = `${event.category}:${event.action}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        )
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
        
        return {
          activeUsers,
          eventsPerMinute: Math.round(eventsPerMinute),
          topEvents
        };
      }
    });
    ```

### Step 6: AI Performance Monitoring (30 minutes)

11. **Add AI Metrics Tracking**
    ```typescript
    // app/src/lib/analytics/aiMetrics.ts
    import { analytics } from './analyticsSDK';
    
    export class AIMetrics {
      static trackRecommendation(data: {
        modelId: string;
        type: string;
        confidence: number;
        userId: string;
      }) {
        analytics.track({
          category: 'ai_recommendation',
          action: 'generated',
          properties: {
            modelId: data.modelId,
            recommendationType: data.type,
            confidence: data.confidence,
            userId: data.userId
          }
        });
      }
      
      static trackRecommendationResponse(data: {
        recommendationId: string;
        action: 'accepted' | 'rejected' | 'modified';
        responseTime: number;
      }) {
        analytics.track({
          category: 'ai_recommendation',
          action: 'user_response',
          properties: {
            recommendationId: data.recommendationId,
            userAction: data.action,
            responseTimeSeconds: data.responseTime
          }
        });
      }
      
      static trackModelPerformance(data: {
        modelId: string;
        accuracy: number;
        latency: number;
        errorRate: number;
      }) {
        analytics.track({
          category: 'ai_performance',
          action: 'model_metrics',
          properties: {
            modelId: data.modelId,
            accuracy: data.accuracy,
            latencyMs: data.latency,
            errorRate: data.errorRate
          }
        });
      }
    }
    ```

12. **Create AI Dashboard Component**
    ```svelte
    <!-- app/src/lib/components/AIPerformanceDashboard.svelte -->
    <script lang="ts">
      import { onMount } from 'svelte';
      import { convexAuth } from "@convex-dev/auth/client";
      import { api } from "$lib/convex/_generated/api";
      
      let aiMetrics: any = null;
      
      onMount(async () => {
        aiMetrics = await convexAuth.query(api.analytics.getAIMetrics, {});
      });
    </script>
    
    <div class="ai-performance-dashboard">
      <h2 class="text-2xl font-bold mb-4">AI Performance</h2>
      
      {#if aiMetrics}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-sm font-medium text-gray-600">Recommendation Accuracy</h3>
            <p class="text-2xl font-bold text-green-600">{(aiMetrics.accuracy * 100).toFixed(1)}%</p>
          </div>
          
          <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-sm font-medium text-gray-600">Avg Response Time</h3>
            <p class="text-2xl font-bold text-blue-600">{aiMetrics.avgLatency}ms</p>
          </div>
          
          <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-sm font-medium text-gray-600">Acceptance Rate</h3>
            <p class="text-2xl font-bold text-purple-600">{(aiMetrics.acceptanceRate * 100).toFixed(1)}%</p>
          </div>
          
          <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-sm font-medium text-gray-600">Error Rate</h3>
            <p class="text-2xl font-bold" class:text-red-600={aiMetrics.errorRate > 0.05} 
               class:text-green-600={aiMetrics.errorRate <= 0.05}>
              {(aiMetrics.errorRate * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      {/if}
    </div>
    ```

### Step 7: Business Intelligence (30 minutes)

13. **Add Business Metrics Calculation**
    ```typescript
    // convex/functions/businessMetrics.ts
    import { mutation, query } from "./_generated/server";
    import { v } from "convex/values";
    
    export const calculateDailyMetrics = mutation({
      args: {},
      handler: async (ctx) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime();
        const todayEnd = todayStart + (24 * 60 * 60 * 1000);
        
        // Get all events for today
        const todayEvents = await ctx.db
          .query("analyticsEvents")
          .withIndex("by_event_type")
          .filter(q => q.and(
            q.gte(q.field("timestamp"), todayStart),
            q.lt(q.field("timestamp"), todayEnd)
          ))
          .collect();
        
        // Calculate metrics
        const totalUsers = new Set(todayEvents.filter(e => e.userId).map(e => e.userId)).size;
        const totalSessions = new Set(todayEvents.map(e => e.sessionId)).size;
        const conversionEvents = todayEvents.filter(e => e.action === 'purchase' || e.action === 'subscribe');
        const conversionRate = totalSessions > 0 ? conversionEvents.length / totalSessions : 0;
        
        // Store metrics
        await ctx.db.insert("businessMetrics", {
          metricName: "daily_active_users",
          value: totalUsers,
          category: "engagement",
          periodStart: todayStart,
          periodEnd: todayEnd,
          timestamp: Date.now()
        });
        
        await ctx.db.insert("businessMetrics", {
          metricName: "daily_sessions",
          value: totalSessions,
          category: "engagement", 
          periodStart: todayStart,
          periodEnd: todayEnd,
          timestamp: Date.now()
        });
        
        await ctx.db.insert("businessMetrics", {
          metricName: "conversion_rate",
          value: conversionRate,
          category: "conversion",
          periodStart: todayStart,
          periodEnd: todayEnd,
          timestamp: Date.now()
        });
      }
    });
    ```

14. **Create Business Intelligence Dashboard**
    ```svelte
    <!-- app/src/routes/analytics/business/+page.svelte -->
    <script lang="ts">
      import { onMount } from 'svelte';
      import { convexAuth } from "@convex-dev/auth/client";
      import { api } from "$lib/convex/_generated/api";
      
      let businessMetrics: any[] = [];
      let loading = true;
      
      onMount(async () => {
        try {
          businessMetrics = await convexAuth.query(api.businessMetrics.getRecentMetrics, { days: 7 });
        } catch (error) {
          console.error('Failed to load business metrics:', error);
        } finally {
          loading = false;
        }
      });
      
      function getMetricsByName(name: string) {
        return businessMetrics.filter(m => m.metricName === name);
      }
    </script>
    
    <div class="business-intelligence p-6">
      <h1 class="text-3xl font-bold mb-6">Business Intelligence</h1>
      
      {#if loading}
        <div class="text-center py-8">Loading business metrics...</div>
      {:else}
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-lg font-semibold text-gray-700">Daily Active Users</h3>
            <p class="text-3xl font-bold text-blue-600">
              {getMetricsByName('daily_active_users').slice(-1)[0]?.value || 0}
            </p>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-lg font-semibold text-gray-700">Daily Sessions</h3>
            <p class="text-3xl font-bold text-green-600">
              {getMetricsByName('daily_sessions').slice(-1)[0]?.value || 0}
            </p>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-lg font-semibold text-gray-700">Conversion Rate</h3>
            <p class="text-3xl font-bold text-purple-600">
              {((getMetricsByName('conversion_rate').slice(-1)[0]?.value || 0) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        
        <!-- Trend Charts would go here -->
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 class="text-xl font-semibold mb-4">7-Day Trends</h3>
          <p class="text-gray-600">Chart visualization coming soon...</p>
        </div>
      {/if}
    </div>
    ```

---

## 🔧 Testing & Validation (30 minutes)

### Step 8: Generate Test Data

15. **Create Test Data Generator**
    ```typescript
    // scripts/generateTestAnalytics.ts
    import { ConvexHttpClient } from "convex/browser";
    import { api } from "../convex/_generated/api";
    
    const client = new ConvexHttpClient(process.env.CONVEX_URL!);
    
    async function generateTestData() {
      const categories = ['workout', 'nutrition', 'profile', 'social'];
      const actions = ['view', 'create', 'edit', 'delete', 'share'];
      
      for (let i = 0; i < 1000; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        await client.mutation(api.analytics.batchTrackEvents, {
          events: [{
            category,
            action,
            properties: { testData: true },
            timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Random time in last 7 days
            sessionId: `test_session_${Math.floor(Math.random() * 100)}`
          }]
        });
      }
      
      console.log('Generated 1000 test analytics events');
    }
    
    generateTestData().catch(console.error);
    ```

16. **Run Test Data Generation**
    ```bash
    npx tsx scripts/generateTestAnalytics.ts
    ```

### Step 9: Performance Testing

17. **Create Performance Test**
    ```typescript
    // tests/analytics/performance.test.ts
    import { test, expect } from '@playwright/test';
    
    test('analytics dashboard loads within 5 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/analytics');
      await page.waitForSelector('[data-testid="analytics-metrics"]');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000);
    });
    
    test('real-time updates work correctly', async ({ page }) => {
      await page.goto('/analytics');
      
      // Wait for initial load
      await page.waitForSelector('[data-testid="active-users"]');
      const initialCount = await page.textContent('[data-testid="active-users"]');
      
      // Trigger some events and check for updates
      await page.evaluate(() => {
        // Simulate analytics events
        window.analytics?.track({ category: 'test', action: 'performance_test' });
      });
      
      // Wait for real-time update (should be < 5 seconds)
      await page.waitForTimeout(6000);
      
      const updatedCount = await page.textContent('[data-testid="active-users"]');
      expect(updatedCount).toBeDefined();
    });
    ```

---

## ✅ Verification Checklist

### Core Functionality ✓
- [ ] Analytics events are being collected
- [ ] Dashboard displays basic metrics
- [ ] Real-time updates are working
- [ ] Data privacy compliance is enabled
- [ ] Performance meets <5 second loading requirement

### Test Data Validation ✓
- [ ] 1000+ test events generated successfully
- [ ] Events appear in dashboard
- [ ] Metrics calculations are accurate
- [ ] Time-based filtering works correctly

### Performance Benchmarks ✓
- [ ] Dashboard loads in <5 seconds
- [ ] Event collection handles batch processing
- [ ] Real-time updates arrive within 5 seconds
- [ ] Database queries are optimized

---

## 🎯 Next Steps

### Immediate (Today)
1. **Production Deployment**: Deploy analytics to staging environment
2. **User Training**: Train team on dashboard usage
3. **Monitoring Setup**: Configure alerts for system health

### Week 1
1. **Advanced Visualizations**: Add charts and graphs
2. **Custom Reports**: Enable user-defined reports
3. **API Integration**: Connect with external BI tools

### Month 1
1. **Machine Learning**: Add predictive analytics
2. **Advanced Segmentation**: Implement user cohort analysis
3. **Enterprise Features**: Add data export and compliance features

---

## 🆘 Troubleshooting

### Common Issues

**Events not appearing in dashboard**
- Check Convex connection in browser dev tools
- Verify analytics SDK is initialized
- Check for JavaScript errors in console

**Dashboard loading slowly**
- Review database indexes
- Check query complexity
- Verify network connection

**Real-time updates not working**
- Check WebSocket connection
- Verify subscription is active
- Check for rate limiting

### Performance Optimization

**Query Performance**
```typescript
// Add database indexes for common queries
.index("by_user_timestamp", ["userId", "timestamp"])
.index("by_category_time", ["category", "timestamp"])
```

**Event Batching**
```typescript
// Increase batch size for better performance
private flushInterval: number = 10000; // 10 seconds
private maxBatchSize: number = 100;
```

**Caching Strategy**
```typescript
// Cache frequently accessed metrics
const cachedMetrics = new Map();
const cacheExpiry = 5 * 60 * 1000; // 5 minutes
```

### Support Resources
- **Documentation**: `/docs/analytics/`
- **Team Chat**: `#analytics-support`
- **Issues**: GitHub Issues with `analytics` label