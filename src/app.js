import {
  DEFAULT_VEHICLE,
  DEFAULT_RECORDS,
  addMaintenanceRecord,
  calculateNextService,
  getRecommendedServices,
  searchMaintenanceRecords,
} from './carcare.js';

const STORAGE_KEY = 'carcare-mcp-state-v1';
const state = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.warn('Unable to read saved CarCare state', error);
  }
  return {
    vehicle: { ...DEFAULT_VEHICLE },
    records: DEFAULT_RECORDS.map((record) => ({ ...record })),
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatMiles(value) {
  return Number(value).toLocaleString('en-US');
}

function statusLabel(status) {
  return status === 'due' ? 'Due now' : status === 'due-soon' ? 'Due soon' : 'OK';
}

function renderVehicle() {
  const vehicle = state.vehicle;
  document.querySelector('#vehicle-card').innerHTML = `
    <p class="eyebrow">My Vehicle</p>
    <h2>${vehicle.year} ${vehicle.make} ${vehicle.model}</h2>
    <p>${vehicle.engine}</p>
    <strong>${formatMiles(vehicle.mileage)} miles</strong>
  `;
}

function renderHistory(records = state.records) {
  const sorted = [...records].sort((a, b) => b.mileage - a.mileage || b.date.localeCompare(a.date));
  document.querySelector('#history-list').innerHTML = sorted
    .map((record) => `
      <li class="record-card">
        <div>
          <strong>${record.service}</strong>
          <span>${formatMiles(record.mileage)} miles · ${record.date}</span>
          ${record.notes ? `<small>${record.notes}</small>` : ''}
        </div>
        <span aria-label="completed">✓</span>
      </li>
    `)
    .join('');
}

function renderRecommended() {
  const recommendations = getRecommendedServices(state.vehicle, state.records);
  document.querySelector('#recommended-list').innerHTML = recommendations.length
    ? recommendations
        .map((item) => `
          <li class="recommendation ${item.status}">
            <strong>⚠️ ${item.service}</strong>
            <span>${statusLabel(item.status)} · next at ${formatMiles(item.nextMileage)} miles</span>
          </li>
        `)
        .join('')
    : '<li class="recommendation ok"><strong>✅ All caught up</strong><span>No service is currently due.</span></li>';
}

function renderNextService(service = 'Engine Oil') {
  const next = calculateNextService(state.vehicle, state.records, service);
  document.querySelector('#next-service').innerHTML = `
    <strong>${next.service}</strong>
    <span>Last: ${formatMiles(next.lastMileage)} miles</span>
    <span>Next: ${formatMiles(next.nextMileage)} miles</span>
    <span class="pill ${next.status}">${statusLabel(next.status)}</span>
  `;
}

function renderAll() {
  renderVehicle();
  renderHistory();
  renderRecommended();
  renderNextService();
}

export function appGetVehicle() {
  return { ...state.vehicle };
}

export function appGetMaintenanceHistory() {
  return state.records.map((record) => ({ ...record })).sort((a, b) => b.mileage - a.mileage || b.date.localeCompare(a.date));
}

export function appAddMaintenanceRecord(input) {
  state.records = addMaintenanceRecord(state.records, input);
  if (Number(input.mileage) > Number(state.vehicle.mileage)) {
    state.vehicle.mileage = Math.round(Number(input.mileage));
  }
  saveState();
  renderAll();
  return {
    ok: true,
    added: state.records.find((record) => record.id === `${String(input.service).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Math.round(Number(input.mileage))}-${input.date || new Date().toISOString().slice(0, 10)}`),
    history: appGetMaintenanceHistory(),
  };
}

export function appCalculateNextService(input = {}) {
  const service = input.service || 'Engine Oil';
  return calculateNextService(state.vehicle, state.records, service);
}

export function appSearchMaintenanceRecords(input = {}) {
  return searchMaintenanceRecords(state.records, input.query || '');
}

async function registerWebMCPTools() {
  const modelContext = document.modelContext;
  const registerTool = modelContext?.registerTool?.bind(modelContext);
  const status = document.querySelector('#webmcp-status');
  if (!registerTool) {
    if (status) status.textContent = 'WebMCP API unavailable in this browser: document.modelContext.registerTool is missing. The UI still works normally.';
    console.info('WebMCP document.modelContext.registerTool is not available in this browser yet. UI still works normally.');
    return;
  }

  await registerTool({
    name: 'get_vehicle',
    description: 'Return the current vehicle profile including year, make, model, engine, and mileage.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async () => appGetVehicle(),
  });

  await registerTool({
    name: 'get_maintenance_history',
    description: 'Return the vehicle maintenance history sorted by most recent mileage first.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async () => appGetMaintenanceHistory(),
  });

  await registerTool({
    name: 'add_maintenance_record',
    description: 'Add or update a maintenance record and refresh the dashboard.',
    inputSchema: {
      type: 'object',
      properties: {
        service: { type: 'string', description: 'Service name, such as Engine Oil or Brake Fluid.' },
        mileage: { type: 'number', description: 'Odometer mileage when the service was performed.' },
        date: { type: 'string', description: 'ISO date, for example 2026-09-03.' },
        notes: { type: 'string', description: 'Optional service notes.' },
      },
      required: ['service', 'mileage'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false },
    execute: async (input) => appAddMaintenanceRecord(input),
  });

  await registerTool({
    name: 'calculate_next_service',
    description: 'Calculate the next recommended mileage and due status for a maintenance service.',
    inputSchema: {
      type: 'object',
      properties: {
        service: { type: 'string', description: 'Service name. Defaults to Engine Oil.' },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: async (input) => appCalculateNextService(input),
  });

  await registerTool({
    name: 'search_maintenance_records',
    description: 'Search maintenance history by service, mileage, date, or notes.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term, such as oil, synthetic, or 160000.' },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: async (input) => appSearchMaintenanceRecords(input),
  });

  if (status) status.textContent = 'WebMCP API available: registered 5 tools. Click self-test to list and execute a read-only tool.';
}

async function runWebMCPSelfTest() {
  const output = document.querySelector('#webmcp-self-test-output');
  const status = document.querySelector('#webmcp-status');
  if (!output) return;
  output.textContent = '';

  const modelContext = document.modelContext;
  if (!modelContext?.getTools || !modelContext?.executeTool) {
    const message = 'This browser tab does not expose document.modelContext.getTools/executeTool. Enable chrome://flags/#enable-webmcp-testing, fully quit Chrome, reopen Chrome, then reload this page.';
    output.textContent = message;
    if (status) status.textContent = 'WebMCP self-test failed: API unavailable in this tab.';
    return;
  }

  try {
    const tools = await modelContext.getTools();
    const names = tools.map((tool) => tool.name).sort();
    const vehicleTool = tools.find((tool) => tool.name === 'get_vehicle');
    let vehicleResult = null;
    if (vehicleTool) {
      vehicleResult = await modelContext.executeTool(vehicleTool, '{}');
    }
    output.textContent = JSON.stringify({
      modelContext: true,
      toolCount: tools.length,
      tools: names,
      getVehicleResult: vehicleResult,
    }, null, 2);
    if (status) status.textContent = `WebMCP self-test passed: found ${tools.length} tools in this Chrome tab.`;
  } catch (error) {
    output.textContent = `WebMCP self-test error: ${error?.message || error}`;
    if (status) status.textContent = 'WebMCP self-test failed while listing or executing tools.';
  }
}

function wireEvents() {
  document.querySelector('#add-maintenance-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    appAddMaintenanceRecord({
      service: form.get('service'),
      mileage: Number(form.get('mileage')),
      date: form.get('date'),
      notes: form.get('notes'),
    });
    event.currentTarget.reset();
  });

  document.querySelector('#search-box').addEventListener('input', (event) => {
    renderHistory(searchMaintenanceRecords(state.records, event.target.value));
  });

  document.querySelector('#reset-demo').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  });

  document.querySelector('#webmcp-self-test')?.addEventListener('click', () => {
    runWebMCPSelfTest();
  });
}

window.CarCareMCP = {
  get_vehicle: appGetVehicle,
  get_maintenance_history: appGetMaintenanceHistory,
  add_maintenance_record: appAddMaintenanceRecord,
  calculate_next_service: appCalculateNextService,
  search_maintenance_records: appSearchMaintenanceRecords,
};

wireEvents();
renderAll();
registerWebMCPTools();
