"""
Synthesis Quality Evaluation

Evaluates the quality of AI-generated feedback synthesis using LLM-as-judge.

Usage:
    uv run python synthesis_eval.py

Requires:
    OPENROUTER_API_KEY environment variable

Optional:
    JUDGE_MODEL - OpenRouter model ID (default: anthropic/claude-opus-4.5)

Recommended judge models (in order of preference):
    - anthropic/claude-opus-4.5
    - google/gemini-3-pro-preview
    - openai/gpt-5.2
"""

import json
import os
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv

# Load .env file from evals directory
load_dotenv(Path(__file__).parent / ".env")

# Disable telemetry before importing deepeval
os.environ["DEEPEVAL_TELEMETRY"] = "false"

from deepeval import evaluate
from deepeval.metrics import GEval
from deepeval.models import DeepEvalBaseLLM
from deepeval.test_case import LLMTestCase, LLMTestCaseParams

# Default judge model - best models for evaluation
DEFAULT_JUDGE_MODEL = "anthropic/claude-opus-4.5"

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


# -----------------------------------------------------------------------------
# OpenRouter Model Wrapper
# -----------------------------------------------------------------------------


class OpenRouterModel(DeepEvalBaseLLM):
    """Custom DeepEval model wrapper for OpenRouter API."""

    def __init__(
        self,
        model: str = DEFAULT_JUDGE_MODEL,
        api_key: Optional[str] = None,
    ):
        self.model_name = model
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError(
                "OPENROUTER_API_KEY environment variable is required. "
                "Set it with: export OPENROUTER_API_KEY=sk-or-..."
            )

    def load_model(self):
        """Return the model identifier."""
        return self.model_name

    def generate(self, prompt: str, schema: Optional[dict] = None) -> str:
        """Synchronous generation via OpenRouter API."""
        # Debug: log the prompt being sent
        if os.environ.get("DEBUG_PROMPTS"):
            print("\n" + "=" * 80)
            print("PROMPT SENT TO JUDGE MODEL:")
            print("=" * 80)
            print(prompt)
            print("=" * 80 + "\n")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://markm8.com",
            "X-Title": "MarkM8 Evals",
        }

        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,  # Low temperature for consistent evaluation
        }

        # Add JSON schema if provided (for structured output)
        if schema:
            payload["response_format"] = {
                "type": "json_schema",
                "json_schema": schema,
            }

        with httpx.Client(timeout=120.0) as client:
            response = client.post(OPENROUTER_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def a_generate(self, prompt: str, schema: Optional[dict] = None) -> str:
        """Asynchronous generation via OpenRouter API."""
        # Debug: log the prompt being sent
        if os.environ.get("DEBUG_PROMPTS"):
            print("\n" + "=" * 80)
            print("PROMPT SENT TO JUDGE MODEL:")
            print("=" * 80)
            print(prompt)
            print("=" * 80 + "\n")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://markm8.com",
            "X-Title": "MarkM8 Evals",
        }

        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
        }

        if schema:
            payload["response_format"] = {
                "type": "json_schema",
                "json_schema": schema,
            }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                OPENROUTER_API_URL, headers=headers, json=payload
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    def get_model_name(self) -> str:
        """Return the model identifier."""
        return self.model_name


# -----------------------------------------------------------------------------
# Evaluation Metrics
# -----------------------------------------------------------------------------


def create_metrics(model: DeepEvalBaseLLM) -> list[GEval]:
    """
    Create evaluation metrics using the provided judge model.

    Context: The synthesis takes feedback from multiple graders and distills it
    into a FIXED number of points. This means some feedback will be dropped.
    The goal is to keep the MOST relevant, impactful, and helpful feedback.
    """

    prioritization_metric = GEval(
        name="Prioritization",
        evaluation_steps=[
            "Identify all feedback points from each grader in the Input (strengths and improvements)",
            "Rank these points by potential impact on student learning and essay quality",
            "Check which points were included in the Actual Output",
            "Assess whether the highest-impact points were kept and lower-value points dropped",
            "Score: 1=kept trivial points, dropped important ones; 3=reasonable selection; 5=excellent prioritization of highest-impact feedback",
        ],
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
        threshold=0.6,
        model=model,
    )

    helpfulness_metric = GEval(
        name="Helpfulness",
        evaluation_steps=[
            "Read each point in the Actual Output from a student's perspective",
            "For each point, assess: Will this actually help the student improve their writing?",
            "Check if suggestions are specific enough to act on (not vague platitudes)",
            "Check if the feedback explains WHY something matters, not just WHAT to fix",
            "Score: 1=unhelpful or confusing; 3=somewhat helpful; 5=highly actionable guidance that will clearly improve the essay",
        ],
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
        threshold=0.6,
        model=model,
    )

    clarity_metric = GEval(
        name="Clarity",
        evaluation_steps=[
            "Read each point in the Actual Output",
            "Check if each point is clearly written and easy to understand",
            "Check if points are concise (no unnecessary words or filler)",
            "Check if similar ideas from different graders were merged cleanly (not jumbled)",
            "Score: 1=confusing or verbose; 3=mostly clear; 5=crystal clear and concise throughout",
        ],
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
        threshold=0.6,
        model=model,
    )

    evidence_metric = GEval(
        name="Evidence",
        evaluation_steps=[
            "Identify specific quotes, examples, or references in the Input feedback",
            "Check which specific evidence was preserved in the Actual Output",
            "Assess whether the Actual Output is grounded in specifics vs generic statements",
            "Note: Some evidence may be appropriately dropped if the point was low-priority",
            "Score: 1=generic platitudes with no specifics; 3=some evidence; 5=well-grounded with specific examples/quotes where appropriate",
        ],
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
        threshold=0.6,
        model=model,
    )

    return [
        prioritization_metric,
        helpfulness_metric,
        clarity_metric,
        evidence_metric,
    ]


# -----------------------------------------------------------------------------
# Test Data
# -----------------------------------------------------------------------------


def load_test_cases_from_file(filepath: str) -> list[LLMTestCase]:
    """Load test cases from a JSON file exported from the synthesis experiment."""
    with open(filepath) as f:
        data = json.load(f)

    test_cases = []
    for item in data:
        test_case = LLMTestCase(
            input=item["original_feedback"],  # The 3 grader outputs
            actual_output=item["synthesized_feedback"],  # Model's synthesis
            context=[item.get("essay_content", "")],  # Optional: essay for reference
        )
        test_cases.append(test_case)

    return test_cases


def create_sample_test_case() -> LLMTestCase:
    """Create a sample test case for demonstration."""

    # Sample grader feedback (input to synthesis)
    original_feedback = """
    <grader_1 model="grok-4" percentage="72">
    Strengths:
    - Clear thesis statement: "The essay opens with a well-defined thesis that guides the reader."
    - Good use of historical evidence with multiple primary sources cited.

    Improvements:
    - Paragraph transitions need work. Add transitional phrases like "Furthermore" or "In contrast".
    - Conclusion is weak - merely restates thesis without synthesis.
    </grader_1>

    <grader_2 model="gemini-3" percentage="68">
    Strengths:
    - Strong opening paragraph that hooks the reader.
    - Effective use of quotations from historians.
    - Logical argument structure.

    Improvements:
    - Missing counterarguments - essay does not address opposing viewpoints.
    - Some claims lack evidence in paragraph 4.
    </grader_2>

    <grader_3 model="gpt-5" percentage="75">
    Strengths:
    - Excellent thesis that is specific and arguable.
    - Good paragraph structure with clear topic sentences.

    Improvements:
    - Transitions between sections are abrupt, especially from economic to social analysis.
    - Conclusion could be stronger - feels rushed.
    - Citation formatting is inconsistent (MLA vs APA).
    </grader_3>
    """

    # Sample synthesized feedback (output to evaluate)
    # Constrained to 3-4 items per category as per synthesis prompt
    synthesized_feedback = """
    ## Strengths (3-4 most impactful)

    1. **Clear and Arguable Thesis**: Your essay opens with a well-defined, specific thesis that effectively guides the reader. As grader 3 noted: "This essay argues that technological innovation, rather than political reform, drove social change" - this is specific and arguable.

    2. **Effective Use of Evidence**: You demonstrate strong use of historical evidence, including quotations from historians and primary sources. The vivid description of factory conditions effectively draws readers in.

    3. **Logical Structure**: The essay follows a logical argument structure with clear topic sentences in each paragraph, building points coherently.

    ## Areas for Improvement (3-4 most actionable)

    1. **Strengthen Transitions**: The transitions between sections need work, particularly the shift from economic to social analysis. Add a bridging paragraph or transitional phrases like "Furthermore," "In contrast," or "Building on this economic foundation."

    2. **Develop the Conclusion**: Your conclusion restates the thesis without synthesis and feels rushed. Expand it to discuss broader implications - why does this matter today?

    3. **Address Counterarguments**: The essay does not address opposing viewpoints. Include a paragraph acknowledging and refuting alternative perspectives to strengthen your argument.

    ## Language Tips

    - Standardize citation formatting - currently mixing MLA and APA styles
    """

    return LLMTestCase(
        input=original_feedback,
        actual_output=synthesized_feedback,
    )


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------


def main():
    """Run the evaluation."""
    # Check for API key early
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        print("Error: OPENROUTER_API_KEY environment variable is required.")
        print("Set it with: export OPENROUTER_API_KEY=sk-or-...")
        return None

    # Get judge model from env or use default
    judge_model_id = os.environ.get("JUDGE_MODEL", DEFAULT_JUDGE_MODEL)

    # Create OpenRouter model wrapper
    judge_model = OpenRouterModel(model=judge_model_id, api_key=api_key)

    # Create metrics with the judge model
    metrics = create_metrics(judge_model)

    print("=" * 60)
    print("SYNTHESIS QUALITY EVALUATION")
    print("=" * 60)
    print(f"Judge model: {judge_model_id}")
    print(f"Metrics: {[m.name for m in metrics]}")
    print("=" * 60)

    # Check for data file or use sample
    data_dir = Path(__file__).parent / "data"
    data_file = data_dir / "synthesis_results.json"

    if data_file.exists():
        print(f"\nLoading test cases from: {data_file}")
        test_cases = load_test_cases_from_file(str(data_file))
    else:
        print("\nNo data file found. Using sample test case.")
        print(f"(Place test data at: {data_file})")
        test_cases = [create_sample_test_case()]

    print(f"Test cases: {len(test_cases)}")
    print("-" * 60)

    # Run evaluation
    results = evaluate(test_cases, metrics)

    # Summary
    print("\n" + "=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)

    for metric in metrics:
        scores = [
            tc.metrics_metadata.get(metric.name, {}).get("score", 0)
            for tc in test_cases
            if hasattr(tc, "metrics_metadata")
        ]
        if scores:
            avg = sum(scores) / len(scores)
            print(f"{metric.name}: {avg:.2f} (threshold: {metric.threshold})")

    return results


if __name__ == "__main__":
    main()
