-- Migration 0009: Cron jobs for notification scheduling
-- Creates daily-digest (08:00 Brasília) and deadline-reminder (every 15 min) cron jobs

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
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('type', 'daily-digest', 'data', '{}'::jsonb)
  ) AS request_id;
  $$,
  'America/Sao_Paulo'
);

SELECT cron.schedule(
  'deadline-reminders-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('type', 'deadline-reminder', 'data', '{}'::jsonb)
  ) AS request_id;
  $$,
  'America/Sao_Paulo'
);
