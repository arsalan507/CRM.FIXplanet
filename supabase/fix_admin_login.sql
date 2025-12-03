-- Simple password update for existing admin account
-- This updates the password to: SuperAdmin123!

UPDATE auth.users
SET encrypted_password = crypt('SuperAdmin123!', gen_salt('bf'))
WHERE email = 'info.flixplanet@gmail.com';

-- Verify the update
SELECT
  au.id,
  au.email,
  s.full_name,
  s.role,
  s.is_active,
  CASE WHEN au.encrypted_password IS NOT NULL THEN 'Password Set' ELSE 'No Password' END as password_status
FROM auth.users au
LEFT JOIN staff s ON s.auth_user_id = au.id
WHERE au.email = 'info.flixplanet@gmail.com';
