# AU QUIZ — UNIVERSITY ASSESSMENT PLATFORM
## SYSTEM SPECIFICATION DOCUMENT
> Stored: 2026-02-21 | Version: 1.0

---

# 1. SYSTEM OVERVIEW

This system is a **production-ready, role-based university quiz and assessment platform** designed for institutions with complex academic hierarchies.

The platform replaces inefficient manual quiz creation workflows with an **AI-powered, scalable solution** that supports:

- Multi-major academic structures
- Multi-department support
- Multi-year and multi-term academic flow
- Section-based quiz assignment
- Role-based dashboards
- AI-generated quiz content
- Secure authentication and authorization
- Production-level database design

> ⚠️ This system is NOT a simple quiz app. It is a **structured academic infrastructure system**.

---

# 2. CORE ARCHITECTURE

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | React (role-based routing) | Vercel |
| Backend | FastAPI | Render |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth) | Supabase Cloud |
| AI | Gemini API | Backend-only access |

- Backend handles all business logic, AI integration, and JWT validation.
- No public registration — Supabase Auth used in admin-only mode.
- Row Level Security (RLS) enforced at the database layer.

---

# 3. AUTHENTICATION MODEL

- **No public registration.** Only Admin can create users.

### Authentication Flow:
1. Admin creates user via backend
2. Backend uses Supabase Admin API to create auth user
3. User logs in via Supabase Auth
4. Supabase returns JWT
5. Frontend sends JWT to FastAPI
6. Backend validates JWT
7. Backend fetches user profile
8. Role-based dashboard is loaded

> Passwords are **never** handled manually by the frontend.

---

# 4. USER ROLES

Exactly **3 roles** exist in the system:

| Role | Description |
|---|---|
| `admin` | Full system control, cannot attempt quizzes |
| `faculty` | Can manage and create quizzes for assigned subjects/sections |
| `student` | Can view and attempt assigned quizzes |

**Role must be validated on every backend request.**

---

# 5. ACADEMIC HIERARCHY (DYNAMIC)

The system supports a fully dynamic, admin-controlled academic hierarchy:

```
Major (BTech, MTech, etc.)
  └── Department (CSE, AIML, DS, etc.)
        └── Academic Year (1, 2, 3, 4)
              └── Term (1, 2, 3, 4)
                    └── Subject
                          └── Section (CSE-A, CSE-B)
                                └── Students
```

All levels of this hierarchy are **fully controlled by Admin**.

---

# 6. ROLE-BASED FEATURES

---

## 🛠 ADMIN FEATURES

### Academic Management — Create / Edit / Delete:
- Majors
- Departments
- Academic Years
- Terms
- Subjects
- Sections

### Faculty Management:
- Create Faculty accounts
- Assign faculty to Subject + Term + Section
- Change faculty every term

### Student Management:
- Create Student accounts (individually or bulk upload via CSV)
- Assign student to section
- Promote students to next academic year
- Deactivate alumni

### System Control:
- View all quizzes
- View system analytics
- Deactivate users
- View audit logs

> ❌ Admin **cannot** attempt quizzes.

---

## 👨‍🏫 FACULTY FEATURES

Faculty can **only** access assigned subjects.

### Dashboard:
- View assigned subjects (filtered by term and section)

### Quiz Creation:
- Create quiz manually
- Generate quiz via AI
- Upload PDF → AI extracts and generates MCQs

### Quiz Configuration:
- Time limit
- Deadline
- Difficulty level
- Number of questions
- Randomize question order
- Randomize options
- Section-based assignment

### Quiz Management:
- Edit quiz before deadline
- View submissions
- View section average
- View question-wise accuracy
- View weak topic analysis

> ❌ Faculty **cannot** modify academic structure.

---

## 👨‍🎓 STUDENT FEATURES

### Dashboard:
- View profile (Major, Department, Academic Year, Section)
- View current term subjects

### Quiz Interaction:
- View assigned quizzes
- Attempt quiz
- Auto-submit on timeout
- Single attempt restriction (configurable)

### Results:
- View score
- View correct answers (optional setting)
- View performance history
- View subject-wise analytics

> ❌ Students **cannot** access other sections' data.

---

# 7. DATABASE DESIGN (SUPABASE — POSTGRESQL)

Authentication is handled by **Supabase Auth**. Additional profile and academic data is stored in custom tables.

---

### TABLE: `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Same as `auth.users.id` |
| `full_name` | TEXT | — |
| `role` | ENUM | `admin`, `faculty`, `student` |
| `major_id` | FK | — |
| `department_id` | FK | — |
| `academic_year_id` | FK | — |
| `section_id` | FK | Nullable for admin |
| `status` | ENUM | `active`, `inactive` |
| `created_at` | TIMESTAMP | — |

---

### TABLE: `majors`
| Column | Type |
|---|---|
| `id` | UUID |
| `name` | TEXT |

---

### TABLE: `departments`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | — |
| `name` | TEXT | — |
| `major_id` | FK | References `majors` |

---

### TABLE: `academic_years`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | — |
| `year_number` | INT | 1–4 |
| `department_id` | FK | References `departments` |

---

### TABLE: `terms`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | — |
| `term_number` | INT | 1–4 |
| `academic_year_id` | FK | References `academic_years` |

---

### TABLE: `subjects`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | — |
| `name` | TEXT | — |
| `term_id` | FK | References `terms` |

---

### TABLE: `sections`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | — |
| `name` | TEXT | e.g., CSE-A, CSE-B |
| `academic_year_id` | FK | References `academic_years` |

---

### TABLE: `faculty_assignments`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | — |
| `faculty_id` | FK | References `profiles` |
| `subject_id` | FK | References `subjects` |
| `section_id` | FK | References `sections` |

---

### TABLE: `quizzes`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | — |
| `subject_id` | FK | — |
| `faculty_id` | FK | — |
| `section_id` | FK | — |
| `time_limit` | INT | In minutes |
| `deadline` | TIMESTAMP | — |
| `difficulty_level` | TEXT | easy / medium / hard |
| `created_at` | TIMESTAMP | — |
| `status` | TEXT | draft / published / closed |

---

### TABLE: `questions`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | — |
| `quiz_id` | FK | References `quizzes` |
| `question_text` | TEXT | — |
| `option_a` | TEXT | — |
| `option_b` | TEXT | — |
| `option_c` | TEXT | — |
| `option_d` | TEXT | — |
| `correct_option` | CHAR | `a`, `b`, `c`, or `d` |
| `explanation` | TEXT | — |
| `difficulty` | TEXT | easy / medium / hard |

---

### TABLE: `attempts`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | — |
| `quiz_id` | FK | References `quizzes` |
| `student_id` | FK | References `profiles` |
| `score` | FLOAT | — |
| `submitted_at` | TIMESTAMP | — |

---

# 8. ROW LEVEL SECURITY (RLS RULES)

RLS must be **enabled for all sensitive tables**.

| Role | Access Rules |
|---|---|
| `student` | Only quizzes assigned to their section; only their own attempts |
| `faculty` | Only subjects and sections assigned to them |
| `admin` | Full access to all tables |

---

# 9. BACKEND RESPONSIBILITIES (FASTAPI)

The backend is the **single source of truth** for all business logic.

Handles:
- JWT validation
- Role-based access control (RBAC)
- CRUD operations for all entities
- AI generation requests (via Gemini API)
- JSON validation of AI output
- Quiz submission logic
- Score calculation
- Deadline enforcement
- Business rule enforcement
- Logging and audit trails

> ⚠️ AI API keys must **only** be stored in backend environment variables. Never exposed to frontend.

---

# 10. AI INTEGRATION REQUIREMENTS

### AI Output Format (Structured JSON only):
```json
{
  "question_text": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "correct_option": "a|b|c|d",
  "explanation": "...",
  "difficulty": "easy|medium|hard"
}
```

### Backend AI Validation Must:
- Validate JSON schema strictly
- Remove duplicate questions
- Ensure valid answer options (`a`, `b`, `c`, or `d`)
- Reject malformed or incomplete AI responses

> ❌ AI must **never** be called directly from the frontend.

---

# 11. SECURITY REQUIREMENTS

- No public registration
- JWT-based authentication on all routes
- Role validation on every endpoint
- Backend-only AI access
- Strict input validation
- Prevent multiple quiz attempts (enforced in DB + backend)
- Enforce deadlines strictly (server-side time, not client-side)
- Protection against SQL injection (use ORM/parameterized queries)
- HTTPS enforced in production

---

# 12. DEPLOYMENT ARCHITECTURE

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database & Auth | Supabase |
| AI Service | Gemini API |

- All secrets and API keys stored in platform environment variable settings.
- No hardcoded credentials anywhere in the codebase.

---

# 13. SCALABILITY REQUIREMENTS

- Modular backend structure (routers, services, models separated)
- Proper DB indexing on all FK and frequently queried columns
- Pagination for all large list queries
- Caching for frequently used, low-change data (e.g., majors, departments)
- Separate AI service layer (not mixed into CRUD routes)
- Clean separation of concerns across all layers

---

# 14. SYSTEM GOAL

This system must function as:

> **A scalable, secure, AI-driven academic assessment infrastructure suitable for real university deployment.**

It must **not** behave like a simple CRUD demo app.
