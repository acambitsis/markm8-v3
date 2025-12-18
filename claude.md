# MarkM8 v3 - Development Context

## Quick Reference

**What we're building:** Pay-per-essay AI grading platform for students

**Current scope:** Individual users only, simple launch

**Note:** Admin functionality (admin dashboard, user management, analytics) is specified in FUNCTIONAL_REQUIREMENTS.md but **deferred to v3.1+**. For v3 launch, use direct database access for operational tasks.

---

## Tech Stack

| Component | Choice | Key Notes |
|-----------|--------|-----------|
| **Runtime** | Bun | use `bun --bun run` |
| **Framework** | Next.js 15 + React 19 | Async request APIs, form actions, ref as prop |
| **Styling** | Tailwind 4 | CSS-first config (@theme), native dark mode |
| **Auth** | Clerk (auth only) | NO Organizations, just userId |
| **Database** | Neon PostgreSQL + Drizzle | Serverless, branching (dev/test/prod) |
| **Deployment** | Railway | Long-running processes, auto-scaling, GitHub integration |
| **Async Jobs** | PostgreSQL LISTEN/NOTIFY + Railway Worker | Event-driven job processing, backup polling for reliability |
| **Real-time** | SSE | Grade status updates |
| **UI** | Shadcn UI | Component library |
| **AI SDK** | Vercel AI SDK | Type-safe AI calls, streaming, provider-agnostic |
| **AI Provider** | OpenRouter (Grok-4 × 3) | Multi-model consensus, less than $0.30/essay |
| **Payments** | Stripe | One-time credit purchases, NOT subscriptions |

---

## Core Architecture Principles

1. **User-Scoped Resources** - All data belongs to a user (no organizations)
2. **Avoid Vendor Lock-In** - Clerk for auth only, custom logic in our database
3. **Background AI Grading** - AI calls run async via Railway worker (slow, need retries, real-time status via SSE)
4. **Own Your Data** - All business logic in our database
5. **Cost-Conscious** - Stay on free tiers, 68% profit margin

---

## Database Schema

**User-scoped resources:**

```typescript
// Core tables
users           // Synced from Clerk (id = clerkId)
credits         // balance + reserved per user (starts at 1.00 balance, 0.00 reserved)
creditTransactions // Audit log (signup_bonus, purchase, grading, refund)
essays          // userId, status (draft/submitted), assignmentBrief, rubric, content (all JSONB/nullable for drafts)
grades          // userId, essayId, status (queued→processing→complete/failed) - 1-to-many (regrading support)
```

**Key constraints:**
- All resources have `userId` (foreign key to users)
- Essays can be 'draft' (autosave, partial data) or 'submitted' (validated, complete)
- Grades support 1-to-many with essays (multiple grades per essay for regrading)
- Credits reserved at submission (balance - 1.00, reserved + 1.00)
- On success: Clear reservation (reserved - 1.00, credit already deducted)
- On failure: Refund reservation (balance + 1.00, reserved - 1.00)
- Atomic operations (credit reservation + essay submission, credit refund + grade failure)

---

## Async Grading Flow

```
1. POST /api/essays/submit
   → Validate, check balance >= 1.00 (available credits)
   → Reserve credit: balance - 1.00, reserved + 1.00 (atomic)
   → Update essay: status 'draft' → 'submitted', set submittedAt
   → Create grade record (status: 'queued')
   → Send PostgreSQL NOTIFY 'new_grade', gradeId
   → Return gradeId instantly (<500ms)

2. Railway worker (background, event-driven)
   → Worker listens via PostgreSQL LISTEN 'new_grade'
   → Receives gradeId instantly via notification
   → Backup: Polls every 5 minutes for stuck grades
   → Fetch essay (has assignmentBrief, rubric, content) + grade
   → Check credits (race condition protection)
   → Mark status: 'processing'
   → Run 3x Grok-4 in parallel (using Vercel AI SDK)
   → Custom retry logic (3 retries, exponential backoff: 5s, 15s, 45s)
   → Outlier detection (furthest from mean, exclude if >10% of mean)
   → Calculate grade range + feedback
   → On success: Clear reservation (reserved - 1.00, credit already deducted)
   → On failure: Refund reservation (balance + 1.00, reserved - 1.00)
   → Save grade (atomic transaction)
   → Mark status: 'complete' or 'failed'

3. SSE stream (/api/grades/[id]/stream)
   → Poll grade status every 2s
   → Send updates to client
   → Close on terminal state (complete/failed)

4. Client (useGradeStatus hook)
   → Real-time status updates via SSE
   → On connect/reconnect: Fetch current state immediately (sync with DB truth)
   → Auto-reconnect with exponential backoff on error (3s, 6s, 12s max)
   → Show queued → processing → complete/failed

5. Regrading (future feature)
   → User clicks "Regrade" on completed essay
   → Find existing essay (has all data: brief, rubric, content)
   → Create NEW grade record (status: 'queued')
   → Send NOTIFY 'new_grade', gradeId
   → Worker picks up via LISTEN
   → Same flow as initial grading
```

---

## File Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/              # Protected routes
│   │   │   ├── dashboard/
│   │   │   ├── submit/          # 3-tab essay submission
│   │   │   ├── grades/[id]/     # Status + results
│   │   │   ├── history/
│   │   │   └── settings/
│   │   └── (unauth)/            # Public routes (landing)
│   └── api/
│       ├── webhooks/            # Clerk + Stripe
│       └── grades/[id]/stream/  # SSE endpoint
├── worker/                      # Background worker (Railway service)
│   ├── index.ts                 # Worker entry point (LISTEN + polling)
│   └── processGrade.ts          # Grading logic (3x AI, retry, consensus)
├── features/                    # Feature modules
│   ├── essays/                  # Submission forms
│   ├── grading/                 # Results display
│   └── credits/                 # Balance + purchase
├── libs/                        # Third-party configs
│   ├── DB.ts                    # Drizzle setup
│   ├── Clerk.ts                 # Auth helpers
│   ├── Stripe.ts                # Payment client
│   └── AI.ts                    # Vercel AI SDK client (OpenRouter)
├── models/
│   └── Schema.ts                # Database schema
└── hooks/
    └── useGradeStatus.ts        # SSE client hook
```

---

## Key Next.js 15 / React 19 Patterns

**Async Request APIs:**
```typescript
// Always await these in Next.js 15
const token = (await cookies()).get('token');
const headersList = await headers();
const { id } = await params;
```

**Form Actions (no more onSubmit):**
```typescript
async function submitAction(formData: FormData) {
  'use server';
  // ... server logic
}

<form action={submitAction}>
  <button>Submit</button>
</form>
```

**Ref as prop (no forwardRef):**
```typescript
function Input({ ref, ...props }: Props & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}
```

---

## Development Workflow

**Start dev server:**
```bash
bun --bun run dev  # Uses Turbopack + Bun runtime (explicit Bun flag)
```

**Database migrations:**
```bash
bun run db:push  # Push schema changes
```

**Test Stripe webhooks locally:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Deploy to Railway:**
```bash
# Railway auto-deploys from GitHub
# Or use Railway CLI:
railway up
```

---

## Important Constraints

**DO:**
- ✅ Keep resources user-scoped (`userId` foreign key)
- ✅ Use Railway worker for all AI grading (never synchronous)
- ✅ Use Vercel AI SDK for all AI calls (type-safe, provider-agnostic)
- ✅ Use SSE for real-time updates
- ✅ Deduct credits AFTER grading completes
- ✅ Use atomic transactions for credit operations
- ✅ Use React 19 form actions (not manual state management)
- ✅ Use Tailwind 4 CSS-first config (no tailwind.config.ts)

**DON'T:**
- ❌ Use Clerk Organizations (only Clerk auth)
- ❌ Add organization tables (future feature, see PHASE_2_MIGRATION.md)
- ❌ Run AI grading synchronously (use Railway worker)
- ❌ Deduct credits at submission (wait for completion)
- ❌ Use WebSockets (use SSE instead)
- ❌ Use React 18 patterns (forwardRef, manual loading states)
- ❌ Use Bun-specific imports (stay Node.js-compatible)


