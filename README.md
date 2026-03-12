# Ledger Garden

Ledger Garden is a React and Vite budget planner that shows the projected running balance on every day of a calendar. Users can store an opening balance, add recurring income and expense events, and inspect the balance impact day by day.

## Features

- Monthly calendar with a balance shown on every active day
- Recurring schedules for one-time, daily, weekly, biweekly, monthly, and yearly events
- Positive and negative cash flow tracking in euro
- Local persistence with `localStorage`
- GitHub Pages deployment through GitHub Actions

## Local Development

Install dependencies if needed:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Build a production bundle:

```bash
npm run build
```

Lint the project:

```bash
npm run lint
```

## GitHub Pages Deployment

This repo includes `.github/workflows/deploy-pages.yml`, which builds the app and deploys `dist/` to GitHub Pages whenever `main` is pushed.

If Pages is not already configured in the repository settings, set the Pages source to `GitHub Actions`.

## Main Files

- `src/App.jsx`: UI, local state, and interaction flow
- `src/lib/budget.js`: recurrence engine and calendar calculations
- `src/index.css`: visual system and responsive layout
