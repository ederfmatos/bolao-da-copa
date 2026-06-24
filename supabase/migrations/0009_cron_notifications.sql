-- Migration 0009: Cron jobs for notification scheduling
-- daily-digest: 08:00 BRT (America/Sao_Paulo); deadline-reminder: every 15 min
-- Requires pg_cron >= 1.6 for timezone parameter (production Supabase)

DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('daily-digest-8am');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('deadline-reminders-15min');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'cron' AND p.proname = 'schedule' AND pronargs = 4
  ) THEN
    PERFORM cron.schedule(
  'daily-digest-8am',
  '0 8 * * *',
  $body$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notifications',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
    body := jsonb_build_object('type', 'daily-digest', 'data', '{}'::jsonb)) AS request_id;
  $body$,
  'America/Sao_Paulo'
);
    PERFORM cron.schedule(
  'deadline-reminders-15min',
  '*/15 * * * *',
  $body_dl$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notifications',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
    body := jsonb_build_object('type', 'deadline-reminder', 'data', '{}'::jsonb)) AS request_id;
  $body_dl$,
  'America/Sao_Paulo'
);
  ELSE
    RAISE NOTICE 'pg_cron timezone parameter not supported on this environment; cron jobs skipped';
  END IF;
END $$;
