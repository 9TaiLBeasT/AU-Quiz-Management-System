-- ============================================================
-- Fix Foreign Keys for faculty_assignments table
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Add foreign key from faculty_assignments.subject_id to subjects.id
ALTER TABLE public.faculty_assignments
  DROP CONSTRAINT IF EXISTS faculty_assignments_subject_id_fkey;

ALTER TABLE public.faculty_assignments
  ADD CONSTRAINT faculty_assignments_subject_id_fkey
  FOREIGN KEY (subject_id) REFERENCES public.subjects(id)
  ON DELETE CASCADE;

-- Add foreign key from faculty_assignments.section_id to sections.id
ALTER TABLE public.faculty_assignments
  DROP CONSTRAINT IF EXISTS faculty_assignments_section_id_fkey;

ALTER TABLE public.faculty_assignments
  ADD CONSTRAINT faculty_assignments_section_id_fkey
  FOREIGN KEY (section_id) REFERENCES public.sections(id)
  ON DELETE CASCADE;

-- Add foreign key from faculty_assignments.faculty_id to profiles.id (if missing)
ALTER TABLE public.faculty_assignments
  DROP CONSTRAINT IF EXISTS faculty_assignments_faculty_id_fkey;

ALTER TABLE public.faculty_assignments
  ADD CONSTRAINT faculty_assignments_faculty_id_fkey
  FOREIGN KEY (faculty_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Done! These explicit foreign keys allow Supabase PostgREST to perform joins securely.
