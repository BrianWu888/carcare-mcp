import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = () => readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = () => readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

test('static app exposes core dashboard, form, and WebMCP hooks', () => {
  const page = html();
  const script = app();
  assert.match(page, /id="vehicle-card"/);
  assert.match(page, /id="history-list"/);
  assert.match(page, /id="add-maintenance-form"/);
  assert.match(page, /id="webmcp-self-test"/);
  assert.match(page, /2011 Toyota Sienna/);
  assert.match(page, /165,200 miles/);
  assert.match(page, /Engine Oil/);
  assert.match(page, /Transmission Fluid/);
  assert.match(script, /document\.modelContext/);
  assert.match(script, /getTools\(\)/);
  assert.match(script, /executeTool/);
  assert.match(script, /registerTool/);
  assert.match(script, /name:\s*['"]get_vehicle['"]/);
  assert.match(script, /name:\s*['"]add_maintenance_record['"]/);
  assert.match(script, /name:\s*['"]calculate_next_service['"]/);
});
