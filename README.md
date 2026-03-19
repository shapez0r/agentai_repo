# Budlendar

Budlendar is a React and Vite budget planner backed by a local Node API and SQLite database. Accounts, password hashing, email verification, password resets, and saved recurring budget data all run on your machine.

The signed-in UI uses a flatter month-grid calendar with a compact workspace drawer for summaries, recurring rules, and account controls.

The development app runs at `http://127.0.0.1:8785`.
The production-style single-process app runs at `http://127.0.0.1:8787`.

## Features

- Minimal month grid with running daily balances
- Per-day add button plus click-to-edit scheduled items
- Compact workspace drawer for month summary, selected-day details, and recurring rules
- Start-date-first recurrence flow
- Monthly rules that repeat on the same calendar date
- Weekly rules configured as `Every <weekday>` plus a `Week interval` of `1 week` or `2 weeks`
- Daily, yearly, and one-time entries
- Email and password registration with hashed passwords
- Local email verification flow
- Local password reset flow
- Per-user SQLite budget storage
- Demo budget loader for quick testing
- Local mailbox UI for verification and reset links

## Local Development

Install dependencies:

```bash
npm install
```

Start the local API and frontend together:

```bash
npm run dev
```

Open:

- App: `http://127.0.0.1:8785`
- Local mailbox: `http://127.0.0.1:8785/api/dev/mailbox`

The development server writes to [`server/data/budlendar.dev.sqlite`](/c:/Users/n38fa/agentai_repo/server/data/budlendar.dev.sqlite) by default.
The production-style server and deployed server both write to [`server/data/budlendar.prod.sqlite`](/c:/Users/n38fa/agentai_repo/server/data/budlendar.prod.sqlite) by default.
Set `DATABASE_FILE` explicitly in `.env.local` if you want a custom location for either environment.

## Scheduling Rules

- `Starting date` anchors every recurring rule.
- Monthly rules repeat on that same day number every month.
- Weekly rules repeat on the selected weekday every `1 week` or `2 weeks`.
- Existing legacy monthly or yearly weekday-based rules are still rendered and preserved.

## Auth Flow

1. Create an account in the app.
2. Open the local mailbox and click the verification link.
3. Sign in with the verified account.
4. Use "Reset password" in the auth screen whenever you want to test recovery.

All verification and reset emails stay on your machine and are stored in the local mailbox table.

## Optional Overrides

You can add a `.env.local` file using the values from [`.env.example`](/c:/Users/n38fa/agentai_repo/.env.example) to override:

- application environment
- app origin
- API host and port
- static client serving
- SQLite database path
- session lifetime

## Helpful Scripts

- `npm run dev`: start frontend and API together
- `npm run dev:client`: start the Budlendar frontend on `http://127.0.0.1:8785`
- `npm run dev:server`: start the internal development API on `http://127.0.0.1:8786`
- `npm run build`: build the frontend
- `npm run lint`: lint the repo
- `npm run test`: run the automated budget and database tests
- `npm run preview`: build the frontend, serve it through Vite preview on `http://127.0.0.1:8787`, and keep the API on `http://127.0.0.1:8788` while using the production database defaults
- `npm run start:server`: serve the built Budlendar app and API on `http://127.0.0.1:8787` with the production database defaults
- `npm run start:local`: local production-style verification flow with client on `http://127.0.0.1:8787` and API on `http://127.0.0.1:8788`
