'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { normalizeChannel, parseTelegramPreview, parseViews } = require('../src/telegram-parser');

const fixture = fs.readFileSync(path.join(__dirname, 'fixtures', 'telegram_channel.html'), 'utf8');

test('normalizes and validates public channel usernames', () => {
  assert.equal(normalizeChannel('@Telegram'), 'telegram');
  assert.equal(normalizeChannel('https://t.me/s/Test_Channel/'), 'test_channel');
  assert.equal(normalizeChannel('bad-name'), null);
  assert.equal(normalizeChannel('abc'), null);
});

test('normalizes Telegram abbreviated view counts', () => {
  assert.equal(parseViews('1.2K'), 1200);
  assert.equal(parseViews('3M'), 3_000_000);
  assert.equal(parseViews('1,234'), 1234);
  assert.equal(parseViews('unknown'), 0);
});

test('extracts message fields and safely handles missing text', () => {
  const result = parseTelegramPreview(fixture, 'test_channel');
  assert.equal(result.ok, true);
  assert.equal(result.messages.length, 3);
  assert.deepEqual(result.messages[0], {
    channel_username: 'test_channel', message_id: 101,
    message_url: 'https://t.me/test_channel/101', text: 'خبر اول & مهم\nخط دوم',
    published_at: '2026-08-11T10:00:00+00:00', views: 1200,
  });
  assert.equal(result.messages[1].text, '');
  assert.equal(result.messages[1].views, 3_000_000);
});

test('reports pages without public preview messages', () => {
  assert.deepEqual(parseTelegramPreview('<html>not found</html>', 'private_test'), {
    ok: false, reason: 'NO_PUBLIC_WEB_PREVIEW_MESSAGES', messages: [],
  });
});

