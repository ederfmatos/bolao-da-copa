# Deploy Guide

Este guia descreve como fazer o deploy do Bolão Copa 2026.

## Pré-requisitos

- Conta no [Vercel](https://vercel.com/)
- Conta no [Supabase](https://supabase.com/)
- Conta no [Google Cloud Console](https://console.cloud.google.com/)
- Chaves de API dos providers de futebol:
  - [football-data.org](https://www.football-data.org/)
  - [API-Football](https://www.api-football.com/) (RapidAPI)

## 1. Configurar Supabase

1. Crie um projeto no Supabase
2. Execute as migrations em `supabase/migrations/`:
   - `0001_initial_schema.sql` - Cria tabelas, RLS, trigger
   - `0002_cron_schedule.sql` - Configura pg_cron
3. Anote as credenciais:
   - Project URL
   - Anon Key
   - Service Role Key
4. Configure os secrets das Edge Functions:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   supabase secrets set FOOTBALL_DATA_API_KEY=your-football-data-key
   supabase secrets set API_FOOTBALL_KEY=your-api-football-key
   ```
5. Habilite Realtime para a tabela `predictions`:
   - Vá em Database > Replication
   - Habilite a tabela `predictions`

## 2. Configurar Google OAuth

1. Siga o guia em `docs/auth-setup.md`
2. Adicione o domínio do Vercel aos URIs autorizados no Google Cloud Console
3. Adicione o domínio do Vercel ao Supabase em Authentication > URL Configuration

## 3. Deploy no Vercel

### Opção A: Deploy via GitHub (Recomendado)

1. Conecte o repositório ao Vercel:
   ```bash
   vercel link
   ```

2. Configure as variáveis de ambiente no Vercel:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

3. Deploy para produção:
   ```bash
   vercel --prod
   ```

### Opção B: Deploy via Dashboard

1. Importe o repositório GitHub no Vercel
2. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Clique em "Deploy"

## 4. Verificação Pós-Deploy

### Testes Manuais

1. Acesse a URL de produção
2. Faça login com Google
3. Verifique se as partidas estão visíveis
4. Envie um palpite
5. Verifique o leaderboard

### Verificar Edge Function

Execute manualmente a primeira sincronização:
```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/sync-matches \
  -H "Authorization: Bearer your-service-role-key"
```

### Verificar pg_cron

Confirme que o job está agendado:
```sql
SELECT * FROM cron.job;
```

## 5. Variáveis de Ambiente

### Frontend (Vercel)

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anon do Supabase |

### Edge Functions (Supabase Secrets)

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role do Supabase |
| `FOOTBALL_DATA_API_KEY` | API key do football-data.org |
| `API_FOOTBALL_KEY` | API key do API-Football (RapidAPI) |

## 6. Troubleshooting

### Edge Function não executa

Verifique os logs no Supabase Dashboard > Edge Functions > sync-matches > Logs

### Google OAuth falha

- Verifique se o domínio do Vercel está nos URIs autorizados
- Confirme que as credenciais estão corretas no Supabase

### Partidas não aparecem

- Execute a Edge Function manualmente
- Verifique se as chaves de API estão corretas
- Consulte os logs da Edge Function

## 7. Monitoramento

- **Supabase Logs**: Database > Logs
- **Edge Functions Logs**: Edge Functions > sync-matches > Logs
- **Vercel Logs**: Deployments > Select deployment > Function Logs
