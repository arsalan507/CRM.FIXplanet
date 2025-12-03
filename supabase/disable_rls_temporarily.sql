-- Temporarily disable RLS on staff table to allow login
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'staff';
