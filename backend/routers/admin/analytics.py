from fastapi import APIRouter, Depends
from core.deps import require_admin
from db.supabase_client import get_admin_client

router = APIRouter()


@router.get("/analytics")
def system_analytics(_=Depends(require_admin)):
    client = get_admin_client()

    profiles = client.table("profiles").select("role, status").execute().data or []
    attempts = client.table("quiz_attempts").select("score, total_questions, section_id").execute().data or []
    quizzes = client.table("quizzes").select("id").execute().data or []

    active_students = sum(1 for p in profiles if p["role"] == "student" and p.get("status") == "active")
    total_quizzes = len(quizzes)
    total_attempts = len(attempts)

    scores = [a["score"] / a["total_questions"] * 100 for a in attempts if a.get("total_questions")]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    # Section-wise averages
    section_map: dict[str, list[float]] = {}
    for a in attempts:
        sid = a.get("section_id")
        if sid and a.get("total_questions"):
            pct = a["score"] / a["total_questions"] * 100
            section_map.setdefault(sid, []).append(pct)

    sections = {s["id"]: s["name"] for s in (client.table("sections").select("id, name").execute().data or [])}
    section_scores = [
        {"section_name": sections.get(sid, sid), "avg_score": round(sum(vals) / len(vals), 1)}
        for sid, vals in section_map.items()
    ]

    return {
        "total_quizzes": total_quizzes,
        "total_attempts": total_attempts,
        "active_students": active_students,
        "avg_score": avg_score,
        "section_scores": section_scores,
    }


@router.get("/audit-logs")
def get_audit_logs(_=Depends(require_admin)):
    client = get_admin_client()
    logs = client.table("audit_logs").select("*").order("created_at", desc=True).limit(500).execute().data or []
    return logs
