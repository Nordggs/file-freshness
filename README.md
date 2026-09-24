# File Freshness

Highlights recently modified files in Obsidian's File Explorer with a small
colored dot left of the file name — like fresh markers in Total Commander.

- Modified **less than 60 min** ago → green dot (configurable).
- Modified **60–180 min** ago → amber dot (configurable).
- Older files → standard theme style, no leftover classes.

File Freshness does not modify files, frontmatter, filesystem timestamps,
sorting or vault structure. It only adds temporary CSS classes to File
Explorer elements.

File Freshness v1 applies to the main Obsidian window; popout Explorer is
not guaranteed.

## Install with BRAT

BRAT (Beta Reviewers Auto-update Tool) installs plugins directly from GitHub
and is meant for installing and testing plugins that are not yet listed in
the official Obsidian Community Plugins catalog. It is not itself the
official Obsidian plugin catalog.

Steps:

1. Open Obsidian.
2. Open `Settings → Community plugins → Browse`.
3. Find and install `BRAT (Beta Reviewers Auto-update Tool)`.
4. Enable BRAT.
5. Open the BRAT settings.
6. Use the command `BRAT: Plugins: Add a beta plugin for testing`
   (or the equivalent current BRAT command).
7. As the GitHub repository enter:

   `Nordggs/file-freshness`

   Full address:

   `https://github.com/Nordggs/file-freshness`

8. Add the plugin.
9. After installation open `Settings → Community plugins`.
10. Find `File Freshness` and enable it.

After new GitHub Releases are published, you can receive updates through
BRAT (exact auto-update behavior depends on your BRAT settings).

> ⚠️ Note: BRAT is a way to install plugins from GitHub for testing.
> File Freshness is not necessarily listed in the official Obsidian
> Community Plugins catalog. Only install plugins from sources you trust.

## Local install (easy way, no tech skills)

No installation or build steps are required. Just download the ready-made
ZIP, unpack it, and copy the plugin folder into Obsidian.

A regular local install does **not** need:

- Node.js;
- npm;
- command line;
- building from source.

Steps:

1. Download the ready-made plugin ZIP `file-freshness-v0.2.1.zip`.
2. Unpack the ZIP — you get a `file-freshness` folder.
3. Copy the `file-freshness` folder **as a whole** to
   `<vault>/.obsidian/plugins/` (where `<vault>` is your vault folder).
4. Restart Obsidian (or reload the window with `Ctrl+R`).
5. Open Settings → Community plugins → enable **File Freshness**.

The install folder contains only the ready-made files:

- `main.js`
- `manifest.json`
- `styles.css`

The install ZIP does not include: `node_modules`, `src`, `tests`,
`package.json`, `package-lock.json`, development config files, `.git`.

## Settings

Age thresholds (minutes) with exact numeric input next to each slider,
dot/text/background/left-bar modes, colors, auto-refresh interval
(15–60 s, default 60 s), and a "Refresh now" button. By default only the
dot is shown, so themes, Iconize icons and manual colors keep working.

## Development

- `npm test` — typecheck (`tsc`), then `node --test` unit tests (jsdom).
- `npm run build` — typecheck + esbuild bundle to `main.js`.
