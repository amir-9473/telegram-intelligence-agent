'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const compose = fs.readFileSync(path.join(root, 'compose.yaml'), 'utf8');
const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const bootstrap = JSON.parse(fs.readFileSync(path.join(root, 'n8n', 'bootstrap', '00_create_data_tables.json'), 'utf8'));

test('production compose pins n8n and keeps stateful services private', () => {
  const postgresService = compose.split('\n  n8n:\n')[0];
  assert.match(compose, /docker\.n8n\.io\/n8nio\/n8n:\$\{N8N_VERSION:-2\.38\.7\}/);
  assert.match(compose, /n8nio\/runners:\$\{N8N_VERSION:-2\.38\.7\}/);
  assert.match(compose, /127\.0\.0\.1:\$\{N8N_LOCAL_PORT:-5678\}:5678/);
  assert.doesNotMatch(postgresService, /\n    ports:/);
  assert.match(compose, /N8N_RUNNERS_MODE: external/);
  assert.match(compose, /EXECUTIONS_DATA_SAVE_ON_ERROR: none/);
  assert.match(compose, /EXECUTIONS_DATA_SAVE_ON_SUCCESS: none/);
});

test('example environment contains placeholders rather than live secrets', () => {
  assert.match(envExample, /N8N_ENCRYPTION_KEY=replace-with-a-long-random-value/);
  assert.match(envExample, /POSTGRES_PASSWORD=replace-with-a-long-random-value/);
  assert.doesNotMatch(envExample, /sk-or-v1-|\d{6,}:[A-Za-z0-9_-]{20,}/);
});

test('bootstrap workflow creates all required data tables idempotently', () => {
  const expected = new Set(['subscriptions', 'messages', 'alerts', 'alert_deliveries']);
  const createNodes = bootstrap.nodes.filter((node) => node.type === 'n8n-nodes-base.dataTable');
  assert.deepEqual(new Set(createNodes.map((node) => node.parameters.tableName)), expected);
  for (const node of createNodes) {
    assert.equal(node.parameters.resource, 'table');
    assert.equal(node.parameters.operation, 'create');
    assert.equal(node.parameters.options.createIfNotExists, true);
  }
});
