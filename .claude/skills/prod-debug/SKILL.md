---
name: prod-debug
description: Debug production issues using MCP servers (Sentry, Convex, Stripe). Use when investigating errors, checking production data, analyzing payment failures, or troubleshooting user-reported issues.
---

# Production Debugging with MCP Servers

Debug production issues systematically using the available MCP servers.

## Core Principle: Follow the Data

Production debugging follows a consistent pattern: **identify → correlate → trace**

1. **Identify** the issue (usually starts with an error or user report)
2. **Correlate** across systems (find the user, find related records)
3. **Trace** the data flow (what happened and in what order)

## MCP Server Roles

| Server | Primary Use | Key Insight |
|--------|-------------|-------------|
| **Sentry** | Error detection | What went wrong, who was affected |
| **Convex** | Application state | Current data state, audit trails |
| **Stripe** | Payment data | Payment status, customer records |

## Debugging Workflow

### Step 1: Start with Sentry

Sentry is typically the entry point—it captures errors with context.

**Goals:**
- Find the error and its stack trace
- Extract user identifiers (email, userId) from event context
- Understand when and how often it occurred

**Principle:** Sentry events often contain enough context to identify the affected user. Look in event tags, user context, and breadcrumbs.

### Step 2: Query Convex for State

Once you have user context, query Convex to understand the application state.

**Goals:**
- Find the user record and related data
- Check audit trails (transaction logs, status changes)
- Verify data consistency across related tables

**Principles:**
- User email is the universal correlator—start there
- Audit/transaction tables show what happened over time
- Status fields show current state; timestamps show progression
- Internal error tables may have details not shown to users

**Access modes:**
- Use `./scripts/mcp-convex-readonly.sh` for safe prod access
- Use `./scripts/mcp-convex-devonly.sh` for dev work with full access

### Step 3: Check Stripe if Payment-Related

For issues involving purchases, credits, or billing:

**Goals:**
- Find the customer by email
- Check payment intent status and any failure reasons
- Verify webhook events were processed

**Principles:**
- Stripe customer email should match Convex user email
- Payment amounts in Stripe are in cents (minor currency units)
- Failed payments have decline codes explaining why
- If credits weren't added, check if the webhook was received

## Common Debugging Patterns

### Pattern: User Reports Missing Data

1. Find user in Convex by email
2. Check the relevant data table for their records
3. Look at audit/transaction tables for history
4. Check Sentry for any errors during the operation

### Pattern: Background Job Failed

1. Find the error in Sentry
2. Get the job/record ID from error context
3. Query Convex for the record's current status
4. Check internal error tables for detailed failure info
5. Verify any refunds or rollbacks occurred

### Pattern: Payment Not Reflected

1. Find customer in Stripe by email
2. Check payment intent status (succeeded? failed?)
3. If succeeded, check Convex transaction logs for the purchase
4. If missing, check Sentry for webhook processing errors

### Pattern: Intermittent Errors

1. Search Sentry for the error pattern
2. Look at frequency and affected users
3. Check if it correlates with specific data states
4. Review Convex logs around error timestamps

## Key Principles

1. **Email is the universal key** — Users are identifiable by email across all systems

2. **Audit trails tell the story** — Transaction/log tables show what happened, not just current state

3. **Timestamps reveal sequence** — Compare timestamps across systems to understand order of operations

4. **Internal errors have more detail** — User-facing errors are sanitized; internal tables have raw details

5. **Webhooks are the integration point** — Issues with external services often manifest as webhook failures

6. **Read-only by default** — Use read-only mode for prod debugging to prevent accidental modifications

## Quick Reference

**Find a user:** Query by email (indexed in both Convex and Stripe)

**Check credit state:** Look at balance table + recent transactions

**Trace a grading:** Essay → Grade record → Status + timestamps → Error table if failed

**Trace a payment:** Stripe payment intent → Convex transaction log → Credit balance
