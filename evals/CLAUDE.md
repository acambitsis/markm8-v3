# MarkM8 Evals - Development Context

## Overview

This is a Python-based evaluation suite for assessing the quality of AI-generated feedback synthesis in the MarkM8 grading platform. It uses LLM-as-judge methodology via DeepEval.

**Parent project:** See `/CLAUDE.md` for main MarkM8 context.

---

## Tech Stack

| Component | Choice | Notes |
|-----------|--------|-------|
| **Runtime** | Python 3.12 | Pinned in `.python-version` |
| **Package Manager** | uv | Fast, modern Python tooling |
| **Eval Framework** | DeepEval | LLM-as-judge, G-Eval metrics |
| **Judge Model** | Claude Opus 4.5 (default) | Via OpenRouter + `OPENROUTER_API_KEY` |

---

## Quick Start

```bash
cd evals

# Install dependencies (uv creates .venv automatically)
uv sync

# Set API key (uses same key as main project)
export OPENROUTER_API_KEY=sk-or-...

# Run evaluations (default: Claude Opus 4.5)
uv run python synthesis_eval.py

# Or specify a different judge model
JUDGE_MODEL=google/gemini-3-pro-preview uv run python synthesis_eval.py
```

---

## Project Structure

```
evals/
├── CLAUDE.md           # This file - project context
├── pyproject.toml      # Python dependencies
├── uv.lock             # Lockfile (committed)
├── .python-version     # Python 3.12
├── .venv/              # Virtual env (gitignored)
├── synthesis_eval.py   # Main evaluation script
├── data/               # Test data (exported from Convex)
│   └── *.json
└── results/            # Evaluation outputs
    └── *.json
```

---

## What We're Evaluating

**Task:** Synthesis of feedback from multiple AI graders into unified student feedback.

**Input:**
- Original essay content
- Assignment brief & rubric
- Feedback from 3 independent grading runs

**Output:**
- Synthesized feedback (strengths, improvements, language tips)

**Evaluation Criteria:**

| Criterion | Description |
|-----------|-------------|
| **Coverage** | Are all key points from graders represented? |
| **Deduplication** | Were overlapping points merged effectively? |
| **Evidence Preservation** | Were specific quotes/examples retained? |
| **Actionability** | Are suggestions clear and specific? |
| **Rubric Alignment** | Does synthesis prioritize rubric criteria? |

---

## DeepEval Usage

We use G-Eval for custom LLM-as-judge metrics:

```python
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCase, LLMTestCaseParams

coverage_metric = GEval(
    name="Feedback Coverage",
    criteria="Evaluate whether the synthesis captures all key points from the original grader feedback. Score 1-5.",
    evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
    threshold=0.7,
    model="gpt-4o"
)
```

---

## Data Flow

1. **Export from Convex:** Run synthesis experiment, export results to JSON
2. **Prepare test cases:** Load JSON into DeepEval `LLMTestCase` objects
3. **Run evaluation:** DeepEval calls judge model (GPT-4o)
4. **Analyze results:** Scores, reasoning, pass/fail rates

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | Same key as main project - for judge model |
| `JUDGE_MODEL` | No | OpenRouter model ID (default: `anthropic/claude-opus-4.5`) |
| `DEEPEVAL_TELEMETRY` | No | Set to `false` to disable telemetry |

**Recommended judge models:**
1. `anthropic/claude-opus-4.5` (default)
2. `google/gemini-3-pro-preview`
3. `openai/gpt-5.2`

---

## Best Practices

1. **Use low temperature (0.1-0.2)** for consistent judge scores
2. **Binary or 3-5 point scales** are more reliable than 1-100
3. **Include chain-of-thought** - ask judge to explain reasoning
4. **Validate against humans** - target >85% agreement
5. **Run multiple times** - check score consistency

---

## Relationship to Main Project

This is **auxiliary tooling**, not part of the main Next.js/Convex application:

- Runs independently via `uv run`
- Does not affect Vercel/Convex deployments
- Data is exported from Convex, not read directly
- Results inform prompt optimization decisions

---

## Commands Reference

```bash
# Install/update dependencies
uv sync

# Add a new dependency
uv add <package>

# Run a script
uv run python <script.py>

# Run with pytest (DeepEval integrates with pytest)
uv run pytest <test_file.py>
```
