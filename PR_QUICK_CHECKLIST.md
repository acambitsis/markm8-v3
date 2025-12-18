# MarkM8 v3 PR Quick Checklist

**Use this for fast PR reviews. See PR_CHECKLIST.md for detailed explanations.**

---

## File Structure (ixartz boilerplate)

- [ ] Feature code in `src/features/[feature-name]/`
- [ ] Third-party configs in `src/libs/` (one file per service)
- [ ] Database schema in `src/models/Schema.ts` (single file)
- [ ] Routes follow `src/app/[locale]/(auth|unauth)/` pattern
- [ ] API routes in `src/app/api/`
- [ ] Shadcn UI components in `src/components/ui/`

---

## Architecture Constraints

- [ ] ALL resources have `userId` foreign key
- [ ] NO organization tables (user-scoped only)
- [ ] NO Clerk Organizations (auth only)
- [ ] Essays support `status: 'draft' | 'submitted'`
- [ ] Grades support 1-to-many with essays (regrading)

---

## Next.js 15 / React 19

- [ ] Uses `await` for: `cookies()`, `headers()`, `params`
- [ ] Uses Server Actions (not manual `onSubmit` state)
- [ ] Uses `ref` as prop (not `forwardRef`)
- [ ] No React 18 patterns

---

## AI Grading (Async)

- [ ] AI grading runs in Railway worker (not API routes)
- [ ] Credits checked at submission, deducted after completion
- [ ] No credit deduction if grading fails (no-hold model)
- [ ] SSE for grade status updates (not WebSockets)
- [ ] Submit API route returns instantly (<500ms)
- [ ] Other operations (Stripe, Clerk webhooks) are synchronous

---

## AI Integration

- [ ] Uses Vercel AI SDK (not raw fetch)
- [ ] Configured via `src/libs/AI.ts`
- [ ] Uses `generateText` or `generateObject`
- [ ] Type-safe responses (Zod schemas)
- [ ] No Bun-specific AI imports

---

## Styling

- [ ] Uses Tailwind 4 (@theme in globals.css)
- [ ] NO tailwind.config.ts
- [ ] Dark mode via native CSS media queries

---

## Security

- [ ] Input validation with Zod (server-side)
- [ ] User ownership verified before mutations
- [ ] Auth checked via Clerk's `auth()` helper
- [ ] File uploads validated (type, size)
- [ ] No secrets in NEXT_PUBLIC_ vars

---

## Database

- [ ] Indexes on foreign keys and query filters
- [ ] Transactions for multi-step operations (especially credits)
- [ ] Drizzle relations for type-safe joins
- [ ] Pagination for large queries

---

## Bun & Performance

- [ ] Node.js-compatible APIs (no Bun lock-in)
- [ ] Uses `bun --bun run` in scripts
- [ ] TypeScript strict mode enabled
- [ ] Named exports (not default exports)

---

## Testing

- [ ] Critical paths tested (payments, grading, credits)
- [ ] Uses Bun test runner
- [ ] Test database (not production)

---

## Common Red Flags

- 🚨 Organization tables added (not in scope, see PHASE_2_MIGRATION.md)
- 🚨 Synchronous AI calls in API routes (must use Railway worker)
- 🚨 Railway worker used for non-AI operations (keep it simple)
- 🚨 Credits deducted at submission (wait for grading)
- 🚨 Missing `await` on Next.js 15 async APIs
- 🚨 `tailwind.config.ts` exists
- 🚨 Bun-specific imports (`import { file } from 'bun'`)
- 🚨 Missing user ownership checks
- 🚨 `any` types instead of proper typing

---

**If all boxes checked: ✅ APPROVE**

**If red flags present: ❌ REQUEST CHANGES**
