#!/bin/bash
# Switch Convex MCP to dev-only mode with full access
# Use this for normal development

claude mcp remove convex -s local 2>/dev/null
claude mcp add convex -s local -- npx convex mcp start

echo "Convex MCP switched to DEV-ONLY mode (full access)"
echo "Restart Claude Code for changes to take effect"
