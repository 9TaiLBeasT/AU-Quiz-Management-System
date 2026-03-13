import random
from fastapi import APIRouter, Depends, HTTPException
from core.deps import require_faculty
from db.supabase_client import get_admin_client
from models.quiz import QuizCreate, QuizUpdate

router = APIRouter()


def _enrich_quizzes(quizzes: list, client) -> list:
    """Adds subject_name and section_name to quiz dicts."""
    subjects = {s["id"]: s["name"] for s in (client.table("subjects").select("id, name").execute().data or [])}
    sections = {s["id"]: s["name"] for s in (client.table("sections").select("id, name").execute().data or [])}
    for q in quizzes:
        q["subject_name"] = subjects.get(q.get("subject_id"), "—")
        q["section_name"] = sections.get(q.get("section_id"), "—")
        q["question_count"] = client.table("quiz_questions").select("id", count="exact").eq("quiz_id", q["id"]).execute().count or 0
    return quizzes


# ─────────────────────────────────────────────────
@router.get("/quizzes")
def list_faculty_quizzes(user=Depends(require_faculty)):
    client = get_admin_client()
    quizzes = (
        client.table("quizzes").select("*").eq("faculty_id", user["id"])
        .order("created_at", desc=True).execute().data or []
    )
    return _enrich_quizzes(quizzes, client)


# ─────────────────────────────────────────────────
@router.post("/quizzes", status_code=201)
def create_quiz(body: QuizCreate, user=Depends(require_faculty)):
    client = get_admin_client()

    quiz_data = {
        "faculty_id": user["id"],
        "subject_id": body.subject_id,
        "section_id": body.section_id,
        "time_limit": body.time_limit,
        "start_time": body.start_time,
        "end_time": body.end_time,
        "difficulty_level": body.difficulty_level,
        "randomize_questions": body.randomize_questions,
        "randomize_options": body.randomize_options,
        "status": "draft",
    }
    quiz_result = client.table("quizzes").insert(quiz_data).execute()
    quiz_id = quiz_result.data[0]["id"]

    # Insert all questions
    questions = [
        {
            "quiz_id": quiz_id,
            "question_text": q.question_text,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "correct_option": q.correct_option,
            "explanation": q.explanation,
            "difficulty": q.difficulty,
        }
        for q in body.questions
    ]
    client.table("quiz_questions").insert(questions).execute()

    return {"id": quiz_id, "status": "draft", "question_count": len(questions)}


# ─────────────────────────────────────────────────
@router.get("/quizzes/{quiz_id}")
def get_quiz(quiz_id: str, user=Depends(require_faculty)):
    client = get_admin_client()
    quiz = client.table("quizzes").select("*").eq("id", quiz_id).eq("faculty_id", user["id"]).maybe_single().execute()
    if not quiz.data:
        raise HTTPException(404, "Quiz not found or access denied")
        
    questions = client.table("quiz_questions").select("*").eq("quiz_id", quiz_id).order("id").execute().data or []
    return {**quiz.data, "questions": questions}


# ─────────────────────────────────────────────────
@router.put("/quizzes/{quiz_id}")
def update_quiz(quiz_id: str, body: QuizUpdate, user=Depends(require_faculty)):
    client = get_admin_client()
    quiz = client.table("quizzes").select("*").eq("id", quiz_id).eq("faculty_id", user["id"]).maybe_single().execute()
    if not quiz.data:
        raise HTTPException(404, "Quiz not found or access denied")
    if quiz.data["status"] == "published":
        raise HTTPException(400, "Cannot edit a published quiz")

    updates = body.model_dump(exclude_unset=True, exclude={"questions"})
    if updates:
        client.table("quizzes").update(updates).eq("id", quiz_id).execute()
        
    if body.questions is not None:
        # Replace all questions
        client.table("quiz_questions").delete().eq("quiz_id", quiz_id).execute()
        new_questions = [
            {
                "quiz_id": quiz_id,
                "question_text": q.question_text,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
                "correct_option": q.correct_option,
                "explanation": q.explanation,
                "difficulty": q.difficulty,
            }
            for q in body.questions
        ]
        if new_questions:
            client.table("quiz_questions").insert(new_questions).execute()
            
    return {"message": "Quiz updated successfully"}


# ─────────────────────────────────────────────────
@router.delete("/quizzes/{quiz_id}", status_code=204)
def delete_quiz(quiz_id: str, user=Depends(require_faculty)):
    client = get_admin_client()
    quiz = client.table("quizzes").select("id, faculty_id").eq("id", quiz_id).eq("faculty_id", user["id"]).maybe_single().execute()
    if not quiz.data:
        raise HTTPException(404, "Quiz not found or access denied")
    client.table("quiz_questions").delete().eq("quiz_id", quiz_id).execute()
    client.table("quizzes").delete().eq("id", quiz_id).execute()


# ─────────────────────────────────────────────────
@router.patch("/quizzes/{quiz_id}/publish")
def publish_quiz(quiz_id: str, user=Depends(require_faculty)):
    client = get_admin_client()
    quiz = client.table("quizzes").select("*").eq("id", quiz_id).eq("faculty_id", user["id"]).maybe_single().execute()
    if not quiz.data:
        raise HTTPException(404, "Quiz not found or access denied")

    # Must have at least 1 question
    q_count = client.table("quiz_questions").select("id", count="exact").eq("quiz_id", quiz_id).execute().count
    if not q_count:
        raise HTTPException(400, "Quiz must have at least one question before publishing")

    result = client.table("quizzes").update({"status": "published"}).eq("id", quiz_id).execute()
    return result.data[0]


# ─────────────────────────────────────────────────
@router.patch("/quizzes/{quiz_id}/unpublish")
def unpublish_quiz(quiz_id: str, user=Depends(require_faculty)):
    client = get_admin_client()
    quiz = client.table("quizzes").select("id").eq("id", quiz_id).eq("faculty_id", user["id"]).maybe_single().execute()
    if not quiz.data:
        raise HTTPException(404, "Quiz not found or access denied")

    result = client.table("quizzes").update({"status": "draft"}).eq("id", quiz_id).execute()
    return result.data[0]


# ─────────────────────────────────────────────────
@router.patch("/quizzes/{quiz_id}/publish-results")
def publish_results(quiz_id: str, user=Depends(require_faculty)):
    client = get_admin_client()
    quiz = client.table("quizzes").select("id, results_published").eq("id", quiz_id).eq("faculty_id", user["id"]).maybe_single().execute()
    if not quiz.data:
        raise HTTPException(404, "Quiz not found or access denied")

    new_state = not quiz.data.get("results_published", False)
    result = client.table("quizzes").update({"results_published": new_state}).eq("id", quiz_id).execute()
    return result.data[0]

# ─────────────────────────────────────────────────
@router.get("/quizzes/{quiz_id}/submissions")
def get_submissions(quiz_id: str, user=Depends(require_faculty)):
    client = get_admin_client()
    quiz = client.table("quizzes").select("id").eq("id", quiz_id).eq("faculty_id", user["id"]).maybe_single().execute()
    if not quiz.data:
        raise HTTPException(404, "Quiz not found or access denied")

    attempts = client.table("quiz_attempts").select("*").eq("quiz_id", quiz_id).order("submitted_at", desc=True).execute().data or []

    # Enrich with student names
    student_ids = list({a["student_id"] for a in attempts})
    profiles = {}
    if student_ids:
        p = client.table("profiles").select("id, full_name").in_("id", student_ids).execute().data or []
        profiles = {x["id"]: x["full_name"] for x in p}

    for a in attempts:
        a["student_name"] = profiles.get(a["student_id"], "—")
        a["percentage"] = round(a["score"] / a["total_questions"] * 100, 1) if a.get("total_questions") else 0

    return attempts
