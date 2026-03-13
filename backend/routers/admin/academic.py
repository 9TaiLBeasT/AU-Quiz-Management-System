from fastapi import APIRouter, Depends, HTTPException, Query
from core.deps import require_admin
from db.supabase_client import get_admin_client
from models.academic import (
    MajorCreate, MajorUpdate,
    DepartmentCreate, DepartmentUpdate,
    AcademicYearCreate, AcademicYearUpdate,
    TermCreate, TermUpdate,
    SubjectCreate, SubjectUpdate,
    SectionCreate, SectionUpdate,
    FacultyAssignmentCreate,
)
import uuid

router = APIRouter()
db = get_admin_client


# ── Helper ────────────────────────────────────────────────────────
def _crud(table: str):
    """Returns (list_fn, create_fn, update_fn, delete_fn) for a table."""
    def list_all():
        return get_admin_client().table(table).select("*").order("created_at", desc=False).execute().data or []
    return list_all


# ═══════════════════════════════════════════
# MAJORS
# ═══════════════════════════════════════════
@router.get("/majors")
def list_majors(_=Depends(require_admin)):
    return get_admin_client().table("majors").select("*").order("name").execute().data or []


@router.post("/majors", status_code=201)
def create_major(body: MajorCreate, _=Depends(require_admin)):
    result = get_admin_client().table("majors").insert({"name": body.name}).execute()
    return result.data[0]


@router.put("/majors/{id}")
def update_major(id: str, body: MajorUpdate, _=Depends(require_admin)):
    result = get_admin_client().table("majors").update({"name": body.name}).eq("id", id).execute()
    if not result.data:
        raise HTTPException(404, "Major not found")
    return result.data[0]


@router.delete("/majors/{id}", status_code=204)
def delete_major(id: str, _=Depends(require_admin)):
    get_admin_client().table("majors").delete().eq("id", id).execute()


# ═══════════════════════════════════════════
# DEPARTMENTS
# ═══════════════════════════════════════════
@router.get("/departments")
def list_departments(major_id: str = Query(None), _=Depends(require_admin)):
    q = get_admin_client().table("departments").select("*").order("name")
    if major_id:
        q = q.eq("major_id", major_id)
    return q.execute().data or []


@router.post("/departments", status_code=201)
def create_department(body: DepartmentCreate, _=Depends(require_admin)):
    result = get_admin_client().table("departments").insert(body.model_dump()).execute()
    return result.data[0]


@router.put("/departments/{id}")
def update_department(id: str, body: DepartmentUpdate, _=Depends(require_admin)):
    result = get_admin_client().table("departments").update(body.model_dump()).eq("id", id).execute()
    if not result.data:
        raise HTTPException(404, "Department not found")
    return result.data[0]


@router.delete("/departments/{id}", status_code=204)
def delete_department(id: str, _=Depends(require_admin)):
    get_admin_client().table("departments").delete().eq("id", id).execute()


# ═══════════════════════════════════════════
# ACADEMIC YEARS
# ═══════════════════════════════════════════
@router.get("/academic-years")
def list_academic_years(department_id: str = Query(None), _=Depends(require_admin)):
    q = get_admin_client().table("academic_years").select("*").order("year_number")
    if department_id:
        q = q.eq("department_id", department_id)
    return q.execute().data or []


@router.post("/academic-years", status_code=201)
def create_academic_year(body: AcademicYearCreate, _=Depends(require_admin)):
    result = get_admin_client().table("academic_years").insert(body.model_dump()).execute()
    return result.data[0]


@router.put("/academic-years/{id}")
def update_academic_year(id: str, body: AcademicYearUpdate, _=Depends(require_admin)):
    result = get_admin_client().table("academic_years").update(body.model_dump()).eq("id", id).execute()
    if not result.data:
        raise HTTPException(404, "Academic year not found")
    return result.data[0]


@router.delete("/academic-years/{id}", status_code=204)
def delete_academic_year(id: str, _=Depends(require_admin)):
    get_admin_client().table("academic_years").delete().eq("id", id).execute()


# ═══════════════════════════════════════════
# TERMS
# ═══════════════════════════════════════════
@router.get("/terms")
def list_terms(academic_year_id: str = Query(None), _=Depends(require_admin)):
    q = get_admin_client().table("terms").select("*").order("term_number")
    if academic_year_id:
        q = q.eq("academic_year_id", academic_year_id)
    return q.execute().data or []


@router.post("/terms", status_code=201)
def create_term(body: TermCreate, _=Depends(require_admin)):
    result = get_admin_client().table("terms").insert(body.model_dump()).execute()
    return result.data[0]


@router.put("/terms/{id}")
def update_term(id: str, body: TermUpdate, _=Depends(require_admin)):
    result = get_admin_client().table("terms").update(body.model_dump()).eq("id", id).execute()
    if not result.data:
        raise HTTPException(404, "Term not found")
    return result.data[0]


@router.delete("/terms/{id}", status_code=204)
def delete_term(id: str, _=Depends(require_admin)):
    get_admin_client().table("terms").delete().eq("id", id).execute()


# ═══════════════════════════════════════════
# SUBJECTS
# ═══════════════════════════════════════════
@router.get("/subjects")
def list_subjects(term_id: str = Query(None), _=Depends(require_admin)):
    q = get_admin_client().table("subjects").select("*").order("name")
    if term_id:
        q = q.eq("term_id", term_id)
    return q.execute().data or []


@router.post("/subjects", status_code=201)
def create_subject(body: SubjectCreate, _=Depends(require_admin)):
    result = get_admin_client().table("subjects").insert(body.model_dump()).execute()
    return result.data[0]


@router.put("/subjects/{id}")
def update_subject(id: str, body: SubjectUpdate, _=Depends(require_admin)):
    result = get_admin_client().table("subjects").update(body.model_dump()).eq("id", id).execute()
    if not result.data:
        raise HTTPException(404, "Subject not found")
    return result.data[0]


@router.delete("/subjects/{id}", status_code=204)
def delete_subject(id: str, _=Depends(require_admin)):
    get_admin_client().table("subjects").delete().eq("id", id).execute()


# ═══════════════════════════════════════════
# SECTIONS
# ═══════════════════════════════════════════
@router.get("/sections")
def list_sections(academic_year_id: str = Query(None), _=Depends(require_admin)):
    q = get_admin_client().table("sections").select("*").order("name")
    if academic_year_id:
        q = q.eq("academic_year_id", academic_year_id)
    return q.execute().data or []


@router.post("/sections", status_code=201)
def create_section(body: SectionCreate, _=Depends(require_admin)):
    result = get_admin_client().table("sections").insert(body.model_dump()).execute()
    return result.data[0]


@router.put("/sections/{id}")
def update_section(id: str, body: SectionUpdate, _=Depends(require_admin)):
    result = get_admin_client().table("sections").update(body.model_dump()).eq("id", id).execute()
    if not result.data:
        raise HTTPException(404, "Section not found")
    return result.data[0]


@router.delete("/sections/{id}", status_code=204)
def delete_section(id: str, _=Depends(require_admin)):
    get_admin_client().table("sections").delete().eq("id", id).execute()


# ═══════════════════════════════════════════
# FACULTY ASSIGNMENTS
# ═══════════════════════════════════════════
@router.get("/faculty-assignments")
def list_faculty_assignments(faculty_id: str = Query(None), _=Depends(require_admin)):
    client = get_admin_client()
    # Join subjects and sections to get names
    q = client.table("faculty_assignments").select(
        "id, faculty_id, subject:subjects(id, name), section:sections(id, name, academic_year_id)"
    )
    if faculty_id:
        q = q.eq("faculty_id", faculty_id)
    return q.execute().data or []


@router.post("/faculty-assignments", status_code=201)
def create_faculty_assignment(body: FacultyAssignmentCreate, _=Depends(require_admin)):
    result = get_admin_client().table("faculty_assignments").insert(body.model_dump()).execute()
    return result.data[0]


@router.delete("/faculty-assignments/{id}", status_code=204)
def delete_faculty_assignment(id: str, _=Depends(require_admin)):
    get_admin_client().table("faculty_assignments").delete().eq("id", id).execute()
