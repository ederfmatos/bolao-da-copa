# Google OAuth Setup Guide

This guide walks you through configuring Google OAuth for the Bolão Copa 2026 app.

## Prerequisites

- A Google Cloud Platform account
- A Supabase project set up (see task_01)

## Step 1: Create Google Cloud OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Select **Web application** as the application type
6. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (Vite dev server)
   - `https://your-project-id.supabase.co` (Supabase auth redirect)
   - Your Vercel production domain (e.g., `https://bolao-da-copa.vercel.app`)
7. Under **Authorized redirect URIs**, add:
   - `https://your-project-id.supabase.co/auth/v1/callback`
8. Click **Create**
9. Note your **Client ID** and **Client Secret**

## Step 2: Configure Supabase Auth

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication > Providers**
4. Click **Google** to expand the Google provider settings
5. Toggle **Enable** to ON
6. Paste your **Client ID** from Google Cloud Console
7. Paste your **Client Secret** from Google Cloud Console
8. Click **Save**

## Step 3: Verify Configuration

Test the OAuth flow locally:

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:5173`
3. Click "Continue with Google"
4. Complete the Google sign-in flow
5. Verify you're redirected to `/matches`
6. Check the Supabase Table Editor > `profiles` table to confirm a profile was auto-created

## Troubleshooting

### Error: "Redirect URI mismatch"
- Ensure the redirect URI in Google Cloud Console exactly matches: `https://your-project-id.supabase.co/auth/v1/callback`
- Replace `your-project-id` with your actual Supabase project ID

### Error: "Access blocked: Authorization Error"
- Check that your Google Cloud project has the OAuth consent screen configured
- Ensure the app is in "Testing" or "Production" mode (not "Unverified")
- Add your Google account as a test user if in "Testing" mode

### Profile not created after sign-in
- Verify the `handle_new_user` trigger exists in Supabase (check `supabase/migrations/0001_initial_schema.sql`)
- Check Supabase Logs > Database for trigger errors
- Ensure `raw_user_meta_data` contains `full_name` or `email` from Google

## Production Deployment

When deploying to Vercel:

1. Add your Vercel production domain to Google Cloud Console:
   - **Authorized JavaScript origins**: `https://bolao-da-copa.vercel.app`
   - **Authorized redirect URIs**: `https://your-project-id.supabase.co/auth/v1/callback`

2. Add your Vercel production domain to Supabase:
   - Go to **Authentication > URL Configuration**
   - Add the domain to **Site URL** and **Redirect URLs**

3. Test the OAuth flow on the production URL after deployment

## Security Notes

- Never commit your Google Client Secret to the repository
- Store secrets in Supabase dashboard or environment variables
- Rotate credentials periodically
- Restrict OAuth consent screen to your organization if applicable
