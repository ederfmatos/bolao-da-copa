-- Remove cron anterior que depende de current_setting
SELECT cron.unschedule('whatsapp-match-reminder');

-- Recria com a chave embutida diretamente
SELECT cron.schedule(
  'whatsapp-match-reminder',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://aaexhunmxtumkpjtdejm.supabase.co/functions/v1/whatsapp-match-reminder',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZXhodW5teHR1bWtwanRkZWptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTEwMTc1MiwiZXhwIjoyMDk2Njc3NzUyfQ.QEJosXhmKz2204YjAqfWCH0E4c7yBOtcHRAcy6OAVwI"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
