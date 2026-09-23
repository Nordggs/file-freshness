'use strict';

// Tests for src/cache.ts (pure, no Obsidian API): MtimeCache behavior.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MtimeCache } = require('../lib/cache.js');

test('set/get/has/size', () => {
  const c = new MtimeCache();
  assert.equal(c.size(), 0);
  c.set('a.md', 1000);
  assert.equal(c.get('a.md'), 1000);
  assert.equal(c.has('a.md'), true);
  assert.equal(c.has('b.md'), false);
  assert.equal(c.size(), 1);
});

test('repeated modify keeps the latest mtime (no queues)', () => {
  const c = new MtimeCache();
  c.set('a.md', 1000);
  c.set('a.md', 2000);
  assert.equal(c.get('a.md'), 2000);
  assert.equal(c.size(), 1);
});

test('delete removes entry', () => {
  const c = new MtimeCache();
  c.set('a.md', 1000);
  c.delete('a.md');
  assert.equal(c.get('a.md'), undefined);
  assert.equal(c.has('a.md'), false);
});

test('rename moves entry: old gone, new set', () => {
  const c = new MtimeCache();
  c.set('old.md', 1000);
  c.rename('old.md', 'new.md', 3000);
  assert.equal(c.get('old.md'), undefined);
  assert.equal(c.get('new.md'), 3000);
});

test('rebuild replaces the whole cache (folder rename/delete fallback)', () => {
  const c = new MtimeCache();
  c.set('stale.md', 1000);
  c.rebuild([
    { path: 'x.md', mtime: 10 },
    { path: 'y.md', mtime: 20 },
  ]);
  assert.equal(c.get('stale.md'), undefined);
  assert.equal(c.get('x.md'), 10);
  assert.equal(c.get('y.md'), 20);
  assert.equal(c.size(), 2);
});

test('rebuild with empty list clears cache', () => {
  const c = new MtimeCache();
  c.set('a.md', 1);
  c.rebuild([]);
  assert.equal(c.size(), 0);
});
