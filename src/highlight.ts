import { classifyAge } from "./age";
import type { FileFreshnessSettings } from "./types";

export const FRESH_CLASS = "file-age-fresh";
export const RECENT_CLASS = "file-age-recent";

/** Only file rows are ever touched — never folder titles. */
const FILE_TITLE_SELECTOR = ".nav-file-title[data-path]";

export const CSS_VAR_FRESH_COLOR = "--file-freshness-fresh-color";
export const CSS_VAR_RECENT_COLOR = "--file-freshness-recent-color";
export const CSS_VAR_FRESH_BG = "--file-freshness-fresh-bg";
export const CSS_VAR_RECENT_BG = "--file-freshness-recent-bg";

const MODE_CLASSES = [
  "freshness-show-text",
  "freshness-show-background",
  "freshness-show-leftbar",
  "freshness-hide-dot",
] as const;

function removeOwnClasses(el: Element): void {
  el.classList.remove(FRESH_CLASS, RECENT_CLASS);
}

/**
 * Paint a single Explorer row. `mtime === undefined` (not in cache,
 * e.g. non-Markdown) removes highlighting. Foreign classes
 * (Iconize, is-active, …) are never touched.
 */
export function updateFileElement(
  el: Element,
  mtime: number | undefined,
  settings: FileFreshnessSettings,
  now: number,
): void {
  removeOwnClasses(el);
  if (mtime === undefined) return;
  const state = classifyAge(mtime, now, settings.freshMinutes, settings.recentMinutes);
  if (state === "fresh") el.classList.add(FRESH_CLASS);
  else if (state === "recent") el.classList.add(RECENT_CLASS);
}

/** Minimal lookup surface so tests can pass a plain Map. */
export interface MtimeLookup {
  get(path: string): number | undefined;
}

/** Repaint all currently rendered file rows from the cache. */
export function refreshExplorer(
  container: ParentNode,
  cache: MtimeLookup,
  settings: FileFreshnessSettings,
  now: number,
): void {
  const rows = container.querySelectorAll(FILE_TITLE_SELECTOR);
  rows.forEach((row) => {
    const path = row.getAttribute("data-path");
    updateFileElement(row, path === null ? undefined : cache.get(path), settings, now);
  });
}

/** Idempotent: safe to call any number of times. */
export function clearHighlight(container: ParentNode): void {
  const rows = container.querySelectorAll(`.${FRESH_CLASS}, .${RECENT_CLASS}`);
  rows.forEach(removeOwnClasses);
}

/**
 * Publish settings as CSS variables + body mode classes, once.
 * Changing colors/toggles never requires a DOM walk.
 */
export function applyCssVariables(
  body: HTMLElement,
  settings: FileFreshnessSettings,
): void {
  const style = body.style;
  style.setProperty(CSS_VAR_FRESH_COLOR, settings.freshColor);
  style.setProperty(CSS_VAR_RECENT_COLOR, settings.recentColor);
  style.setProperty(CSS_VAR_FRESH_BG, settings.freshBg);
  style.setProperty(CSS_VAR_RECENT_BG, settings.recentBg);
  body.classList.toggle("freshness-show-text", settings.showText);
  body.classList.toggle("freshness-show-background", settings.showBackground);
  body.classList.toggle("freshness-show-leftbar", settings.showLeftBar);
  body.classList.toggle("freshness-hide-dot", !settings.showDot);
}

/** Remove only the plugin's own variables and mode classes. */
export function clearCssVariables(body: HTMLElement): void {
  body.style.removeProperty(CSS_VAR_FRESH_COLOR);
  body.style.removeProperty(CSS_VAR_RECENT_COLOR);
  body.style.removeProperty(CSS_VAR_FRESH_BG);
  body.style.removeProperty(CSS_VAR_RECENT_BG);
  for (const cls of MODE_CLASSES) body.classList.remove(cls);
}
