# MarkM8 Technical Design

**How MarkM8 is built:** Architecture, implementation patterns, and deployment

---

## Tech Stack

| Component | Choice | Justification |
|-----------|--------|---------------|
| **Runtime/Package Manager** | Bun | 2-10x faster installs, all-in-one tool (runtime + package manager + bundler + test runner) |
| **Framework** | Next.js 15 (ixartz boilerplate) | Modern, proven, Shadcn UI included, async request APIs |
| **UI Library** | React 19 | Form actions, ref as prop (no forwardRef), improved suspense |
| **Styling** | Tailwind 4 | CSS-first config (@theme), native dark mode, container queries |
| **UI Components** | Shadcn UI | Accessible, customizable, included in boilerplate |
| **Auth** | Clerk (auth only) | Multi-provider (Google, Apple, Magic Link), free tier = 10k MAU, NO Organizations feature used |
| **Database** | Convex | Serverless document database, real-time subscriptions, built-in auth integration |
| **Deployment** | Vercel | Next.js native hosting, edge functions, automatic deployments from GitHub |
| **Async Jobs** | Convex Actions + Scheduler | Background actions for AI grading, scheduled with `ctx.scheduler.runAfter()` |
| **Real-time** | Convex Subscriptions | Automatic UI updates via `useQuery` hooks, no polling needed |
| **AI SDK** | Vercel AI SDK | Type-safe AI calls, streaming support, provider-agnostic, built-in error handling |
| **AI Provider** | OpenRouter (configurable grading ensemble) | N-run consensus (3–5 runs), supports mixed models, cost-effective (~$0.10-0.15/essay) |
| **OCR/Document AI** | Mistral Document AI | Image-to-markdown conversion for instructions/rubrics, 99%+ accuracy, multilingual |
| **Payments** | Stripe | Industry standard, one-time purchases (not subscriptions) |
| **Monitoring** | Sentry + LogTape | Error tracking + structured logging |

### Why NOT Clerk Organizations?

**Clerk Organizations would:**
- ❌ Vendor lock-in (can't switch auth providers later)
- ❌ Costs scale with users ($0.02/MAU over 10k)
- ❌ Limited customization

**Our approach:**
- ✅ Clerk for auth only (provider-agnostic)
- ✅ Custom organization tables when needed (deferred to v3.1+)
- ✅ Full control over data model and billing

### Why Bun Instead of pnpm/npm?

- ✅ **2-10x faster** package installs vs pnpm/npm
- ✅ **All dependencies compatible** (Clerk, Convex, Stripe)
- ✅ **Vercel supports Bun natively** (works out of the box)
- ⚠️ **Use Node.js-compatible APIs** (avoid Bun-specific imports for portability)
- 📝 **Optional:** npm/pnpm work equally well - Bun is recommended but not required

---

## Database Schema

### Design Decision: Single `essays` Table

We use ONE `essays` table for both drafts and submitted essays (with a `status` field) instead of separate tables because:

1. **Regrading support:** Essays need the rubric for regrading. Splitting into two tables would either lose data or create redundancy.
2. **Simpler schema:** One source of truth for essay data.
3. **Performance is fine:** Autosave writes (triggered by document uploads, typing, pasting, editing, and tab blur) are trivial for Convex. Index on `['userId', 'status']` keeps queries fast.
4. **Clear lifecycle:** Draft → Submitted is just a status change + validation, not data migration.
5. **Natural queries:** `WHERE userId = X AND status = 'submitted'` is simpler than JOINs.

The `grades` table supports **1-to-many** with essays (no unique constraint on `essayId`) to allow multiple grades per essay for regrading.

### Schema Definition

```typescript
// convex/schema.ts (single source of truth)
import { defineSchema, defineTable } from 'convex/server';
import type { Infer } from 'convex/values';
import { v } from 'convex/values';

// =============================================================================
// Validators for reusable types (exported for type inference)
// =============================================================================

export const gradingScaleValidator = v.union(
  v.literal('percentage'),
  v.literal('letter'),
  v.literal('uk'),
  v.literal('gpa'),
  v.literal('pass_fail'),
);

export const essayStatusValidator = v.union(
  v.literal('draft'),
  v.literal('submitted'),
  v.literal('archived'),
);

export const gradeStatusValidator = v.union(
  v.literal('queued'),
  v.literal('processing'),
  v.literal('complete'),
  v.literal('failed'),
);

export const transactionTypeValidator = v.union(
  v.literal('signup_bonus'),
  v.literal('purchase'),
  v.literal('grading'),
  v.literal('refund'),
);

export const academicLevelValidator = v.union(
  v.literal('high_school'),
  v.literal('undergraduate'),
  v.literal('postgraduate'),
);

// =============================================================================
// Complex object validators
// =============================================================================

export const assignmentBriefValidator = v.object({
  title: v.string(),
  instructions: v.string(),
  subject: v.string(),
  academicLevel: academicLevelValidator,
});

export const rubricValidator = v.object({
  customCriteria: v.optional(v.string()),
  focusAreas: v.optional(v.array(v.string())),
});

export const percentageRangeValidator = v.object({
  lower: v.number(),
  upper: v.number(),
});

export const strengthValidator = v.object({
  title: v.string(),
  description: v.string(),
  evidence: v.optional(v.string()),
});

export const improvementValidator = v.object({
  title: v.string(),
  description: v.string(),
  suggestion: v.string(),
  detailedSuggestions: v.optional(v.array(v.string())),
});

export const languageTipValidator = v.object({
  category: v.string(),
  feedback: v.string(),
});

export const resourceValidator = v.object({
  title: v.string(),
  url: v.optional(v.string()),
  description: v.string(),
});

export const feedbackValidator = v.object({
  strengths: v.array(strengthValidator),
  improvements: v.array(improvementValidator),
  languageTips: v.array(languageTipValidator),
  resources: v.optional(v.array(resourceValidator)),
});

export const modelResultValidator = v.object({
  model: v.string(),
  percentage: v.number(),
  included: v.boolean(),
  reason: v.optional(v.string()),
});

// =============================================================================
// Schema Definition
// =============================================================================

export default defineSchema({
  // Users (synced from Clerk)
  users: defineTable({
    clerkId: v.string(), // Clerk user ID (e.g., 'user_2abc123def456')
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    institution: v.optional(v.string()), // User's institution (free text)
    course: v.optional(v.string()), // User's course (free text)
    defaultGradingScale: v.optional(gradingScaleValidator), // Preferred grading scale
  }).index('by_clerk_id', ['clerkId']),

  // Credits (user-scoped balance tracking)
  credits: defineTable({
    userId: v.id('users'),
    balance: v.string(), // Store as string for decimal precision (e.g., "1.00")
    reserved: v.string(), // Credits reserved for pending grading
  }).index('by_user_id', ['userId']),

  // Credit Transactions (audit log)
  creditTransactions: defineTable({
    userId: v.id('users'),
    amount: v.string(), // Can be negative for deductions
    transactionType: transactionTypeValidator,
    description: v.optional(v.string()),
    gradeId: v.optional(v.id('grades')),
    stripePaymentIntentId: v.optional(v.string()),
  }).index('by_user_id', ['userId']),

  // Essays (user-scoped, drafts and submitted)
  essays: defineTable({
    userId: v.id('users'),
    authorUserId: v.optional(v.id('users')), // For future org support

    // Essay data (optional for drafts)
    assignmentBrief: v.optional(assignmentBriefValidator),
    rubric: v.optional(rubricValidator),
    content: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    focusAreas: v.optional(v.array(v.string())),

    // Lifecycle
    status: essayStatusValidator,
    submittedAt: v.optional(v.number()), // Unix timestamp in ms
    deletedAt: v.optional(v.number()), // Soft delete timestamp
  })
    .index('by_user_id', ['userId'])
    .index('by_user_status', ['userId', 'status'])
    .index('by_user_submitted', ['userId', 'submittedAt']),

  // Grades (user-scoped, 1-to-many with essays for regrading support)
  grades: defineTable({
    userId: v.id('users'),
    essayId: v.id('essays'), // NOT unique (supports regrading)

    // Grading status
    status: gradeStatusValidator,

    // Results (populated when status = 'complete')
    letterGradeRange: v.optional(v.string()), // "A" or "A-B"
    percentageRange: v.optional(percentageRangeValidator),
    feedback: v.optional(feedbackValidator),
    modelResults: v.optional(v.array(modelResultValidator)),

    // Cost tracking
    totalTokens: v.optional(v.number()),
    apiCost: v.optional(v.string()), // Decimal as string

    // Error handling
    errorMessage: v.optional(v.string()),

    // Timing (Unix timestamps in ms)
    queuedAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index('by_user_id', ['userId'])
    .index('by_essay_id', ['essayId'])
    .index('by_status', ['status']),

  // Platform Settings (singleton for admin-configurable values)
  platformSettings: defineTable({
    key: v.literal('singleton'), // Only one row
    signupBonusAmount: v.string(), // Decimal as string (e.g., "1.00")
    updatedBy: v.optional(v.id('users')), // Admin who made the change
  }).index('by_key', ['key']),
});

// =============================================================================
// Inferred Types (for use in UI components - single source of truth)
// =============================================================================

export type GradingScale = Infer<typeof gradingScaleValidator>;
export type EssayStatus = Infer<typeof essayStatusValidator>;
export type GradeStatus = Infer<typeof gradeStatusValidator>;
export type TransactionType = Infer<typeof transactionTypeValidator>;
export type AcademicLevel = Infer<typeof academicLevelValidator>;

export type AssignmentBrief = Infer<typeof assignmentBriefValidator>;
export type Rubric = Infer<typeof rubricValidator>;
export type PercentageRange = Infer<typeof percentageRangeValidator>;
export type GradeFeedback = Infer<typeof feedbackValidator>;
export type ModelResult = Infer<typeof modelResultValidator>;
```

**That's it.** Simple, clean, user-scoped.

### Draft Uniqueness Constraint

Convex queries enforce the business rule that each user can only have one draft at a time. The `getDraft` query uses an index on `['userId', 'status']` and filters for `status = 'draft'`, returning the first result. When saving a draft, the mutation either updates the existing draft or creates a new one, effectively overwriting any previous draft.

---

## File Structure

```
convex/                              # Convex backend (serverless)
├── schema.ts                        # Document schema + exported validators (single source of truth)
├── auth.config.ts                   # Convex auth configuration (Clerk integration)
├── http.ts                          # HTTP endpoints (Clerk webhook, Stripe webhook)
├── lib/                             # Shared helpers
│   ├── auth.ts                      # requireAuth() helper
│   └── decimal.ts                   # Credit arithmetic (integer cents internally)
├── platformSettings.ts              # Admin-configurable settings (signup bonus)
├── users.ts                         # User sync from Clerk
├── credits.ts                       # Balance, reservations, transactions
├── essays.ts                        # Drafts, submission, history
├── grades.ts                        # Grade records and status
└── grading.ts                       # AI grading action (background processing)

src/
├── app/
│   ├── [locale]/                    # i18n routing (from boilerplate)
│   │   ├── (auth)/                  # Protected routes
│   │   │   ├── dashboard/
│   │   │   ├── submit/              # 3-tab essay submission
│   │   │   ├── grades/[id]/         # Status + results
│   │   │   ├── history/
│   │   │   └── settings/
│   │   └── (unauth)/                # Public routes (landing, pricing)
│   └── api/                         # Minimal API routes (most logic in Convex)
│       └── ai/                      # AI endpoints (title generation, OCR) - future
├── components/
│   ├── ui/                          # Shadcn components (from boilerplate)
│   └── ConvexClientProvider.tsx     # Convex + Clerk provider setup
├── features/                        # Feature modules (boilerplate pattern)
│   ├── essays/                      # Submission forms, draft autosave
│   ├── grading/                     # Results display, category scores
│   └── credits/                     # Balance display, purchase flow
├── hooks/
│   ├── useGradeStatus.ts            # Real-time grade status (Convex subscription)
│   ├── useCredits.ts                # Real-time credits (Convex subscription)
│   └── useAutosave.ts               # Draft autosave hook
├── libs/                            # Third-party configs (boilerplate pattern)
│   ├── Env.ts                       # Environment variables (t3-env)
│   ├── Auth.ts                      # Auth helpers (Clerk)
│   ├── Logger.ts                    # Pino logger
│   ├── Stripe.ts                    # Payment client (TODO)
│   └── Mistral.ts                   # Mistral Document AI client (TODO)
├── utils/                           # Utilities (from boilerplate)
│   └── Helpers.ts                   # cn() and other helpers
└── locales/                         # i18n JSON files (from boilerplate)
```

---

## Key Next.js 15 / React 19 Patterns

### Async Request APIs

```typescript
// ALWAYS await in Next.js 15
const cookieStore = await cookies();
const token = cookieStore.get('token');

const headersList = await headers();
const userAgent = headersList.get('user-agent');

const { id } = await params;
```

**Note:** Use `req.headers` directly in API routes for raw headers (e.g., webhooks). Use `await headers()` in Server Components when you need framework features.

### Form Actions (No more onSubmit)

```typescript
// Server Action
async function submitAction(formData: FormData) {
  'use server';
  const title = formData.get('title') as string;
  // ... validation and processing
}

// Component
<form action={submitAction}>
  <input name="title" />
  <SubmitButton />
</form>

// Submit button with pending state
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Submit</button>;
}
```

### Ref as Prop (No forwardRef)

```typescript
// React 19
function Input({ ref, ...props }: Props & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}
```

---

## Boilerplate Setup

### Why Free Version

We're using the FREE ixartz/SaaS-Boilerplate from GitHub ($0) instead of Pro ($399) because:

1. ✅ Saves $399 upfront cost
2. ✅ Pro's Stripe = subscriptions (we need one-time purchases)
3. ✅ Missing features take ~7-8 hours to add (trivial vs $399)
4. ✅ Full control over customizations

### What's Included (Free, upgraded)

- ✅ Next.js 15 + React 19 (upgraded from boilerplate)
- ✅ Tailwind CSS 4 (upgraded from boilerplate)
- ✅ Clerk authentication
- ✅ Convex (document database + serverless functions)
- ✅ Shadcn UI components
- ✅ Vitest + Playwright testing
- ✅ Sentry error monitoring
- ✅ i18n support (next-intl)
- ✅ Landing page template
- ✅ ESLint + Prettier + Husky

### What We're Adding

- ✅ Vercel AI SDK (configured, AI logic TODO)
- ⏳ Stripe integration (not started)
- ✅ Dark mode (via Tailwind 4)

### Installation Steps

```bash
# 1. Clone boilerplate
git clone --depth=1 https://github.com/ixartz/SaaS-Boilerplate.git markm8-v3
cd markm8-v3

# 2. Remove git history (start fresh)
rm -rf .git
git init
git add .
git commit -m "Initial commit from ixartz boilerplate"

# 3. Install dependencies with Bun (or npm/pnpm)
bun install

# 4. Upgrade to Next.js 15
bun remove next
bun add next@latest

# 5. Upgrade to React 19
bun remove react react-dom
bun add react@latest react-dom@latest
bun add -D @types/react@latest @types/react-dom@latest

# 6. Upgrade to Tailwind 4
bun remove tailwindcss @tailwindcss/postcss
bun add -D tailwindcss@next @tailwindcss/postcss@next

# 7. Remove old Tailwind config
rm tailwind.config.ts

# 8. Update package.json scripts for Bun (optional)
# Modify scripts to use "bun --bun run" for dev and start
```

### Tailwind 4 Configuration

```css
/* src/app/globals.css */
@import 'tailwindcss';

@theme {
  /* Custom colors */
  --color-primary: oklch(0.6 0.2 250);
  --color-secondary: oklch(0.7 0.15 200);
}

/* Dark mode (native CSS) */
@media (prefers-color-scheme: dark) {
  @theme {
    --color-primary: oklch(0.7 0.2 250);
    --color-secondary: oklch(0.8 0.15 200);
  }
}
```

```javascript
// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

---

## Authentication (Clerk)

### Setup

```bash
bun add @clerk/nextjs
```

### Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# DO NOT enable Organizations in Clerk Dashboard
```

### Webhook (User Lifecycle)

**Flow:**
1. Verify webhook signature using `svix`
2. On `user.created` event:
   - Create user record (sync Clerk data)
   - Fetch signup bonus from `platformSettings` table (singleton row)
   - Create credits record with signup bonus balance
   - Log transaction (if bonus > 0)
3. Use atomic transaction for all operations

### Middleware

Use `clerkMiddleware` with route matcher for public routes (`/`, `/pricing`, `/about`, sign-in/sign-up). Protect all other routes with `auth().protect()`.

### Auth Helpers

Use Convex auth identity inside Convex queries/mutations:

- In **queries/mutations**: use `requireAuth(ctx)` from `convex/lib/auth.ts` to resolve the current user’s Convex `Id<'users'>`.
- In **actions**: you can’t access `ctx.db` directly, so use `ctx.auth.getUserIdentity()` (or `getAuthIdentity()` helper) and then call `ctx.runQuery/ctx.runMutation` to fetch/mutate data.

### User Profile (Convex)

**Get profile:** `api.users.getProfile` (query)

**Update profile:** `api.users.updateProfile` (mutation)

Client usage example (matches `src/features/onboarding/OnboardingForm.tsx`):

```typescript
const updateProfile = useMutation(api.users.updateProfile);
await updateProfile({ defaultGradingScale, institution, course });
```

### Grade Format Conversion

**Purpose:** Convert stored grade data (percentage/letter) to user's preferred grading scale for display.

**Stored Data:**
- Grades table stores both `percentageRange` (e.g., `{ lower: 85, upper: 92 }`) and `letterGradeRange` (e.g., `"A-B"`)
- All conversions use percentage as the source of truth (most precise)

**Conversion Functions (to implement in `src/libs/GradeFormat.ts`):**

```typescript
// Convert percentage to user's preferred format
function formatGradeForUser(
  percentageRange: { lower: number; upper: number },
  userGradingScale: 'percentage' | 'letter' | 'uk' | 'gpa' | 'pass_fail'
): string {
  const average = (percentageRange.lower + percentageRange.upper) / 2;

  switch (userGradingScale) {
    case 'percentage':
      return `${percentageRange.lower}-${percentageRange.upper}%`;

    case 'letter':
      // Use stored letterGradeRange if available, otherwise convert from percentage
      // Conversion: A (90-100), B (80-89), C (70-79), D (60-69), F (<60)
      // With +/-: A+ (97-100), A (93-96), A- (90-92), etc.
      return convertPercentageToLetter(percentageRange);

    case 'uk':
      // First (70-100), Upper Second/2:1 (60-69), Lower Second/2:2 (50-59), Third (40-49), Fail (<40)
      return convertPercentageToUK(percentageRange);

    case 'gpa':
      // Convert to 0.0-4.0 scale: 4.0 (90-100), 3.0 (80-89), 2.0 (70-79), 1.0 (60-69), 0.0 (<60)
      // Linear interpolation for precise mapping
      return convertPercentageToGPA(percentageRange);

    case 'pass_fail':
      return average >= 50 ? 'Pass' : 'Fail';
  }
}
```

**Usage:**
- Always fetch user's `defaultGradingScale` when displaying grades
- Use conversion function to format grade for display
- Store original percentage/letter in database (never modify stored data)

### Platform Settings (Admin Configuration)

**Initialization:**
Convex reads platform settings from the `platformSettings` table. If the singleton document doesn’t exist yet, `internal.platformSettings.getSignupBonus` returns a safe default (currently `"1.00"`). Optionally add an internal “ensure singleton” mutation later if you want to manage settings purely via Convex Dashboard.

**Admin updates:**
- Deferred (v3.1+). For v3 launch, use Convex Dashboard for operational adjustments if needed.

---

## Payments (Stripe)

### Setup

```bash
bun add stripe @stripe/stripe-js
bun add -D @types/stripe
```

### Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Stripe Client

Initialize Stripe client with secret key, latest API version (`2024-12-18.acacia`), and TypeScript support enabled.

### Checkout Session

**Planned (not implemented yet):** Create a Stripe Checkout Session via a **Convex action** (recommended, since it calls an external API).

- Mode: `payment` (one-time, NOT subscription)
- Line items: Dynamic `price_data` (not pre-created products)
- Amount: Convert dollars to cents (`Math.round(amount * 100)`)
- Metadata: Include `clerkId` (or Convex `userId`) and `credits` for webhook processing
- Return: `sessionId` and `url` for client redirect

### Webhook Handler

**POST `/stripe-webhook` (Convex HTTP endpoint in `convex/http.ts`):**

1. Verify webhook signature using `stripe.webhooks.constructEvent`
2. On `checkout.session.completed`:
   - Extract purchase metadata
   - Resolve the target Convex user
   - **Idempotency (TODO):** before crediting, check whether a `creditTransactions` record already exists for `stripePaymentIntentId` and skip if present
   - Credit the user by calling `internal.credits.addFromPurchase({ userId, amount, stripePaymentIntentId })`
3. Use atomic Convex mutations for DB updates (actions use `ctx.runMutation`)

**Why Idempotency Check is Critical:**

Stripe **guarantees** webhook retries (network issues, timeouts). Without checking if `stripePaymentIntentId` already exists in `creditTransactions`, users get double-credited on retries, causing financial loss.

---

## AI Integration (Vercel AI SDK)

### Setup

```bash
bun add ai @ai-sdk/openai
```

### AI Client

**Setup:**
- Use `@ai-sdk/openai` with OpenRouter compatibility
- Base URL: `https://openrouter.ai/api/v1`
- Model configuration: **Admin-configurable via `platformSettings.aiConfig`** (see AI Model Configuration section below)
- Grading ensemble: **3–5 parallel runs**, with **per-run model selection** (supports mixed models)
  - Production: Full models only (no fast variants)
  - Testing: Fast variants allowed via testing config override
- Title generation: Lightweight models (Claude Haiku 4.5 or GPT Mini latest)

### AI Model Configuration

**Purpose:** Centralized, admin-configurable model selection for grading and title generation. Supports testing overrides and easy updates as new SOTA models are released.

**Storage:** `platformSettings.aiConfig` (singleton document in Convex)

**Configuration Structure:**

```typescript
type ReasoningEffort = 'low' | 'medium' | 'high';

type AiModelSpec = {
  model: string;                 // OpenRouter model ID (e.g., "x-ai/grok-4.1", "anthropic/claude-opus-4.5")
  reasoningEffort?: ReasoningEffort; // Provider-specific reasoning setting (converted at call time)
  enabled?: boolean;            // Allow disabling specific runs without removing from config
};

type TitleGenConfig = {
  primary: AiModelSpec;
  fallbacks: AiModelSpec[];     // Fallback models if primary fails
  temperature: number;            // Default: 0.7
  maxTokens: number;             // Default: 20
};

type GradingConfig = {
  mode: 'mock' | 'live';
  runs: AiModelSpec[];           // Length 3..5, supports mixed models
  outlierThresholdPercent: number; // Default: 10
  retries: {
    maxRetries: number;          // Default: 3
    backoffMs: number[];         // Default: [5000, 15000, 45000]
  };
  temperature?: number;          // Optional override for all runs
  maxTokens?: number;            // Optional override for all runs
};

type TestingConfig = {
  enabled: boolean;              // Master switch for testing mode
  grading?: Partial<GradingConfig>; // Overrides production grading config
  titleGeneration?: Partial<TitleGenConfig>; // Overrides production title config
  // Testing config allows fast variants (e.g., "x-ai/grok-4.1-fast")
  // Production config should never use fast variants
};

type AiConfig = {
  titleGeneration: TitleGenConfig;
  grading: GradingConfig;
  testing?: TestingConfig;       // Optional testing overrides
  adminEmails: string[];         // Email allowlist for admin access
  lastUpdatedBy?: string;        // Email of admin who last updated
  lastUpdatedAt?: number;        // Unix timestamp in ms
};
```

**Default Configuration:**

```typescript
const DEFAULT_AI_CONFIG: AiConfig = {
  titleGeneration: {
    primary: { model: 'anthropic/claude-haiku-4.5' },
    fallbacks: [
      { model: 'openai/gpt-mini' } // Update with latest GPT Mini identifier
    ],
    temperature: 0.7,
    maxTokens: 20,
  },
  grading: {
    mode: 'mock', // Switch to 'live' when OpenRouter integration is ready
    runs: [
      { model: 'x-ai/grok-4.1', reasoningEffort: 'medium' },
      { model: 'x-ai/grok-4.1', reasoningEffort: 'medium' },
      { model: 'google/gemini-3', reasoningEffort: 'medium' },
    ],
    outlierThresholdPercent: 10,
    retries: {
      maxRetries: 3,
      backoffMs: [5000, 15000, 45000],
    },
  },
  adminEmails: [], // Set via Convex Dashboard or admin UI
};
```

**Production vs Testing:**

- **Production grading:** Full models only (e.g., `x-ai/grok-4.1`, `anthropic/claude-opus-4.5`, `google/gemini-3`, `openai/gpt-5.2`)
- **Testing grading:** Fast variants allowed (e.g., `x-ai/grok-4.1-fast`) via `testing.grading` override
- **Testing mode:** Controlled by `testing.enabled` flag; when enabled, testing configs override production configs

**Model Selection Priority (for grading):**

1. **Environment override** (highest priority): `MARKM8_GRADING_MODE` and `MARKM8_GRADING_MODELS` env vars (for emergency/testing)
2. **Testing config** (if `testing.enabled === true`): `platformSettings.aiConfig.testing.grading`
3. **Production config**: `platformSettings.aiConfig.grading`
4. **Hardcoded defaults**: Fallback if config missing

**Admin Access:**

- **Email allowlist:** `platformSettings.aiConfig.adminEmails` (array of email addresses)
- **Admin mutations:** Check user email against allowlist before allowing config updates
- **For v3 launch:** Update config via Convex Dashboard (manual edit of singleton document)
- **Future (v3.1+):** Admin UI at `/admin/settings` with mutation gated by email allowlist

**Updating Models (Backend Function):**

**Planned:** `internalAction platformSettings.refreshAiModelCatalog`

- Fetches latest models from OpenRouter API (`GET https://openrouter.ai/api/v1/models`)
- Validates configured model IDs exist
- Suggests updates if newer SOTA models are available
- Does NOT auto-update (requires admin approval)
- Can be called manually or scheduled periodically

**Reasoning Effort Mapping:**

Provider-specific conversion from canonical `reasoningEffort` to API parameters:

- **OpenAI (GPT-5.2):** Maps to `reasoning_effort` parameter (if supported)
- **xAI (Grok-4.1):** Maps to reasoning toggle/effort settings (varies by model variant)
- **Google (Gemini-3):** Maps to thinking/reasoning parameters (varies by model version)
- **Anthropic (Claude):** Maps to reasoning settings (if available)

**Implementation Status:**

- ✅ Schema stubs added to `convex/schema.ts`
- ✅ Function stubs added to `convex/platformSettings.ts`
- ⏳ Full implementation deferred (config reading, provider adapters, admin UI)

### Title Generation API

**Purpose:** Generate concise essay titles (max 6 words) based on essay content and instructions.

**Model Choice:** Uses a fast, cheap model (Claude Haiku 4.5) instead of the grading models to minimize cost and latency.

**Planned (not implemented yet):** Title generation endpoint (either a Convex action or a small Next.js route under `src/app/[locale]/api/ai/*`).
- Input: `instructions` (assignment brief), `content` (first 500 words)
- Validation: Require at least one field
- Model config: `maxTokens: 20`, `temperature: 0.7`
- Output: Trim to max 6 words
- Cost: ~$0.001 per generation (no credit deduction, free for users)

### Usage in Convex Actions

**CRITICAL: Always use `generateObject` with Zod schema validation.**

Without schema validation, malformed JSON responses from AI models cause production debugging nightmares. Using `generateObject` with Zod ensures type-safety, automatic validation, clear error messages, and eliminates parsing errors.

**Note:** AI calls run in Convex actions (not mutations) because:
- Actions can call external APIs (OpenRouter)
- Actions have 10-minute timeout (sufficient for AI grading)
- Mutations cannot call external APIs directly

**Required Zod Schema Structure:**
```typescript
const GradeSchema = z.object({
  percentage: z.number().min(0).max(100),
  feedback: z.object({
    strengths: z.array(z.object({
      title: z.string(),
      description: z.string(),
      evidence: z.string().optional(),
    })),
    improvements: z.array(z.object({
      title: z.string(),
      description: z.string(),
      suggestion: z.string(),
      detailedSuggestions: z.array(z.string()).optional(),
    })),
    languageTips: z.array(z.object({
      category: z.string(),
      feedback: z.string(),
    })),
    resources: z.array(z.object({
      title: z.string(),
      url: z.string().optional(),
      description: z.string(),
    })).optional(),
  }),
  categoryScores: z.object({
    contentUnderstanding: z.number().min(0).max(100),
    structureOrganization: z.number().min(0).max(100),
    criticalAnalysis: z.number().min(0).max(100),
    languageStyle: z.number().min(0).max(100),
    citationsReferences: z.number().min(0).max(100).optional(),
  }),
});
```

Use: `await generateObject({ model: getGradingModel(), schema: GradeSchema, prompt })`

---

## Document Ingestion (File Upload & Parsing via Mistral Document AI)

### Supported Formats

- **PDF:** `.pdf` files (text-based and scanned)
- **DOCX:** `.docx` files (Microsoft Word)
- **Images:** PNG, JPEG/JPG, AVIF (for scanned documents/photos)
- **Plain text:** Direct paste (no parsing needed)

### File Size Limits

- **Maximum file size:** 10 MB per file
- **Maximum word count:** 50,000 words (enforced after parsing)
- **Minimum word count:** 50 words

### Unified Document Processing with Mistral Document AI

**Why Mistral for All Documents:**
- ✅ **Single service** for all document types (PDF, DOCX, images)
- ✅ **99%+ accuracy** with OCR (handles scanned PDFs and images)
- ✅ **Markdown output** preserves structure (headers, lists, tables)
- ✅ **Multilingual support** (11+ languages)
- ✅ **Handles complex layouts** (tables, forms, multi-column text)
- ✅ **Simpler architecture** (one API instead of multiple libraries)

**Implementation (`src/utils/documentParser.ts`):**

1. **`parseDocument(file)`:**
   - Validate file type (PDF, DOCX, PNG, JPEG, AVIF)
   - Convert to buffer: `Buffer.from(await file.arrayBuffer())`
   - Use `mistralClient` from `src/libs/Mistral.ts` to process document
   - Extract markdown from response (use SDK's typed response structure - consult `@mistralai/mistralai` TypeScript types or API docs for correct field name)
   - Throw if empty

2. **`countWords(text)`:**
   - Split on whitespace, filter empty strings, return count

3. **`parseAndValidateDocument(file)`:**
   - Call `parseDocument()`, then validate word count (50-50,000)
   - Throw descriptive errors for each validation failure

**Security Considerations:**
- Validate MIME type server-side (don't trust client `file.type`)
- Validate file size before processing (prevent DoS)
- Limit file size (10 MB) before sending to Mistral API
- Sanitize extracted markdown (remove potential XSS if displaying)
- Rate limit per user (prevent abuse)

**Storage:**
- Extracted markdown stored in `essays.content` (text field)
- Original file **NOT stored** (only parsed markdown kept)
- If user wants to re-upload, they must upload again

**Error Handling:**
- File too large → Show error: "File exceeds 10 MB limit. Please use a smaller document."
- Invalid format → Show error: "Unsupported file type. Please use PDF, DOCX, PNG, JPEG, or AVIF."
- Document processing failed → Show error: "Failed to process document. Please try again or paste text directly."
- No text extracted → Show error: "No text could be extracted from this document. Please ensure the document contains readable text."

---

## Document Upload for Instructions & Rubric (Mistral Document AI)

### Overview

Users can upload documents (PDF, DOCX, PNG, JPEG, AVIF) for **Instructions** and **Custom Rubric** fields. Mistral Document AI processes all document types uniformly, converting them to markdown while preserving structure and formatting.

**Note:** This uses the same Mistral Document AI service as essay document parsing (see Document Ingestion section above). The unified endpoint handles all document types (text-based PDFs, DOCX, scanned PDFs, images) seamlessly.

### Supported Document Formats

- **PDF:** Text-based and scanned PDFs
- **DOCX:** Microsoft Word documents
- **Images:** PNG, JPEG/JPG, AVIF (for photos/screenshots of documents)
- **Maximum file size:** 10 MB per document

### Why Mistral Document AI?

- ✅ **99%+ accuracy** across global languages
- ✅ **Markdown output** preserves structure (headers, lists, tables)
- ✅ **Multilingual support** (11+ languages)
- ✅ **Fast processing** (up to 2,000 pages/minute)
- ✅ **Handles complex layouts** (tables, forms, multi-column text)

### Setup

**Installation:**
```bash
bun add @mistralai/mistralai
```

**Environment Variables:**
```env
MISTRAL_API_KEY=your_mistral_api_key_here
```

### Mistral Client

```typescript
// src/libs/Mistral.ts
import MistralClient from '@mistralai/mistralai';

if (!process.env.MISTRAL_API_KEY) {
  throw new Error('MISTRAL_API_KEY is not set');
}

export const mistralClient = new MistralClient(process.env.MISTRAL_API_KEY);
```

### OCR API Endpoint

**POST /api/ocr/process** (shared for essay documents, instructions, and rubric images):

1. Require auth
2. Extract file from FormData
3. Validate file type (PDF, DOCX, PNG, JPEG, AVIF)
4. Validate file size (max 10 MB)
5. Call `parseDocument(file)` from `src/utils/documentParser.ts` (uses `mistralClient` internally)
6. Return `{ markdown }` or error

### Client-Side Usage

**Instructions/Rubric uploads:**
- POST file to `/api/ocr/process` via FormData
- On success: Populate field with returned `markdown`
- On error: Show "Failed to process document. Please try again or paste text directly."

**Essay content uploads:**
- Same pattern as above
- After receiving `markdown`, validate word count (50-50,000)
- Update essay content and word count state

### UI Integration

**Instructions Field (Tab 1):**
- Text area with "Paste text" or "Upload document" toggle
- Document upload button (PDF, DOCX, PNG, JPEG, AVIF)
- Loading state while processing
- Preview extracted markdown (editable)
- Character count (max 10,000)

**Custom Rubric Field (Tab 1):**
- Same pattern as Instructions
- Optional field (can be empty)
- Character count (max 10,000)

### Error Handling

| Error | User Message | Action |
|-------|-------------|---------|
| File too large | "File exceeds 10 MB limit. Please use a smaller document." | Allow retry |
| Unsupported format | "Unsupported file type. Please use PDF, DOCX, PNG, JPEG, or AVIF." | Allow retry |
| Document processing failed | "Failed to process document. Please try again or paste text directly." | Allow retry or paste text |
| No text extracted | "No text could be extracted from this document. Please ensure the document contains readable text." | Allow retry or paste text |
| API timeout | "Processing took too long. Please try again or paste text directly." | Allow retry or paste text |

### Cost Considerations

- **Mistral Document AI pricing:** Check current pricing (typically per page/document)
- **Cost per document:** Estimate ~$0.01-0.05 per document (verify with Mistral)
- **No credit deduction:** Document processing is free for users (cost absorbed by platform)
- **Rate limiting:** Consider rate limiting to prevent abuse (e.g., 10 documents/minute per user)
- **Usage:** Used for:
  - Essay content parsing (PDF/DOCX/images)
  - Instructions image uploads
  - Custom Rubric image uploads

### Security Considerations

- ✅ Validate file type server-side (MIME type check)
- ✅ Validate file size (10 MB limit)
- ✅ Authenticate requests (require auth)
- ✅ Sanitize extracted markdown (remove potential XSS)
- ✅ Rate limit per user (prevent abuse)

---

## Async Grading (Convex Actions + Scheduler + Real-time Subscriptions)

### Why Async?

**Synchronous grading = BAD UX:**
- ❌ User stuck waiting 30+ seconds
- ❌ No progress indication
- ❌ API timeout risk (Vercel has 10s timeout for serverless functions)
- ❌ Can't navigate away
- ❌ No retry on transient failures

**Async workflow:**
- ✅ Submit essay → Instant response (<500ms)
- ✅ Scheduled action → Convex `ctx.scheduler.runAfter(0, ...)` triggers grading immediately
- ✅ Background processing → Convex action handles grading (with retry logic)
- ✅ Status updates → Real-time subscriptions via `useQuery` (no polling needed!)
- ✅ User experience → Can navigate away, come back later, UI auto-updates
- ✅ Cost-effective → Serverless, pay-per-use, no infrastructure to manage

### Why Convex Actions Instead of API Routes?

**API route problems:**
- ❌ Vercel serverless timeout (10s for Hobby, 60s for Pro)
- ❌ No built-in retry mechanism
- ❌ Requires polling for status updates
- ❌ Complex state management

**Convex Actions benefits:**
- ✅ 10-minute timeout (plenty for AI grading)
- ✅ Built-in scheduler (`ctx.scheduler.runAfter()`)
- ✅ Real-time subscriptions (UI auto-updates)
- ✅ Serverless, no infrastructure management
- ✅ Type-safe function references

### Essay Submission (Convex Mutation)

**`convex/essays.ts` → `submit` mutation:**

1. Auth check (via `requireAuth(ctx)`)
2. Validate essay exists and belongs to user
3. Check sufficient credits (`balance >= 1.0`)
4. **Atomic mutation:**
   - Reserve credit: `balance - 1.00`, `reserved + 1.00` (via `reserveCreditForUser` helper)
   - Update essay: `status = 'submitted'`, set `submittedAt`
   - Create grade record: `status = 'queued'`
   - **Schedule grading action:**
     ```typescript
     await ctx.scheduler.runAfter(0, internal.grading.processGrade, {
       gradeId,
     });
     ```
5. Return `{ essayId, gradeId }` immediately (<500ms)

### Grading Action (Convex Internal Action)

**`convex/grading.ts` → `processGrade` action:**

**Key Constraint:** Actions cannot access `ctx.db` directly - must use `ctx.runQuery()` and `ctx.runMutation()` for database access.

1. Get grade + essay (via `ctx.runQuery(internal.grades.getInternal, ...)`)
2. Update status: `'processing'` (via `ctx.runMutation(internal.grades.startProcessing, ...)`)
3. Run N AI grading calls in parallel with retry logic (N = 3..5)
4. Apply outlier detection
5. Save results + clear reservation (via `ctx.runMutation(internal.grades.complete, ...)`)
6. On error: Mark failed, refund reservation

**Retry Logic with Error Classification (CRITICAL):**
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delays: number[] = [5000, 15000, 45000] // Exponential backoff
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (isPermanentError(error)) {
        throw error;
      } // Don't retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }
  }
  throw lastError;
}

function isPermanentError(error: Error): boolean {
  const permanentPatterns = [
    /invalid.*api.*key/i,
    /400/,
    /bad.*request/i,
    /malformed/i,
  ];
  return permanentPatterns.some(pattern => pattern.test(error.message));
}
```

**Outlier Detection (CRITICAL):**
```typescript
/**
 * Find score furthest from mean.
 * Replaces pairwise comparison which can incorrectly exclude median scores.
 */
function findOutlier(scores: number[]): number | null {
  if (scores.length < 3) {
    return null;
  }

  const mean = scores.reduce((a, b) => a + b) / scores.length;
  const deviations = scores.map(s => Math.abs(s - mean));
  const maxDeviation = Math.max(...deviations);
  const threshold = mean * 0.10; // 10% of mean

  if (maxDeviation > threshold) {
    const maxDeviationIndex = deviations.indexOf(maxDeviation);
    return scores[maxDeviationIndex];
  }
  return null;
}
```

**Usage:**
```typescript
const results = await retryWithBackoff(async () => {
  return await Promise.all([
    generateObject({ model: getGradingModel(), schema: GradeSchema, prompt }),
    generateObject({ model: getGradingModel(), schema: GradeSchema, prompt }),
    generateObject({ model: getGradingModel(), schema: GradeSchema, prompt }),
  ]);
});

const scores = results.map(r => r.object.percentage);
const outlier = findOutlier(scores);
const includedScores = outlier !== null ? scores.filter(s => s !== outlier) : scores;
```

### SLA, Retry Logic, and Error Handling

**Performance Targets (from FUNCTIONAL_REQUIREMENTS.md):**
- **95% of essays** graded within **60 seconds**
- **99% of essays** graded within **120 seconds**

**Timeout Configuration:**
- **Convex action timeout:** 10 minutes (600 seconds) - enforced by Convex platform
- After timeout: Grade marked as `failed`, credit refunded

**Retry Strategy:**
- **3 automatic retries** on transient failures
- **Exponential backoff:** 5s, 15s, 45s
- **Error Classification:**
  - **Transient errors (retry):** Network timeouts, 503 Service Unavailable, rate limits, temporary API failures
  - **Permanent errors (fail immediately):** Invalid API key, 400 Bad Request, essay too long, malformed prompt

**Credit Refund Semantics (Option A - "deduct at submission"):**
- **On submit:** Credits deducted immediately (`balance -= cost`, `reserved += cost`)
- **On success:** Reservation cleared (`reserved -= cost`, balance unchanged)
- **On failure:** Credit refunded (`balance += cost`, `reserved -= cost`)

### Real-time Status Updates (Convex Subscriptions)

**Implementation (`src/hooks/useGradeStatus.ts`):**

No polling needed! Convex subscriptions automatically update the UI when the grade status changes:

```typescript
export function useGradeStatus(gradeId: string) {
  const grade = useQuery(api.grades.getById, {
    id: gradeId as Id<'grades'>,
  });

  return {
    grade,
    isLoading: grade === undefined,
    isError: grade === null,
    // No refresh needed - Convex subscriptions auto-update
  };
}
```

**Benefits:**
- ✅ Instant updates when grading completes (no polling delay)
- ✅ No wasted API calls (only updates when data changes)
- ✅ Works offline → online seamlessly
- ✅ Type-safe with full TypeScript support

---

## Key Architectural Principles

### 1. User-Scoped Resources

All data belongs to a user (no organizations in current scope).

**Implementation:**
- ALL tables have `userId` foreign key
- Queries always filter by `userId`
- Authorization checks verify user ownership

### 2. Avoid Vendor Lock-In

Use Clerk for auth only, not Organizations.

**Why:**
- Can switch auth providers later (just swap `src/libs/Clerk.ts`)
- Custom organization logic when needed (deferred to v3.1+)
- No pricing tied to MAU growth

### 3. Background AI Grading

AI calls run async via Convex actions (slow, need retries, status updates via real-time subscriptions).

**When NOT to use Convex actions:**
- Stripe webhooks (synchronous HTTP handlers)
- User signups (synchronous mutations)
- Other fast operations

### 4. Own Your Data

All business logic in our database (not in third-party services).

**Examples:**
- Credit balances in our DB (not Stripe)
- Essay history in our DB (not external storage)
- Grade results in our DB (not AI provider)

### 5. Cost-Conscious

Stay on free tiers where possible.

**Free tier usage:**
- Clerk: 10k MAU
- Sentry: 5k events/month
- Convex: Free tier available (check current limits)
- Vercel: Free tier for Next.js hosting

---

## Cost Analysis

### Infrastructure Costs

| Service | Launch (10 users) | Month 2 (500 users) | Notes |
|---------|-------------------|---------------------|-------|
| **Clerk** | Free | Free (under 10k MAU) | Authentication |
| **Convex** | Free | ~$50/mo (estimated) | Database + serverless functions |
| **Vercel** | Free | Free (under usage limits) | Next.js hosting |
| **Sentry** | Free | Free (under 5k events) | Error tracking |
| **OpenRouter** | $90/mo | $4,500/mo | AI grading (default 3-run ensemble; configurable 3–5 runs and mixed models) |
| **Total** | **$90/mo** | **$4,550/mo** | |

**Cost Benefits:**
- Launch phase: **Free tier on Convex works** (serverless, pay-per-use)
- Convex only charges for actual usage (function invocations, storage)
- No infrastructure to manage (fully serverless)
- Real-time subscriptions included (no polling overhead)

### Revenue (@ $1.00/essay)

| Metric | Launch | Month 2 |
|--------|--------|---------|
| Essays/day | 10 | 500 |
| Revenue/month | $300 | $15,000 |
| Infrastructure | $90 | $4,550 |
| **Profit** | **$210** | **$10,450** |

**Margin:** ~68%

---

## Environment Variables

```env
# Clerk (auth only)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Convex (database + serverless functions)
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOY_KEY=prod:xxx  # For CI/CD deployment

# Stripe (payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenRouter (AI via Vercel AI SDK)
OPENROUTER_API_KEY=sk-or-...

# Grading ensemble config (Convex actions)
# - mock: generate fake grading results (useful for tests/dev)
# - live: reserved for future OpenRouter integration
MARKM8_GRADING_MODE=mock
# Optional explicit per-run model list (comma-separated). Length determines run count (clamped to 3..5).
# Example: x-ai/grok-4.1,x-ai/grok-4.1,google/gemini-3
MARKM8_GRADING_MODELS=x-ai/grok-4.1,x-ai/grok-4.1,x-ai/grok-4.1
# Optional run count (3..5) used when MARKM8_GRADING_MODELS is not provided
MARKM8_GRADING_RUNS=3

# Note: Production model configuration is stored in platformSettings.aiConfig (Convex singleton)
# Update via Convex Dashboard or future admin UI. Env vars are for emergency overrides only.

# Mistral (Document AI / OCR)
MISTRAL_API_KEY=your_mistral_api_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Launch Checklist

### Phase 1: Foundation

- [ ] Clone boilerplate
- [ ] Upgrade Next.js 14→15, React 18→19, Tailwind 3→4
- [ ] Remove example code
- [ ] Add dark mode
- [ ] Set up Clerk (Google OAuth, no Organizations) - **Auth only, no webhooks yet**
- [ ] Verify: `bun --bun run dev`

**Note:** Skip database, AI SDK, Stripe, and Mistral setup for now. These will be added in backend phases.

---

### Phase 2: UI Implementation with Mocked Backends

**Goal:** Build complete UI flows end-to-end with mocked API responses. Use dialogue boxes/alerts to indicate what backend would do.

**Mock Strategy:**
- Create mock API route handlers in `src/app/api/` that return static/mock data
- Use `alert()` or toast notifications to indicate backend actions
- Store mock data in memory (Map/object) for session persistence
- All UI interactions should work, but backend is simulated

#### 2.1: Landing Page & Auth Flow

- [ ] Landing page (`/`)
  - [ ] Hero section with value proposition
  - [ ] Features section
  - [ ] Pricing section (credit packages)
  - [ ] "Get Started" button → Clerk sign-in
- [ ] Clerk authentication (sign-in/sign-up)
  - [ ] Mock: On signup, show alert: "Backend would: Create user record, initialize credits with signup bonus"
  - [ ] Redirect to `/onboarding` on first signup (check localStorage flag)
  - [ ] Redirect to `/dashboard` on subsequent logins

#### 2.2: Onboarding Page

- [ ] Onboarding form (`/onboarding`)
  - [ ] Default Grading Scale dropdown (required)
  - [ ] Institution field (optional, max 200 chars)
  - [ ] Course field (optional, max 200 chars)
  - [ ] "Skip" button → saves default grading scale, redirects to `/dashboard`
  - [ ] "Continue" button → saves all fields, redirects to `/dashboard`
  - [ ] Mock: Store in localStorage, show alert: "Backend would: Update user profile in database"
  - [ ] Prevent re-showing after completion (localStorage flag)

#### 2.3: Dashboard

- [ ] Dashboard (`/dashboard`)
  - [ ] Credit balance widget (top-right) - mock: `1.00 credits` from localStorage
  - [ ] "Submit New Essay" button → `/submit`
  - [ ] "Buy Credits" button → `/settings#credits`
  - [ ] Recent essays list (last 5)
    - [ ] Mock data: Array of essay objects with title, date, status, grade
    - [ ] Click to navigate to `/grades/[id]`
  - [ ] Stats section (optional): Total essays, average grade, credits used

#### 2.4: Essay Submission (3-Tab UI)

- [ ] Tab 1: Assignment Brief (`/submit`)
  - [ ] Title field (required, max 200 chars)
  - [ ] "Auto-generate Title" button
    - [ ] Mock: Returns random title, show alert: "Backend would: Call AI API to generate title based on content"
  - [ ] Instructions field (required, max 10,000 chars)
  - [ ] Document upload for Instructions
    - [ ] File picker (PDF, DOCX, PNG, JPEG, AVIF)
    - [ ] Mock: Simulate processing delay, show alert: "Backend would: Send to Mistral Document AI, extract markdown"
    - [ ] Populate Instructions field with mock markdown
  - [ ] Subject dropdown (required)
  - [ ] Academic Level dropdown (required)
  - [ ] Focus Areas multi-select (optional)
  - [ ] "Next" button → Tab 2
- [ ] Tab 2: Rubric
  - [ ] Custom Rubric field (optional, max 10,000 chars)
  - [ ] Document upload for Custom Rubric
    - [ ] Same mock behavior as Instructions upload
  - [ ] "Back" button → Tab 1
  - [ ] "Next" button → Tab 3
- [ ] Tab 3: Essay Content
  - [ ] Essay content textarea or document upload
  - [ ] Document upload (PDF, DOCX, PNG, JPEG, AVIF)
    - [ ] Mock: Simulate processing, show alert: "Backend would: Parse document, extract text, validate word count"
    - [ ] Populate content field with mock text
  - [ ] Word count display (update on paste/type)
  - [ ] Word count validation (50-50,000 words)
  - [ ] Cost estimator (mock: `1.00 credit`)
  - [ ] "Back" button → Tab 2
  - [ ] "Submit" button
    - [ ] Validation (all required fields, word count)
    - [ ] Mock: Show alert: "Backend would (Convex): Submit essay, reserve credit, create grade (queued), schedule grading action"
    - [ ] Redirect to `/grades/[mock-grade-id]`
- [ ] Draft autosave
  - [ ] Mock: Save to localStorage on document upload, typing (1-2s debounce), tab blur
  - [ ] Show toast: "Draft saved" (mock: "Backend would: Update essay draft in database")
  - [ ] Restore draft on page load

#### 2.5: Grade Status & Results

- [ ] Grade status page (`/grades/[id]`)
  - [ ] Mock grade data with different statuses for testing
  - [ ] Status: `queued`
    - [ ] Show "Queued" badge
    - [ ] Mock: Show alert: "Backend would: Subscribe to grade via Convex (`useQuery`) and UI auto-updates"
  - [ ] Status: `processing`
    - [ ] Show "Processing" badge with progress indicator
    - [ ] Mock: Simulate status updates, show alert: "Backend would: Push real-time updates via Convex subscriptions"
  - [ ] Status: `complete`
    - [ ] Display full results:
      - [ ] Grade range (percentage and letter) - convert to user's preferred scale
      - [ ] Category scores (5 categories with progress bars)
      - [ ] Strengths section (list with evidence)
      - [ ] Improvements section (list with suggestions)
      - [ ] Language tips section
      - [ ] Resources section (optional)
      - [ ] "Regrade" button (mock: shows alert about creating new grade)
  - [ ] Status: `failed`
    - [ ] Error message display
    - [ ] "Retry" button (mock: shows alert about resubmitting)
  - [ ] Breadcrumb navigation

#### 2.6: Essay History

- [ ] History page (`/history`)
  - [ ] Table of essays (mock data)
    - [ ] Columns: Date Submitted, Title, Grade, Status, Actions
    - [ ] Pagination (20 per page)
    - [ ] Search by title (client-side filter on mock data)
    - [ ] Sort by date, grade
  - [ ] Row click → navigate to `/grades/[id]`
  - [ ] Delete action
    - [ ] Confirmation modal
    - [ ] Mock: Remove from mock data, show alert: "Backend would: Soft delete essay (set deletedAt timestamp)"

#### 2.7: Settings

- [ ] Settings page (`/settings`)
  - [ ] Tab: Profile
    - [ ] Email (read-only, from Clerk)
    - [ ] Name (editable)
    - [ ] Default Grading Scale dropdown
    - [ ] Institution field
    - [ ] Course field
    - [ ] Save button → mock: Show alert: "Backend would: Update user profile in database"
  - [ ] Tab: Credits
    - [ ] Current balance display (mock: from localStorage)
    - [ ] Purchase options (1, 5, 10, 20, 50 credits)
    - [ ] Custom amount input
    - [ ] "Buy Credits" button
      - [ ] Mock: Show alert: "Backend would: Create Stripe checkout session, redirect to Stripe"
      - [ ] Simulate purchase: Update localStorage balance, show success message
    - [ ] Transaction history table (mock data)
      - [ ] Columns: Date, Type, Amount, Balance After
  - [ ] Tab: Billing
    - [ ] Past payments list (mock data)
    - [ ] Download receipt buttons (mock: show alert)

#### 2.8: UI Polish

- [ ] Loading states (skeleton screens for all async operations)
- [ ] Error states (network errors, validation errors)
- [ ] Toast notifications for all user actions
- [ ] Mobile responsive design
- [ ] Dark mode polish
- [ ] Form validation feedback
- [ ] Accessibility (keyboard navigation, ARIA labels)

**Testing Phase 2:**
- [ ] Complete user flow: Sign up → Onboarding → Submit essay → View results → History → Settings
- [ ] All UI interactions work smoothly
- [ ] Mock alerts clearly indicate backend actions
- [ ] No console errors
- [ ] Responsive on mobile devices

---

### Phase 3: Authentication & User Management

**Goal:** Replace Clerk auth mocks with real Clerk integration and user database operations.

- [ ] Set up Convex project + env vars (`NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOY_KEY`)
- [ ] Configure Clerk → Convex JWT template (audience/application ID = `convex`)
- [ ] Configure Clerk user lifecycle webhook to Convex endpoint: `POST /clerk-webhook` (`convex/http.ts`)
  - [ ] Verify webhook signature (Svix)
  - [ ] On `user.created`: create user, initialize credits, log signup bonus transaction
  - [ ] On `user.updated`: update user
  - [ ] On `user.deleted`: cascade delete user-owned docs
- [ ] User profile via Convex
  - [ ] `api.users.getProfile` (query)
  - [ ] `api.users.updateProfile` (mutation)
- [ ] Replace onboarding/settings mocks with Convex calls
- [ ] Test: Sign up new user, verify Convex documents, update profile

---

### Phase 4: Essay Submission & Draft Management

**Goal:** Implement essay CRUD, draft autosave, and document parsing.

- [ ] Essay operations via Convex
  - [ ] Draft save/load (Convex mutation/query)
  - [ ] Submit (Convex mutation) → reserves credit + creates grade + schedules grading action
  - [ ] History list + search/pagination (Convex query)
  - [ ] Soft delete (Convex mutation)
- [ ] Draft autosave
  - [ ] Debounced save on typing (1-2s)
  - [ ] Save on tab blur
  - [ ] Save on document upload completion
  - [ ] Restore draft on page load
- [ ] Document parsing (Mistral Document AI)
  - [ ] Add Mistral SDK: `bun add @mistralai/mistralai`
  - [ ] Set up Mistral API key
  - [ ] OCR endpoint (planned: either Convex action or Next.js route under `src/app/[locale]/api/ai/*`)
    - [ ] Validate file type and size
    - [ ] Process via Mistral Document AI
    - [ ] Return markdown
  - [ ] Replace document upload mocks with real API calls
- [ ] Title generation endpoint (planned: either Convex action or Next.js route under `src/app/[locale]/api/ai/*`)
  - [ ] Add Vercel AI SDK: `bun add ai @ai-sdk/openai`
  - [ ] Set up OpenRouter API key
  - [ ] Use Claude Haiku 4.5 (`anthropic/claude-haiku-4.5`) for fast/cheap title generation
  - [ ] Replace title generation mock with real API call
- [ ] Replace essay submission UI mocks with real API calls
- [ ] Test: Submit essay, verify database records, test draft autosave, test document uploads

---

### Phase 5: Grading System

**Goal:** Implement Convex action grading, AI logic, and real-time grade status via subscriptions.

- [ ] Convex grading action setup
  - [ ] `convex/grading.ts` internal action (`processGrade`)
  - [ ] Ensure `convex/essays.ts` submit schedules the action via `ctx.scheduler.runAfter(...)`
- [ ] AI grading implementation
  - [ ] Configure OpenRouter client (configurable grading ensemble: 3–5 runs, supports mixed models)
  - [ ] Implement `generateObject` with Zod schema validation
  - [ ] Multi-model consensus (N parallel calls, N=3..5)
  - [ ] Outlier detection algorithm
  - [ ] Retry logic with exponential backoff
  - [ ] Error classification (transient vs permanent)
- [ ] Grade status via Convex subscriptions
  - [ ] `api.grades.getById` query
  - [ ] Client `useGradeStatus` hook uses `useQuery` (no polling)
- [ ] Replace grade results UI with real data
- [ ] Test: Submit essay, verify action processes grade, verify subscriptions update UI, verify results display

---

### Phase 6: Credits & Billing

**Goal:** Implement credit system and Stripe integration.

- [ ] Stripe setup
  - [ ] Add Stripe SDK: `bun add stripe @stripe/stripe-js`
  - [ ] Set up Stripe API keys
  - [ ] Initialize Stripe client
- [ ] Credits via Convex
  - [ ] `api.credits.getBalance` (query)
  - [ ] (TODO) Add a `creditTransactions` list query for history UI
- [ ] Stripe checkout
  - [ ] Create checkout session (planned: Convex action)
  - [ ] Replace credit purchase mocks with real Stripe redirect
- [ ] Stripe webhook (Convex HTTP endpoint: `POST /stripe-webhook`)
  - [ ] Verify webhook signature
  - [ ] On `checkout.session.completed`: (TODO) idempotency check, update credits, log transaction
  - [ ] Call `internal.credits.addFromPurchase`
- [ ] Replace credit balance mocks with real API calls
- [ ] Replace transaction history mocks with real data
- [ ] Test: Purchase credits, verify webhook, verify balance update, verify transaction log

---

### Phase 7: Testing & Polish

**Goal:** End-to-end testing, error handling, and final polish.

- [ ] E2E tests
  - [ ] User signup flow
  - [ ] Essay submission flow
  - [ ] Grading flow (with mocked AI responses for speed)
  - [ ] Credit purchase flow
- [ ] Error handling
  - [ ] API timeout handling
  - [ ] Network error recovery
  - [ ] Validation error display
  - [ ] Graceful degradation
- [ ] Performance optimization
  - [ ] Image optimization
  - [ ] Code splitting
  - [ ] Lazy loading
- [ ] Accessibility audit
- [ ] Browser compatibility testing
- [ ] Mobile device testing

---

### Phase 8: Launch

**Goal:** Deploy to production and launch.

- [ ] Production Convex + Vercel setup
  - [ ] Configure Vercel environment variables (including `NEXT_PUBLIC_CONVEX_URL`)
  - [ ] Configure Convex deployment key (`CONVEX_DEPLOY_KEY`) for production deploys
  - [ ] Configure Clerk webhook URLs to point at production Convex `/clerk-webhook`
  - [ ] Configure Stripe webhook URL to point at production Convex `/stripe-webhook` (once implemented)
- [ ] Stripe production setup
  - [ ] Switch to production API keys
  - [ ] Configure production webhooks
- [ ] Monitoring
  - [ ] Set up Sentry (production)
  - [ ] Set up logging
- [ ] Content
  - [ ] Landing page copy review
  - [ ] Privacy policy
  - [ ] Terms of service
- [ ] Final checks
  - [ ] Test complete user flow in production
  - [ ] Verify credit purchases work
  - [ ] Verify grading completes successfully
  - [ ] Monitor error rates
- [ ] Launch! 🚀

---

This technical design provides implementation details for developers. Functional requirements (what the system does) are in FUNCTIONAL_REQUIREMENTS.md.
