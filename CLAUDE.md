# MarkM8 v3 - Development Context

## Quick Reference

**What we're building:** Pay-per-essay AI grading platform for students

**Current scope:** Individual users only, simple launch

**Note:** Admin functionality (admin dashboard, user management, analytics) is specified in FUNCTIONAL_REQUIREMENTS.md but **deferred to v3.1+**. For v3 launch, use Convex Dashboard for operational tasks.

---

## Tech Stack

| Component | Choice | Key Notes |
|-----------|--------|-----------|
| **Runtime** | Bun (recommended) or Node.js | Bun for faster installs; npm/pnpm also work |
| **Framework** | Next.js 15 + React 19 | Async request APIs, form actions, ref as prop |
| **Styling** | Tailwind 4 | CSS-first config (@theme), native dark mode |
| **Auth** | Clerk + Convex | Clerk JWT template "convex", auto user sync |
| **Database** | Convex | Document DB, real-time subscriptions, serverless |
| **Deployment** | Vercel | Next.js native hosting, edge functions |
| **Async Jobs** | Convex Actions + Scheduler | `ctx.scheduler.runAfter()` for grading |
| **Real-time** | Convex Subscriptions | Auto-updates on DB changes, no polling |
| **UI** | Shadcn UI | Component library |
| **AI SDK** | Vercel AI SDK | Type-safe AI calls, streaming, provider-agnostic |
| **AI Provider** | OpenRouter (configurable grading ensemble) | 3–5 parallel runs, per-run model selection (supports mixed models), less than $0.30/essay |
| **Payments** | Stripe | One-time credit purchases, NOT subscriptions |

---

## Core Architecture Principles

1. **User-Scoped Resources** - All data belongs to a user (no organizations)
2. **Real-time by Default** - Convex subscriptions auto-update UI on DB changes
3. **Atomic Mutations** - Convex mutations are transactional by default
4. **Serverless AI Grading** - AI calls run in Convex actions (10-min timeout)
5. **Own Your Data** - All business logic in Convex functions

---

## Database Schema (Convex)

**Documents (convex/schema.ts):**

```typescript
// Core documents
users      // Synced from Clerk webhook (indexed by clerkId)
credits    // balance + reserved per user (starts at 1.00 balance, 0.00 reserved)
creditTransactions  // Audit log (signup_bonus, purchase, grading, refund)
essays     // userId, status (draft/submitted/archived), assignmentBrief, rubric, content
grades     // userId, essayId, status (queued→processing→complete/failed)
platformSettings    // Singleton config
```

**Key constraints:**
- All resources have `userId` (indexed for queries)
- Essays can be 'draft' (autosave, partial data) or 'submitted' (validated, complete)
- Grades support 1-to-many with essays (multiple grades per essay for regrading)
- Atomic operations via Convex mutations (no explicit transactions needed)

**Credit semantics (Option A - "deduct at submission"):**
- `balance` = spendable credits (already reduced by pending operations)
- `reserved` = informational only (tracks credits in pending grading)
- `available` = balance (NOT balance - reserved)
- Flow:
  - On submit: `balance -= cost`, `reserved += cost`
  - On success: `reserved -= cost` (balance unchanged, already deducted)
  - On failure: `balance += cost`, `reserved -= cost` (refund)

**Decimal handling:**
- Credit amounts stored as strings (e.g., "1.00") for JSON compatibility
- `convex/lib/decimal.ts` uses integer cents internally to avoid floating point issues
- Use helpers: `addDecimal()`, `subtractDecimal()`, `isGreaterOrEqual()`, `isPositive()`

---

## Async Grading Flow

**Architecture:** Essay submission triggers a Convex scheduled action for AI grading. Real-time subscriptions eliminate polling.

```
Submit → Queue → Process (background) → Complete/Failed
         ↓                                    ↓
    Credit deducted              Success: keep deducted
                                 Failure: refund credit
```

**Key Constraints:**
- Credit deducted atomically at submission (not after completion)
- Grading runs in `internalAction` (can call external AI APIs)
- Failure must refund credit via `ctx.runMutation`
- Client uses `useQuery` subscription (no polling)

**Implementation:** See `convex/essays.ts` (submit), `convex/grading.ts` (AI processing)

---

## Convex Function Types

```typescript
// Query - Read-only, cached, real-time subscriptions
export const getById = query({ args: {...}, handler: async (ctx, args) => {...} });

// Mutation - Write operations, atomic, triggers subscriptions
export const saveDraft = mutation({ args: {...}, handler: async (ctx, args) => {...} });

// Action - External API calls (AI, Stripe), no direct DB access
export const processGrade = internalAction({ args: {...}, handler: async (ctx, args) => {
  // Use ctx.runQuery() and ctx.runMutation() for DB access
} });

// Internal - Only callable from other Convex functions
export const getInternal = internalQuery({ ... });
export const createFromClerk = internalMutation({ ... });
```

---

## File Structure

*Key architectural files shown; not exhaustive.*

```
convex/                          # Convex backend (serverless)
├── schema.ts                    # Document schema + exported validators (single source of truth)
├── http.ts                      # Webhook endpoints (Clerk, Stripe)
├── lib/                         # Shared helpers (auth.ts, decimal.ts)
├── platformSettings.ts          # Admin-configurable settings (signup bonus)
└── [domain].ts                  # Function files: users, credits, essays, grades, grading

src/
├── app/[locale]/
│   ├── (auth)/                  # Protected routes (dashboard, submit, grades, history, settings)
│   └── (unauth)/                # Public routes (landing, pricing)
├── components/                  # Shared UI components
├── features/                    # Feature modules (essays/, grading/, dashboard/)
├── hooks/                       # Custom hooks (useCredits, useGradeStatus, useAutosave)
├── libs/                        # Third-party configs (Env.ts, Logger.ts)
└── utils/                       # Utilities (Helpers.ts with cn())
```

---

## Key Convex Constraint

**Actions cannot access `ctx.db` directly** - must use internal functions:

```typescript
export const processGrade = internalAction({
  handler: async (ctx, { gradeId }) => {
    // ❌ ctx.db.get(gradeId)  — Will not work in actions
    // ✅ Must use runQuery/runMutation
    const grade = await ctx.runQuery(internal.grades.getInternal, { gradeId });
    await ctx.runMutation(internal.grades.complete, { gradeId, results });
  },
});
```

For other Convex patterns (`useQuery`, `useMutation`, `ctx.scheduler`), see existing code in `convex/` and `src/hooks/`.

---

## Development Workflow

**Start dev server (runs Next.js + Convex together):**
```bash
bun --bun run dev
```

**Convex commands:**
```bash
bun run convex:dev    # Start Convex dev server (also runs with bun run dev)
bun run convex:deploy # Deploy Convex functions manually
```

**Test Stripe webhooks locally:**
```bash
# Convex HTTP endpoint format: https://<project>.convex.site/stripe-webhook
stripe listen --forward-to https://<project>.convex.site/stripe-webhook
```

---

## Git Branching Strategy

```
feature/* ──PR──► dev ──promote──► main
                   │                 │
                   ▼                 ▼
              Dev Deploy        Prod Deploy
           (Convex + Vercel)  (Convex + Vercel)
```

**Branches:**
| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `dev` | Default branch. PRs merge here first. | Dev (Convex + Vercel Preview) |
| `main` | Production. Only receives merges from `dev`. | Prod (Convex + Vercel Production) |
| `feature/*` | Individual work branches. | Vercel Preview only (no Convex) |

**Workflow:**
1. Create feature branch from `dev`
2. Open PR targeting `dev` → CI runs, Vercel preview deploys (no Convex)
3. Merge to `dev` → Deploys to dev environment (Convex + Vercel)
4. When ready for production: merge `dev` → `main`
5. Merge to `main` → Deploys to production (Convex + Vercel)

**Build behavior (`scripts/build-ci.mjs`):**
- `main` or `dev` branch → Deploys Convex + builds Next.js
- Other branches (PRs) → Builds Next.js only (no Convex deploy)

---

## Environment Variables

**Required (src/libs/Env.ts):**
```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
CONVEX_DEPLOY_KEY=prod:xxx  # For CI/CD deployment

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Stripe (Phase 3)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Setup:** See `SETUP.md` for Clerk + Convex initial configuration.

---

## Boilerplate Patterns (ixartz SaaS)

**Follow these patterns for consistency:**

```
Locations:
├── src/libs/Env.ts       # t3-env + Zod validation (import Env, not process.env)
├── src/libs/Logger.ts    # Pino logger (import { logger } from '@/libs/Logger')
├── src/utils/Helpers.ts  # cn() utility lives here
├── src/templates/        # Landing page sections (Hero, Features, Pricing, etc.)
├── src/types/            # Shared TypeScript definitions
└── src/locales/          # i18n JSON files (en.json, fr.json)
```

**Key patterns:**
- **Env vars:** Use `Env.NEXT_PUBLIC_CONVEX_URL` not `process.env.NEXT_PUBLIC_CONVEX_URL`
- **Logging:** Use `logger.info()` / `logger.error()` from Logger.ts
- **Clerk:** Integrated with Convex via `ConvexProviderWithClerk`
- **Testing:** Vitest for unit tests (`bun run test`), Playwright for E2E
- **Shadcn:** Existing components use `forwardRef` (keep as-is for compatibility)
- **Class merging:** `import { cn } from '@/utils/Helpers'`

---

## Important Constraints

**DO:**
- ✅ Use `requireAuth()` helper in all queries/mutations
- ✅ Import validators from `convex/schema.ts` (single source of truth)
- ✅ Use `internalQuery`/`internalMutation` for functions not exposed to clients
- ✅ Implement explicit cascade delete (Convex does NOT auto-cascade)
- ✅ Use React 19 patterns for new components (ref as prop, no forwardRef)

**DON'T:**
- ❌ Use `console.log`/`console.error` in Next.js — use `logger` from `@/libs/Logger`
- ❌ Create public `query` that looks up users by external ID (use `internalQuery` for webhooks/API routes)
- ❌ Use Clerk Organizations (only Clerk auth)
- ❌ Add organization tables (future feature)
- ❌ Use Bun-specific imports (stay Node.js-compatible)
- ❌ Expose internal functions as public `query`/`mutation` (PII leakage risk)

---

## Implementation Status

**Complete:**
- Clerk authentication + Convex integration
- Convex schema and functions (users, credits, essays, grades)
- Clerk webhook handler (user sync + signup bonus)
- Essay submission (3-tab form with autosave)
- Real-time grade status display
- History page (paginated table)
- Onboarding page (grading scale preferences)
- Credits display (real-time balance)
- AI grading (multi-model consensus via OpenRouter)
- Stripe credit purchase integration

**Pending Implementation:**
| Module | Status |
|--------|--------|
| — | All core features complete |

---

## Deployment & DevOps

**Environments:**
| Environment | Branch | Convex | Vercel | Clerk |
|-------------|--------|--------|--------|-------|
| Development | `dev` | brazen-buffalo-798 | Preview | dear-drum-37 (test) |
| Production | `main` | lovely-swordfish-944 | Production | clerk.markm8.com (live) |

**Deployment triggers:**
| Trigger | Convex Deploy | Vercel Deploy |
|---------|---------------|---------------|
| Push to `dev` | ✅ Dev | ✅ Preview |
| Push to `main` | ✅ Prod | ✅ Production |
| PR to `dev` | ❌ | ✅ Preview |

**Env vars set in:** Convex Dashboard, Vercel Dashboard, `.env.local` (local only)

**CLI/MCP tools:** Use `vercel` CLI and Convex MCP server for env vars, data inspection, and debugging.

**Webhook endpoints (Convex HTTP):**
- Clerk: `https://<deployment>.convex.site/clerk-webhook`
- Stripe: `https://<deployment>.convex.site/stripe-webhook`
