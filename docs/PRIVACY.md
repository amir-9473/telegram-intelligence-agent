# Privacy and deployment | حریم خصوصی و استقرار

## English

The repository is safe to publish only when it contains workflow definitions, synthetic test data, and documentation. Do **not** publish n8n execution exports, credentials, bot tokens, API keys, live Data Table exports, chat/user IDs, or screenshots containing them.

### Multi-user isolation

Public channel posts are stored centrally, but `/latest`, `/ask`, `/digest`, scheduled digests, and keyword alerts are restricted to the requesting user's active subscriptions. Workflow exports also disable retention of successful and failed execution payloads.

For production deployment:

1. Keep the included watchlist-scope checks enabled.
2. Use a retention policy and periodically remove old public posts and inactive subscriptions.
3. Delete historical n8n executions created before these privacy settings were enabled.
4. If you add analytics or audit tables later, never persist raw user questions unless users explicitly opt in.

Telegram chat history remains in the user's own Telegram app. The bot does not need to store user questions in a Data Table; n8n execution retention must still be configured carefully.

## فارسی

برای انتشار GitHub فقط منطق Workflowها، تست‌های مصنوعی و مستندات را نگه دارید. خروجی Executionها، Credentialها، Token ربات، API Key، Export جدول‌های واقعی، chat/user ID و Screenshotهای دارای این اطلاعات نباید منتشر شوند.

### ایزوله‌سازی بات چندکاربره

پیام‌های عمومی کانال‌ها در یک جدول مرکزی ذخیره می‌شوند، اما `/latest`، `/ask`، `/digest`، خلاصه روزانه و Alert فقط به subscriptionهای فعال همان کاربر محدود شده‌اند. ذخیره payload اجرای موفق و خطادار نیز در Workflowهای Exportشده غیرفعال است.

برای استقرار واقعی:

1. کنترل‌های Watchlist موجود را حذف نکنید.
2. برای داده‌ها زمان نگهداری تعیین کنید و پیام‌های عمومی و subscriptionهای غیرفعال قدیمی را پاک کنید.
3. Executionهای قدیمی n8n را که پیش از این تنظیمات ساخته شده‌اند یک‌بار پاک کنید.
4. اگر بعداً جدول Analytics یا Audit اضافه شد، سؤال خام کاربران را بدون رضایت آن‌ها ذخیره نکنید.

تاریخچه گفت‌وگو در خود تلگرام برای هر کاربر باقی می‌ماند. بات لازم نیست سؤال کاربر را در Data Table ذخیره کند، اما Retention اجرای n8n باید با دقت تنظیم شود.
