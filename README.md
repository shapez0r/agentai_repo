# Ledger Garden

Ledger Garden is a React and Vite budget planner backed by Supabase Auth and Postgres. Users can register, sign in, store their budget in the database, and enable TOTP-based two-factor authentication for their account. If Supabase environment variables are missing, the app falls back to local browser storage so the calendar remains usable.

## Features

- Monthly calendar with a balance shown on every active day
- Recurring schedules for one-time, daily, weekly, biweekly, monthly, and yearly events
- Positive and negative cash flow tracking in euro
- Email/password authentication with Supabase
- Password reset and email verification flow support
- TOTP 2FA enrollment and session verification
- Row-level security protected Postgres tables for budgets and recurring events
- GitHub Pages frontend deployment through GitHub Actions

## Local Development

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env.local
```

Fill in:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_AUTH_REDIRECT_URL`

Apply the SQL schema in [supabase/schema.sql](/c:/Users/n38fa/agentai_repo/supabase/schema.sql) inside your Supabase project.

Run the app locally:

```bash
npm run dev
```

Without Supabase variables, the app will run in local-only mode and persist data to `localStorage`.

Build a production bundle:

```bash
npm run build
```

Lint the project:

```bash
npm run lint
```

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor and run [supabase/schema.sql](/c:/Users/n38fa/agentai_repo/supabase/schema.sql).
3. In `Authentication -> URL Configuration`, add your local and production URLs.
   Local example: `http://localhost:5173/`
   GitHub Pages example: `https://shapez0r.github.io/agentai_repo/`
4. In `Authentication -> Providers`, keep Email enabled and choose whether email confirmation is required.
5. In `Authentication -> Multi-Factor Auth`, enable TOTP.

The app already includes:

- sign up
- sign in
- password reset email flow
- TOTP enrollment
- TOTP session challenge verification

## GitHub Pages Deployment

This repo includes [`.github/workflows/deploy-pages.yml`](/c:/Users/n38fa/agentai_repo/.github/workflows/deploy-pages.yml), which builds the frontend and deploys `dist/` to GitHub Pages whenever `main` is pushed.

GitHub Pages only hosts the frontend. Supabase provides the authentication and database backend.

Before deploying the live site, make sure:

- the Pages URL is listed in Supabase redirect URLs
- `VITE_AUTH_REDIRECT_URL` matches the live Pages URL
- the SQL schema is already applied in the target Supabase project
- repository variable `VITE_SUPABASE_URL` is set in GitHub
- repository secret `VITE_SUPABASE_ANON_KEY` is set in GitHub
- repository variable `VITE_AUTH_REDIRECT_URL` is set in GitHub

If those variables are not configured, GitHub Pages will still build successfully, but the deployed app will stay in local-only mode.

## Main Files

- [`src/App.jsx`](/c:/Users/n38fa/agentai_repo/src/App.jsx): auth/session orchestration and cloud-backed app shell
- [`src/components/AuthScreen.jsx`](/c:/Users/n38fa/agentai_repo/src/components/AuthScreen.jsx): registration, sign-in, and password recovery UI
- [`src/components/BudgetDrawer.jsx`](/c:/Users/n38fa/agentai_repo/src/components/BudgetDrawer.jsx): account, MFA, settings, and recurring event management
- [`src/components/CalendarPanel.jsx`](/c:/Users/n38fa/agentai_repo/src/components/CalendarPanel.jsx): main calendar viewport
- [`src/lib/cloudBudget.js`](/c:/Users/n38fa/agentai_repo/src/lib/cloudBudget.js): Supabase read/write helpers
- [`src/lib/localBudget.js`](/c:/Users/n38fa/agentai_repo/src/lib/localBudget.js): local browser-storage fallback helpers
- [`src/lib/supabase.js`](/c:/Users/n38fa/agentai_repo/src/lib/supabase.js): Supabase client bootstrap
- [`supabase/schema.sql`](/c:/Users/n38fa/agentai_repo/supabase/schema.sql): tables, triggers, and RLS policies
