import type { CachedFile } from "./types";

/**
 * Source of truth for modification times: vault path → mtime.
 * Pure (no Obsidian API) so it is unit-testable. The DOM is only a
 * view: a missing element never removes a cache entry.
 */
export class MtimeCache {
  private readonly map = new Map<string, number>();

  set(path: string, mtime: number): void {
    this.map.set(path, mtime);
  }

  get(path: string): number | undefined {
    return this.map.get(path);
  }

  has(path: string): boolean {
    return this.map.has(path);
  }

  delete(path: string): void {
    this.map.delete(path);
  }

  rename(oldPath: string, newPath: string, mtime: number): void {
    this.map.delete(oldPath);
    this.map.set(newPath, mtime);
  }

  /** Full rebuild (rare: folder rename/delete fallback). */
  rebuild(files: CachedFile[]): void {
    this.map.clear();
    for (const f of files) this.map.set(f.path, f.mtime);
  }

  size(): number {
    return this.map.size;
  }
}
