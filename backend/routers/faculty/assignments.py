from fastapi import APIRouter, Depends
from core.deps import require_faculty
from db.supabase_client import get_admin_client

router = APIRouter()


@router.get("/assignments")
def get_assignments(user=Depends(require_faculty)):
    """Returns subjects + sections this faculty member is assigned to."""
    client = get_admin_client()
    assignments = (
        client.table("faculty_assignments")
        .select("id, faculty_id, subject_id, section_id, subjects(name, term_id, terms(term_number)), sections(name)")
        .eq("faculty_id", user["id"])
        .execute()
        .data or []
    )

    # Flatten the joined data
    result = []
    for a in assignments:
        subj = a.get("subjects") or {}
        sect = a.get("sections") or {}
        term = subj.get("terms") or {}
        result.append({
            "id": a["id"],
            "faculty_id": a["faculty_id"],
            "subject_id": a["subject_id"],
            "subject_name": subj.get("name", "—"),
            "term_id": subj.get("term_id"),
            "term_number": term.get("term_number", "—"),
            "section_id": a["section_id"],
            "section_name": sect.get("name", "—"),
        })
    return result


@router.get("/sections")
def get_faculty_sections(user=Depends(require_faculty)):
    """Returns distinct sections this faculty is assigned to."""
    client = get_admin_client()
    assignments = (
        client.table("faculty_assignments")
        .select("section_id, sections(id, name)")
        .eq("faculty_id", user["id"])
        .execute()
        .data or []
    )
    seen = set()
    sections = []
    for a in assignments:
        sect = a.get("sections") or {}
        sid = sect.get("id")
        if sid and sid not in seen:
            seen.add(sid)
            sections.append({"id": sid, "name": sect.get("name", "—")})
    return sections
