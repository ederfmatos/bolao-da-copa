# Bolão Copa 2026

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![React](https://img.shields.io/badge/React-19.2.7-61dafb?logo=react)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e?logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel)](https://vercel.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)

Aplicação web mobile-first para bolão da Copa do Mundo 2026. Faça seus palpites, acompanhe o leaderboard em tempo real e receba notificações push sobre os jogos.

**🔗 Demo:** [https://bolao-da-copa-eight.vercel.app](https://bolao-da-copa-eight.vercel.app)

---

## 📋 Índice

- [Features](#-features)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Banco de Dados](#-banco-de-dados)
- [Edge Functions](#-edge-functions)
- [Cron Jobs](#-cron-jobs)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Setup Local](#-setup-local)
- [Comandos](#-comandos)
- [Deploy](#-deploy)
- [APIs Externas](#-apis-externas)
- [Sistema de Notificações](#-sistema-de-notificações)
- [Testes](#-testes)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## ✨ Features

### Autenticação e Perfil
- ✅ Login com Google OAuth
- ✅ Perfil de usuário com avatar e nome
- ✅ Histórico de palpites por usuário

### Partidas e Palpites
- ✅ Visualização de todas as 104 partidas da Copa do Mundo 2026
- ✅ Palpites de placar exato (home/away)
- ✅ Bloqueio automático de palpites 1 hora antes do kickoff
- ✅ Filtros por grupo, data e seleção

### Pontuação
- ✅ Sistema de pontuação com 5 cenários:
  - **10 pontos**: Palpite exato (placar correto)
  - **7 pontos**: Vencedor correto + diferença de gols correta
  - **7 pontos**: Empate correto
  - **3 pontos**: Vencedor correto
  - **0 pontos**: Errou o resultado
- ✅ Cálculo automático ao finalizar partidas

### Leaderboard
- ✅ Classificação em tempo real (Realtime)
- ✅ Sistema de desempate:
  1. Maior número de pontos
  2. Maior número de palpites exatos (10 pts)
  3. Maior número de vencedor + diferença correta (7 pts)
  4. Maior número de vencedor correto (3 pts)
  5. Ordem alfabética por nome

### Notificações Push
- ✅ Resumo diário dos jogos do dia (8h - horário de Brasília)
- ✅ Lembrete de prazo para palpitar (2h antes do kickoff)
- ✅ Notificação de resultado pós-jogo com pontos ganhos
- ✅ Histórico de notificações local (IndexedDB)
- ✅ Badge de notificações não lidas

### Progressive Web App (PWA)
- ✅ Instalável no celular
- ✅ Funciona offline
- ✅ Service Worker com cache inteligente
- ✅ Ícones e splash screen

### Interface
- ✅ Design mobile-first
- ✅ Modo escuro/claro
- ✅ Navegação bottom tab
- ✅ Interface responsiva

---

## 🛠️ Stack Tecnológica

### Frontend
- **React 19.2.7** - Biblioteca UI
- **Vite 8.0.16** - Build tool e dev server
- **React Router 7.17.0** - Roteamento SPA
- **Tailwind CSS 3.4.19** - Utility-first CSS
- **vite-plugin-pwa 1.3.0** - Progressive Web App

### Backend
- **Supabase** - Backend as a Service
  - **PostgreSQL** - Banco de dados relacional
  - **Authentication** - Google OAuth
  - **Edge Functions** - Serverless (Deno)
  - **Realtime** - WebSocket para leaderboard
  - **pg_cron** - Agendamento de jobs

### Deploy
- **Vercel** - Frontend hosting (deploy automático via GitHub)
- **Supabase Cloud** - Backend hosting

### APIs Externas
- **football-data.org** - Dados das partidas (principal)
- **API-Football** - Dados das partidas (fallback)

### Notificações
- **Web Push API** - Notificações push
- **VAPID** - Autenticação para push notifications

### Testes
- **Vitest 4.1.8** - Test runner
- **React Testing Library 16.3.2** - Testes de componentes
- **jsdom 29.1.1** - Ambiente de teste

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         USUÁRIO                              │
│                    (Browser / Mobile)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React SPA + PWA + Service Worker                    │  │
│  │  - Autenticação Google OAuth                         │  │
│  │  - Interface mobile-first                            │  │
│  │  - Histórico de notificações (IndexedDB)             │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTPS (Supabase JS Client)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE (Backend)                         │
│                                                              │
│  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │   PostgreSQL     │  │      Edge Functions (Deno)      │ │
│  │                  │  │                                 │ │
│  │ - profiles       │  │ - sync-matches (5 min)          │ │
│  │ - matches        │  │ - send-notifications            │ │
│  │ - predictions    │  │ - register-subscription         │ │
│  │ - push_subs      │  │ - check-finished-matches (10m)  │ │
│  │                  │  │                                 │ │
│  │ Views:           │  └─────────────────────────────────┘ │
│  │ - leaderboard    │                                      │
│  │ - user_preds     │  ┌─────────────────────────────────┐ │
│  │                  │  │      pg_cron Jobs               │ │
│  │ Realtime:        │  │                                 │ │
│  │ - predictions    │  │ - daily-digest (8h)             │ │
│  └──────────────────┘  │ - deadline-reminders (15 min)   │ │
│                        │ - sync-matches (5 min)          │ │
│  ┌──────────────────┐  │ - check-finished (10 min)       │ │
│  │   Auth           │  └─────────────────────────────────┘ │
│  │ - Google OAuth   │                                      │
│  └──────────────────┘  ┌─────────────────────────────────┐ │
│                        │   Supabase Vault                │ │
│                        │ - service_role_key              │ │
│                        └─────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              football-data.org API                           │
│  - Dados das partidas da Copa do Mundo 2026                 │
│  - Resultados em tempo real                                 │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Sincronização de Partidas**
   ```
   pg_cron (5 min) → sync-matches → football-data.org API
                                    ↓
                              Supabase DB (matches)
   ```

2. **Palpites**
   ```
   Usuário → React App → Supabase JS Client → predictions table
                                              ↓
                                         Realtime → leaderboard
   ```

3. **Notificações**
   ```
   pg_cron → check-finished-matches → send-notifications
                                            ↓
                                      Web Push API → Browser
   ```

---

## 📁 Estrutura do Projeto

```
bolao-da-copa/
├── .agents/                    # Configuração de agents (Compozy)
├── .compozy/                   # Tasks e documentação Compozy
├── docs/                       # Documentação adicional
│   ├── auth-setup.md          # Guia de configuração OAuth
│   └── deploy-guide.md        # Guia de deploy
├── public/                     # Assets estáticos
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── favicon.ico
├── src/
│   ├── components/            # Componentes React reutilizáveis
│   │   ├── Avatar.jsx
│   │   ├── BottomNavigation.jsx
│   │   ├── LeaderboardRow.jsx
│   │   ├── MatchCard.jsx
│   │   ├── MatchFilters.jsx
│   │   ├── NotificationBell.jsx
│   │   ├── NotificationPrompt.jsx
│   │   ├── NotificationToggle.jsx
│   │   ├── Podium.jsx
│   │   ├── PredictionRow.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── ScorePicker.jsx
│   │   ├── UserPredictionRow.jsx
│   │   ├── UserProfileHeader.jsx
│   │   └── UserStats.jsx
│   ├── context/               # React Context
│   │   └── ThemeContext.jsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useLeaderboard.js
│   │   ├── useMatches.js
│   │   ├── useMatchFilters.js
│   │   ├── useMatchPredictions.js
│   │   ├── useNotificationHistory.js
│   │   ├── useNotifications.js
│   │   ├── usePredictions.js
│   │   ├── useProfile.js
│   │   └── useUserPredictions.js
│   ├── lib/                   # Bibliotecas e clientes
│   │   └── supabase.js       # Supabase client
│   ├── pages/                 # Páginas da aplicação
│   │   ├── Home.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── Login.jsx
│   │   ├── MatchDetails.jsx
│   │   ├── Matches.jsx
│   │   ├── Predict.jsx
│   │   ├── Rules.jsx
│   │   └── UserProfile.jsx
│   ├── App.jsx               # Componente raiz
│   ├── index.css             # Estilos globais
│   ├── main.jsx              # Entry point
│   └── service-worker.js     # PWA Service Worker
├── supabase/
│   ├── functions/            # Edge Functions (Deno)
│   │   ├── _shared/         # Código compartilhado
│   │   │   ├── calculatePoints.ts
│   │   │   ├── sendPush.ts
│   │   │   └── webPushLib.ts
│   │   ├── check-finished-matches/
│   │   │   └── index.ts
│   │   ├── register-subscription/
│   │   │   ├── index.ts
│   │   │   ├── serve.ts
│   │   │   └── supabaseClient.ts
│   │   ├── send-notifications/
│   │   │   ├── index.ts
│   │   │   ├── serve.ts
│   │   │   └── supabaseClient.ts
│   │   └── sync-matches/
│   │       ├── index.ts
│   │       ├── serve.ts
│   │       ├── supabaseClient.ts
│   │       └── teamMapping.ts
│   ├── migrations/           # Migrations do PostgreSQL
│   │   ├── 0001_initial_schema.sql
│   │   ├── 0002_cron_schedule.sql
│   │   ├── 0003_social_rls.sql
│   │   ├── 0004_remove_profile_trigger.sql
│   │   ├── 0005_public_read_access.sql
│   │   ├── 0006_user_predictions_view.sql
│   │   ├── 0007_leaderboard_tiebreakers.sql
│   │   ├── 0008_notifications.sql
│   │   ├── 0009_cron_notifications.sql
│   │   ├── 0010_add_post_match_notified_at.sql
│   │   └── 0011_cron_check_finished_matches.sql
│   ├── seed-world-cup-2026.sql
│   └── seed.sql
├── .env.example              # Exemplo de variáveis de ambiente
├── .gitignore
├── AGENTS.md                 # Guidelines para agents
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json              # Configuração Vercel
└── vite.config.js           # Configuração Vite
```

---

## 🗄️ Banco de Dados

### Tabelas

#### `profiles`
Dados dos usuários (sincronizado com auth.users)

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  name        TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `matches`
Partidas da Copa do Mundo 2026

```sql
CREATE TABLE matches (
  id           TEXT PRIMARY KEY,
  home_team    TEXT NOT NULL,
  away_team    TEXT NOT NULL,
  home_flag    TEXT,
  away_flag    TEXT,
  group_name   TEXT,
  kickoff_at   TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'scheduled'
                 CHECK (status IN ('scheduled', 'live', 'finished')),
  home_score   SMALLINT CHECK (home_score >= 0),
  away_score   SMALLINT CHECK (away_score >= 0),
  post_match_notified_at TIMESTAMPTZ,
  synced_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `predictions`
Palpites dos usuários

```sql
CREATE TABLE predictions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id),
  match_id    TEXT NOT NULL REFERENCES matches(id),
  home_score  SMALLINT NOT NULL CHECK (home_score >= 0),
  away_score  SMALLINT NOT NULL CHECK (away_score >= 0),
  points      SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, match_id)
);
```

#### `push_subscriptions`
Subscriptions para notificações push

```sql
CREATE TABLE push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id),
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh_key  TEXT NOT NULL,
  auth_key    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Views

#### `leaderboard`
Classificação dos usuários com sistema de desempate

```sql
CREATE VIEW leaderboard AS
SELECT
  p.id AS user_id,
  p.name,
  p.avatar_url,
  COALESCE(SUM(pr.points), 0) AS total_points,
  COUNT(pr.id) AS total_predictions,
  COUNT(CASE WHEN pr.points = 10 THEN 1 END) AS exact_score_count,
  COUNT(CASE WHEN pr.points = 7 THEN 1 END) AS winner_with_diff_count,
  COUNT(CASE WHEN pr.points = 3 THEN 1 END) AS winner_correct_count
FROM profiles p
LEFT JOIN predictions pr ON pr.user_id = p.id
GROUP BY p.id, p.name, p.avatar_url
ORDER BY
  total_points DESC,
  exact_score_count DESC,
  winner_with_diff_count DESC,
  winner_correct_count DESC,
  p.name ASC;
```

### Migrations

| Migration | Descrição |
|-----------|-----------|
| 0001 | Schema inicial (tabelas, RLS, trigger) |
| 0002 | Configuração do pg_cron |
| 0003 | RLS para social features |
| 0004 | Remoção de profile trigger |
| 0005 | Acesso público de leitura |
| 0006 | View user_predictions |
| 0007 | Tiebreakers no leaderboard |
| 0008 | Tabela push_subscriptions |
| 0009 | Cron jobs de notificações |
| 0010 | Coluna post_match_notified_at |
| 0011 | Cron job check-finished-matches |

---

## ⚡ Edge Functions

### `sync-matches`
Sincroniza dados das partidas com a API football-data.org

**Endpoint:** `POST /functions/v1/sync-matches`

**Funcionalidades:**
- Busca partidas na API externa
- Mapeia nomes das seleções (inglês → português)
- Atualiza status e placares no banco
- Detecta partidas finalizadas
- Calcula pontos dos palpites
- Dispara notificações post-match

**Agendamento:** A cada 5 minutos (pg_cron)

**Exemplo de uso:**
```bash
curl -X POST https://aaexhunmxtumkpjtdejm.supabase.co/functions/v1/sync-matches \
  -H "Authorization: Bearer <service_role_key>"
```

---

### `send-notifications`
Envia notificações push para os usuários

**Endpoint:** `POST /functions/v1/send-notifications`

**Tipos de notificação:**

#### `daily-digest`
Resumo dos jogos do dia (8h - horário de Brasília)

```json
{
  "type": "daily-digest",
  "data": {}
}
```

**Exemplo de payload:**
```
Title: "Jogos de hoje!"
Body: "3 jogo(s) hoje:\nMéxico vs África do Sul - 16:00\nCoreia do Sul vs Tchéquia - 23:00\nCanadá vs Bósnia - 16:00"
```

#### `deadline-reminder`
Lembrete para palpitar (2h antes do kickoff)

```json
{
  "type": "deadline-reminder",
  "data": {}
}
```

**Exemplo de payload:**
```
Title: "Não esqueça de palpitar!"
Body: "México vs África do Sul começa às 16:00"
```

#### `post-match`
Resultado do jogo com pontos ganhos

```json
{
  "type": "post-match",
  "data": {
    "matchId": "1",
    "match": {
      "home_team": "México",
      "away_team": "África do Sul",
      "home_score": 2,
      "away_score": 1
    }
  }
}
```

**Exemplo de payload:**
```
Title: "Resultado do jogo!"
Body: "México 2 x 1 África do Sul - Você fez 10 ponto(s)"
```

---

### `register-subscription`
Registra subscriptions para push notifications

**Endpoints:**
- `POST /functions/v1/register-subscription` - Registrar subscription
- `DELETE /functions/v1/register-subscription` - Remover subscription

**Autenticação:** User JWT (anon key)

**Exemplo de registro:**
```bash
curl -X POST https://aaexhunmxtumkpjtdejm.supabase.co/functions/v1/register-subscription \
  -H "Authorization: Bearer <user_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }'
```

---

### `check-finished-matches`
Verifica jogos finalizados e envia notificações

**Endpoint:** `POST /functions/v1/check-finished-matches`

**Funcionalidades:**
- Busca partidas com `status = 'finished'` e `post_match_notified_at IS NULL`
- Envia notificação post-match para cada partida
- Atualiza `post_match_notified_at` para evitar duplicação

**Agendamento:** A cada 10 minutos (pg_cron)

---

## ⏰ Cron Jobs

| Job | Schedule | Descrição |
|-----|----------|-----------|
| `sync-matches-every-5-min` | `*/5 * * * *` | Sincroniza partidas com API externa |
| `daily-digest-8am` | `0 11 * * *` | Envia resumo diário (8h Brasília = 11h UTC) |
| `deadline-reminders-15min` | `*/15 * * * *` | Lembrete de prazo (2h antes do kickoff) |
| `check-finished-matches-10min` | `*/10 * * * *` | Verifica jogos finalizados e notifica |

**Verificar jobs:**
```sql
SELECT jobid, jobname, schedule FROM cron.job;
```

---

## 🔐 Variáveis de Ambiente

### Frontend (Vercel)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | `https://aaexhunmxtumkpjtdejm.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave anon do Supabase | `eyJhbGc...` |
| `VITE_VAPID_PUBLIC_KEY` | Chave pública VAPID | `BH29hPqs...` |

### Edge Functions (Supabase Secrets)

| Variável | Descrição | Como configurar |
|----------|-----------|-----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role | `supabase secrets set` |
| `FOOTBALL_DATA_API_KEY` | API key football-data.org | `supabase secrets set` |
| `VAPID_PUBLIC_KEY` | Chave pública VAPID | `supabase secrets set` |
| `VAPID_PRIVATE_KEY` | Chave privada VAPID | `supabase secrets set` |
| `VAPID_SUBJECT` | Subject VAPID (mailto) | `supabase secrets set` |

### Supabase Vault

| Secret | Descrição |
|--------|-----------|
| `service_role_key` | Chave service role (usada pelos cron jobs) |

**Configurar secrets:**
```bash
# Edge Functions
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJ..."
npx supabase secrets set FOOTBALL_DATA_API_KEY="your-api-key"
npx supabase secrets set VAPID_PUBLIC_KEY="BH29hPqs..."
npx supabase secrets set VAPID_PRIVATE_KEY="7eF1hrX..."
npx supabase secrets set VAPID_SUBJECT="mailto:your@email.com"

# Supabase Vault (para cron jobs)
echo "SELECT vault.create_secret('service_role_key', 'eyJ...', 'Service role key for cron jobs');" | npx supabase db query --linked
```

---

## 🚀 Setup Local

### Pré-requisitos

- Node.js 18+
- npm 9+
- Conta no [Supabase](https://supabase.com/)
- Conta no [Vercel](https://vercel.com/) (opcional para deploy)
- Chave de API do [football-data.org](https://www.football-data.org/)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/ederfmatos/bolao-da-copa.git
cd bolao-da-copa

# Instale as dependências
npm install

# Copie o arquivo de exemplo de variáveis de ambiente
cp .env.example .env.local

# Edite .env.local com suas credenciais do Supabase
# VITE_SUPABASE_URL=https://your-project-id.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
# VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

### Configuração do Supabase

1. **Crie um projeto no Supabase**
   - Acesse [supabase.com](https://supabase.com/)
   - Crie um novo projeto

2. **Execute as migrations**
   ```bash
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```

3. **Configure os secrets das Edge Functions**
   ```bash
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   npx supabase secrets set FOOTBALL_DATA_API_KEY="your-football-data-key"
   npx supabase secrets set VAPID_PUBLIC_KEY="your-vapid-public-key"
   npx supabase secrets set VAPID_PRIVATE_KEY="your-vapid-private-key"
   npx supabase secrets set VAPID_SUBJECT="mailto:your@email.com"
   ```

4. **Habilite Realtime**
   - Vá em Database > Replication
   - Habilite a tabela `predictions`

5. **Configure o Google OAuth**
   - Siga o guia em [docs/auth-setup.md](docs/auth-setup.md)

### Gerar Chaves VAPID

```bash
npx web-push generate-vapid-keys
```

Copie as chaves geradas para:
- `.env.local` (VITE_VAPID_PUBLIC_KEY)
- Supabase Secrets (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

### Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

---

## 📜 Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento (Vite) |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build de produção |
| `npm run test` | Roda testes unitários (Vitest) |
| `npm run test:watch` | Roda testes em watch mode |
| `npm run lint` | Lint do código (ESLint) |
| `npm run format` | Formata código (Prettier) |

### Supabase CLI

| Comando | Descrição |
|---------|-----------|
| `npx supabase link --project-ref <ref>` | Linka projeto local com Supabase |
| `npx supabase db push` | Aplica migrations no banco |
| `npx supabase db pull` | Pull schema do banco |
| `npx supabase functions deploy <name>` | Deploy de Edge Function |
| `npx supabase functions list` | Lista Edge Functions |
| `npx supabase secrets list` | Lista secrets |
| `npx supabase secrets set <KEY>=<VALUE>` | Configura secret |

---

## 🌐 Deploy

### Deploy Automático (Recomendado)

O deploy é automático via Vercel a cada push na branch `main`:

1. **Conecte o repositório ao Vercel**
   - Acesse [vercel.com](https://vercel.com/)
   - Importe o repositório GitHub
   - Configure as variáveis de ambiente

2. **Configure as variáveis de ambiente no Vercel**
   ```bash
   npx vercel env add VITE_SUPABASE_URL production
   npx vercel env add VITE_SUPABASE_ANON_KEY production
   npx vercel env add VITE_VAPID_PUBLIC_KEY production
   ```

3. **Push para main**
   ```bash
   git push origin main
   ```
   O Vercel fará o deploy automaticamente.

### Deploy Manual

```bash
# Build de produção
npm run build

# Deploy via Vercel CLI
npx vercel --prod
```

### Deploy de Edge Functions

```bash
# Deploy todas as functions
npx supabase functions deploy sync-matches --no-verify-jwt
npx supabase functions deploy send-notifications --no-verify-jwt
npx supabase functions deploy register-subscription
npx supabase functions deploy check-finished-matches --no-verify-jwt
```

### Migrations

```bash
# Aplicar migrations
npx supabase db push

# Verificar status
npx supabase db push --dry-run
```

---

## 🌍 APIs Externas

### football-data.org (Principal)

**Documentação:** [https://www.football-data.org/documentation/api](https://www.football-data.org/documentation/api)

**Endpoint utilizado:**
```
GET /v4/competitions/WC/matches
```

**Headers:**
```
X-Auth-Token: <your-api-key>
```

**Rate Limit:** 10 requests/minute (plano gratuito)

**Dados retornados:**
- Partidas da Copa do Mundo 2026
- Status das partidas (scheduled, live, finished)
- Placares
- Datas e horários

### API-Football (Fallback)

**Documentação:** [https://www.api-football.com/documentation-v3](https://www.api-football.com/documentation-v3)

**Nota:** Atualmente não utilizada, mas implementada como fallback.

---

## 🔔 Sistema de Notificações

### Como Funciona

1. **Registro de Subscription**
   - Usuário ativa notificações no perfil
   - Browser gera subscription (endpoint + keys)
   - Subscription é enviada para `register-subscription`
   - Armazenada em `push_subscriptions`

2. **Envio de Notificações**
   - Cron job detecta evento (jogo do dia, prazo, resultado)
   - Chama `send-notifications` com tipo e dados
   - Function busca subscriptions dos usuários
   - Envia push via Web Push API (VAPID)
   - Browser exibe notificação

3. **Service Worker**
   - Recebe push notification
   - Exibe notificação no browser
   - Salva no IndexedDB (histórico local)
   - Notifica app via postMessage

4. **Histórico de Notificações**
   - Armazenado localmente (IndexedDB)
   - Acessível via botão 🔔 no perfil
   - Badge de não lidas
   - Máximo de 50 notificações

### Tipos de Notificação

| Tipo | Quando | Conteúdo |
|------|--------|----------|
| `daily-digest` | 8h (horário de Brasília) | Lista de jogos do dia |
| `deadline-reminder` | 2h antes do kickoff | Lembrete para palpitar |
| `post-match` | Ao finalizar partida | Resultado + pontos ganhos |

### Configuração VAPID

```bash
# Gerar chaves
npx web-push generate-vapid-keys

# Configurar no frontend (.env.local)
VITE_VAPID_PUBLIC_KEY=your-public-key

# Configurar no backend (Supabase Secrets)
npx supabase secrets set VAPID_PUBLIC_KEY=your-public-key
npx supabase secrets set VAPID_PRIVATE_KEY=your-private-key
npx supabase secrets set VAPID_SUBJECT="mailto:your@email.com"
```

---

## 🧪 Testes

### Rodar Testes

```bash
# Rodar todos os testes
npm run test

# Watch mode
npm run test:watch

# Com coverage
npm run test -- --coverage
```

### Estrutura de Testes

Os testes estão localizados em `__tests__/` dentro de cada diretório:

```
src/
├── components/__tests__/
│   ├── NotificationPrompt.test.jsx
│   └── NotificationToggle.test.jsx
├── hooks/__tests__/
│   ├── useNotifications.test.js
│   └── ...
└── pages/__tests__/
    ├── UserProfile.test.jsx
    └── ...

supabase/
├── functions/
│   ├── send-notifications/__tests__/
│   │   └── index.test.ts
│   └── ...
└── migrations/__tests__/
    ├── 0008_notifications.test.js
    └── 0009_cron_notifications.test.js
```

### Cobertura de Testes

- Componentes React (UI)
- Custom hooks
- Edge Functions
- Migrations

---

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. **Fork o projeto**
   ```bash
   git clone https://github.com/ederfmatos/bolao-da-copa.git
   ```

2. **Crie uma branch para sua feature**
   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Commit suas mudanças**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```

4. **Push para a branch**
   ```bash
   git push origin feature/AmazingFeature
   ```

5. **Abra um Pull Request**

### Guidelines

- Siga o estilo de código existente
- Adicione testes para novas funcionalidades
- Atualize a documentação quando necessário
- Use mensagens de commit claras e descritivas

---

## 📄 Licença

Distribuído sob a licença ISC. Veja `LICENSE` para mais informações.

---

## 📞 Contato

**Autor:** Eder Matos  
**GitHub:** [@ederfmatos](https://github.com/ederfmatos)  
**Projeto:** [https://github.com/ederfmatos/bolao-da-copa](https://github.com/ederfmatos/bolao-da-copa)

---

## 🙏 Agradecimentos

- [Supabase](https://supabase.com/) - Backend as a Service
- [Vercel](https://vercel.com/) - Hosting e deploy
- [football-data.org](https://www.football-data.org/) - Dados das partidas
- [React](https://reactjs.org/) - Biblioteca UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS

---

<div align="center">

**Feito com ❤️ para a Copa do Mundo 2026**

[⭐ Star this repo](https://github.com/ederfmatos/bolao-da-copa) | [🐛 Report bug](https://github.com/ederfmatos/bolao-da-copa/issues) | [💡 Request feature](https://github.com/ederfmatos/bolao-da-copa/issues)

</div>
