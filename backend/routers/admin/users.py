from fastapi import APIRouter, Depends, HTTPException, Query
from core.deps import require_admin
from db.supabase_client import get_admin_client, get_auth_admin
from models.user import UserCreate, BulkStudentCreate

router = APIRouter()


def _create_user_in_supabase(full_name: str, email: str, password: str, role: str,
                              section_id=None, academic_year_id=None,
                              department_id=None, major_id=None) -> dict:
    """Creates a Supabase Auth user and inserts a profile row."""
    client = get_admin_client()

    # 1. Create auth user via Admin API
    try:
        auth_resp = client.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
        })
    except Exception as e:
        raise HTTPException(400, f"Auth user creation failed: {str(e)}")

    user_id = auth_resp.user.id

    # 2. Insert profile
    profile = {
        "id": user_id,
        "full_name": full_name,
        "email": email,
        "role": role,
        "status": "active",
        "section_id": section_id,
        "academic_year_id": academic_year_id,
        "department_id": department_id,
        "major_id": major_id,
    }
    profile = {k: v for k, v in profile.items() if v is not None}
    client.table("profiles").insert(profile).execute()
    return {"id": user_id, **profile}


# ─────────────────────────────────────────────────
# List users by role
# ─────────────────────────────────────────────────
@router.get("/users")
def list_users(
    role: str = Query(None),
    section_id: str = Query(None),
    department_id: str = Query(None),
    major_id: str = Query(None),
    _=Depends(require_admin)
):
    client = get_admin_client()
    # Join with academic tables to get names instead of just UUIDs
    q = client.table("profiles").select(
        "*, major:majors(id, name), department:departments(id, name), academic_year:academic_years(id, year_number), section:sections(id, name)"
    )
    if role:
        q = q.eq("role", role)
    if section_id:
        q = q.eq("section_id", section_id)
    if department_id:
        q = q.eq("department_id", department_id)
    if major_id:
        q = q.eq("major_id", major_id)
    result = q.order("created_at", desc=True).execute()
    return result.data or []


# ─────────────────────────────────────────────────
# Create faculty
# ─────────────────────────────────────────────────
@router.post("/users/faculty", status_code=201)
def create_faculty(body: UserCreate, _=Depends(require_admin)):
    return _create_user_in_supabase(
        full_name=body.full_name, email=body.email, password=body.password,
        role="faculty",
        department_id=body.department_id, major_id=body.major_id,
    )


# ─────────────────────────────────────────────────
# Create single student
# ─────────────────────────────────────────────────
@router.post("/users/student", status_code=201)
def create_student(body: UserCreate, _=Depends(require_admin)):
    return _create_user_in_supabase(
        full_name=body.full_name, email=body.email, password=body.password,
        role="student",
        section_id=body.section_id, academic_year_id=body.academic_year_id,
        department_id=body.department_id, major_id=body.major_id,
    )


# ─────────────────────────────────────────────────
# Bulk create students (from CSV)
# ─────────────────────────────────────────────────
@router.post("/users/students/bulk", status_code=201)
def bulk_create_students(body: BulkStudentCreate, _=Depends(require_admin)):
    created = []
    errors = []
    for s in body.students:
        try:
            user = _create_user_in_supabase(
                full_name=s.full_name, email=s.email, password=s.password,
                role="student",
                section_id=s.section_id, academic_year_id=s.academic_year_id,
                department_id=s.department_id, major_id=s.major_id,
            )
            created.append(user["id"])
        except Exception as e:
            errors.append({"email": s.email, "error": str(e)})
    return {"created": len(created), "errors": errors}


# ─────────────────────────────────────────────────
# Deactivate user
# ─────────────────────────────────────────────────
@router.patch("/users/{user_id}/deactivate")
def deactivate_user(user_id: str, _=Depends(require_admin)):
    get_admin_client().table("profiles").update({"status": "inactive"}).eq("id", user_id).execute()
    return {"message": "User deactivated"}


# ─────────────────────────────────────────────────
# Promote student to next academic year
# ─────────────────────────────────────────────────
@router.patch("/users/{user_id}/promote")
def promote_student(user_id: str, _=Depends(require_admin)):
    client = get_admin_client()
    profile = client.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
    if not profile.data:
        raise HTTPException(404, "Student not found")

    current_year_id = profile.data.get("academic_year_id")
    if not current_year_id:
        raise HTTPException(400, "Student has no academic year assigned")

    # Find current year info and look for next year_number in same department
    current = client.table("academic_years").select("*").eq("id", current_year_id).maybe_single().execute()
    if not current.data:
        raise HTTPException(404, "Academic year not found")

    next_year = (
        client.table("academic_years")
        .select("*")
        .eq("department_id", current.data["department_id"])
        .eq("year_number", current.data["year_number"] + 1)
        .maybe_single()
        .execute()
    )

    if not next_year.data:
        raise HTTPException(400, "No next academic year found. Student may be in final year.")

    client.table("profiles").update({
        "academic_year_id": next_year.data["id"]
    }).eq("id", user_id).execute()

    return {"message": f"Promoted to Year {next_year.data['year_number']}"}


# ─────────────────────────────────────────────────
# Admin dashboard stats
# ─────────────────────────────────────────────────
@router.get("/stats")
def get_stats(_=Depends(require_admin)):
    client = get_admin_client()
    users = client.table("profiles").select("role, status").execute().data or []
    quizzes = client.table("quizzes").select("id").execute().data or []
    sections = client.table("sections").select("id").execute().data or []

    total_users = len(users)
    active_students = sum(1 for u in users if u["role"] == "student" and u.get("status") == "active")
    total_quizzes = len(quizzes)
    total_sections = len(sections)

    return {
        "users": total_users,
        "students": active_students,
        "quizzes": total_quizzes,
        "sections": total_sections,
    }
