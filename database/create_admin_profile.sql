-- ============================================================
-- Create your admin profile in the profiles table
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================
-- Step 1: Find your user ID from Supabase Auth
--    → Go to Authentication → Users → copy the UUID of your admin account

-- Step 2: Replace 'YOUR-USER-UUID-HERE' with the actual UUID, then run:

insert into public.profiles (id, full_name, role)
values (
  'YOUR-USER-UUID-HERE',   -- ← paste your UUID from Supabase Auth → Users
  'Admin',                  -- ← your display name
  'admin'                   -- ← must be exactly: admin, faculty, or student
)
on conflict (id) do update
  set role = 'admin';

-- ============================================================
-- After running this, refresh the browser — you should land
-- on the Admin Dashboard automatically.
-- ============================================================
