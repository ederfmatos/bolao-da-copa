-- Migration 0015: Fix cron jobs to use correct vault approach
-- Use hardcoded URL and fetch service_role_key from vault.decrypted_secrets

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
    url := 'https://aaexhunmxtumkpjtdejm.supabase.co/functions/v1/sync-matches',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT name FROM vault.decrypted_secrets WHERE decrypted_secret = 'service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

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
      'Authorization', 'Bearer ' || (SELECT name FROM vault.decrypted_secrets WHERE decrypted_secret = 'service_role_key' LIMIT 1)
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
      'Authorization', 'Bearer ' || (SELECT name FROM vault.decrypted_secrets WHERE decrypted_secret = 'service_role_key' LIMIT 1)
    ),
    body := jsonb_build_object('type', 'deadline-reminder', 'data', '{}'::jsonb)
  ) AS request_id;
  $$
);

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
      'Authorization', 'Bearer ' || (SELECT name FROM vault.decrypted_secrets WHERE decrypted_secret = 'service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
