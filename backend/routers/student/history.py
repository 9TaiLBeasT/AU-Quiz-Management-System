from fastapi import APIRouter, Depends
from core.deps import require_student
from db.supabase_client import get_admin_client

router = APIRouter()


@router.get("/attempts")
def get_attempts(user=Depends(require_student)):
    """All quiz attempts by this student, ordered newest first."""
    client = get_admin_client()
    attempts = (
        client.table("quiz_attempts").select("*")
        .eq("student_id", user["id"])
        .order("submitted_at", desc=True)
        .execute().data or []
    )

    quiz_ids = list({a["quiz_id"] for a in attempts})
    subjects = {}
    published_status = {}
    if quiz_ids:
        quizzes = client.table("quizzes").select("id, subject_id, results_published").in_("id", quiz_ids).execute().data or []
        subject_ids = list({q["subject_id"] for q in quizzes if q.get("subject_id")})
        subj_rows = {}
        if subject_ids:
            subj_rows = {s["id"]: s["name"] for s in (client.table("subjects").select("id, name").in_("id", subject_ids).execute().data or [])}
        subjects = {q["id"]: subj_rows.get(q.get("subject_id"), "—") for q in quizzes}
        published_status = {q["id"]: q.get("results_published", False) for q in quizzes}

    for a in attempts:
        a["subject_name"] = subjects.get(a["quiz_id"], "—")
        a["results_published"] = published_status.get(a["quiz_id"], False)
        if a["results_published"]:
            a["percentage"] = round(a["score"] / a["total_questions"] * 100, 1) if a.get("total_questions") else 0
        else:
            a["score"] = None
            a["percentage"] = None

    return attempts


@router.get("/subject-stats")
def get_subject_stats(user=Depends(require_student)):
    """Per-subject average score for this student — used in performance history chart."""
    client = get_admin_client()
    attempts = (
        client.table("quiz_attempts").select("quiz_id, score, total_questions")
        .eq("student_id", user["id"])
        .execute().data or []
    )
    if not attempts:
        return []

    quiz_ids = list({a["quiz_id"] for a in attempts})
    quizzes = client.table("quizzes").select("id, subject_id, results_published").in_("id", quiz_ids).eq("results_published", True).execute().data or []
    quiz_to_subject = {q["id"]: q.get("subject_id") for q in quizzes}

    subject_ids = list({v for v in quiz_to_subject.values() if v})
    subj_names = {}
    if subject_ids:
        subj_names = {s["id"]: s["name"] for s in (client.table("subjects").select("id, name").in_("id", subject_ids).execute().data or [])}

    # Aggregate by subject
    stats: dict[str, list[float]] = {}
    for a in attempts:
        subject_id = quiz_to_subject.get(a["quiz_id"])
        if subject_id and a.get("total_questions"):
            pct = a["score"] / a["total_questions"] * 100
            stats.setdefault(subject_id, []).append(pct)

    return [
        {
            "subject_name": subj_names.get(sid, sid),
            "avg_score": round(sum(vals) / len(vals), 1),
            "attempts": len(vals),
        }
        for sid, vals in stats.items()
    ]
