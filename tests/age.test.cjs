'use strict';

// Tests for src/age.ts (pure): classifyAge() with strict ticket boundaries.
// Boundary contract (Audit2): ageMs < freshMs → fresh; ageMs < recentMs →
// recent; else none. Exactly 60 min → recent, exactly 180 min → none.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classifyAge, MIN_TO_MS } = require('../lib/age.js');

const NOW = 1_700_000_000_000;
const MIN = 60_000;
const age = (minutes) => NOW - minutes * MIN;

test('fresh: age below first threshold', () => {
  assert.equal(classifyAge(age(0), NOW, 60, 180), 'fresh');
  assert.equal(classifyAge(age(30), NOW, 60, 180), 'fresh');
  assert.equal(classifyAge(age(59), NOW, 60, 180), 'fresh');
});

test('boundary 60 min → recent (strict <)', () => {
  assert.equal(classifyAge(age(60), NOW, 60, 180), 'recent');
  assert.equal(classifyAge(age(61), NOW, 60, 180), 'recent');
  assert.equal(classifyAge(age(179), NOW, 60, 180), 'recent');
});

test('boundary 180 min → none (strict <)', () => {
  assert.equal(classifyAge(age(180), NOW, 60, 180), 'none');
  assert.equal(classifyAge(age(181), NOW, 60, 180), 'none');
  assert.equal(classifyAge(age(24 * 60), NOW, 60, 180), 'none');
});

test('future mtime → fresh (even far future)', () => {
  assert.equal(classifyAge(NOW + 30_000, NOW, 60, 180), 'fresh');
  assert.equal(classifyAge(NOW + 3 * 24 * 3_600_000, NOW, 60, 180), 'fresh');
});

test('custom thresholds are respected', () => {
  assert.equal(classifyAge(age(10), NOW, 15, 30), 'fresh');
  assert.equal(classifyAge(age(15), NOW, 15, 30), 'recent');
  assert.equal(classifyAge(age(29), NOW, 15, 30), 'recent');
  assert.equal(classifyAge(age(30), NOW, 15, 30), 'none');
});

test('MIN_TO_MS constant', () => {
  assert.equal(MIN_TO_MS, 60_000);
});
