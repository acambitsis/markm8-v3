---
name: pr-check-data
description: Validates Convex schema, queries, mutations, indexes, and data handling patterns in PR changes
tools: Read, Grep, Glob, Bash
---

# PR Validation: Convex Data Patterns

**Purpose:** Validate that Convex schema, queries, mutations, and data handling follow project patterns.

**When to use:** Run on PRs that touch Convex schema, functions, or data operations.

---

## Confidence Levels

- **DEFINITE** — Clear violation that will cause bugs or data issues
- **LIKELY** — Pattern suggests violation; reviewer should verify
- **POSSIBLE** — May be intentional design choice; flag for review

## Exception Annotations

```typescript
// @pr-check-ignore: no-index — Small table, full scan acceptable
const results = await ctx.db.query('settings').collect();
```

---

## Instructions for Validator

1. Get the list of changed files in this PR
2. Identify files involving: schema changes, Convex functions, data operations
3. Apply the principles below to each relevant file
4. Report violations with confidence level and file:line reference

---

## Principle 1: Schema Location

**Core Principle:** All Convex schema definitions must be in `convex/schema.ts`.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Schema defined outside schema.ts
// File: convex/essays.ts
import { defineTable } from 'convex/server';
const essays = defineTable({ ... });  // Wrong location!

// CORRECT — All schema in one file
// File: convex/schema.ts
import { defineSchema, defineTable } from 'convex/server';

export default defineSchema({
  essays: defineTable({ ... }),
});
```

### Detection Heuristic

1. Search for `defineTable(`, `defineSchema(` outside of `convex/schema.ts`
2. Any match is a DEFINITE violation

---

## Principle 2: User-Owned Document Structure

**Core Principle:** Documents representing user-owned resources must have required fields and proper indexes.

### How to Identify User-Owned Documents

A document is "user-owned" if it has a `userId` field referencing the users table:

```typescript
userId: v.id('users'),
```

### Required Fields for User-Owned Documents

```typescript
// DEFINITE VIOLATION — User-owned document missing required fields
essays: defineTable({
  userId: v.id('users'),
  title: v.string(),
  // Missing: indexes for user queries!
}),

// CORRECT — Proper structure with indexes
essays: defineTable({
  userId: v.id('users'),
  status: v.union(v.literal('draft'), v.literal('submitted'), v.literal('archived')),
  // ... business fields ...
  deletedAt: v.optional(v.number()),  // For soft delete
})
  .index('by_user_id', ['userId'])
  .index('by_user_status', ['userId', 'status']),
```

### Detection Heuristic

For documents with `userId` field:
1. Check for index including `userId` (for efficient user-scoped queries)
2. Check for `deletedAt` if soft-delete is used elsewhere
3. Missing index = LIKELY violation (may be intentional for small tables)

### Exempt Documents (no userId = not user-owned)

```typescript
// These are lookup/config documents — exempt from user-owned rules
platformSettings: defineTable({ ... }),  // No userId = OK
```

---

## Principle 3: Index Strategy

**Core Principle:** Queries should use indexes, not full table scans.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Query without index
export const getEssays = query({
  handler: async (ctx) => {
    return await ctx.db.query('essays')
      .filter(q => q.eq(q.field('status'), 'submitted'))  // No index!
      .collect();
  },
});

// CORRECT — Using index
export const getEssays = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    return await ctx.db.query('essays')
      .withIndex('by_user_status', q => q.eq('userId', userId).eq('status', 'submitted'))
      .collect();
  },
});
```

### Index Best Practices

```typescript
// Composite indexes — order matters!
// Query: userId + status
.index('by_user_status', ['userId', 'status'])  // Can query userId alone or userId + status

// NOT: status first (can't efficiently query just userId)
.index('by_status_user', ['status', 'userId'])  // Only efficient for status-first queries
```

### Detection Heuristic

1. Find `.filter()` on queries without preceding `.withIndex()`
2. Flag as LIKELY — may be acceptable for small tables or rare queries
3. Check schema has appropriate index for the filter conditions

---

## Principle 4: Soft Delete Filtering

**Core Principle:** Queries on soft-deletable documents must filter out deleted records unless explicitly fetching them.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Not filtering soft-deleted records
export const getEssays = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    return await ctx.db.query('essays')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      // Missing: filter for deletedAt
      .collect();
  },
});

// CORRECT — Filter soft-deleted records
export const getEssays = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    return await ctx.db.query('essays')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .filter(q => q.eq(q.field('deletedAt'), undefined))
      .collect();
  },
});

// CORRECT — Explicitly fetching deleted (annotated)
// @pr-check-ignore: include-deleted — Admin recovery endpoint
export const getDeletedEssays = query({ ... });
```

### Detection Heuristic

1. Check if queried document type has `deletedAt` field (check schema.ts)
2. If yes, check if query includes filter for `deletedAt === undefined`
3. Missing = LIKELY violation (may be intentional for admin/recovery)

---

## Principle 5: Bounded Queries

**Core Principle:** List queries must be bounded to prevent unbounded result sets.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Unbounded collect
export const getAllEssays = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    return await ctx.db.query('essays')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .collect();  // Could return thousands!
  },
});

// CORRECT — Use take() for limits
export const getRecentEssays = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    return await ctx.db.query('essays')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .order('desc')
      .take(10);  // Bounded!
  },
});

// CORRECT — Pagination pattern
export const getEssaysPaginated = query({
  args: { page: v.number(), pageSize: v.number() },
  handler: async (ctx, { page, pageSize }) => {
    const userId = await requireAuth(ctx);
    const essays = await ctx.db.query('essays')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .collect();  // For pagination, collect then slice

    const start = (page - 1) * pageSize;
    return {
      essays: essays.slice(start, start + pageSize),
      total: essays.length,
    };
  },
});
```

### Detection Heuristic

1. Find `.collect()` calls without `.take()` limit
2. Flag as LIKELY — may be acceptable for known-small datasets
3. Valid exceptions: user's drafts (typically < 5), config data

---

## Principle 6: Mutation Atomicity

**Core Principle:** Related operations that must succeed or fail together should be in a single mutation.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Related operations split across functions
// Client code:
await deductCredits();  // If this succeeds...
await createGrade();    // ...but this fails, credits gone!

// CORRECT — Single atomic mutation
export const submit = mutation({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    // All in one mutation = atomic
    await ctx.db.patch(creditsId, { balance: newBalance });
    await ctx.db.patch(essayId, { status: 'submitted' });
    const gradeId = await ctx.db.insert('grades', { ... });

    return { gradeId };
  },
});
```

### Convex Atomicity Rules

- **Mutations** are atomic — all operations succeed or all fail
- **Actions** are NOT atomic — each `ctx.runMutation()` is separate
- **Queries** are point-in-time consistent reads

### Detection Heuristic

1. Look for multiple `useMutation()` calls in sequence in client code
2. If they modify related data (credits + essays), should be combined
3. Flag as LIKELY — may be intentional for independent operations

---

## Principle 7: Credit Operation Flow

**Core Principle:** Credit operations follow a consistent pattern for safety.

### The Credit Flow

```
Submission:
  balance - 1.00 (deduct at submission, atomic with essay update)

Success:
  No change (credit already deducted)

Failure:
  balance + 1.00 (refund in action's catch block)
```

### Detection Pattern

```typescript
// CORRECT — Credit deduction at submission (in mutation)
export const submit = mutation({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    // Get current balance
    const credits = await ctx.db.query('credits')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .unique();

    if (!credits || parseFloat(credits.balance) < 1.00) {
      throw new Error('Insufficient credits');
    }

    // Deduct atomically
    await ctx.db.patch(credits._id, {
      balance: subtractDecimal(credits.balance, '1.00'),
    });

    // Create grade in same mutation
    const gradeId = await ctx.db.insert('grades', { ... });
    return { gradeId };
  },
});

// CORRECT — Refund on failure (in action)
export const processGrade = internalAction({
  handler: async (ctx, { gradeId }) => {
    try {
      // ... AI processing ...
      await ctx.runMutation(internal.grades.complete, { gradeId });
    } catch (error) {
      // Refund credit on failure
      await ctx.runMutation(internal.grades.fail, { gradeId });
      // fail mutation includes: balance + 1.00
    }
  },
});
```

### Detection Heuristic

1. Find credit balance modifications
2. Check they follow the deduct-at-submission, refund-on-failure pattern
3. Verify refund logic exists in action error handlers

---

## Principle 8: Validators Match Schema

**Core Principle:** Argument validators should match schema field types.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Validator doesn't match schema
// Schema: status: v.union(v.literal('draft'), v.literal('submitted'))
export const updateStatus = mutation({
  args: {
    status: v.string(),  // Should be union, not string!
  },
  handler: async (ctx, { status }) => { ... },
});

// CORRECT — Validator matches schema
export const updateStatus = mutation({
  args: {
    status: v.union(v.literal('draft'), v.literal('submitted')),
  },
  handler: async (ctx, { status }) => { ... },
});
```

### Reusable Validators

```typescript
// CORRECT — Define validators once in schema.ts or shared file
const statusValidator = v.union(
  v.literal('draft'),
  v.literal('submitted'),
  v.literal('archived'),
);

// Reuse in functions
args: { status: statusValidator }
```

### Detection Heuristic

1. Compare function `args` validators with schema field definitions
2. Looser validators (e.g., `v.string()` vs `v.union()`) = LIKELY violation
3. May be intentional for partial updates or flexibility

---

## Principle 9: Action Database Access

**Core Principle:** Actions must use `ctx.runQuery()` and `ctx.runMutation()` for database access, not direct `ctx.db`.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Direct db access in action
export const processGrade = internalAction({
  handler: async (ctx, { gradeId }) => {
    const grade = await ctx.db.get(gradeId);  // WRONG! Actions can't use ctx.db
    // ...
  },
});

// CORRECT — Use internal queries/mutations
export const processGrade = internalAction({
  handler: async (ctx, { gradeId }) => {
    const grade = await ctx.runQuery(internal.grades.getInternal, { gradeId });
    // ...
    await ctx.runMutation(internal.grades.complete, { gradeId, results });
  },
});
```

### Detection Heuristic

1. Find `internalAction` or `action` definitions
2. Check for `ctx.db` usage — always a DEFINITE violation
3. Must use `ctx.runQuery()` and `ctx.runMutation()` instead

---

## Principle 10: Decimal Precision

**Core Principle:** Credit amounts must be stored as strings and use decimal helpers.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Using number for credits
balance: credits.balance - 1.0,  // Floating point errors!

// DEFINITE VIOLATION — Direct string arithmetic
balance: (parseFloat(credits.balance) - 1.0).toString(),  // Precision loss!

// CORRECT — Use decimal helpers
import { subtractDecimal, addDecimal, isGreaterOrEqual } from './lib/decimal';

balance: subtractDecimal(credits.balance, '1.00'),
// Returns: "2.50" from "3.50" - "1.00"
```

### Detection Heuristic

1. Find operations on credit `balance` or `amount` fields
2. Check they use decimal helpers, not arithmetic operators
3. Flag as DEFINITE if using `+`, `-`, `*`, `/` directly on credit values

---

## Principle 11: Scheduled Function Patterns

**Core Principle:** Scheduled functions should be idempotent and handle duplicates.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Non-idempotent scheduled function
export const processGrade = internalAction({
  handler: async (ctx, { gradeId }) => {
    // No check if already processing!
    await ctx.runMutation(internal.grades.startProcessing, { gradeId });
    // ...
  },
});

// CORRECT — Check state before processing
export const processGrade = internalAction({
  handler: async (ctx, { gradeId }) => {
    const grade = await ctx.runQuery(internal.grades.getInternal, { gradeId });

    // Skip if already processed or processing
    if (grade.status !== 'queued') {
      console.log('Grade already processed, skipping');
      return;
    }

    await ctx.runMutation(internal.grades.startProcessing, { gradeId });
    // ...
  },
});
```

### Detection Heuristic

1. Find `ctx.scheduler.runAfter()` calls and their target functions
2. Check target functions verify state before mutating
3. Flag as LIKELY if no state check at beginning

---

## Output Format

```
## Data & Schema Validation Results

### DEFINITE Violations
- `convex/essays.ts:15` — [PRINCIPLE 9] Direct ctx.db access in action
- `convex/credits.ts:42` — [PRINCIPLE 10] Credit arithmetic without decimal helpers

### LIKELY Violations
- `convex/schema.ts:67` — [PRINCIPLE 2] User-owned document missing userId index
- `convex/essays.ts:30` — [PRINCIPLE 4] Query missing deletedAt filter

### POSSIBLE Violations
- `convex/grades.ts:55` — [PRINCIPLE 5] Unbounded collect, verify dataset is small

### Exceptions Found
- `convex/settings.ts:20` — @pr-check-ignore: no-index — "Config table, < 10 records" ✓ Valid

### Passed
- [list of files that passed]

### Summary
X files reviewed
- Y DEFINITE violations
- Z LIKELY violations
- W POSSIBLE violations
```

---

## Maintenance Notes

**When to update this agent:**
- New document types introduced → Verify Principle 2 handles them
- Credit flow changes → Update Principle 7
- New Convex features used → Add relevant principle

**This agent should NOT contain:**
- Hardcoded document names (derive from schema patterns)
- Hardcoded field lists (derive from document structure)
- Framework version-specific patterns (reference CLAUDE.md)
