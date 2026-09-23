import { Plugin, TAbstractFile, TFile, TFolder } from "obsidian";
import { MtimeCache } from "./cache";
import {
  applyCssVariables,
  clearCssVariables,
  clearHighlight,
  refreshExplorer,
  updateFileElement,
} from "./highlight";
import {
  DEFAULT_SETTINGS,
  clampRefreshInterval,
  normalizeThresholds,
} from "./settings";
import { FileFreshnessSettingTab } from "./settingsTab";
import type { FileFreshnessSettings } from "./types";

const EXPLORER_CONTAINER_SELECTOR = ".nav-files-container";
const EXPLORER_FALLBACK_SELECTOR = '.workspace-leaf-content[data-type="file-explorer"]';
const FILE_ROW_SELECTOR = ".nav-file-title[data-path]";

export default class FileFreshnessPlugin extends Plugin {
  settings: FileFreshnessSettings = { ...DEFAULT_SETTINGS };
  private cache = new MtimeCache();
  private observer: MutationObserver | null = null;
  private rafId = 0;
  private timerId = 0;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new FileFreshnessSettingTab(this.app, this));
    this.addCommand({
      id: "refresh-file-freshness",
      name: "Refresh file freshness now",
      callback: () => this.refreshAll(),
    });
    this.app.workspace.onLayoutReady(() => this.initialize());
  }

  onunload(): void {
    this.teardown();
    const container = this.findExplorerContainer();
    if (container) clearHighlight(container);
    clearCssVariables(document.body);
  }

  async loadSettings(): Promise<void> {
    const data = (await this.loadData()) as Partial<FileFreshnessSettings>;
    const merged = Object.assign({}, DEFAULT_SETTINGS, data);
    const { freshMinutes, recentMinutes } = normalizeThresholds(
      merged.freshMinutes,
      merged.recentMinutes,
    );
    merged.freshMinutes = freshMinutes;
    merged.recentMinutes = recentMinutes;
    merged.refreshIntervalSec = clampRefreshInterval(merged.refreshIntervalSec);
    this.settings = merged;
  }

  async saveSettings(): Promise<void> {
    const { freshMinutes, recentMinutes } = normalizeThresholds(
      this.settings.freshMinutes,
      this.settings.recentMinutes,
    );
    this.settings.freshMinutes = freshMinutes;
    this.settings.recentMinutes = recentMinutes;
    this.settings.refreshIntervalSec = clampRefreshInterval(this.settings.refreshIntervalSec);
    await this.saveData(this.settings);
    if (this.timerId) this.restartTimer();
    this.applyAll();
  }

  /** Publish settings, then repaint once (no waiting for the timer). */
  applyAll(): void {
    if (!this.settings.enabled) {
      const container = this.findExplorerContainer();
      if (container) clearHighlight(container);
      clearCssVariables(document.body);
      return;
    }
    applyCssVariables(document.body, this.settings);
    this.refreshAll();
  }

  /** Full repaint of currently rendered rows from the cache. */
  refreshAll(): void {
    if (!this.settings.enabled) return;
    const container = this.findExplorerContainer();
    if (container) refreshExplorer(container, this.cache, this.settings, Date.now());
  }

  private initialize(): void {
    const container = this.findExplorerContainer();
    if (!container) {
      window.setTimeout(() => this.initialize(), 1000);
      return;
    }
    this.rebuildCache();
    this.applyAll();

    this.registerEvent(this.app.vault.on("modify", (f) => this.onUpsert(f)));
    this.registerEvent(this.app.vault.on("create", (f) => this.onUpsert(f)));
    this.registerEvent(this.app.vault.on("delete", (f) => this.onDelete(f)));
    this.registerEvent(this.app.vault.on("rename", (f, oldPath) => this.onRename(f, oldPath)));

    this.observer = new MutationObserver((mutations) => this.onMutations(mutations, container));
    this.observer.observe(container, { childList: true, subtree: true });

    this.restartTimer();
  }

  private teardown(): void {
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = 0;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private restartTimer(): void {
    if (this.timerId) window.clearInterval(this.timerId);
    this.timerId = window.setInterval(
      () => this.refreshAll(),
      this.settings.refreshIntervalSec * 1000,
    );
  }

  private findExplorerContainer(): Element | null {
    const root = this.app.workspace.containerEl;
    return (
      root.querySelector(EXPLORER_CONTAINER_SELECTOR) ??
      root.querySelector(EXPLORER_FALLBACK_SELECTOR)
    );
  }

  private rebuildCache(): void {
    this.cache.rebuild(
      this.app.vault.getMarkdownFiles().map((f) => ({ path: f.path, mtime: f.stat.mtime })),
    );
  }

  private static isMdFile(f: TAbstractFile): f is TFile {
    return f instanceof TFile && f.extension === "md";
  }

  private findRow(path: string): Element | null {
    const container = this.findExplorerContainer();
    if (!container) return null;
    return container.querySelector(`${FILE_ROW_SELECTOR}[data-path="${CSS.escape(path)}"]`);
  }

  private paintRow(path: string): void {
    if (!this.settings.enabled) return;
    const row = this.findRow(path);
    if (row) updateFileElement(row, this.cache.get(path), this.settings, Date.now());
  }

  private onUpsert(f: TAbstractFile): void {
    if (f instanceof TFolder) return;
    if (!FileFreshnessPlugin.isMdFile(f)) return;
    this.cache.set(f.path, f.stat.mtime);
    this.paintRow(f.path);
  }

  private onDelete(f: TAbstractFile): void {
    if (f instanceof TFolder) {
      // Nested .md paths change without per-file events — one rare rebuild.
      this.rebuildCache();
      this.refreshAll();
      return;
    }
    if (!FileFreshnessPlugin.isMdFile(f)) return;
    this.cache.delete(f.path);
    const row = this.findRow(f.path);
    if (row) updateFileElement(row, undefined, this.settings, Date.now());
  }

  private onRename(f: TAbstractFile, oldPath: string): void {
    if (f instanceof TFolder) {
      this.rebuildCache();
      this.refreshAll();
      return;
    }
    if (!FileFreshnessPlugin.isMdFile(f)) return;
    this.cache.rename(oldPath, f.path, f.stat.mtime);
    // The DOM row may be recreated or updated in place — match by new path.
    this.paintRow(f.path);
    const stale = this.findRow(oldPath);
    if (stale) updateFileElement(stale, undefined, this.settings, Date.now());
  }

  private onMutations(mutations: MutationRecord[], container: Element): void {
    if (!this.settings.enabled) return;
    const fresh: Element[] = [];
    for (const m of mutations) {
      for (const node of Array.from(m.addedNodes)) {
        if (!(node instanceof Element)) continue;
        if (node.matches(FILE_ROW_SELECTOR)) fresh.push(node);
        node.querySelectorAll(FILE_ROW_SELECTOR).forEach((el) => fresh.push(el));
      }
    }
    if (fresh.length === 0) return;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      if (!this.settings.enabled) return;
      const now = Date.now();
      for (const el of fresh) {
        if (!el.isConnected) continue;
        const path = el.getAttribute("data-path");
        updateFileElement(el, path === null ? undefined : this.cache.get(path), this.settings, now);
      }
    });
  }
}
