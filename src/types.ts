/** Freshness state of a file derived from its modification age. */
export type AgeState = "fresh" | "recent" | "none";

/** Minimal file identity used to seed / rebuild the mtime cache. */
export interface CachedFile {
  path: string;
  mtime: number;
}

export interface FileFreshnessSettings {
  enabled: boolean;
  /** First age threshold in minutes (< freshMinutes → fresh). */
  freshMinutes: number;
  /** Second age threshold in minutes (< recentMinutes → recent, else none). */
  recentMinutes: number;
  freshColor: string;
  recentColor: string;
  freshBg: string;
  recentBg: string;
  /** Default indicator: colored dot left of the file name. */
  showDot: boolean;
  showText: boolean;
  showBackground: boolean;
  showLeftBar: boolean;
  /** Auto-refresh period in seconds, clamped to [15, 60]. */
  refreshIntervalSec: number;
}
