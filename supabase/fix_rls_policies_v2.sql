-- First, enable RLS on staff table if not already enabled
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Staff can view all staff members" ON staff;
DROP POLICY IF EXISTS "Super admins can manage staff" ON staff;
DROP POLICY IF EXISTS "Users can read own staff record" ON staff;
DROP POLICY IF EXISTS "Allow auth lookup for login" ON staff;
DROP POLICY IF EXISTS "Admins can manage all staff" ON staff;

-- Create new policies that allow login to work

-- 1. Allow anyone to read their own staff record (needed for login)
CREATE POLICY "Users can read own staff record"
ON staff
FOR SELECT
USING (auth.uid() = auth_user_id);

-- 2. Allow unauthenticated users to read staff by auth_user_id (needed for login check)
CREATE POLICY "Allow auth lookup for login"
ON staff
FOR SELECT
TO anon, authenticated
USING (true);

-- 3. Super admins can do everything
CREATE POLICY "Super admins can manage all staff"
ON staff
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staff
    WHERE staff.auth_user_id = auth.uid()
    AND staff.role = 'super_admin'
    AND staff.is_active = true
  )
);

-- Verify RLS is enabled and policies are in place
SELECT
  schemaname,
  tablename,
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'staff') as policy_count
FROM pg_tables
WHERE tablename = 'staff';

-- Show all policies
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'staff';
