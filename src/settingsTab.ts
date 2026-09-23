import { App, PluginSettingTab, Setting } from "obsidian";
import { parsePositiveInt } from "./settings";
import type FileFreshnessPlugin from "./main";

export class FileFreshnessSettingTab extends PluginSettingTab {
  plugin: FileFreshnessPlugin;

  constructor(app: App, plugin: FileFreshnessPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Enable fresh file highlighting")
      .setDesc("When off, all highlighting is removed and background work stops.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.enabled).onChange(async (v) => {
          this.plugin.settings.enabled = v;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Fresh threshold (minutes)")
      .setDesc("Files modified less than this ago are highlighted as fresh.")
      .addSlider((s) =>
        s
          .setLimits(1, 720, 1)
          .setValue(this.plugin.settings.freshMinutes)
          .setDynamicTooltip()
          .onChange(async (v) => {
            this.plugin.settings.freshMinutes = v;
            await this.plugin.saveSettings();
            this.display();
          }),
      )
      .addText((t) =>
        t
          .setPlaceholder("60")
          .setValue(String(this.plugin.settings.freshMinutes))
          .onChange(async (v) => {
            this.plugin.settings.freshMinutes = parsePositiveInt(
              v,
              this.plugin.settings.freshMinutes,
            );
            await this.plugin.saveSettings();
            this.display();
          }),
      );

    new Setting(containerEl)
      .setName("Recent threshold (minutes)")
      .setDesc("Files between the fresh and this threshold are highlighted as recent. Older files use the theme style.")
      .addSlider((s) =>
        s
          .setLimits(2, 1440, 1)
          .setValue(this.plugin.settings.recentMinutes)
          .setDynamicTooltip()
          .onChange(async (v) => {
            this.plugin.settings.recentMinutes = v;
            await this.plugin.saveSettings();
            this.display();
          }),
      )
      .addText((t) =>
        t
          .setPlaceholder("180")
          .setValue(String(this.plugin.settings.recentMinutes))
          .onChange(async (v) => {
            this.plugin.settings.recentMinutes = parsePositiveInt(
              v,
              this.plugin.settings.recentMinutes,
            );
            await this.plugin.saveSettings();
            this.display();
          }),
      );

    new Setting(containerEl)
      .setName("Fresh color")
      .addColorPicker((c) =>
        c.setValue(this.plugin.settings.freshColor).onChange(async (v) => {
          this.plugin.settings.freshColor = v;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Recent color")
      .addColorPicker((c) =>
        c.setValue(this.plugin.settings.recentColor).onChange(async (v) => {
          this.plugin.settings.recentColor = v;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Show dot indicator")
      .setDesc("Colored dot left of the file name (default indicator).")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.showDot).onChange(async (v) => {
          this.plugin.settings.showDot = v;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Highlight file name text")
      .setDesc("Also recolor the file name. Off by default to avoid conflicts with themes and manual colors.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.showText).onChange(async (v) => {
          this.plugin.settings.showText = v;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Highlight row background")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.showBackground).onChange(async (v) => {
          this.plugin.settings.showBackground = v;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Show left bar")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.showLeftBar).onChange(async (v) => {
          this.plugin.settings.showLeftBar = v;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Auto-refresh interval (seconds)")
      .setDesc("How often rendered rows are re-evaluated. Allowed range: 15–60.")
      .addSlider((s) =>
        s
          .setLimits(15, 60, 1)
          .setValue(this.plugin.settings.refreshIntervalSec)
          .setDynamicTooltip()
          .onChange(async (v) => {
            this.plugin.settings.refreshIntervalSec = v;
            await this.plugin.saveSettings();
            this.display();
          }),
      )
      .addText((t) =>
        t
          .setPlaceholder("60")
          .setValue(String(this.plugin.settings.refreshIntervalSec))
          .onChange(async (v) => {
            this.plugin.settings.refreshIntervalSec = parsePositiveInt(
              v,
              this.plugin.settings.refreshIntervalSec,
            );
            await this.plugin.saveSettings();
            this.display();
          }),
      );

    new Setting(containerEl)
      .setName("Refresh now")
      .setDesc("Repaint currently rendered files immediately.")
      .addButton((b) =>
        b.setButtonText("Refresh").onClick(() => this.plugin.refreshAll()),
      );
  }
}
