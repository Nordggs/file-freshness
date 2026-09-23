import type { FileFreshnessSettings } from "./types";

export const DEFAULT_SETTINGS: FileFreshnessSettings = {
  enabled: true,
  freshMinutes: 60,
  recentMinutes: 180,
  freshColor: "#52C41A",
  recentColor: "#FAAD14",
  freshBg: "rgba(82, 196, 26, 0.12)",
  recentBg: "rgba(250, 173, 20, 0.12)",
  showDot: true,
  showText: false,
  showBackground: false,
  showLeftBar: false,
  refreshIntervalSec: 60,
};

/** Allowed auto-refresh range in seconds: [15, 60] (plan v6, Audit2). */
export const MIN_REFRESH_SEC = 15;
export const MAX_REFRESH_SEC = 60;

/** Clamp the refresh interval; garbage falls back to the default. */
export function clampRefreshInterval(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SETTINGS.refreshIntervalSec;
  return Math.min(MAX_REFRESH_SEC, Math.max(MIN_REFRESH_SEC, value));
}

/**
 * Parse an exact numeric input from a settings text field.
 * Returns `fallback` for empty/garbage/non-positive input.
 */
export function parsePositiveInt(text: string, fallback: number): number {
  const value = Math.floor(Number(text.trim()));
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

/**
 * Normalize age thresholds: fresh is at least 1 minute, recent is always
 * strictly above fresh. Returns the effective pair (UI should reflect it).
 */
export function normalizeThresholds(
  freshMinutes: number,
  recentMinutes: number,
): { freshMinutes: number; recentMinutes: number } {
  const fresh = Math.max(1, Math.floor(Number.isFinite(freshMinutes) ? freshMinutes : 1));
  const recent = Math.max(
    fresh + 1,
    Math.floor(Number.isFinite(recentMinutes) ? recentMinutes : fresh + 1),
  );
  return { freshMinutes: fresh, recentMinutes: recent };
}
