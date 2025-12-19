# MarkM8 Phase 2: University Multi-Tenancy

**Note:** This document describes **future features** not yet implemented. Current implementation supports individual users only.

**When to implement:** When first university/school customer signs up (v3.1+)

---

## Overview

Phase 2 adds organization/university support while maintaining backward compatibility with individual users.

**Key changes:**
- Add organization tables to database
- Make essays polymorphic (owned by user OR organization)
- Separate credit pools (user credits vs org credits)
- Role-based access control (owner/admin/member)
- Still NO Clerk Organizations (custom implementation)

---

## Schema Migration

### New Tables

```typescript
// src/models/Schema.ts (additions to existing schema)

export const organizationTypeEnum = pgEnum('organization_type', ['school', 'tutoring']);
export const membershipRoleEnum = pgEnum('membership_role', ['owner', 'admin', 'member']);

// Organizations (universities, schools, tutoring companies)
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: organizationTypeEnum('type').notNull(),
  slug: text('slug').notNull().unique(),
  billingEmail: text('billing_email').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization Memberships
export const orgMemberships = pgTable('org_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  role: membershipRoleEnum('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userOrgIdx: index('idx_org_memberships_user_org').on(table.userId, table.organizationId),
}));

// Organization Credits (separate from individual user credits)
export const orgCredits = pgTable('org_credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull().unique(),
  balance: numeric('balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization Credit Transactions
export const orgCreditTransactions = pgTable('org_credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  transactionType: transactionTypeEnum('transaction_type').notNull(),
  description: text('description'),
  gradeId: uuid('grade_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('idx_org_credit_transactions_org_id').on(table.organizationId),
}));
```

### Make Essays Polymorphic (User OR Organization Owned)

```sql
-- Migration: Add org support to essays
ALTER TABLE essays ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE essays ADD COLUMN author_user_id TEXT REFERENCES users(id);

-- Constraint: Essay belongs to EITHER user OR org (not both)
ALTER TABLE essays ADD CONSTRAINT essays_owner_check
  CHECK (
    (user_id IS NOT NULL AND organization_id IS NULL) OR
    (user_id IS NULL AND organization_id IS NOT NULL)
  );

-- Same for grades
ALTER TABLE grades ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE grades ADD CONSTRAINT grades_owner_check
  CHECK (
    (user_id IS NOT NULL AND organization_id IS NULL) OR
    (user_id IS NULL AND organization_id IS NOT NULL)
  );

-- Note: grades.essayId is NOT unique (supports multiple grades per essay for regrading)
```

**Key points:**
- `essays.userId` - Owner (individual user OR null if org-owned)
- `essays.organizationId` - Owner (organization OR null if user-owned)
- `essays.authorUserId` - Who actually wrote/submitted it (always set)
- Check constraint ensures one and only one owner type

---

## Organization Context Helper

```typescript
// src/libs/Organization.ts (NEW file)
import { db } from '@/libs/DB';
import { orgMemberships, organizations } from '@/models/Schema';
import { eq, and } from 'drizzle-orm';

export async function getOrganizationsForUser(userId: string) {
  return await db
    .select({
      org: organizations,
      role: orgMemberships.role,
    })
    .from(orgMemberships)
    .innerJoin(organizations, eq(organizations.id, orgMemberships.organizationId))
    .where(eq(orgMemberships.userId, userId));
}

export async function requireOrgMembership(
  userId: string,
  orgId: string,
  minRole: 'member' | 'admin' | 'owner' = 'member'
) {
  const [membership] = await db
    .select()
    .from(orgMemberships)
    .where(and(
      eq(orgMemberships.userId, userId),
      eq(orgMemberships.organizationId, orgId)
    ))
    .limit(1);

  if (!membership) {
    throw new Error('Not a member of this organization');
  }

  const roleHierarchy = { member: 0, admin: 1, owner: 2 };
  if (roleHierarchy[membership.role] < roleHierarchy[minRole]) {
    throw new Error('Insufficient permissions');
  }

  return membership;
}

export async function getActiveContext(userId: string) {
  // Returns user's current context (personal OR organization)
  // Could be stored in session/cookies
  // If user is in multiple orgs, they choose which context they're working in
}
```

---

## User Journey Changes

### Organization Owner Flow

1. **Create Organization**
   - `/orgs/create` - Form to create new organization
   - Requires: name, type (school/tutoring), billing email
   - Creator becomes `owner` role
   - Creates org credits record with balance 0.00

2. **Invite Members**
   - `/orgs/[slug]/settings/members`
   - Send email invites
   - Set role: member/admin/owner
   - Members can submit essays on behalf of org

3. **Purchase Credits for Organization**
   - `/orgs/[slug]/settings/credits`
   - Works like personal credits
   - Deducted from org pool (not personal pool)

4. **Submit Essay as Organization**
   - Context switcher in navbar: "Personal" | "Acme University"
   - When in org context, essays belong to org
   - Credits deducted from org balance

### Student/Member Flow

1. **Join Organization**
   - Receive invite email
   - Click link, sign up/login with Clerk
   - Automatically added to org with specified role

2. **Submit Essay for Organization**
   - Switch to org context
   - Submit essay (same UI as personal)
   - Uses org credits, not personal credits
   - `essays.organizationId = orgId`, `essays.authorUserId = userId`

---

## Credit Logic Changes

### Before (Current - User Only)
```typescript
// Check user's personal credits
const userCredits = await db.query.credits.findFirst({
  where: eq(credits.userId, userId)
});

if (userCredits.balance < 1.00) {
  throw new Error('Insufficient credits');
}
```

### After (Polymorphic)
```typescript
// Determine context (personal or org)
const context = await getActiveContext(userId);

if (context.type === 'organization') {
  // Check org credits
  const orgCredits = await db.query.orgCredits.findFirst({
    where: eq(orgCredits.organizationId, context.organizationId)
  });

  if (orgCredits.balance < 1.00) {
    throw new Error('Insufficient org credits');
  }

  // Essay owned by org
  essayData.organizationId = context.organizationId;
  essayData.authorUserId = userId;

} else {
  // Check personal credits (existing logic)
  const userCredits = await db.query.credits.findFirst({
    where: eq(credits.userId, userId)
  });

  if (userCredits.balance < 1.00) {
    throw new Error('Insufficient credits');
  }

  // Essay owned by user
  essayData.userId = userId;
}
```

---

## UI Changes

### Context Switcher (Navbar)

```tsx
// Only shown if user is member of any organization
<Select value={currentContext}>
  <SelectItem value="personal">Personal</SelectItem>
  <SelectItem value="org_123">Acme University</SelectItem>
  <SelectItem value="org_456">Beta School</SelectItem>
</Select>
```

### Dashboard Changes

- Show different stats based on context
- Personal context: Only essays owned by user
- Org context: All essays submitted by org members

### History Page

- Personal context: Only personal essays
- Org context: All org essays (filterable by author)

---

## Migration Strategy

### Step 1: Database Migration
```bash
# Add new tables
bun run db:push

# Existing data (all user-owned essays) works as-is
# No data migration needed - essays.organizationId defaults to NULL
```

### Step 2: Update Code
- Add `src/libs/Organization.ts`
- Update essay submission to check context
- Update credit deduction to support both types
- Add organization CRUD endpoints

### Step 3: Add UI
- Context switcher in navbar
- Organization settings pages
- Member management UI

### Step 4: Deploy & Test
- Deploy to staging
- Test both personal and org flows
- Verify credit isolation (personal ≠ org credits)

---

## Why NOT Clerk Organizations?

**Clerk Organizations would:**
- ❌ Lock us into Clerk (can't switch auth providers)
- ❌ Cost $0.02/MAU over 10k users
- ❌ Limited customization (can't add org types, custom fields)
- ❌ Pricing model doesn't fit (we want org-based pricing, not user-based)

**Our custom implementation:**
- ✅ Full control over data model
- ✅ Clerk only for auth (provider-agnostic)
- ✅ Can switch to any auth provider (Supabase, Auth0, etc.) by just swapping `src/libs/Clerk.ts`
- ✅ Custom org types (school vs tutoring vs enterprise)
- ✅ Flexible billing (org credits separate from user credits)

---

## Security Considerations

### Ensure Proper Authorization

```typescript
// ALWAYS verify user has access to organization
async function submitOrgEssay(userId: string, orgId: string) {
  // Check membership
  await requireOrgMembership(userId, orgId, 'member');

  // Proceed with submission
}

async function viewOrgEssay(userId: string, essayId: string) {
  const essay = await db.query.essays.findFirst({
    where: eq(essays.id, essayId)
  });

  if (essay.organizationId) {
    // Verify user is member
    await requireOrgMembership(userId, essay.organizationId, 'member');
  } else {
    // Verify user owns it
    if (essay.userId !== userId) {
      throw new Error('Unauthorized');
    }
  }

  return essay;
}
```

### Prevent Cross-Context Attacks

- Don't trust client-side context selection
- Always verify on server
- Use database constraints to enforce ownership rules

---

## Summary

Phase 2 is designed to be a **clean addition** to the existing architecture:

1. ✅ Add 4 new tables (organizations, orgMemberships, orgCredits, orgCreditTransactions)
2. ✅ Add 2 nullable columns to existing tables (organizationId, authorUserId)
3. ✅ Add check constraints (ensure one owner type)
4. ✅ Add helper functions (Organization.ts)
5. ✅ Update business logic (check context before credit operations)
6. ✅ Add UI (context switcher, org settings)

**Existing user data remains unchanged** - all current essays stay user-owned, zero migration needed.

**Deployment risk: LOW** - Additive changes only, no breaking changes.
