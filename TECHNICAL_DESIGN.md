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
| **Database** | Neon PostgreSQL + Drizzle | Serverless, branching (dev/prod/test), cost-effective, type-safe ORM |
| **Deployment** | Railway | Long-running processes, auto-scaling, GitHub integration, supports background workers |
| **Async Jobs** | PostgreSQL LISTEN/NOTIFY + Railway Worker | Event-driven job processing with backup polling, no HTTP overhead, cost-effective |
| **Real-time** | Server-Sent Events (SSE) | Native browser support, simpler than WebSockets, perfect for one-way updates |
| **AI SDK** | Vercel AI SDK | Type-safe AI calls, streaming support, provider-agnostic, built-in error handling |
| **AI Provider** | OpenRouter (Grok-4 × 3) | Multi-model consensus, cost-effective (~$0.10-0.15/essay) |
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
- ✅ Custom organization tables when needed (see PHASE_2_MIGRATION.md)
- ✅ Full control over data model and billing

### Why Bun Instead of pnpm/npm?

- ✅ **2-10x faster** package installs vs pnpm/npm
- ✅ **All dependencies compatible** (Clerk, Drizzle, Stripe)
- ⚠️ **Use Node.js-compatible APIs** (avoid Bun-specific imports for portability)

---

## Database Schema

### Design Decision: Single `essays` Table

We use ONE `essays` table for both drafts and submitted essays (with a `status` field) instead of separate tables because:

1. **Regrading support:** Essays need the rubric for regrading. Splitting into two tables would either lose data or create redundancy.
2. **Simpler schema:** One source of truth for essay data.
3. **Performance is fine:** Autosave writes (triggered by document uploads, typing, pasting, editing, and tab blur) are trivial for PostgreSQL. Partial index `WHERE status = 'draft'` keeps queries fast.
4. **Clear lifecycle:** Draft → Submitted is just a status change + validation, not data migration.
5. **Natural queries:** `WHERE userId = X AND status = 'submitted'` is simpler than JOINs.

The `grades` table supports **1-to-many** with essays (no unique constraint on `essayId`) to allow multiple grades per essay for regrading.

### Schema Definition

```typescript
// src/models/Schema.ts
import { pgTable, uuid, text, timestamp, integer, jsonb, numeric, pgEnum, index, sql } from 'drizzle-orm/pg-core';

// Enums
export const essayStatusEnum = pgEnum('essay_status', ['draft', 'submitted', 'archived']);
export const gradeStatusEnum = pgEnum('grade_status', ['queued', 'processing', 'complete', 'failed']);
export const transactionTypeEnum = pgEnum('transaction_type', ['signup_bonus', 'purchase', 'grading', 'refund']);
export const gradingScaleEnum = pgEnum('grading_scale', ['percentage', 'letter', 'uk', 'gpa', 'pass_fail']);

// Users (synced from Clerk)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Matches Clerk user ID (e.g., 'user_2abc123def456')
  clerkId: text('clerk_id').notNull().unique(), // Redundant with id, kept for explicit clarity
  email: text('email').notNull(),
  name: text('name'),
  imageUrl: text('image_url'),
  institution: text('institution'), // Optional: user's institution (free text)
  course: text('course'), // Optional: user's course (free text)
  defaultGradingScale: gradingScaleEnum('default_grading_scale'), // User's preferred grading scale (percentage, letter, uk, gpa, pass_fail)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Platform Settings (singleton table for admin-configurable values)
export const platformSettings = pgTable('platform_settings', {
  id: text('id').primaryKey().default('singleton'), // Only one row
  signupBonusAmount: numeric('signup_bonus_amount', { precision: 10, scale: 2 }).default('1.00').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: text('updated_by'), // Admin user ID who made the change
});

// Credits (user-scoped)
export const credits = pgTable('credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  balance: numeric('balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  reserved: numeric('reserved', { precision: 10, scale: 2 }).default('0.00').notNull(), // Credits reserved for pending grading
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Credit Transactions (audit log)
export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  transactionType: transactionTypeEnum('transaction_type').notNull(),
  description: text('description'),
  gradeId: uuid('grade_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_credit_transactions_user_id').on(table.userId),
  createdAtIdx: index('idx_credit_transactions_created_at').on(table.createdAt.desc()),
}));

// Essays (user-scoped, supports drafts and submitted essays)
export const essays = pgTable('essays', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Essay data (nullable for drafts)
  assignmentBrief: jsonb('assignment_brief').$type<AssignmentBrief>(), // { title, instructions, subject, academicLevel }
  rubric: jsonb('rubric').$type<Rubric>(),
  content: text('content'),
  wordCount: integer('word_count'),
  focusAreas: text('focus_areas').array(),

  // Lifecycle
  status: essayStatusEnum('status').notNull().default('draft'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  submittedAt: timestamp('submitted_at'),
  deletedAt: timestamp('deleted_at'), // Soft delete
}, (table) => ({
  userIdIdx: index('idx_essays_user_id').on(table.userId),
  statusIdx: index('idx_essays_status').on(table.status),
  submittedAtIdx: index('idx_essays_submitted_at').on(table.submittedAt.desc()),
  // Partial index for fast draft lookup
  draftIdx: index('idx_essays_user_draft').on(table.userId, table.updatedAt).where(sql`status = 'draft'`),
  // Unique partial index: one draft per user (enforces "overwrites previous draft" requirement)
  // Note: Drizzle doesn't support unique() on partial indexes directly. Use raw SQL migration:
  // CREATE UNIQUE INDEX idx_essays_user_draft_unique ON essays(user_id) WHERE status = 'draft';
}));

// Grades (user-scoped, 1-to-many with essays for regrading support)
export const grades = pgTable('grades', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  essayId: uuid('essay_id').references(() => essays.id, { onDelete: 'cascade' }).notNull(), // NOT unique

  // Grading status
  status: gradeStatusEnum('status').notNull().default('queued'),

  // Results (populated when status = 'complete')
  letterGradeRange: text('letter_grade_range'), // "A" or "A-B"
  percentageRange: jsonb('percentage_range'), // { lower: 85, upper: 92 }
  feedback: jsonb('feedback'), // Full feedback structure
  modelResults: jsonb('model_results'), // [{ model, percentage, included, reason }]

  // Cost tracking
  totalTokens: integer('total_tokens').default(0),
  apiCost: numeric('api_cost', { precision: 10, scale: 4 }),

  // Error handling
  errorMessage: text('error_message'),

  // Timing
  queuedAt: timestamp('queued_at').notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_grades_user_id').on(table.userId),
  statusIdx: index('idx_grades_status').on(table.status),
  essayIdIdx: index('idx_grades_essay_id').on(table.essayId),
  essayCreatedIdx: index('idx_grades_essay_created').on(table.essayId, table.createdAt.desc()),
}));

// Type definitions for JSONB fields
export type AssignmentBrief = {
  title: string;
  instructions: string;
  subject: string;
  academicLevel: 'high_school' | 'undergraduate' | 'postgraduate';
};

export type Rubric = {
  customCriteria?: string;
  focusAreas?: string[];
};
```

**That's it.** Simple, clean, user-scoped.

### Migration Note: Draft Uniqueness Constraint

The unique partial index for "one draft per user" requires a raw SQL migration since Drizzle doesn't support `unique()` on partial indexes directly:

```sql
-- Run this migration after initial schema push
CREATE UNIQUE INDEX idx_essays_user_draft_unique ON essays(user_id) WHERE status = 'draft';
```

This enforces the business rule that each user can only have one draft at a time (new drafts overwrite previous ones).

---

## File Structure

```
src/
├── app/
│   ├── [locale]/                    # i18n routing (from boilerplate)
│   │   ├── (auth)/                  # Protected routes
│   │   │   ├── dashboard/
│   │   │   ├── submit/              # 3-tab essay submission
│   │   │   ├── grades/[id]/         # Status + results
│   │   │   ├── history/
│   │   │   └── settings/
│   │   └── (unauth)/                # Public routes (landing)
│   └── api/
│       ├── webhooks/
│       │   ├── clerk/               # User lifecycle webhook
│       │   └── stripe/              # Payment events webhook
│       ├── essays/
│       │   ├── submit/              # Essay submission endpoint
│       │   └── generate-title/     # Auto-generate title endpoint
│       ├── ocr/
│       │   └── process/            # Image-to-markdown OCR endpoint
│       ├── grades/[id]/stream/      # SSE endpoint
│       └── payments/
│           └── create-checkout/    # Stripe checkout session creation
├── worker/                          # Background worker (Railway service)
│   ├── index.ts                     # Worker entry point (LISTEN + polling)
│   └── processGrade.ts              # Grading logic (3x AI, retry, consensus)
├── components/
│   └── ui/                          # Shadcn components (from boilerplate)
├── features/                        # Feature modules (boilerplate pattern)
│   ├── essays/                      # Submission forms, draft autosave
│   ├── grading/                     # Results display, category scores
│   └── credits/                     # Balance display, purchase flow
├── libs/                            # Third-party configs (boilerplate pattern)
│   ├── DB.ts                        # Drizzle setup
│   ├── Clerk.ts                     # Auth helpers
│   ├── Stripe.ts                    # Payment client
│   ├── AI.ts                        # Vercel AI SDK client (OpenRouter)
│   └── Mistral.ts                   # Mistral Document AI client (OCR)
├── models/
│   └── Schema.ts                    # Database schema (single source of truth)
├── hooks/
│   └── useGradeStatus.ts            # SSE client hook
├── utils/                           # Utilities (from boilerplate)
│   ├── Helpers.ts
│   └── documentParser.ts            # Document parsing utilities (Mistral OCR)
└── locales/                         # i18n (from boilerplate)
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

### What's Included (Free)

- ✅ Next.js 14 + React 18 (we'll upgrade)
- ✅ Tailwind CSS 3 (we'll upgrade to v4)
- ✅ Clerk authentication
- ✅ Drizzle ORM + PostgreSQL
- ✅ Shadcn UI components
- ✅ Vitest + Playwright testing
- ✅ Sentry error monitoring
- ✅ i18n support (next-intl)
- ✅ Landing page template
- ✅ ESLint + Prettier + Husky

### What We're Adding

- ✅ Vercel AI SDK (~30 min)
- ✅ Stripe integration (~4 hours)
- ✅ Dark mode (~1 hour)
- ✅ Upgrades: Next.js 15, React 19, Tailwind 4

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

# 3. Install dependencies with Bun
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

# 8. Update package.json scripts for Bun
# Modify scripts to use "bun --bun run" for dev and start
```

### Tailwind 4 Configuration

```css
/* src/app/globals.css */
@import "tailwindcss";

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

Create `requireAuth()` helper that calls `await auth()` and throws if no `userId`. Use this in all protected API routes.

### User Profile Update API

**PATCH /api/user/profile:**
- Validate field lengths (institution, course: max 200 chars)
- Validate `defaultGradingScale` is one of: 'percentage', 'letter', 'uk', 'gpa', 'pass_fail'
- Update user record with conditional spreads for partial updates
- Return success/error

**GET /api/user/profile:**
- Fetch user by `userId` from `requireAuth()`
- Return selected columns only (exclude sensitive data)

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
Run SQL migration after schema push to create singleton row with default `signup_bonus_amount` of `1.00` (use `ON CONFLICT DO NOTHING` for idempotency).

**Admin Settings API:**
- **GET:** Fetch singleton row, auto-initialize with defaults if not exists
- **PATCH:** Validate amount (0.00-1000.00 range), format to 2 decimals, update singleton row with `updatedBy` tracking
- **TODO:** Add admin authorization check (v3.1+)

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

**POST /api/payments/create-checkout:**
- Mode: `payment` (one-time, NOT subscription)
- Line items: Dynamic `price_data` (not pre-created products)
- Amount: Convert dollars to cents (`Math.round(amount * 100)`)
- Metadata: Include `userId` and `credits` for webhook processing
- Return: `sessionId` and `url` for client redirect

### Webhook Handler

**POST /api/webhooks/stripe:**

1. Verify webhook signature using `stripe.webhooks.constructEvent`
2. On `checkout.session.completed`:
   - Extract `userId` and `credits` from `session.metadata`
   - **Idempotency check (CRITICAL):**
     ```typescript
     const existing = await tx.query.creditTransactions.findFirst({
       where: eq(creditTransactions.stripePaymentIntentId, session.payment_intent as string),
     });
     if (existing) return; // Skip to prevent double-crediting
     ```
   - Update balance: `balance = balance + creditAmount` (SQL increment)
   - Log transaction with `stripePaymentIntentId`
3. Use atomic transaction for all operations

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
- Grading model: `grok-4` (3x consensus)
- Title generation model: `openai/gpt-3.5-turbo` (fast/cheap, ~$0.001 per title)

### Title Generation API

**Purpose:** Generate concise essay titles (max 6 words) based on essay content and instructions.

**Model Choice:** Uses a fast, cheap model (GPT-3.5 Turbo) instead of the grading models (Grok-4) to minimize cost and latency.

**POST /api/essays/generate-title:**
- Input: `instructions` (assignment brief), `content` (first 500 words)
- Validation: Require at least one field
- Model config: `maxTokens: 20`, `temperature: 0.7`
- Output: Trim to max 6 words
- Cost: ~$0.001 per generation (no credit deduction, free for users)

### Usage in Railway Worker

**CRITICAL: Always use `generateObject` with Zod schema validation.**

Without schema validation, malformed JSON responses from AI models cause production debugging nightmares. Using `generateObject` with Zod ensures type-safety, automatic validation, clear error messages, and eliminates parsing errors.

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

## Async Grading (PostgreSQL LISTEN/NOTIFY + Railway Worker + SSE)

### Why Async?

**Synchronous grading = BAD UX:**
- ❌ User stuck waiting 30+ seconds
- ❌ No progress indication
- ❌ API timeout risk (Railway supports long-running, but still bad UX)
- ❌ Can't navigate away
- ❌ No retry on transient failures

**Async workflow:**
- ✅ Submit essay → Instant response (<500ms)
- ✅ Event-driven job trigger → PostgreSQL NOTIFY sends instant notification to worker
- ✅ Background processing → Railway worker handles grading (with custom retry logic)
- ✅ Real-time updates → SSE streams status to client
- ✅ User experience → Can navigate away, come back later
- ✅ Cost-effective → No constant polling, Neon can scale to zero

### Why LISTEN/NOTIFY Instead of Polling?

**Polling problems:**
- ❌ Keeps Neon database awake 24/7 (~$19/month for Launch plan)
- ❌ Wastes CPU on empty queries (43,200 queries/day for 2s polling)
- ❌ 2-second delay before jobs start

**LISTEN/NOTIFY benefits:**
- ✅ Instant job notification (no delay)
- ✅ Database can scale to zero (Neon Free plan works!)
- ✅ Saves ~$19/month in database costs
- ✅ Only active during actual work
- ✅ Native PostgreSQL feature (no additional infrastructure)

### Submission Endpoint (Triggers Worker via NOTIFY)

**POST /api/essays/submit:**

1. Auth check
2. Rate limit: 1 submission per user per 30 seconds (in-memory Map for v3, migrate to Redis for scale)
3. Validate essay exists and belongs to user
4. Check sufficient credits (`balance >= 1.0`)
5. **Atomic transaction:**
   - Reserve credit: `balance - 1.00`, `reserved + 1.00`
   - Update essay: `status = 'submitted'`, set `submittedAt`
   - Create grade record: `status = 'queued'`
   - **Send PostgreSQL NOTIFY (CRITICAL):**
     ```typescript
     await tx.execute(sql`NOTIFY new_grade, ${grade.id}`);
     ```
6. Return `{ gradeId }` immediately (<500ms)

### Railway Worker (Event-Driven with Backup Polling)

**Setup (`src/worker/index.ts`):**
- Pool config: `min: 1, max: 5` (keep connection alive for LISTEN)
- Startup sweep: Process queued grades from before restart (LISTEN/NOTIFY misses messages during deploys)

**LISTEN Setup (CRITICAL):**
```typescript
const notificationClient = await pool.connect();
await notificationClient.query('LISTEN new_grade');

notificationClient.on('notification', async (msg) => {
  if (msg.channel === 'new_grade') {
    const gradeId = msg.payload;
    await processGrade(gradeId, db);
  }
});

notificationClient.on('error', (err) => {
  // Reconnect logic handled by pg library
});
```

**Backup Polling (every 5 minutes):**
- Find grades: `status = 'queued'` AND `queuedAt < 10 minutes ago`
- Process up to 10 stuck grades
- Prevents stuck jobs if LISTEN/NOTIFY fails

**Graceful Shutdown:**
- Handle `SIGTERM`: Close pool, exit cleanly

### Grade Processing Logic

**`processGrade(gradeId, db)` (`src/worker/processGrade.ts`):**

1. Fetch grade + essay
2. Check reserved credit exists (race condition protection)
3. Update status: `'processing'`
4. Run 3x AI grading in parallel with retry logic
5. Apply outlier detection
6. Save results + clear reservation (atomic)
7. On error: Mark failed, refund reservation

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
      if (isPermanentError(error)) throw error; // Don't retry
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
    /400/i,
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
  if (scores.length < 3) return null;

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
- **Hard timeout:** 5 minutes (300 seconds) - enforced in Railway worker
- After timeout: Grade marked as `failed`, no credit deduction (since credits aren't deducted until completion)

**Retry Strategy:**
- **3 automatic retries** on transient failures
- **Exponential backoff:** 5s, 15s, 45s (custom implementation in Railway worker)
- **Error Classification:**
  - **Transient errors (retry):** Network timeouts, 503 Service Unavailable, rate limits, temporary API failures
  - **Permanent errors (fail immediately):** Invalid API key, 400 Bad Request, essay too long, malformed prompt

**Credit Refund Semantics:**
- **No-hold model:** Credits are **NOT deducted until grading completes successfully**
- **On failure:** No credit deduction occurs, so **no refund is needed** (user never lost the credit)
- **User messaging:** Instead of "refunded", use: "Grading failed. You were not charged. Please try again."
- **Exception:** Manual admin refunds for verified errors (creates a `refund` transaction type for audit purposes)

### SSE Endpoint (Real-Time Status)

**GET /api/grades/[id]/stream:**
- Return `ReadableStream` with SSE headers
- Poll grade status every 2 seconds
- Send updates: `data: ${JSON.stringify({ status, updatedAt })}\n\n`
- Close stream on terminal state (`complete` or `failed`)
- Handle client disconnect: Clean up interval on `request.signal.abort`

### Client Hook (useGradeStatus)

**Implementation (`src/hooks/useGradeStatus.ts`):**
- Connect to `/api/grades/${gradeId}/stream` via `EventSource`
- **On connect/reconnect (CRITICAL):** Immediately fetch current state from `/api/grades/[id]` to sync with database truth:
  ```typescript
  eventSource.onopen = async () => {
    const response = await fetch(`/api/grades/${gradeId}`);
    const data = await response.json();
    setStatus(data.status); // Sync with DB truth
  };
  ```
  This prevents stale status after page refresh or network interruption.
- **On message:** Update status from SSE event
- **On error:** Auto-reconnect with exponential backoff: `Math.min(3000 * Math.pow(2, attempts), 12000)` (3s, 6s, 12s max)
- **Cleanup:** Close `EventSource` and clear timeouts on unmount

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
- Custom organization logic when needed (see PHASE_2_MIGRATION.md)
- No pricing tied to MAU growth

### 3. Background AI Grading

AI calls run async via Railway worker (slow, need retries, real-time status via SSE).

**When NOT to use Railway worker:**
- Stripe webhooks (synchronous)
- User signups (synchronous)
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
- Railway: Pay-as-you-go pricing (scales with usage)

---

## Cost Analysis

### Infrastructure Costs

| Service | Launch (10 users) | Month 2 (500 users) | Notes |
|---------|-------------------|---------------------|-------|
| **Clerk** | Free | Free (under 10k MAU) | Authentication |
| **Neon** | **Free** | $69/mo (Scale tier) | **LISTEN/NOTIFY allows Free plan!** |
| **Railway** | $5/mo | $50/mo (estimated) | Web + Worker services |
| **Sentry** | Free | Free (under 5k events) | Error tracking |
| **OpenRouter** | $90/mo | $4,500/mo | AI grading (3x Grok-4) |
| **Total** | **$95/mo** | **$4,619/mo** | |

**Cost Savings with LISTEN/NOTIFY:**
- Launch phase: **Free tier on Neon works** (vs $19/mo Launch plan with polling)
- Neon only active during submissions + grading (~7 hours/month at launch)
- Database can scale to zero between submissions
- Savings: **$19/month** at launch, more at scale

### Revenue (@ $0.30/essay avg)

| Metric | Launch | Month 2 |
|--------|--------|---------|
| Essays/day | 10 | 500 |
| Revenue/month | $300 | $15,000 |
| Infrastructure | $95 | $4,619 |
| **Profit** | **$205** | **$10,381** |

**Margin:** ~68%

---

## Environment Variables

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

# OpenRouter (AI via Vercel AI SDK)
OPENROUTER_API_KEY=sk-or-...

# Mistral (Document AI / OCR)
MISTRAL_API_KEY=your_mistral_api_key_here

# App
NEXT_PUBLIC_URL=http://localhost:3000
```

---

## Launch Checklist

### Week 1: Foundation

- [ ] Clone boilerplate
- [ ] Upgrade Next.js 14→15, React 18→19, Tailwind 3→4
- [ ] Remove example code
- [ ] Add Vercel AI SDK
- [ ] Add Mistral Document AI SDK (`@mistralai/mistralai`)
- [ ] Add Stripe integration
- [ ] Add dark mode
- [ ] Set up Clerk (Google OAuth, no Organizations)
- [ ] Set up Mistral API key (Document AI/OCR)
- [ ] Set up Neon (dev, prod, test branches)
- [ ] Replace `src/models/Schema.ts` with schema above
- [ ] Run migrations: `bun run db:push`
- [ ] Set up Railway account and project
- [ ] Verify: `bun --bun run dev`

### Week 2-3: Core Features

- [ ] Essay Submission
  - [ ] 3-tab UI (Brief → Rubric → Essay)
  - [ ] Document parsing via Mistral Document AI (PDF/DOCX/images)
  - [ ] Document upload for Instructions & Custom Rubric (PDF/DOCX/images via Mistral)
  - [ ] Unified OCR API endpoint (`/api/ocr/process`) for all document types
  - [ ] Word count (50k limit)
  - [ ] Cost estimator (real-time)
  - [ ] Draft autosave (on document upload, typing/pasting/editing with 1-2s debounce, tab blur)
  - [ ] Submit endpoint (create essay + grade, send NOTIFY)
- [ ] Grading
  - [ ] Railway worker with LISTEN/NOTIFY (3x Grok-4, outlier detection, custom retry)
  - [ ] Backup polling (5-minute interval for stuck grades)
  - [ ] SSE endpoint (real-time status)
  - [ ] Results page (grade range, category scores, feedback)
- [ ] History
  - [ ] Essay list (filterable, sortable, paginated)
  - [ ] Delete essay (soft delete)

### Week 4: Billing

- [ ] Credit purchases (Stripe checkout)
- [ ] Credit balance display (navbar, settings)
- [ ] Transaction history

### Week 5: Testing & Polish

- [ ] E2E tests (submission, grading, purchase)
- [ ] Error handling (timeouts, API failures)
- [ ] Loading states (skeleton screens)
- [ ] Dark mode polish
- [ ] Mobile responsive

### Week 6: Launch

- [ ] Deploy to Railway (web + worker services)
- [ ] Configure worker service startup command: `bun run src/worker/index.ts`
- [ ] Set up production Neon database (Free plan works with LISTEN/NOTIFY!)
- [ ] Verify LISTEN/NOTIFY working in production
- [ ] Configure Stripe webhooks (production)
- [ ] Set up Sentry (production)
- [ ] Landing page copy
- [ ] Privacy policy & Terms
- [ ] Launch! 🚀

---

This technical design provides implementation details for developers. Functional requirements (what the system does) are in FUNCTIONAL_REQUIREMENTS.md.
