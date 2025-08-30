-- CreateEnum
CREATE TYPE "public"."AgentSource" AS ENUM ('ENV', 'DB_DEPRECATED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT,
    "profile_picture" TEXT,
    "hashed_password" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "reset_password_token" TEXT,
    "reset_password_expiry" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "website" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "plan_limits" JSONB NOT NULL DEFAULT '{}',
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "owner_id" UUID NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tagline" TEXT,
    "industry" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "logo" TEXT,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "company_values" TEXT,
    "sales_pitch" TEXT,
    "target_audience" TEXT,
    "owner_id" UUID NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "province" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "province" TEXT,
    "position" TEXT,
    "budgetRange" TEXT,
    "decisionTimeline" TEXT,
    "bestContactTime" TEXT,
    "preferredContactMethod" TEXT,
    "ai_score" INTEGER,
    "ai_score_breakdown" TEXT,
    "ai_score_factors" JSONB,
    "ai_score_updated_at" TIMESTAMP(3),
    "client_id" UUID,
    "contact_attempts" INTEGER NOT NULL DEFAULT 0,
    "conversion_date" TIMESTAMP(3),
    "conversion_value" DECIMAL(10,2),
    "converted_to_client" BOOLEAN NOT NULL DEFAULT false,
    "interest_level" INTEGER,
    "is_qualified" BOOLEAN NOT NULL DEFAULT false,
    "last_contact_date" TIMESTAMP(3),
    "next_follow_up_date" TIMESTAMP(3),
    "qualification_score" INTEGER NOT NULL DEFAULT 0,
    "qualification_notes" TEXT,
    "response_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "internal_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_call_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "elevenlabs_batch_id" TEXT,
    "elevenlabs_job_id" TEXT,
    "conversation_id" TEXT,
    "agent_id" TEXT NOT NULL,
    "agent_name" TEXT,
    "agent_source" "public"."AgentSource" NOT NULL DEFAULT 'ENV',
    "call_type" TEXT NOT NULL DEFAULT 'prospecting',
    "status" TEXT NOT NULL DEFAULT 'initiating',
    "outcome" TEXT,
    "duration_minutes" DOUBLE PRECISION,
    "cost" DECIMAL(10,4),
    "cost_currency" VARCHAR(3) DEFAULT 'USD',
    "audio_url" TEXT,
    "transcription" TEXT,
    "transcription_confidence" DOUBLE PRECISION,
    "transcription_status" TEXT DEFAULT 'pending',
    "notes" TEXT,
    "next_action" TEXT,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_calendar_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "event_type" TEXT NOT NULL DEFAULT 'meeting',
    "reminder_minutes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversation_analysis" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "call_log_id" UUID NOT NULL,
    "conversation_id" TEXT,
    "analysis_type" TEXT NOT NULL DEFAULT 'comprehensive',
    "sentiment" JSONB,
    "quality_score" INTEGER,
    "engagement_level" TEXT,
    "key_topics" TEXT[],
    "action_items" TEXT[],
    "follow_up_suggestions" TEXT[],
    "interest_indicators" JSONB,
    "objections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "buying_signals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "competitor_mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price_discussion" JSONB,
    "decision_makers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timeframe_indicators" JSONB,
    "speaking_time_distribution" JSONB,
    "conversation_flow" JSONB,
    "interruption_analysis" JSONB,
    "question_count" INTEGER,
    "conversion_probability" DECIMAL(5,4),
    "recommended_next_action" TEXT,
    "best_follow_up_time" TEXT,
    "suggested_approach" TEXT,
    "processing_model" TEXT,
    "confidence" DECIMAL(5,4),
    "processing_time" INTEGER,
    "raw_analysis" JSONB,
    "analyzed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "public"."tenants"("slug");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "public"."clients"("email");

-- CreateIndex
CREATE INDEX "clients_phone_idx" ON "public"."clients"("phone");

-- CreateIndex
CREATE INDEX "clients_company_idx" ON "public"."clients"("company");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "public"."clients"("status");

-- CreateIndex
CREATE INDEX "leads_tenant_id_idx" ON "public"."leads"("tenant_id");

-- CreateIndex
CREATE INDEX "leads_organization_id_idx" ON "public"."leads"("organization_id");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "public"."leads"("email");

-- CreateIndex
CREATE INDEX "leads_phone_idx" ON "public"."leads"("phone");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "public"."leads"("status");

-- CreateIndex
CREATE INDEX "leads_source_idx" ON "public"."leads"("source");

-- CreateIndex
CREATE INDEX "leads_priority_idx" ON "public"."leads"("priority");

-- CreateIndex
CREATE INDEX "leads_qualification_score_idx" ON "public"."leads"("qualification_score");

-- CreateIndex
CREATE INDEX "leads_is_qualified_idx" ON "public"."leads"("is_qualified");

-- CreateIndex
CREATE INDEX "leads_converted_to_client_idx" ON "public"."leads"("converted_to_client");

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "public"."leads"("created_at");

-- CreateIndex
CREATE INDEX "lead_call_logs_lead_id_idx" ON "public"."lead_call_logs"("lead_id");

-- CreateIndex
CREATE INDEX "lead_call_logs_tenant_id_idx" ON "public"."lead_call_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "lead_call_logs_organization_id_idx" ON "public"."lead_call_logs"("organization_id");

-- CreateIndex
CREATE INDEX "lead_call_logs_elevenlabs_batch_id_idx" ON "public"."lead_call_logs"("elevenlabs_batch_id");

-- CreateIndex
CREATE INDEX "lead_call_logs_conversation_id_idx" ON "public"."lead_call_logs"("conversation_id");

-- CreateIndex
CREATE INDEX "lead_call_logs_agent_id_idx" ON "public"."lead_call_logs"("agent_id");

-- CreateIndex
CREATE INDEX "lead_call_logs_agent_source_idx" ON "public"."lead_call_logs"("agent_source");

-- CreateIndex
CREATE INDEX "lead_call_logs_status_idx" ON "public"."lead_call_logs"("status");

-- CreateIndex
CREATE INDEX "lead_call_logs_call_type_idx" ON "public"."lead_call_logs"("call_type");

-- CreateIndex
CREATE INDEX "lead_call_logs_created_at_idx" ON "public"."lead_call_logs"("created_at");

-- CreateIndex
CREATE INDEX "lead_calendar_events_lead_id_idx" ON "public"."lead_calendar_events"("lead_id");

-- CreateIndex
CREATE INDEX "lead_calendar_events_user_id_idx" ON "public"."lead_calendar_events"("user_id");

-- CreateIndex
CREATE INDEX "lead_calendar_events_start_time_idx" ON "public"."lead_calendar_events"("start_time");

-- CreateIndex
CREATE INDEX "lead_calendar_events_status_idx" ON "public"."lead_calendar_events"("status");

-- CreateIndex
CREATE INDEX "conversation_analysis_lead_id_idx" ON "public"."conversation_analysis"("lead_id");

-- CreateIndex
CREATE INDEX "conversation_analysis_conversation_id_idx" ON "public"."conversation_analysis"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_analysis_analysis_type_idx" ON "public"."conversation_analysis"("analysis_type");

-- CreateIndex
CREATE INDEX "conversation_analysis_quality_score_idx" ON "public"."conversation_analysis"("quality_score");

-- CreateIndex
CREATE INDEX "conversation_analysis_conversion_probability_idx" ON "public"."conversation_analysis"("conversion_probability");

-- CreateIndex
CREATE INDEX "conversation_analysis_analyzed_at_idx" ON "public"."conversation_analysis"("analyzed_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_analysis_call_log_id_analysis_type_key" ON "public"."conversation_analysis"("call_log_id", "analysis_type");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "public"."api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_tenant_id_idx" ON "public"."api_keys"("tenant_id");

-- CreateIndex
CREATE INDEX "api_keys_organization_id_idx" ON "public"."api_keys"("organization_id");

-- CreateIndex
CREATE INDEX "api_keys_key_hash_idx" ON "public"."api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_is_active_idx" ON "public"."api_keys"("is_active");

-- CreateIndex
CREATE INDEX "api_keys_expires_at_idx" ON "public"."api_keys"("expires_at");

-- AddForeignKey
ALTER TABLE "public"."tenants" ADD CONSTRAINT "tenants_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organizations" ADD CONSTRAINT "organizations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_call_logs" ADD CONSTRAINT "lead_call_logs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_call_logs" ADD CONSTRAINT "lead_call_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_call_logs" ADD CONSTRAINT "lead_call_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_calendar_events" ADD CONSTRAINT "lead_calendar_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_calendar_events" ADD CONSTRAINT "lead_calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation_analysis" ADD CONSTRAINT "conversation_analysis_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation_analysis" ADD CONSTRAINT "conversation_analysis_call_log_id_fkey" FOREIGN KEY ("call_log_id") REFERENCES "public"."lead_call_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
