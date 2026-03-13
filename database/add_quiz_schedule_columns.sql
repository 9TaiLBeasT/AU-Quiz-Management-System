-- ============================================================
-- Add Scheduling Windows to Quizzes
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add start_time and end_time columns
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS start_time timestamptz,
  ADD COLUMN IF NOT EXISTS end_time timestamptz;

-- 2. Drop the old deadline column (Optional, but cleaner)
ALTER TABLE public.quizzes
  DROP COLUMN IF EXISTS deadline;

-- 3. Also make sure quizzes table has subject_id and section_id properly linked
ALTER TABLE public.quizzes
  DROP CONSTRAINT IF EXISTS quizzes_subject_id_fkey;
ALTER TABLE public.quizzes
  ADD CONSTRAINT quizzes_subject_id_fkey
  FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.quizzes
  DROP CONSTRAINT IF EXISTS quizzes_section_id_fkey;
ALTER TABLE public.quizzes
  ADD CONSTRAINT quizzes_section_id_fkey
  FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;

-- Done!
