-- ============================================================
-- REPAIR: Fix sections table to use academic_year_id
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Drop the wrongly-patched sections table (it currently has department_id)
drop table if exists public.sections cascade;

-- Recreate with the CORRECT foreign key: academic_year_id
create table public.sections (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null,
  academic_year_id uuid        not null references public.academic_years(id) on delete cascade,
  created_at       timestamptz not null default now()
);

comment on table public.sections is 'Class sections (e.g. AIML-1A, AIML-1B) within a specific academic year';

alter table public.sections enable row level security;

create index if not exists idx_sections_year on public.sections(academic_year_id);

-- ============================================================
-- Done! sections table now correctly links to academic_years.
-- ============================================================
