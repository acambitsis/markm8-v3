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
  institution: text('institution'), // Optional: user's institution (free text)
  course: text('course'), // Optional: user's course (free text)
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
import { users, credits, creditTransactions, platformSettings } from '@/models/Schema';
import { eq } from 'drizzle-orm';

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

      // 2. Get signup bonus amount from platform settings
      const settings = await tx.query.platformSettings.findFirst({
        where: eq(platformSettings.id, 'singleton'),
      });
      const signupBonus = settings?.signupBonusAmount || '1.00';
      const signupBonusFloat = parseFloat(signupBonus);

      // 3. Create credits (with configurable signup bonus)
      await tx.insert(credits).values({
        userId: id,
        balance: signupBonus,
      });

      // 4. Log transaction (only if signup bonus > 0)
      if (signupBonusFloat > 0) {
        await tx.insert(creditTransactions).values({
          userId: id,
          amount: signupBonus,
          transactionType: 'signup_bonus',
          description: 'Welcome! Free first essay',
        });
      }
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

### User Profile Update API

```typescript
// src/app/api/user/profile/route.ts
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/libs/Clerk';
import { NextResponse } from 'next/server';

// PATCH: Update user profile (name, institution, course)
export async function PATCH(req: Request) {
  try {
    const userId = await requireAuth();
    const body = await req.json();
    const { name, institution, course } = body;

    // Validate field lengths
    if (institution && institution.length > 200) {
      return NextResponse.json(
        { error: 'Institution must be 200 characters or less' },
        { status: 400 }
      );
    }
    if (course && course.length > 200) {
      return NextResponse.json(
        { error: 'Course must be 200 characters or less' },
        { status: 400 }
      );
    }

    // Update user
    await db
      .update(users)
      .set({
        ...(name !== undefined && { name }),
        ...(institution !== undefined && { institution }),
        ...(course !== undefined && { course }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// GET: Retrieve current user profile
export async function GET() {
  try {
    const userId = await requireAuth();
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        email: true,
        name: true,
        imageUrl: true,
        institution: true,
        course: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
```

### Platform Settings (Admin Configuration)

**Initialization:**
On first deployment, create the singleton row with default values:

```sql
-- Run this migration after initial schema push
INSERT INTO platform_settings (id, signup_bonus_amount, updated_at)
VALUES ('singleton', '1.00', NOW())
ON CONFLICT (id) DO NOTHING;
```

**Admin Settings API:**

```typescript
// src/app/api/admin/settings/route.ts
import { db } from '@/libs/DB';
import { platformSettings } from '@/models/Schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/libs/Clerk';
import { NextResponse } from 'next/server';

// GET: Retrieve current settings
export async function GET() {
  try {
    const adminId = await requireAuth();
    // TODO: Check isAdmin flag (to be implemented)
    
    const settings = await db.query.platformSettings.findFirst({
      where: eq(platformSettings.id, 'singleton'),
    });

    if (!settings) {
      // Initialize with defaults if not exists
      const [newSettings] = await db.insert(platformSettings).values({
        id: 'singleton',
        signupBonusAmount: '1.00',
      }).returning();
      return NextResponse.json(newSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch platform settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PATCH: Update settings
export async function PATCH(req: Request) {
  try {
    const adminId = await requireAuth();
    // TODO: Check isAdmin flag (to be implemented)
    
    const { signupBonusAmount } = await req.json();

    // Validation
    const amount = parseFloat(signupBonusAmount);
    if (isNaN(amount) || amount < 0 || amount > 1000) {
      return NextResponse.json(
        { error: 'Signup bonus amount must be between 0.00 and 1000.00' },
        { status: 400 }
      );
    }

    const formattedAmount = amount.toFixed(2);

    const [updated] = await db
      .update(platformSettings)
      .set({
        signupBonusAmount: formattedAmount,
        updatedAt: new Date(),
        updatedBy: adminId,
      })
      .where(eq(platformSettings.id, 'singleton'))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update platform settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
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

// Fast, cheap model for title generation (not used for grading)
export function getTitleGenerationModel() {
  // Use a fast, cost-effective model like gpt-3.5-turbo or claude-haiku
  // OpenRouter supports multiple providers, choose based on cost/speed
  return openrouter('openai/gpt-3.5-turbo'); // Fast and cheap (~$0.001 per title)
}
```

### Title Generation API

**Purpose:** Generate concise essay titles (max 6 words) based on essay content and instructions.

**Model Choice:** Uses a fast, cheap model (GPT-3.5 Turbo) instead of the grading models (Grok-4) to minimize cost and latency.

**Implementation:**

```typescript
// src/app/api/essays/generate-title/route.ts
import { generateText } from 'ai';
import { getTitleGenerationModel } from '@/libs/AI';
import { requireAuth } from '@/libs/Clerk';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const { instructions, content } = await req.json();

    // Validate inputs
    if (!instructions && !content) {
      return NextResponse.json(
        { error: 'Instructions or essay content required' },
        { status: 400 }
      );
    }

    // Build prompt for title generation
    const prompt = `Generate a concise essay title (maximum 6 words) based on the following assignment instructions and essay content. The title should be descriptive and academic.

Assignment Instructions: ${instructions || 'Not provided'}

Essay Content (first 500 words): ${content ? content.substring(0, 500) : 'Not provided'}

Title (max 6 words):`;

    // Generate title using fast, cheap model
    const result = await generateText({
      model: getTitleGenerationModel(),
      prompt,
      maxTokens: 20, // Titles are short, limit tokens for cost savings
      temperature: 0.7, // Some creativity but not too random
    });

    // Extract title and ensure it's max 6 words
    const generatedTitle = result.text.trim();
    const words = generatedTitle.split(/\s+/);
    const title = words.slice(0, 6).join(' ');

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Title generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    );
  }
}
```

**Client Usage:**

```typescript
// In essay submission form component
async function handleGenerateTitle() {
  try {
    const response = await fetch('/api/essays/generate-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instructions: assignmentBrief.instructions,
        content: essayContent,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate title');
    }

    const { title } = await response.json();
    setTitle(title); // Populate title field
  } catch (error) {
    // Show error: "Could not generate title. Please enter a title manually."
  }
}
```

**Cost Analysis:**
- GPT-3.5 Turbo: ~$0.001 per title generation
- Negligible cost compared to grading ($0.10-0.15 per essay)
- No credit deduction (free feature for users)

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

**Implementation Pattern:**
```typescript
// src/utils/documentParser.ts
import { mistralClient } from '@/libs/Mistral';

export async function parseDocument(file: File): Promise<string> {
  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/avif',
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Unsupported file type. Please use PDF, DOCX, PNG, JPEG, or AVIF.');
  }

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Process with Mistral Document AI
  // Note: Adjust API call based on actual Mistral SDK/API
  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: file.type }));

  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Document processing failed' }));
    throw new Error(error.error || 'Document processing failed');
  }

  const result = await response.json();
  
  // Extract markdown text from response
  // Response format: { text_content: string } or { text: string }
  const markdown = result.text_content || result.text || '';

  if (!markdown || markdown.trim().length === 0) {
    throw new Error('No text could be extracted from this document. Please ensure the document contains readable text.');
  }

  return markdown;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Usage: Validate extracted text
export async function parseAndValidateDocument(file: File): Promise<string> {
  const text = await parseDocument(file);
  const wordCount = countWords(text);
  
  if (wordCount === 0) {
    throw new Error('No text could be extracted. Please ensure your document contains readable text.');
  }
  
  if (wordCount < 50) {
    throw new Error(`Essay must be at least 50 words. Current: ${wordCount} words.`);
  }
  
  if (wordCount > 50000) {
    throw new Error(`Essay exceeds 50,000 word limit. Current: ${wordCount} words. Please shorten your essay.`);
  }
  
  return text;
}
```

**Alternative: Using Mistral SDK (if available)**

If the Mistral SDK provides a cleaner API:

```typescript
// src/utils/documentParser.ts
import { mistralClient } from '@/libs/Mistral';

export async function parseDocument(file: File): Promise<string> {
  // Validate file type (same as above)
  // ...

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Process with Mistral Document AI SDK
  // Note: Adjust method name based on actual SDK API
  const result = await mistralClient.ocr.process(buffer, {
    output_type: 'markdown', // Request markdown output
  });

  const markdown = result.text_content || result.text || '';

  if (!markdown || markdown.trim().length === 0) {
    throw new Error('No text could be extracted from this document.');
  }

  return markdown;
}
```

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
- Parsing failures → Show error: "Could not extract text from this file. Please check the format or paste text directly."
- File too large → Show error: "File exceeds 10 MB limit. Please use a smaller file."
- Invalid format → Show error: "Unsupported file type. Please use PDF, DOCX, PNG, JPEG, or AVIF."
- No text extracted → Show error: "No text could be extracted from this document. Please ensure the document contains readable text."
- OCR processing failed → Show error: "Failed to process document. Please try again or paste text directly."

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

**Shared endpoint for both essay document parsing and image uploads (Instructions/Rubric):**

```typescript
// src/app/api/ocr/process/route.ts
import { mistralClient } from '@/libs/Mistral';
import { requireAuth } from '@/libs/Clerk';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (supports PDF, DOCX, and images)
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/avif',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please use PDF, DOCX, PNG, JPEG, or AVIF.' },
        { status: 400 }
      );
    }

    // Validate file size (10 MB limit)
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File exceeds 10 MB limit. Please use a smaller file.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process with Mistral Document AI
    // Note: Mistral SDK may require file path or base64, check SDK docs
    // For now, using direct API call pattern
    const uploadFormData = new FormData();
    uploadFormData.append('file', new Blob([buffer], { type: file.type }));

    const response = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: uploadFormData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Document processing failed' }));
      throw new Error(error.error || 'Document processing failed');
    }

    const result = await response.json();
    
    // Extract markdown text from response
    // Response format: { text_content: string } or { text: string }
    const markdown = result.text_content || result.text || '';

    if (!markdown || markdown.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text could be extracted from this document. Please ensure the document contains readable text.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ markdown });
  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process document' },
      { status: 500 }
    );
  }
}
```

### Alternative: Using Mistral SDK (if available)

If the Mistral SDK provides a cleaner API:

```typescript
// src/app/api/ocr/process/route.ts
import { mistralClient } from '@/libs/Mistral';
import { requireAuth } from '@/libs/Clerk';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type and size (same as above)
    // ...

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process with Mistral Document AI SDK
    // Note: Adjust method name based on actual SDK API
    const result = await mistralClient.ocr.process(buffer, {
      output_type: 'markdown', // Request markdown output
    });

    const markdown = result.text_content || result.text || '';

    if (!markdown || markdown.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text could be extracted from this document.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ markdown });
  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
```

### Client-Side Usage

**For Instructions/Rubric document uploads:**
```typescript
// In essay submission form component
async function handleDocumentUpload(file: File, field: 'instructions' | 'rubric') {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/ocr/process', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process document');
    }

    const { markdown } = await response.json();
    
    // Populate the field with extracted markdown
    if (field === 'instructions') {
      setInstructions(markdown);
    } else if (field === 'rubric') {
      setCustomRubric(markdown);
    }
  } catch (error) {
    // Show error: "Failed to process document. Please try again or paste text directly."
    console.error('Document processing error:', error);
  }
}
```

**For Essay content file uploads:**
```typescript
// In essay submission form component (Tab 3)
async function handleEssayFileUpload(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/ocr/process', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process document');
    }

    const { markdown } = await response.json();
    
    // Validate word count (50-50,000 words)
    const wordCount = markdown.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    if (wordCount < 50) {
      throw new Error(`Essay must be at least 50 words. Current: ${wordCount} words.`);
    }
    
    if (wordCount > 50000) {
      throw new Error(`Essay exceeds 50,000 word limit. Current: ${wordCount} words.`);
    }
    
    setEssayContent(markdown);
    setWordCount(wordCount);
  } catch (error) {
    // Show error message to user
    console.error('Document processing error:', error);
  }
}
```

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
