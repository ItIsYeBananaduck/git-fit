import { cronJobs } from "./_generated/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Schedule Monday data processing to run every Monday at 6 AM UTC
// This will trigger processing for users who haven't processed their data yet
crons.weekly(
  "monday data processing trigger",
  { dayOfWeek: "monday", hourUTC: 6, minuteUTC: 0 },
  internal.functions.mondayScheduledActions.processMondayDataForAllUsers
);

// Schedule cleanup of old Monday data (older than 6 months) every Sunday at 2 AM UTC
crons.weekly(
  "monday data cleanup", 
  { dayOfWeek: "sunday", hourUTC: 2, minuteUTC: 0 },
  internal.functions.mondayScheduledActions.cleanupOldMondayData
);

export default crons;