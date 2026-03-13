-- Migration: Add Results Visibility to Quizzes

-- 1. Add the column with a default of false
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS results_published BOOLEAN NOT NULL DEFAULT false;

-- 2. Notify Supabase PostgREST server to instantly reload the API cache
NOTIFY pgrst, 'reload schema';
