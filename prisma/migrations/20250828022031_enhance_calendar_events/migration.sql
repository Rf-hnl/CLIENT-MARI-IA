/*
  Warnings:

  - You are about to drop the column `attendee_emails` on the `lead_calendar_events` table. All the data in the column will be lost.
  - You are about to drop the column `auto_reminder_sent` on the `lead_calendar_events` table. All the data in the column will be lost.
  - You are about to drop the column `automated` on the `lead_calendar_events` table. All the data in the column will be lost.
  - You are about to drop the column `canceled_at` on the `lead_calendar_events` table. All the data in the column will be lost.
  - You are about to drop the column `completed_at` on the `lead_calendar_events` table. All the data in the column will be lost.
  - You are about to drop the column `follow_up_type` on the `lead_calendar_events` table. All the data in the column will be lost.
  - You are about to drop the column `meeting_link` on the `lead_calendar_events` table. All the data in the column will be lost.
  - You are about to drop the column `meeting_platform` on the `lead_calendar_events` table. All the data in the column will be lost.
  - You are about to drop the column `next_action` on the `lead_calendar_events` table. All the data in the column will be lost.
  - You are about to drop the column `outcome_notes` on the `lead_calendar_events` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `lead_calendar_events` table. All the data in the column will be lost.
  - You are about to drop the column `rescheduled_count` on the `lead_calendar_events` table. All the data in the column will be lost.
  - You are about to drop the column `sentiment_trigger` on the `lead_calendar_events` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."idx_calendar_automated";

-- DropIndex
DROP INDEX "public"."idx_calendar_date_range";

-- DropIndex
DROP INDEX "public"."idx_calendar_follow_up_type";

-- DropIndex
DROP INDEX "public"."idx_calendar_meeting_platform";

-- DropIndex
DROP INDEX "public"."idx_calendar_priority";

-- DropIndex
DROP INDEX "public"."idx_calendar_status_priority";

-- AlterTable
ALTER TABLE "public"."lead_calendar_events" DROP COLUMN "attendee_emails",
DROP COLUMN "auto_reminder_sent",
DROP COLUMN "automated",
DROP COLUMN "canceled_at",
DROP COLUMN "completed_at",
DROP COLUMN "follow_up_type",
DROP COLUMN "meeting_link",
DROP COLUMN "meeting_platform",
DROP COLUMN "next_action",
DROP COLUMN "outcome_notes",
DROP COLUMN "priority",
DROP COLUMN "rescheduled_count",
DROP COLUMN "sentiment_trigger";
