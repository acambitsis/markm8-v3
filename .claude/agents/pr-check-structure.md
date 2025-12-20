---
name: pr-check-structure
description: Validates file structure, organization, naming conventions, and import patterns in PR changes
tools: Read, Grep, Glob
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

**Core Principle:** Third-party service integrations belong in `src/libs/` with consistent structure.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Service client created in feature/route
// File: src/app/api/payments/route.ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);  // Wrong!

// CORRECT — Client in libs, imported where needed
// File: src/libs/Stripe.ts
import Stripe from 'stripe';
import { Env } from './Env';
export const stripe = new Stripe(Env.STRIPE_SECRET_KEY, { ... });

// File: src/app/api/payments/route.ts
import { stripe } from '@/libs/Stripe';  // Correct!
```

### Detection Heuristic

1. Find `new ServiceClient()` patterns outside `src/libs/`
2. Common patterns: `new Stripe()`, `new OpenAI()`, `createClient()` for external services
3. Each external service should have ONE client instance in libs

---

## Principle 4: Schema Centralization

**Core Principle:** Database schema lives in a single source of truth.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Schema outside designated file
// File: src/features/essays/schema.ts
export const essays = pgTable('essays', { ... });

// CORRECT — All schema in one file
// File: src/models/Schema.ts (as defined in CLAUDE.md)
```

### Detection Heuristic

Search for `pgTable(`, `pgEnum(` patterns:
- If found outside the designated schema file → DEFINITE violation
- Check CLAUDE.md for the canonical schema location

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

### Detection Heuristic

1. Find imports with 3+ levels of `../`
2. Any match is a DEFINITE violation — should use `@/` alias
3. Relative imports within same feature (1-2 levels) are acceptable

---

## Principle 6: Environment Variable Access

**Core Principle:** Environment variables must be accessed through the validated Env wrapper.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Direct process.env access
const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.STRIPE_SECRET_KEY;

// CORRECT — Through Env wrapper (provides validation + typing)
import { Env } from '@/libs/Env';
const dbUrl = Env.DATABASE_URL;
const apiKey = Env.STRIPE_SECRET_KEY;
```

### Detection Heuristic

1. Search for `process.env.` in source files
2. Exceptions:
   - `src/libs/Env.ts` itself (defines the wrapper)
   - Config files at project root
   - `next.config.ts` / `next.config.js`

---

## Principle 7: Logging Consistency

**Core Principle:** Use the project's logger, not console methods in production code.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Console in production code
console.log('Processing essay', essayId);
console.error('Failed to process', error);

// CORRECT — Structured logger
import { logger } from '@/libs/Logger';
logger.info('Processing essay', { essayId });
logger.error('Failed to process', { error });
```

### Detection Heuristic

1. Find `console.log`, `console.error`, `console.warn` in `src/` files
2. Exceptions (flag as POSSIBLE, not LIKELY):
   - Test files (`*.test.ts`, `*.spec.ts`)
   - Development-only code (wrapped in `if (process.env.NODE_ENV === 'development')`)
   - CLI scripts in `scripts/` directory

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
| API routes | `route.ts` in path | `src/app/api/essays/route.ts` |
| Constants | SCREAMING_SNAKE or PascalCase | `MAX_RETRIES` or `DefaultConfig` |

### Detection Pattern

```typescript
// LIKELY VIOLATION — Wrong case for component
// File: src/components/dashboardHeader.tsx  // Should be DashboardHeader.tsx

// LIKELY VIOLATION — Wrong case for lib
// File: src/libs/stripe.ts  // Should be Stripe.ts

// LIKELY VIOLATION — Hook without 'use' prefix
// File: src/hooks/gradeStatus.ts  // Should be useGradeStatus.ts
```

### Detection Heuristic

1. For files in `src/components/`, `src/features/**/components/` → expect PascalCase
2. For files in `src/hooks/`, `src/features/**/hooks/` → expect `use` prefix
3. For files in `src/libs/` → expect PascalCase

---

## Principle 9: Export Style

**Core Principle:** Prefer named exports for better refactoring support and explicit imports.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Default export for non-page
// File: src/utils/formatDate.ts
export default function formatDate() { ... }

// CORRECT — Named export
export function formatDate() { ... }

// EXCEPTION — Default export required
// Page components: src/app/**/page.tsx (Next.js requirement)
// Layout components: src/app/**/layout.tsx (Next.js requirement)
export default function Page() { ... }
```

### Detection Heuristic

1. Find `export default` in non-page/layout files
2. Flag as LIKELY — some libraries require default exports
3. Pages, layouts, and loading states are exempt (Next.js convention)

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
1. Pages that fetch user-specific data → should be in `(auth)`
2. Pages that are marketing/public → should be in `(unauth)`
3. Flag mismatches as LIKELY — may be intentional hybrid

---

## Output Format

```
## Structure Validation Results

### DEFINITE Violations
- `src/app/api/payments/route.ts` — [PRINCIPLE 3] Stripe client instantiated in route, should use @/libs/Stripe
- `src/features/essays/utils.ts` — [PRINCIPLE 5] Import uses '../../../libs/DB', should use '@/libs/DB'

### LIKELY Violations
- `src/components/EssayCard.tsx` — [PRINCIPLE 1] Only imported by essays feature, consider moving to src/features/essays/components/
- `src/libs/stripe.ts` — [PRINCIPLE 8] Filename should be PascalCase: Stripe.ts

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

## Maintenance Notes

**When to update this agent:**
- File structure reorganized → Update principle examples to match
- New route groups added → Update Principle 10
- New naming conventions adopted → Update Principle 8

**This agent should NOT contain:**
- Hardcoded file paths (reference CLAUDE.md for current structure)
- Specific feature names (use pattern matching)
- Framework version-specific patterns (those belong in quality agent)

**How to verify principles still apply:**
1. Read current CLAUDE.md file structure section
2. Verify examples match actual project structure
3. Update examples if structure has evolved
