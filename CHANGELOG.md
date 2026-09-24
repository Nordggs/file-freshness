# Changelog

## v0.2.1

### Fixed

- Highlighting of modified binary files (PDF, DOC/DOCX, XLS/XLSX and similar):
  the plugin previously tracked Markdown files only, so changes to binary
  files never updated the mtime cache and their Explorer rows were never
  repainted. The cache is now seeded from all vault files and vault events
  are handled for every `TFile`. Markdown behavior is unchanged.

## v0.2.0

### Added

- Exact numeric input next to the Fresh / Recent threshold and auto-refresh
  sliders, with safe fallback on invalid input.
