'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCommand } = require('../src/command-parser');

test('parses required subscription commands', () => {
  assert.equal(parseCommand('/add @Telegram', 10, 20).channel_username, 'telegram');
  assert.equal(parseCommand('/remove @telegram', 10, 20).action, 'remove');
  assert.equal(parseCommand('/list', 10, 20).action, 'list');
});

test('formats ASCII-only English start/help guidance for Telegram readability', () => {
  const start = parseCommand('/start', 10, 20).reply;
  const help = parseCommand('/help', 10, 20).reply;
  assert.match(start, /Welcome to Telegram Intelligence Agent!/);
  assert.match(start, /\n\/add @channel\n/);
  assert.match(help, /\n\/alert remove ALERT_ID\n/);
  assert.doesNotMatch(start, /[^\x00-\x7F]/);
  assert.equal(start, help);
});

test('parses latest defaults and explicit filters', () => {
  assert.deepEqual(parseCommand('/latest @telegram', 10, 20), {
    chat_id: '10', user_id: '20', action: 'latest', channel_username: 'telegram', hours: 24, min_views: 0,
  });
  assert.equal(parseCommand('/latest @telegram 24 1000', 10, 20).min_views, 1000);
  assert.equal(parseCommand('/latest @telegram nope 1', 10, 20).action, 'reply');
});

test('parses Q&A and alert commands and rejects malformed input', () => {
  assert.equal(parseCommand('/ask چه خبر مهمی بود؟', 10, 20).action, 'ask');
  assert.equal(parseCommand('/alert add هوش مصنوعی', 10, 20).keyword, 'هوش مصنوعی');
  assert.equal(parseCommand('/alert list', 10, 20).action, 'alert_list');
  assert.equal(parseCommand('/alert remove abc12345', 10, 20).alert_id, 'abc12345');
  assert.equal(parseCommand('/add private-channel', 10, 20).action, 'reply');
});
