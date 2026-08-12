'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { applyStructuredEnrichment, deduplicateMessages, filterLatest, formatGroundedAnswer, importanceScore, pendingAlertDeliveries } = require('../src/mvp-logic');

const now = new Date('2026-08-11T12:00:00Z');
const messages = [
  { channel_username: 'alpha', message_id: 1, text: 'هوش مصنوعی جدید', published_at: '2026-08-11T11:00:00Z', views: 1500 },
  { channel_username: 'alpha', message_id: 2, text: 'قدیمی', published_at: '2026-08-09T00:00:00Z', views: 5000 },
  { channel_username: 'beta', message_id: 1, text: 'other', published_at: '2026-08-11T11:30:00Z', views: 2000 },
];

test('collector rerun does not create duplicate channel/message keys', () => {
  assert.deepEqual(deduplicateMessages([messages[0]], messages).map((m) => `${m.channel_username}:${m.message_id}`), ['alpha:2', 'beta:1']);
});

test('time, channel, and view filters work together', () => {
  assert.deepEqual(filterLatest(messages, 'alpha', 24, 1000, now).map((m) => m.message_id), [1]);
});

test('score is deterministic and bounded', () => {
  const score = importanceScore(messages[0], 80, now);
  assert.ok(score >= 0 && score <= 100);
  assert.equal(score, importanceScore(messages[0], 80, now));
});

test('keyword alert is emitted once per alert/message', () => {
  const alerts = [{ alert_id: 'a1', chat_id: '10', channel_username: '*', keyword: 'هوش مصنوعی', status: 'active' }];
  const first = pendingAlertDeliveries(alerts, messages, []);
  assert.equal(first.length, 1);
  assert.equal(pendingAlertDeliveries(alerts, messages, [first[0].delivery_key]).length, 0);
});

test('mocked structured AI result persists topic, summary, and score fields', () => {
  const enriched = applyStructuredEnrichment([messages[0]], [{
    channel_username: 'alpha', message_id: 1, topic: 'فناوری', summary_fa: 'خلاصه فارسی کوتاه', content_importance: 90,
  }], now);
  assert.equal(enriched[0].topic, 'فناوری');
  assert.equal(enriched[0].summary, 'خلاصه فارسی کوتاه');
  assert.ok(Number.isInteger(enriched[0].importance_score));
});

test('grounded Q&A includes stored source links and handles insufficient context', () => {
  const context = [{ message_url: 'https://t.me/alpha/1' }];
  assert.match(formatGroundedAnswer({ has_answer: true, answer: 'پاسخ', source_ids: [1] }, context), /https:\/\/t\.me\/alpha\/1/);
  assert.match(formatGroundedAnswer({ has_answer: false }, context), /اطلاعات کافی/);
});

