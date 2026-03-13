from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from core.deps import require_faculty
from models.quiz import AIGenerateRequest
from services.ai_service import generate_questions_from_prompt, generate_questions_from_text
from services.pdf_service import extract_text_from_pdf

router = APIRouter()


@router.post("/quizzes/generate-ai")
async def generate_ai_quiz(body: AIGenerateRequest, _=Depends(require_faculty)):
    """
    Uses the local Ollama lfm2.5-thinking model to generate MCQs from a free-form faculty prompt.
    e.g. "generate 5 questions on binary trees at medium difficulty"
    """
    try:
        questions = await generate_questions_from_prompt(body.prompt)
    except ValueError as e:
        raise HTTPException(500, f"AI generation failed: {str(e)}")
    except Exception as e:
        raise HTTPException(500, f"Ollama error: {str(e)}")

    if not questions:
        raise HTTPException(500, "AI returned no valid questions. Try rephrasing your prompt.")

    return {"questions": questions, "count": len(questions)}


@router.post("/quizzes/generate-pdf")
async def generate_pdf_quiz(
    file: UploadFile = File(...),
    difficulty: str = Form("medium"),
    _=Depends(require_faculty),
):
    """
    Accepts a PDF upload, extracts text, and sends to Gemini for MCQ generation.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:  # 20 MB limit
        raise HTTPException(413, "PDF file too large. Maximum size is 20 MB.")

    try:
        text = extract_text_from_pdf(file_bytes)
    except Exception as e:
        raise HTTPException(422, f"Could not read PDF: {str(e)}")

    if len(text.strip()) < 100:
        raise HTTPException(422, "PDF appears to contain no readable text (may be image-only).")

    try:
        questions = await generate_questions_from_text(
            text=text,
            difficulty=difficulty,
        )
    except ValueError as e:
        raise HTTPException(500, f"AI generation failed: {str(e)}")
    except Exception as e:
        raise HTTPException(500, f"Gemini API error: {str(e)}")

    return {"questions": questions, "count": len(questions)}
