---
name: pr-check-quality
model: opus
description: Validates React, Next.js, TypeScript, Tailwind, Convex, and code quality patterns in PR changes
tools: Read, Grep, Glob, Bash
---

# PR Validation: Code Quality & Framework Patterns

**Purpose:** Validate that code follows current framework patterns, TypeScript best practices, and Convex conventions.

**When to use:** Run on every PR to ensure code quality and consistency.

---

## Confidence Levels

- **DEFINITE** — Clear violation that will cause errors or type issues
- **LIKELY** — Pattern suggests suboptimal code; reviewer should verify. **Includes:** incorrect HTTP status codes, misleading error responses, wrong error semantics (e.g., returning 500/404 when 401 is appropriate)
- **POSSIBLE** — May be intentional; flag for discussion. Code is functionally correct but could be improved for clarity or debugging

## Exception Annotations

```typescript
// @pr-check-ignore: use-client — Needs client for third-party library integration
'use client';
```

---

## Instructions for Validator

1. Get the list of changed files in this PR
2. **Read CLAUDE.md first** to understand current framework versions and patterns
3. Apply the principles below, adjusted for the framework versions in use
4. Report violations with confidence level and file:line reference

**Important:** This agent defines *quality principles*. For version-specific syntax, always reference CLAUDE.md as the source of truth.

---

## Principle 1: Server Components by Default

**Core Principle:** Components should be server components unless they require client-side interactivity.

### What Requires 'use client'

A component MUST be a client component if it uses:
- React hooks (`useState`, `useEffect`, `useContext`, etc.)
- Convex hooks (`useQuery`, `useMutation`, `useAction`)
- Event handlers (`onClick`, `onChange`, `onSubmit`, etc.)
- Browser APIs (`window`, `document`, `localStorage`, etc.)
- Client-only libraries

### Detection Pattern

```typescript
// LIKELY VIOLATION — 'use client' without client-side features
'use client';
function StaticCard({ title, content }: Props) {
  return (
    <div>
      <h2>{title}</h2>
      <p>{content}</p>
    </div>
  );  // No hooks, no handlers → should be server component
}

// CORRECT — Server component (no directive needed)
function StaticCard({ title, content }: Props) {
  return (
    <div>
      <h2>{title}</h2>
      <p>{content}</p>
    </div>
  );
}

// CORRECT — Client component with valid reason (Convex hook)
'use client';
import { useQuery } from 'convex/react';
function UserCredits() {
  const credits = useQuery(api.credits.getBalance);
  return <div>{credits?.balance}</div>;
}
```

### Detection Heuristic

1. Find files with `'use client'` directive
2. Search for: `useState`, `useEffect`, `use[A-Z]`, `useQuery`, `useMutation`, `onClick`, `onChange`, `on[A-Z]`
3. If no client-side features found → LIKELY violation

---

## Principle 2: Convex Query Patterns

**Core Principle:** Use Convex queries correctly with proper loading and error handling.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Not handling undefined (loading state)
'use client';
function EssayList() {
  const essays = useQuery(api.essays.list);
  return <div>{essays.map(...)}</div>;  // essays could be undefined!
}

// CORRECT — Handle loading state
'use client';
function EssayList() {
  const essays = useQuery(api.essays.list);

  if (essays === undefined) {
    return <LoadingSpinner />;
  }

  return <div>{essays.map(...)}</div>;
}

// CORRECT — Using Convex's loading pattern
'use client';
function EssayList() {
  const essays = useQuery(api.essays.list);

  if (!essays) {
    return <Skeleton />;
  }

  return <div>{essays.map(...)}</div>;
}
```

### Detection Heuristic

1. Find `useQuery(api.` calls
2. Check if result is used directly without undefined check
3. Flag as DEFINITE if accessing `.map()`, `.length`, properties without guard

---

## Principle 3: Convex Mutation Patterns

**Core Principle:** Mutations should handle errors and optimistic updates appropriately.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Fire and forget mutation
'use client';
function SubmitButton() {
  const submit = useMutation(api.essays.submit);

  return (
    <button onClick={() => submit({})}>Submit</button>  // No error handling!
  );
}

// CORRECT — With error handling
'use client';
function SubmitButton() {
  const submit = useMutation(api.essays.submit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await submit({});
      router.push('/grades/...');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
      {error && <Alert>{error}</Alert>}
    </>
  );
}
```

### Detection Heuristic

1. Find `useMutation(api.` calls
2. Check if mutation is called without try/catch
3. Flag as LIKELY if no error handling visible
4. Exception: Internal operations where failure is acceptable

---

## Principle 4: Convex Function Structure

**Core Principle:** Convex functions should follow consistent patterns.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Handler accessing args not in validators
export const saveDraft = mutation({
  args: {
    content: v.optional(v.string()),
  },
  handler: async (ctx, { content, title }) => {  // title not in args!
    // ...
  },
});

// LIKELY VIOLATION — Not using requireAuth when needed
export const getUserEssays = query({
  handler: async (ctx) => {
    // Missing auth check for user-scoped data
    return ctx.db.query('essays').collect();
  },
});

// CORRECT — Proper structure
export const saveDraft = mutation({
  args: {
    content: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    // ...
  },
});
```

### Detection Heuristic

1. Check `args` in validators match destructured properties in handler
2. Check user-scoped queries/mutations call `requireAuth()`
3. Check return type validators exist for public queries (optional but recommended)

---

## Principle 5: Type Safety — No `any`

**Core Principle:** Avoid `any` type; use proper types, `unknown`, or type inference.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Using any
function processData(data: any) { ... }
const result: any = await someOperation();

// CORRECT — Proper type
function processData(data: EssayInput) { ... }

// CORRECT — Infer from Convex schema
import type { Doc } from '../convex/_generated/dataModel';
type Essay = Doc<'essays'>;

// CORRECT — Use Convex's Infer utility
import { Infer } from 'convex/values';
const assignmentBriefValidator = v.object({ ... });
type AssignmentBrief = Infer<typeof assignmentBriefValidator>;
```

### Detection Heuristic

1. Search for `: any`, `as any`, `<any>`
2. Each occurrence is a DEFINITE violation unless annotated
3. Exception: `// @pr-check-ignore: any — Third-party library types incomplete`

---

## Principle 6: Null Safety

**Core Principle:** Handle potential null/undefined values explicitly before use.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Ignoring potential null from Convex query
const essay = await ctx.db.get(essayId);
return essay.title;  // essay could be null!

// CORRECT — Explicit null check
const essay = await ctx.db.get(essayId);
if (!essay) {
  throw new Error('Essay not found');
}
return essay.title;

// CORRECT — With user-scoped check
const essay = await ctx.db.get(essayId);
if (!essay || essay.userId !== userId) {
  throw new Error('Essay not found');
}
```

### Detection Heuristic

1. Find `ctx.db.get()`, `.first()`, `.unique()` calls (return T | null)
2. Check if result is used without null check
3. Flag as DEFINITE if accessing properties without guard

---

## Principle 7: Type Inference from Convex

**Core Principle:** Derive types from Convex schema rather than duplicating.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Manually defined type that mirrors schema
interface Essay {
  _id: string;
  userId: string;
  title: string;
  content: string;
  _creationTime: number;
}

// CORRECT — Infer from Convex generated types
import type { Doc, Id } from '../convex/_generated/dataModel';
type Essay = Doc<'essays'>;
type EssayId = Id<'essays'>;

// CORRECT — Infer from validators
import { Infer } from 'convex/values';
const feedbackValidator = v.object({
  strengths: v.array(v.object({ title: v.string(), description: v.string() })),
});
type Feedback = Infer<typeof feedbackValidator>;
```

### Detection Heuristic

1. Find `interface` or `type` definitions in feature code
2. Check if they duplicate fields from Convex schema
3. Flag as LIKELY — may be intentional for API contracts or DTOs

---

## Principle 8: CSS Class Merging

**Core Principle:** Use the project's utility for merging CSS classes.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Manual string concatenation
<div className={`base-class ${isActive ? 'active' : ''} ${className}`} />

// LIKELY VIOLATION — Array join
<div className={['base-class', isActive && 'active', className].filter(Boolean).join(' ')} />

// CORRECT — Use cn() utility (check CLAUDE.md for import path)
import { cn } from '@/utils/Helpers';
<div className={cn('base-class', isActive && 'active', className)} />
```

### Detection Heuristic

1. Find template literals in `className={}` with conditionals
2. Find `.join(' ')` patterns for class names
3. Flag as LIKELY — should use `cn()` utility

---

## Principle 9: Performance Patterns

**Core Principle:** Avoid common performance anti-patterns.

### N+1 Query Detection (Convex)

```typescript
// LIKELY VIOLATION — Sequential queries in loop
export const getEssaysWithGrades = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const essays = await ctx.db.query('essays')
      .withIndex('by_user_status', q => q.eq('userId', userId))
      .collect();

    // N+1 queries!
    const results = [];
    for (const essay of essays) {
      const grade = await ctx.db.query('grades')
        .withIndex('by_essay_id', q => q.eq('essayId', essay._id))
        .first();
      results.push({ ...essay, grade });
    }
    return results;
  },
});

// CORRECT — Use Promise.all for parallel queries
export const getEssaysWithGrades = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const essays = await ctx.db.query('essays')
      .withIndex('by_user_status', q => q.eq('userId', userId))
      .collect();

    const essaysWithGrades = await Promise.all(
      essays.map(async (essay) => {
        const grade = await ctx.db.query('grades')
          .withIndex('by_essay_id', q => q.eq('essayId', essay._id))
          .first();
        return { ...essay, grade };
      }),
    );
    return essaysWithGrades;
  },
});
```

### Image Optimization

```typescript
// LIKELY VIOLATION — Unoptimized img tag
<img src="/logo.png" alt="Logo" />

// CORRECT — Framework image component
import Image from 'next/image';
<Image src="/logo.png" alt="Logo" width={100} height={100} />
```

### Detection Heuristic

1. Find `await` inside `for`/`forEach` loops in Convex functions → check if it's a query
2. Find `<img` tags in React components → should usually be `<Image`
3. Flag as LIKELY — may be intentional (small datasets, external images)

---

## Principle 10: Convex Action Patterns

**Core Principle:** Actions should handle errors gracefully and not leave inconsistent state.

### Detection Pattern

```typescript
// LIKELY VIOLATION — No error handling in action
export const processGrade = internalAction({
  args: { gradeId: v.id('grades') },
  handler: async (ctx, { gradeId }) => {
    await ctx.runMutation(internal.grades.startProcessing, { gradeId });

    const response = await fetch('...');  // Could fail!
    const data = await response.json();

    await ctx.runMutation(internal.grades.complete, { gradeId, data });
    // If complete fails, startProcessing already ran - inconsistent state!
  },
});

// CORRECT — Proper error handling with rollback
export const processGrade = internalAction({
  args: { gradeId: v.id('grades') },
  handler: async (ctx, { gradeId }) => {
    await ctx.runMutation(internal.grades.startProcessing, { gradeId });

    try {
      const response = await fetch('...');
      if (!response.ok) throw new Error('API failed');
      const data = await response.json();

      await ctx.runMutation(internal.grades.complete, { gradeId, data });
    } catch (error) {
      // Rollback: mark as failed and refund
      await ctx.runMutation(internal.grades.fail, {
        gradeId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
});
```

### Detection Heuristic

1. Find `internalAction` definitions
2. Check if there are multiple `ctx.runMutation` calls
3. Verify error handling exists that covers failure between mutations
4. Flag as LIKELY if no try/catch around external calls

---

## Principle 11: Error Handling

**Core Principle:** Handle errors appropriately without leaking internal details.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Exposing internal error details to client
export const submitEssay = mutation({
  handler: async (ctx, args) => {
    try {
      // ...
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);  // Leaking internals!
    }
  },
});

// CORRECT — Safe error message
export const submitEssay = mutation({
  handler: async (ctx, args) => {
    try {
      // ...
    } catch (err) {
      console.error('Submit failed:', err);  // Log internally
      throw new Error('Failed to submit essay. Please try again.');  // Safe message
    }
  },
});
```

### Detection Heuristic

1. Find `throw new Error` that includes `err.message` or `err.stack`
2. Find error messages that mention internal concepts (database, API keys, etc.)
3. Flag as LIKELY — may need context to determine if safe

---

## Principle 12: No Polling Patterns

**Core Principle:** Use Convex real-time subscriptions instead of polling. Polling wastes resources and provides worse UX.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Polling with setInterval
'use client';
function GradeStatus({ gradeId }) {
  const [grade, setGrade] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/grades/${gradeId}`);
      setGrade(await response.json());
    }, 5000);  // Polling every 5 seconds!
    return () => clearInterval(interval);
  }, [gradeId]);
}

// LIKELY VIOLATION — Recursive setTimeout polling
useEffect(() => {
  const poll = async () => {
    const data = await fetchGradeStatus(gradeId);
    setGrade(data);
    if (data.status === 'processing') {
      setTimeout(poll, 2000);  // Recursive polling!
    }
  };
  poll();
}, [gradeId]);

// CORRECT — Convex real-time subscription
'use client';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

function GradeStatus({ gradeId }) {
  const grade = useQuery(api.grades.getById, { id: gradeId });
  // Auto-updates when grade changes in database — no polling!

  if (!grade) return <Skeleton />;
  return <GradeDisplay grade={grade} />;
}
```

### Detection Heuristic

1. Find `setInterval` or recursive `setTimeout` patterns in React components
2. Check if the callback fetches data or calls APIs
3. Flag as LIKELY — may be legitimate (animations, debounce, non-Convex data)
4. DEFINITE if polling Convex data that could use `useQuery`

### Valid Exceptions (require annotation)

- External API polling where webhooks aren't available
- Animation timers or debounce patterns
- Countdown/timer UI components
- Rate-limited refresh buttons with manual trigger

```typescript
// @pr-check-ignore: polling — External API without webhook support
useEffect(() => {
  const interval = setInterval(checkExternalStatus, 30000);
  return () => clearInterval(interval);
}, []);
```

---

## Output Format

```
## Code Quality Validation Results

### DEFINITE Violations (Must Fix)
- `src/features/essays/SubmitForm.tsx:42` — [PRINCIPLE 5] Using 'any' type
- `convex/essays.ts:55` — [PRINCIPLE 6] Accessing property on potentially null query result

### LIKELY Violations (Should Fix)
- `src/components/StaticCard.tsx:10` — [PRINCIPLE 1] 'use client' with no visible client-side features
- `src/features/grading/Card.tsx:30` — [PRINCIPLE 8] Manual className concatenation, use cn()
- `convex/grades.ts:80` — [PRINCIPLE 10] Action with multiple mutations lacks error handling

### POSSIBLE Violations (Review)
- `src/features/dashboard/Widget.tsx:20` — [PRINCIPLE 1] 'use client' may be required for third-party library

### Exceptions Found
- `convex/grading.ts:15` — @pr-check-ignore: any — "OpenRouter API types" ✓ Valid

### Passed
- [list of files that passed]

### Summary
X files reviewed
- Y DEFINITE violations (must fix)
- Z LIKELY violations (should fix)
- W POSSIBLE violations (review)
```

---

## Exclusions

- **Admin pages** (`/admin/*`): No i18n required (English-only)

---

## Maintenance Notes

**When to update this agent:**
- Framework version upgrade → Update detection patterns to match new syntax
- New Convex patterns discovered → Add new principle
- Styling approach changed → Update Principle 8
- Real-time patterns evolve → Update Principle 12

**This agent should NOT contain:**
- Hardcoded framework version numbers (reference CLAUDE.md)
- Specific syntax that changes between versions (provide patterns, reference docs)
- Library-specific patterns (those should be documented in CLAUDE.md)
