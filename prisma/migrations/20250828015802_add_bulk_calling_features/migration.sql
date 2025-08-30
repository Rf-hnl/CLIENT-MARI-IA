/*
  Warnings:

  - Made the column `consecutive_failures` on table `leads` required. This step will fail if there are existing NULL values in that column.
  - Made the column `blacklisted_for_calls` on table `leads` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bulk_call_eligibility_score` on table `leads` required. This step will fail if there are existing NULL values in that column.
  - Made the column `auto_progression_enabled` on table `leads` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."BulkCallQueueStatus" AS ENUM ('PENDING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."BulkCallItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "public"."leads" ALTER COLUMN "last_call_result" SET DATA TYPE TEXT,
ALTER COLUMN "consecutive_failures" SET NOT NULL,
ALTER COLUMN "blacklisted_for_calls" SET NOT NULL,
ALTER COLUMN "blacklist_reason" SET DATA TYPE TEXT,
ALTER COLUMN "ai_analysis_updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "preferred_call_time_window" SET DATA TYPE TEXT,
ALTER COLUMN "timezone" SET DATA TYPE TEXT,
ALTER COLUMN "best_call_days" SET DATA TYPE TEXT,
ALTER COLUMN "optimal_call_time_start" SET DATA TYPE TEXT,
ALTER COLUMN "optimal_call_time_end" SET DATA TYPE TEXT,
ALTER COLUMN "bulk_call_eligibility_score" SET NOT NULL,
ALTER COLUMN "auto_progression_enabled" SET NOT NULL,
ALTER COLUMN "last_progression_date" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."bulk_call_queues" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "total_leads_selected" INTEGER NOT NULL DEFAULT 0,
    "concurrency" INTEGER NOT NULL DEFAULT 1,
    "delay_between_calls" INTEGER NOT NULL DEFAULT 30,
    "max_daily_volume" INTEGER,
    "time_window_start" TEXT,
    "time_window_end" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Panama',
    "allowed_days" TEXT,
    "status" "public"."BulkCallQueueStatus" NOT NULL DEFAULT 'PENDING',
    "progress" JSONB NOT NULL DEFAULT '{}',
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "applied_filters" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "paused_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_call_queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bulk_call_queue_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "queue_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "status" "public"."BulkCallItemStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 50,
    "personalized_script" TEXT,
    "personalization_data" JSONB,
    "call_log_id" UUID,
    "call_result" TEXT,
    "call_duration" INTEGER,
    "sentiment_score" DECIMAL(3,2),
    "engagement_score" INTEGER,
    "quality_score" INTEGER,
    "lead_state_changed" BOOLEAN NOT NULL DEFAULT false,
    "previous_state" TEXT,
    "new_state" TEXT,
    "progression_reason" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_call_queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bulk_call_queues_tenant_id_idx" ON "public"."bulk_call_queues"("tenant_id");

-- CreateIndex
CREATE INDEX "bulk_call_queues_organization_id_idx" ON "public"."bulk_call_queues"("organization_id");

-- CreateIndex
CREATE INDEX "bulk_call_queues_created_by_user_id_idx" ON "public"."bulk_call_queues"("created_by_user_id");

-- CreateIndex
CREATE INDEX "bulk_call_queues_status_idx" ON "public"."bulk_call_queues"("status");

-- CreateIndex
CREATE INDEX "bulk_call_queues_created_at_idx" ON "public"."bulk_call_queues"("created_at");

-- CreateIndex
CREATE INDEX "bulk_call_queue_items_queue_id_idx" ON "public"."bulk_call_queue_items"("queue_id");

-- CreateIndex
CREATE INDEX "bulk_call_queue_items_lead_id_idx" ON "public"."bulk_call_queue_items"("lead_id");

-- CreateIndex
CREATE INDEX "bulk_call_queue_items_status_idx" ON "public"."bulk_call_queue_items"("status");

-- CreateIndex
CREATE INDEX "bulk_call_queue_items_priority_idx" ON "public"."bulk_call_queue_items"("priority");

-- CreateIndex
CREATE INDEX "bulk_call_queue_items_scheduled_at_idx" ON "public"."bulk_call_queue_items"("scheduled_at");

-- CreateIndex
CREATE INDEX "bulk_call_queue_items_processed_at_idx" ON "public"."bulk_call_queue_items"("processed_at");

-- CreateIndex
CREATE UNIQUE INDEX "bulk_call_queue_items_queue_id_lead_id_key" ON "public"."bulk_call_queue_items"("queue_id", "lead_id");

-- AddForeignKey
ALTER TABLE "public"."bulk_call_queues" ADD CONSTRAINT "bulk_call_queues_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bulk_call_queues" ADD CONSTRAINT "bulk_call_queues_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bulk_call_queues" ADD CONSTRAINT "bulk_call_queues_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bulk_call_queue_items" ADD CONSTRAINT "bulk_call_queue_items_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "public"."bulk_call_queues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bulk_call_queue_items" ADD CONSTRAINT "bulk_call_queue_items_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bulk_call_queue_items" ADD CONSTRAINT "bulk_call_queue_items_call_log_id_fkey" FOREIGN KEY ("call_log_id") REFERENCES "public"."lead_call_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."idx_leads_auto_progression_enabled" RENAME TO "leads_auto_progression_enabled_idx";

-- RenameIndex
ALTER INDEX "public"."idx_leads_blacklisted_for_calls" RENAME TO "leads_blacklisted_for_calls_idx";

-- RenameIndex
ALTER INDEX "public"."idx_leads_bulk_call_eligibility_score" RENAME TO "leads_bulk_call_eligibility_score_idx";

-- RenameIndex
ALTER INDEX "public"."idx_leads_consecutive_failures" RENAME TO "leads_consecutive_failures_idx";

-- RenameIndex
ALTER INDEX "public"."idx_leads_days_since_last_call" RENAME TO "leads_days_since_last_call_idx";

-- RenameIndex
ALTER INDEX "public"."idx_leads_last_call_result" RENAME TO "leads_last_call_result_idx";

-- RenameIndex
ALTER INDEX "public"."idx_leads_last_engagement_score" RENAME TO "leads_last_engagement_score_idx";

-- RenameIndex
ALTER INDEX "public"."idx_leads_last_sentiment_score" RENAME TO "leads_last_sentiment_score_idx";

-- RenameIndex
ALTER INDEX "public"."idx_leads_qualification_engagement" RENAME TO "leads_qualification_score_last_engagement_score_idx";

-- RenameIndex
ALTER INDEX "public"."idx_leads_source_last_call_result" RENAME TO "leads_source_last_call_result_idx";

-- RenameIndex
ALTER INDEX "public"."idx_leads_status_priority_eligibility" RENAME TO "leads_status_priority_bulk_call_eligibility_score_idx";
