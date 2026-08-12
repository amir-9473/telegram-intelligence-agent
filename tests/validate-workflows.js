'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const dir = path.join(__dirname, '..', 'n8n', 'workflows');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
assert.equal(files.length, 4, 'expected exactly four MVP workflows');

let telegramTriggers = 0;
const validDataTableOperations = new Set(['get', 'insert', 'update', 'upsert', 'rowExists', 'rowNotExists', 'deleteRows']);

for (const file of files) {
  const raw = fs.readFileSync(path.join(dir, file), 'utf8');
  assert.ok(!/(api[_-]?key|bot[_-]?token)\s*[=:]\s*["'][^"']+/i.test(raw), `${file}: possible secret`);
  const workflow = JSON.parse(raw);
  assert.equal(workflow.active, false, `${file}: exports must be inactive`);
  assert.equal(workflow.settings.saveDataSuccessExecution, 'none', `${file}: successful execution payloads must not be retained`);
  assert.equal(workflow.settings.saveDataErrorExecution, 'none', `${file}: error execution payloads must not be retained`);
  assert.ok(Array.isArray(workflow.nodes) && workflow.nodes.length > 0, `${file}: nodes missing`);
  const names = new Set(workflow.nodes.map((n) => n.name));
  assert.equal(names.size, workflow.nodes.length, `${file}: duplicate node names`);

  for (const n of workflow.nodes) {
    assert.equal(typeof n.type, 'string', `${file}/${n.name}: type missing`);
    assert.ok(Array.isArray(n.position) && n.position.length === 2, `${file}/${n.name}: invalid position`);
    assert.equal(n.credentials, undefined, `${file}/${n.name}: credential IDs must not be exported`);
    if (n.type === 'n8n-nodes-base.telegramTrigger') telegramTriggers += 1;
    if (n.type === 'n8n-nodes-base.dataTable') {
      assert.equal(n.typeVersion, 1.1, `${file}/${n.name}: Data Table version mismatch`);
      assert.ok(validDataTableOperations.has(n.parameters.operation), `${file}/${n.name}: invalid Data Table operation`);
      assert.equal(n.parameters.dataTableId.mode, 'name', `${file}/${n.name}: tables must use documented literal-name mode`);
      assert.ok(['subscriptions', 'messages', 'alerts', 'alert_deliveries'].includes(n.parameters.dataTableId.value), `${file}/${n.name}: unknown table`);
    }
    if (n.type === 'n8n-nodes-base.code') {
      // n8n wraps Code-node source in a function; this checks JavaScript syntax without executing it.
      new Function(n.parameters.jsCode);
    }
  }

  for (const [source, outputs] of Object.entries(workflow.connections)) {
    assert.ok(names.has(source), `${file}: connection source ${source} missing`);
    for (const output of outputs.main || []) for (const edge of output) assert.ok(names.has(edge.node), `${file}: connection target ${edge.node} missing`);
  }
  console.log(`validated ${file}: ${workflow.nodes.length} nodes`);
}

assert.equal(telegramTriggers, 1, 'exactly one Telegram Trigger must exist across all workflows');

const bot = JSON.parse(fs.readFileSync(path.join(dir, '01_bot_control.json'), 'utf8'));
const botCode = (name) => bot.nodes.find((node) => node.name === name)?.parameters?.jsCode || '';
assert.match(botCode('Build QA Request'), /allowed\.has/, 'Q&A must be restricted to the user watchlist');
assert.match(botCode('Format On-demand Digest'), /allowed\.has/, 'on-demand digest must be restricted to the user watchlist');
assert.ok(bot.nodes.some((node) => node.name === 'Route User Scope'), 'latest/list/Q&A/digest user-scope router missing');

const enrichment = JSON.parse(fs.readFileSync(path.join(dir, '03_enrichment_alerts.json'), 'utf8'));
const alertCode = enrichment.nodes.find((node) => node.name === 'Match Alerts')?.parameters?.jsCode || '';
assert.ok(enrichment.nodes.some((node) => node.name === 'Get Alert Subscriptions'), 'alert subscription scope lookup missing');
assert.match(alertCode, /allowed\.has/, 'alerts must be restricted to active subscriptions for their chat');
console.log('workflow validation passed');
