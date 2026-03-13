import random
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from core.deps import require_student
from db.supabase_client import get_admin_client
from models.quiz import SubmitQuizRequest

router = APIRouter()


def _now_utc():
    return datetime.now(timezone.utc)


def _parse_dt(dt_str):
    if not dt_str: return None
    dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


# ─────────────────────────────────────────────────
# List quizzes assigned to the student's section
# ─────────────────────────────────────────────────
@router.get("/quizzes")
def list_student_quizzes(user=Depends(require_student)):
    client = get_admin_client()
    section_id = user.get("section_id")

    # Get all published quizzes for the student's section
    quizzes = (
        client.table("quizzes").select("*")
        .eq("section_id", section_id)
        .eq("status", "published")
        .order("created_at", desc=True)
        .execute().data or []
    )

    # Check which quizzes the student already attempted
    quiz_ids = [q["id"] for q in quizzes]
    attempts = {}
    if quiz_ids:
        att = (
            client.table("quiz_attempts").select("quiz_id, id")
            .eq("student_id", user["id"])
            .in_("quiz_id", quiz_ids)
            .execute().data or []
        )
        attempts = {a["quiz_id"]: True for a in att}

    # Enrich
    subjects = {s["id"]: s["name"] for s in (client.table("subjects").select("id, name").execute().data or [])}
    for q in quizzes:
        q["subject_name"] = subjects.get(q.get("subject_id"), "—")
        q["attempted"] = attempts.get(q["id"], False)
        q["question_count"] = client.table("quiz_questions").select("id", count="exact").eq("quiz_id", q["id"]).execute().count or 0

    return quizzes


# ─────────────────────────────────────────────────
# Get quiz detail for attempt (NO correct answers)
# ─────────────────────────────────────────────────
@router.get("/quizzes/{quiz_id}")
def get_quiz_for_attempt(quiz_id: str, user=Depends(require_student)):
    client = get_admin_client()
    section_id = user.get("section_id")

    if not section_id:
        raise HTTPException(403, "You must be assigned to a section to attempt this quiz")

    quiz = (
        client.table("quizzes").select("*")
        .eq("id", quiz_id).eq("section_id", section_id).eq("status", "published")
        .maybe_single().execute()
    )
    if not quiz.data:
        raise HTTPException(404, "Quiz not found or not accessible")

    q = quiz.data

    # Time boundaries check
    if q.get("end_time") and _parse_dt(q["end_time"]) < _now_utc():
        raise HTTPException(400, "Quiz deadline has passed")
    if q.get("start_time") and _parse_dt(q["start_time"]) > _now_utc():
        raise HTTPException(400, "Quiz has not started yet")

    # Single-attempt check
    existing = client.table("quiz_attempts").select("id").eq("quiz_id", quiz_id).eq("student_id", user["id"]).limit(1).execute()
    if existing.data:
        raise HTTPException(400, "You have already submitted this quiz")

    # Fetch questions WITHOUT correct_option and explanation
    questions_raw = client.table("quiz_questions").select("id, question_text, option_a, option_b, option_c, option_d, difficulty").eq("quiz_id", quiz_id).execute().data or []

    if q.get("randomize_questions"):
        random.shuffle(questions_raw)

    if q.get("subject_id"):
        subject = client.table("subjects").select("name").eq("id", q.get("subject_id")).maybe_single().execute()
        subject_name = subject.data["name"] if subject.data else "—"
    else:
        subject_name = "—"

    return {
        **q,
        "subject_name": subject_name,
        "questions": questions_raw,
    }


# ─────────────────────────────────────────────────
# Submit quiz answers
# ─────────────────────────────────────────────────
@router.post("/quizzes/{quiz_id}/submit")
def submit_quiz(quiz_id: str, body: SubmitQuizRequest, user=Depends(require_student)):
    client = get_admin_client()
    section_id = user.get("section_id")

    # Re-verify quiz exists and student has access
    quiz = (
        client.table("quizzes").select("*")
        .eq("id", quiz_id).eq("section_id", section_id).eq("status", "published")
        .maybe_single().execute()
    )
    if not quiz.data:
        raise HTTPException(404, "Quiz not found")

    q = quiz.data

    # Deadline enforcement
    if q.get("end_time") and _parse_dt(q["end_time"]) < _now_utc():
        raise HTTPException(400, "Submission deadline has passed")

    # Single-attempt enforcement
    existing = client.table("quiz_attempts").select("id").eq("quiz_id", quiz_id).eq("student_id", user["id"]).limit(1).execute()
    if existing.data:
        raise HTTPException(400, "You have already submitted this quiz")

    # Fetch correct answers to score
    questions = client.table("quiz_questions").select("id, correct_option").eq("quiz_id", quiz_id).execute().data or []
    total = len(questions)
    score = sum(1 for qq in questions if body.answers.get(qq["id"]) == qq["correct_option"])

    # Save attempt
    attempt = {
        "quiz_id": quiz_id,
        "student_id": user["id"],
        "section_id": section_id,
        "answers": body.answers,
        "score": score,
        "total_questions": total,
        "submitted_at": _now_utc().isoformat(),
    }
    client.table("quiz_attempts").insert(attempt).execute()

    return {
        "message": "Quiz submitted successfully",
        "results_published": q.get("results_published", False),
        "score": score if q.get("results_published", False) else None,
        "total_questions": total
    }


# ─────────────────────────────────────────────────
# Get result after submission
# ─────────────────────────────────────────────────
@router.get("/quizzes/{quiz_id}/result")
def get_quiz_result(quiz_id: str, user=Depends(require_student)):
    client = get_admin_client()

    attempt = (
        client.table("quiz_attempts").select("*")
        .eq("quiz_id", quiz_id).eq("student_id", user["id"])
        .order("submitted_at", desc=True)
        .limit(1).execute()
    )
    if not attempt.data:
        raise HTTPException(404, "No submission found for this quiz")

    a = attempt.data[0]
    quiz = client.table("quizzes").select("*").eq("id", quiz_id).maybe_single().execute()
    
    subject_name = "—"
    if quiz.data and quiz.data.get("subject_id"):
        subject = client.table("subjects").select("name").eq("id", quiz.data.get("subject_id")).maybe_single().execute()
        if subject.data:
            subject_name = subject.data["name"]

    is_published = quiz.data.get("results_published", False)

    result = {
        "quiz_id": quiz_id,
        "subject_name": subject_name,
        "submitted_at": a["submitted_at"],
        "results_published": is_published,
        "total_questions": a["total_questions"],
    }

    if is_published:
        result["score"] = a["score"]
        result["answers"] = a["answers"]
        result["show_answers"] = quiz.data.get("show_answers", True)
        
        if result["show_answers"]:
            questions = client.table("quiz_questions").select("*").eq("quiz_id", quiz_id).execute().data or []
            result["questions"] = questions

    return result
