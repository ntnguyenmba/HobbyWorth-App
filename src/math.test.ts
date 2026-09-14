import assert from 'node:assert/strict';
import test from 'node:test';
import {calc} from './math';

test('calculates project values', () => {
  const result = calc({cost: '20', minutes: '60', yield: '4', price: '8'});
  assert.deepEqual(result, {cost: 20, minutes: 60, yieldCount: 4, price: 8, leftover: 12, perUnit: 3, costPerUnit: 5, perHour: 12, breakEven: 3});
});

test('uses an explicitly completed zero cost split', () => {
  const result = calc({cost: '99', minutes: '10', yield: '2', price: '5'}, {materials: '0', packaging: '0', fees: '0'});
  assert.equal(result.cost, 0);
  assert.equal(result.leftover, 10);
});

test('uses lump cost when every split field is blank', () => {
  assert.equal(calc({cost: '40', minutes: '10', yield: '2', price: '5'}, {materials: '', packaging: '', fees: ''}).cost, 40);
});

test('handles zero divisors', () => {
  const result = calc({cost: '10', minutes: '0', yield: '0', price: '0'});
  assert.equal(result.perUnit, 0);
  assert.equal(result.perHour, 0);
  assert.equal(result.breakEven, 0);
});
