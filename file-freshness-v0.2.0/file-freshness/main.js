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
      this.app.vault.getMarkdownFiles().map((f) => ({ path: f.path, mtime: f.stat.mtime }))
    );
  }
  static isMdFile(f) {
    return f instanceof import_obsidian2.TFile && f.extension === "md";
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
    if (!_FileFreshnessPlugin.isMdFile(f)) return;
    this.cache.set(f.path, f.stat.mtime);
    this.paintRow(f.path);
  }
  onDelete(f) {
    if (f instanceof import_obsidian2.TFolder) {
      this.rebuildCache();
      this.refreshAll();
      return;
    }
    if (!_FileFreshnessPlugin.isMdFile(f)) return;
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
    if (!_FileFreshnessPlugin.isMdFile(f)) return;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL2NhY2hlLnRzIiwgInNyYy9hZ2UudHMiLCAic3JjL2hpZ2hsaWdodC50cyIsICJzcmMvc2V0dGluZ3MudHMiLCAic3JjL3NldHRpbmdzVGFiLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBQbHVnaW4sIFRBYnN0cmFjdEZpbGUsIFRGaWxlLCBURm9sZGVyIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBNdGltZUNhY2hlIH0gZnJvbSBcIi4vY2FjaGVcIjtcbmltcG9ydCB7XG4gIGFwcGx5Q3NzVmFyaWFibGVzLFxuICBjbGVhckNzc1ZhcmlhYmxlcyxcbiAgY2xlYXJIaWdobGlnaHQsXG4gIHJlZnJlc2hFeHBsb3JlcixcbiAgdXBkYXRlRmlsZUVsZW1lbnQsXG59IGZyb20gXCIuL2hpZ2hsaWdodFwiO1xuaW1wb3J0IHtcbiAgREVGQVVMVF9TRVRUSU5HUyxcbiAgY2xhbXBSZWZyZXNoSW50ZXJ2YWwsXG4gIG5vcm1hbGl6ZVRocmVzaG9sZHMsXG59IGZyb20gXCIuL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBGaWxlRnJlc2huZXNzU2V0dGluZ1RhYiB9IGZyb20gXCIuL3NldHRpbmdzVGFiXCI7XG5pbXBvcnQgdHlwZSB7IEZpbGVGcmVzaG5lc3NTZXR0aW5ncyB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmNvbnN0IEVYUExPUkVSX0NPTlRBSU5FUl9TRUxFQ1RPUiA9IFwiLm5hdi1maWxlcy1jb250YWluZXJcIjtcbmNvbnN0IEVYUExPUkVSX0ZBTExCQUNLX1NFTEVDVE9SID0gJy53b3Jrc3BhY2UtbGVhZi1jb250ZW50W2RhdGEtdHlwZT1cImZpbGUtZXhwbG9yZXJcIl0nO1xuY29uc3QgRklMRV9ST1dfU0VMRUNUT1IgPSBcIi5uYXYtZmlsZS10aXRsZVtkYXRhLXBhdGhdXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZpbGVGcmVzaG5lc3NQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5nczogRmlsZUZyZXNobmVzc1NldHRpbmdzID0geyAuLi5ERUZBVUxUX1NFVFRJTkdTIH07XG4gIHByaXZhdGUgY2FjaGUgPSBuZXcgTXRpbWVDYWNoZSgpO1xuICBwcml2YXRlIG9ic2VydmVyOiBNdXRhdGlvbk9ic2VydmVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgcmFmSWQgPSAwO1xuICBwcml2YXRlIHRpbWVySWQgPSAwO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgRmlsZUZyZXNobmVzc1NldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwicmVmcmVzaC1maWxlLWZyZXNobmVzc1wiLFxuICAgICAgbmFtZTogXCJSZWZyZXNoIGZpbGUgZnJlc2huZXNzIG5vd1wiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHRoaXMucmVmcmVzaEFsbCgpLFxuICAgIH0pO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbkxheW91dFJlYWR5KCgpID0+IHRoaXMuaW5pdGlhbGl6ZSgpKTtcbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMudGVhcmRvd24oKTtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmZpbmRFeHBsb3JlckNvbnRhaW5lcigpO1xuICAgIGlmIChjb250YWluZXIpIGNsZWFySGlnaGxpZ2h0KGNvbnRhaW5lcik7XG4gICAgY2xlYXJDc3NWYXJpYWJsZXMoZG9jdW1lbnQuYm9keSk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZGF0YSA9IChhd2FpdCB0aGlzLmxvYWREYXRhKCkpIGFzIFBhcnRpYWw8RmlsZUZyZXNobmVzc1NldHRpbmdzPjtcbiAgICBjb25zdCBtZXJnZWQgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBkYXRhKTtcbiAgICBjb25zdCB7IGZyZXNoTWludXRlcywgcmVjZW50TWludXRlcyB9ID0gbm9ybWFsaXplVGhyZXNob2xkcyhcbiAgICAgIG1lcmdlZC5mcmVzaE1pbnV0ZXMsXG4gICAgICBtZXJnZWQucmVjZW50TWludXRlcyxcbiAgICApO1xuICAgIG1lcmdlZC5mcmVzaE1pbnV0ZXMgPSBmcmVzaE1pbnV0ZXM7XG4gICAgbWVyZ2VkLnJlY2VudE1pbnV0ZXMgPSByZWNlbnRNaW51dGVzO1xuICAgIG1lcmdlZC5yZWZyZXNoSW50ZXJ2YWxTZWMgPSBjbGFtcFJlZnJlc2hJbnRlcnZhbChtZXJnZWQucmVmcmVzaEludGVydmFsU2VjKTtcbiAgICB0aGlzLnNldHRpbmdzID0gbWVyZ2VkO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgZnJlc2hNaW51dGVzLCByZWNlbnRNaW51dGVzIH0gPSBub3JtYWxpemVUaHJlc2hvbGRzKFxuICAgICAgdGhpcy5zZXR0aW5ncy5mcmVzaE1pbnV0ZXMsXG4gICAgICB0aGlzLnNldHRpbmdzLnJlY2VudE1pbnV0ZXMsXG4gICAgKTtcbiAgICB0aGlzLnNldHRpbmdzLmZyZXNoTWludXRlcyA9IGZyZXNoTWludXRlcztcbiAgICB0aGlzLnNldHRpbmdzLnJlY2VudE1pbnV0ZXMgPSByZWNlbnRNaW51dGVzO1xuICAgIHRoaXMuc2V0dGluZ3MucmVmcmVzaEludGVydmFsU2VjID0gY2xhbXBSZWZyZXNoSW50ZXJ2YWwodGhpcy5zZXR0aW5ncy5yZWZyZXNoSW50ZXJ2YWxTZWMpO1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gICAgaWYgKHRoaXMudGltZXJJZCkgdGhpcy5yZXN0YXJ0VGltZXIoKTtcbiAgICB0aGlzLmFwcGx5QWxsKCk7XG4gIH1cblxuICAvKiogUHVibGlzaCBzZXR0aW5ncywgdGhlbiByZXBhaW50IG9uY2UgKG5vIHdhaXRpbmcgZm9yIHRoZSB0aW1lcikuICovXG4gIGFwcGx5QWxsKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5zZXR0aW5ncy5lbmFibGVkKSB7XG4gICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmZpbmRFeHBsb3JlckNvbnRhaW5lcigpO1xuICAgICAgaWYgKGNvbnRhaW5lcikgY2xlYXJIaWdobGlnaHQoY29udGFpbmVyKTtcbiAgICAgIGNsZWFyQ3NzVmFyaWFibGVzKGRvY3VtZW50LmJvZHkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhcHBseUNzc1ZhcmlhYmxlcyhkb2N1bWVudC5ib2R5LCB0aGlzLnNldHRpbmdzKTtcbiAgICB0aGlzLnJlZnJlc2hBbGwoKTtcbiAgfVxuXG4gIC8qKiBGdWxsIHJlcGFpbnQgb2YgY3VycmVudGx5IHJlbmRlcmVkIHJvd3MgZnJvbSB0aGUgY2FjaGUuICovXG4gIHJlZnJlc2hBbGwoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmVuYWJsZWQpIHJldHVybjtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmZpbmRFeHBsb3JlckNvbnRhaW5lcigpO1xuICAgIGlmIChjb250YWluZXIpIHJlZnJlc2hFeHBsb3Jlcihjb250YWluZXIsIHRoaXMuY2FjaGUsIHRoaXMuc2V0dGluZ3MsIERhdGUubm93KCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBpbml0aWFsaXplKCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuZmluZEV4cGxvcmVyQ29udGFpbmVyKCk7XG4gICAgaWYgKCFjb250YWluZXIpIHtcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuaW5pdGlhbGl6ZSgpLCAxMDAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5yZWJ1aWxkQ2FjaGUoKTtcbiAgICB0aGlzLmFwcGx5QWxsKCk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAudmF1bHQub24oXCJtb2RpZnlcIiwgKGYpID0+IHRoaXMub25VcHNlcnQoZikpKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAudmF1bHQub24oXCJjcmVhdGVcIiwgKGYpID0+IHRoaXMub25VcHNlcnQoZikpKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAudmF1bHQub24oXCJkZWxldGVcIiwgKGYpID0+IHRoaXMub25EZWxldGUoZikpKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAudmF1bHQub24oXCJyZW5hbWVcIiwgKGYsIG9sZFBhdGgpID0+IHRoaXMub25SZW5hbWUoZiwgb2xkUGF0aCkpKTtcblxuICAgIHRoaXMub2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigobXV0YXRpb25zKSA9PiB0aGlzLm9uTXV0YXRpb25zKG11dGF0aW9ucywgY29udGFpbmVyKSk7XG4gICAgdGhpcy5vYnNlcnZlci5vYnNlcnZlKGNvbnRhaW5lciwgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XG5cbiAgICB0aGlzLnJlc3RhcnRUaW1lcigpO1xuICB9XG5cbiAgcHJpdmF0ZSB0ZWFyZG93bigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50aW1lcklkKSB7XG4gICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVySWQpO1xuICAgICAgdGhpcy50aW1lcklkID0gMDtcbiAgICB9XG4gICAgaWYgKHRoaXMub2JzZXJ2ZXIpIHtcbiAgICAgIHRoaXMub2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgdGhpcy5vYnNlcnZlciA9IG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLnJhZklkKSB7XG4gICAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJhZklkKTtcbiAgICAgIHRoaXMucmFmSWQgPSAwO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVzdGFydFRpbWVyKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRpbWVySWQpIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMudGltZXJJZCk7XG4gICAgdGhpcy50aW1lcklkID0gd2luZG93LnNldEludGVydmFsKFxuICAgICAgKCkgPT4gdGhpcy5yZWZyZXNoQWxsKCksXG4gICAgICB0aGlzLnNldHRpbmdzLnJlZnJlc2hJbnRlcnZhbFNlYyAqIDEwMDAsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgZmluZEV4cGxvcmVyQ29udGFpbmVyKCk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCByb290ID0gdGhpcy5hcHAud29ya3NwYWNlLmNvbnRhaW5lckVsO1xuICAgIHJldHVybiAoXG4gICAgICByb290LnF1ZXJ5U2VsZWN0b3IoRVhQTE9SRVJfQ09OVEFJTkVSX1NFTEVDVE9SKSA/P1xuICAgICAgcm9vdC5xdWVyeVNlbGVjdG9yKEVYUExPUkVSX0ZBTExCQUNLX1NFTEVDVE9SKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHJlYnVpbGRDYWNoZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNhY2hlLnJlYnVpbGQoXG4gICAgICB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCkubWFwKChmKSA9PiAoeyBwYXRoOiBmLnBhdGgsIG10aW1lOiBmLnN0YXQubXRpbWUgfSkpLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBpc01kRmlsZShmOiBUQWJzdHJhY3RGaWxlKTogZiBpcyBURmlsZSB7XG4gICAgcmV0dXJuIGYgaW5zdGFuY2VvZiBURmlsZSAmJiBmLmV4dGVuc2lvbiA9PT0gXCJtZFwiO1xuICB9XG5cbiAgcHJpdmF0ZSBmaW5kUm93KHBhdGg6IHN0cmluZyk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmZpbmRFeHBsb3JlckNvbnRhaW5lcigpO1xuICAgIGlmICghY29udGFpbmVyKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoYCR7RklMRV9ST1dfU0VMRUNUT1J9W2RhdGEtcGF0aD1cIiR7Q1NTLmVzY2FwZShwYXRoKX1cIl1gKTtcbiAgfVxuXG4gIHByaXZhdGUgcGFpbnRSb3cocGF0aDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmVuYWJsZWQpIHJldHVybjtcbiAgICBjb25zdCByb3cgPSB0aGlzLmZpbmRSb3cocGF0aCk7XG4gICAgaWYgKHJvdykgdXBkYXRlRmlsZUVsZW1lbnQocm93LCB0aGlzLmNhY2hlLmdldChwYXRoKSwgdGhpcy5zZXR0aW5ncywgRGF0ZS5ub3coKSk7XG4gIH1cblxuICBwcml2YXRlIG9uVXBzZXJ0KGY6IFRBYnN0cmFjdEZpbGUpOiB2b2lkIHtcbiAgICBpZiAoZiBpbnN0YW5jZW9mIFRGb2xkZXIpIHJldHVybjtcbiAgICBpZiAoIUZpbGVGcmVzaG5lc3NQbHVnaW4uaXNNZEZpbGUoZikpIHJldHVybjtcbiAgICB0aGlzLmNhY2hlLnNldChmLnBhdGgsIGYuc3RhdC5tdGltZSk7XG4gICAgdGhpcy5wYWludFJvdyhmLnBhdGgpO1xuICB9XG5cbiAgcHJpdmF0ZSBvbkRlbGV0ZShmOiBUQWJzdHJhY3RGaWxlKTogdm9pZCB7XG4gICAgaWYgKGYgaW5zdGFuY2VvZiBURm9sZGVyKSB7XG4gICAgICAvLyBOZXN0ZWQgLm1kIHBhdGhzIGNoYW5nZSB3aXRob3V0IHBlci1maWxlIGV2ZW50cyBcdTIwMTQgb25lIHJhcmUgcmVidWlsZC5cbiAgICAgIHRoaXMucmVidWlsZENhY2hlKCk7XG4gICAgICB0aGlzLnJlZnJlc2hBbGwoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFGaWxlRnJlc2huZXNzUGx1Z2luLmlzTWRGaWxlKGYpKSByZXR1cm47XG4gICAgdGhpcy5jYWNoZS5kZWxldGUoZi5wYXRoKTtcbiAgICBjb25zdCByb3cgPSB0aGlzLmZpbmRSb3coZi5wYXRoKTtcbiAgICBpZiAocm93KSB1cGRhdGVGaWxlRWxlbWVudChyb3csIHVuZGVmaW5lZCwgdGhpcy5zZXR0aW5ncywgRGF0ZS5ub3coKSk7XG4gIH1cblxuICBwcml2YXRlIG9uUmVuYW1lKGY6IFRBYnN0cmFjdEZpbGUsIG9sZFBhdGg6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmIChmIGluc3RhbmNlb2YgVEZvbGRlcikge1xuICAgICAgdGhpcy5yZWJ1aWxkQ2FjaGUoKTtcbiAgICAgIHRoaXMucmVmcmVzaEFsbCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIUZpbGVGcmVzaG5lc3NQbHVnaW4uaXNNZEZpbGUoZikpIHJldHVybjtcbiAgICB0aGlzLmNhY2hlLnJlbmFtZShvbGRQYXRoLCBmLnBhdGgsIGYuc3RhdC5tdGltZSk7XG4gICAgLy8gVGhlIERPTSByb3cgbWF5IGJlIHJlY3JlYXRlZCBvciB1cGRhdGVkIGluIHBsYWNlIFx1MjAxNCBtYXRjaCBieSBuZXcgcGF0aC5cbiAgICB0aGlzLnBhaW50Um93KGYucGF0aCk7XG4gICAgY29uc3Qgc3RhbGUgPSB0aGlzLmZpbmRSb3cob2xkUGF0aCk7XG4gICAgaWYgKHN0YWxlKSB1cGRhdGVGaWxlRWxlbWVudChzdGFsZSwgdW5kZWZpbmVkLCB0aGlzLnNldHRpbmdzLCBEYXRlLm5vdygpKTtcbiAgfVxuXG4gIHByaXZhdGUgb25NdXRhdGlvbnMobXV0YXRpb25zOiBNdXRhdGlvblJlY29yZFtdLCBjb250YWluZXI6IEVsZW1lbnQpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZW5hYmxlZCkgcmV0dXJuO1xuICAgIGNvbnN0IGZyZXNoOiBFbGVtZW50W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IG0gb2YgbXV0YXRpb25zKSB7XG4gICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgQXJyYXkuZnJvbShtLmFkZGVkTm9kZXMpKSB7XG4gICAgICAgIGlmICghKG5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSkgY29udGludWU7XG4gICAgICAgIGlmIChub2RlLm1hdGNoZXMoRklMRV9ST1dfU0VMRUNUT1IpKSBmcmVzaC5wdXNoKG5vZGUpO1xuICAgICAgICBub2RlLnF1ZXJ5U2VsZWN0b3JBbGwoRklMRV9ST1dfU0VMRUNUT1IpLmZvckVhY2goKGVsKSA9PiBmcmVzaC5wdXNoKGVsKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChmcmVzaC5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBpZiAodGhpcy5yYWZJZCkgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG4gICAgdGhpcy5yYWZJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICB0aGlzLnJhZklkID0gMDtcbiAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5lbmFibGVkKSByZXR1cm47XG4gICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgZm9yIChjb25zdCBlbCBvZiBmcmVzaCkge1xuICAgICAgICBpZiAoIWVsLmlzQ29ubmVjdGVkKSBjb250aW51ZTtcbiAgICAgICAgY29uc3QgcGF0aCA9IGVsLmdldEF0dHJpYnV0ZShcImRhdGEtcGF0aFwiKTtcbiAgICAgICAgdXBkYXRlRmlsZUVsZW1lbnQoZWwsIHBhdGggPT09IG51bGwgPyB1bmRlZmluZWQgOiB0aGlzLmNhY2hlLmdldChwYXRoKSwgdGhpcy5zZXR0aW5ncywgbm93KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCB0eXBlIHsgQ2FjaGVkRmlsZSB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbi8qKlxuICogU291cmNlIG9mIHRydXRoIGZvciBtb2RpZmljYXRpb24gdGltZXM6IHZhdWx0IHBhdGggXHUyMTkyIG10aW1lLlxuICogUHVyZSAobm8gT2JzaWRpYW4gQVBJKSBzbyBpdCBpcyB1bml0LXRlc3RhYmxlLiBUaGUgRE9NIGlzIG9ubHkgYVxuICogdmlldzogYSBtaXNzaW5nIGVsZW1lbnQgbmV2ZXIgcmVtb3ZlcyBhIGNhY2hlIGVudHJ5LlxuICovXG5leHBvcnQgY2xhc3MgTXRpbWVDYWNoZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgbWFwID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblxuICBzZXQocGF0aDogc3RyaW5nLCBtdGltZTogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5tYXAuc2V0KHBhdGgsIG10aW1lKTtcbiAgfVxuXG4gIGdldChwYXRoOiBzdHJpbmcpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLm1hcC5nZXQocGF0aCk7XG4gIH1cblxuICBoYXMocGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMubWFwLmhhcyhwYXRoKTtcbiAgfVxuXG4gIGRlbGV0ZShwYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLm1hcC5kZWxldGUocGF0aCk7XG4gIH1cblxuICByZW5hbWUob2xkUGF0aDogc3RyaW5nLCBuZXdQYXRoOiBzdHJpbmcsIG10aW1lOiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLm1hcC5kZWxldGUob2xkUGF0aCk7XG4gICAgdGhpcy5tYXAuc2V0KG5ld1BhdGgsIG10aW1lKTtcbiAgfVxuXG4gIC8qKiBGdWxsIHJlYnVpbGQgKHJhcmU6IGZvbGRlciByZW5hbWUvZGVsZXRlIGZhbGxiYWNrKS4gKi9cbiAgcmVidWlsZChmaWxlczogQ2FjaGVkRmlsZVtdKTogdm9pZCB7XG4gICAgdGhpcy5tYXAuY2xlYXIoKTtcbiAgICBmb3IgKGNvbnN0IGYgb2YgZmlsZXMpIHRoaXMubWFwLnNldChmLnBhdGgsIGYubXRpbWUpO1xuICB9XG5cbiAgc2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLm1hcC5zaXplO1xuICB9XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBBZ2VTdGF0ZSB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbi8qKiBNaWxsaXNlY29uZHMgaW4gb25lIG1pbnV0ZS4gU2V0dGluZ3Mgc3RvcmUgbWludXRlcywgaW50ZXJuYWxzIHVzZSBtcy4gKi9cbmV4cG9ydCBjb25zdCBNSU5fVE9fTVMgPSA2MF8wMDA7XG5cbi8qKlxuICogQ2xhc3NpZnkgYSBmaWxlIGJ5IGl0cyBtb2RpZmljYXRpb24gYWdlLlxuICpcbiAqIFN0cmljdCB0aWNrZXQgYm91bmRhcmllcyAoQXVkaXQyKTogYWdlTXMgPCBmcmVzaE1zIFx1MjE5MiBmcmVzaCxcbiAqIGFnZU1zIDwgcmVjZW50TXMgXHUyMTkyIHJlY2VudCwgb3RoZXJ3aXNlIG5vbmUuIEV4YWN0bHkgYGZyZXNoTWludXRlc2BcbiAqIGlzIGFscmVhZHkgcmVjZW50LCBleGFjdGx5IGByZWNlbnRNaW51dGVzYCBpcyBhbHJlYWR5IG5vbmUuXG4gKiBGdXR1cmUgbXRpbWUgKGNsb2NrIHNrZXcpIGlzIGFsd2F5cyBmcmVzaC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzaWZ5QWdlKFxuICBtdGltZTogbnVtYmVyLFxuICBub3c6IG51bWJlcixcbiAgZnJlc2hNaW51dGVzOiBudW1iZXIsXG4gIHJlY2VudE1pbnV0ZXM6IG51bWJlcixcbik6IEFnZVN0YXRlIHtcbiAgY29uc3QgYWdlTXMgPSBub3cgLSBtdGltZTtcbiAgaWYgKGFnZU1zIDwgZnJlc2hNaW51dGVzICogTUlOX1RPX01TKSByZXR1cm4gXCJmcmVzaFwiO1xuICBpZiAoYWdlTXMgPCByZWNlbnRNaW51dGVzICogTUlOX1RPX01TKSByZXR1cm4gXCJyZWNlbnRcIjtcbiAgcmV0dXJuIFwibm9uZVwiO1xufVxuIiwgImltcG9ydCB7IGNsYXNzaWZ5QWdlIH0gZnJvbSBcIi4vYWdlXCI7XG5pbXBvcnQgdHlwZSB7IEZpbGVGcmVzaG5lc3NTZXR0aW5ncyB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmV4cG9ydCBjb25zdCBGUkVTSF9DTEFTUyA9IFwiZmlsZS1hZ2UtZnJlc2hcIjtcbmV4cG9ydCBjb25zdCBSRUNFTlRfQ0xBU1MgPSBcImZpbGUtYWdlLXJlY2VudFwiO1xuXG4vKiogT25seSBmaWxlIHJvd3MgYXJlIGV2ZXIgdG91Y2hlZCBcdTIwMTQgbmV2ZXIgZm9sZGVyIHRpdGxlcy4gKi9cbmNvbnN0IEZJTEVfVElUTEVfU0VMRUNUT1IgPSBcIi5uYXYtZmlsZS10aXRsZVtkYXRhLXBhdGhdXCI7XG5cbmV4cG9ydCBjb25zdCBDU1NfVkFSX0ZSRVNIX0NPTE9SID0gXCItLWZpbGUtZnJlc2huZXNzLWZyZXNoLWNvbG9yXCI7XG5leHBvcnQgY29uc3QgQ1NTX1ZBUl9SRUNFTlRfQ09MT1IgPSBcIi0tZmlsZS1mcmVzaG5lc3MtcmVjZW50LWNvbG9yXCI7XG5leHBvcnQgY29uc3QgQ1NTX1ZBUl9GUkVTSF9CRyA9IFwiLS1maWxlLWZyZXNobmVzcy1mcmVzaC1iZ1wiO1xuZXhwb3J0IGNvbnN0IENTU19WQVJfUkVDRU5UX0JHID0gXCItLWZpbGUtZnJlc2huZXNzLXJlY2VudC1iZ1wiO1xuXG5jb25zdCBNT0RFX0NMQVNTRVMgPSBbXG4gIFwiZnJlc2huZXNzLXNob3ctdGV4dFwiLFxuICBcImZyZXNobmVzcy1zaG93LWJhY2tncm91bmRcIixcbiAgXCJmcmVzaG5lc3Mtc2hvdy1sZWZ0YmFyXCIsXG4gIFwiZnJlc2huZXNzLWhpZGUtZG90XCIsXG5dIGFzIGNvbnN0O1xuXG5mdW5jdGlvbiByZW1vdmVPd25DbGFzc2VzKGVsOiBFbGVtZW50KTogdm9pZCB7XG4gIGVsLmNsYXNzTGlzdC5yZW1vdmUoRlJFU0hfQ0xBU1MsIFJFQ0VOVF9DTEFTUyk7XG59XG5cbi8qKlxuICogUGFpbnQgYSBzaW5nbGUgRXhwbG9yZXIgcm93LiBgbXRpbWUgPT09IHVuZGVmaW5lZGAgKG5vdCBpbiBjYWNoZSxcbiAqIGUuZy4gbm9uLU1hcmtkb3duKSByZW1vdmVzIGhpZ2hsaWdodGluZy4gRm9yZWlnbiBjbGFzc2VzXG4gKiAoSWNvbml6ZSwgaXMtYWN0aXZlLCBcdTIwMjYpIGFyZSBuZXZlciB0b3VjaGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlRmlsZUVsZW1lbnQoXG4gIGVsOiBFbGVtZW50LFxuICBtdGltZTogbnVtYmVyIHwgdW5kZWZpbmVkLFxuICBzZXR0aW5nczogRmlsZUZyZXNobmVzc1NldHRpbmdzLFxuICBub3c6IG51bWJlcixcbik6IHZvaWQge1xuICByZW1vdmVPd25DbGFzc2VzKGVsKTtcbiAgaWYgKG10aW1lID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgY29uc3Qgc3RhdGUgPSBjbGFzc2lmeUFnZShtdGltZSwgbm93LCBzZXR0aW5ncy5mcmVzaE1pbnV0ZXMsIHNldHRpbmdzLnJlY2VudE1pbnV0ZXMpO1xuICBpZiAoc3RhdGUgPT09IFwiZnJlc2hcIikgZWwuY2xhc3NMaXN0LmFkZChGUkVTSF9DTEFTUyk7XG4gIGVsc2UgaWYgKHN0YXRlID09PSBcInJlY2VudFwiKSBlbC5jbGFzc0xpc3QuYWRkKFJFQ0VOVF9DTEFTUyk7XG59XG5cbi8qKiBNaW5pbWFsIGxvb2t1cCBzdXJmYWNlIHNvIHRlc3RzIGNhbiBwYXNzIGEgcGxhaW4gTWFwLiAqL1xuZXhwb3J0IGludGVyZmFjZSBNdGltZUxvb2t1cCB7XG4gIGdldChwYXRoOiBzdHJpbmcpOiBudW1iZXIgfCB1bmRlZmluZWQ7XG59XG5cbi8qKiBSZXBhaW50IGFsbCBjdXJyZW50bHkgcmVuZGVyZWQgZmlsZSByb3dzIGZyb20gdGhlIGNhY2hlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hFeHBsb3JlcihcbiAgY29udGFpbmVyOiBQYXJlbnROb2RlLFxuICBjYWNoZTogTXRpbWVMb29rdXAsXG4gIHNldHRpbmdzOiBGaWxlRnJlc2huZXNzU2V0dGluZ3MsXG4gIG5vdzogbnVtYmVyLFxuKTogdm9pZCB7XG4gIGNvbnN0IHJvd3MgPSBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbChGSUxFX1RJVExFX1NFTEVDVE9SKTtcbiAgcm93cy5mb3JFYWNoKChyb3cpID0+IHtcbiAgICBjb25zdCBwYXRoID0gcm93LmdldEF0dHJpYnV0ZShcImRhdGEtcGF0aFwiKTtcbiAgICB1cGRhdGVGaWxlRWxlbWVudChyb3csIHBhdGggPT09IG51bGwgPyB1bmRlZmluZWQgOiBjYWNoZS5nZXQocGF0aCksIHNldHRpbmdzLCBub3cpO1xuICB9KTtcbn1cblxuLyoqIElkZW1wb3RlbnQ6IHNhZmUgdG8gY2FsbCBhbnkgbnVtYmVyIG9mIHRpbWVzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFySGlnaGxpZ2h0KGNvbnRhaW5lcjogUGFyZW50Tm9kZSk6IHZvaWQge1xuICBjb25zdCByb3dzID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoYC4ke0ZSRVNIX0NMQVNTfSwgLiR7UkVDRU5UX0NMQVNTfWApO1xuICByb3dzLmZvckVhY2gocmVtb3ZlT3duQ2xhc3Nlcyk7XG59XG5cbi8qKlxuICogUHVibGlzaCBzZXR0aW5ncyBhcyBDU1MgdmFyaWFibGVzICsgYm9keSBtb2RlIGNsYXNzZXMsIG9uY2UuXG4gKiBDaGFuZ2luZyBjb2xvcnMvdG9nZ2xlcyBuZXZlciByZXF1aXJlcyBhIERPTSB3YWxrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlDc3NWYXJpYWJsZXMoXG4gIGJvZHk6IEhUTUxFbGVtZW50LFxuICBzZXR0aW5nczogRmlsZUZyZXNobmVzc1NldHRpbmdzLFxuKTogdm9pZCB7XG4gIGNvbnN0IHN0eWxlID0gYm9keS5zdHlsZTtcbiAgc3R5bGUuc2V0UHJvcGVydHkoQ1NTX1ZBUl9GUkVTSF9DT0xPUiwgc2V0dGluZ3MuZnJlc2hDb2xvcik7XG4gIHN0eWxlLnNldFByb3BlcnR5KENTU19WQVJfUkVDRU5UX0NPTE9SLCBzZXR0aW5ncy5yZWNlbnRDb2xvcik7XG4gIHN0eWxlLnNldFByb3BlcnR5KENTU19WQVJfRlJFU0hfQkcsIHNldHRpbmdzLmZyZXNoQmcpO1xuICBzdHlsZS5zZXRQcm9wZXJ0eShDU1NfVkFSX1JFQ0VOVF9CRywgc2V0dGluZ3MucmVjZW50QmcpO1xuICBib2R5LmNsYXNzTGlzdC50b2dnbGUoXCJmcmVzaG5lc3Mtc2hvdy10ZXh0XCIsIHNldHRpbmdzLnNob3dUZXh0KTtcbiAgYm9keS5jbGFzc0xpc3QudG9nZ2xlKFwiZnJlc2huZXNzLXNob3ctYmFja2dyb3VuZFwiLCBzZXR0aW5ncy5zaG93QmFja2dyb3VuZCk7XG4gIGJvZHkuY2xhc3NMaXN0LnRvZ2dsZShcImZyZXNobmVzcy1zaG93LWxlZnRiYXJcIiwgc2V0dGluZ3Muc2hvd0xlZnRCYXIpO1xuICBib2R5LmNsYXNzTGlzdC50b2dnbGUoXCJmcmVzaG5lc3MtaGlkZS1kb3RcIiwgIXNldHRpbmdzLnNob3dEb3QpO1xufVxuXG4vKiogUmVtb3ZlIG9ubHkgdGhlIHBsdWdpbidzIG93biB2YXJpYWJsZXMgYW5kIG1vZGUgY2xhc3Nlcy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhckNzc1ZhcmlhYmxlcyhib2R5OiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBib2R5LnN0eWxlLnJlbW92ZVByb3BlcnR5KENTU19WQVJfRlJFU0hfQ09MT1IpO1xuICBib2R5LnN0eWxlLnJlbW92ZVByb3BlcnR5KENTU19WQVJfUkVDRU5UX0NPTE9SKTtcbiAgYm9keS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShDU1NfVkFSX0ZSRVNIX0JHKTtcbiAgYm9keS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShDU1NfVkFSX1JFQ0VOVF9CRyk7XG4gIGZvciAoY29uc3QgY2xzIG9mIE1PREVfQ0xBU1NFUykgYm9keS5jbGFzc0xpc3QucmVtb3ZlKGNscyk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBGaWxlRnJlc2huZXNzU2V0dGluZ3MgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVRUSU5HUzogRmlsZUZyZXNobmVzc1NldHRpbmdzID0ge1xuICBlbmFibGVkOiB0cnVlLFxuICBmcmVzaE1pbnV0ZXM6IDYwLFxuICByZWNlbnRNaW51dGVzOiAxODAsXG4gIGZyZXNoQ29sb3I6IFwiIzUyQzQxQVwiLFxuICByZWNlbnRDb2xvcjogXCIjRkFBRDE0XCIsXG4gIGZyZXNoQmc6IFwicmdiYSg4MiwgMTk2LCAyNiwgMC4xMilcIixcbiAgcmVjZW50Qmc6IFwicmdiYSgyNTAsIDE3MywgMjAsIDAuMTIpXCIsXG4gIHNob3dEb3Q6IHRydWUsXG4gIHNob3dUZXh0OiBmYWxzZSxcbiAgc2hvd0JhY2tncm91bmQ6IGZhbHNlLFxuICBzaG93TGVmdEJhcjogZmFsc2UsXG4gIHJlZnJlc2hJbnRlcnZhbFNlYzogNjAsXG59O1xuXG4vKiogQWxsb3dlZCBhdXRvLXJlZnJlc2ggcmFuZ2UgaW4gc2Vjb25kczogWzE1LCA2MF0gKHBsYW4gdjYsIEF1ZGl0MikuICovXG5leHBvcnQgY29uc3QgTUlOX1JFRlJFU0hfU0VDID0gMTU7XG5leHBvcnQgY29uc3QgTUFYX1JFRlJFU0hfU0VDID0gNjA7XG5cbi8qKiBDbGFtcCB0aGUgcmVmcmVzaCBpbnRlcnZhbDsgZ2FyYmFnZSBmYWxscyBiYWNrIHRvIHRoZSBkZWZhdWx0LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYW1wUmVmcmVzaEludGVydmFsKHZhbHVlOiBudW1iZXIpOiBudW1iZXIge1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZSh2YWx1ZSkpIHJldHVybiBERUZBVUxUX1NFVFRJTkdTLnJlZnJlc2hJbnRlcnZhbFNlYztcbiAgcmV0dXJuIE1hdGgubWluKE1BWF9SRUZSRVNIX1NFQywgTWF0aC5tYXgoTUlOX1JFRlJFU0hfU0VDLCB2YWx1ZSkpO1xufVxuXG4vKipcbiAqIFBhcnNlIGFuIGV4YWN0IG51bWVyaWMgaW5wdXQgZnJvbSBhIHNldHRpbmdzIHRleHQgZmllbGQuXG4gKiBSZXR1cm5zIGBmYWxsYmFja2AgZm9yIGVtcHR5L2dhcmJhZ2Uvbm9uLXBvc2l0aXZlIGlucHV0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQb3NpdGl2ZUludCh0ZXh0OiBzdHJpbmcsIGZhbGxiYWNrOiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCB2YWx1ZSA9IE1hdGguZmxvb3IoTnVtYmVyKHRleHQudHJpbSgpKSk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKHZhbHVlKSB8fCB2YWx1ZSA8PSAwKSByZXR1cm4gZmFsbGJhY2s7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemUgYWdlIHRocmVzaG9sZHM6IGZyZXNoIGlzIGF0IGxlYXN0IDEgbWludXRlLCByZWNlbnQgaXMgYWx3YXlzXG4gKiBzdHJpY3RseSBhYm92ZSBmcmVzaC4gUmV0dXJucyB0aGUgZWZmZWN0aXZlIHBhaXIgKFVJIHNob3VsZCByZWZsZWN0IGl0KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVRocmVzaG9sZHMoXG4gIGZyZXNoTWludXRlczogbnVtYmVyLFxuICByZWNlbnRNaW51dGVzOiBudW1iZXIsXG4pOiB7IGZyZXNoTWludXRlczogbnVtYmVyOyByZWNlbnRNaW51dGVzOiBudW1iZXIgfSB7XG4gIGNvbnN0IGZyZXNoID0gTWF0aC5tYXgoMSwgTWF0aC5mbG9vcihOdW1iZXIuaXNGaW5pdGUoZnJlc2hNaW51dGVzKSA/IGZyZXNoTWludXRlcyA6IDEpKTtcbiAgY29uc3QgcmVjZW50ID0gTWF0aC5tYXgoXG4gICAgZnJlc2ggKyAxLFxuICAgIE1hdGguZmxvb3IoTnVtYmVyLmlzRmluaXRlKHJlY2VudE1pbnV0ZXMpID8gcmVjZW50TWludXRlcyA6IGZyZXNoICsgMSksXG4gICk7XG4gIHJldHVybiB7IGZyZXNoTWludXRlczogZnJlc2gsIHJlY2VudE1pbnV0ZXM6IHJlY2VudCB9O1xufVxuIiwgImltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgcGFyc2VQb3NpdGl2ZUludCB9IGZyb20gXCIuL3NldHRpbmdzXCI7XG5pbXBvcnQgdHlwZSBGaWxlRnJlc2huZXNzUGx1Z2luIGZyb20gXCIuL21haW5cIjtcblxuZXhwb3J0IGNsYXNzIEZpbGVGcmVzaG5lc3NTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHBsdWdpbjogRmlsZUZyZXNobmVzc1BsdWdpbjtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBGaWxlRnJlc2huZXNzUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIGZyZXNoIGZpbGUgaGlnaGxpZ2h0aW5nXCIpXG4gICAgICAuc2V0RGVzYyhcIldoZW4gb2ZmLCBhbGwgaGlnaGxpZ2h0aW5nIGlzIHJlbW92ZWQgYW5kIGJhY2tncm91bmQgd29yayBzdG9wcy5cIilcbiAgICAgIC5hZGRUb2dnbGUoKHQpID0+XG4gICAgICAgIHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlZCkub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVkID0gdjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkZyZXNoIHRocmVzaG9sZCAobWludXRlcylcIilcbiAgICAgIC5zZXREZXNjKFwiRmlsZXMgbW9kaWZpZWQgbGVzcyB0aGFuIHRoaXMgYWdvIGFyZSBoaWdobGlnaHRlZCBhcyBmcmVzaC5cIilcbiAgICAgIC5hZGRTbGlkZXIoKHMpID0+XG4gICAgICAgIHNcbiAgICAgICAgICAuc2V0TGltaXRzKDEsIDcyMCwgMSlcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlc2hNaW51dGVzKVxuICAgICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mcmVzaE1pbnV0ZXMgPSB2O1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgIC5hZGRUZXh0KCh0KSA9PlxuICAgICAgICB0XG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiNjBcIilcbiAgICAgICAgICAuc2V0VmFsdWUoU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLmZyZXNoTWludXRlcykpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mcmVzaE1pbnV0ZXMgPSBwYXJzZVBvc2l0aXZlSW50KFxuICAgICAgICAgICAgICB2LFxuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mcmVzaE1pbnV0ZXMsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiUmVjZW50IHRocmVzaG9sZCAobWludXRlcylcIilcbiAgICAgIC5zZXREZXNjKFwiRmlsZXMgYmV0d2VlbiB0aGUgZnJlc2ggYW5kIHRoaXMgdGhyZXNob2xkIGFyZSBoaWdobGlnaHRlZCBhcyByZWNlbnQuIE9sZGVyIGZpbGVzIHVzZSB0aGUgdGhlbWUgc3R5bGUuXCIpXG4gICAgICAuYWRkU2xpZGVyKChzKSA9PlxuICAgICAgICBzXG4gICAgICAgICAgLnNldExpbWl0cygyLCAxNDQwLCAxKVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWNlbnRNaW51dGVzKVxuICAgICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWNlbnRNaW51dGVzID0gdjtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgfSksXG4gICAgICApXG4gICAgICAuYWRkVGV4dCgodCkgPT5cbiAgICAgICAgdFxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIjE4MFwiKVxuICAgICAgICAgIC5zZXRWYWx1ZShTdHJpbmcodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVjZW50TWludXRlcykpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWNlbnRNaW51dGVzID0gcGFyc2VQb3NpdGl2ZUludChcbiAgICAgICAgICAgICAgdixcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVjZW50TWludXRlcyxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJGcmVzaCBjb2xvclwiKVxuICAgICAgLmFkZENvbG9yUGlja2VyKChjKSA9PlxuICAgICAgICBjLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmZyZXNoQ29sb3IpLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlc2hDb2xvciA9IHY7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJSZWNlbnQgY29sb3JcIilcbiAgICAgIC5hZGRDb2xvclBpY2tlcigoYykgPT5cbiAgICAgICAgYy5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWNlbnRDb2xvcikub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWNlbnRDb2xvciA9IHY7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IGRvdCBpbmRpY2F0b3JcIilcbiAgICAgIC5zZXREZXNjKFwiQ29sb3JlZCBkb3QgbGVmdCBvZiB0aGUgZmlsZSBuYW1lIChkZWZhdWx0IGluZGljYXRvcikuXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0KSA9PlxuICAgICAgICB0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dEb3QpLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd0RvdCA9IHY7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJIaWdobGlnaHQgZmlsZSBuYW1lIHRleHRcIilcbiAgICAgIC5zZXREZXNjKFwiQWxzbyByZWNvbG9yIHRoZSBmaWxlIG5hbWUuIE9mZiBieSBkZWZhdWx0IHRvIGF2b2lkIGNvbmZsaWN0cyB3aXRoIHRoZW1lcyBhbmQgbWFudWFsIGNvbG9ycy5cIilcbiAgICAgIC5hZGRUb2dnbGUoKHQpID0+XG4gICAgICAgIHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1RleHQpLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1RleHQgPSB2O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSGlnaGxpZ2h0IHJvdyBiYWNrZ3JvdW5kXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0KSA9PlxuICAgICAgICB0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dCYWNrZ3JvdW5kKS5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dCYWNrZ3JvdW5kID0gdjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlNob3cgbGVmdCBiYXJcIilcbiAgICAgIC5hZGRUb2dnbGUoKHQpID0+XG4gICAgICAgIHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd0xlZnRCYXIpLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd0xlZnRCYXIgPSB2O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQXV0by1yZWZyZXNoIGludGVydmFsIChzZWNvbmRzKVwiKVxuICAgICAgLnNldERlc2MoXCJIb3cgb2Z0ZW4gcmVuZGVyZWQgcm93cyBhcmUgcmUtZXZhbHVhdGVkLiBBbGxvd2VkIHJhbmdlOiAxNVx1MjAxMzYwLlwiKVxuICAgICAgLmFkZFNsaWRlcigocykgPT5cbiAgICAgICAgc1xuICAgICAgICAgIC5zZXRMaW1pdHMoMTUsIDYwLCAxKVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWZyZXNoSW50ZXJ2YWxTZWMpXG4gICAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlZnJlc2hJbnRlcnZhbFNlYyA9IHY7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgLmFkZFRleHQoKHQpID0+XG4gICAgICAgIHRcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCI2MFwiKVxuICAgICAgICAgIC5zZXRWYWx1ZShTdHJpbmcodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVmcmVzaEludGVydmFsU2VjKSlcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlZnJlc2hJbnRlcnZhbFNlYyA9IHBhcnNlUG9zaXRpdmVJbnQoXG4gICAgICAgICAgICAgIHYsXG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlZnJlc2hJbnRlcnZhbFNlYyxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJSZWZyZXNoIG5vd1wiKVxuICAgICAgLnNldERlc2MoXCJSZXBhaW50IGN1cnJlbnRseSByZW5kZXJlZCBmaWxlcyBpbW1lZGlhdGVseS5cIilcbiAgICAgIC5hZGRCdXR0b24oKGIpID0+XG4gICAgICAgIGIuc2V0QnV0dG9uVGV4dChcIlJlZnJlc2hcIikub25DbGljaygoKSA9PiB0aGlzLnBsdWdpbi5yZWZyZXNoQWxsKCkpLFxuICAgICAgKTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBQXNEOzs7QUNPL0MsSUFBTSxhQUFOLE1BQWlCO0FBQUEsRUFBakI7QUFDTCxTQUFpQixNQUFNLG9CQUFJLElBQW9CO0FBQUE7QUFBQSxFQUUvQyxJQUFJLE1BQWMsT0FBcUI7QUFDckMsU0FBSyxJQUFJLElBQUksTUFBTSxLQUFLO0FBQUEsRUFDMUI7QUFBQSxFQUVBLElBQUksTUFBa0M7QUFDcEMsV0FBTyxLQUFLLElBQUksSUFBSSxJQUFJO0FBQUEsRUFDMUI7QUFBQSxFQUVBLElBQUksTUFBdUI7QUFDekIsV0FBTyxLQUFLLElBQUksSUFBSSxJQUFJO0FBQUEsRUFDMUI7QUFBQSxFQUVBLE9BQU8sTUFBb0I7QUFDekIsU0FBSyxJQUFJLE9BQU8sSUFBSTtBQUFBLEVBQ3RCO0FBQUEsRUFFQSxPQUFPLFNBQWlCLFNBQWlCLE9BQXFCO0FBQzVELFNBQUssSUFBSSxPQUFPLE9BQU87QUFDdkIsU0FBSyxJQUFJLElBQUksU0FBUyxLQUFLO0FBQUEsRUFDN0I7QUFBQTtBQUFBLEVBR0EsUUFBUSxPQUEyQjtBQUNqQyxTQUFLLElBQUksTUFBTTtBQUNmLGVBQVcsS0FBSyxNQUFPLE1BQUssSUFBSSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUs7QUFBQSxFQUNyRDtBQUFBLEVBRUEsT0FBZTtBQUNiLFdBQU8sS0FBSyxJQUFJO0FBQUEsRUFDbEI7QUFDRjs7O0FDckNPLElBQU0sWUFBWTtBQVVsQixTQUFTLFlBQ2QsT0FDQSxLQUNBLGNBQ0EsZUFDVTtBQUNWLFFBQU0sUUFBUSxNQUFNO0FBQ3BCLE1B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
