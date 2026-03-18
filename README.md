# Ledger Garden

Ledger Garden is a React and Vite budget planner backed by a local Node API and SQLite database. Accounts, password hashing, email verification, password resets, and saved recurring budget data all run on `localhost`.

## Features

- Email and password registration with hashed passwords
- Local email verification flow
- Local password reset flow
- Per-user SQLite budget storage
- Monthly balance calendar with recurring income and expenses
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

- App: `http://localhost:3000`
- Local mailbox: `http://localhost:3000/api/dev/mailbox`

The SQLite database file is created automatically at [`server/data/ledger-garden.sqlite`](/c:/Users/n38fa/agentai_repo/server/data/ledger-garden.sqlite).

## Auth Flow

1. Create an account in the app.
2. Open the local mailbox and click the verification link.
3. Sign in with the verified account.
4. Use "Reset password" in the auth screen whenever you want to test recovery.

All verification and reset emails stay on your machine and are stored in the local mailbox table.

## Optional Overrides

You can add a `.env.local` file using the values from [`.env.example`](/c:/Users/n38fa/agentai_repo/.env.example) to override:

- app origin
- API host and port
- SQLite database path
- session lifetime

No deployment configuration is required for this setup.

## Helpful Scripts

- `npm run dev`: start frontend and API together
- `npm run dev:client`: start Vite only
- `npm run dev:server`: start the local API only
- `npm run build`: build the frontend
- `npm run lint`: lint the repo
- `npm run start:server`: run the API without file watching
