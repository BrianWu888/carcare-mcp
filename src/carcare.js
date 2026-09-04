export const DEFAULT_VEHICLE = {
  id: '2011-toyota-sienna',
  year: 2011,
  make: 'Toyota',
  model: 'Sienna',
  engine: '3.5L V6',
  mileage: 165200,
};

export const DEFAULT_RECORDS = [
  {
    id: 'transmission-fluid-160000-2026-07-20',
    service: 'Transmission Fluid',
    mileage: 160000,
    date: '2026-07-20',
    notes: 'Drain and fill automatic transmission fluid.',
  },
  {
    id: 'engine-oil-163000-2026-08-01',
    service: 'Engine Oil',
    mileage: 163000,
    date: '2026-08-01',
    notes: 'Oil and filter change.',
  },
  {
    id: 'brake-pads-150000-2026-03-18',
    service: 'Brake Pads',
    mileage: 150000,
    date: '2026-03-18',
    notes: 'Front pads replaced.',
  },
  {
    id: 'air-filter-155000-2026-05-12',
    service: 'Air Filter',
    mileage: 155000,
    date: '2026-05-12',
    notes: 'Cabin and engine air filter inspected; engine filter replaced.',
  },
];

export const SERVICE_RULES = {
  'Engine Oil': { intervalMiles: 5000, dueSoonMiles: 3000 },
  'Transmission Fluid': { intervalMiles: 30000, dueSoonMiles: 3000 },
  'Brake Pads': { intervalMiles: 30000, dueSoonMiles: 3000 },
  'Air Filter': { intervalMiles: 15000, dueSoonMiles: 2000 },
  'Brake Fluid': { intervalMiles: 30000, dueSoonMiles: 3000 },
  'Tire Rotation': { intervalMiles: 5000, dueSoonMiles: 1000 },
};

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeRecord(input) {
  const service = String(input.service || '').trim();
  const mileage = Number(input.mileage);
  const date = input.date || todayISO();
  const notes = String(input.notes || '').trim();

  if (!service) throw new Error('service is required');
  if (!Number.isFinite(mileage) || mileage < 0) throw new Error('mileage must be a positive number');

  return {
    id: `${slugify(service)}-${Math.round(mileage)}-${date}`,
    service,
    mileage: Math.round(mileage),
    date,
    notes,
  };
}

export function addMaintenanceRecord(records, input) {
  const nextRecord = normalizeRecord(input);
  const withoutDuplicate = records.filter((record) => record.id !== nextRecord.id);
  return [...withoutDuplicate, nextRecord].sort((a, b) => a.mileage - b.mileage || a.date.localeCompare(b.date));
}

export function searchMaintenanceRecords(records, query = '') {
  const needle = String(query).trim().toLowerCase();
  if (!needle) return [...records];
  return records.filter((record) => `${record.service} ${record.mileage} ${record.date} ${record.notes}`.toLowerCase().includes(needle));
}

export function latestRecordFor(records, service) {
  return records
    .filter((record) => record.service.toLowerCase() === String(service).toLowerCase())
    .sort((a, b) => b.mileage - a.mileage || b.date.localeCompare(a.date))[0] || null;
}

function serviceStatus(milesRemaining, dueSoonMiles) {
  if (milesRemaining <= 0) return 'due';
  if (milesRemaining <= dueSoonMiles) return 'due-soon';
  return 'ok';
}

export function calculateNextService(vehicle, records, service = 'Engine Oil') {
  const rule = SERVICE_RULES[service] || SERVICE_RULES['Engine Oil'];
  const latest = latestRecordFor(records, service);
  const lastMileage = latest?.mileage ?? 0;
  const nextMileage = lastMileage + rule.intervalMiles;
  const milesRemaining = nextMileage - Number(vehicle.mileage || 0);

  return {
    service,
    lastMileage,
    nextMileage,
    milesRemaining,
    status: serviceStatus(milesRemaining, rule.dueSoonMiles),
    intervalMiles: rule.intervalMiles,
  };
}

export function getRecommendedServices(vehicle, records) {
  return Object.keys(SERVICE_RULES)
    .map((service) => calculateNextService(vehicle, records, service))
    .filter((item) => item.status !== 'ok')
    .sort((a, b) => a.milesRemaining - b.milesRemaining);
}

export function seedState() {
  return {
    vehicle: { ...DEFAULT_VEHICLE },
    records: DEFAULT_RECORDS.map((record) => ({ ...record })),
  };
}
