---
description: "Create well-structured GitHub issues with consistent formatting"
argument-hint: "[title] or empty to analyze context"
allowed-tools: Bash, Read, Grep, Glob
---

# Create GitHub Issue

Create GitHub issues using this structure:

## Issue Body Format

    ## Summary
    1-3 sentences.

    ## Priority
    **High/Medium/Low** - Brief justification.

    ## Current State
    What exists today (if applicable).

    ## Proposed Changes
    - Specific changes needed
    - Reference files/functions affected

    ## Acceptance Criteria
    - [ ] What "done" looks like

    ## References
    - file.ts:123 - Relevant code locations

    ---
    Generated with [Claude Code](https://claude.com/claude-code)

## Clustering

Before creating, consider grouping:
- Related config changes = ONE issue (e.g., all LLM params together)
- Independent concerns = SEPARATE issues
- Ask user about clustering if unclear

## Execution

1. Draft content and show user before creating
2. Check labels exist before using: gh label list
3. Use HEREDOC for body: --body "$(cat <<'EOF' ... EOF)"
4. Return the issue URL
