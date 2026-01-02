---
name: pr-check-structure
description: Validates file structure, organization, naming conventions, and import patterns in PR changes
tools: Read, Grep, Glob, Bash
---

# PR Validation: Structure & Organization

**Purpose:** Validate that changed files follow the project's file structure, naming conventions, and import patterns.

**When to use:** Run on every PR to catch organizational issues early.

---

## Confidence Levels

- **DEFINITE** — Clear violation of structural rules
- **LIKELY** — Pattern suggests misplacement; reviewer should verify
- **POSSIBLE** — May be intentional; flag for discussion

## Exception Annotations

```typescript
// @pr-check-ignore: shared-in-feature — Intentionally colocated, used only by this feature
```

---

## Instructions for Validator

1. Get the list of changed files in this PR
2. For each file, apply the structural principles below
3. Check for exception annotations and verify their justifications
4. Report violations with confidence level and file path

**Important:** Reference CLAUDE.md for the current file structure. This agent defines *principles*, not hardcoded paths.

---

## Principle 1: Feature Isolation

**Core Principle:** Code specific to a single feature belongs in that feature's directory, not in shared locations.

### Detection Heuristic

A component/hook/utility is "feature-specific" if:
- It's only imported by files within one feature
- Its name includes feature-specific terminology (e.g., `EssayForm`, `useGradeStatus`)
- It operates on feature-specific data types

### Detection Pattern

```typescript
// LIKELY VIOLATION — Feature-specific component in shared location
// File: src/components/EssaySubmitButton.tsx
// Only used by: src/features/essays/components/SubmitForm.tsx
// → Should be: src/features/essays/components/EssaySubmitButton.tsx

// LIKELY VIOLATION — Feature-specific hook in global hooks
// File: src/hooks/useGradePolling.ts
// → Should be: src/features/grading/hooks/useGradePolling.ts

// CORRECT — Shared component used across features
// File: src/components/LoadingSpinner.tsx
// Used by: src/features/essays/..., src/features/grading/..., src/features/credits/...
```

### How to Verify

1. Check imports of the file across the codebase
2. If all imports come from one feature directory → LIKELY violation
3. If imports come from multiple features → correctly shared

---

## Principle 2: Shared Code Location

**Core Principle:** Code used across multiple features belongs in shared locations, not buried in a feature.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Shared utility buried in feature
// File: src/features/essays/utils/formatDate.ts
// Used by: src/features/essays/..., src/features/grading/..., src/features/credits/...
// → Should be: src/utils/formatDate.ts

// CORRECT — Feature-specific utility
// File: src/features/essays/utils/parseEssayContent.ts
// Used only by: src/features/essays/...
```

### Detection Heuristic

1. Check if file is imported from outside its feature directory
2. If imported by 2+ other features → should be in shared location
3. Exception: Shared types that originate from a feature can stay there if that feature "owns" them

---

## Principle 3: Third-Party Integration Location

**Core Principle:** Third-party service integrations in Next.js belong in `src/libs/`. Convex has its own patterns.

### Detection Pattern (Next.js Client-Side)

```typescript
// DEFINITE VIOLATION — Service client created in component
// File: src/features/payments/components/CheckoutButton.tsx
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);  // Wrong! Client-side exposure!

// CORRECT — Client in libs for Next.js code
// File: src/libs/Stripe.ts
import Stripe from 'stripe';
import { Env } from './Env';
export const stripe = new Stripe(Env.STRIPE_SECRET_KEY, { ... });
```

### Detection Pattern (Convex Functions)

```typescript
// CORRECT — External services in Convex actions
// File: convex/grading.ts
export const processGrade = internalAction({
  handler: async (ctx, { gradeId }) => {
    // OK: External API call in action
    const response = await fetch('https://api.openrouter.ai/...', {
      headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` },
    });
  },
});

// LIKELY VIOLATION — External API in query/mutation
// File: convex/essays.ts
export const submit = mutation({
  handler: async (ctx, args) => {
    await fetch('https://external-api.com/...');  // Should be in action!
  },
});
```

### Detection Heuristic

1. In `src/` files: Find `new ServiceClient()` outside `src/libs/` → DEFINITE violation
2. In `convex/` files: External API calls should be in `action`/`internalAction`, not queries/mutations
3. Each external service in Next.js should have ONE client instance in libs

---

## Principle 4: Convex Schema Centralization

**Core Principle:** All Convex schema definitions must be in `convex/schema.ts`.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Schema outside designated file
// File: convex/essays.ts
import { defineTable } from 'convex/server';
const essays = defineTable({ ... });  // Wrong location!

// CORRECT — All schema in one file
// File: convex/schema.ts
import { defineSchema, defineTable } from 'convex/server';

export default defineSchema({
  users: defineTable({ ... }),
  essays: defineTable({ ... }),
  grades: defineTable({ ... }),
});
```

### Detection Heuristic

Search for `defineTable(`, `defineSchema(` patterns:
- If `defineTable(` found outside `convex/schema.ts` → DEFINITE violation
- `defineSchema(` should only exist in `convex/schema.ts`

---

## Principle 5: Import Alias Usage

**Core Principle:** Use path aliases for imports beyond immediate directory.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Deep relative imports
import { something } from '../../../libs/Something';
import { helper } from '../../../../utils/Helpers';

// CORRECT — Path alias
import { something } from '@/libs/Something';
import { helper } from '@/utils/Helpers';

// CORRECT — Relative for nearby files
import { LocalComponent } from './LocalComponent';
import { FeatureUtil } from '../utils/FeatureUtil';
```

### Convex Import Patterns

```typescript
// CORRECT — Convex generated imports
import { api, internal } from './_generated/api';
import { query, mutation, internalAction } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';

// CORRECT — Convex lib imports (within convex/)
import { requireAuth } from './lib/auth';
import { subtractDecimal } from './lib/decimal';

// DEFINITE VIOLATION — Importing from src/ in Convex
// File: convex/essays.ts
import { formatDate } from '@/utils/formatDate';  // Can't import from Next.js!
```

### Detection Heuristic

1. In `src/` files: Find imports with 3+ levels of `../` → DEFINITE violation
2. In `convex/` files: Find imports from `@/` or `src/` → DEFINITE violation (Convex is isolated)
3. Relative imports within same directory tree (1-2 levels) are acceptable

---

## Principle 6: Environment Variable Access

**Core Principle:** Environment variables have different access patterns for Next.js vs Convex.

### Next.js Pattern

```typescript
// DEFINITE VIOLATION — Direct process.env in Next.js source
// File: src/features/payments/CheckoutButton.tsx
const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;  // Wrong!

// CORRECT — Through Env wrapper (provides validation + typing)
import { Env } from '@/libs/Env';
const publishableKey = Env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
```

### Convex Pattern

```typescript
// CORRECT — Direct process.env in Convex functions
// File: convex/grading.ts
export const processGrade = internalAction({
  handler: async (ctx) => {
    const apiKey = process.env.OPENROUTER_API_KEY;  // OK in Convex!
    // ...
  },
});
```

### Detection Heuristic

1. In `src/` files: Search for `process.env.` → DEFINITE violation (except in allowed files)
2. In `convex/` files: `process.env.` is allowed (server-side only)
3. Exceptions for Next.js:
   - `src/libs/Env.ts` itself (defines the wrapper)
   - Config files at project root (`next.config.ts`, etc.)

---

## Principle 7: Logging Patterns

**Core Principle:** Use appropriate logging for each context.

### Next.js Pattern

```typescript
// LIKELY VIOLATION — Console in Next.js production code
// File: src/features/essays/SubmitForm.tsx
console.log('Submitting essay', essayId);

// CORRECT — Structured logger in Next.js
import { logger } from '@/libs/Logger';
logger.info('Submitting essay', { essayId });
```

### Convex Pattern

```typescript
// CORRECT — Console is standard in Convex (logs to dashboard)
// File: convex/grading.ts
export const processGrade = internalAction({
  handler: async (ctx, { gradeId }) => {
    console.log('Processing grade:', gradeId);  // OK! Goes to Convex logs
    // ...
    console.error('Grade processing failed:', error);  // OK!
  },
});
```

### Detection Heuristic

1. In `src/` files: `console.log`, `console.error` → LIKELY violation
2. In `convex/` files: `console.*` is acceptable (Convex logging convention)
3. Exceptions for Next.js:
   - Test files (`*.test.ts`, `*.spec.ts`)
   - Development-only code (wrapped in `if (process.env.NODE_ENV === 'development')`)

---

## Principle 8: Naming Conventions

**Core Principle:** Consistent naming enables pattern recognition and tooling.

### Conventions

| Type | Pattern | Example |
|------|---------|---------|
| React components | PascalCase | `DashboardHeader.tsx` |
| Hooks | camelCase with `use` prefix | `useGradeStatus.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Libs (service wrappers) | PascalCase | `Stripe.ts`, `Logger.ts` |
| Convex functions | camelCase | `convex/essays.ts`, `convex/grades.ts` |
| Convex lib helpers | camelCase | `convex/lib/auth.ts`, `convex/lib/decimal.ts` |
| Constants | SCREAMING_SNAKE or PascalCase | `MAX_RETRIES` or `DefaultConfig` |

### Detection Pattern

```typescript
// LIKELY VIOLATION — Wrong case for component
// File: src/components/dashboardHeader.tsx  // Should be DashboardHeader.tsx

// LIKELY VIOLATION — Wrong case for lib
// File: src/libs/stripe.ts  // Should be Stripe.ts

// LIKELY VIOLATION — Hook without 'use' prefix
// File: src/hooks/gradeStatus.ts  // Should be useGradeStatus.ts

// LIKELY VIOLATION — PascalCase for Convex function file
// File: convex/Essays.ts  // Should be essays.ts
```

### Detection Heuristic

1. For files in `src/components/`, `src/features/**/components/` → expect PascalCase
2. For files in `src/hooks/`, `src/features/**/hooks/` → expect `use` prefix
3. For files in `src/libs/` → expect PascalCase
4. For files in `convex/` (except `_generated/`) → expect camelCase

---

## Principle 9: Export Style

**Core Principle:** Prefer named exports for better refactoring support and explicit imports.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Default export for non-page utility
// File: src/utils/formatDate.ts
export default function formatDate() { ... }

// CORRECT — Named export
export function formatDate() { ... }

// EXCEPTION — Default export required
// Page components: src/app/**/page.tsx (Next.js requirement)
// Layout components: src/app/**/layout.tsx (Next.js requirement)
// Convex schema: convex/schema.ts (Convex requirement)
// Convex http: convex/http.ts (Convex requirement)
export default function Page() { ... }
```

### Detection Heuristic

1. Find `export default` in non-page/layout/config files
2. Flag as LIKELY — some patterns require default exports
3. Exempt files: pages, layouts, `convex/schema.ts`, `convex/http.ts`, `convex/auth.config.ts`

---

## Principle 10: Route Protection Placement

**Core Principle:** Protected and public routes are organized by authentication requirement.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Protected page in public route group
// File: src/app/[locale]/(unauth)/dashboard/page.tsx
// Dashboard requires auth → should be in (auth)

// LIKELY VIOLATION — Public page in protected route group
// File: src/app/[locale]/(auth)/pricing/page.tsx
// Pricing is public → should be in (unauth)

// CORRECT — Proper placement
// src/app/[locale]/(auth)/dashboard/page.tsx    // Requires login
// src/app/[locale]/(unauth)/pricing/page.tsx    // Public
```

### Detection Heuristic

This requires understanding page intent:
1. Pages using `useQuery(api.*)` for user data → should be in `(auth)`
2. Pages that are marketing/public → should be in `(unauth)`
3. Flag mismatches as LIKELY — may be intentional hybrid

---

## Principle 11: Convex Function Organization

**Core Principle:** Convex functions follow consistent organization patterns.

### File Structure

```
convex/
├── _generated/          # Auto-generated (never edit)
├── lib/                 # Shared helpers
│   ├── auth.ts         # requireAuth() helper
│   └── decimal.ts      # Credit arithmetic
├── schema.ts           # Schema definition (single file)
├── auth.config.ts      # Clerk integration config
├── http.ts             # HTTP endpoints (webhooks)
├── users.ts            # User queries/mutations
├── credits.ts          # Credit queries/mutations
├── essays.ts           # Essay queries/mutations
├── grades.ts           # Grade queries/mutations
└── grading.ts          # AI grading action
```

### Detection Pattern

```typescript
// LIKELY VIOLATION — Mixed concerns in single file
// File: convex/essays.ts
export const processGrade = internalAction({ ... });  // Should be in grading.ts
export const addCredits = mutation({ ... });  // Should be in credits.ts

// CORRECT — Domain-organized functions
// File: convex/essays.ts — Only essay-related functions
// File: convex/grades.ts — Only grade-related functions
// File: convex/grading.ts — AI processing action
```

### Internal vs Public Functions

```typescript
// CORRECT — Public function (called from client)
export const getDraft = query({
  args: { ... },
  handler: async (ctx, args) => { ... },
});

// CORRECT — Internal function (called only by other Convex functions)
export const createFromClerk = internalMutation({
  args: { ... },
  handler: async (ctx, args) => { ... },
});

// LIKELY VIOLATION — Internal function without internal prefix
// If only called by actions/webhooks, should be internalMutation/internalQuery
export const processGradeResult = mutation({  // Should be internalMutation
  handler: async (ctx, args) => { ... },
});
```

### Detection Heuristic

1. Check if Convex files contain functions from multiple domains
2. Check if functions called only by other Convex functions use `internal*` variants
3. Verify `convex/lib/` contains only helper functions, not queries/mutations

---

## Output Format

```
## Structure Validation Results

### DEFINITE Violations
- `convex/essays.ts:15` — [PRINCIPLE 4] defineTable() outside schema.ts
- `src/features/essays/utils.ts:3` — [PRINCIPLE 5] Import uses '../../../libs/Logger', should use '@/libs/Logger'
- `convex/grades.ts:42` — [PRINCIPLE 5] Importing from '@/utils/helpers' - Convex cannot import from src/

### LIKELY Violations
- `src/components/EssayCard.tsx` — [PRINCIPLE 1] Only imported by essays feature, consider moving to src/features/essays/components/
- `convex/Essays.ts` — [PRINCIPLE 8] Filename should be camelCase: essays.ts
- `convex/essays.ts:67` — [PRINCIPLE 11] processGrade action should be in grading.ts

### POSSIBLE Violations
- `src/features/grading/utils/formatDate.ts` — [PRINCIPLE 2] Imported by 2 features, may belong in src/utils/

### Passed
- [list of files that passed]

### Summary
X files checked
- Y DEFINITE violations
- Z LIKELY violations
- W POSSIBLE violations
```

---

## Principle 12: No Bun-Specific Imports

**Core Principle:** Code must remain Node.js-compatible. Bun-specific APIs break deployment on non-Bun runtimes.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Bun-specific module imports
import { serve } from 'bun';
import { file } from 'bun:fs';
import { password } from 'bun:password';

// DEFINITE VIOLATION — Bun global usage
const hashedPassword = await Bun.password.hash(plaintext);
const file = Bun.file('./data.json');
Bun.serve({ ... });

// CORRECT — Use Node.js-compatible alternatives
import { readFile } from 'fs/promises';
import bcrypt from 'bcrypt';
```

### Detection Heuristic

1. Search for `from 'bun'` or `from 'bun:*'` import patterns
2. Search for `Bun.` global usage
3. Any match is a DEFINITE violation — no exceptions
4. This applies to both `src/` and `convex/` directories

### Why This Matters

- Vercel deployments use Node.js runtime, not Bun
- Convex functions run in Convex's V8 isolate, not Bun
- Only local development uses Bun as the package manager/runner

---

## Maintenance Notes

**When to update this agent:**
- File structure reorganized → Update principle examples to match
- New route groups added → Update Principle 10
- New naming conventions adopted → Update Principle 8
- New Convex patterns → Update Principle 11
- New runtime constraints → Update Principle 12

**This agent should NOT contain:**
- Hardcoded file paths (reference CLAUDE.md for current structure)
- Specific feature names (use pattern matching)
- Framework version-specific patterns (those belong in quality agent)

**How to verify principles still apply:**
1. Read current CLAUDE.md file structure section
2. Verify examples match actual project structure
3. Update examples if structure has evolved
