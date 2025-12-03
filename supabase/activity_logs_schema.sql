-- Activity Logs Schema for Fixplanet CRM
-- Run this in your Supabase SQL Editor after the main schema

-- Activity action types
CREATE TYPE activity_action AS ENUM (
  'lead_created', 'lead_updated', 'lead_status_changed', 'lead_assigned', 'lead_deleted',
  'customer_created', 'customer_updated', 'customer_deleted',
  'opportunity_created', 'opportunity_moved', 'opportunity_won', 'opportunity_lost',
  'call_made', 'note_added',
  'staff_added', 'staff_updated', 'staff_role_changed', 'staff_deactivated',
  'invoice_generated', 'payment_received',
  'login_success', 'login_failed',
  'bulk_operation'
);

-- Activity entity types
CREATE TYPE activity_entity AS ENUM (
  'lead', 'customer', 'opportunity', 'staff', 'invoice', 'call_note', 'system'
);

-- Activity Logs Table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  action_type activity_action NOT NULL,
  entity_type activity_entity NOT NULL,
  entity_id UUID,
  entity_name TEXT, -- Human readable name (e.g., customer name, lead name)
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Composite index for filtering
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view activity logs
CREATE POLICY "Authenticated users can view activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert activity logs
CREATE POLICY "Authenticated users can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only super_admins can delete activity logs (for cleanup)
CREATE POLICY "Super admins can delete activity logs"
  ON activity_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.auth_user_id = auth.uid()
      AND s.role = 'super_admin'
    )
  );

-- Function to get activity stats for dashboard
CREATE OR REPLACE FUNCTION get_activity_stats(days_back INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalActions', (
      SELECT COUNT(*) FROM activity_logs
      WHERE created_at > NOW() - (days_back || ' days')::INTERVAL
    ),
    'actionsByType', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT action_type, COUNT(*) as count
        FROM activity_logs
        WHERE created_at > NOW() - (days_back || ' days')::INTERVAL
        GROUP BY action_type
        ORDER BY count DESC
        LIMIT 10
      ) t
    ),
    'mostActiveUsers', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT
          s.full_name,
          s.id as user_id,
          COUNT(*) as action_count
        FROM activity_logs al
        JOIN staff s ON al.user_id = s.id
        WHERE al.created_at > NOW() - (days_back || ' days')::INTERVAL
        GROUP BY s.id, s.full_name
        ORDER BY action_count DESC
        LIMIT 5
      ) t
    ),
    'activityByHour', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as count
        FROM activity_logs
        WHERE created_at > NOW() - (days_back || ' days')::INTERVAL
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      ) t
    ),
    'activityByDay', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM activity_logs
        WHERE created_at > NOW() - (days_back || ' days')::INTERVAL
        GROUP BY DATE(created_at)
        ORDER BY date
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate average response time (lead created to first call)
CREATE OR REPLACE FUNCTION get_avg_response_time()
RETURNS INTERVAL AS $$
DECLARE
  avg_time INTERVAL;
BEGIN
  SELECT AVG(first_call - lead_created) INTO avg_time
  FROM (
    SELECT
      al_lead.created_at as lead_created,
      MIN(al_call.created_at) as first_call
    FROM activity_logs al_lead
    LEFT JOIN activity_logs al_call ON
      al_call.entity_id = al_lead.entity_id
      AND al_call.action_type = 'call_made'
      AND al_call.created_at > al_lead.created_at
    WHERE al_lead.action_type = 'lead_created'
    AND al_lead.created_at > NOW() - INTERVAL '30 days'
    GROUP BY al_lead.entity_id, al_lead.created_at
    HAVING MIN(al_call.created_at) IS NOT NULL
  ) subquery;

  RETURN COALESCE(avg_time, INTERVAL '0');
END;
$$ LANGUAGE plpgsql;
