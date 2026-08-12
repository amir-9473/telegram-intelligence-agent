# Telegram Intelligence Agent | ایجنت هوشمند کانال‌های تلگرام

[English](#english) · [فارسی](#فارسی)

## English

An **n8n-first Telegram intelligence agent** for monitoring public Telegram channels, collecting new posts, generating Persian AI summaries, ranking important content, sending keyword alerts, and answering questions with source links.

> This repository contains reusable workflow logic, JavaScript helpers, synthetic fixtures, and tests. It never contains live Data Table rows, bot tokens, OpenRouter keys, Telegram chat IDs, or execution exports.

### What it does

- Adds and manages public-channel subscriptions.
- Polls Telegram Web Preview pages and stores only new posts using `channel_username + message_id` deduplication.
- Extracts post text, URL, publication time, and normalized view counts.
- Classifies and summarizes Persian content with an LLM, then calculates a deterministic importance score.
- Delivers deduplicated keyword alerts and a daily digest.
- Answers grounded questions from stored posts and returns Telegram source links.
- Isolates `/latest`, Q&A, digests, and alerts by each user's active watchlist.

### Architecture

```text
Telegram Bot → Bot Control → n8n Data Tables → OpenRouter
                         ↑
Telegram Web Preview → Collector → Enrichment / Alerts / Daily Digest
```

### Workflows

| Workflow | Purpose |
| --- | --- |
| `01_bot_control.json` | Telegram commands, subscriptions, Q&A, on-demand digest, and alerts |
| `02_channel_collector.json` | Scheduled collection and deduplication of public posts |
| `03_enrichment_alerts.json` | LLM enrichment, ranking, and keyword alerts |
| `04_daily_digest.json` | Scheduled 24-hour digest |

### Commands

```text
/start                 /help
/add @channel          /remove @channel          /list
/latest @channel [hours] [min_views]
/ask your question     /digest
/alert add keyword     /alert list     /alert remove ALERT_ID
```

### Stack

`n8n` · `Telegram Bot API` · `Telegram Web Preview` · `OpenRouter` · `n8n Data Tables` · `JavaScript` · `Node.js tests`

### Quick start

1. Create the four n8n Data Tables described in [Setup](docs/SETUP.md).
2. Import the four workflow JSON files from [`n8n/workflows`](n8n/workflows).
3. Attach Telegram and OpenRouter credentials inside n8n; never commit them.
4. Activate Bot Control, Collector, Enrichment & Alerts, and Daily Digest.

Run offline validation with Node.js 20+:

```bash
node tests/validate-workflows.js
node --test tests/*.test.js
```

### Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Setup](docs/SETUP.md)
- [Privacy and deployment](docs/PRIVACY.md)
- [Demo guide](docs/DEMO.md)
- [راهنمای فارسی](docs/README_FA.md)

### Limitations

Only public channels with an available `t.me/s/<username>` preview are supported. Telegram Web Preview is HTML rather than a stable API; its markup can change. This MVP uses bounded stored-message context, not a vector database.

---

## فارسی

یک ایجنت هوشمند مبتنی بر **n8n** برای مانیتورکردن کانال‌های عمومی تلگرام، جمع‌آوری پست‌های جدید، خلاصه‌سازی فارسی با LLM، رتبه‌بندی محتوا، هشدار کلمه‌ای و پرسش‌وپاسخ همراه با لینک منبع.

این مخزن فقط شامل منطق Workflowها، کدهای کمکی JavaScript، داده‌های تستی مصنوعی و تست‌هاست؛ توکن ربات، کلید API، chat ID، تاریخچه اجرای n8n و داده‌های واقعی کانال‌ها در آن قرار نمی‌گیرند.

برای جزئیات فارسی، [راهنمای پروژه](docs/README_FA.md) را ببینید.
