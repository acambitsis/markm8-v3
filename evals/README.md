# MarkM8 Evals

LLM-as-judge evaluation suite for assessing AI feedback synthesis quality.

## Setup

```bash
cd evals
uv sync
export OPENROUTER_API_KEY=sk-or-...  # Same key as main project
```

## Run

```bash
# Default judge: Claude Opus 4.5
uv run python synthesis_eval.py

# Or use a different judge model
JUDGE_MODEL=google/gemini-3-pro-preview uv run python synthesis_eval.py
```

## Documentation

See [CLAUDE.md](./CLAUDE.md) for full context.
