/**
 * Music Sync Health Dashboard Component
 * 
 * Comprehensive dashboard for monitoring music sync health:
 * - Real-time sync operation overview
 * - Provider performance comparison  
 * - Health metrics and recommendations
 * - Historical sync analytics
 * - Issue identification and resolution
 */

import React, { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import MusicSyncStatus from './MusicSyncStatus';

// ====================================================================================
// TYPES AND INTERFACES
// ====================================================================================

interface DashboardSummary {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  inProgressSyncs: number;
  totalItemsSynced: number;
  totalErrors: number;
  avgSyncDuration: number;
  successRate: number;
}

interface HealthMetrics {
  overallScore: number;
  connectionHealth: string;
  performanceHealth: string;
  errorHealth: string;
  recommendations: string[];
}

interface ProviderBreakdown {
  [providerId: string]: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    totalItems: number;
    totalErrors: number;
    avgDuration: number;
    successRate: number;
    errorRate: number;
  };
}

interface ActiveIssue {
  type: string;
  severity: string;
  syncId: string;
  providerId: string;
  message: string;
  timestamp: number;
}

interface RecentActivity {
  syncId: string;
  providerId: string;
  status: string;
  progress: number;
  updatedAt: number;
  duration: number;
}

interface DashboardData {
  summary: DashboardSummary;
  health: HealthMetrics;
  providerBreakdown: ProviderBreakdown;
  performanceMetrics: any;
  trends: {
    syncFrequency: any[];
    successRate: any[];
    performanceMetrics: any[];
  };
  activeIssues: ActiveIssue[];
  recentActivity: RecentActivity[];
}

// ====================================================================================
// MAIN DASHBOARD COMPONENT
// ====================================================================================

interface MusicSyncDashboardProps {
  userId: string;
  timeRange?: 'hour' | 'day' | 'week' | 'month';
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export const MusicSyncDashboard: React.FC<MusicSyncDashboardProps> = ({
  userId,
  timeRange = 'day',
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  className = ''
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Query dashboard data
  const dashboardData = useQuery(api.functions.musicSyncStatus.getSyncHealthDashboard, {
    userId,
    timeRange: selectedTimeRange,
    includeProviderBreakdown: true,
    includePerformanceMetrics: true
  });

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  if (!dashboardData) {
    return (
      <div className={`music-sync-dashboard-loading ${className}`}>
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading sync dashboard...</span>
        </div>
      </div>
    );
  }

  const dashboard = dashboardData.dashboard as DashboardData;

  return (
    <div className={`music-sync-dashboard ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <DashboardHeader 
          timeRange={selectedTimeRange}
          onTimeRangeChange={setSelectedTimeRange}
          lastUpdate={dashboardData.generatedAt}
        />

        {/* Summary Cards */}
        <SyncSummaryCards summary={dashboard.summary} />

        {/* Health Overview */}
        <SyncHealthOverview health={dashboard.health} />

        {/* Active Issues */}
        {dashboard.activeIssues.length > 0 && (
          <ActiveIssuesSection issues={dashboard.activeIssues} />
        )}

        {/* Provider Performance */}
        <ProviderPerformanceSection 
          providerBreakdown={dashboard.providerBreakdown}
          performanceMetrics={dashboard.performanceMetrics}
        />

        {/* Recent Activity */}
        <RecentActivitySection activities={dashboard.recentActivity} />

        {/* Performance Trends - TODO: Implement charts */}
        {dashboard.trends && (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance Trends
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Charts coming soon...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ====================================================================================
// DASHBOARD HEADER COMPONENT
// ====================================================================================

interface DashboardHeaderProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  lastUpdate: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  timeRange,
  onTimeRangeChange,
  lastUpdate
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Music Sync Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your music synchronization health and performance
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Time Range:</span>
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="hour">Last Hour</option>
              <option value="day">Last 24 Hours</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
            </select>
          </div>

          {/* Last Update */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Updated: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

// ====================================================================================
// SUMMARY CARDS COMPONENT
// ====================================================================================

interface SyncSummaryCardsProps {
  summary: DashboardSummary;
}

const SyncSummaryCards: React.FC<SyncSummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Syncs */}
      <SummaryCard
        title="Total Syncs"
        value={summary.totalSyncs.toLocaleString()}
        subtitle="operations"
        color="blue"
        icon={<SyncIcon className="w-5 h-5" />}
      />

      {/* Success Rate */}
      <SummaryCard
        title="Success Rate"
        value={`${(summary.successRate * 100).toFixed(1)}%`}
        subtitle={`${summary.successfulSyncs}/${summary.totalSyncs} successful`}
        color={summary.successRate >= 0.9 ? 'green' : summary.successRate >= 0.7 ? 'yellow' : 'red'}
        icon={<CheckCircleIcon className="w-5 h-5" />}
      />

      {/* Items Synced */}
      <SummaryCard
        title="Items Synced"
        value={summary.totalItemsSynced.toLocaleString()}
        subtitle="total items"
        color="purple"
        icon={<MusicNoteIcon className="w-5 h-5" />}
      />

      {/* Avg Duration */}
      <SummaryCard
        title="Avg Duration"
        value={formatDuration(summary.avgSyncDuration)}
        subtitle="per sync"
        color="indigo"
        icon={<ClockIcon className="w-5 h-5" />}
      />
    </div>
  );
};

// ====================================================================================
// SUMMARY CARD COMPONENT
// ====================================================================================

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  icon: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  color,
  icon
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-grow">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        </div>
        
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ====================================================================================
// HEALTH OVERVIEW COMPONENT
// ====================================================================================

interface SyncHealthOverviewProps {
  health: HealthMetrics;
}

const SyncHealthOverview: React.FC<SyncHealthOverviewProps> = ({ health }) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Sync Health Overview
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Health Score */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Health Score
            </span>
            <span className={`text-2xl font-bold ${getHealthColor(health.overallScore)}`}>
              {health.overallScore}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                health.overallScore >= 80 ? 'bg-green-500' :
                health.overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${health.overallScore}%` }}
            />
          </div>
          
          {/* Health Components */}
          <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
            <div className={`p-2 rounded text-center ${getHealthBgColor(80)}`}>
              <div className="font-medium">Connection</div>
              <div className="capitalize">{health.connectionHealth}</div>
            </div>
            <div className={`p-2 rounded text-center ${getHealthBgColor(75)}`}>
              <div className="font-medium">Performance</div>
              <div className="capitalize">{health.performanceHealth}</div>
            </div>
            <div className={`p-2 rounded text-center ${getHealthBgColor(85)}`}>
              <div className="font-medium">Errors</div>
              <div className="capitalize">{health.errorHealth}</div>
            </div>
          </div>
        </div>
        
        {/* Recommendations */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Recommendations
          </h4>
          
          {health.recommendations.length > 0 ? (
            <div className="space-y-2">
              {health.recommendations.map((recommendation, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                >
                  <InfoIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    {recommendation}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-sm text-green-800 dark:text-green-200">
                All systems operating normally
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ====================================================================================
// ACTIVE ISSUES SECTION
// ====================================================================================

interface ActiveIssuesSectionProps {
  issues: ActiveIssue[];
}

const ActiveIssuesSection: React.FC<ActiveIssuesSectionProps> = ({ issues }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Active Issues
        </h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {issues.length} issue{issues.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-3">
        {issues.map((issue, index) => (
          <div 
            key={`${issue.syncId}-${index}`}
            className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {getProviderName(issue.providerId)} Sync Issue
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                  {issue.severity}
                </span>
              </div>
              
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                {issue.message}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Type: {issue.type}</span>
                <span>{new Date(issue.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ====================================================================================
// PROVIDER PERFORMANCE SECTION
// ====================================================================================

interface ProviderPerformanceSectionProps {
  providerBreakdown: ProviderBreakdown;
  performanceMetrics: any;
}

const ProviderPerformanceSection: React.FC<ProviderPerformanceSectionProps> = ({
  providerBreakdown,
  performanceMetrics
}) => {
  const providers = Object.keys(providerBreakdown);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Provider Performance
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {providers.map(providerId => {
          const provider = providerBreakdown[providerId];
          return (
            <div 
              key={providerId}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
            >
              {/* Provider Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <ProviderIcon providerId={providerId} className="w-6 h-6" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getProviderName(providerId)}
                  </span>
                </div>
                
                <span className={`text-sm font-medium ${
                  provider.successRate >= 0.9 ? 'text-green-600 dark:text-green-400' :
                  provider.successRate >= 0.7 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {(provider.successRate * 100).toFixed(1)}%
                </span>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {provider.totalSyncs}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Syncs</div>
                </div>
                
                <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {provider.totalItems.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Items</div>
                </div>
                
                <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatDuration(provider.avgDuration)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Avg Time</div>
                </div>
                
                <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {provider.totalErrors}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Errors</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ====================================================================================
// RECENT ACTIVITY SECTION
// ====================================================================================

interface RecentActivitySectionProps {
  activities: RecentActivity[];
}

const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({ activities }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>
      
      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div 
              key={`${activity.syncId}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <ProviderIcon providerId={activity.providerId} className="w-5 h-5" />
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getProviderName(activity.providerId)}
                    </span>
                    <StatusBadge status={activity.status} compact={true} />
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div 
                        className="h-1 rounded-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${activity.progress * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round(activity.progress * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                <div>{formatDuration(activity.duration)}</div>
                <div>{new Date(activity.updatedAt).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
            <SyncIcon />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            No recent sync activity
          </p>
        </div>
      )}
    </div>
  );
};

// ====================================================================================
// UTILITY FUNCTIONS AND COMPONENTS
// ====================================================================================

const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) return '< 1s';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

const getProviderName = (providerId: string): string => {
  const providerNames: Record<string, string> = {
    spotify: 'Spotify',
    apple_music: 'Apple Music',
    youtube_music: 'YouTube Music',
  };
  return providerNames[providerId] || providerId;
};

// Status badge component (imported from MusicSyncStatus)
const StatusBadge: React.FC<{ status: string; compact?: boolean }> = ({ status, compact = false }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'in_progress':
      case 'initializing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatStatus = (status: string): string => {
    const statusNames: Record<string, string> = {
      initializing: 'Initializing',
      in_progress: 'In Progress',
      paused: 'Paused',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };
    return statusNames[status] || status;
  };

  const statusText = formatStatus(status);
  const colorClasses = getStatusColor(status);

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}>
      {statusText}
    </span>
  );
};

// Icon Components
const SyncIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MusicNoteIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const ProviderIcon: React.FC<{ providerId: string; className?: string }> = ({ 
  providerId, 
  className = 'w-6 h-6' 
}) => {
  switch (providerId) {
    case 'spotify':
      return (
        <div className={`${className} bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold`}>
          S
        </div>
      );
    case 'apple_music':
      return (
        <div className={`${className} bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold`}>
          A
        </div>
      );
    case 'youtube_music':
      return (
        <div className={`${className} bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold`}>
          Y
        </div>
      );
    default:
      return (
        <div className={`${className} bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold`}>
          ?
        </div>
      );
  }
};

export default MusicSyncDashboard;