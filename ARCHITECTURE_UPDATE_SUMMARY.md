# Architecture Update: LISTEN/NOTIFY Implementation

**Date:** 2025-12-18
**Change:** Migrated from fire-and-forget HTTP calls to PostgreSQL LISTEN/NOTIFY with backup polling

---

## Summary

Updated the MarkM8 v3 architecture to use **PostgreSQL LISTEN/NOTIFY** for triggering background grading jobs instead of HTTP calls to a Railway worker endpoint. This change provides:

- ✅ **$19/month cost savings** (Neon Free plan works vs Launch plan required)
- ✅ **Instant job processing** (no polling delay)
- ✅ **Better reliability** (backup polling catches missed notifications)
- ✅ **Reduced infrastructure complexity** (no HTTP endpoint for worker communication)

---

## What Changed

### Before (Fire-and-Forget HTTP)

```typescript
// Submission endpoint
await fetch(`${process.env.RAILWAY_WORKER_URL}/api/grading/process`, {
  method: 'POST',
  body: JSON.stringify({ gradeId }),
});

// Worker: HTTP endpoint
export async function POST(req: Request) {
  const { gradeId } = await req.json();
  await processGrade(gradeId);
}
```

**Problems:**
- Required constant polling or unreliable fire-and-forget HTTP
- Kept Neon database awake 24/7 (~$19/mo minimum)
- Lost jobs if HTTP call failed

### After (LISTEN/NOTIFY + Polling)

```typescript
// Submission endpoint
await tx.execute(sql`NOTIFY new_grade, ${grade.id}`);

// Worker: Event-driven
notificationClient.on('notification', async (msg) => {
  if (msg.channel === 'new_grade') {
    await processGrade(msg.payload);
  }
});

// Backup: Poll every 5 minutes for stuck grades
setInterval(async () => {
  const stuck = await findStuckGrades();
  for (const grade of stuck) {
    await processGrade(grade.id);
  }
}, 5 * 60 * 1000);
```

**Benefits:**
- Instant notifications (no delay)
- Database scales to zero between submissions
- Backup polling catches edge cases
- Saves $19/month on Neon

---

## Files Updated

### 1. `/claude.md` (Quick Reference)

**Changes:**
- Updated Tech Stack table: "PostgreSQL LISTEN/NOTIFY + Railway Worker"
- Updated Async Grading Flow to show NOTIFY/LISTEN
- Updated File Structure to show `worker/` directory
- Removed `RAILWAY_WORKER_URL` from environment variables
- Updated What's Next checklist

### 2. `/TECHNICAL_DESIGN.md` (Detailed Implementation)

**Changes:**
- Updated Tech Stack table with LISTEN/NOTIFY justification
- Added "Why LISTEN/NOTIFY Instead of Polling?" section with cost analysis
- Replaced "Railway Worker Endpoint" with:
  - Submission Endpoint (sends NOTIFY)
  - Railway Worker (LISTEN + backup polling)
  - Grade Processing Logic (separated into processGrade.ts)
- Updated Cost Analysis to show Free Neon tier works ($19/mo savings)
- Updated File Structure to show `worker/` directory
- Removed `RAILWAY_WORKER_URL` from environment variables
- Updated Launch Checklist with LISTEN/NOTIFY verification step

### 3. `/FUNCTIONAL_REQUIREMENTS.md`

**No changes needed** - This file is intentionally technical-implementation-agnostic. It describes user behavior and experience, which remains identical regardless of whether we use LISTEN/NOTIFY or HTTP calls.

---

## New File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── webhooks/            # Clerk + Stripe
│   │   └── grades/[id]/stream/  # SSE endpoint
│   └── [locale]/
│       ├── (auth)/              # Protected routes
│       └── (unauth)/            # Public routes
├── worker/                      # NEW: Background worker service
│   ├── index.ts                 # Worker entry point (LISTEN + polling)
│   └── processGrade.ts          # Grading logic (3x AI, retry, consensus)
├── features/
├── libs/
├── models/
└── hooks/
```

**Note:** The `worker/` directory is deployed as a separate Railway service but shares the same codebase.

---

## Railway Deployment

### Service Configuration

**Web Service:**
- Start command: `bun --bun run start` (Next.js app)
- Exposed to public internet
- Handles all user requests

**Worker Service:**
- Start command: `bun run src/worker/index.ts`
- Internal only (no public URL)
- Listens for PostgreSQL NOTIFY
- Polls every 5 minutes for stuck grades

### Environment Variables

Both services share the same environment variables:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `OPENROUTER_API_KEY` - AI provider
- `CLERK_SECRET_KEY` - Authentication
- `STRIPE_SECRET_KEY` - Payments

**Removed:**
- ~~`RAILWAY_WORKER_URL`~~ - No longer needed (using LISTEN/NOTIFY)

---

## Cost Impact

### Before (with constant polling or Launch plan)

| Service | Cost |
|---------|------|
| Neon (Launch plan) | $19/mo |
| Railway Web | $15/mo |
| Railway Worker | $40/mo |
| **Total** | **$74/mo** |

### After (with LISTEN/NOTIFY)

| Service | Cost |
|---------|------|
| Neon (Free plan) | **$0/mo** |
| Railway Web | $15/mo |
| Railway Worker | $40/mo |
| **Total** | **$55/mo** |

**Savings: $19/month** (25% reduction)

---

## Implementation Notes

### PostgreSQL LISTEN/NOTIFY Basics

```typescript
// Sender (submission endpoint)
await db.execute(sql`NOTIFY new_grade, ${gradeId}`);

// Receiver (worker)
const client = await pool.connect();
await client.query('LISTEN new_grade');

client.on('notification', (msg) => {
  console.log('Channel:', msg.channel);   // 'new_grade'
  console.log('Payload:', msg.payload);   // gradeId
});
```

### Why Backup Polling?

LISTEN/NOTIFY is reliable, but we add backup polling (every 5 minutes) to handle edge cases:
- Database connection drops and reconnects (notification lost)
- Worker crashes during notification
- Race conditions during deployment

The backup polling finds any grades stuck in 'queued' status for >10 minutes and reprocesses them.

### Scaling Considerations

LISTEN/NOTIFY scales well for MarkM8's use case:
- ✅ Works perfectly for <1000 notifications/second
- ✅ No additional infrastructure (native PostgreSQL)
- ⚠️ Global lock on NOTIFY in high-concurrency scenarios (not an issue for <1000 DAUs)

If you scale to 10,000+ concurrent users, consider migrating to Redis + BullMQ.

---

## Testing

### Local Development

1. Start database: `docker-compose up -d` (or use Neon dev branch)
2. Start web server: `bun --bun run dev`
3. Start worker (separate terminal): `bun run src/worker/index.ts`
4. Submit an essay and watch worker logs

### Verify LISTEN/NOTIFY Working

```bash
# Terminal 1: Watch worker logs
bun run src/worker/index.ts

# Terminal 2: Submit essay via UI or API
curl -X POST http://localhost:3000/api/essays/submit \
  -H "Content-Type: application/json" \
  -d '{"essayId":"..."}'

# You should see in worker logs:
# 📨 Received notification for grade: abc-123-def
# ⚙️  Processing grade: abc-123-def
```

---

## Migration Checklist

When deploying this change:

- [x] Update documentation (CLAUDE.md, TECHNICAL_DESIGN.md)
- [ ] Implement `src/worker/index.ts` with LISTEN + polling
- [ ] Implement `src/worker/processGrade.ts`
- [ ] Update submission endpoint to use NOTIFY
- [ ] Test locally with separate worker process
- [ ] Deploy worker service to Railway
- [ ] Configure worker start command: `bun run src/worker/index.ts`
- [ ] Verify LISTEN/NOTIFY working in production
- [ ] Monitor for stuck grades (should see backup polling logs)
- [ ] Remove old `/api/grading/process` endpoint (if it exists)
- [ ] Update monitoring/alerts to track worker health

---

## Rollback Plan

If LISTEN/NOTIFY causes issues in production:

1. Keep the worker service running
2. Add back HTTP endpoint at `/api/grading/process`
3. Update submission endpoint to POST to worker
4. Disable LISTEN (comment out `client.query('LISTEN new_grade')`)
5. Keep backup polling running

The hybrid approach (HTTP + polling) would still work, just less cost-effective.

---

## References

- [PostgreSQL LISTEN/NOTIFY Documentation](https://www.postgresql.org/docs/current/sql-notify.html)
- [Neon Pub/Sub Guide](https://neon.com/guides/pub-sub-listen-notify)
- [Railway Long-Running Processes](https://docs.railway.com/reference/scaling)
- [Cost Analysis Discussion](https://www.vantage.sh/blog/neon-vs-aws-aurora-serverless-postgres-cost-scale-to-zero)
