"""
Synthesis Model Benchmark

Benchmarks different models for feedback synthesis quality, speed, and cost.

Usage:
    uv run python benchmark_synthesis.py

Requires:
    OPENROUTER_API_KEY environment variable (or .env file)
"""

import json
import os
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv

# Load .env file
load_dotenv(Path(__file__).parent / ".env")

# Disable telemetry before importing deepeval
os.environ["DEEPEVAL_TELEMETRY"] = "false"

from deepeval import evaluate
from deepeval.metrics import GEval
from deepeval.models import DeepEvalBaseLLM
from deepeval.test_case import LLMTestCase, LLMTestCaseParams

# OpenRouter API
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Models to benchmark for synthesis
SYNTHESIS_MODELS = [
    "anthropic/claude-opus-4.5",
    "anthropic/claude-sonnet-4",
    "openai/gpt-5.2",
    "google/gemini-3-flash-preview",
]

# Judge model for evaluation
JUDGE_MODEL = "anthropic/claude-opus-4.5"


# -----------------------------------------------------------------------------
# Test Cases (exported from Convex dev)
# -----------------------------------------------------------------------------

TEST_CASES = [
    {
        "id": "hamlet-analysis",
        "essay_title": "Character Analysis: Hamlet's Internal Conflicts",
        "essay_content": """In William Shakespeare's tragic play "Hamlet," the titular character undergoes a profound psychological journey that has fascinated audiences and scholars for over four centuries. Prince Hamlet of Denmark is not a simple hero seeking revenge; he is a deeply conflicted individual torn between action and contemplation, duty and morality, certainty and doubt. This essay argues that Hamlet's internal conflicts—particularly his struggle between the obligation to avenge his father and his philosophical questioning of that obligation—define his character and ultimately lead to his tragic fate.""",
        "rubric": """Literary Analysis (40%) - Demonstrates deep understanding of character psychology
Textual Evidence (30%) - Selects appropriate quotes, integrates smoothly
Organization & Writing (20%) - Clear thesis, logical structure
MLA Format (10%) - Correct citations""",
        "grader_feedback": [
            {
                "model": "x-ai/grok-4",
                "percentage": 92,
                "feedback": {
                    "strengths": [
                        {"title": "Strong Thesis Statement", "description": "The thesis effectively establishes a two-pronged argument about Hamlet's internal conflicts.", "evidence": "The introduction explicitly states the essay's argument about duty vs philosophical questioning."},
                        {"title": "Effective Use of Textual Evidence", "description": "Powerful and relevant quotes directly support the analysis of Hamlet's paralysis.", "evidence": "The use of 'the native hue of resolution / Is sicklied o'er with the pale cast of thought' effectively underpins the argument."},
                        {"title": "Insightful Character Analysis", "description": "Goes beyond plot summary to explore psychological motivations.", "evidence": "Analysis of prayer scene shows good grasp of moral procrastination."}
                    ],
                    "improvements": [
                        {"title": "Word Count and Depth", "description": "Essay is approximately 600 words, falling short of 800-1000 requirement.", "suggestion": "Expand analysis of the Gravedigger scene and compare Act 1 vs Act 5."},
                        {"title": "Quote Integration", "description": "Some quotes are 'floating' rather than woven grammatically.", "suggestion": "Practice the 'weave' method where quotes become grammatical parts of sentences."}
                    ]
                }
            },
            {
                "model": "google/gemini-3-pro-preview",
                "percentage": 82,
                "feedback": {
                    "strengths": [
                        {"title": "Clear Argument Structure", "description": "Essay presents conflicts in logical progression.", "evidence": "Movement from ghost encounter to prayer scene to resolution."},
                        {"title": "Understanding of Themes", "description": "Demonstrates grasp of action vs contemplation theme.", "evidence": "Discussion of Hamlet's philosophical nature."}
                    ],
                    "improvements": [
                        {"title": "Deeper Textual Analysis", "description": "Could analyze language patterns more closely.", "suggestion": "Examine Hamlet's soliloquies for shifts in imagery and tone."},
                        {"title": "Secondary Conflicts", "description": "Gertrude/Ophelia section feels rushed.", "suggestion": "Connect treatment of women to internal duty conflict."},
                        {"title": "Conclusion Strength", "description": "Ending is somewhat general.", "suggestion": "Reference specific examples in concluding synthesis."}
                    ]
                }
            },
            {
                "model": "openai/gpt-5.2",
                "percentage": 90,
                "feedback": {
                    "strengths": [
                        {"title": "Sophisticated Thesis", "description": "Thesis is specific and arguable, directly addressing the prompt.", "evidence": "Clear statement about conflicts defining character and leading to tragedy."},
                        {"title": "Prayer Scene Analysis", "description": "Excellent analysis of Hamlet's moral reasoning.", "evidence": "Discussion of waiting for Claudius's soul to be damned."},
                        {"title": "Academic Tone", "description": "Maintains appropriate scholarly register throughout.", "evidence": "Consistent formal language and analytical approach."}
                    ],
                    "improvements": [
                        {"title": "Length Requirement", "description": "Below word count limits depth of analysis.", "suggestion": "Develop the resolution phase more thoroughly."},
                        {"title": "MLA Citations", "description": "Act/scene/line citations need consistent formatting.", "suggestion": "Use (3.1.84-85) format consistently throughout."}
                    ]
                }
            }
        ]
    },
    {
        "id": "industrial-revolution",
        "essay_title": "The Impact of the Industrial Revolution on 19th Century Britain",
        "essay_content": """The Industrial Revolution, which began in Britain in the late 18th century, marked one of the most significant turning points in human history. While historians have long debated its precise origins and timeline, there is little dispute about its profound and lasting effects on British society and economy. This essay argues that the Industrial Revolution fundamentally restructured British life, creating both unprecedented economic opportunities and severe social dislocations that would define the character of modern industrial society.""",
        "rubric": """Thesis - Clear, specific, arguable thesis that guides the essay
Evidence - Extensive use of primary and secondary sources
Analysis - Deep analysis connecting evidence to thesis
Structure - Excellent organization with smooth transitions
Citations - Perfect Chicago style formatting""",
        "grader_feedback": [
            {
                "model": "x-ai/grok-4",
                "percentage": 78,
                "feedback": {
                    "strengths": [
                        {"title": "Clear Narrative Flow", "description": "Essay maintains compelling narrative voice throughout.", "evidence": "Smooth transition from economic changes to social consequences."},
                        {"title": "Strong Use of Historical Data", "description": "Includes specific statistics that ground arguments.", "evidence": "Manchester population growth from 25,000 to 300,000."},
                        {"title": "Balance of Topics", "description": "Successfully addresses both social and economic impacts.", "evidence": "Equal coverage of factory system, urbanization, and class emergence."}
                    ],
                    "improvements": [
                        {"title": "Citation Format", "description": "Chicago style citations missing.", "suggestion": "Add footnotes for every statistic and quote."},
                        {"title": "Primary Sources", "description": "Mentions Engels but doesn't quote directly.", "suggestion": "Include direct quotes from factory inspector reports."},
                        {"title": "Thesis Specificity", "description": "Thesis is somewhat generic.", "suggestion": "Take a more specific stance on the nature of restructuring."}
                    ]
                }
            },
            {
                "model": "google/gemini-3-pro-preview",
                "percentage": 78,
                "feedback": {
                    "strengths": [
                        {"title": "Sophisticated Vocabulary", "description": "Strong command of academic language.", "evidence": "Phrases like 'severe social dislocations' and 'industrial proletariat'."},
                        {"title": "Historical Knowledge", "description": "Demonstrates solid understanding of major shifts.", "evidence": "Correct identification of urbanization and factory system."}
                    ],
                    "improvements": [
                        {"title": "Word Count", "description": "Essay is significantly shorter than required 1500 words.", "suggestion": "Expand existing points with more case studies."},
                        {"title": "Bibliography Required", "description": "No bibliography provided.", "suggestion": "Create bibliography listing all sources consulted."},
                        {"title": "Primary Source Usage", "description": "Underutilizes primary documents.", "suggestion": "Quote from Sadler Committee Report or Chartist petitions."}
                    ]
                }
            },
            {
                "model": "anthropic/claude-opus-4.5",
                "percentage": 74,
                "feedback": {
                    "strengths": [
                        {"title": "Historiographical Engagement", "description": "References both contemporary observers and later historians.", "evidence": "Mentions Hobsbawm, Engels, Adam Smith, and Marx."},
                        {"title": "Effective Balance", "description": "Dedicates appropriate space to economic and social analysis.", "evidence": "Roughly equal coverage of both dimensions."}
                    ],
                    "improvements": [
                        {"title": "Citations Missing", "description": "No Chicago-style footnotes present.", "suggestion": "Add footnotes for all factual claims and quotes."},
                        {"title": "Conclusion Synthesis", "description": "Conclusion summarizes but doesn't fully synthesize.", "suggestion": "Return to specific evidence while maintaining broader synthesis."},
                        {"title": "Transitions", "description": "Movement between sections somewhat abrupt.", "suggestion": "Add transitional sentences connecting economic to social."}
                    ]
                }
            }
        ]
    },
    {
        "id": "legal-advice-1",
        "essay_title": "Employment Tribunal Advice – Harassment and Unfair Dismissal Claims",
        "essay_content": """Task 1: Letter of Advice

Firm 3
Campus, Glasney Lodge, Penryn TR10 9FE

To: Mr Duncan Goode
Date: 14 May 2025
Subject: Employment Tribunal Advice – Harassment and Unfair Dismissal Claims

Dear Mr Goode,

Thank you for contacting us in relation to your Employment Tribunal claim. This letter sets out our advice regarding the legal claims you are pursuing against Cann Abel Solicitors. As the hearing has not yet taken place, the purpose of this letter is to advise you on the relevant law, potential remedies, and what to expect.""",
        "rubric": """Analysis/argument - critically analyse and apply legal concepts, develop reasoned argument
Knowledge/understanding - accurate knowledge, explain and apply sources
Use of materials/research - locate and engage with sources, proper OSCOLA
Presentation - clear, logical structure, concise language""",
        "grader_feedback": [
            {
                "model": "x-ai/grok-4",
                "percentage": 65,
                "feedback": {
                    "strengths": [
                        {"title": "Clear Legal Issue Identification", "description": "Successfully identifies harassment and unfair dismissal claims.", "evidence": "Sections correctly separate claims under s.26 EqA 2010 and s.94 ERA 1996."},
                        {"title": "Relevant Case Law", "description": "Integrates appropriate authorities.", "evidence": "References to Driskel, Reed v Stedman, and Burchell."},
                        {"title": "Practical Remedies Discussion", "description": "Addresses Vento bands and financial losses.", "evidence": "Section 6 outlines remedy brackets clearly."}
                    ],
                    "improvements": [
                        {"title": "OSCOLA Referencing", "description": "Citations not in proper footnote format.", "suggestion": "Add full OSCOLA footnotes for every case and statute."},
                        {"title": "Professional Tone", "description": "Some informal phrasing remains.", "suggestion": "Ensure letter flows as professional document."},
                        {"title": "Grammar Issues", "description": "Comma splices and run-on sentences present.", "suggestion": "Proofread for sentence boundaries."}
                    ]
                }
            },
            {
                "model": "google/gemini-3-pro-preview",
                "percentage": 58,
                "feedback": {
                    "strengths": [
                        {"title": "Issue Spotting", "description": "Identifies core legal framework correctly.", "evidence": "Distinguishes between different types of harassment claims."},
                        {"title": "Case Integration", "description": "Uses relevant authorities.", "evidence": "Appropriate selection of ET cases."}
                    ],
                    "improvements": [
                        {"title": "OSCOLA Format", "description": "Missing proper footnotes.", "suggestion": "Implement full OSCOLA citation in footnotes."},
                        {"title": "Reflective Depth", "description": "Part B analysis is descriptive rather than analytical.", "suggestion": "Use Gibbs cycle to structure reflection."},
                        {"title": "Letter Structure", "description": "Introduction contains fragments.", "suggestion": "Ensure opening paragraph is grammatically complete."},
                        {"title": "Proofreading", "description": "Multiple typos present.", "suggestion": "Final proofread for spelling and grammar."}
                    ]
                }
            },
            {
                "model": "openai/gpt-5.2",
                "percentage": 60,
                "feedback": {
                    "strengths": [
                        {"title": "Legal Framework", "description": "Correctly applies statutory provisions.", "evidence": "Accurate breakdown of EqA 2010 sections."},
                        {"title": "Honest Reflection", "description": "Part A shows genuine self-awareness.", "evidence": "Discussion of ADHD challenges is authentic."}
                    ],
                    "improvements": [
                        {"title": "Citation Style", "description": "OSCOLA not properly implemented.", "suggestion": "Use footnotes with full case citations."},
                        {"title": "Analysis Depth", "description": "Could expand on ACAS Code implications.", "suggestion": "Reference ACAS Code for procedural fairness."},
                        {"title": "Language Register", "description": "Informal contractions in reflection.", "suggestion": "Maintain academic register throughout."}
                    ]
                }
            }
        ]
    },
    {
        "id": "legal-advice-2",
        "essay_title": "Legal Advice on Mediation Settlements in Road Accident Claims",
        "essay_content": """**Gen AI Declaration**

AI-supported use is permitted in this assessment. I acknowledge the use of GenAI tools for developing ideas and research.

**Letter of Advice**

Re: Mediation Settlement - Road Accident Claim

Dear Client,

Following our recent consultation regarding your road traffic accident claim, I write to provide formal advice on the mediation settlement proposal received from the defendant's insurers.""",
        "rubric": """Analysis/argument - critically analyse legal concepts, develop reasoned argument
Knowledge/understanding - accurate knowledge of tort law and procedure
Use of materials - engage with sources, proper OSCOLA referencing
Presentation - clear structure, professional format""",
        "grader_feedback": [
            {
                "model": "x-ai/grok-4",
                "percentage": 78,
                "feedback": {
                    "strengths": [
                        {"title": "Clear Structure", "description": "Logical progression through liability, damages, and advice.", "evidence": "Distinct headings guide reader through analysis."},
                        {"title": "Accurate Legal Principles", "description": "Correctly identifies primary/secondary victim distinction.", "evidence": "Proper application of Alcock control mechanisms."},
                        {"title": "Commercial Awareness", "description": "Addresses practical litigation risks.", "evidence": "Discussion of costs and trial uncertainty."}
                    ],
                    "improvements": [
                        {"title": "Citation Mechanics", "description": "Repetitive footnotes instead of cross-references.", "suggestion": "Use 'ibid' or 'Case Name (n X)' for subsequent citations."},
                        {"title": "Client Tone", "description": "Occasionally too academic.", "suggestion": "Move case names to footnotes, explain principles plainly."},
                        {"title": "Damages Basis", "description": "Specific figures appear hypothetical.", "suggestion": "Use JCG ranges rather than invented numbers."}
                    ]
                }
            },
            {
                "model": "google/gemini-3-pro-preview",
                "percentage": 65,
                "feedback": {
                    "strengths": [
                        {"title": "Legal Accuracy", "description": "Sound understanding of negligence principles.", "evidence": "Correct duty of care analysis."},
                        {"title": "Professional Format", "description": "Appropriate letter structure.", "evidence": "Clear headings and client address."}
                    ],
                    "improvements": [
                        {"title": "OSCOLA Compliance", "description": "Footnotes missing or incomplete.", "suggestion": "Add full citations for all authorities."},
                        {"title": "Primary Victim Analysis", "description": "Could be more detailed.", "suggestion": "Expand on foreseeability requirements."},
                        {"title": "Quantum Discussion", "description": "Needs more precision.", "suggestion": "Reference specific JCG brackets."}
                    ]
                }
            },
            {
                "model": "anthropic/claude-opus-4.5",
                "percentage": 72,
                "feedback": {
                    "strengths": [
                        {"title": "Logical Organization", "description": "Well-structured analysis framework.", "evidence": "Clear progression from liability to remedies."},
                        {"title": "Appropriate Hedging", "description": "Uses appropriate legal caveats.", "evidence": "Phrases like 'on balance' and 'subject to evidence'."}
                    ],
                    "improvements": [
                        {"title": "Source Integration", "description": "Some footnotes contain text not sources.", "suggestion": "Ensure footnotes are strictly for authorities."},
                        {"title": "String Citations", "description": "Avoid citing multiple cases without purpose.", "suggestion": "Each citation should add distinct value."},
                        {"title": "Formatting Consistency", "description": "Some inconsistent styling.", "suggestion": "Review document for uniform presentation."}
                    ]
                }
            }
        ]
    },
    {
        "id": "constitutional-law",
        "essay_title": "Comparative Constitutional Analysis: UK and South Africa",
        "essay_content": """This essay examines the fundamental differences between the constitutional frameworks of the United Kingdom and South Africa, focusing on the separation of powers doctrine and mechanisms for executive accountability. While both nations share a common law heritage, their approaches to constitutional supremacy and judicial review diverge significantly.""",
        "rubric": """Analysis - critically analyse constitutional concepts and comparative frameworks
Knowledge - accurate understanding of both constitutional systems
Research - engage with primary sources and academic commentary
Presentation - logical structure, proper OSCOLA citations""",
        "grader_feedback": [
            {
                "model": "x-ai/grok-4",
                "percentage": 65,
                "feedback": {
                    "strengths": [
                        {"title": "Comparative Framework", "description": "Consistently juxtaposes both systems.", "evidence": "Section 2 explicitly contrasts UK fusion vs SA separation."},
                        {"title": "Case Law Usage", "description": "Good selection from both jurisdictions.", "evidence": "Uses Doctors for Life, EFF, Jackson, and Miller II."},
                        {"title": "Theoretical Engagement", "description": "Incorporates academic perspectives.", "evidence": "References Dicey, Bagehot, and Kavanagh."}
                    ],
                    "improvements": [
                        {"title": "Analysis Depth", "description": "Sometimes stops at description.", "suggestion": "Critically evaluate effectiveness of each system."},
                        {"title": "Terminology Precision", "description": "Some conceptual imprecision.", "suggestion": "Use 'partial separation' rather than 'fusion'."},
                        {"title": "Proofreading", "description": "Capitalization and typos present.", "suggestion": "Check 'Uk' vs 'UK' and other errors."}
                    ]
                }
            },
            {
                "model": "google/gemini-3-pro-preview",
                "percentage": 62,
                "feedback": {
                    "strengths": [
                        {"title": "Structural Clarity", "description": "Clear organization of comparison.", "evidence": "Distinct sections for each jurisdiction."},
                        {"title": "Source Range", "description": "Uses variety of authorities.", "evidence": "Mix of cases and academic commentary."}
                    ],
                    "improvements": [
                        {"title": "Critical Analysis", "description": "More description than evaluation.", "suggestion": "Analyze why checks failed in examples given."},
                        {"title": "Grammar", "description": "Run-on sentences and comma splices.", "suggestion": "Use semicolons to join independent clauses."},
                        {"title": "Academic Tone", "description": "Some informal phrasing.", "suggestion": "Avoid 'To end off' - use 'In conclusion'."},
                        {"title": "Capitalization", "description": "Inconsistent proper noun formatting.", "suggestion": "Capitalize 'Parliament' and 'Constitution' consistently."}
                    ]
                }
            },
            {
                "model": "anthropic/claude-opus-4.5",
                "percentage": 65,
                "feedback": {
                    "strengths": [
                        {"title": "Balanced Coverage", "description": "Equal attention to both systems.", "evidence": "Neither jurisdiction dominates the analysis."},
                        {"title": "Key Cases Identified", "description": "Selects important constitutional decisions.", "evidence": "Miller II and EFF are central authorities."}
                    ],
                    "improvements": [
                        {"title": "Deeper Critique", "description": "Could evaluate downsides of judicial dominance.", "suggestion": "Consider tension with democratic mandate."},
                        {"title": "Citation Format", "description": "OSCOLA not fully implemented.", "suggestion": "Add proper footnotes with neutral citations."},
                        {"title": "Conclusion Strength", "description": "Ending is somewhat brief.", "suggestion": "Synthesize implications more fully."}
                    ]
                }
            }
        ]
    }
]


# -----------------------------------------------------------------------------
# Synthesis Prompt
# -----------------------------------------------------------------------------

SYNTHESIS_PROMPT_TEMPLATE = """You are synthesizing feedback from {num_graders} independent essay graders.

<assignment>
<title>{essay_title}</title>
</assignment>

<rubric>
{rubric}
</rubric>

<essay_excerpt>
{essay_content}
</essay_excerpt>

<grader_feedback>
{grader_feedback_xml}
</grader_feedback>

<task>
Synthesize the feedback from all graders into a single, coherent response.

1. STRENGTHS: Select the 3-4 most impactful strengths. Prefer those:
   - Mentioned by multiple graders
   - With direct quotes/evidence from the essay
   - Most relevant to the rubric criteria

2. IMPROVEMENTS: Merge overlapping suggestions into 3-4 most actionable items:
   - Combine similar points (e.g., "transitions" and "paragraph flow" are related)
   - Prioritize based on rubric weighting
   - Keep suggestions specific and actionable

3. LANGUAGE TIPS: Consolidate into 2-3 unique tips, removing duplicates.

Be concise. Preserve the best specific examples and evidence from the original feedback.
Output in markdown format with ## headers for each section.
</task>"""


def format_grader_feedback_xml(grader_feedback: list[dict]) -> str:
    """Format grader feedback as XML for the synthesis prompt."""
    xml_parts = []
    for i, grader in enumerate(grader_feedback, 1):
        feedback_json = json.dumps(grader["feedback"], indent=2)
        xml_parts.append(
            f'<grader_{i} model="{grader["model"]}" percentage="{grader["percentage"]}">\n'
            f'{feedback_json}\n'
            f'</grader_{i}>'
        )
    return "\n\n".join(xml_parts)


# -----------------------------------------------------------------------------
# OpenRouter Client
# -----------------------------------------------------------------------------

class OpenRouterClient:
    """Client for making OpenRouter API calls with timing and cost tracking."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://markm8.com",
            "X-Title": "MarkM8 Synthesis Benchmark",
        }

    def generate(self, model: str, prompt: str, temperature: float = 0.3) -> dict:
        """Generate a response and return content, time, and cost."""
        start_time = time.time()

        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
        }

        with httpx.Client(timeout=180.0) as client:
            response = client.post(OPENROUTER_API_URL, headers=self.headers, json=payload)
            response.raise_for_status()
            data = response.json()

        elapsed_time = time.time() - start_time
        content = data["choices"][0]["message"]["content"]

        # Extract cost from usage if available
        usage = data.get("usage", {})
        # OpenRouter returns cost in the response
        cost = None
        if "cost" in usage:
            cost = usage["cost"]

        return {
            "content": content,
            "time_seconds": elapsed_time,
            "cost": cost,
            "tokens": usage.get("total_tokens"),
        }


# -----------------------------------------------------------------------------
# DeepEval Judge Model
# -----------------------------------------------------------------------------

class OpenRouterJudge(DeepEvalBaseLLM):
    """DeepEval judge model using OpenRouter."""

    def __init__(self, model: str, api_key: str):
        self.model_name = model
        self.api_key = api_key

    def load_model(self):
        return self.model_name

    def generate(self, prompt: str, schema=None) -> str:
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
            payload["response_format"] = {"type": "json_schema", "json_schema": schema}

        with httpx.Client(timeout=120.0) as client:
            response = client.post(OPENROUTER_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

    async def a_generate(self, prompt: str, schema=None) -> str:
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
            payload["response_format"] = {"type": "json_schema", "json_schema": schema}

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

    def get_model_name(self) -> str:
        return self.model_name


# -----------------------------------------------------------------------------
# Evaluation Metrics
# -----------------------------------------------------------------------------

def create_metrics(judge: DeepEvalBaseLLM) -> list[GEval]:
    """Create the two evaluation metrics."""

    selection_metric = GEval(
        name="Selection",
        evaluation_steps=[
            "Identify all feedback points from each grader in the Input",
            "Rank these points by potential impact on student learning",
            "Check which points were included in the Actual Output",
            "Assess whether highest-impact points were kept and lower-value dropped",
            "Check if selected points are grounded in specific evidence",
            "Score 0-10: 0-3=poor selection; 4-6=reasonable; 7-10=excellent prioritization",
        ],
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
        threshold=0.6,
        model=judge,
    )

    quality_metric = GEval(
        name="Quality",
        evaluation_steps=[
            "Read each point from a student's perspective",
            "Check if each point is clear, concise, and easy to understand",
            "Check if suggestions are specific and actionable",
            "Check if feedback explains WHY something matters",
            "Check for redundancy between points",
            "Score 0-10: 0-3=confusing/redundant; 4-6=decent; 7-10=excellent",
        ],
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
        threshold=0.6,
        model=judge,
    )

    return [selection_metric, quality_metric]


# -----------------------------------------------------------------------------
# Main Benchmark
# -----------------------------------------------------------------------------

def run_benchmark():
    """Run the synthesis benchmark across all models and test cases."""

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        print("Error: OPENROUTER_API_KEY required")
        return

    client = OpenRouterClient(api_key)
    judge = OpenRouterJudge(JUDGE_MODEL, api_key)
    metrics = create_metrics(judge)

    print("=" * 70)
    print("SYNTHESIS MODEL BENCHMARK")
    print("=" * 70)
    print(f"Test cases: {len(TEST_CASES)}")
    print(f"Models: {', '.join(SYNTHESIS_MODELS)}")
    print(f"Judge: {JUDGE_MODEL}")
    print("=" * 70)

    # Results storage
    results = {model: {"times": [], "costs": [], "selection": [], "quality": []}
               for model in SYNTHESIS_MODELS}

    for test_case in TEST_CASES:
        print(f"\n--- Test Case: {test_case['essay_title'][:50]}... ---")

        # Build synthesis prompt
        grader_xml = format_grader_feedback_xml(test_case["grader_feedback"])
        prompt = SYNTHESIS_PROMPT_TEMPLATE.format(
            num_graders=len(test_case["grader_feedback"]),
            essay_title=test_case["essay_title"],
            rubric=test_case["rubric"],
            essay_content=test_case["essay_content"],
            grader_feedback_xml=grader_xml,
        )

        # Run each synthesis model
        for model in SYNTHESIS_MODELS:
            print(f"  Running {model}...", end=" ", flush=True)

            try:
                # Generate synthesis
                result = client.generate(model, prompt)
                synthesis = result["content"]

                print(f"{result['time_seconds']:.1f}s", end=" ", flush=True)

                # Evaluate
                test = LLMTestCase(
                    input=grader_xml,
                    actual_output=synthesis,
                )

                # Run metrics
                for metric in metrics:
                    metric.measure(test)

                selection_score = metrics[0].score
                quality_score = metrics[1].score

                print(f"[Sel:{selection_score:.2f} Qual:{quality_score:.2f}]")

                # Store results
                results[model]["times"].append(result["time_seconds"])
                results[model]["costs"].append(result["cost"] or 0)
                results[model]["selection"].append(selection_score)
                results[model]["quality"].append(quality_score)

            except Exception as e:
                print(f"ERROR: {e}")
                results[model]["times"].append(None)
                results[model]["costs"].append(None)
                results[model]["selection"].append(None)
                results[model]["quality"].append(None)

    # Print summary
    print("\n" + "=" * 70)
    print("RESULTS SUMMARY")
    print("=" * 70)
    print(f"{'Model':<35} {'Selection':>10} {'Quality':>10} {'Time':>8} {'Cost':>10}")
    print("-" * 70)

    for model in SYNTHESIS_MODELS:
        r = results[model]

        # Calculate averages (excluding None values)
        valid_sel = [s for s in r["selection"] if s is not None]
        valid_qual = [q for q in r["quality"] if q is not None]
        valid_times = [t for t in r["times"] if t is not None]
        valid_costs = [c for c in r["costs"] if c is not None]

        avg_sel = sum(valid_sel) / len(valid_sel) if valid_sel else 0
        avg_qual = sum(valid_qual) / len(valid_qual) if valid_qual else 0
        avg_time = sum(valid_times) / len(valid_times) if valid_times else 0
        total_cost = sum(valid_costs) if valid_costs else 0

        print(f"{model:<35} {avg_sel:>10.2f} {avg_qual:>10.2f} {avg_time:>7.1f}s ${total_cost:>8.4f}")

    print("=" * 70)

    # Save detailed results
    output_file = Path(__file__).parent / "results" / "benchmark_results.json"
    output_file.parent.mkdir(exist_ok=True)
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nDetailed results saved to: {output_file}")


if __name__ == "__main__":
    run_benchmark()
