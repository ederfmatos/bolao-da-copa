---
status: pending
title: Google OAuth + auto-create profile
type: backend
complexity: medium
dependencies: [task_01]
---

## Overview

Configure Supabase Auth to support Google OAuth sign-in and ensure a participant profile is automatically created in the `profiles` table on first sign-in. This task is the authentication backbone for all user-facing features.

<critical>
- Read PRD and TechSpec before starting.
- Reference TechSpec "Core Interfaces" and ADR-002 for auth design decisions.
- Focus on WHAT: OAuth config, trigger wiring, and profile creation — not UI.
- Minimize custom code — use Supabase Auth built-ins and the trigger created in task_01.
- Tests are required.
</critical>

<requirements>
1. MUST enable Google OAuth provider in Supabase Auth dashboard with correct redirect URLs.
2. MUST configure authorized domains in Google Cloud Console (localhost + production domain).
3. MUST verify the `handle_new_user` trigger from task_01 correctly populates `profiles.name` and `profiles.avatar_url` from Google identity data.
4. MUST confirm RLS allows the newly created profile row to be read by its owner.
5. SHOULD document the required Google Cloud Console steps in a `docs/auth-setup.md` file.
</requirements>

## Subtasks

- [ ] Enable Google provider in Supabase Auth settings; record Client ID and Secret.
- [ ] Add authorized redirect URIs in Google Cloud Console for dev and prod.
- [ ] Verify `handle_new_user` trigger maps `raw_user_meta_data` correctly to `profiles`.
- [ ] Manually test sign-in flow end-to-end in a local/staging environment.
- [ ] Document setup steps in `docs/auth-setup.md`.

## Implementation Details

No new application files beyond documentation. The trigger was created in task_01. Configuration is in Supabase dashboard and Google Cloud Console.

Files to create:
- `docs/auth-setup.md` — step-by-step OAuth configuration guide.

### Relevant Files
- `supabase/migrations/0001_initial_schema.sql` — contains `handle_new_user` trigger (task_01).

### Dependent Files
- `src/hooks/useAuth.js` — will call `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- `src/pages/Login.jsx` — depends on OAuth being correctly configured.

### Related ADRs
- ADR-002: Supabase como plataforma principal (covers auth choice).

## Deliverables

- Google OAuth working in Supabase project (dev environment).
- First sign-in automatically creates a row in `profiles` with correct name and avatar_url.
- `docs/auth-setup.md` written and accurate.
- Test coverage >= 80%.

## Tests

### Unit Tests
- [ ] `handle_new_user` trigger correctly maps `raw_user_meta_data.full_name` → `profiles.name`.
- [ ] `handle_new_user` trigger correctly maps `raw_user_meta_data.avatar_url` → `profiles.avatar_url`.
- [ ] Trigger does not fail if `avatar_url` is missing from Google identity data.

### Integration Tests
- [ ] Signing in with Google for the first time creates exactly one row in `profiles`.
- [ ] Signing in a second time does not create a duplicate profile row.
- [ ] Authenticated user can read their own profile row.
- [ ] Authenticated user cannot read another user's profile row.

## Success Criteria

- End-to-end Google sign-in works in dev environment.
- Profile auto-creation trigger passes all integration tests.
- No duplicate profiles created on repeated sign-ins.
- Test coverage >= 80%.
