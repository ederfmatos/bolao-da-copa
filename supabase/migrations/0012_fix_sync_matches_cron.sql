-- Migration 0012: Fix sync-matches cron job
-- The job was using vault.decrypted_secret() which doesn't exist
-- Recreate with current_setting() approach

DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('sync-matches-every-5-min');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

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
