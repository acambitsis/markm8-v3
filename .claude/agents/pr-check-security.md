---
name: pr-check-security
model: opus
description: Validates authentication, authorization, user-scoping, input validation, and secrets handling in PR changes
tools: Read, Grep, Glob, Bash
---

# PR Validation: Security & Authorization

**Purpose:** Validate that changed files properly implement authentication, authorization, user-scoping, and input validation.

**When to use:** Run on every PR. Security issues are critical blockers.

---

## Confidence Levels

- **DEFINITE** — Clear violation of security principle; must fix before merge
- **LIKELY** — Pattern suggests violation; reviewer should verify intent
- **POSSIBLE** — May be intentional; flag for human review

## Exception Annotations

Code can be annotated to suppress specific checks with justification:

```typescript
// @pr-check-ignore: no-userid-filter — Admin endpoint, requires admin role check instead
const allUsers = await ctx.db.query('users').collect();
```

Validators should verify the justification is legitimate.

---

## Instructions for Validator

1. Get the list of changed files in this PR
2. For each file, apply the security principles below
3. Check for exception annotations and verify their justifications
4. Report violations with confidence level and file:line reference
5. Any DEFINITE violation = PR should not merge

---

## Principle 1: User-Scoped Data Access (Convex)

**Core Principle:** Queries returning user-owned data must filter by the authenticated user's ID using `requireAuth()`.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Query on user-owned table without userId filter
// How to detect: Document has userId field (check schema.ts) but query has no userId in index/filter
export const listEssays = query({
  handler: async (ctx) => {
    return await ctx.db.query('essays')
      .filter(q => q.eq(q.field('status'), 'submitted'))  // Missing userId!
      .collect();
  },
});

// DEFINITE VIOLATION — Using ctx.auth directly without proper validation
// How to detect: identity.subject used without user lookup or validation
export const getEssays = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    // Using identity.subject directly is risky — user may not exist in DB yet
    return await ctx.db.query('essays')
      .filter(q => q.eq(q.field('userId'), identity?.subject))
      .collect();
  },
});

// CORRECT — Using requireAuth() helper (validates user exists)
import { requireAuth } from './lib/auth';

export const listEssays = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);  // Throws if not authenticated or user not found
    return await ctx.db.query('essays')
      .withIndex('by_user_status', q => q.eq('userId', userId).eq('status', 'submitted'))
      .collect();
  },
});
```

### How to Identify User-Owned Documents

Rather than maintaining a hardcoded list, detect from schema:

```typescript
// In convex/schema.ts, user-owned documents have:
userId: v.id('users'),  // Reference to users table

// Documents WITHOUT userId field are lookup/config documents — exempt from this rule
```

### Valid Exceptions (require annotation)

- Admin endpoints with explicit role verification
- Internal queries (`internalQuery`) called only by other Convex functions
- Webhook handlers processing external events (use signature verification instead)

---

## Principle 2: Authentication Before Data Access (Convex)

**Core Principle:** Public queries and mutations must verify authentication before any data access.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Data access before auth check
export const getDraft = query({
  handler: async (ctx) => {
    const draft = await ctx.db.query('essays').first();  // Too late!
    const identity = await ctx.auth.getUserIdentity();  // Auth check after data access
    // ...
  },
});

// DEFINITE VIOLATION — No auth check at all in public query
export const getUserCredits = query({
  handler: async (ctx) => {
    // No authentication!
    return await ctx.db.query('credits').first();
  },
});

// CORRECT — Auth check first using requireAuth()
export const getDraft = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);  // Throws if not authenticated
    return await ctx.db.query('essays')
      .withIndex('by_user_status', q => q.eq('userId', userId).eq('status', 'draft'))
      .first();
  },
});
```

### Detection Heuristic

In Convex function files (`convex/*.ts`):
1. Find `query()` and `mutation()` exports (public functions)
2. Check if `requireAuth(ctx)` or `ctx.auth.getUserIdentity()` is called first
3. If any `ctx.db` call occurs before auth → DEFINITE violation
4. If auth check is missing entirely → DEFINITE violation

### Valid Exceptions (require annotation)

- `internalQuery` / `internalMutation` — Only called by other Convex functions
- Explicitly public data (e.g., platform settings) — must be annotated

---

## Principle 3: Webhook Signature Verification (HTTP Actions)

**Core Principle:** HTTP webhook endpoints must cryptographically verify the request origin before processing.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Processing webhook without signature check
// In convex/http.ts
http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    await ctx.runMutation(internal.users.createFromClerk, body);  // Trusting unverified!
  }),
});

// CORRECT — Verify Svix signature before processing
http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response('Missing headers', { status: 400 });
    }

    const body = await request.text();
    const wh = new Webhook(webhookSecret);

    let evt;
    try {
      evt = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      return new Response('Invalid signature', { status: 400 });
    }

    // Now safe to process evt
  }),
});
```

### Detection Heuristic

In `convex/http.ts`:
1. Find `http.route()` definitions for webhook endpoints
2. Look for signature verification (Svix, Stripe `constructEvent`, etc.)
3. Verify it happens BEFORE any `ctx.runMutation()` or `ctx.runQuery()` calls
4. Verify failure returns early (doesn't continue processing)

---

## Principle 4: Input Validation via Convex Validators

**Core Principle:** All public function arguments must be validated with Convex validators (`v.*`).

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Missing argument validators
export const createEssay = mutation({
  handler: async (ctx, args) => {
    // args is untyped/unvalidated!
    await ctx.db.insert('essays', args);
  },
});

// DEFINITE VIOLATION — Partial validation (some fields missing)
export const createEssay = mutation({
  args: {
    title: v.string(),
    // content not validated!
  },
  handler: async (ctx, { title, content }) => {
    await ctx.db.insert('essays', { title, content });  // content bypasses validation
  },
});

// CORRECT — Full argument validation
export const createEssay = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    academicLevel: v.union(
      v.literal('high_school'),
      v.literal('undergraduate'),
      v.literal('postgraduate'),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await ctx.db.insert('essays', { ...args, userId });
  },
});
```

### Detection Heuristic

In Convex functions:
1. Find `query()`, `mutation()`, `action()` exports (public functions)
2. Check if `args:` property is defined with validators
3. If `args` is missing or empty for functions that take input → DEFINITE violation
4. Check all used argument properties are validated

### Validator Best Practices

```typescript
// Use v.optional() for optional fields
args: {
  title: v.string(),
  description: v.optional(v.string()),
}

// Use v.union() for finite value sets
args: {
  status: v.union(v.literal('draft'), v.literal('submitted')),
}

// Use v.id() for document references
args: {
  essayId: v.id('essays'),
}
```

---

## Principle 5: Secret Isolation

**Core Principle:** Server-side secrets must never be exposed to client code.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Secret in client component
'use client';
const apiKey = process.env.STRIPE_SECRET_KEY;  // Exposed to browser!

// DEFINITE VIOLATION — Secret returned from query
export const getConfig = query({
  handler: async () => {
    return {
      stripeKey: process.env.STRIPE_SECRET_KEY,  // Never return secrets!
    };
  },
});

// CORRECT — Secrets only in Convex functions (server-side)
// convex/payments.ts
export const createCheckout = action({
  handler: async (ctx) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;  // OK - server-side only
    // Use key for API call, never return it
  },
});
```

### Detection Heuristic

1. Any `process.env.*` NOT prefixed with `NEXT_PUBLIC_` is a secret
2. Secrets must not appear in:
   - Files with `'use client'` directive
   - Return values of `query()` functions
   - Error messages in responses

### Convex Environment Variables

In Convex, use `process.env.*` in functions. These are set in Convex Dashboard,
never in client-side `.env` files:
- `CLERK_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`
- `OPENROUTER_API_KEY`

---

## Principle 6: Idempotent Webhook Processing

**Core Principle:** Webhook handlers must handle duplicate deliveries safely.

### Detection Pattern

```typescript
// LIKELY VIOLATION — No idempotency check before mutation
http.route({
  path: '/stripe-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    // ... signature verification ...
    await ctx.runMutation(internal.credits.addCredits, {
      userId,
      amount: '5.00',  // Could double-credit on retry!
    });
  }),
});

// CORRECT — Check for existing transaction before mutating
http.route({
  path: '/stripe-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    // ... signature verification ...
    const event = JSON.parse(body);

    // Check if already processed
    const existing = await ctx.runQuery(internal.credits.getTransaction, {
      externalId: event.id,
    });
    if (existing) {
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Safe to process
    await ctx.runMutation(internal.credits.addFromPurchase, {
      userId,
      amount: '5.00',
      stripePaymentIntentId: event.id,  // Track for idempotency
    });
  }),
});
```

### Detection Heuristic (LIKELY, not DEFINITE)

In webhook handlers:
1. Look for `ctx.runMutation()` calls that modify balances or create records
2. Check if there's a preceding "already processed" check
3. Flag as LIKELY if missing — may have idempotency at a different layer

---

## Principle 7: Actions Must Not Trust External Data

**Core Principle:** Convex actions that receive data from external APIs must validate before using in mutations.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Trusting external API response without validation
export const processGrade = internalAction({
  args: { gradeId: v.id('grades') },
  handler: async (ctx, { gradeId }) => {
    const response = await fetch('https://api.openrouter.ai/...', { ... });
    const data = await response.json();

    // Directly using external data in mutation
    await ctx.runMutation(internal.grades.complete, {
      gradeId,
      feedback: data.choices[0].message.content,  // Untrusted!
    });
  },
});

// CORRECT — Validate and sanitize external data
export const processGrade = internalAction({
  args: { gradeId: v.id('grades') },
  handler: async (ctx, { gradeId }) => {
    const response = await fetch('https://api.openrouter.ai/...', { ... });
    const data = await response.json();

    // Validate response structure
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response');
    }

    // Parse and validate the content
    const parsed = parseGradeResponse(data.choices[0].message.content);
    if (!isValidGradeFeedback(parsed)) {
      throw new Error('Invalid grade feedback format');
    }

    await ctx.runMutation(internal.grades.complete, {
      gradeId,
      feedback: parsed,
    });
  },
});
```

---

## Output Format

```
## Security Validation Results

### DEFINITE Violations (Must Fix)
- `convex/essays.ts:42` — [PRINCIPLE 1] Query on user-owned document missing userId filter
- `convex/grades.ts:15` — [PRINCIPLE 2] Auth check occurs after database access

### LIKELY Violations (Verify Intent)
- `convex/http.ts:67` — [PRINCIPLE 6] Webhook mutation without visible idempotency check

### Exceptions Found
- `convex/users.ts:30` — @pr-check-ignore: no-auth — "Internal query called by webhook only" ✓ Valid

### Passed
- [list of files that passed]

### Summary
X files reviewed
- Y DEFINITE violations (must fix)
- Z LIKELY violations (verify intent)
RECOMMENDATION: [BLOCK / APPROVE WITH REVIEW / APPROVE]
```

---

## Maintenance Notes

**When to update this agent:**
- New authentication patterns introduced → Update Principle 2 detection
- New external service webhooks added → Verify Principle 3 covers their signature method
- New Convex validator patterns → Update Principle 4

**This agent should NOT contain:**
- Hardcoded document names (derive from schema)
- Hardcoded secret names (derive from Env prefix pattern)
- Version-specific framework patterns (reference CLAUDE.md instead)
