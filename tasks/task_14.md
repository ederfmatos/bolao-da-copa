---
status: pending
title: Deploy — Vercel + variáveis de ambiente
type: infra
complexity: low
dependencies: [task_01, task_02, task_03, task_04, task_05, task_06, task_07, task_08, task_09, task_10, task_11, task_12, task_13]
---

## Overview

Connect the GitHub repository to Vercel for automatic deployments, configure all required environment variables in both Vercel and Supabase, and verify the full production stack is working end-to-end.

<critical>
- Read TechSpec "Environment Variables" and "Development Sequencing" step 10 before starting.
- This task is purely configuration and verification — no new code should be written.
- Never commit secrets to the repository; all sensitive values go in Vercel environment variables and Supabase Edge Function secrets.
- Tests are required.
</critical>

<requirements>
1. MUST connect the GitHub repository to Vercel with automatic deploys on push to `main`.
2. MUST configure all frontend environment variables in Vercel (see TechSpec "Environment Variables").
3. MUST configure all Edge Function secrets in Supabase (service role key, football API keys).
4. MUST set the production Supabase project's allowed redirect URLs to include the Vercel production domain.
5. MUST verify Google OAuth authorized redirect URIs include the Vercel production domain.
6. MUST trigger a manual run of `sync-matches` in production and confirm `matches` table is populated.
7. MUST verify the `pg_cron` job is active in the production Supabase project.
8. SHOULD configure a `production` and `preview` environment in Vercel with separate env var sets if needed.
9. SHOULD verify `npm run build` produces no errors or warnings before connecting to Vercel.
</requirements>

## Subtasks

- [ ] Run `npm run build` locally and confirm zero errors.
- [ ] Create Vercel project and connect GitHub repository.
- [ ] Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel environment variables.
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY`, `FOOTBALL_DATA_API_KEY`, `API_FOOTBALL_KEY` in Supabase Edge Function secrets.
- [ ] Add Vercel production domain to Supabase Auth allowed redirect URLs.
- [ ] Add Vercel production domain to Google Cloud Console authorized redirect URIs.
- [ ] Trigger `sync-matches` manually in production; verify `matches` table populated.
- [ ] Verify `pg_cron` job active in production.
- [ ] Run full end-to-end smoke test on production URL.

## Implementation Details

No files to create or modify. All work is in Vercel dashboard, Supabase dashboard, and Google Cloud Console.

Reference TechSpec "Environment Variables" for the complete list of variables and their locations.

### Relevant Files
- `.env.example` — reference for which variables are needed (task_03).
- `supabase/migrations/0002_cron_schedule.sql` — confirms cron setup (task_07).

### Related ADRs
- ADR-004: React SPA com Vite, deploy na Vercel.

## Deliverables

- Production URL live and accessible.
- Google sign-in working on production domain.
- `matches` table populated via production Edge Function.
- Cron job active.
- Full smoke test passing.

## Tests

### Smoke Tests (manual, on production URL)
- [ ] Production URL loads without errors.
- [ ] Google sign-in completes and redirects to `/matches`.
- [ ] `matches` table has all World Cup fixtures visible in the app.
- [ ] Submitting a prediction inserts a row in the production DB.
- [ ] Leaderboard renders current participants and points.
- [ ] Rules page renders correctly.
- [ ] Signing out redirects to login page.

### Verification Checks
- [ ] No `.env.local` or secrets committed to the repository.
- [ ] Vercel build log shows zero errors.
- [ ] `pg_cron` job visible in `cron.job` table on production Supabase project.
- [ ] `sync-matches` Edge Function logs show successful run with match count.

## Success Criteria

- All smoke tests pass on the production URL.
- No secrets in the repository.
- Cron job running and populating match results automatically.
