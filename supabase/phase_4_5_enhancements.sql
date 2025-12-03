-- Phase 4.5: Advanced Insights & Polish
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. TURNAROUND TIME TRACKING
-- ============================================

-- Add timestamp columns to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS first_contact_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pickup_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS repair_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS repair_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_first_contact_at ON leads(first_contact_at);
CREATE INDEX IF NOT EXISTS idx_leads_repair_started_at ON leads(repair_started_at);
CREATE INDEX IF NOT EXISTS idx_leads_repair_completed_at ON leads(repair_completed_at);

-- ============================================
-- 2. LEAD SOURCE ATTRIBUTION (UTM TRACKING)
-- ============================================

-- Add UTM and source tracking columns
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS landing_page_url TEXT,
ADD COLUMN IF NOT EXISTS referrer_url TEXT;

-- Add indexes for analytics
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads(utm_source);
CREATE INDEX IF NOT EXISTS idx_leads_utm_campaign ON leads(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads(lead_source);

-- ============================================
-- 3. FUNCTIONS FOR ANALYTICS
-- ============================================

-- Function to calculate average repair turnaround time
CREATE OR REPLACE FUNCTION get_avg_repair_time(days_back INTEGER DEFAULT 30)
RETURNS INTERVAL AS $$
DECLARE
  avg_time INTERVAL;
BEGIN
  SELECT AVG(repair_completed_at - repair_started_at) INTO avg_time
  FROM leads
  WHERE repair_started_at IS NOT NULL
    AND repair_completed_at IS NOT NULL
    AND repair_started_at > NOW() - (days_back || ' days')::INTERVAL;

  RETURN COALESCE(avg_time, INTERVAL '0');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate average response time
CREATE OR REPLACE FUNCTION get_avg_response_time(days_back INTEGER DEFAULT 30)
RETURNS INTERVAL AS $$
DECLARE
  avg_time INTERVAL;
BEGIN
  SELECT AVG(first_contact_at - created_at) INTO avg_time
  FROM leads
  WHERE first_contact_at IS NOT NULL
    AND created_at > NOW() - (days_back || ' days')::INTERVAL;

  RETURN COALESCE(avg_time, INTERVAL '0');
END;
$$ LANGUAGE plpgsql;

-- Function to get overdue repairs
CREATE OR REPLACE FUNCTION get_overdue_repairs()
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  device_type TEXT,
  device_model TEXT,
  repair_started_at TIMESTAMPTZ,
  hours_in_repair NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.customer_name,
    l.device_type,
    l.device_model,
    l.repair_started_at,
    EXTRACT(EPOCH FROM (NOW() - l.repair_started_at)) / 3600 AS hours_in_repair
  FROM leads l
  WHERE l.repair_started_at IS NOT NULL
    AND l.repair_completed_at IS NULL
    AND l.status = 'in_repair'
    AND (NOW() - l.repair_started_at) > INTERVAL '48 hours'
  ORDER BY l.repair_started_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get lead source performance
CREATE OR REPLACE FUNCTION get_lead_source_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  source TEXT,
  total_leads BIGINT,
  converted_leads BIGINT,
  conversion_rate NUMERIC,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(l.lead_source, 'Unknown') as source,
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE l.status = 'won') as converted_leads,
    ROUND(
      (COUNT(*) FILTER (WHERE l.status = 'won')::NUMERIC / NULLIF(COUNT(*), 0) * 100),
      2
    ) as conversion_rate,
    COALESCE(SUM(l.quoted_amount) FILTER (WHERE l.status = 'won'), 0) as total_revenue
  FROM leads l
  WHERE l.created_at > NOW() - (days_back || ' days')::INTERVAL
  GROUP BY COALESCE(l.lead_source, 'Unknown')
  ORDER BY total_leads DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get UTM campaign performance
CREATE OR REPLACE FUNCTION get_utm_campaign_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  campaign TEXT,
  source TEXT,
  medium TEXT,
  total_leads BIGINT,
  converted_leads BIGINT,
  conversion_rate NUMERIC,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(l.utm_campaign, 'No Campaign') as campaign,
    COALESCE(l.utm_source, 'Unknown') as source,
    COALESCE(l.utm_medium, 'Unknown') as medium,
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE l.status = 'won') as converted_leads,
    ROUND(
      (COUNT(*) FILTER (WHERE l.status = 'won')::NUMERIC / NULLIF(COUNT(*), 0) * 100),
      2
    ) as conversion_rate,
    COALESCE(SUM(l.quoted_amount) FILTER (WHERE l.status = 'won'), 0) as total_revenue
  FROM leads l
  WHERE l.created_at > NOW() - (days_back || ' days')::INTERVAL
    AND l.utm_campaign IS NOT NULL
  GROUP BY COALESCE(l.utm_campaign, 'No Campaign'),
           COALESCE(l.utm_source, 'Unknown'),
           COALESCE(l.utm_medium, 'Unknown')
  ORDER BY total_leads DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get device type distribution
CREATE OR REPLACE FUNCTION get_device_distribution(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  device_type TEXT,
  total_count BIGINT,
  completed_count BIGINT,
  avg_repair_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.device_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE l.status = 'won') as completed_count,
    ROUND(AVG(l.quoted_amount) FILTER (WHERE l.status = 'won'), 2) as avg_repair_value
  FROM leads l
  WHERE l.created_at > NOW() - (days_back || ' days')::INTERVAL
  GROUP BY l.device_type
  ORDER BY total_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get issue breakdown
CREATE OR REPLACE FUNCTION get_issue_breakdown(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  issue TEXT,
  total_count BIGINT,
  avg_quoted_amount NUMERIC,
  avg_repair_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.issue_reported as issue,
    COUNT(*) as total_count,
    ROUND(AVG(l.quoted_amount), 2) as avg_quoted_amount,
    AVG(l.repair_completed_at - l.repair_started_at) as avg_repair_time
  FROM leads l
  WHERE l.created_at > NOW() - (days_back || ' days')::INTERVAL
  GROUP BY l.issue_reported
  ORDER BY total_count DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN leads.first_contact_at IS 'Timestamp when staff first contacted the customer';
COMMENT ON COLUMN leads.pickup_completed_at IS 'Timestamp when device was picked up from customer';
COMMENT ON COLUMN leads.repair_started_at IS 'Timestamp when repair work began';
COMMENT ON COLUMN leads.repair_completed_at IS 'Timestamp when repair was finished';
COMMENT ON COLUMN leads.delivered_at IS 'Timestamp when device was delivered back to customer';

COMMENT ON COLUMN leads.utm_source IS 'UTM source parameter (e.g., google, facebook, instagram)';
COMMENT ON COLUMN leads.utm_medium IS 'UTM medium parameter (e.g., cpc, social, email)';
COMMENT ON COLUMN leads.utm_campaign IS 'UTM campaign name (e.g., summer_sale_2024)';
COMMENT ON COLUMN leads.utm_term IS 'UTM term parameter (paid search keywords)';
COMMENT ON COLUMN leads.utm_content IS 'UTM content parameter (ad variation)';
COMMENT ON COLUMN leads.landing_page_url IS 'URL of the landing page where lead originated';
COMMENT ON COLUMN leads.referrer_url IS 'Referrer URL (where user came from)';
