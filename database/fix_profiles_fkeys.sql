-- ============================================================
-- Fix Foreign Keys for profiles table
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Add foreign key from profiles.major_id to majors.id
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_major_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_major_id_fkey
  FOREIGN KEY (major_id) REFERENCES public.majors(id)
  ON DELETE SET NULL;

-- Add foreign key from profiles.department_id to departments.id
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_department_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES public.departments(id)
  ON DELETE SET NULL;

-- Add foreign key from profiles.academic_year_id to academic_years.id
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_academic_year_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_academic_year_id_fkey
  FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
  ON DELETE SET NULL;

-- Add foreign key from profiles.section_id to sections.id
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_section_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_section_id_fkey
  FOREIGN KEY (section_id) REFERENCES public.sections(id)
  ON DELETE SET NULL;

-- Done! These explicit foreign keys allow Supabase PostgREST to perform joins securely.
