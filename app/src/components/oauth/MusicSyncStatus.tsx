/**
 * Music Sync Status Components
 * 
 * Real-time UI components for music sync status tracking:
 * - Live progress indicators and status displays  
 * - Sync health monitoring dashboard
 * - Control interfaces for pause/resume/cancel
 * - Detailed sync metrics and analytics
 * - Cross-platform status synchronization
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

// ====================================================================================
// TYPES AND INTERFACES
// ====================================================================================

interface SyncProgress {
  phase: string;
  currentStep: string;
  stepProgress: number;
  overallProgress: number;
  estimatedTotal: number;
  processedItems: number;
  failedItems: number;
  skippedItems: number;
}

interface SyncTiming {
  startedAt: number;
  estimatedDuration: number;
  estimatedCompletion: number;
  lastUpdateAt: number;
  phaseStartedAt: number;
  completedAt?: number;
  cancelledAt?: number;
  pausedAt?: number;
  resumedAt?: number;
  actualDuration?: number;
  totalPausedTime?: number;
}

interface SyncMetrics {
  itemsPerSecond: number;
  bytesTransferred: number;
  apiCallsMade: number;
  errorsEncountered: number;
  retryAttempts: number;
}

interface MusicSyncStatusData {
  _id: Id<'musicSyncStatus'>;
  userId: string;
  providerId: string;
  syncType: string;
  status: string;
  priority: string;
  progress: SyncProgress;
  timing: SyncTiming;
  metrics: SyncMetrics;
  phases: Array<{
    name: string;
    description: string;
    estimatedDuration: number;
    estimatedItems: number;
  }>;
  currentPhaseIndex: number;
  errors: Array<{
    error: any;
    timestamp: number;
    phase: string;
    step?: string;
  }>;
  warnings: Array<{
    warning: string;
    timestamp: number;
    phase: string;
  }>;
  computed?: {
    isActive: boolean;
    healthScore: number;
    estimatedTimeRemaining: number;
    currentPhase: any;
    progressPercentage: number;
    elapsedTime: number;
    hasErrors: boolean;
    hasWarnings: boolean;
  };
}

// ====================================================================================
// MAIN SYNC STATUS COMPONENT
// ====================================================================================

interface MusicSyncStatusProps {
  userId: string;
  providerId?: string;
  syncId?: Id<'musicSyncStatus'>;
  autoRefresh?: boolean;
  refreshInterval?: number;
  compact?: boolean;
  showControls?: boolean;
  showMetrics?: boolean;
  onStatusChange?: (status: string) => void;
  className?: string;
}

export const MusicSyncStatus: React.FC<MusicSyncStatusProps> = ({
  userId,
  providerId,
  syncId,
  autoRefresh = true,
  refreshInterval = 2000,
  compact = false,
  showControls = true,
  showMetrics = true,
  onStatusChange,
  className = ''
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Query sync status data
  const syncStatusData = useQuery(api.functions.musicSyncStatus.getSyncStatus, {
    syncId: syncId,
    userId: syncId ? undefined : userId,
    providerId: syncId ? undefined : providerId,
    includeHistory: false,
    includeMetrics: showMetrics
  });

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || !syncStatusData?.syncStatus?.computed?.isActive) return;

    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, syncStatusData?.syncStatus?.computed?.isActive]);

  // Status change callback
  useEffect(() => {
    if (onStatusChange && syncStatusData?.syncStatus?.status) {
      onStatusChange(syncStatusData.syncStatus.status);
    }
  }, [syncStatusData?.syncStatus?.status, onStatusChange]);

  // Update timestamp tracking
  useEffect(() => {
    if (syncStatusData?.syncStatus?.timing?.lastUpdateAt) {
      setLastUpdate(syncStatusData.syncStatus.timing.lastUpdateAt);
    }
  }, [syncStatusData?.syncStatus?.timing?.lastUpdateAt]);

  if (!syncStatusData?.found) {
    return (
      <div className={`music-sync-status-empty ${className}`}>
        <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
              <SyncIcon />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No sync operations found
            </p>
            {!syncId && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Start syncing your music to see progress here
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const syncStatus = syncStatusData.syncStatus as MusicSyncStatusData;

  if (compact) {
    return <CompactSyncStatus syncStatus={syncStatus} className={className} />;
  }

  return (
    <div className={`music-sync-status ${className}`}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <SyncStatusHeader 
          syncStatus={syncStatus}
          showControls={showControls}
        />
        
        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Progress Section */}
          <SyncProgressDisplay syncStatus={syncStatus} />
          
          {/* Phase Information */}
          <SyncPhaseDisplay syncStatus={syncStatus} />
          
          {/* Metrics Section */}
          {showMetrics && (
            <SyncMetricsDisplay 
              syncStatus={syncStatus}
              additionalMetrics={syncStatusData.additionalMetrics}
            />
          )}
          
          {/* Errors and Warnings */}
          {(syncStatus.computed?.hasErrors || syncStatus.computed?.hasWarnings) && (
            <SyncIssuesDisplay syncStatus={syncStatus} />
          )}
          
          {/* Footer with last update time */}
          <SyncStatusFooter 
            lastUpdate={lastUpdate}
            isRealTime={syncStatusData.realTimeEnabled}
          />
        </div>
      </div>
    </div>
  );
};

// ====================================================================================
// SYNC STATUS HEADER COMPONENT
// ====================================================================================

interface SyncStatusHeaderProps {
  syncStatus: MusicSyncStatusData;
  showControls: boolean;
}

const SyncStatusHeader: React.FC<SyncStatusHeaderProps> = ({
  syncStatus,
  showControls
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      {/* Title and Provider */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <ProviderIcon providerId={syncStatus.providerId} className="w-6 h-6" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {getProviderName(syncStatus.providerId)} Sync
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatSyncType(syncStatus.syncType)} • {formatPriority(syncStatus.priority)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Status Badge and Controls */}
      <div className="flex items-center space-x-3">
        <StatusBadge 
          status={syncStatus.status}
          healthScore={syncStatus.computed?.healthScore}
        />
        
        {showControls && syncStatus.computed?.isActive && (
          <SyncControls syncId={syncStatus._id} status={syncStatus.status} />
        )}
      </div>
    </div>
  );
};

// ====================================================================================
// PROGRESS DISPLAY COMPONENT
// ====================================================================================

interface SyncProgressDisplayProps {
  syncStatus: MusicSyncStatusData;
}

const SyncProgressDisplay: React.FC<SyncProgressDisplayProps> = ({ syncStatus }) => {
  const progressPercentage = syncStatus.computed?.progressPercentage || 0;
  const estimatedTimeRemaining = syncStatus.computed?.estimatedTimeRemaining || 0;

  return (
    <div className="space-y-4">
      {/* Main Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Overall Progress
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {progressPercentage}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {syncStatus.progress.processedItems.toLocaleString()} / {syncStatus.progress.estimatedTotal.toLocaleString()} items
          </span>
          {estimatedTimeRemaining > 0 && (
            <span>
              ~{formatDuration(estimatedTimeRemaining)} remaining
            </span>
          )}
        </div>
      </div>
      
      {/* Step Progress */}
      {syncStatus.progress.stepProgress > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {formatStepName(syncStatus.progress.currentStep)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round(syncStatus.progress.stepProgress * 100)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1">
            <div 
              className="h-1 rounded-full bg-blue-400 transition-all duration-200"
              style={{ width: `${syncStatus.progress.stepProgress * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            {syncStatus.progress.processedItems.toLocaleString()}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">Processed</div>
        </div>
        
        {syncStatus.progress.failedItems > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {syncStatus.progress.failedItems.toLocaleString()}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">Failed</div>
          </div>
        )}
        
        {syncStatus.progress.skippedItems > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
            <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              {syncStatus.progress.skippedItems.toLocaleString()}
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400">Skipped</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ====================================================================================
// PHASE DISPLAY COMPONENT
// ====================================================================================

interface SyncPhaseDisplayProps {
  syncStatus: MusicSyncStatusData;
}

const SyncPhaseDisplay: React.FC<SyncPhaseDisplayProps> = ({ syncStatus }) => {
  const currentPhase = syncStatus.phases[syncStatus.currentPhaseIndex];
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
        Sync Phases
      </h4>
      
      <div className="space-y-2">
        {syncStatus.phases.map((phase, index) => {
          const isActive = index === syncStatus.currentPhaseIndex;
          const isCompleted = index < syncStatus.currentPhaseIndex;
          const isUpcoming = index > syncStatus.currentPhaseIndex;
          
          return (
            <div
              key={phase.name}
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                  : isCompleted
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div className="flex-shrink-0 mr-3">
                {isCompleted ? (
                  <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : isActive ? (
                  <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                )}
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    isActive 
                      ? 'text-blue-900 dark:text-blue-100' 
                      : isCompleted
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {formatPhaseName(phase.name)}
                  </span>
                  
                  {isActive && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      Active
                    </span>
                  )}
                </div>
                
                <p className={`text-xs mt-1 ${
                  isActive
                    ? 'text-blue-700 dark:text-blue-300'
                    : isCompleted
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {phase.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ====================================================================================
// METRICS DISPLAY COMPONENT
// ====================================================================================

interface SyncMetricsDisplayProps {
  syncStatus: MusicSyncStatusData;
  additionalMetrics?: any;
}

const SyncMetricsDisplay: React.FC<SyncMetricsDisplayProps> = ({ 
  syncStatus, 
  additionalMetrics 
}) => {
  const elapsedTime = syncStatus.computed?.elapsedTime || 0;
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
        Performance Metrics
      </h4>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Processing Speed */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {syncStatus.metrics.itemsPerSecond.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">items/sec</div>
        </div>
        
        {/* Data Transferred */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatBytes(syncStatus.metrics.bytesTransferred)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">transferred</div>
        </div>
        
        {/* API Calls */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {syncStatus.metrics.apiCallsMade.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">API calls</div>
        </div>
        
        {/* Elapsed Time */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatDuration(elapsedTime)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">elapsed</div>
        </div>
      </div>
      
      {/* Additional Metrics */}
      {additionalMetrics?.efficiency && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {(additionalMetrics.efficiency.successRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Error Rate:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {(additionalMetrics.efficiency.errorRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ====================================================================================
// COMPACT SYNC STATUS COMPONENT
// ====================================================================================

interface CompactSyncStatusProps {
  syncStatus: MusicSyncStatusData;
  className?: string;
}

const CompactSyncStatus: React.FC<CompactSyncStatusProps> = ({ 
  syncStatus, 
  className = '' 
}) => {
  const progressPercentage = syncStatus.computed?.progressPercentage || 0;

  return (
    <div className={`compact-sync-status ${className}`}>
      <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Provider Icon */}
        <ProviderIcon providerId={syncStatus.providerId} className="w-5 h-5" />
        
        {/* Progress and Status */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {getProviderName(syncStatus.providerId)}
            </span>
            <StatusBadge 
              status={syncStatus.status} 
              healthScore={syncStatus.computed?.healthScore}
              compact={true}
            />
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>
              {syncStatus.progress.processedItems.toLocaleString()} / {syncStatus.progress.estimatedTotal.toLocaleString()}
            </span>
            <span>{progressPercentage}%</span>
          </div>
        </div>
        
        {/* Controls */}
        {syncStatus.computed?.isActive && (
          <SyncControls 
            syncId={syncStatus._id} 
            status={syncStatus.status}
            compact={true}
          />
        )}
      </div>
    </div>
  );
};

// ====================================================================================
// SYNC CONTROLS COMPONENT
// ====================================================================================

interface SyncControlsProps {
  syncId: Id<'musicSyncStatus'>;
  status: string;
  compact?: boolean;
}

const SyncControls: React.FC<SyncControlsProps> = ({ syncId, status, compact = false }) => {
  const controlSync = useMutation(api.functions.musicSyncStatus.controlSyncOperation);
  const [isControlling, setIsControlling] = useState<string | null>(null);

  const handleControl = useCallback(async (action: string, reason?: string) => {
    if (isControlling) return;

    setIsControlling(action);
    try {
      await controlSync({
        syncId,
        action,
        reason,
        clientInfo: {
          platform: 'web',
          version: '1.0.0',
        }
      });
    } catch (error) {
      console.error(`Failed to ${action} sync:`, error);
      // TODO: Show error notification
    } finally {
      setIsControlling(null);
    }
  }, [controlSync, syncId, isControlling]);

  const canPause = status === 'in_progress';
  const canResume = status === 'paused';
  const canCancel = ['initializing', 'in_progress', 'paused'].includes(status);

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        {canPause && (
          <button
            onClick={() => handleControl('pause')}
            disabled={isControlling === 'pause'}
            className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            title="Pause sync"
          >
            <PauseIcon className="w-4 h-4" />
          </button>
        )}
        
        {canResume && (
          <button
            onClick={() => handleControl('resume')}
            disabled={isControlling === 'resume'}
            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            title="Resume sync"
          >
            <PlayIcon className="w-4 h-4" />
          </button>
        )}
        
        {canCancel && (
          <button
            onClick={() => handleControl('cancel', 'User requested cancellation')}
            disabled={isControlling === 'cancel'}
            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            title="Cancel sync"
          >
            <StopIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {canPause && (
        <button
          onClick={() => handleControl('pause')}
          disabled={isControlling === 'pause'}
          className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 disabled:opacity-50"
        >
          {isControlling === 'pause' ? 'Pausing...' : 'Pause'}
        </button>
      )}
      
      {canResume && (
        <button
          onClick={() => handleControl('resume')}
          disabled={isControlling === 'resume'}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 disabled:opacity-50"
        >
          {isControlling === 'resume' ? 'Resuming...' : 'Resume'}
        </button>
      )}
      
      {canCancel && (
        <button
          onClick={() => handleControl('cancel', 'User requested cancellation')}
          disabled={isControlling === 'cancel'}
          className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 disabled:opacity-50"
        >
          {isControlling === 'cancel' ? 'Cancelling...' : 'Cancel'}
        </button>
      )}
    </div>
  );
};

// ====================================================================================
// SYNC ISSUES DISPLAY COMPONENT
// ====================================================================================

interface SyncIssuesDisplayProps {
  syncStatus: MusicSyncStatusData;
}

const SyncIssuesDisplay: React.FC<SyncIssuesDisplayProps> = ({ syncStatus }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
          Issues & Warnings
        </h4>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {/* Summary */}
      <div className="flex items-center space-x-4">
        {syncStatus.errors.length > 0 && (
          <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
            <ErrorIcon className="w-4 h-4" />
            <span className="text-sm">
              {syncStatus.errors.length} error{syncStatus.errors.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
        
        {syncStatus.warnings.length > 0 && (
          <div className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400">
            <WarningIcon className="w-4 h-4" />
            <span className="text-sm">
              {syncStatus.warnings.length} warning{syncStatus.warnings.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      
      {/* Detailed Issues */}
      {showDetails && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {/* Errors */}
          {syncStatus.errors.map((error, index) => (
            <div key={`error-${index}`} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <ErrorIcon className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-grow min-w-0">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error.error?.message || 'Unknown error occurred'}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {error.phase} • {new Date(error.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Warnings */}
          {syncStatus.warnings.map((warning, index) => (
            <div key={`warning-${index}`} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <WarningIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-grow min-w-0">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {warning.warning}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    {warning.phase} • {new Date(warning.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ====================================================================================
// STATUS BADGE COMPONENT
// ====================================================================================

interface StatusBadgeProps {
  status: string;
  healthScore?: number;
  compact?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, healthScore, compact = false }) => {
  const getStatusColor = (status: string, healthScore?: number) => {
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
        // Use health score to determine color if available
        if (healthScore !== undefined) {
          if (healthScore >= 80) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
          if (healthScore >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
          return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
        }
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const statusText = formatStatus(status);
  const colorClasses = getStatusColor(status, healthScore);

  if (compact) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}>
        {statusText}
      </span>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${colorClasses}`}>
        {statusText}
      </span>
      
      {healthScore !== undefined && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Health: {healthScore}%
        </span>
      )}
    </div>
  );
};

// ====================================================================================
// SYNC STATUS FOOTER COMPONENT
// ====================================================================================

interface SyncStatusFooterProps {
  lastUpdate: number;
  isRealTime: boolean;
}

const SyncStatusFooter: React.FC<SyncStatusFooterProps> = ({ 
  lastUpdate, 
  isRealTime 
}) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTimeAgo = () => {
      if (lastUpdate > 0) {
        const diff = Date.now() - lastUpdate;
        setTimeAgo(formatTimeAgo(diff));
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    
    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          isRealTime ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
        }`} />
        <span>
          {isRealTime ? 'Live updates' : 'Manual refresh'}
        </span>
      </div>
      
      {lastUpdate > 0 && (
        <span>Last updated {timeAgo}</span>
      )}
    </div>
  );
};

// ====================================================================================
// UTILITY FUNCTIONS
// ====================================================================================

const getProviderName = (providerId: string): string => {
  const providerNames: Record<string, string> = {
    spotify: 'Spotify',
    apple_music: 'Apple Music',
    youtube_music: 'YouTube Music',
  };
  return providerNames[providerId] || providerId;
};

const formatSyncType = (syncType: string): string => {
  const typeNames: Record<string, string> = {
    full: 'Full Sync',
    incremental: 'Incremental',
    favorites: 'Favorites Only',
    playlists: 'Playlists Only',
  };
  return typeNames[syncType] || syncType;
};

const formatPriority = (priority: string): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

const formatStatus = (status: string): string => {
  const statusNames: Record<string, string> = {
    initializing: 'Initializing',
    in_progress: 'In Progress',
    paused: 'Paused',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    superseded: 'Superseded',
  };
  return statusNames[status] || status;
};

const formatPhaseName = (phaseName: string): string => {
  const phaseNames: Record<string, string> = {
    initialization: 'Initialization',
    authentication: 'Authentication',
    data_fetch: 'Data Fetch',
    processing: 'Processing',
    finalization: 'Finalization',
  };
  return phaseNames[phaseName] || phaseName;
};

const formatStepName = (stepName: string): string => {
  return stepName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

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

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatTimeAgo = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

// ====================================================================================
// ICON COMPONENTS
// ====================================================================================

const SyncIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const PauseIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const PlayIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 6h12v12H6z" />
  </svg>
);

const ErrorIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
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

export default MusicSyncStatus;