-- Migration 0011: Cron job for checking finished matches and sending post-match notifications
-- Runs every 10 minutes

DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('check-finished-matches-10min');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

SELECT cron.schedule(
  'check-finished-matches-10min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://aaexhunmxtumkpjtdejm.supabase.co/functions/v1/check-finished-matches',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || vault.decrypted_secret('service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
