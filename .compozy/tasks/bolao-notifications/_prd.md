# PRD: Bolão Notifications

## Overview

Sistema de notificações push para o Bolão Copa 2026 que mantém os usuários engajados durante todo o torneio. Resolve o problema de usuários esquecerem de fazer palpites ou perderem a emoção de ver seus resultados.

**Para quem:** Todos os participantes do bolão que instalaram o PWA.

**Por que vale a pena:** Aumenta retenção, reduz palpites perdidos por esquecimento, e amplifica a emoção do bolão ao notificar resultados em tempo real.

## Goals

- **Engajamento:** 60% dos usuários ativos optarem por receber notificações
- **Retenção:** Reduzir em 30% os usuários que esquecem de palpitar
- **Entrega:** 95% de taxa de entrega das notificações
- **Latência:** Notificações pós-jogo entregues em até 2 minutos após o fim da partida

## User Stories

### Como participante do bolão:

- Quero receber um resumo dos jogos do dia às 8h, para planejar meus palpites
- Quero saber quantos pontos ganhei após cada jogo, para acompanhar minha posição
- Quero ser avisado quando falta pouco tempo para fechar um palpite, para não perder a oportunidade
- Quero poder ativar/desativar todas as notificações facilmente, para controlar minha experiência

### Como usuário ocasional:

- Quero entender o valor das notificações antes de aceitá-las, para decidir com confiança

## Core Features

### 1. Daily Digest (Resumo Diário)

**O que faz:** Envia uma notificação às 08:00 listando todos os jogos do dia com horários e times.

**Quando:** Todos os dias com jogos da Copa. Dias sem jogos não enviam notificação.

**Conteúdo:**
- Título: "Jogos de hoje"
- Corpo: Lista de jogos (ex: "Brasil × Alemanha - 11:00")
- Ação: Abre a lista de partidas do dia

### 2. Post-Match (Resultado)

**O que faz:** Notifica o usuário com os pontos ganhos após cada jogo finalizado.

**Quando:** Imediatamente após o jogo terminar e os pontos serem calculados.

**Para quem:** Apenas usuários que fizeram palpite naquele jogo.

**Conteúdo:**
- Título: "Resultado: Brasil 2 × 1 Alemanha"
- Corpo: "Você ganhou X pontos! Seu palpite: 2 × 1"
- Ação: Abre os detalhes da partida

### 3. Deadline Reminder (Lembrete de Prazo)

**O que faz:** Avisa o usuário que falta pouco tempo para fazer palpite em um jogo.

**Quando:** 2 horas antes do kickoff, apenas se o usuário ainda não fez palpite.

**Conteúdo:**
- Título: "Falta 1 hora para fechar!"
- Corpo: "Brasil × Alemanha começa às 11:00. Faça seu palpite agora!"
- Ação: Abre o formulário de palpite da partida

### 4. Opt-in e Configuração

**O que faz:** Solicita permissão para notificações e permite gerenciar preferências.

**Fluxo:**
1. **Prompt inicial:** Na primeira visita após login, mostrar banner explicando o valor das notificações e pedindo permissão
2. **Configuração no perfil:** Toggle global para ativar/desativar todas as notificações

**Comportamento:**
- Se o usuário negar a permissão inicial, não mostrar novamente automaticamente
- Se aceitar, salvar subscription no servidor
- Toggle no perfil permite ativar/desativar a qualquer momento

## User Experience

### Jornada do usuário:

1. **Primeiro acesso:** Banner explicativo "Receba notificações de jogos, resultados e lembretes" com botão "Ativar notificações"
2. **Permissão do navegador:** Browser nativo pede permissão
3. **Confirmação:** Toast "Notificações ativadas! Você receberá atualizações sobre seus palpites"
4. **Uso diário:** Recebe daily digest às 08:00, resultados pós-jogo, lembretes de prazo
5. **Gerenciamento:** No perfil, pode desativar todas as notificações com um toggle

### Design das notificações:

- **Visual:** Ícone do bolão, título claro, corpo conciso
- **Ação:** Clique abre a tela relevante (jogos do dia, detalhes da partida, formulário de palpite)
- **Som:** Padrão do sistema (sem customização)

## High-Level Technical Constraints

- **Web Push API:** Requer service worker e VAPID keys
- **PWA:** App deve estar instalado para receber notificações
- **Supabase:** Edge Functions para envio, pg_cron para agendamento
- **Browser support:** Chrome, Firefox, Safari, Edge (todos suportam Web Push)
- **Privacidade:** Subscriptions são dados sensíveis, requerem RLS policies

## Non-Goals (Out of Scope)

- Notificações por email (apenas push)
- Configuração granular por tipo (apenas toggle global)
- Sons ou vibrações customizadas
- Notificações para usuários não autenticados
- Notificações em desktop (apenas mobile/PWA)
- Histórico de notificações recebidas
- Timezones personalizados (usar horário de Brasília)

## Phased Rollout Plan

### MVP (Única fase)

**Features incluídos:**
- Infraestrutura de Web Push (VAPID, service worker, subscriptions)
- Daily digest às 08:00
- Post-match após jogos finalizados
- Deadline reminder 2h antes do kickoff
- Opt-in via prompt inicial
- Toggle global no perfil

**Critérios de sucesso:**
- 60% dos usuários ativos optarem por notificações
- 95% de taxa de entrega
- Notificações pós-jogo entregues em até 2 minutos
- Zero crashes relacionados ao sistema de notificações

## Success Metrics

- **Taxa de opt-in:** % de usuários que ativam notificações (target: 60%)
- **Taxa de entrega:** % de notificações entregues com sucesso (target: 95%)
- **Latência:** Tempo entre evento e entrega (target: < 2min para post-match)
- **CTR:** % de notificações clicadas (target: 20%)
- **Retenção:** Redução de usuários que esquecem de palpitar (target: -30%)

## Risks and Mitigations

### Risco: Usuários negam permissão

**Mitigação:** 
- Explicar valor antes de pedir permissão
- Permitir reativar no perfil
- Não mostrar prompt novamente se negado

### Risco: Service worker encerrado pelo SO

**Mitigação:** 
- Web Push funciona mesmo com app fechado
- Fallback para email em fases futuras

### Risco: Entrega inconsistente

**Mitigação:** 
- Retry logic no envio
- Limpeza de subscriptions inválidas
- Monitoramento de taxa de entrega

### Risco: Complexidade de debugging

**Mitigação:** 
- Logging centralizado de envios
- Dashboard de métricas
- Ferramenta de teste manual

## Architecture Decision Records

- [ADR-001: Implementação Completa de Notificações Push](adrs/adr-001.md) — Decisão de implementar todos os tipos de notificação em um único MVP

## Open Questions

- **Timezone:** Confirmar se todos os usuários estão no fuso de Brasília (ou usar timezone do dispositivo?)
- **Idioma:** Notificações apenas em português ou suportar outros idiomas?
- **Limite de notificações:** Existe um limite máximo de notificações por dia para não incomodar?
- **Fallback:** Se o usuário desativar notificações, oferecer alternativa (ex: email)?
