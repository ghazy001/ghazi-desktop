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

## MSN portfolio assistant

Add `OPENAI_API_KEY` in your Railway service’s Variables screen. The local ignored `.env` is never pushed or copied into the Docker image. Set `OPENAI_MODEL=gpt-6.1-terra` (the default), then redeploy this commit with the existing Dockerfile. Keep custom start commands empty. The API calls OpenAI Responses with reasoning disabled, strict structured replies and `store: false`. Requests still follow OpenAI’s API data policies; the interface explains that messages go to OpenAI.

The assistant uses the same verified profile and project JSON as the desktop. Commands are validated on both sides and only operate the simulated portfolio. It cannot run a real shell, read private files or send email. Visitors explicitly press **Run in Terminal** to apply a suggested command plan. Quick shortcuts and manual Terminal commands also work without AI.

Default protection per server process: 12 requests per IP per 15 minutes, 60 requests total per hour, one active request per IP and three globally; at most 10 conversation messages, 1,200 characters per user turn, 1,400 output tokens and a 25-second provider timeout. These are in-memory abuse limits, not a billing cap; they reset on restart and apply separately to each replica. Set an OpenAI project budget/usage alert in your account for billing visibility. For a high-traffic multi-replica deployment, use a shared rate-limit store or an edge rule.

`npm run dev` provides both `/api/chat` and `/api/contact`. `npm start` provides them in production. `npm run preview` has no APIs. Run `npm run check:assistant` for mocked grounding, command validation and HTTP failure tests without any paid API calls.

References: [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [GPT-6.1 Terra](https://developers.openai.com/api/docs/models/gpt-6.1-terra).

## Performance maintenance

The desktop route and individual apps load on demand. The logon sequence warms the desktop shell and default My Computer window while other apps remain deferred; data-saving connections skip this warmup. Initial animation timing is centralized in `src/data/boot-data.json`.

Local XP fonts use WOFF2 with original TTF fallbacks and `font-display: swap`. All original glyphs and advance widths are retained. To regenerate the web copies after changing a font, install the developer-only `fonttools` and `brotli` Python packages and run `python scripts/compress-xp-fonts.py`. Both `css/main.css` and its Sass source reference the compressed fonts. The website has no new runtime dependency.

Run `npm run check:performance` for frame scheduling, drag/resize boundaries and storage fallback tests. After a build, `npm run report:performance` records entry bundle sizes, compressed bytes, fonts and configured boot delays in `output/verification/performance-results.json`. The optional baseline was captured before this optimization. These measurements describe transfer sizes and deliberate animation waits, not FPS or a time-to-interactive benchmark.
