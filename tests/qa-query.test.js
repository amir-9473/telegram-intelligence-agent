'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { filterMessages, parseQuery } = require('../src/qa-query');

const now = new Date('2026-08-12T12:00:00Z').getTime();
const rows = Array.from({ length: 12 }, (_, index) => ({
  channel_username: index % 2 ? 'alpha' : 'beta',
  message_id: index + 1,
  message_url: `https://t.me/test/${index + 1}`,
  text: index < 3 ? 'هوش مصنوعی' : 'خبر عمومی',
  views: 500 + index * 250,
  published_at: new Date(now - index * 12 * 3600000).toISOString(),
}));

test('parses Persian last-N count questions deterministically', () => {
  const plan = parseQuery('در ۵ پیام اخیر چندتا راجع به هوش مصنوعی بوده؟');
  assert.equal(plan.task, 'count');
  assert.equal(plan.last_n, 5);
  assert.equal(filterMessages(rows, plan, now).rows.length, 5);
});

test('parses week, channel and minimum-view filters', () => {
  const plan = parseQuery('پیام‌های یک هفته گذشته در @alpha با حداقل ۱۰۰۰ بازدید را خلاصه کن');
  assert.equal(plan.task, 'summarize');
  assert.equal(plan.hours, 168);
  assert.equal(plan.channel, 'alpha');
  assert.equal(plan.min_views, 1000);
  const result = filterMessages(rows, plan, now);
  assert.ok(result.rows.every((row) => row.channel_username === 'alpha' && row.views >= 1000));
});

test('time filtering is exact and results are newest first', () => {
  const plan = parseQuery('در ۲۴ ساعت گذشته چه خبرهایی بوده؟');
  const result = filterMessages(rows, plan, now);
  assert.equal(result.rows.length, 3);
  assert.deepEqual(result.rows.map((row) => row.message_id), [1, 2, 3]);
});

test('default Q&A context remains capped at forty messages', () => {
  const many = Array.from({ length: 60 }, (_, index) => ({ ...rows[0], message_id: index + 1, message_url: `https://t.me/test/${index + 1}` }));
  const result = filterMessages(many, parseQuery('درباره فناوری چه گفته شده؟'), now);
  assert.equal(result.rows.length, 40);
  assert.equal(result.truncated, true);
});
