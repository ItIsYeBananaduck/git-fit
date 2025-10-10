/**
 * Heart Rate Monitoring API Route
 * POST /api/monitoring/heart-rate - Start, record, or stop heart rate monitoring
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { api } from '$lib/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const CONVEX_URL = process.env.CONVEX_URL || 'https://your-convex-deployment.convex.cloud';
const convex = new ConvexHttpClient(CONVEX_URL);

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { 
      action, 
      userId, 
      sessionId, 
      heartRate, 
      timestamp, 
      monitoringType, 
      targetZones,
      activity 
    } = await request.json();

    // Validate required fields
    if (!action || !userId) {
      return json({
        success: false,
        error: 'Missing required fields: action, userId'
      }, { status: 400 });
    }

    switch (action) {
      case 'start': {
        if (!sessionId || !monitoringType) {
          return json({
            success: false,
            error: 'Missing required fields for start: sessionId, monitoringType'
          }, { status: 400 });
        }

        const result = await convex.mutation(api.functions.monitoring.startHeartRateMonitoring, {
          userId,
          sessionId,
          monitoringType,
          targetZones
        });

        return json(result);
      }

      case 'record': {
        if (!sessionId || !heartRate || !timestamp) {
          return json({
            success: false,
            error: 'Missing required fields for record: sessionId, heartRate, timestamp'
          }, { status: 400 });
        }

        const result = await convex.mutation(api.functions.monitoring.recordHeartRateData, {
          userId,
          sessionId,
          heartRate,
          timestamp,
          activity
        });

        return json(result);
      }

      case 'stop': {
        if (!sessionId) {
          return json({
            success: false,
            error: 'Missing required field for stop: sessionId'
          }, { status: 400 });
        }

        const result = await convex.mutation(api.functions.monitoring.stopHeartRateMonitoring, {
          userId,
          sessionId
        });

        return json(result);
      }

      default: {
        return json({
          success: false,
          error: 'Invalid action. Must be: start, record, or stop'
        }, { status: 400 });
      }
    }
  } catch (error: any) {
    console.error('Heart rate monitoring API error:', error);
    
    return json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  try {
    const userId = url.searchParams.get('userId');
    const sessionId = url.searchParams.get('sessionId');
    const limit = url.searchParams.get('limit');

    if (!userId) {
      return json({
        success: false,
        error: 'Missing required parameter: userId'
      }, { status: 400 });
    }

    // Get heart rate data
    const data = await convex.query(api.functions.monitoring.getHeartRateData, {
      userId,
      sessionId: sessionId || undefined,
      limit: limit ? parseInt(limit) : undefined
    });

    // Get active session if no specific session requested
    let activeSession = null;
    if (!sessionId) {
      activeSession = await convex.query(api.functions.monitoring.getActiveMonitoringSession, {
        userId
      });
    }

    return json({
      success: true,
      data,
      activeSession
    });
  } catch (error: any) {
    console.error('Get heart rate data API error:', error);
    
    return json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
};