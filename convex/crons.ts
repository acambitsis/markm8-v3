// Scheduled jobs for MarkM8
// https://docs.convex.dev/scheduling/cron-jobs

import { cronJobs } from 'convex/server';

import { internal } from './_generated/api';

const crons = cronJobs();

// Clean up old document parse requests every hour
// Records older than 1 hour are deleted to prevent table bloat
crons.hourly(
  'cleanup document parse requests',
  { minuteUTC: 0 },
  internal.documents.cleanupOldRequests,
);

export default crons;
