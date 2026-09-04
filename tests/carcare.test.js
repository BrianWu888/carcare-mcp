import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_VEHICLE,
  DEFAULT_RECORDS,
  addMaintenanceRecord,
  calculateNextService,
  searchMaintenanceRecords,
  getRecommendedServices,
} from '../src/carcare.js';

test('adds a maintenance record with mileage, date, and generated id', () => {
  const records = addMaintenanceRecord(DEFAULT_RECORDS, {
    service: 'Engine Oil',
    mileage: 165200,
    date: '2026-09-03',
    notes: 'Synthetic oil change',
  });

  assert.equal(records.length, DEFAULT_RECORDS.length + 1);
  assert.deepEqual(records.at(-1), {
    id: 'engine-oil-165200-2026-09-03',
    service: 'Engine Oil',
    mileage: 165200,
    date: '2026-09-03',
    notes: 'Synthetic oil change',
  });
});

test('replaces an existing matching service-mileage-date record instead of duplicating', () => {
  const once = addMaintenanceRecord(DEFAULT_RECORDS, {
    service: 'Engine Oil',
    mileage: 165200,
    date: '2026-09-03',
    notes: 'First note',
  });
  const twice = addMaintenanceRecord(once, {
    service: 'Engine Oil',
    mileage: 165200,
    date: '2026-09-03',
    notes: 'Updated note',
  });

  assert.equal(twice.length, once.length);
  assert.equal(twice.at(-1).notes, 'Updated note');
});

test('calculates next service for oil from latest matching record', () => {
  const records = addMaintenanceRecord(DEFAULT_RECORDS, {
    service: 'Engine Oil',
    mileage: 165200,
    date: '2026-09-03',
  });

  assert.deepEqual(calculateNextService(DEFAULT_VEHICLE, records, 'Engine Oil'), {
    service: 'Engine Oil',
    lastMileage: 165200,
    nextMileage: 170200,
    milesRemaining: 5000,
    status: 'ok',
    intervalMiles: 5000,
  });
});

test('flags services due soon based on current mileage', () => {
  const vehicle = { ...DEFAULT_VEHICLE, mileage: 165200 };
  const recommendations = getRecommendedServices(vehicle, DEFAULT_RECORDS);

  assert.ok(recommendations.some((item) => item.service === 'Engine Oil' && item.status === 'due-soon'));
  assert.ok(recommendations.some((item) => item.service === 'Brake Fluid' && item.status === 'due'));
});

test('searches maintenance records by service name and notes', () => {
  const records = addMaintenanceRecord(DEFAULT_RECORDS, {
    service: 'Engine Oil',
    mileage: 165200,
    date: '2026-09-03',
    notes: 'Used 5W-30 synthetic',
  });

  assert.equal(searchMaintenanceRecords(records, 'synthetic').length, 1);
  assert.equal(searchMaintenanceRecords(records, 'Transmission').at(0).service, 'Transmission Fluid');
});
