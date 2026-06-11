-- Migration 0009: Cron jobs for notification scheduling
-- Creates daily-digest (08:00 Brasília = 11:00 UTC) and deadline-reminder (every 15 min) cron jobs
-- Requires: supabase_vault extension with 'service_role_key' secret

DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('daily-digest-8am');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('deadline-reminders-15min');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

SELECT cron.schedule(
  'daily-digest-8am',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://aaexhunmxtumkpjtdejm.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || vault.decrypted_secret('service_role_key')
    ),
    body := jsonb_build_object('type', 'daily-digest', 'data', '{}'::jsonb)
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'deadline-reminders-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://aaexhunmxtumkpjtdejm.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || vault.decrypted_secret('service_role_key')
    ),
    body := jsonb_build_object('type', 'deadline-reminder', 'data', '{}'::jsonb)
  ) AS request_id;
  $$
);
