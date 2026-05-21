# Auth Setup Guide
## The Circle — Supabase + Google OAuth

---

## Step 1: Create a Supabase project

1. Go to https://supabase.com and sign in (free account is fine for MVP)
2. Click **New project**
3. Name it `the-circle`, pick the closest region (choose **EU West** or **US East** — no East Africa region yet)
4. Set a strong database password and save it somewhere safe
5. Wait ~2 minutes for the project to spin up

---

## Step 2: Get your API keys

1. In your Supabase project, go to **Settings → API**
2. Copy these values:

| Value | Where to find it |
|---|---|
| Project URL | "Project URL" at the top |
| Anon key | Under "Project API keys" → `anon public` |
| Service role key | Under "Project API keys" → `service_role` (keep this secret) |

---

## Step 3: Set up environment variables

```bash
# In apps/web/
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Step 4: Run the database schema

1. In Supabase dashboard, go to **SQL Editor → New query**
2. Open `apps/api/schema.sql` from this repo
3. Paste the entire contents into the editor
4. Click **Run**

This creates:
- `profiles` table (one row per user, with `role` and `onboarding_complete`)
- A trigger that auto-creates a profile row on every new signup
- `artists` table (extended artist info)
- `packages` table
- Row-level security policies on all tables

---

## Step 5: Enable Google OAuth in Supabase

1. In Supabase, go to **Authentication → Providers → Google**
2. Toggle **Enable** on
3. You need a Google OAuth client. Go to https://console.cloud.google.com

### In Google Cloud Console:
1. Create a new project (or use existing)
2. Go to **APIs & Services → OAuth consent screen**
   - User type: **External**
   - Fill in app name ("The Circle"), support email, developer email
   - Save
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Name: `The Circle`
   - Authorised JavaScript origins: `http://localhost:3000` (add your production URL later)
   - Authorised redirect URIs: `https://your-project-ref.supabase.co/auth/v1/callback`
     (get this exact URL from Supabase: **Authentication → Providers → Google → Callback URL**)
4. Click **Create** — copy the **Client ID** and **Client Secret**

### Back in Supabase:
1. Paste the Google **Client ID** and **Client Secret**
2. Click **Save**

---

## Step 6: Set the redirect URL in Supabase

1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to `http://localhost:3000` (update to your Vercel URL after deploy)
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback`
   - `https://your-vercel-url.vercel.app/auth/callback` (add after deploy)

---

## Step 7: Install the Supabase SSR package

```bash
cd apps/web
npm install @supabase/ssr @supabase/supabase-js
```

---

## Step 8: Run the dev server

```bash
cd apps/web
npm run dev
```

Visit http://localhost:3000/auth/signup — Google OAuth and email signup should both work.

---

## How the auth flow works

```
Email signup:
  /auth/signup → supabase.auth.signUp() → DB trigger creates profile row
              → role selection step → writes role to profiles table
              → /onboarding/artist or /onboarding/organiser

Google signup:
  /auth/signup → supabase.auth.signInWithOAuth(google)
              → Google → Supabase → /auth/callback
              → callback checks profile.role
              → if no role: redirect to /auth/signup?step=role
              → role selection → /onboarding/artist or /onboarding/organiser

Login:
  /auth/login → supabase.auth.signInWithPassword() or Google OAuth
             → checks profile.role and onboarding_complete
             → artists → /dashboard
             → organisers → /discover

Route protection (middleware.ts):
  Every request checks for a valid Supabase session.
  /dashboard, /onboarding, /discover → redirect to /auth/login if not logged in
  /auth/login, /auth/signup → redirect to home if already logged in
```

---

## After deploying to Vercel

1. Add all `.env.local` values to Vercel: **Project Settings → Environment Variables**
2. Update Supabase **Site URL** to your Vercel URL
3. Add your Vercel URL to **Redirect URLs** in Supabase
4. Add your Vercel URL to **Authorised JavaScript origins** in Google Cloud Console
5. Add your Vercel URL + `/auth/callback` to **Authorised redirect URIs** in Google Cloud Console

---

## Files added/changed by this auth implementation

```
apps/web/
├── lib/
│   └── supabase/
│       ├── client.ts        ← browser Supabase client
│       ├── server.ts        ← server Supabase client
│       └── middleware.ts    ← session refresh + route protection logic
├── middleware.ts            ← Next.js middleware entry point
├── app/
│   ├── layout.tsx           ← wrapped with <AuthProvider>
│   ├── context/
│   │   └── AuthContext.tsx  ← real session, user, role, loading state
│   ├── components/auth/
│   │   └── AuthComponents.tsx  ← GoogleButton (no Apple), ErrorBanner, Field
│   ├── auth/
│   │   ├── login/page.tsx      ← real Supabase login
│   │   ├── signup/page.tsx     ← real Supabase signup + role selection
│   │   ├── reset-password/page.tsx  ← password reset email
│   │   └── callback/route.ts   ← OAuth callback handler
│   └── .env.example

apps/api/
└── schema.sql               ← profiles + artists + packages tables
```
