# 🌐 Connection Tester

A modern web app for testing your internet connection quality from anywhere in the world. Instantly check your public IP, latency to major global regions, and download speed from different locations. Supports English and Russian languages.

## 🚀 Features

- **IP Detection** — Instantly shows your public IP address.
- **Latency Test** — Measures ping to Russia, Europe, US, Singapore, Brazil, India, Australia, South Africa, Japan, and Canada (with flags and translations).
- **Download Speed** — Measures download speed from Cloudflare (US) and Singapore endpoints.
- **Language Switch** — Interface in English 🇬🇧 or Russian 🇷🇺, with instant switching and local storage.
- **Modern UI/UX** — Futuristic design, glassmorphism, responsive layout, and flag icons.
- **No tracking, no ads, open source.**

## 🖥️ How to run

1. Install Node.js (https://nodejs.org/)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the app locally:
   ```bash
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Project structure

```
connection-tester/
  public/
    favicon.ico
    index.html
  src/
    App.js        # Main app logic and UI
    App.css       # Main styles
    index.js      # Entry point
    index.css     # Global styles
  package.json
  README.md
```

## 🗺️ How it works

```mermaid
flowchart TD
    A[User opens app] --> B[App fetches public IP]
    B --> C[App measures latency to global sites]
    C --> D[App measures download speed]
    D --> E[User sees results in UI]
    E --> F[User can switch language]
    F --> E
```

- The app is built with React (JavaScript).
- On load, it fetches your public IP from https://api.ipify.org.
- Latency is measured by sending fetch requests to major global sites (Yandex, BBC, Google, etc.).
- Download speed is measured by downloading a test file from Cloudflare endpoints.
- The UI supports English and Russian, with instant switching and local storage of language preference.
- All logic and UI are in `src/App.js` and `src/App.css`.
- Deployment is automated to GitHub Pages (see workflow below).

## 🛠️ Versioning & Commit Hash

- Before each build and deploy, run the script:
  ```powershell
  powershell.exe -ExecutionPolicy Bypass -File .\replace-commit-hash.ps1
  ```
  This will update the application with the current git commit hash for version tracking.
- The commit hash will be shown in the site footer and checked by the verification script after deploy.

## 🚦 Deployment & Verification Flow

```mermaid
flowchart TD
    A[User dictates changes to Copilot]
    B[Copilot applies changes to code]
    C[Copilot updates replace-commit-hash.ps1 for new commit hash]
    D[Copilot runs git add .]
    E[Copilot runs git commit]
    F[Copilot runs git push]
    G[Copilot runs npm run deploy]
    H[Copilot waits for deployment propagation]
    I[Copilot runs check-tester.ps1]
    J{FOUND?}
    K[Change is live!]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J -- Yes --> K
    J -- No --> B
```

Deployment and verification are fully automated: you dictate changes, Copilot applies them, commits, pushes, updates the commit hash, deploys, waits for propagation, and verifies everything automatically. If verification fails, Copilot will retry the cycle until success.

## 🔍 Verification Script

The repository includes an automated PowerShell verification script: `check-tester.ps1`.

- This script checks that the latest deployed version of the site contains the expected phrase or feature (for example, the current app name).
- The script automatically finds the correct deployed JS file and searches for the expected value.
- Always update this script to match the latest change you want to verify after deployment.
- Run it after each deployment to ensure your change is live:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\check-tester.ps1
```

If the script outputs `FOUND`, your change is present on the live site.

## 🛠️ Deployment Workflow

1. **Update Commit Hash**: Run `replace-commit-hash.ps1` to include the current commit hash in the application.
2. **Commit and Push Changes**: Stage, commit, and push the changes to the repository.
3. **Deploy the Application**: Use `npm run deploy` to deploy the updated application.
4. **Wait for Deployment Propagation**: Allow some time for the deployment to propagate or manually confirm the deployment is live.
5. **Verify Deployment**: Run `check-tester.ps1` to confirm the changes are live.

## Deployment & Verification Workflow

1. Make the required changes in the application code (src/).
2. Update the verification script (`check-tester.ps1`) so it checks for the new/changed feature (e.g., a new phrase or color).
3. Run the following commands:
   - `git add .`
   - `git commit -m "describe your change"`
   - `git push`
4. Update the commit hash in the application:
   - `powershell.exe -ExecutionPolicy Bypass -File .\replace-commit-hash.ps1`
5. Deploy to GitHub Pages:
   - `npm run deploy`
6. Wait for deployment propagation or manually confirm the deployment is live.
7. Run the verification script:
   - `powershell.exe -ExecutionPolicy Bypass -File .\check-tester.ps1`
8. Make sure the script outputs `FOUND` — this means the change is live on the site.

> Always keep the verification script up to date with the latest change you want to check after deployment!

## 📝 License

MIT. Use, modify, and share freely.

---

Made with ❤️ by shapez0r & GitHub Copilot, 2025.