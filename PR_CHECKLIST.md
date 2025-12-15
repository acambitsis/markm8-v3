# MarkM8 v3 PR Review Checklist

**Purpose:** Ensure PRs align with ixartz/SaaS-Boilerplate patterns and MarkM8 v3 architecture.

---

## 1. Architecture & File Structure

**Follow boilerplate conventions:**

- ✅ Feature code goes in `src/features/[feature-name]/`
  - Examples: `src/features/essays/`, `src/features/grading/`, `src/features/credits/`
  - Group related components, hooks, utilities together
- ✅ Third-party configs go in `src/libs/`
  - Examples: `src/libs/AI.ts`, `src/libs/Stripe.ts`, `src/libs/Inngest.ts`, `src/libs/DB.ts`
  - ONE file per service, exports configured client
- ✅ Database schemas go in `src/models/Schema.ts`
  - Single source of truth for all tables
  - Use Drizzle ORM syntax
- ✅ Routes follow i18n pattern: `src/app/[locale]/(auth|unauth)/`
  - `(auth)/` = protected routes (dashboard, submit, grades)
  - `(unauth)/` = public routes (landing page)
- ✅ API routes in `src/app/api/`
  - Webhooks: `src/app/api/webhooks/[provider]/`
  - Inngest: `src/app/api/inngest/`
  - SSE: `src/app/api/grades/[id]/stream/`
- ✅ Shared UI components in `src/components/ui/` (Shadcn pattern)
- ✅ Utilities in `src/utils/` (keep boilerplate helpers)

**Don't:**

- ❌ Create custom folder structures outside these patterns
- ❌ Mix feature code with lib code
- ❌ Put business logic in API routes (use features/ instead)
- ❌ Create multiple schema files (use single Schema.ts)

---

## 2. Database & Data Layer

**User-scoped resources only:**

- ✅ ALL resources have `userId` foreign key
  - `essays.userId`, `grades.userId`, `credits.userId`, `creditTransactions.userId`
- ✅ Use Drizzle relations for type-safe joins
  ```typescript
  export const essaysRelations = relations(essays, ({ one }) => ({
    user: one(users, { fields: [essays.userId], references: [users.id] }),
  }));
  ```
- ✅ Query with user context:
  ```typescript
  const userEssays = await db.query.essays.findMany({
    where: eq(essays.userId, userId)
  });
  ```
- ✅ Essays support drafts: `status: 'draft' | 'submitted'`
  - Drafts have nullable/partial data (assignmentBrief, rubric, content)
  - Submitted essays have complete validated data
- ✅ Grades support 1-to-many with essays (for regrading)
  - Multiple grade records per essay
  - Each grade has `status: 'queued' | 'processing' | 'complete' | 'failed'`

**Don't:**

- ❌ Add organization tables (not in current scope, see PHASE_2_MIGRATION.md)
- ❌ Use Clerk Organizations (only Clerk auth)
- ❌ Create global resources without userId
- ❌ Use separate `essayDrafts` table (use `essays.status = 'draft'`)

---

## 3. Next.js 15 / React 19 Patterns

**Async Request APIs (ALWAYS await these):**

```typescript
// ✅ Correct - await in Next.js 15
const cookieStore = await cookies();
const token = cookieStore.get('token');

const headersList = await headers();
const { id } = await params;

// ❌ Wrong - will error in Next.js 15
const token = cookies().get('token'); // Missing await
```

**Form Actions (replace onSubmit):**

```typescript
// ✅ Correct - Server Actions
async function submitAction(formData: FormData) {
  'use server';
  const title = formData.get('title') as string;
  // ... validation and processing
}

<form action={submitAction}>
  <button type="submit">Submit</button>
</form>

// ❌ Wrong - client-side state management
const [loading, setLoading] = useState(false);
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  // ... manual fetch logic
};
<form onSubmit={handleSubmit}>
```

**Ref as Prop (no forwardRef):**

```typescript
// ✅ Correct - React 19
function Input({ ref, ...props }: Props & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}

// ❌ Wrong - React 18 pattern
const Input = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <input ref={ref} {...props} />;
});
```

**Don't:**

- ❌ Use React 18 patterns (forwardRef, manual loading states)
- ❌ Use client-side form state when Server Actions work
- ❌ Forget to await Next.js 15 async APIs

---

## 4. AI Grading (Inngest + SSE)

**AI grading runs async via Inngest (ONLY async operation in the app):**

- ✅ API route validates + queues job instantly (<500ms):
  ```typescript
  // src/app/api/essays/submit/route.ts
  const grade = await db.insert(grades).values({
    essayId, userId, status: 'queued'
  }).returning();

  await inngest.send({ name: 'essay/grade', data: { gradeId: grade.id } });

  return NextResponse.json({ gradeId: grade.id }); // Return immediately
  ```
- ✅ Inngest function handles processing:
  ```typescript
  // inngest/functions/grade-essay.ts
  export const gradeEssay = inngest.createFunction(
    { id: 'grade-essay' },
    { event: 'essay/grade' },
    async ({ event, step }) => {
      // Step 1: Fetch & validate
      const grade = await step.run('fetch-grade', async () => { ... });

      // Step 2: Call AI (uses Vercel AI SDK)
      const results = await step.run('call-ai', async () => { ... });

      // Step 3: Save results + deduct credits (atomic)
      await step.run('save-results', async () => { ... });
    }
  );
  ```
- ✅ SSE for real-time status updates:
  ```typescript
  // src/app/api/grades/[id]/stream/route.ts
  export async function GET(request: Request, { params }: { params: { id: string } }) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({ ... });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' }
    });
  }
  ```
- ✅ Client hook consumes SSE:
  ```typescript
  // src/hooks/useGradeStatus.ts
  export function useGradeStatus(gradeId: string) {
    const [status, setStatus] = useState('queued');

    useEffect(() => {
      const eventSource = new EventSource(`/api/grades/${gradeId}/stream`);
      eventSource.onmessage = (e) => setStatus(JSON.parse(e.data).status);
      return () => eventSource.close();
    }, [gradeId]);

    return { status };
  }
  ```

**Credits deducted AFTER grading completes:**

- ✅ Check credits at submission (validate user has enough)
- ✅ Deduct credits in Inngest AFTER AI call succeeds
- ✅ Use database transaction (atomic credit deduction + grade save)
- ✅ Refund credits if grading fails

**Don't:**

- ❌ Run AI calls synchronously in API routes (too slow, need retries)
- ❌ Deduct credits at submission time (wait for grading completion)
- ❌ Use WebSockets for grade status (use SSE instead)
- ❌ Skip credit validation before queuing job
- ❌ Forget atomic transactions for credit operations
- ❌ Use Inngest for non-AI operations (Stripe webhooks, signups, etc. are synchronous)

---

## 5. AI Integration (Vercel AI SDK)

**Use Vercel AI SDK for ALL AI calls:**

- ✅ Configure in `src/libs/AI.ts`:
  ```typescript
  import { createOpenAI } from '@ai-sdk/openai';

  export const openrouter = createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  });
  ```
- ✅ Use `generateText` for grading:
  ```typescript
  import { generateText } from 'ai';
  import { openrouter } from '@/libs/AI';

  const result = await generateText({
    model: openrouter('grok-4'), // OpenRouter model ID (not anthropic/grok-4)
    messages: [{ role: 'user', content: prompt }],
  });
  ```
- ✅ Run 3 models in parallel for consensus:
  ```typescript
  const [result1, result2, result3] = await Promise.all([
    generateText({ model: openrouter('grok-4'), ... }),
    generateText({ model: openrouter('grok-4'), ... }),
    generateText({ model: openrouter('grok-4'), ... }),
  ]);
  ```
- ✅ Type-safe responses with Zod:
  ```typescript
  import { z } from 'zod';

  const GradeSchema = z.object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
  });

  const result = await generateObject({
    model: openrouter('grok-4'),
    schema: GradeSchema,
    prompt: '...',
  });
  ```

**Don't:**

- ❌ Use raw fetch calls to AI providers
- ❌ Hard-code provider-specific logic
- ❌ Skip type validation on AI responses
- ❌ Use Bun-specific AI imports (stay Node.js compatible)

---

## 6. Styling (Tailwind 4)

**CSS-first config (@theme in globals.css):**

```css
/* ✅ Correct - Tailwind 4 in src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --font-family-sans: 'Inter', system-ui;
  --breakpoint-tablet: 768px;
}

/* Dark mode using native CSS */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #60a5fa;
  }
}
```

**Don't:**

- ❌ Create `tailwind.config.ts` (not used in Tailwind 4)
- ❌ Use Tailwind 3 patterns (extend, theme object in config)
- ❌ Skip dark mode support (use native CSS media queries)

---

## 7. Security & Validation

**Input validation:**

- ✅ Validate ALL user input (use Zod schemas)
- ✅ Server-side validation even if client validates
- ✅ Sanitize content before storing (no XSS)
- ✅ Validate file uploads (type, size, content)
  ```typescript
  const FileUploadSchema = z.object({
    type: z.enum(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
    size: z.number().max(10 * 1024 * 1024), // 10MB
  });
  ```

**Auth & authorization:**

- ✅ Use Clerk's `auth()` helper in Server Components:
  ```typescript
  import { auth } from '@clerk/nextjs/server';

  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  ```
- ✅ Verify user owns resource before mutations:
  ```typescript
  const essay = await db.query.essays.findFirst({
    where: and(eq(essays.id, essayId), eq(essays.userId, userId))
  });
  if (!essay) throw new Error('Not found');
  ```
- ✅ Use middleware for route protection:
  ```typescript
  // src/middleware.ts
  export default clerkMiddleware((auth, req) => {
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      auth().protect();
    }
  });
  ```

**Environment variables:**

- ✅ Validate env vars at startup (use Zod or similar)
- ✅ Never expose secrets to client (no NEXT_PUBLIC_ for keys)
- ✅ Use .env.local for local dev (gitignored)

**Don't:**

- ❌ Trust client-side validation alone
- ❌ Skip ownership checks on mutations
- ❌ Commit secrets to git
- ❌ Use weak random IDs (use nanoid or UUID)

---

## 8. Performance & Developer Experience

**Bun best practices:**

- ✅ Use `bun --bun run dev` (forces Bun runtime)
- ✅ Use Node.js-compatible APIs (avoid Bun-specific imports)
  ```typescript
  // ✅ Compatible
  import { readFile } from 'fs/promises';

  // ❌ Bun-specific
  import { file } from 'bun';
  ```
- ✅ Leverage Bun speed for tests: `bun test`
- ✅ Use Bun for scripts: `bun run db:push`

**Database performance:**

- ✅ Use indexes on foreign keys and query filters:
  ```typescript
  export const essays = pgTable('essays', {
    userId: text('user_id').notNull(),
    status: text('status').notNull(),
  }, (table) => ({
    userIdIdx: index('essays_user_id_idx').on(table.userId),
    statusIdx: index('essays_status_idx').on(table.status),
  }));
  ```
- ✅ Use database transactions for multi-step operations
- ✅ Paginate large queries (use limit + offset)

**Code quality:**

- ✅ Use TypeScript strict mode
- ✅ Prefer named exports over default exports
- ✅ Write descriptive variable names (no single letters except iterators)
- ✅ Add comments for complex business logic only (code should be self-documenting)

**Don't:**

- ❌ Use Bun-specific APIs that lock you in
- ❌ Skip database indexes on high-traffic queries
- ❌ Over-comment obvious code
- ❌ Use `any` type (use `unknown` + type guards)

---

## 9. Testing & Quality Assurance

**What to test:**

- ✅ Server Actions (form submissions, mutations)
- ✅ API routes (webhooks, SSE endpoints)
- ✅ Inngest functions (grading logic, credit operations)
- ✅ Database queries (complex joins, transactions)
- ✅ Utilities (parsing, validation, formatting)

**Testing patterns:**

```typescript
// ✅ Use Bun's built-in test runner
import { test, expect } from 'bun:test';

test('creates essay draft', async () => {
  const draft = await createDraft(userId, { title: 'Test' });
  expect(draft.status).toBe('draft');
});

// ✅ Use test database (Neon branching)
// DATABASE_URL=postgresql://test-branch...
```

**Don't:**

- ❌ Skip tests for critical paths (payment, grading, credits)
- ❌ Test implementation details (test behavior, not internals)
- ❌ Use production database for tests

---

## 10. Quick PR Review Questions

Before approving, verify:

- [ ] **Structure**: Files in correct folders? (`features/`, `libs/`, `models/`, `app/`)
- [ ] **User-Scoped**: No organization tables? All resources user-scoped?
- [ ] **Async**: AI grading uses Inngest? Credits deducted after completion?
- [ ] **Next.js 15**: Uses `await` for cookies/headers/params?
- [ ] **React 19**: Uses Server Actions instead of manual form state?
- [ ] **AI SDK**: Uses Vercel AI SDK, not raw fetch?
- [ ] **Tailwind 4**: Uses @theme in CSS, not tailwind.config.ts?
- [ ] **Security**: Input validated? User ownership checked?
- [ ] **Types**: No `any` types? Zod schemas for validation?
- [ ] **Tests**: Critical paths covered?
- [ ] **Bun**: Node.js-compatible APIs? No Bun lock-in?
- [ ] **Database**: Indexes on foreign keys? Transactions for multi-step ops?

---

## 11. Common Mistakes to Catch

**Architecture violations:**

- ❌ Adding `organizations` table (not in scope)
- ❌ Using Clerk Organizations
- ❌ Creating resources without `userId`

**AI grading violations:**

- ❌ Running AI calls in API routes (synchronously)
- ❌ Deducting credits before grading completes
- ❌ Missing credit refund on failure
- ❌ Using Inngest for non-AI operations (unnecessary complexity)

**Next.js 15 violations:**

- ❌ Forgetting `await` on cookies/headers/params
- ❌ Using React 18 patterns (forwardRef)

**Security violations:**

- ❌ Missing input validation
- ❌ Skipping ownership checks
- ❌ Exposing secrets via NEXT_PUBLIC_

**Performance violations:**

- ❌ Missing database indexes
- ❌ N+1 queries (use relations)
- ❌ Loading full datasets without pagination

---

## Summary

**This checklist ensures:**

1. ✅ **Boilerplate alignment** - Leverage ixartz structure effectively
2. ✅ **Simple architecture** - User-scoped only, no premature complexity
3. ✅ **Modern patterns** - Next.js 15, React 19, Tailwind 4 done right
4. ✅ **Async grading** - Inngest + SSE for reliable AI background jobs
5. ✅ **Type safety** - Drizzle + Zod + Vercel AI SDK
6. ✅ **Security** - Validation, auth, ownership checks
7. ✅ **Performance** - Indexes, transactions, Bun speed
8. ✅ **Maintainability** - Clean structure, testable code

**Use this checklist on EVERY PR to maintain consistency and quality.**
