-- Add WhatsApp 30-min notification tracking to matches
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS notified_whatsapp_30min BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_matches_whatsapp_notify
  ON matches (status, notified_whatsapp_30min, kickoff_at)
  WHERE status = 'scheduled' AND notified_whatsapp_30min = false;
