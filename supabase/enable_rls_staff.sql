-- Enable Row Level Security on staff table
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'staff';
