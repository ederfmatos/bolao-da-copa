-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule sync-matches to run every 5 minutes
SELECT cron.schedule(
  'sync-matches-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-matches',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Note: You need to set the following in your Supabase dashboard:
-- 1. Go to Database > Extensions and enable pg_cron
-- 2. Go to Database > Schedules and verify the job is running
-- 3. Alternatively, use pg_net to call the Edge Function
