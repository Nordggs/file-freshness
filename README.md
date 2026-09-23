# File Freshness

Highlights recently modified files in Obsidian's File Explorer with a small
colored dot left of the file name — like fresh markers in Total Commander.

- Modified **< 60 min** ago → green dot (configurable).
- Modified **60–180 min** ago → amber dot (configurable).
- Older files → standard theme style, no leftover classes.

File Freshness does not modify files, frontmatter, filesystem timestamps,
sorting or vault structure. It only adds temporary CSS classes to File
Explorer elements.

File Freshness v1 applies to the main Obsidian window; popout Explorer is
not guaranteed.

## Install (until the plugin gets its own repo: local install)

1. Build: `npm install && npm run build` inside `file-freshness/` → `main.js`.
2. Copy `manifest.json`, `main.js`, `styles.css` to
   `<vault>/.obsidian/plugins/file-freshness/`.
3. Reload Obsidian, enable "File Freshness" in Community plugins.

Later: BRAT distribution is a post-v1 packaging step after the plugin moves
to its own GitHub repository.

## Settings

Thresholds (minutes), dot/text/background/left-bar modes, colors,
auto-refresh interval (15–60 s, default 60 s), and a "Refresh now" button.
By default only the dot is shown, so themes, Iconize icons and manual colors
keep working.

## Development

- `npm test` — typecheck (`tsc`), then `node --test` unit tests (jsdom).
- `npm run build` — typecheck + esbuild bundle to `main.js`.
