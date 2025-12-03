-- Add arsalanahmed507@gmail.com as super admin
-- Password: Anas@123

DO $$
DECLARE
  new_auth_id uuid;
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'arsalanahmed507@gmail.com',
    crypt('Anas@123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_auth_id;

  -- Create staff record
  INSERT INTO staff (
    auth_user_id,
    full_name,
    email,
    role,
    is_active,
    permissions,
    created_at,
    updated_at
  )
  VALUES (
    new_auth_id,
    'Arsalan Ahmed',
    'arsalanahmed507@gmail.com',
    'super_admin',
    true,
    '{}'::jsonb,
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Successfully created super admin account for arsalanahmed507@gmail.com';
END $$;

-- Verify the new account
SELECT
  au.id,
  au.email,
  s.full_name,
  s.role,
  s.is_active,
  CASE WHEN au.encrypted_password IS NOT NULL THEN 'Password Set' ELSE 'No Password' END as password_status
FROM auth.users au
JOIN staff s ON s.auth_user_id = au.id
WHERE au.email = 'arsalanahmed507@gmail.com';
