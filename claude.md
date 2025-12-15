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
| **Async Jobs** | Inngest | Background grading, auto-retry, observability |
| **Real-time** | SSE | Grade status updates |
| **UI** | Shadcn UI | Included in ixartz boilerplate |
| **AI SDK** | Vercel AI SDK | Type-safe AI calls, streaming, provider-agnostic |
| **AI Provider** | OpenRouter (Grok-4 × 3) | Multi-model consensus, less than $0.30/essay |
| **Payments** | Stripe | One-time credit purchases, NOT subscriptions |

---

## Core Architecture Principles

1. **User-Scoped Resources** - All data belongs to a user (no organizations)
2. **Avoid Vendor Lock-In** - Clerk for auth only, custom logic in our database
3. **Background AI Grading** - AI calls run async via Inngest (slow, need retries, real-time status via SSE)
4. **Own Your Data** - All business logic in our database
5. **Cost-Conscious** - Stay on free tiers, 68% profit margin

---

## Database Schema

**User-scoped resources:**

```typescript
// Core tables
users           // Synced from Clerk (id = clerkId)
credits         // balance per user (starts at 1.00)
creditTransactions // Audit log (signup_bonus, purchase, grading, refund)
essays          // userId, status (draft/submitted), assignmentBrief, rubric, content (all JSONB/nullable for drafts)
grades          // userId, essayId, status (queued→processing→complete/failed) - 1-to-many (regrading support)
```

**Key constraints:**
- All resources have `userId` (foreign key to users)
- Essays can be 'draft' (autosave, partial data) or 'submitted' (validated, complete)
- Grades support 1-to-many with essays (multiple grades per essay for regrading)
- Credits deducted AFTER grading completes successfully (not at submission)
- If grading fails, no deduction occurs (no-hold model, so no refund needed)
- Atomic operations (credit deduction + grade completion)

---

## Async Grading Flow

```
1. POST /api/essays/submit
   → Validate, check credits >= 1.00
   → Update essay: status 'draft' → 'submitted', set submittedAt
   → Create grade record (status: 'queued')
   → Trigger Inngest event 'essay/grade'
   → Return gradeId instantly (<500ms)

2. Inngest function (background)
   → Fetch essay (has assignmentBrief, rubric, content) + grade
   → Check credits (race condition protection)
   → Mark status: 'processing'
   → Run 3x Grok-4 in parallel (using Vercel AI SDK)
   → Outlier detection (exclude if >10% different)
   → Calculate grade range + feedback
   → Deduct credits + save grade (atomic transaction)
   → Mark status: 'complete' or 'failed'

3. SSE stream (/api/grades/[id]/stream)
   → Poll grade status every 2s
   → Send updates to client
   → Close on terminal state (complete/failed)

4. Client (useGradeStatus hook)
   → Real-time status updates
   → Show queued → processing → complete/failed

5. Regrading (future feature)
   → User clicks "Regrade" on completed essay
   → Find existing essay (has all data: brief, rubric, content)
   → Create NEW grade record (status: 'queued')
   → Trigger Inngest event 'essay/grade'
   → Same flow as initial grading
```

---

## File Structure (ixartz Boilerplate Aligned)

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
│       ├── inngest/             # Inngest endpoint
│       └── grades/[id]/stream/  # SSE endpoint
├── features/                    # Feature modules
│   ├── essays/                  # Submission forms
│   ├── grading/                 # Results display
│   └── credits/                 # Balance + purchase
├── libs/                        # Third-party configs
│   ├── DB.ts                    # Drizzle setup (from template)
│   ├── Clerk.ts                 # Auth helpers
│   ├── Stripe.ts                # Payment client
│   ├── Inngest.ts               # Async job client
│   └── AI.ts                    # Vercel AI SDK client (OpenRouter)
├── models/
│   └── Schema.ts                # Database schema
└── hooks/
    └── useGradeStatus.ts        # SSE client hook

inngest/
└── functions/
    └── grade-essay.ts           # Background grading function
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

**Deploy to Vercel:**
```bash
vercel --prod  # Uses Bun runtime (vercel.json configured)
```

---

## Important Constraints

**DO:**
- ✅ Keep resources user-scoped (`userId` foreign key)
- ✅ Use Inngest for all AI grading (never synchronous)
- ✅ Use Vercel AI SDK for all AI calls (type-safe, provider-agnostic)
- ✅ Use SSE for real-time updates
- ✅ Deduct credits AFTER grading completes
- ✅ Use atomic transactions for credit operations
- ✅ Use React 19 form actions (not manual state management)
- ✅ Use Tailwind 4 CSS-first config (no tailwind.config.ts)

**DON'T:**
- ❌ Use Clerk Organizations (only Clerk auth)
- ❌ Add organization tables (future feature, see PHASE_2_MIGRATION.md)
- ❌ Run AI grading synchronously (use Inngest)
- ❌ Deduct credits at submission (wait for completion)
- ❌ Use WebSockets (use SSE instead)
- ❌ Use React 18 patterns (forwardRef, manual loading states)
- ❌ Use Bun-specific imports (stay Node.js-compatible)

---

## When to Reference Full Documentation

**See `FUNCTIONAL_REQUIREMENTS.md` for:**
- Full user journeys (sign up, submission, grading, purchases, settings)
- Page & route specifications (all routes with detailed requirements)
- Business rules (credit economics, SLA, multi-model consensus algorithm)
- Admin functionality details
- Error states & user messages
- Data validation rules

**See `TECHNICAL_DESIGN.md` for:**
- Tech stack (with justifications for each choice)
- Database schema (full definitions + design decisions)
- File structure (ixartz boilerplate aligned)
- Boilerplate setup & upgrades (Next.js 14→15, React 18→19, Tailwind 3→4)
- Implementation code (Stripe, Clerk, Inngest, AI SDK, SSE)
- Key Next.js 15 / React 19 patterns
- Architectural principles
- Cost analysis
- Launch checklist

**See `PHASE_2_MIGRATION.md` for:**
- Future multi-tenancy architecture (organizations/universities)
- Not needed for current implementation

**See `PR_CHECKLIST.md` for:**
- Comprehensive PR review guidelines (detailed explanations)

**See `PR_QUICK_CHECKLIST.md` for:**
- Fast PR review (scannable checkbox format)

---

## Environment Variables Required

```env
# Clerk (auth only)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Neon (database)
DATABASE_URL=postgresql://...

# Stripe (payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Inngest (async jobs)
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# OpenRouter (AI via Vercel AI SDK)
OPENROUTER_API_KEY=sk-or-...

# App
NEXT_PUBLIC_URL=http://localhost:3000
```

---

## Current Status

**What's done:**
- [ ] Boilerplate cloned and upgraded (Next.js 15, React 19, Tailwind 4)
- [ ] Vercel AI SDK added
- [ ] Stripe integration added
- [ ] Dark mode added
- [ ] Database schema defined

**What's next:**
- [ ] Implement essay submission flow (3 tabs)
- [ ] Implement Inngest grading function
- [ ] Implement SSE status updates
- [ ] Implement grade results display
- [ ] Implement credit purchases
- [ ] Deploy to Vercel

---

**Remember:** This file is your constant reference. When you need detailed specs, implementation code, or setup instructions, refer to `MARKM8_V3_GUIDE.md`.
