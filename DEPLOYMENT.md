# Deploy the portfolio and email API to Railway

The Dockerfile builds Vue with Node.js 24, then runs a single Node HTTP server for both the portfolio and Outlook Express’s `/api/contact` endpoint. No database, volume or extra service is needed. It listens on Railway’s `PORT`, defaulting to **35000**, so existing domain target-port settings can stay at 35000. The legacy nginx.conf is no longer the Docker runtime: a static-only deployment cannot send email.

## Update your existing GitHub-connected service

1. In Railway, open the existing portfolio service → Variables.
2. Add `RESEND_API_KEY` using your private Resend key. The local `.env` file is ignored by Git and excluded from Docker; Railway does not receive it when you push.
3. Add `RESEND_FROM_EMAIL` with the value `Ghazi XP <onboarding@resend.dev>`.
4. Keep `PORT=35000` and the public domain target port at 35000. Use the repository’s Dockerfile and leave custom start/build command overrides empty.
5. Push the updated project to GitHub, then deploy the latest commit (or Redeploy if Railway already sees it).
6. Optionally set the Railway healthcheck path to `/healthz`.
7. Open `/office`, compose a message in Outlook Express and press Send. A sent dialog means Resend accepted the message; inbox arrival may take a little time. Failed sends keep the draft.

The recipient is fixed server-side to `ghazysaoudi007@gmail.com` from `src/data/profile-data.json`. The user confirmed this is also the Resend account email. No sender domain is verified yet, so the default sender can deliver only to that account email. Visitors can use their own email in From; it becomes Reply-To so replies go to the visitor. Do not put a visitor’s Gmail address in the Resend sender field. When you verify a sending domain, update RESEND_FROM_EMAIL to an address on that domain.

## Deploy through the CLI instead

The CLI session inspected during this change had expired and the folder was not linked. Reconnect explicitly to your existing project/service:

```sh
cd /Users/ghazi.saoudi/Downloads/portfolio-windows
railway login
railway link
railway up
```

Choose the intended existing portfolio service during linking. Set the secret variables through Railway’s Variables screen before deploying. Do not put the real key into a shell command, source file or commit.

## Local use

The private `.env` file contains the local key and sender. Start the usual Vite development server with `npm run dev`; its server-side middleware handles `/api/contact`. For production behavior locally:

```sh
npm run build
npm start
```

Open `http://localhost:35000/office`. Vite’s `npm run preview` is a static-only preview and does not provide email delivery.

`npm run check:contact` runs mocked delivery and HTTP/static-server tests without sending any real email. It covers fixed recipients, Reply-To, idempotency, errors, rate limits, request size limits, secret-file blocking, SPA fallback, gzip and byte-range media delivery.

Keep the original ghazi-saoudi.vercel.app online: Internet Explorer and the two project demo recordings still use it.

References: [Resend Send Email](https://resend.com/docs/api-reference/emails/send-email), [default sender restrictions](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain), [Railway public networking](https://docs.railway.com/networking/public-networking/specs-and-limits).
