'use strict';

// Tests for pure settings validation in src/settings.ts:
// refreshIntervalSec clamp [15, 60], threshold normalization.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_SETTINGS,
  clampRefreshInterval,
  normalizeThresholds,
  parsePositiveInt,
} = require('../lib/settings.js');

test('clampRefreshInterval keeps [15, 60]', () => {
  assert.equal(clampRefreshInterval(60), 60);
  assert.equal(clampRefreshInterval(30), 30);
  assert.equal(clampRefreshInterval(15), 15);
  assert.equal(clampRefreshInterval(0), 15);
  assert.equal(clampRefreshInterval(5), 15);
  assert.equal(clampRefreshInterval(61), 60);
  assert.equal(clampRefreshInterval(3600), 60);
});

test('clampRefreshInterval falls back to default on garbage', () => {
  assert.equal(clampRefreshInterval(NaN), 60);
  assert.equal(clampRefreshInterval(Number.POSITIVE_INFINITY), 60);
});

test('normalizeThresholds keeps valid pair', () => {
  assert.deepEqual(normalizeThresholds(60, 180), { freshMinutes: 60, recentMinutes: 180 });
});

test('normalizeThresholds fixes swapped pair', () => {
  // fresh wins, recent is pushed above it — never silently swapped.
  assert.deepEqual(normalizeThresholds(180, 60), { freshMinutes: 180, recentMinutes: 181 });
});

test('normalizeThresholds enforces minimums', () => {
  assert.deepEqual(normalizeThresholds(0, 0), { freshMinutes: 1, recentMinutes: 2 });
  assert.deepEqual(normalizeThresholds(-5, 10), { freshMinutes: 1, recentMinutes: 10 });
  assert.deepEqual(normalizeThresholds(60, 60), { freshMinutes: 60, recentMinutes: 61 });
});

test('parsePositiveInt reads exact input, falls back on garbage', () => {
  assert.equal(parsePositiveInt('45', 60), 45);
  assert.equal(parsePositiveInt('  7  ', 60), 7);
  assert.equal(parsePositiveInt('12.9', 60), 12);
  assert.equal(parsePositiveInt('', 60), 60);
  assert.equal(parsePositiveInt('abc', 60), 60);
  assert.equal(parsePositiveInt('0', 60), 60);
  assert.equal(parsePositiveInt('-3', 60), 60);
});

test('DEFAULT_SETTINGS match plan v6', () => {
  assert.equal(DEFAULT_SETTINGS.enabled, true);
  assert.equal(DEFAULT_SETTINGS.freshMinutes, 60);
  assert.equal(DEFAULT_SETTINGS.recentMinutes, 180);
  assert.equal(DEFAULT_SETTINGS.freshColor, '#52C41A');
  assert.equal(DEFAULT_SETTINGS.recentColor, '#FAAD14');
  assert.equal(DEFAULT_SETTINGS.showDot, true);
  assert.equal(DEFAULT_SETTINGS.showText, false);
  assert.equal(DEFAULT_SETTINGS.showBackground, false);
  assert.equal(DEFAULT_SETTINGS.showLeftBar, false);
  assert.equal(DEFAULT_SETTINGS.refreshIntervalSec, 60);
});
