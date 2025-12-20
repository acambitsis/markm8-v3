---
name: pr-check-quality
description: Validates React, Next.js, TypeScript, Tailwind, and code quality patterns in PR changes
tools: Read, Grep, Glob
---

# PR Validation: Code Quality & Framework Patterns

**Purpose:** Validate that code follows current framework patterns, TypeScript best practices, and quality standards.

**When to use:** Run on every PR to ensure code quality and consistency.

---

## Confidence Levels

- **DEFINITE** — Clear violation that will cause errors or type issues
- **LIKELY** — Pattern suggests suboptimal code; reviewer should verify
- **POSSIBLE** — May be intentional; flag for discussion

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

// CORRECT — Client component with valid reason
'use client';
function InteractiveCard({ title }: Props) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div onClick={() => setExpanded(!expanded)}>
      {expanded && <Details />}
    </div>
  );
}
```

### Detection Heuristic

1. Find files with `'use client'` directive
2. Search the file for: `useState`, `useEffect`, `use[A-Z]`, `onClick`, `onChange`, `onSubmit`, `on[A-Z]`
3. If no client-side features found → LIKELY violation

### Exception: Third-Party Libraries

Some libraries require client components even without visible hooks. Flag as POSSIBLE, not LIKELY:
```typescript
// @pr-check-ignore: use-client — Required by framer-motion
'use client';
```

---

## Principle 2: Async API Patterns

**Core Principle:** Follow the current framework's patterns for async data access.

### Detection Heuristic

Reference CLAUDE.md for the current patterns. Common patterns to validate:
- Are dynamic values (params, cookies, headers) properly awaited?
- Are async components properly defined?
- Is data fetching happening in the right layer?

### Detection Pattern (Example for reference)

```typescript
// Pattern: Check if params/cookies/headers are awaited
// The specific syntax depends on framework version — check CLAUDE.md

// DEFINITE VIOLATION — Sync access to async API (if framework requires await)
export async function Page({ params }: { params: { id: string } }) {
  const { id } = params;  // Check CLAUDE.md: does this need await?
}

// Check CLAUDE.md for correct pattern
```

### How to Validate

1. Read CLAUDE.md "Key Next.js / React Patterns" section
2. Compare changed files against documented patterns
3. Flag deviations as DEFINITE if syntax will error, LIKELY if it's stylistic

---

## Principle 3: Form Handling Patterns

**Core Principle:** Use the framework's recommended form handling approach.

### Detection Heuristic

Reference CLAUDE.md for current form patterns. Check for:
- Are forms using the recommended action pattern vs manual handlers?
- Is form state managed appropriately?
- Are pending states handled correctly?

### Detection Pattern

```typescript
// LIKELY VIOLATION — Manual form handling (if framework recommends actions)
'use client';
function Form() {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await fetch('/api/submit', { ... });
  };
  return <form onSubmit={handleSubmit}>...</form>;
}

// Check CLAUDE.md for recommended pattern (may be form actions, etc.)
```

---

## Principle 4: Type Safety — No `any`

**Core Principle:** Avoid `any` type; use proper types, `unknown`, or type inference.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Using any
function processData(data: any) { ... }
const result: any = await fetch(...);

// CORRECT — Proper type
function processData(data: EssayInput) { ... }

// CORRECT — Unknown for truly unknown data
function processExternal(data: unknown) {
  if (isValidFormat(data)) {
    // Now typed
  }
}

// CORRECT — Infer from schema
import { essays } from '@/models/Schema';
type Essay = typeof essays.$inferSelect;
```

### Detection Heuristic

1. Search for `: any`, `as any`, `<any>`
2. Each occurrence is a DEFINITE violation unless annotated
3. Exception annotation: `// @pr-check-ignore: any — Third-party library types incomplete`

---

## Principle 5: Null Safety

**Core Principle:** Handle potential null/undefined values explicitly before use.

### Detection Pattern

```typescript
// DEFINITE VIOLATION — Ignoring potential null
const user = await db.query.users.findFirst({ where: eq(users.id, id) });
return NextResponse.json({ name: user.name });  // user could be undefined!

// CORRECT — Explicit null check
const user = await db.query.users.findFirst({ where: eq(users.id, id) });
if (!user) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
return NextResponse.json({ data: { name: user.name } });
```

### Detection Heuristic

1. Find `findFirst`, `findUnique` queries (return T | undefined)
2. Check if result is used without null check
3. Flag as DEFINITE if accessing properties without guard

---

## Principle 6: Type Inference from Schema

**Core Principle:** Derive types from schema definitions rather than duplicating.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Manually defined type that mirrors schema
interface Essay {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
}

// CORRECT — Infer from Drizzle schema
import { essays } from '@/models/Schema';
type Essay = typeof essays.$inferSelect;
type NewEssay = typeof essays.$inferInsert;

// CORRECT — Infer from Zod schema
const EssayInputSchema = z.object({ ... });
type EssayInput = z.infer<typeof EssayInputSchema>;
```

### Detection Heuristic

1. Find `interface` or `type` definitions in feature code
2. Check if they duplicate fields from database schema
3. Flag as LIKELY — may be intentional for API contracts or DTOs

---

## Principle 7: Component Ref Patterns

**Core Principle:** Use the current framework's recommended ref forwarding pattern.

### Detection Heuristic

Check CLAUDE.md for current ref patterns. The pattern varies by React version:
- Some versions require `forwardRef`
- Some versions support ref as prop directly

### Detection Pattern

```typescript
// Check CLAUDE.md for current pattern
// Example patterns that may apply:

// Pattern A: forwardRef (older React)
const Input = React.forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// Pattern B: ref as prop (newer React)
function Input({ ref, ...props }: Props & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}
```

### Exception: UI Libraries

```typescript
// Shadcn/UI library components may use different patterns for compatibility
// Check CLAUDE.md for guidance on library component patterns
// ACCEPTABLE — Library components use forwardRef for compatibility
// Don't convert existing library components unless documented
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(...);
```

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

## Principle 9: Styling Configuration

**Core Principle:** Follow the project's styling configuration approach.

### Detection Heuristic

Check CLAUDE.md for styling configuration:
- Is there a config file (tailwind.config.ts) or CSS-first approach?
- How are custom colors/themes defined?

### Detection Pattern

```css
/* Check CLAUDE.md for current approach */
/* Example: CSS-first configuration */
@theme {
  --color-primary: oklch(0.6 0.2 250);
}

/* vs config file approach — check which is used */
```

---

## Principle 10: Performance Patterns

**Core Principle:** Avoid common performance anti-patterns.

### N+1 Query Detection

```typescript
// LIKELY VIOLATION — Query inside loop
const essays = await db.query.essays.findMany({ where: eq(essays.userId, userId) });
for (const essay of essays) {
  const grades = await db.query.grades.findMany({ where: eq(grades.essayId, essay.id) });
  // N+1 queries!
}

// CORRECT — Eager loading or batch query
const essays = await db.query.essays.findMany({
  where: eq(essays.userId, userId),
  with: { grades: true },
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

1. Find `await` inside `for`/`forEach`/`map` loops → check if it's a query
2. Find `<img` tags in React components → should usually be `<Image`
3. Flag as LIKELY — may be intentional (small datasets, external images)

---

## Principle 11: Error Handling

**Core Principle:** Handle errors appropriately without leaking internal details.

### Detection Pattern

```typescript
// LIKELY VIOLATION — Exposing internal error details
catch (err) {
  return NextResponse.json({ error: err.message }, { status: 500 });  // May leak internals
}

// LIKELY VIOLATION — Swallowing errors silently
catch (err) {
  // Nothing here
}

// CORRECT — Log internally, return safe message
catch (err) {
  logger.error('Operation failed', { error: err, context: { userId } });
  return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
}
```

### Detection Heuristic

1. Find `catch` blocks that return `err.message` or `err.stack` in responses
2. Find empty `catch` blocks
3. Flag as LIKELY — may need context to determine if safe

---

## Output Format

```
## Code Quality Validation Results

### DEFINITE Violations (Must Fix)
- `path/to/file.ts:42` — [PRINCIPLE 4] Using 'any' type
- `path/to/file.ts:55` — [PRINCIPLE 5] Accessing property on potentially null query result

### LIKELY Violations (Should Fix)
- `path/to/file.ts:10` — [PRINCIPLE 1] 'use client' with no visible client-side features
- `path/to/file.ts:30` — [PRINCIPLE 8] Manual className concatenation, use cn()

### POSSIBLE Violations (Review)
- `path/to/file.ts:20` — [PRINCIPLE 1] 'use client' may be required for third-party library

### Exceptions Found
- `path/to/file.ts:15` — @pr-check-ignore: any — "Third-party types" ✓ Valid

### Passed
- [list of files that passed]

### Summary
X files reviewed
- Y DEFINITE violations (must fix)
- Z LIKELY violations (should fix)
- W POSSIBLE violations (review)
```

---

## Maintenance Notes

**When to update this agent:**
- Framework version upgrade → Update detection patterns to match new syntax
- New quality rules adopted → Add new principle
- Styling approach changed → Update Principle 9

**This agent should NOT contain:**
- Hardcoded framework version numbers (reference CLAUDE.md)
- Specific syntax that changes between versions (provide patterns, reference docs)
- Library-specific patterns (those should be documented in CLAUDE.md)

**How to keep current:**
1. When framework upgrades happen, CLAUDE.md should be updated first
2. This agent's detection heuristics should still work (they check patterns, not specific syntax)
3. Update code examples if they become outdated
