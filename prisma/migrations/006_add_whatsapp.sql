-- Migration 006: WhatsApp Integration
-- Creates whatsapp_configs, whatsapp_conversations, whatsapp_messages tables
-- with RLS policies and proper indexes

-- ============================================================
-- Tables (created by Prisma db push, this is for RLS + extras)
-- ============================================================

-- RLS on whatsapp_configs (workspace-scoped)
ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY whatsapp_configs_tenant_isolation ON whatsapp_configs
  USING (workspace_id = current_setting('app.current_workspace_id', true));

-- RLS on whatsapp_conversations (workspace-scoped)
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY whatsapp_conversations_tenant_isolation ON whatsapp_conversations
  USING (workspace_id = current_setting('app.current_workspace_id', true));

-- whatsapp_messages: DISABLED (accessed through conversation FK, same pattern as widget_messages)
ALTER TABLE whatsapp_messages DISABLE ROW LEVEL SECURITY;

-- Grant permissions to mimotes_app
GRANT ALL ON whatsapp_configs TO mimotes_app;
GRANT ALL ON whatsapp_conversations TO mimotes_app;
GRANT ALL ON whatsapp_messages TO mimotes_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO mimotes_app;
