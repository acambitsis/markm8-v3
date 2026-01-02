---
description: "Advise on packaging context as skill, agent, or command"
argument-hint: "[create skill|agent|command] or empty for advice"
---

# Package as Claude Code Construct

You've been invoked to help the user decide how to package a workflow or capability from the preceding conversation context into a reusable Claude Code construct.

## Your Task

If $ARGUMENTS is empty or asks for "advice":
Analyze the preceding conversation context and recommend whether it should be packaged as a Skill, Agent, or Custom Slash Command.

If $ARGUMENTS contains "create skill", "create agent", or "create command":
Create the specified construct based on the preceding conversation context.

---

## Decision Framework

### Use a Custom Slash Command when:
- The user wants explicit, on-demand invocation (the /command syntax)
- It is a simple, single-purpose prompt (fits in one file)
- The action is predictable and consistent every time
- Examples: /commit, /review, /summarize

Characteristics:
- Single .md file in .claude/commands/
- User-invoked (manual trigger)
- Supports arguments (ARGUMENTS variable, or positional $1, $2)
- Can include file contents with @ prefix
- Can run bash commands with exclamation mark prefix

### Use an Agent when:
- The task requires specialized expertise with detailed instructions
- You need context isolation (separate conversation window)
- The workflow is complex and multi-step
- Different tool restrictions are needed
- The agent should be auto-delegated by Claude based on task matching
- Examples: code-reviewer, security-validator, documentation-writer

Characteristics:
- Single .md file in .claude/agents/
- Model-invoked (Claude auto-delegates) AND can be explicitly invoked
- Runs in separate context window (does not bloat main conversation)
- Can restrict tools, specify model, set permission mode
- Best for team workflows needing standardization

### Use a Skill when:
- Claude should auto-detect when to apply this capability
- The capability requires multiple supporting files (scripts, templates, docs)
- It is a reusable expertise package that applies contextually
- You want progressive disclosure (files loaded only when needed)
- Examples: pdf-processing, api-client-generator, react-component

Characteristics:
- Directory with SKILL.md plus optional supporting files
- Model-invoked (Claude autonomously decides when to use)
- Integrates into main conversation (no context isolation)
- Supports scripts, templates, reference documentation
- Best for complex, multi-file capabilities

---

## Quick Comparison

| Aspect | Slash Command | Agent | Skill |
|--------|---------------|-------|-------|
| Invocation | Manual /cmd | Auto + manual | Auto only |
| Files | Single .md | Single .md | Directory + SKILL.md |
| Context | Main conversation | Separate window | Main conversation |
| Discovery | User types / | Claude matches task | Claude matches context |
| Complexity | Simple prompts | Complex workflows | Multi-file capabilities |
| Tool control | allowed-tools | tools field | allowed-tools |
| Best for | Quick shortcuts | Specialized workers | Packaged expertise |

---

## When Providing Advice

1. Summarize what the user accomplished in the preceding context
2. Identify the core capability or workflow
3. Recommend the most appropriate construct with reasoning
4. Explain why the alternatives are less suitable
5. Ask if they want you to create it

---

## Creating Constructs

### Creating a Slash Command

Location: .claude/commands/command-name.md (project) or ~/.claude/commands/command-name.md (personal)

Format (YAML frontmatter followed by markdown body):

    ---
    description: "Brief description shown in /help"
    argument-hint: "[optional hint for arguments]"
    allowed-tools: Tool1, Tool2
    ---

    # Command Title

    Instructions for what Claude should do when this command is invoked.

    Use ARGUMENTS variable for all arguments, or $1, $2 for positional.
    Use @path/to/file to include file contents.
    Use exclamation-mark-command to run shell commands before execution.

### Creating an Agent

Location: .claude/agents/agent-name.md (project) or ~/.claude/agents/agent-name.md (personal)

Format (YAML frontmatter followed by markdown body):

    ---
    name: agent-name
    description: What this agent does and when to use it. Critical for auto-discovery.
    tools: Read, Grep, Glob, Bash, Edit, Write
    model: sonnet
    permissionMode: default
    ---

    # Agent Title

    ## Purpose

    What this agent specializes in.

    ## Instructions

    Step-by-step guidance for the agent.

    ## Output Format

    How results should be formatted.

Agent fields:
- name: lowercase, hyphens (required)
- description: when to use (required, critical for discovery)
- tools: comma-separated list (optional, inherits all if omitted)
- model: sonnet, opus, haiku, or inherit (optional)
- permissionMode: default, acceptEdits, bypassPermissions, plan, ignore (optional)
- skills: comma-separated skill names to auto-load (optional)

### Creating a Skill

Use the create-skill skill for comprehensive guidance.

The create-skill skill (located at ~/.claude/skills/create-skill/SKILL.md) contains the full specification including:
- Naming rules and constraints
- SKILL.md format and required fields
- Writing effective descriptions for discovery
- Supporting file structure
- Best practices

When creating a skill, invoke that skill for the detailed instructions, then apply them to the context from this conversation.

---

## Execution

1. If asked for advice, analyze the preceding context and provide a recommendation
2. If asked to create, generate the appropriate construct with:
   - Clear, descriptive name
   - Comprehensive description (critical for discovery)
   - All relevant instructions from the context
   - Appropriate tool restrictions if needed
3. Write the file(s) to the appropriate location
4. Confirm creation and explain how to use it
