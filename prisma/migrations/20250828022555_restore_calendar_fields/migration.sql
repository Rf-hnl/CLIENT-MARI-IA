-- AlterTable
ALTER TABLE "public"."lead_calendar_events" ADD COLUMN     "attendee_emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "auto_reminder_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "automated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canceled_at" TIMESTAMP(3),
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "follow_up_type" TEXT,
ADD COLUMN     "meeting_link" TEXT,
ADD COLUMN     "meeting_platform" TEXT NOT NULL DEFAULT 'internal',
ADD COLUMN     "next_action" TEXT,
ADD COLUMN     "outcome_notes" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "rescheduled_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sentiment_trigger" DECIMAL(3,2);

-- CreateIndex
CREATE INDEX "lead_calendar_events_priority_idx" ON "public"."lead_calendar_events"("priority");

-- CreateIndex
CREATE INDEX "lead_calendar_events_automated_idx" ON "public"."lead_calendar_events"("automated");

-- CreateIndex
CREATE INDEX "lead_calendar_events_follow_up_type_idx" ON "public"."lead_calendar_events"("follow_up_type");

-- CreateIndex
CREATE INDEX "lead_calendar_events_meeting_platform_idx" ON "public"."lead_calendar_events"("meeting_platform");

-- CreateIndex
CREATE INDEX "lead_calendar_events_start_time_end_time_idx" ON "public"."lead_calendar_events"("start_time", "end_time");

-- CreateIndex
CREATE INDEX "lead_calendar_events_status_priority_idx" ON "public"."lead_calendar_events"("status", "priority");
