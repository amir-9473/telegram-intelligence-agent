'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('live-export Parse Command replies are ASCII-only and preserve command routing', () => {
  const workflow = JSON.parse(fs.readFileSync('n8n/workflows/01_bot_control.json', 'utf8'));
  const parser = workflow.nodes.find((node) => node.name === 'Parse Command');
  assert.ok(parser, 'Parse Command node must exist');
  const code = parser.parameters.jsCode;
  assert.doesNotMatch(code, /[^\x00-\x7F]/);
  assert.match(code, /Welcome to Telegram Intelligence Agent!/);
  assert.match(code, /action:command\.slice\(1\)/);
  for (const action of ['list', 'latest', 'ask', 'digest', 'alert_add', 'alert_list', 'alert_remove']) {
    assert.match(code, new RegExp(`action:'${action}'`));
  }
});

test('fixed Telegram interface replies are ASCII-safe', () => {
  const workflow = JSON.parse(fs.readFileSync('n8n/workflows/01_bot_control.json', 'utf8'));
  const names = [
    'Parse Command', 'Send Telegram Reply', 'Duplicate Subscription Reply', 'Added Reply',
    'Removed Reply', 'Missing Subscription Reply', 'Format Subscription List', 'Format Latest',
    'Format On-demand Digest', 'Alert Added Reply', 'Format Alert List',
    'Alert Removed Reply', 'Alert Missing Reply',
  ];
  for (const name of names) {
    const current = workflow.nodes.find((node) => node.name === name);
    assert.ok(current, `${name} must exist`);
    assert.doesNotMatch(JSON.stringify(current.parameters), /[^\x00-\x7F]/, `${name} contains unsafe fixed Unicode text`);
  }
});

test('scheduled Telegram reply templates are ASCII-safe', () => {
  const checks = {
    'n8n/workflows/02_channel_collector.json': ['Normalize Collector Error', 'Notify Collector Error'],
    'n8n/workflows/03_enrichment_alerts.json': ['Format Alert', 'Send Alert'],
    'n8n/workflows/04_daily_digest.json': ['Build Daily Digests', 'Send Daily Digest'],
  };
  for (const [file, names] of Object.entries(checks)) {
    const workflow = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const name of names) {
      const current = workflow.nodes.find((node) => node.name === name);
      assert.ok(current, `${name} must exist`);
      assert.doesNotMatch(JSON.stringify(current.parameters), /[^\x00-\x7F]/, `${name} contains unsafe fixed Unicode text`);
    }
  }
});
