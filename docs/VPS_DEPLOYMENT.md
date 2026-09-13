# Docker and VPS deployment | استقرار Docker و VPS

## Production layout

```text
Internet
  → HTTPS reverse proxy (Caddy/Nginx)
  → n8n editor + webhooks (private Docker network)
  → PostgreSQL (private Docker network)
  → external n8n task runner
```

The deployment pins n8n and its runner to the same release, stores n8n and PostgreSQL data in Docker volumes, publishes the n8n health port only on `127.0.0.1`, disables execution-payload retention, and keeps credentials in n8n's encrypted credential store. The real `.env` file, database data, credentials, and TLS keys must never be committed.

## Prerequisites

- Docker Engine and Docker Compose v2
- A public HTTPS hostname pointing to the VPS
- An existing reverse proxy attached to a shared Docker network
- A Telegram Bot token and an OpenRouter API key

## Start the stack

```bash
cp .env.example .env
docker network create public-proxy
docker compose config
docker compose pull
docker compose up -d
docker compose ps
curl -fsS http://127.0.0.1:5678/healthz
```

Generate independent random values for `N8N_ENCRYPTION_KEY`, `RUNNERS_AUTH_TOKEN`, `POSTGRES_PASSWORD`, and `POSTGRES_NON_ROOT_PASSWORD`. Set `N8N_HOST`, `N8N_EDITOR_BASE_URL`, and `WEBHOOK_URL` to the externally reachable HTTPS address. Keep the trailing slash in `WEBHOOK_URL`.

The reverse proxy must join the same network named by `PROXY_NETWORK`. A Caddy example is available at [`deploy/Caddyfile.example`](../deploy/Caddyfile.example). Set `N8N_PROXY_HOPS=1` when there is one reverse proxy between the internet and n8n, as the included Compose file does.

## Create the tables and import workflows

After the n8n owner account exists, run:

```bash
sh scripts/bootstrap-n8n.sh
```

This idempotently creates `subscriptions`, `messages`, `alerts`, and `alert_deliveries`, then imports the four runtime workflows. Imports stay unpublished until credentials are attached and verification is complete.

Create one Telegram credential and attach it to every Telegram and Telegram Trigger node. Create one HTTP Header Auth credential with header name `Authorization` and value `Bearer YOUR_OPENROUTER_KEY`, then attach it to `OpenRouter QA` and `OpenRouter Batch`.

Publish in this order only after credential tests pass:

```bash
docker compose exec -T n8n n8n publish:workflow --id=tiaCollector0002
docker compose exec -T n8n n8n publish:workflow --id=tiaEnrichment003
docker compose exec -T n8n n8n publish:workflow --id=tiaDailyDigest04
docker compose exec -T n8n n8n publish:workflow --id=tiaBotControl001
docker compose restart n8n n8n-runner
```

## Verification and operations

```bash
docker compose ps
docker compose logs --tail=200 n8n n8n-runner postgres
curl -fsS http://127.0.0.1:5678/healthz
curl -fsS https://n8n.example.com/healthz
docker compose exec -T n8n n8n audit
```

Verify the Telegram workflow with `/start`, add a public test channel, run the collector, confirm a row appears in `messages`, then check `/latest`, `/ask`, `/alert`, and `/digest`. Never enable a Telegram Trigger for the same bot in another n8n instance: Telegram allows only one active webhook per bot.

Update with `git pull`, review the n8n release notes, run the repository tests, then use `docker compose pull && docker compose up -d`. Back up both PostgreSQL and the `n8n_data` volume before upgrades. Containers restart after a VPS reboot because they use `restart: unless-stopped`.

---

## خلاصه فارسی

فایل `compose.yaml` یک استقرار production شامل n8n، PostgreSQL و Task Runner خارجی می‌سازد. دیتابیس و n8n مستقیماً public نیستند؛ فقط Reverse Proxy روی HTTPS به کانتینر `telegram-intelligence-n8n:5678` متصل می‌شود. مقدارهای واقعی `.env`، توکن تلگرام، کلید OpenRouter، Credential export و گواهی خصوصی نباید وارد Git شوند.

پس از ساخت `.env` و شبکه `public-proxy`، سرویس‌ها را با `docker compose up -d` اجرا کنید. بعد از ساخت حساب Owner در صفحه n8n، دستور `sh scripts/bootstrap-n8n.sh` چهار Data Table را می‌سازد و Workflowها را به حالت منتشرنشده Import می‌کند. Credential تلگرام و OpenRouter را متصل کنید، تست واقعی بات را انجام دهید و سپس Workflowها را با دستورهای بالا Publish کنید.
