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
3. **Performance is fine:** Autosave writes (~60-120 per essay) are trivial for PostgreSQL. Partial index `WHERE status = 'draft'` keeps queries fast.
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

// Users (synced from Clerk)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Matches Clerk user ID (e.g., 'user_2abc123def456')
  clerkId: text('clerk_id').notNull().unique(), // Redundant with id, kept for explicit clarity
  email: text('email').notNull(),
  name: text('name'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Credits (user-scoped)
export const credits = pgTable('credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  balance: numeric('balance', { precision: 10, scale: 2 }).default('1.00').notNull(),
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
│   └── AI.ts                        # Vercel AI SDK client (OpenRouter)
├── models/
│   └── Schema.ts                    # Database schema (single source of truth)
├── hooks/
│   └── useGradeStatus.ts            # SSE client hook
├── utils/                           # Utilities (from boilerplate)
│   └── Helpers.ts
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

```typescript
// src/app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { db } from '@/libs/DB';
import { users, credits, creditTransactions } from '@/models/Schema';

export async function POST(req: Request) {
  const payload = await req.json();
  const headers = Object.fromEntries(req.headers);

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  const evt = wh.verify(JSON.stringify(payload), headers);

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    await db.transaction(async (tx) => {
      // 1. Create user
      await tx.insert(users).values({
        id,
        clerkId: id,
        email: email_addresses[0].email_address,
        name: `${first_name || ''} ${last_name || ''}`.trim(),
        imageUrl: image_url,
      });

      // 2. Create credits (signup bonus)
      await tx.insert(credits).values({
        userId: id,
        balance: '1.00',
      });

      // 3. Log transaction
      await tx.insert(creditTransactions).values({
        userId: id,
        amount: '1.00',
        transactionType: 'signup_bonus',
        description: 'Welcome! Free first essay',
      });
    });
  }

  return Response.json({ received: true });
}
```

### Middleware

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/about',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### Auth Helpers

```typescript
// src/libs/Clerk.ts
import { auth } from '@clerk/nextjs/server';

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}
```

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

```typescript
// src/libs/Stripe.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});
```

### Checkout Session

```typescript
// src/app/api/payments/create-checkout/route.ts
import { stripe } from '@/libs/Stripe';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { credits, amount } = await req.json();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // One-time payment (NOT subscription)
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} MarkM8 Credits`,
              description: 'AI essay grading credits',
            },
            unit_amount: Math.round(amount * 100), // Cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL}/settings?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/settings?payment=cancelled`,
      metadata: {
        userId,
        credits: credits.toString(),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### Webhook Handler

```typescript
// src/app/api/webhooks/stripe/route.ts
import { stripe } from '@/libs/Stripe';
import { db } from '@/libs/DB';
import { credits, creditTransactions } from '@/models/Schema';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, credits: creditAmount } = session.metadata!;

      await db.transaction(async (tx) => {
        // Idempotency check: Stripe retries webhooks, so check if we've already processed this payment
        const existing = await tx.query.creditTransactions.findFirst({
          where: eq(creditTransactions.stripePaymentIntentId, session.payment_intent as string),
        });

        if (existing) {
          // Already processed, skip to prevent double-crediting
          return;
        }

        // 1. Update balance
        await tx
          .update(credits)
          .set({
            balance: sql`balance + ${creditAmount}`,
            updatedAt: new Date(),
          })
          .where(eq(credits.userId, userId));

        // 2. Log transaction
        await tx.insert(creditTransactions).values({
          userId,
          amount: creditAmount,
          transactionType: 'purchase',
          description: `Purchased ${creditAmount} credits`,
          stripePaymentIntentId: session.payment_intent as string,
        });
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
```

**Critical: Idempotency Check**

Stripe **guarantees** webhook retries. Without the idempotency check above, users will be double-credited when Stripe retries the webhook (e.g., due to network issues or timeout). The check uses `stripePaymentIntentId` as a unique identifier - if a transaction with this ID already exists, we skip processing to prevent financial loss.

---

## AI Integration (Vercel AI SDK)

### Setup

```bash
bun add ai @ai-sdk/openai
```

### AI Client

```typescript
// src/libs/AI.ts
import { createOpenAI } from '@ai-sdk/openai';

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is not set');
}

// OpenRouter is OpenAI-compatible
export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export function getGradingModel() {
  return openrouter('grok-4');
}
```

### Usage in Railway Worker

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';
import { getGradingModel } from '@/libs/AI';

// Define expected output structure with Zod schema
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

const result = await generateObject({
  model: getGradingModel(),
  schema: GradeSchema,
  prompt: `Grade this essay: ${essay.content}...`,
});
```

**Critical: Schema Validation**

Without schema validation, malformed JSON responses from AI models cause production debugging nightmares. Using `generateObject` with Zod ensures:
- Type-safe responses (TypeScript knows the exact structure)
- Automatic validation (invalid responses throw errors immediately)
- Clear error messages (Zod tells you exactly what's wrong)
- No manual JSON parsing (eliminates parsing errors)

---

## Document Ingestion (File Upload & Parsing)

### Supported Formats

- **PDF:** `.pdf` files
- **DOCX:** `.docx` files (Microsoft Word)
- **Plain text:** Direct paste (no parsing needed)

### File Size Limits

- **Maximum file size:** 10 MB
- **Maximum word count:** 50,000 words (enforced after parsing)
- **Minimum word count:** 50 words

### Parsing Implementation

**Library Choice:**
- **PDF:** Use `pdf-parse` or `pdfjs-dist` (Mozilla's PDF.js)
- **DOCX:** Use `mammoth` (converts DOCX to HTML, then extract text)

**Installation:**
```bash
bun add pdf-parse mammoth
```

**Implementation Pattern:**
```typescript
// src/utils/documentParser.ts
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function parseDocument(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  
  if (file.type === 'application/pdf') {
    const data = await pdfParse(Buffer.from(buffer));
    return data.text;
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    return result.value;
  } else {
    throw new Error('Unsupported file type');
  }
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Usage: Validate extracted text
export async function parseAndValidateDocument(file: File): Promise<string> {
  const text = await parseDocument(file);
  const wordCount = countWords(text);
  
  if (wordCount === 0) {
    throw new Error('No text could be extracted. Please ensure your document contains selectable text, not images.');
  }
  
  return text;
}
```

**Security Considerations:**
- Validate MIME type server-side (don't trust client `file.type`)
- Scan for malicious content (consider virus scanning for production)
- Limit file size before parsing (prevent DoS)
- Sanitize extracted text (remove potential XSS if displaying)

**Storage:**
- Extracted text stored in `essays.content` (text field)
- Original file **NOT stored** (only parsed text kept)
- If user wants to re-upload, they must upload again

**Error Handling:**
- Parsing failures → Show error: "Could not extract text from this file. Please check the format or paste text directly."
- File too large → Show error: "File exceeds 10 MB limit. Please use a smaller file."
- Invalid format → Show error: "Unsupported file type. Please use PDF or DOCX."
- No text extracted (blank/scanned PDF) → Show error: "No text could be extracted. Please ensure your document contains selectable text, not images."

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

```typescript
// src/app/api/essays/submit/route.ts
import { db } from '@/libs/DB';
import { essays, grades, credits } from '@/models/Schema';
import { sql, eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Rate limiter (in-memory Map for v3, Redis for scale)
const rateLimiter = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 1 submission per user per 30 seconds
    const lastSubmission = rateLimiter.get(userId) || 0;
    if (Date.now() - lastSubmission < 30000) {
      return NextResponse.json(
        { error: 'Please wait before submitting again' },
        { status: 429 }
      );
    }
    rateLimiter.set(userId, Date.now());

    const { essayId } = await req.json();

    // Validate essay exists and belongs to user
    const essay = await db.query.essays.findFirst({
      where: and(
        eq(essays.id, essayId),
        eq(essays.userId, userId)
      ),
    });

    if (!essay) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 });
    }

    // Check user has sufficient credits (available balance, not including reserved)
    const userCredits = await db.query.credits.findFirst({
      where: eq(credits.userId, userId),
    });

    if (!userCredits || parseFloat(userCredits.balance) < 1.0) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    // Create grade record, reserve credit, and send NOTIFY in a transaction
    const result = await db.transaction(async (tx) => {
      // 1. Reserve credit: balance - 1.00, reserved + 1.00
      await tx
        .update(credits)
        .set({
          balance: sql`balance - 1.00`,
          reserved: sql`reserved + 1.00`,
          updatedAt: new Date(),
        })
        .where(eq(credits.userId, userId));

      // 2. Update essay status
      await tx
        .update(essays)
        .set({
          status: 'submitted',
          submittedAt: new Date(),
        })
        .where(eq(essays.id, essayId));

      // 3. Create grade record
      const [grade] = await tx
        .insert(grades)
        .values({
          userId,
          essayId,
          status: 'queued',
          queuedAt: new Date(),
        })
        .returning();

      // 4. Send PostgreSQL NOTIFY to wake up worker
      await tx.execute(sql`NOTIFY new_grade, ${grade.id}`);

      return grade;
    });

    // Return immediately - worker will pick up the grade via LISTEN
    return NextResponse.json({ gradeId: result.id });
  } catch (error) {
    console.error('Essay submission error:', error);
    return NextResponse.json(
      { error: 'Submission failed' },
      { status: 500 }
    );
  }
}
```

**Note:** Rate limiting uses an in-memory Map for v3 (simple, no Redis dependency). For production scale, migrate to Redis or a distributed rate limiting service.

### Railway Worker (Event-Driven with Backup Polling)

```typescript
// src/worker/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { processGrade } from './processGrade';
import { grades } from '@/models/Schema';
import { eq, and, lt } from 'drizzle-orm';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Keep connection alive for LISTEN
  min: 1,
  max: 5,
});

const db = drizzle(pool);

async function startWorker() {
  console.log('🚀 Starting MarkM8 grading worker...');

  // Startup sweep: Process any queued grades from before restart
  // LISTEN/NOTIFY misses messages during deploys, so this prevents stuck grades
  try {
    const pending = await db.query.grades.findMany({
      where: eq(grades.status, 'queued'),
    });

    if (pending.length > 0) {
      console.log(`🔍 Found ${pending.length} queued grades, processing...`);
      for (const grade of pending) {
        try {
          await processGrade(grade.id, db);
        } catch (error) {
          console.error(`❌ Failed to process queued grade ${grade.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('❌ Startup sweep failed:', error);
    // Continue anyway - LISTEN will handle new grades
  }

  // Setup LISTEN for instant notifications
  const notificationClient = await pool.connect();

  try {
    await notificationClient.query('LISTEN new_grade');
    console.log('✅ Listening for new_grade notifications');

    // Handle notifications
    notificationClient.on('notification', async (msg) => {
      if (msg.channel === 'new_grade') {
        const gradeId = msg.payload;
        console.log(`📨 Received notification for grade: ${gradeId}`);

        try {
          await processGrade(gradeId, db);
        } catch (error) {
          console.error(`❌ Failed to process grade ${gradeId}:`, error);
        }
      }
    });

    // Handle connection errors
    notificationClient.on('error', (err) => {
      console.error('❌ LISTEN connection error:', err);
      // Reconnect logic handled by pg library
    });

  } catch (error) {
    console.error('❌ Failed to setup LISTEN:', error);
    throw error;
  }

  // Backup polling: Check for stuck grades every 5 minutes
  setInterval(async () => {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      const stuckGrades = await db.query.grades.findMany({
        where: and(
          eq(grades.status, 'queued'),
          lt(grades.queuedAt, tenMinutesAgo)
        ),
        limit: 10,
      });

      if (stuckGrades.length > 0) {
        console.log(`🔍 Found ${stuckGrades.length} stuck grades, reprocessing...`);

        for (const grade of stuckGrades) {
          try {
            await processGrade(grade.id, db);
          } catch (error) {
            console.error(`❌ Failed to reprocess stuck grade ${grade.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Backup polling error:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  console.log('✅ Worker running (LISTEN + 5min backup polling)');
}

// Start the worker
startWorker().catch((error) => {
  console.error('❌ Worker failed to start:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⏹️  SIGTERM received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});
```

### Grade Processing Logic

```typescript
// src/worker/processGrade.ts
import { generateText } from 'ai';
import { getGradingModel } from '@/libs/AI';
import { essays, grades, credits, creditTransactions } from '@/models/Schema';
import { eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

// Custom retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delays: number[] = [5000, 15000, 45000]
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is permanent (don't retry)
      if (isPermanentError(lastError)) {
        throw lastError;
      }

      // If not last attempt, wait before retrying
      if (attempt < maxRetries) {
        console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} after ${delays[attempt]}ms...`);
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

function isPermanentError(error: Error): boolean {
  // Permanent errors: invalid API key, 400 Bad Request, essay too long, malformed prompt
  const permanentPatterns = [
    /invalid.*api.*key/i,
    /400/i,
    /bad.*request/i,
    /malformed/i,
  ];

  return permanentPatterns.some(pattern => pattern.test(error.message));
}

/**
 * Outlier Detection: Find score furthest from mean
 * Replaces pairwise comparison which can incorrectly exclude median scores.
 * 
 * @param scores Array of percentage scores (0-100)
 * @returns The outlier score to exclude, or null if no outlier found
 */
function findOutlier(scores: number[]): number | null {
  if (scores.length < 3) {
    return null; // Need at least 3 scores to detect outlier
  }

  const mean = scores.reduce((a, b) => a + b) / scores.length;
  const deviations = scores.map(s => Math.abs(s - mean));
  const maxDeviation = Math.max(...deviations);
  const threshold = mean * 0.10; // 10% of mean

  if (maxDeviation > threshold) {
    // Return the score that has the maximum deviation
    const maxDeviationIndex = deviations.indexOf(maxDeviation);
    return scores[maxDeviationIndex];
  }

  return null; // No outlier
}

export async function processGrade(gradeId: string, db: NodePgDatabase) {
  console.log(`⚙️  Processing grade: ${gradeId}`);

  try {
    // Step 1: Fetch essay + grade
    const grade = await db.query.grades.findFirst({
      where: eq(grades.id, gradeId),
      with: {
        essay: true,
      },
    });

    if (!grade) {
      console.error(`❌ Grade not found: ${gradeId}`);
      return;
    }

    // Step 2: Check credits (race condition protection - check reserved credit exists)
    const userCredits = await db.query.credits.findFirst({
      where: eq(credits.userId, grade.userId),
    });

    if (!userCredits || parseFloat(userCredits.reserved) < 1.0) {
      console.warn(`⚠️  No reserved credit found for grade: ${gradeId}`);
      await db
        .update(grades)
        .set({
          status: 'failed',
          errorMessage: 'Insufficient credits',
          completedAt: new Date(),
        })
        .where(eq(grades.id, gradeId));
      return;
    }

    // Step 3: Update status to processing
    await db
      .update(grades)
      .set({ status: 'processing', startedAt: new Date() })
      .where(eq(grades.id, gradeId));

    console.log(`🤖 Running AI grading for: ${gradeId}`);

    // Step 4: Run 3 AI models in parallel with retry logic
    const essay = grade.essay;
    const prompt = `Grade this essay: ${essay.content}...`; // Full prompt in actual implementation

    const modelResults = await retryWithBackoff(async () => {
      const results = await Promise.all([
        generateObject({ model: getGradingModel(), schema: GradeSchema, prompt }),
        generateObject({ model: getGradingModel(), schema: GradeSchema, prompt }),
        generateObject({ model: getGradingModel(), schema: GradeSchema, prompt }),
      ]);

      // Extract scores from validated results, apply outlier detection, calculate range
      const scores = results.map(r => r.object.percentage);
      const outlier = findOutlier(scores);
      const includedScores = outlier !== null ? scores.filter(s => s !== outlier) : scores;
      
      // Calculate grade range from included scores
      const minScore = Math.min(...includedScores);
      const maxScore = Math.max(...includedScores);
      // ... (full range calculation and feedback selection in actual code)

      return results;
    });

    // Step 5: Save results + clear reservation (atomic)
    // Note: Credit already deducted from balance at submission, just clear reservation
    await db.transaction(async (tx) => {
      // Update grade
      await tx
        .update(grades)
        .set({
          status: 'complete',
          letterGradeRange: '...', // Calculated from results
          percentageRange: { lower: 82, upper: 87 }, // Calculated from results
          feedback: { /* Parsed feedback */ },
          modelResults,
          completedAt: new Date(),
        })
        .where(eq(grades.id, gradeId));

      // Clear reservation (credit already deducted from balance at submission)
      await tx
        .update(credits)
        .set({
          reserved: sql`reserved - 1.00`,
          updatedAt: new Date(),
        })
        .where(eq(credits.userId, grade.userId));

      // Log transaction
      await tx.insert(creditTransactions).values({
        userId: grade.userId,
        amount: '-1.00',
        transactionType: 'grading',
        description: `Graded essay: ${essay.assignmentBrief?.title || 'Untitled'}`,
        gradeId,
      });
    });

    console.log(`✅ Successfully graded: ${gradeId}`);
  } catch (error) {
    console.error(`❌ Grading failed for ${gradeId}:`, error);

    // Mark as failed and refund reserved credit (atomic)
    await db.transaction(async (tx) => {
      // Update grade status
      await tx
        .update(grades)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
        })
        .where(eq(grades.id, gradeId));

      // Refund reserved credit back to balance
      await tx
        .update(credits)
        .set({
          balance: sql`balance + 1.00`,
          reserved: sql`reserved - 1.00`,
          updatedAt: new Date(),
        })
        .where(eq(credits.userId, grade.userId));
    });
  }
}
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

**Error Handling in Worker:**
```typescript
// Custom retry function with error classification:
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delays: number[] = [5000, 15000, 45000]
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (isPermanentError(error)) {
        throw error; // Fail immediately for permanent errors
      }
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }
  }
  throw error;
}
```

### SSE Endpoint (Real-Time Status)

```typescript
// src/app/api/grades/[id]/stream/route.ts
import { db } from '@/libs/DB';
import { grades } from '@/models/Schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Poll grade status every 2 seconds
      const interval = setInterval(async () => {
        const grade = await db.query.grades.findFirst({
          where: eq(grades.id, id),
        });

        if (!grade) {
          controller.close();
          clearInterval(interval);
          return;
        }

        // Send status update
        const data = {
          status: grade.status,
          updatedAt: grade.updatedAt,
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );

        // Close on terminal state
        if (grade.status === 'complete' || grade.status === 'failed') {
          controller.close();
          clearInterval(interval);
        }
      }, 2000);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

### Client Hook (useGradeStatus)

```typescript
// src/hooks/useGradeStatus.ts
'use client';
import { useEffect, useState, useRef } from 'react';

export function useGradeStatus(gradeId: string) {
  const [status, setStatus] = useState<string>('queued');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connect = () => {
      eventSource = new EventSource(`/api/grades/${gradeId}/stream`);

      // On connect/reconnect: Fetch current state immediately to sync with DB truth
      eventSource.onopen = async () => {
        reconnectAttemptsRef.current = 0; // Reset on successful connection
        try {
          const response = await fetch(`/api/grades/${gradeId}`);
          const data = await response.json();
          setStatus(data.status); // Sync with DB truth
        } catch (error) {
          console.error('Failed to fetch initial grade status:', error);
        }
      };

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setStatus(data.status);
      };

      // On error: Auto-reconnect with exponential backoff
      eventSource.onerror = () => {
        eventSource?.close();
        
        // Exponential backoff: 3s, 6s, 12s max
        const delay = Math.min(3000 * Math.pow(2, reconnectAttemptsRef.current), 12000);
        reconnectAttemptsRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [gradeId]);

  return { status };
}
```

**Reconnection Pattern:**

- **On connect/reconnect:** Immediately fetch current state from `/api/grades/[id]` to sync with database truth (prevents stale status after page refresh or network interruption)
- **On error:** Auto-reconnect with exponential backoff (3s, 6s, 12s max) to handle transient network issues
- **Cleanup:** Properly close EventSource and clear timeouts on unmount

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
- [ ] Add Stripe integration
- [ ] Add dark mode
- [ ] Set up Clerk (Google OAuth, no Organizations)
- [ ] Set up Neon (dev, prod, test branches)
- [ ] Replace `src/models/Schema.ts` with schema above
- [ ] Run migrations: `bun run db:push`
- [ ] Set up Railway account and project
- [ ] Verify: `bun --bun run dev`

### Week 2-3: Core Features

- [ ] Essay Submission
  - [ ] 3-tab UI (Brief → Rubric → Essay)
  - [ ] Document parsing (PDF/DOCX)
  - [ ] Word count (50k limit)
  - [ ] Cost estimator (real-time)
  - [ ] Draft autosave (2s debounce)
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
