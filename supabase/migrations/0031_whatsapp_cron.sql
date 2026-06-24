-- Enable required extensions (run once per project)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule WhatsApp 30-min match reminder — runs every minute
-- Requires app.service_role_key to be set via Supabase Dashboard SQL editor:
--   ALTER DATABASE postgres SET app.service_role_key = '<your_service_role_key>';
SELECT cron.schedule(
  'whatsapp-match-reminder',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://aaexhunmxtumkpjtdejm.supabase.co/functions/v1/whatsapp-match-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
