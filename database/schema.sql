-- ============================================================
-- AU QUIZ PLATFORM — SUPABASE DATABASE SCHEMA
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";


-- ============================================================
-- 1. MAJORS
-- ============================================================
create table if not exists public.majors (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null unique,
  created_at  timestamptz not null default now()
);
comment on table public.majors is 'Top-level academic majors (e.g., Computer Science, Mechanical Engineering)';


-- ============================================================
-- 2. DEPARTMENTS
-- ============================================================
create table if not exists public.departments (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  major_id    uuid        not null references public.majors(id) on delete cascade,
  created_at  timestamptz not null default now()
);
comment on table public.departments is 'Departments within a major';


-- ============================================================
-- 3. ACADEMIC YEARS
-- ============================================================
create table if not exists public.academic_years (
  id            uuid        primary key default gen_random_uuid(),
  year_number   int         not null check (year_number between 1 and 6),
  department_id uuid        not null references public.departments(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (year_number, department_id)
);
comment on table public.academic_years is 'Year 1–6 within a department';


-- ============================================================
-- 4. TERMS
-- ============================================================
create table if not exists public.terms (
  id               uuid        primary key default gen_random_uuid(),
  term_number      int         not null check (term_number between 1 and 4),
  academic_year_id uuid        not null references public.academic_years(id) on delete cascade,
  created_at       timestamptz not null default now(),
  unique (term_number, academic_year_id)
);
comment on table public.terms is 'Terms (semesters) within an academic year';


-- ============================================================
-- 5. SUBJECTS
-- ============================================================
create table if not exists public.subjects (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  term_id     uuid        not null references public.terms(id) on delete cascade,
  created_at  timestamptz not null default now()
);
comment on table public.subjects is 'Subjects taught within a term';


-- ============================================================
-- 6. SECTIONS
-- ============================================================
create table if not exists public.sections (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null,
  academic_year_id uuid        not null references public.academic_years(id) on delete cascade,
  created_at       timestamptz not null default now()
);
comment on table public.sections is 'Class sections within an academic year (e.g., CSE-A, CSE-B)';


-- ============================================================
-- 7. PROFILES
-- Links to auth.users (Supabase Auth) — one profile per user
-- ============================================================
create table if not exists public.profiles (
  id               uuid        primary key references auth.users(id) on delete cascade,
  full_name        text        not null,
  role             text        not null check (role in ('admin', 'faculty', 'student')),
  status           text        not null default 'active' check (status in ('active', 'inactive')),

  -- Optional FK fields (null for admin users)
  section_id       uuid        references public.sections(id) on delete set null,
  academic_year_id uuid        references public.academic_years(id) on delete set null,
  department_id    uuid        references public.departments(id) on delete set null,
  major_id         uuid        references public.majors(id) on delete set null,

  created_at       timestamptz not null default now()
);
comment on table public.profiles is 'Extended user profiles with role and academic placement';


-- ============================================================
-- 8. FACULTY ASSIGNMENTS
-- Which faculty teaches which subject to which section
-- ============================================================
create table if not exists public.faculty_assignments (
  id          uuid        primary key default gen_random_uuid(),
  faculty_id  uuid        not null references public.profiles(id) on delete cascade,
  subject_id  uuid        not null references public.subjects(id) on delete cascade,
  section_id  uuid        not null references public.sections(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (faculty_id, subject_id, section_id)
);
comment on table public.faculty_assignments is 'Maps a faculty member to a subject+section combination';


-- ============================================================
-- 9. QUIZZES
-- ============================================================
create table if not exists public.quizzes (
  id                   uuid        primary key default gen_random_uuid(),
  faculty_id           uuid        not null references public.profiles(id) on delete cascade,
  subject_id           uuid        not null references public.subjects(id) on delete cascade,
  section_id           uuid        not null references public.sections(id) on delete cascade,
  time_limit           int         not null default 30 check (time_limit > 0),
  deadline             timestamptz,
  difficulty_level     text        not null default 'medium' check (difficulty_level in ('easy', 'medium', 'hard')),
  randomize_questions  boolean     not null default false,
  randomize_options    boolean     not null default false,
  show_answers         boolean     not null default true,
  status               text        not null default 'draft' check (status in ('draft', 'published', 'closed')),
  created_at           timestamptz not null default now()
);
comment on table public.quizzes is 'Quizzes created by faculty, assigned to a section';


-- ============================================================
-- 10. QUIZ QUESTIONS
-- ============================================================
create table if not exists public.quiz_questions (
  id             uuid  primary key default gen_random_uuid(),
  quiz_id        uuid  not null references public.quizzes(id) on delete cascade,
  question_text  text  not null,
  option_a       text  not null,
  option_b       text  not null,
  option_c       text  not null,
  option_d       text  not null,
  correct_option text  not null check (correct_option in ('a', 'b', 'c', 'd')),
  explanation    text  not null default '',
  difficulty     text  not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  created_at     timestamptz not null default now()
);
comment on table public.quiz_questions is 'Individual MCQ questions belonging to a quiz';


-- ============================================================
-- 11. QUIZ ATTEMPTS
-- One row per student per quiz (enforced by unique constraint)
-- ============================================================
create table if not exists public.quiz_attempts (
  id              uuid        primary key default gen_random_uuid(),
  quiz_id         uuid        not null references public.quizzes(id) on delete cascade,
  student_id      uuid        not null references public.profiles(id) on delete cascade,
  section_id      uuid        not null references public.sections(id) on delete cascade,
  answers         jsonb       not null default '{}',
  score           int         not null default 0,
  total_questions int         not null default 0,
  submitted_at    timestamptz not null default now(),
  unique (quiz_id, student_id)    -- prevents multiple submissions
);
comment on table public.quiz_attempts is 'Student quiz submissions with answers and scores';


-- ============================================================
-- 12. AUDIT LOGS
-- ============================================================
create table if not exists public.audit_logs (
  id          uuid        primary key default gen_random_uuid(),
  actor_email text,
  action      text        not null,
  details     text,
  created_at  timestamptz not null default now()
);
comment on table public.audit_logs is 'System activity trail for admin review';


-- ============================================================
-- ROW LEVEL SECURITY
-- All tables use RLS. The backend uses the service_role key
-- which bypasses RLS automatically. Direct public access is
-- blocked — users MUST go through the FastAPI backend.
-- ============================================================

alter table public.majors             enable row level security;
alter table public.departments        enable row level security;
alter table public.academic_years     enable row level security;
alter table public.terms              enable row level security;
alter table public.subjects           enable row level security;
alter table public.sections           enable row level security;
alter table public.profiles           enable row level security;
alter table public.faculty_assignments enable row level security;
alter table public.quizzes            enable row level security;
alter table public.quiz_questions     enable row level security;
alter table public.quiz_attempts      enable row level security;
alter table public.audit_logs         enable row level security;


-- Allow each authenticated user to read their own profile
-- (used by Supabase Auth internals, backend bypasses RLS anyway)
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

create index if not exists idx_profiles_role           on public.profiles(role);
create index if not exists idx_profiles_section        on public.profiles(section_id);
create index if not exists idx_faculty_assignments_fac on public.faculty_assignments(faculty_id);
create index if not exists idx_faculty_assignments_sec on public.faculty_assignments(section_id);
create index if not exists idx_quizzes_section         on public.quizzes(section_id);
create index if not exists idx_quizzes_faculty         on public.quizzes(faculty_id);
create index if not exists idx_quizzes_status          on public.quizzes(status);
create index if not exists idx_quiz_questions_quiz     on public.quiz_questions(quiz_id);
create index if not exists idx_quiz_attempts_student   on public.quiz_attempts(student_id);
create index if not exists idx_quiz_attempts_quiz      on public.quiz_attempts(quiz_id);
create index if not exists idx_audit_logs_created      on public.audit_logs(created_at desc);


-- ============================================================
-- SEED: Create the first admin user
-- Run this AFTER creating the admin user via Supabase Auth UI
-- Replace the UUID with the actual user's ID from auth.users
-- ============================================================

-- INSERT INTO public.profiles (id, full_name, role)
-- VALUES ('paste-auth-user-uuid-here', 'Admin User', 'admin');

-- ============================================================
-- DONE! All 12 tables created.
-- ============================================================
