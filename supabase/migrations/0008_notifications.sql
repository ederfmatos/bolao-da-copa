-- Bolão Copa 2026 - Migration 0008
-- Creates push_subscriptions table for Web Push notifications + RLS policies

-- ============================================================================
-- PUSH SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh_key  TEXT NOT NULL,
  auth_key    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions (endpoint);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_read_own" ON push_subscriptions;
CREATE POLICY "push_subscriptions_read_own" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON push_subscriptions;
CREATE POLICY "push_subscriptions_insert_own" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON push_subscriptions;
CREATE POLICY "push_subscriptions_delete_own" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_service_read_all" ON push_subscriptions;
CREATE POLICY "push_subscriptions_service_read_all" ON push_subscriptions
  FOR SELECT USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "push_subscriptions_service_delete_all" ON push_subscriptions;
CREATE POLICY "push_subscriptions_service_delete_all" ON push_subscriptions
  FOR DELETE USING (auth.role() = 'service_role');
