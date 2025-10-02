/**
 * Convex Cron Jobs Configuration
 * Automated scheduling for AI training pipelines and maintenance tasks
 */

import { cronJobs } from 'convex/server';
import { api } from './_generated/api';

const crons = cronJobs();

// Weekly AI training pipeline - runs every Sunday at 2 AM UTC
crons.weekly(
  'weekly AI training pipeline',
  {
    dayOfWeek: 'sunday',
    hourUTC: 2,
    minuteUTC: 0,
  },
  api.functions.aiTraining.weeklyTrainingPipeline,
);

// Daily voice cache cleanup - runs every day at 1 AM UTC  
crons.daily(
  'voice cache cleanup',
  {
    hourUTC: 1,
    minuteUTC: 0,
  },
  api.functions.voice.cleanupExpiredCache,
);

// Daily training data anonymization - runs every day at 3 AM UTC
crons.daily(
  'training data anonymization',
  {
    hourUTC: 3,
    minuteUTC: 0,
  },
  api.functions.compliance.anonymizeExpiredData,
);

// Weekly constitutional compliance check - runs every Monday at 4 AM UTC
crons.weekly(
  'constitutional compliance check',
  {
    dayOfWeek: 'monday',
    hourUTC: 4,
    minuteUTC: 0,
  },
  api.functions.compliance.enforceConstitutionalCompliance,
);

// Training session status check - runs every 2 hours
crons.interval(
  'training status check',
  { hours: 2 },
  api.functions.aiTraining.checkAllTrainingStatus,
);

// ElevenLabs usage monitoring - runs every 6 hours
crons.interval(
  'ElevenLabs usage monitoring',
  { hours: 6 },
  api.functions.voice.monitorElevenLabsUsage,
);

export default crons;