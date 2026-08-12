# Setup | راه‌اندازی

## English

Create these n8n Data Tables: `subscriptions`, `messages`, `alerts`, and `alert_deliveries`. Import the four JSON workflows in order, attach a Telegram Bot credential to all Telegram nodes, attach an OpenRouter HTTP Header Auth credential to both OpenRouter nodes, then activate the workflows.

Required message fields are `channel_username`, `message_id`, `message_url`, `text`, `published_at`, `views`, `topic`, `summary`, and `importance_score`. Do not place credentials, chat IDs, execution exports, or live Data Table rows in Git.

## فارسی

چهار Data Table با نام‌های `subscriptions`، `messages`، `alerts` و `alert_deliveries` بسازید. چهار فایل JSON داخل `n8n/workflows` را Import کنید، Credential ربات تلگرام را به تمام Nodeهای تلگرام و Credential مربوط به OpenRouter را به دو Node مربوطه وصل کنید؛ سپس Workflowها را فعال کنید.

داده‌های زنده، Tokenها، API Keyها، chat IDها و Execution Exportها را هرگز در Git قرار ندهید. قبل از انتشار عمومی، [راهنمای حریم خصوصی](PRIVACY.md) را بررسی کنید.
