-- Fixplanet CRM Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types
CREATE TYPE user_role AS ENUM ('super_admin', 'manager', 'telecaller', 'pickup_agent');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'pickup_scheduled', 'in_repair', 'completed', 'delivered', 'cancelled');
CREATE TYPE device_type AS ENUM ('iPhone', 'Apple Watch', 'MacBook', 'iPad');

-- Staff Table (Users)
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'telecaller',
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads Table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT,
  device_type device_type NOT NULL,
  device_model TEXT NOT NULL,
  issue_reported TEXT NOT NULL,
  lead_source TEXT DEFAULT 'LP-1',
  status lead_status DEFAULT 'new',
  assigned_to UUID REFERENCES staff(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Notes Table
CREATE TABLE call_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  call_duration INTEGER, -- in seconds
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers Table (Converted from Leads)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT DEFAULT 'Bengaluru',
  total_repairs INTEGER DEFAULT 0,
  lifetime_value NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_device_type ON leads(device_type);
CREATE INDEX idx_call_notes_lead_id ON call_notes(lead_id);
CREATE INDEX idx_customers_contact_number ON customers(contact_number);
CREATE INDEX idx_staff_auth_user_id ON staff(auth_user_id);
CREATE INDEX idx_staff_role ON staff(role);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Staff policies
CREATE POLICY "Staff can view all staff members"
  ON staff FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage staff"
  ON staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.auth_user_id = auth.uid()
      AND s.role = 'super_admin'
    )
  );

-- Leads policies
CREATE POLICY "Authenticated users can view leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update assigned leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    assigned_to IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM staff s
      WHERE s.auth_user_id = auth.uid()
      AND s.role IN ('super_admin', 'manager')
    )
  );

-- Allow service role to insert leads (for webhook)
CREATE POLICY "Service role can insert leads"
  ON leads FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Call notes policies
CREATE POLICY "Authenticated users can view call notes"
  ON call_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert their own call notes"
  ON call_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

-- Customers policies
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.auth_user_id = auth.uid()
      AND s.role IN ('super_admin', 'manager')
    )
  );

-- Function to get next available telecaller (round-robin)
CREATE OR REPLACE FUNCTION get_next_telecaller()
RETURNS UUID AS $$
DECLARE
  next_telecaller_id UUID;
BEGIN
  SELECT s.id INTO next_telecaller_id
  FROM staff s
  LEFT JOIN (
    SELECT assigned_to, COUNT(*) as lead_count
    FROM leads
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY assigned_to
  ) lc ON s.id = lc.assigned_to
  WHERE s.role = 'telecaller'
    AND s.is_active = true
  ORDER BY COALESCE(lc.lead_count, 0) ASC, s.created_at ASC
  LIMIT 1;

  RETURN next_telecaller_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalLeads', (SELECT COUNT(*) FROM leads),
    'newLeads', (SELECT COUNT(*) FROM leads WHERE status = 'new'),
    'inProgress', (SELECT COUNT(*) FROM leads WHERE status IN ('contacted', 'qualified', 'pickup_scheduled', 'in_repair')),
    'completed', (SELECT COUNT(*) FROM leads WHERE status IN ('completed', 'delivered')),
    'conversion_rate', (
      SELECT ROUND(
        COALESCE(
          (SELECT COUNT(*)::NUMERIC FROM leads WHERE status IN ('completed', 'delivered')) /
          NULLIF((SELECT COUNT(*) FROM leads), 0) * 100,
          0
        ), 2
      )
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insert initial super admin (update email after running)
-- Uncomment and modify this after creating your first user via Supabase Auth
/*
INSERT INTO staff (auth_user_id, email, full_name, role, is_active)
VALUES (
  'YOUR_AUTH_USER_ID_HERE',
  'admin@fixplanet.in',
  'Super Admin',
  'super_admin',
  true
);
*/
