"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => FileFreshnessPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// src/cache.ts
var MtimeCache = class {
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  set(path, mtime) {
    this.map.set(path, mtime);
  }
  get(path) {
    return this.map.get(path);
  }
  has(path) {
    return this.map.has(path);
  }
  delete(path) {
    this.map.delete(path);
  }
  rename(oldPath, newPath, mtime) {
    this.map.delete(oldPath);
    this.map.set(newPath, mtime);
  }
  /** Full rebuild (rare: folder rename/delete fallback). */
  rebuild(files) {
    this.map.clear();
    for (const f of files) this.map.set(f.path, f.mtime);
  }
  size() {
    return this.map.size;
  }
};

// src/age.ts
var MIN_TO_MS = 6e4;
function classifyAge(mtime, now, freshMinutes, recentMinutes) {
  const ageMs = now - mtime;
  if (ageMs < freshMinutes * MIN_TO_MS) return "fresh";
  if (ageMs < recentMinutes * MIN_TO_MS) return "recent";
  return "none";
}

// src/highlight.ts
var FRESH_CLASS = "file-age-fresh";
var RECENT_CLASS = "file-age-recent";
var FILE_TITLE_SELECTOR = ".nav-file-title[data-path]";
var CSS_VAR_FRESH_COLOR = "--file-freshness-fresh-color";
var CSS_VAR_RECENT_COLOR = "--file-freshness-recent-color";
var CSS_VAR_FRESH_BG = "--file-freshness-fresh-bg";
var CSS_VAR_RECENT_BG = "--file-freshness-recent-bg";
var MODE_CLASSES = [
  "freshness-show-text",
  "freshness-show-background",
  "freshness-show-leftbar",
  "freshness-hide-dot"
];
function removeOwnClasses(el) {
  el.classList.remove(FRESH_CLASS, RECENT_CLASS);
}
function updateFileElement(el, mtime, settings, now) {
  removeOwnClasses(el);
  if (mtime === void 0) return;
  const state = classifyAge(mtime, now, settings.freshMinutes, settings.recentMinutes);
  if (state === "fresh") el.classList.add(FRESH_CLASS);
  else if (state === "recent") el.classList.add(RECENT_CLASS);
}
function refreshExplorer(container, cache, settings, now) {
  const rows = container.querySelectorAll(FILE_TITLE_SELECTOR);
  rows.forEach((row) => {
    const path = row.getAttribute("data-path");
    updateFileElement(row, path === null ? void 0 : cache.get(path), settings, now);
  });
}
function clearHighlight(container) {
  const rows = container.querySelectorAll(`.${FRESH_CLASS}, .${RECENT_CLASS}`);
  rows.forEach(removeOwnClasses);
}
function applyCssVariables(body, settings) {
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
function clearCssVariables(body) {
  body.style.removeProperty(CSS_VAR_FRESH_COLOR);
  body.style.removeProperty(CSS_VAR_RECENT_COLOR);
  body.style.removeProperty(CSS_VAR_FRESH_BG);
  body.style.removeProperty(CSS_VAR_RECENT_BG);
  for (const cls of MODE_CLASSES) body.classList.remove(cls);
}

// src/settings.ts
var DEFAULT_SETTINGS = {
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
  refreshIntervalSec: 60
};
var MIN_REFRESH_SEC = 15;
var MAX_REFRESH_SEC = 60;
function clampRefreshInterval(value) {
  if (!Number.isFinite(value)) return DEFAULT_SETTINGS.refreshIntervalSec;
  return Math.min(MAX_REFRESH_SEC, Math.max(MIN_REFRESH_SEC, value));
}
function parsePositiveInt(text, fallback) {
  const value = Math.floor(Number(text.trim()));
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}
function normalizeThresholds(freshMinutes, recentMinutes) {
  const fresh = Math.max(1, Math.floor(Number.isFinite(freshMinutes) ? freshMinutes : 1));
  const recent = Math.max(
    fresh + 1,
    Math.floor(Number.isFinite(recentMinutes) ? recentMinutes : fresh + 1)
  );
  return { freshMinutes: fresh, recentMinutes: recent };
}

// src/settingsTab.ts
var import_obsidian = require("obsidian");
var FileFreshnessSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Enable fresh file highlighting").setDesc("When off, all highlighting is removed and background work stops.").addToggle(
      (t) => t.setValue(this.plugin.settings.enabled).onChange(async (v) => {
        this.plugin.settings.enabled = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Fresh threshold (minutes)").setDesc("Files modified less than this ago are highlighted as fresh.").addSlider(
      (s) => s.setLimits(1, 720, 1).setValue(this.plugin.settings.freshMinutes).setDynamicTooltip().onChange(async (v) => {
        this.plugin.settings.freshMinutes = v;
        await this.plugin.saveSettings();
        this.display();
      })
    ).addText(
      (t) => t.setPlaceholder("60").setValue(String(this.plugin.settings.freshMinutes)).onChange(async (v) => {
        this.plugin.settings.freshMinutes = parsePositiveInt(
          v,
          this.plugin.settings.freshMinutes
        );
        await this.plugin.saveSettings();
        this.display();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Recent threshold (minutes)").setDesc("Files between the fresh and this threshold are highlighted as recent. Older files use the theme style.").addSlider(
      (s) => s.setLimits(2, 1440, 1).setValue(this.plugin.settings.recentMinutes).setDynamicTooltip().onChange(async (v) => {
        this.plugin.settings.recentMinutes = v;
        await this.plugin.saveSettings();
        this.display();
      })
    ).addText(
      (t) => t.setPlaceholder("180").setValue(String(this.plugin.settings.recentMinutes)).onChange(async (v) => {
        this.plugin.settings.recentMinutes = parsePositiveInt(
          v,
          this.plugin.settings.recentMinutes
        );
        await this.plugin.saveSettings();
        this.display();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Fresh color").addColorPicker(
      (c) => c.setValue(this.plugin.settings.freshColor).onChange(async (v) => {
        this.plugin.settings.freshColor = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Recent color").addColorPicker(
      (c) => c.setValue(this.plugin.settings.recentColor).onChange(async (v) => {
        this.plugin.settings.recentColor = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Show dot indicator").setDesc("Colored dot left of the file name (default indicator).").addToggle(
      (t) => t.setValue(this.plugin.settings.showDot).onChange(async (v) => {
        this.plugin.settings.showDot = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Highlight file name text").setDesc("Also recolor the file name. Off by default to avoid conflicts with themes and manual colors.").addToggle(
      (t) => t.setValue(this.plugin.settings.showText).onChange(async (v) => {
        this.plugin.settings.showText = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Highlight row background").addToggle(
      (t) => t.setValue(this.plugin.settings.showBackground).onChange(async (v) => {
        this.plugin.settings.showBackground = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Show left bar").addToggle(
      (t) => t.setValue(this.plugin.settings.showLeftBar).onChange(async (v) => {
        this.plugin.settings.showLeftBar = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Auto-refresh interval (seconds)").setDesc("How often rendered rows are re-evaluated. Allowed range: 15\u201360.").addSlider(
      (s) => s.setLimits(15, 60, 1).setValue(this.plugin.settings.refreshIntervalSec).setDynamicTooltip().onChange(async (v) => {
        this.plugin.settings.refreshIntervalSec = v;
        await this.plugin.saveSettings();
        this.display();
      })
    ).addText(
      (t) => t.setPlaceholder("60").setValue(String(this.plugin.settings.refreshIntervalSec)).onChange(async (v) => {
        this.plugin.settings.refreshIntervalSec = parsePositiveInt(
          v,
          this.plugin.settings.refreshIntervalSec
        );
        await this.plugin.saveSettings();
        this.display();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Refresh now").setDesc("Repaint currently rendered files immediately.").addButton(
      (b) => b.setButtonText("Refresh").onClick(() => this.plugin.refreshAll())
    );
  }
};

// src/main.ts
var EXPLORER_CONTAINER_SELECTOR = ".nav-files-container";
var EXPLORER_FALLBACK_SELECTOR = '.workspace-leaf-content[data-type="file-explorer"]';
var FILE_ROW_SELECTOR = ".nav-file-title[data-path]";
var FileFreshnessPlugin = class _FileFreshnessPlugin extends import_obsidian2.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { ...DEFAULT_SETTINGS };
    this.cache = new MtimeCache();
    this.observer = null;
    this.rafId = 0;
    this.timerId = 0;
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new FileFreshnessSettingTab(this.app, this));
    this.addCommand({
      id: "refresh-file-freshness",
      name: "Refresh file freshness now",
      callback: () => this.refreshAll()
    });
    this.app.workspace.onLayoutReady(() => this.initialize());
  }
  onunload() {
    this.teardown();
    const container = this.findExplorerContainer();
    if (container) clearHighlight(container);
    clearCssVariables(document.body);
  }
  async loadSettings() {
    const data = await this.loadData();
    const merged = Object.assign({}, DEFAULT_SETTINGS, data);
    const { freshMinutes, recentMinutes } = normalizeThresholds(
      merged.freshMinutes,
      merged.recentMinutes
    );
    merged.freshMinutes = freshMinutes;
    merged.recentMinutes = recentMinutes;
    merged.refreshIntervalSec = clampRefreshInterval(merged.refreshIntervalSec);
    this.settings = merged;
  }
  async saveSettings() {
    const { freshMinutes, recentMinutes } = normalizeThresholds(
      this.settings.freshMinutes,
      this.settings.recentMinutes
    );
    this.settings.freshMinutes = freshMinutes;
    this.settings.recentMinutes = recentMinutes;
    this.settings.refreshIntervalSec = clampRefreshInterval(this.settings.refreshIntervalSec);
    await this.saveData(this.settings);
    if (this.timerId) this.restartTimer();
    this.applyAll();
  }
  /** Publish settings, then repaint once (no waiting for the timer). */
  applyAll() {
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
  refreshAll() {
    if (!this.settings.enabled) return;
    const container = this.findExplorerContainer();
    if (container) refreshExplorer(container, this.cache, this.settings, Date.now());
  }
  initialize() {
    const container = this.findExplorerContainer();
    if (!container) {
      window.setTimeout(() => this.initialize(), 1e3);
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
  teardown() {
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
  restartTimer() {
    if (this.timerId) window.clearInterval(this.timerId);
    this.timerId = window.setInterval(
      () => this.refreshAll(),
      this.settings.refreshIntervalSec * 1e3
    );
  }
  findExplorerContainer() {
    const root = this.app.workspace.containerEl;
    return root.querySelector(EXPLORER_CONTAINER_SELECTOR) ?? root.querySelector(EXPLORER_FALLBACK_SELECTOR);
  }
  rebuildCache() {
    this.cache.rebuild(
      this.app.vault.getFiles().map((f) => ({ path: f.path, mtime: f.stat.mtime }))
    );
  }
  static isTrackableFile(f) {
    return f instanceof import_obsidian2.TFile;
  }
  findRow(path) {
    const container = this.findExplorerContainer();
    if (!container) return null;
    return container.querySelector(`${FILE_ROW_SELECTOR}[data-path="${CSS.escape(path)}"]`);
  }
  paintRow(path) {
    if (!this.settings.enabled) return;
    const row = this.findRow(path);
    if (row) updateFileElement(row, this.cache.get(path), this.settings, Date.now());
  }
  onUpsert(f) {
    if (f instanceof import_obsidian2.TFolder) return;
    if (!_FileFreshnessPlugin.isTrackableFile(f)) return;
    this.cache.set(f.path, f.stat.mtime);
    this.paintRow(f.path);
  }
  onDelete(f) {
    if (f instanceof import_obsidian2.TFolder) {
      this.rebuildCache();
      this.refreshAll();
      return;
    }
    if (!_FileFreshnessPlugin.isTrackableFile(f)) return;
    this.cache.delete(f.path);
    const row = this.findRow(f.path);
    if (row) updateFileElement(row, void 0, this.settings, Date.now());
  }
  onRename(f, oldPath) {
    if (f instanceof import_obsidian2.TFolder) {
      this.rebuildCache();
      this.refreshAll();
      return;
    }
    if (!_FileFreshnessPlugin.isTrackableFile(f)) return;
    this.cache.rename(oldPath, f.path, f.stat.mtime);
    this.paintRow(f.path);
    const stale = this.findRow(oldPath);
    if (stale) updateFileElement(stale, void 0, this.settings, Date.now());
  }
  onMutations(mutations, container) {
    if (!this.settings.enabled) return;
    const fresh = [];
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
        updateFileElement(el, path === null ? void 0 : this.cache.get(path), this.settings, now);
      }
    });
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL2NhY2hlLnRzIiwgInNyYy9hZ2UudHMiLCAic3JjL2hpZ2hsaWdodC50cyIsICJzcmMvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzVGFiLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBQbHVnaW4sIFRBYnN0cmFjdEZpbGUsIFRGaWxlLCBURm9sZGVyIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBNdGltZUNhY2hlIH0gZnJvbSBcIi4vY2FjaGVcIjtcbmltcG9ydCB7XG4gIGFwcGx5Q3NzVmFyaWFibGVzLFxuICBjbGVhckNzc1ZhcmlhYmxlcyxcbiAgY2xlYXJIaWdobGlnaHQsXG4gIHJlZnJlc2hFeHBsb3JlcixcbiAgdXBkYXRlRmlsZUVsZW1lbnQsXG59IGZyb20gXCIuL2hpZ2hsaWdodFwiO1xuaW1wb3J0IHtcbiAgREVGQVVMVF9TRVRUSU5HUyxcbiAgY2xhbXBSZWZyZXNoSW50ZXJ2YWwsXG4gIG5vcm1hbGl6ZVRocmVzaG9sZHMsXG59IGZyb20gXCIuL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBGaWxlRnJlc2huZXNzU2V0dGluZ1RhYiB9IGZyb20gXCIuL3NldHRpbmdzVGFiXCI7XG5pbXBvcnQgdHlwZSB7IEZpbGVGcmVzaG5lc3NTZXR0aW5ncyB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmNvbnN0IEVYUExPUkVSX0NPTlRBSU5FUl9TRUxFQ1RPUiA9IFwiLm5hdi1maWxlcy1jb250YWluZXJcIjtcbmNvbnN0IEVYUExPUkVSX0ZBTExCQUNLX1NFTEVDVE9SID0gJy53b3Jrc3BhY2UtbGVhZi1jb250ZW50W2RhdGEtdHlwZT1cImZpbGUtZXhwbG9yZXJcIl0nO1xuY29uc3QgRklMRV9ST1dfU0VMRUNUT1IgPSBcIi5uYXYtZmlsZS10aXRsZVtkYXRhLXBhdGhdXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZpbGVGcmVzaG5lc3NQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5nczogRmlsZUZyZXNobmVzc1NldHRpbmdzID0geyAuLi5ERUZBVUxUX1NFVFRJTkdTIH07XG4gIHByaXZhdGUgY2FjaGUgPSBuZXcgTXRpbWVDYWNoZSgpO1xuICBwcml2YXRlIG9ic2VydmVyOiBNdXRhdGlvbk9ic2VydmVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgcmFmSWQgPSAwO1xuICBwcml2YXRlIHRpbWVySWQgPSAwO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgRmlsZUZyZXNobmVzc1NldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwicmVmcmVzaC1maWxlLWZyZXNobmVzc1wiLFxuICAgICAgbmFtZTogXCJSZWZyZXNoIGZpbGUgZnJlc2huZXNzIG5vd1wiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHRoaXMucmVmcmVzaEFsbCgpLFxuICAgIH0pO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbkxheW91dFJlYWR5KCgpID0+IHRoaXMuaW5pdGlhbGl6ZSgpKTtcbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMudGVhcmRvd24oKTtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmZpbmRFeHBsb3JlckNvbnRhaW5lcigpO1xuICAgIGlmIChjb250YWluZXIpIGNsZWFySGlnaGxpZ2h0KGNvbnRhaW5lcik7XG4gICAgY2xlYXJDc3NWYXJpYWJsZXMoZG9jdW1lbnQuYm9keSk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZGF0YSA9IChhd2FpdCB0aGlzLmxvYWREYXRhKCkpIGFzIFBhcnRpYWw8RmlsZUZyZXNobmVzc1NldHRpbmdzPjtcbiAgICBjb25zdCBtZXJnZWQgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBkYXRhKTtcbiAgICBjb25zdCB7IGZyZXNoTWludXRlcywgcmVjZW50TWludXRlcyB9ID0gbm9ybWFsaXplVGhyZXNob2xkcyhcbiAgICAgIG1lcmdlZC5mcmVzaE1pbnV0ZXMsXG4gICAgICBtZXJnZWQucmVjZW50TWludXRlcyxcbiAgICApO1xuICAgIG1lcmdlZC5mcmVzaE1pbnV0ZXMgPSBmcmVzaE1pbnV0ZXM7XG4gICAgbWVyZ2VkLnJlY2VudE1pbnV0ZXMgPSByZWNlbnRNaW51dGVzO1xuICAgIG1lcmdlZC5yZWZyZXNoSW50ZXJ2YWxTZWMgPSBjbGFtcFJlZnJlc2hJbnRlcnZhbChtZXJnZWQucmVmcmVzaEludGVydmFsU2VjKTtcbiAgICB0aGlzLnNldHRpbmdzID0gbWVyZ2VkO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgZnJlc2hNaW51dGVzLCByZWNlbnRNaW51dGVzIH0gPSBub3JtYWxpemVUaHJlc2hvbGRzKFxuICAgICAgdGhpcy5zZXR0aW5ncy5mcmVzaE1pbnV0ZXMsXG4gICAgICB0aGlzLnNldHRpbmdzLnJlY2VudE1pbnV0ZXMsXG4gICAgKTtcbiAgICB0aGlzLnNldHRpbmdzLmZyZXNoTWludXRlcyA9IGZyZXNoTWludXRlcztcbiAgICB0aGlzLnNldHRpbmdzLnJlY2VudE1pbnV0ZXMgPSByZWNlbnRNaW51dGVzO1xuICAgIHRoaXMuc2V0dGluZ3MucmVmcmVzaEludGVydmFsU2VjID0gY2xhbXBSZWZyZXNoSW50ZXJ2YWwodGhpcy5zZXR0aW5ncy5yZWZyZXNoSW50ZXJ2YWxTZWMpO1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gICAgaWYgKHRoaXMudGltZXJJZCkgdGhpcy5yZXN0YXJ0VGltZXIoKTtcbiAgICB0aGlzLmFwcGx5QWxsKCk7XG4gIH1cblxuICAvKiogUHVibGlzaCBzZXR0aW5ncywgdGhlbiByZXBhaW50IG9uY2UgKG5vIHdhaXRpbmcgZm9yIHRoZSB0aW1lcikuICovXG4gIGFwcGx5QWxsKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5zZXR0aW5ncy5lbmFibGVkKSB7XG4gICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmZpbmRFeHBsb3JlckNvbnRhaW5lcigpO1xuICAgICAgaWYgKGNvbnRhaW5lcikgY2xlYXJIaWdobGlnaHQoY29udGFpbmVyKTtcbiAgICAgIGNsZWFyQ3NzVmFyaWFibGVzKGRvY3VtZW50LmJvZHkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhcHBseUNzc1ZhcmlhYmxlcyhkb2N1bWVudC5ib2R5LCB0aGlzLnNldHRpbmdzKTtcbiAgICB0aGlzLnJlZnJlc2hBbGwoKTtcbiAgfVxuXG4gIC8qKiBGdWxsIHJlcGFpbnQgb2YgY3VycmVudGx5IHJlbmRlcmVkIHJvd3MgZnJvbSB0aGUgY2FjaGUuICovXG4gIHJlZnJlc2hBbGwoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmVuYWJsZWQpIHJldHVybjtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmZpbmRFeHBsb3JlckNvbnRhaW5lcigpO1xuICAgIGlmIChjb250YWluZXIpIHJlZnJlc2hFeHBsb3Jlcihjb250YWluZXIsIHRoaXMuY2FjaGUsIHRoaXMuc2V0dGluZ3MsIERhdGUubm93KCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBpbml0aWFsaXplKCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuZmluZEV4cGxvcmVyQ29udGFpbmVyKCk7XG4gICAgaWYgKCFjb250YWluZXIpIHtcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuaW5pdGlhbGl6ZSgpLCAxMDAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5yZWJ1aWxkQ2FjaGUoKTtcbiAgICB0aGlzLmFwcGx5QWxsKCk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAudmF1bHQub24oXCJtb2RpZnlcIiwgKGYpID0+IHRoaXMub25VcHNlcnQoZikpKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAudmF1bHQub24oXCJjcmVhdGVcIiwgKGYpID0+IHRoaXMub25VcHNlcnQoZikpKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAudmF1bHQub24oXCJkZWxldGVcIiwgKGYpID0+IHRoaXMub25EZWxldGUoZikpKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAudmF1bHQub24oXCJyZW5hbWVcIiwgKGYsIG9sZFBhdGgpID0+IHRoaXMub25SZW5hbWUoZiwgb2xkUGF0aCkpKTtcblxuICAgIHRoaXMub2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigobXV0YXRpb25zKSA9PiB0aGlzLm9uTXV0YXRpb25zKG11dGF0aW9ucywgY29udGFpbmVyKSk7XG4gICAgdGhpcy5vYnNlcnZlci5vYnNlcnZlKGNvbnRhaW5lciwgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XG5cbiAgICB0aGlzLnJlc3RhcnRUaW1lcigpO1xuICB9XG5cbiAgcHJpdmF0ZSB0ZWFyZG93bigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50aW1lcklkKSB7XG4gICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVySWQpO1xuICAgICAgdGhpcy50aW1lcklkID0gMDtcbiAgICB9XG4gICAgaWYgKHRoaXMub2JzZXJ2ZXIpIHtcbiAgICAgIHRoaXMub2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgdGhpcy5vYnNlcnZlciA9IG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLnJhZklkKSB7XG4gICAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJhZklkKTtcbiAgICAgIHRoaXMucmFmSWQgPSAwO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVzdGFydFRpbWVyKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRpbWVySWQpIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMudGltZXJJZCk7XG4gICAgdGhpcy50aW1lcklkID0gd2luZG93LnNldEludGVydmFsKFxuICAgICAgKCkgPT4gdGhpcy5yZWZyZXNoQWxsKCksXG4gICAgICB0aGlzLnNldHRpbmdzLnJlZnJlc2hJbnRlcnZhbFNlYyAqIDEwMDAsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgZmluZEV4cGxvcmVyQ29udGFpbmVyKCk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCByb290ID0gdGhpcy5hcHAud29ya3NwYWNlLmNvbnRhaW5lckVsO1xuICAgIHJldHVybiAoXG4gICAgICByb290LnF1ZXJ5U2VsZWN0b3IoRVhQTE9SRVJfQ09OVEFJTkVSX1NFTEVDVE9SKSA/P1xuICAgICAgcm9vdC5xdWVyeVNlbGVjdG9yKEVYUExPUkVSX0ZBTExCQUNLX1NFTEVDVE9SKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHJlYnVpbGRDYWNoZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNhY2hlLnJlYnVpbGQoXG4gICAgICB0aGlzLmFwcC52YXVsdC5nZXRGaWxlcygpLm1hcCgoZikgPT4gKHsgcGF0aDogZi5wYXRoLCBtdGltZTogZi5zdGF0Lm10aW1lIH0pKSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgaXNUcmFja2FibGVGaWxlKGY6IFRBYnN0cmFjdEZpbGUpOiBmIGlzIFRGaWxlIHtcbiAgICByZXR1cm4gZiBpbnN0YW5jZW9mIFRGaWxlO1xuICB9XG5cbiAgcHJpdmF0ZSBmaW5kUm93KHBhdGg6IHN0cmluZyk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmZpbmRFeHBsb3JlckNvbnRhaW5lcigpO1xuICAgIGlmICghY29udGFpbmVyKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoYCR7RklMRV9ST1dfU0VMRUNUT1J9W2RhdGEtcGF0aD1cIiR7Q1NTLmVzY2FwZShwYXRoKX1cIl1gKTtcbiAgfVxuXG4gIHByaXZhdGUgcGFpbnRSb3cocGF0aDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmVuYWJsZWQpIHJldHVybjtcbiAgICBjb25zdCByb3cgPSB0aGlzLmZpbmRSb3cocGF0aCk7XG4gICAgaWYgKHJvdykgdXBkYXRlRmlsZUVsZW1lbnQocm93LCB0aGlzLmNhY2hlLmdldChwYXRoKSwgdGhpcy5zZXR0aW5ncywgRGF0ZS5ub3coKSk7XG4gIH1cblxuICBwcml2YXRlIG9uVXBzZXJ0KGY6IFRBYnN0cmFjdEZpbGUpOiB2b2lkIHtcbiAgICBpZiAoZiBpbnN0YW5jZW9mIFRGb2xkZXIpIHJldHVybjtcbiAgICBpZiAoIUZpbGVGcmVzaG5lc3NQbHVnaW4uaXNUcmFja2FibGVGaWxlKGYpKSByZXR1cm47XG4gICAgdGhpcy5jYWNoZS5zZXQoZi5wYXRoLCBmLnN0YXQubXRpbWUpO1xuICAgIHRoaXMucGFpbnRSb3coZi5wYXRoKTtcbiAgfVxuXG4gIHByaXZhdGUgb25EZWxldGUoZjogVEFic3RyYWN0RmlsZSk6IHZvaWQge1xuICAgIGlmIChmIGluc3RhbmNlb2YgVEZvbGRlcikge1xuICAgICAgLy8gTmVzdGVkIGZpbGUgcGF0aHMgY2hhbmdlIHdpdGhvdXQgcGVyLWZpbGUgZXZlbnRzIFx1MjAxNCBvbmUgcmFyZSByZWJ1aWxkLlxuICAgICAgdGhpcy5yZWJ1aWxkQ2FjaGUoKTtcbiAgICAgIHRoaXMucmVmcmVzaEFsbCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIUZpbGVGcmVzaG5lc3NQbHVnaW4uaXNUcmFja2FibGVGaWxlKGYpKSByZXR1cm47XG4gICAgdGhpcy5jYWNoZS5kZWxldGUoZi5wYXRoKTtcbiAgICBjb25zdCByb3cgPSB0aGlzLmZpbmRSb3coZi5wYXRoKTtcbiAgICBpZiAocm93KSB1cGRhdGVGaWxlRWxlbWVudChyb3csIHVuZGVmaW5lZCwgdGhpcy5zZXR0aW5ncywgRGF0ZS5ub3coKSk7XG4gIH1cblxuICBwcml2YXRlIG9uUmVuYW1lKGY6IFRBYnN0cmFjdEZpbGUsIG9sZFBhdGg6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmIChmIGluc3RhbmNlb2YgVEZvbGRlcikge1xuICAgICAgdGhpcy5yZWJ1aWxkQ2FjaGUoKTtcbiAgICAgIHRoaXMucmVmcmVzaEFsbCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIUZpbGVGcmVzaG5lc3NQbHVnaW4uaXNUcmFja2FibGVGaWxlKGYpKSByZXR1cm47XG4gICAgdGhpcy5jYWNoZS5yZW5hbWUob2xkUGF0aCwgZi5wYXRoLCBmLnN0YXQubXRpbWUpO1xuICAgIC8vIFRoZSBET00gcm93IG1heSBiZSByZWNyZWF0ZWQgb3IgdXBkYXRlZCBpbiBwbGFjZSBcdTIwMTQgbWF0Y2ggYnkgbmV3IHBhdGguXG4gICAgdGhpcy5wYWludFJvdyhmLnBhdGgpO1xuICAgIGNvbnN0IHN0YWxlID0gdGhpcy5maW5kUm93KG9sZFBhdGgpO1xuICAgIGlmIChzdGFsZSkgdXBkYXRlRmlsZUVsZW1lbnQoc3RhbGUsIHVuZGVmaW5lZCwgdGhpcy5zZXR0aW5ncywgRGF0ZS5ub3coKSk7XG4gIH1cblxuICBwcml2YXRlIG9uTXV0YXRpb25zKG11dGF0aW9uczogTXV0YXRpb25SZWNvcmRbXSwgY29udGFpbmVyOiBFbGVtZW50KTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmVuYWJsZWQpIHJldHVybjtcbiAgICBjb25zdCBmcmVzaDogRWxlbWVudFtdID0gW107XG4gICAgZm9yIChjb25zdCBtIG9mIG11dGF0aW9ucykge1xuICAgICAgZm9yIChjb25zdCBub2RlIG9mIEFycmF5LmZyb20obS5hZGRlZE5vZGVzKSkge1xuICAgICAgICBpZiAoIShub2RlIGluc3RhbmNlb2YgRWxlbWVudCkpIGNvbnRpbnVlO1xuICAgICAgICBpZiAobm9kZS5tYXRjaGVzKEZJTEVfUk9XX1NFTEVDVE9SKSkgZnJlc2gucHVzaChub2RlKTtcbiAgICAgICAgbm9kZS5xdWVyeVNlbGVjdG9yQWxsKEZJTEVfUk9XX1NFTEVDVE9SKS5mb3JFYWNoKChlbCkgPT4gZnJlc2gucHVzaChlbCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZnJlc2gubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgaWYgKHRoaXMucmFmSWQpIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuICAgIHRoaXMucmFmSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgdGhpcy5yYWZJZCA9IDA7XG4gICAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZW5hYmxlZCkgcmV0dXJuO1xuICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgIGZvciAoY29uc3QgZWwgb2YgZnJlc2gpIHtcbiAgICAgICAgaWYgKCFlbC5pc0Nvbm5lY3RlZCkgY29udGludWU7XG4gICAgICAgIGNvbnN0IHBhdGggPSBlbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXBhdGhcIik7XG4gICAgICAgIHVwZGF0ZUZpbGVFbGVtZW50KGVsLCBwYXRoID09PSBudWxsID8gdW5kZWZpbmVkIDogdGhpcy5jYWNoZS5nZXQocGF0aCksIHRoaXMuc2V0dGluZ3MsIG5vdyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgdHlwZSB7IENhY2hlZEZpbGUgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG4vKipcbiAqIFNvdXJjZSBvZiB0cnV0aCBmb3IgbW9kaWZpY2F0aW9uIHRpbWVzOiB2YXVsdCBwYXRoIFx1MjE5MiBtdGltZS5cbiAqIFB1cmUgKG5vIE9ic2lkaWFuIEFQSSkgc28gaXQgaXMgdW5pdC10ZXN0YWJsZS4gVGhlIERPTSBpcyBvbmx5IGFcbiAqIHZpZXc6IGEgbWlzc2luZyBlbGVtZW50IG5ldmVyIHJlbW92ZXMgYSBjYWNoZSBlbnRyeS5cbiAqL1xuZXhwb3J0IGNsYXNzIE10aW1lQ2FjaGUge1xuICBwcml2YXRlIHJlYWRvbmx5IG1hcCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgc2V0KHBhdGg6IHN0cmluZywgbXRpbWU6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMubWFwLnNldChwYXRoLCBtdGltZSk7XG4gIH1cblxuICBnZXQocGF0aDogc3RyaW5nKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5tYXAuZ2V0KHBhdGgpO1xuICB9XG5cbiAgaGFzKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm1hcC5oYXMocGF0aCk7XG4gIH1cblxuICBkZWxldGUocGF0aDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5tYXAuZGVsZXRlKHBhdGgpO1xuICB9XG5cbiAgcmVuYW1lKG9sZFBhdGg6IHN0cmluZywgbmV3UGF0aDogc3RyaW5nLCBtdGltZTogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5tYXAuZGVsZXRlKG9sZFBhdGgpO1xuICAgIHRoaXMubWFwLnNldChuZXdQYXRoLCBtdGltZSk7XG4gIH1cblxuICAvKiogRnVsbCByZWJ1aWxkIChyYXJlOiBmb2xkZXIgcmVuYW1lL2RlbGV0ZSBmYWxsYmFjaykuICovXG4gIHJlYnVpbGQoZmlsZXM6IENhY2hlZEZpbGVbXSk6IHZvaWQge1xuICAgIHRoaXMubWFwLmNsZWFyKCk7XG4gICAgZm9yIChjb25zdCBmIG9mIGZpbGVzKSB0aGlzLm1hcC5zZXQoZi5wYXRoLCBmLm10aW1lKTtcbiAgfVxuXG4gIHNpemUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5tYXAuc2l6ZTtcbiAgfVxufVxuIiwgImltcG9ydCB0eXBlIHsgQWdlU3RhdGUgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG4vKiogTWlsbGlzZWNvbmRzIGluIG9uZSBtaW51dGUuIFNldHRpbmdzIHN0b3JlIG1pbnV0ZXMsIGludGVybmFscyB1c2UgbXMuICovXG5leHBvcnQgY29uc3QgTUlOX1RPX01TID0gNjBfMDAwO1xuXG4vKipcbiAqIENsYXNzaWZ5IGEgZmlsZSBieSBpdHMgbW9kaWZpY2F0aW9uIGFnZS5cbiAqXG4gKiBTdHJpY3QgdGlja2V0IGJvdW5kYXJpZXMgKEF1ZGl0Mik6IGFnZU1zIDwgZnJlc2hNcyBcdTIxOTIgZnJlc2gsXG4gKiBhZ2VNcyA8IHJlY2VudE1zIFx1MjE5MiByZWNlbnQsIG90aGVyd2lzZSBub25lLiBFeGFjdGx5IGBmcmVzaE1pbnV0ZXNgXG4gKiBpcyBhbHJlYWR5IHJlY2VudCwgZXhhY3RseSBgcmVjZW50TWludXRlc2AgaXMgYWxyZWFkeSBub25lLlxuICogRnV0dXJlIG10aW1lIChjbG9jayBza2V3KSBpcyBhbHdheXMgZnJlc2guXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFzc2lmeUFnZShcbiAgbXRpbWU6IG51bWJlcixcbiAgbm93OiBudW1iZXIsXG4gIGZyZXNoTWludXRlczogbnVtYmVyLFxuICByZWNlbnRNaW51dGVzOiBudW1iZXIsXG4pOiBBZ2VTdGF0ZSB7XG4gIGNvbnN0IGFnZU1zID0gbm93IC0gbXRpbWU7XG4gIGlmIChhZ2VNcyA8IGZyZXNoTWludXRlcyAqIE1JTl9UT19NUykgcmV0dXJuIFwiZnJlc2hcIjtcbiAgaWYgKGFnZU1zIDwgcmVjZW50TWludXRlcyAqIE1JTl9UT19NUykgcmV0dXJuIFwicmVjZW50XCI7XG4gIHJldHVybiBcIm5vbmVcIjtcbn1cbiIsICJpbXBvcnQgeyBjbGFzc2lmeUFnZSB9IGZyb20gXCIuL2FnZVwiO1xuaW1wb3J0IHR5cGUgeyBGaWxlRnJlc2huZXNzU2V0dGluZ3MgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5leHBvcnQgY29uc3QgRlJFU0hfQ0xBU1MgPSBcImZpbGUtYWdlLWZyZXNoXCI7XG5leHBvcnQgY29uc3QgUkVDRU5UX0NMQVNTID0gXCJmaWxlLWFnZS1yZWNlbnRcIjtcblxuLyoqIE9ubHkgZmlsZSByb3dzIGFyZSBldmVyIHRvdWNoZWQgXHUyMDE0IG5ldmVyIGZvbGRlciB0aXRsZXMuICovXG5jb25zdCBGSUxFX1RJVExFX1NFTEVDVE9SID0gXCIubmF2LWZpbGUtdGl0bGVbZGF0YS1wYXRoXVwiO1xuXG5leHBvcnQgY29uc3QgQ1NTX1ZBUl9GUkVTSF9DT0xPUiA9IFwiLS1maWxlLWZyZXNobmVzcy1mcmVzaC1jb2xvclwiO1xuZXhwb3J0IGNvbnN0IENTU19WQVJfUkVDRU5UX0NPTE9SID0gXCItLWZpbGUtZnJlc2huZXNzLXJlY2VudC1jb2xvclwiO1xuZXhwb3J0IGNvbnN0IENTU19WQVJfRlJFU0hfQkcgPSBcIi0tZmlsZS1mcmVzaG5lc3MtZnJlc2gtYmdcIjtcbmV4cG9ydCBjb25zdCBDU1NfVkFSX1JFQ0VOVF9CRyA9IFwiLS1maWxlLWZyZXNobmVzcy1yZWNlbnQtYmdcIjtcblxuY29uc3QgTU9ERV9DTEFTU0VTID0gW1xuICBcImZyZXNobmVzcy1zaG93LXRleHRcIixcbiAgXCJmcmVzaG5lc3Mtc2hvdy1iYWNrZ3JvdW5kXCIsXG4gIFwiZnJlc2huZXNzLXNob3ctbGVmdGJhclwiLFxuICBcImZyZXNobmVzcy1oaWRlLWRvdFwiLFxuXSBhcyBjb25zdDtcblxuZnVuY3Rpb24gcmVtb3ZlT3duQ2xhc3NlcyhlbDogRWxlbWVudCk6IHZvaWQge1xuICBlbC5jbGFzc0xpc3QucmVtb3ZlKEZSRVNIX0NMQVNTLCBSRUNFTlRfQ0xBU1MpO1xufVxuXG4vKipcbiAqIFBhaW50IGEgc2luZ2xlIEV4cGxvcmVyIHJvdy4gYG10aW1lID09PSB1bmRlZmluZWRgIChub3QgaW4gY2FjaGUsXG4gKiBlLmcuIG5vbi1NYXJrZG93bikgcmVtb3ZlcyBoaWdobGlnaHRpbmcuIEZvcmVpZ24gY2xhc3Nlc1xuICogKEljb25pemUsIGlzLWFjdGl2ZSwgXHUyMDI2KSBhcmUgbmV2ZXIgdG91Y2hlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUZpbGVFbGVtZW50KFxuICBlbDogRWxlbWVudCxcbiAgbXRpbWU6IG51bWJlciB8IHVuZGVmaW5lZCxcbiAgc2V0dGluZ3M6IEZpbGVGcmVzaG5lc3NTZXR0aW5ncyxcbiAgbm93OiBudW1iZXIsXG4pOiB2b2lkIHtcbiAgcmVtb3ZlT3duQ2xhc3NlcyhlbCk7XG4gIGlmIChtdGltZSA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gIGNvbnN0IHN0YXRlID0gY2xhc3NpZnlBZ2UobXRpbWUsIG5vdywgc2V0dGluZ3MuZnJlc2hNaW51dGVzLCBzZXR0aW5ncy5yZWNlbnRNaW51dGVzKTtcbiAgaWYgKHN0YXRlID09PSBcImZyZXNoXCIpIGVsLmNsYXNzTGlzdC5hZGQoRlJFU0hfQ0xBU1MpO1xuICBlbHNlIGlmIChzdGF0ZSA9PT0gXCJyZWNlbnRcIikgZWwuY2xhc3NMaXN0LmFkZChSRUNFTlRfQ0xBU1MpO1xufVxuXG4vKiogTWluaW1hbCBsb29rdXAgc3VyZmFjZSBzbyB0ZXN0cyBjYW4gcGFzcyBhIHBsYWluIE1hcC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTXRpbWVMb29rdXAge1xuICBnZXQocGF0aDogc3RyaW5nKTogbnVtYmVyIHwgdW5kZWZpbmVkO1xufVxuXG4vKiogUmVwYWludCBhbGwgY3VycmVudGx5IHJlbmRlcmVkIGZpbGUgcm93cyBmcm9tIHRoZSBjYWNoZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoRXhwbG9yZXIoXG4gIGNvbnRhaW5lcjogUGFyZW50Tm9kZSxcbiAgY2FjaGU6IE10aW1lTG9va3VwLFxuICBzZXR0aW5nczogRmlsZUZyZXNobmVzc1NldHRpbmdzLFxuICBub3c6IG51bWJlcixcbik6IHZvaWQge1xuICBjb25zdCByb3dzID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoRklMRV9USVRMRV9TRUxFQ1RPUik7XG4gIHJvd3MuZm9yRWFjaCgocm93KSA9PiB7XG4gICAgY29uc3QgcGF0aCA9IHJvdy5nZXRBdHRyaWJ1dGUoXCJkYXRhLXBhdGhcIik7XG4gICAgdXBkYXRlRmlsZUVsZW1lbnQocm93LCBwYXRoID09PSBudWxsID8gdW5kZWZpbmVkIDogY2FjaGUuZ2V0KHBhdGgpLCBzZXR0aW5ncywgbm93KTtcbiAgfSk7XG59XG5cbi8qKiBJZGVtcG90ZW50OiBzYWZlIHRvIGNhbGwgYW55IG51bWJlciBvZiB0aW1lcy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhckhpZ2hsaWdodChjb250YWluZXI6IFBhcmVudE5vZGUpOiB2b2lkIHtcbiAgY29uc3Qgcm93cyA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKGAuJHtGUkVTSF9DTEFTU30sIC4ke1JFQ0VOVF9DTEFTU31gKTtcbiAgcm93cy5mb3JFYWNoKHJlbW92ZU93bkNsYXNzZXMpO1xufVxuXG4vKipcbiAqIFB1Ymxpc2ggc2V0dGluZ3MgYXMgQ1NTIHZhcmlhYmxlcyArIGJvZHkgbW9kZSBjbGFzc2VzLCBvbmNlLlxuICogQ2hhbmdpbmcgY29sb3JzL3RvZ2dsZXMgbmV2ZXIgcmVxdWlyZXMgYSBET00gd2Fsay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5Q3NzVmFyaWFibGVzKFxuICBib2R5OiBIVE1MRWxlbWVudCxcbiAgc2V0dGluZ3M6IEZpbGVGcmVzaG5lc3NTZXR0aW5ncyxcbik6IHZvaWQge1xuICBjb25zdCBzdHlsZSA9IGJvZHkuc3R5bGU7XG4gIHN0eWxlLnNldFByb3BlcnR5KENTU19WQVJfRlJFU0hfQ09MT1IsIHNldHRpbmdzLmZyZXNoQ29sb3IpO1xuICBzdHlsZS5zZXRQcm9wZXJ0eShDU1NfVkFSX1JFQ0VOVF9DT0xPUiwgc2V0dGluZ3MucmVjZW50Q29sb3IpO1xuICBzdHlsZS5zZXRQcm9wZXJ0eShDU1NfVkFSX0ZSRVNIX0JHLCBzZXR0aW5ncy5mcmVzaEJnKTtcbiAgc3R5bGUuc2V0UHJvcGVydHkoQ1NTX1ZBUl9SRUNFTlRfQkcsIHNldHRpbmdzLnJlY2VudEJnKTtcbiAgYm9keS5jbGFzc0xpc3QudG9nZ2xlKFwiZnJlc2huZXNzLXNob3ctdGV4dFwiLCBzZXR0aW5ncy5zaG93VGV4dCk7XG4gIGJvZHkuY2xhc3NMaXN0LnRvZ2dsZShcImZyZXNobmVzcy1zaG93LWJhY2tncm91bmRcIiwgc2V0dGluZ3Muc2hvd0JhY2tncm91bmQpO1xuICBib2R5LmNsYXNzTGlzdC50b2dnbGUoXCJmcmVzaG5lc3Mtc2hvdy1sZWZ0YmFyXCIsIHNldHRpbmdzLnNob3dMZWZ0QmFyKTtcbiAgYm9keS5jbGFzc0xpc3QudG9nZ2xlKFwiZnJlc2huZXNzLWhpZGUtZG90XCIsICFzZXR0aW5ncy5zaG93RG90KTtcbn1cblxuLyoqIFJlbW92ZSBvbmx5IHRoZSBwbHVnaW4ncyBvd24gdmFyaWFibGVzIGFuZCBtb2RlIGNsYXNzZXMuICovXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJDc3NWYXJpYWJsZXMoYm9keTogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgYm9keS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShDU1NfVkFSX0ZSRVNIX0NPTE9SKTtcbiAgYm9keS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShDU1NfVkFSX1JFQ0VOVF9DT0xPUik7XG4gIGJvZHkuc3R5bGUucmVtb3ZlUHJvcGVydHkoQ1NTX1ZBUl9GUkVTSF9CRyk7XG4gIGJvZHkuc3R5bGUucmVtb3ZlUHJvcGVydHkoQ1NTX1ZBUl9SRUNFTlRfQkcpO1xuICBmb3IgKGNvbnN0IGNscyBvZiBNT0RFX0NMQVNTRVMpIGJvZHkuY2xhc3NMaXN0LnJlbW92ZShjbHMpO1xufVxuIiwgImltcG9ydCB0eXBlIHsgRmlsZUZyZXNobmVzc1NldHRpbmdzIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEZpbGVGcmVzaG5lc3NTZXR0aW5ncyA9IHtcbiAgZW5hYmxlZDogdHJ1ZSxcbiAgZnJlc2hNaW51dGVzOiA2MCxcbiAgcmVjZW50TWludXRlczogMTgwLFxuICBmcmVzaENvbG9yOiBcIiM1MkM0MUFcIixcbiAgcmVjZW50Q29sb3I6IFwiI0ZBQUQxNFwiLFxuICBmcmVzaEJnOiBcInJnYmEoODIsIDE5NiwgMjYsIDAuMTIpXCIsXG4gIHJlY2VudEJnOiBcInJnYmEoMjUwLCAxNzMsIDIwLCAwLjEyKVwiLFxuICBzaG93RG90OiB0cnVlLFxuICBzaG93VGV4dDogZmFsc2UsXG4gIHNob3dCYWNrZ3JvdW5kOiBmYWxzZSxcbiAgc2hvd0xlZnRCYXI6IGZhbHNlLFxuICByZWZyZXNoSW50ZXJ2YWxTZWM6IDYwLFxufTtcblxuLyoqIEFsbG93ZWQgYXV0by1yZWZyZXNoIHJhbmdlIGluIHNlY29uZHM6IFsxNSwgNjBdIChwbGFuIHY2LCBBdWRpdDIpLiAqL1xuZXhwb3J0IGNvbnN0IE1JTl9SRUZSRVNIX1NFQyA9IDE1O1xuZXhwb3J0IGNvbnN0IE1BWF9SRUZSRVNIX1NFQyA9IDYwO1xuXG4vKiogQ2xhbXAgdGhlIHJlZnJlc2ggaW50ZXJ2YWw7IGdhcmJhZ2UgZmFsbHMgYmFjayB0byB0aGUgZGVmYXVsdC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFtcFJlZnJlc2hJbnRlcnZhbCh2YWx1ZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUodmFsdWUpKSByZXR1cm4gREVGQVVMVF9TRVRUSU5HUy5yZWZyZXNoSW50ZXJ2YWxTZWM7XG4gIHJldHVybiBNYXRoLm1pbihNQVhfUkVGUkVTSF9TRUMsIE1hdGgubWF4KE1JTl9SRUZSRVNIX1NFQywgdmFsdWUpKTtcbn1cblxuLyoqXG4gKiBQYXJzZSBhbiBleGFjdCBudW1lcmljIGlucHV0IGZyb20gYSBzZXR0aW5ncyB0ZXh0IGZpZWxkLlxuICogUmV0dXJucyBgZmFsbGJhY2tgIGZvciBlbXB0eS9nYXJiYWdlL25vbi1wb3NpdGl2ZSBpbnB1dC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUG9zaXRpdmVJbnQodGV4dDogc3RyaW5nLCBmYWxsYmFjazogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgdmFsdWUgPSBNYXRoLmZsb29yKE51bWJlcih0ZXh0LnRyaW0oKSkpO1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZSh2YWx1ZSkgfHwgdmFsdWUgPD0gMCkgcmV0dXJuIGZhbGxiYWNrO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogTm9ybWFsaXplIGFnZSB0aHJlc2hvbGRzOiBmcmVzaCBpcyBhdCBsZWFzdCAxIG1pbnV0ZSwgcmVjZW50IGlzIGFsd2F5c1xuICogc3RyaWN0bHkgYWJvdmUgZnJlc2guIFJldHVybnMgdGhlIGVmZmVjdGl2ZSBwYWlyIChVSSBzaG91bGQgcmVmbGVjdCBpdCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVUaHJlc2hvbGRzKFxuICBmcmVzaE1pbnV0ZXM6IG51bWJlcixcbiAgcmVjZW50TWludXRlczogbnVtYmVyLFxuKTogeyBmcmVzaE1pbnV0ZXM6IG51bWJlcjsgcmVjZW50TWludXRlczogbnVtYmVyIH0ge1xuICBjb25zdCBmcmVzaCA9IE1hdGgubWF4KDEsIE1hdGguZmxvb3IoTnVtYmVyLmlzRmluaXRlKGZyZXNoTWludXRlcykgPyBmcmVzaE1pbnV0ZXMgOiAxKSk7XG4gIGNvbnN0IHJlY2VudCA9IE1hdGgubWF4KFxuICAgIGZyZXNoICsgMSxcbiAgICBNYXRoLmZsb29yKE51bWJlci5pc0Zpbml0ZShyZWNlbnRNaW51dGVzKSA/IHJlY2VudE1pbnV0ZXMgOiBmcmVzaCArIDEpLFxuICApO1xuICByZXR1cm4geyBmcmVzaE1pbnV0ZXM6IGZyZXNoLCByZWNlbnRNaW51dGVzOiByZWNlbnQgfTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IHBhcnNlUG9zaXRpdmVJbnQgfSBmcm9tIFwiLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHR5cGUgRmlsZUZyZXNobmVzc1BsdWdpbiBmcm9tIFwiLi9tYWluXCI7XG5cbmV4cG9ydCBjbGFzcyBGaWxlRnJlc2huZXNzU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IEZpbGVGcmVzaG5lc3NQbHVnaW47XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogRmlsZUZyZXNobmVzc1BsdWdpbikge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkVuYWJsZSBmcmVzaCBmaWxlIGhpZ2hsaWdodGluZ1wiKVxuICAgICAgLnNldERlc2MoXCJXaGVuIG9mZiwgYWxsIGhpZ2hsaWdodGluZyBpcyByZW1vdmVkIGFuZCBiYWNrZ3JvdW5kIHdvcmsgc3RvcHMuXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0KSA9PlxuICAgICAgICB0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZWQpLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlZCA9IHY7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJGcmVzaCB0aHJlc2hvbGQgKG1pbnV0ZXMpXCIpXG4gICAgICAuc2V0RGVzYyhcIkZpbGVzIG1vZGlmaWVkIGxlc3MgdGhhbiB0aGlzIGFnbyBhcmUgaGlnaGxpZ2h0ZWQgYXMgZnJlc2guXCIpXG4gICAgICAuYWRkU2xpZGVyKChzKSA9PlxuICAgICAgICBzXG4gICAgICAgICAgLnNldExpbWl0cygxLCA3MjAsIDEpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmZyZXNoTWludXRlcylcbiAgICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlc2hNaW51dGVzID0gdjtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkVGV4dCgodCkgPT5cbiAgICAgICAgdFxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIjYwXCIpXG4gICAgICAgICAgLnNldFZhbHVlKFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5mcmVzaE1pbnV0ZXMpKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlc2hNaW51dGVzID0gcGFyc2VQb3NpdGl2ZUludChcbiAgICAgICAgICAgICAgdixcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlc2hNaW51dGVzLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlJlY2VudCB0aHJlc2hvbGQgKG1pbnV0ZXMpXCIpXG4gICAgICAuc2V0RGVzYyhcIkZpbGVzIGJldHdlZW4gdGhlIGZyZXNoIGFuZCB0aGlzIHRocmVzaG9sZCBhcmUgaGlnaGxpZ2h0ZWQgYXMgcmVjZW50LiBPbGRlciBmaWxlcyB1c2UgdGhlIHRoZW1lIHN0eWxlLlwiKVxuICAgICAgLmFkZFNsaWRlcigocykgPT5cbiAgICAgICAgc1xuICAgICAgICAgIC5zZXRMaW1pdHMoMiwgMTQ0MCwgMSlcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVjZW50TWludXRlcylcbiAgICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVjZW50TWludXRlcyA9IHY7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZFRleHQoKHQpID0+XG4gICAgICAgIHRcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCIxODBcIilcbiAgICAgICAgICAuc2V0VmFsdWUoU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLnJlY2VudE1pbnV0ZXMpKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVjZW50TWludXRlcyA9IHBhcnNlUG9zaXRpdmVJbnQoXG4gICAgICAgICAgICAgIHYsXG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlY2VudE1pbnV0ZXMsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRnJlc2ggY29sb3JcIilcbiAgICAgIC5hZGRDb2xvclBpY2tlcigoYykgPT5cbiAgICAgICAgYy5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5mcmVzaENvbG9yKS5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmZyZXNoQ29sb3IgPSB2O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiUmVjZW50IGNvbG9yXCIpXG4gICAgICAuYWRkQ29sb3JQaWNrZXIoKGMpID0+XG4gICAgICAgIGMuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVjZW50Q29sb3IpLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVjZW50Q29sb3IgPSB2O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBkb3QgaW5kaWNhdG9yXCIpXG4gICAgICAuc2V0RGVzYyhcIkNvbG9yZWQgZG90IGxlZnQgb2YgdGhlIGZpbGUgbmFtZSAoZGVmYXVsdCBpbmRpY2F0b3IpLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodCkgPT5cbiAgICAgICAgdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93RG90KS5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dEb3QgPSB2O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSGlnaGxpZ2h0IGZpbGUgbmFtZSB0ZXh0XCIpXG4gICAgICAuc2V0RGVzYyhcIkFsc28gcmVjb2xvciB0aGUgZmlsZSBuYW1lLiBPZmYgYnkgZGVmYXVsdCB0byBhdm9pZCBjb25mbGljdHMgd2l0aCB0aGVtZXMgYW5kIG1hbnVhbCBjb2xvcnMuXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0KSA9PlxuICAgICAgICB0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dUZXh0KS5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dUZXh0ID0gdjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkhpZ2hsaWdodCByb3cgYmFja2dyb3VuZFwiKVxuICAgICAgLmFkZFRvZ2dsZSgodCkgPT5cbiAgICAgICAgdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93QmFja2dyb3VuZCkub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93QmFja2dyb3VuZCA9IHY7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IGxlZnQgYmFyXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0KSA9PlxuICAgICAgICB0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dMZWZ0QmFyKS5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dMZWZ0QmFyID0gdjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkF1dG8tcmVmcmVzaCBpbnRlcnZhbCAoc2Vjb25kcylcIilcbiAgICAgIC5zZXREZXNjKFwiSG93IG9mdGVuIHJlbmRlcmVkIHJvd3MgYXJlIHJlLWV2YWx1YXRlZC4gQWxsb3dlZCByYW5nZTogMTVcdTIwMTM2MC5cIilcbiAgICAgIC5hZGRTbGlkZXIoKHMpID0+XG4gICAgICAgIHNcbiAgICAgICAgICAuc2V0TGltaXRzKDE1LCA2MCwgMSlcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVmcmVzaEludGVydmFsU2VjKVxuICAgICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWZyZXNoSW50ZXJ2YWxTZWMgPSB2O1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRUZXh0KCh0KSA9PlxuICAgICAgICB0XG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiNjBcIilcbiAgICAgICAgICAuc2V0VmFsdWUoU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLnJlZnJlc2hJbnRlcnZhbFNlYykpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWZyZXNoSW50ZXJ2YWxTZWMgPSBwYXJzZVBvc2l0aXZlSW50KFxuICAgICAgICAgICAgICB2LFxuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWZyZXNoSW50ZXJ2YWxTZWMsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiUmVmcmVzaCBub3dcIilcbiAgICAgIC5zZXREZXNjKFwiUmVwYWludCBjdXJyZW50bHkgcmVuZGVyZWQgZmlsZXMgaW1tZWRpYXRlbHkuXCIpXG4gICAgICAuYWRkQnV0dG9uKChiKSA9PlxuICAgICAgICBiLnNldEJ1dHRvblRleHQoXCJSZWZyZXNoXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5wbHVnaW4ucmVmcmVzaEFsbCgpKSxcbiAgICAgICk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG1CQUFzRDs7O0FDTy9DLElBQU0sYUFBTixNQUFpQjtBQUFBLEVBQWpCO0FBQ0wsU0FBaUIsTUFBTSxvQkFBSSxJQUFvQjtBQUFBO0FBQUEsRUFFL0MsSUFBSSxNQUFjLE9BQXFCO0FBQ3JDLFNBQUssSUFBSSxJQUFJLE1BQU0sS0FBSztBQUFBLEVBQzFCO0FBQUEsRUFFQSxJQUFJLE1BQWtDO0FBQ3BDLFdBQU8sS0FBSyxJQUFJLElBQUksSUFBSTtBQUFBLEVBQzFCO0FBQUEsRUFFQSxJQUFJLE1BQXVCO0FBQ3pCLFdBQU8sS0FBSyxJQUFJLElBQUksSUFBSTtBQUFBLEVBQzFCO0FBQUEsRUFFQSxPQUFPLE1BQW9CO0FBQ3pCLFNBQUssSUFBSSxPQUFPLElBQUk7QUFBQSxFQUN0QjtBQUFBLEVBRUEsT0FBTyxTQUFpQixTQUFpQixPQUFxQjtBQUM1RCxTQUFLLElBQUksT0FBTyxPQUFPO0FBQ3ZCLFNBQUssSUFBSSxJQUFJLFNBQVMsS0FBSztBQUFBLEVBQzdCO0FBQUE7QUFBQSxFQUdBLFFBQVEsT0FBMkI7QUFDakMsU0FBSyxJQUFJLE1BQU07QUFDZixlQUFXLEtBQUssTUFBTyxNQUFLLElBQUksSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLO0FBQUEsRUFDckQ7QUFBQSxFQUVBLE9BQWU7QUFDYixXQUFPLEtBQUssSUFBSTtBQUFBLEVBQ2xCO0FBQ0Y7OztBQ3JDTyxJQUFNLFlBQVk7QUFVbEIsU0FBUyxZQUNkLE9BQ0EsS0FDQSxjQUNBLGVBQ1U7QUFDVixRQUFNLFFBQVEsTUFBTTtBQUNwQixNQUFJLFFBQVEsZUFBZSxVQUFXLFFBQU87QUFDN0MsTUFBSSxRQUFRLGdCQUFnQixVQUFXLFFBQU87QUFDOUMsU0FBTztBQUNUOzs7QUNwQk8sSUFBTSxjQUFjO0FBQ3BCLElBQU0sZUFBZTtBQUc1QixJQUFNLHNCQUFzQjtBQUVyQixJQUFNLHNCQUFzQjtBQUM1QixJQUFNLHVCQUF1QjtBQUM3QixJQUFNLG1CQUFtQjtBQUN6QixJQUFNLG9CQUFvQjtBQUVqQyxJQUFNLGVBQWU7QUFBQSxFQUNuQjtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGO0FBRUEsU0FBUyxpQkFBaUIsSUFBbUI7QUFDM0MsS0FBRyxVQUFVLE9BQU8sYUFBYSxZQUFZO0FBQy9DO0FBT08sU0FBUyxrQkFDZCxJQUNBLE9BQ0EsVUFDQSxLQUNNO0FBQ04sbUJBQWlCLEVBQUU7QUFDbkIsTUFBSSxVQUFVLE9BQVc7QUFDekIsUUFBTSxRQUFRLFlBQVksT0FBTyxLQUFLLFNBQVMsY0FBYyxTQUFTLGFBQWE7QUFDbkYsTUFBSSxVQUFVLFFBQVMsSUFBRyxVQUFVLElBQUksV0FBVztBQUFBLFdBQzFDLFVBQVUsU0FBVSxJQUFHLFVBQVUsSUFBSSxZQUFZO0FBQzVEO0FBUU8sU0FBUyxnQkFDZCxXQUNBLE9BQ0EsVUFDQSxLQUNNO0FBQ04sUUFBTSxPQUFPLFVBQVUsaUJBQWlCLG1CQUFtQjtBQUMzRCxPQUFLLFFBQVEsQ0FBQyxRQUFRO0FBQ3BCLFVBQU0sT0FBTyxJQUFJLGFBQWEsV0FBVztBQUN6QyxzQkFBa0IsS0FBSyxTQUFTLE9BQU8sU0FBWSxNQUFNLElBQUksSUFBSSxHQUFHLFVBQVUsR0FBRztBQUFBLEVBQ25GLENBQUM7QUFDSDtBQUdPLFNBQVMsZUFBZSxXQUE2QjtBQUMxRCxRQUFNLE9BQU8sVUFBVSxpQkFBaUIsSUFBSSxXQUFXLE1BQU0sWUFBWSxFQUFFO0FBQzNFLE9BQUssUUFBUSxnQkFBZ0I7QUFDL0I7QUFNTyxTQUFTLGtCQUNkLE1BQ0EsVUFDTTtBQUNOLFFBQU0sUUFBUSxLQUFLO0FBQ25CLFFBQU0sWUFBWSxxQkFBcUIsU0FBUyxVQUFVO0FBQzFELFFBQU0sWUFBWSxzQkFBc0IsU0FBUyxXQUFXO0FBQzVELFFBQU0sWUFBWSxrQkFBa0IsU0FBUyxPQUFPO0FBQ3BELFFBQU0sWUFBWSxtQkFBbUIsU0FBUyxRQUFRO0FBQ3RELE9BQUssVUFBVSxPQUFPLHVCQUF1QixTQUFTLFFBQVE7QUFDOUQsT0FBSyxVQUFVLE9BQU8sNkJBQTZCLFNBQVMsY0FBYztBQUMxRSxPQUFLLFVBQVUsT0FBTywwQkFBMEIsU0FBUyxXQUFXO0FBQ3BFLE9BQUssVUFBVSxPQUFPLHNCQUFzQixDQUFDLFNBQVMsT0FBTztBQUMvRDtBQUdPLFNBQVMsa0JBQWtCLE1BQXlCO0FBQ3pELE9BQUssTUFBTSxlQUFlLG1CQUFtQjtBQUM3QyxPQUFLLE1BQU0sZUFBZSxvQkFBb0I7QUFDOUMsT0FBSyxNQUFNLGVBQWUsZ0JBQWdCO0FBQzFDLE9BQUssTUFBTSxlQUFlLGlCQUFpQjtBQUMzQyxhQUFXLE9BQU8sYUFBYyxNQUFLLFVBQVUsT0FBTyxHQUFHO0FBQzNEOzs7QUM1Rk8sSUFBTSxtQkFBMEM7QUFBQSxFQUNyRCxTQUFTO0FBQUEsRUFDVCxjQUFjO0FBQUEsRUFDZCxlQUFlO0FBQUEsRUFDZixZQUFZO0FBQUEsRUFDWixhQUFhO0FBQUEsRUFDYixTQUFTO0FBQUEsRUFDVCxVQUFVO0FBQUEsRUFDVixTQUFTO0FBQUEsRUFDVCxVQUFVO0FBQUEsRUFDVixnQkFBZ0I7QUFBQSxFQUNoQixhQUFhO0FBQUEsRUFDYixvQkFBb0I7QUFDdEI7QUFHTyxJQUFNLGtCQUFrQjtBQUN4QixJQUFNLGtCQUFrQjtBQUd4QixTQUFTLHFCQUFxQixPQUF1QjtBQUMxRCxNQUFJLENBQUMsT0FBTyxTQUFTLEtBQUssRUFBRyxRQUFPLGlCQUFpQjtBQUNyRCxTQUFPLEtBQUssSUFBSSxpQkFBaUIsS0FBSyxJQUFJLGlCQUFpQixLQUFLLENBQUM7QUFDbkU7QUFNTyxTQUFTLGlCQUFpQixNQUFjLFVBQTBCO0FBQ3ZFLFFBQU0sUUFBUSxLQUFLLE1BQU0sT0FBTyxLQUFLLEtBQUssQ0FBQyxDQUFDO0FBQzVDLE1BQUksQ0FBQyxPQUFPLFNBQVMsS0FBSyxLQUFLLFNBQVMsRUFBRyxRQUFPO0FBQ2xELFNBQU87QUFDVDtBQU1PLFNBQVMsb0JBQ2QsY0FDQSxlQUNpRDtBQUNqRCxRQUFNLFFBQVEsS0FBSyxJQUFJLEdBQUcsS0FBSyxNQUFNLE9BQU8sU0FBUyxZQUFZLElBQUksZUFBZSxDQUFDLENBQUM7QUFDdEYsUUFBTSxTQUFTLEtBQUs7QUFBQSxJQUNsQixRQUFRO0FBQUEsSUFDUixLQUFLLE1BQU0sT0FBTyxTQUFTLGFBQWEsSUFBSSxnQkFBZ0IsUUFBUSxDQUFDO0FBQUEsRUFDdkU7QUFDQSxTQUFPLEVBQUUsY0FBYyxPQUFPLGVBQWUsT0FBTztBQUN0RDs7O0FDbkRBLHNCQUErQztBQUl4QyxJQUFNLDBCQUFOLGNBQXNDLGlDQUFpQjtBQUFBLEVBRzVELFlBQVksS0FBVSxRQUE2QjtBQUNqRCxVQUFNLEtBQUssTUFBTTtBQUNqQixTQUFLLFNBQVM7QUFBQSxFQUNoQjtBQUFBLEVBRUEsVUFBZ0I7QUFDZCxVQUFNLEVBQUUsWUFBWSxJQUFJO0FBQ3hCLGdCQUFZLE1BQU07QUFFbEIsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsZ0NBQWdDLEVBQ3hDLFFBQVEsa0VBQWtFLEVBQzFFO0FBQUEsTUFBVSxDQUFDLE1BQ1YsRUFBRSxTQUFTLEtBQUssT0FBTyxTQUFTLE9BQU8sRUFBRSxTQUFTLE9BQU8sTUFBTTtBQUM3RCxhQUFLLE9BQU8sU0FBUyxVQUFVO0FBQy9CLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDO0FBQUEsSUFDSDtBQUVGLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLDJCQUEyQixFQUNuQyxRQUFRLDZEQUE2RCxFQUNyRTtBQUFBLE1BQVUsQ0FBQyxNQUNWLEVBQ0csVUFBVSxHQUFHLEtBQUssQ0FBQyxFQUNuQixTQUFTLEtBQUssT0FBTyxTQUFTLFlBQVksRUFDMUMsa0JBQWtCLEVBQ2xCLFNBQVMsT0FBTyxNQUFNO0FBQ3JCLGFBQUssT0FBTyxTQUFTLGVBQWU7QUFDcEMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQixhQUFLLFFBQVE7QUFBQSxNQUNmLENBQUM7QUFBQSxJQUNMLEVBQ0M7QUFBQSxNQUFRLENBQUMsTUFDUixFQUNHLGVBQWUsSUFBSSxFQUNuQixTQUFTLE9BQU8sS0FBSyxPQUFPLFNBQVMsWUFBWSxDQUFDLEVBQ2xELFNBQVMsT0FBTyxNQUFNO0FBQ3JCLGFBQUssT0FBTyxTQUFTLGVBQWU7QUFBQSxVQUNsQztBQUFBLFVBQ0EsS0FBSyxPQUFPLFNBQVM7QUFBQSxRQUN2QjtBQUNBLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFDL0IsYUFBSyxRQUFRO0FBQUEsTUFDZixDQUFDO0FBQUEsSUFDTDtBQUVGLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLDRCQUE0QixFQUNwQyxRQUFRLHdHQUF3RyxFQUNoSDtBQUFBLE1BQVUsQ0FBQyxNQUNWLEVBQ0csVUFBVSxHQUFHLE1BQU0sQ0FBQyxFQUNwQixTQUFTLEtBQUssT0FBTyxTQUFTLGFBQWEsRUFDM0Msa0JBQWtCLEVBQ2xCLFNBQVMsT0FBTyxNQUFNO0FBQ3JCLGFBQUssT0FBTyxTQUFTLGdCQUFnQjtBQUNyQyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQy9CLGFBQUssUUFBUTtBQUFBLE1BQ2YsQ0FBQztBQUFBLElBQ0wsRUFDQztBQUFBLE1BQVEsQ0FBQyxNQUNSLEVBQ0csZUFBZSxLQUFLLEVBQ3BCLFNBQVMsT0FBTyxLQUFLLE9BQU8sU0FBUyxhQUFhLENBQUMsRUFDbkQsU0FBUyxPQUFPLE1BQU07QUFDckIsYUFBSyxPQUFPLFNBQVMsZ0JBQWdCO0FBQUEsVUFDbkM7QUFBQSxVQUNBLEtBQUssT0FBTyxTQUFTO0FBQUEsUUFDdkI7QUFDQSxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQy9CLGFBQUssUUFBUTtBQUFBLE1BQ2YsQ0FBQztBQUFBLElBQ0w7QUFFRixRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxhQUFhLEVBQ3JCO0FBQUEsTUFBZSxDQUFDLE1BQ2YsRUFBRSxTQUFTLEtBQUssT0FBTyxTQUFTLFVBQVUsRUFBRSxTQUFTLE9BQU8sTUFBTTtBQUNoRSxhQUFLLE9BQU8sU0FBUyxhQUFhO0FBQ2xDLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDO0FBQUEsSUFDSDtBQUVGLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLGNBQWMsRUFDdEI7QUFBQSxNQUFlLENBQUMsTUFDZixFQUFFLFNBQVMsS0FBSyxPQUFPLFNBQVMsV0FBVyxFQUFFLFNBQVMsT0FBTyxNQUFNO0FBQ2pFLGFBQUssT0FBTyxTQUFTLGNBQWM7QUFDbkMsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ2pDLENBQUM7QUFBQSxJQUNIO0FBRUYsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsb0JBQW9CLEVBQzVCLFFBQVEsd0RBQXdELEVBQ2hFO0FBQUEsTUFBVSxDQUFDLE1BQ1YsRUFBRSxTQUFTLEtBQUssT0FBTyxTQUFTLE9BQU8sRUFBRSxTQUFTLE9BQU8sTUFBTTtBQUM3RCxhQUFLLE9BQU8sU0FBUyxVQUFVO0FBQy9CLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDO0FBQUEsSUFDSDtBQUVGLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLDBCQUEwQixFQUNsQyxRQUFRLDhGQUE4RixFQUN0RztBQUFBLE1BQVUsQ0FBQyxNQUNWLEVBQUUsU0FBUyxLQUFLLE9BQU8sU0FBUyxRQUFRLEVBQUUsU0FBUyxPQUFPLE1BQU07QUFDOUQsYUFBSyxPQUFPLFNBQVMsV0FBVztBQUNoQyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsTUFDakMsQ0FBQztBQUFBLElBQ0g7QUFFRixRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSwwQkFBMEIsRUFDbEM7QUFBQSxNQUFVLENBQUMsTUFDVixFQUFFLFNBQVMsS0FBSyxPQUFPLFNBQVMsY0FBYyxFQUFFLFNBQVMsT0FBTyxNQUFNO0FBQ3BFLGFBQUssT0FBTyxTQUFTLGlCQUFpQjtBQUN0QyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsTUFDakMsQ0FBQztBQUFBLElBQ0g7QUFFRixRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxlQUFlLEVBQ3ZCO0FBQUEsTUFBVSxDQUFDLE1BQ1YsRUFBRSxTQUFTLEtBQUssT0FBTyxTQUFTLFdBQVcsRUFBRSxTQUFTLE9BQU8sTUFBTTtBQUNqRSxhQUFLLE9BQU8sU0FBUyxjQUFjO0FBQ25DLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDO0FBQUEsSUFDSDtBQUVGLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLGlDQUFpQyxFQUN6QyxRQUFRLHNFQUFpRSxFQUN6RTtBQUFBLE1BQVUsQ0FBQyxNQUNWLEVBQ0csVUFBVSxJQUFJLElBQUksQ0FBQyxFQUNuQixTQUFTLEtBQUssT0FBTyxTQUFTLGtCQUFrQixFQUNoRCxrQkFBa0IsRUFDbEIsU0FBUyxPQUFPLE1BQU07QUFDckIsYUFBSyxPQUFPLFNBQVMscUJBQXFCO0FBQzFDLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFDL0IsYUFBSyxRQUFRO0FBQUEsTUFDZixDQUFDO0FBQUEsSUFDTCxFQUNDO0FBQUEsTUFBUSxDQUFDLE1BQ1IsRUFDRyxlQUFlLElBQUksRUFDbkIsU0FBUyxPQUFPLEtBQUssT0FBTyxTQUFTLGtCQUFrQixDQUFDLEVBQ3hELFNBQVMsT0FBTyxNQUFNO0FBQ3JCLGFBQUssT0FBTyxTQUFTLHFCQUFxQjtBQUFBLFVBQ3hDO0FBQUEsVUFDQSxLQUFLLE9BQU8sU0FBUztBQUFBLFFBQ3ZCO0FBQ0EsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQixhQUFLLFFBQVE7QUFBQSxNQUNmLENBQUM7QUFBQSxJQUNMO0FBRUYsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsYUFBYSxFQUNyQixRQUFRLCtDQUErQyxFQUN2RDtBQUFBLE1BQVUsQ0FBQyxNQUNWLEVBQUUsY0FBYyxTQUFTLEVBQUUsUUFBUSxNQUFNLEtBQUssT0FBTyxXQUFXLENBQUM7QUFBQSxJQUNuRTtBQUFBLEVBQ0o7QUFDRjs7O0FMNUpBLElBQU0sOEJBQThCO0FBQ3BDLElBQU0sNkJBQTZCO0FBQ25DLElBQU0sb0JBQW9CO0FBRTFCLElBQXFCLHNCQUFyQixNQUFxQiw2QkFBNEIsd0JBQU87QUFBQSxFQUF4RDtBQUFBO0FBQ0Usb0JBQWtDLEVBQUUsR0FBRyxpQkFBaUI7QUFDeEQsU0FBUSxRQUFRLElBQUksV0FBVztBQUMvQixTQUFRLFdBQW9DO0FBQzVDLFNBQVEsUUFBUTtBQUNoQixTQUFRLFVBQVU7QUFBQTtBQUFBLEVBRWxCLE1BQU0sU0FBd0I7QUFDNUIsVUFBTSxLQUFLLGFBQWE7QUFDeEIsU0FBSyxjQUFjLElBQUksd0JBQXdCLEtBQUssS0FBSyxJQUFJLENBQUM7QUFDOUQsU0FBSyxXQUFXO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixVQUFVLE1BQU0sS0FBSyxXQUFXO0FBQUEsSUFDbEMsQ0FBQztBQUNELFNBQUssSUFBSSxVQUFVLGNBQWMsTUFBTSxLQUFLLFdBQVcsQ0FBQztBQUFBLEVBQzFEO0FBQUEsRUFFQSxXQUFpQjtBQUNmLFNBQUssU0FBUztBQUNkLFVBQU0sWUFBWSxLQUFLLHNCQUFzQjtBQUM3QyxRQUFJLFVBQVcsZ0JBQWUsU0FBUztBQUN2QyxzQkFBa0IsU0FBUyxJQUFJO0FBQUEsRUFDakM7QUFBQSxFQUVBLE1BQU0sZUFBOEI7QUFDbEMsVUFBTSxPQUFRLE1BQU0sS0FBSyxTQUFTO0FBQ2xDLFVBQU0sU0FBUyxPQUFPLE9BQU8sQ0FBQyxHQUFHLGtCQUFrQixJQUFJO0FBQ3ZELFVBQU0sRUFBRSxjQUFjLGNBQWMsSUFBSTtBQUFBLE1BQ3RDLE9BQU87QUFBQSxNQUNQLE9BQU87QUFBQSxJQUNUO0FBQ0EsV0FBTyxlQUFlO0FBQ3RCLFdBQU8sZ0JBQWdCO0FBQ3ZCLFdBQU8scUJBQXFCLHFCQUFxQixPQUFPLGtCQUFrQjtBQUMxRSxTQUFLLFdBQVc7QUFBQSxFQUNsQjtBQUFBLEVBRUEsTUFBTSxlQUE4QjtBQUNsQyxVQUFNLEVBQUUsY0FBYyxjQUFjLElBQUk7QUFBQSxNQUN0QyxLQUFLLFNBQVM7QUFBQSxNQUNkLEtBQUssU0FBUztBQUFBLElBQ2hCO0FBQ0EsU0FBSyxTQUFTLGVBQWU7QUFDN0IsU0FBSyxTQUFTLGdCQUFnQjtBQUM5QixTQUFLLFNBQVMscUJBQXFCLHFCQUFxQixLQUFLLFNBQVMsa0JBQWtCO0FBQ3hGLFVBQU0sS0FBSyxTQUFTLEtBQUssUUFBUTtBQUNqQyxRQUFJLEtBQUssUUFBUyxNQUFLLGFBQWE7QUFDcEMsU0FBSyxTQUFTO0FBQUEsRUFDaEI7QUFBQTtBQUFBLEVBR0EsV0FBaUI7QUFDZixRQUFJLENBQUMsS0FBSyxTQUFTLFNBQVM7QUFDMUIsWUFBTSxZQUFZLEtBQUssc0JBQXNCO0FBQzdDLFVBQUksVUFBVyxnQkFBZSxTQUFTO0FBQ3ZDLHdCQUFrQixTQUFTLElBQUk7QUFDL0I7QUFBQSxJQUNGO0FBQ0Esc0JBQWtCLFNBQVMsTUFBTSxLQUFLLFFBQVE7QUFDOUMsU0FBSyxXQUFXO0FBQUEsRUFDbEI7QUFBQTtBQUFBLEVBR0EsYUFBbUI7QUFDakIsUUFBSSxDQUFDLEtBQUssU0FBUyxRQUFTO0FBQzVCLFVBQU0sWUFBWSxLQUFLLHNCQUFzQjtBQUM3QyxRQUFJLFVBQVcsaUJBQWdCLFdBQVcsS0FBSyxPQUFPLEtBQUssVUFBVSxLQUFLLElBQUksQ0FBQztBQUFBLEVBQ2pGO0FBQUEsRUFFUSxhQUFtQjtBQUN6QixVQUFNLFlBQVksS0FBSyxzQkFBc0I7QUFDN0MsUUFBSSxDQUFDLFdBQVc7QUFDZCxhQUFPLFdBQVcsTUFBTSxLQUFLLFdBQVcsR0FBRyxHQUFJO0FBQy9DO0FBQUEsSUFDRjtBQUNBLFNBQUssYUFBYTtBQUNsQixTQUFLLFNBQVM7QUFFZCxTQUFLLGNBQWMsS0FBSyxJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDdkUsU0FBSyxjQUFjLEtBQUssSUFBSSxNQUFNLEdBQUcsVUFBVSxDQUFDLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQ3ZFLFNBQUssY0FBYyxLQUFLLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztBQUN2RSxTQUFLLGNBQWMsS0FBSyxJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUMsR0FBRyxZQUFZLEtBQUssU0FBUyxHQUFHLE9BQU8sQ0FBQyxDQUFDO0FBRXpGLFNBQUssV0FBVyxJQUFJLGlCQUFpQixDQUFDLGNBQWMsS0FBSyxZQUFZLFdBQVcsU0FBUyxDQUFDO0FBQzFGLFNBQUssU0FBUyxRQUFRLFdBQVcsRUFBRSxXQUFXLE1BQU0sU0FBUyxLQUFLLENBQUM7QUFFbkUsU0FBSyxhQUFhO0FBQUEsRUFDcEI7QUFBQSxFQUVRLFdBQWlCO0FBQ3ZCLFFBQUksS0FBSyxTQUFTO0FBQ2hCLGFBQU8sY0FBYyxLQUFLLE9BQU87QUFDakMsV0FBSyxVQUFVO0FBQUEsSUFDakI7QUFDQSxRQUFJLEtBQUssVUFBVTtBQUNqQixXQUFLLFNBQVMsV0FBVztBQUN6QixXQUFLLFdBQVc7QUFBQSxJQUNsQjtBQUNBLFFBQUksS0FBSyxPQUFPO0FBQ2QsMkJBQXFCLEtBQUssS0FBSztBQUMvQixXQUFLLFFBQVE7QUFBQSxJQUNmO0FBQUEsRUFDRjtBQUFBLEVBRVEsZUFBcUI7QUFDM0IsUUFBSSxLQUFLLFFBQVMsUUFBTyxjQUFjLEtBQUssT0FBTztBQUNuRCxTQUFLLFVBQVUsT0FBTztBQUFBLE1BQ3BCLE1BQU0sS0FBSyxXQUFXO0FBQUEsTUFDdEIsS0FBSyxTQUFTLHFCQUFxQjtBQUFBLElBQ3JDO0FBQUEsRUFDRjtBQUFBLEVBRVEsd0JBQXdDO0FBQzlDLFVBQU0sT0FBTyxLQUFLLElBQUksVUFBVTtBQUNoQyxXQUNFLEtBQUssY0FBYywyQkFBMkIsS0FDOUMsS0FBSyxjQUFjLDBCQUEwQjtBQUFBLEVBRWpEO0FBQUEsRUFFUSxlQUFxQjtBQUMzQixTQUFLLE1BQU07QUFBQSxNQUNULEtBQUssSUFBSSxNQUFNLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLE9BQU8sRUFBRSxLQUFLLE1BQU0sRUFBRTtBQUFBLElBQzlFO0FBQUEsRUFDRjtBQUFBLEVBRUEsT0FBZSxnQkFBZ0IsR0FBOEI7QUFDM0QsV0FBTyxhQUFhO0FBQUEsRUFDdEI7QUFBQSxFQUVRLFFBQVEsTUFBOEI7QUFDNUMsVUFBTSxZQUFZLEtBQUssc0JBQXNCO0FBQzdDLFFBQUksQ0FBQyxVQUFXLFFBQU87QUFDdkIsV0FBTyxVQUFVLGNBQWMsR0FBRyxpQkFBaUIsZUFBZSxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUk7QUFBQSxFQUN4RjtBQUFBLEVBRVEsU0FBUyxNQUFvQjtBQUNuQyxRQUFJLENBQUMsS0FBSyxTQUFTLFFBQVM7QUFDNUIsVUFBTSxNQUFNLEtBQUssUUFBUSxJQUFJO0FBQzdCLFFBQUksSUFBSyxtQkFBa0IsS0FBSyxLQUFLLE1BQU0sSUFBSSxJQUFJLEdBQUcsS0FBSyxVQUFVLEtBQUssSUFBSSxDQUFDO0FBQUEsRUFDakY7QUFBQSxFQUVRLFNBQVMsR0FBd0I7QUFDdkMsUUFBSSxhQUFhLHlCQUFTO0FBQzFCLFFBQUksQ0FBQyxxQkFBb0IsZ0JBQWdCLENBQUMsRUFBRztBQUM3QyxTQUFLLE1BQU0sSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEtBQUs7QUFDbkMsU0FBSyxTQUFTLEVBQUUsSUFBSTtBQUFBLEVBQ3RCO0FBQUEsRUFFUSxTQUFTLEdBQXdCO0FBQ3ZDLFFBQUksYUFBYSwwQkFBUztBQUV4QixXQUFLLGFBQWE7QUFDbEIsV0FBSyxXQUFXO0FBQ2hCO0FBQUEsSUFDRjtBQUNBLFFBQUksQ0FBQyxxQkFBb0IsZ0JBQWdCLENBQUMsRUFBRztBQUM3QyxTQUFLLE1BQU0sT0FBTyxFQUFFLElBQUk7QUFDeEIsVUFBTSxNQUFNLEtBQUssUUFBUSxFQUFFLElBQUk7QUFDL0IsUUFBSSxJQUFLLG1CQUFrQixLQUFLLFFBQVcsS0FBSyxVQUFVLEtBQUssSUFBSSxDQUFDO0FBQUEsRUFDdEU7QUFBQSxFQUVRLFNBQVMsR0FBa0IsU0FBdUI7QUFDeEQsUUFBSSxhQUFhLDBCQUFTO0FBQ3hCLFdBQUssYUFBYTtBQUNsQixXQUFLLFdBQVc7QUFDaEI7QUFBQSxJQUNGO0FBQ0EsUUFBSSxDQUFDLHFCQUFvQixnQkFBZ0IsQ0FBQyxFQUFHO0FBQzdDLFNBQUssTUFBTSxPQUFPLFNBQVMsRUFBRSxNQUFNLEVBQUUsS0FBSyxLQUFLO0FBRS9DLFNBQUssU0FBUyxFQUFFLElBQUk7QUFDcEIsVUFBTSxRQUFRLEtBQUssUUFBUSxPQUFPO0FBQ2xDLFFBQUksTUFBTyxtQkFBa0IsT0FBTyxRQUFXLEtBQUssVUFBVSxLQUFLLElBQUksQ0FBQztBQUFBLEVBQzFFO0FBQUEsRUFFUSxZQUFZLFdBQTZCLFdBQTBCO0FBQ3pFLFFBQUksQ0FBQyxLQUFLLFNBQVMsUUFBUztBQUM1QixVQUFNLFFBQW1CLENBQUM7QUFDMUIsZUFBVyxLQUFLLFdBQVc7QUFDekIsaUJBQVcsUUFBUSxNQUFNLEtBQUssRUFBRSxVQUFVLEdBQUc7QUFDM0MsWUFBSSxFQUFFLGdCQUFnQixTQUFVO0FBQ2hDLFlBQUksS0FBSyxRQUFRLGlCQUFpQixFQUFHLE9BQU0sS0FBSyxJQUFJO0FBQ3BELGFBQUssaUJBQWlCLGlCQUFpQixFQUFFLFFBQVEsQ0FBQyxPQUFPLE1BQU0sS0FBSyxFQUFFLENBQUM7QUFBQSxNQUN6RTtBQUFBLElBQ0Y7QUFDQSxRQUFJLE1BQU0sV0FBVyxFQUFHO0FBQ3hCLFFBQUksS0FBSyxNQUFPLHNCQUFxQixLQUFLLEtBQUs7QUFDL0MsU0FBSyxRQUFRLHNCQUFzQixNQUFNO0FBQ3ZDLFdBQUssUUFBUTtBQUNiLFVBQUksQ0FBQyxLQUFLLFNBQVMsUUFBUztBQUM1QixZQUFNLE1BQU0sS0FBSyxJQUFJO0FBQ3JCLGlCQUFXLE1BQU0sT0FBTztBQUN0QixZQUFJLENBQUMsR0FBRyxZQUFhO0FBQ3JCLGNBQU0sT0FBTyxHQUFHLGFBQWEsV0FBVztBQUN4QywwQkFBa0IsSUFBSSxTQUFTLE9BQU8sU0FBWSxLQUFLLE1BQU0sSUFBSSxJQUFJLEdBQUcsS0FBSyxVQUFVLEdBQUc7QUFBQSxNQUM1RjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIl0KfQo=
