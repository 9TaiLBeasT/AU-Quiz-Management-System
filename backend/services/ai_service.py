import json
import re
import asyncio
import os
import logging
import httpx

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = "google/gemma-3n-e4b-it"


_QUESTION_SCHEMA = """
Your final answer MUST be a raw JSON array. After any <think> block, output ONLY valid JSON.
Each question MUST follow this exact structure (THIS IS JUST An EXAMPLE FORMAT, DO NOT COPY THIS CONTENT):
[
  {
    "question_text": "<YOUR GENERATED QUESTION HERE>",
    "option_a": "<FIRST PLAUSIBLE OPTION>",
    "option_b": "<SECOND PLAUSIBLE OPTION>",
    "option_c": "<THIRD PLAUSIBLE OPTION>",
    "option_d": "<FOURTH PLAUSIBLE OPTION>",
    "correct_option": "b",
    "explanation": "<BRIEF EXPLANATION OF WHY B IS CORRECT>",
    "difficulty": "easy"
  }
]

STRICT RULES:
- option_a, option_b, option_c, option_d must contain the FULL TEXT of each answer choice
- Do NOT put single letters like 'a', 'b', 'c', 'd' as option values
- correct_option must be exactly one of: "a", "b", "c", "d" (the key of the correct answer)
- difficulty must be one of: "easy", "medium", "hard"
- Output ONLY the JSON array. No markdown, no code fences, no explanation text.
"""


def _parse_questions(raw: str) -> list[dict]:
    """
    Parse questions from lfm2.5-thinking output.
    The thinking model wraps its reasoning in <think>...</think> tags.
    We strip that block and extract the JSON array from what remains.
    """
    # Remove <think>...</think> block (the model's reasoning chain)
    cleaned = re.sub(r'<think>[\s\S]*?</think>', '', raw, flags=re.IGNORECASE).strip()

    # Also try removing ```json ... ``` fences if present
    cleaned = re.sub(r'```(?:json)?', '', cleaned).strip()

    # Extract all JSON objects individually to survive malformed/truncated arrays
    data = []
    # Find everything that looks like a JSON object `{...}`
    for obj_match in re.finditer(r'\{[^{}]*\}', cleaned):
        try:
            parsed = json.loads(obj_match.group())
            data.append(parsed)
        except json.JSONDecodeError:
            continue
            
    if not data:
        # Fallback if the simple regex failed (e.g., nested objects, though our schema doesn't have them)
        try:
            match = re.search(r'\[[\s\S]*\]', cleaned)
            if match:
                data = json.loads(match.group())
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON parsing failed completely. Last snippet: {cleaned[-200:]}")

    valid = []
    for item in data:
        if not isinstance(item, dict):
            continue

        # Normalization for alternative keys emitted by models
        q_text = item.get("question_text") or item.get("question") or item.get("text")
        
        # Handle options array if keys option_a/b/c/d are missing
        opts = item.get("options", [])
        if isinstance(opts, list) and len(opts) >= 4 and not item.get("option_a"):
            option_a = item.get("option_a") or opts[0]
            option_b = item.get("option_b") or opts[1]
            option_c = item.get("option_c") or opts[2]
            option_d = item.get("option_d") or opts[3]
        else:
            option_a = item.get("option_a")
            option_b = item.get("option_b")
            option_c = item.get("option_c")
            option_d = item.get("option_d")
            
        correct = str(item.get("correct_option") or item.get("answer") or "").strip().lower()

        # Handle 'Option A' or 'option_a'
        if correct.startswith("option "):
            correct = correct.replace("option ", "")
        elif correct.startswith("option_"):
            correct = correct.replace("option_", "")

        # If answer is 'a) Text...' extract just 'a'
        if len(correct) > 1 and correct[1] in [")", ".", "-", " "]:
            correct = correct[0]
        # Or if answer is just the index "0", "1", etc mapping to "a", "b"...
        if correct in {"0", "1", "2", "3"}:
            correct = ["a", "b", "c", "d"][int(correct)]

        # Failsafe extract of just the first character if it starts with a/b/c/d
        if len(correct) > 1 and correct[0] in {"a", "b", "c", "d"}:
            correct = correct[0]

        if q_text and option_a and option_b and option_c and option_d and correct in {"a", "b", "c", "d"}:
            # Strip "a) " prefixes if the model included them in the actual option text
            option_a = re.sub(r'^[aA][\)\.\-]\span*', '', option_a)
            option_b = re.sub(r'^[bB][\)\.\-]\span*', '', option_b)
            option_c = re.sub(r'^[cC][\)\.\-]\span*', '', option_c)
            option_d = re.sub(r'^[dD][\)\.\-]\span*', '', option_d)

            valid.append({
                "question_text": q_text,
                "option_a": option_a,
                "option_b": option_b,
                "option_c": option_c,
                "option_d": option_d,
                "correct_option": correct,
                "explanation": item.get("explanation", ""),
                "difficulty": item.get("difficulty", "medium")
            })

    if not valid:
        logger.error(f"Failed to validate any items in data: {data}")
        raise ValueError(f"Model returned JSON but no matching quiz questions were found. Raw JSON snippet: {cleaned[:300]}")

    return valid


def _build_prompt(user_prompt: str) -> str:
    """
    Converts the user's natural language quiz request into a structured instruction.
    Example input: "generate a quiz on machine learning with 5 questions"
    """
    return (
        f"You are an expert university professor creating exam questions.\n"
        f"A faculty member has asked you: \"{user_prompt}\"\n\n"
        f"CRITICAL INSTRUCTION: You MUST generate completely original questions about the topic requested above.\n"
        f"Do NOT output generic examples. Read the user's prompt carefully and generate the appropriate number of "
        f"multiple-choice questions specifically on that topic.\n\n"
        f"{_QUESTION_SCHEMA}"
    )


async def generate_questions_from_prompt(user_prompt: str) -> list[dict]:
    """
    Sends the faculty's free-form prompt to OpenRouter
    and returns parsed quiz questions.
    """
    full_prompt = _build_prompt(user_prompt)

    logger.info(f"Sending prompt to OpenRouter ({OPENROUTER_MODEL}): {user_prompt[:100]}")

    async with httpx.AsyncClient(timeout=180) as client:
        try:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "AU Quiz Platform",
                },
                json={
                    "model": OPENROUTER_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are an expert precise JSON generator. Output only valid JSON arrays. Do not wrap in markdown loops."},
                        {"role": "user", "content": full_prompt}
                    ],
                    "temperature": 0.5,
                }
            )
            resp.raise_for_status()
            data = resp.json()
            raw_response = data["choices"][0]["message"]["content"]
            if not raw_response:
                raise ValueError("Empty response from OpenRouter API")
        except Exception as e:
            logger.error(f"OpenRouter error: {str(e)}")
            raise ValueError(f"Could not fetch from OpenRouter. Ensure key is valid. Detail: {str(e)}")

    logger.info(f"OpenRouter raw response (first 300 chars): {raw_response[:300]}")

    return _parse_questions(raw_response)


# ── Legacy compatibility wrappers (kept so PDF generation still works) ───────
async def generate_questions(topic: str, num_questions: int, difficulty: str) -> list[dict]:
    """Legacy wrapper — converts old-style params into a free-form prompt."""
    prompt = f"Generate {num_questions} {difficulty} difficulty quiz questions about: {topic}"
    return await generate_questions_from_prompt(prompt)


async def generate_questions_from_text(text: str, difficulty: str) -> list[dict]:
    """Generates MCQs from extracted PDF text using Ollama."""
    truncated = text[:6000]
    full_prompt = (
        f"You are an expert professor. Your task is to extract ALL multiple-choice questions "
        f"from the following study material. If the material is informational text instead of a quiz, "
        f"generate as many high-quality questions as possible to thoroughly cover all the concepts.\n"
        f"Difficulty level should be: {difficulty}.\n\n"
        f"STUDY MATERIAL:\n{truncated}\n\n"
        f"{_QUESTION_SCHEMA}"
    )

    logger.info(f"Sending PDF text to OpenRouter ({OPENROUTER_MODEL}), text length: {len(truncated)}")

    async with httpx.AsyncClient(timeout=180) as client:
        try:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "AU Quiz Platform",
                },
                json={
                    "model": OPENROUTER_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are an expert precise JSON generator. Output only valid JSON arrays."},
                        {"role": "user", "content": full_prompt}
                    ],
                    "temperature": 0.5,
                }
            )
            resp.raise_for_status()
            data = resp.json()
            raw = data["choices"][0]["message"]["content"]
            if not raw:
                raise ValueError("Empty response from OpenRouter API")
        except Exception as e:
            logger.error(f"OpenRouter PDF error: {str(e)}")
            raise ValueError(f"Could not fetch from OpenRouter for PDF. Detail: {str(e)}")

    logger.info(f"OpenRouter PDF response (first 300 chars): {raw[:300]}")
    return _parse_questions(raw)
