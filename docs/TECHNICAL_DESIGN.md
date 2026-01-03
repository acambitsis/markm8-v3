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
| **Document Parsing** | mammoth.js + Gemini Flash | DOCX→HTML via mammoth, PDF→markdown via Gemini 3 Flash (OpenRouter) |
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

**Authoritative source:** `convex/schema.ts`

The schema defines all document types, validators, and exported TypeScript types. Key tables:

| Table | Purpose |
|-------|---------|
| `users` | Synced from Clerk webhook, indexed by `clerkId` |
| `credits` | Balance + reserved per user |
| `creditTransactions` | Audit log (signup_bonus, purchase, grading, refund) |
| `essays` | User essays with status (draft/submitted/archived) |
| `grades` | Grading results, 1-to-many with essays for regrading |
| `platformSettings` | Singleton config (signup bonus, AI config) |
| `gradeFailures` | Internal error tracking for debugging |

All validators and inferred types are exported from `convex/schema.ts` for use across the codebase.

### Draft Uniqueness Constraint

Convex queries enforce the business rule that each user can only have one draft at a time. The `getDraft` query uses an index on `['userId', 'status']` and filters for `status = 'draft'`, returning the first result. When saving a draft, the mutation either updates the existing draft or creates a new one, effectively overwriting any previous draft.

---

## File Structure

*Key architectural files shown; not exhaustive.*

```
convex/                              # Convex backend (serverless)
├── schema.ts                        # Document schema + exported validators (single source of truth)
├── auth.config.ts                   # Convex auth configuration (Clerk integration)
├── http.ts                          # HTTP endpoints (Clerk webhook, Stripe webhook)
├── lib/                             # Shared helpers (auth, decimal, ai, gradingPrompt, gradingSchema)
├── platformSettings.ts              # Admin-configurable settings (signup bonus)
├── users.ts                         # User sync from Clerk
├── credits.ts                       # Balance, reservations, transactions
├── essays.ts                        # Drafts, submission, history
├── grades.ts                        # Grade records and status
├── grading.ts                       # AI grading action (background processing)
└── gradeFailures.ts                 # Internal error tracking

src/
├── app/[locale]/
│   ├── (auth)/                      # Protected routes (dashboard, submit, grades, history, settings)
│   └── (unauth)/                    # Public routes (landing, pricing)
├── components/                      # Shared UI components
├── features/                        # Feature modules (essays, grading, billing, dashboard, onboarding)
├── hooks/                           # Custom hooks (useCredits, useGradeStatus, useAutosave)
├── libs/                            # Third-party configs (Env, Logger, Stripe)
└── utils/                           # Utilities (Helpers.ts with cn())
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

### What We Added

- ✅ Vercel AI SDK + OpenRouter integration
- ✅ Stripe integration (one-time credit purchases)
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

Stripe Checkout Session is created via a **Next.js API route** (`src/app/api/stripe/checkout/route.ts`).

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
   - Idempotency check: verify no `creditTransactions` record exists for `stripePaymentIntentId`
   - Credit the user by calling `internal.credits.addFromPurchase({ userId, amount, stripePaymentIntentId })`
3. Use atomic Convex mutations for DB updates

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

### Title Generation API

**Purpose:** Generate concise essay titles (max 6 words) based on essay content and instructions.

**Model Choice:** Uses a fast, cheap model (Claude Haiku 4.5) instead of the grading models to minimize cost and latency.

**Note:** Title generation is optional - the user can enter a title manually or use the auto-generate feature.

- Input: `instructions` (assignment brief), `content` (first 500 words)
- Validation: Require at least one field
- Model config: `maxTokens: 20`, `temperature: 0.7`
- Output: Trim to max 6 words
- Cost: Negligible (no credit deduction, free for users)

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

## Document Ingestion (File Upload & Parsing)

### Supported Formats

- **PDF:** `.pdf` files (text-based and scanned) - parsed via Gemini Flash
- **DOCX:** `.docx` files (Microsoft Word) - parsed via mammoth.js
- **TXT:** `.txt` files - passed through directly (no parsing needed)
- **Plain text:** Direct paste (no parsing needed)

### File Size Limits

- **Maximum file size:** 10 MB per file
- **Maximum word count:** 50,000 words (enforced after parsing)
- **Minimum word count:** 50 words

### Document Processing Strategy

**Two-Path Approach:**

| Format | Flow | Cost |
|--------|------|------|
| **TXT** | Pass through directly | Free |
| **DOCX** | mammoth.js → HTML → Gemini Flash → Markdown | Free (local) + very low (API) |
| **PDF** | Gemini Flash (native vision) → Markdown | Very low |

**DOCX Flow Explained:**
1. **mammoth.js** extracts DOCX content as HTML (runs locally, preserves tables as `<table>` elements)
2. **Gemini Flash** converts the HTML to clean markdown (LLM handles semantic conversion, preserves table structure as markdown tables)

**PDF Flow Explained:**
1. **Gemini Flash** processes PDF directly using native vision (no intermediate format)
2. Model extracts text and structure, outputs clean markdown

**Why This Approach:**
- **DOCX:** mammoth.js reliably extracts structure as HTML; Gemini handles the HTML→markdown conversion intelligently (understands semantic meaning, not just regex replacement)
- **PDF:** Gemini 3 Flash has native PDF vision with 1M token context window - processes the visual layout directly
- **Cost-effective:** DOCX local processing is free; PDF API cost is bottom-tier for this type of conversion
- **No subscriptions:** Pay-per-use via existing OpenRouter account (same as grading)

**Security Considerations:**
- Validate MIME type server-side (don't trust client `file.type`)
- Validate file size before processing (prevent DoS)
- Limit file size (10 MB) before sending to API
- Sanitize extracted markdown (remove potential XSS if displaying)
- Rate limit per user (prevent abuse)

**Storage:**
- Extracted markdown stored in `essays.content` (text field)
- Original file **NOT stored** (only parsed markdown kept)
- If user wants to re-upload, they must upload again

**Error Handling:**
- File too large → Show error: "File exceeds 10 MB limit. Please use a smaller document."
- Invalid format → Show error: "Unsupported file type. Please use PDF, DOCX, or TXT."
- Document processing failed → Show error: "Failed to process document. Please try again or paste text directly."
- No text extracted → Show error: "No text could be extracted from this document. Please ensure the document contains readable text."

**Future Enhancement (if needed):**
- If mammoth + Gemini quality is insufficient for complex rubrics, consider CloudConvert free tier (10 conversions/day) for DOCX→PDF conversion before Gemini processing

---

## Document Upload for Instructions & Rubric

### Overview

Users can upload documents (PDF, DOCX, TXT) for **Instructions** and **Custom Rubric** fields. The same document parsing pipeline (mammoth.js for DOCX, Gemini Flash for PDF) handles all uploads, converting them to markdown while preserving structure and formatting.

### Supported Document Formats

- **PDF:** Text-based and scanned PDFs (parsed via Gemini Flash)
- **DOCX:** Microsoft Word documents (parsed via mammoth.js)
- **TXT:** Plain text files (passed through directly)
- **Maximum file size:** 10 MB per document

### Setup

**Installation:**
```bash
bun add mammoth
```

**Environment Variables:**
```env
# Uses existing OPENROUTER_API_KEY for Gemini Flash PDF parsing
OPENROUTER_API_KEY=sk-or-...
```

### Document Processing Endpoint

**Convex Action `internal.documents.parse`** (shared for essay documents, instructions, and rubric):

1. Validate file type (PDF, DOCX)
2. Validate file size (max 10 MB)
3. Route to appropriate parser:
   - DOCX → mammoth.js → HTML → Gemini (markdown conversion)
   - PDF → Gemini Flash (native vision)
4. Return `{ markdown }` or error

### Client-Side Usage

**Instructions/Rubric uploads:**
- Call Convex mutation with file data
- On success: Populate field with returned `markdown`
- On error: Show "Failed to process document. Please try again or paste text directly."

**Essay content uploads:**
- Same pattern as above
- After receiving `markdown`, validate word count (50-50,000)
- Update essay content and word count state

### UI Integration

**Instructions Field (Tab 1):**
- Text area with "Paste text" or "Upload document" toggle
- Document upload button (PDF, DOCX, TXT)
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
| Unsupported format | "Unsupported file type. Please use PDF, DOCX, or TXT." | Allow retry |
| Document processing failed | "Failed to process document. Please try again or paste text directly." | Allow retry or paste text |
| No text extracted | "No text could be extracted from this document. Please ensure the document contains readable text." | Allow retry or paste text |
| API timeout | "Processing took too long. Please try again or paste text directly." | Allow retry or paste text |

### Cost Considerations

- **DOCX parsing:** Free (mammoth.js runs locally)
- **PDF parsing:** Very low cost (Gemini Flash via OpenRouter, bottom tier for this type of conversion)
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

**Authoritative source:** `SETUP.md`

See SETUP.md for complete environment variable configuration including:
- Clerk authentication keys
- Convex deployment URLs and keys
- Stripe payment keys
- OpenRouter API key for AI grading
- Grading mode configuration (`MARKM8_GRADING_MODE`, `MARKM8_GRADING_MODELS`)

Environment variables are set in:
- `.env.local` for local development
- Convex Dashboard for backend functions
- Vercel Dashboard for production deployment

---

## Implementation Status

### Phase Status

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Foundation (boilerplate, upgrades, Clerk auth) | ✅ Complete |
| **Phase 2** | UI Implementation (all pages and components) | ✅ Complete |
| **Phase 3** | Authentication & User Management (Clerk + Convex) | ✅ Complete |
| **Phase 4** | Essay Submission & Draft Management | ✅ Complete (document parsing pending) |
| **Phase 5** | Grading System (AI ensemble, real-time status) | ✅ Complete |
| **Phase 6** | Credits & Billing (Stripe integration) | ✅ Complete |
| **Phase 7** | Testing & Polish | 🔄 In Progress |
| **Phase 8** | Launch | ⏳ Pending |

### Section Status

| Section | Status | Notes |
|---------|--------|-------|
| Database Schema | ✅ Complete | Authoritative source: `convex/schema.ts` |
| Authentication (Clerk) | ✅ Complete | Webhook, JWT template, user sync |
| Payments (Stripe) | ✅ Complete | Checkout, webhook, idempotency |
| AI Integration | ✅ Complete | Multi-model ensemble, outlier detection |
| Document Ingestion | ⏳ Not implemented | Users paste text directly |
| Document Upload (Instructions/Rubric) | ⏳ Not implemented | Part of document parsing feature |
| Title Generation API | ⏳ Not implemented | Users enter titles manually |
| Async Grading | ✅ Complete | Convex actions, real-time subscriptions |

### Remaining Work

**Document Parsing:**
- Backend action for PDF/DOCX parsing not yet implemented
- UI shows "coming soon" placeholder
- Users currently paste text directly

**Testing & Polish:**
- E2E test coverage
- Error handling edge cases
- Performance optimization
- Accessibility audit

**Launch:**
- Production environment configuration
- Content review (landing page, legal pages)
- Final verification

---

This technical design provides implementation details for developers. Functional requirements (what the system does) are in FUNCTIONAL_REQUIREMENTS.md.
