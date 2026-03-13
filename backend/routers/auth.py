from fastapi import APIRouter, Depends, HTTPException
from core.deps import get_current_user, require_admin
from db.supabase_client import get_admin_client

router = APIRouter()


@router.get("/profile/{user_id}")
def get_profile(user_id: str, _user=Depends(get_current_user)):
    """
    Returns a user's full profile including joined names for major, department,
    academic year, and section. Used by AuthContext on every session restore.
    """
    client = get_admin_client()

    profile = client.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    p = profile.data

    # Enrich with readable names
    if p.get("major_id"):
        m = client.table("majors").select("name").eq("id", p["major_id"]).maybe_single().execute()
        p["major_name"] = m.data["name"] if m.data else None

    if p.get("department_id"):
        d = client.table("departments").select("name").eq("id", p["department_id"]).maybe_single().execute()
        p["department_name"] = d.data["name"] if d.data else None

    if p.get("academic_year_id"):
        y = client.table("academic_years").select("year_number").eq("id", p["academic_year_id"]).maybe_single().execute()
        p["year_number"] = y.data["year_number"] if y.data else None

    if p.get("section_id"):
        s = client.table("sections").select("name").eq("id", p["section_id"]).maybe_single().execute()
        p["section_name"] = s.data["name"] if s.data else None

    return p
