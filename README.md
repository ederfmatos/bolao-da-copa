# Bolão Copa 2026

Aplicação web mobile-first para bolão da Copa do Mundo 2026.

## Stack

- **Frontend**: React + Vite
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **Deploy**: Vercel (frontend) + Supabase (backend)

## Features

- Autenticação via Google OAuth
- Visualização de todas as 64 partidas da Copa
- Palpites de placar com bloqueio 1h antes do kickoff
- Cálculo de pontos com 5 cenários (10, 7, 7, 3, 0)
- Leaderboard em tempo real
- Página de regras

## Setup

```bash
# Clone o repositório
git clone https://github.com/ederfmatos/bolao-da-copa.git
cd bolao-da-copa

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

## Estrutura do Projeto

```
bolao-da-copa/
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizáveis
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Bibliotecas e clientes (Supabase)
│   └── pages/              # Páginas da aplicação
├── supabase/
│   ├── functions/          # Edge Functions (Deno)
│   │   └── sync-matches/   # Sync de dados de futebol
│   └── migrations/         # Migrations do PostgreSQL
└── docs/                   # Documentação
```

## Licença

MIT
