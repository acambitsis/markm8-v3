---
description: "Run all 4 PR validation agents in parallel"
argument-hint: "pr-number | 'all' | empty for git diff"
---

# PR Review - All Validators

You must launch ALL 4 PR validation agents in PARALLEL using a single message with multiple Task tool calls.

**What to review:**
- If $ARGUMENTS is empty: Review the current git diff (uncommitted + staged changes)
- If $ARGUMENTS is "all" or "codebase" or "full": Review the entire codebase
- Otherwise: Review the specified PR number or branch ($ARGUMENTS)

**Agents to launch (all in parallel):**

1. **pr-check-security** - Security & authorization validation
2. **pr-check-quality** - React, Next.js, TypeScript, and code quality patterns
3. **pr-check-data** - Database schema, queries, and data handling
4. **pr-check-structure** - File structure, organization, and imports

**Instructions:**

1. Determine what to review:
   - If $ARGUMENTS is empty: Tell agents to "Review the current git diff (git diff HEAD for uncommitted changes)"
   - If $ARGUMENTS is "all" or "codebase" or "full": Tell agents to "Review the entire codebase (all files in src/)"
   - Otherwise: Tell agents to "Review $ARGUMENTS" (e.g., PR #123 or branch feature/auth)

2. Launch all 4 agents in PARALLEL (single message, 4 Task tool uses):
   - pr-check-security
   - pr-check-quality
   - pr-check-data
   - pr-check-structure

3. Wait for all agents to complete

4. Summarize the results from all 4 agents

5. Provide a final RECOMMENDATION:
   - **BLOCK** - if any agent found DEFINITE violations
   - **APPROVE WITH REVIEW** - if only LIKELY violations found
   - **APPROVE** - if all checks passed

**CRITICAL:** You MUST use a single message with 4 Task tool calls to run these agents in parallel. Do NOT run them sequentially.
