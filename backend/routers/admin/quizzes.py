from fastapi import APIRouter, Depends
from core.deps import require_admin
from db.supabase_client import get_admin_client

router = APIRouter()


@router.get("/quizzes")
def list_all_quizzes(_=Depends(require_admin)):
    """Returns all quizzes system-wide with enriched names."""
    client = get_admin_client()
    quizzes = client.table("quizzes").select("*").order("created_at", desc=True).execute().data or []

    # Enrich with related names
    subjects = {s["id"]: s["name"] for s in (client.table("subjects").select("id, name").execute().data or [])}
    sections = {s["id"]: s["name"] for s in (client.table("sections").select("id, name").execute().data or [])}
    profiles = {p["id"]: p["full_name"] for p in (client.table("profiles").select("id, full_name").eq("role", "faculty").execute().data or [])}

    for q in quizzes:
        q["subject_name"] = subjects.get(q.get("subject_id"), "—")
        q["section_name"] = sections.get(q.get("section_id"), "—")
        q["faculty_name"] = profiles.get(q.get("faculty_id"), "—")

    return quizzes
