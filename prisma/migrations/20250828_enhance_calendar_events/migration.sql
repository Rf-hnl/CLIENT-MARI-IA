-- Migration: Enhance calendar events for intelligent scheduling
-- Date: 2025-08-28
-- Purpose: Add fields for automatic meeting scheduling based on sentiment analysis

-- Add new fields to lead_calendar_events
ALTER TABLE lead_calendar_events ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
ALTER TABLE lead_calendar_events ADD COLUMN IF NOT EXISTS automated BOOLEAN DEFAULT false;
ALTER TABLE lead_calendar_events ADD COLUMN IF NOT EXISTS sentiment_trigger DECIMAL(3,2);
ALTER TABLE lead_calendar_events ADD COLUMN IF NOT EXISTS follow_up_type VARCHAR(30);
ALTER TABLE lead_calendar_events ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE lead_calendar_events ADD COLUMN IF NOT EXISTS meeting_platform VARCHAR(20) DEFAULT 'internal';
ALTER TABLE lead_calendar_events ADD COLUMN IF NOT EXISTS attendee_emails TEXT[];
ALTER TABLE lead_calendar_events ADD COLUMN IF NOT EXISTS auto_reminder_sent BOOLEAN DEFAULT false;
ALTER TABLE lead_calendar_events ADD COLUMN IF NOT EXISTS rescheduled_count INTEGER DEFAULT 0;
ALTER TABLE lead_calendar_events ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP;
ALTER TABLE lead_calendar_events ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE lead_calendar_events ADD COLUMN IF NOT EXISTS outcome_notes TEXT;
ALTER TABLE lead_calendar_events ADD COLUMN IF NOT EXISTS next_action VARCHAR(50);

-- Add new indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_priority ON lead_calendar_events(priority);
CREATE INDEX IF NOT EXISTS idx_calendar_automated ON lead_calendar_events(automated);
CREATE INDEX IF NOT EXISTS idx_calendar_follow_up_type ON lead_calendar_events(follow_up_type);
CREATE INDEX IF NOT EXISTS idx_calendar_meeting_platform ON lead_calendar_events(meeting_platform);
CREATE INDEX IF NOT EXISTS idx_calendar_date_range ON lead_calendar_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_status_priority ON lead_calendar_events(status, priority);

-- Add comments for reference
COMMENT ON COLUMN lead_calendar_events.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN lead_calendar_events.automated IS 'Whether this event was created automatically by sentiment analysis';
COMMENT ON COLUMN lead_calendar_events.sentiment_trigger IS 'Sentiment score that triggered automatic scheduling (-1.0 to 1.0)';
COMMENT ON COLUMN lead_calendar_events.follow_up_type IS 'Type: demo, proposal, closing, follow_up, nurturing, technical_call';
COMMENT ON COLUMN lead_calendar_events.meeting_platform IS 'Platform: internal, zoom, teams, meet, phone';
COMMENT ON COLUMN lead_calendar_events.outcome_notes IS 'Notes about the meeting outcome and results';
COMMENT ON COLUMN lead_calendar_events.next_action IS 'Recommended next action after the meeting';