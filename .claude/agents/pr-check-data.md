---
name: pr-check-data
description: Validates database schema, queries, API routes, transactions, and data handling patterns in PR changes
tools: Read, Grep, Glob
---

# PR Validation: Database & API Patterns

**Purpose:** Validate that database schema, queries, API routes, and data handling follow project patterns.

**When to use:** Run on PRs that touch database schema, API routes, or data operations.

---

## Confidence Levels

- **DEFINITE** — Clear violation that will cause bugs or data issues
- **LIKELY** — Pattern suggests violation; reviewer should verify
- **POSSIBLE** — May be intentional design choice; flag for review

## Exception Annotations

```typescript
// @pr-check-ignore: no-timestamps — Lookup table, immutable after creation
export const countries = pgTable('countries', { ... });
```

---

## Instructions for Validator

1. Get the list of changed files in this PR
2. Identify files involving: schema changes, database queries, API routes, transactions
3. Apply the principles below to each relevant file
4. Report violations with confidence level and file:line reference

---

## Principle 1: Schema Location

**Core Principle:** All database schema definitions must be in a single source of truth.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Schema defined outside Schema.ts
// File: src/features/essays/models.ts
export const essays = pgTable('essays', { ... });  // Wrong location!

// CORRECT — All schema in one file
// File: src/models/Schema.ts
export const essays = pgTable('essays', { ... });
```

### Detection Heuristic

1. Search for `pgTable(`, `pgEnum(` outside of `src/models/Schema.ts`
2. Any match is a DEFINITE violation

---

## Principle 2: User-Owned Table Structure

**Core Principle:** Tables representing user-owned resources must have standard columns for ownership, auditing, and soft-delete.

### How to Identify User-Owned Tables

A table is "user-owned" if it has a `userId` foreign key to the users table:

```typescript
userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull()
```

### Required Columns for User-Owned Tables

```typescript
// DEFINITE VIOLATION — User-owned table missing required columns
export const essays = pgTable('essays', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id).notNull(),
  title: text('title'),
  // Missing: createdAt, updatedAt
});

// CORRECT — All required columns present
export const essays = pgTable('essays', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  // ... business columns ...
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Detection Heuristic

For tables with `userId` column:
1. Check for `createdAt` and `updatedAt` columns
2. Check `userId` has `.notNull()` and `onDelete: 'cascade'`
3. Missing any = DEFINITE violation

### Exempt Tables (no userId = not user-owned)

```typescript
// These are lookup/config tables — exempt from user-owned rules
export const countries = pgTable('countries', { ... });  // No userId = OK
export const systemSettings = pgTable('system_settings', { ... });  // No userId = OK
```

---

## Principle 3: Naming Conventions

**Core Principle:** Consistent naming enables automated tooling and reduces cognitive load.

### Conventions

| Element | Convention | Detection |
|---------|------------|-----------|
| Table names | snake_case plural | `pgTable('essay')` → VIOLATION (singular) |
| Column names | snake_case | `userId` in DB → VIOLATION (use `user_id`) |
| Enum names | snake_case | `EssayStatus` → VIOLATION (use `essay_status`) |
| TypeScript exports | PascalCase | `export const essay = ...` → LIKELY violation |

### Detection Pattern

```typescript
// LIKELY VIOLATION — Singular table name
export const essay = pgTable('essay', { ... });  // Should be 'essays'

// LIKELY VIOLATION — camelCase in database
createdAt: timestamp('createdAt')  // Should be 'created_at'

// CORRECT
export const essays = pgTable('essays', {
  createdAt: timestamp('created_at'),
});
```

---

## Principle 4: Status Fields Use Enums

**Core Principle:** Status fields with finite values must use PostgreSQL enums for type safety.

### Detection Pattern

```typescript
// LIKELY VIOLATION — String for status field
status: text('status').notNull().default('draft'),  // Should be enum

// CORRECT — Enum for status
export const essayStatusEnum = pgEnum('essay_status', ['draft', 'submitted', 'archived']);
status: essayStatusEnum('status').notNull().default('draft'),
```

### Detection Heuristic

1. Find columns named `status`, `state`, `type` with `text()` type
2. If column has `.default()` with one of a few values, LIKELY should be enum
3. Flag as LIKELY — may be intentional for extensibility

---

## Principle 5: Query Builder Over Raw SQL

**Core Principle:** Use type-safe query builder unless raw SQL is necessary for performance.

### Detection Pattern

```typescript
// POSSIBLE VIOLATION — Raw SQL when query builder would work
await db.execute(sql`SELECT * FROM essays WHERE user_id = ${userId}`);

// CORRECT — Type-safe query builder
await db.query.essays.findMany({
  where: eq(essays.userId, userId),
});
```

### Detection Heuristic

1. Find `db.execute(sql` usages
2. Check if the query could be expressed with query builder
3. Flag as POSSIBLE — raw SQL may be intentional for complex queries

### Valid Uses of Raw SQL

- Complex joins not supported by query builder
- Performance-critical queries with specific optimizations
- Database-specific features (must be annotated)

---

## Principle 6: Soft Delete Filtering

**Core Principle:** Queries on soft-deletable tables must filter out deleted records unless explicitly fetching them.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Not filtering deleted records
const essays = await db.query.essays.findMany({
  where: eq(essays.userId, userId),
  // Missing: isNull(essays.deletedAt)
});

// CORRECT — Filter soft-deleted records
const essays = await db.query.essays.findMany({
  where: and(
    eq(essays.userId, userId),
    isNull(essays.deletedAt),
  ),
});

// CORRECT — Explicitly fetching deleted (annotated)
// @pr-check-ignore: include-deleted — Admin recovery endpoint
const essays = await db.query.essays.findMany({
  where: eq(essays.userId, userId),  // Intentionally including deleted
});
```

### Detection Heuristic

1. Check if queried table has `deletedAt` column (check Schema.ts)
2. If yes, check if query includes `isNull(table.deletedAt)`
3. Missing = LIKELY violation (may be intentional for admin/recovery)

---

## Principle 7: Transaction Atomicity

**Core Principle:** Operations that must succeed or fail together must be wrapped in a transaction.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Related operations outside transaction
await db.update(credits).set({ balance: sql`balance - 1.00` });
await db.update(essays).set({ status: 'submitted' });  // If this fails, credits gone!

// CORRECT — Atomic transaction
await db.transaction(async (tx) => {
  await tx.update(credits).set({ balance: sql`balance - 1.00` });
  await tx.update(essays).set({ status: 'submitted' });
});

// DEFINITE VIOLATION — Using db inside transaction instead of tx
await db.transaction(async (tx) => {
  await db.update(credits).set({ ... });  // Wrong! Should use tx
  await tx.update(essays).set({ ... });
});
```

### Detection Heuristic

1. Find sequences of `db.update`, `db.insert`, `db.delete` in same function
2. If they affect related data (same userId, FK relationships), check for transaction
3. Inside transaction blocks, verify all calls use `tx`, not `db`

### Operations That Require Transactions

- Credit operations (reserve, deduct, refund) with related record updates
- Essay submission (update essay + create grade + reserve credit)
- Any operation where partial failure would leave inconsistent state

---

## Principle 8: Credit Operation Flow

**Core Principle:** Credit operations follow reserve → consume/refund pattern for safety.

### The Credit Flow

```
Submission:
  balance - 1.00, reserved + 1.00  (move to held)

Success:
  reserved - 1.00  (consume the held credit)

Failure:
  balance + 1.00, reserved - 1.00  (return to available)
```

### Detection Pattern

```typescript
// LIKELY VIOLATION — Deducting without reservation
await tx.update(credits).set({
  balance: sql`balance - 1.00`,  // Direct deduction, no reservation!
});

// CORRECT — Reserve pattern
// At submission
await tx.update(credits).set({
  balance: sql`balance - 1.00`,
  reserved: sql`reserved + 1.00`,
});

// On success (in worker)
await db.update(credits).set({
  reserved: sql`reserved - 1.00`,
});
// Note: Balance was moved to reserved at submission; clearing reserved consumes the credit

// On failure (in worker)
await db.update(credits).set({
  balance: sql`balance + 1.00`,
  reserved: sql`reserved - 1.00`,
});
```

### Detection Heuristic

1. Find credit balance modifications
2. Check if they follow the reserve pattern
3. Verify success path clears reserved, failure path refunds

---

## Principle 9: API Response Consistency

**Core Principle:** API responses follow a consistent format for client predictability.

### Standard Format

```typescript
// Success responses
return NextResponse.json({ data: result });
return NextResponse.json({ data: { id, status } });

// Error responses — always include status code
return NextResponse.json({ error: 'Not found' }, { status: 404 });
return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
```

### Detection Pattern

```typescript
// LIKELY VIOLATION — Inconsistent response format
return NextResponse.json({ message: 'Error' });  // Use 'error' not 'message'
return NextResponse.json({ errors: ['Error'] });  // Use 'error' string, not array
return NextResponse.json({ result: data });  // Use 'data' not 'result'

// DEFINITE VIOLATION — Error without status code
return NextResponse.json({ error: 'Not found' });  // Missing { status: 404 }
```

### Detection Heuristic

1. Find all `NextResponse.json()` calls
2. Check success responses use `{ data: ... }`
3. Check error responses use `{ error: string }` with status code

---

## Principle 10: Pagination for List Queries

**Core Principle:** List queries must be paginated to prevent unbounded result sets.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Unbounded list query
const essays = await db.query.essays.findMany({
  where: eq(essays.userId, userId),
  // Missing: limit
});

// CORRECT — Paginated query
const essays = await db.query.essays.findMany({
  where: eq(essays.userId, userId),
  limit: 20,
  offset: page * 20,
  orderBy: desc(essays.createdAt),
});
```

### Detection Heuristic

1. Find `findMany()` calls without `limit`
2. Flag as LIKELY — may be intentional for small datasets or exports
3. Verify use case if flagged

### Valid Exceptions

- Admin export endpoints (annotated)
- Known small datasets (e.g., user's active drafts, typically < 10)

---

## Output Format

```
## Data & API Validation Results

### DEFINITE Violations
- `src/features/essays/model.ts:15` — [PRINCIPLE 1] Schema defined outside Schema.ts
- `src/app/api/essays/route.ts:42` — [PRINCIPLE 7] Related operations not in transaction

### LIKELY Violations
- `src/models/Schema.ts:67` — [PRINCIPLE 4] Status field uses text instead of enum
- `src/app/api/essays/route.ts:30` — [PRINCIPLE 6] Query missing deletedAt filter

### POSSIBLE Violations
- `src/libs/Reports.ts:55` — [PRINCIPLE 5] Raw SQL could use query builder

### Exceptions Found
- `src/models/Schema.ts:120` — @pr-check-ignore: no-timestamps — "Lookup table" ✓ Valid

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
- New table types introduced → Verify Principle 2 categorization handles them
- Response format conventions change → Update Principle 9
- New transaction patterns needed → Add to Principle 7 examples

**This agent should NOT contain:**
- Hardcoded table names (derive from schema patterns)
- Hardcoded column lists (derive from table structure)
- Framework version-specific patterns (reference CLAUDE.md)
