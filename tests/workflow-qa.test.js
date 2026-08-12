'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflow = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'n8n', 'workflows', '01_bot_control.json'), 'utf8'));
const nodeCode = (name) => workflow.nodes.find((node) => node.name === name).parameters.jsCode;

function executeFormat(response, question = 'آخرین پیام مهن درباره چیست؟') {
  const build = {
    chat_id: 'test-chat',
    context: [{ id: 1, text: 'اعتقادات هنوز زنده است', summary: '', url: 'https://t.me/example/10' }],
  };
  const lookup = (name) => ({ first: () => ({ json: name === 'Build QA Request' ? build : { question } }) });
  return new Function('$json', '$', nodeCode('Format QA Reply'))(response, lookup);
}

test('Q&A request disables reasoning and normalizes the known typo', () => {
  const code = nodeCode('Build QA Request');
  assert.match(code, /reasoning:\{effort:'none'\}/);
  assert.match(code, /replace\(\/\\u0645\\u0647\\u0646\/g,'\\u0645\\u0647\\u0645'\)/);
});

test('Q&A accepts fenced JSON returned in the reasoning field', () => {
  const result = executeFormat({ choices: [{ message: { content: '', reasoning: '```json\n{"has_answer":true,"answer":"پاسخ مستند","source_ids":[1]}\n```' } }] });
  assert.match(result[0].json.reply, /پاسخ مستند/);
  assert.match(result[0].json.reply, /https:\/\/t\.me\/example\/10/);
});

test('latest-message question has a grounded fallback on provider error', () => {
  const result = executeFormat({ error: { code: 502, message: 'provider unavailable' } });
  assert.match(result[0].json.reply, /اعتقادات هنوز زنده است/);
  assert.match(result[0].json.reply, /https:\/\/t\.me\/example\/10/);
  assert.doesNotMatch(result[0].json.reply, /اطلاعات کافی/);
});

test('arbitrary question reports provider failure instead of false no-context', () => {
  const result = executeFormat({ error: { code: 401, message: 'invalid credentials' } }, 'اقتصاد چه تغییری کرده؟');
  assert.match(result[0].json.reply, /AI service is temporarily unavailable/);
});
