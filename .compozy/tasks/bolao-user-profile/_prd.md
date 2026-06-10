# PRD: Bolão User Profile — Visualização de Palpites por Usuário

## Overview

Adicionar uma página de perfil dedicada para cada participante do bolão, permitindo que qualquer usuário visualize o histórico completo de palpites de outro participante. A página exibirá informações do perfil (avatar, nome, pontos totais, posição no ranking), estatísticas resumidas (total de palpites, distribuição por pontuação, taxa de placar exato) e uma lista cronológica de todos os palpites com placar previsto, resultado real e pontos ganhos.

**Problema que resolve**: Atualmente, os usuários só podem ver os palpites de outros participantes no contexto de uma partida específica (tela de detalhes da partida) ou o ranking geral (leaderboard). Não há uma forma de ver o histórico completo de palpites de um usuário específico, o que limita a comparação e análise de desempenho.

**Para quem é**: Todos os participantes do bolão que desejam acompanhar o desempenho de outros participantes, comparar estratégias e analisar o histórico de palpites.

**Por que é valioso**: Aumenta o engajamento ao permitir comparação social mais rica, cria oportunidades para análise de desempenho e estratégias, e torna o bolão mais interativo e competitivo.

## Goals

- Permitir que qualquer usuário visualize o perfil e histórico completo de palpites de qualquer outro participante
- Exibir estatísticas resumidas que facilitam a comparação de desempenho
- Fornecer pontos de acesso intuitivos a partir do leaderboard e da lista de palpites da partida
- Manter a experiência mobile-first e consistente com o design atual do app
- Entregar a feature em uma única release

## User Stories

### Persona Primária: Participante Ativo

- Como participante, quero ver todos os palpites de outro usuário em uma única página para que eu possa analisar o desempenho dele ao longo do torneio.
- Como participante, quero ver estatísticas resumidas (total de palpites, distribuição por pontuação, taxa de placar exato) para que eu possa comparar rapidamente o desempenho de diferentes participantes.
- Como participante, quero acessar o perfil de outro usuário clicando no nome dele no leaderboard para que eu possa ver os palpites dele sem precisar navegar por cada partida.
- Como participante, quero acessar o perfil de outro usuário clicando no nome dele na lista de palpites da partida para que eu possa ver o histórico completo dele.
- Como participante, quero ver o resultado real de cada partida ao lado do palpite do usuário para que eu possa ver quantos pontos ele ganhou em cada palpite.

### Persona Secundária: Participante Casual

- Como participante casual, quero ver a posição no ranking e pontos totais de outro usuário no perfil dele para que eu saiba quão bem ele está indo no bolão.

## Core Features

### 1. Página de Perfil do Usuário

Uma nova página acessível via `/user/:userId` que exibe:

**Cabeçalho do perfil:**
- Avatar do usuário (reutiliza componente Avatar existente)
- Nome do usuário
- Pontos totais (obtido da view `leaderboard`)
- Posição no ranking (calculada a partir da view `leaderboard`)

**Seção de estatísticas resumidas:**
- Total de palpites (número de predições feitas pelo usuário)
- Distribuição por pontuação: quantos palpites com 10 pts, 7 pts, 3 pts e 0 pts
- Taxa de placar exato: percentual de palpites que acertaram o placar exato (10 pts)

**Lista cronológica de palpites:**
- Ordenada do mais recente para o mais antigo
- Cada palpite exibe:
  - Informações da partida: times (com flags), grupo/fase, data e hora
  - Placar previsto pelo usuário
  - Resultado real da partida (se finalizada) ou "Aguardando" (se agendada/ao vivo)
  - Pontos ganhos (se finalizada) ou "—" (se agendada/ao vivo)
  - Indicador visual de acerto (verde para 10 pts, azul para 7 pts, laranja para 3 pts, cinza para 0 pts)

### 2. Pontos de Acesso

**A partir do Leaderboard:**
- Cada linha do leaderboard (componente LeaderboardRow) torna o nome e avatar clicáveis
- Clicar navega para `/user/:userId` do usuário selecionado

**A partir da lista de palpites da partida (MatchDetails):**
- Cada linha de palpite (componente PredictionRow) torna o nome e avatar clicáveis
- Clicar navega para `/user/:userId` do usuário selecionado

### 3. Navegação e Contexto

- Botão "Voltar" na página de perfil usa `navigate(-1)` para preservar o contexto de origem (leaderboard ou partida específica)
- Se o usuário acessar diretamente a URL `/user/:userId` (deep link), a página carrega normalmente

## User Experience

### Fluxo Primário: Acessar perfil pelo Leaderboard

1. Usuário está na página de Classificação (leaderboard)
2. Usuário clica no nome ou avatar de outro participante
3. Navega para `/user/:userId`
4. Página de perfil carrega com cabeçalho, estatísticas e lista de palpites
5. Usuário rola a lista para ver o histórico completo
6. Usuário clica em "Voltar" e retorna ao leaderboard

### Fluxo Primário: Acessar perfil pela lista de palpites da partida

1. Usuário está na página de detalhes de uma partida (MatchDetails)
2. Usuário vê a seção "Palpites da galera"
3. Usuário clica no nome ou avatar de outro participante
4. Navega para `/user/:userId`
5. Página de perfil carrega com cabeçalho, estatísticas e lista de palpites
6. Usuário clica em "Voltar" e retorna à partida (preservando filtros se houver)

### Considerações de UI/UX

- Design mobile-first, consistente com o resto do app (Tailwind CSS, dark mode)
- Estatísticas exibidas em cards ou badges visuais
- Lista de palpites usa componente similar ao MatchCard, mas adaptado para mostrar palpite do usuário
- Indicadores visuais claros para pontos ganhos (cores diferentes para 10, 7, 3, 0 pts)
- Empty state: se o usuário não fez nenhum palpite, exibir mensagem "Nenhum palpite registrado ainda"

## High-Level Technical Constraints

- Deve integrar com o backend Supabase existente (PostgreSQL, Auth)
- Deve reutilizar componentes existentes (Avatar, PredictionRow, MatchCard como referência)
- Deve funcionar com as políticas RLS atuais (leitura pública de predictions e profiles já está habilitada)
- Deve suportar dark mode via Tailwind CSS
- Deve ser responsivo e funcionar em telas mobile (320px+)

## Non-Goals (Out of Scope)

- Edição de perfil do usuário (nome, avatar) — isso é gerenciado pelo Google OAuth
- Comparação lado a lado de dois usuários
- Gráficos ou visualizações avançadas de desempenho ao longo do tempo
- Histórico de palpites filtrado por fase/grupo (apenas lista cronológica completa)
- Notificações ou alertas sobre atividades de outros usuários
- Sistema de seguidores ou amigos
- Comentários ou reações em palpites de outros usuários

## Phased Rollout Plan

### MVP (Single Release)

Todas as features entregues em uma única release:
- Página de perfil do usuário com cabeçalho, estatísticas e lista de palpites
- Pontos de acesso a partir do leaderboard e lista de palpites da partida
- Navegação com botão "Voltar" preservando contexto

**Critério de sucesso**: Usuários podem acessar o perfil de outro usuário a partir do leaderboard ou lista de palpites, visualizar estatísticas resumidas e rolar o histórico completo de palpites com informações de pontos ganhos.

## Success Metrics

- 100% dos perfis de usuários carregam corretamente com todas as informações
- Tempo de carregamento da página de perfil < 2 segundos
- Estatísticas calculadas corretamente (total de palpites, distribuição por pontuação, taxa de placar exato)
- Lista de palpites exibe todas as predições do usuário com informações corretas de partida e pontos
- Navegação de ida e volta (leaderboard → perfil → leaderboard) funciona sem perda de contexto
- Zero regressão nas funcionalidades existentes (leaderboard, MatchDetails, etc.)

## Risks and Mitigations

- **Risk**: Performance ao carregar muitos palpites (72+ partidas da fase de grupos + mata-mata)
  - **Mitigation**: Se necessário, implementar paginação ou virtualização da lista
- **Risk**: Confusão de navegação se o usuário não souber como voltar
  - **Mitigation**: Botão "Voltar" claro no topo da página, usar `navigate(-1)` para preservar contexto
- **Risk**: Dados inconsistentes se o usuário for deletado ou mudar de nome
  - **Mitigation**: Exibir "Usuário desconhecido" se o perfil não existir, usar dados do Google OAuth
- **Risk**: Estatísticas incorretas se houver edge cases (usuário sem palpites, partidas canceladas)
  - **Mitigation**: Testar edge cases e exibir "0" ou "—" quando apropriado

## Architecture Decision Records

- [ADR-001: Página de perfil dedicada para visualização de palpites](adrs/adr-001.md) — Decisão de criar página dedicada em vez de modal/drawer ou expansão inline

## Open Questions

- Nenhuma questão em aberto no momento. Todas as decisões de produto foram definidas durante o brainstorming.
