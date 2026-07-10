-- Migration: Remove workspace model + simplify database
-- Date: 2026-07-10
-- Branch: pkl

-- ============================================================
-- 1. Drop tables that are entirely removed
-- ============================================================

DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "workspace_members" CASCADE;
DROP TABLE IF EXISTS "workspace_invitations" CASCADE;
DROP TABLE IF EXISTS "workspace_settings" CASCADE;
DROP TABLE IF EXISTS "workspace_subscriptions" CASCADE;
DROP TABLE IF EXISTS "workspace_usage" CASCADE;
DROP TABLE IF EXISTS "workspaces" CASCADE;
DROP TABLE IF EXISTS "subscription_plans" CASCADE;
DROP TABLE IF EXISTS "plan_features" CASCADE;
DROP TABLE IF EXISTS "invoices" CASCADE;
DROP TABLE IF EXISTS "invoice_line_items" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "subscription_events" CASCADE;
DROP TABLE IF EXISTS "stripe_webhook_events" CASCADE;
DROP TABLE IF EXISTS "api_keys" CASCADE;
DROP TABLE IF EXISTS "api_usage_logs" CASCADE;
DROP TABLE IF EXISTS "widgets" CASCADE;
DROP TABLE IF EXISTS "widget_conversations" CASCADE;
DROP TABLE IF EXISTS "widget_messages" CASCADE;
DROP TABLE IF EXISTS "mcp_servers" CASCADE;
DROP TABLE IF EXISTS "notification_configs" CASCADE;
DROP TABLE IF EXISTS "notification_logs" CASCADE;
DROP TABLE IF EXISTS "onboarding_progress" CASCADE;

-- ============================================================
-- 2. Drop workspace_id columns from remaining tables
-- ============================================================

-- documents: drop workspace_id, folder unique constraint
ALTER TABLE "documents" DROP COLUMN IF EXISTS "workspace_id";
DROP INDEX IF EXISTS "documents_workspace_id_idx";

-- document_chunks: drop workspace_id, tenant_id
ALTER TABLE "document_chunks" DROP COLUMN IF EXISTS "workspace_id";
ALTER TABLE "document_chunks" DROP COLUMN IF EXISTS "tenant_id";
DROP INDEX IF EXISTS "document_chunks_workspace_id_idx";
DROP INDEX IF EXISTS "document_chunks_tenant_id_idx";

-- folders: drop workspace_id, update unique constraint
ALTER TABLE "folders" DROP COLUMN IF EXISTS "workspace_id";
DROP INDEX IF EXISTS "folders_workspace_id_idx";
-- Recreate unique constraint as (name, user_id) instead of (name, workspace_id)
ALTER TABLE "folders" DROP CONSTRAINT IF EXISTS "folders_name_workspace_id_key";
CREATE UNIQUE INDEX IF NOT EXISTS "folders_name_user_id_key" ON "folders"("name", "user_id");

-- chat_sessions: drop workspace_id
ALTER TABLE "chat_sessions" DROP COLUMN IF EXISTS "workspace_id";
DROP INDEX IF EXISTS "chat_sessions_workspace_id_idx";

-- analytics_events: drop workspace_id
ALTER TABLE "analytics_events" DROP COLUMN IF EXISTS "workspace_id";
DROP INDEX IF EXISTS "analytics_events_workspace_id_idx";

-- prompt_templates: drop workspace_id
ALTER TABLE "prompt_templates" DROP COLUMN IF EXISTS "workspace_id";
DROP INDEX IF EXISTS "prompt_templates_workspace_id_idx";

-- whatsapp_configs: drop workspace_id
ALTER TABLE "whatsapp_configs" DROP COLUMN IF EXISTS "workspace_id";

-- whatsapp_conversations: drop workspace_id, update unique constraint
ALTER TABLE "whatsapp_conversations" DROP COLUMN IF EXISTS "workspace_id";
-- Recreate unique constraint as (wa_id) instead of (workspace_id, wa_id)
ALTER TABLE "whatsapp_conversations" DROP CONSTRAINT IF EXISTS "whatsapp_conversations_workspace_id_wa_id_key";
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_conversations_wa_id_key" ON "whatsapp_conversations"("wa_id");
DROP INDEX IF EXISTS "whatsapp_conversations_workspace_id_last_message_at_idx";

-- whatsapp_messages: drop workspace_id
ALTER TABLE "whatsapp_messages" DROP COLUMN IF EXISTS "workspace_id";
