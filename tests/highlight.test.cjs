'use strict';

// Tests for src/highlight.ts (DOM layer, document injected via jsdom):
// updateFileElement / refreshExplorer / clearHighlight / CSS variables.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const {
  FRESH_CLASS,
  RECENT_CLASS,
  updateFileElement,
  refreshExplorer,
  clearHighlight,
  applyCssVariables,
  clearCssVariables,
} = require('../lib/highlight.js');
const { DEFAULT_SETTINGS } = require('../lib/settings.js');

const NOW = 1_700_000_000_000;
const MIN = 60_000;

function makeDoc() {
  const dom = new JSDOM(`<!DOCTYPE html><body>
    <div class="nav-files-container">
      <div class="nav-folder">
        <div class="tree-item-self nav-folder-title" data-path="Notes">Notes</div>
        <div class="nav-folder-children">
          <div class="nav-file"><div class="tree-item-self nav-file-title" data-path="Notes/fresh.md">fresh.md</div></div>
          <div class="nav-file"><div class="tree-item-self nav-file-title is-active" data-path="Notes/recent.md">recent.md</div></div>
          <div class="nav-file"><div class="tree-item-self nav-file-title iconize-test" data-path="Notes/old.md">old.md</div></div>
          <div class="nav-file"><div class="tree-item-self nav-file-title" data-path="Notes/unknown.md">unknown.md</div></div>
        </div>
      </div>
    </div>
  </body>`);
  return dom.window.document;
}

function cache() {
  return new Map([
    ['Notes/fresh.md', NOW - 10 * MIN],
    ['Notes/recent.md', NOW - 61 * MIN],
    ['Notes/old.md', NOW - 200 * MIN],
  ]);
}

test('updateFileElement paints fresh / recent / none', () => {
  const doc = makeDoc();
  const fresh = doc.querySelector('[data-path="Notes/fresh.md"]');
  const recent = doc.querySelector('[data-path="Notes/recent.md"]');
  const old = doc.querySelector('[data-path="Notes/old.md"]');
  updateFileElement(fresh, NOW - 10 * MIN, DEFAULT_SETTINGS, NOW);
  updateFileElement(recent, NOW - 61 * MIN, DEFAULT_SETTINGS, NOW);
  updateFileElement(old, NOW - 200 * MIN, DEFAULT_SETTINGS, NOW);
  assert.equal(fresh.classList.contains(FRESH_CLASS), true);
  assert.equal(recent.classList.contains(RECENT_CLASS), true);
  assert.equal(old.classList.contains(FRESH_CLASS), false);
  assert.equal(old.classList.contains(RECENT_CLASS), false);
});

test('updateFileElement transitions fresh → recent → none on same element', () => {
  const doc = makeDoc();
  const el = doc.querySelector('[data-path="Notes/fresh.md"]');
  updateFileElement(el, NOW - 10 * MIN, DEFAULT_SETTINGS, NOW);
  assert.equal(el.classList.contains(FRESH_CLASS), true);
  updateFileElement(el, NOW - 100 * MIN, DEFAULT_SETTINGS, NOW);
  assert.equal(el.classList.contains(FRESH_CLASS), false);
  assert.equal(el.classList.contains(RECENT_CLASS), true);
  updateFileElement(el, NOW - 300 * MIN, DEFAULT_SETTINGS, NOW);
  assert.equal(el.classList.contains(FRESH_CLASS), false);
  assert.equal(el.classList.contains(RECENT_CLASS), false);
});

test('updateFileElement with undefined mtime removes own classes (cache miss)', () => {
  const doc = makeDoc();
  const el = doc.querySelector('[data-path="Notes/unknown.md"]');
  el.classList.add(FRESH_CLASS);
  updateFileElement(el, undefined, DEFAULT_SETTINGS, NOW);
  assert.equal(el.classList.contains(FRESH_CLASS), false);
  assert.equal(el.classList.contains(RECENT_CLASS), false);
});

test('updateFileElement never touches foreign classes (Iconize, active)', () => {
  const doc = makeDoc();
  const active = doc.querySelector('[data-path="Notes/recent.md"]');
  const iconized = doc.querySelector('[data-path="Notes/old.md"]');
  updateFileElement(active, NOW - 61 * MIN, DEFAULT_SETTINGS, NOW);
  updateFileElement(iconized, NOW - 200 * MIN, DEFAULT_SETTINGS, NOW);
  assert.equal(active.classList.contains('is-active'), true);
  assert.equal(iconized.classList.contains('iconize-test'), true);
});

test('refreshExplorer paints only .nav-file-title[data-path]', () => {
  const doc = makeDoc();
  const container = doc.querySelector('.nav-files-container');
  const folder = doc.querySelector('.nav-folder-title');
  refreshExplorer(container, cache(), DEFAULT_SETTINGS, NOW);
  assert.equal(doc.querySelector('[data-path="Notes/fresh.md"]').classList.contains(FRESH_CLASS), true);
  assert.equal(doc.querySelector('[data-path="Notes/recent.md"]').classList.contains(RECENT_CLASS), true);
  assert.equal(folder.classList.contains(FRESH_CLASS), false);
  assert.equal(folder.classList.contains(RECENT_CLASS), false);
  // unknown.md not in cache → no highlight
  const unknown = doc.querySelector('[data-path="Notes/unknown.md"]');
  assert.equal(unknown.classList.contains(FRESH_CLASS), false);
  assert.equal(unknown.classList.contains(RECENT_CLASS), false);
});

test('clearHighlight removes only own classes and is idempotent', () => {
  const doc = makeDoc();
  const container = doc.querySelector('.nav-files-container');
  refreshExplorer(container, cache(), DEFAULT_SETTINGS, NOW);
  clearHighlight(container);
  clearHighlight(container);
  clearHighlight(container);
  const titles = doc.querySelectorAll('.nav-file-title');
  for (const t of titles) {
    assert.equal(t.classList.contains(FRESH_CLASS), false);
    assert.equal(t.classList.contains(RECENT_CLASS), false);
  }
  // foreign classes survive cleanup
  assert.equal(doc.querySelector('[data-path="Notes/recent.md"]').classList.contains('is-active'), true);
  assert.equal(doc.querySelector('[data-path="Notes/old.md"]').classList.contains('iconize-test'), true);
});

test('applyCssVariables sets own vars + mode classes on body; clear removes them', () => {
  const doc = makeDoc();
  const body = doc.body;
  applyCssVariables(body, DEFAULT_SETTINGS);
  assert.equal(body.style.getPropertyValue('--file-freshness-fresh-color'), '#52C41A');
  assert.equal(body.style.getPropertyValue('--file-freshness-recent-color'), '#FAAD14');
  assert.ok(body.style.getPropertyValue('--file-freshness-fresh-bg').includes('82, 196, 26')
    || body.style.getPropertyValue('--file-freshness-fresh-bg').includes('82,196,26'));
  assert.equal(body.classList.contains('freshness-hide-dot'), false);

  const noDot = Object.assign({}, DEFAULT_SETTINGS, { showDot: false, showText: true });
  applyCssVariables(body, noDot);
  assert.equal(body.classList.contains('freshness-hide-dot'), true);
  assert.equal(body.classList.contains('freshness-show-text'), true);

  clearCssVariables(body);
  assert.equal(body.style.getPropertyValue('--file-freshness-fresh-color'), '');
  assert.equal(body.classList.contains('freshness-hide-dot'), false);
  assert.equal(body.classList.contains('freshness-show-text'), false);
});
