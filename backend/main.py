import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from routers.auth import router as auth_router
from routers.admin.academic import router as admin_academic_router
from routers.admin.users import router as admin_users_router
from routers.admin.quizzes import router as admin_quizzes_router
from routers.admin.analytics import router as admin_analytics_router
from routers.faculty.assignments import router as faculty_assignments_router
from routers.faculty.quizzes import router as faculty_quizzes_router
from routers.faculty.ai import router as faculty_ai_router
from routers.faculty.analytics import router as faculty_analytics_router
from routers.student.subjects import router as student_subjects_router
from routers.student.quizzes import router as student_quizzes_router
from routers.student.history import router as student_history_router

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
]

# Add production origins from environment variable
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    origins_to_add = [o.strip() for o in env_origins.split(",") if o.strip()]
    ALLOWED_ORIGINS.extend(origins_to_add)

print(f"INFO: Initialized with ALLOWED_ORIGINS: {ALLOWED_ORIGINS}")

app = FastAPI(
    title="AU Quiz — University Assessment Platform",
    description="Production-ready API for role-based university quiz management.",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Exception handlers — ensure CORS headers on ALL error responses ──

@app.exception_handler(StarletteHTTPException)
async def cors_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Returns JSON error but lets middleware handle CORS."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(RequestValidationError)
async def cors_validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)}
    )

@app.exception_handler(Exception)
async def cors_server_error_handler(request: Request, exc: Exception):
    """Catches unexpected errors and returns 500. Middleware handles CORS."""
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {type(exc).__name__}: {exc}"}
    )

# ── Routers ────────────────────────────────────────────────────────
app.include_router(auth_router,                 prefix="/auth",                 tags=["Auth"])
app.include_router(admin_academic_router,       prefix="/admin",                tags=["Admin — Academic"])
app.include_router(admin_users_router,          prefix="/admin",                tags=["Admin — Users"])
app.include_router(admin_quizzes_router,        prefix="/admin",                tags=["Admin — Quizzes"])
app.include_router(admin_analytics_router,      prefix="/admin",                tags=["Admin — Analytics"])
app.include_router(faculty_assignments_router,  prefix="/faculty",              tags=["Faculty — Assignments"])
app.include_router(faculty_quizzes_router,      prefix="/faculty",              tags=["Faculty — Quizzes"])
app.include_router(faculty_ai_router,           prefix="/faculty",              tags=["Faculty — AI"])
app.include_router(faculty_analytics_router,    prefix="/faculty",              tags=["Faculty — Analytics"])
app.include_router(student_subjects_router,     prefix="/student",              tags=["Student — Subjects"])
app.include_router(student_quizzes_router,      prefix="/student",              tags=["Student — Quizzes"])
app.include_router(student_history_router,      prefix="/student",              tags=["Student — History"])


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "AU Quiz API"}


@app.get("/", tags=["Health"])
def root():
    return {"message": "AU Quiz API is running. Visit /docs for Swagger UI."}
