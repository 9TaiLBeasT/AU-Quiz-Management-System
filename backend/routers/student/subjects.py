from fastapi import APIRouter, Depends
from core.deps import require_student
from db.supabase_client import get_admin_client

router = APIRouter()


@router.get("/subjects")
def get_student_subjects(user=Depends(require_student)):
    """
    Returns all subjects for the student's active term within their section.
    Joins through: section → academic_year → department → (all terms of that year) → subjects
    """
    client = get_admin_client()
    profile = user  # already fetched in deps

    section_id = profile.get("section_id")
    academic_year_id = profile.get("academic_year_id")

    if not section_id or not academic_year_id:
        return []

    # Get all terms for the student's academic year
    terms = client.table("terms").select("id, term_number").eq("academic_year_id", academic_year_id).execute().data or []
    term_ids = [t["id"] for t in terms]
    term_map = {t["id"]: t["term_number"] for t in terms}

    if not term_ids:
        return []

    # Get all subjects in those terms
    subjects = client.table("subjects").select("*").in_("term_id", term_ids).order("name").execute().data or []

    for s in subjects:
        s["term_number"] = term_map.get(s["term_id"], "—")

    return subjects
