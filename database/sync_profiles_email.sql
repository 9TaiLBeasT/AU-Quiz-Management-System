-- ============================================================
-- Add Email to Profiles and Backfill from Auth
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add the email column if it doesn't already exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Backfill existing profile emails from the secure auth.users table
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. (Optional) Make it searchable if needed later
-- CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Done! Refresh the app to see emails in the Student Management table.
