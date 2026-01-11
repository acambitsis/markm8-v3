#!/bin/bash
# Switch Convex MCP to read-only mode with access to both dev and prod
# Use this for production debugging

claude mcp remove convex -s local 2>/dev/null
claude mcp add convex -s local -- npx convex mcp start \
  --dangerously-enable-production-deployments \
  --disable-tools run,envSet,envRemove

echo "Convex MCP switched to READ-ONLY mode (dev + prod)"
echo "Restart Claude Code for changes to take effect"
