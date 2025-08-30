-- Migration: Add fields for advanced bulk calling functionality
-- Date: 2025-08-28
-- Purpose: Enable advanced filtering and bulk calling features

-- Add call eligibility and tracking fields to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_call_result VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS days_since_last_call INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consecutive_failures INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS blacklisted_for_calls BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS blacklist_reason VARCHAR(255);

-- Add AI analysis fields for advanced filtering
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_sentiment_score DECIMAL(3,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_engagement_score INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_quality_score INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_analysis_updated_at TIMESTAMP;

-- Add calendar integration fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_call_time_window VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Panama';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS best_call_days VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS optimal_call_time_start TIME;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS optimal_call_time_end TIME;

-- Add bulk calling tracking fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_bulk_call_queue_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bulk_call_eligibility_score INTEGER DEFAULT 50;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS auto_progression_enabled BOOLEAN DEFAULT true;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_progression_date TIMESTAMP;

-- Create indexes for performance on filtering
CREATE INDEX IF NOT EXISTS idx_leads_last_call_result ON leads(last_call_result);
CREATE INDEX IF NOT EXISTS idx_leads_days_since_last_call ON leads(days_since_last_call);
CREATE INDEX IF NOT EXISTS idx_leads_consecutive_failures ON leads(consecutive_failures);
CREATE INDEX IF NOT EXISTS idx_leads_blacklisted_for_calls ON leads(blacklisted_for_calls);
CREATE INDEX IF NOT EXISTS idx_leads_last_sentiment_score ON leads(last_sentiment_score);
CREATE INDEX IF NOT EXISTS idx_leads_last_engagement_score ON leads(last_engagement_score);
CREATE INDEX IF NOT EXISTS idx_leads_bulk_call_eligibility_score ON leads(bulk_call_eligibility_score);
CREATE INDEX IF NOT EXISTS idx_leads_auto_progression_enabled ON leads(auto_progression_enabled);

-- Create compound indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_leads_status_priority_eligibility ON leads(status, priority, bulk_call_eligibility_score);
CREATE INDEX IF NOT EXISTS idx_leads_source_last_call_result ON leads(source, last_call_result);
CREATE INDEX IF NOT EXISTS idx_leads_qualification_engagement ON leads(qualification_score, last_engagement_score);

-- Add call result enum values comment for reference
COMMENT ON COLUMN leads.last_call_result IS 'Last call result: CALL_FAILED, NO_ANSWER, EARLY_HANGUP, INTERRUPTED, SHORT_SUCCESS, FULL_SUCCESS';
COMMENT ON COLUMN leads.preferred_call_time_window IS 'Preferred time window: morning, afternoon, evening, flexible';
COMMENT ON COLUMN leads.best_call_days IS 'Comma-separated days: monday,tuesday,wednesday,thursday,friday,saturday,sunday';
COMMENT ON COLUMN leads.bulk_call_eligibility_score IS 'Eligibility score for bulk calls (0-100), higher is more eligible';