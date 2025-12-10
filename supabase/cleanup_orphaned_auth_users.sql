-- Find and delete orphaned auth users (users in auth.users but not in staff table)
-- This happens when you delete from staff table but not from auth.users

-- Step 1: View orphaned users (optional - to see what will be deleted)
SELECT
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN staff s ON s.auth_user_id = au.id
WHERE s.id IS NULL
  AND au.email NOT LIKE '%@example.com'; -- Exclude any example/test users if needed

-- Step 2: Delete orphaned auth users
-- IMPORTANT: Review the results from Step 1 before running this!
-- Uncomment the lines below to actually delete:

-- DELETE FROM auth.users
-- WHERE id IN (
--   SELECT au.id
--   FROM auth.users au
--   LEFT JOIN staff s ON s.auth_user_id = au.id
--   WHERE s.id IS NULL
-- );
