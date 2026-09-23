import type { AgeState } from "./types";

/** Milliseconds in one minute. Settings store minutes, internals use ms. */
export const MIN_TO_MS = 60_000;

/**
 * Classify a file by its modification age.
 *
 * Strict ticket boundaries (Audit2): ageMs < freshMs → fresh,
 * ageMs < recentMs → recent, otherwise none. Exactly `freshMinutes`
 * is already recent, exactly `recentMinutes` is already none.
 * Future mtime (clock skew) is always fresh.
 */
export function classifyAge(
  mtime: number,
  now: number,
  freshMinutes: number,
  recentMinutes: number,
): AgeState {
  const ageMs = now - mtime;
  if (ageMs < freshMinutes * MIN_TO_MS) return "fresh";
  if (ageMs < recentMinutes * MIN_TO_MS) return "recent";
  return "none";
}
