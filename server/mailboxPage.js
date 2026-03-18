function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function renderMailboxPage({ emails, filterEmail }) {
  const emailMarkup =
    emails.length === 0
      ? '<p class="empty-state">No messages yet. Register or request a password reset to generate one.</p>'
      : emails
          .map(
            (email) => `
              <article class="message-card">
                <div class="message-top">
                  <div>
                    <p class="eyebrow">To</p>
                    <h2>${escapeHtml(email.to_email)}</h2>
                  </div>
                  <p class="timestamp">${escapeHtml(new Date(email.created_at).toLocaleString('en-IE'))}</p>
                </div>
                <p class="subject">${escapeHtml(email.subject)}</p>
                ${
                  email.action_url
                    ? `<p><a class="button-link" href="${escapeHtml(email.action_url)}">Open action link</a></p>`
                    : ''
                }
                <pre>${escapeHtml(email.text_body)}</pre>
              </article>
            `,
          )
          .join('')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ledger Garden Local Mailbox</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #173127;
        --muted: #62756d;
        --accent: #d15f39;
        --line: rgba(23, 49, 39, 0.14);
        --panel: rgba(255, 255, 255, 0.92);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Space Grotesk", system-ui, sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(250, 202, 145, 0.92), transparent 28%),
          radial-gradient(circle at top right, rgba(137, 202, 180, 0.88), transparent 24%),
          linear-gradient(180deg, #f4ecdf 0%, #f7f1e8 42%, #eee0cb 100%);
      }

      main {
        width: min(70rem, calc(100% - 2rem));
        margin: 0 auto;
        padding: 1.5rem 0 2.5rem;
      }

      .hero, .message-card {
        border: 1px solid var(--line);
        border-radius: 1.5rem;
        padding: 1.25rem;
        background: var(--panel);
        backdrop-filter: blur(18px);
        box-shadow: 0 24px 70px rgba(68, 54, 34, 0.14);
      }

      .hero {
        margin-bottom: 1rem;
      }

      .eyebrow {
        margin: 0 0 0.45rem;
        font-size: 0.76rem;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--accent);
      }

      h1, h2 {
        margin: 0;
        font-family: "Fraunces", Georgia, serif;
        line-height: 1;
      }

      h1 {
        font-size: clamp(2rem, 5vw, 3.4rem);
      }

      h2 {
        font-size: 1.2rem;
      }

      p {
        margin: 0.75rem 0 0;
      }

      .muted, .timestamp {
        color: var(--muted);
      }

      .message-list {
        display: grid;
        gap: 1rem;
      }

      .message-top {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
      }

      .subject {
        font-weight: 700;
      }

      .button-link {
        display: inline-flex;
        margin-top: 0.75rem;
        padding: 0.8rem 1rem;
        border-radius: 999px;
        color: #fffaf3;
        text-decoration: none;
        background: linear-gradient(135deg, #1c7b60 0%, #d15f39 100%);
      }

      .empty-state {
        border: 1px dashed var(--line);
        border-radius: 1rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.62);
      }

      pre {
        margin: 1rem 0 0;
        padding: 1rem;
        border-radius: 1rem;
        background: rgba(23, 49, 39, 0.08);
        overflow-x: auto;
        white-space: pre-wrap;
        font: inherit;
      }

      @media (max-width: 720px) {
        .message-top {
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <p class="eyebrow">Local mailbox</p>
        <h1>Ledger Garden emails stay on this machine</h1>
        <p class="muted">
          ${
            filterEmail
              ? `Showing recent messages for ${escapeHtml(filterEmail)}.`
              : 'Showing the 25 most recent verification and password reset emails.'
          }
        </p>
      </section>
      <section class="message-list">${emailMarkup}</section>
    </main>
  </body>
</html>`
}
