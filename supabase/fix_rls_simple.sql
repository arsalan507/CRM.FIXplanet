-- Disable RLS temporarily to fix the issue
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Staff can view all staff members" ON staff;
DROP POLICY IF EXISTS "Super admins can manage staff" ON staff;
DROP POLICY IF EXISTS "Users can read own staff record" ON staff;
DROP POLICY IF EXISTS "Allow auth lookup for login" ON staff;
DROP POLICY IF EXISTS "Admins can manage all staff" ON staff;
DROP POLICY IF EXISTS "Super admins can manage all staff" ON staff;

-- Re-enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- 1. Allow anyone authenticated to read all staff (simplified for now)
CREATE POLICY "Authenticated users can read staff"
ON staff
FOR SELECT
TO authenticated
USING (true);

-- 2. Allow anon (unauthenticated) to read staff for login check
CREATE POLICY "Allow anon read for login"
ON staff
FOR SELECT
TO anon
USING (true);

-- 3. Allow super_admin to do everything
CREATE POLICY "Super admin full access"
ON staff
FOR ALL
TO authenticated
USING (
  auth_user_id IN (
    SELECT s.auth_user_id
    FROM staff s
    WHERE s.auth_user_id = auth.uid()
    AND s.role = 'super_admin'
    AND s.is_active = true
    LIMIT 1
  )
)
WITH CHECK (
  auth_user_id IN (
    SELECT s.auth_user_id
    FROM staff s
    WHERE s.auth_user_id = auth.uid()
    AND s.role = 'super_admin'
    AND s.is_active = true
    LIMIT 1
  )
);

-- Verify
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'staff';
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'staff';
