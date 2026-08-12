'use strict';

function messageKey(message) {
  return `${String(message.channel_username).toLowerCase()}:${Number(message.message_id)}`;
}

function deduplicateMessages(existing, incoming) {
  const seen = new Set(existing.map(messageKey));
  return incoming.filter((message) => {
    const key = messageKey(message);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function filterLatest(messages, channel, hours, minViews, now = new Date()) {
  const cutoff = now.getTime() - Number(hours) * 3_600_000;
  return messages.filter((m) => String(m.channel_username).toLowerCase() === String(channel).toLowerCase()
    && new Date(m.published_at).getTime() >= cutoff
    && Number(m.views || 0) >= Number(minViews || 0))
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
}

function importanceScore(message, contentImportance, now = new Date()) {
  const ageHours = Math.max(0, (now - new Date(message.published_at)) / 3_600_000);
  const freshness = Math.max(0, 1 - ageHours / 72);
  const viewSignal = Math.min(1, Math.log10(Number(message.views || 0) + 1) / 6);
  const content = Math.min(100, Math.max(0, Number(contentImportance || 0))) / 100;
  return Math.round(100 * (0.35 * freshness + 0.25 * viewSignal + 0.40 * content));
}

function pendingAlertDeliveries(alerts, messages, deliveredKeys) {
  const delivered = new Set(deliveredKeys);
  const output = [];
  for (const alert of alerts.filter((a) => a.status === 'active')) {
    for (const message of messages) {
      if (alert.channel_username && alert.channel_username !== '*' && alert.channel_username !== message.channel_username) continue;
      if (!String(message.text || '').toLocaleLowerCase('fa').includes(String(alert.keyword).toLocaleLowerCase('fa'))) continue;
      const delivery_key = `${alert.alert_id}:${messageKey(message)}`;
      if (!delivered.has(delivery_key)) {
        delivered.add(delivery_key);
        output.push({ ...alert, ...message, delivery_key });
      }
    }
  }
  return output;
}

function applyStructuredEnrichment(messages, aiItems, now = new Date()) {
  const byKey = new Map(aiItems.map((x) => [`${String(x.channel_username).toLowerCase()}:${Number(x.message_id)}`, x]));
  return messages.flatMap((message) => {
    const ai = byKey.get(messageKey(message));
    if (!ai || typeof ai.topic !== 'string' || typeof ai.summary_fa !== 'string') return [];
    return [{ ...message, topic: ai.topic.slice(0, 60), summary: ai.summary_fa.slice(0, 500), importance_score: importanceScore(message, ai.content_importance, now) }];
  });
}

function formatGroundedAnswer(result, context) {
  if (!result?.has_answer || !String(result.answer || '').trim()) return 'اطلاعات کافی در پیام‌های ذخیره‌شده وجود ندارد.';
  const links = [...new Set(result.source_ids || [])]
    .filter((id) => Number.isInteger(id) && context[id - 1]?.message_url)
    .slice(0, 5)
    .map((id) => context[id - 1].message_url);
  return `${String(result.answer).trim()}${links.length ? `\n\nمنابع:\n${links.join('\n')}` : '\n\nمنبع معتبری برگردانده نشد.'}`;
}

module.exports = { applyStructuredEnrichment, deduplicateMessages, filterLatest, formatGroundedAnswer, importanceScore, messageKey, pendingAlertDeliveries };
